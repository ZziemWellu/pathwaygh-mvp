import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const CareersPage = () => {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCareer, setSelectedCareer] = useState(null);

  useEffect(() => {
    fetchCareers();
  }, []);

  const fetchCareers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/explore/careers');
      const data = response.data;
      let careerData = [];
      if (Array.isArray(data)) careerData = data;
      else if (data.careers) careerData = data.careers;
      else if (data.data) careerData = data.data;
      setCareers(careerData);
    } catch (err) {
      console.error('Careers error:', err);
      setError(err.message || 'Failed to load careers');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #f0f0f0', borderTopColor: '#1a5f2b', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#888' }}>Loading careers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2 style={{ color: '#1a5f2b' }}>💼 Careers</h2>
        <p style={{ color: '#c62828' }}>⚠️ {error}</p>
        <button onClick={fetchCareers} style={{ padding: '8px 20px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ color: '#1a5f2b' }}>💼 Careers</h2>
        <span style={{ color: '#888' }}>{careers.length} careers available</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {careers.map((career) => (
          <div
            key={career.id}
            onClick={() => setSelectedCareer(career)}
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              padding: '20px',
              background: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)'; }}
          >
            <h3 style={{ color: '#1a5f2b', margin: '0 0 8px 0' }}>{career.title}</h3>
            {career.category && (
              <span style={{ background: '#e8f5e9', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', display: 'inline-block' }}>
                {career.category}
              </span>
            )}
            <p style={{ color: '#555', fontSize: '14px', margin: '12px 0' }}>{career.description}</p>
            {career.salary_range && (
              <div style={{ fontSize: '13px', color: '#666' }}>💰 {career.salary_range}</div>
            )}
            <div style={{ fontSize: '12px', color: '#888', marginTop: '12px' }}>Click for full details →</div>
          </div>
        ))}
      </div>

      {/* Career Detail Modal */}
      {selectedCareer && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setSelectedCareer(null)}
        >
          <div
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '16px',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              width: '100%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{ float: 'right', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#888' }}
              onClick={() => setSelectedCareer(null)}
            >
              ✕
            </button>
            <h2 style={{ color: '#1a5f2b' }}>{selectedCareer.title}</h2>
            {selectedCareer.category && (
              <span style={{ background: '#e8f5e9', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', display: 'inline-block' }}>
                {selectedCareer.category}
              </span>
            )}
            <p style={{ color: '#555', margin: '16px 0' }}>{selectedCareer.description}</p>
            {selectedCareer.salary_range && (
              <div style={{ margin: '8px 0' }}><strong>💰 Salary Range:</strong> {selectedCareer.salary_range}</div>
            )}
            {selectedCareer.required_subjects && (
              <div style={{ margin: '8px 0' }}>
                <strong>📚 Required Subjects:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {selectedCareer.required_subjects.map((subject, i) => (
                    <span key={i} style={{ background: '#f0f0f0', padding: '4px 10px', borderRadius: '12px', fontSize: '12px' }}>
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <button
              style={{ marginTop: '20px', padding: '10px 20px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%' }}
              onClick={() => setSelectedCareer(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareersPage;
