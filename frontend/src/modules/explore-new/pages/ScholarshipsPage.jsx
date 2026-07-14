import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ScholarshipsPage = () => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchScholarships();
  }, []);

  const fetchScholarships = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/explore/scholarships').catch(() => ({ data: [] }));
      const data = response.data;
      let schData = [];
      if (Array.isArray(data)) schData = data;
      else if (data.scholarships) schData = data.scholarships;
      else if (data.data) schData = data.data;
      setScholarships(schData);
    } catch (err) {
      console.error('Scholarships error:', err);
      setError(err.message || 'Failed to load scholarships');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #f0f0f0', borderTopColor: '#1a5f2b', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#888' }}>Loading scholarships...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2 style={{ color: '#1a5f2b' }}>💰 Scholarships</h2>
        <p style={{ color: '#c62828' }}>⚠️ {error}</p>
        <button onClick={fetchScholarships} style={{ padding: '8px 20px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ color: '#1a5f2b' }}>💰 Scholarships</h2>
        <span style={{ color: '#888' }}>{scholarships.length} scholarships available</span>
      </div>

      {scholarships.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎓</div>
          <h3 style={{ color: '#666' }}>Scholarships Coming Soon</h3>
          <p style={{ color: '#888', maxWidth: '400px', margin: '0 auto' }}>
            We're working on adding scholarship opportunities. Check back soon!
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {scholarships.map((sch) => (
            <div
              key={sch.id}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                padding: '20px',
                background: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
              }}
            >
              <h3 style={{ color: '#1a5f2b', margin: '0 0 8px 0' }}>{sch.name}</h3>
              {sch.provider && <div style={{ fontSize: '13px', color: '#666' }}>🏛️ {sch.provider}</div>}
              {sch.amount && <div style={{ fontSize: '13px', color: '#666' }}>💰 {sch.amount}</div>}
              {sch.deadline && <div style={{ fontSize: '13px', color: '#666' }}>📅 Deadline: {sch.deadline}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScholarshipsPage;
