import React, { useState, useEffect } from 'react';

function HomeDashboard({ user, careers, loading }) {
  const [greeting, setGreeting] = useState('Good Morning');
  const [courses, setCourses] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    // Fetch courses
    fetch('/api/learn/courses')
      .then(res => res.json())
      .then(data => setCourses(data))
      .catch(err => console.error('Error fetching courses:', err));

    // Set sample recommendation (in production, from AI)
    setRecommendation({
      career: 'Computer Engineering',
      university: 'KNUST',
      reason: 'Your aggregate and subject combination align with KNUST requirements.'
    });

    // Sample recent activity
    setRecentActivity([
      { id: 1, icon: '✅', text: 'Finished Lesson 2', time: '2 hours ago' },
      { id: 2, icon: '🤖', text: 'Asked AI Tutor about Biology', time: '5 hours ago' },
      { id: 3, icon: '💾', text: 'Saved Career: Medical Doctor', time: '1 day ago' },
    ]);
  }, []);

  return (
    <div>
      {/* Welcome Section with Greeting */}
      <div style={{
        background: 'linear-gradient(135deg, #1a5f2b 0%, #2e7d32 100%)',
        padding: '25px 30px',
        borderRadius: '16px',
        color: 'white',
        marginBottom: '25px'
      }}>
        <h2 style={{ margin: 0, fontSize: '28px' }}>
          👋 {greeting}{user?.name ? `, ${user.name}` : ''}!
        </h2>
        <p style={{ margin: '5px 0 0 0', opacity: 0.9, fontSize: '16px' }}>
          Your AI-powered education and career journey continues.
        </p>
      </div>

      {/* Continue Learning Section */}
      <h3 style={{ color: '#1a5f2b', marginBottom: '15px' }}>📖 Continue Learning</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        {courses.length === 0 ? (
          <p style={{ color: '#888' }}>No courses in progress. Start learning today!</p>
        ) : (
          courses.slice(0, 3).map(course => (
            <div key={course.id} style={{
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              padding: '20px',
              background: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, color: '#1a5f2b' }}>{course.title}</h4>
                <span style={{ fontSize: '24px' }}>▶</span>
              </div>
              <div style={{ margin: '10px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666' }}>
                  <span>Progress</span>
                  <span>{Math.floor(Math.random() * 60) + 20}%</span>
                </div>
                <div style={{ height: '8px', background: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.floor(Math.random() * 60) + 20}%`, height: '100%', background: '#1a5f2b' }} />
                </div>
              </div>
              <span style={{ fontSize: '12px', color: '#888' }}>
                {course.lesson_count || 0} lessons • {course.duration_hours || 0}h
              </span>
            </div>
          ))
        )}
        {courses.length > 0 && (
          <div style={{
            border: '2px dashed #e0e0e0',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            background: '#fafafa'
          }}>
            <span style={{ fontSize: '14px', color: '#888' }}>➕ Browse More Courses</span>
          </div>
        )}
      </div>

      {/* Today's AI Recommendation */}
      {recommendation && (
        <div style={{
          background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '30px',
          border: '1px solid #ffcc80'
        }}>
          <h4 style={{ margin: 0, color: '#e65100', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🤖 Today's AI Recommendation
          </h4>
          <p style={{ fontSize: '16px', margin: '8px 0', fontWeight: 'bold', color: '#1a5f2b' }}>
            {recommendation.career} at {recommendation.university}
          </p>
          <p style={{ margin: '5px 0 0 0', color: '#555' }}>
            {recommendation.reason}
          </p>
          <button style={{
            marginTop: '12px',
            padding: '6px 20px',
            background: '#1a5f2b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}>
            View Details →
          </button>
        </div>
      )}

      {/* Quick Navigation */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ color: '#1a5f2b', marginBottom: '15px' }}>🚀 Quick Navigation</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
          {['📚 Learn', '🎯 Career Match', '🏛️ Universities', '💰 Scholarships', '🤝 Community'].map(item => (
            <div key={item} style={{
              padding: '12px',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              background: 'white',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity & AI Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Recent Activity */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#1a5f2b' }}>📋 Recent Activity</h4>
          {recentActivity.map(activity => (
            <div key={activity.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 0',
              borderBottom: '1px solid #f5f5f5'
            }}>
              <span style={{ fontSize: '20px' }}>{activity.icon}</span>
              <div>
                <div style={{ fontWeight: '500' }}>{activity.text}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{activity.time}</div>
              </div>
            </div>
          ))}
        </div>

        {/* AI Insights */}
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#1a5f2b' }}>🧠 AI Insights</h4>
          <div style={{ marginBottom: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span>📊 Aggregate Prediction</span>
              <span style={{ fontWeight: 'bold', color: '#1a5f2b' }}>12</span>
            </div>
            <div style={{ marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span>🎓 Admission Chance</span>
                <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>72%</span>
              </div>
            </div>
            <div style={{ marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span>⚠️ Weak Subjects</span>
                <span style={{ fontWeight: 'bold', color: '#e65100' }}>Physics, Chemistry</span>
              </div>
            </div>
            <div style={{ marginTop: '8px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
              <div style={{ fontSize: '14px', color: '#555' }}>
                💡 Suggested Lessons
              </div>
              <ul style={{ margin: '8px 0 0 20px', fontSize: '13px', color: '#666' }}>
                <li>Physics - Mechanics</li>
                <li>Chemistry - Organic Compounds</li>
                <li>Mathematics - Algebra</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeDashboard;
