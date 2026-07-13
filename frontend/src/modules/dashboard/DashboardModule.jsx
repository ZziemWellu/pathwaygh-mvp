import React, { useState, useEffect } from 'react';
import api, { extractData, ENDPOINTS } from '../../services/api';
import { getUser } from '../../constants/auth';

const DashboardModule = ({ setActiveModule }) => {
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

  const navigateTo = (module) => {
    console.log('🔍 Navigating to:', module);
    if (setActiveModule) {
      setActiveModule(module);
    }
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

  const navItems = [
    { icon: '📚', label: 'Learn', module: 'learn' },
    { icon: '🎯', label: 'Career Match', module: 'explore' },
    { icon: '🏛️', label: 'Universities', module: 'explore' },
    { icon: '💰', label: 'Scholarships', module: 'explore' },
    { icon: '🤝', label: 'Community', module: 'community' },
  ];

  // Use 100% width with no restrictions
  return (
    <div style={{ width: '100%' }}>
      {/* Welcome */}
      <div style={{
        background: 'linear-gradient(135deg, #1a5f2b, #2d8a4e)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '12px',
        marginBottom: '24px',
        width: '100%',
      }}>
        <h1 style={{ margin: 0, fontSize: '22px' }}>👋 {getGreeting()}, {user?.full_name || user?.name || 'Student'}!</h1>
        <p style={{ opacity: 0.9, margin: '4px 0 0', fontSize: '14px' }}>
          Your AI-powered education and career journey continues.
        </p>
      </div>

      {/* Continue Learning */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>📖 Continue Learning</h2>
        {currentCourses.length > 0 ? (
          currentCourses.slice(0, 3).map((course, i) => (
            <div key={i} style={{
              padding: '12px 16px',
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '10px',
              marginBottom: '8px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '15px' }}>{course.title}</h4>
                <span style={{ fontSize: '11px', background: '#e8f5e9', padding: '2px 10px', borderRadius: '12px' }}>
                  {course.level}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                <div style={{ flex: 1, height: '5px', background: '#f0f0f0', borderRadius: '3px' }}>
                  <div style={{ width: `${course.progress || 0}%`, height: '100%', background: '#1a5f2b', borderRadius: '3px' }} />
                </div>
                <span style={{ fontSize: '11px', color: '#888' }}>{course.progress || 0}%</span>
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: '#888', fontSize: '14px' }}>No courses in progress. Start learning today!</p>
        )}
      </div>

      {/* AI Recommendation */}
      {recommendations.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>🤖 Today's AI Recommendation</h2>
          <div style={{
            padding: '16px 20px',
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '10px',
          }}>
            <h3 style={{ color: '#1a5f2b', margin: '0 0 4px 0', fontSize: '16px' }}>
              {recommendations[0]?.title || 'Explore Careers'}
            </h3>
            <p style={{ color: '#666', fontSize: '14px', margin: '0 0 8px 0' }}>{recommendations[0]?.description}</p>
            {recommendations[0]?.confidence && (
              <div style={{ display: 'inline-block', padding: '2px 12px', background: '#e8f5e9', borderRadius: '12px', fontSize: '12px' }}>
                Match: {recommendations[0].confidence}%
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Navigation */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>🚀 Quick Navigation</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => navigateTo(item.module)}
              style={{
                padding: '12px 10px',
                background: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                textAlign: 'center',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ fontSize: '20px' }}>{item.icon}</div>
              <div style={{ fontSize: '11px' }}>{item.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>📋 Recent Activity</h2>
        {activity.length > 0 ? (
          activity.slice(0, 3).map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              marginBottom: '8px',
            }}>
              <span style={{ fontSize: '18px' }}>
                {item.type === 'lesson' ? '✅' : item.type === 'ai' ? '🤖' : '💾'}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px' }}>{item.title || item.description}</div>
                <div style={{ fontSize: '11px', color: '#888' }}>
                  {item.time ? new Date(item.time).toLocaleDateString() : 'Recently'}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: '#888', fontSize: '14px' }}>No recent activity.</p>
        )}
      </div>

      {/* AI Insights */}
      {insights && (
        <div>
          <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>🧠 AI Insights</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
            <div style={{ padding: '12px 14px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#888' }}>📊 Aggregate</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a5f2b' }}>{insights.aggregate || 12}</div>
            </div>
            <div style={{ padding: '12px 14px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#888' }}>🎓 Admission Chance</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a5f2b' }}>{insights.admission_chance || 72}%</div>
            </div>
            <div style={{ padding: '12px 14px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#888' }}>⚠️ Weak Subjects</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1a5f2b' }}>
                {insights.weak_subjects?.join(', ') || 'None'}
              </div>
            </div>
            <div style={{ padding: '12px 14px', background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#888' }}>💡 Suggested Lessons</div>
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1a5f2b' }}>
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
