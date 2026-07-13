import React, { useState, useEffect } from 'react';
import api, { extractData } from '../../services/api';

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

  useEffect(() => {
    fetchSubjects();
    fetchQuizHistory();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/practice/subjects');
      const data = extractData(response);
      setSubjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Practice error:', err);
      setError(err.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizHistory = async () => {
    try {
      const response = await api.get('/api/practice/quiz/history').catch(() => ({ data: [] }));
      const data = extractData(response);
      setQuizHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Quiz history error:', err);
    }
  };

  const startQuiz = async (subjectId) => {
    setQuiz(null);
    setQuizResults(null);
    setQuizAnswers({});
    setCurrentQuestion(0);
    try {
      const response = await api.post('/api/practice/quiz/start', {
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
      const response = await api.post('/api/practice/quiz/submit', {
        quiz_id: quiz?.id,
        answers: quizAnswers,
        user_id: 'test_user',
      });
      setQuizResults(response.data);
      await fetchQuizHistory(); // Refresh history
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

  // Get score color based on percentage
  const getScoreColor = (score) => {
    if (score >= 80) return '#1a5f2b';
    if (score >= 60) return '#f9a825';
    if (score >= 40) return '#ff6f00';
    return '#d32f2f';
  };

  // Get score emoji
  const getScoreEmoji = (score) => {
    if (score >= 80) return '🌟';
    if (score >= 60) return '👍';
    if (score >= 40) return '📚';
    return '💪';
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

  // Quiz Active View
  if (quiz) {
    const questions = quiz.questions || [];
    const totalQuestions = questions.length;
    const currentQ = questions[currentQuestion];

    if (quizResults) {
      const score = quizResults.score || 0;
      const scoreColor = getScoreColor(score);
      const emoji = getScoreEmoji(score);

      return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
          <h2>📊 Quiz Results</h2>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '16px',
            border: '1px solid #e0e0e0',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '64px', marginBottom: '12px' }}>{emoji}</div>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: scoreColor }}>
              {score}%
            </div>
            <div style={{ fontSize: '16px', color: '#888', marginBottom: '8px' }}>
              {quizResults.correct || 0} correct out of {totalQuestions}
            </div>
            <div style={{
              width: '100%',
              height: '12px',
              background: '#f0f0f0',
              borderRadius: '6px',
              overflow: 'hidden',
              margin: '16px 0',
            }}>
              <div style={{
                width: `${score}%`,
                height: '100%',
                background: scoreColor,
                borderRadius: '6px',
                transition: 'width 1s ease',
              }} />
            </div>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <div style={{ padding: '12px 20px', background: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#888' }}>⏱️ Time</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{quizResults.time_spent || 0}s</div>
              </div>
              <div style={{ padding: '12px 20px', background: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#888' }}>📝 Questions</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{totalQuestions}</div>
              </div>
              <div style={{ padding: '12px 20px', background: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#888' }}>✅ Correct</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a5f2b' }}>
                  {quizResults.correct || 0}
                </div>
              </div>
            </div>
            <button
              onClick={resetQuiz}
              style={{
                marginTop: '20px',
                padding: '12px 24px',
                background: '#1a5f2b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              🚀 Try Another Quiz
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
            <div style={{
              width: `${((currentQuestion + 1) / totalQuestions) * 100}%`,
              height: '100%',
              background: '#1a5f2b',
              borderRadius: '3px',
              transition: 'width 0.5s ease',
            }} />
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
                    transition: 'all 0.2s ease',
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

  // Subject Selection View
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>✍️ Practice</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowHistory(!showHistory)}
            style={{
              padding: '8px 16px',
              background: showHistory ? '#1a5f2b' : '#f0f0f0',
              color: showHistory ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            📊 History
          </button>
          <span style={{ color: '#888', fontSize: '14px', alignSelf: 'center' }}>
            {subjects.length} subjects
          </span>
        </div>
      </div>

      {showHistory ? (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0', padding: '24px' }}>
          <h3 style={{ color: '#1a5f2b', marginBottom: '16px' }}>📊 Quiz History</h3>
          {quizHistory.length === 0 ? (
            <p style={{ color: '#888' }}>No quiz attempts yet. Start your first quiz!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {quizHistory.slice(0, 10).map((attempt, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e0e0e0',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{attempt.subject || 'Quiz'}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      {attempt.date ? new Date(attempt.date).toLocaleDateString() : 'Recently'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: getScoreColor(attempt.score || 0) }}>
                      {attempt.score || 0}%
                    </div>
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      {attempt.correct || 0}/{attempt.total || 0} correct
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowHistory(false)}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              background: '#f0f0f0',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            ← Back to Subjects
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
          {subjects.length === 0 ? (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#888' }}>
              No practice subjects available.
            </p>
          ) : (
            subjects.map((subject) => (
              <div
                key={subject.id}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  padding: '24px',
                  background: 'white',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
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
                {subject.topics && subject.topics.length > 0 && (
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
                  style={{
                    padding: '10px 24px',
                    background: '#1a5f2b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                    fontWeight: 'bold',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#144d21'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#1a5f2b'}
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
