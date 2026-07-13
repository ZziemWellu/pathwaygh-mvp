import React from 'react';

const ResultsView = ({ results, onRetry, onHome, onViewWeakAreas }) => {
  const score = results?.score || 0;
  const correct = results?.correct || 0;
  const total = results?.total || 0;
  const timeSpent = results?.time_spent || 0;

  const getScoreColor = (score) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  const getScoreEmoji = (score) => {
    if (score >= 80) return '🌟';
    if (score >= 60) return '💪';
    return '📚';
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return 'Excellent! You\'re mastering this topic!';
    if (score >= 60) return 'Good job! Keep practicing to improve.';
    return 'Keep going! Practice makes perfect.';
  };

  return (
    <div style={{ width: '100%' }}>
      <h2 style={{ color: '#1a5f2b', marginBottom: '24px' }}>📊 Quiz Results</h2>

      {/* Score Card */}
      <div style={{
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '12px',
        padding: '32px',
        textAlign: 'center',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <div style={{ fontSize: '64px' }}>{getScoreEmoji(score)}</div>
        <div style={{ 
          fontSize: '48px', 
          fontWeight: 'bold', 
          color: getScoreColor(score),
          margin: '8px 0'
        }}>
          {score}%
        </div>
        <div style={{ fontSize: '18px', color: '#333' }}>
          {getScoreMessage(score)}
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          padding: '16px',
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '10px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '11px', color: '#888' }}>Correct</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>
            {correct}/{total}
          </div>
        </div>
        <div style={{
          padding: '16px',
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '10px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '11px', color: '#888' }}>Incorrect</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f44336' }}>
            {total - correct}/{total}
          </div>
        </div>
        <div style={{
          padding: '16px',
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '10px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '11px', color: '#888' }}>Time Spent</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a5f2b' }}>
            {timeSpent}s
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={onRetry}
          style={{
            padding: '12px 24px',
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
          🔄 Retry Quiz
        </button>
        {score < 70 && (
          <button
            onClick={onViewWeakAreas}
            style={{
              padding: '12px 24px',
              background: '#fff3e0',
              color: '#e65100',
              border: '1px solid #ffcc80',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#ffe0b2'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#fff3e0'}
          >
            🎯 View Weak Areas
          </button>
        )}
        <button
          onClick={onHome}
          style={{
            padding: '12px 24px',
            background: '#f0f0f0',
            color: '#333',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#e0e0e0'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#f0f0f0'}
        >
          🏠 Back to Home
        </button>
      </div>
    </div>
  );
};

export default ResultsView;
