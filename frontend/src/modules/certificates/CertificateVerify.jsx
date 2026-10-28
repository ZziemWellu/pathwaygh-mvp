import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { formatDate } from '../../utils/date';
import { CircleCheckIcon, CircleXIcon } from 'lucide-react';
import Button from '../../components/ui/Button';

/**
 * Public, router-agnostic: takes `code` as a prop rather than calling
 * useParams(), since this component is also rendered by App.jsx directly
 * (before BrowserRouter mounts) for a logged-out visitor landing on a
 * shared verification link with no auth state at all.
 */
const CertificateVerify = ({ code: initialCode }) => {
  const [codeInput, setCodeInput] = useState(initialCode || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialCode) {
      verify(initialCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  const verify = async (code) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/certificates/verify/${encodeURIComponent(code)}`);
      setResult(response.data);
    } catch (err) {
      setError('Failed to check this certificate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!codeInput.trim()) return;
    // Not useNavigate - this may render outside any router context.
    window.history.replaceState(null, '', `/certificates/verify/${encodeURIComponent(codeInput.trim())}`);
    verify(codeInput.trim());
  };

  return (
    <div style={{ maxWidth: '500px', margin: '40px auto', padding: '20px' }}>
      <h1 style={{ color: 'var(--primary)', textAlign: 'center' }}>Certificate Verification</h1>
      <p style={{ color: 'var(--gray-500)', textAlign: 'center', marginBottom: '24px' }}>
        Check whether a PathwayGH certificate code is genuine.
      </p>

      <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <input
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          placeholder="XXXX-XXXX-XXXX"
          style={{ flex: 1, padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px' }}
        />
        <Button type="submit">
          Verify
        </Button>
      </form>

      {loading && <p style={{ textAlign: 'center' }}>Checking...</p>}
      {error && <p style={{ textAlign: 'center', color: 'var(--danger)' }}>{error}</p>}

      {result && !loading && (
        result.valid ? (
          <div style={{ background: 'var(--primary-bg)', border: '1px solid var(--primary-border)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}><CircleCheckIcon className="icon-inline" size="1em" aria-hidden="true" /></div>
            <h2 style={{ color: 'var(--primary)', margin: '0 0 12px 0' }}>Certificate Verified</h2>
            <p style={{ margin: '4px 0' }}><strong>{result.certificate.recipient_name}</strong></p>
            <p style={{ margin: '4px 0', color: 'var(--text)' }}>completed <strong>{result.certificate.course_title}</strong></p>
            {result.certificate.school_name && (
              <p style={{ margin: '4px 0', color: 'var(--text)' }}>at <strong>{result.certificate.school_name}</strong></p>
            )}
            <p style={{ margin: '4px 0', color: 'var(--gray-500)', fontSize: '13px' }}>
              {result.certificate.lesson_count} lessons · issued {formatDate(result.certificate.issued_at, { long: true })}
            </p>
            <p style={{ marginTop: '12px', color: 'var(--gray-500)', fontSize: '12px' }}>Code: {result.certificate.code_display}</p>
          </div>
        ) : (
          <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}><CircleXIcon className="icon-inline" size="1em" aria-hidden="true" /></div>
            <h2 style={{ color: 'var(--danger)', margin: 0 }}>No certificate found for this code</h2>
          </div>
        )
      )}
    </div>
  );
};

export default CertificateVerify;
