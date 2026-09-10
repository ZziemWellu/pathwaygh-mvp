import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import ReactMarkdown from 'react-markdown';
import api from '../../services/api';
import ExerciseSection from './ExerciseSection';

const LessonView = () => {
  const { courseId, lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [marking, setMarking] = useState(false);

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
      setError(err.response?.status === 404 ? 'Lesson not found' : 'Failed to load lesson');
    } finally {
      setLoading(false);
    }
  };

  const markWatched = async () => {
    setMarking(true);
    try {
      await api.post(`/api/learn/lessons/${lessonId}/progress`, { watched: true });
      setLesson((prev) => ({ ...prev, watched: true }));
    } catch (err) {
      console.error('Progress update error:', err);
    } finally {
      setMarking(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Loading lesson...</div>;
  if (error || !lesson) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'red' }}>⚠️ {error || 'Lesson not found'}</p>
        <Link to={`/learn/${courseId}`}>← Back to course</Link>
      </div>
    );
  }

  const hasPlayableVideo = lesson.lesson_type === 'video' && lesson.video_url;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <Link to={`/learn/${courseId}`} style={{ color: '#1a5f2b', fontSize: '14px' }}>← Back to course</Link>

      <h2 style={{ color: '#1a5f2b', margin: '12px 0 16px 0' }}>{lesson.title}</h2>

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
          <div style={{ padding: '60px 20px', textAlign: 'center', background: '#f8f9fa', borderRadius: '12px', color: '#666666' }}>
            🎬 Video coming soon for this lesson.
          </div>
        )
      ) : lesson.lesson_type === 'text' ? (
        <div style={{ padding: '24px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px', lineHeight: 1.7 }}>
          <ReactMarkdown>{lesson.content || 'Content coming soon for this lesson.'}</ReactMarkdown>
        </div>
      ) : (
        <div style={{ padding: '40px 20px', textAlign: 'center', background: '#fff3e0', borderRadius: '12px' }}>
          <p style={{ margin: 0, color: '#e65100' }}>📝 This is a practice/quiz lesson.</p>
          <Link to="/practice" style={{ display: 'inline-block', marginTop: '12px', color: '#1a5f2b', fontWeight: 'bold' }}>
            Go to Practice →
          </Link>
        </div>
      )}

      {lesson.description && <p style={{ color: '#555', margin: '16px 0' }}>{lesson.description}</p>}

      <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        {lesson.watched ? (
          <span style={{ color: '#1a5f2b', fontWeight: 'bold' }}>✅ {lesson.lesson_type === 'text' ? 'Completed' : 'Watched'}</span>
        ) : (
          <button
            onClick={markWatched}
            disabled={marking}
            style={{ padding: '10px 20px', background: marking ? '#ccc' : '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: marking ? 'not-allowed' : 'pointer' }}
          >
            {marking ? 'Marking...' : lesson.lesson_type === 'text' ? 'Mark as read' : 'Mark as watched'}
          </button>
        )}
      </div>

      {lesson.has_exercises && (
        <ExerciseSection lessonId={lessonId} exercises={lesson.exercises} bestScore={lesson.best_score} />
      )}
    </div>
  );
};

export default LessonView;
