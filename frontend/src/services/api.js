/**
 * API Service - Centralized API Client
 */

import axios from 'axios';

// Use environment variable or fallback to production backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pathwaygh-backend.onrender.com';

console.log('🔗 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Plan API functions
export const planApi = {
  getStudyPlans: () => api.get('/api/plan/study-plans'),
  getStudyPlan: (id) => api.get(`/api/plan/study-plans/${id}`),
  createStudyPlan: (data) => api.post('/api/plan/study-plans/create', data),
  updateStudyPlan: (id, data) => api.put(`/api/plan/study-plans/${id}`, data),
  deleteStudyPlan: (id) => api.delete(`/api/plan/study-plans/${id}`),
  updateProgress: (id, progress) => api.put(`/api/plan/study-plans/${id}/progress`, { progress }),
  generateSchedule: (id, startDate) => api.get(`/api/plan/study-plans/${id}/schedule?start_date=${startDate}`),
  getRoadmaps: () => api.get('/api/plan/roadmaps'),
  getRoadmap: (id) => api.get(`/api/plan/roadmaps/${id}`),
  getRoadmapByCareer: (career) => api.get(`/api/plan/roadmaps/by-career/${encodeURIComponent(career)}`),
  createRoadmap: (data) => api.post('/api/plan/roadmaps/create', data),
  logStudySession: (userId, data) => api.post(`/api/plan/study-sessions/log?user_id=${userId}`, data),
  getStudySessions: (userId) => api.get(`/api/plan/study-sessions/${userId}`),
  getTemplates: () => api.get('/api/plan/templates'),
};
