import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { extractData, ENDPOINTS } from '../../services/api';
import { getUser } from '../../constants/auth';

const DashboardModule = ({ setActiveModule }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [activity, setActivity] = useState([]);
  const [insights, setInsights] = useState(null);
  
  const user = getUser();
  const userId = user?.id || 'test_user';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [progressRes, recsRes, activityRes, insightsRes] = await Promise.all([
        api.get(ENDPOINTS.DASHBOARD.PROGRESS, { params: { user_id: userId } }),
        api.get(ENDPOINTS.DASHBOARD.RECOMMENDATIONS, { params: { user_id: userId } }),
        api.get(ENDPOINTS.DASHBOARD.ACTIVITY, { params: { user_id: userId } }),
        api.get(ENDPOINTS.DASHBOARD.INSIGHTS, { params: { user_id: userId } }),
      ]);

      setProgress(progressRes.data);
      setRecommendations(extractData(recsRes) || []);
      setActivity(extractData(activityRes) || []);
      setInsights(insightsRes.data);
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

  // Quick Navigation - Each goes to unique NEW Explore destination
  const navItems = [
    { 
      icon: '📚', 
      label: 'Learn', 
      path: '/learn',
      description: 'Browse courses'
    },
    { 
      icon: '🎯', 
      label: 'Career Match', 
      path: '/explore/career-match',
      description: 'Find your perfect career'
    },
    { 
      icon: '🏛️', 
      label: 'Universities', 
      path: '/explore/universities',
      description: 'Explore universities'
    },
    { 
      icon: '💰', 
      label: 'Scholarships', 
      path: '/explore/scholarships',
      description: 'Find funding opportunities'
    },
    { 
      icon: '🤝', 
      label: 'Community', 
      path: '/community',
      description: 'Connect with others'
    },
  ];

  const navigateTo = (path) => {
    // Update active module for highlighting
    if (setActiveModule) {
      if (path.startsWith('/explore')) {
        setActiveModule('explore');
      } else if (path === '/learn') {
        setActiveModule('learn');
      } else if (path === '/community') {
        setActiveModule('community');
      } else {
        setActiveModule('home');
      }
    }
    navigate(path);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>📊 Dashboard</h2>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>📊 Dashboard</h2>
        <p style={{ color: 'red' }}>⚠️ {error}</p>
        <button onClick={fetchDashboardData}>Retry</button>
      </div>
    );
  }

  const currentCourses = progress?.current_courses || [];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Welcome */}
      <div style={{
        background: 'linear-gradient(135deg, #1a5f2b, #2d8a4e)',
        color: 'white',
        padding: '24px 30px',
        borderRadius: '16px',
        marginBottom: '30px',
      }}>
        <h1 style={{ margin: 0 }}>👋 {getGreeting()}, {user?.full_name || user?.name || 'Student'}!</h1>
        <p style={{ opacity: 0.9, margin: '8px 0 0' }}>
          Your AI-powered education and career journey continues.
        </p>
      </div>

      {/* Continue Learning */}
      <div style={{ marginBottom: '30px' }}>
        <h2>📖 Continue Learning</h2>
        {currentCourses.length > 0 ? (
          currentCourses.slice(0, 3).map((course, i) => (
            <div key={i} style={{
              padding: '16px',
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              marginBottom: '12px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>{course.title}</h4>
                <span style={{ fontSize: '12px', background: '#e8f5e9', padding: '2px 10px', borderRadius: '12px' }}>
                  {course.level}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
                <div style={{ flex: 1, height: '6px', background: '#f0f0f0', borderRadius: '3px' }}>
                  <div style={{ width: `${course.progress || 0}%`, height: '100%', background: '#1a5f2b', borderRadius: '3px' }} />
                </div>
                <span style={{ fontSize: '12px', color: '#888' }}>{course.progress || 0}%</span>
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: '#888' }}>No courses in progress. Start learning today!</p>
        )}
      </div>

      {/* AI Recommendation */}
      {recommendations.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2>🤖 Today's AI Recommendation</h2>
          <div style={{
            padding: '24px',
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
          }}>
            <h3 style={{ color: '#1a5f2b', margin: '0 0 8px 0' }}>
              {recommendations[0]?.title || 'Explore Careers'}
            </h3>
            <p style={{ color: '#666' }}>{recommendations[0]?.description}</p>
            {recommendations[0]?.confidence && (
              <div style={{ display: 'inline-block', padding: '4px 12px', background: '#e8f5e9', borderRadius: '12px', fontSize: '13px' }}>
                Match: {recommendations[0].confidence}%
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Navigation - FIXED: Each button goes to NEW Explore destination */}
      <div style={{ marginBottom: '30px' }}>
        <h2>🚀 Quick Navigation</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
          gap: '12px' 
        }}>
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigateTo(item.path)}
              style={{
                padding: '16px',
                background: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                textAlign: 'center',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ fontSize: '24px' }}>{item.icon}</div>
              <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{item.label}</div>
              <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>{item.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ marginBottom: '30px' }}>
        <h2>📋 Recent Activity</h2>
        {activity.length > 0 ? (
          activity.slice(0, 3).map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              marginBottom: '8px',
            }}>
              <span style={{ fontSize: '20px' }}>
                {item.type === 'lesson' ? '✅' : item.type === 'ai' ? '🤖' : '💾'}
              </span>
              <div style={{ flex: 1 }}>
                <div>{item.title || item.description}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  {item.time ? new Date(item.time).toLocaleDateString() : 'Recently'}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: '#888' }}>No recent activity.</p>
        )}
      </div>

      {/* AI Insights */}
      {insights && (
        <div>
          <h2>🧠 AI Insights</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: '#888' }}>📊 Aggregate</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a5f2b' }}>{insights.aggregate || 12}</div>
            </div>
            <div style={{ padding: '16px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: '#888' }}>🎓 Admission Chance</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a5f2b' }}>{insights.admission_chance || 72}%</div>
            </div>
            <div style={{ padding: '16px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: '#888' }}>⚠️ Weak Subjects</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a5f2b' }}>
                {insights.weak_subjects?.join(', ') || 'None'}
              </div>
            </div>
            <div style={{ padding: '16px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: '#888' }}>💡 Suggested Lessons</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1a5f2b' }}>
                {insights.suggested_lessons?.join(', ') || 'None'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardModule;
