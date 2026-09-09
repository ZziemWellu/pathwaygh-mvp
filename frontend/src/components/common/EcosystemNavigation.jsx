import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, BookOpen, Search, PencilLine, ListChecks, User, Users, Shield, Building2 } from 'lucide-react';

const EcosystemNavigation = ({ activeModule, setActiveModule, user }) => {
  const navigate = useNavigate();

  const modules = [
    { id: 'home', icon: Home, label: 'Home', path: '/' },
    { id: 'learn', icon: BookOpen, label: 'Learn', path: '/learn' },
    { id: 'explore', icon: Search, label: 'Explore', path: '/explore' },
    { id: 'practice', icon: PencilLine, label: 'Practice', path: '/practice' },
    { id: 'plan', icon: ListChecks, label: 'Plan', path: '/plan' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
    { id: 'community', icon: Users, label: 'Community', path: '/community' },
    ...(user?.is_admin ? [{ id: 'admin', icon: Shield, label: 'Admin', path: '/admin' }] : []),
    ...(user?.is_school_admin ? [{ id: 'school-admin', icon: Building2, label: 'School Admin', path: '/school-admin' }] : []),
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
      {modules.map((module) => {
        const active = activeModule === module.id;
        return (
          <button
            key={module.id}
            onClick={() => handleNavigate(module)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: active ? '#1a5f2b' : 'transparent',
              color: active ? 'white' : '#333',
              border: active ? 'none' : '1px solid #e0e0e0',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: active ? 'bold' : 'normal',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.background = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              if (!active) e.currentTarget.style.background = 'transparent';
            }}
          >
            <module.icon size={15} />
            {module.label}
          </button>
        );
      })}
    </nav>
  );
};

export default EcosystemNavigation;
