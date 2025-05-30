import React, { useState, useEffect, useRef } from 'react';
import { Brain, User, ArrowRight, CheckCircle, Clock, Target, Lightbulb, ChevronRight, LogOut, Menu, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../utils/AuthContext';
import api from '../utils/axios';
import PersonalQuestionsForm from '../components/PersonalQuestionsForm';
import { useNavigate } from 'react-router-dom';

const AssessmentHome = () => {
  const { userInfo, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [assessmentStage, setAssessmentStage] = useState('initial');
  const [showPersonalForm, setShowPersonalForm] = useState(false);
  const [objectiveData, setObjectiveData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [notification, setNotification] = useState(null);
  const mobileMenuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProgress = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/api/questions/resume');
        // console.log('Resume response:', response.data);
        setProgressData(response.data);
        
        // Set initial stage based on progress
        if (response.data.progress?.isFullyCompleted) {
          setAssessmentStage('completed');
        } else if (response.data.progress?.objectiveCompleted) {
          setAssessmentStage('objective');
        } else if (response.data.progress?.personalCompleted) {
          setAssessmentStage('personal');
        } else {
          setAssessmentStage('initial');
        }

        // Check if we need to fetch additional progress details
        if ((response.data.progress?.personalCompleted || response.data.progress?.objectiveCompleted) && 
            (!response.data.progress.details || 
             response.data.progress.details.personalCompleted === undefined)) {
          try {
            const progressResponse = await api.get('/api/questions/progress');
            if (progressResponse.data && progressResponse.data.progress) {
              // Update progress data with more detailed information
              setProgressData(prevData => ({
                ...prevData,
                progress: {
                  ...prevData.progress,
                  details: progressResponse.data.progress
                }
              }));
            }
          } catch (progressError) {
            console.error('Error fetching detailed progress:', progressError);
          }
        }

        // If we need to get objective questions count
        if (response.data.progress?.personalCompleted && 
            !response.data.totalObjectiveQuestions) {
          try {
            const objectiveResponse = await api.get('/api/questions/objective');
            if (objectiveResponse.data && objectiveResponse.data.questions) {
              // Update progress data with objective questions count
              setProgressData(prevData => ({
                ...prevData,
                totalObjectiveQuestions: objectiveResponse.data.questions.length || 0
              }));
            }
          } catch (objectiveError) {
            console.error('Error fetching objective questions count:', objectiveError);
          }
        }
      } catch (error) {
        console.error('Error fetching progress:', error);
        showNotification('error', 'Failed to load your progress');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProgress();
  }, []);

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

  const getUserInitials = () => {
    if (!userInfo?.user) return 'U';
    const firstName = userInfo.user.firstName || '';
    const lastName = userInfo.user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }; 

  const startAssessment = () => {
    if (isLoading) return;
    
    // Always check progress first
    if (!progressData) {
      navigate('/assessment');
      return;
    }
  
    // Handle redirects based on progress
    switch(progressData.redirectTo) {
      case 'personal-questions':
        // No toast notification, status is shown in the UI
        navigate('/assessment/personal', { 
          state: { 
            sessionId: progressData.sessionId,
            completedCount: progressData.progress?.details?.personalCompleted || 0
          } 
        });
        break;
        
      case 'objective-questions':
        // No toast notification, status is shown in the UI
        navigate('/assessment/objective', { 
          state: { 
            sessionId: progressData.sessionId,
            completedCount: progressData.progress?.details?.objectiveCompleted || 0
          } 
        });
        break;
        
      case 'results':
        navigate('/results', { state: { sessionId: progressData.sessionId } });
        break;
        
      default:
        // Default to personal questions with fresh session
        navigate('/assessment/personal');
    }
  };

  const handlePersonalComplete = (data) => {
    setObjectiveData(data);
    setAssessmentStage('objective');
    setShowPersonalForm(false);
  };

  const getStepStatus = (stepId) => {
    if (assessmentStage === 'completed') return 'completed';
    
    // Check if we have explicit progress data from the backend
    const personalCompleted = progressData?.progress?.personalCompleted;
    const objectiveCompleted = progressData?.progress?.objectiveCompleted;
    
    switch(stepId) {
      case 1: // Personal Discovery
        if (personalCompleted) return 'completed';
        if (assessmentStage === 'initial') return 'upcoming';
        if (assessmentStage === 'personal') return 'current';
        return 'completed';
      
      case 2: // Dynamic Assessment
        if (objectiveCompleted) return 'completed';
        if (personalCompleted) return 'current';
        if (assessmentStage === 'initial' || assessmentStage === 'personal') return 'upcoming';
        if (assessmentStage === 'objective') return 'current';
        return assessmentStage === 'completed' ? 'completed' : 'locked';
      
      case 3: // Career Insights
        return assessmentStage === 'completed' ? 'current' : 'locked';
      
      default:
        return 'locked';
    }
  };

  const assessmentSteps = [
    {
      id: 1,
      title: "Personal Discovery",
      description: "Share your interests, values, and aspirations with us",
      icon: User,
      color: "from-blue-500 to-purple-500",
      estimated: "5-7 minutes",
      status: getStepStatus(1),
      // If personalCompleted is true but we don't have a count, set to 10 (completed)
      completedCount: progressData?.progress?.details?.personalCompleted || 
        (progressData?.progress?.personalCompleted ? 10 : 0),
      totalCount: 10
    },
    {
      id: 2,
      title: "Dynamic Assessment",
      description: "AI-generated questions tailored to your responses",
      icon: Brain,
      color: "from-purple-500 to-pink-500",
      estimated: "10-15 minutes",
      status: getStepStatus(2),
      // If objectiveCompleted is true but we don't have a count, use the actual count or 100%
      completedCount: progressData?.progress?.details?.objectiveCompleted || 
        (progressData?.progress?.objectiveCompleted ? 
          (progressData?.totalObjectiveQuestions || 0) : 0),
      // Use the actual total count of objective questions if available
      totalCount: progressData?.totalObjectiveQuestions || 30
    },
    {
      id: 3,
      title: "Career Insights",
      description: "Receive personalized career recommendations and guidance",
      icon: Target,
      color: "from-pink-500 to-red-500",
      estimated: "2-3 minutes",
      status: getStepStatus(3)
    }
  ];

  const getButtonText = () => {
    if (isLoading) return "Loading...";
    if (assessmentStage === 'completed') return "View Results";
    
    // Check if personal questions are completed but objective questions are not
    if (progressData?.progress?.personalCompleted && !progressData?.progress?.objectiveCompleted) {
      return "Continue Objective Questions";
    }
    
    if (assessmentStage === 'objective') return "Continue Assessment";
    if (assessmentStage === 'personal') return progressData?.progress?.details?.personalCompleted > 0 
      ? "Continue Personal Questions" 
      : "Start Personal Questions";
    return "Start Assessment";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
            
            {/* Profile Section */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 text-sm text-slate-600">
                <span>Welcome back, {userInfo?.user?.firstName || 'User'}!</span>
              </div>
              
              {/* Mobile Menu Button */}
              <button 
                className="sm:hidden flex items-center justify-center w-9 h-9 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                aria-label="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              {/* Mobile Menu Dropdown */}
              {showMobileMenu && (
                <div className="absolute top-16 right-4 w-48 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-50 sm:hidden">
                  <div className="px-3 py-2 text-sm font-medium text-slate-800 border-b border-slate-100">
                    {userInfo?.user?.firstName} {userInfo?.user?.lastName}
                  </div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
              
              {/* Desktop Profile Dropdown */}
              <div className="relative group hidden sm:block">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold cursor-pointer hover:scale-105 transition-transform duration-200">
                  {getUserInitials()}
                </div>
                <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-lg border border-slate-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-2">
                  <div className="px-3 py-2 text-sm text-slate-600 border-b border-slate-100">
                    {userInfo?.user?.firstName} {userInfo?.user?.lastName}
                  </div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 max-w-md animate-slide-in-right ${
          notification.type === 'error' ? 'bg-red-50 border-red-300 text-red-700' :
          notification.type === 'success' ? 'bg-green-50 border-green-300 text-green-700' :
          'bg-blue-50 border-blue-300 text-blue-700'
        } border rounded-lg shadow-md p-4 flex items-start`}>
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

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-blue-700 font-medium text-sm mb-6">
            <Lightbulb className="w-4 h-4" />
            AI-Powered Career Assessment
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
            Discover Your Perfect
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent block">
              Career Path
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            {assessmentStage === 'completed' 
              ? "Your assessment is complete! View your personalized results below."
              : progressData?.progress?.personalCompleted
                ? "Continue your assessment where you left off."
                : "Take our comprehensive assessment to unlock personalized career recommendations."}
          </p>
          
          {/* Status Message */}
          {progressData?.message && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
              <Lightbulb className="w-4 h-4" />
              <span className="text-sm font-medium">{progressData.message}</span>
            </div>
          )}
        </div>

        {/* Assessment Steps */}
        <div className="space-y-6 mb-12">
          {assessmentSteps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = step.status === 'completed';
            const isCurrent = step.status === 'current';
            const isLocked = step.status === 'locked';
            const isUpcoming = step.status === 'upcoming';

            return (
              <div
                key={step.id}
                className={`relative bg-white/70 backdrop-blur-sm rounded-2xl border transition-all duration-300 ${
                  isCurrent 
                    ? 'border-blue-300 shadow-lg ring-2 ring-blue-100' 
                    : isCompleted
                    ? 'border-green-300 shadow-md'
                    : isLocked 
                    ? 'border-slate-200 opacity-60' 
                    : 'border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="p-6 flex items-center">
                  {/* Step Number/Icon */}
                  <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center mr-6 ${
                    isCompleted 
                      ? 'bg-green-100 text-green-600' 
                      : isCurrent
                      ? `bg-gradient-to-br ${step.color} text-white shadow-lg`
                      : isLocked
                      ? 'bg-slate-100 text-slate-400'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-8 h-8" />
                    ) : (
                      <Icon className="w-8 h-8" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-xl font-semibold ${
                        isLocked ? 'text-slate-400' : 'text-slate-800'
                      }`}>
                        {step.title}
                      </h3>
                      <div className={`flex items-center gap-1 text-sm px-2 py-1 rounded-full ${
                        isCompleted 
                          ? 'bg-green-100 text-green-700'
                          : isCurrent
                          ? 'bg-blue-100 text-blue-700'
                          : isLocked
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        <Clock className="w-3 h-3" />
                        {step.estimated}
                      </div>
                    </div>
                    <p className={`text-base ${
                      isLocked ? 'text-slate-400' : 'text-slate-600'
                    }`}>
                      {step.description}
                    </p>

                    {/* Progress bar for steps with counts */}
                    {(step.completedCount > 0 || isCurrent || isCompleted) && (
                      <div className="mt-3">
                        <div className="flex justify-between text-sm text-slate-500 mb-1">
                          <span>
                            {isCompleted 
                              ? 'Completed' 
                              : step.completedCount > 0 
                                ? `${step.completedCount}/${step.totalCount} completed`
                                : 'Not started'}
                          </span>
                          {!isCompleted ? (
                            <span>{Math.round((step.completedCount / step.totalCount) * 100)}%</span>
                          ) : (
                            <span>100%</span>
                          )}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: isCompleted ? '100%' : `${(step.completedCount / step.totalCount) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Arrow/Status */}
                  <div className="flex-shrink-0">
                    {isCurrent && (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <ChevronRight className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                    {isCompleted && (
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                    )}
                    {isLocked && (
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                        <Clock className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress indicator */}
                {!isLocked && index < assessmentSteps.length - 1 && (
                  <div className="absolute -bottom-3 left-8 w-px h-6 bg-gradient-to-b from-slate-300 to-transparent"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Section */}
        <div className="text-center">
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200 p-8 shadow-lg">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">
              {assessmentStage === 'completed' 
                ? "Your Assessment is Complete!"
                : progressData?.progress?.personalCompleted
                  ? "Continue Your Assessment"
                  : "Ready to Begin?"}
            </h2>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">
              {assessmentStage === 'completed'
                ? "View your personalized career recommendations and insights."
                : progressData?.redirectTo === 'personal-questions'
                  ? "Start with personal questions about your interests and values."
                  : progressData?.redirectTo === 'objective-questions'
                    ? "Continue with objective questions tailored to your responses."
                    : "Your personalized career journey starts here. The assessment adapts to your responses."}
            </p>
            
            <button
              onClick={startAssessment}
              disabled={isLoading}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Loading...
                </>
              ) : (
                <>
                  {getButtonText()}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            {assessmentStage !== 'completed' && (
              <div className="mt-4 text-sm text-slate-500">
                Takes approximately 15-20 minutes • Results are personalized for you
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentHome;