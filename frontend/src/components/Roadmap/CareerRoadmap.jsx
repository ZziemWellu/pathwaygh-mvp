import React from 'react';

function CareerRoadmap({ career }) {
  if (!career) return null;

  const stages = career.stages || [];

  return (
    <div style={{ 
      padding: '20px',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h4 style={{ marginTop: 0, color: '#1a5f2b' }}>🗺️ Career Pathway</h4>
      
      <div style={{ position: 'relative', paddingLeft: '30px' }}>
        {stages.map((stage, idx) => (
          <div key={idx} style={{ position: 'relative', marginBottom: '30px' }}>
            {/* Vertical line */}
            {idx < stages.length - 1 && (
              <div style={{
                position: 'absolute',
                left: '-16px',
                top: '24px',
                bottom: '-30px',
                width: '2px',
                background: '#1a5f2b',
                opacity: 0.3
              }} />
            )}
            
            {/* Circle */}
            <div style={{
              position: 'absolute',
              left: '-20px',
              top: '0',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#1a5f2b',
              border: '2px solid white',
              boxShadow: '0 0 0 2px #1a5f2b'
            }} />
            
            {/* Content */}
            <div style={{ marginLeft: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h5 style={{ margin: 0, color: '#1a5f2b' }}>{stage.title}</h5>
                <span style={{ 
                  fontSize: '12px', 
                  color: '#666',
                  padding: '2px 10px',
                  background: '#f0f0f0',
                  borderRadius: '12px'
                }}>
                  {stage.duration}
                </span>
              </div>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#555' }}>
                {stage.description}
              </p>
              <span style={{ 
                fontSize: '11px', 
                color: '#888',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {stage.stage}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CareerRoadmap;
