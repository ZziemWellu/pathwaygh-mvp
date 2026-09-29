import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

const LESSON_ICON = { video: '🎬', quiz: '📝', text: '📖' };

const CourseDetail = () => {
  const { t } = useLanguage();
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  useEffect(() => {
    // Idempotent retroactive safety-net: covers a course that was already
    // 100% complete before this feature existed, or any edge case where the
    // auto-issue trigger on the lesson-progress endpoint didn't fire.
    if (!course || course.lessons.length === 0) return;
    const watched = course.lessons.filter((l) => l.watched).length;
    if (watched === course.lessons.length) {
      api.post(`/api/certificates/check/${courseId}`).catch(() => {});
    }
  }, [course, courseId]);

  const fetchCourse = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/learn/courses/${courseId}`);
      setCourse(response.data);
    } catch (err) {
      console.error('Course detail error:', err);
      setError(err.response?.status === 404 ? t('learnCourseNotFound') : t('learnFailedToLoadCourse'));
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await api.post(`/api/learn/courses/${courseId}/enroll`);
      await fetchCourse();
    } catch (err) {
      console.error('Enrollment error:', err);
      alert(t('learnFailedToEnroll'));
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>{t('learnLoadingCourse')}</div>;
  if (error || !course) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'red' }}>⚠️ {error || t('learnCourseNotFound')}</p>
        <Link to="/learn">{t('learnBackToLearn')}</Link>
      </div>
    );
  }

  const watchedCount = course.lessons.filter((l) => l.watched).length;
  const progressPct = course.lessons.length ? Math.round((watchedCount / course.lessons.length) * 100) : 0;
  const isComplete = course.lessons.length > 0 && watchedCount === course.lessons.length;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <Link to="/learn" style={{ color: '#1a5f2b', fontSize: '14px' }}>{t('learnAllCoursesLink')}</Link>

      <h2 style={{ color: '#1a5f2b', margin: '12px 0 4px 0' }}>{course.title}</h2>
      {course.level && (
        <span style={{ background: '#e8f5e9', padding: '2px 10px', borderRadius: '12px', fontSize: '12px' }}>
          {course.level.toUpperCase()}
        </span>
      )}
      <p style={{ color: '#555', margin: '16px 0' }}>{course.description}</p>

      {course.enrolled ? (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666', marginBottom: '4px' }}>
            <span>{t('learnYourProgress')}</span>
            <span>{t('learnProgressSummary').replace('{watched}', watchedCount).replace('{total}', course.lessons.length).replace('{pct}', progressPct)}</span>
          </div>
          <div style={{ height: '6px', background: '#f0f0f0', borderRadius: '3px' }}>
            <div style={{ width: `${progressPct}%`, height: '100%', background: '#1a5f2b', borderRadius: '3px', transition: 'width 0.4s ease' }} />
          </div>
          {isComplete && (
            <Link
              to={`/certificates/${courseId}`}
              style={{ display: 'inline-block', marginTop: '10px', color: '#1a5f2b', fontWeight: 'bold', textDecoration: 'underline' }}
            >
              {t('learnViewCertificate')}
            </Link>
          )}
        </div>
      ) : (
        <button
          onClick={handleEnroll}
          disabled={enrolling}
          style={{ padding: '12px 24px', background: enrolling ? '#ccc' : '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: enrolling ? 'not-allowed' : 'pointer', fontWeight: 'bold', marginBottom: '20px' }}
        >
          {enrolling ? t('learnEnrolling') : t('learnEnrollInCourse')}
        </button>
      )}

      <h3 style={{ color: '#333' }}>{t('learnCurriculum')}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {course.lessons.map((lesson) => {
          const locked = !course.enrolled && !lesson.is_free_preview;
          return (
            <div
              key={lesson.id}
              onClick={() => !locked && navigate(`/learn/${courseId}/lessons/${lesson.id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                background: locked ? '#fafafa' : 'white',
                cursor: locked ? 'not-allowed' : 'pointer',
                opacity: locked ? 0.6 : 1,
              }}
            >
              <span style={{ fontSize: '20px' }}>{lesson.watched ? '✅' : LESSON_ICON[lesson.lesson_type] || '📄'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{lesson.title}</div>
                <div style={{ fontSize: '12px', color: '#666666' }}>
                  {lesson.duration_minutes ? t('learnMinutes').replace('{count}', lesson.duration_minutes) : ''}
                  {lesson.is_free_preview && ` ${t('learnFreePreview')}`}
                </div>
              </div>
              {locked && <span style={{ fontSize: '18px' }}>🔒</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CourseDetail;
