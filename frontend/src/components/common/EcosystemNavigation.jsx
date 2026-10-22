import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Search, PencilLine, ListChecks, User, Users, Shield, Building2, BarChart3, Layers } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const EcosystemNavigation = ({ user }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useLanguage();

  const modules = [
    { id: 'home', icon: Home, label: t('navHome'), path: '/' },
    { id: 'learn', icon: BookOpen, label: t('navLearn'), path: '/learn' },
    { id: 'explore', icon: Search, label: t('navExplore'), path: '/explore' },
    { id: 'practice', icon: PencilLine, label: t('navPractice'), path: '/practice' },
    { id: 'flashcards', icon: Layers, label: t('navFlashcards'), path: '/flashcards' },
    { id: 'plan', icon: ListChecks, label: t('navPlan'), path: '/plan' },
    { id: 'profile', icon: User, label: t('navProfile'), path: '/profile' },
    { id: 'community', icon: Users, label: t('navCommunity'), path: '/community' },
    ...(user?.is_admin ? [{ id: 'admin', icon: Shield, label: t('navAdmin'), path: '/admin' }] : []),
    ...(user?.is_admin ? [{ id: 'impact', icon: BarChart3, label: t('navImpact'), path: '/impact' }] : []),
    ...(user?.is_school_admin ? [{ id: 'school-admin', icon: Building2, label: t('navSchoolAdmin'), path: '/school-admin' }] : []),
  ];

  // The active tab is derived from the URL, not remembered from the last
  // click - otherwise deep links, refreshes, the back button and in-page
  // links ("Browse Courses", "View course") left "Home" highlighted
  // everywhere. Longest matching path wins, so /learn/x/lessons/y -> Learn
  // and "/" only matches the home page itself.
  const isOnPath = (path) =>
    path === '/' ? pathname === '/' || pathname === '/home' : pathname === path || pathname.startsWith(`${path}/`);
  const activeId = modules
    .filter((m) => isOnPath(m.path))
    .sort((a, b) => b.path.length - a.path.length)[0]?.id;

  return (
    <nav style={{
      display: 'flex',
      gap: '8px',
      padding: '10px 0',
      borderBottom: '1px solid var(--border)',
      flexWrap: 'wrap',
      alignItems: 'center'
    }}>
      {modules.map((module) => {
        const active = activeId === module.id;
        return (
          <button
            key={module.id}
            onClick={() => navigate(module.path)}
            aria-current={active ? 'page' : undefined}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: active ? 'var(--primary)' : 'transparent',
              color: active ? 'white' : 'var(--text)',
              border: active ? 'none' : '1px solid var(--border)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: active ? 'bold' : 'normal',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!active) e.currentTarget.style.background = 'var(--surface-muted)';
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
