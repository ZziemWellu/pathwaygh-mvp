import React, { useState } from 'react';
import api, { extractErrorMessage } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

const ForgotPassword = ({ onBackToLogin }) => {
  const { t } = useLanguage();
  const [step, setStep] = useState('request'); // 'request' | 'reset' | 'done'
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/api/auth/forgot-password', { email });
      setInfo(t('forgotPasswordCodeSent'));
      setStep('reset');
    } catch (err) {
      setError(!err.response ? t('serverWakingUp') : t('forgotPasswordFailedRetry'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }
    if (newPassword.length < 6) {
      setError(t('passwordTooShort'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/api/auth/reset-password', { email, token, new_password: newPassword });
      setStep('done');
    } catch (err) {
      if (!err.response) {
        setError(t('serverWakingUp'));
      } else {
        setError(extractErrorMessage(err, t('resetPasswordFailed')));
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === 'done') {
    return (
      <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ color: '#1a5f2b' }}>{t('resetPasswordSuccessTitle')}</h2>
        <p>{t('resetPasswordSuccessBody')}</p>
        <button
          onClick={onBackToLogin}
          style={{ padding: '10px 24px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '16px' }}
        >
          {t('goToLoginNow')}
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2 style={{ color: '#1a5f2b', textAlign: 'center' }}>{t('forgotPasswordTitle')}</h2>
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      {info && step === 'reset' && <p style={{ color: '#1a5f2b', textAlign: 'center', fontSize: '14px' }}>{info}</p>}

      {step === 'request' ? (
        <form onSubmit={handleRequestCode}>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="forgot-email" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>{t('email')}</label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
              placeholder={t('emailPlaceholder')}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '12px', background: loading ? '#ccc' : '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? t('forgotPasswordSending') : t('forgotPasswordSendCode')}
          </button>
        </form>
      ) : (
        <form onSubmit={handleReset}>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="reset-token" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>{t('resetPasswordCodeLabel')}</label>
            <input
              id="reset-token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
              placeholder={t('resetPasswordCodePlaceholder')}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="reset-new-password" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>{t('resetPasswordNewLabel')}</label>
            <input
              id="reset-new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength="6"
              style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
              placeholder={t('passwordPlaceholder')}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="reset-confirm-password" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>{t('confirmPassword')}</label>
            <input
              id="reset-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
              placeholder={t('confirmPasswordPlaceholder')}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '12px', background: loading ? '#ccc' : '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? t('resetPasswordSaving') : t('resetPasswordSubmit')}
          </button>
        </form>
      )}

      <p style={{ textAlign: 'center', marginTop: '16px' }}>
        <button onClick={onBackToLogin} style={{ background: 'none', border: 'none', color: '#1a5f2b', cursor: 'pointer', textDecoration: 'underline' }}>
          {t('backToLogin')}
        </button>
      </p>
    </div>
  );
};

export default ForgotPassword;
