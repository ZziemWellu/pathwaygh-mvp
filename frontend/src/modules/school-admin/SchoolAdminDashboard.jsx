import React, { useEffect, useState } from 'react';
import { Copy } from 'lucide-react';
import api from '../../services/api';

const SchoolAdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/school/dashboard');
      setData(response.data);
    } catch (err) {
      setError(err.response?.status === 403 ? 'School admin access required.' : 'Failed to load school dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const copyJoinCode = () => {
    if (!data?.school?.join_code) return;
    navigator.clipboard.writeText(data.school.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>;
  if (error) return <div style={{ textAlign: 'center', padding: '40px', color: '#c62828' }}>{error}</div>;
  if (!data) return null;

  const { school, roster, summary } = data;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ margin: 0 }}>{school?.name || 'School'} Dashboard</h2>
        <div
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}
          onClick={copyJoinCode}
          title="Click to copy"
        >
          Join code: <strong>{school?.join_code}</strong>
          <Copy size={14} />
          {copied && <span style={{ color: '#1a5f2b' }}>Copied!</span>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a5f2b' }}>{summary.student_count}</div>
          <div style={{ fontSize: '12px', color: '#666666' }}>Students</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a5f2b' }}>{summary.average_completion_rate}%</div>
          <div style={{ fontSize: '12px', color: '#666666' }}>Avg. Completion</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a5f2b' }}>{summary.average_quiz_score}%</div>
          <div style={{ fontSize: '12px', color: '#666666' }}>Avg. Quiz Score</div>
        </div>
      </div>

      {roster.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666666', background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px' }}>
          No students yet. Share the join code above so students can link themselves to {school?.name}.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                <th style={cellStyle}>Name</th>
                <th style={cellStyle}>Email</th>
                <th style={cellStyle}>Grade</th>
                <th style={cellStyle}>Courses</th>
                <th style={cellStyle}>Lessons</th>
                <th style={cellStyle}>Quizzes</th>
                <th style={cellStyle}>Avg. Score</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((student) => (
                <tr key={student.id} style={{ borderTop: '1px solid #f0f0f0' }}>
                  <td style={cellStyle}>
                    {student.full_name}
                    {student.is_school_admin && (
                      <span style={{ marginLeft: '6px', fontSize: '10px', fontWeight: 'bold', color: '#1a5f2b', background: '#e8f5e9', padding: '2px 8px', borderRadius: '999px' }}>
                        Admin
                      </span>
                    )}
                  </td>
                  <td style={cellStyle}>{student.email}</td>
                  <td style={cellStyle}>{student.grade || '-'}</td>
                  <td style={cellStyle}>{student.courses_enrolled}</td>
                  <td style={cellStyle}>{student.lessons_completed}/{student.lessons_total}</td>
                  <td style={cellStyle}>{student.quizzes_taken}</td>
                  <td style={cellStyle}>{student.quizzes_taken > 0 ? `${student.average_quiz_score}%` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const cellStyle = { padding: '10px 14px', fontSize: '13px' };

export default SchoolAdminDashboard;
