import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import ReactMarkdown from 'react-markdown';
import api from '../../services/api';
import ExerciseSection from './ExerciseSection';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGamificationNotify } from '../../contexts/GamificationNotifyContext';
import { CircleCheckIcon, CirclePlayIcon, FileTextIcon, PartyPopperIcon, TriangleAlertIcon } from 'lucide-react';

const LessonView = () => {
  const { t } = useLanguage();
  const { notify } = useGamificationNotify();
  const { courseId, lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [marking, setMarking] = useState(false);
  const [justCompleted, setJustCompleted] = useState(null);

  useEffect(() => {
    fetchLesson();
  }, [lessonId]);

  const fetchLesson = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/api/learn/lessons/${lessonId}`);
      setLesson(response.data);
    } catch (err) {
      console.error('Lesson error:', err);
      setError(err.response?.status === 404 ? t('learnLessonNotFound') : t('learnFailedToLoadLesson'));
    } finally {
      setLoading(false);
    }
  };

  const markWatched = async () => {
    setMarking(true);
    try {
      const response = await api.post(`/api/learn/lessons/${lessonId}/progress`, { watched: true });
      setLesson((prev) => ({ ...prev, watched: true }));
      notify(response.data.gamification);
      if (response.data.certificate_issued) {
        setJustCompleted({ code: response.data.certificate_code });
      }
    } catch (err) {
      console.error('Progress update error:', err);
    } finally {
      setMarking(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>{t('learnLoadingLesson')}</div>;
  if (error || !lesson) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'red' }}><TriangleAlertIcon className="icon-inline" size="1em" aria-hidden="true" /> {error || t('learnLessonNotFound')}</p>
        <Link to={`/learn/${courseId}`}>{t('learnBackToCourse')}</Link>
      </div>
    );
  }

  const hasPlayableVideo = lesson.lesson_type === 'video' && lesson.video_url;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <Link to={`/learn/${courseId}`} style={{ color: 'var(--primary)', fontSize: '14px' }}>{t('learnBackToCourse')}</Link>

      <h2 style={{ color: 'var(--primary)', margin: '12px 0 16px 0' }}>{lesson.title}</h2>

      {lesson.lesson_type === 'video' ? (
        hasPlayableVideo ? (
          <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
            <ReactPlayer
              url={lesson.video_url}
              controls
              width="100%"
              height="100%"
              style={{ position: 'absolute', top: 0, left: 0 }}
              onEnded={markWatched}
            />
          </div>
        ) : (
          <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--surface-muted)', borderRadius: '12px', color: 'var(--gray-500)' }}>
            <CirclePlayIcon className="icon-inline" size="1em" aria-hidden="true" /> {t('learnVideoComingSoon')}
          </div>
        )
      ) : lesson.lesson_type === 'text' ? (
        <div style={{ padding: '24px', background: 'white', border: '1px solid var(--border)', borderRadius: '12px', lineHeight: 1.7 }}>
          <ReactMarkdown>{lesson.content || t('learnContentComingSoon')}</ReactMarkdown>
        </div>
      ) : (
        <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--warning-bg)', borderRadius: '12px' }}>
          <p style={{ margin: 0, color: 'var(--warning)' }}><FileTextIcon className="icon-inline" size="1em" aria-hidden="true" /> {t('learnPracticeQuizLesson')}</p>
          <Link to="/practice" style={{ display: 'inline-block', marginTop: '12px', color: 'var(--primary)', fontWeight: 'bold' }}>
            {t('learnGoToPractice')}
          </Link>
        </div>
      )}

      {lesson.description && <p style={{ color: 'var(--text-muted)', margin: '16px 0' }}>{lesson.description}</p>}

      <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        {lesson.watched ? (
          <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}><CircleCheckIcon className="icon-inline" size="1em" aria-hidden="true" /> {lesson.lesson_type === 'text' ? t('learnCompleted') : t('learnWatched')}</span>
        ) : (
          <button
            onClick={markWatched}
            disabled={marking}
            style={{ padding: '10px 20px', background: marking ? 'var(--border-strong)' : 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: marking ? 'not-allowed' : 'pointer' }}
          >
            {marking ? t('learnMarking') : lesson.lesson_type === 'text' ? t('learnMarkAsRead') : t('learnMarkAsWatched')}
          </button>
        )}
      </div>

      {justCompleted && (
        <div style={{ marginTop: '16px', padding: '16px', background: 'var(--primary-bg)', border: '1px solid var(--primary-border)', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: 'var(--primary)' }}><PartyPopperIcon className="icon-inline" size="1em" aria-hidden="true" /> {t('learnCourseCompleteBanner')}</p>
          <Link to={`/certificates/${courseId}`} style={{ color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'underline' }}>
            {t('learnViewCertificateLink')}
          </Link>
        </div>
      )}

      {lesson.has_exercises && (
        <ExerciseSection lessonId={lessonId} exercises={lesson.exercises} bestScore={lesson.best_score} />
      )}
    </div>
  );
};

export default LessonView;
