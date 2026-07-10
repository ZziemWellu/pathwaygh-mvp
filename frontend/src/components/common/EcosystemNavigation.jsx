import React from 'react';

function EcosystemNavigation({ activeModule, setActiveModule, user }) {
  const modules = [
    { id: 'home', label: '🏠 Home' },
    { id: 'learn', label: '📚 Learn' },
    { id: 'explore', label: '🔍 Explore' },
    { id: 'practice', label: '✍️ Practice' },
    { id: 'plan', label: '📋 Plan' },
    { id: 'profile', label: '👤 Profile' },
  ];

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'center',
      gap: '4px',
      padding: '10px 0',
      borderBottom: '2px solid #e0e0e0',
      flexWrap: 'wrap',
      backgroundColor: 'white',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {modules.map(module => (
        <button
          key={module.id}
          onClick={() => setActiveModule(module.id)}
          style={{
            padding: '8px 14px',
            background: activeModule === module.id ? '#1a5f2b' : 'none',
            color: activeModule === module.id ? 'white' : '#555',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: activeModule === module.id ? 'bold' : 'normal',
            transition: 'all 0.2s'
          }}
        >
          {module.label}
        </button>
      ))}
      
      {user && (
        <span style={{ marginLeft: '10px', fontSize: '12px', color: '#888' }}>
          👤 {user.role || 'Student'}
        </span>
      )}
    </nav>
  );
}

export default EcosystemNavigation;
