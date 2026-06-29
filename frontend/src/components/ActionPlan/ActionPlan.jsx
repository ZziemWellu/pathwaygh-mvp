import React, { useState } from 'react';
import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001' });

function ActionPlan() {
  const [career, setCareer] = useState('');
  const [aggregate, setAggregate] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);

  const careerOptions = [
    'Medical Doctor', 'Software Engineer', 'Lawyer', 'Accountant',
    'Nurse', 'Pharmacist', 'Civil Engineer', 'Teacher', 'Architect'
  ];

  const subjectOptions = [
    'Biology', 'Chemistry', 'Physics', 'Elective Mathematics',
    'Government', 'Literature in English', 'Accounting', 'Business Management',
    'General Knowledge in Art', 'ICT'
  ];

  const interestOptions = ['healthcare', 'technology', 'business', 'creative', 'engineering', 'law', 'education'];

  const handleSubjectToggle = (subject) => {
    if (subjects.includes(subject)) {
      setSubjects(subjects.filter(s => s !== subject));
    } else {
      setSubjects([...subjects, subject]);
    }
  };

  const handleInterestToggle = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const generatePlan = async () => {
    if (!career || !aggregate || subjects.length === 0) {
      alert('Please select a career, enter aggregate, and select subjects!');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/api/action-plan/generate', {
        career: career,
        aggregate: parseInt(aggregate),
        subjects: subjects,
        interests: interests
      });
      setPlan(response.data);
    } catch (error) {
      console.error('Error:', error);
      alert('Error generating plan');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Very Likely': return '#2e7d32';
      case 'Likely': return '#388e3c';
      case 'Possible': return '#f57c00';
      case 'Competitive': return '#e65100';
      case 'Challenging': return '#c62828';
      default: return '#666';
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ color: '#1a5f2b' }}>🎯 Personalized Action Plan</h1>
      <p style={{ fontSize: '16px', color: '#555' }}>
        Get a customized study and admission plan for your dream career
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Input Panel */}
        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '12px' }}>
          <h3>Your Profile</h3>

          <div style={{ marginBottom: '20px' }}>
            <label>Target Career</label>
            <select
              value={career}
              onChange={(e) => setCareer(e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: '1px solid #ccc' }}
            >
              <option value="">Select a career...</option>
              {careerOptions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>WASSCE Aggregate</label>
            <input
              type="number"
              min="6"
              max="36"
              value={aggregate}
              onChange={(e) => setAggregate(e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: '1px solid #ccc' }}
              placeholder="e.g., 12"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>Your Subjects</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
              {subjectOptions.map(subject => (
                <button
                  key={subject}
                  onClick={() => handleSubjectToggle(subject)}
                  style={{
                    padding: '8px 16px',
                    background: subjects.includes(subject) ? '#1a5f2b' : 'white',
                    color: subjects.includes(subject) ? 'white' : '#333',
                    border: '1px solid #ccc',
                    borderRadius: '20px',
                    cursor: 'pointer'
                  }}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>Your Interests</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
              {interestOptions.map(interest => (
                <button
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  style={{
                    padding: '8px 16px',
                    background: interests.includes(interest) ? '#1a5f2b' : 'white',
                    color: interests.includes(interest) ? 'white' : '#333',
                    border: '1px solid #ccc',
                    borderRadius: '20px',
                    cursor: 'pointer'
                  }}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={generatePlan}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: '#1a5f2b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Generating...' : '📋 Generate My Plan'}
          </button>
        </div>

        {/* Results Panel */}
        <div>
          {plan && (
            <div>
              {/* Eligibility */}
              <div style={{
                background: '#e8f5e9',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <h4 style={{ marginTop: 0, color: '#2e7d32' }}>🎯 Current Eligibility</h4>
                <div style={{ fontSize: '48px', fontWeight: 'bold', color: getStatusColor(plan.eligibility_status) }}>
                  {plan.eligibility_percentage}%
                </div>
                <p style={{ fontSize: '18px', color: getStatusColor(plan.eligibility_status) }}>
                  {plan.eligibility_status}
                </p>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  Target cutoff: ≤{plan.target_cutoff} • Current aggregate: {plan.current_aggregate}
                </div>
              </div>

              {/* Subject Gaps */}
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '20px',
                border: '1px solid #e0e0e0'
              }}>
                <h4 style={{ marginTop: 0 }}>📚 Subject Requirements</h4>
                {plan.gaps.map((gap, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    marginBottom: '5px',
                    background: gap.importance === 'Completed' ? '#e8f5e9' : '#fff3e0',
                    borderRadius: '4px'
                  }}>
                    <span>{gap.subject}</span>
                    <span style={{
                      color: gap.importance === 'Completed' ? '#2e7d32' : '#e65100'
                    }}>
                      {gap.importance === 'Completed' ? '✅ Completed' : '⚠️ Required'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              <div style={{
                background: '#e3f2fd',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <h4 style={{ marginTop: 0, color: '#1565c0' }}>💡 Recommendations</h4>
                <ul style={{ paddingLeft: '20px' }}>
                  {plan.recommendations.map((rec, idx) => (
                    <li key={idx} style={{ marginBottom: '8px' }}>{rec}</li>
                  ))}
                </ul>
              </div>

              {/* University Recommendations */}
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '20px',
                border: '1px solid #e0e0e0'
              }}>
                <h4 style={{ marginTop: 0 }}>🏫 University Recommendations</h4>
                {plan.university_recommendations.map((uni, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px',
                    marginBottom: '5px',
                    background: uni.status === 'Likely' ? '#e8f5e9' : '#fff3e0',
                    borderRadius: '4px'
                  }}>
                    <span><strong>{uni.university}</strong> <span style={{ fontSize: '12px', color: '#666' }}>{uni.note}</span></span>
                    <span style={{ color: uni.status === 'Likely' ? '#2e7d32' : '#e65100' }}>
                      {uni.status} (≤{uni.cutoff})
                    </span>
                  </div>
                ))}
              </div>

              {/* Actionable Steps */}
              <div style={{
                background: '#f5f5f5',
                padding: '20px',
                borderRadius: '12px'
              }}>
                <h4 style={{ marginTop: 0 }}>📋 Next Steps</h4>
                <ul style={{ paddingLeft: '20px' }}>
                  {plan.actionable_steps.map((step, idx) => (
                    <li key={idx} style={{ marginBottom: '8px' }}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ActionPlan;
