import React from 'react';

function PlanModule({ user }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <h2 style={{ color: '#1a5f2b' }}>📋 Plan</h2>
      <p style={{ color: '#888' }}>Your personalized learning and career plan</p>
      <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', maxWidth: '800px', margin: '30px auto' }}>
        <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '12px', background: 'white' }}>
          <h4>🎯 Career Roadmap</h4>
          <p style={{ fontSize: '13px', color: '#666' }}>Your path to your dream career</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '12px', background: 'white' }}>
          <h4>📅 Study Planner</h4>
          <p style={{ fontSize: '13px', color: '#666' }}>Weekly study schedule</p>
        </div>
        <div style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '12px', background: 'white' }}>
          <h4>🎓 University Plan</h4>
          <p style={{ fontSize: '13px', color: '#666' }}>Your university application plan</p>
        </div>
      </div>
    </div>
  )
}

export default PlanModule
