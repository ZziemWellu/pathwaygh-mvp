import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001'
});

function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    setLoading(true);
    try {
      const courseRes = await API.get(`/api/learn/courses/${courseId}`);
      setCourse(courseRes.data);
      
      const lessonsRes = await API.get(`/api/learn/courses/${courseId}/lessons`);
      setLessons(lessonsRes.data);
    } catch (error) {
      console.error('Error fetching course:', error);
      setCourse(null);
      setLessons([]);
    } finally {
      setLoading(false);
    }
  };

  const getLessonTypeIcon = (type) => {
    const icons = {
      video: '🎥',
      text: '📄',
      quiz: '📝',
      interactive: '🎯'
    };
    return icons[type] || '📚';
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading course...</div>;
  }

  if (!course) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h3>Course not found</h3>
        <button
          onClick={() => navigate('/learn')}
          style={{
            padding: '8px 16px',
            marginTop: '10px',
            background: '#1a5f2b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Back to Courses
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <button
        onClick={() => navigate('/learn')}
        style={{
          padding: '8px 16px',
          background: 'none',
          border: '1px solid #ccc',
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        ← Back to Courses
      </button>

      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#1a5f2b', marginBottom: '10px' }}>{course.title}</h1>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '15px' }}>
          <span style={{ padding: '4px 12px', background: '#e8f5e9', borderRadius: '16px', fontSize: '13px' }}>
            {course.level?.toUpperCase() || 'N/A'}
          </span>
          <span style={{ padding: '4px 12px', background: '#e3f2fd', borderRadius: '16px', fontSize: '13px' }}>
            {course.subject || 'General'}
          </span>
          <span style={{ padding: '4px 12px', background: '#fff3e0', borderRadius: '16px', fontSize: '13px' }}>
            {course.difficulty_level || 'Beginner'}
          </span>
          <span style={{ padding: '4px 12px', background: '#f5f5f5', borderRadius: '16px', fontSize: '13px' }}>
            ⏱️ {course.duration_hours || 0}h
          </span>
          <span style={{ padding: '4px 12px', background: '#f5f5f5', borderRadius: '16px', fontSize: '13px' }}>
            📖 {lessons.length} lessons
          </span>
        </div>
        <p style={{ fontSize: '16px', color: '#555', lineHeight: '1.6' }}>{course.description}</p>
      </div>

      <h3 style={{ color: '#333', marginBottom: '15px' }}>📚 Lessons</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {lessons.map((lesson, index) => (
          <div
            key={lesson.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '15px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              background: 'white',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
          >
            <div style={{ fontSize: '20px', marginRight: '15px' }}>
              {getLessonTypeIcon(lesson.lesson_type)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 'bold' }}>{index + 1}.</span>
                <span style={{ fontWeight: 'bold' }}>{lesson.title}</span>
                {lesson.is_free_preview && (
                  <span style={{ fontSize: '11px', padding: '2px 8px', background: '#4caf50', color: 'white', borderRadius: '12px' }}>
                    Free Preview
                  </span>
                )}
              </div>
              <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                {lesson.description}
              </div>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                {lesson.duration_minutes || 0} min • {lesson.lesson_type || 'Lesson'}
              </div>
            </div>
            <div style={{ fontSize: '24px', color: '#bbb' }}>▶</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CourseDetail;
