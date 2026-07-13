/**
 * usePractice Hook
 * Manages practice/quiz data fetching and state
 * FIXED: Comprehensive error handling, loading states, quiz management
 */

import { useState, useEffect, useCallback } from 'react';
import api, { extractArray } from '../services/api';
import { API_ENDPOINTS } from '../constants/api';

export const usePractice = (options = {}) => {
  const {
    autoFetch = true,
    subjectId = null,
    userId = null,
  } = options;

  // ============================================================
  // State
  // ============================================================

  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [quizResults, setQuizResults] = useState(null);
  const [quizHistory, setQuizHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [waecQuestions, setWaecQuestions] = useState([]);
  const [statistics, setStatistics] = useState(null);

  // ============================================================
  // Fetch Functions
  // ============================================================

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(API_ENDPOINTS.PRACTICE.SUBJECTS);
      const data = extractArray(response, 'subjects');
      setSubjects(data);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch subjects';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSubjectDetail = useCallback(async (id) => {
    if (!id) {
      setError('Subject ID is required');
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await api.get(API_ENDPOINTS.PRACTICE.SUBJECT_DETAIL(id));
      const data = response.data;
      setSelectedSubject(data);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch subject details';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchQuestions = useCallback(async (subjectId = null) => {
    setLoading(true);
    try {
      const url = subjectId
        ? API_ENDPOINTS.PRACTICE.QUESTIONS_BY_SUBJECT(subjectId)
        : API_ENDPOINTS.PRACTICE.QUESTIONS;
      const response = await api.get(url);
      const data = extractArray(response, 'questions');
      setQuestions(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      setError(err.message || 'Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWaecQuestions = useCallback(async (subject = null) => {
    setLoading(true);
    try {
      const params = subject ? { subject } : {};
      const response = await api.get(API_ENDPOINTS.PRACTICE.WAEC_QUESTIONS, { params });
      const data = extractArray(response, 'questions');
      setWaecQuestions(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch WAEC questions:', err);
      setError(err.message || 'Failed to fetch WAEC questions');
    } finally {
      setLoading(false);
    }
  }, []);

  const startQuiz = useCallback(async (subjectId, options = {}) => {
    if (!subjectId) {
      setError('Subject ID is required to start a quiz');
      return null;
    }

    setLoading(true);
    setError(null);
    setQuiz(null);
    setQuizResults(null);

    try {
      const payload = {
        subject_id: subjectId,
        user_id: userId || 'test_user',
        ...options,
      };
      const response = await api.post(API_ENDPOINTS.PRACTICE.QUIZ_START, payload);
      const data = response.data;
      setQuiz(data);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to start quiz';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const submitQuiz = useCallback(async (answers) => {
    if (!quiz) {
      setError('No active quiz to submit');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        quiz_id: quiz.id,
        answers: answers,
        user_id: userId || 'test_user',
      };
      const response = await api.post(API_ENDPOINTS.PRACTICE.QUIZ_SUBMIT, payload);
      const data = response.data;
      setQuizResults(data);
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to submit quiz';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [quiz, userId]);

  const fetchQuizHistory = useCallback(async () => {
    try {
      const params = userId ? { user_id: userId } : {};
      const response = await api.get(API_ENDPOINTS.PRACTICE.QUIZ_HISTORY, { params });
      const data = extractArray(response, 'history');
      setQuizHistory(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch quiz history:', err);
      setError(err.message || 'Failed to fetch quiz history');
    }
  }, [userId]);

  const fetchStatistics = useCallback(async () => {
    try {
      const params = userId ? { user_id: userId } : {};
      const response = await api.get(API_ENDPOINTS.PRACTICE.STATISTICS, { params });
      setStatistics(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch statistics:', err);
      setError(err.message || 'Failed to fetch statistics');
    }
  }, [userId]);

  const startMockExam = useCallback(async (subjectId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(API_ENDPOINTS.PRACTICE.MOCK_EXAM_START, {
        subject_id: subjectId,
        user_id: userId || 'test_user',
      });
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to start mock exam');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const submitMockExam = useCallback(async (answers) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(API_ENDPOINTS.PRACTICE.MOCK_EXAM_SUBMIT, {
        user_id: userId || 'test_user',
        answers: answers,
      });
      return response.data;
    } catch (err) {
      setError(err.message || 'Failed to submit mock exam');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const resetQuiz = useCallback(() => {
    setQuiz(null);
    setQuizResults(null);
    setSelectedSubject(null);
  }, []);

  // ============================================================
  // Effects
  // ============================================================

  useEffect(() => {
    if (autoFetch) {
      fetchSubjects();
    }
  }, [autoFetch, fetchSubjects]);

  useEffect(() => {
    if (subjectId) {
      fetchSubjectDetail(subjectId);
      fetchQuestions(subjectId);
    }
  }, [subjectId, fetchSubjectDetail, fetchQuestions]);

  useEffect(() => {
    if (userId && autoFetch) {
      fetchQuizHistory();
      fetchStatistics();
    }
  }, [userId, autoFetch, fetchQuizHistory, fetchStatistics]);

  // ============================================================
  // Return
  // ============================================================

  return {
    // Data
    subjects,
    selectedSubject,
    quiz,
    quizResults,
    quizHistory,
    questions,
    waecQuestions,
    statistics,

    // State
    loading,
    error,

    // Actions
    fetchSubjects,
    fetchSubjectDetail,
    fetchQuestions,
    fetchWaecQuestions,
    startQuiz,
    submitQuiz,
    fetchQuizHistory,
    fetchStatistics,
    startMockExam,
    submitMockExam,
    resetQuiz,

    // Setters
    setSelectedSubject,
    setError,
    setLoading,
  };
};

export default usePractice;
