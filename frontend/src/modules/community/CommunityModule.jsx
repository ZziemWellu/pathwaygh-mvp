import React from 'react';

const CommunityModule = () => {
  const features = [
    { icon: '💬', title: 'Discussion Forums', description: 'Join conversations with fellow students and educators', color: '#1a5f2b' },
    { icon: '👥', title: 'Study Groups', description: 'Form study groups and learn together', color: '#2d8a4e' },
    { icon: '🧑‍🏫', title: 'Mentorship', description: 'Connect with mentors in your field of interest', color: '#1565c0' },
    { icon: '🎓', title: 'Alumni Network', description: 'Connect with alumni from your school', color: '#6a1b9a' },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ color: '#1a5f2b', marginBottom: '8px' }}>🤝 Community</h2>
      <p style={{ color: '#666', marginBottom: '24px' }}>
        Connect, learn, and grow with the Pathway AI community.
      </p>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        {features.map((feature) => (
          <div
            key={feature.title}
            style={{
              padding: '24px',
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>{feature.icon}</div>
            <h3 style={{ color: feature.color, margin: '0 0 8px 0', fontSize: '16px' }}>{feature.title}</h3>
            <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>{feature.description}</p>
          </div>
        ))}
      </div>

      <div style={{ 
        padding: '20px',
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '12px',
        textAlign: 'center',
        color: '#888'
      }}>
        <p style={{ margin: '0 0 12px 0' }}>🌱 Community features coming soon. Connect with other learners!</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button style={{ padding: '10px 20px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            + Start Discussion
          </button>
          <button style={{ padding: '10px 20px', background: 'white', color: '#333', border: '1px solid #e0e0e0', borderRadius: '8px', cursor: 'pointer' }}>
            Find Study Groups
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunityModule;
