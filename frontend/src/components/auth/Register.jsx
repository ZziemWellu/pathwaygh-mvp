import React, { useState } from 'react';
import api from '../../services/api';
import { getCountry } from '../../constants/auth';
import { useLanguage } from '../../contexts/LanguageContext';

const Register = ({ onSuccess }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.password !== formData.confirm_password) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError(t('passwordTooShort'));
      return;
    }

    const country = getCountry();
    if (!country) {
      setError(t('selectCountryFirst'));
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // The backend expects: email, full_name, password, country
      const payload = {
        email: formData.email,
        full_name: formData.full_name,  // ← CORRECT field name!
        password: formData.password,
        country
      };

      console.log('📤 Registering with:', payload);

      const response = await api.post('/api/auth/register', payload);
      console.log('📥 Response:', response.data);

      if (response.data?.success) {
        setSuccess(true);
        // Wait 1.5 seconds then switch to login
        setTimeout(() => onSuccess(), 1500);
      } else {
        setError(response.data?.message || t('registrationFailed'));
      }
    } catch (err) {
      console.error('❌ Registration error:', err);

      // Handle different error formats
      let errorMsg = t('registrationFailedRetry');
      if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ color: '#1a5f2b' }}>{t('registrationSuccessful')}</h2>
        <p>{t('registrationSuccessfulBody')}</p>
        <button
          onClick={onSuccess}
          style={{
            padding: '10px 24px',
            background: '#1a5f2b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            marginTop: '16px'
          }}
        >
          {t('goToLoginNow')}
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2 style={{ color: '#1a5f2b', textAlign: 'center' }}>{t('createAccount')}</h2>
      
      {error && (
        <div style={{ 
          background: '#ffebee', 
          color: '#c62828', 
          padding: '12px', 
          borderRadius: '8px', 
          marginBottom: '16px',
          fontSize: '14px',
          wordWrap: 'break-word'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="full_name" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>{t('fullName')}</label>
          <input
            id="full_name"
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px'
            }}
            placeholder={t('fullNamePlaceholder')}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="register-email" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>{t('email')}</label>
          <input
            id="register-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px'
            }}
            placeholder={t('emailPlaceholder')}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="register-password" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>{t('password')}</label>
          <input
            id="register-password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="6"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px'
            }}
            placeholder={t('passwordPlaceholder')}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="confirm_password" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>{t('confirmPassword')}</label>
          <input
            id="confirm_password"
            type="password"
            name="confirm_password"
            value={formData.confirm_password}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '14px'
            }}
            placeholder={t('confirmPasswordPlaceholder')}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: loading ? '#ccc' : '#1a5f2b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.background = '#144d21';
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.background = '#1a5f2b';
          }}
        >
          {loading ? t('creatingAccount') : t('register')}
        </button>
      </form>
    </div>
  );
};

export default Register;
