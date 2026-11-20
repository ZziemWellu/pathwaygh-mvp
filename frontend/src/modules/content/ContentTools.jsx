import React, { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import '../practice/Practice.css';
import CoveragePanel from './CoveragePanel';
import ReviewPanel from './ReviewPanel';
import ImportPanel from './ImportPanel';
import ReportsPanel from './ReportsPanel';
import ContributorsPanel from './ContributorsPanel';
import { LessonForm, QuestionForm } from './ContentForms';

const WritePanel = () => {
  const [saved, setSaved] = useState(null);
  return (
    <div>
      {saved && <p role="status" style={{ color: 'var(--primary)' }}>Saved as a draft. Someone else needs to approve it in Review.</p>}
      <details className="card" style={{ padding: '14px 16px', marginBottom: '12px' }} open>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>New practice question</summary>
        <div style={{ marginTop: '12px' }}><QuestionForm onSaved={() => setSaved(Date.now())} /></div>
      </details>
      <details className="card" style={{ padding: '14px 16px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>New lesson</summary>
        <div style={{ marginTop: '12px' }}><LessonForm onSaved={() => setSaved(Date.now())} /></div>
      </details>
    </div>
  );
};

// Admins and contributors (teachers) check, write and import learning
// materials here. Access is enforced on the server for every /api/content
// call; this only decides which tabs to show.
const ContentTools = ({ user }) => {
  const tabs = [
    ['coverage', 'Coverage', CoveragePanel],
    ['review', 'Review', ReviewPanel],
    ['write', 'Write', WritePanel],
    ['reports', 'Reports', ReportsPanel],
    ...(user?.is_admin ? [['import', 'Import', ImportPanel], ['contributors', 'Contributors', ContributorsPanel]] : []),
  ];
  const [tab, setTab] = useState('coverage');
  const Panel = tabs.find(([id]) => id === tab)?.[2] || CoveragePanel;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <PageHeader icon={ClipboardCheck} title="Content tools" subtitle="Lessons and practice questions: what exists, what still needs checking, and what's missing" />
      <div role="tablist" aria-label="Content tools" className="practice-tabs" style={{ flexWrap: 'wrap' }}>
        {tabs.map(([id, label]) => (
          <button key={id} type="button" role="tab" id={`content-tab-${id}`} aria-selected={tab === id} aria-controls="content-panel" className={`practice-tab${tab === id ? ' is-active' : ''}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      <div id="content-panel" role="tabpanel" aria-labelledby={`content-tab-${tab}`} style={{ marginTop: '16px' }}>
        <Panel />
      </div>
    </div>
  );
};

export default ContentTools;
