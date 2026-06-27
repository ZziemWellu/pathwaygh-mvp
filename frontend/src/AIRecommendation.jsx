import React, { useState } from 'react';
import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8001' });

function AIRecommendation() {
  const [aggregate, setAggregate] = useState('');
  const [subjects, setSubjects] = useState({
    biology: 60, chemistry: 60, physics: 60, math: 60, english: 60
  });
  const [interests, setInterests] = useState({
    healthcare: 5, technology: 5, business: 5
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [semanticQuery, setSemanticQuery] = useState('');
  const [semanticResults, setSemanticResults] = useState(null);

  const subjectList = [
    { key: 'biology', label: 'Biology' },
    { key: 'chemistry', label: 'Chemistry' },
    { key: 'physics', label: 'Physics' },
    { key: 'math', label: 'Mathematics' },
    { key: 'english', label: 'English' }
  ];

  const interestList = [
    { key: 'healthcare', label: '🏥 Healthcare' },
    { key: 'technology', label: '💻 Technology' },
    { key: 'business', label: '📊 Business' },
    { key: 'engineering', label: '🔧 Engineering' },
    { key: 'creative', label: '🎨 Creative' },
    { key: 'law', label: '⚖️ Law' }
  ];

  const handleSubjectChange = (key, value) => {
    setSubjects({ ...subjects, [key]: parseInt(value) });
  };

  const handleInterestChange = (key, value) => {
    setInterests({ ...interests, [key]: parseInt(value) });
  };

  const getRecommendations = async () => {
    if (!aggregate) {
      alert('Please enter your WASSCE aggregate score!');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/api/ai/recommend', {
        aggregate: parseInt(aggregate),
        subjects: subjects,
        interests: interests
      });
      setResults(response.data);
    } catch (error) {
      console.error('Error:', error);
      alert('Error getting AI recommendations. Make sure backend is running!');
    } finally {
      setLoading(false);
    }
  };

  const semanticSearch = async () => {
    if (!semanticQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await API.post('/api/ai/semantic-search', {
        query: semanticQuery
      });
      setSemanticResults(response.data);
    } catch (error) {
      console.error('Semantic search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ color: '#1a5f2b' }}>🤖 AI Career Guidance</h1>
      <p style={{ fontSize: '16px', color: '#555' }}>
        Powered by Machine Learning + SHAP Explainability + GPT Enhancement
      </p>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* Left Column - Input Form */}
        <div>
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
              <small>Medicine: ≤12 | Engineering: ≤16 | Law: ≤12</small>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4>Subject Scores (0-100)</h4>
              {subjectList.map(subj => (
                <div key={subj.key} style={{ marginBottom: '10px' }}>
                  <label>{subj.label}</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={subjects[subj.key]}
                    onChange={(e) => handleSubjectChange(subj.key, e.target.value)}
                    style={{ width: '100%' }}
                  />
                  <span style={{ marginLeft: '10px' }}>{subjects[subj.key]}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4>Interest Areas (0-10)</h4>
              {interestList.map(interest => (
                <div key={interest.key} style={{ marginBottom: '10px' }}>
                  <label>{interest.label}</label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={interests[interest.key] || 0}
                    onChange={(e) => handleInterestChange(interest.key, e.target.value)}
                    style={{ width: '100%' }}
                  />
                  <span style={{ marginLeft: '10px' }}>{interests[interest.key] || 0}</span>
                </div>
              ))}
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
              {loading ? '🤔 AI Analyzing...' : '🎯 Get AI Career Recommendations'}
            </button>
          </div>

          {/* Semantic Search */}
          <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '12px', marginTop: '20px' }}>
            <h3>🔍 Semantic Career Search</h3>
            <p style={{ fontSize: '14px', color: '#666' }}>Describe what you want to do in natural language</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={semanticQuery}
                onChange={(e) => setSemanticQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && semanticSearch()}
                placeholder="e.g., I want to help people and work in hospitals"
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
              />
              <button
                onClick={semanticSearch}
                style={{ padding: '10px 20px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                Search
              </button>
            </div>
            
            {semanticResults && (
              <div style={{ marginTop: '15px' }}>
                <h4>Results for: "{semanticResults.query}"</h4>
                {semanticResults.results.map((r, i) => (
                  <div key={i} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                    <strong>{r.career}</strong>
                    <span style={{ marginLeft: '10px', color: '#1a5f2b' }}>Match: {Math.round(r.similarity_score * 100)}%</span>
                    <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>{r.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Results */}
        <div>
          {results && (
            <div>
              <h3>📊 AI Recommendations</h3>
              {results.predictions.map((pred, idx) => (
                <div
                  key={idx}
                  style={{
                    border: idx === 0 ? '3px solid #ffd700' : '1px solid #e0e0e0',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '20px',
                    background: idx === 0 ? '#fff9e6' : 'white'
                  }}
                >
                  {idx === 0 && <span style={{ fontSize: '28px' }}>🏆</span>}
                  <h2 style={{ color: '#1a5f2b', margin: '10px 0 5px 0' }}>{pred.career}</h2>
                  <div style={{ display: 'inline-block', padding: '4px 12px', background: '#e8f5e9', borderRadius: '20px', marginBottom: '15px' }}>
                    Confidence: {pred.confidence_percentage}%
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <strong>💡 Why this career?</strong>
                    <ul style={{ marginTop: '8px' }}>
                      {pred.shap_factors?.map((factor, i) => (
                        <li key={i} style={{ marginBottom: '5px' }}>
                          {factor.feature.replace('score_', '').replace('interest_', '')}: 
                          <span style={{ color: factor.direction === 'positive' ? '#2e7d32' : '#c62828' }}>
                            {' '}{factor.direction === 'positive' ? '✓ Strong' : '⚠️ Needs improvement'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                    <div><strong>💰 Salary:</strong> {pred.salary_range}</div>
                    <div><strong>🎓 Duration:</strong> {pred.duration_years} years</div>
                    <div><strong>📚 Aggregate:</strong> ≤{pred.typical_aggregate}</div>
                    <div><strong>🏫 Universities:</strong> {pred.universities?.slice(0, 3).join(', ')}</div>
                  </div>

                  <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px' }}>
                    <strong>🤖 AI Guidance</strong>
                    <p style={{ marginTop: '8px', lineHeight: '1.5' }}>
                      {pred.career === results.predictions[0]?.career && results.enhanced_guidance 
                        ? results.enhanced_guidance 
                        : `Your profile suggests ${pred.career} is a strong fit. Research ${pred.universities?.[0] || 'relevant universities'} and focus on required subjects.`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ML Model Info */}
      <div style={{ marginTop: '40px', padding: '20px', background: '#f0f0f0', borderRadius: '12px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: '#666' }}>
          🤖 Trained with Random Forest (200 estimators) • SHAP explainability • GPT-4o-mini enhancement<br/>
          Trained on 5,000+ simulated Ghanaian student profiles • Model accuracy: ~85%
        </p>
      </div>
    </div>
  );
}

export default AIRecommendation;
