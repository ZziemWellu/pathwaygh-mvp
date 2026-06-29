import React, { useState } from 'react';
import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001' });

function WhatIfSimulator({ currentAggregate, career }) {
  const [targetAggregate, setTargetAggregate] = useState(currentAggregate || 12);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const simulate = async () => {
    setLoading(true);
    try {
      const response = await API.post('/api/admission-chance', {
        career: career,
        aggregate: targetAggregate,
        subjects: ['Biology', 'Chemistry', 'Physics']
      });
      setResults(response.data);
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: '#f5f5f5',
      padding: '20px',
      borderRadius: '12px',
      marginTop: '20px'
    }}>
      <h4 style={{ marginTop: 0, color: '#1a5f2b' }}>🎯 "What If" Simulator</h4>
      <p style={{ fontSize: '14px', color: '#666' }}>
        See how improving your aggregate affects your admission chances
      </p>

      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <label>Your Aggregate</label>
          <input
            type="range"
            min="6"
            max="36"
            value={targetAggregate}
            onChange={(e) => setTargetAggregate(parseInt(e.target.value))}
            style={{ width: '200px' }}
          />
          <span style={{ marginLeft: '10px', fontWeight: 'bold', fontSize: '18px' }}>
            {targetAggregate}
          </span>
        </div>
        <button
          onClick={simulate}
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#1a5f2b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Simulating...' : 'See Changes'}
        </button>
      </div>

      {results && results.predictions && (
        <div style={{ marginTop: '15px' }}>
          <h5>Admission Chances</h5>
          {results.predictions.map((pred, idx) => (
            <div key={idx} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px',
              marginBottom: '5px',
              background: 'white',
              borderRadius: '4px'
            }}>
              <span>{pred.university}</span>
              <span style={{
                fontWeight: 'bold',
                color: pred.admission_chance >= 70 ? '#2e7d32' :
                       pred.admission_chance >= 40 ? '#f57c00' : '#c62828'
              }}>
                {pred.admission_chance}%
              </span>
            </div>
          ))}
          
          <div style={{
            marginTop: '10px',
            padding: '10px',
            background: '#e3f2fd',
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            <strong>Tip:</strong> {targetAggregate <= 10 ? 
              'Great! You are very competitive for most programs.' :
              targetAggregate <= 15 ?
              'Good! You qualify for many programs. Consider improving your aggregate for more options.' :
              'Consider improving your aggregate by focusing on your weakest subjects.'
            }
          </div>
        </div>
      )}
    </div>
  );
}

export default WhatIfSimulator;
