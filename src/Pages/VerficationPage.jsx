import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Brain, Mail, ArrowLeft, CheckCircle, XCircle, RefreshCw, Clock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../utils/axios';

const VerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800); 
  const [canResend, setCanResend] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const [email, setEmail] = useState(location.state?.email || '');
  const [firstName, setFirstName] = useState(location.state?.firstName || '');
  const [showEmailForm, setShowEmailForm] = useState(!location.state?.email);
  
  const inputRefs = useRef([]);

  // Check for pending verification in localStorage if no email in state
  useEffect(() => {
    // If no email is provided via state, check localStorage
    if (!location.state?.email) {
      const pendingVerification = localStorage.getItem('pendingVerification');
      if (pendingVerification) {
        try {
          const { email, firstName, timestamp } = JSON.parse(pendingVerification);
          // Only use stored data if it's less than 10 minutes old
          if (Date.now() - timestamp < 10 * 60 * 1000) {
            setEmail(email);
            setFirstName(firstName);
            setShowEmailForm(false);
            toast.info('Continuing with your recent signup', {
              duration: 3000,
              position: 'top-center',
            });
          }
        } catch (error) {
          console.error('Error parsing pending verification data:', error);
        }
      }
    }
  }, [location.state?.email]);

  // Initialize timer from localStorage or default
  useEffect(() => {
    if (email) {
      const storedExpiry = localStorage.getItem(`verification_expiry_${email}`);
      if (storedExpiry) {
        const expiryTime = parseInt(storedExpiry);
        const currentTime = Math.floor(Date.now() / 1000);
        const remaining = expiryTime - currentTime;
        
        if (remaining > 0) {
          setTimeLeft(remaining);
        } else {
          setTimeLeft(0);
          setCanResend(true);
          localStorage.removeItem(`verification_expiry_${email}`);
        }
      } else {
        // Set initial expiry time (30 minutes from now)
        const expiryTime = Math.floor(Date.now() / 1000) + 1800;
        localStorage.setItem(`verification_expiry_${email}`, expiryTime.toString());
      }
    }
  }, [email]);

  // Timer for code expiration
  useEffect(() => {
    if (timeLeft > 0 && !isVerified && email) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && email) {
      setCanResend(true);
      localStorage.removeItem(`verification_expiry_${email}`);
    }
  }, [timeLeft, isVerified, email]);

  // Timer for resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle input change for verification code
  const handleInputChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste of multiple digits
      const digits = value.replace(/\D/g, '').split('').slice(0, 5 - index);
      const newCode = [...verificationCode];
      
      digits.forEach((digit, i) => {
        if (index + i < 5) {
          newCode[index + i] = digit;
        }
      });
      
      setVerificationCode(newCode);
      
      // Focus next input or submit if complete
      const nextIndex = Math.min(index + digits.length, 4);
      if (nextIndex < 5) {
        inputRefs.current[nextIndex]?.focus();
      } else if (newCode.every(digit => digit !== '')) {
        handleVerification(newCode.join(''), true);
      }
    } else if (/^\d?$/.test(value)) {
      // Handle single digit input
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);
      
      // Auto-focus next input on digit entry
      if (value && index < 4) {
        inputRefs.current[index + 1]?.focus();
      }
      
      // Auto-submit when all digits are entered
      if (value && index === 4 && newCode.every(digit => digit !== '')) {
        handleVerification(newCode.join(''), true);
      }
    }
  };

  // Handle backspace for verification code
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      // Focus previous input on backspace when current input is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste for verification code
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 5);
    if (pastedData.length === 5) {
      const newCode = pastedData.split('');
      setVerificationCode(newCode);
      handleVerification(pastedData, true);
    }
  };

  // Handle verification submission
  const handleVerification = async (code = verificationCode.join(''), isAutoSubmit = false) => {
    if (code.length !== 5) {
      toast.error('Please enter the complete 5-digit verification code.');
      return;
    }
  
    // Prevent multiple simultaneous requests
    if (isLoading) return;
  
    setIsLoading(true);
  
    try {
      const response = await authAPI.verifyEmail(email, code);
  
      if (response.success || response.message?.includes('successfully')) {
        setIsVerified(true);
        
        // Clear the timer
        localStorage.removeItem(`verification_expiry_${email}`);
        
        toast.success('Email verified successfully! Welcome to Navi-IQ!', {
          duration: 4000,
          position: 'top-center',
        });
  
        // Do not automatically store authentication data
        // User must explicitly log in with their credentials
  
        // Navigate to login page after success
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Account verified successfully! You can now sign in.',
              email: email
            } 
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Verification Error:', error);
      
      let errorMessage = 'Invalid verification code. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
  
      // Handle already verified case - be more specific about the condition
      if (errorMessage.includes('already verified')) {
        setIsVerified(true);
        localStorage.removeItem(`verification_expiry_${email}`);
        
        toast.success('Your account is already verified! Redirecting to login...', {
          duration: 3000,
          position: 'top-center',
        });
  
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Your account is already verified. Please sign in.',
              email: email
            } 
          });
        }, 2000);
        return;
      }
  
      // Handle expired code
      if (errorMessage.includes('expired')) {
        setCanResend(true);
        setTimeLeft(0);
        localStorage.removeItem(`verification_expiry_${email}`);
      }
  
      toast.error(errorMessage, {
        duration: 4000,
        position: 'top-center',
      });
  
      // Clear the code on error (only if not auto-submit to avoid clearing while user is typing)
      if (!isAutoSubmit) {
        setVerificationCode(['', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend verification code
  const handleResendCode = async () => {
    if (isResending || resendCooldown > 0) return;
    
    setIsResending(true);
    
    try {
      const response = await authAPI.resendVerificationCode(email);
      
      if (response.success) {
        // Reset verification code fields
        setVerificationCode(['', '', '', '', '']);
        inputRefs.current[0]?.focus();
        
        // Reset timer
        const expiryTime = Math.floor(Date.now() / 1000) + 1800; // 30 minutes
        localStorage.setItem(`verification_expiry_${email}`, expiryTime.toString());
        setTimeLeft(1800);
        setCanResend(false);
        
        // Set cooldown for resend button (60 seconds)
        setResendCooldown(60);
        
        toast.success('New verification code sent successfully!', {
          duration: 4000,
          position: 'top-center',
        });
      }
    } catch (error) {
      console.error('Resend code error:', error);
      
      let errorMessage = 'Failed to resend verification code. Please try again.';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage, {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setIsResending(false);
    }
  };

  // Handle email form submission
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    
    try {
      // First check if the user is already verified
      try {
        // Try to resend verification code - this will fail with a specific error if already verified
        const response = await authAPI.resendVerificationCode(email);
        
        // If we get here, the account exists but is not verified
        setShowEmailForm(false);
        setVerificationCode(['', '', '', '', '']);
        
        // Reset timer
        const expiryTime = Math.floor(Date.now() / 1000) + 1800; // 30 minutes
        localStorage.setItem(`verification_expiry_${email}`, expiryTime.toString());
        setTimeLeft(1800);
        setCanResend(false);
        
        toast.success('Verification code sent successfully!', {
          duration: 4000,
          position: 'top-center',
        });
      } catch (error) {
        // Check if the error is because the user is already verified
        const errorMessage = error.response?.data?.error || '';
        
        if (errorMessage.includes('already verified')) {
          setIsVerified(true);
          
          toast.success('Your account is already verified!', {
            duration: 3000,
            position: 'top-center',
          });
          
          setTimeout(() => {
            navigate('/login', { 
              state: { 
                message: 'Your account is already verified. Please sign in.',
                email: email
              } 
            });
          }, 2000);
          return;
        }
        
        // If it's another error, proceed with showing the verification form
        // This could be because the account doesn't exist, but we don't want to reveal that for security
        setShowEmailForm(false);
        setVerificationCode(['', '', '', '', '']);
        handleResendCode();
      }
    } catch (error) {
      console.error('Email verification check error:', error);
      toast.error('An error occurred. Please try again.', {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      {/* Navigation */}
      <nav className="w-full bg-white/80 backdrop-blur-20 border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-200">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Navi-IQ
                </span>
                <span className="text-xs text-slate-500 font-medium">Career Discovery Platform</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Secure verification</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Verification Card */}
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-slate-200 shadow-xl p-8">
            {showEmailForm ? (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-slate-800 mb-2">Verify Your Email</h1>
                  <p className="text-slate-600">Enter your email address to verify your account</p>
                </div>
                
                <form onSubmit={handleEmailSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="w-5 h-5 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-3 py-3 border rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 border-slate-300"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Continue to Verification
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              </>
            ) : !isVerified ? (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-slate-800 mb-2">Verify Your Email</h1>
                  <p className="text-slate-600">
                    {firstName ? `Hi ${firstName}! We` : 'We'} sent a verification code to <span className="font-medium">{email}</span>
                  </p>
                  {timeLeft > 0 && (
                    <div className="mt-2 flex items-center justify-center gap-1 text-sm text-slate-500">
                      <Clock className="w-4 h-4" />
                      <span>Code expires in {formatTime(timeLeft)}</span>
                    </div>
                  )}
                </div>

                {/* Verification Code Input */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-3 text-center">
                    Enter 5-digit verification code
                  </label>
                  <div 
                    className="flex justify-center gap-2 sm:gap-3"
                    onPaste={handlePaste}
                  >
                    {verificationCode.map((digit, index) => (
                      <input
                        key={index}
                        ref={el => inputRefs.current[index] = el}
                        type="text"
                        inputMode="numeric"
                        maxLength={5}
                        value={digit}
                        onChange={(e) => handleInputChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl font-bold border rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 border-slate-300"
                        disabled={isLoading}
                      />
                    ))}
                  </div>
                </div>

                {/* Verify Button */}
                <button
                  onClick={() => handleVerification()}
                  disabled={isLoading || verificationCode.some(digit => digit === '')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify Email
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                {/* Resend Code */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-600 mb-2">
                    {canResend ? (
                      "Didn't receive the code?"
                    ) : resendCooldown > 0 ? (
                      `You can request a new code in ${resendCooldown}s`
                    ) : (
                      "Didn't receive the code or it expired?"
                    )}
                  </p>
                  <button
                    onClick={handleResendCode}
                    disabled={isResending || resendCooldown > 0 || !canResend && timeLeft > 0}
                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-500 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
                    {isResending ? 'Sending...' : 'Resend verification code'}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Email Verified!</h2>
                <p className="text-slate-600 mb-6">
                  Your account has been successfully verified. You will be redirected to the login page shortly.
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationPage;
