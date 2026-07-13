import React, { useState, useEffect } from 'react';
import useSavedItems from '../../../hooks/useSavedItems';

const CareerDetail = ({ career, onClose }) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  
  const { saveCareer, unsaveCareer, isCareerSaved, loadSavedItems } = useSavedItems();

  // Check if career is already saved
  useEffect(() => {
    if (career?.id) {
      const isSaved = isCareerSaved(career.id);
      setSaved(isSaved);
    }
  }, [career, isCareerSaved]);

  if (!career) return null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (saved) {
        // Unsave
        const result = await unsaveCareer(career.id);
        if (result.success) {
          setSaved(false);
        } else {
          setError(result.message);
        }
      } else {
        // Save
        const result = await saveCareer(career.id, career);
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
        maxWidth: '800px',
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
          <h2 style={{ color: '#1a5f2b', margin: '0 0 8px 0', fontSize: '28px' }}>
            {career.title}
          </h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {career.category && (
              <span style={{
                background: '#e8f5e9',
                color: '#1a5f2b',
                padding: '4px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 'bold',
              }}>
                {career.category}
              </span>
            )}
            {career.difficulty && (
              <span style={{
                background: '#fff3e0',
                color: '#e65100',
                padding: '4px 14px',
                borderRadius: '20px',
                fontSize: '13px',
              }}>
                {career.difficulty}
              </span>
            )}
          </div>
        </div>

        {/* Status Messages */}
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

        {/* Overview */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#333', fontSize: '16px', marginBottom: '8px' }}>📋 Overview</h3>
          <p style={{ color: '#555', lineHeight: '1.6' }}>{career.description}</p>
        </div>

        {/* Key Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}>
          {career.salary_range && (
            <div style={{ padding: '14px', background: '#f8f9fa', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', color: '#888' }}>💰 Salary Range</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a5f2b' }}>{career.salary_range}</div>
            </div>
          )}
          {career.demand && (
            <div style={{ padding: '14px', background: '#f8f9fa', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', color: '#888' }}>📊 Job Demand</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a5f2b' }}>{career.demand}</div>
            </div>
          )}
          {career.growth && (
            <div style={{ padding: '14px', background: '#f8f9fa', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', color: '#888' }}>📈 Growth Outlook</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a5f2b' }}>{career.growth}</div>
            </div>
          )}
          {career.ai_score && (
            <div style={{ padding: '14px', background: '#f8f9fa', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', color: '#888' }}>🤖 AI Suitability</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a5f2b' }}>{career.ai_score}%</div>
            </div>
          )}
        </div>

        {/* WASSCE Subjects */}
        {career.required_subjects && career.required_subjects.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#333', fontSize: '16px', marginBottom: '8px' }}>📚 Required WASSCE Subjects</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {career.required_subjects.map((subject, i) => (
                <span key={i} style={{
                  background: '#e3f2fd',
                  color: '#1565c0',
                  padding: '4px 14px',
                  borderRadius: '16px',
                  fontSize: '13px',
                }}>
                  {subject}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Skills */}
        {career.skills && career.skills.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#333', fontSize: '16px', marginBottom: '8px' }}>🛠️ Key Skills</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {career.skills.map((skill, i) => (
                <span key={i} style={{
                  background: '#f3e5f5',
                  color: '#6a1b9a',
                  padding: '4px 14px',
                  borderRadius: '16px',
                  fontSize: '13px',
                }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Universities */}
        {career.universities && career.universities.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#333', fontSize: '16px', marginBottom: '8px' }}>🏛️ Recommended Universities</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {career.universities.map((uni, i) => (
                <span key={i} style={{
                  background: '#e8f5e9',
                  color: '#1a5f2b',
                  padding: '4px 14px',
                  borderRadius: '16px',
                  fontSize: '13px',
                }}>
                  {uni}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Learning Roadmap */}
        {career.roadmap && career.roadmap.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#333', fontSize: '16px', marginBottom: '12px' }}>🗺️ Learning Roadmap</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {career.roadmap.map((step, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                }}>
                  <span style={{
                    background: '#1a5f2b',
                    color: 'white',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </span>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{step.title}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{step.duration}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Match Score */}
        {career.ai_match !== undefined && (
          <div style={{
            padding: '16px',
            background: '#e8f5e9',
            borderRadius: '10px',
            marginBottom: '20px',
            border: '1px solid #c8e6c9',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', color: '#1a5f2b' }}>🤖 Your Match Score</span>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a5f2b' }}>
                {career.ai_match}%
              </span>
            </div>
            <div style={{ height: '6px', background: '#e0e0e0', borderRadius: '3px', marginTop: '8px' }}>
              <div style={{
                width: `${career.ai_match}%`,
                height: '100%',
                background: '#1a5f2b',
                borderRadius: '3px',
              }} />
            </div>
          </div>
        )}

        {/* Action Buttons - COMPLETE */}
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
            {saving ? '⏳ Saving...' : saved ? '✅ Saved' : '💾 Save Career'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CareerDetail;
