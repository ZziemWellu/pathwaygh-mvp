import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../services/api';
import { useModalA11y } from '../../../hooks/useModalA11y';

const UniversitiesPage = ({ user }) => {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const modalRef = useRef(null);
  const closeModal = useCallback(() => setSelectedUniversity(null), []);
  useModalA11y({ isOpen: !!selectedUniversity, onClose: closeModal, containerRef: modalRef });

  useEffect(() => {
    fetchUniversities();
  }, [user?.country]);

  const fetchUniversities = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/explore/universities', { params: { country: user?.country } });
      const data = response.data;
      let uniData = [];
      if (Array.isArray(data)) uniData = data;
      else if (data.universities) uniData = data.universities;
      else if (data.data) uniData = data.data;
      setUniversities(uniData);
    } catch (err) {
      console.error('Universities error:', err);
      setError(err.message || 'Failed to load universities');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #f0f0f0', borderTopColor: '#1a5f2b', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#666666' }}>Loading universities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2 style={{ color: '#1a5f2b' }}>🏛️ Universities</h2>
        <p style={{ color: '#c62828' }}>⚠️ {error}</p>
        <button onClick={fetchUniversities} style={{ padding: '8px 20px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ color: '#1a5f2b' }}>🏛️ Universities</h2>
        <span style={{ color: '#666666' }}>{universities.length} universities available</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {universities.map((uni) => (
          <div
            key={uni.id}
            onClick={() => setSelectedUniversity(uni)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedUniversity(uni);
              }
            }}
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
            <h3 style={{ color: '#1a5f2b', margin: '0 0 8px 0' }}>{uni.name}</h3>
            {uni.location && <div style={{ fontSize: '13px', color: '#666' }}>📍 {uni.location}</div>}
            {uni.cutoff && <div style={{ fontSize: '13px', color: '#666' }}>Cutoff: {uni.cutoff}</div>}
            {uni.programs && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                {uni.programs.slice(0, 3).map((program, i) => (
                  <span key={i} style={{ background: '#f0f0f0', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                    {program}
                  </span>
                ))}
                {uni.programs.length > 3 && (
                  <span style={{ background: '#f0f0f0', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                    +{uni.programs.length - 3} more
                  </span>
                )}
              </div>
            )}
            <div style={{ fontSize: '12px', color: '#666666', marginTop: '12px' }}>Click for full details →</div>
          </div>
        ))}
      </div>

      {/* University Detail Modal */}
      {selectedUniversity && (
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
          onClick={() => setSelectedUniversity(null)}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="university-modal-title"
            tabIndex={-1}
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
              aria-label="Close"
              style={{ float: 'right', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666666' }}
              onClick={() => setSelectedUniversity(null)}
            >
              ✕
            </button>
            <h2 id="university-modal-title" style={{ color: '#1a5f2b' }}>{selectedUniversity.name}</h2>
            {selectedUniversity.location && <div style={{ fontSize: '14px', color: '#666' }}>📍 {selectedUniversity.location}</div>}
            {selectedUniversity.cutoff && <div style={{ fontSize: '14px', color: '#666' }}>📊 Cutoff: {selectedUniversity.cutoff}</div>}
            {selectedUniversity.ranking && <div style={{ fontSize: '14px', color: '#666' }}>🏆 Ranking: {selectedUniversity.ranking}</div>}
            {selectedUniversity.about && <p style={{ color: '#555', margin: '16px 0' }}>{selectedUniversity.about}</p>}
            {selectedUniversity.programs && (
              <div style={{ margin: '8px 0' }}>
                <strong>📚 Programs Offered:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {selectedUniversity.programs.map((program, i) => (
                    <span key={i} style={{ background: '#f0f0f0', padding: '4px 10px', borderRadius: '12px', fontSize: '12px' }}>
                      {program}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <button
              style={{ marginTop: '20px', padding: '10px 20px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%' }}
              onClick={() => setSelectedUniversity(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversitiesPage;
