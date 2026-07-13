/**
 * useCourses Hook
 * Manages course data fetching and state
 * FIXED: Comprehensive error handling, loading states, automatic data parsing
 */

import { useState, useEffect, useCallback } from 'react';
import api, { extractArray } from '../services/api';
import { API_ENDPOINTS } from '../constants/api';

export const useCourses = (options = {}) => {
  const {
    autoFetch = true,
    courseId = null,
    userId = null,
  } = options;

  // ============================================================
  // State
  // ============================================================

  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({});
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  // ============================================================
  // Fetch Functions
  // ============================================================

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(API_ENDPOINTS.LEARN.COURSES);
      const data = extractArray(response, 'courses');
      setCourses(data);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch courses';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCourseDetail = useCallback(async (id) => {
    if (!id) {
      setError('Course ID is required');
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.get(API_ENDPOINTS.LEARN.COURSE_DETAIL(id));
      const data = response.data;
      setSelectedCourse(data);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch course details';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProgress = useCallback(async () => {
    try {
      const params = userId ? { user_id: userId } : {};
      const response = await api.get(API_ENDPOINTS.LEARN.PROGRESS, { params });
      setProgress(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch progress:', err);
      setError(err.message || 'Failed to fetch progress');
    }
  }, [userId]);

  const fetchEnrolledCourses = useCallback(async () => {
    try {
      const params = userId ? { user_id: userId } : {};
      const response = await api.get(API_ENDPOINTS.LEARN.ENROLL, { params });
      const data = extractArray(response, 'courses');
      setEnrolledCourses(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch enrolled courses:', err);
    }
  }, [userId]);

  const searchCourses = useCallback(async (query) => {
    if (!query || query.length < 2) {
      return courses;
    }

    setLoading(true);
    try {
      const response = await api.get(API_ENDPOINTS.LEARN.SEARCH, {
        params: { q: query },
      });
      const data = extractArray(response, 'courses');
      return data;
    } catch (err) {
      console.error('Failed to search courses:', err);
      setError(err.message || 'Search failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [courses]);

  const enrollInCourse = useCallback(async (courseId) => {
    try {
      const response = await api.post(API_ENDPOINTS.LEARN.ENROLL, {
        course_id: courseId,
        user_id: userId,
      });
      return response.data;
    } catch (err) {
      console.error('Failed to enroll:', err);
      setError(err.message || 'Failed to enroll in course');
      throw err;
    }
  }, [userId]);

  const completeLesson = useCallback(async (courseId, lessonId) => {
    try {
      const response = await api.post(API_ENDPOINTS.LEARN.COMPLETE_LESSON, {
        course_id: courseId,
        lesson_id: lessonId,
        user_id: userId,
      });
      return response.data;
    } catch (err) {
      console.error('Failed to complete lesson:', err);
      setError(err.message || 'Failed to complete lesson');
      throw err;
    }
  }, [userId]);

  // ============================================================
  // Effects
  // ============================================================

  useEffect(() => {
    if (autoFetch) {
      fetchCourses();
    }
  }, [autoFetch, fetchCourses]);

  useEffect(() => {
    if (courseId) {
      fetchCourseDetail(courseId);
    }
  }, [courseId, fetchCourseDetail]);

  useEffect(() => {
    if (userId && autoFetch) {
      fetchProgress();
      fetchEnrolledCourses();
    }
  }, [userId, autoFetch, fetchProgress, fetchEnrolledCourses]);

  // ============================================================
  // Return
  // ============================================================

  return {
    // Data
    courses,
    selectedCourse,
    progress,
    enrolledCourses,

    // State
    loading,
    error,

    // Actions
    fetchCourses,
    fetchCourseDetail,
    fetchProgress,
    fetchEnrolledCourses,
    searchCourses,
    enrollInCourse,
    completeLesson,

    // Setters
    setSelectedCourse,
    setError,
    setLoading,
  };
};

export default useCourses;
