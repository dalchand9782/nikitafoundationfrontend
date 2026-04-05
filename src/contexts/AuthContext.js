import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Configure axios defaults
axios.defaults.withCredentials = true;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = checking, false = not authenticated
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const checkAuth = useCallback(async () => {
    try {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setUser(false);
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${storedToken}` }
      });
      
      setUser(response.data.user);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      setToken(null);
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
    const { user: userData, token: authToken } = response.data;
    
    localStorage.setItem('token', authToken);
    setToken(authToken);
    setUser(userData);
    
    return userData;
  };

  const sendOtp = async (email, purpose = 'signup') => {
    const response = await axios.post(`${API_URL}/api/auth/send-otp`, { email, purpose });
    return response.data;
  };

  const verifyOtp = async (email, otp) => {
    const response = await axios.post(`${API_URL}/api/auth/verify-otp`, { email, otp });
    return response.data;
  };

  const register = async (data) => {
    const response = await axios.post(`${API_URL}/api/auth/register`, data);
    const { user: userData, token: authToken } = response.data;
    
    localStorage.setItem('token', authToken);
    setToken(authToken);
    setUser(userData);
    
    return userData;
  };

  const forgotPassword = async (email) => {
    const response = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
    return response.data;
  };

  const resetPassword = async (email, otp, newPassword) => {
    const response = await axios.post(`${API_URL}/api/auth/reset-password`, {
      email,
      otp,
      new_password: newPassword
    });
    return response.data;
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/api/auth/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setToken(null);
      setUser(false);
    }
  };

  const getAuthHeaders = () => {
    const storedToken = localStorage.getItem('token');
    return storedToken ? { Authorization: `Bearer ${storedToken}` } : {};
  };

  const value = {
    user,
    loading,
    token,
    login,
    logout,
    sendOtp,
    verifyOtp,
    register,
    forgotPassword,
    resetPassword,
    checkAuth,
    getAuthHeaders,
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
