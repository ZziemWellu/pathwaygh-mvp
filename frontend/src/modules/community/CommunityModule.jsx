import React from 'react';
import PeerQA from './PeerQA';

const CommunityModule = () => {
  const comingSoonFeatures = [
    { icon: '👥', title: 'Study Groups', description: 'Form study groups and learn together', color: 'var(--primary-light)' },
    { icon: '🧑‍🏫', title: 'Mentorship', description: 'Connect with mentors in your field of interest', color: 'var(--secondary)' },
    { icon: '🎓', title: 'Alumni Network', description: 'Connect with alumni from your school', color: '#6a1b9a' },
  ];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ color: 'var(--primary)', marginBottom: '8px' }}>🤝 Community</h2>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        Connect, learn, and grow with the PathwayGH community.
      </p>

      <h3 style={{ color: 'var(--primary)', fontSize: '16px', margin: '0 0 12px 0' }}>💬 Discussion Forums</h3>
      <PeerQA />

      <h3 style={{ color: 'var(--primary)', fontSize: '16px', margin: '32px 0 12px 0' }}>Coming soon</h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px',
      }}>
        {comingSoonFeatures.map((feature) => (
          <div
            key={feature.title}
            style={{
              padding: '20px',
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              textAlign: 'center',
              opacity: 0.7,
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{feature.icon}</div>
            <h4 style={{ color: feature.color, margin: '0 0 6px 0', fontSize: '14px' }}>{feature.title}</h4>
            <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityModule;
