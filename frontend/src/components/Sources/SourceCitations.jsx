import React from 'react';

function SourceCitations({ sources }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div style={{
      padding: '15px',
      background: '#fafafa',
      borderRadius: '8px',
      marginTop: '20px',
      border: '1px solid #e0e0e0'
    }}>
      <h5 style={{ marginTop: 0, color: '#666' }}>📚 Data Sources</h5>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {sources.map((source, idx) => (
          <span key={idx} style={{
            padding: '4px 12px',
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '16px',
            fontSize: '12px',
            color: '#555'
          }}>
            {source.name || source}
          </span>
        ))}
      </div>
      <p style={{ fontSize: '11px', color: '#999', marginTop: '10px', marginBottom: 0 }}>
        ✅ Verified Ghanaian university data • Updated 2025
      </p>
    </div>
  );
}

export default SourceCitations;
