#!/bin/bash

echo "=========================================="
echo "🚀 PATHWAY AI - COMPLETE INSTALLATION"
echo "=========================================="

# ============================================
# STEP 1: CLEANUP DUPLICATES
# ============================================
echo ""
echo "🧹 Step 1: Cleaning up duplicates..."

# Remove duplicate files
rm -f frontend/src/services/auth.js 2>/dev/null
rm -f frontend/src/constants/api.js 2>/dev/null

# Remove duplicate/conflicting modules
rm -rf frontend/src/modules/admin 2>/dev/null
rm -rf frontend/src/modules/opportunities 2>/dev/null
rm -rf frontend/src/modules/school 2>/dev/null
rm -rf frontend/src/modules/student 2>/dev/null
rm -rf frontend/src/modules/universities 2>/dev/null
rm -rf frontend/src/modules/scholarships 2>/dev/null
rm -rf frontend/src/modules/career-match 2>/dev/null
rm -rf frontend/src/modules/home 2>/dev/null

echo "✅ Cleanup complete"

# ============================================
# STEP 2: CREATE DIRECTORY STRUCTURE
# ============================================
echo ""
echo "📁 Step 2: Creating directory structure..."

mkdir -p frontend/src/constants
mkdir -p frontend/src/hooks
mkdir -p frontend/src/services
mkdir -p frontend/src/modules/learn
mkdir -p frontend/src/modules/explore
mkdir -p frontend/src/modules/practice
mkdir -p frontend/src/modules/dashboard
mkdir -p frontend/src/modules/plan
mkdir -p frontend/src/modules/profile
mkdir -p frontend/src/components/auth
mkdir -p frontend/src/components/common

echo "✅ Directories created"

# ============================================
# STEP 3: CREATE AUTH CONSTANTS
# ============================================
echo ""
echo "📄 Step 3: Creating auth constants..."

cat > frontend/src/constants/auth.js << 'AUTH_EOF'
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
AUTH_EOF

echo "✅ auth.js created"

# ============================================
# STEP 4: CREATE API SERVICE
# ============================================
echo ""
echo "📄 Step 4: Creating API service..."

cat > frontend/src/services/api.js << 'API_EOF'
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
API_EOF

echo "✅ api.js created"

# ============================================
# STEP 5: CREATE DASHBOARD MODULE
# ============================================
echo ""
echo "📄 Step 5: Creating Dashboard module..."

cat > frontend/src/modules/dashboard/DashboardModule.jsx << 'DASH_EOF'
import React, { useState, useEffect } from 'react';
import api, { extractData, ENDPOINTS } from '../../services/api';
import { getUser } from '../../constants/auth';

