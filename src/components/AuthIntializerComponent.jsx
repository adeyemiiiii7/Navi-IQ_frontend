import { useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';

const AuthInitializer = ({ children }) => {
  const { initializeAuth } = useAuth();

  useEffect(() => {
    // Initialize auth state from storage on app startup
    initializeAuth();
  }, [initializeAuth]);

  return children;
};

export default AuthInitializer;