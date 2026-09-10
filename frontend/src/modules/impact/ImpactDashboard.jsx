import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Download } from 'lucide-react';
import api from '../../services/api';

const MONTHS = 6;

const ImpactDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, trendsRes] = await Promise.all([
        api.get('/api/impact/overview'),
        api.get('/api/impact/trends', { params: { months: MONTHS } }),
      ]);
      setOverview(overviewRes.data);
      setTrends(trendsRes.data);
    } catch (err) {
      setError(err.response?.status === 403 ? 'Admin access required.' : 'Failed to load impact dashboard.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const response = await api.get('/api/impact/export', { responseType: 'blob', params: { months: MONTHS } });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `impact_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setExportError('Failed to export report.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>;
  if (error) return <div style={{ textAlign: 'center', padding: '40px', color: '#c62828' }}>{error}</div>;
  if (!overview || !trends) return null;

  const { totals, by_school, by_country } = overview;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ margin: 0 }}>Impact Dashboard</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {exportError && <span style={{ color: '#c62828', fontSize: '13px' }}>{exportError}</span>}
          <button
            onClick={handleExport}
            disabled={exporting}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: exporting ? 'not-allowed' : 'pointer' }}
          >
            <Download size={14} aria-hidden="true" /> {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <StatCard value={totals.student_count} label="Students" />
        <StatCard value={totals.school_count} label="Schools" />
        <StatCard value={totals.country_count} label="Countries" />
        <StatCard value={`${totals.average_completion_rate}%`} label="Avg. Completion" />
        <StatCard value={`${totals.average_quiz_score}%`} label="Avg. Quiz Score" />
        <StatCard
          value={totals.average_quiz_time_seconds > 0 ? `${totals.average_quiz_time_seconds}s` : '-'}
          label="Avg. Time per Quiz"
          note="Per quiz attempt, not total platform usage"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '16px' }}>
          <h3 style={{ marginTop: 0, fontSize: '15px' }}>Enrollment Growth</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trends.series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="enrollments" stroke="#1a5f2b" name="Enrollments" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '16px' }}>
          <h3 style={{ marginTop: 0, fontSize: '15px' }}>Quiz Score Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trends.series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="average_quiz_score" stroke="#2e7d32" name="Avg. Score (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div>
          <h3 style={{ fontSize: '15px' }}>By School</h3>
          {by_school.length === 0 ? (
            <EmptyState text="No schools yet." />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                    <th style={cellStyle}>School</th>
                    <th style={cellStyle}>Country</th>
                    <th style={cellStyle}>Students</th>
                    <th style={cellStyle}>Completion</th>
                    <th style={cellStyle}>Avg. Score</th>
                  </tr>
                </thead>
                <tbody>
                  {by_school.map((row) => (
                    <tr key={row.school_id ?? 'none'} style={{ borderTop: '1px solid #f0f0f0' }}>
                      <td style={cellStyle}>{row.school_name}</td>
                      <td style={cellStyle}>{row.country || '-'}</td>
                      <td style={cellStyle}>{row.student_count}</td>
                      <td style={cellStyle}>{row.average_completion_rate}%</td>
                      <td style={cellStyle}>{row.quizzes_taken > 0 ? `${row.average_quiz_score}%` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <h3 style={{ fontSize: '15px' }}>By Country</h3>
          {by_country.length === 0 ? (
            <EmptyState text="No data yet." />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                    <th style={cellStyle}>Country</th>
                    <th style={cellStyle}>Students</th>
                    <th style={cellStyle}>Schools</th>
                  </tr>
                </thead>
                <tbody>
                  {by_country.map((row) => (
                    <tr key={row.country || 'none'} style={{ borderTop: '1px solid #f0f0f0' }}>
                      <td style={cellStyle}>{row.country || 'Unknown'}</td>
                      <td style={cellStyle}>{row.student_count}</td>
                      <td style={cellStyle}>{row.school_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ value, label, note }) => (
  <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a5f2b' }}>{value}</div>
    <div style={{ fontSize: '12px', color: '#666666' }}>{label}</div>
    {note && <div style={{ fontSize: '10px', color: '#999999', marginTop: '2px' }}>{note}</div>}
  </div>
);

const EmptyState = ({ text }) => (
  <div style={{ textAlign: 'center', padding: '30px', color: '#666666', background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px' }}>
    {text}
  </div>
);

const cellStyle = { padding: '10px 14px', fontSize: '13px' };

export default ImpactDashboard;
