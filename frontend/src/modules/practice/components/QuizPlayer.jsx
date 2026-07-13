import React, { useState, useEffect } from 'react';

const QuizPlayer = ({ quiz, onSubmit, onQuit, timeLimit, isTimed }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [quizComplete, setQuizComplete] = useState(false);

  const questions = quiz?.questions || [];
  const totalQuestions = questions.length;

  useEffect(() => {
    if (isTimed && timeLimit > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isTimed, timeLimit]);

  const handleAnswer = (questionIndex, answer) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    setQuizComplete(true);
    onSubmit(answers);
  };

  const handleAutoSubmit = () => {
    if (!quizComplete) {
      onSubmit(answers);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentQuestion];
  const progress = totalQuestions > 0 ? ((currentQuestion + 1) / totalQuestions) * 100 : 0;

  return (
    <div style={{ width: '100%' }}>
      {/* Quiz Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#1a5f2b', margin: 0 }}>📝 Quiz</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {isTimed && (
            <span style={{ 
              padding: '6px 14px',
              background: timeRemaining < 30 ? '#ffebee' : '#e8f5e9',
              color: timeRemaining < 30 ? '#c62828' : '#1a5f2b',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              ⏱️ {formatTime(timeRemaining)}
            </span>
          )}
          <span style={{ color: '#888', fontSize: '14px' }}>
            {currentQuestion + 1} / {totalQuestions}
          </span>
          <button
            onClick={onQuit}
            style={{
              padding: '6px 14px',
              background: '#f0f0f0',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            ✕ Quit
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ height: '4px', background: '#f0f0f0', borderRadius: '2px' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: '#1a5f2b', borderRadius: '2px', transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* Question */}
      {currentQ && (
        <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '24px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <span style={{ 
              background: '#e8f5e9', 
              padding: '2px 12px', 
              borderRadius: '12px', 
              fontSize: '12px',
              color: '#1a5f2b'
            }}>
              Question {currentQuestion + 1}
            </span>
            {currentQ.difficulty && (
              <span style={{ 
                background: '#f0f0f0', 
                padding: '2px 12px', 
                borderRadius: '12px', 
                fontSize: '12px',
                color: '#666'
              }}>
                {currentQ.difficulty}
              </span>
            )}
          </div>

          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#333' }}>
            {currentQ.question}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {currentQ.options?.map((option, index) => {
              const isSelected = answers[currentQuestion] === option;
              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(currentQuestion, option)}
                  style={{
                    padding: '12px 16px',
                    background: isSelected ? '#e8f5e9' : '#f8f9fa',
                    border: isSelected ? '2px solid #1a5f2b' : '1px solid #e0e0e0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    color: '#333',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = '#f0f0f0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = '#f8f9fa';
                    }
                  }}
                >
                  <span style={{ marginRight: '8px' }}>
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                  {isSelected && (
                    <span style={{ float: 'right', color: '#1a5f2b' }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', gap: '12px' }}>
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              style={{
                padding: '10px 20px',
                background: currentQuestion === 0 ? '#f0f0f0' : '#1a5f2b',
                color: currentQuestion === 0 ? '#888' : 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer',
                fontSize: '14px',
              }}
            >
              ← Previous
            </button>
            <div style={{ display: 'flex', gap: '12px' }}>
              {currentQuestion === totalQuestions - 1 ? (
                <button
                  onClick={handleSubmit}
                  style={{
                    padding: '10px 24px',
                    background: '#1a5f2b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#144d21'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#1a5f2b'}
                >
                  Submit Quiz ✓
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  style={{
                    padding: '10px 20px',
                    background: '#1a5f2b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#144d21'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#1a5f2b'}
                >
                  Next →
                </button>
              )}
            </div>
          </div>

          {/* Progress indicator */}
          <div style={{ marginTop: '12px', display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {questions.map((_, index) => (
              <div
                key={index}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: answers[index] !== undefined ? '#1a5f2b' : 
                             index === currentQuestion ? '#ff9800' : '#e0e0e0',
                }}
              />
            ))}
          </div>
          <div style={{ textAlign: 'center', fontSize: '12px', color: '#888', marginTop: '4px' }}>
            {Object.keys(answers).length} of {totalQuestions} answered
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizPlayer;
