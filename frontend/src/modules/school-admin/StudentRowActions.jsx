import React, { useState } from 'react';
import api, { extractErrorMessage } from '../../services/api';

const LEVELS = [['primary', 'Primary'], ['jhs', 'JHS'], ['shs', 'SHS']];

// Correcting a level needs a reason, which is kept with the change. Resetting a
// password is only offered for school-issued logins.
const StudentRowActions = ({ student, onChanged }) => {
  const [level, setLevel] = useState(student.level || '');
  const [reason, setReason] = useState('');
  const [temporary, setTemporary] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const changing = level && level !== (student.level || '');

  const saveLevel = async () => {
    setBusy(true);
    setError('');
    try {
      await api.patch(`/api/school/students/${student.id}/level`, { level, reason });
      setReason('');
      onChanged?.();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not change the level.'));
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    setBusy(true);
    setError('');
    try {
      const response = await api.post(`/api/school/students/${student.id}/reset-password`);
      setTemporary(response.data.temporary_password);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not reset the password.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '150px' }}>
      <select aria-label={`Level for ${student.full_name}`} value={level} onChange={(e) => setLevel(e.target.value)} style={{ padding: '4px', width: '100%', fontSize: '12px' }}>
        {!student.level && <option value="">Not set</option>}
        {LEVELS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      {changing && (
        <>
          <input aria-label={`Reason for changing ${student.full_name}'s level`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for the change" maxLength={255} style={{ padding: '4px', fontSize: '12px' }} />
          <button type="button" disabled={busy || reason.trim().length < 3} onClick={saveLevel} style={{ fontSize: '12px', padding: '4px', cursor: 'pointer' }}>Save level</button>
        </>
      )}
      {!student.email && (
        <button type="button" disabled={busy} onClick={resetPassword} style={{ fontSize: '12px', padding: '4px', cursor: 'pointer' }}>Reset password</button>
      )}
      {temporary && <span style={{ fontSize: '12px' }}>New password: <code>{temporary}</code></span>}
      {error && <span role="alert" style={{ fontSize: '12px', color: 'var(--danger)' }}>{error}</span>}
    </div>
  );
};

export default StudentRowActions;
