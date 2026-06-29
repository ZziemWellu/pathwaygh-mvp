import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001' });

function IntelligenceDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const savedUserId = localStorage.getItem('pathwaygh_user_id');
    if (savedUserId) {
      setUserId(savedUserId);
      fetchDashboard(savedUserId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchDashboard = async (uid) => {
    setLoading(true);
    try {
      // Get profile first
      const profileResponse = await API.get(`/api/profile/${uid}`);
      const profile = profileResponse.data.profile;
      
      // Get recommendations
      const recResponse = await API.post('/api/smart/recommend', {
        aggregate: profile.academic?.aggregate || 12,
        subjects: profile.academic?.subjects?.reduce((acc, s) => ({ ...acc, [s]: 75 }), {}),
        interests: profile.career?.interests?.reduce((acc, i) => ({ ...acc, [i]: 7 }), {})
      });
      
      // Get dashboard
      const dashboardResponse = await API.post('/api/dashboard/intelligence', {
        profile: profile,
        recommendations: recResponse.data.predictions || []
      });
      
      setDashboardData(dashboardResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#2e7d32';
    if (score >= 60) return '#f57c00';
    if (score >= 40) return '#e65100';
    return '#c62828';
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading dashboard...</div>;
  }

  if (!dashboardData) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h3>Create your profile first!</h3>
        <p>Go to the Context AI tab to set up your profile.</p>
      </div>
    );
  }

  const { profile_summary, readiness_scores, top_recommendation, recommendations, next_steps } = dashboardData;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ color: '#1a5f2b' }}>📊 Pathway Intelligence Dashboard</h1>
      <p style={{ fontSize: '16px', color: '#555' }}>
        Your personalized career readiness overview
      </p>

      {/* Profile Summary */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0 }}>👤 Profile Summary</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          <span><strong>Role:</strong> {profile_summary.role}</span>
          <span><strong>Education:</strong> {profile_summary.education_level}</span>
          <span><strong>Region:</strong> {profile_summary.region}</span>
          {profile_summary.aggregate && <span><strong>Aggregate:</strong> {profile_summary.aggregate}</span>}
          {profile_summary.interests && profile_summary.interests.length > 0 && (
            <span><strong>Interests:</strong> {profile_summary.interests.join(', ')}</span>
          )}
        </div>
      </div>

      {/* Readiness Scores */}
      <h3 style={{ marginBottom: '15px' }}>📈 Readiness Scores</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        {Object.entries(readiness_scores).map(([key, value]) => (
          <div key={key} style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {key.replace(/_/g, ' ').toUpperCase()}
            </div>
            <div style={{
              fontSize: '36px',
              fontWeight: 'bold',
              color: getScoreColor(value)
            }}>
              {value}%
            </div>
            <div style={{
              background: '#f0f0f0',
              borderRadius: '8px',
              height: '8px',
              marginTop: '10px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${value}%`,
                height: '100%',
                background: getScoreColor(value),
                transition: 'width 0.5s'
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Top Recommendation */}
      {top_recommendation && (
        <div style={{
          background: '#e8f5e9',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '2px solid #2e7d32'
        }}>
          <h3 style={{ marginTop: 0, color: '#2e7d32' }}>🏆 Top Recommendation</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: '5px 0', color: '#1a5f2b' }}>{top_recommendation.career}</h2>
              <p style={{ margin: 0 }}>{top_recommendation.description}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#2e7d32' }}>
                {top_recommendation.confidence || 80}%
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>AI Confidence</div>
            </div>
          </div>
        </div>
      )}

      {/* Next Steps */}
      {next_steps && next_steps.length > 0 && (
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginTop: 0 }}>📋 Next Steps</h3>
          <ol style={{ paddingLeft: '20px' }}>
            {next_steps.map((step, idx) => (
              <li key={idx} style={{ marginBottom: '8px' }}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Confidence Breakdown */}
      {dashboardData.confidence_breakdown && (
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginTop: 0 }}>🎯 Confidence Breakdown</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
            {Object.entries(dashboardData.confidence_breakdown.breakdown || {}).map(([key, value]) => (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span>{key}</span>
                  <span style={{ fontWeight: 'bold' }}>{value}%</span>
                </div>
                <div style={{
                  background: '#f0f0f0',
                  borderRadius: '4px',
                  height: '6px',
                  marginTop: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${value}%`,
                    height: '100%',
                    background: '#1a5f2b',
                    transition: 'width 0.5s'
                  }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
            Overall Confidence: {dashboardData.confidence_breakdown.overall || 70}%
          </div>
        </div>
      )}
    </div>
  );
}

export default IntelligenceDashboard;
