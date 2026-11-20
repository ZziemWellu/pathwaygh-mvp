// Shared bits for the content tools pages.
export const fieldStyle = {
  padding: '8px 10px',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  fontSize: '0.9375rem',
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
};

export const STATUS_LABELS = {
  pending_review: 'Draft',
  approved: 'Approved',
  rejected: 'Rejected',
  published: 'Live',
  computed: 'Calculated',
  teacher_reviewed: 'Teacher checked',
};

export const statusLabel = (status) => STATUS_LABELS[status] || status || 'Live';

export const badgeStyle = (status) => ({
  display: 'inline-block',
  fontSize: '0.8125rem',
  padding: '2px 8px',
  borderRadius: '999px',
  border: '1px solid var(--border)',
  background: status === 'pending_review' ? 'var(--warning-bg)' : status === 'rejected' ? 'var(--surface-sunken)' : 'var(--primary-bg)',
});

export const errorText = (err, fallback) => {
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (detail?.message) return detail.message;
  if (Array.isArray(detail)) return detail.map((d) => d.msg).join('; ');
  return fallback;
};
