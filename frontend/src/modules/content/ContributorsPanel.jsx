import React, { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import { errorText, fieldStyle } from './shared';

// Admins choose which teachers can draft and review content.
const ContributorsPanel = () => {
  const [contributors, setContributors] = useState([]);
  const [activity, setActivity] = useState([]);
  const [identifier, setIdentifier] = useState('');
  const [message, setMessage] = useState(null);
  const load = useCallback(() => {
    api.get('/api/content/contributors').then((r) => setContributors(r.data.contributors)).catch(() => {});
    api.get('/api/content/activity', { params: { limit: 30 } }).then((r) => setActivity(r.data.activity)).catch(() => {});
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const change = async (value, isContributor) => {
    setMessage(null);
    try {
      await api.post('/api/content/contributors', { identifier: value, is_contributor: isContributor });
      setIdentifier('');
      setMessage(isContributor ? 'Added. They see Content tools after signing in again.' : 'Removed.');
      load();
    } catch (err) {
      setMessage(errorText(err, 'Could not change that account.'));
    }
  };

  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); change(identifier, true); }} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <label htmlFor="contributor-identifier" style={{ alignSelf: 'center' }}>Teacher&apos;s exact email or username</label>
        <input id="contributor-identifier" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} style={{ ...fieldStyle, width: 'auto', flex: '1 1 200px' }} />
        <Button type="submit" size="sm">Make contributor</Button>
      </form>
      {message && <p role="status">{message}</p>}
      {contributors.length === 0 ? <p>No contributors yet.</p> : (
        <ul style={{ paddingLeft: '20px' }}>
          {contributors.map((c) => (
            <li key={c.id} style={{ marginBottom: '6px' }}>
              {c.full_name} ({c.email || c.username}){' '}
              <Button size="sm" variant="secondary" onClick={() => change(c.email || c.username, false)}>Remove</Button>
            </li>
          ))}
        </ul>
      )}
      <h3 style={{ margin: '20px 0 8px' }}>Recent activity</h3>
      <ul style={{ paddingLeft: '20px', fontSize: '0.875rem' }}>
        {activity.map((a, i) => (
          <li key={i}>{new Date(a.at).toLocaleString()}: {a.by || 'someone'} {a.action.replace('_', ' ')} {a.item_type} {a.item_id}{a.note ? ` (${a.note})` : ''}</li>
        ))}
      </ul>
    </div>
  );
};

export default ContributorsPanel;
