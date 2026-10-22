import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../services/api';
import { useModalA11y } from '../../../hooks/useModalA11y';
import { BookOpenIcon, ChartColumnIcon, Landmark, MapPinIcon, TriangleAlertIcon, TrophyIcon } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import Button from '../../../components/ui/Button';

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
          <div style={{ width: '40px', height: '40px', border: '4px solid var(--surface-sunken)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--gray-500)' }}>Loading universities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <PageHeader icon={Landmark} title="Universities" />
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p style={{ color: 'var(--danger)' }}><TriangleAlertIcon className="icon-inline" size="1em" aria-hidden="true" /> {error}</p>
          <Button onClick={fetchUniversities}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <PageHeader icon={Landmark} title="Universities" actions={<span style={{ color: 'var(--text-subtle)' }}>{universities.length} universities available</span>} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {universities.map((uni) => (
          <div className="card card--interactive" key={uni.id} onClick={() => setSelectedUniversity(uni)} role="button" tabIndex={0} onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedUniversity(uni);
              }
            }} style={{ padding: '20px' }}>
            <h3 style={{ color: 'var(--primary)', margin: '0 0 8px 0' }}>{uni.name}</h3>
            {uni.location && <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}><MapPinIcon className="icon-inline" size="1em" aria-hidden="true" /> {uni.location}</div>}
            {uni.cutoff && <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Cutoff: {uni.cutoff}</div>}
            {uni.programs && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                {uni.programs.slice(0, 3).map((program, i) => (
                  <span key={i} style={{ background: 'var(--surface-sunken)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                    {program}
                  </span>
                ))}
                {uni.programs.length > 3 && (
                  <span style={{ background: 'var(--surface-sunken)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px' }}>
                    +{uni.programs.length - 3} more
                  </span>
                )}
              </div>
            )}
            <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '12px' }}>Click for full details →</div>
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
              style={{ float: 'right', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--gray-500)' }}
              onClick={() => setSelectedUniversity(null)}
            >
              ✕
            </button>
            <h2 id="university-modal-title" style={{ color: 'var(--primary)' }}>{selectedUniversity.name}</h2>
            {selectedUniversity.location && <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}><MapPinIcon className="icon-inline" size="1em" aria-hidden="true" /> {selectedUniversity.location}</div>}
            {selectedUniversity.cutoff && <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}><ChartColumnIcon className="icon-inline" size="1em" aria-hidden="true" /> Cutoff: {selectedUniversity.cutoff}</div>}
            {selectedUniversity.ranking && <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}><TrophyIcon className="icon-inline" size="1em" aria-hidden="true" /> Ranking: {selectedUniversity.ranking}</div>}
            {selectedUniversity.about && <p style={{ color: 'var(--text-muted)', margin: '16px 0' }}>{selectedUniversity.about}</p>}
            {selectedUniversity.programs && (
              <div style={{ margin: '8px 0' }}>
                <strong><BookOpenIcon className="icon-inline" size="1em" aria-hidden="true" /> Programs Offered:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {selectedUniversity.programs.map((program, i) => (
                    <span key={i} style={{ background: 'var(--surface-sunken)', padding: '4px 10px', borderRadius: '12px', fontSize: '12px' }}>
                      {program}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <Button onClick={() => setSelectedUniversity(null)} style={{ marginTop: '20px', width: '100%' }}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversitiesPage;
