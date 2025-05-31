import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Brain, ArrowRight, ArrowLeft, CheckCircle, Clock, Save, Lightbulb, AlertCircle, X, Target } from 'lucide-react';
import api from '../utils/axios';
import { useAuth } from '../utils/AuthContext';
import { safeTrim, safeArrayTrim } from '../utils/stringUtils';

const ObjectiveQuestionsForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userInfo } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [responses, setResponses] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [errors, setErrors] = useState({});
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [notification, setNotification] = useState(null);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    if (location.state?.objectiveQuestions && location.state?.sessionId) {
      initializeFromLocationState();
    } else {
      fetchInitialQuestions();
    }
  }, []);

  const initializeFromLocationState = () => {
    const { objectiveQuestions, sessionId } = location.state;
    setQuestions(objectiveQuestions);
    setSessionId(sessionId);
    
    const initialResponses = {};
    objectiveQuestions.forEach(q => {
      initialResponses[q.id] = '';
    });
    setResponses(initialResponses);
    setIsLoading(false);
  };

  const fetchInitialQuestions = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/questions/objective');
      
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
      
      const initialResponses = {};
      processedQuestions.forEach(q => {
        initialResponses[q.id] = q.inputType === 'multiple_choice' ? [] : '';
      });
      setResponses(initialResponses);
    } catch (error) {
      console.error('Error fetching objective questions:', error);
      // Show error in the UI status area
      setProgress({
        error: true,
        message: 'Failed to load questions. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
    
    if (errors[questionId]) {
      setErrors(prev => ({
        ...prev,
        [questionId]: ''
      }));
    }
  };

  const validateCurrentQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return true;
    
    const response = responses[currentQuestion.id];
    
    if (!response || safeTrim(response) === '') {
      setErrors(prev => ({
        ...prev,
        [currentQuestion.id]: 'This question is required'
      }));
      return false;
    }
    return true;
  };

  const goToNextQuestion = () => {
    if (validateCurrentQuestion()) {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentQuestion()) {
      setProgress({
        error: true,
        message: 'Please answer the current question before continuing.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
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

      const response = await api.post('/api/questions/objective', {
        responses: formattedResponses,
        sessionId
      });

      setProgress({
        message: 'Objective assessment completed!',
        completed: true
      });
      navigate('/results', { state: { sessionId: response.data.sessionId || sessionId } });
      
    } catch (error) {
      console.error('Error submitting responses:', error);
      setProgress({
        error: true,
        message: 'Failed to submit responses. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProgressPercentage = () => {
    const answeredCount = Object.values(responses).filter(response => {
      return response && safeTrim(response) !== '';
    }).length;
    
    return questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  };

  const showNotification = (type, message) => {
    setNotification({
      type,
      message,
      id: Date.now()
    });
    
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

  const renderInputField = (question) => {
    return (
      <div className="space-y-3">
        {question.options.map((option, index) => (
          <label
            key={index}
            className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:bg-blue-50/50 ${
              responses[question.id] === option
                ? 'border-blue-500 bg-blue-50/50'
                : errors[question.id]
                ? 'border-red-300'
                : 'border-slate-300'
            }`}
          >
            <input
              type="radio"
              name={`question-${question.id}`}
              value={option}
              checked={responses[question.id] === option}
              onChange={(e) => handleResponseChange(question.id, e.target.value)}
              className="w-4 h-4 text-blue-500 focus:ring-blue-500 focus:ring-2"
            />
            <span className="ml-3 text-slate-700">{option}</span>
          </label>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your objective questions...</p>
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
      <nav className="w-full bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Navi-IQ
                </span>
                <span className="text-xs text-slate-500 font-medium hidden sm:block">Dynamic Assessment</span>
              </div>
            </div>
            
            {/* Profile Section */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:flex items-center gap-3 text-sm text-slate-600">
                <span>Step 2 of 3</span>
                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                <span>{currentQuestionIndex + 1}/{questions.length} completed</span>
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
            <span className="text-xs sm:text-sm font-medium text-slate-700">Dynamic Assessment Progress</span>
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
            <Target className="w-3 h-3 sm:w-4 sm:h-4" />
            Objective Assessment Questions
          </div>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto">
            Based on your personal responses, answer these tailored questions to refine your career recommendations.
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
            </div>
          )}
        </div>

        {/* Question Card */}
        {currentQuestion && (
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-slate-200 shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-8">
            {/* Question progress and navigation similar to PersonalQuestionsForm */}
            
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2 sm:gap-0">
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

            {/* Navigation Buttons */}
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between pt-4 sm:pt-6 border-t border-slate-200 gap-2 sm:gap-0">
              <button
                onClick={goToPreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center sm:justify-start"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Previous</span>
              </button>

              {currentQuestionIndex < questions.length - 1 ? (
                <button
                  onClick={goToNextQuestion}
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg w-full sm:w-auto justify-center"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg w-full sm:w-auto justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Complete Assessment</span>
                      <span className="sm:hidden">Complete</span>
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tips Card */}
        <div className="bg-blue-50/50 backdrop-blur-sm rounded-2xl border border-blue-200 p-4 sm:p-6">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-3 h-3 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800 text-sm sm:text-base mb-1 sm:mb-2">Tips for Better Results</h3>
              <ul className="text-blue-700 text-xs sm:text-sm space-y-0.5 sm:space-y-1">
                <li>• Answer honestly - there are no right or wrong answers</li>
                <li>• Think about real-life situations when responding</li>
                <li>• Don't overthink - go with your first instinct</li>
                <li>• Your answers will shape your personalized career recommendations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ObjectiveQuestionsForm;