import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function LessonPlayer() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <button
        onClick={() => navigate(`/learn/courses/${courseId}`)}
        style={{
          marginBottom: '20px',
          padding: '8px 16px',
          background: '#f0f0f0',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        ← Back to Course
      </button>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '40px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎬</div>
        <h2 style={{ color: '#1a5f2b' }}>Lesson Player</h2>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Lesson ID: {lessonId || 'Not specified'}
        </p>
        <p style={{ color: '#888', marginTop: '10px' }}>
          🚧 Full lesson player with video, quizzes, and progress tracking coming in Sprint 3.
        </p>
        <div style={{
          marginTop: '20px',
          padding: '15px',
          background: '#f5f5f5',
          borderRadius: '8px',
          textAlign: 'left'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#1a5f2b' }}>📋 Lesson Details</h4>
          <p><strong>Course ID:</strong> {courseId || 'N/A'}</p>
          <p><strong>Lesson ID:</strong> {lessonId || 'N/A'}</p>
          <p><strong>Status:</strong> <span style={{ color: '#f57c00' }}>Coming Soon</span></p>
        </div>
      </div>
    </div>
  );
}

export default LessonPlayer;
