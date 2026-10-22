import React, { useEffect, useState } from 'react';
import { Flag, MessageSquare, ShieldCheck, Trash2 } from 'lucide-react';
import api, { extractErrorMessage } from '../../services/api';
import { getUser } from '../../constants/auth';

// The real "Discussion Forums" feature (previously a "coming soon"
// placeholder) - a lightweight peer Q&A board. Every post is checked
// server-side for profanity/personal contact info before it's ever shown
// (see backend/modules/qa/moderation.py); a post the filter holds back
// still confirms to its own author that it was received, so posting
// never silently fails from the student's point of view.
const PeerQA = () => {
  const user = getUser();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [posting, setPosting] = useState(false);
  const [postNotice, setPostNotice] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [pending, setPending] = useState(null);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/qa/questions');
      setQuestions(response.data.questions || []);
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not load questions right now.'));
    } finally {
      setLoading(false);
    }
  };

  const fetchPending = async () => {
    try {
      const response = await api.get('/api/qa/admin/pending');
      setPending(response.data);
    } catch {
      // Silently ignore - the toggle just won't show anything.
    }
  };

  const postQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    setPosting(true);
    setPostNotice(null);
    try {
      const response = await api.post('/api/qa/questions', { body: newQuestion });
      setNewQuestion('');
      if (response.data.pending_review) {
        setPostNotice({ type: 'info', text: "Your question was received and is awaiting a quick review before it's shown publicly." });
      } else {
        setPostNotice({ type: 'success', text: 'Posted!' });
        fetchQuestions();
      }
    } catch (err) {
      setPostNotice({ type: 'error', text: extractErrorMessage(err, 'Could not post your question.') });
    } finally {
      setPosting(false);
    }
  };

  const reportQuestion = async (questionId) => {
    // The backend accepts an optional reason (shown to admins in the
    // review queue) - a bare click with no context was a real gap, since
    // "someone reported this" alone tells a moderator very little.
    const reason = window.prompt('Optional: why are you reporting this question?') || undefined;
    try {
      await api.post(`/api/qa/questions/${questionId}/report`, reason ? { reason } : undefined);
      fetchQuestions();
    } catch {
      // A duplicate report (400) or any other failure is a safe no-op
      // from the student's point of view - nothing to recover from here.
    }
  };

  if (selectedId) {
    return (
      <QuestionDetail
        questionId={selectedId}
        currentUserId={user?.id}
        onBack={() => {
          setSelectedId(null);
          fetchQuestions();
        }}
      />
    );
  }

  return (
    <div>
      <form onSubmit={postQuestion} style={{ marginBottom: '20px' }}>
        <textarea
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="Ask a question for other students to help with..."
          rows={3}
          style={{ width: '100%', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
          <button type="submit" disabled={posting || !newQuestion.trim()} style={{ padding: '8px 20px', background: posting ? 'var(--border-strong)' : 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: posting ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
            {posting ? 'Posting...' : 'Ask'}
          </button>
          {user?.is_admin && (
            <button type="button" onClick={fetchPending} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', background: 'white', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <ShieldCheck size={14} /> Review queue
            </button>
          )}
        </div>
        {postNotice && (
          <p style={{ marginTop: '8px', fontSize: '13px', color: postNotice.type === 'error' ? 'var(--danger)' : postNotice.type === 'info' ? 'var(--accent-strong)' : 'var(--primary)' }}>
            {postNotice.text}
          </p>
        )}
      </form>

      {pending && <ModerationQueue pending={pending} onChange={() => { fetchPending(); fetchQuestions(); }} />}

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '20px' }}>Loading questions...</p>
      ) : error ? (
        <p style={{ color: 'var(--danger)' }}>{error}</p>
      ) : questions.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '20px' }}>No questions yet - be the first to ask!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {questions.map((q) => (
            <div key={q.id} style={{ padding: '14px 16px', background: 'white', border: '1px solid var(--border)', borderRadius: '10px', cursor: 'pointer' }} onClick={() => setSelectedId(q.id)}>
              <p style={{ margin: '0 0 6px 0', fontSize: '14px' }}>{q.body}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--gray-500)' }}>
                <span>{q.author_name} · {q.answer_count} {q.answer_count === 1 ? 'answer' : 'answers'}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); reportQuestion(q.id); }}
                  title="Report"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-500)', fontSize: '12px' }}
                >
                  <Flag size={12} /> Report
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ModerationQueue = ({ pending, onChange }) => {
  const act = async (kind, id, action) => {
    await api.post(`/api/qa/admin/${kind}/${id}/${action}`);
    onChange();
  };

  if (pending.questions.length === 0 && pending.answers.length === 0) {
    return <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '16px' }}>Nothing pending review.</p>;
  }

  return (
    <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: '10px', padding: '14px', marginBottom: '20px' }}>
      <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Pending review</h4>
      {pending.questions.map((q) => (
        <div key={`q-${q.id}`} style={{ padding: '8px 0', borderBottom: '1px solid var(--warning-border)' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '13px' }}>{q.body}</p>
          <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: 'var(--accent-strong)' }}>{q.moderation_reason} · {q.flagged_count} report(s)</p>
          {q.report_reasons?.length > 0 && (
            <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: 'var(--earth)', fontStyle: 'italic' }}>"{q.report_reasons.join('", "')}"</p>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => act('questions', q.id, 'approve')} style={{ padding: '4px 10px', fontSize: '12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Approve</button>
            <button onClick={() => act('questions', q.id, 'remove')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '12px', background: 'white', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={12} /> Remove</button>
          </div>
        </div>
      ))}
      {pending.answers.map((a) => (
        <div key={`a-${a.id}`} style={{ padding: '8px 0', borderBottom: '1px solid var(--warning-border)' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '13px' }}>{a.body}</p>
          <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: 'var(--accent-strong)' }}>{a.moderation_reason} · {a.flagged_count} report(s)</p>
          {a.report_reasons?.length > 0 && (
            <p style={{ margin: '0 0 6px 0', fontSize: '11px', color: 'var(--earth)', fontStyle: 'italic' }}>"{a.report_reasons.join('", "')}"</p>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => act('answers', a.id, 'approve')} style={{ padding: '4px 10px', fontSize: '12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Approve</button>
            <button onClick={() => act('answers', a.id, 'remove')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '12px', background: 'white', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer' }}><Trash2 size={12} /> Remove</button>
          </div>
        </div>
      ))}
    </div>
  );
};

