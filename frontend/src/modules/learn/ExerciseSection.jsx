import React, { useState } from 'react';
import { CheckCircle2, XCircle, Award } from 'lucide-react';
import api from '../../services/api';

const ExerciseSection = ({ lessonId, exercises, bestScore }) => {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const selectAnswer = (exerciseId, optionIndex) => {
    if (result) return; // lock after grading, use "Try Again" to reset
    setAnswers((prev) => ({ ...prev, [exerciseId]: optionIndex }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await api.post(`/api/learn/lessons/${lessonId}/exercises/submit`, { answers });
      setResult(response.data);
    } catch (err) {
      console.error('Exercise submit error:', err);
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setResult(null);
    setAnswers({});
  };

  const resultsById = result ? Object.fromEntries(result.results.map((r) => [r.exercise_id, r])) : {};
  const allAnswered = exercises.every((ex) => answers[ex.id] !== undefined);

  return (
    <div style={{ marginTop: '32px', padding: '24px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '17px' }}>Practice Exercises</h3>
        {bestScore !== null && bestScore !== undefined && !result && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#1a5f2b', fontWeight: 'bold' }}>
            <Award size={15} /> Best score: {bestScore}%
          </span>
        )}
      </div>

      {result && (
        <div
          style={{
            padding: '16px',
            marginBottom: '20px',
            borderRadius: '12px',
            background: result.score >= 70 ? '#e8f5e9' : '#fff3e0',
            border: `1px solid ${result.score >= 70 ? '#a5d6a7' : '#ffcc80'}`,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: result.score >= 70 ? '#1a5f2b' : '#e65100' }}>{result.score}%</div>
          <div style={{ fontSize: '13px', color: '#555' }}>
            {result.correct_count} of {result.total_questions} correct
          </div>
        </div>
      )}

      {exercises.map((exercise, qi) => {
        const graded = resultsById[exercise.id];
        return (
          <div key={exercise.id} style={{ marginBottom: '20px' }}>
            <div style={{ fontWeight: 600, marginBottom: '10px' }}>
              {qi + 1}. {exercise.question}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {exercise.options.map((option, oi) => {
                const isSelected = answers[exercise.id] === oi;
                let bg = 'white';
                let border = '#e0e0e0';
                if (graded) {
                  if (oi === graded.correct_index) {
                    bg = '#e8f5e9';
                    border = '#a5d6a7';
                  } else if (oi === graded.selected && !graded.is_correct) {
                    bg = '#ffebee';
                    border = '#ef9a9a';
                  }
                } else if (isSelected) {
                  bg = '#e8f5e9';
                  border = '#1a5f2b';
                }
                return (
                  <button
                    key={oi}
                    data-testid={`exercise-${exercise.id}-option-${oi}`}
                    onClick={() => selectAnswer(exercise.id, oi)}
                    disabled={!!result}
                    style={{
                      textAlign: 'left',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: `2px solid ${border}`,
                      background: bg,
                      cursor: result ? 'default' : 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{option}</span>
                    {graded && oi === graded.correct_index && <CheckCircle2 size={16} color="#1a5f2b" />}
                    {graded && oi === graded.selected && !graded.is_correct && <XCircle size={16} color="#c62828" />}
                  </button>
                );
              })}
            </div>
            {graded?.explanation && (
              <div style={{ marginTop: '8px', fontSize: '13px', color: '#666', background: '#f8f9fa', padding: '10px 12px', borderRadius: '8px' }}>
                {graded.explanation}
              </div>
            )}
          </div>
        );
      })}

      {error && <p style={{ color: '#c62828', fontSize: '13px' }}>{error}</p>}

      {result ? (
        <button
          onClick={handleRetry}
          style={{ padding: '10px 22px', background: '#f0f0f0', color: '#333', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Try Again
        </button>
      ) : (
        <button
          data-testid="submit-exercises"
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
          style={{
            padding: '10px 22px',
            background: !allAnswered || submitting ? '#ccc' : '#1a5f2b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: !allAnswered || submitting ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
          }}
        >
          {submitting ? 'Grading...' : 'Submit Answers'}
        </button>
      )}
    </div>
  );
};

export default ExerciseSection;
