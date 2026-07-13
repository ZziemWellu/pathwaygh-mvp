import React from 'react';

const EcosystemNavigation = ({ activeModule, setActiveModule, user }) => {
  const modules = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'learn', icon: '📚', label: 'Learn' },
    { id: 'explore', icon: '🔍', label: 'Explore' },
    { id: 'practice', icon: '✍️', label: 'Practice' },
    { id: 'plan', icon: '📋', label: 'Plan' },
    { id: 'profile', icon: '👤', label: 'Profile' },
    { id: 'community', icon: '🤝', label: 'Community' },
  ];

  return (
    <nav style={{ 
      display: 'flex', 
      gap: '8px', 
      padding: '10px 0', 
      borderBottom: '1px solid #e0e0e0', 
      flexWrap: 'wrap' 
    }}>
      {modules.map((module) => (
        <button
          key={module.id}
          onClick={() => setActiveModule(module.id)}
          style={{
            padding: '6px 14px',
            background: activeModule === module.id ? '#1a5f2b' : 'transparent',
            color: activeModule === module.id ? 'white' : '#333',
            border: activeModule === module.id ? 'none' : '1px solid #e0e0e0',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: activeModule === module.id ? 'bold' : 'normal',
            transition: 'all 0.2s ease',
          }}
        >
          {module.icon} {module.label}
        </button>
      ))}
      {user && (
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#888', padding: '6px 0' }}>
          👤 {user.full_name || user.name || 'Student'}
        </span>
      )}
    </nav>
  );
};

export default EcosystemNavigation;
