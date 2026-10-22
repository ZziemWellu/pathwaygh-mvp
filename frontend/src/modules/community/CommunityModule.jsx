import React from 'react';
import { GraduationCap, HandshakeIcon, MessagesSquareIcon, Presentation, Users } from 'lucide-react';
import PeerQA from './PeerQA';

const CommunityModule = () => {
  const comingSoonFeatures = [
    { icon: Users, title: 'Study Groups', description: 'Form study groups and learn together', color: 'var(--primary-light)', tint: 'var(--primary-bg)' },
    { icon: Presentation, title: 'Mentorship', description: 'Connect with mentors in your field of interest', color: 'var(--secondary)', tint: 'var(--info-bg)' },
    { icon: GraduationCap, title: 'Alumni Network', description: 'Connect with alumni from your school', color: 'var(--violet)', tint: 'var(--violet-bg)' },
  ];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ color: 'var(--primary)', marginBottom: '8px' }}><HandshakeIcon className="icon-inline" size="1em" aria-hidden="true" /> Community</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
        Connect, learn, and grow with the PathwayGH community.
      </p>

      <h3 style={{ color: 'var(--primary)', fontSize: '16px', margin: '0 0 12px 0' }}><MessagesSquareIcon className="icon-inline" size="1em" aria-hidden="true" /> Discussion Forums</h3>
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
              border: '1px solid var(--border)',
              borderRadius: '12px',
              textAlign: 'center',
              opacity: 0.7,
            }}
          >
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: feature.tint, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
              <feature.icon size={24} color={feature.color} strokeWidth={1.75} aria-hidden="true" />
            </div>
            <h4 style={{ color: feature.color, margin: '0 0 6px 0', fontSize: '14px' }}>{feature.title}</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityModule;
