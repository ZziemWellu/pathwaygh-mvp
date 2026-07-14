import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { getUser } from '../../../constants/auth';

const CareerMatchPage = () => {
  const navigate = useNavigate();
  const user = getUser();
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // 5 Steps - More Comprehensive
  const questions = [
    {
      id: 'subjects',
      question: 'What are your favorite subjects?',
      description: 'Select the subjects you enjoy the most',
      options: ['Mathematics', 'English', 'Science', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'ICT', 'French', 'Art', 'Music'],
      multi: true,
      maxSelect: 3
    },
    {
      id: 'interests',
      question: 'What are you most interested in?',
      description: 'Choose the areas that excite you',
      options: ['Science & Technology', 'Healthcare', 'Business & Finance', 'Arts & Humanities', 'Engineering', 'Education', 'Law', 'Agriculture'],
      multi: false
    },
    {
      id: 'skills',
      question: 'What are your strongest skills?',
      description: 'Select your top skills',
      options: ['Problem Solving', 'Communication', 'Creativity', 'Leadership', 'Analysis', 'Teamwork', 'Public Speaking', 'Writing', 'Coding', 'Research'],
      multi: true,
      maxSelect: 3
    },
    {
      id: 'work_style',
      question: 'What work environment do you prefer?',
      description: 'Choose your ideal work setting',
      options: ['Office', 'Field/Outdoor', 'Remote', 'Laboratory', 'Hospital', 'Classroom', 'Studio', 'Workshop'],
      multi: false
    },
    {
      id: 'goals',
      question: 'What are your career goals?',
      description: 'What do you want to achieve in your career?',
      options: ['Make a positive impact', 'Financial success', 'Work-life balance', 'Continuous learning', 'Leadership role', 'Creativity & expression', 'Helping others', 'Innovation'],
      multi: true,
      maxSelect: 3
    }
  ];

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleMultiSelect = (questionId, option) => {
    setAnswers(prev => {
      const current = prev[questionId] || [];
      const maxSelect = questions.find(q => q.id === questionId)?.maxSelect || 3;
      
      if (current.includes(option)) {
        return { ...prev, [questionId]: current.filter(item => item !== option) };
      } else if (current.length < maxSelect) {
        return { ...prev, [questionId]: [...current, option] };
      }
      return prev;
    });
  };

  const handleNext = () => {
    if (step < questions.length) {
      setStep(step + 1);
    } else {
      calculateResults();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const calculateResults = () => {
    setLoading(true);
    
    // Simulate AI calculation (in production, this would call an API)
    setTimeout(() => {
      const interest = answers.interests || 'Science & Technology';
      const skills = answers.skills || ['Problem Solving'];
      const goals = answers.goals || ['Make a positive impact'];
      
      // Career matching logic
      const careerMatches = {
        'Science & Technology': [
          { title: 'Software Engineer', match: 92, university: 'KNUST', electives: ['Mathematics', 'ICT', 'Physics'] },
          { title: 'Data Scientist', match: 88, university: 'University of Ghana', electives: ['Mathematics', 'ICT', 'Statistics'] },
          { title: 'IT Consultant', match: 82, university: 'KNUST', electives: ['ICT', 'Mathematics', 'Business'] }
        ],
        'Healthcare': [
          { title: 'Medical Doctor', match: 94, university: 'University of Ghana', electives: ['Biology', 'Chemistry', 'Physics'] },
          { title: 'Nurse', match: 86, university: 'University of Ghana', electives: ['Biology', 'Chemistry', 'Home Economics'] },
          { title: 'Pharmacist', match: 80, university: 'KNUST', electives: ['Biology', 'Chemistry', 'Mathematics'] }
        ],
        'Business & Finance': [
          { title: 'Accountant', match: 90, university: 'University of Ghana', electives: ['Mathematics', 'Business', 'Economics'] },
          { title: 'Financial Analyst', match: 85, university: 'KNUST', electives: ['Mathematics', 'Economics', 'Business'] },
          { title: 'Entrepreneur', match: 78, university: 'University of Ghana', electives: ['Business', 'Economics', 'Mathematics'] }
        ],
        'Arts & Humanities': [
          { title: 'Teacher', match: 88, university: 'University of Cape Coast', electives: ['Arts', 'History', 'English'] },
          { title: 'Writer', match: 82, university: 'University of Ghana', electives: ['English', 'Arts', 'History'] },
          { title: 'Designer', match: 76, university: 'KNUST', electives: ['Arts', 'ICT', 'Visual Arts'] }
        ],
        'Engineering': [
          { title: 'Civil Engineer', match: 90, university: 'KNUST', electives: ['Mathematics', 'Physics', 'Chemistry'] },
          { title: 'Electrical Engineer', match: 86, university: 'KNUST', electives: ['Mathematics', 'Physics', 'ICT'] },
          { title: 'Mechanical Engineer', match: 82, university: 'KNUST', electives: ['Mathematics', 'Physics', 'Chemistry'] }
        ],
        'Education': [
          { title: 'Teacher', match: 92, university: 'University of Cape Coast', electives: ['Arts', 'Science', 'Mathematics'] },
          { title: 'Professor', match: 84, university: 'University of Ghana', electives: ['Arts', 'Science', 'Research'] },
          { title: 'Education Administrator', match: 76, university: 'University of Cape Coast', electives: ['Business', 'Arts', 'Management'] }
        ]
      };
      
      const matches = careerMatches[interest] || careerMatches['Science & Technology'];
      
      // Generate recommendations based on top match
      const topMatch = matches[0];
      const recommendedUniversities = [
        topMatch.university,
        matches[1]?.university,
        'University of Cape Coast'
      ].filter((v, i, a) => a.indexOf(v) === i);
      
      const recommendedElectives = topMatch.electives || ['Mathematics', 'English', 'Science'];
      
      setResult({
        matches: matches,
        topMatch: topMatch,
        recommendedUniversities: recommendedUniversities,
        recommendedElectives: recommendedElectives,
        learningPaths: [
          { step: 1, title: 'Complete WASSCE', description: `Focus on ${recommendedElectives.join(', ')}` },
          { step: 2, title: 'Undergraduate Degree', description: `Study at ${topMatch.university}` },
          { step: 3, title: 'Internship/Entry Level', description: `Gain experience in ${topMatch.title}` },
          { step: 4, title: 'Career Growth', description: `Become a successful ${topMatch.title}` }
        ]
      });
      
      setLoading(false);
    }, 1500);
  };

  const saveAssessment = async () => {
    if (!user?.id) {
      alert('Please log in to save your assessment.');
      return;
    }
    
    try {
      await api.post('/api/profile/career-match', {
        user_id: user.id,
        answers: answers,
        results: result
      });
      setSaved(true);
      alert('✅ Assessment saved successfully!');
    } catch (err) {
      console.error('Save error:', err);
      alert('❌ Failed to save assessment. Please try again.');
    }
  };

  const resetAssessment = () => {
    setStep(1);
    setAnswers({});
    setResult(null);
    setSaved(false);
  };

  const getProgress = () => {
    return Math.round((step / questions.length) * 100);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', textAlign: 'center' }}>
        <h2 style={{ color: '#1a5f2b', marginBottom: '20px' }}>🎯 Calculating Your Career Match</h2>
        <div style={{ width: '60px', height: '60px', border: '4px solid #f0f0f0', borderTopColor: '#1a5f2b', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
        <p style={{ color: '#888' }}>Analyzing your preferences...</p>
        <p style={{ color: '#888', fontSize: '13px' }}>Finding the best career matches for you</p>
      </div>
    );
  }

  if (result) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ color: '#1a5f2b', margin: 0 }}>🎯 Your Career Match Results</h2>
          {saved && (
            <span style={{ padding: '6px 16px', background: '#e8f5e9', color: '#1a5f2b', borderRadius: '20px', fontWeight: 'bold' }}>
              ✅ Saved to Profile
            </span>
          )}
        </div>
        <p style={{ color: '#888', marginBottom: '24px' }}>
          Based on your preferences, here are careers that match you
        </p>

        {/* Top Career Matches */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#333', marginBottom: '16px' }}>📋 Top Career Matches</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {result.matches.map((career, i) => (
              <div
                key={i}
                style={{
                  padding: '20px',
                  background: i === 0 ? '#e8f5e9' : 'white',
                  border: i === 0 ? '2px solid #1a5f2b' : '1px solid #e0e0e0',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => navigate('/explore/careers')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#1a5f2b' }}>
                    {i === 0 && '🏆 '}{career.title}
                  </span>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a5f2b' }}>
                    {career.match}%
                  </span>
                </div>
                <div style={{ height: '6px', background: '#f0f0f0', borderRadius: '3px', marginTop: '8px' }}>
                  <div style={{ width: `${career.match}%`, height: '100%', background: '#1a5f2b', borderRadius: '3px' }} />
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                  Recommended: {career.university}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended SHS Electives */}
        <div style={{ marginBottom: '24px', padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
          <h3 style={{ color: '#333', marginBottom: '12px' }}>📚 Recommended SHS Electives</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {result.recommendedElectives.map((elective, i) => (
              <span key={i} style={{ padding: '6px 14px', background: '#e8f5e9', color: '#1a5f2b', borderRadius: '20px', fontWeight: '500' }}>
                {elective}
              </span>
            ))}
          </div>
        </div>

        {/* Recommended Universities */}
        <div style={{ marginBottom: '24px', padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
          <h3 style={{ color: '#333', marginBottom: '12px' }}>🏛️ Recommended Universities</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {result.recommendedUniversities.map((uni, i) => (
              <span key={i} style={{ padding: '6px 14px', background: '#e3f2fd', color: '#1565c0', borderRadius: '20px', fontWeight: '500' }}>
                {uni}
              </span>
            ))}
          </div>
        </div>

        {/* Learning Path */}
        <div style={{ marginBottom: '24px', padding: '20px', background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
          <h3 style={{ color: '#333', marginBottom: '12px' }}>🗺️ Your Learning Path</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {result.learningPaths.map((path, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: '#1a5f2b',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}>
                  {i + 1}
                </span>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{path.title}</div>
                  <div style={{ fontSize: '13px', color: '#666' }}>{path.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={saveAssessment}
            style={{
              padding: '12px 24px',
              background: '#1a5f2b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              flex: 1
            }}
          >
            💾 Save to Profile
          </button>
          <button
            onClick={() => navigate('/explore/careers')}
            style={{
              padding: '12px 24px',
              background: '#1565c0',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              flex: 1
            }}
          >
            🔍 Explore All Careers
          </button>
          <button
            onClick={resetAssessment}
            style={{
              padding: '12px 24px',
              background: '#f0f0f0',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              flex: 1
            }}
          >
            🔄 Retake Assessment
          </button>
        </div>
      </div>
    );
  }

  // Question View
  const currentQuestion = questions[step - 1];
  const isMulti = currentQuestion.multi || false;
  const currentAnswer = answers[currentQuestion.id] || (isMulti ? [] : '');

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ color: '#1a5f2b', margin: 0 }}>🎯 Career Match</h2>
          <span style={{ fontSize: '14px', color: '#888' }}>
            Question {step} of {questions.length}
          </span>
        </div>
        <div style={{ height: '4px', background: '#f0f0f0', borderRadius: '2px' }}>
          <div style={{ width: `${getProgress()}%`, height: '100%', background: '#1a5f2b', borderRadius: '2px', transition: 'width 0.3s ease' }} />
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px', color: '#888', marginTop: '4px' }}>
          {getProgress()}% complete
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0', padding: '30px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '20px' }}>{currentQuestion.question}</h3>
        {currentQuestion.description && (
          <p style={{ color: '#888', fontSize: '14px', marginBottom: '16px' }}>{currentQuestion.description}</p>
        )}
        {isMulti && currentQuestion.maxSelect && (
          <p style={{ color: '#888', fontSize: '12px', marginBottom: '16px' }}>
            Select up to {currentQuestion.maxSelect} options ({currentAnswer.length} selected)
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
          {currentQuestion.options.map((option) => {
            const isSelected = isMulti ? currentAnswer.includes(option) : currentAnswer === option;
            return (
              <button
                key={option}
                onClick={() => {
                  if (isMulti) {
                    handleMultiSelect(currentQuestion.id, option);
                  } else {
                    handleAnswer(currentQuestion.id, option);
                  }
                }}
                style={{
                  padding: '12px 16px',
                  background: isSelected ? '#e8f5e9' : '#f8f9fa',
                  border: isSelected ? '2px solid #1a5f2b' : '1px solid #e0e0e0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  fontWeight: isSelected ? 'bold' : 'normal',
                  color: isSelected ? '#1a5f2b' : '#333'
                }}
              >
                {option}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
          <button
            onClick={handleBack}
            disabled={step === 1}
            style={{
              padding: '10px 24px',
              background: step === 1 ? '#f0f0f0' : '#1a5f2b',
              color: step === 1 ? '#888' : 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: step === 1 ? 'not-allowed' : 'pointer',
              opacity: step === 1 ? 0.5 : 1,
              fontWeight: 'bold'
            }}
          >
            ← Back
          </button>
          <button
            onClick={handleNext}
            disabled={isMulti ? currentAnswer.length === 0 : !currentAnswer}
            style={{
              padding: '10px 24px',
              background: (isMulti ? currentAnswer.length > 0 : currentAnswer) ? '#1a5f2b' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: (isMulti ? currentAnswer.length > 0 : currentAnswer) ? 'pointer' : 'not-allowed',
              opacity: (isMulti ? currentAnswer.length > 0 : currentAnswer) ? 1 : 0.5,
              fontWeight: 'bold'
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
