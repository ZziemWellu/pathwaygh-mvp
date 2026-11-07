import React, { useState } from 'react';
import api, { extractErrorMessage } from '../../services/api';
import Button from '../ui/Button';

// Shown instead of the app until a school-issued temporary password is replaced.
const ChangePassword = ({ user, onChanged, onLogout }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (next.length < 8) {
      setError('Your new password needs at least 8 characters.');
      return;
    }
    if (next !== confirm) {
      setError('The two new passwords are different.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const response = await api.post('/api/auth/change-password', { current_password: current, new_password: next });
      onChanged(response.data.user, response.data.token);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not change your password. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const field = { width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.9375rem' };
  const label = { display: 'block', marginBottom: '4px', fontWeight: 'bold' };
  const row = { marginBottom: '16px' };

  return (
    <main style={{ maxWidth: '400px', margin: '40px auto', padding: '0 16px' }}>
      <h1 style={{ color: 'var(--primary)', fontSize: '1.5rem' }}>Choose your own password</h1>
      <p>
        Welcome, {user?.full_name}. Your school gave you a password to start with.
        Please choose a new one that only you know. Ask a parent or teacher if you need help.
      </p>
      {error && <p role="alert" style={{ color: 'var(--danger)' }}>{error}</p>}
      <form onSubmit={submit}>
        <div style={row}>
          <label htmlFor="current-password" style={label}>Password from your school</label>
          <input id="current-password" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} style={field} />
        </div>
        <div style={row}>
          <label htmlFor="new-password" style={label}>New password</label>
          <input id="new-password" type="password" autoComplete="new-password" required value={next} onChange={(e) => setNext(e.target.value)} style={field} />
        </div>
        <div style={row}>
          <label htmlFor="confirm-new-password" style={label}>New password again</label>
          <input id="confirm-new-password" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} style={field} />
        </div>
        <Button type="submit" disabled={saving} style={{ width: '100%' }}>{saving ? 'Saving…' : 'Save my password'}</Button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '16px' }}>
        <button type="button" onClick={onLogout} style={{ background: 'none', border: 'none', color: 'var(--primary)', textDecoration: 'underline', cursor: 'pointer' }}>Sign out</button>
      </p>
    </main>
  );
};

export default ChangePassword;