const QuestionDetail = ({ questionId, currentUserId, onBack }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newAnswer, setNewAnswer] = useState('');
  const [posting, setPosting] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    fetchQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  const fetchQuestion = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/qa/questions/${questionId}`);
      setData(response.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const postAnswer = async (e) => {
    e.preventDefault();
    if (!newAnswer.trim()) return;
    setPosting(true);
    setNotice(null);
    try {
      const response = await api.post(`/api/qa/questions/${questionId}/answers`, { body: newAnswer });
      setNewAnswer('');
      if (response.data.pending_review) {
        setNotice("Your answer was received and is awaiting a quick review before it's shown publicly.");
      } else {
        fetchQuestion();
      }
    } catch (err) {
      setNotice(extractErrorMessage(err, 'Could not post your answer.'));
    } finally {
      setPosting(false);
    }
  };

  const reportAnswer = async (answerId) => {
    const reason = window.prompt('Optional: why are you reporting this answer?') || undefined;
    try {
      await api.post(`/api/qa/answers/${answerId}/report`, reason ? { reason } : undefined);
      fetchQuestion();
    } catch {
      // Same safe no-op reasoning as reportQuestion above.
    }
  };

  return (
    <div>
      <button onClick={onBack} style={{ marginBottom: '16px', padding: '6px 14px', background: 'var(--surface-sunken)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
        ← Back to questions
      </button>

      {loading ? (
        <p style={{ color: 'var(--gray-500)' }}>Loading...</p>
      ) : !data ? (
        <p style={{ color: 'var(--danger)' }}>This question isn't available.</p>
      ) : (
        <>
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', marginBottom: '16px' }}>
            <p style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 'bold' }}>{data.question.body}</p>
            <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{data.question.author_name}</span>
          </div>

          <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', margin: '0 0 10px 0' }}>
            <MessageSquare size={16} /> {data.answers.length} {data.answers.length === 1 ? 'Answer' : 'Answers'}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {data.answers.map((a) => (
              <div key={a.id} style={{ padding: '12px 14px', background: 'var(--surface-muted)', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 6px 0', fontSize: '13px' }}>{a.body}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--gray-500)' }}>
                  <span>{a.author_name}</span>
                  {a.user_id !== currentUserId && (
                    <button onClick={() => reportAnswer(a.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-500)' }}>
                      <Flag size={11} /> Report
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={postAnswer}>
            <textarea
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="Write an answer..."
              rows={2}
              style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', resize: 'vertical', fontFamily: 'inherit' }}
            />
            <button type="submit" disabled={posting || !newAnswer.trim()} style={{ marginTop: '8px', padding: '8px 20px', background: posting ? 'var(--border-strong)' : 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: posting ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
              {posting ? 'Posting...' : 'Post Answer'}
            </button>
            {notice && <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--accent-strong)' }}>{notice}</p>}
          </form>
        </>
      )}
    </div>
  );
};

export default PeerQA;
