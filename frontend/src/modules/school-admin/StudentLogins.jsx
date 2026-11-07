import React, { useState } from 'react';
import { KeyRound, Printer } from 'lucide-react';
import api, { extractErrorMessage } from '../../services/api';
import Button from '../../components/ui/Button';

// "Ama Mensah, Primary 4, 024 123 4567": the phone is optional.
export const parseStudentLines = (text) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [fullName = '', grade = '', phone = ''] = line.split(',').map((part) => part.trim());
      return { full_name: fullName, grade, guardian_phone: phone || null };
    });

// Issues usernames and one-time passwords for pupils with no email. The
// passwords are only ever on screen here, so the admin prints them straight away.
const StudentLogins = ({ onIssued, consentConfirmed }) => {
  const [text, setText] = useState('');
  const [issued, setIssued] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const students = parseStudentLines(text);
    if (!students.length) return;
    setSaving(true);
    setError('');
    try {
      const response = await api.post('/api/school/students', { students });
      setIssued(response.data.students);
      setText('');
      onIssued?.();
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not create those logins.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card" style={{ padding: '16px 20px', margin: '16px 0' }}>
      <h2 style={{ margin: '0 0 6px', fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <KeyRound size={18} aria-hidden="true" /> Create logins for pupils with no email
      </h2>
      <p style={{ margin: '0 0 10px', fontSize: '0.9375rem', color: 'var(--text-muted)' }}>
        Add one pupil per line: name, class, and a parent&apos;s phone if you have it. Up to 50 at a time.
        Pupils choose their own password the first time they sign in.
      </p>
      {!consentConfirmed && (
        <p style={{ fontSize: '0.9375rem', color: 'var(--danger)' }}>
          First tick the box above to confirm your school has collected parents&apos; consent.
        </p>
      )}
      <form onSubmit={submit}>
        <label htmlFor="student-lines" style={{ display: 'block', fontWeight: 'bold', fontSize: '0.9375rem', marginBottom: '4px' }}>Pupils</label>
        <textarea
          id="student-lines"
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'Ama Mensah, Primary 4, 024 123 4567\nKofi Boateng, Primary 5'}
          style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.9375rem' }}
        />
        <Button type="submit" disabled={saving || !text.trim() || !consentConfirmed} style={{ marginTop: '8px' }}>
          {saving ? 'Creating…' : 'Create logins'}
        </Button>
      </form>
      {error && <p role="alert" style={{ color: 'var(--danger)' }}>{error}</p>}
      {issued.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <p style={{ fontWeight: 'bold' }}>Print these now. You won&apos;t be able to see these passwords again.</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9375rem' }}>
              <thead>
                <tr style={{ textAlign: 'left' }}><th>Name</th><th>Class</th><th>Username</th><th>Password</th></tr>
              </thead>
              <tbody>
                {issued.map((s) => (
                  <tr key={s.username} style={{ borderTop: '1px solid var(--surface-sunken)' }}>
                    <td>{s.full_name}</td><td>{s.grade}</td><td><code>{s.username}</code></td><td><code>{s.temporary_password}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button variant="secondary" onClick={() => window.print()} style={{ marginTop: '8px' }}>
            <Printer size={16} aria-hidden="true" /> Print
          </Button>
        </div>
      )}
    </section>
  );
};

export default StudentLogins;
