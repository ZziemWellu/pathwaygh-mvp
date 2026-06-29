import React, { useState } from 'react';
import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001' });

function RealRecommender() {
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
      alert('Please enter aggregate, interests, and subjects!');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/api/real-data/recommend', {
        aggregate: parseInt(aggregate),
        interests: interests,
        subjects: subjects
      });
      setResults(response.data);
    } catch (error) {
      console.error('Error:', error);
      alert('Error getting recommendations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      <div style={{ background: '#e8f5e9', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <p style={{ margin: 0, fontSize: '14px' }}>
          📚 Powered by <strong>real Ghanaian university admission data</strong> from UG, KNUST, UHAS, UCC, and other institutions.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Input Panel */}
        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '12px' }}>
          <h3>Your Academic Profile</h3>
          
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
            <small style={{ color: '#666' }}>Medicine: ≤12 | Engineering: ≤16 | Law: ≤12 | Business: ≤20</small>
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
            {loading ? 'Analyzing...' : '🎯 Get Real Career Matches'}
          </button>
        </div>

        {/* Results Panel */}
        <div>
          {results && (
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
              <h3 style={{ marginTop: 0 }}>📊 Your Career Matches</h3>
              <p style={{ fontSize: '14px', color: '#666' }}>Based on real Ghanaian university requirements</p>
              
              {results.recommendations?.map((career, idx) => (
                <div key={idx} style={{
                  border: idx === 0 ? '2px solid #ffd700' : '1px solid #e0e0e0',
                  borderRadius: '12px',
                  padding: '15px',
                  marginBottom: '15px',
                  background: idx === 0 ? '#fff9e6' : 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, color: '#1a5f2b' }}>{career.career}</h4>
                    <span style={{ fontSize: '24px' }}>{idx === 0 ? '🏆' : '📌'}</span>
                  </div>
                  
                  <div style={{ marginTop: '10px' }}>
                    <span style={{ display: 'inline-block', padding: '4px 12px', background: '#e8f5e9', borderRadius: '16px', fontSize: '12px', marginRight: '10px' }}>
                      {career.field}
                    </span>
                    <span style={{ display: 'inline-block', padding: '4px 12px', background: '#e3f2fd', borderRadius: '16px', fontSize: '12px' }}>
                      Confidence: {career.confidence}%
                    </span>
                  </div>
                  
                  <p style={{ fontSize: '14px', color: '#555', marginTop: '12px' }}>{career.career_description}</p>
                  
                  <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '8px', marginTop: '10px' }}>
                    <strong>✓ Why this fits you:</strong>
                    <ul style={{ margin: '8px 0 0 20px', fontSize: '13px' }}>
                      {career.reasons?.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px', fontSize: '13px' }}>
                    <div><strong>🎓 Universities:</strong> {career.best_university?.name || 'Multiple options'}</div>
                    <div><strong>📊 Cutoff:</strong> ≤{career.best_university?.cutoff || career.typical_aggregate}</div>
                    <div><strong>💰 Salary:</strong> {career.salary_range}</div>
                    <div><strong>📈 Demand:</strong> {career.demand}</div>
                  </div>
                  
                  {career.licensing_body && (
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                      <strong>Licensing Body:</strong> {career.licensing_body}
                    </div>
                  )}
                </div>
              ))}
              
              <div style={{ marginTop: '15px', padding: '10px', background: '#f0f0f0', borderRadius: '8px', fontSize: '12px', textAlign: 'center', color: '#666' }}>
                📚 Data sourced from official Ghanaian university admission requirements
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RealRecommender;
