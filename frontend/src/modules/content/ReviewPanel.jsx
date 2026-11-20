import React, { useCallback, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import { LessonForm, QuestionForm } from './ContentForms';
import { badgeStyle, errorText, fieldStyle, statusLabel } from './shared';

const Decision = ({ path, onDone }) => {
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const decide = async (decision) => {
    setBusy(true);
    setError(null);
    try {
      await api.post(path, { decision, note: note.trim() || null });
      onDone();
    } catch (err) {
      setError(errorText(err, 'Could not save that decision.'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginTop: '10px' }}>
      <input aria-label="Review note" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} style={{ ...fieldStyle, flex: '1 1 200px', width: 'auto' }} />
      <Button size="sm" disabled={busy} onClick={() => decide('approve')}>Approve</Button>
      <Button size="sm" variant="danger" disabled={busy} onClick={() => decide('reject')}>Reject</Button>
      {error && <span role="alert" style={{ color: 'var(--danger)', fontSize: '0.875rem' }}>{error}</span>}
    </div>
  );
};

const QuestionCard = ({ q, onChanged }) => {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <div className="card" style={cardStyle}>
        <QuestionForm initial={q} onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); onChanged(); }} />
      </div>
    );
  }
  return (
    <div className="card" style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--text-subtle)' }}>
        <span>{q.subject_name} · {q.topic_name} · {q.difficulty} · {q.id}{q.syllabus_topic ? ` · ${q.syllabus_topic}` : ''}</span>
        <span style={badgeStyle(q.review_status)}>{statusLabel(q.review_status)}</span>
      </div>
      <p style={{ fontWeight: 'bold', margin: '8px 0' }}>{q.question}</p>
      <ul style={{ margin: '0 0 8px', paddingLeft: '20px' }}>
        {q.options.map((o) => <li key={o} style={{ fontWeight: o === q.correct ? 'bold' : 'normal' }}>{o}{o === q.correct ? ' (correct)' : ''}</li>)}
      </ul>
      <p style={{ margin: 0, fontSize: '0.9375rem' }}>{q.explanation}</p>
      {q.attribution && <p style={{ margin: '6px 0 0', fontSize: '0.875rem' }}>Source: {q.attribution}</p>}
      {q.editable && <Button size="sm" variant="secondary" style={{ marginTop: '8px' }} onClick={() => setEditing(true)}>Edit</Button>}
      <Decision path={`/api/content/questions/${q.id}/review`} onDone={onChanged} />
    </div>
  );
};

const LessonCard = ({ lesson, onChanged }) => {
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  if (editing) {
    return (
      <div className="card" style={cardStyle}>
        <LessonForm initial={lesson} onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); onChanged(); }} />
      </div>
    );
  }
  return (
    <div className="card" style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--text-subtle)' }}>
        <span>{lesson.course.title} ({statusLabel(lesson.course.review_status)}) · {lesson.slug}{lesson.syllabus_topic ? ` · ${lesson.syllabus_topic}` : ''}</span>
        <span style={badgeStyle(lesson.review_status)}>{statusLabel(lesson.review_status)}</span>
      </div>
      <p style={{ fontWeight: 'bold', margin: '8px 0' }}>{lesson.title}</p>
      <Button size="sm" variant="secondary" aria-expanded={open} onClick={() => setOpen((v) => !v)}>{open ? 'Hide lesson' : 'Read lesson'}</Button>{' '}
      <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
      {open && <div style={{ marginTop: '10px', lineHeight: 1.6 }}><ReactMarkdown>{lesson.content || ''}</ReactMarkdown></div>}
      {lesson.attribution && <p style={{ margin: '6px 0 0', fontSize: '0.875rem' }}>Source: {lesson.attribution}</p>}
      <Decision path={`/api/content/lessons/${lesson.id}/review`} onDone={onChanged} />
    </div>
  );
};

const ReviewPanel = () => {
  const [kind, setKind] = useState('questions');
  const [status, setStatus] = useState('pending_review');
  const [search, setSearch] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const params = { status, ...(kind === 'questions' && search.trim() ? { search: search.trim() } : {}) };
      const response = await api.get(`/api/content/${kind}`, { params });
      setData(response.data);
    } catch (err) {
      setError(errorText(err, 'Could not load the review queue.'));
    }
  }, [kind, status, search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <label htmlFor="review-kind" style={{ alignSelf: 'center' }}>Show</label>
        <select id="review-kind" value={kind} onChange={(e) => { setData(null); setKind(e.target.value); }} style={{ ...fieldStyle, width: 'auto' }}>
          <option value="questions">Practice questions</option>
          <option value="lessons">Lessons</option>
          <option value="courses">Courses</option>
        </select>
        <label htmlFor="review-status" style={{ alignSelf: 'center' }}>that are</label>
        <select id="review-status" value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...fieldStyle, width: 'auto' }}>
          <option value="pending_review">drafts</option>
          <option value="rejected">rejected</option>
          <option value="live">live</option>
        </select>
        {kind === 'questions' && <input aria-label="Search questions" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...fieldStyle, width: 'auto', flex: '1 1 160px' }} />}
      </div>
      {error && <p role="alert" style={{ color: 'var(--danger)' }}>{error}</p>}
      {!data && !error && <p>Loading...</p>}
      {data && kind === 'questions' && (
        <>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-subtle)' }}>{data.total} question(s){data.total > (data.questions?.length || 0) ? `, showing the first ${data.questions.length}` : ''}. You can&apos;t approve your own work.</p>
          {data.questions?.map((q) => <QuestionCard key={q.id} q={q} onChanged={load} />)}
        </>
      )}
      {data && kind === 'lessons' && (
        <>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-subtle)' }}>{data.total} lesson(s).</p>
          {data.lessons?.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} onChanged={load} />)}
        </>
      )}
      {data && kind === 'courses' && data.courses?.map((course) => (
        <div key={course.id} className="card" style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
            <strong>{course.title}</strong>
            <span style={badgeStyle(course.review_status)}>{statusLabel(course.review_status)}</span>
          </div>
          <p style={{ margin: '6px 0', fontSize: '0.875rem', color: 'var(--text-subtle)' }}>{course.slug} · {course.level.toUpperCase()} · {course.lessons} lessons ({course.lessons_live} live, {course.lessons_draft} draft)</p>
          {course.description && <p style={{ margin: 0 }}>{course.description}</p>}
          <Decision path={`/api/content/courses/${course.id}/review`} onDone={load} />
        </div>
      ))}
    </div>
  );
};

const cardStyle = { padding: '14px 16px', marginBottom: '10px' };

export default ReviewPanel;
