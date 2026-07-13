import { useState, useEffect } from 'react';
import api from '../services/api';
import { getUser } from '../constants/auth';

export const useSavedItems = () => {
  const [savedCareers, setSavedCareers] = useState([]);
  const [savedUniversities, setSavedUniversities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const user = getUser();
  const userId = user?.id || 'test_user';

  // Load saved items from backend
  const loadSavedItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const [careersRes, unisRes] = await Promise.all([
        api.get(`/api/profile/saved-careers/${userId}`).catch(() => ({ data: { careers: [] } })),
        api.get(`/api/profile/saved-universities/${userId}`).catch(() => ({ data: { universities: [] } })),
      ]);
      
      const careerData = careersRes.data?.careers || [];
      const uniData = unisRes.data?.universities || [];
      
      setSavedCareers(careerData);
      setSavedUniversities(uniData);
    } catch (err) {
      console.error('Failed to load saved items:', err);
      setError(err.message || 'Failed to load saved items');
    } finally {
      setLoading(false);
    }
  };

  // Save a career
  const saveCareer = async (careerId, careerData) => {
    try {
      const response = await api.post('/api/profile/save-career', {
        user_id: userId,
        career_id: careerId,
        career_data: careerData
      });
      
      if (response.data?.success) {
        await loadSavedItems(); // Reload to get updated list
        return { success: true, message: 'Career saved!' };
      }
      return { success: false, message: 'Failed to save career' };
    } catch (err) {
      console.error('Error saving career:', err);
      return { success: false, message: err.response?.data?.detail || 'Error saving career' };
    }
  };

  // Unsave a career
  const unsaveCareer = async (careerId) => {
    try {
      const response = await api.delete(`/api/profile/unsave-career?user_id=${userId}&career_id=${careerId}`);
      
      if (response.data?.success) {
        await loadSavedItems();
        return { success: true, message: 'Career removed!' };
      }
      return { success: false, message: 'Failed to remove career' };
    } catch (err) {
      console.error('Error removing career:', err);
      return { success: false, message: err.response?.data?.detail || 'Error removing career' };
    }
  };

  // Save a university
  const saveUniversity = async (universityId, universityData) => {
    try {
      const response = await api.post('/api/profile/save-university', {
        user_id: userId,
        university_id: universityId,
        university_data: universityData
      });
      
      if (response.data?.success) {
        await loadSavedItems();
        return { success: true, message: 'University saved!' };
      }
      return { success: false, message: 'Failed to save university' };
    } catch (err) {
      console.error('Error saving university:', err);
      return { success: false, message: err.response?.data?.detail || 'Error saving university' };
    }
  };

  // Unsave a university
  const unsaveUniversity = async (universityId) => {
    try {
      const response = await api.delete(`/api/profile/unsave-university?user_id=${userId}&university_id=${universityId}`);
      
      if (response.data?.success) {
        await loadSavedItems();
        return { success: true, message: 'University removed!' };
      }
      return { success: false, message: 'Failed to remove university' };
    } catch (err) {
      console.error('Error removing university:', err);
      return { success: false, message: err.response?.data?.detail || 'Error removing university' };
    }
  };

  // Check if a career is saved
  const isCareerSaved = (careerId) => {
    return savedCareers.some(c => c.career_id === careerId);
  };

  // Check if a university is saved
  const isUniversitySaved = (universityId) => {
    return savedUniversities.some(u => u.university_id === universityId);
  };

  // Load saved items on mount
  useEffect(() => {
    loadSavedItems();
  }, []);

  return {
    savedCareers,
    savedUniversities,
    loading,
    error,
    loadSavedItems,
    saveCareer,
    unsaveCareer,
    saveUniversity,
    unsaveUniversity,
    isCareerSaved,
    isUniversitySaved,
  };
};

export default useSavedItems;
