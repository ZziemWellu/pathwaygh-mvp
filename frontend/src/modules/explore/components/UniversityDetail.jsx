import React, { useState, useEffect } from 'react';
import useSavedItems from '../../../hooks/useSavedItems';

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
            color: '#888',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#333'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ color: '#1a5f2b', margin: '0 0 8px 0', fontSize: '24px' }}>
            🏛️ {university.name}
          </h2>
          {university.location && (
            <div style={{ color: '#666', fontSize: '14px' }}>
              📍 {university.location}
            </div>
          )}
        </div>

        {error && (
          <div style={{
            padding: '12px',
            background: '#ffebee',
            border: '1px solid #ffcdd2',
            borderRadius: '8px',
            marginBottom: '16px',
            color: '#c62828',
            textAlign: 'center',
          }}>
            ⚠️ {error}
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
            <div style={{ padding: '14px', background: '#f8f9fa', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', color: '#888' }}>📊 Cutoff</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a5f2b' }}>{university.cutoff}</div>
            </div>
          )}
          {university.ranking && (
            <div style={{ padding: '14px', background: '#f8f9fa', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', color: '#888' }}>🏆 Ranking</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a5f2b' }}>#{university.ranking}</div>
            </div>
          )}
          {university.type && (
            <div style={{ padding: '14px', background: '#f8f9fa', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', color: '#888' }}>🏛️ Type</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a5f2b' }}>{university.type}</div>
            </div>
          )}
        </div>

        {/* Description */}
        {university.description && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#333', fontSize: '16px', marginBottom: '8px' }}>📋 About</h3>
            <p style={{ color: '#555', lineHeight: '1.6' }}>{university.description}</p>
          </div>
        )}

        {/* Programs */}
        {university.programs && university.programs.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#333', fontSize: '16px', marginBottom: '8px' }}>📚 Programs Offered</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {university.programs.map((program, i) => (
                <span key={i} style={{
                  background: '#e3f2fd',
                  color: '#1565c0',
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
            <h3 style={{ color: '#333', fontSize: '16px', marginBottom: '8px' }}>📋 WASSCE Requirements</h3>
            <ul style={{ color: '#555', lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
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
            background: '#e8f5e9',
            borderRadius: '10px',
            marginBottom: '20px',
            border: '1px solid #c8e6c9',
          }}>
            <h4 style={{ color: '#1a5f2b', margin: '0 0 8px 0' }}>🎓 Admission Information</h4>
            <p style={{ color: '#555', margin: 0 }}>{university.admission_info}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              background: '#1a5f2b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              flex: 1,
              transition: 'background 0.2s ease',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#144d21'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#1a5f2b'}
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '10px 24px',
              background: saved ? '#e8f5e9' : 'white',
              color: saved ? '#1a5f2b' : '#1a5f2b',
              border: saved ? '2px solid #1a5f2b' : '1px solid #1a5f2b',
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
                e.currentTarget.style.background = '#e8f5e9';
              }
            }}
            onMouseLeave={(e) => {
              if (!saving && !saved) {
                e.currentTarget.style.background = 'white';
              }
            }}
          >
            {saving ? '⏳ Saving...' : saved ? '✅ Saved' : '💾 Save University'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UniversityDetail;
