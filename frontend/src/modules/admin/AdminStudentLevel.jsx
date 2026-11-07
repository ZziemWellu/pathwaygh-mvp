import React, { useState } from 'react';
import api, { extractErrorMessage } from '../../services/api';
import Button from '../../components/ui/Button';

// For a student with no school admin to ask. Finds one account by its exact
// email or username: there's deliberately no list or search. Changes are logged.
const AdminStudentLevel = () => {
  const [identifier, setIdentifier] = useState('');
  const [student, setStudent] = useState(null);
  const [level, setLevel] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const find = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setStudent(null);
    try {
      const response = await api.get('/api/admin/students/lookup', { params: { identifier: identifier.trim() } });
      setStudent(response.data.student);
      setLevel(response.data.student.level || '');
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not find that account.'));
    }
  };

  const save = async () => {
    setError('');
    try {
      const response = await api.post('/api/admin/students/level', { identifier: identifier.trim(), level, reason });
      setStudent(response.data.student);
      setReason('');
      setMessage('Level updated and logged.');
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not change the level.'));
    }
  };

  const field = { padding: '8px', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '15px' };

  return (
    <section className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
      <h2 style={{ margin: '0 0 6px', fontSize: '18px' }}>Correct a student&apos;s level</h2>
      <p style={{ margin: '0 0 10px', fontSize: '15px', color: 'var(--text-muted)' }}>
        Enter their exact email or username. Each change is recorded with your reason.
      </p>
      <form onSubmit={find} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input aria-label="Email or username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Email or username" style={{ ...field, flex: '1 1 220px' }} />
        <Button type="submit" size="sm" disabled={identifier.trim().length < 3}>Find</Button>
      </form>
      {student && (
        <div style={{ marginTop: '12px', fontSize: '15px' }}>
          <p style={{ margin: '0 0 8px' }}>
            <strong>{student.full_name}</strong> · {student.country} · {student.level ? student.level.toUpperCase() : 'no level'}{student.grade ? ` · ${student.grade}` : ''}
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select aria-label="New level" value={level} onChange={(e) => setLevel(e.target.value)} style={field}>
              <option value="">Choose</option>
              <option value="primary">Primary</option>
              <option value="jhs">JHS</option>
              <option value="shs">SHS</option>
            </select>
            <input aria-label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" maxLength={255} style={{ ...field, flex: '1 1 200px' }} />
            <Button size="sm" onClick={save} disabled={!level || level === student.level || reason.trim().length < 3}>Save</Button>
          </div>
        </div>
      )}
      {message && <p style={{ color: 'var(--primary)', fontSize: '15px' }}>{message}</p>}
      {error && <p role="alert" style={{ color: 'var(--danger)', fontSize: '15px' }}>{error}</p>}
    </section>
  );
};

export default AdminStudentLevel;