const DashboardModule = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [activity, setActivity] = useState([]);
  const [insights, setInsights] = useState(null);
  
  const user = getUser();
  const userId = user?.id || 'test_user';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [progressRes, recsRes, activityRes, insightsRes] = await Promise.all([
        api.get(ENDPOINTS.DASHBOARD.PROGRESS, { params: { user_id: userId } }),
        api.get(ENDPOINTS.DASHBOARD.RECOMMENDATIONS, { params: { user_id: userId } }),
        api.get(ENDPOINTS.DASHBOARD.ACTIVITY, { params: { user_id: userId } }),
        api.get(ENDPOINTS.DASHBOARD.INSIGHTS, { params: { user_id: userId } }),
      ]);

      setProgress(progressRes.data);
      setRecommendations(extractData(recsRes) || []);
      setActivity(extractData(activityRes) || []);
      setInsights(insightsRes.data);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>📊 Dashboard</h2>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>📊 Dashboard</h2>
        <p style={{ color: 'red' }}>⚠️ {error}</p>
        <button onClick={fetchDashboardData}>Retry</button>
      </div>
    );
  }

  const currentCourses = progress?.current_courses || [];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a5f2b, #2d8a4e)',
        color: 'white',
        padding: '24px 30px',
        borderRadius: '16px',
        marginBottom: '30px',
      }}>
        <h1 style={{ margin: 0 }}>👋 {getGreeting()}, {user?.name || 'Student'}!</h1>
        <p style={{ opacity: 0.9, margin: '8px 0 0' }}>
          Your AI-powered education and career journey continues.
        </p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>📖 Continue Learning</h2>
        {currentCourses.length > 0 ? (
          currentCourses.slice(0, 3).map((course, i) => (
            <div key={i} style={{
              padding: '16px',
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              marginBottom: '12px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>{course.title}</h4>
                <span style={{ fontSize: '12px', background: '#e8f5e9', padding: '2px 10px', borderRadius: '12px' }}>
                  {course.level}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                <div style={{ flex: 1, height: '6px', background: '#f0f0f0', borderRadius: '3px' }}>
                  <div style={{ width: `${course.progress || 0}%`, height: '100%', background: '#1a5f2b', borderRadius: '3px' }} />
                </div>
                <span style={{ fontSize: '12px', color: '#888' }}>{course.progress || 0}%</span>
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: '#888' }}>No courses in progress. Start learning today!</p>
        )}
      </div>

      {recommendations.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2>🤖 Today's AI Recommendation</h2>
          <div style={{
            padding: '24px',
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
          }}>
            <h3 style={{ color: '#1a5f2b', margin: '0 0 8px 0' }}>
              {recommendations[0]?.title || 'Explore Careers'}
            </h3>
            <p style={{ color: '#666' }}>{recommendations[0]?.description}</p>
            {recommendations[0]?.confidence && (
              <div style={{ display: 'inline-block', padding: '4px 12px', background: '#e8f5e9', borderRadius: '12px', fontSize: '13px' }}>
                Match: {recommendations[0].confidence}%
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ marginBottom: '30px' }}>
        <h2>🚀 Quick Navigation</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
          {['📚 Learn', '🎯 Career Match', '🏛️ Universities', '💰 Scholarships', '🤝 Community'].map((item) => (
            <div key={item} style={{
              padding: '16px',
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              textAlign: 'center',
              cursor: 'pointer',
            }}>
              {item}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>📋 Recent Activity</h2>
        {activity.length > 0 ? (
          activity.slice(0, 3).map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              marginBottom: '8px',
            }}>
              <span style={{ fontSize: '20px' }}>
                {item.type === 'lesson' ? '✅' : item.type === 'ai' ? '🤖' : '💾'}
              </span>
              <div style={{ flex: 1 }}>
                <div>{item.title || item.description}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  {item.time ? new Date(item.time).toLocaleDateString() : 'Recently'}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: '#888' }}>No recent activity.</p>
        )}
      </div>

      {insights && (
        <div>
          <h2>🧠 AI Insights</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: '#888' }}>📊 Aggregate</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a5f2b' }}>{insights.aggregate || 12}</div>
            </div>
            <div style={{ padding: '16px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: '#888' }}>🎓 Admission Chance</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a5f2b' }}>{insights.admission_chance || 72}%</div>
            </div>
            <div style={{ padding: '16px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: '#888' }}>⚠️ Weak Subjects</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a5f2b' }}>
                {insights.weak_subjects?.join(', ') || 'None'}
              </div>
            </div>
            <div style={{ padding: '16px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: '#888' }}>💡 Suggested Lessons</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1a5f2b' }}>
                {insights.suggested_lessons?.join(', ') || 'None'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardModule;
DASH_EOF

echo "✅ DashboardModule.jsx created"

# ============================================
# STEP 6: CREATE LEARN MODULE
# ============================================
echo ""
echo "📄 Step 6: Creating Learn module..."

cat > frontend/src/modules/learn/LearnModule.jsx << 'LEARN_EOF'
import React, { useState, useEffect } from 'react';
import api, { extractData, ENDPOINTS } from '../../services/api';

const LearnModule = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(ENDPOINTS.LEARN.COURSES);
      const data = extractData(response);
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Learn error:', err);
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>📚 Learn</h2>
        <p>Loading courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>📚 Learn</h2>
        <p style={{ color: 'red' }}>⚠️ {error}</p>
        <button onClick={fetchCourses}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>📚 Learn</h2>
        <span style={{ color: '#888' }}>{courses.length} courses available</span>
      </div>

      {courses.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No courses available yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {courses.map((course) => (
            <div
              key={course.id}
              onClick={() => setSelectedCourse(course)}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                padding: '20px',
                background: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ color: '#1a5f2b', margin: '0 0 8px 0' }}>{course.title}</h3>
                {course.level && (
                  <span style={{ background: '#e8f5e9', padding: '2px 10px', borderRadius: '12px', fontSize: '11px' }}>
                    {course.level.toUpperCase()}
                  </span>
                )}
              </div>
              {course.subject && (
                <span style={{ background: '#f0f0f0', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', display: 'inline-block' }}>
                  {course.subject}
                </span>
              )}
              <p style={{ color: '#555', fontSize: '14px', margin: '12px 0' }}>
                {course.description}
              </p>
              <div style={{ fontSize: '12px', color: '#888' }}>
                📖 {course.modules?.length || 0} modules • {course.lesson_count || 0} lessons
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedCourse && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setSelectedCourse(null)}
        >
          <div
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '16px',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{ float: 'right', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
              onClick={() => setSelectedCourse(null)}
            >
              ✕
            </button>
            <h2 style={{ color: '#1a5f2b' }}>{selectedCourse.title}</h2>
            <p>{selectedCourse.description}</p>
            {selectedCourse.modules?.length > 0 && (
              <div>
                <h4>📖 Modules</h4>
                {selectedCourse.modules.map((module, i) => (
                  <div key={i} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 'bold' }}>{module.title}</div>
                    <div style={{ fontSize: '13px', color: '#666' }}>{module.description}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{module.lessons?.length || 0} lessons</div>
                  </div>
                ))}
              </div>
            )}
            <button
              style={{ marginTop: '20px', padding: '10px 20px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%' }}
              onClick={() => setSelectedCourse(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearnModule;
LEARN_EOF

echo "✅ LearnModule.jsx created"

# ============================================
# STEP 7: CREATE EXPLORE MODULE
# ============================================
echo ""
echo "📄 Step 7: Creating Explore module..."

cat > frontend/src/modules/explore/ExploreModule.jsx << 'EXPLORE_EOF'
import React, { useState, useEffect } from 'react';
import api, { extractData, ENDPOINTS } from '../../services/api';

const ExploreModule = () => {
  const [careers, setCareers] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [activeTab, setActiveTab] = useState('careers');

  useEffect(() => {
    fetchExploreData();
  }, []);

  const fetchExploreData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [careersRes, uniRes] = await Promise.all([
        api.get(ENDPOINTS.EXPLORE.CAREERS),
        api.get(ENDPOINTS.EXPLORE.UNIVERSITIES).catch(() => ({ data: [] })),
      ]);
      setCareers(extractData(careersRes) || []);
      setUniversities(extractData(uniRes) || []);
    } catch (err) {
      console.error('Explore error:', err);
      setError(err.message || 'Failed to load explore data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>🔍 Explore</h2>
        <p>Loading explore data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>🔍 Explore</h2>
        <p style={{ color: 'red' }}>⚠️ {error}</p>
        <button onClick={fetchExploreData}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>🔍 Explore</h2>
        <span style={{ color: '#888' }}>{careers.length} careers • {universities.length} universities</span>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e0e0e0', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveTab('careers')}
          style={{
            padding: '8px 20px',
            background: activeTab === 'careers' ? '#1a5f2b' : 'transparent',
            color: activeTab === 'careers' ? 'white' : '#333',
            border: activeTab === 'careers' ? 'none' : '1px solid #e0e0e0',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          💼 Careers ({careers.length})
        </button>
        <button
          onClick={() => setActiveTab('universities')}
          style={{
            padding: '8px 20px',
            background: activeTab === 'universities' ? '#1a5f2b' : 'transparent',
            color: activeTab === 'universities' ? 'white' : '#333',
            border: activeTab === 'universities' ? 'none' : '1px solid #e0e0e0',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
        >
          🏛️ Universities ({universities.length})
        </button>
      </div>

      {activeTab === 'careers' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {careers.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#888', gridColumn: '1 / -1' }}>No careers available.</p>
          ) : (
            careers.map((career) => (
              <div
                key={career.id}
                onClick={() => setSelectedCareer(career)}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  padding: '20px',
                  background: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <h3 style={{ color: '#1a5f2b', margin: '0 0 8px 0' }}>{career.title}</h3>
                {career.category && (
                  <span style={{ background: '#e8f5e9', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', display: 'inline-block' }}>
                    {career.category}
                  </span>
                )}
                <p style={{ color: '#555', fontSize: '14px', margin: '12px 0' }}>
                  {career.description}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'universities' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {universities.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#888', gridColumn: '1 / -1' }}>No universities available.</p>
          ) : (
            universities.map((uni) => (
              <div key={uni.id} style={{ border: '1px solid #e0e0e0', borderRadius: '12px', padding: '20px', background: 'white' }}>
                <h3 style={{ color: '#1a5f2b', margin: '0 0 8px 0' }}>{uni.name}</h3>
                {uni.location && <div style={{ fontSize: '13px', color: '#666' }}>📍 {uni.location}</div>}
                {uni.cutoff && <div style={{ fontSize: '13px', color: '#666' }}>Cutoff: {uni.cutoff}</div>}
              </div>
            ))
          )}
        </div>
      )}

      {selectedCareer && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setSelectedCareer(null)}
        >
          <div
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '16px',
              maxWidth: '500px',
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{ float: 'right', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
              onClick={() => setSelectedCareer(null)}
            >
              ✕
            </button>
            <h2 style={{ color: '#1a5f2b' }}>{selectedCareer.title}</h2>
            {selectedCareer.category && (
              <span style={{ background: '#e8f5e9', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', display: 'inline-block' }}>
                {selectedCareer.category}
              </span>
            )}
            <p style={{ color: '#555', margin: '12px 0' }}>{selectedCareer.description}</p>
            <button
              style={{ marginTop: '20px', padding: '10px 20px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%' }}
              onClick={() => setSelectedCareer(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExploreModule;
EXPLORE_EOF

echo "✅ ExploreModule.jsx created"

# ============================================
# STEP 8: CREATE PRACTICE MODULE
# ============================================
echo ""
echo "📄 Step 8: Creating Practice module..."

cat > frontend/src/modules/practice/PracticeModule.jsx << 'PRACTICE_EOF'
import React, { useState, useEffect } from 'react';
import api, { extractData, ENDPOINTS } from '../../services/api';

const PracticeModule = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(ENDPOINTS.PRACTICE.SUBJECTS);
      const data = extractData(response);
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Practice error:', err);
      setError(err.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async (subjectId) => {
    setQuiz(null);
    setQuizResults(null);
    setQuizAnswers({});
    setCurrentQuestion(0);
    try {
      const response = await api.post(ENDPOINTS.PRACTICE.QUIZ_START, {
        subject_id: subjectId,
        user_id: 'test_user',
      });
      setQuiz(response.data);
    } catch (err) {
      console.error('Quiz start error:', err);
      setError(err.message || 'Failed to start quiz');
    }
  };

  const submitQuiz = async () => {
    try {
      const response = await api.post(ENDPOINTS.PRACTICE.QUIZ_SUBMIT, {
        quiz_id: quiz?.id,
        answers: quizAnswers,
        user_id: 'test_user',
      });
      setQuizResults(response.data);
    } catch (err) {
      console.error('Quiz submit error:', err);
      setError(err.message || 'Failed to submit quiz');
    }
  };

  const handleAnswer = (questionIndex, answer) => {
    setQuizAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const resetQuiz = () => {
    setQuiz(null);
    setQuizResults(null);
    setQuizAnswers({});
    setCurrentQuestion(0);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>✍️ Practice</h2>
        <p>Loading subjects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>✍️ Practice</h2>
        <p style={{ color: 'red' }}>⚠️ {error}</p>
        <button onClick={fetchSubjects}>Retry</button>
      </div>
    );
  }

  if (quiz) {
    const questions = quiz.questions || [];
    const totalQuestions = questions.length;
    const currentQ = questions[currentQuestion];

    if (quizResults) {
      return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
          <h2>📊 Quiz Results</h2>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#888' }}>Score</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a5f2b' }}>{quizResults.score || 0}%</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#888' }}>Correct</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a5f2b' }}>{quizResults.correct || 0}/{totalQuestions}</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#888' }}>Time</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a5f2b' }}>{quizResults.time_spent || 0}s</div>
              </div>
            </div>
            <button
              onClick={resetQuiz}
              style={{ padding: '10px 20px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%' }}
            >
              Done
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>📝 Quiz</h2>
          <button
            onClick={resetQuiz}
            style={{ padding: '8px 16px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            ✕ Close
          </button>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <span>Question {currentQuestion + 1} of {totalQuestions}</span>
          <div style={{ height: '6px', background: '#f0f0f0', borderRadius: '3px', marginTop: '8px' }}>
            <div style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%`, height: '100%', background: '#1a5f2b', borderRadius: '3px' }} />
          </div>
        </div>

        {currentQ && (
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
            <h3>{currentQ.question}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              {currentQ.options?.map((option, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(currentQuestion, option)}
                  style={{
                    padding: '12px 16px',
                    background: quizAnswers[currentQuestion] === option ? '#e8f5e9' : '#f5f5f5',
                    border: quizAnswers[currentQuestion] === option ? '2px solid #1a5f2b' : '1px solid #e0e0e0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <button
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
                style={{
                  padding: '10px 20px',
                  background: currentQuestion === 0 ? '#f0f0f0' : '#1a5f2b',
                  color: currentQuestion === 0 ? '#888' : 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                ← Previous
              </button>
              {currentQuestion === totalQuestions - 1 ? (
                <button
                  onClick={submitQuiz}
                  style={{ padding: '10px 20px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Submit Quiz ✓
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestion(prev => Math.min(totalQuestions - 1, prev + 1))}
                  style={{ padding: '10px 20px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>✍️ Practice</h2>
        <span style={{ color: '#888' }}>{subjects.length} subjects available</span>
      </div>

      {subjects.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No practice subjects available.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
          {subjects.map((subject) => (
            <div
              key={subject.id}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                padding: '24px',
                background: 'white',
                textAlign: 'center',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ fontSize: '48px' }}>{subject.icon || '📚'}</div>
              <h3 style={{ color: '#1a5f2b' }}>{subject.name}</h3>
              {subject.topics && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginBottom: '16px' }}>
                  {subject.topics.slice(0, 3).map((topic, i) => (
                    <span key={i} style={{ background: '#f0f0f0', padding: '4px 10px', borderRadius: '12px', fontSize: '11px' }}>
                      {topic}
                    </span>
                  ))}
                </div>
              )}
              <button
                onClick={() => startQuiz(subject.id)}
                style={{ padding: '10px 24px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                🚀 Start Quiz
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PracticeModule;
PRACTICE_EOF

echo "✅ PracticeModule.jsx created"

# ============================================
# STEP 9: CREATE PLAN AND PROFILE MODULES
# ============================================
echo ""
echo "📄 Step 9: Creating Plan and Profile modules..."

cat > frontend/src/modules/plan/PlanModule.jsx << 'PLAN_EOF'
import React from 'react';

const PlanModule = () => {
  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <h2>📋 Plan</h2>
      <p style={{ color: '#888' }}>Study planner coming soon!</p>
    </div>
  );
};

export default PlanModule;
PLAN_EOF

cat > frontend/src/modules/profile/ProfileModule.jsx << 'PROFILE_EOF'
import React from 'react';

const ProfileModule = () => {
  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <h2>👤 Profile</h2>
      <p style={{ color: '#888' }}>Profile settings coming soon!</p>
    </div>
  );
};

export default ProfileModule;
PROFILE_EOF

echo "✅ PlanModule.jsx and ProfileModule.jsx created"

# ============================================
# STEP 10: CREATE APP.JSX
# ============================================
echo ""
echo "📄 Step 10: Creating App.jsx..."

cat > frontend/src/App.jsx << 'APP_EOF'
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getUser, isAuthenticated, login as authLogin, logout as authLogout } from './constants/auth';
import DashboardModule from './modules/dashboard/DashboardModule';
import LearnModule from './modules/learn/LearnModule';
import ExploreModule from './modules/explore/ExploreModule';
import PracticeModule from './modules/practice/PracticeModule';
import PlanModule from './modules/plan/PlanModule';
import ProfileModule from './modules/profile/ProfileModule';
import Login from './components/auth/Login';
import Register from './components/auth/Register';

const App = () => {
  const [user, setUser] = useState(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(true);

  useEffect(() => {
    const userData = getUser();
    if (userData && isAuthenticated()) {
      setUser(userData);
      setIsAuth(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    authLogin(userData, token);
    setUser(userData);
    setIsAuth(true);
  };

  const handleLogout = () => {
    authLogout();
    setUser(null);
    setIsAuth(false);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>;
  }

  if (!isAuth) {
    return (
      <div style={{ maxWidth: '400px', margin: '40px auto', padding: '20px' }}>
        <header style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#1a5f2b' }}>🇬🇭 Pathway AI</h1>
          <p style={{ color: '#888' }}>AI-Powered Education & Career Ecosystem • Ghana</p>
        </header>
        {showLogin ? (
          <Login onSuccess={handleLogin} />
        ) : (
          <Register onSuccess={() => setShowLogin(true)} />
        )}
        <p style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            onClick={() => setShowLogin(!showLogin)}
            style={{ background: 'none', border: 'none', color: '#1a5f2b', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {showLogin ? 'Need an account? Register' : 'Already have an account? Login'}
          </button>
        </p>
        <footer style={{ textAlign: 'center', marginTop: '40px', padding: '20px', color: '#888', borderTop: '1px solid #eee' }}>
          <p>© 2026 Pathway AI | Built for Ghana</p>
        </footer>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #e0e0e0' }}>
          <div>
            <h1 style={{ color: '#1a5f2b', fontSize: '24px', margin: 0 }}>🇬🇭 Pathway AI</h1>
            <span style={{ fontSize: '12px', color: '#888' }}>AI-Powered Education & Career Ecosystem • Ghana</span>
          </div>
          <div>
            <span style={{ marginRight: '12px', color: '#555' }}>👤 {user?.role || 'Student'}</span>
            <button onClick={handleLogout} style={{ padding: '6px 16px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
              Logout 👋
            </button>
          </div>
        </header>

        <nav style={{ display: 'flex', gap: '20px', padding: '12px 0', borderBottom: '1px solid #e0e0e0' }}>
          <a href="/" style={{ color: '#1a5f2b', textDecoration: 'none' }}>🏠 Home</a>
          <a href="/learn" style={{ color: '#333', textDecoration: 'none' }}>📚 Learn</a>
          <a href="/explore" style={{ color: '#333', textDecoration: 'none' }}>🔍 Explore</a>
          <a href="/practice" style={{ color: '#333', textDecoration: 'none' }}>✍️ Practice</a>
          <a href="/plan" style={{ color: '#333', textDecoration: 'none' }}>📋 Plan</a>
          <a href="/profile" style={{ color: '#333', textDecoration: 'none' }}>👤 Profile</a>
        </nav>

        <main style={{ padding: '20px 0' }}>
          <Routes>
            <Route path="/" element={<DashboardModule />} />
            <Route path="/home" element={<DashboardModule />} />
            <Route path="/learn" element={<LearnModule />} />
            <Route path="/explore" element={<ExploreModule />} />
            <Route path="/practice" element={<PracticeModule />} />
            <Route path="/plan" element={<PlanModule />} />
            <Route path="/profile" element={<ProfileModule />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <footer style={{ textAlign: 'center', padding: '20px', color: '#888', borderTop: '1px solid #e0e0e0' }}>
          <p>© 2026 Pathway AI | Built for Ghana</p>
        </footer>
      </div>
    </BrowserRouter>
  );
};

export default App;
APP_EOF

echo "✅ App.jsx created"

# ============================================
# STEP 11: CREATE AUTH COMPONENTS
# ============================================
echo ""
echo "📄 Step 11: Creating Login and Register components..."

mkdir -p frontend/src/components/auth

cat > frontend/src/components/auth/Login.jsx << 'LOGIN_EOF'
import React, { useState } from 'react';
import api from '../../services/api';

const Login = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/api/auth/login', { email, password });
      if (response.data?.success) {
        onSuccess(response.data.user, response.data.token);
      } else {
        setError(response.data?.message || 'Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2 style={{ color: '#1a5f2b', textAlign: 'center' }}>Welcome Back</h2>
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
            placeholder="your@email.com"
          />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: '#1a5f2b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;
LOGIN_EOF

cat > frontend/src/components/auth/Register.jsx << 'REGISTER_EOF'
import React, { useState } from 'react';
import api from '../../services/api';

const Register = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/api/auth/register', { email, password, name });
      if (response.data?.success) {
        onSuccess();
      } else {
        setError(response.data?.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2 style={{ color: '#1a5f2b', textAlign: 'center' }}>Create Account</h2>
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
            placeholder="Your Name"
          />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
            placeholder="your@email.com"
          />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: '#1a5f2b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default Register;
REGISTER_EOF

echo "✅ Login.jsx and Register.jsx created"

# ============================================
# STEP 12: ENVIRONMENT FILES
# ============================================
echo ""
echo "📄 Step 12: Creating environment files..."

cat > frontend/.env.production << 'ENV_PROD_EOF'
VITE_API_URL=https://pathwaygh-backend.onrender.com
ENV_PROD_EOF

cat > frontend/.env.local << 'ENV_LOCAL_EOF'
VITE_API_URL=http://localhost:8001
ENV_LOCAL_EOF

echo "✅ Environment files created"

# ============================================
# STEP 13: FINAL VERIFICATION
# ============================================
echo ""
echo "=========================================="
echo "🔍 FINAL VERIFICATION"
echo "=========================================="

echo ""
echo "Constants:"
ls -la frontend/src/constants/

echo ""
echo "Hooks:"
ls -la frontend/src/hooks/

echo ""
echo "Services:"
ls -la frontend/src/services/

echo ""
echo "Modules:"
ls -la frontend/src/modules/

echo ""
echo "Environment:"
ls -la frontend/.env*

echo ""
echo "=========================================="
echo "✅ INSTALLATION COMPLETE!"
echo "=========================================="
echo ""
echo "To start the application:"
echo "  cd frontend && npm run dev"
echo ""
echo "Then open: http://localhost:5173"
echo "=========================================="

