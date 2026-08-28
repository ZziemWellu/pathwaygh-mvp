import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import api from '../../services/api';
import AdminExerciseEditor from './AdminExerciseEditor';

const AdminLessonEditor = () => {
  const { lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLesson();
  }, [lessonId]);

  const fetchLesson = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/admin/lessons/${lessonId}`);
      setLesson(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/api/admin/lessons/${lessonId}`, {
        course_id: lesson.course_id,
        slug: lesson.slug,
        title: lesson.title,
        description: lesson.description,
        lesson_type: lesson.lesson_type,
        order_index: lesson.order_index,
        is_free_preview: lesson.is_free_preview,
        duration_minutes: lesson.duration_minutes,
        video_url: lesson.video_url,
        video_provider: lesson.video_provider,
        content: lesson.content,
      });
      alert('Saved.');
    } catch (err) {
      alert('Failed to save lesson.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>;
  if (!lesson) return <div style={{ textAlign: 'center', padding: '40px' }}>Lesson not found.</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <Link to={`/admin/courses/${lesson.course_id}`} style={{ color: '#1a5f2b', fontSize: '14px' }}>← Back to course</Link>

      <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '18px', margin: '16px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <label style={labelStyle}>Title</label>
        <input value={lesson.title} onChange={(e) => setLesson({ ...lesson, title: e.target.value })} style={inputStyle} />

        <label style={labelStyle}>Description</label>
        <textarea value={lesson.description || ''} onChange={(e) => setLesson({ ...lesson, description: e.target.value })} style={{ ...inputStyle, minHeight: '50px' }} />

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <label style={labelStyle}>Type</label><br />
            <select value={lesson.lesson_type} onChange={(e) => setLesson({ ...lesson, lesson_type: e.target.value })} style={inputStyle}>
              <option value="video">Video</option>
              <option value="text">Text</option>
              <option value="quiz">Quiz</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Duration (minutes)</label><br />
            <input type="number" value={lesson.duration_minutes || ''} onChange={(e) => setLesson({ ...lesson, duration_minutes: e.target.value ? Number(e.target.value) : null })} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <input type="checkbox" checked={lesson.is_free_preview} onChange={(e) => setLesson({ ...lesson, is_free_preview: e.target.checked })} />
              Free preview
            </label>
          </div>
        </div>

        {lesson.lesson_type === 'video' && (
          <>
            <label style={labelStyle}>Video URL (YouTube or Vimeo)</label>
            <input
              value={lesson.video_url || ''}
              onChange={(e) => setLesson({ ...lesson, video_url: e.target.value })}
              placeholder="https://youtu.be/..."
              style={inputStyle}
            />
          </>
        )}

        {lesson.lesson_type === 'text' && (
          <>
            <label style={labelStyle}>Content (Markdown)</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <textarea
                value={lesson.content || ''}
                onChange={(e) => setLesson({ ...lesson, content: e.target.value })}
                style={{ ...inputStyle, minHeight: '300px', fontFamily: 'monospace', fontSize: '13px' }}
                placeholder="## Heading\n\nWrite lesson content in Markdown..."
              />
              <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px', overflowY: 'auto', maxHeight: '300px', background: '#fafafa' }}>
                <ReactMarkdown>{lesson.content || '*Preview will appear here*'}</ReactMarkdown>
              </div>
            </div>
          </>
        )}

        <button onClick={handleSave} disabled={saving} style={{ padding: '10px', background: saving ? '#ccc' : '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
          {saving ? 'Saving...' : 'Save Lesson'}
        </button>
      </div>

      <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '18px' }}>
        <AdminExerciseEditor lessonId={lessonId} exercises={lesson.exercises} onChange={fetchLesson} />
      </div>
    </div>
  );
};

const inputStyle = { padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', width: '100%' };
const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#666' };

export default AdminLessonEditor;
