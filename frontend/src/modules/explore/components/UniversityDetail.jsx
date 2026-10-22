import React, { useState, useEffect } from 'react';
import useSavedItems from '../../../hooks/useSavedItems';
import { BookOpenIcon, ChartColumnIcon, ClipboardListIcon, GraduationCapIcon, LandmarkIcon, MapPinIcon, TriangleAlertIcon, TrophyIcon } from 'lucide-react';
import Button from '../../../components/ui/Button';

const UniversityDetail = ({ university, onClose }) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  
  const { saveUniversity, unsaveUniversity, isUniversitySaved } = useSavedItems();

  useEffect(() => {
    if (university?.id) {
      const isSaved = isUniversitySaved(university.id);
      setSaved(isSaved);
    }
  }, [university, isUniversitySaved]);

  if (!university) return null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (saved) {
        const result = await unsaveUniversity(university.id);
        if (result.success) {
          setSaved(false);
        } else {
          setError(result.message);
        }
      } else {
        const result = await saveUniversity(university.id, university);
        if (result.success) {
          setSaved(true);
        } else {
          setError(result.message);
        }
      }
    } catch (err) {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
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
      padding: '20px',
      overflow: 'auto',
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '16px',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflow: 'auto',
        width: '100%',
        position: 'relative',
      }} onClick={(e) => e.stopPropagation()}>
        
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '20px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: 'var(--gray-500)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--gray-500)'}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--primary)', margin: '0 0 8px 0', fontSize: '24px' }}>
            <LandmarkIcon className="icon-inline" size="1em" aria-hidden="true" /> {university.name}
          </h2>
          {university.location && (
            <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              <MapPinIcon className="icon-inline" size="1em" aria-hidden="true" /> {university.location}
            </div>
          )}
        </div>

        {error && (
          <div style={{
            padding: '12px',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: '8px',
            marginBottom: '16px',
            color: 'var(--danger)',
            textAlign: 'center',
          }}>
            <TriangleAlertIcon className="icon-inline" size="1em" aria-hidden="true" /> {error}
          </div>
        )}

        {/* Quick Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}>
          {university.cutoff && (
            <div style={{ padding: '14px', background: 'var(--surface-muted)', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}><ChartColumnIcon className="icon-inline" size="1em" aria-hidden="true" /> Cutoff</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--primary)' }}>{university.cutoff}</div>
            </div>
          )}
          {university.ranking && (
            <div style={{ padding: '14px', background: 'var(--surface-muted)', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}><TrophyIcon className="icon-inline" size="1em" aria-hidden="true" /> Ranking</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--primary)' }}>#{university.ranking}</div>
            </div>
          )}
          {university.type && (
            <div style={{ padding: '14px', background: 'var(--surface-muted)', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}><LandmarkIcon className="icon-inline" size="1em" aria-hidden="true" /> Type</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--primary)' }}>{university.type}</div>
            </div>
          )}
        </div>

        {/* Description */}
        {university.description && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: 'var(--text)', fontSize: '16px', marginBottom: '8px' }}><ClipboardListIcon className="icon-inline" size="1em" aria-hidden="true" /> About</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>{university.description}</p>
          </div>
        )}

        {/* Programs */}
        {university.programs && university.programs.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: 'var(--text)', fontSize: '16px', marginBottom: '8px' }}><BookOpenIcon className="icon-inline" size="1em" aria-hidden="true" /> Programs Offered</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {university.programs.map((program, i) => (
                <span key={i} style={{
                  background: 'var(--info-bg)',
                  color: 'var(--secondary)',
                  padding: '4px 14px',
                  borderRadius: '16px',
                  fontSize: '13px',
                }}>
                  {program}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* WASSCE Requirements */}
        {university.requirements && university.requirements.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: 'var(--text)', fontSize: '16px', marginBottom: '8px' }}><ClipboardListIcon className="icon-inline" size="1em" aria-hidden="true" /> WASSCE Requirements</h3>
            <ul style={{ color: 'var(--text-muted)', lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
              {university.requirements.map((req, i) => (
                <li key={i}>{req}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Admission Info */}
        {university.admission_info && (
          <div style={{
            padding: '16px',
            background: 'var(--primary-bg)',
            borderRadius: '10px',
            marginBottom: '20px',
            border: '1px solid var(--primary-border)',
          }}>
            <h4 style={{ color: 'var(--primary)', margin: '0 0 8px 0' }}><GraduationCapIcon className="icon-inline" size="1em" aria-hidden="true" /> Admission Information</h4>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>{university.admission_info}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button onClick={onClose} style={{ flex: 1 }}>
            Close
          </Button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 24px',
              background: saved ? 'var(--primary-bg)' : 'white',
              color: saved ? 'var(--primary)' : 'var(--primary)',
              border: saved ? '2px solid var(--primary)' : '1px solid var(--primary)',
              borderRadius: '8px',
              cursor: saving ? 'default' : 'pointer',
              fontSize: '14px',
              flex: 1,
              transition: 'all 0.2s ease',
              opacity: saving ? 0.6 : 1,
              fontWeight: saved ? 'bold' : 'normal',
            }}
            onMouseEnter={(e) => {
              if (!saving && !saved) {
                e.currentTarget.style.background = 'var(--primary-bg)';
              }
            }}
            onMouseLeave={(e) => {
              if (!saving && !saved) {
                e.currentTarget.style.background = 'white';
              }
            }}
          >
            {saving ? 'Saving...' : saved ? 'Saved' : 'Save University'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UniversityDetail;
