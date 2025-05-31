import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { safeTrim,safeStringify } from '../utils/stringUtils';
import { 
  Trophy, 
  TrendingUp, 
  Briefcase, 
  Lightbulb, 
  Brain, 
  BookOpen, 
  Users, 
  ArrowRight,
  Download,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Zap,
  Award,
  Heart,
  Clock,
  DollarSign,
  MapPin,
  Eye,
  RefreshCw,
  Target,
  Star
} from 'lucide-react';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../utils/AuthContext';

// Helper function to ensure a value is an array
const ensureArray = (value) => {
  if (!value) return [];
  
  // If already an array, return it
  if (Array.isArray(value)) return value;
  
  // If it's a string, try to parse it as JSON
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch (e) {
      // If parsing fails, split by comma (common format)
      return value.split(',').map(item => safeTrim(item));
    }
  }
  
  // If it's another type, wrap it in an array
  return [value];
};
import { exportToPDF } from '../utils/exportUtils';

const CareerResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userInfo, tokenUtils } = useAuth();
  const [resultsData, setResultsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCareer, setExpandedCareer] = useState(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isRetaking, setIsRetaking] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const sessionId = location.state?.sessionId;

  useEffect(() => {
    if (!sessionId) {
      toast.error('No assessment session found. Please retake the assessment.');
      navigate('/assessment');
      return;
    }

    if (!userInfo.isAuthenticated) {
      toast.error('Please log in to view your results.');
      navigate('/login');
      return;
    }

    fetchResults();
  }, [sessionId, navigate, userInfo.isAuthenticated]);

  const fetchResults = async () => {
    try {
      setIsLoading(true);
      
      const headers = {};
      if (userInfo.token) {
        headers.Authorization = `Bearer ${userInfo.token}`;
      }
  
      // First check if we have a valid sessionId
      if (!sessionId) {
        throw new Error('No assessment session found');
      }

      const response = await api.get(`/api/career/recommendations?sessionId=${sessionId}`, {
        headers
      });
      
      // Check if the response is successful and has data
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch recommendations');
      }
      
      // Transform the data to match expected format
      const transformedData = transformApiResponse(response.data);
      
      if (!transformedData || !transformedData.recommendations || transformedData.recommendations.length === 0) {
        throw new Error('No recommendations found for this assessment');
      }
      
      setResultsData(transformedData);
      
    } catch (error) {
      console.error('Error fetching results:', error);
      
      if (error.response?.status === 400) {
        toast.error('No assessment responses found for this session. Please complete the assessment.');
        navigate('/assessment');
      } else if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in.');
        tokenUtils.clearAuthToken();
        navigate('/login');
      } else if (error.response?.status === 404) {
        toast.error('Assessment results not found. Please retake the assessment.');
        navigate('/assessment');
      } else {
        toast.error(error.message || 'Failed to load your results. Please try again.');
        navigate('/assessment');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRetakeAssessment = async () => {
    try {
      setIsRetaking(true);
      
      const headers = {};
      if (userInfo.token) {
        headers.Authorization = `Bearer ${userInfo.token}`;
      }
      
      const response = await api.post('/api/questions/retake', {}, { headers });
      
      if (response.data.success) {
        toast.success('Assessment reset successfully!');
        navigate('/assessment');
      } else {
        throw new Error('Failed to reset assessment');
      }
      
    } catch (error) {
      console.error('Error retaking assessment:', error);
      toast.error(error.response?.data?.message || 'Failed to reset assessment. Please try again.');
      setIsRetaking(false);
    }
  };
  
  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      
      // Add user name to results data for the PDF
      const resultsDataWithUser = {
        ...resultsData,
        userName: userInfo?.user ? `${userInfo.user.firstName} ${userInfo.user.lastName}` : 'User'
      };
      
      await exportToPDF(resultsDataWithUser);
      toast.success('Results exported to PDF successfully!');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('Failed to export results. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const transformApiResponse = (apiData) => {
    // Handle case where apiData might be null or undefined
    if (!apiData) {
      return null;
    }

    // If the API returns recommendations directly
    if (apiData.recommendations && Array.isArray(apiData.recommendations)) {
      // Log the raw recommendations for debugging
    //   console.log('Raw recommendations:', apiData.recommendations);
      // Create a mapping of career titles to default details
      const careerDefaults = {
        'Construction Project Manager': {
          sector: 'Construction',
          description: 'Oversees construction projects from planning to completion, managing timelines, budgets, and teams.',
          averageSalary: '$70,000 - $120,000',
          growthOutlook: 'Very Good',
          requiredSkills: ['Project Management', 'Leadership', 'Construction Knowledge', 'Budget Management']
        },
        'Building Inspector': {
          sector: 'Construction',
          description: 'Examines buildings to ensure they meet building codes, zoning regulations, and safety standards.',
          averageSalary: '$55,000 - $85,000',
          growthOutlook: 'Good',
          requiredSkills: ['Building Codes', 'Attention to Detail', 'Technical Knowledge', 'Report Writing']
        },
        'Carpenter': {
          sector: 'Construction',
          description: 'Constructs, installs, and repairs structures made of wood and other materials.',
          averageSalary: '$45,000 - $75,000',
          growthOutlook: 'Stable',
          requiredSkills: ['Hand Tools', 'Measurement', 'Physical Stamina', 'Problem Solving']
        }
      };

      return {
        recommendations: apiData.recommendations.map((career, index) => {
          // If career is just a string (title), use the defaults
          const careerTitle = typeof career === 'string' ? career : career.title;
          const defaults = careerDefaults[careerTitle] || {
            sector: 'General',
            description: `Career as a ${careerTitle}`,
            averageSalary: '$50,000 - $100,000',
            growthOutlook: 'Good',
            requiredSkills: ['Communication', 'Problem Solving', 'Attention to Detail']
          };

          // Merge defaults with any provided data
          const careerData = typeof career === 'string' ? {} : career;
          
          // Handle different salary formats
          let formattedSalary = careerData.averageSalary || defaults.averageSalary;
          let salaryDetails = null;
          
          if (typeof formattedSalary === 'object') {
            salaryDetails = formattedSalary;
            formattedSalary = formattedSalary.midLevel || 
              `${formattedSalary.entryLevel} to ${formattedSalary.seniorLevel}` || 
              defaults.averageSalary;
          }

          // Ensure all values are strings
          const safeStringify = (value) => {
            if (typeof value === 'object' && value !== null) {
              return JSON.stringify(value);
            }
            return String(value || '');
          };

          return {
            id: careerData.id || `career-${index}`,
            title: safeStringify(careerTitle),
            description: safeStringify(careerData.description || defaults.description),
            matchScore: Number(careerData.matchScore) || 85 - (index * 10),
            sector: safeStringify(careerData.sector || defaults.sector),
            averageSalary: safeStringify(formattedSalary),
            salaryDetails: salaryDetails,
            salaryRange: safeStringify(formattedSalary),
            growthOutlook: safeStringify(careerData.growthOutlook || defaults.growthOutlook),
            location: safeStringify(careerData.location || "Various locations"),
            experienceLevel: safeStringify(careerData.experienceLevel || "Entry to Senior level"),
            requiredSkills: ensureArray(careerData.requiredSkills || defaults.requiredSkills),
            educationRequirements: safeStringify(careerData.educationRequirements || "Varies by position and employer"),
            reasoning: ["Based on your assessment responses", `Strong match for your ${defaults.requiredSkills[0].toLowerCase()} skills`, `Good fit for your interest in ${defaults.sector.toLowerCase()}`]
          };
        }),
        strengths: ["Analytical Thinking", "Technical Understanding", "Problem Solving", "Attention to Detail"],
        developmentAreas: ["Leadership", "Project Management", "Industry-specific Knowledge"],
        summary: "Based on your assessment, we have identified careers that align with your analytical and technical abilities"
      };
    }
    
    // If the API returns data in a nested structure
    if (apiData.data && apiData.data.recommendations) {
      return transformApiResponse(apiData.data);
    }
    
    // If the API returns success flag with data
    if (apiData.success && apiData.recommendations) {
      return transformApiResponse(apiData);
    }
    
    // Fallback for unexpected API response structure
    return {
      recommendations: [{
        id: 'fallback-1',
        title: 'Software Developer',
        description: 'Design, build, and maintain software applications.',
        matchScore: 85,
        sector: 'Technology',
        averageSalary: '$70,000 - $120,000',
        growthOutlook: 'Excellent',
        location: 'Remote / Various',
        experienceLevel: 'Entry to Senior',
        requiredSkills: ['Programming', 'Problem-solving', 'Logical thinking'],
        educationRequirements: 'Bachelor\'s degree preferred',
        reasoning: 'This career matches your profile based on your assessment responses'
      }],
      strengths: apiData.strengths || apiData.topSkills || apiData.skills || ['Problem-solving', 'Analytical thinking'],
      developmentAreas: apiData.developmentAreas || ['Communication', 'Time management'],
      summary: apiData.summary || 'We found career options that match your profile'
    };
  };

  const generateDescription = (title) => {
    const descriptions = {
      'Software Developer': 'Design, develop, and maintain software applications and systems using various programming languages and technologies.',
      'Data Scientist': 'Analyze complex data sets to extract insights and drive business decisions using statistical methods and machine learning.',
      'Cybersecurity Analyst': 'Protect organizations from cyber threats by monitoring, detecting, and responding to security incidents.',
      'UX/UI Designer': 'Create user-friendly and visually appealing interfaces for web and mobile applications.',
      'Research Scientist': 'Conduct scientific research to advance knowledge in your field and develop new technologies or solutions.'
    };
    return descriptions[title] || `Work as a ${title} in a dynamic and growing field with opportunities for career advancement.`;
  };

  const generateSalaryRange = (title) => {
    const salaryRanges = {
      'Software Developer': '$70,000 - $120,000',
      'Data Scientist': '$80,000 - $140,000',
      'Cybersecurity Analyst': '$75,000 - $130,000',
      'UX/UI Designer': '$60,000 - $110,000',
      'Research Scientist': '$65,000 - $120,000'
    };
    return salaryRanges[title] || '$50,000 - $100,000';
  };

  const generateSkills = (title) => {
    if (!title) return ['Communication', 'Problem-solving', 'Adaptability'];
  
    const techSkills = ['Programming', 'Technical problem-solving', 'System design', 'Analytical thinking'];
    const businessSkills = ['Project management', 'Business analysis', 'Strategic planning', 'Communication'];
    const creativeSkills = ['Design thinking', 'Creative problem-solving', 'Visual communication', 'Innovation'];
  
    if (title.toLowerCase().includes('developer') || 
        title.toLowerCase().includes('engineer') || 
        title.toLowerCase().includes('technical')) {
      return techSkills;
    } else if (title.toLowerCase().includes('manager') || 
               title.toLowerCase().includes('director') || 
               title.toLowerCase().includes('analyst')) {
      return businessSkills;
    } else if (title.toLowerCase().includes('design') || 
               title.toLowerCase().includes('creative') || 
               title.toLowerCase().includes('artist')) {
      return creativeSkills;
    }
  
    // Default fallback
    return ['Communication', 'Problem-solving', 'Adaptability', 'Teamwork'];
  };

  const generateReasoning = (matchReasons, matchScore) => {
    if (matchReasons && Array.isArray(matchReasons)) {
      return `This career matches you because of your ${matchReasons.join(', ')}. With a ${matchScore}% match score, this role aligns well with your profile.`;
    }
    return `This career is a strong match for your skills and interests with a ${matchScore}% compatibility score.`;
  };

  const getPersonalizedAdvice = async (careerId) => {
    try {
      const headers = {};
      if (userInfo.token) {
        headers.Authorization = `Bearer ${userInfo.token}`;
      }
  
      const response = await api.get(`/api/career/advice/${careerId}`, {
        headers
      });
      
      // console.log('Raw advice API response:', response.data); // Log the actual response
      
      // Handle different response structures
      const apiData = response.data.success ? response.data.advice : response.data;
      
      if (!apiData) {
        console.warn('No data returned from advice API');
        return generateMockAdvice();
      }
      
      // Build nextSteps array from the new structured format
      const nextSteps = [];
      
      // Add skill development steps
      if (apiData.skillDevelopment && Array.isArray(apiData.skillDevelopment)) {
        nextSteps.push(...apiData.skillDevelopment.map(skill => 
          `Learn ${skill.skill}: ${skill.resources.join(', ')} (${skill.timeframe || '6 months'})`
        ));
      }
      
      // Add education recommendations
      if (apiData.education && Array.isArray(apiData.education)) {
        nextSteps.push(...apiData.education.map(edu => 
          `${edu.program} at ${edu.provider} (${edu.duration})`
        ));
      }
      
      // Add timeline recommendations
      if (apiData.timeline) {
        if (apiData.timeline.shortTerm && Array.isArray(apiData.timeline.shortTerm)) {
          nextSteps.push(...apiData.timeline.shortTerm.map(step => `Short-term: ${step}`));
        }
        if (apiData.timeline.mediumTerm && Array.isArray(apiData.timeline.mediumTerm)) {
          nextSteps.push(...apiData.timeline.mediumTerm.map(step => `Medium-term: ${step}`));
        }
        if (apiData.timeline.longTerm && Array.isArray(apiData.timeline.longTerm)) {
          nextSteps.push(...apiData.timeline.longTerm.map(step => `Long-term: ${step}`));
        }
      }
      
      // Build resources array
      const resources = [];
      
      // Add skill development resources
      if (apiData.skillDevelopment && Array.isArray(apiData.skillDevelopment)) {
        apiData.skillDevelopment.forEach(skill => {
          if (skill.resources && Array.isArray(skill.resources)) {
            resources.push(...skill.resources.map(resource => 
              `${skill.skill}: ${resource}`
            ));
          }
        });
      }
      
      // Add education resources
      if (apiData.education && Array.isArray(apiData.education)) {
        resources.push(...apiData.education.map(edu => 
          `${edu.program} (${edu.provider})`
        ));
      }
      
      // Ensure we have at least some resources
      if (resources.length === 0) {
        resources.push(
          'Online learning platforms (Coursera, edX)',
          'Industry-specific certification programs',
          'Professional networking events'
        );
      }
      
      return {
        nextSteps: nextSteps.length > 0 ? nextSteps : [
          'Research job opportunities in this field',
          'Develop relevant skills through online courses',
          'Network with professionals in the industry'
        ],
        resources,
        summary: apiData.summary || "Personalized career development advice based on your profile"
      };
      
    } catch (error) {
      console.error('Error fetching personalized advice:', error);
      return generateMockAdvice();
    }
  };
  
  // Helper function for mock data
  const generateMockAdvice = () => {
    return {
      nextSteps: [
        'Research job opportunities in this field',
        'Develop relevant skills through online courses',
        'Build a portfolio showcasing your abilities',
        'Network with professionals in the industry'
      ],
      resources: [
        'Online learning platforms (Coursera, edX)',
        'Industry-specific certification programs',
        'Professional networking events',
        'Relevant books and publications'
      ],
      summary: "Suggested career development path"
    };
  };
  const handleViewDetails = async (career) => {
    if (expandedCareer === career.id) {
      setExpandedCareer(null);
      return;
    }
    
    setExpandedCareer(career.id);
    const advice = await getPersonalizedAdvice(career.id);
    if (advice) {
      setResultsData(prev => ({
        ...prev,
        recommendations: prev.recommendations.map(rec => 
          rec.id === career.id ? { ...rec, personalizedAdvice: advice } : rec
        )
      }));
    }
  };

  const getMatchScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-blue-600 bg-blue-100';
    if (score >= 70) return 'text-purple-600 bg-purple-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getMatchScoreText = (score) => {
    if (score >= 90) return 'Excellent Match';
    if (score >= 80) return 'Great Match';
    if (score >= 70) return 'Good Match';
    if (score >= 60) return 'Fair Match';
    return 'Limited Match';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Analyzing Your Results</h2>
          <p className="text-slate-600">We're generating your personalized career recommendations...</p>
        </div>
      </div>
    );
  }

  if (!resultsData || !resultsData.recommendations || resultsData.recommendations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">No Results Found</h2>
          <p className="text-slate-600 mb-4">We couldn't find your assessment results.</p>
          <button
            onClick={() => navigate('/assessment')}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
          >
            Retake Assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-800">Your Career Results</h1>
                <p className="text-xs sm:text-sm text-slate-600">Based on your assessment responses</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button 
                onClick={() => navigate('/assessment')}
                className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors text-xs sm:text-sm flex-1 sm:flex-initial"
              >
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 rotate-180" />
                <span>Back to Assessment</span>
              </button>
              <button 
                onClick={handleRetakeAssessment}
                className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-medium transition-colors text-xs sm:text-sm flex-1 sm:flex-initial"
                disabled={isRetaking}
              >
                <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isRetaking ? 'animate-spin' : ''}`} />
                <span>{isRetaking ? 'Resetting...' : 'Retake Assessment'}</span>
              </button>
              <button 
                onClick={handleExportPDF}
                className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors text-xs sm:text-sm flex-1 sm:flex-initial"
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-slate-400 border-t-slate-700 rounded-full animate-spin"></div>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Export PDF</span>
                  </>
                )}
              </button>

            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Navigation Tabs */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200 p-2 mb-4 sm:mb-8 overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-2 min-w-max">
            {[
              { id: 'overview', label: 'Overview', icon: Eye },
              { id: 'careers', label: 'Career Matches', icon: Briefcase },
              { id: 'strengths', label: 'Your Strengths', icon: Zap },
              { id: 'development', label: 'Development Areas', icon: TrendingUp }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 ${
                  selectedTab === tab.id
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl p-4 sm:p-8 text-white">
              <div className="flex flex-col sm:flex-row items-start justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
                <div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">Assessment Complete!</h2>
                  <p className="text-blue-100 text-sm sm:text-base md:text-lg">
                    We've analyzed your responses and found {resultsData.recommendations?.length || 0} career matches
                  </p>
                </div>
                <div className="text-left sm:text-right mt-2 sm:mt-0">
                  <div className="text-xl sm:text-2xl font-bold">
                    {resultsData.recommendations?.[0]?.matchScore || 0}%
                  </div>
                  <div className="text-blue-100 text-sm">Top Match Score</div>
                </div>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-3 sm:p-6">
                <p className="text-sm sm:text-base md:text-lg leading-relaxed">
                  {resultsData.summary || "Based on your assessment, we've identified careers that align with your interests, skills, and personality traits."}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800">Key Strengths</h3>
                </div>
                <div className="space-y-2">
                  {resultsData.strengths?.slice(0, 3).map((strength, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-slate-700 text-sm">{strength}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Target className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800">Top Career Match</h3>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-slate-800">
                    {resultsData.recommendations?.[0]?.title || 'No matches found'}
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getMatchScoreColor(resultsData.recommendations?.[0]?.matchScore || 0)}`}>
                      {resultsData.recommendations?.[0]?.matchScore || 0}% Match
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-slate-800">Growth Areas</h3>
                </div>
                <div className="space-y-2">
                  {resultsData.developmentAreas?.slice(0, 2).map((area, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-purple-500" />
                      <span className="text-slate-700 text-sm">{area}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Career Matches Tab */}
        {selectedTab === 'careers' && (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6">Your Career Matches</h2>
            
            {resultsData.recommendations?.map((career, index) => (
              <div key={career.id} className="bg-white/70 backdrop-blur-sm rounded-3xl border border-slate-200 overflow-hidden">
                <div className="p-4 sm:p-6 md:p-8">
                  <div className="flex flex-col sm:flex-row items-start justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold text-base sm:text-lg">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800">{career.title}</h3>
                          <p className="text-slate-600">{career.industry}</p>
                        </div>
                      </div>
                      
                      <p className="text-slate-700 leading-relaxed mb-4">
                        {career.description}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-green-500" />
                          <div>
                            <span className="text-slate-700 font-medium">{career.salaryRange}</span>
                            {career.salaryDetails && (
                              <div className="text-xs text-slate-500 mt-1">
                                {career.salaryDetails.entryLevel && (
                                  <div>Entry: {career.salaryDetails.entryLevel}</div>
                                )}
                                {career.salaryDetails.midLevel && (
                                  <div>Mid: {career.salaryDetails.midLevel}</div>
                                )}
                                {career.salaryDetails.seniorLevel && (
                                  <div>Senior: {career.salaryDetails.seniorLevel}</div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-blue-500" />
                          <span className="text-slate-700">{career.location || 'Various'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-purple-500" />
                          <span className="text-slate-700">{career.experienceLevel || 'All levels'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-left sm:text-right mt-2 sm:mt-0">
                      <div className={`inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full font-bold text-base sm:text-lg ${getMatchScoreColor(career.matchScore)}`}>
                        <Trophy className="w-5 h-5" />
                        {career.matchScore}%
                      </div>
                      <div className="text-slate-600 text-sm mt-1">
                        {getMatchScoreText(career.matchScore)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Skills and Requirements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <Brain className="w-5 h-5 text-blue-500" />
                        Required Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {ensureArray(career.requiredSkills).slice(0, 6).map((skill, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-purple-500" />
                        Education
                      </h4>
                      <p className="text-slate-700">{career.educationRequirements}</p>
                    </div>
                  </div>
                  
                  {/* Match Reasoning */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6">
                    <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      Why This Career Matches You
                    </h4>
                    <p className="text-slate-700 leading-relaxed">{Array.isArray(career.reasoning) ? 
                      career.reasoning.map((reason, idx) => {
                        // Replace underscores with spaces and capitalize each word
                        const formattedReason = reason.replace(/_/g, ' ')
                          .split(' ')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ');
                        return (
                          <span key={idx} className="block mb-1">{formattedReason}</span>
                        );
                      }) : 
                      typeof career.reasoning === 'string' ? 
                        career.reasoning.replace(/_/g, ' ')
                          .split(' ')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ') : 
                        'Good match based on your assessment responses'
                    }</p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleViewDetails(career)}
                      className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl text-sm sm:text-base font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg w-full sm:w-auto"
                    >
                      {expandedCareer === career.id ? (
                        <>
                          Hide Details <ChevronUp className="w-5 h-5" />
                        </>
                      ) : (
                        <>
                          View Personalized Advice <ChevronDown className="w-5 h-5" />
                        </>
                      )}
                    </button>
                    

                  </div>
                </div>
                
                {/* Expanded Details */}
                {expandedCareer === career.id && career.personalizedAdvice && (
  <div className="border-t border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 p-4 sm:p-6 md:p-8">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
      <div>
        <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-green-500" />
          Next Steps for You
        </h4>
        <ul className="space-y-2">
          {career.personalizedAdvice.nextSteps?.map((step, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <ArrowRight className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
              <span className="text-slate-700">{step}</span>
            </li>
          ))}
        </ul>
      </div>
      
      <div>
        <h4 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-500" />
          Recommended Resources
        </h4>
        <ul className="space-y-2">
          {career.personalizedAdvice.resources?.map((resource, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <Star className="w-4 h-4 text-blue-500 mt-1 flex-shrink-0" />
              <span className="text-slate-700">{resource}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
    
    {/* Add summary if available */}
    {career.personalizedAdvice.summary && (
      <div className="mt-6">
        <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          Summary
        </h4>
        <p className="text-slate-700">{career.personalizedAdvice.summary}</p>
      </div>
    )}
  </div>
                )}
              </div>
            ))}
          </div>
)}

        {/* Strengths Tab */}
        {selectedTab === 'strengths' && (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6">Your Key Strengths</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {resultsData.strengths?.map((strength, index) => (
                <div key={index} className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200 p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-slate-800">{strength}</h3>
                  </div>
                  <p className="text-slate-600">
                    This strength will help you excel in roles that require {strength.toLowerCase()}.
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Development Areas Tab */}
        {selectedTab === 'development' && (
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6">Areas for Development</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {resultsData.developmentAreas?.map((area, index) => (
                <div key={index} className="bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200 p-4 sm:p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-slate-800">{area}</h3>
                  </div>
                  <p className="text-slate-600 mb-4">
                    Developing this area will open up more career opportunities and improve your overall performance.
                  </p>
                  
                </div>
              ))}
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default CareerResultsPage;