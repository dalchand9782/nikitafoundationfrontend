import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

// Request interceptor to add auth header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Format API error for display
export function formatApiError(error) {
  const detail = error.response?.data?.detail;
  if (detail == null) return 'Something went wrong. Please try again.';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((e) => (e && typeof e.msg === 'string' ? e.msg : JSON.stringify(e))).filter(Boolean).join(' ');
  }
  if (detail && typeof detail.msg === 'string') return detail.msg;
  return String(detail);
}

// Dashboard APIs
export const getDashboardStats = () => api.get('/dashboard/stats');
export const getRecentActivities = () => api.get('/dashboard/recent');

// Loan APIs
export const getLoans = (params) => api.get('/loans', { params });
export const getLoan = (id) => api.get(`/loans/${id}`);
export const createLoan = (data) => api.post('/loans', data);
export const searchLoans = (query) => api.get(`/loans/search/${query}`);

// EMI APIs
export const markEmiPaid = (data) => api.post('/emi/pay', data);
export const editEmi = (data) => api.put('/emi/edit', data);
export const getEmiSchedule = (loanId) => api.get(`/emi/schedule/${loanId}`);
export const getEmiHistory = (loanId) => api.get(`/emi/history/${loanId}`);
export const getDailyCollections = (params) => api.get('/collections/daily', { params });

// User APIs
export const getUsers = () => api.get('/users');
export const createUser = (data) => api.post('/users', data);
export const updateUser = (id, data) => api.put(`/users/${id}`, data);
export const deleteUser = (id) => api.delete(`/users/${id}`);

// Settings APIs
export const getSmtpSettings = () => api.get('/settings/smtp');
export const saveSmtpSettings = (data) => api.post('/settings/smtp', data);
export const testSmtp = () => api.post('/settings/smtp/test');
export const getLogo = () => api.get('/settings/logo');
export const uploadLogo = (data) => api.post('/settings/logo', data);

export default api;
