import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { errorText } from './shared';

const Count = ({ value }) => (
  <span>
    <strong>{value.live}</strong> approved{value.draft ? ` · ${value.draft} draft` : ''}
  </span>
);

const CoveragePanel = () => {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [gapsOnly, setGapsOnly] = useState(false);

  useEffect(() => {
    api.get('/api/content/coverage').then((r) => setReport(r.data)).catch((err) => setError(errorText(err, 'Could not load the coverage report.')));
  }, []);

  if (error) return <p role="alert" style={{ color: 'var(--danger)' }}>{error}</p>;
  if (!report) return <p>Loading...</p>;

  return (
    <div>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-subtle)' }}>{report.note}</p>
      <label style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', margin: '8px 0 16px' }}>
        <input type="checkbox" checked={gapsOnly} onChange={(e) => setGapsOnly(e.target.checked)} /> Show only topics with gaps
      </label>
      {report.levels.map((level) => (
        <section key={level.id} style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 8px' }}>{level.name} ({level.exam})</h3>
          {level.subjects.map((subject) => (
            <details key={subject.id} className="card" style={{ padding: '12px 16px', marginBottom: '8px' }}>
              <summary style={{ cursor: 'pointer' }}>
                <strong>{subject.name}</strong>{' '}
                <span style={{ fontSize: '0.875rem', color: 'var(--text-subtle)' }}>
                  {subject.totals.topics_with_gaps} of {subject.totals.topics} topics have gaps · questions: {subject.totals.questions.live} approved, {subject.totals.questions.draft} draft · lessons: {subject.totals.lessons.live} approved, {subject.totals.lessons.draft} draft
                  {subject.untagged_questions ? ` · ${subject.untagged_questions} questions not tagged to a topic` : ''}
                  {subject.provisional ? ' · provisional' : ''}
                </span>
              </summary>
              {subject.strands.map((strand) => {
                const topics = strand.topics.filter((t) => !gapsOnly || t.gaps.length);
                if (!topics.length) return null;
                return (
                  <div key={strand.id} style={{ marginTop: '12px' }}>
                    <h4 style={{ margin: '0 0 6px', fontSize: '0.9375rem' }}>{strand.name}</h4>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                          <tr style={{ textAlign: 'left' }}>
                            <th style={cell}>Topic</th>
                            <th style={cell}>Lessons</th>
                            <th style={cell}>Questions</th>
                            <th style={cell}>Gaps</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topics.map((topic) => (
                            <tr key={topic.id}>
                              <td style={cell}>
                                {topic.name}
                                <div style={{ color: 'var(--text-subtle)' }}>{topic.id}{topic.priority === 1 ? ' · most examined' : ''}</div>
                              </td>
                              <td style={cell}><Count value={topic.lessons} /></td>
                              <td style={cell}><Count value={topic.questions} /></td>
                              <td style={{ ...cell, color: topic.gaps.length ? 'var(--danger)' : 'var(--primary)' }}>{topic.gaps.length ? topic.gaps.join('; ') : 'None'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
              <p style={{ fontSize: '0.875rem', color: 'var(--text-subtle)', marginBottom: 0 }}>
                Sources to check against: {subject.sources.map((s) => `${s.publisher}, ${s.document} (${s.url})`).join('; ')}
              </p>
            </details>
          ))}
        </section>
      ))}
      {report.untagged_lessons > 0 && <p style={{ fontSize: '0.875rem' }}>{report.untagged_lessons} JHS/SHS lessons aren&apos;t tagged to a syllabus topic.</p>}
    </div>
  );
};

const cell = { padding: '6px 8px', borderBottom: '1px solid var(--border)', verticalAlign: 'top' };

export default CoveragePanel;
