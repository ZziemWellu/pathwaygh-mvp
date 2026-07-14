import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CareerMatchPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const questions = [
    {
      id: 'interest',
      question: 'What are you most interested in?',
      options: ['Science & Technology', 'Healthcare', 'Business & Finance', 'Arts & Humanities', 'Engineering', 'Education']
    },
    {
      id: 'skill',
      question: 'What is your strongest skill?',
      options: ['Problem Solving', 'Communication', 'Creativity', 'Leadership', 'Analysis', 'Teamwork']
    },
    {
      id: 'work_style',
      question: 'What work environment do you prefer?',
      options: ['Office', 'Field/Outdoor', 'Remote', 'Laboratory', 'Hospital', 'Classroom']
    }
  ];

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (step < questions.length) {
      setStep(step + 1);
    } else {
      const interest = answers.interest || 'Science & Technology';
      const interests = {
        'Science & Technology': ['Software Engineer', 'Data Scientist', 'IT Consultant'],
        'Healthcare': ['Medical Doctor', 'Nurse', 'Pharmacist'],
        'Business & Finance': ['Accountant', 'Financial Analyst', 'Entrepreneur'],
        'Arts & Humanities': ['Teacher', 'Writer', 'Designer'],
        'Engineering': ['Civil Engineer', 'Electrical Engineer', 'Mechanical Engineer'],
        'Education': ['Teacher', 'Professor', 'Education Administrator']
      };
      setResult({ matches: interests[interest] || ['Explore Careers'] });
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const resetAssessment = () => {
    setStep(1);
    setAnswers({});
    setResult(null);
  };

  if (result) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <h2 style={{ color: '#1a5f2b', marginBottom: '8px' }}>🎯 Your Career Match Results</h2>
        <p style={{ color: '#888', marginBottom: '24px' }}>Based on your preferences, here are careers that match you</p>
        
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0', padding: '24px' }}>
          <h3 style={{ color: '#1a5f2b', marginBottom: '16px' }}>📋 Recommended Careers</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {result.matches.map((career, i) => (
              <div
                key={i}
                style={{
                  padding: '16px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#1a5f2b'; e.currentTarget.style.background = '#e8f5e9'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.background = '#f8f9fa'; }}
                onClick={() => navigate('/explore/careers')}
              >
                <span style={{ fontWeight: 'bold', color: '#1a5f2b' }}>• {career}</span>
                <span style={{ float: 'right', color: '#888', fontSize: '13px' }}>View Details →</span>
              </div>
            ))}
          </div>
          <button
            onClick={resetAssessment}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#f0f0f0',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            🔄 Retake Assessment
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[step - 1];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ color: '#1a5f2b', marginBottom: '8px' }}>🎯 Career Match</h2>
      <p style={{ color: '#888', marginBottom: '24px' }}>
        Answer a few questions to discover careers that match your interests
      </p>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0', padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontSize: '14px', color: '#888' }}>Question {step} of {questions.length}</span>
          <span style={{ fontSize: '14px', color: '#888' }}>{Math.round((step / questions.length) * 100)}% complete</span>
        </div>
        <div style={{ height: '4px', background: '#f0f0f0', borderRadius: '2px', marginBottom: '20px' }}>
          <div style={{ width: `${(step / questions.length) * 100}%`, height: '100%', background: '#1a5f2b', borderRadius: '2px' }} />
        </div>

        <h3 style={{ marginBottom: '16px' }}>{currentQuestion.question}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {currentQuestion.options.map((option) => (
            <button
              key={option}
              onClick={() => handleAnswer(currentQuestion.id, option)}
              style={{
                padding: '12px 16px',
                background: answers[currentQuestion.id] === option ? '#e8f5e9' : '#f8f9fa',
                border: answers[currentQuestion.id] === option ? '2px solid #1a5f2b' : '1px solid #e0e0e0',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '15px',
                transition: 'all 0.2s ease'
              }}
            >
              {option}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
          <button
            onClick={handleBack}
            disabled={step === 1}
            style={{
              padding: '10px 20px',
              background: step === 1 ? '#f0f0f0' : '#1a5f2b',
              color: step === 1 ? '#888' : 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: step === 1 ? 'not-allowed' : 'pointer',
              opacity: step === 1 ? 0.5 : 1
            }}
          >
            ← Back
          </button>
          <button
            onClick={handleNext}
            disabled={!answers[currentQuestion.id]}
            style={{
              padding: '10px 20px',
              background: answers[currentQuestion.id] ? '#1a5f2b' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: answers[currentQuestion.id] ? 'pointer' : 'not-allowed',
              opacity: answers[currentQuestion.id] ? 1 : 0.5
            }}
          >
            {step === questions.length ? '🚀 See Results' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CareerMatchPage;
