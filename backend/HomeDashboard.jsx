import React from 'react';
import { useNavigate } from 'react-router-dom';
import QuickActions from './QuickActions';

function HomeDashboard({ user, careers, loading, onSearch, search, setSearch, onViewCareer, selectedCareer, explanation, roadmap, onCloseCareer }) {
  const navigate = useNavigate();

  return (
    <div>
      {/* Welcome Section */}
      <div style={{
        background: 'linear-gradient(135deg, #1a5f2b 0%, #2e7d32 100%)',
        padding: '30px',
        borderRadius: '16px',
        color: 'white',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h2 style={{ margin: 0, fontSize: '28px' }}>
          👋 Welcome{user?.name ? `, ${user.name}` : ''}!
        </h2>
        <p style={{ margin: '10px 0 0 0', opacity: 0.9 }}>
          Your AI-powered education and career journey starts here.
        </p>
        <div style={{ marginTop: '20px', display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => navigate('/learn')}
            style={{
              padding: '10px 24px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            📚 Continue Learning
          </button>
          <button 
            onClick={() => navigate('/explore')}
            style={{
              padding: '10px 24px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            🔍 Explore Careers
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        <div style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
          <div style={{ fontSize: '28px' }}>📚</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>5</div>
          <div style={{ fontSize: '12px', color: '#888' }}>Active Courses</div>
        </div>
        <div style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
          <div style={{ fontSize: '28px' }}>🎯</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>12</div>
          <div style={{ fontSize: '12px', color: '#888' }}>Career Matches</div>
        </div>
        <div style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
          <div style={{ fontSize: '28px' }}>📊</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>67%</div>
          <div style={{ fontSize: '12px', color: '#888' }}>Overall Progress</div>
        </div>
        <div style={{ background: 'white', padding: '15px', borderRadius: '12px', border: '1px solid #e0e0e0', textAlign: 'center' }}>
          <div style={{ fontSize: '28px' }}>🏆</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>5</div>
          <div style={{ fontSize: '12px', color: '#888' }}>Day Streak</div>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions user={user} />

      {/* Quick Career Preview */}
      <div style={{ marginTop: '30px' }}>
        <h3 style={{ color: '#1a5f2b' }}>🔥 Top Career Matches</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
          {loading ? (
            <p>Loading...</p>
          ) : (
            careers.slice(0, 4).map(career => (
              <div
                key={career.id}
                onClick={() => onViewCareer(career.slug)}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  padding: '15px',
                  background: 'white',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <h4 style={{ margin: '0 0 5px 0', color: '#1a5f2b' }}>{career.name}</h4>
                <span style={{ fontSize: '12px', color: '#666' }}>{career.field}</span>
                <p style={{ fontSize: '13px', color: '#555', margin: '8px 0' }}>{career.description}</p>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  💰 {career.salary_range}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default HomeDashboard;
