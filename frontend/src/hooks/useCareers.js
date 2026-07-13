/**
 * useCareers Hook
 * Manages career data fetching and state
 * FIXED: Comprehensive error handling, loading states, automatic data parsing
 */

import { useState, useEffect, useCallback } from 'react';
import api, { extractArray } from '../services/api';
import { API_ENDPOINTS } from '../constants/api';

export const useCareers = (options = {}) => {
  const {
    autoFetch = true,
    careerId = null,
    userId = null,
  } = options;

  // ============================================================
  // State
  // ============================================================

  const [careers, setCareers] = useState([]);
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [universities, setUniversities] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [matchedCareers, setMatchedCareers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  // ============================================================
  // Fetch Functions
  // ============================================================

  const fetchCareers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(API_ENDPOINTS.EXPLORE.CAREERS);
      const data = extractArray(response, 'careers');
      setCareers(data);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch careers';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCareerDetail = useCallback(async (id) => {
    if (!id) {
      setError('Career ID is required');
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.get(API_ENDPOINTS.EXPLORE.CAREER_DETAIL(id));
      const data = response.data;
      setSelectedCareer(data);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch career details';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUniversities = useCallback(async () => {
    try {
      const response = await api.get(API_ENDPOINTS.EXPLORE.UNIVERSITIES);
      const data = extractArray(response, 'universities');
      setUniversities(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch universities:', err);
      setError(err.message || 'Failed to fetch universities');
    }
  }, []);

  const fetchScholarships = useCallback(async () => {
    try {
      const response = await api.get(API_ENDPOINTS.EXPLORE.SCHOLARSHIPS);
      const data = extractArray(response, 'scholarships');
      setScholarships(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch scholarships:', err);
      setError(err.message || 'Failed to fetch scholarships');
    }
  }, []);

  const searchCareers = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return [];
    }

    setLoading(true);
    try {
      const response = await api.post(API_ENDPOINTS.EXPLORE.CAREER_SEARCH, { query });
      const data = extractArray(response, 'careers');
      setSearchResults(data);
      return data;
    } catch (err) {
      console.error('Failed to search careers:', err);
      setError(err.message || 'Search failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const matchCareers = useCallback(async (profile) => {
    setLoading(true);
    try {
      const response = await api.post(API_ENDPOINTS.EXPLORE.CAREER_MATCH, {
        user_id: userId,
        profile: profile,
      });
      const data = extractArray(response, 'matches');
      setMatchedCareers(data);
      return data;
    } catch (err) {
      console.error('Failed to match careers:', err);
      setError(err.message || 'Career matching failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const matchScholarships = useCallback(async (profile) => {
    setLoading(true);
    try {
      const response = await api.post(API_ENDPOINTS.EXPLORE.SCHOLARSHIP_MATCH, {
        user_id: userId,
        profile: profile,
      });
      const data = extractArray(response, 'matches');
      return data;
    } catch (err) {
      console.error('Failed to match scholarships:', err);
      setError(err.message || 'Scholarship matching failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ============================================================
  // Effects
  // ============================================================

  useEffect(() => {
    if (autoFetch) {
      fetchCareers();
      fetchUniversities();
      fetchScholarships();
    }
  }, [autoFetch, fetchCareers, fetchUniversities, fetchScholarships]);

  useEffect(() => {
    if (careerId) {
      fetchCareerDetail(careerId);
    }
  }, [careerId, fetchCareerDetail]);

  // ============================================================
  // Return
  // ============================================================

  return {
    // Data
    careers,
    selectedCareer,
    universities,
    scholarships,
    matchedCareers,
    searchResults,

    // State
    loading,
    error,

    // Actions
    fetchCareers,
    fetchCareerDetail,
    fetchUniversities,
    fetchScholarships,
    searchCareers,
    matchCareers,
    matchScholarships,

    // Setters
    setSelectedCareer,
    setError,
    setLoading,
  };
};

export default useCareers;
