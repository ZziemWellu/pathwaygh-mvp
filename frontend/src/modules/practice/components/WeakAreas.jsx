import React from 'react';

const WeakAreas = ({ weakAreas, onBack, onPractice }) => {
  if (weakAreas.length === 0) {
    return (
      <div style={{ width: '100%' }}>
        <h2 style={{ color: '#1a5f2b', marginBottom: '16px' }}>🎯 Weak Areas</h2>
        <div style={{
          padding: '40px',
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          textAlign: 'center',
          color: '#888'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌟</div>
          <p style={{ margin: 0, fontSize: '16px' }}>No weak areas identified. Keep up the great work!</p>
        </div>
        <button
          onClick={onBack}
          style={{
            marginTop: '16px',
            padding: '10px 20px',
            background: '#f0f0f0',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          ← Back to Results
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <h2 style={{ color: '#1a5f2b', marginBottom: '8px' }}>🎯 Weak Areas</h2>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        Focus on these topics to improve your scores.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {weakAreas.map((area, index) => (
          <div
            key={index}
            style={{
              padding: '16px 20px',
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '10px',
              borderLeft: `4px solid #f44336`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '15px' }}>
                  {area.subjectName || area.subject || 'Unknown Subject'}
                </div>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  {area.topicName || area.topic || 'General'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f44336' }}>
                  {area.score || 0}%
                </div>
                <div style={{ fontSize: '11px', color: '#888' }}>
                  {area.attempts || 0} attempts
                </div>
              </div>
            </div>
            <div style={{ marginTop: '8px', height: '4px', background: '#f0f0f0', borderRadius: '2px' }}>
              <div style={{ width: `${area.score || 0}%`, height: '100%', background: '#f44336', borderRadius: '2px' }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={onBack}
          style={{
            padding: '10px 20px',
            background: '#f0f0f0',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          ← Back to Results
        </button>
        {weakAreas.length > 0 && (
          <button
            onClick={() => {
              const firstWeak = weakAreas[0];
              onPractice(firstWeak.subjectId, firstWeak.topicId, 'easy', false, 0);
            }}
            style={{
              padding: '10px 20px',
              background: '#1a5f2b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#144d21'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#1a5f2b'}
          >
            🚀 Practice Weak Areas
          </button>
        )}
      </div>
    </div>
  );
};

export default WeakAreas;
