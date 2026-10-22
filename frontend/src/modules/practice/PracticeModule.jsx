import React, { useState, useEffect } from 'react';
import api, { extractData } from '../../services/api';
import { getUser } from '../../constants/auth';
import { useGamificationNotify } from '../../contexts/GamificationNotifyContext';
import { BookOpen, BookOpenIcon, ChartColumn, ChartColumnIcon, CircleCheckIcon, CircleXIcon, Dumbbell, FileText, HouseIcon, PenLine, RocketIcon, RotateCcwIcon, Star, ThumbsUp, TimerIcon, TrendingUp, TrendingUpIcon, TriangleAlertIcon, X } from 'lucide-react';
import AIBonusQuestion from './AIBonusQuestion';
import { SubjectIcon } from '../../components/ui/icons';
import { formatDate } from '../../utils/date';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';

const PracticeModule = () => {
  const { notify } = useGamificationNotify();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizHistory, setQuizHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [showStats, setShowStats] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  
  const user = getUser();

  useEffect(() => {
    fetchSubjects();
    fetchQuizHistory();
    fetchStatistics();
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/practice/subjects');
      console.log('Practice subjects response:', response.data);
      const data = response.data;
      let subjectData = [];
      if (Array.isArray(data)) subjectData = data;
      else if (data.subjects && Array.isArray(data.subjects)) subjectData = data.subjects;
      else if (data.data && Array.isArray(data.data)) subjectData = data.data;
      setSubjects(subjectData);
      console.log('Subjects loaded:', subjectData.length);
    } catch (err) {
      console.error('Practice error:', err);
      setError(err.message || 'Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizHistory = async () => {
    try {
      const response = await api.get('/api/practice/history').catch(() => ({ data: { history: [] } }));
      setQuizHistory(response.data?.history || []);
    } catch (err) {
      console.error('Quiz history error:', err);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/api/practice/statistics').catch(() => ({ data: {} }));
      setStatistics(response.data);
    } catch (err) {
      console.error('Statistics error:', err);
    }
  };

  const startQuiz = async (subjectId) => {
    setQuiz(null);
    setQuizResults(null);
    setQuizAnswers({});
    setCurrentQuestion(0);
    setTimeSpent(0);
    
    if (timerInterval) clearInterval(timerInterval);
    
    try {
      const response = await api.post('/api/practice/quiz/start', {
        subject_id: subjectId,
        user_id: user?.id || 'test_user',
        question_count: 5
      });
      console.log('Quiz started:', response.data);
      setQuiz(response.data);
      
      const interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
    } catch (err) {
      console.error('Quiz start error:', err);
      setError(err.message || 'Failed to start quiz');
    }
  };

  const submitQuiz = async () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    
    try {
      const response = await api.post('/api/practice/quiz/submit', {
        quiz_id: quiz?.id,
        answers: quizAnswers,
        user_id: user?.id || 'test_user',
        time_spent: timeSpent
      });
      console.log('Quiz results:', response.data);
      setQuizResults(response.data);
      notify(response.data.gamification);
      await fetchQuizHistory();
      await fetchStatistics();
    } catch (err) {
      console.error('Quiz submit error:', err);
      setError(err.message || 'Failed to submit quiz');
    }
  };

  const handleAnswer = (questionIndex, answer) => {
    setQuizAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const resetQuiz = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setQuiz(null);
    setQuizResults(null);
    setQuizAnswers({});
    setCurrentQuestion(0);
    setTimeSpent(0);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'var(--success)';
    // Every band is >= 4.5:1 on white - the old 60-79 yellow (var(--accent)) was
    // 1.97:1, unreadable as the score text itself.
    if (score >= 60) return 'var(--accent-strong)';
    if (score >= 40) return 'var(--warning-strong)';
    return 'var(--danger)';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return Star;
    if (score >= 60) return ThumbsUp;
    if (score >= 40) return BookOpen;
    return Dumbbell;
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return 'Excellent! You\'re a star!';
    if (score >= 60) return 'Good job! Keep it up!';
    if (score >= 40) return 'Keep practicing! You\'ll get better!';
    return 'Don\'t give up! Practice makes perfect!';
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <PageHeader icon={PenLine} title="Practice" />
        <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Loading subjects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <PageHeader icon={PenLine} title="Practice" />
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p style={{ color: 'var(--danger)' }}><TriangleAlertIcon className="icon-inline" size="1em" aria-hidden="true" /> {error}</p>
          <Button onClick={fetchSubjects}>Retry</Button>
        </div>
      </div>
    );
  }

  if (quiz) {
    const questions = quiz.questions || [];
    const totalQuestions = questions.length;
    const currentQ = questions[currentQuestion];
    const answeredCount = Object.keys(quizAnswers).length;

    if (quizResults) {
      const score = quizResults.score || 0;
      const scoreColor = getScoreColor(score);
      const ScoreIcon = getScoreIcon(score);
      const message = getScoreMessage(score);

      return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
          <h2 style={{ textAlign: 'center', color: 'var(--primary)' }}><ChartColumnIcon className="icon-inline" size="1em" aria-hidden="true" /> Quiz Results</h2>
          <div className="card" style={{ padding: '30px', textAlign: 'center' }}>
            <ScoreIcon size={64} color={scoreColor} strokeWidth={1.5} aria-hidden="true" />
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: scoreColor }}>{score}%</div>
            <div style={{ fontSize: '18px', color: 'var(--text-muted)', margin: '8px 0 16px 0' }}>{message}</div>
            <div style={{ height: '12px', background: 'var(--surface-sunken)', borderRadius: '6px', overflow: 'hidden', margin: '16px 0' }}>
              <div style={{ width: `${score}%`, height: '100%', background: scoreColor, borderRadius: '6px', transition: 'width 1s ease' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', margin: '16px 0' }}>
              <div style={{ padding: '12px', background: 'var(--surface-muted)', borderRadius: '8px' }}>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--gray-500)' }}><CircleCheckIcon className="icon-inline" size="1em" aria-hidden="true" /> Correct</span>
                <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold', color: 'var(--primary)' }}>{quizResults.correct || 0}/{totalQuestions}</span>
              </div>
              <div style={{ padding: '12px', background: 'var(--surface-muted)', borderRadius: '8px' }}>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--gray-500)' }}><CircleXIcon className="icon-inline" size="1em" aria-hidden="true" /> Incorrect</span>
                <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold', color: 'var(--danger)' }}>{quizResults.incorrect || 0}/{totalQuestions}</span>
              </div>
              <div style={{ padding: '12px', background: 'var(--surface-muted)', borderRadius: '8px' }}>
                <span style={{ display: 'block', fontSize: '12px', color: 'var(--gray-500)' }}><TimerIcon className="icon-inline" size="1em" aria-hidden="true" /> Time</span>
                <span style={{ display: 'block', fontSize: '20px', fontWeight: 'bold' }}>{formatTime(quizResults.time_spent || 0)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button onClick={resetQuiz}><RotateCcwIcon className="icon-inline" size="1em" aria-hidden="true" /> Retry Quiz</Button>
              <Button variant="secondary" onClick={() => setShowStats(true)}><ChartColumnIcon className="icon-inline" size="1em" aria-hidden="true" /> Stats</Button>
              <Button variant="secondary" onClick={resetQuiz}><HouseIcon className="icon-inline" size="1em" aria-hidden="true" /> Back</Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <PageHeader
          icon={FileText}
          title="Quiz"
          actions={
            <>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}><TimerIcon className="icon-inline" size="1em" aria-hidden="true" /> {formatTime(timeSpent)}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-subtle)' }}>{answeredCount} of {totalQuestions} answered</span>
              <Button variant="secondary" size="sm" icon={X} onClick={resetQuiz}>Quit</Button>
            </>
          }
        />

        <div style={{ marginBottom: '20px' }}>
          <span style={{ fontSize: '14px', color: 'var(--gray-500)' }}>Question {currentQuestion + 1} of {totalQuestions}</span>
          <div style={{ height: '6px', background: 'var(--surface-sunken)', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%`, height: '100%', background: 'var(--primary)', borderRadius: '3px', transition: 'width 0.5s ease' }} />
          </div>
        </div>

        {currentQ && (
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Question {currentQuestion + 1}</span>
              <span style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '12px', background: 'var(--warning)', color: 'white' }}>{currentQ.difficulty || 'Medium'}</span>
            </div>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: 'var(--text)' }}>{currentQ.question}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {currentQ.options?.map((option, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(currentQuestion, option)}
                  style={{
                    padding: '12px 16px',
                    background: quizAnswers[currentQuestion] === option ? 'var(--primary-bg)' : 'var(--surface-muted)',
                    border: quizAnswers[currentQuestion] === option ? '2px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                    fontSize: '15px'
                  }}
                >
                  {String.fromCharCode(65 + i)}. {option}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <Button onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))} disabled={currentQuestion === 0}>
                ← Previous
              </Button>
              {currentQuestion === totalQuestions - 1 ? (
                <Button onClick={submitQuiz}>Submit Quiz ✓</Button>
              ) : (
                <Button onClick={() => setCurrentQuestion(prev => Math.min(totalQuestions - 1, prev + 1))}>Next →</Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <PageHeader
        icon={PenLine}
        title="Practice"
        actions={
          <>
            <Button variant={showHistory ? 'primary' : 'secondary'} size="sm" icon={ChartColumn} aria-pressed={showHistory} onClick={() => setShowHistory(!showHistory)}>
              {showHistory ? 'Back' : 'History'}
            </Button>
            <Button variant={showStats ? 'primary' : 'secondary'} size="sm" icon={TrendingUp} aria-pressed={showStats} onClick={() => setShowStats(!showStats)}>
              Stats
            </Button>
            <span style={{ color: 'var(--text-subtle)', fontSize: '14px' }}><BookOpenIcon className="icon-inline" size="1em" aria-hidden="true" /> {subjects.length} subjects</span>
          </>
        }
      />

      <AIBonusQuestion />

      {showStats && statistics && (
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ color: 'var(--primary)', margin: '0 0 16px 0' }}><TrendingUpIcon className="icon-inline" size="1em" aria-hidden="true" /> Your Statistics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
            <div style={{ textAlign: 'center', padding: '12px', background: 'var(--surface-muted)', borderRadius: '8px' }}>
              <span style={{ display: 'block', fontSize: '28px', fontWeight: 'bold', color: 'var(--primary)' }}>{statistics.total_quizzes || 0}</span>
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--gray-500)' }}>Total Quizzes</span>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: 'var(--surface-muted)', borderRadius: '8px' }}>
              <span style={{ display: 'block', fontSize: '28px', fontWeight: 'bold', color: 'var(--primary)' }}>{statistics.average_score || 0}%</span>
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--gray-500)' }}>Average Score</span>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: 'var(--surface-muted)', borderRadius: '8px' }}>
              <span style={{ display: 'block', fontSize: '28px', fontWeight: 'bold', color: 'var(--primary)' }}>{statistics.best_score || 0}%</span>
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--gray-500)' }}>Best Score</span>
            </div>
            <div style={{ textAlign: 'center', padding: '12px', background: 'var(--surface-muted)', borderRadius: '8px' }}>
              <span style={{ display: 'block', fontSize: '28px', fontWeight: 'bold', color: 'var(--primary)' }}>{statistics.accuracy || 0}%</span>
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--gray-500)' }}>Accuracy</span>
            </div>
          </div>

          {statistics.topic_mastery && statistics.topic_mastery.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ color: 'var(--primary)', margin: '0 0 12px 0', fontSize: '14px' }}>Your topic mastery</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {statistics.topic_mastery.map((topic) => {
                  const pct = Math.round(topic.mastery_probability * 100);
                  return (
                    <div key={`${topic.subject_id}-${topic.topic_id}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                        <span>{topic.topic_name}</span>
                        <span style={{ color: 'var(--gray-500)' }}>{pct}%</span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--surface-sunken)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: pct < 50 ? 'var(--warning)' : 'var(--primary)', borderRadius: '3px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '10px' }}>
                Practice quizzes automatically focus more on your weaker topics.
              </p>
            </div>
          )}

          <Button variant="secondary" size="sm" onClick={() => setShowStats(false)} style={{ marginTop: '16px' }}>Close</Button>
        </div>
      )}

      {showHistory ? (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ color: 'var(--primary)', margin: '0 0 16px 0' }}><ChartColumnIcon className="icon-inline" size="1em" aria-hidden="true" /> Quiz History</h3>
          {quizHistory.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-500)' }}>No quiz attempts yet. Start your first quiz!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {quizHistory.slice().reverse().map((attempt, i) => {
                const scoreColor = getScoreColor(attempt.score || 0);
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--surface-muted)', borderRadius: '8px', border: '1px solid var(--border)', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{attempt.subject || 'Quiz'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{formatDate(attempt.date, { fallback: 'Recently' })}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: scoreColor }}>{attempt.score || 0}%</div>
                      <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{attempt.correct || 0}/{attempt.total || 0} correct</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
          {subjects.length === 0 ? (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--gray-500)' }}>No practice subjects available.</p>
          ) : (
            subjects.map((subject) => (
              <div className="card card--interactive" key={subject.id} onClick={() => startQuiz(subject.id)} style={{ padding: '24px', textAlign: 'center' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '18px', background: 'var(--primary-bg)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SubjectIcon id={subject.id} size={36} color="var(--primary)" strokeWidth={1.75} />
                </div>
                <h3 style={{ color: 'var(--primary)', margin: '12px 0' }}>{subject.name}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginBottom: '12px' }}>
                  {subject.topics?.slice(0, 3).map((topic, i) => (
                    <span key={i} style={{ background: 'var(--surface-sunken)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      {typeof topic === 'string' ? topic : topic.name || topic}
                    </span>
                  ))}
                  {subject.topics?.length > 3 && (
                    <span style={{ background: 'var(--primary-bg)', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', color: 'var(--primary)' }}>
                      +{subject.topics.length - 3} more
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginBottom: '16px' }}>
                  {subject.question_count || 0} questions available
                </div>
                <Button onClick={(e) => {
                    e.stopPropagation();
                    startQuiz(subject.id);
                  }} style={{ width: '100%' }}>
                  <RocketIcon className="icon-inline" size="1em" aria-hidden="true" /> Start Quiz
                </Button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default PracticeModule;
