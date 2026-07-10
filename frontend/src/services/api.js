/**
 * API Service - Safe addition
 * Will not affect existing code
 */

import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token interceptor (only if token exists)
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pathwaygh_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
