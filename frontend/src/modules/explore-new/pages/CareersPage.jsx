import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../../services/api';
import { useModalA11y } from '../../../hooks/useModalA11y';
import { BookOpenIcon, Briefcase, CoinsIcon, TriangleAlertIcon } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import Button from '../../../components/ui/Button';

const CareersPage = ({ user }) => {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCareer, setSelectedCareer] = useState(null);
  const modalRef = useRef(null);
  const closeModal = useCallback(() => setSelectedCareer(null), []);
  useModalA11y({ isOpen: !!selectedCareer, onClose: closeModal, containerRef: modalRef });

  useEffect(() => {
    fetchCareers();
  }, [user?.country]);

  const fetchCareers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/explore/careers', { params: { country: user?.country } });
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
          <div style={{ width: '40px', height: '40px', border: '4px solid var(--surface-sunken)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--gray-500)' }}>Loading careers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <PageHeader icon={Briefcase} title="Careers" />
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p style={{ color: 'var(--danger)' }}><TriangleAlertIcon className="icon-inline" size="1em" aria-hidden="true" /> {error}</p>
          <Button onClick={fetchCareers}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <PageHeader icon={Briefcase} title="Careers" actions={<span style={{ color: 'var(--text-subtle)' }}>{careers.length} careers available</span>} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {careers.map((career) => (
          <div className="card card--interactive" key={career.id} onClick={() => setSelectedCareer(career)} role="button" tabIndex={0} onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedCareer(career);
              }
            }} style={{ padding: '20px' }}>
            <h3 style={{ color: 'var(--primary)', margin: '0 0 8px 0' }}>{career.title}</h3>
            {career.category && (
              <span style={{ background: 'var(--primary-bg)', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', display: 'inline-block' }}>
                {career.category}
              </span>
            )}
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '12px 0' }}>{career.description}</p>
            {career.salary_range && (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}><CoinsIcon className="icon-inline" size="1em" aria-hidden="true" /> {career.salary_range}</div>
            )}
            <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '12px' }}>Click for full details →</div>
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
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="career-modal-title"
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
              onClick={() => setSelectedCareer(null)}
            >
              ✕
            </button>
            <h2 id="career-modal-title" style={{ color: 'var(--primary)' }}>{selectedCareer.title}</h2>
            {selectedCareer.category && (
              <span style={{ background: 'var(--primary-bg)', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', display: 'inline-block' }}>
                {selectedCareer.category}
              </span>
            )}
            <p style={{ color: 'var(--text-muted)', margin: '16px 0' }}>{selectedCareer.description}</p>
            {selectedCareer.salary_range && (
              <div style={{ margin: '8px 0' }}><strong><CoinsIcon className="icon-inline" size="1em" aria-hidden="true" /> Salary Range:</strong> {selectedCareer.salary_range}</div>
            )}
            {selectedCareer.required_subjects && (
              <div style={{ margin: '8px 0' }}>
                <strong><BookOpenIcon className="icon-inline" size="1em" aria-hidden="true" /> Required Subjects:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {selectedCareer.required_subjects.map((subject, i) => (
                    <span key={i} style={{ background: 'var(--surface-sunken)', padding: '4px 10px', borderRadius: '12px', fontSize: '12px' }}>
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <Button onClick={() => setSelectedCareer(null)} style={{ marginTop: '20px', width: '100%' }}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareersPage;
