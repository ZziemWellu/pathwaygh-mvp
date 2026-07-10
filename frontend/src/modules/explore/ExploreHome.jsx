import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8001' });

function ExploreHome() {
  const [careers, setCareers] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('careers');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [careersRes, uniRes] = await Promise.all([
        API.get('/api/careers'),
        API.get('/api/real-data/universities')
      ]);
      setCareers(careersRes.data || []);
      setUniversities(uniRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCareers = careers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.field.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUniversities = universities.filter(u =>
    u.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderContent = () => {
    switch(activeTab) {
      case 'careers':
        return (
          <div>
            <h3 style={{ color: '#1a5f2b' }}>🎯 Careers</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
              {filteredCareers.slice(0, 8).map(career => (
                <div
                  key={career.id}
                  onClick={() => navigate(`/explore/careers/${career.slug}`)}
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
                  <div style={{ fontSize: '12px', color: '#888' }}>💰 {career.salary_range}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'universities':
        return (
          <div>
            <h3 style={{ color: '#1a5f2b' }}>🏛️ Universities</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
              {filteredUniversities.slice(0, 8).map(uni => (
                <div
                  key={uni}
                  style={{
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    padding: '15px',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/explore/universities/${uni}`)}
                >
                  <h4 style={{ margin: '0 0 5px 0', color: '#1a5f2b' }}>{uni}</h4>
                  <span style={{ fontSize: '12px', color: '#666' }}>Ghana University</span>
                  <p style={{ fontSize: '13px', color: '#555', margin: '8px 0' }}>
                    Click to view details about {uni}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ color: '#1a5f2b' }}>🔍 Explore</h2>
      <p style={{ color: '#666' }}>Discover careers, universities, and opportunities</p>

      {/* Search */}
      <input
        type="text"
        placeholder="Search careers, universities..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #ccc',
          margin: '20px 0',
          fontSize: '16px'
        }}
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
        <button
          onClick={() => setActiveTab('careers')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'careers' ? '#1a5f2b' : '#f0f0f0',
            color: activeTab === 'careers' ? 'white' : '#333',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          🎯 Careers
        </button>
        <button
          onClick={() => setActiveTab('universities')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'universities' ? '#1a5f2b' : '#f0f0f0',
            color: activeTab === 'universities' ? 'white' : '#333',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          🏛️ Universities
        </button>
        <button
          onClick={() => setActiveTab('scholarships')}
          style={{
            padding: '10px 20px',
            background: activeTab === 'scholarships' ? '#1a5f2b' : '#f0f0f0',
            color: activeTab === 'scholarships' ? 'white' : '#333',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          💰 Scholarships
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        renderContent()
      )}
    </div>
  );
}

export default ExploreHome;
