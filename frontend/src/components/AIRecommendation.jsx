import React, { useState } from 'react';
import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001' });

function AIRecommendation() {
  const [aggregate, setAggregate] = useState('');
  const [interests, setInterests] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const interestOptions = ['healthcare', 'technology', 'business', 'creative', 'engineering', 'law', 'education', 'agriculture'];
  const subjectOptions = ['Biology', 'Chemistry', 'Physics', 'Elective Mathematics', 'Government', 'Literature in English', 'Accounting', 'Business Management', 'General Knowledge in Art', 'ICT'];

  const handleInterestToggle = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleSubjectToggle = (subject) => {
    if (subjects.includes(subject)) {
      setSubjects(subjects.filter(s => s !== subject));
    } else {
      setSubjects([...subjects, subject]);
    }
  };

  const getRecommendations = async () => {
    if (!aggregate || interests.length === 0 || subjects.length === 0) {
      alert('Please enter your aggregate, select interests, and subjects!');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/api/smart/recommend', {
        aggregate: parseInt(aggregate),
        interests: interests.reduce((acc, i) => ({ ...acc, [i]: 8 }), {}),
        subjects: subjects.reduce((acc, s) => ({ ...acc, [s]: 85 }), {})
      });
      setResults(response.data);
    } catch (error) {
      console.error('Error:', error);
      alert('Error getting recommendations. Make sure backend is running!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ color: '#1a5f2b' }}>🎯 Smart Career Match</h1>
      <p style={{ fontSize: '16px', color: '#555' }}>Get AI-powered career recommendations based on your WASSCE performance and interests</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Input Panel */}
        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '12px' }}>
          <h3>Your Profile</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label>WASSCE Aggregate (6-36, lower is better)</label>
            <input
              type="number"
              min="6"
              max="36"
              value={aggregate}
              onChange={(e) => setAggregate(e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: '1px solid #ccc' }}
            />
            <small style={{ color: '#666' }}>Medicine: ≤12 | Engineering: ≤16 | Law: ≤12</small>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h4>Your Interests</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
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

          <div style={{ marginBottom: '20px' }}>
            <h4>Your SHS Subjects</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
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

          <button
            onClick={getRecommendations}
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
            {loading ? 'Analyzing...' : '🎯 Get Career Matches'}
          </button>
        </div>

        {/* Results Panel */}
        <div>
          {results && (
            <div style={{ background: '#e8f5e9', padding: '20px', borderRadius: '12px' }}>
              <h3 style={{ marginTop: 0 }}>📊 Your Career Matches</h3>
              {results.predictions?.map((career, idx) => (
                <div key={idx} style={{ marginBottom: '15px', padding: '15px', background: 'white', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '18px', color: '#1a5f2b' }}>{career.career}</strong>
                    <span style={{ padding: '4px 12px', background: '#e8f5e9', borderRadius: '16px' }}>
                      {career.confidence}% match
                    </span>
                  </div>
                  <p style={{ margin: '10px 0', fontSize: '14px', color: '#555' }}>{career.aggregate_match}</p>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    <span style={{ marginRight: '15px' }}>💰 {career.salary_range}</span>
                    <span>🎓 {career.duration_years} years</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIRecommendation;
