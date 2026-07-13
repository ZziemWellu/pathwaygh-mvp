/**
 * API SERVICE - SINGLE SOURCE OF TRUTH
 */

import axios from 'axios';
import { getToken, setToken, clearSession } from '../constants/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pathwaygh-backend.onrender.com';

console.log('🔗 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('pathwaygh_refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refresh_token: refreshToken,
          });
          if (response.data?.token) {
            setToken(response.data.token);
            originalRequest.headers.Authorization = `Bearer ${response.data.token}`;
            return api(originalRequest);
          }
        }
      } catch {
        clearSession();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const extractData = (response) => {
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (data?.data) return data.data;
  if (data?.results) return data.results;
  if (data?.items) return data.items;
  return data;
};

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    REFRESH: '/api/auth/refresh',
  },
  LEARN: {
    COURSES: '/api/learn/courses',
    COURSE: (id) => `/api/learn/courses/${id}`,
    PROGRESS: '/api/learn/progress',
  },
  EXPLORE: {
    CAREERS: '/api/explore/careers',
    CAREER: (id) => `/api/explore/career/${id}`,
    UNIVERSITIES: '/api/explore/universities',
    SCHOLARSHIPS: '/api/explore/scholarships',
  },
  PRACTICE: {
    SUBJECTS: '/api/practice/subjects',
    SUBJECT: (id) => `/api/practice/subject/${id}`,
    QUIZ_START: '/api/practice/quiz/start',
    QUIZ_SUBMIT: '/api/practice/quiz/submit',
  },
  PLAN: {
    STUDY_PLANS: '/api/plan/study-plans',
    PLAN: (id) => `/api/plan/study-plans/${id}`,
    CREATE: '/api/plan/study-plans/create',
    UPDATE: (id) => `/api/plan/study-plans/${id}`,
    DELETE: (id) => `/api/plan/study-plans/${id}`,
    PROGRESS: (id) => `/api/plan/study-plans/${id}/progress`,
    ROADMAPS: '/api/plan/roadmaps',
  },
  DASHBOARD: {
    DATA: (id) => `/api/dashboard/${id}`,
    PROGRESS: '/api/dashboard/progress',
    RECOMMENDATIONS: '/api/dashboard/recommendations',
    ACTIVITY: '/api/dashboard/activity',
    INSIGHTS: '/api/dashboard/insights',
  },
  PROFILE: {
    GET: (id) => `/api/profile/${id}`,
    UPDATE: (id) => `/api/profile/${id}`,
  },
};

export default api;

// Profile API functions
export const profileApi = {
  getProfile: (id) => api.get(`/api/profile/${id}`),
  updateProfile: (id, data) => api.put(`/api/profile/${id}`, data),
  getSavedCareers: (id) => api.get(`/api/profile/${id}/saved-careers`).catch(() => ({ data: [] })),
  getSavedUniversities: (id) => api.get(`/api/profile/${id}/saved-universities`).catch(() => ({ data: [] })),
};

// Add avatar upload helper
export const uploadAvatar = async (userId, file, onProgress) => {
  const formData = new FormData();
  formData.append('user_id', userId);
  formData.append('avatar', file);
  
  return api.post('/api/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    }
  });
};

export const deleteAvatar = async (userId) => {
  return api.delete('/api/profile/avatar', { params: { user_id: userId } });
};
