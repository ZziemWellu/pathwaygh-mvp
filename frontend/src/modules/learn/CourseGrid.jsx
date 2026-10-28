import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { BookOpen, BookOpenText, Calculator, CircleCheck, FlaskConical, Languages, TriangleAlertIcon } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import './Learn.css';

// [id, label]: undefined label = t('learnAllCourses'), null = t('learnMyCourses').
const FILTERS = [['all', undefined], ['jhs', 'JHS'], ['shs', 'SHS'], ['mine', null]];

// Cover art per subject, from the course title (courses carry no subject field).
const coverTheme = (title = '') => {
  const tt = title.toLowerCase();
  if (tt.includes('math')) return { Icon: Calculator, tone: 'primary', label: 'Mathematics' };
  if (tt.includes('english') || tt.includes('literature')) return { Icon: Languages, tone: 'info', label: 'English Language' };
  if (tt.includes('biology') || tt.includes('science') || tt.includes('chemistry') || tt.includes('physics')) {
    return { Icon: FlaskConical, tone: 'earth', label: tt.includes('biology') ? 'Biology' : 'Science' };
  }
  return { Icon: BookOpenText, tone: 'primary', label: 'Course' };
};

const formatMinutes = (m) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`);

const CourseGrid = ({ user }) => {
  const { t } = useLanguage();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // 'all' | 'jhs' | 'shs' | 'mine'; levels filter client-side, 'mine' uses /enrolled.
  const [filter, setFilter] = useState('all');
  const showEnrolledOnly = filter === 'mine';
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

  const visible = filter === 'jhs' || filter === 'shs' ? courses.filter((c) => c.level === filter) : courses;

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
        actions={<span style={{ color: 'var(--text-subtle)', fontSize: '14px' }}>{t('learnCoursesCount').replace('{count}', visible.length)}</span>}
      />

      <div role="group" aria-label="Filter courses" className="learn-filters">
        {FILTERS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={filter === id}
            className={`learn-chip${filter === id ? ' is-active' : ''}`}
            onClick={() => setFilter(id)}
          >
            {label === null ? t('learnMyCourses') : label === undefined ? t('learnAllCourses') : label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-subtle)' }}>
          {filter === 'mine' ? (
            <div>
              <p>{t('learnNoEnrolledCourses')}</p>
              <Button size="sm" onClick={() => setFilter('all')} style={{ marginTop: '12px' }}>
                {t('learnBrowseAllCourses')}
              </Button>
            </div>
          ) : (
            <p>{t('learnNoCoursesAvailable')}</p>
          )}
        </div>
      ) : (
        <ul className="learn-grid">
          {visible.map((course) => {
            const theme = coverTheme(course.title);
            const started = course.lessons_completed > 0;
            const freeFirst = !course.enrolled && course.lessons_completed === 0 && course.next_lesson?.is_free_preview;
            const meta = [
              t('learnLessonsCount').replace('{count}', course.lesson_count || 0),
              course.duration_minutes && formatMinutes(course.duration_minutes),
              freeFirst && 'first lesson free',
            ].filter(Boolean).join(' · ');
            const resume = course.enrolled && course.next_lesson;
            return (
              <li key={course.id} className="card card--flush learn-card">
                <div className={`learn-cover learn-cover--${theme.tone}`}>
                  <span className="learn-cover__icon"><theme.Icon size={30} strokeWidth={1.8} aria-hidden="true" /></span>
                  <span className="learn-cover__subject">{theme.label}</span>
                  {course.level && <span className="learn-cover__level">{course.level.toUpperCase()}</span>}
                </div>
                <div className="learn-card__body">
                  <h2 className="learn-card__title"><Link to={`/learn/${course.id}`}>{course.title}</Link></h2>
                  {course.description && <p className="learn-card__desc">{course.description}</p>}
                  <p className="learn-card__meta">{meta}</p>
                  {course.enrolled && (
                    <p className="learn-card__enrolled"><CircleCheck size={14} aria-hidden="true" /> {t('learnEnrolledBadge')}</p>
                  )}
                  <div className="learn-card__foot">
                    <div
                      className="learn-card__track"
                      role="progressbar"
                      aria-label={`${course.title} progress`}
                      aria-valuenow={course.progress || 0}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div style={{ width: `${course.progress || 0}%` }} />
                    </div>
                    <span className="learn-card__status">
                      {started ? `${course.lessons_completed}/${course.lesson_count}` : 'Not started'}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => navigate(resume ? `/learn/${course.id}/lessons/${course.next_lesson.id}` : `/learn/${course.id}`)}
                    >
                      {resume ? 'Continue' : t('learnViewCourse')}
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default CourseGrid;
