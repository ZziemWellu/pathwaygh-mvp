import React, { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import { REPORT_REASONS } from '../../components/common/ReportProblem';
import { badgeStyle, errorText, fieldStyle, statusLabel } from './shared';

const reasonLabel = Object.fromEntries(REPORT_REASONS);

const ReportCard = ({ report, onDone }) => {
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const resolve = async (status) => {
    try {
      await api.post(`/api/content/reports/${report.id}/resolve`, { status, note: note.trim() || null });
      onDone();
    } catch (err) {
      setError(errorText(err, 'Could not update the report.'));
    }
  };
  const item = report.item;
  return (
    <div className="card" style={{ padding: '14px 16px', marginBottom: '10px' }}>
      <div style={{ fontSize: '0.875rem', color: 'var(--text-subtle)' }}>
        {report.item_type === 'question' ? 'Practice question' : 'Lesson'} {report.item_id} · {new Date(report.created_at).toLocaleString()}
        {report.open_reports_for_item > 1 ? ` · ${report.open_reports_for_item} open reports on this item` : ''}
      </div>
      <p style={{ margin: '6px 0', fontWeight: 'bold' }}>{reasonLabel[report.reason] || report.reason}</p>
      {report.details && <p style={{ margin: '0 0 8px' }}>&ldquo;{report.details}&rdquo;</p>}
      {!item && <p style={{ margin: 0 }}>This item no longer exists.</p>}
      {item && report.item_type === 'question' && (
        <div style={{ padding: '8px 12px', background: 'var(--surface-muted)', borderRadius: '8px' }}>
          <span style={badgeStyle(item.review_status)}>{statusLabel(item.review_status)}</span>
          <p style={{ margin: '6px 0' }}>{item.question}</p>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>Marked correct: <strong>{item.correct}</strong>. Other options: {item.options.filter((o) => o !== item.correct).join(', ')}</p>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem' }}>{item.explanation}</p>
        </div>
      )}
      {item && report.item_type === 'lesson' && (
        <p style={{ margin: 0 }}>
          <a href={`/learn/${item.course_slug}/lessons/${report.item_id}`}>{item.title}</a> <span style={badgeStyle(item.review_status)}>{statusLabel(item.review_status)}</span>
        </p>
      )}
      {report.status === 'open' ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
          <input aria-label="What was done" placeholder="What was done (optional)" value={note} onChange={(e) => setNote(e.target.value)} style={{ ...fieldStyle, flex: '1 1 200px', width: 'auto' }} />
          <Button size="sm" onClick={() => resolve('resolved')}>Fixed</Button>
          <Button size="sm" variant="secondary" onClick={() => resolve('dismissed')}>Nothing wrong</Button>
        </div>
      ) : (
        report.resolution_note && <p style={{ margin: '8px 0 0', fontSize: '0.875rem' }}>Note: {report.resolution_note}</p>
      )}
      {error && <p role="alert" style={{ color: 'var(--danger)' }}>{error}</p>}
      <p style={{ margin: '8px 0 0', fontSize: '0.875rem', color: 'var(--text-subtle)' }}>To take a question or lesson down, reject it in Review.</p>
    </div>
  );
};

const ReportsPanel = () => {
  const [status, setStatus] = useState('open');
  const [reports, setReports] = useState(null);
  const [error, setError] = useState(null);
  const load = useCallback(() => {
    api.get('/api/content/reports', { params: { status } }).then((r) => setReports(r.data.reports)).catch((err) => setError(errorText(err, 'Could not load reports.')));
  }, [status]);
  useEffect(() => {
    load();
  }, [load]);
  return (
    <div>
      <label htmlFor="report-status" style={{ marginRight: '8px' }}>Show</label>
      <select id="report-status" value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...fieldStyle, width: 'auto', marginBottom: '12px' }}>
        <option value="open">open reports</option>
        <option value="resolved">fixed</option>
        <option value="dismissed">nothing wrong</option>
      </select>
      {error && <p role="alert" style={{ color: 'var(--danger)' }}>{error}</p>}
      {reports && reports.length === 0 && <p>No reports here.</p>}
      {reports?.map((report) => <ReportCard key={report.id} report={report} onDone={load} />)}
    </div>
  );
};

export default ReportsPanel;
