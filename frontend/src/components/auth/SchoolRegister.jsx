import React, { useState } from 'react';
import api, { extractErrorMessage } from '../../services/api';
import { getCountry } from '../../constants/auth';
import Button from '../ui/Button';

const ROLES = [
  ['headteacher', 'Head teacher'],
  ['assistant_headteacher', 'Assistant head teacher'],
  ['teacher', 'Teacher'],
  ['ict_coordinator', 'ICT coordinator'],
  ['administrator', 'School administrator'],
  ['other', 'Other'],
];

const field = { width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '1rem' };
const label = { display: 'block', marginBottom: '4px', fontWeight: 'bold' };
const row = { marginBottom: '16px' };
const hint = { margin: '4px 0 0', fontSize: '0.8125rem', color: 'var(--text-subtle)' };

// Sign-up for the adult who runs a school's account. Unlike the student form,
// there's no class, level or parent consent: it creates the school and makes
// this person its admin, with the first term free.
const SchoolRegister = ({ onSuccess, onShowPrivacy }) => {
  const [form, setForm] = useState({
    school_name: '',
    full_name: '',
    role: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
    authorised: false,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const change = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      setError('Your password needs at least 8 characters.');
      return;
    }
    if (form.password !== form.confirm_password) {
      setError('The two passwords are different.');
      return;
    }
    if (!form.authorised) {
      setError("Please confirm you're authorised to register this school.");
      return;
    }
    setSaving(true);
    setError('');
    try {
      const response = await api.post('/api/school/register', {
        school_name: form.school_name.trim(),
        full_name: form.full_name.trim(),
        role: form.role,
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        country: getCountry(),
        authorised: form.authorised,
      });
      onSuccess(response.data.user, response.data.token);
    } catch (err) {
      setError(!err.response ? 'The server may be starting up. Please wait a moment and try again.' : extractErrorMessage(err, 'Could not create the school account.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto' }}>
      <h2 style={{ color: 'var(--primary)', textAlign: 'center', marginBottom: '4px' }}>Create a school account</h2>
      <p style={{ textAlign: 'center', marginTop: 0, color: 'var(--text-muted)' }}>
        For head teachers and school staff. Your first term is free.
      </p>
      {error && <p role="alert" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '12px', borderRadius: '8px' }}>{error}</p>}
      <form onSubmit={submit}>
        <div style={row}>
          <label htmlFor="school_name" style={label}>School name</label>
          <input id="school_name" name="school_name" required maxLength={255} value={form.school_name} onChange={change} style={field} placeholder="For example, Accra Academy" />
        </div>
        <div style={row}>
          <label htmlFor="school_full_name" style={label}>Your full name</label>
          <input id="school_full_name" name="full_name" required maxLength={255} autoComplete="name" value={form.full_name} onChange={change} style={field} />
        </div>
        <div style={row}>
          <label htmlFor="school_role" style={label}>Your role at the school</label>
          <select id="school_role" name="role" required value={form.role} onChange={change} style={field}>
            <option value="">Choose your role</option>
            {ROLES.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
          </select>
        </div>
        <div style={row}>
          <label htmlFor="school_email" style={label}>Work email</label>
          <input id="school_email" name="email" type="email" required autoComplete="email" value={form.email} onChange={change} style={field} />
          <p style={hint}>You sign in with this, and payment receipts go here.</p>
        </div>
        <div style={row}>
          <label htmlFor="school_phone" style={label}>Phone number</label>
          <input id="school_phone" name="phone" type="tel" required autoComplete="tel" value={form.phone} onChange={change} style={field} placeholder="024 123 4567" />
        </div>
        <div style={row}>
          <label htmlFor="school_password" style={label}>Password</label>
          <input id="school_password" name="password" type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={change} style={field} />
        </div>
        <div style={row}>
          <label htmlFor="school_confirm_password" style={label}>Confirm password</label>
          <input id="school_confirm_password" name="confirm_password" type="password" required autoComplete="new-password" value={form.confirm_password} onChange={change} style={field} />
        </div>
        <div style={row}>
          <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.9375rem', cursor: 'pointer' }}>
            <input type="checkbox" name="authorised" checked={form.authorised} onChange={change} style={{ marginTop: '4px' }} />
            <span>
              I&apos;m 18 or older and authorised to register this school. I agree to the{' '}
              <a href="/terms" style={{ color: 'var(--primary)' }}>Terms</a> and the{' '}
              <button type="button" onClick={onShowPrivacy} style={{ background: 'none', border: 'none', color: 'var(--primary)', textDecoration: 'underline', padding: 0, font: 'inherit', cursor: 'pointer' }}>Privacy Policy</button>.
            </span>
          </label>
        </div>
        <Button type="submit" disabled={saving} style={{ width: '100%' }}>
          {saving ? 'Creating your school…' : 'Create school account'}
        </Button>
      </form>
    </div>
  );
};

export default SchoolRegister;
