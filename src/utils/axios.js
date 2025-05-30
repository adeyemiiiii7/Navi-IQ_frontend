import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://navi-iq.onrender.com',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from local storage or session storage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if this is a login/auth attempt
    const isAuthAttempt = originalRequest.url.includes('/auth/') && 
                         (originalRequest.url.includes('/login') || 
                          originalRequest.url.includes('/signin') ||
                          originalRequest.url.includes('/signup') ||
                          originalRequest.url.includes('/verify'));
    
    // Handle 401 Unauthorized errors (token expired) but NOT for auth attempts
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthAttempt) {
      originalRequest._retry = true;
      
      // Clear tokens and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('rememberMe');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('role');
      sessionStorage.removeItem('userInfo');
      sessionStorage.removeItem('rememberMe');
      
      // Show toast notification
      toast.error('Your session has expired. Please log in again.', {
        duration: 4000,
        position: 'top-center',
      });
      
      // Redirect to login page
      setTimeout(() => {
        window.location.href = '/login?error=session_expired';
      }, 1000);
      
      return Promise.reject(error);
    }
    
    // For auth attempts with 401/403, just pass the error through
    // without triggering session expired logic
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Signup function
  signup: async (userData) => {
    try {
      const response = await api.post('/api/auth/signup', {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
      });
      return response.data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },

  // Email verification function
  verifyEmail: async (email, code) => {
    try {
      const response = await api.post('/api/auth/verify-email', {
        email: email.trim().toLowerCase(),
        code: code.toString(),
      });
      return response.data;
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    }
  },

  // Resend verification code
  resendVerificationCode: async (email) => {
    try {
      const response = await api.post('/api/auth/resend-verification', {
        email: email.trim().toLowerCase(),
      });
      return response.data;
    } catch (error) {
      console.error('Resend verification error:', error);
      throw error;
    }
  },

  // Login function - Updated endpoint to match your backend
  signin: async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });
      return response.data;
    } catch (error) {
      console.error('Signin error:', error);
      throw error;
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/api/auth/profile');
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  // Forgot password function
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/api/auth/forgot-password', {
        email: email.trim().toLowerCase()
      });
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  // Reset password function
  resetPassword: async (token, password) => {
    try {
      const response = await api.post('/api/auth/reset-password', {
        token,
        password
      });
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },
};

export default api;