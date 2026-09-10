import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, BookOpen, Search, PencilLine, ListChecks, User, Users, Shield, Building2, BarChart3 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const EcosystemNavigation = ({ activeModule, setActiveModule, user }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const modules = [
    { id: 'home', icon: Home, label: t('navHome'), path: '/' },
    { id: 'learn', icon: BookOpen, label: t('navLearn'), path: '/learn' },
    { id: 'explore', icon: Search, label: t('navExplore'), path: '/explore' },
    { id: 'practice', icon: PencilLine, label: t('navPractice'), path: '/practice' },
    { id: 'plan', icon: ListChecks, label: t('navPlan'), path: '/plan' },
    { id: 'profile', icon: User, label: t('navProfile'), path: '/profile' },
    { id: 'community', icon: Users, label: t('navCommunity'), path: '/community' },
    ...(user?.is_admin ? [{ id: 'admin', icon: Shield, label: t('navAdmin'), path: '/admin' }] : []),
    ...(user?.is_admin ? [{ id: 'impact', icon: BarChart3, label: t('navImpact'), path: '/impact' }] : []),
    ...(user?.is_school_admin ? [{ id: 'school-admin', icon: Building2, label: t('navSchoolAdmin'), path: '/school-admin' }] : []),
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
            aria-current={active ? 'page' : undefined}
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
            <module.icon size={15} aria-hidden="true" />
            {module.label}
          </button>
        );
      })}
    </nav>
  );
};

export default EcosystemNavigation;
