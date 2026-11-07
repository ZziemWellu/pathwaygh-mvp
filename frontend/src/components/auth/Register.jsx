import React, { useEffect, useState } from 'react';
import api, { extractErrorMessage } from '../../services/api';
import { getCountry } from '../../constants/auth';
import { useLanguage } from '../../contexts/LanguageContext';
import { CircleCheckIcon } from 'lucide-react';
import Button from '../../components/ui/Button';

const Register = ({ onSuccess, onShowPrivacy }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    level: '',
    consent_confirmed: false,
    guardian_phone: '',
    guardian_email: ''
  });
  // Whether a text can reach this country. null = not known yet (or the check
  // failed), in which case both fields show and the server has the last word.
  const [smsAvailable, setSmsAvailable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const country = getCountry();
    if (!country) return;
    api.get('/api/auth/consent-channels', { params: { country } })
      .then((response) => setSmsAvailable(response.data.sms))
      .catch(() => setSmsAvailable(null));
  }, []);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
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
    if (formData.password.length < 8) {
      setError(t('passwordTooShort'));
      return;
    }

    if (!formData.consent_confirmed) {
      setError(t('consentRequired'));
      return;
    }

    if (!formData.level) {
      setError(t('levelRequired'));
      return;
    }

    const guardianPhone = smsAvailable === false ? '' : formData.guardian_phone.trim();
    const guardianEmail = formData.guardian_email.trim();
    if (!guardianPhone && !guardianEmail) {
      setError(t(smsAvailable === false ? 'guardianEmailRequired' : 'guardianContactRequired'));
      return;
    }

    if (guardianEmail.toLowerCase() === formData.email.trim().toLowerCase()) {
      setError(t('guardianEmailMustDiffer'));
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
      const payload = {
        email: formData.email,
        full_name: formData.full_name,
        password: formData.password,
        country,
        level: formData.level,
        consent_confirmed: formData.consent_confirmed,
        guardian_phone: guardianPhone || null,
        guardian_email: guardianEmail || null
      };

      const response = await api.post('/api/auth/register', payload);

      if (response.data?.success) {
        setSuccess(true);
        // Wait 1.5 seconds then switch to login
        setTimeout(() => onSuccess(), 1500);
      } else {
        setError(response.data?.message || t('registrationFailed'));
      }
    } catch (err) {
      console.error('Registration error:', err);

      // Handle different error formats. A request that never got a
      // response (timeout, or the backend cold-starting after idle) has no
      // err.response at all - tell the user the server may still be
      // waking up rather than showing a generic failure, since the
      // request may well complete on the backend after we've stopped
      // waiting for it (resubmitting the same details would then look
      // like a duplicate "already registered" error).
      const errorMsg = !err.response
        ? t('serverWakingUp')
        : extractErrorMessage(err, t('registrationFailedRetry'));
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--primary)' }}><CircleCheckIcon className="icon-inline" size="1em" aria-hidden="true" /> {t('registrationSuccessful')}</h2>
        <p>{t('registrationSuccessfulBody')}</p>
        <Button onClick={onSuccess} style={{ marginTop: '16px' }}>
          {t('goToLoginNow')}
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2 style={{ color: 'var(--primary)', textAlign: 'center' }}>{t('createAccount')}</h2>
      
      {error && (
        <div style={{ 
          background: 'var(--danger-bg)', 
          color: 'var(--danger)', 
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
              border: '1px solid var(--border)',
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
              border: '1px solid var(--border)',
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
            minLength="8"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid var(--border)',
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
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '14px'
            }}
            placeholder={t('confirmPasswordPlaceholder')}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="level" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>{t('levelLabel')}</label>
          <select
            id="level"
            name="level"
            value={formData.level}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          >
            <option value="">{t('levelPlaceholder')}</option>
            <option value="primary">{t('levelPrimary')}</option>
            <option value="jhs">{t('levelJhs')}</option>
            <option value="shs">{t('levelShs')}</option>
          </select>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-subtle)' }}>{t('levelHelp')}</p>
        </div>

        {smsAvailable !== false && (
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="guardian_phone" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>{t('guardianPhoneLabel')}</label>
            <input
              id="guardian_phone"
              type="tel"
              name="guardian_phone"
              autoComplete="off"
              value={formData.guardian_phone}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              placeholder={t('guardianPhonePlaceholder')}
            />
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-subtle)' }}>{t('guardianPhoneHelp')}</p>
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="guardian_email" style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
            {t(smsAvailable === false ? 'guardianEmailLabel' : 'guardianEmailOptionalLabel')}
          </label>
          {smsAvailable === false && (
            <p style={{ margin: '0 0 4px', fontSize: '12px', color: 'var(--text-subtle)' }}>{t('guardianSmsUnavailable')}</p>
          )}
          <input
            id="guardian_email"
            type="email"
            name="guardian_email"
            value={formData.guardian_email}
            onChange={handleChange}
            required={smsAvailable === false}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '14px'
            }}
            placeholder={t('guardianEmailPlaceholder')}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="consent_confirmed"
              checked={formData.consent_confirmed}
              onChange={handleChange}
              style={{ marginTop: '3px' }}
            />
            <span>
              {t(formData.level === 'primary' ? 'consentStatementPrimaryBeforeLink' : 'consentStatementBeforeLink')}{' '}
              <button
                type="button"
                onClick={onShowPrivacy}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit' }}
              >
                {t('privacyPolicyLinkText')}
              </button>
              {t('consentStatementAfterLink')}
            </span>
          </label>
        </div>

        <Button type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? t('creatingAccount') : t('register')}
        </Button>
      </form>
    </div>
  );
};

export default Register;
