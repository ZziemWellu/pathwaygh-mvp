import React from 'react';
import { useNavigate } from 'react-router-dom';

const EcosystemNavigation = ({ activeModule, setActiveModule, user }) => {
  const navigate = useNavigate();

  const modules = [
    { id: 'home', icon: '🏠', label: 'Home', path: '/' },
    { id: 'learn', icon: '📚', label: 'Learn', path: '/learn' },
    { id: 'explore', icon: '🔍', label: 'Explore', path: '/explore' },
    { id: 'practice', icon: '✍️', label: 'Practice', path: '/practice' },
    { id: 'plan', icon: '📋', label: 'Plan', path: '/plan' },
    { id: 'profile', icon: '👤', label: 'Profile', path: '/profile' },
    { id: 'community', icon: '🤝', label: 'Community', path: '/community' },
  ];

  const handleNavigate = (module) => {
    if (setActiveModule) {
      setActiveModule(module.id);
    }
    navigate(module.path);
  };

  return (
    <nav style={{
      display: 'flex',
      gap: '8px',
      padding: '10px 0',
      borderBottom: '1px solid #e0e0e0',
      flexWrap: 'wrap',
      alignItems: 'center'
    }}>
      {modules.map((module) => (
        <button
          key={module.id}
          onClick={() => handleNavigate(module)}
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
          onMouseEnter={(e) => {
            if (activeModule !== module.id) {
              e.currentTarget.style.background = '#f5f5f5';
            }
          }}
          onMouseLeave={(e) => {
            if (activeModule !== module.id) {
              e.currentTarget.style.background = 'transparent';
            }
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
