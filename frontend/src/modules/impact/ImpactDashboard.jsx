import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { BarChart3, Download } from 'lucide-react';
import api from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';

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
  if (error) return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--danger)' }}>{error}</div>;
  if (!overview || !trends) return null;

  const { totals, by_school, by_country } = overview;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px' }}>
      <PageHeader
        icon={BarChart3}
        title="Impact Dashboard"
        actions={
          <>
            {exportError && <span style={{ color: 'var(--danger)', fontSize: '13px' }}>{exportError}</span>}
            <Button size="sm" icon={Download} onClick={handleExport} disabled={exporting}>
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </>
        }
      />

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
        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ marginTop: 0, fontSize: '15px' }}>Enrollment Growth</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trends.series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="enrollments" stroke="var(--primary)" name="Enrollments" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <h3 style={{ marginTop: 0, fontSize: '15px' }}>Quiz Score Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trends.series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="average_quiz_score" stroke="var(--success)" name="Avg. Score (%)" />
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
              <table className="card card--flush" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-muted)', textAlign: 'left' }}>
                    <th style={cellStyle}>School</th>
                    <th style={cellStyle}>Country</th>
                    <th style={cellStyle}>Students</th>
                    <th style={cellStyle}>Completion</th>
                    <th style={cellStyle}>Avg. Score</th>
                  </tr>
                </thead>
                <tbody>
                  {by_school.map((row) => (
                    <tr key={row.school_id ?? 'none'} style={{ borderTop: '1px solid var(--surface-sunken)' }}>
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
              <table className="card card--flush" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-muted)', textAlign: 'left' }}>
                    <th style={cellStyle}>Country</th>
                    <th style={cellStyle}>Students</th>
                    <th style={cellStyle}>Schools</th>
                  </tr>
                </thead>
                <tbody>
                  {by_country.map((row) => (
                    <tr key={row.country || 'none'} style={{ borderTop: '1px solid var(--surface-sunken)' }}>
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
  <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
    <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--primary)' }}>{value}</div>
    <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{label}</div>
    {note && <div style={{ fontSize: '10px', color: 'var(--gray-500)', marginTop: '2px' }}>{note}</div>}
  </div>
);

const EmptyState = ({ text }) => (
  <div className="card" style={{ textAlign: 'center', padding: '30px', color: 'var(--gray-500)' }}>
    {text}
  </div>
);

const cellStyle = { padding: '10px 14px', fontSize: '13px' };

export default ImpactDashboard;
