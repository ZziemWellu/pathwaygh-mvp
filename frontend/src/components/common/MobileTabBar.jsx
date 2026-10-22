import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useModalA11y } from '../../hooks/useModalA11y';
import LanguageSwitcher from '../LanguageSwitcher';
import { getNavItems, useActiveNavId } from './navItems';

// Phone navigation: a bottom tab bar with the four core destinations plus
// "More", which opens a sheet holding the remaining pages and the account
// controls (name, language, log out) that the compact phone header drops.
// Hidden above 768px by CSS, where the top EcosystemNavigation is used.
const MobileTabBar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = useLanguage();
  const [moreOpen, setMoreOpen] = useState(false);
  const sheetRef = useRef(null);

  const items = getNavItems(user, t);
  const activeId = useActiveNavId(items);
  const primary = items.filter((item) => item.primary);
  const secondary = items.filter((item) => !item.primary);
  const moreActive = secondary.some((item) => item.id === activeId);

  const closeMore = useCallback(() => setMoreOpen(false), []);
  useModalA11y({ isOpen: moreOpen, onClose: closeMore, containerRef: sheetRef });

  // Navigating anywhere (including browser back) closes the sheet.
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const go = (path) => {
    setMoreOpen(false);
    navigate(path);
  };

  return (
    <>
      <nav className="mobile-tabbar" aria-label="Main">
        {primary.map((item) => {
          const active = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`mobile-tabbar__item${active ? ' is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
              onClick={() => go(item.path)}
            >
              <item.icon size={22} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          className={`mobile-tabbar__item${moreActive || moreOpen ? ' is-active' : ''}`}
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((open) => !open)}
        >
          <Menu size={22} aria-hidden="true" />
          <span>{t('navMore')}</span>
        </button>
      </nav>

      {moreOpen && (
        <div className="mobile-sheet__backdrop" onClick={closeMore}>
          <div
            ref={sheetRef}
            className="mobile-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={t('navMore')}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-sheet__header">
              <div>
                <div className="mobile-sheet__name">{user?.full_name || user?.name || t('student')}</div>
                {user?.email && <div className="mobile-sheet__email">{user.email}</div>}
              </div>
              <button type="button" className="mobile-sheet__close" aria-label="Close menu" onClick={closeMore}>
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <ul className="mobile-sheet__list">
              {secondary.map((item) => {
                const active = activeId === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`mobile-sheet__item${active ? ' is-active' : ''}`}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => go(item.path)}
                    >
                      <item.icon size={20} aria-hidden="true" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mobile-sheet__footer">
              <LanguageSwitcher style={{ fontSize: '14px', padding: '8px 10px' }} />
              <button type="button" className="btn btn-secondary btn-sm" onClick={onLogout}>
                <LogOut size={14} aria-hidden="true" /> {t('logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileTabBar;
