import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import api from '../../../services/api';
import { useModalA11y } from '../../../hooks/useModalA11y';
import { BookOpenIcon, Briefcase, CoinsIcon, GraduationCapIcon, LandmarkIcon, RouteIcon, TriangleAlertIcon } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import Button from '../../../components/ui/Button';
import SourceList, { chipStyle, controlStyle } from '../components/SourceList';

const ROUTE_LABELS = {
  university: 'University',
  tvet: 'TVET',
  university_or_tvet: 'University or TVET',
  college: 'Specialist college',
  service_entry: 'Service recruitment',
};

const CareersPage = ({ user }) => {
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
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

  const categories = useMemo(
    () => [...new Set(careers.map((c) => c.category).filter(Boolean))].sort(),
    [careers],
  );

  const visibleCareers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return careers.filter((c) => {
      if (category !== 'all' && c.category !== category) return false;
      if (!term) return true;
      return [c.title, c.description, ...(c.required_subjects || [])].some((text) => text?.toLowerCase().includes(term));
    });
  }, [careers, searchTerm, category]);

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
      <PageHeader icon={Briefcase} title="Careers" actions={<span style={{ color: 'var(--text-subtle)' }}>{visibleCareers.length} careers available</span>} />

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input
          type="text"
          aria-label="Search careers"
          placeholder="Search careers or subjects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ ...controlStyle, flex: 1, minWidth: '200px' }}
        />
        <select aria-label="Filter by sector" value={category} onChange={(e) => setCategory(e.target.value)} style={controlStyle}>
          <option value="all">All sectors</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {visibleCareers.length === 0 && (
        <p style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-500)' }}>No careers match your search.</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {visibleCareers.map((career) => (
          <div className="card card--interactive" key={career.id} onClick={() => setSelectedCareer(career)} role="button" tabIndex={0} onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedCareer(career);
              }
            }} style={{ padding: '20px' }}>
            <h3 style={{ color: 'var(--primary)', margin: '0 0 8px 0' }}>{career.title}</h3>
            {career.category && (
              <span style={{ background: 'var(--primary-bg)', padding: '2px 10px', borderRadius: '12px', fontSize: '0.875rem', display: 'inline-block' }}>
                {career.category}
              </span>
            )}
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem', margin: '12px 0' }}>{career.description}</p>
            {career.salary_range && (
              <div style={{ fontSize: '0.9375rem', color: 'var(--text-muted)' }}><CoinsIcon className="icon-inline" size="1em" aria-hidden="true" /> {career.salary_range}</div>
            )}
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '12px' }}>Click for full details →</div>
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
              style={{ float: 'right', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--gray-500)' }}
              onClick={() => setSelectedCareer(null)}
            >
              ✕
            </button>
            <h2 id="career-modal-title" style={{ color: 'var(--primary)' }}>{selectedCareer.title}</h2>
            {selectedCareer.category && (
              <span style={{ background: 'var(--primary-bg)', padding: '2px 10px', borderRadius: '12px', fontSize: '0.875rem', display: 'inline-block' }}>
                {selectedCareer.category}
              </span>
            )}
            <p style={{ color: 'var(--text-muted)', margin: '16px 0' }}>{selectedCareer.description}</p>
            {selectedCareer.salary_range && (
              <div style={{ margin: '8px 0' }}><strong><CoinsIcon className="icon-inline" size="1em" aria-hidden="true" /> Salary Range:</strong> {selectedCareer.salary_range}</div>
            )}
            {selectedCareer.education_path && (
              <div style={{ margin: '12px 0' }}>
                <strong><RouteIcon className="icon-inline" size="1em" aria-hidden="true" /> How to get there</strong>
                <ul style={{ margin: '4px 0 0', paddingLeft: '18px', color: 'var(--text-muted)' }}>
                  <li><strong>SHS programme:</strong> {selectedCareer.education_path.shs_programmes.join(', ')}</li>
                  <li><strong>After SHS:</strong> {selectedCareer.education_path.after_shs}</li>
                  {ROUTE_LABELS[selectedCareer.education_path.route] && (
                    <li><strong>Route:</strong> {ROUTE_LABELS[selectedCareer.education_path.route]}</li>
                  )}
                </ul>
              </div>
            )}
            {selectedCareer.required_subjects && (
              <div style={{ margin: '8px 0' }}>
                <strong><BookOpenIcon className="icon-inline" size="1em" aria-hidden="true" /> WASSCE subjects that matter:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {selectedCareer.required_subjects.map((subject, i) => (
                    <span key={i} style={chipStyle}>{subject}</span>
                  ))}
                </div>
                {selectedCareer.wassce_subjects?.core && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '6px 0 0' }}>
                    Plus good passes in the core subjects: {selectedCareer.wassce_subjects.core.join(', ')}.
                  </p>
                )}
              </div>
            )}
            {(selectedCareer.ghana_institutions?.length > 0 || selectedCareer.other_training) && (
              <div style={{ margin: '12px 0' }}>
                <strong><GraduationCapIcon className="icon-inline" size="1em" aria-hidden="true" /> Where to train in Ghana (examples)</strong>
                {selectedCareer.ghana_institutions?.length > 0 && (
                  <ul style={{ margin: '4px 0 0', paddingLeft: '18px', color: 'var(--text-muted)' }}>
                    {selectedCareer.ghana_institutions.map((name) => <li key={name}>{name}</li>)}
                  </ul>
                )}
                {selectedCareer.other_training && (
                  <p style={{ color: 'var(--text-muted)', margin: '4px 0 0' }}>{selectedCareer.other_training}</p>
                )}
              </div>
            )}
            {selectedCareer.professional_body && (
              <div style={{ margin: '8px 0' }}>
                <strong><LandmarkIcon className="icon-inline" size="1em" aria-hidden="true" /> Regulator in Ghana:</strong>{' '}
                <a href={selectedCareer.professional_body.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                  {selectedCareer.professional_body.name}
                </a>
              </div>
            )}
            <SourceList sources={selectedCareer.source} lastChecked={selectedCareer.last_checked} />
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
