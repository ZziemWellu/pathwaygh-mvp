import React, { useState } from 'react';
import api from '../../services/api';
import { setUser as persistUser } from '../../constants/auth';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from '../../components/ui/Button';

const ConsentBanner = ({ user, onVerified }) => {
  const { t } = useLanguage();
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  if (!user || !user.guardian_email || user.consent_verified) {
    return null;
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await api.post('/api/auth/verify-consent', { code: code.trim() });
      const updatedUser = response.data.user;
      persistUser(updatedUser);
      onVerified(updatedUser);
    } catch (err) {
      setError(err.response?.data?.detail || t('registrationFailedRetry'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    setMessage('');
    try {
      await api.post('/api/auth/resend-consent');
      setMessage(t('consentBannerCodeSent'));
    } catch (err) {
      setError(err.response?.data?.detail || t('registrationFailedRetry'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div
      style={{
        background: 'var(--warning-bg)',
        border: '1px solid var(--accent-border)',
        borderRadius: '8px',
        padding: '12px 16px',
        margin: '12px 0',
        fontSize: '13px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between' }}>
        <span>{t('consentBannerMessage').replace('{email}', user.guardian_email)}</span>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            {t('consentBannerEnterCode')}
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleVerify} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px', alignItems: 'center' }}>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t('consentBannerCodePlaceholder')}
            style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '6px', width: '140px' }}
          />
          <Button size="sm" type="submit" disabled={loading || code.trim().length !== 6}>
            {t('consentBannerVerify')}
          </Button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            style={{ padding: '8px 14px', background: 'none', border: '1px solid var(--border-strong)', borderRadius: '6px', cursor: resending ? 'not-allowed' : 'pointer' }}
          >
            {t('consentBannerResend')}
          </button>
        </form>
      )}

      {error && <p style={{ color: 'var(--danger)', marginTop: '8px', marginBottom: 0 }}>{error}</p>}
      {message && !error && <p style={{ color: 'var(--primary)', marginTop: '8px', marginBottom: 0 }}>{message}</p>}
    </div>
  );
};

export default ConsentBanner;
