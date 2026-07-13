import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import LessonPlayer from './LessonPlayer';

const LearnModule = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [allLessons, setAllLessons] = useState([]);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/learn/courses');
      const data = response.data;
      let courseData = [];
      if (Array.isArray(data)) courseData = data;
      else if (data.courses) courseData = data.courses;
      else if (data.data) courseData = data.data;
      setCourses(courseData);
    } catch (err) {
      console.error('Learn error:', err);
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const openCourse = (course) => {
    setSelectedCourse(course);
    setSelectedLesson(null);
    setSelectedModule(null);
    // Build flat list of all lessons
    const lessons = [];
    course.modules?.forEach(module => {
      module.lessons?.forEach(lesson => {
        lessons.push({ ...lesson, moduleTitle: module.title });
      });
    });
    setAllLessons(lessons);
    setCurrentLessonIndex(0);
  };

  const closeCourse = () => {
    setSelectedCourse(null);
    setSelectedLesson(null);
    setSelectedModule(null);
    setAllLessons([]);
    setCurrentLessonIndex(0);
  };

  const openLesson = (course, moduleData, lesson, index) => {
    setSelectedCourse(course);
    setSelectedModule(moduleData);
    setSelectedLesson(lesson);
    setCurrentLessonIndex(index || 0);
  };

  const closeLesson = () => {
    setSelectedLesson(null);
    setSelectedModule(null);
  };

  const handleNextLesson = () => {
    if (currentLessonIndex < allLessons.length - 1) {
      const nextIndex = currentLessonIndex + 1;
      const nextLesson = allLessons[nextIndex];
      setCurrentLessonIndex(nextIndex);
      setSelectedLesson(nextLesson);
      // Find which module this lesson belongs to
      const module = selectedCourse.modules?.find(m =>
        m.lessons?.some(l => l.id === nextLesson.id)
      );
      setSelectedModule(module);
    }
  };

  const handlePreviousLesson = () => {
    if (currentLessonIndex > 0) {
      const prevIndex = currentLessonIndex - 1;
      const prevLesson = allLessons[prevIndex];
      setCurrentLessonIndex(prevIndex);
      setSelectedLesson(prevLesson);
      const module = selectedCourse.modules?.find(m =>
        m.lessons?.some(l => l.id === prevLesson.id)
      );
      setSelectedModule(module);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <h2>📚 Learn</h2>
        <p>Loading courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <h2>📚 Learn</h2>
        <p style={{ color: 'red' }}>⚠️ {error}</p>
        <button onClick={fetchCourses}>Retry</button>
      </div>
    );
  }

  // ============================================================
  // LESSON PLAYER VIEW
  // ============================================================
  if (selectedLesson && selectedCourse) {
    return (
      <LessonPlayer
        lesson={selectedLesson}
        moduleData={selectedModule}
        course={selectedCourse}
        onClose={closeLesson}
        onComplete={() => console.log('Lesson completed!')}
        onNext={handleNextLesson}
        onPrevious={handlePreviousLesson}
        totalLessons={allLessons.length}
        currentIndex={currentLessonIndex}
      />
    );
  }

  // ============================================================
  // COURSE DETAIL VIEW
  // ============================================================
  if (selectedCourse) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <button
          onClick={closeCourse}
          style={{
            padding: '8px 16px',
            background: 'none',
            border: 'none',
            color: '#1a5f2b',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '16px',
          }}
        >
          ← Back to Courses
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ color: '#1a5f2b', margin: '0 0 8px 0' }}>{selectedCourse.title}</h2>
            <p style={{ color: '#666', margin: 0 }}>{selectedCourse.description}</p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
              {selectedCourse.level && (
                <span style={{ padding: '4px 12px', background: '#e8f5e9', borderRadius: '12px', fontSize: '12px', color: '#1a5f2b' }}>
                  {selectedCourse.level.toUpperCase()}
                </span>
              )}
              {selectedCourse.subject && (
                <span style={{ padding: '4px 12px', background: '#f0f0f0', borderRadius: '12px', fontSize: '12px', color: '#666' }}>
                  {selectedCourse.subject}
                </span>
              )}
              <span style={{ padding: '4px 12px', background: '#f0f0f0', borderRadius: '12px', fontSize: '12px', color: '#666' }}>
                📖 {allLessons.length} lessons
              </span>
            </div>
          </div>
        </div>

        <div>
          <h3 style={{ color: '#333', marginBottom: '16px' }}>📚 Modules</h3>
          {selectedCourse.modules?.map((module, index) => {
            // Find the starting index for lessons in this module
            let startIndex = 0;
            for (let i = 0; i < index; i++) {
              startIndex += selectedCourse.modules[i]?.lessons?.length || 0;
            }
            return (
              <div
                key={index}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '16px 20px',
                    background: '#f8f9fa',
                    borderBottom: '1px solid #e0e0e0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0, color: '#1a5f2b' }}>{module.title}</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#888' }}>{module.description}</p>
                  </div>
                  <span style={{ fontSize: '12px', color: '#888' }}>
                    {module.lessons?.length || 0} lessons
                  </span>
                </div>

                <div style={{ padding: '8px 0' }}>
                  {module.lessons?.map((lesson, i) => (
                    <div
                      key={i}
                      onClick={() => openLesson(selectedCourse, module, lesson, startIndex + i)}
                      style={{
                        padding: '12px 20px',
                        cursor: 'pointer',
                        borderBottom: i < module.lessons.length - 1 ? '1px solid #f0f0f0' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background 0.2s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <div>
                        <div style={{ fontWeight: '500', color: '#333' }}>
                          {i + 1}. {lesson.title}
                        </div>
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                          {lesson.lesson_type || 'Lesson'} • {lesson.duration_minutes || 'N/A'} min
                        </div>
                      </div>
                      <span style={{ fontSize: '20px', color: '#1a5f2b' }}>▶</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={closeCourse}
          style={{
            padding: '10px 20px',
            background: '#1a5f2b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            width: '100%',
            marginTop: '10px',
          }}
        >
          Close
        </button>
      </div>
    );
  }

  // ============================================================
  // COURSE LIST VIEW
  // ============================================================
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#1a5f2b', margin: 0 }}>📚 Learn</h2>
        <span style={{ color: '#888' }}>{courses.length} courses available</span>
      </div>

      {courses.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '40px', color: '#888' }}>No courses available yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {courses.map((course) => (
            <div
              key={course.id}
              onClick={() => openCourse(course)}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                padding: '20px',
                background: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ color: '#1a5f2b', margin: '0 0 8px 0', fontSize: '18px' }}>{course.title}</h3>
                {course.level && (
                  <span style={{ background: '#e8f5e9', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', color: '#1a5f2b' }}>
                    {course.level.toUpperCase()}
                  </span>
                )}
              </div>
              {course.subject && (
                <span style={{ background: '#f0f0f0', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', color: '#666', display: 'inline-block' }}>
                  {course.subject}
                </span>
              )}
              <p style={{ color: '#555', fontSize: '14px', margin: '12px 0' }}>{course.description}</p>
              <div style={{ fontSize: '12px', color: '#888' }}>
                📖 {course.modules?.length || 0} modules • {course.lesson_count || 0} lessons
              </div>
              <div style={{ marginTop: '12px', padding: '6px 12px', background: '#f5f5f5', borderRadius: '8px', fontSize: '12px', color: '#1a5f2b', textAlign: 'center' }}>
                Click to view →
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LearnModule;
