import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001' });

function SchoolDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await API.get('/api/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading dashboard...</div>;
  }

  if (!stats) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>No data available</div>;
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ color: '#1a5f2b' }}>📊 Career Guidance Dashboard</h1>
      <p style={{ fontSize: '16px', color: '#555' }}>
        Analytics for schools and counselors
      </p>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: 0, color: '#666' }}>Total Careers</h3>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#1a5f2b' }}>{stats.total_careers || 10}</div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: 0, color: '#666' }}>Universities</h3>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#1a5f2b' }}>{stats.total_universities || 12}</div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: 0, color: '#666' }}>Programs</h3>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#1a5f2b' }}>{stats.total_programs || 66}</div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: 0, color: '#666' }}>Data Sources</h3>
          <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#1a5f2b' }}>{stats.total_sources || 13}</div>
        </div>
      </div>

      {/* Top Searched Careers */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
        <h3>🔥 Top Searched Careers</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
          {(stats.top_careers || ['Medical Doctor', 'Software Engineer', 'Lawyer', 'Nurse', 'Pharmacist']).map((career, idx) => (
            <div key={idx} style={{
              padding: '12px 20px',
              background: '#e8f5e9',
              borderRadius: '30px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '24px' }}>{['🏆', '🥇', '🥈', '🥉', '⭐'][idx]}</span>
              <span style={{ fontWeight: 'bold' }}>{career}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h4>📈 Most Demanded Careers</h4>
          <ul style={{ paddingLeft: '20px' }}>
            <li><strong>Medical Doctor</strong> - Very High demand</li>
            <li><strong>Software Engineer</strong> - Very High demand</li>
            <li><strong>Nurse</strong> - Very High demand</li>
            <li><strong>Pharmacist</strong> - High demand</li>
            <li><strong>Civil Engineer</strong> - High demand</li>
          </ul>
        </div>

        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h4>🎓 Top Universities by Programs</h4>
          <ul style={{ paddingLeft: '20px' }}>
            <li><strong>University of Ghana</strong> - 12+ programs</li>
            <li><strong>KNUST</strong> - 10+ programs</li>
            <li><strong>UHAS</strong> - 6+ programs</li>
            <li><strong>UCC</strong> - 5+ programs</li>
            <li><strong>Ashesi</strong> - 3+ programs</li>
          </ul>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
          📊 Data updated daily • {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}

export default SchoolDashboard;
