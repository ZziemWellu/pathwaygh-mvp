import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RadialBar, RadialBarChart, PolarAngleAxis } from 'recharts';
import {
  ArrowRight, BookOpen, Bot, Calculator, CheckCircle2, ChevronRight, Flame, HelpCircle,
  ListChecks, PencilLine, PlayCircle, Sparkles, Target,
} from 'lucide-react';
import api from '../../services/api';
import { getUser } from '../../constants/auth';
import { OPEN_TUTOR_EVENT } from '../../components/ai/AIChat';
import GamificationSummary from './GamificationSummary';
import WordOfTheDayCard from './WordOfTheDayCard';
import './DashboardModule.css';
import { formatDate } from '../../utils/date';

const GRADES = ['JHS 1', 'JHS 2', 'JHS 3', 'SHS 1', 'SHS 2', 'SHS 3', 'University'];
const WEEKDAY = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const COUNTRY_NAMES = { GH: 'Ghana', NG: 'Nigeria', SL: 'Sierra Leone', LR: 'Liberia', GM: 'The Gambia' };

const lessonMeta = (step) =>
  [step.course_title, `Lesson ${step.lesson_number} of ${step.lessons_total}`, step.duration_minutes && `${step.duration_minutes} min`]
    .filter(Boolean)
    .join(' · ');

