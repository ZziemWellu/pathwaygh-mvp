import React, { useState } from 'react';
import api from '../../services/api';
import Button from '../../components/ui/Button';
import { errorText, fieldStyle } from './shared';

const Field = ({ label, id, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <label htmlFor={id} style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>{label}</label>
    {children}
  </div>
);

const LICENCE_HELP = 'Original, CC BY, CC BY-SA, CC0 or public domain only. Never NonCommercial (NC) or NoDerivatives (ND) material.';

const emptyQuestion = { subject_id: '', topic_id: '', topic_name: '', syllabus_topic: '', question: '', correct: '', wrong: ['', '', ''], explanation: '', difficulty: 'medium', licence: 'original', attribution: '' };

// Create or edit a practice question. Saving always makes it a draft
// that someone else has to approve.
export const QuestionForm = ({ initial, onSaved, onCancel }) => {
  const [form, setForm] = useState(() => (initial ? { ...emptyQuestion, ...initial, wrong: initial.options.filter((o) => o !== initial.correct), syllabus_topic: initial.syllabus_topic || '', attribution: initial.attribution || '' } : emptyQuestion));
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const prefix = initial ? `edit-${initial.id}` : 'new-question';

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = { ...form, syllabus_topic: form.syllabus_topic || null, topic_name: form.topic_name || null, attribution: form.attribution || null };
    try {
      const response = initial ? await api.put(`/api/content/questions/${initial.id}`, body) : await api.post('/api/content/questions', body);
      onSaved?.(response.data.question);
      if (!initial) setForm(emptyQuestion);
    } catch (err) {
      setError(errorText(err, 'Could not save the question.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} style={{ display: 'grid', gap: '10px' }}>
      <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <Field label="Practice subject id" id={`${prefix}-subject`}><input id={`${prefix}-subject`} required value={form.subject_id} onChange={set('subject_id')} placeholder="e.g. english" style={fieldStyle} /></Field>
        <Field label="Topic id" id={`${prefix}-topic`}><input id={`${prefix}-topic`} required value={form.topic_id} onChange={set('topic_id')} placeholder="e.g. vocabulary_jhs" style={fieldStyle} /></Field>
        <Field label="Topic name (new topics only)" id={`${prefix}-topic-name`}><input id={`${prefix}-topic-name`} value={form.topic_name || ''} onChange={set('topic_name')} style={fieldStyle} /></Field>
        <Field label="Syllabus topic id" id={`${prefix}-syllabus`}><input id={`${prefix}-syllabus`} value={form.syllabus_topic} onChange={set('syllabus_topic')} placeholder="e.g. jhs3.english.reading.vocabulary" style={fieldStyle} /></Field>
      </div>
      <Field label="Question" id={`${prefix}-question`}><textarea id={`${prefix}-question`} required value={form.question} onChange={set('question')} style={{ ...fieldStyle, minHeight: '60px' }} /></Field>
      <Field label="Correct answer" id={`${prefix}-correct`}><input id={`${prefix}-correct`} required value={form.correct} onChange={set('correct')} style={fieldStyle} /></Field>
      {form.wrong.map((w, i) => (
        <Field key={i} label={`Wrong answer ${i + 1}`} id={`${prefix}-wrong-${i}`}>
          <input id={`${prefix}-wrong-${i}`} required value={w} onChange={(e) => setForm({ ...form, wrong: form.wrong.map((x, j) => (j === i ? e.target.value : x)) })} style={fieldStyle} />
        </Field>
      ))}
      <Field label="Explanation (shown after answering)" id={`${prefix}-explanation`}><textarea id={`${prefix}-explanation`} required value={form.explanation} onChange={set('explanation')} style={{ ...fieldStyle, minHeight: '60px' }} /></Field>
      <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <Field label="Difficulty" id={`${prefix}-difficulty`}>
          <select id={`${prefix}-difficulty`} value={form.difficulty} onChange={set('difficulty')} style={fieldStyle}>
            <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
          </select>
        </Field>
        <Field label="Licence" id={`${prefix}-licence`}><input id={`${prefix}-licence`} value={form.licence} onChange={set('licence')} title={LICENCE_HELP} style={fieldStyle} /></Field>
        <Field label="Attribution (reused material)" id={`${prefix}-attribution`}><input id={`${prefix}-attribution`} value={form.attribution} onChange={set('attribution')} style={fieldStyle} /></Field>
      </div>
      <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-subtle)' }}>{LICENCE_HELP} Calculated maths belongs in the template bank, where every answer is computed.</p>
      {error && <p role="alert" style={{ margin: 0, color: 'var(--danger)' }}>{error}</p>}
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save as draft'}</Button>
        {onCancel && <Button variant="secondary" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
};

const emptyLesson = { course_slug: '', slug: '', title: '', description: '', content: '', syllabus_topic: '', duration_minutes: '', licence: 'original', attribution: '' };

export const LessonForm = ({ initial, onSaved, onCancel }) => {
  const [form, setForm] = useState(() =>
    initial
      ? { ...emptyLesson, ...initial, course_slug: initial.course.slug, description: initial.description || '', syllabus_topic: initial.syllabus_topic || '', duration_minutes: initial.duration_minutes || '', attribution: initial.attribution || '' }
      : emptyLesson,
  );
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const prefix = initial ? `edit-lesson-${initial.id}` : 'new-lesson';

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = {
      course_slug: form.course_slug,
      slug: form.slug,
      title: form.title,
      description: form.description || null,
      content: form.content,
      syllabus_topic: form.syllabus_topic || null,
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
      licence: form.licence,
      attribution: form.attribution || null,
    };
    try {
      const response = initial ? await api.put(`/api/content/lessons/${initial.id}`, body) : await api.post('/api/content/lessons', body);
      onSaved?.(response.data.lesson);
      if (!initial) setForm(emptyLesson);
    } catch (err) {
      setError(errorText(err, 'Could not save the lesson.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} style={{ display: 'grid', gap: '10px' }}>
      <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <Field label="Course slug" id={`${prefix}-course`}><input id={`${prefix}-course`} required value={form.course_slug} onChange={set('course_slug')} style={fieldStyle} /></Field>
        <Field label="Lesson slug" id={`${prefix}-slug`}><input id={`${prefix}-slug`} required value={form.slug} disabled={!!initial} onChange={set('slug')} placeholder="e.g. jhs3-maths-ratio" style={fieldStyle} /></Field>
        <Field label="Syllabus topic id" id={`${prefix}-syllabus`}><input id={`${prefix}-syllabus`} value={form.syllabus_topic} onChange={set('syllabus_topic')} style={fieldStyle} /></Field>
        <Field label="Minutes" id={`${prefix}-minutes`}><input id={`${prefix}-minutes`} type="number" min="1" value={form.duration_minutes} onChange={set('duration_minutes')} style={fieldStyle} /></Field>
      </div>
      <Field label="Title" id={`${prefix}-title`}><input id={`${prefix}-title`} required value={form.title} onChange={set('title')} style={fieldStyle} /></Field>
      <Field label="Short description" id={`${prefix}-description`}><input id={`${prefix}-description`} value={form.description} onChange={set('description')} style={fieldStyle} /></Field>
      <Field label="Lesson (markdown): explanation, worked example, and a Try it with its answer" id={`${prefix}-content`}>
        <textarea id={`${prefix}-content`} required minLength={40} value={form.content} onChange={set('content')} style={{ ...fieldStyle, minHeight: '220px', fontFamily: 'monospace' }} />
      </Field>
      <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <Field label="Licence" id={`${prefix}-licence`}><input id={`${prefix}-licence`} value={form.licence} onChange={set('licence')} title={LICENCE_HELP} style={fieldStyle} /></Field>
        <Field label="Attribution (reused material)" id={`${prefix}-attribution`}><input id={`${prefix}-attribution`} value={form.attribution} onChange={set('attribution')} style={fieldStyle} /></Field>
      </div>
      {error && <p role="alert" style={{ margin: 0, color: 'var(--danger)' }}>{error}</p>}
      <div style={{ display: 'flex', gap: '8px' }}>
        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save as draft'}</Button>
        {onCancel && <Button variant="secondary" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
};
