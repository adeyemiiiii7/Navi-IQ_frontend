import React, { useState, useEffect, useRef } from 'react';
import { Brain, User, ArrowRight, ArrowLeft, CheckCircle, Clock, Save, Lightbulb, AlertCircle, RotateCcw, X,Target } from 'lucide-react';
import { useAuth } from '../utils/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/axios';
import { safeTrim, safeArrayTrim } from '../utils/stringUtils';

const PersonalQuestionsForm = ({ onComplete, onBack }) => {
  const { userInfo } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [errors, setErrors] = useState({});
  const [progress, setProgress] = useState(null);
  const [hasResumedProgress, setHasResumedProgress] = useState(false);
  const [notification, setNotification] = useState(null);
  // No longer using saveTimeout ref

  // Get user initials for profile
  const getUserInitials = () => {
    if (!userInfo?.user) return 'U';
    const firstName = userInfo.user.firstName || '';
    const lastName = userInfo.user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Check for existing progress on mount
  useEffect(() => {
    checkExistingProgress();
  }, []);

  const checkExistingProgress = async () => {
    try {
      setIsLoading(true);
      
      // First check if user has existing progress
      const progressResponse = await api.get('/api/questions/progress');
      
      if (progressResponse.data.hasProgress && progressResponse.data.currentStep === 'personal-questions') {
        // User has saved progress, try to resume
        try {
          const resumeResponse = await api.get('/api/questions/resume');
          
          if (resumeResponse.data.personalQuestions && resumeResponse.data.personalResponses) {
            // Resume from saved progress
            setQuestions(resumeResponse.data.personalQuestions);
            setResponses(resumeResponse.data.personalResponses || {});
            setSessionId(resumeResponse.data.sessionId || '');
            setProgress(resumeResponse.data.progress);
            setHasResumedProgress(true);
            
            // Set current question index based on progress
            const lastAnsweredIndex = findLastAnsweredQuestionIndex(resumeResponse.data.personalResponses || {}, resumeResponse.data.personalQuestions);
            setCurrentQuestionIndex(Math.min(lastAnsweredIndex + 1, resumeResponse.data.personalQuestions.length - 1));
            
            // Display status message in the UI instead of toast
            setProgress({
              ...resumeResponse.data.progress,
              message: 'Resumed your personal assessment progress!'
            });
            return;
          }
        } catch (resumeError) {
          // console.log('Could not resume progress, starting fresh:', resumeError);
        }
      }
      
      // If no progress or resume failed, fetch initial questions
      await fetchInitialQuestions();
      
    } catch (error) {
      console.error('Error checking progress:', error);
      // Fallback to initial questions
      await fetchInitialQuestions();
    } finally {
      setIsLoading(false);
    }
  };

  const findLastAnsweredQuestionIndex = (responses, questions) => {
    for (let i = questions.length - 1; i >= 0; i--) {
      const response = responses[questions[i].id];
      if (response) {
        // Check if response is an array
        if (Array.isArray(response)) {
          if (response.length > 0) return i;
        }
        // Check if response is an object with text property
        else if (typeof response === 'object' && response !== null) {
          if (response.text) return i;
        }
        // Check if response is a non-empty string
        else if (typeof response === 'string' && safeTrim(response) !== '') {
          return i;
        }
        // Any other truthy value
        else if (response) {
          return i;
        }
      }
    }
    return -1;
  };

  const fetchInitialQuestions = async () => {
    try {
      const response = await api.get('/api/questions/initial');
      // console.log('Initial questions:', response.data);
      
      // Process questions to ensure options are properly formatted
      const processedQuestions = (response.data.questions || []).map(q => {
        // If options is a string (JSON), parse it
        if (q.options && typeof q.options === 'string') {
          try {
            q.options = JSON.parse(q.options);
          } catch (e) {
            // If parsing fails, split by comma (common format)
            q.options = q.options.split(',').map(opt => safeTrim(opt));
          }
        }
        return q;
      });
      
      setQuestions(processedQuestions);
      setSessionId(response.data.sessionId || '');
      
      // Initialize responses object
      const initialResponses = {};
      processedQuestions.forEach(q => {
        initialResponses[q.id] = q.inputType === 'multiple_choice' ? [] : '';
      });
      setResponses(initialResponses);
    } catch (error) {
      console.error('Error fetching questions:', error);
      // Error will be shown in the UI status area
      setProgress({
        error: true,
        message: 'Failed to load questions. Please try again.'
      });
    }
  };

  // Auto-save progress periodically
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (Object.keys(responses).length > 0 && !isSaving && !isSubmitting) {
        saveProgress(false); // Silent save
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [responses, isSaving, isSubmitting]);

  const saveProgress = async (showToast = true) => {
    if (isSaving || isSubmitting) return;
    
    try {
      setIsSaving(true);
      
      await api.post('/api/questions/save-progress', {
        step: 'personal-questions',
        sessionId,
        personalResponses: responses,
        currentQuestionIndex,
        personalQuestions: questions
      });
      
      
      if (showToast) {
        // Update progress status message instead of toast
        setProgress(prev => ({
          ...prev,
          message: 'Progress saved!',
          savedAt: new Date().toLocaleTimeString()
        }));
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      if (showToast) {
        // Update progress status message with error
        setProgress(prev => ({
          ...prev,
          error: true,
          message: 'Failed to save progress'
        }));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleResponseChange = (questionId, value, isMultiSelect = false) => {
    // Clear error for this question when user changes response
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }

    if (isMultiSelect) {
      // Handle multi-select (checkboxes)
      setResponses(prev => {
        const currentSelections = prev[questionId] || [];
        let newSelections;

        // Check if the option is an object with text property or a simple string
        const compareValue = typeof value === 'object' && value !== null ? value.text : value;
        const valueExists = currentSelections.some(item => 
          typeof item === 'object' && item !== null ? 
            item.text === compareValue : 
            item === compareValue
        );

        if (valueExists) {
          // If already selected, remove it
          newSelections = currentSelections.filter(item => 
            typeof item === 'object' && item !== null ?
              item.text !== compareValue :
              item !== compareValue
          );
        } else {
          // If not selected, add it
          newSelections = [...currentSelections, value];
        }

        // Update the responses
        return {
          ...prev,
          [questionId]: newSelections
        };
      });
    } else {
      // Handle single-select (radio buttons) or text input
      setResponses(prev => ({
        ...prev,
        [questionId]: value
      }));
    }
    
    // Save progress after response change (outside of the state updates)
    if (sessionId) {
      // Use a simple timeout without ref
      setTimeout(() => {
        try {
          saveProgress(false);
        } catch (err) {
          console.error('Error auto-saving progress:', err);
        }
      }, 1500);
    }
  };
  
  const goToNextQuestion = () => {
    if (validateCurrentQuestion()) {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        // Auto-save when moving to next question
        saveProgress(false);
      }
    }
  };

  const validateCurrentQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return true;
    
    const response = responses[currentQuestion.id];
    
    if (currentQuestion.inputType === 'multiple_choice') {
      if (!response || !Array.isArray(response) || response.length === 0) {
        setErrors(prev => ({
          ...prev,
          [currentQuestion.id]: 'Please select at least one option'
        }));
        return false;
      }
    } else {
      // Check if response is valid based on its type
      let isValid = false;
      
      if (response) {
        // If response is an object with text property
        if (typeof response === 'object' && response !== null) {
          isValid = response.text ? true : false;
        }
        // If response is a string
        else if (typeof response === 'string') {
          isValid = safeTrim(response) !== '';
        }
        // Any other truthy value
        else {
          isValid = true;
        }
      }
      
      if (!isValid) {
        setErrors(prev => ({
          ...prev,
          [currentQuestion.id]: 'This question is required'
        }));
        return false;
      }
    }
    return true;
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const validateAllResponses = () => {
    const newErrors = {};
    let isValid = true;
    
    questions.forEach(question => {
      const response = responses[question.id];
      
      if (question.inputType === 'multiple_choice') {
        if (!response || !Array.isArray(response) || response.length === 0) {
          newErrors[question.id] = 'Please select at least one option';
          isValid = false;
        }
      } else {
        // Check if response is valid based on its type
        let responseValid = false;
        
        if (response) {
          // If response is an object with text property
          if (typeof response === 'object' && response !== null) {
            responseValid = response.text ? true : false;
          }
          // If response is a string
          else if (typeof response === 'string') {
            responseValid = safeTrim(response) !== '';
          }
          // Any other truthy value
          else {
            responseValid = true;
          }
        }
        
        if (!responseValid) {
          newErrors[question.id] = 'This question is required';
          isValid = false;
        }
      }
    });
    
    setErrors(newErrors);
    return isValid;
  };

  // In PersonalQuestionsForm.js
const handleSubmit = async () => {
  if (!validateAllResponses()) {
    // Show validation error in the UI
    setProgress(prev => ({
      ...prev,
      error: true,
      message: 'Please answer all questions before continuing.'
    }));
    return;
  }

  setIsSubmitting(true);
  try {
    // Format responses for backend
    const formattedResponses = questions.map(question => {
      // Ensure answer is a string
      let answer = responses[question.id];
      if (answer === null || answer === undefined) {
        answer = '';
      } else if (typeof answer === 'object') {
        // Convert arrays or objects to string
        answer = JSON.stringify(answer);
      } else {
        // Ensure it's a string
        answer = String(answer);
      }
      
      return {
        questionId: question.id,
        answer: answer
      };
    });

    const response = await api.post('/api/questions/personal', {
      responses: formattedResponses,
      sessionId
    });

    // console.log('Personal responses submitted:', response.data);
    // Show completion message in the UI
    setProgress(prev => ({
      ...prev,
      message: 'Personal assessment completed!',
      completed: true
    }));
    

    
    // Navigate to objective assessment
    navigate('/assessment/objective', {
      state: {
        objectiveQuestions: response.data.objectiveQuestions,
        sessionId: response.data.sessionId || sessionId
      }
    });
    
  } catch (error) {
    console.error('Error submitting responses:', error);
    const errorMsg = error.response?.data?.message || 'Failed to submit responses. Please try again.';
    // Show error in the UI
    setProgress(prev => ({
      ...prev,
      error: true,
      message: errorMsg
    }));
  } finally {
    setIsSubmitting(false);
  }
};
  const resetProgress = async () => {
    if (window.confirm('Are you sure you want to start over? This will clear all your current responses.')) {
      try {
        setIsLoading(true);
        await api.delete('/api/questions/progress'); // Clear saved progress

        await fetchInitialQuestions(); // Fetch fresh questions
        setCurrentQuestionIndex(0);
        setHasResumedProgress(false);
        // Show reset message in the UI
        setProgress({
          message: 'Progress reset. Starting fresh!'
        });
      } catch (error) {
        console.error('Error resetting progress:', error);
        // Show error in the UI
        setProgress({
          error: true,
          message: 'Failed to reset progress'
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getProgressPercentage = () => {
    // Only count answered questions, not just the current index
    const answeredCount = Object.values(responses).filter(response => {
      if (Array.isArray(response)) {
        return response.length > 0;
      }
      return response && safeTrim(response) !== '';
    }).length;
    
    // Return 0 if no questions answered yet
    return questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  };

  const getAnsweredCount = () => {
    return Object.values(responses).filter(response => {
      if (Array.isArray(response)) {
        return response.length > 0;
      }
      return response && safeTrim(response) !== '';
    }).length;
  };
  

  // Function to show embedded notifications instead of toast
  const showNotification = (type, message) => {
    setNotification({
      type,
      message,
      id: Date.now()
    });
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // Render input field based on question type
  const renderInputField = (question) => {
    if (!question.options || question.options.length === 0) {
      // Open-ended question - render textarea
      return (
        <textarea
          value={responses[question.id] || ''}
          onChange={(e) => handleResponseChange(question.id, e.target.value)}
          placeholder="Share your thoughts here..."
          rows={4}
          className={`w-full p-4 border rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none ${
            errors[question.id] ? 'border-red-300' : 'border-slate-300'
          }`}
        />
      );
    } else if (question.inputType === 'multiple_choice') {
      // Multiple choice question - render checkboxes
      const selectedValues = responses[question.id] || [];
      const maxSelections = question.maxSelections || 99;
      const isMaxReached = selectedValues.length >= maxSelections;
      
      return (
        <div className="space-y-3">
          {maxSelections < 99 && (
            <p className="text-sm text-slate-600 mb-3">
              Select up to {maxSelections} option{maxSelections > 1 ? 's' : ''} 
              ({selectedValues.length}/{maxSelections} selected)
            </p>
          )}
          {Array.isArray(question.options) ? 
            question.options.map((option, index) => {
              // Handle both string options and object options with text/traits properties
              const optionValue = typeof option === 'object' && option !== null ? option.text : option;
              const isSelected = selectedValues.some(selected => 
                typeof selected === 'object' && selected !== null ? 
                  selected.text === optionValue : 
                  selected === optionValue
              );
              const isDisabled = !isSelected && isMaxReached;
              
              return (
                <label
                  key={index}
                  className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/50'
                      : isDisabled
                      ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
                      : 'border-slate-300 hover:bg-blue-50/30'
                  } ${errors[question.id] ? 'border-red-300' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() => handleResponseChange(question.id, option, true)}
                    className="w-4 h-4 text-blue-500 focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
                  />
                  <span className={`ml-3 ${isDisabled ? 'text-slate-400' : 'text-slate-700'}`}>
                    {optionValue}
                  </span>
                </label>
              );
            })
            : (
              <div className="p-4 text-amber-600 bg-amber-50 rounded-xl">
                <p>No options available for this question.</p>
              </div>
            )
          }
        </div>
      );
    } else {
      // Single choice question - render radio buttons
      return (
        <div className="space-y-3">
          {Array.isArray(question.options) ? question.options.map((option, index) => {
            // Handle both string options and object options with text/traits properties
            const optionValue = typeof option === 'object' && option !== null ? option.text : option;
            const currentResponse = responses[question.id];
            const isSelected = typeof currentResponse === 'object' && currentResponse !== null ?
              currentResponse.text === optionValue :
              currentResponse === optionValue;
            
            return (
              <label
                key={index}
                className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:bg-blue-50/50 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/50'
                    : errors[question.id]
                    ? 'border-red-300'
                    : 'border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={optionValue}
                  checked={isSelected}
                  onChange={() => handleResponseChange(question.id, option)}
                  className="w-4 h-4 text-blue-500 focus:ring-blue-500 focus:ring-2"
                />
                <span className="ml-3 text-slate-700">{optionValue}</span>
              </label>
            );
          }) : (
            <div className="p-4 text-amber-600 bg-amber-50 rounded-xl">
              <p>No options available for this question.</p>
            </div>
          )}
        </div>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your personalized questions...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 max-w-md animate-slide-in-right ${
          notification.type === 'error' ? 'bg-red-50 border-red-300 text-red-700' :
          notification.type === 'success' ? 'bg-green-50 border-green-300 text-green-700' :
          'bg-blue-50 border-blue-300 text-blue-700'
        } border rounded-lg shadow-md p-4 flex items-start`} style={{ animation: 'slideInRight 0.3s ease-out' }}>
          <div className="flex-shrink-0 mr-3">
            {notification.type === 'error' ? (
              <AlertCircle className="w-5 h-5" />
            ) : notification.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <Lightbulb className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
      {/* Navigation */}
      <nav className="w-full bg-white/80 backdrop-blur-20 border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Navi-IQ
                </span>
                <span className="text-xs text-slate-500 font-medium hidden sm:block">Personal Discovery</span>
              </div>
            </div>

            {/* Profile Section */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:flex items-center gap-3 text-sm text-slate-600">
                <span>Step 1 of 3</span>
                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                <span>{getAnsweredCount()}/{questions.length} completed</span>
              </div>
              <div className="flex items-center gap-1 text-xs sm:text-sm text-slate-500">
                <span className="text-slate-600">{getAnsweredCount()}/{questions.length}</span>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-semibold">
                {getUserInitials()}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Progress Bar */}
      <div className="w-full bg-white/50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between mb-1 sm:mb-2">
            <span className="text-xs sm:text-sm font-medium text-slate-700">Personal Discovery Progress</span>
            <span className="text-xs sm:text-sm font-medium text-blue-600">{getProgressPercentage()}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-1.5 sm:h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 sm:h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-8">
          <div className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-blue-700 font-medium text-xs sm:text-sm mb-3 sm:mb-4">
            <User className="w-3 h-3 sm:w-4 sm:h-4" />
            Personal Discovery Questions
          </div>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto">
            Help us understand your interests, values, and aspirations to generate personalized follow-up questions.
          </p>
          
          {/* Status Message */}
          {progress?.message && (
            <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 ${progress.error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'} border rounded-lg transition-all duration-300`}>
              {progress.error ? (
                <AlertCircle className="w-4 h-4" />
              ) : progress.completed ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Lightbulb className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{progress.message}</span>
              {progress.savedAt && (
                <span className="text-xs opacity-70">at {progress.savedAt}</span>
              )}
            </div>
          )}
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-slate-200 shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-8">
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-1 sm:gap-0">
                <span className="text-xs sm:text-sm font-medium text-slate-500">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>
                <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-slate-500">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Take your time</span>
                </div>
              </div>
              
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-800 mb-3 sm:mb-4">
                {currentQuestion.questionText}
              </h2>

              {/* Answer Input - Dynamic based on question type */}
              <div className="space-y-4">
                {renderInputField(currentQuestion)}
                
                {errors[currentQuestion.id] && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {errors[currentQuestion.id]}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 sm:pt-6 border-t border-slate-200 gap-3 sm:gap-0">
              <button
                onClick={() => navigate('/assessment')}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 text-slate-600 hover:text-slate-800 text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto justify-center sm:justify-start"
              >
                <ArrowLeft className="w-3 h-3 sm:w-5 sm:h-5" />
                <span>Back to Overview</span>
              </button>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                {currentQuestionIndex > 0 && (
                  <button
                    onClick={goToPreviousQuestion}
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 w-1/2 sm:w-auto justify-center"
                  >
                    <ArrowLeft className="w-3 h-3 sm:w-5 sm:h-5" />
                    <span>Previous</span>
                  </button>
                )}

                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    onClick={goToNextQuestion}
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg w-1/2 sm:w-auto justify-center"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-3 h-3 sm:w-5 sm:h-5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-1 sm:gap-2 px-3 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none w-full sm:w-auto justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3 h-3 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">Complete Personal Assessment</span>
                        <span className="sm:hidden">Complete</span>
                        <CheckCircle className="w-3 h-3 sm:w-5 sm:h-5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}  {/* End of Question Card */}

        {/* Tips Card */}
        <div className="bg-blue-50/50 backdrop-blur-sm rounded-2xl border border-blue-200 p-4 sm:p-6">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-3 h-3 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 text-sm sm:text-base mb-1 sm:mb-2">Tips for Better Results</h3>
              <ul className="text-blue-700 text-xs sm:text-sm space-y-0.5 sm:space-y-1">
                <li>• Be honest and authentic in your responses</li>
                <li>• Take your time to think through each question</li>
                <li>• Provide specific examples when possible</li>
                <li>• Your answers will help generate personalized follow-up questions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalQuestionsForm;