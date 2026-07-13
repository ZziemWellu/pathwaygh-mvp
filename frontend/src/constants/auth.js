/**
 * AUTH CONSTANTS - SINGLE SOURCE OF TRUTH
 */

export const STORAGE_KEYS = {
  TOKEN: 'pathwaygh_token',
  USER: 'pathwaygh_user',
  REFRESH_TOKEN: 'pathwaygh_refresh_token',
};

export const TOKEN_KEY = STORAGE_KEYS.TOKEN;
export const USER_KEY = STORAGE_KEYS.USER;
export const REFRESH_TOKEN_KEY = STORAGE_KEYS.REFRESH_TOKEN;

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);
export const setRefreshToken = (token) => localStorage.setItem(REFRESH_TOKEN_KEY, token);
export const removeRefreshToken = () => localStorage.removeItem(REFRESH_TOKEN_KEY);

export const getUser = () => {
  const data = localStorage.getItem(USER_KEY);
  if (!data) return null;
  try { return JSON.parse(data); } catch { return null; }
};

export const setUser = (user) => {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const removeUser = () => localStorage.removeItem(USER_KEY);

export const isAuthenticated = () => !!getToken();

export const clearSession = () => {
  removeToken();
  removeRefreshToken();
  removeUser();
};

export const login = (userData, token, refreshToken) => {
  if (token) setToken(token);
  if (refreshToken) setRefreshToken(refreshToken);
  if (userData) setUser(userData);
  return true;
};

export const logout = () => {
  clearSession();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
  return true;
};

export default {
  STORAGE_KEYS,
  TOKEN_KEY,
  USER_KEY,
  REFRESH_TOKEN_KEY,
  getToken,
  setToken,
  removeToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
  getUser,
  setUser,
  removeUser,
  isAuthenticated,
  clearSession,
  login,
  logout,
};
