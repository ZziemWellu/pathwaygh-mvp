import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RadialBar, RadialBarChart, PolarAngleAxis } from 'recharts';
import {
  BookOpen, Target, Landmark, Coins, Users, ArrowRight, GraduationCap,
  ListChecks, HelpCircle, Sparkles, CheckCircle2, PencilLine, Compass,
} from 'lucide-react';
import api from '../../services/api';
import { getUser } from '../../constants/auth';
import './DashboardModule.css';

const navItems = [
  { icon: BookOpen, label: 'Learn', path: '/learn', description: 'Browse courses', bg: '#e8f5e9', fg: '#1a5f2b' },
  { icon: Target, label: 'Career Match', path: '/explore/career-match', description: 'Find your path', bg: '#e3f2fd', fg: '#1565c0' },
  { icon: Landmark, label: 'Universities', path: '/explore/universities', description: 'Explore schools', bg: '#fce4ec', fg: '#ad1457' },
  { icon: Coins, label: 'Scholarships', path: '/explore/scholarships', description: 'Find funding', bg: '#fef6e0', fg: '#a06c00' },
  { icon: Users, label: 'Community', path: '/community', description: 'Connect', bg: '#ede7f6', fg: '#5e35b1' },
];

const DashboardModule = ({ setActiveModule }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const navigateTo = (path) => {
    if (setActiveModule) {
      if (path.startsWith('/explore')) setActiveModule('explore');
      else if (path === '/learn') setActiveModule('learn');
      else if (path === '/community') setActiveModule('community');
      else setActiveModule('home');
    }
    navigate(path);
  };

  if (loading) {
    return (
      <div className="dash">
        <div className="dash-skeleton" style={{ height: '132px', marginBottom: '28px' }} />
        <div className="dash-skeleton" style={{ height: '150px', marginBottom: '20px' }} />
        <div className="dash-skeleton" style={{ height: '90px', marginBottom: '20px' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash" style={{ textAlign: 'center' }}>
        <h2>Dashboard</h2>
        <p style={{ color: '#c62828' }}>{error}</p>
        <button className="dash-btn" onClick={fetchSummary}>Retry</button>
      </div>
    );
  }

  const { overview, current_courses, continue_learning, weak_subjects, recent_activity } = summary;
  const completionPct = overview.lessons_total > 0 ? Math.round((overview.lessons_completed / overview.lessons_total) * 100) : 0;
  const hasCourses = overview.courses_enrolled > 0;

  return (
    <div className="dash">
      {/* Hero */}
      <div className="dash-hero">
        <p className="dash-hero-eyebrow">Your learning journey</p>
        <h1>{getGreeting()}, {user?.full_name?.split(' ')[0] || 'Student'}</h1>
        <p>Pick up where you left off, or explore something new today.</p>
        <div className="dash-hero-pattern" />
      </div>

      {!hasCourses ? (
        <div className="dash-card dash-empty" style={{ marginBottom: '24px' }}>
          <div className="dash-empty-icon"><GraduationCap size={34} /></div>
          <h2 style={{ margin: '0 0 8px' }}>You haven't enrolled in a course yet</h2>
          <p style={{ color: 'var(--gray-600)', margin: '0 0 22px' }}>Browse the course catalog to start learning.</p>
          <button className="dash-btn" onClick={() => navigateTo('/learn')} style={{ margin: '0 auto' }}>
            Browse Courses <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <>
          {/* Overview */}
          <div className="dash-card dash-overview">
            <div className="dash-ring-wrap">
              <RadialBarChart width={168} height={168} cx={84} cy={84} innerRadius={58} outerRadius={78} barSize={15} data={[{ value: completionPct, fill: '#1a5f2b' }]} startAngle={90} endAngle={-270}>
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

          {/* Continue Learning */}
          {continue_learning && (
            <div className="dash-card dash-continue" style={{ marginTop: '20px' }}>
              <div>
                <p className="dash-continue-eyebrow">Continue Learning</p>
                <h3>{continue_learning.lesson_title}</h3>
                <div className="dash-continue-course">{continue_learning.course_title}</div>
              </div>
              <button
                className="dash-btn"
                onClick={() => navigate(`/learn/${continue_learning.course_id}/lessons/${continue_learning.lesson_id}`)}
              >
                Resume <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Courses */}
          <div style={{ marginTop: '28px' }}>
            <h2 className="dash-section-title"><BookOpen size={17} /> Your Courses</h2>
            {current_courses.map((c) => (
              <div key={c.id} className={`dash-course-row level-${c.level}`} onClick={() => navigate(`/learn/${c.id}`)}>
                <div className="dash-course-info">
                  <div className="dash-course-title">{c.title}</div>
                  <div className="dash-course-track">
                    <div className="dash-course-fill" style={{ width: `${c.progress}%` }} />
                  </div>
                </div>
                <span className="dash-course-badge">{c.lessons_completed}/{c.lessons_total} · {c.level?.toUpperCase()}</span>
              </div>
            ))}
          </div>

          {/* Focus areas */}
          {weak_subjects.length > 0 && (
            <div className="dash-card dash-focus" style={{ marginTop: '20px' }}>
              <h2 className="dash-section-title" style={{ color: '#a06c00' }}><HelpCircle size={17} /> Focus Areas</h2>
              <p style={{ margin: 0, color: '#665000', fontSize: '14px' }}>
                Your quiz scores are lower in <strong>{weak_subjects.join(', ')}</strong>. Revisit these in Practice to strengthen them.
              </p>
            </div>
          )}
        </>
      )}

      {/* Quick Navigation */}
      <div style={{ marginTop: '28px' }}>
        <h2 className="dash-section-title"><Compass size={17} /> Quick Navigation</h2>
        <div className="dash-nav-grid">
          {navItems.map((item) => (
            <button key={item.label} className="dash-nav-tile" onClick={() => navigateTo(item.path)}>
              <div className="dash-nav-icon" style={{ background: item.bg, color: item.fg }}>
                <item.icon size={20} />
              </div>
              <div className="dash-nav-label">{item.label}</div>
              <div className="dash-nav-desc">{item.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {hasCourses && (
        <div style={{ marginTop: '28px' }}>
          <h2 className="dash-section-title"><CheckCircle2 size={17} /> Recent Activity</h2>
          {recent_activity.length > 0 ? (
            <div className="dash-timeline">
              {recent_activity.map((item, i) => (
                <div key={i} className="dash-timeline-item">
                  <div
                    className="dash-timeline-dot"
                    style={item.type === 'quiz' ? { background: '#fef6e0', color: '#a06c00' } : { background: 'var(--primary-glow)', color: 'var(--primary)' }}
                  >
                    {item.type === 'quiz' ? <PencilLine size={16} /> : <CheckCircle2 size={16} />}
                  </div>
                  <div>
                    <div className="dash-timeline-title">{item.title}</div>
                    <div className="dash-timeline-time">{item.time ? new Date(item.time).toLocaleDateString() : 'Recently'}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--gray-500)' }}>No activity yet — complete a lesson or quiz to see it here.</p>
          )}
        </div>
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
