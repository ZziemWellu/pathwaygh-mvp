import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';

const AccessibilityContext = createContext();

const STORAGE_KEY = 'pathwaygh_accessibility';
const TEXT_SCALES = ['normal', 'large', 'larger'];

const loadPrefs = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { dyslexiaFont: false, textScale: 'normal' };
    const parsed = JSON.parse(raw);
    return {
      dyslexiaFont: Boolean(parsed.dyslexiaFont),
      textScale: TEXT_SCALES.includes(parsed.textScale) ? parsed.textScale : 'normal',
    };
  } catch {
    // localStorage can throw (private browsing, blocked site data) -
    // fall back to defaults rather than crash the whole app on load.
    return { dyslexiaFont: false, textScale: 'normal' };
  }
};

const savePrefs = (prefs) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Best-effort only - a per-device rendering preference, not data
    // that needs to survive if storage is unavailable.
  }
};

export const AccessibilityProvider = ({ children }) => {
  const [prefs, setPrefs] = useState(() => loadPrefs());

  useEffect(() => {
    document.documentElement.setAttribute('data-dyslexia-font', String(prefs.dyslexiaFont));
    document.documentElement.setAttribute('data-text-scale', prefs.textScale);
  }, [prefs]);

  const setDyslexiaFont = useCallback((enabled) => {
    setPrefs((prev) => {
      const next = { ...prev, dyslexiaFont: enabled };
      savePrefs(next);
      return next;
    });
  }, []);

  const setTextScale = useCallback((scale) => {
    if (!TEXT_SCALES.includes(scale)) return;
    setPrefs((prev) => {
      const next = { ...prev, textScale: scale };
      savePrefs(next);
      return next;
    });
  }, []);

  return (
    <AccessibilityContext.Provider value={{ ...prefs, setDyslexiaFont, setTextScale, textScales: TEXT_SCALES }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

export default AccessibilityContext;
