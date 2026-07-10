import React from 'react';

function ExploreModule({ careers, loading }) {
  return (
    <div>
      <h2 style={{ color: '#1a5f2b' }}>🔍 Explore</h2>
      <p style={{ color: '#666' }}>Discover careers, universities, and opportunities</p>
      
      {loading ? (
        <p>Loading careers...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {careers?.slice(0, 4).map(career => (
            <div key={career.id} style={{ border: '1px solid #e0e0e0', borderRadius: '12px', padding: '20px', background: 'white' }}>
              <h4 style={{ color: '#1a5f2b' }}>{career.name}</h4>
              <span style={{ fontSize: '12px', color: '#666' }}>{career.field}</span>
              <p style={{ fontSize: '13px', color: '#555' }}>{career.description}</p>
              <div style={{ fontSize: '12px', color: '#888' }}>💰 {career.salary_range}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ExploreModule
