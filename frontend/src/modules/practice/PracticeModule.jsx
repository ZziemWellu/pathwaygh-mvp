import React, { useState, useEffect } from 'react';
import api, { extractData } from '../../services/api';
import { getUser } from '../../constants/auth';

const PracticeModule = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizHistory, setQuizHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  
  const user = getUser();

  useEffect(() => {
    fetchSubjects();
    fetchQuizHistory();
    fetchStatistics();
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/practice/subjects');
      console.log('📚 Practice subjects response:', response.data);
      const data = response.data;
      let subjectData = [];
      if (Array.isArray(data)) subjectData = data;
      else if (data.subjects && Array.isArray(data.subjects)) subjectData = data.subjects;
      else if (data.data && Array.isArray(data.data)) subjectData = data.data;
      setSubjects(subjectData);
      console.log('📚 Subjects loaded:', subjectData.length);
    } catch (err) {
      console.error('Practice error:', err);
      setError(err.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizHistory = async () => {
    try {
      const userId = user?.id || 'test_user';
      const response = await api.get(`/api/practice/history/${userId}`).catch(() => ({ data: { history: [] } }));
      setQuizHistory(response.data?.history || []);
    } catch (err) {
      console.error('Quiz history error:', err);
    }
  };

  const fetchStatistics = async () => {
    try {
      const userId = user?.id || 'test_user';
      const response = await api.get(`/api/practice/statistics/${userId}`).catch(() => ({ data: {} }));
      setStatistics(response.data);
    } catch (err) {
      console.error('Statistics error:', err);
    }
  };

  const startQuiz = async (subjectId) => {
    setQuiz(null);
    setQuizResults(null);
    setQuizAnswers({});
    setCurrentQuestion(0);
    setTimeSpent(0);
    
    if (timerInterval) clearInterval(timerInterval);
    
    try {
      const response = await api.post('/api/practice/quiz/start', {
        subject_id: subjectId,
        user_id: user?.id || 'test_user',
        question_count: 5
      });
      console.log('📝 Quiz started:', response.data);
      setQuiz(response.data);
      
      const interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
    } catch (err) {
      console.error('Quiz start error:', err);
      setError(err.message || 'Failed to start quiz');
    }
  };

  const submitQuiz = async () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    
    try {
      const response = await api.post('/api/practice/quiz/submit', {
        quiz_id: quiz?.id,
        answers: quizAnswers,
        user_id: user?.id || 'test_user',
        time_spent: timeSpent
      });
      console.log('📊 Quiz results:', response.data);
      setQuizResults(response.data);
      await fetchQuizHistory();
      await fetchStatistics();
    } catch (err) {
      console.error('Quiz submit error:', err);
      setError(err.message || 'Failed to submit quiz');
    }
  };

  const handleAnswer = (questionIndex, answer) => {
    setQuizAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const resetQuiz = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setQuiz(null);
    setQuizResults(null);
    setQuizAnswers({});
    setCurrentQuestion(0);
    setTimeSpent(0);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#2e7d32';
    if (score >= 60) return '#f9a825';
    if (score >= 40) return '#ef6c00';
    return '#c62828';
  };

  const getScoreEmoji = (score) => {
    if (score >= 80) return '🌟';
    if (score >= 60) return '😊';
    if (score >= 40) return '📚';
    return '💪';
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return 'Excellent! You\'re a star! 🌟';
    if (score >= 60) return 'Good job! Keep it up! 😊';
    if (score >= 40) return 'Keep practicing! You\'ll get better! 📚';
    return 'Don\'t give up! Practice makes perfect! 💪';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        <button onClick={fetchSubjects} style={{ padding: '8px 16px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  if (quiz) {
    const questions = quiz.questions || [];
    const totalQuestions = questions.length;
    const currentQ = questions[currentQuestion];
    const answeredCount = Object.keys(quizAnswers).length;

    if (quizResults) {
      const score = quizResults.score || 0;
      const scoreColor = getScoreColor(score);
      const emoji = getScoreEmoji(score);
      const message = getScoreMessage(score);

      return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
          <h2 style={{ textAlign: 'center', color: '#1a5f2b' }}>📊 Quiz Results</h2>
          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
            <div style={{ fontSize: '64px' }}>{emoji}</div>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: scoreColor }}>{score}%</div>
            <div style={{ fontSize: '18px', color: '#555', margin: '8px 0 16px 0' }}>{message}</div>
            <div style={{ height: '12px', background: '#f0f0f0', borderRadius: '6px', overflow: 'hidden', margin: '16px 0' }}>
              <div style={{ width: `${score}%`, height: '100%', background: scoreColor, borderRadius: '6px', transition: 'width 1s ease' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', margin: '16px 0' }}>
              <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                <span style={{ display: 'block', fontSize: '12px', color: '#888' }}>✅ Correct</span>
                <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold', color: '#1a5f2b' }}>{quizResults.correct || 0}/{totalQuestions}</span>
              </div>
              <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                <span style={{ display: 'block', fontSize: '12px', color: '#888' }}>❌ Incorrect</span>
                <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold', color: '#d32f2f' }}>{quizResults.incorrect || 0}/{totalQuestions}</span>
              </div>
              <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                <span style={{ display: 'block', fontSize: '12px', color: '#888' }}>⏱️ Time</span>
                <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold' }}>{formatTime(quizResults.time_spent || 0)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={resetQuiz} style={{ padding: '10px 20px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Retry Quiz</button>
              <button onClick={() => setShowStats(true)} style={{ padding: '10px 20px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>📊 Stats</button>
              <button onClick={resetQuiz} style={{ padding: '10px 20px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>🏠 Back</button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ margin: 0, color: '#1a5f2b' }}>📝 Quiz</h2>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 'bold', color: '#1a5f2b' }}>⏱️ {formatTime(timeSpent)}</span>
            <span style={{ fontSize: '13px', color: '#888' }}>{answeredCount} of {totalQuestions} answered</span>
            <button onClick={resetQuiz} style={{ padding: '6px 14px', background: '#f0f0f0', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>✕ Quit</button>
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <span style={{ fontSize: '14px', color: '#888' }}>Question {currentQuestion + 1} of {totalQuestions}</span>
          <div style={{ height: '6px', background: '#f0f0f0', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%`, height: '100%', background: '#1a5f2b', borderRadius: '3px', transition: 'width 0.5s ease' }} />
          </div>
        </div>

        {currentQ && (
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', color: '#888' }}>Question {currentQuestion + 1}</span>
              <span style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '12px', background: '#ff9800', color: 'white' }}>{currentQ.difficulty || 'Medium'}</span>
            </div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#333' }}>{currentQ.question}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
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
                    transition: 'all 0.2s ease',
                    fontSize: '15px'
                  }}
                >
                  {String.fromCharCode(65 + i)}. {option}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <button
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
                style={{
                  padding: '10px 24px',
                  background: currentQuestion === 0 ? '#f0f0f0' : '#1a5f2b',
                  color: currentQuestion === 0 ? '#888' : 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ← Previous
              </button>
              {currentQuestion === totalQuestions - 1 ? (
                <button onClick={submitQuiz} style={{ padding: '10px 24px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Submit Quiz ✓</button>
              ) : (
                <button onClick={() => setCurrentQuestion(prev => Math.min(totalQuestions - 1, prev + 1))} style={{ padding: '10px 24px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Next →</button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h2 style={{ margin: 0, color: '#1a5f2b' }}>✍️ Practice</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              padding: '8px 16px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              background: showHistory ? '#1a5f2b' : 'white',
              color: showHistory ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📊 {showHistory ? 'Back' : 'History'}
          </button>
          <button
            onClick={() => setShowStats(!showStats)}
            style={{
              padding: '8px 16px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              background: 'white',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📈 Stats
          </button>
          <span style={{ color: '#888', fontSize: '14px' }}>📚 {subjects.length} subjects</span>
        </div>
      </div>

      {showStats && statistics && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ color: '#1a5f2b', margin: '0 0 16px 0' }}>📈 Your Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
            <div style={{ textAlign: 'center', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
              <span style={{ display: 'block', fontSize: '28px', fontWeight: 'bold', color: '#1a5f2b' }}>{statistics.total_quizzes || 0}</span>
              <span style={{ display: 'block', fontSize: '12px', color: '#888' }}>Total Quizzes</span>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
              <span style={{ display: 'block', fontSize: '28px', fontWeight: 'bold', color: '#1a5f2b' }}>{statistics.average_score || 0}%</span>
              <span style={{ display: 'block', fontSize: '12px', color: '#888' }}>Average Score</span>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
              <span style={{ display: 'block', fontSize: '28px', fontWeight: 'bold', color: '#1a5f2b' }}>{statistics.best_score || 0}%</span>
              <span style={{ display: 'block', fontSize: '12px', color: '#888' }}>Best Score</span>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
              <span style={{ display: 'block', fontSize: '28px', fontWeight: 'bold', color: '#1a5f2b' }}>{statistics.accuracy || 0}%</span>
              <span style={{ display: 'block', fontSize: '12px', color: '#888' }}>Accuracy</span>
            </div>
          </div>
          <button onClick={() => setShowStats(false)} style={{ marginTop: '16px', padding: '8px 20px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Close</button>
        </div>
      )}

      {showHistory ? (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0', padding: '24px' }}>
          <h3 style={{ color: '#1a5f2b', margin: '0 0 16px 0' }}>📊 Quiz History</h3>
          {quizHistory.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No quiz attempts yet. Start your first quiz!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {quizHistory.slice().reverse().map((attempt, i) => {
                const scoreColor = getScoreColor(attempt.score || 0);
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e0e0e0', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{attempt.subject || 'Quiz'}</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>{attempt.date ? new Date(attempt.date).toLocaleDateString() : 'Recently'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: scoreColor }}>{attempt.score || 0}%</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>{attempt.correct || 0}/{attempt.total || 0} correct</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
          {subjects.length === 0 ? (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#888' }}>No practice subjects available.</p>
          ) : (
            subjects.map((subject) => (
              <div
                key={subject.id}
                onClick={() => startQuiz(subject.id)}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  padding: '24px',
                  background: 'white',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontSize: '48px' }}>{subject.icon || '📚'}</div>
                <h3 style={{ color: '#1a5f2b', margin: '12px 0' }}>{subject.name}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginBottom: '12px' }}>
                  {subject.topics?.slice(0, 3).map((topic, i) => (
                    <span key={i} style={{ background: '#f0f0f0', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', color: '#666' }}>
                      {typeof topic === 'string' ? topic : topic.name || topic}
                    </span>
                  ))}
                  {subject.topics?.length > 3 && (
                    <span style={{ background: '#e8f5e9', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', color: '#1a5f2b' }}>
                      +{subject.topics.length - 3} more
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>
                  {subject.question_count || 0} questions available
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startQuiz(subject.id);
                  }}
                  style={{
                    padding: '10px 24px',
                    background: '#1a5f2b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    width: '100%'
                  }}
                >
                  🚀 Start Quiz
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default PracticeModule;
