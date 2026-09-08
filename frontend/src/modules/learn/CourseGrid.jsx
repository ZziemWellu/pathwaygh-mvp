import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const CourseGrid = ({ user }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEnrolledOnly, setShowEnrolledOnly] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, [showEnrolledOnly, user?.country]);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = showEnrolledOnly ? '/api/learn/enrolled' : '/api/learn/courses';
      const params = showEnrolledOnly ? {} : { country: user?.country };
      const response = await api.get(endpoint, { params });
      setCourses(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Learn error:', err);
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>📚 Learn</h2>
        <p>Loading courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>📚 Learn</h2>
        <p style={{ color: 'red' }}>⚠️ {error}</p>
        <button onClick={fetchCourses} style={{ padding: '8px 16px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>📚 Learn</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => setShowEnrolledOnly(!showEnrolledOnly)}
            style={{
              padding: '8px 16px',
              background: showEnrolledOnly ? '#1a5f2b' : '#f0f0f0',
              color: showEnrolledOnly ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: showEnrolledOnly ? 'bold' : 'normal',
            }}
          >
            {showEnrolledOnly ? '📚 My Courses' : '📚 All Courses'}
          </button>
          <span style={{ color: '#888', fontSize: '14px' }}>{courses.length} courses</span>
        </div>
      </div>

      {courses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
          {showEnrolledOnly ? (
            <div>
              <p>You haven't enrolled in any courses yet.</p>
              <button
                onClick={() => setShowEnrolledOnly(false)}
                style={{ marginTop: '12px', padding: '8px 20px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                Browse All Courses
              </button>
            </div>
          ) : (
            <p>No courses available yet. Check back soon!</p>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {courses.map((course) => (
            <div
              key={course.id}
              onClick={() => navigate(`/learn/${course.id}`)}
              style={{
                border: course.enrolled ? '2px solid #1a5f2b' : '1px solid #e0e0e0',
                borderRadius: '12px',
                padding: '20px',
                background: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                boxShadow: course.enrolled ? '0 2px 8px rgba(26,95,43,0.1)' : '0 2px 4px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = course.enrolled ? '0 2px 8px rgba(26,95,43,0.1)' : '0 2px 4px rgba(0,0,0,0.04)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {course.enrolled && (
                <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#1a5f2b', color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                  ✅ Enrolled
                </div>
              )}
              <h3 style={{ color: '#1a5f2b', margin: '0 0 8px 0', paddingRight: '80px' }}>{course.title}</h3>
              {course.level && (
                <span style={{ background: '#e8f5e9', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', display: 'inline-block' }}>
                  {course.level.toUpperCase()}
                </span>
              )}
              <p style={{ color: '#555', fontSize: '14px', margin: '12px 0' }}>{course.description}</p>
              <div style={{ fontSize: '12px', color: '#888' }}>📖 {course.lesson_count || 0} lessons</div>
              <div style={{ marginTop: '12px', fontSize: '12px', color: '#1a5f2b', textAlign: 'center' }}>
                {course.enrolled ? '📖 Continue Learning →' : '👆 View course'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseGrid;
