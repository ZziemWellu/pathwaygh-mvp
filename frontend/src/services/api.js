/**
 * API SERVICE - SINGLE SOURCE OF TRUTH
 */

import axios from 'axios';
import { getToken, clearSession } from '../constants/auth';

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
  (error) => {
    const originalRequest = error.config;
    const wasAuthenticated = !!originalRequest?.headers?.Authorization;
    const isAuthEndpoint = originalRequest?.url?.includes('/api/auth/login') || originalRequest?.url?.includes('/api/auth/register');

    // A 401 on a request that carried a token means that token is dead
    // (expired, or for a since-deleted account) - there is no
    // refresh-token flow in this app (the backend has never issued one),
    // so there's nothing to retry. Leaving the stale token in place would
    // strand the user on an authenticated screen where every request
    // fails the same way forever (isAuthenticated() only checks that a
    // token string exists, not that it's still valid). Clear it and
    // reload so they land back on a clean login screen.
    // isAuthEndpoint is excluded so a wrong-password login attempt (which
    // also 401s) is never mistaken for a dead session - login/register are
    // reached specifically because the user isn't authenticated yet, and
    // must surface their own error inline instead of force-reloading.
    if (error.response?.status === 401 && wasAuthenticated && !isAuthEndpoint) {
      clearSession();
      if (typeof window !== 'undefined') {
        window.location.reload();
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
