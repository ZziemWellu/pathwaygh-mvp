import React, { useEffect, useState } from 'react';
import api from '../../services/api';

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
      <h1 style={{ color: '#1a5f2b', textAlign: 'center' }}>Certificate Verification</h1>
      <p style={{ color: '#666666', textAlign: 'center', marginBottom: '24px' }}>
        Check whether a PathwayGH certificate code is genuine.
      </p>

      <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <input
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          placeholder="XXXX-XXXX-XXXX"
          style={{ flex: 1, padding: '10px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }}
        />
        <button
          type="submit"
          style={{ padding: '10px 20px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          Verify
        </button>
      </form>

      {loading && <p style={{ textAlign: 'center' }}>Checking...</p>}
      {error && <p style={{ textAlign: 'center', color: '#c62828' }}>{error}</p>}

      {result && !loading && (
        result.valid ? (
          <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
            <h2 style={{ color: '#1a5f2b', margin: '0 0 12px 0' }}>Certificate Verified</h2>
            <p style={{ margin: '4px 0' }}><strong>{result.certificate.recipient_name}</strong></p>
            <p style={{ margin: '4px 0', color: '#333' }}>completed <strong>{result.certificate.course_title}</strong></p>
            <p style={{ margin: '4px 0', color: '#666666', fontSize: '13px' }}>
              {result.certificate.lesson_count} lessons · issued {new Date(result.certificate.issued_at).toLocaleDateString()}
            </p>
            <p style={{ marginTop: '12px', color: '#999999', fontSize: '12px' }}>Code: {result.certificate.code_display}</p>
          </div>
        ) : (
          <div style={{ background: '#ffebee', border: '1px solid #ef9a9a', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>❌</div>
            <h2 style={{ color: '#c62828', margin: 0 }}>No certificate found for this code</h2>
          </div>
        )
      )}
    </div>
  );
};

export default CertificateVerify;
