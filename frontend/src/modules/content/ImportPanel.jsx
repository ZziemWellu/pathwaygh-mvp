import React, { useState } from 'react';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import { errorText } from './shared';

const KINDS = {
  questions: { label: 'Practice questions (CSV)', accept: '.csv,text/csv', template: 'questions.csv' },
  lessons: { label: 'Lessons (markdown)', accept: '.md,.markdown,text/markdown,text/plain', template: 'lessons.md' },
};

// Download a template through the API (it needs the sign-in token).
const downloadTemplate = async (name) => {
  const response = await api.get(`/api/content/templates/${name}`, { responseType: 'text', transformResponse: (d) => d });
  const url = URL.createObjectURL(new Blob([response.data], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name.replace('.', '-template.');
  link.click();
  URL.revokeObjectURL(url);
};

const ImportForm = ({ kind }) => {
  const { label, accept, template } = KINDS[kind];
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [problems, setProblems] = useState(null);
  const [busy, setBusy] = useState(false);

  const send = async (dryRun) => {
    if (!file) return;
    setBusy(true);
    setResult(null);
    setProblems(null);
    const body = new FormData();
    body.append('file', file);
    try {
      const response = await api.post(`/api/content/import/${kind}`, body, { params: { dry_run: dryRun }, headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(response.data);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setProblems({ message: errorText(err, 'The upload failed.'), errors: Array.isArray(detail?.errors) ? detail.errors : [] });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card" style={{ padding: '16px', marginBottom: '16px' }}>
      <h3 style={{ margin: '0 0 8px' }}>{label}</h3>
      <p style={{ margin: '0 0 10px', fontSize: '0.875rem', color: 'var(--text-subtle)' }}>
        Everything imported starts as a draft and stays hidden from students until approved. If any row has a problem, nothing is imported.
      </p>
      <Button size="sm" variant="secondary" onClick={() => downloadTemplate(template)}>Download template</Button>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '10px' }}>
        <label htmlFor={`import-${kind}`} style={{ fontSize: '0.875rem' }}>File</label>
        <input id={`import-${kind}`} type="file" accept={accept} onChange={(e) => { setFile(e.target.files?.[0] || null); setResult(null); setProblems(null); }} />
        <Button size="sm" variant="secondary" disabled={!file || busy} onClick={() => send(true)}>Check file</Button>
        <Button size="sm" disabled={!file || busy} onClick={() => send(false)}>Import as drafts</Button>
      </div>
      {result && (
        <p role="status" style={{ margin: '10px 0 0', color: 'var(--primary)' }}>
          {result.dry_run ? `The file is fine: ${result.count} item(s) ready to import.` : `Imported ${result.count} draft(s).`}
          {result.new_courses ? ` ${result.new_courses} new draft course(s).` : ''}
        </p>
      )}
      {problems && (
        <div role="alert" style={{ marginTop: '10px', color: 'var(--danger)' }}>
          <p style={{ margin: '0 0 6px' }}>{problems.message}</p>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.875rem' }}>
            {problems.errors.map((e, i) => <li key={i}>{e.line ? `Line ${e.line}: ` : ''}{e.message}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
};

const ImportPanel = () => (
  <div>
    <ImportForm kind="questions" />
    <ImportForm kind="lessons" />
  </div>
);

export default ImportPanel;
