import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8001' });

function PracticeHome() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [stats, setStats] = useState({
    total_quizzes: 0,
    average_score: 0,
    best_score: 0,
    total_questions: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubjects();
    fetchStats();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await API.get('/api/practice/subjects');
      setSubjects(response.data.subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // In production, fetch real stats from backend
      setStats({
        total_quizzes: 5,
        average_score: 72,
        best_score: 95,
        total_questions: 45
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const startQuiz = () => {
    if (!selectedSubject) {
      alert('Please select a subject');
      return;
    }
    navigate(`/practice/quiz?subject=${selectedSubject}&difficulty=${selectedDifficulty}`);
  };

  const startMockExam = () => {
    if (!selectedSubject) {
      alert('Please select a subject');
      return;
    }
    navigate(`/practice/mock-exam?subject=${selectedSubject}`);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ color: '#1a5f2b' }}>✍️ Practice & Assessment</h2>
      <p style={{ color: '#666' }}>Test your knowledge with quizzes and practice exams</p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', margin: '20px 0' }}>
        <div style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#888' }}>Total Quizzes</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a5f2b' }}>{stats.total_quizzes}</div>
        </div>
        <div style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#888' }}>Average Score</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a5f2b' }}>{stats.average_score}%</div>
        </div>
        <div style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#888' }}>Best Score</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a5f2b' }}>{stats.best_score}%</div>
        </div>
        <div style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#888' }}>Questions Attempted</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a5f2b' }}>{stats.total_questions}</div>
        </div>
      </div>

      {/* Quiz Setup */}
      <div style={{ background: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e0e0e0', marginBottom: '20px' }}>
        <h3 style={{ color: '#1a5f2b', marginTop: 0 }}>Start Practice</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
            >
              <option value="">Select Subject...</option>
              {subjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Difficulty</label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={startQuiz}
            style={{
              padding: '10px 24px',
              background: '#1a5f2b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📝 Start Quiz
          </button>
          <button
            onClick={startMockExam}
            style={{
              padding: '10px 24px',
              background: '#e65100',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📊 Mock Exam
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
        <button
          onClick={() => navigate('/practice/history')}
          style={{
            padding: '15px',
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '24px' }}>📊</div>
          <div>View History</div>
        </button>
        <button
          onClick={() => alert('WAEC questions coming soon!')}
          style={{
            padding: '15px',
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '24px' }}>📄</div>
          <div>WAEC Past Questions</div>
        </button>
        <button
          onClick={() => alert('Flashcards coming soon!')}
          style={{
            padding: '15px',
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            cursor: 'pointer',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '24px' }}>🃏</div>
          <div>Flashcards</div>
        </button>
      </div>
    </div>
  );
}

export default PracticeHome;
