import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ChevronRight } from 'lucide-react';
import api from '../../services/api';

const emptyForm = { slug: '', title: '', description: '', level: 'jhs', country: 'GH' };

const AdminCourseList = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/courses');
      setCourses(response.data);
    } catch (err) {
      setError(err.response?.status === 403 ? 'Admin access required.' : 'Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/admin/courses', form);
      setForm(emptyForm);
      setShowForm(false);
      await fetchCourses();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create course.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (course) => {
    if (!confirm(`Delete "${course.title}" and all its lessons/exercises? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/admin/courses/${course.id}`);
      await fetchCourses();
    } catch (err) {
      alert('Failed to delete course.');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>;
  if (error) return <div style={{ textAlign: 'center', padding: '40px', color: '#c62828' }}>{error}</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Manage Courses</h2>
        <button
          onClick={() => setShowForm((s) => !s)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          <Plus size={16} /> New Course
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '18px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input required placeholder="Slug (e.g. shs-physics)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} style={inputStyle} />
          <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inputStyle} />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, minHeight: '70px' }} />
          <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} style={inputStyle}>
            <option value="jhs">JHS</option>
            <option value="shs">SHS</option>
            <option value="skills">Skills</option>
            <option value="tvet">TVET</option>
          </select>
          <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} style={inputStyle}>
            <option value="GH">Ghana</option>
            <option value="NG">Nigeria</option>
          </select>
          <button type="submit" disabled={saving} style={{ padding: '10px', background: saving ? '#ccc' : '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
            {saving ? 'Creating...' : 'Create Course'}
          </button>
        </form>
      )}

      {courses.map((course) => (
        <div
          key={course.id}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '10px', marginBottom: '8px', cursor: 'pointer' }}
          onClick={() => navigate(`/admin/courses/${course.id}`)}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold' }}>{course.title}</div>
            <div style={{ fontSize: '12px', color: '#888' }}>{course.slug} · {course.level?.toUpperCase()} · {course.country} · {course.lesson_count} lessons</div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(course); }}
            style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', padding: '6px' }}
          >
            <Trash2 size={16} />
          </button>
          <ChevronRight size={18} color="#888" />
        </div>
      ))}
    </div>
  );
};

const inputStyle = { padding: '10px 12px', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit' };

export default AdminCourseList;
