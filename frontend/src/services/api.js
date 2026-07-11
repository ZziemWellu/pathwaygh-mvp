/**
 * API Service - Centralized API Client
 * Handles all backend communication
 */

import axios from 'axios';

// Use environment variable or fallback to /api for Vite proxy
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
  (error) => {
    return Promise.reject(error);
  }
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

// Plan API specific functions
export const planApi = {
  getStudyPlans: () => api.get('/plan/study-plans'),
  getStudyPlan: (id) => api.get(`/plan/study-plans/${id}`),
  createStudyPlan: (data) => api.post('/plan/study-plans/create', data),
  updateStudyPlan: (id, data) => api.put(`/plan/study-plans/${id}`, data),
  deleteStudyPlan: (id) => api.delete(`/plan/study-plans/${id}`),
  updateProgress: (id, progress) => api.put(`/plan/study-plans/${id}/progress`, { progress }),
  generateSchedule: (id, startDate) => api.get(`/plan/study-plans/${id}/schedule?start_date=${startDate}`),
  getRoadmaps: () => api.get('/plan/roadmaps'),
  getRoadmap: (id) => api.get(`/plan/roadmaps/${id}`),
  getRoadmapByCareer: (career) => api.get(`/plan/roadmaps/by-career/${encodeURIComponent(career)}`),
  createRoadmap: (data) => api.post('/plan/roadmaps/create', data),
  logStudySession: (userId, data) => api.post(`/plan/study-sessions/log?user_id=${userId}`, data),
  getStudySessions: (userId) => api.get(`/plan/study-sessions/${userId}`),
  getTemplates: () => api.get('/plan/templates'),
};
