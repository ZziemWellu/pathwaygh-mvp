import React, { useState } from 'react';
import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001' });

function FeedbackButtons({ recommendationId, career, onFeedback }) {
  const [feedback, setFeedback] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = async (type) => {
    if (submitted) return;

    setFeedback(type);
    setSubmitted(true);

    try {
      await API.post('/api/feedback/submit', {
        recommendation_id: recommendationId,
        career: career,
        feedback_type: type,
        timestamp: new Date().toISOString()
      });
      onFeedback && onFeedback(type);
    } catch (error) {
      console.error('Feedback error:', error);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
      padding: '10px',
      background: '#f5f5f5',
      borderRadius: '8px',
      marginTop: '10px'
    }}>
      <span style={{ fontSize: '14px', color: '#666' }}>
        Was this recommendation helpful?
      </span>
      <button
        onClick={() => handleFeedback('helpful')}
        disabled={submitted}
        style={{
          padding: '6px 16px',
          background: submitted && feedback === 'helpful' ? '#2e7d32' : '#e0e0e0',
          color: submitted && feedback === 'helpful' ? 'white' : '#333',
          border: 'none',
          borderRadius: '20px',
          cursor: submitted ? 'default' : 'pointer',
          opacity: submitted ? 0.8 : 1,
          transition: 'all 0.2s'
        }}
      >
        👍 Helpful
      </button>
      <button
        onClick={() => handleFeedback('not_helpful')}
        disabled={submitted}
        style={{
          padding: '6px 16px',
          background: submitted && feedback === 'not_helpful' ? '#c62828' : '#e0e0e0',
          color: submitted && feedback === 'not_helpful' ? 'white' : '#333',
          border: 'none',
          borderRadius: '20px',
          cursor: submitted ? 'default' : 'pointer',
          opacity: submitted ? 0.8 : 1,
          transition: 'all 0.2s'
        }}
      >
        👎 Not Helpful
      </button>
      {submitted && (
        <span style={{ fontSize: '12px', color: '#666' }}>
          Thank you for your feedback! 🙏
        </span>
      )}
    </div>
  );
}

export default FeedbackButtons;
