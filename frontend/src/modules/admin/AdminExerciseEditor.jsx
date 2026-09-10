import React, { useState } from 'react';
import { Trash2, Plus, X, ArrowUp, ArrowDown } from 'lucide-react';
import api from '../../services/api';

const emptyExercise = () => ({ question: '', options: ['', '', '', ''], correct_index: 0, explanation: '' });

const ExerciseForm = ({ initial, onSave, onCancel }) => {
  const [form, setForm] = useState(initial || emptyExercise());
  const [saving, setSaving] = useState(false);

  const setOption = (i, value) => {
    const options = [...form.options];
    options[i] = value;
    setForm({ ...form, options });
  };

  const addOption = () => setForm({ ...form, options: [...form.options, ''] });
  const removeOption = (i) => {
    const options = form.options.filter((_, idx) => idx !== i);
    const correct_index = form.correct_index >= options.length ? 0 : form.correct_index;
    setForm({ ...form, options, correct_index });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.options.some((o) => !o.trim())) {
      alert('All options must have text.');
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: '#f8f9fa', border: '1px solid #e0e0e0', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <textarea required placeholder="Question" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} style={{ ...inputStyle, minHeight: '50px' }} />
      <label style={labelStyle}>Options (select the correct one)</label>
      {form.options.map((option, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="radio"
            name="correct_index"
            checked={form.correct_index === i}
            onChange={() => setForm({ ...form, correct_index: i })}
          />
          <input required value={option} onChange={(e) => setOption(i, e.target.value)} style={{ ...inputStyle, flex: 1 }} placeholder={`Option ${i + 1}`} />
          {form.options.length > 2 && (
            <button type="button" onClick={() => removeOption(i)} style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer' }}>
              <X size={16} />
            </button>
          )}
        </div>
      ))}
      <button type="button" onClick={addOption} style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', color: '#1a5f2b', cursor: 'pointer', fontSize: '13px', padding: '4px 0' }}>
        <Plus size={14} /> Add option
      </button>
      <textarea placeholder="Explanation (shown after grading)" value={form.explanation || ''} onChange={(e) => setForm({ ...form, explanation: e.target.value })} style={{ ...inputStyle, minHeight: '50px' }} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <button type="submit" disabled={saving} style={{ padding: '8px 16px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>
          {saving ? 'Saving...' : 'Save Exercise'}
        </button>
        <button type="button" onClick={onCancel} style={{ padding: '8px 16px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
          Cancel
        </button>
      </div>
    </form>
  );
};

const AdminExerciseEditor = ({ lessonId, exercises, onChange }) => {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const handleCreate = async (form) => {
    await api.post('/api/admin/exercises', { lesson_id: Number(lessonId), order_index: exercises.length, ...form });
    setAdding(false);
    onChange();
  };

  const handleUpdate = async (exercise, form) => {
    await api.put(`/api/admin/exercises/${exercise.id}`, { lesson_id: Number(lessonId), order_index: exercise.order_index, ...form });
    setEditingId(null);
    onChange();
  };

  const handleDelete = async (exercise) => {
    if (!confirm('Delete this exercise?')) return;
    await api.delete(`/api/admin/exercises/${exercise.id}`);
    onChange();
  };

  const handleMove = async (index, direction) => {
    const newOrder = [...exercises];
    const target = index + direction;
    if (target < 0 || target >= newOrder.length) return;
    [newOrder[index], newOrder[target]] = [newOrder[target], newOrder[index]];
    await api.post(`/api/admin/lessons/${lessonId}/exercises/reorder`, { exercise_ids: newOrder.map((e) => e.id) });
    onChange();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h4 style={{ margin: 0 }}>Exercises</h4>
        <button
          onClick={() => setAdding((s) => !s)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
        >
          <Plus size={14} /> Add Exercise
        </button>
      </div>

      {adding && <div style={{ marginBottom: '10px' }}><ExerciseForm onSave={handleCreate} onCancel={() => setAdding(false)} /></div>}

      {exercises.map((exercise, i) =>
        editingId === exercise.id ? (
          <div key={exercise.id} style={{ marginBottom: '10px' }}>
            <ExerciseForm initial={exercise} onSave={(form) => handleUpdate(exercise, form)} onCancel={() => setEditingId(null)} />
          </div>
        ) : (
          <div key={exercise.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <button onClick={() => handleMove(i, -1)} disabled={i === 0} style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? 0.3 : 1 }}><ArrowUp size={14} /></button>
              <button onClick={() => handleMove(i, 1)} disabled={i === exercises.length - 1} style={{ background: 'none', border: 'none', cursor: i === exercises.length - 1 ? 'default' : 'pointer', opacity: i === exercises.length - 1 ? 0.3 : 1 }}><ArrowDown size={14} /></button>
            </div>
            <div style={{ flex: 1 }} onClick={() => setEditingId(exercise.id)}>
              <div style={{ fontWeight: 600, cursor: 'pointer' }}>{i + 1}. {exercise.question}</div>
              <div style={{ fontSize: '12px', color: '#666666' }}>Correct: {exercise.options[exercise.correct_index]}</div>
            </div>
            <button onClick={() => handleDelete(exercise)} style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer' }}><Trash2 size={16} /></button>
          </div>
        )
      )}
    </div>
  );
};

const inputStyle = { padding: '9px 11px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', fontFamily: 'inherit' };
const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#666' };

export default AdminExerciseEditor;
