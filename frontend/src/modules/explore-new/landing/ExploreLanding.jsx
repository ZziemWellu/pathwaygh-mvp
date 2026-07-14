import React from 'react';
import { useNavigate } from 'react-router-dom';

const ExploreLanding = () => {
  const navigate = useNavigate();

  const features = [
    {
      id: 'careers',
      icon: '💼',
      title: 'Careers',
      description: 'Explore career opportunities and pathways in Ghana',
      color: '#1a5f2b',
      path: '/explore/careers',
      buttonText: 'Explore Careers'
    },
    {
      id: 'universities',
      icon: '🏛️',
      title: 'Universities',
      description: 'Browse universities and their admission requirements',
      color: '#1565c0',
      path: '/explore/universities',
      buttonText: 'View Universities'
    },
    {
      id: 'scholarships',
      icon: '💰',
      title: 'Scholarships',
      description: 'Find scholarships and funding opportunities',
      color: '#f9a825',
      path: '/explore/scholarships',
      buttonText: 'Find Scholarships'
    },
    {
      id: 'career-match',
      icon: '🎯',
      title: 'Career Match',
      description: 'Discover careers that match your interests and skills',
      color: '#6a1b9a',
      path: '/explore/career-match',
      buttonText: 'Start Assessment'
    }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#1a5f2b', marginBottom: '8px' }}>🔍 Explore</h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Discover careers, universities, scholarships, and find your perfect path
        </p>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: '24px'
      }}>
        {features.map((feature) => (
          <div
            key={feature.id}
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '30px 24px',
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '280px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={() => navigate(feature.path)}
          >
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>{feature.icon}</div>
            <h3 style={{ color: feature.color, marginBottom: '8px', fontSize: '20px' }}>
              {feature.title}
            </h3>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
              {feature.description}
            </p>
            <button
              style={{
                padding: '10px 24px',
                background: feature.color,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                width: '100%'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              {feature.buttonText} →
            </button>
          </div>
        ))}
      </div>

      <footer style={{ textAlign: 'center', marginTop: '40px', padding: '20px', color: '#888', borderTop: '1px solid #e0e0e0' }}>
        <p>Discover your path with Pathway AI</p>
      </footer>
    </div>
  );
};

export default ExploreLanding;
