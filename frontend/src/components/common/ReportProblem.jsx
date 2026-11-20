import React, { useState } from 'react';
import { FlagIcon } from 'lucide-react';
import api, { extractErrorMessage } from '../../services/api';
import Button from '../ui/Button';

export const REPORT_REASONS = [
  ['wrong_answer', 'The answer is wrong'],
  ['unclear', "It's hard to understand"],
  ['spelling_or_grammar', 'Spelling or grammar mistake'],
  ['not_for_my_level', "It's not for my class"],
  ['inappropriate', 'Something unkind or unsuitable'],
  ['other', 'Something else'],
];

// "Report a problem" on a practice question or a lesson. Reports go to the
// admins' queue (Content tools > Reports); the reporter isn't shown there.
const ReportProblem = ({ itemType, itemId }) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('wrong_answer');
  const [details, setDetails] = useState('');
  const [state, setState] = useState('idle');
  const [error, setError] = useState(null);
  const formId = `report-${itemType}-${itemId}`;

  const submit = async (e) => {
    e.preventDefault();
    setState('sending');
    setError(null);
    try {
      await api.post('/api/content/reports', { item_type: itemType, item_id: itemId, reason, details: details.trim() || null });
      setState('sent');
    } catch (err) {
      setError(extractErrorMessage(err, "We couldn't send that. Please try again."));
      setState('idle');
    }
  };

  if (state === 'sent') {
    return <p role="status" style={{ margin: '12px 0 0', fontSize: '0.875rem', color: 'var(--text-subtle)' }}>Thank you. We&apos;ll check it.</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ marginTop: '12px', background: 'none', border: 'none', padding: 0, color: 'var(--text-subtle)', fontSize: '0.875rem', textDecoration: 'underline', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
      >
        <FlagIcon size={14} aria-hidden="true" /> Report a problem
      </button>
    );
  }

  return (
    <form onSubmit={submit} aria-label="Report a problem" style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px' }}>
      <label htmlFor={`${formId}-reason`} style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>What&apos;s wrong?</label>
      <select id={`${formId}-reason`} value={reason} onChange={(e) => setReason(e.target.value)} style={fieldStyle}>
        {REPORT_REASONS.map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <label htmlFor={`${formId}-details`} style={{ fontSize: '0.875rem' }}>Tell us more (optional)</label>
      <textarea id={`${formId}-details`} value={details} maxLength={1000} onChange={(e) => setDetails(e.target.value)} style={{ ...fieldStyle, minHeight: '60px' }} />
      {error && <p role="alert" style={{ margin: 0, color: 'var(--danger)', fontSize: '0.875rem' }}>{error}</p>}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Button type="submit" size="sm" disabled={state === 'sending'}>{state === 'sending' ? 'Sending...' : 'Send report'}</Button>
        <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
};

const fieldStyle = { padding: '8px 10px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.9375rem', fontFamily: 'inherit' };

export default ReportProblem;
