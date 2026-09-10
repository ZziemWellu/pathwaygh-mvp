import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import './certificate-print.css';

const CertificatePage = () => {
  const { courseSlug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkCompletion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseSlug]);

  const checkCompletion = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/api/certificates/check/${courseSlug}`);
      setData(response.data);
    } catch (err) {
      setError('Failed to load certificate.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>;
  if (error) return <div style={{ textAlign: 'center', padding: '40px', color: '#c62828' }}>{error}</div>;

  if (!data?.complete) {
    return (
      <div style={{ maxWidth: '500px', margin: '40px auto', padding: '20px', textAlign: 'center' }}>
        <h2 style={{ color: '#1a5f2b' }}>Not finished yet</h2>
        <p style={{ color: '#666666' }}>You haven't completed all the lessons in this course yet.</p>
        <Link to={`/learn/${courseSlug}`} style={{ color: '#1a5f2b' }}>← Back to course</Link>
      </div>
    );
  }

  const { certificate } = data;
  const verifyUrl = `${window.location.origin}/certificates/verify/${certificate.code}`;

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px' }}>
      <div className="no-print" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to={`/learn/${courseSlug}`} style={{ color: '#1a5f2b', fontSize: '14px' }}>← Back to course</Link>
        <button
          onClick={() => window.print()}
          style={{ padding: '10px 20px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          🖨️ Print / Save as PDF
        </button>
      </div>

      <div
        className="certificate-print-area"
        style={{ background: 'white', border: '4px solid #1a5f2b', borderRadius: '12px', padding: '48px', textAlign: 'center' }}
      >
        <p style={{ color: '#1a5f2b', fontWeight: 'bold', fontSize: '20px', margin: 0 }}>Pathway AI</p>
        <p style={{ color: '#666666', fontSize: '13px', marginTop: '4px' }}>Certificate of Completion</p>

        <p style={{ margin: '32px 0 4px 0', color: '#666666' }}>This certifies that</p>
        <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1a5f2b', margin: '4px 0' }}>{certificate.recipient_name}</p>
        <p style={{ margin: '4px 0', color: '#666666' }}>has successfully completed</p>
        <p style={{ fontSize: '22px', fontWeight: 'bold', margin: '8px 0' }}>{certificate.course_title}</p>
        <p style={{ color: '#666666', fontSize: '13px' }}>
          {certificate.lesson_count} lessons · issued {new Date(certificate.issued_at).toLocaleDateString()}
        </p>

        <div style={{ marginTop: '40px', paddingTop: '16px', borderTop: '1px solid #eee', fontSize: '12px', color: '#999999' }}>
          <p style={{ margin: '4px 0' }}>Verify this certificate at:</p>
          <p style={{ margin: '4px 0', color: '#1a5f2b' }}>{verifyUrl}</p>
          <p style={{ margin: '4px 0' }}>Code: {certificate.code_display}</p>
        </div>
      </div>

      <div className="no-print" style={{ marginTop: '16px', textAlign: 'center' }}>
        <button
          onClick={() => navigator.clipboard.writeText(verifyUrl)}
          style={{ padding: '8px 16px', background: 'none', border: '1px solid #1a5f2b', color: '#1a5f2b', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
        >
          Copy shareable verification link
        </button>
      </div>
    </div>
  );
};

export default CertificatePage;
