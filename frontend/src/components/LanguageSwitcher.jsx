import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { LANGUAGE_NAMES } from '../translations';

const LanguageSwitcher = ({ style }) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <select
      aria-label={t('language')}
      value={language}
      onChange={(e) => setLanguage(e.target.value)}
      style={{
        padding: '4px 8px',
        border: '1px solid #e0e0e0',
        borderRadius: '6px',
        fontSize: '12px',
        background: 'white',
        color: '#666666',
        cursor: 'pointer',
        ...style,
      }}
    >
      {Object.entries(LANGUAGE_NAMES).map(([code, name]) => (
        <option key={code} value={code}>{name}</option>
      ))}
    </select>
  );
};

export default LanguageSwitcher;
