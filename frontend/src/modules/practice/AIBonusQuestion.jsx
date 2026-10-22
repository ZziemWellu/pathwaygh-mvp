import React, { useState } from 'react';
import api, { extractErrorMessage } from '../../services/api';
import { BotIcon } from 'lucide-react';

// On-demand, AI-generated bonus Mathematics practice - separate from the
// tracked/adaptive quiz flow above (see backend/modules/ai_questions/
// generator.py for why: an AI-generated question isn't fed into mastery
// tracking, since its difficulty hasn't been human-calibrated the way
// the curated question bank has been). The full answer comes back in one
// response (nothing to "submit" server-side), so choosing an option just
// reveals whether it matches - selection is a self-check, not a graded
// attempt.
const AIBonusQuestion = () => {
  const [difficulty, setDifficulty] = useState('medium');
  const [topic, setTopic] = useState('');
  const [question, setQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    setQuestion(null);
    setSelected(null);
    try {
      const response = await api.post('/api/ai-questions/generate', {
        topic: topic.trim() || undefined,
        difficulty,
      });
      setQuestion(response.data.question);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not generate a question right now - please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--border)', padding: '20px', marginBottom: '24px' }}>
      <h3 style={{ color: 'var(--primary)', margin: '0 0 4px 0' }}><BotIcon className="icon-inline" size="1em" aria-hidden="true" /> AI Bonus Question</h3>
      <p style={{ fontSize: '13px', color: 'var(--gray-500)', margin: '0 0 16px 0' }}>
        Unlimited extra Mathematics practice, generated on demand and checked by a calculator before you see it.
        Doesn't count toward your tracked stats above.
      </p>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Topic (optional), e.g. algebra"
          style={{ flex: 1, minWidth: '160px', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px' }}
        />
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px' }}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <button
          onClick={generate}
          disabled={loading}
          style={{ padding: '8px 20px', background: loading ? 'var(--border-strong)' : 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}
        >
          {loading ? 'Generating...' : question ? 'New Question' : 'Generate'}
        </button>
      </div>

      {error && <p style={{ color: 'var(--danger)', fontSize: '13px' }}>{error}</p>}

      {question && (
        <div style={{ padding: '16px', background: 'var(--surface-muted)', borderRadius: '8px' }}>
          <p style={{ margin: '0 0 12px 0', fontWeight: 'bold' }}>{question.question}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: selected ? '12px' : 0 }}>
            {question.options.map((option, i) => {
              const isSelected = selected === option;
              const isCorrect = option === question.correct;
              let background = 'white';
              if (selected) {
                if (isCorrect) background = 'var(--primary-bg)';
                else if (isSelected) background = 'var(--danger-bg)';
              }
              return (
                <button
                  key={i}
                  onClick={() => setSelected(option)}
                  disabled={Boolean(selected)}
                  style={{
                    padding: '10px 14px',
                    textAlign: 'left',
                    borderRadius: '8px',
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background,
                    cursor: selected ? 'default' : 'pointer',
                    fontSize: '14px',
                  }}
                >
                  {String.fromCharCode(65 + i)}. {option}
                </button>
              );
            })}
          </div>
          {selected && (
            <div style={{ fontSize: '13px' }}>
              <p style={{ fontWeight: 'bold', color: selected === question.correct ? 'var(--primary)' : 'var(--danger)', margin: '0 0 6px 0' }}>
                {selected === question.correct ? 'Correct!' : `Not quite - the answer is ${question.correct}`}
              </p>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>{question.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIBonusQuestion;
