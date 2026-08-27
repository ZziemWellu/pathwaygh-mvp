import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RadialBar, RadialBarChart, PolarAngleAxis } from 'recharts';
import api from '../../services/api';
import { getUser } from '../../constants/auth';

const BRAND = '#1a5f2b';
const BRAND_LIGHT = '#e8f5e9';

const card = { background: 'white', border: '1px solid #e0e0e0', borderRadius: '14px', padding: '20px' };

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

  const navItems = [
    { icon: '📚', label: 'Learn', path: '/learn', description: 'Browse courses' },
    { icon: '🎯', label: 'Career Match', path: '/explore/career-match', description: 'Find your perfect career' },
    { icon: '🏛️', label: 'Universities', path: '/explore/universities', description: 'Explore universities' },
    { icon: '💰', label: 'Scholarships', path: '/explore/scholarships', description: 'Find funding opportunities' },
    { icon: '🤝', label: 'Community', path: '/community', description: 'Connect with others' },
  ];

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
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <div style={{ ...card, height: '100px', marginBottom: '24px', background: '#f0f0f0', border: 'none' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          {[1, 2, 3, 4].map((i) => <div key={i} style={{ ...card, height: '80px', background: '#f5f5f5', border: 'none' }} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>📊 Dashboard</h2>
        <p style={{ color: 'red' }}>⚠️ {error}</p>
        <button onClick={fetchSummary} style={{ padding: '8px 16px', background: BRAND, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  const { overview, current_courses, continue_learning, weak_subjects, recent_activity } = summary;
  const completionPct = overview.lessons_total > 0 ? Math.round((overview.lessons_completed / overview.lessons_total) * 100) : 0;
  const hasCourses = overview.courses_enrolled > 0;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Welcome */}
      <div style={{
        background: `linear-gradient(135deg, ${BRAND}, #2d8a4e)`,
        color: 'white', padding: '24px 30px', borderRadius: '16px', marginBottom: '24px',
      }}>
        <h1 style={{ margin: 0 }}>👋 {getGreeting()}, {user?.full_name || 'Student'}!</h1>
        <p style={{ opacity: 0.9, margin: '8px 0 0' }}>Your education and career journey continues.</p>
      </div>

      {!hasCourses ? (
        <div style={{ ...card, textAlign: 'center', padding: '48px 24px', marginBottom: '24px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>📚</div>
          <h2 style={{ margin: '0 0 8px' }}>You haven't enrolled in a course yet</h2>
          <p style={{ color: '#666', margin: '0 0 20px' }}>Browse the course catalog to start learning.</p>
          <button
            onClick={() => navigateTo('/learn')}
            style={{ padding: '12px 28px', background: BRAND, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Browse Courses →
          </button>
        </div>
      ) : (
        <>
          {/* Overview: completion ring + stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '20px', marginBottom: '24px', ...card }}>
            <div style={{ position: 'relative', width: '160px', height: '160px' }}>
              <RadialBarChart width={160} height={160} cx={80} cy={80} innerRadius={55} outerRadius={75} barSize={14} data={[{ value: completionPct, fill: BRAND }]} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background={{ fill: '#f0f0f0' }} dataKey="value" cornerRadius={8} />
              </RadialBarChart>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '160px', height: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: BRAND }}>{completionPct}%</div>
                <div style={{ fontSize: '11px', color: '#888' }}>lessons done</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', alignContent: 'center' }}>
              <StatTile label="Courses" value={overview.courses_enrolled} />
              <StatTile label="Lessons" value={`${overview.lessons_completed}/${overview.lessons_total}`} />
              <StatTile label="Quizzes taken" value={overview.quizzes_taken} />
              <StatTile label="Avg quiz score" value={overview.quizzes_taken ? `${overview.average_quiz_score}%` : '—'} />
            </div>
          </div>

          {/* Continue Learning */}
          {continue_learning && (
            <div style={{ ...card, marginBottom: '24px', borderColor: BRAND, borderWidth: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Continue Learning</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', margin: '4px 0' }}>{continue_learning.lesson_title}</div>
                <div style={{ fontSize: '13px', color: '#666' }}>{continue_learning.course_title}</div>
              </div>
              <button
                onClick={() => navigate(`/learn/${continue_learning.course_id}/lessons/${continue_learning.lesson_id}`)}
                style={{ padding: '12px 24px', background: BRAND, color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Resume →
              </button>
            </div>
          )}

          {/* Current courses */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '18px' }}>📖 Your Courses</h2>
            {current_courses.map((c) => (
              <div key={c.id} onClick={() => navigate(`/learn/${c.id}`)} style={{ ...card, marginBottom: '10px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0 }}>{c.title}</h4>
                  <span style={{ fontSize: '12px', background: BRAND_LIGHT, padding: '2px 10px', borderRadius: '12px' }}>{c.level?.toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                  <div style={{ flex: 1, height: '6px', background: '#f0f0f0', borderRadius: '3px' }}>
                    <div style={{ width: `${c.progress}%`, height: '100%', background: BRAND, borderRadius: '3px', transition: 'width 0.4s ease' }} />
                  </div>
                  <span style={{ fontSize: '12px', color: '#888', whiteSpace: 'nowrap' }}>{c.lessons_completed}/{c.lessons_total} lessons</span>
                </div>
              </div>
            ))}
          </div>

          {/* Focus areas - only shown when real weak-subject data exists */}
          {weak_subjects.length > 0 && (
            <div style={{ ...card, marginBottom: '24px', background: '#fff8e1', borderColor: '#f0d88b' }}>
              <h3 style={{ margin: '0 0 6px', color: '#805900' }}>💡 Focus Areas</h3>
              <p style={{ margin: 0, color: '#665000', fontSize: '14px' }}>
                Your quiz scores are lower in: <strong>{weak_subjects.join(', ')}</strong>. Consider revisiting these in Practice.
              </p>
            </div>
          )}
        </>
      )}

      {/* Quick Navigation */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px' }}>🚀 Quick Navigation</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigateTo(item.path)}
              style={{ padding: '16px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ fontSize: '24px' }}>{item.icon}</div>
              <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{item.label}</div>
              <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>{item.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {hasCourses && (
        <div>
          <h2 style={{ fontSize: '18px' }}>📋 Recent Activity</h2>
          {recent_activity.length > 0 ? (
            recent_activity.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', ...card, marginBottom: '8px' }}>
                <span style={{ fontSize: '20px' }}>{item.type === 'quiz' ? '📝' : '✅'}</span>
                <div style={{ flex: 1 }}>
                  <div>{item.title}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>{item.time ? new Date(item.time).toLocaleDateString() : 'Recently'}</div>
                </div>
              </div>
            ))
          ) : (
            <p style={{ color: '#888' }}>No activity yet — complete a lesson or quiz to see it here.</p>
          )}
        </div>
      )}
    </div>
  );
};

const StatTile = ({ label, value }) => (
  <div style={{ textAlign: 'center', padding: '10px', background: '#f8f9fa', borderRadius: '10px' }}>
    <div style={{ fontSize: '22px', fontWeight: 'bold', color: BRAND }}>{value}</div>
    <div style={{ fontSize: '11px', color: '#888' }}>{label}</div>
  </div>
);

export default DashboardModule;
