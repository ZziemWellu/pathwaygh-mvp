import React, { useState } from 'react';
import { CheckCircle2, XCircle, Award } from 'lucide-react';
import api from '../../services/api';
import { useLanguage } from '../../contexts/LanguageContext';

const ExerciseSection = ({ lessonId, exercises, bestScore }) => {
  const { t } = useLanguage();
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
      setError(t('learnSubmitFailed'));
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
    <div style={{ marginTop: '32px', padding: '24px', background: 'white', border: '1px solid var(--border)', borderRadius: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '17px' }}>{t('learnPracticeExercises')}</h3>
        {bestScore !== null && bestScore !== undefined && !result && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--primary)', fontWeight: 'bold' }}>
            <Award size={15} /> {t('learnBestScore').replace('{pct}', bestScore)}
          </span>
        )}
      </div>

      {result && (
        <div
          style={{
            padding: '16px',
            marginBottom: '20px',
            borderRadius: '12px',
            background: result.score >= 70 ? 'var(--primary-bg)' : 'var(--warning-bg)',
            border: `1px solid ${result.score >= 70 ? 'var(--primary-border)' : 'var(--warning-border)'}`,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: result.score >= 70 ? 'var(--primary)' : 'var(--warning)' }}>{result.score}%</div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {t('learnCorrectCount').replace('{correct}', result.correct_count).replace('{total}', result.total_questions)}
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
                let border = 'var(--border)';
                if (graded) {
                  if (oi === graded.correct_index) {
                    bg = 'var(--primary-bg)';
                    border = 'var(--primary-border)';
                  } else if (oi === graded.selected && !graded.is_correct) {
                    bg = 'var(--danger-bg)';
                    border = 'var(--danger-border)';
                  }
                } else if (isSelected) {
                  bg = 'var(--primary-bg)';
                  border = 'var(--primary)';
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
                    {graded && oi === graded.correct_index && <CheckCircle2 size={16} color="var(--primary)" />}
                    {graded && oi === graded.selected && !graded.is_correct && <XCircle size={16} color="var(--danger)" />}
                  </button>
                );
              })}
            </div>
            {graded?.explanation && (
              <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-muted)', background: 'var(--surface-muted)', padding: '10px 12px', borderRadius: '8px' }}>
                {graded.explanation}
              </div>
            )}
          </div>
        );
      })}

      {error && <p style={{ color: 'var(--danger)', fontSize: '13px' }}>{error}</p>}

      {result ? (
        <button
          onClick={handleRetry}
          style={{ padding: '10px 22px', background: 'var(--surface-sunken)', color: 'var(--text)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {t('learnTryAgain')}
        </button>
      ) : (
        <button
          data-testid="submit-exercises"
          onClick={handleSubmit}
          disabled={!allAnswered || submitting}
          style={{
            padding: '10px 22px',
            background: !allAnswered || submitting ? 'var(--border-strong)' : 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: !allAnswered || submitting ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
          }}
        >
          {submitting ? t('learnGrading') : t('learnSubmitAnswers')}
        </button>
      )}
    </div>
  );
};

export default ExerciseSection;
