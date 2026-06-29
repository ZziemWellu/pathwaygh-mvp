import React from 'react';

function UniversityComparison({ universities }) {
  if (!universities || universities.length === 0) return null;

  return (
    <div style={{
      padding: '20px',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginTop: '20px'
    }}>
      <h4 style={{ marginTop: 0, color: '#1a5f2b' }}>🎓 University Comparison</h4>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#1a5f2b', color: 'white' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>University</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Cutoff</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Duration</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Your Chance</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {universities.map((uni, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>{uni.university}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>≤{uni.cutoff}</td>
                <td style={{ padding: '10px', textAlign: 'center' }}>{uni.duration || '4 yrs'}</td>
                <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                  {uni.admission_chance}%
                </td>
                <td style={{ padding: '10px', textAlign: 'center' }}>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    background: uni.admission_chance >= 70 ? '#e8f5e9' :
                               uni.admission_chance >= 40 ? '#fff3e0' : '#ffebee',
                    color: uni.admission_chance >= 70 ? '#2e7d32' :
                           uni.admission_chance >= 40 ? '#e65100' : '#c62828'
                  }}>
                    {uni.status || 'Possible'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UniversityComparison;