const DashboardModule = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [savingGrade, setSavingGrade] = useState(null);
  const [gradeError, setGradeError] = useState(null);
  const user = getUser();

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/dashboard/summary');
      setSummary(response.data);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const chooseGrade = async (grade) => {
    setSavingGrade(grade);
    setGradeError(null);
    try {
      await api.put('/api/profile/me', { grade });
      const response = await api.get('/api/dashboard/summary');
      setSummary(response.data);
    } catch (err) {
      setGradeError(err.response?.data?.detail || 'Could not save your level - please try again.');
    } finally {
      setSavingGrade(null);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const openTutor = () => window.dispatchEvent(new Event(OPEN_TUTOR_EVENT));

  if (loading) {
    return (
      <div className="dash" aria-busy="true">
        <div className="dash-skeleton" style={{ height: '64px', marginBottom: '20px' }} />
        <div className="dash-skeleton" style={{ height: '190px', marginBottom: '24px' }} />
        <div className="dash-skeleton" style={{ height: '150px', marginBottom: '20px' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash" style={{ textAlign: 'center' }}>
        <h2>Home</h2>
        <p style={{ color: 'var(--danger)' }}>{error}</p>
        <button className="dash-btn" onClick={fetchSummary} style={{ margin: '0 auto' }}>Retry</button>
      </div>
    );
  }

  const { overview, current_courses, weak_subjects, weak_topics, recent_activity, next_step: step, week = [] } = summary;
  const completionPct = overview.lessons_total > 0 ? Math.round((overview.lessons_completed / overview.lessons_total) * 100) : 0;
  const hasCourses = overview.courses_enrolled > 0;
  const activeDays = week.filter((d) => d.active).length;
  const firstName = user?.full_name?.split(' ')[0] || 'Student';

  return (
    <div className="dash">
      <header className="dash-greeting">
        <h1>{getGreeting()}, {firstName}</h1>
        <p>{COUNTRY_NAMES[user?.country] || ''}</p>
      </header>

      {/* One clear next action, decided server-side (dashboard/router.py _next_step). */}
      <section className="dash-next" aria-label="Your next step">
        {step?.kind === 'choose_level' ? (
          <>
            <p className="dash-next-eyebrow">Let&apos;s personalise PathwayGH</p>
            <h2>Which class are you in?</h2>
            <p className="dash-next-meta">We&apos;ll pick the right courses and practice for you.</p>
            <div className="dash-grade-grid" role="group" aria-label="Choose your class">
              {GRADES.map((grade) => (
                <button key={grade} type="button" className="dash-grade" disabled={!!savingGrade} onClick={() => chooseGrade(grade)}>
                  {savingGrade === grade ? 'Saving…' : grade}
                </button>
              ))}
            </div>
            {gradeError && <p className="dash-next-error" role="alert">{gradeError}</p>}
          </>
        ) : step?.kind === 'continue' || step?.kind === 'start' ? (
          <>
            <p className="dash-next-eyebrow">{step.kind === 'continue' ? 'Continue where you left off' : 'Your next step'}</p>
            <h2>{step.lesson_title}</h2>
            <p className="dash-next-meta">{lessonMeta(step)}</p>
            <button type="button" className="dash-next-cta" onClick={() => navigate(`/learn/${step.course_id}/lessons/${step.lesson_id}`)}>
              <PlayCircle size={18} aria-hidden="true" /> {step.kind === 'continue' ? 'Resume lesson' : 'Start lesson'}
            </button>
            {step.kind === 'start' && (
              <p className="dash-next-note">
                Picked because you&apos;re in {step.level?.toUpperCase()}.{' '}
                <button type="button" className="dash-next-link" onClick={() => navigate('/learn')}>See all courses</button>
              </p>
            )}
          </>
        ) : (
          <>
            <p className="dash-next-eyebrow">Your next step</p>
            <h2>Keep your skills sharp</h2>
            <p className="dash-next-meta">A 5-question quick quiz across your subjects.</p>
            <button type="button" className="dash-next-cta" onClick={() => navigate('/practice?quick=1')}>
              <PencilLine size={18} aria-hidden="true" /> Start quick quiz
            </button>
          </>
        )}
        <GamificationSummary hideWhenEmpty />
      </section>

      <section aria-labelledby="dash-today">
        <h2 id="dash-today" className="dash-section-title">Today</h2>
        <ul className="dash-today">
          <li>
            <button type="button" className="dash-today-row" onClick={() => navigate('/practice?quick=1')}>
              <span className="dash-today-icon" style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}><Calculator size={22} aria-hidden="true" /></span>
              <span className="dash-today-text"><strong>Quick quiz</strong><span>5 questions · about 5 minutes</span></span>
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </li>
          <li>
            <button type="button" className="dash-today-row" onClick={openTutor}>
              <span className="dash-today-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}><Bot size={22} aria-hidden="true" /></span>
              <span className="dash-today-text"><strong>Ask the AI tutor</strong><span>Stuck on homework? Get a hint</span></span>
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </li>
        </ul>
      </section>

      <WordOfTheDayCard />

      <section className="dash-card dash-week" aria-labelledby="dash-week">
        <div className="dash-week-head">
          <h2 id="dash-week">{activeDays > 0 ? `${activeDays} active day${activeDays === 1 ? '' : 's'} this week` : 'Start your streak'}</h2>
          <Flame size={22} color="var(--accent-strong)" aria-hidden="true" />
        </div>
        <p>Finish one lesson or quiz a day to light up the week.</p>
        <ol className="dash-week-days" aria-label="This week">
          {week.map((day, i) => (
            <li key={day.date} className={`${day.active ? 'is-active' : ''} ${day.is_today ? 'is-today' : ''}`}>
              <span aria-hidden="true" />
              {WEEKDAY[i]}
              <span className="visually-hidden">
                {formatDate(day.date)}{day.active ? ', active' : ''}{day.is_today ? ', today' : ''}
              </span>
            </li>
          ))}
        </ol>
      </section>

      {hasCourses && (
        <section style={{ marginTop: '28px' }} aria-labelledby="dash-courses">
          <h2 id="dash-courses" className="dash-section-title"><BookOpen size={17} /> Your courses</h2>
          <div className="dash-card dash-overview" style={{ marginBottom: '14px' }}>
            <div className="dash-ring-wrap">
              <RadialBarChart width={168} height={168} cx={84} cy={84} innerRadius={58} outerRadius={78} barSize={15} data={[{ value: completionPct, fill: 'var(--primary)' }]} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background={{ fill: 'var(--gray-100)' }} dataKey="value" cornerRadius={8} />
              </RadialBarChart>
              <div className="dash-ring-label">
                <span className="dash-ring-pct">{completionPct}%</span>
                <span className="dash-ring-caption">lessons complete</span>
              </div>
            </div>
            <div className="dash-stats">
              <StatTile icon={BookOpen} label="Courses" value={overview.courses_enrolled} />
              <StatTile icon={ListChecks} label="Lessons" value={`${overview.lessons_completed}/${overview.lessons_total}`} />
              <StatTile icon={PencilLine} label="Quizzes taken" value={overview.quizzes_taken} />
              <StatTile icon={Sparkles} label="Avg quiz score" value={overview.quizzes_taken ? `${overview.average_quiz_score}%` : '—'} />
            </div>
          </div>
          {current_courses.map((c) => (
            <button key={c.id} type="button" className={`dash-course-row level-${c.level}`} onClick={() => navigate(`/learn/${c.id}`)}>
              <div className="dash-course-info">
                <div className="dash-course-title">{c.title}</div>
                <div className="dash-course-track" role="progressbar" aria-label={`${c.title} progress`} aria-valuenow={c.progress} aria-valuemin={0} aria-valuemax={100}>
                  <div className="dash-course-fill" style={{ width: `${c.progress}%` }} />
                </div>
              </div>
              <span className="dash-course-badge">{c.lessons_completed}/{c.lessons_total} · {c.level?.toUpperCase()}</span>
            </button>
          ))}
        </section>
      )}

      {/* Focus areas reflect quiz activity, not enrolment, so a student who has
          only taken practice quizzes still sees them. */}
      {(weak_subjects.length > 0 || (weak_topics && weak_topics.length > 0)) && (
        <div className="dash-card dash-focus" style={{ marginTop: '20px' }}>
          <h2 className="dash-section-title" style={{ color: 'var(--accent-strong)' }}><HelpCircle size={17} /> Focus areas</h2>
          {weak_subjects.length > 0 && (
            <p style={{ margin: 0, color: 'var(--accent-strong)', fontSize: '14px' }}>
              Your quiz scores are lower in <strong>{weak_subjects.join(', ')}</strong>. Revisit these in Practice to strengthen them.
            </p>
          )}
          {weak_topics && weak_topics.length > 0 && (
            <p style={{ margin: weak_subjects.length > 0 ? '8px 0 0 0' : 0, color: 'var(--accent-strong)', fontSize: '13px' }}>
              Weakest topics: <strong>{weak_topics.map((t) => `${t.topic_name} (${t.subject_id})`).join(', ')}</strong>
            </p>
          )}
        </div>
      )}

      <button type="button" className="dash-career" onClick={() => navigate('/explore/career-match')}>
        <span className="dash-career-icon"><Target size={24} aria-hidden="true" /></span>
        <span className="dash-today-text"><strong>Find careers that fit you</strong><span>Take Career Match · 5 questions</span></span>
        <ArrowRight size={18} aria-hidden="true" />
      </button>

      {hasCourses && recent_activity.length > 0 && (
        <section style={{ marginTop: '28px' }} aria-labelledby="dash-activity">
          <h2 id="dash-activity" className="dash-section-title"><CheckCircle2 size={17} /> Recent activity</h2>
          <div className="dash-timeline">
            {recent_activity.map((item, i) => (
              <div key={i} className="dash-timeline-item">
                <div
                  className="dash-timeline-dot"
                  style={item.type === 'quiz' ? { background: 'var(--accent-bg)', color: 'var(--accent-strong)' } : { background: 'var(--primary-glow)', color: 'var(--primary)' }}
                >
                  {item.type === 'quiz' ? <PencilLine size={16} /> : <CheckCircle2 size={16} />}
                </div>
                <div>
                  <div className="dash-timeline-title">{item.title}</div>
                  <div className="dash-timeline-time">{formatDate(item.time, { fallback: 'Recently' })}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const StatTile = ({ icon: Icon, label, value }) => (
  <div className="dash-stat-tile">
    <div className="dash-stat-icon"><Icon size={17} /></div>
    <div>
      <div className="dash-stat-value">{value}</div>
      <div className="dash-stat-label">{label}</div>
    </div>
  </div>
);

export default DashboardModule;
