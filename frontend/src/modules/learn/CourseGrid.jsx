import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { BookOpen, BookOpenTextIcon, CircleCheckIcon, TriangleAlertIcon } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';

const CourseGrid = ({ user }) => {
  const { t } = useLanguage();
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
      setError(err.message || t('learnFailedToLoadCourses'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <PageHeader icon={BookOpen} title={t('learnHeading')} />
        <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>{t('learnLoadingCourses')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <PageHeader icon={BookOpen} title={t('learnHeading')} />
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p style={{ color: 'var(--danger)' }}><TriangleAlertIcon className="icon-inline" size="1em" aria-hidden="true" /> {error}</p>
          <Button onClick={fetchCourses}>{t('retry')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <PageHeader
        icon={BookOpen}
        title={t('learnHeading')}
        actions={
          <>
            <Button
              variant={showEnrolledOnly ? 'primary' : 'secondary'}
              size="sm"
              icon={BookOpen}
              aria-pressed={showEnrolledOnly}
              onClick={() => setShowEnrolledOnly(!showEnrolledOnly)}
            >
              {showEnrolledOnly ? t('learnMyCourses') : t('learnAllCourses')}
            </Button>
            <span style={{ color: 'var(--text-subtle)', fontSize: '14px' }}>{t('learnCoursesCount').replace('{count}', courses.length)}</span>
          </>
        }
      />

      {courses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray-500)' }}>
          {showEnrolledOnly ? (
            <div>
              <p>{t('learnNoEnrolledCourses')}</p>
              <Button size="sm" onClick={() => setShowEnrolledOnly(false)} style={{ marginTop: '12px' }}>
                {t('learnBrowseAllCourses')}
              </Button>
            </div>
          ) : (
            <p>{t('learnNoCoursesAvailable')}</p>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {courses.map((course) => (
            <div
              key={course.id}
              onClick={() => navigate(`/learn/${course.id}`)}
              style={{
                border: course.enrolled ? '2px solid var(--primary)' : '1px solid var(--border)',
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
                <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'var(--primary)', color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                  <CircleCheckIcon className="icon-inline" size="1em" aria-hidden="true" /> {t('learnEnrolledBadge')}
                </div>
              )}
              <h3 style={{ color: 'var(--primary)', margin: '0 0 8px 0', paddingRight: '80px' }}>{course.title}</h3>
              {course.level && (
                <span style={{ background: 'var(--primary-bg)', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', display: 'inline-block' }}>
                  {course.level.toUpperCase()}
                </span>
              )}
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '12px 0' }}>{course.description}</p>
              <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}><BookOpenTextIcon className="icon-inline" size="1em" aria-hidden="true" /> {t('learnLessonsCount').replace('{count}', course.lesson_count || 0)}</div>
              <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--primary)', textAlign: 'center' }}>
                {course.enrolled ? t('learnContinueLearning') : t('learnViewCourse')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseGrid;
