import React from 'react';
import GhanaFlag from './common/GhanaFlag';
import NigeriaFlag from './common/NigeriaFlag';
import SierraLeoneFlag from './common/SierraLeoneFlag';
import LiberiaFlag from './common/LiberiaFlag';
import GambiaFlag from './common/GambiaFlag';
import { useLanguage } from '../contexts/LanguageContext';

const COUNTRIES = [
  { code: 'GH', name: 'Ghana', Flag: GhanaFlag },
  { code: 'NG', name: 'Nigeria', Flag: NigeriaFlag },
  { code: 'SL', name: 'Sierra Leone', Flag: SierraLeoneFlag },
  { code: 'LR', name: 'Liberia', Flag: LiberiaFlag },
  { code: 'GM', name: 'The Gambia', Flag: GambiaFlag },
];

const CountrySelector = ({ onSelect }) => {
  const { t } = useLanguage();
  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2 style={{ color: 'var(--primary)', textAlign: 'center' }}>{t('whereLearningFrom')}</h2>
      <p style={{ color: 'var(--gray-500)', textAlign: 'center', marginBottom: '24px' }}>
        {t('countrySelectorDescription')}
      </p>
      {COUNTRIES.map(({ code, name, Flag }) => (
        <button
          key={code}
          type="button"
          onClick={() => onSelect(code)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            marginBottom: '12px',
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <Flag size={24} />
          {name}
        </button>
      ))}
      <p style={{ color: 'var(--gray-500)', textAlign: 'center', fontSize: '13px', marginTop: '16px' }}>
        {t('moreCountriesComingSoon')}
      </p>
    </div>
  );
};

export default CountrySelector;
