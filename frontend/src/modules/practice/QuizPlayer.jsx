import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8001' });

function QuizPlayer() {
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const subject = params.get('subject') || 'Mathematics';
    const difficulty = params.get('difficulty') || 'medium';
    startQuiz(subject, difficulty);
  }, [location]);

  const startQuiz = async (subject, difficulty) => {
    setLoading(true);
    try {
      const response = await API.post('/api/practice/quiz/start', {
        user_id: 'guest',
        subject: subject,
        difficulty: difficulty,
        num_questions: 5
      });
      setQuiz(response.data);
      setAnswers(new Array(response.data.questions.length).fill(-1));
    } catch (error) {
      console.error('Error starting quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (index) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = index;
    setAnswers(newAnswers);
    setSelectedOption(index);
  };

  const nextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(answers[currentQuestion + 1]);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedOption(answers[currentQuestion - 1]);
    }
  };

  const submitQuiz = async () => {
    setSubmitted(true);
    try {
      const response = await API.post('/api/practice/quiz/submit', {
        user_id: 'guest',
        quiz_id: quiz.quiz_id,
        answers: answers,
        time_taken: 300 - timeLeft
      });
      setResult(response.data);
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading quiz...</div>;
  }

  if (!quiz) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>No quiz available</div>;
  }

  if (submitted && result) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <h2 style={{ color: '#1a5f2b' }}>📊 Quiz Results</h2>
        <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: result.score >= 70 ? '#2e7d32' : '#e65100' }}>
              {result.score}%
            </div>
            <p style={{ fontSize: '18px', margin: '10px 0' }}>{result.feedback}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', margin: '20px 0' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#888' }}>Correct</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2e7d32' }}>{result.correct}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#888' }}>Total</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{result.total}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#888' }}>Time</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{Math.floor((300 - timeLeft) / 60)}m</div>
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/practice')}
            style={{
              width: '100%',
              padding: '12px',
              background: '#1a5f2b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            📝 Practice Again
          </button>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#1a5f2b', margin: 0 }}>📝 Quiz</h2>
        <div style={{ fontSize: '14px', color: '#888' }}>
          {currentQuestion + 1} / {quiz.questions.length}
        </div>
      </div>

      <div style={{ background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ marginBottom: '20px' }}>
          <span style={{ display: 'inline-block', padding: '4px 12px', background: '#e3f2fd', borderRadius: '16px', fontSize: '12px' }}>
            {question.subject} • {question.difficulty}
          </span>
          <h3 style={{ margin: '15px 0 0 0' }}>{question.question}</h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                border: answers[currentQuestion] === idx ? '2px solid #1a5f2b' : '1px solid #e0e0e0',
                background: answers[currentQuestion] === idx ? '#e8f5e9' : 'white',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
            >
              {String.fromCharCode(65 + idx)}. {option}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '25px' }}>
          <button
            onClick={prevQuestion}
            disabled={currentQuestion === 0}
            style={{
              padding: '10px 20px',
              background: '#f0f0f0',
              border: 'none',
              borderRadius: '8px',
              cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer',
              opacity: currentQuestion === 0 ? 0.5 : 1
            }}
          >
            ← Previous
          </button>
          <div>
            {currentQuestion === quiz.questions.length - 1 ? (
              <button
                onClick={submitQuiz}
                style={{
                  padding: '10px 24px',
                  background: '#1a5f2b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                ✅ Submit Quiz
              </button>
            ) : (
              <button
                onClick={nextQuestion}
                style={{
                  padding: '10px 20px',
                  background: '#1a5f2b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuizPlayer;
