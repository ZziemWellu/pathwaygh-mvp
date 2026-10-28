import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { extractData } from '../../services/api';
import { getUser } from '../../constants/auth';
import { useGamificationNotify } from '../../contexts/GamificationNotifyContext';
import { BookOpen, ChartColumnIcon, CircleCheckIcon, CircleXIcon, Dumbbell, FileText, HouseIcon, PenLine, RotateCcwIcon, Star, ThumbsUp, TimerIcon, TriangleAlertIcon, X, Zap } from 'lucide-react';
import AIBonusQuestion from './AIBonusQuestion';
import './Practice.css';
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
  // One view at a time (tabs): 'subjects' | 'history' | 'stats'.
  const [view, setView] = useState('subjects');
  const [searchParams, setSearchParams] = useSearchParams();
  const [quizLabel, setQuizLabel] = useState('Quiz');
  const [statistics, setStatistics] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  
  const user = getUser();

  useEffect(() => {
    fetchSubjects();
    fetchQuizHistory();
    fetchStatistics();
    // Home's "Quick quiz" links here with ?quick=1: start the mixed quiz
    // straight away, and drop the flag so a refresh doesn't restart it.
    if (searchParams.get('quick') === '1') {
      setSearchParams({}, { replace: true });
      startQuiz();
    }
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

  // No subjectId = a mixed quick quiz across all of the student's subjects.
  const startQuiz = async (subjectId) => {
    setQuizLabel(subjectId ? subjects.find((s) => s.id === subjectId)?.name || 'Quiz' : 'Quick quiz');
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
              <Button variant="secondary" onClick={() => { resetQuiz(); setView('stats'); }}><ChartColumnIcon className="icon-inline" size="1em" aria-hidden="true" /> Stats</Button>
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
          title={quizLabel}
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
      <PageHeader icon={PenLine} title="Practice" subtitle={`WASSCE-style questions · ${subjects.length} subjects`} />

      <div role="tablist" aria-label="Practice views" className="practice-tabs">
        {[['subjects', 'Subjects'], ['history', 'History'], ['stats', 'Stats']].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`practice-tab-${id}`}
            aria-selected={view === id}
            aria-controls="practice-panel"
            className={`practice-tab${view === id ? ' is-active' : ''}`}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div id="practice-panel" role="tabpanel" aria-labelledby={`practice-tab-${view}`}>
        {view === 'subjects' && (
          <>
            <section className="practice-quick" aria-label="Quick quiz">
              <span className="practice-quick__icon"><Zap size={24} aria-hidden="true" /></span>
              <span className="practice-quick__text">
                <strong>Quick quiz</strong>
                <span>5 mixed questions from all your subjects · about 5 min</span>
              </span>
              <button type="button" className="practice-quick__go" onClick={() => startQuiz()}>Go</button>
            </section>

            <h2 className="practice-h2">Your subjects</h2>
            {subjects.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-subtle)' }}>No practice subjects available.</p>
            ) : (
              <ul className="practice-subjects">
                {subjects.map((subject) => {
                  const topics = (subject.topics || []).map((topic) => (typeof topic === 'string' ? topic : topic.name)).filter(Boolean);
                  const mastery = subject.mastery;
                  return (
                    <li key={subject.id} className="card practice-subject">
                      <div className="practice-subject__head">
                        <span className="practice-subject__icon"><SubjectIcon id={subject.id} size={26} strokeWidth={1.8} /></span>
                        <span className="practice-subject__text">
                          <strong>{subject.name}</strong>
                          <span>{[...topics, `${subject.question_count || 0} questions`].join(' · ')}</span>
                        </span>
                      </div>
                      <div className="practice-subject__foot">
                        <div
                          className="practice-subject__track"
                          role="progressbar"
                          aria-label={`${subject.name} mastery`}
                          aria-valuenow={mastery ?? 0}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        >
                          <div style={{ width: `${mastery ?? 0}%` }} />
                        </div>
                        <span className="practice-subject__status">{mastery == null ? 'Not started' : `${mastery}% mastery`}</span>
                        <Button size="sm" onClick={() => startQuiz(subject.id)} aria-label={`Start ${subject.name} quiz`}>
                          {mastery == null ? 'Start' : 'Practise'}
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <AIBonusQuestion />
          </>
        )}

        {view === 'stats' && (
          statistics?.total_quizzes > 0 ? (
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
                <StatBox value={statistics.total_quizzes || 0} label="Total quizzes" />
                <StatBox value={`${statistics.average_score || 0}%`} label="Average score" />
                <StatBox value={`${statistics.best_score || 0}%`} label="Best score" />
                <StatBox value={`${statistics.accuracy || 0}%`} label="Accuracy" />
              </div>

              {statistics.topic_mastery && statistics.topic_mastery.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <h3 style={{ color: 'var(--primary)', margin: '0 0 12px 0', fontSize: '15px' }}>Your topic mastery</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {statistics.topic_mastery.map((topic) => {
                      const pct = Math.round(topic.mastery_probability * 100);
                      return (
                        <div key={`${topic.subject_id}-${topic.topic_id}`}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                            <span>{topic.topic_name}</span>
                            <span style={{ color: 'var(--text-subtle)' }}>{pct}%</span>
                          </div>
                          <div style={{ height: '6px', background: 'var(--surface-sunken)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: pct < 50 ? 'var(--warning)' : 'var(--primary)', borderRadius: '3px' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-subtle)', marginTop: '10px' }}>
                    Practice quizzes automatically focus more on your weaker topics.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-subtle)' }}>No statistics yet - finish a quiz to see them.</p>
          )
        )}

        {view === 'history' && (
          <div className="card" style={{ padding: '24px' }}>
            {quizHistory.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-subtle)' }}>No quiz attempts yet. Start your first quiz!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {quizHistory.slice().reverse().map((attempt, i) => {
                  const scoreColor = getScoreColor(attempt.score || 0);
                  return (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--surface-muted)', borderRadius: '8px', border: '1px solid var(--border)', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{attempt.subject || 'Quick quiz'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>{formatDate(attempt.date, { fallback: 'Recently' })}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: scoreColor }}>{attempt.score || 0}%</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>{attempt.correct || 0}/{attempt.total || 0} correct</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticeModule;

const StatBox = ({ value, label }) => (
  <div style={{ textAlign: 'center', padding: '12px', background: 'var(--surface-muted)', borderRadius: '8px' }}>
    <span style={{ display: 'block', fontSize: '28px', fontWeight: 'bold', color: 'var(--primary)' }}>{value}</span>
    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-subtle)' }}>{label}</span>
  </div>
);
