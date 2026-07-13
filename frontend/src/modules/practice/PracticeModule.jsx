import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import PracticeHome from './components/PracticeHome';
import QuizPlayer from './components/QuizPlayer';
import ResultsView from './components/ResultsView';
import WeakAreas from './components/WeakAreas';

const PracticeModule = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('home');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [difficulty, setDifficulty] = useState('medium');
  const [quiz, setQuiz] = useState(null);
  const [results, setResults] = useState(null);
  const [weakAreas, setWeakAreas] = useState([]);
  const [isTimed, setIsTimed] = useState(false);
  const [timeLimit, setTimeLimit] = useState(300);
  const [quizHistory, setQuizHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    fetchSubjects();
    fetchWeakAreas();
    fetchQuizHistory();
    fetchStatistics();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/practice/subjects');
      const data = response.data;
      let subjectData = [];
      if (Array.isArray(data)) subjectData = data;
      else if (data.subjects) subjectData = data.subjects;
      else if (data.data) subjectData = data.data;
      setSubjects(subjectData);
    } catch (err) {
      console.error('Practice error:', err);
      setError(err.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeakAreas = async () => {
    try {
      const userId = localStorage.getItem('pathwaygh_user') ? 
        JSON.parse(localStorage.getItem('pathwaygh_user'))?.id : 'test_user';
      const response = await api.get(`/api/practice/weak-areas/${userId}`).catch(() => ({ data: { weak_areas: [] } }));
      setWeakAreas(response.data?.weak_areas || []);
    } catch (err) {
      console.warn('Weak areas not available:', err);
    }
  };

  const fetchQuizHistory = async () => {
    try {
      const userId = localStorage.getItem('pathwaygh_user') ? 
        JSON.parse(localStorage.getItem('pathwaygh_user'))?.id : 'test_user';
      const response = await api.get(`/api/practice/history/${userId}`).catch(() => ({ data: { quizzes: [] } }));
      setQuizHistory(response.data?.quizzes || []);
    } catch (err) {
      console.warn('Quiz history not available:', err);
    }
  };

  const fetchStatistics = async () => {
    try {
      const userId = localStorage.getItem('pathwaygh_user') ? 
        JSON.parse(localStorage.getItem('pathwaygh_user'))?.id : 'test_user';
      const response = await api.get(`/api/practice/statistics/${userId}`).catch(() => ({ data: { statistics: {} } }));
      setStatistics(response.data?.statistics || {});
    } catch (err) {
      console.warn('Statistics not available:', err);
    }
  };

  const startQuiz = async (subjectId, topicId = null, difficultyLevel = 'medium', timed = false, time = 300) => {
    setLoading(true);
    setError(null);
    try {
      const userId = localStorage.getItem('pathwaygh_user') ? 
        JSON.parse(localStorage.getItem('pathwaygh_user'))?.id : 'test_user';
      
      const response = await api.post('/api/practice/quiz/start', {
        subject_id: subjectId,
        topic_id: topicId,
        difficulty: difficultyLevel,
        timed: timed,
        time_limit: time,
        user_id: userId,
      });
      
      if (response.data?.success) {
        setQuiz(response.data.data);
        setView('quiz');
        setDifficulty(difficultyLevel);
        setIsTimed(timed);
        setTimeLimit(time);
      } else {
        setError('Failed to start quiz');
      }
    } catch (err) {
      console.error('Failed to start quiz:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to start quiz');
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = async (answers) => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('pathwaygh_user') ? 
        JSON.parse(localStorage.getItem('pathwaygh_user'))?.id : 'test_user';
      
      const response = await api.post('/api/practice/quiz/submit', {
        quiz_id: quiz?.id,
        answers: answers,
        user_id: userId,
      });
      
      if (response.data?.success) {
        setResults(response.data.data);
        setView('results');
        // Refresh data after quiz
        fetchWeakAreas();
        fetchQuizHistory();
        fetchStatistics();
      } else {
        setError('Failed to submit quiz');
      }
    } catch (err) {
      console.error('Failed to submit quiz:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to submit quiz');
    } finally {
      setLoading(false);
    }
  };

  const goHome = () => {
    setView('home');
    setQuiz(null);
    setResults(null);
    setSelectedSubject(null);
    setSelectedTopic(null);
  };

  const retryQuiz = () => {
    setResults(null);
    setView('home');
  };

  if (loading && view === 'home') {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <h2>✍️ Practice</h2>
        <p>Loading practice subjects...</p>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <h2>✍️ Practice</h2>
        <p style={{ color: 'red' }}>⚠️ {error}</p>
        <button onClick={fetchSubjects} style={{ padding: '8px 16px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {view === 'home' && (
        <PracticeHome
          subjects={subjects}
          weakAreas={weakAreas}
          statistics={statistics}
          quizHistory={quizHistory}
          onStartQuiz={startQuiz}
          onSelectSubject={setSelectedSubject}
          onSelectTopic={setSelectedTopic}
          setDifficulty={setDifficulty}
          setIsTimed={setIsTimed}
          setTimeLimit={setTimeLimit}
          selectedSubject={selectedSubject}
        />
      )}
      {view === 'quiz' && (
        <QuizPlayer
          quiz={quiz}
          onSubmit={submitQuiz}
          onQuit={goHome}
          timeLimit={timeLimit}
          isTimed={isTimed}
        />
      )}
      {view === 'results' && (
        <ResultsView
          results={results}
          onRetry={retryQuiz}
          onHome={goHome}
          onViewWeakAreas={() => setView('weak-areas')}
        />
      )}
      {view === 'weak-areas' && (
        <WeakAreas
          weakAreas={weakAreas}
          onBack={() => setView('results')}
          onPractice={startQuiz}
        />
      )}
    </div>
  );
};

export default PracticeModule;
