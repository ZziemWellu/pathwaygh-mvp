import React from 'react';

function ExplainabilityPanel({ explanation }) {
  if (!explanation) return null;

  const { breakdown, confidence, why_not, improvement_tips } = explanation;

  const getColor = (score) => {
    if (score >= 70) return '#2e7d32';
    if (score >= 50) return '#f57c00';
    return '#c62828';
  };

  return (
    <div style={{ 
      background: '#f5f5f5', 
      borderRadius: '12px', 
      padding: '20px',
      marginTop: '20px'
    }}>
      <h4 style={{ marginTop: 0, color: '#1a5f2b' }}>🤔 Why This Recommendation?</h4>
      
      {/* Confidence Score */}
      <div style={{ 
        background: 'white', 
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '15px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Overall Confidence</span>
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: getColor(confidence) }}>
            {confidence}%
          </span>
        </div>
      </div>

      {/* Breakdown */}
      <div style={{ background: 'white', padding: '15px', borderRadius: '8px' }}>
        <h5 style={{ marginTop: 0 }}>Score Breakdown</h5>
        {Object.entries(breakdown).map(([key, value]) => (
          <div key={key} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span>{key.replace('_', ' ').toUpperCase()}</span>
              <span style={{ color: getColor(value.score) }}>
                {value.score}% (Weight: {value.weight}%)
              </span>
            </div>
            <div style={{ 
              background: '#e0e0e0', 
              borderRadius: '4px', 
              height: '6px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${value.score}%`,
                background: getColor(value.score),
                height: '100%',
                transition: 'width 0.3s'
              }} />
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              {value.details}
            </div>
          </div>
        ))}
      </div>

      {/* Why Not */}
      {why_not && why_not.length > 0 && (
        <div style={{ 
          background: '#fff3e0', 
          padding: '15px', 
          borderRadius: '8px',
          marginTop: '15px'
        }}>
          <h5 style={{ marginTop: 0, color: '#e65100' }}>⚠️ Why Not This Career?</h5>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {why_not.map((reason, idx) => (
              <li key={idx} style={{ marginBottom: '5px' }}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Improvement Tips */}
      {improvement_tips && improvement_tips.length > 0 && (
        <div style={{ 
          background: '#e8f5e9', 
          padding: '15px', 
          borderRadius: '8px',
          marginTop: '15px'
        }}>
          <h5 style={{ marginTop: 0, color: '#2e7d32' }}>💡 How to Improve Your Chances</h5>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {improvement_tips.map((tip, idx) => (
              <li key={idx} style={{ marginBottom: '5px' }}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default ExplainabilityPanel;
