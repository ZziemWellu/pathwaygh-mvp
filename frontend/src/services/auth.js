/**
 * Authentication Service - Safe addition
 */

import API from './api';

const TOKEN_KEY = 'pathwaygh_token';
const USER_KEY = 'pathwaygh_user';

class AuthService {
  async register(email, full_name, password, role = 'student') {
    try {
      const response = await API.post('/api/auth/register', {
        email,
        full_name,
        password,
        role
      });
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async login(email, password) {
    try {
      const response = await API.post('/api/auth/login', {
        email,
        password
      });
      
      if (response.data.success) {
        this.setToken(response.data.token);
        this.setUser(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  logout() {
    this.clearToken();
    this.clearUser();
  }

  getCurrentUser() {
    try {
      const user = localStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  isAuthenticated() {
    return !!this.getToken();
  }

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  }

  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  getUser() {
    return this.getCurrentUser();
  }

  clearUser() {
    localStorage.removeItem(USER_KEY);
  }
}

export default new AuthService();
