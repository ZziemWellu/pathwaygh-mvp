import React, { createContext, useState, useContext, useCallback } from 'react';
import { getLanguage, setLanguage as persistLanguage, isAuthenticated } from '../constants/auth';
import { translate } from '../translations';
import api from '../services/api';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => getLanguage());

  const setLanguage = useCallback((lang) => {
    persistLanguage(lang);
    setLanguageState(lang);
    // Best-effort: persist to the account too, if logged in, so the
    // preference survives across devices - mirrors how country converges
    // to the account's stored value. localStorage already has the
    // real-time choice regardless of whether this succeeds.
    if (isAuthenticated()) {
      api.put('/api/profile/me', { language: lang }).catch(() => {});
    }
  }, []);

  const t = useCallback((key) => translate(language, key), [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
