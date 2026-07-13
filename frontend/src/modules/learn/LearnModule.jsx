import React, { useState, useEffect } from 'react';
import api, { extractData } from '../../services/api';
import { getUser } from '../../constants/auth';

const LearnModule = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [enrolling, setEnrolling] = useState(false);
  const [showEnrolled, setShowEnrolled] = useState(false);
  const user = getUser();

  useEffect(() => {
    fetchCourses();
    fetchEnrolledCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/learn/courses');
      const data = extractData(response);
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Learn error:', err);
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrolledCourses = async () => {
    try {
      const response = await api.get('/api/learn/enrolled', {
        params: { user_id: user?.id || 'test_user' }
      }).catch(() => ({ data: [] }));
      const data = extractData(response);
      setEnrolledCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Enrolled courses error:', err);
    }
  };

  const enrollInCourse = async (courseId) => {
    setEnrolling(true);
    try {
      const response = await api.post('/api/learn/enroll', {
        course_id: courseId,
        user_id: user?.id || 'test_user'
      });
      
      if (response.data?.success) {
        await fetchEnrolledCourses(); // Refresh enrolled list
        setSelectedCourse(null);
        alert('✅ Successfully enrolled in the course!');
      } else {
        alert('❌ Failed to enroll. Please try again.');
      }
    } catch (err) {
      console.error('Enrollment error:', err);
      alert('❌ Failed to enroll. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  const isEnrolled = (courseId) => {
    return enrolledCourses.some(c => c.id === courseId);
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

  const displayCourses = showEnrolled ? enrolledCourses : courses;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>📚 Learn</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => setShowEnrolled(!showEnrolled)}
            style={{
              padding: '8px 16px',
              background: showEnrolled ? '#1a5f2b' : '#f0f0f0',
              color: showEnrolled ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: showEnrolled ? 'bold' : 'normal',
            }}
          >
            {showEnrolled ? '📚 My Courses' : '📚 All Courses'}
          </button>
          <span style={{ color: '#888', fontSize: '14px' }}>
            {displayCourses.length} courses
            {showEnrolled && ` • ${enrolledCourses.length} enrolled`}
          </span>
        </div>
      </div>

      {displayCourses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
          {showEnrolled ? (
            <div>
              <p>You haven't enrolled in any courses yet.</p>
              <button
                onClick={() => setShowEnrolled(false)}
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
          {displayCourses.map((course) => {
            const enrolled = isEnrolled(course.id);
            return (
              <div
                key={course.id}
                style={{
                  border: enrolled ? '2px solid #1a5f2b' : '1px solid #e0e0e0',
                  borderRadius: '12px',
                  padding: '20px',
                  background: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  boxShadow: enrolled ? '0 2px 8px rgba(26,95,43,0.1)' : '0 2px 4px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = enrolled ? '0 2px 8px rgba(26,95,43,0.1)' : '0 2px 4px rgba(0,0,0,0.04)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                onClick={() => setSelectedCourse(course)}
              >
                {enrolled && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: '#1a5f2b',
                    color: 'white',
                    padding: '2px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}>
                    ✅ Enrolled
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ color: '#1a5f2b', margin: '0 0 8px 0', paddingRight: '80px' }}>
                    {course.title}
                  </h3>
                </div>
                {course.level && (
                  <span style={{ background: '#e8f5e9', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', display: 'inline-block' }}>
                    {course.level.toUpperCase()}
                  </span>
                )}
                {course.subject && (
                  <span style={{ background: '#f0f0f0', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', display: 'inline-block', marginLeft: '6px' }}>
                    {course.subject}
                  </span>
                )}
                <p style={{ color: '#555', fontSize: '14px', margin: '12px 0' }}>
                  {course.description}
                </p>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  📖 {course.modules?.length || 0} modules • {course.lesson_count || 0} lessons
                </div>
                {enrolled && course.progress !== undefined && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888' }}>
                      <span>Progress</span>
                      <span>{course.progress || 0}%</span>
                    </div>
                    <div style={{ height: '4px', background: '#f0f0f0', borderRadius: '2px', marginTop: '4px' }}>
                      <div style={{
                        width: `${course.progress || 0}%`,
                        height: '100%',
                        background: '#1a5f2b',
                        borderRadius: '2px',
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                  </div>
                )}
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#1a5f2b', textAlign: 'center' }}>
                  {enrolled ? '📖 Continue Learning →' : '👆 Click to enroll'}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Course Detail Modal with Enrollment */}
      {selectedCourse && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setSelectedCourse(null)}
        >
          <div
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '16px',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{ float: 'right', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#888' }}
              onClick={() => setSelectedCourse(null)}
            >
              ✕
            </button>
            <h2 style={{ color: '#1a5f2b' }}>{selectedCourse.title}</h2>
            {selectedCourse.level && (
              <span style={{ background: '#e8f5e9', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', display: 'inline-block' }}>
                {selectedCourse.level.toUpperCase()}
              </span>
            )}
            {selectedCourse.subject && (
              <span style={{ background: '#f0f0f0', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', display: 'inline-block', marginLeft: '6px' }}>
                {selectedCourse.subject}
              </span>
            )}
            <p style={{ color: '#555', margin: '16px 0' }}>{selectedCourse.description}</p>

            {selectedCourse.modules?.length > 0 && (
              <div>
                <h4>📖 Modules</h4>
                {selectedCourse.modules.map((module, i) => (
                  <div key={i} style={{ border: '1px solid #e0e0e0', borderRadius: '8px', padding: '12px', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 'bold' }}>{module.title}</div>
                    <div style={{ fontSize: '13px', color: '#666' }}>{module.description}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>{module.lessons?.length || 0} lessons</div>
                  </div>
                ))}
              </div>
            )}

            {isEnrolled(selectedCourse.id) ? (
              <div style={{ marginTop: '20px' }}>
                <div style={{
                  padding: '12px',
                  background: '#e8f5e9',
                  borderRadius: '8px',
                  textAlign: 'center',
                  color: '#1a5f2b',
                  fontWeight: 'bold',
                }}>
                  ✅ You are enrolled in this course
                </div>
                <button
                  onClick={() => setSelectedCourse(null)}
                  style={{
                    marginTop: '12px',
                    padding: '10px 20px',
                    background: '#1a5f2b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    width: '100%',
                    fontWeight: 'bold',
                  }}
                >
                  📖 Continue Learning
                </button>
              </div>
            ) : (
              <button
                onClick={() => enrollInCourse(selectedCourse.id)}
                disabled={enrolling}
                style={{
                  marginTop: '20px',
                  padding: '12px 20px',
                  background: enrolling ? '#ccc' : '#1a5f2b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: enrolling ? 'not-allowed' : 'pointer',
                  width: '100%',
                  fontWeight: 'bold',
                  fontSize: '16px',
                }}
              >
                {enrolling ? '⏳ Enrolling...' : '📚 Enroll in Course'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LearnModule;
