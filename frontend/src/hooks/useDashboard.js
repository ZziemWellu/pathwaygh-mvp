/**
 * useDashboard Hook
 * Manages dashboard data fetching and state
 * FIXED: Comprehensive error handling, loading states, automatic data parsing
 */

import { useState, useEffect, useCallback } from 'react';
import api, { extractArray } from '../services/api';
import { API_ENDPOINTS } from '../constants/api';
import { getUserData } from '../constants/auth';

export const useDashboard = (options = {}) => {
  const {
    autoFetch = true,
    userId = null,
  } = options;

  // ============================================================
  // State
  // ============================================================

  const [dashboardData, setDashboardData] = useState(null);
  const [progress, setProgress] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [activity, setActivity] = useState([]);
  const [insights, setInsights] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get current user ID if not provided
  const currentUserId = userId || getUserData()?.id || 'test_user';

  // ============================================================
  // Fetch Functions
  // ============================================================

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.OVERVIEW(currentUserId));
      const data = response.data;
      setDashboardData(data);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch dashboard data';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  const fetchProgress = useCallback(async () => {
    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.PROGRESS, {
        params: { user_id: currentUserId },
      });
      const data = response.data;
      setProgress(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch progress:', err);
      setError(err.message || 'Failed to fetch progress');
    }
  }, [currentUserId]);

  const fetchRecommendations = useCallback(async () => {
    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.RECOMMENDATIONS, {
        params: { user_id: currentUserId },
      });
      const data = extractArray(response, 'recommendations');
      setRecommendations(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setError(err.message || 'Failed to fetch recommendations');
    }
  }, [currentUserId]);

  const fetchActivity = useCallback(async () => {
    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.ACTIVITY, {
        params: { user_id: currentUserId },
      });
      const data = extractArray(response, 'activities');
      setActivity(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch activity:', err);
      setError(err.message || 'Failed to fetch activity');
    }
  }, [currentUserId]);

  const fetchInsights = useCallback(async () => {
    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.INSIGHTS, {
        params: { user_id: currentUserId },
      });
      const data = response.data;
      setInsights(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch insights:', err);
      setError(err.message || 'Failed to fetch insights');
    }
  }, [currentUserId]);

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.STATISTICS, {
        params: { user_id: currentUserId },
      });
      const data = response.data;
      setStatistics(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
    }
  }, [currentUserId]);

  const fetchAchievements = useCallback(async () => {
    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.ACHIEVEMENTS, {
        params: { user_id: currentUserId },
      });
      const data = extractArray(response, 'achievements');
      setAchievements(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch achievements:', err);
    }
  }, [currentUserId]);

  const fetchGoals = useCallback(async () => {
    try {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.GOALS, {
        params: { user_id: currentUserId },
      });
      const data = extractArray(response, 'goals');
      setGoals(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch goals:', err);
    }
  }, [currentUserId]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchDashboard(),
      fetchProgress(),
      fetchRecommendations(),
      fetchActivity(),
      fetchInsights(),
      fetchStatistics(),
      fetchAchievements(),
      fetchGoals(),
    ]);
  }, [
    fetchDashboard,
    fetchProgress,
    fetchRecommendations,
    fetchActivity,
    fetchInsights,
    fetchStatistics,
    fetchAchievements,
    fetchGoals,
  ]);

  // ============================================================
  // Effects
  // ============================================================

  useEffect(() => {
    if (autoFetch) {
      refreshAll();
    }
  }, [autoFetch, refreshAll]);

  // ============================================================
  // Return
  // ============================================================

  return {
    // Data
    dashboardData,
    progress,
    recommendations,
    activity,
    insights,
    statistics,
    achievements,
    goals,

    // State
    loading,
    error,

    // Actions
    fetchDashboard,
    fetchProgress,
    fetchRecommendations,
    fetchActivity,
    fetchInsights,
    fetchStatistics,
    fetchAchievements,
    fetchGoals,
    refreshAll,

    // Setters
    setError,
    setLoading,
  };
};

export default useDashboard;
