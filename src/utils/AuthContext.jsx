import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Token utility functions
export const tokenUtils = {
  // Save authentication data
  saveAuthToken: (token, user, rememberMe = false) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    // Save token and user info
    storage.setItem('token', token);
    storage.setItem('userInfo', JSON.stringify(user));
    storage.setItem('rememberMe', rememberMe.toString());
  },

  // Get authentication data
  getAuthToken: () => {
    // Check localStorage first (remember me), then sessionStorage
    let token = localStorage.getItem('token') || sessionStorage.getItem('token');
    let userInfo = localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');
    let rememberMe = localStorage.getItem('rememberMe') === 'true';

    if (userInfo) {
      try {
        userInfo = JSON.parse(userInfo);
      } catch (error) {
        console.error('Error parsing user info:', error);
        userInfo = null;
      }
    }

    return {
      token,
      user: userInfo,
      rememberMe,
      isAuthenticated: !!(token && userInfo)
    };
  },

  // Clear authentication data
  clearAuthToken: () => {
    // Clear from both storages
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    localStorage.removeItem('rememberMe');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userInfo');
    sessionStorage.removeItem('rememberMe');
  },

  // Check if token is expired (basic check)
  isTokenExpired: (token) => {
    if (!token) return true;
    try {
      // Decode JWT token (basic decode without verification)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  },

  // Initialize auth state from storage
  initializeAuth: () => {
    const authData = tokenUtils.getAuthToken();
    if (authData.isAuthenticated && !tokenUtils.isTokenExpired(authData.token)) {
      return {
        isAuthenticated: true,
        user: authData.user,
        token: authData.token,
      };
    } else {
      // Clear expired or invalid data
      tokenUtils.clearAuthToken();
      return {
        isAuthenticated: false,
        user: null,
        token: null,
      };
    }
  }
};

// Initial state
const initialState = {
  userInfo: {
    isAuthenticated: false,
    user: null,
    token: null,
  },
  loading: false,
};

// Action types
const ActionTypes = {
  SET_USER_INFO: 'SET_USER_INFO',
  SET_LOADING: 'SET_LOADING',
  LOGOUT: 'LOGOUT',
  INITIALIZE_AUTH: 'INITIALIZE_AUTH',
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_USER_INFO:
      return {
        ...state,
        userInfo: action.payload,
      };
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    case ActionTypes.LOGOUT:
      tokenUtils.clearAuthToken();
      return {
        ...state,
        userInfo: {
          isAuthenticated: false,
          user: null,
          token: null,
        },
      };
    case ActionTypes.INITIALIZE_AUTH:
      const authState = tokenUtils.initializeAuth();
      return {
        ...state,
        userInfo: authState,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth on mount
  useEffect(() => {
    dispatch({ type: ActionTypes.INITIALIZE_AUTH });
  }, []);

  // Action creators
  const setUserInfo = (userInfo) => {
    dispatch({ type: ActionTypes.SET_USER_INFO, payload: userInfo });
  };

  const setLoading = (loading) => {
    dispatch({ type: ActionTypes.SET_LOADING, payload: loading });
  };

  const logout = () => {
    dispatch({ type: ActionTypes.LOGOUT });
  };

  const initializeAuth = () => {
    dispatch({ type: ActionTypes.INITIALIZE_AUTH });
  };

  const value = {
    // State
    userInfo: state.userInfo,
    loading: state.loading,
    // Actions
    setUserInfo,
    setLoading,
    logout,
    initializeAuth,
    // Utilities
    tokenUtils,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;