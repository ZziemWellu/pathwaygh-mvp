import React, { useState } from 'react';
import api, { extractErrorMessage } from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

const Login = ({ onSuccess }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/api/auth/login', { email, password });
      if (response.data?.success) {
        onSuccess(response.data.user, response.data.token);
      } else {
        setError(response.data?.message || t('loginFailed'));
      }
    } catch (err) {
      if (!err.response) {
        setError(t('serverWakingUp'));
      } else {
        setError(extractErrorMessage(err, t('loginFailedRetry')));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2 style={{ color: 'var(--primary)', textAlign: 'center' }}>{t('welcomeBack')}</h2>
      {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="login-email" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>{t('email')}</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
            placeholder={t('emailPlaceholder')}
          />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="login-password" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>{t('password')}</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          {loading ? t('loggingIn') : t('login')}
        </button>
      </form>
    </div>
  );
};

export default Login;
