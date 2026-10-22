import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { getNavItems, useActiveNavId } from './navItems';

// Desktop/tablet top navigation. On phones it's hidden by CSS and
// MobileTabBar takes over (same items, from navItems.js).
const EcosystemNavigation = ({ user }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const modules = getNavItems(user, t);
  const activeId = useActiveNavId(modules);

  return (
    <nav className="desktop-nav" aria-label="Main">
      {modules.map((module) => {
        const active = activeId === module.id;
        return (
          <button
            key={module.id}
            type="button"
            className={`desktop-nav__item${active ? ' is-active' : ''}`}
            onClick={() => navigate(module.path)}
            aria-current={active ? 'page' : undefined}
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
