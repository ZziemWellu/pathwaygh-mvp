import React from 'react';
import { formatDate } from '../../../utils/date';

// Shared bits for the Explore detail modals: where the information came from,
// and when someone last checked it.

export const controlStyle = {
  padding: '10px 14px',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  fontSize: '0.9375rem',
  background: 'var(--surface, white)',
  maxWidth: '100%',
  minWidth: 0,
};

export const chipStyle = {
  background: 'var(--surface-sunken)',
  padding: '4px 10px',
  borderRadius: '12px',
  fontSize: '0.875rem',
};

const checkedOn = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? value : formatDate(date, { long: true });
};

const SourceList = ({ sources, lastChecked }) => {
  if (!sources?.length && !lastChecked) return null;
  return (
    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
      {sources?.length > 0 && (
        <>
          <strong>Sources</strong>
          <ul style={{ margin: '4px 0 8px', paddingLeft: '18px' }}>
            {sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>{s.name}</a>
              </li>
            ))}
          </ul>
        </>
      )}
      {lastChecked && <div>Last checked: {checkedOn(lastChecked)}</div>}
    </div>
  );
};

export default SourceList;
