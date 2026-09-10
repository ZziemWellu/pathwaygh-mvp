import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plus, Trash2, ChevronRight } from 'lucide-react';
import api from '../../services/api';

const emptyLessonForm = { title: '', slug: '', lesson_type: 'video' };

const AdminCourseEditor = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonForm, setLessonForm] = useState(emptyLessonForm);

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/admin/courses/${courseId}`);
      setCourse(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/api/admin/courses/${courseId}`, {
        slug: course.slug,
        title: course.title,
        description: course.description,
        level: course.level,
        country: course.country,
      });
      alert('Saved.');
    } catch (err) {
      alert('Failed to save course.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/admin/lessons', { course_id: Number(courseId), order_index: course.lessons.length, ...lessonForm });
      setLessonForm(emptyLessonForm);
      setShowLessonForm(false);
      await fetchCourse();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create lesson.');
    }
  };

  const handleDeleteLesson = async (lesson) => {
    if (!confirm(`Delete lesson "${lesson.title}"?`)) return;
    try {
      await api.delete(`/api/admin/lessons/${lesson.id}`);
      await fetchCourse();
    } catch (err) {
      alert('Failed to delete lesson.');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>;
  if (!course) return <div style={{ textAlign: 'center', padding: '40px' }}>Course not found.</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <Link to="/admin" style={{ color: '#1a5f2b', fontSize: '14px' }}>← All courses</Link>

      <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '18px', margin: '16px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <label htmlFor="course-title" style={labelStyle}>Title</label>
        <input id="course-title" value={course.title} onChange={(e) => setCourse({ ...course, title: e.target.value })} style={inputStyle} />
        <label htmlFor="course-description" style={labelStyle}>Description</label>
        <textarea id="course-description" value={course.description || ''} onChange={(e) => setCourse({ ...course, description: e.target.value })} style={{ ...inputStyle, minHeight: '70px' }} />
        <label htmlFor="course-level" style={labelStyle}>Level</label>
        <select id="course-level" value={course.level} onChange={(e) => setCourse({ ...course, level: e.target.value })} style={inputStyle}>
          <option value="jhs">JHS</option>
          <option value="shs">SHS</option>
          <option value="skills">Skills</option>
          <option value="tvet">TVET</option>
        </select>
        <label htmlFor="course-country" style={labelStyle}>Country</label>
        <select id="course-country" value={course.country} onChange={(e) => setCourse({ ...course, country: e.target.value })} style={inputStyle}>
          <option value="GH">Ghana</option>
          <option value="NG">Nigeria</option>
        </select>
        <button onClick={handleSave} disabled={saving} style={{ padding: '10px', background: saving ? '#ccc' : '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
          {saving ? 'Saving...' : 'Save Course'}
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0 }}>Lessons</h3>
        <button
          onClick={() => setShowLessonForm((s) => !s)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
        >
          <Plus size={14} /> New Lesson
        </button>
      </div>

      {showLessonForm && (
        <form onSubmit={handleCreateLesson} style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input required placeholder="Title" value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} style={inputStyle} />
          <input required placeholder="Slug (unique id, e.g. shs_physics_intro)" value={lessonForm.slug} onChange={(e) => setLessonForm({ ...lessonForm, slug: e.target.value })} style={inputStyle} />
          <select value={lessonForm.lesson_type} onChange={(e) => setLessonForm({ ...lessonForm, lesson_type: e.target.value })} style={inputStyle}>
            <option value="video">Video</option>
            <option value="text">Text</option>
            <option value="quiz">Quiz</option>
          </select>
          <button type="submit" style={{ padding: '10px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            Create Lesson
          </button>
        </form>
      )}

      {course.lessons.map((lesson) => (
        <div
          key={lesson.id}
          onClick={() => navigate(`/admin/lessons/${lesson.id}`)}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '10px', marginBottom: '8px', cursor: 'pointer' }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold' }}>{lesson.title}</div>
            <div style={{ fontSize: '12px', color: '#666666' }}>{lesson.lesson_type} · {lesson.exercise_count} exercises</div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); handleDeleteLesson(lesson); }} style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', padding: '6px' }}>
            <Trash2 size={16} />
          </button>
          <ChevronRight size={18} color="#666666" />
        </div>
      ))}
    </div>
  );
};

const inputStyle = { padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit' };
const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#666' };

export default AdminCourseEditor;
