import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../utils/axios';
const ProtectedRoute = ({ children, requireCompleteProfile = false }) => {
  const { userInfo } = useAuth();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [redirectPath, setRedirectPath] = useState('/login');
  
  // Special handling for results page
  const isResultsPage = location.pathname === '/results';

  useEffect(() => {
    const checkAccess = async () => {
      // If not authenticated, redirect to login
      if (!userInfo.isAuthenticated) {
        setRedirectPath('/login');
        setHasAccess(false);
        setIsLoading(false);
        return;
      }
      
      // For results page, check if the user has completed the assessment
      if (isResultsPage) {
        try {
          const response = await api.get('/api/questions/resume');
          const { redirectTo } = response.data;
          
          if (redirectTo === 'results') {
            // User has completed the assessment and can view results
            setHasAccess(true);
          } else {
            // User hasn't completed the assessment
            setRedirectPath('/assessment');
            setHasAccess(false);
            toast.error('Please complete the assessment to view results', {
              duration: 4000,
              position: 'top-center',
            });
          }
        } catch (error) {
          // If there's an error, default to allowing access
          // This prevents infinite redirects in case of API issues
          setHasAccess(true);
        }
      } else {
        // For other protected routes
        setHasAccess(true);
      }
      
      setIsLoading(false);
    };
    
    checkAccess();
  }, [userInfo.isAuthenticated, isResultsPage, location.pathname]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect if no access
  if (!hasAccess) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;