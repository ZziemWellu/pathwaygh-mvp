import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import api from '../../../services/api';
import { useModalA11y } from '../../../hooks/useModalA11y';
import { BadgeCheckIcon, BookOpenIcon, ChartColumnIcon, GlobeIcon, Landmark, MapPinIcon, TriangleAlertIcon, TrophyIcon } from 'lucide-react';
import PageHeader from '../../../components/ui/PageHeader';
import Button from '../../../components/ui/Button';
import SourceList, { controlStyle } from '../components/SourceList';
import { formatDate } from '../../../utils/date';

const longDate = (value) => (value ? formatDate(new Date(value), { long: true }) : null);

const UniversitiesPage = ({ user }) => {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
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

  const types = useMemo(
    () => [...new Set(universities.map((u) => u.type).filter(Boolean))].sort(),
    [universities],
  );

  const visibleUniversities = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return universities.filter((u) => {
      if (typeFilter !== 'all' && u.type !== typeFilter) return false;
      if (!term) return true;
      return [u.name, u.location].some((text) => text?.toLowerCase().includes(term));
    });
  }, [universities, searchTerm, typeFilter]);

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
      <PageHeader icon={Landmark} title="Universities" actions={<span style={{ color: 'var(--text-subtle)' }}>{visibleUniversities.length} institutions</span>} />

      {user?.country === 'GH' || !user?.country ? (
        <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>
          Ghanaian institutions listed here have active accreditation on the Ghana Tertiary Education Commission (GTEC) list.
          Always confirm on <a href="https://gtec.edu.gh/status-check/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>GTEC's status check</a> before you apply or pay fees.
        </p>
      ) : null}

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input
          type="text"
          aria-label="Search institutions"
          placeholder="Search by name or town..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ ...controlStyle, flex: 1, minWidth: '200px' }}
        />
        <select aria-label="Filter by institution type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={controlStyle}>
          <option value="all">All types</option>
          {types.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {visibleUniversities.length === 0 && (
        <p style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-500)' }}>No institutions match your search.</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {visibleUniversities.map((uni) => (
          <div className="card card--interactive" key={uni.id} onClick={() => setSelectedUniversity(uni)} role="button" tabIndex={0} onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setSelectedUniversity(uni);
              }
            }} style={{ padding: '20px' }}>
            <h3 style={{ color: 'var(--primary)', margin: '0 0 8px 0' }}>{uni.name}</h3>
            {uni.location && <div style={{ fontSize: '0.9375rem', color: 'var(--text-muted)' }}><MapPinIcon className="icon-inline" size="1em" aria-hidden="true" /> {uni.location}</div>}
            {uni.type && <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px' }}>{uni.type}</div>}
            {uni.cutoff && <div style={{ fontSize: '0.9375rem', color: 'var(--text-muted)' }}>Cutoff: {uni.cutoff}</div>}
            {uni.programs && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                {uni.programs.slice(0, 3).map((program, i) => (
                  <span key={i} style={{ background: 'var(--surface-sunken)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8125rem' }}>
                    {program}
                  </span>
                ))}
                {uni.programs.length > 3 && (
                  <span style={{ background: 'var(--surface-sunken)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8125rem' }}>
                    +{uni.programs.length - 3} more
                  </span>
                )}
              </div>
            )}
            <div style={{ fontSize: '0.875rem', color: 'var(--gray-500)', marginTop: '12px' }}>Click for full details →</div>
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
              style={{ float: 'right', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--gray-500)' }}
              onClick={() => setSelectedUniversity(null)}
            >
              ✕
            </button>
            <h2 id="university-modal-title" style={{ color: 'var(--primary)' }}>{selectedUniversity.name}</h2>
            {selectedUniversity.location && <div style={{ fontSize: '0.9375rem', color: 'var(--text-muted)' }}><MapPinIcon className="icon-inline" size="1em" aria-hidden="true" /> {selectedUniversity.location}</div>}
            {selectedUniversity.cutoff && <div style={{ fontSize: '0.9375rem', color: 'var(--text-muted)' }}><ChartColumnIcon className="icon-inline" size="1em" aria-hidden="true" /> Cutoff: {selectedUniversity.cutoff}</div>}
            {selectedUniversity.ranking && <div style={{ fontSize: '0.9375rem', color: 'var(--text-muted)' }}><TrophyIcon className="icon-inline" size="1em" aria-hidden="true" /> Ranking: {selectedUniversity.ranking}</div>}
            {selectedUniversity.type && <div style={{ fontSize: '0.9375rem', color: 'var(--text-muted)' }}>{selectedUniversity.type}</div>}
            {(selectedUniversity.description || selectedUniversity.about) && (
              <p style={{ color: 'var(--text-muted)', margin: '16px 0' }}>{selectedUniversity.description || selectedUniversity.about}</p>
            )}
            {selectedUniversity.accreditation && (
              <div style={{ margin: '8px 0', fontSize: '0.9375rem' }}>
                <BadgeCheckIcon className="icon-inline" size="1em" aria-hidden="true" />{' '}
                <strong>Accreditation:</strong> {selectedUniversity.accreditation.status} on the{' '}
                <a href={selectedUniversity.accreditation.list_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>GTEC list</a>
                {selectedUniversity.accreditation.end && <> (until {longDate(selectedUniversity.accreditation.end)})</>}
                {selectedUniversity.accreditation.list_checked && <>, checked {longDate(selectedUniversity.accreditation.list_checked)}</>}
              </div>
            )}
            {selectedUniversity.website && (
              <div style={{ margin: '8px 0', fontSize: '0.9375rem' }}>
                <GlobeIcon className="icon-inline" size="1em" aria-hidden="true" />{' '}
                <a href={selectedUniversity.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>{selectedUniversity.website}</a>
              </div>
            )}
            {selectedUniversity.admissions_url && (
              <div style={{ margin: '8px 0', fontSize: '0.9375rem' }}>
                <a href={selectedUniversity.admissions_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>Official admissions portal</a>
              </div>
            )}
            {selectedUniversity.requirements?.length > 0 && (
              <div style={{ margin: '8px 0' }}>
                <strong>General requirements</strong>
                <ul style={{ margin: '4px 0 0', paddingLeft: '18px', color: 'var(--text-muted)' }}>
                  {selectedUniversity.requirements.map((r) => <li key={r}>{r}</li>)}
                </ul>
              </div>
            )}
            {selectedUniversity.admission_info && <p style={{ color: 'var(--text-muted)', fontSize: '0.9375rem' }}>{selectedUniversity.admission_info}</p>}
            {selectedUniversity.programs && (
              <div style={{ margin: '8px 0' }}>
                <strong><BookOpenIcon className="icon-inline" size="1em" aria-hidden="true" /> Programs Offered:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {selectedUniversity.programs.map((program, i) => (
                    <span key={i} style={{ background: 'var(--surface-sunken)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.875rem' }}>
                      {program}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <SourceList sources={selectedUniversity.source} lastChecked={selectedUniversity.last_checked} />
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
