import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Coins, Landmark, SearchIcon, Target } from 'lucide-react';

// Countries that sit WASSCE under WAEC - matches WASSCE_COUNTRIES in
// App.jsx and backend/modules/plan/router.py. Career Match's content is
// WASSCE-specific, so it's gated to these countries.
const WASSCE_COUNTRIES = ['GH', 'SL', 'LR', 'GM'];

const ExploreLanding = ({ user }) => {
  const navigate = useNavigate();

  const allFeatures = [
    {
      id: 'careers',
      icon: Briefcase,
      tint: 'var(--primary-bg)',
      title: 'Careers',
      description: 'Explore career opportunities and pathways',
      color: 'var(--primary)',
      path: '/explore/careers',
      buttonText: 'Explore Careers'
    },
    {
      id: 'universities',
      icon: Landmark,
      tint: 'var(--info-bg)',
      title: 'Universities',
      description: 'Browse universities and their admission requirements',
      color: 'var(--secondary)',
      path: '/explore/universities',
      buttonText: 'View Universities'
    },
    {
      id: 'scholarships',
      icon: Coins,
      tint: 'var(--accent-bg)',
      title: 'Scholarships',
      description: 'Find scholarships and funding opportunities',
      // Deep amber, not var(--accent): this colour is both the heading text on
      // white and the button behind white text, and var(--accent) is only 1.97:1
      // against white (WCAG AA needs 4.5:1). var(--accent-strong) is 5.19:1.
      color: 'var(--accent-strong)',
      path: '/explore/scholarships',
      buttonText: 'Find Scholarships'
    },
    {
      id: 'career-match',
      icon: Target,
      tint: 'var(--violet-bg)',
      title: 'Career Match',
      description: 'Discover careers that match your interests and skills',
      color: 'var(--violet)',
      path: '/explore/career-match',
      buttonText: 'Start Assessment',
      wassceOnly: true
    }
  ];

  const features = allFeatures.filter((f) => !f.wassceOnly || WASSCE_COUNTRIES.includes(user?.country));

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ color: 'var(--primary)', marginBottom: '8px' }}><SearchIcon className="icon-inline" size="1em" aria-hidden="true" /> Explore</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>
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
              border: '1px solid var(--border)',
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
            <div style={{ width: '72px', height: '72px', borderRadius: '18px', background: feature.tint, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <feature.icon size={36} color={feature.color} strokeWidth={1.75} aria-hidden="true" />
            </div>
            <h3 style={{ color: feature.color, marginBottom: '8px', fontSize: '20px' }}>
              {feature.title}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px', lineHeight: '1.5' }}>
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

      <footer style={{ textAlign: 'center', marginTop: '40px', padding: '20px', color: 'var(--gray-500)', borderTop: '1px solid var(--border)' }}>
        <p>Discover your path with PathwayGH</p>
      </footer>
    </div>
  );
};

export default ExploreLanding;
