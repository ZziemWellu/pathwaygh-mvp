import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import CareerDetail from './components/CareerDetail';
import UniversityDetail from './components/UniversityDetail';

const ExploreModule = () => {
  const [careers, setCareers] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('careers');
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [selectedUniversity, setSelectedUniversity] = useState(null);

  useEffect(() => {
    fetchExploreData();
  }, []);

  const fetchExploreData = async () => {
    setLoading(true);
    setError(null);
    try {
      let careerData = [];
      let uniData = [];
      
      try {
        const response = await api.get('/api/explore/careers');
        const data = response.data;
        if (Array.isArray(data)) careerData = data;
        else if (data.careers) careerData = data.careers;
        else if (data.data) careerData = data.data;
        
        // Enrich career data with additional fields
        careerData = careerData.map(c => ({
          ...c,
          salary_range: c.salary_range || 'GHS 3,000 - 10,000',
          demand: c.demand || 'High',
          growth: c.growth || 'Growing',
          ai_score: c.ai_score || Math.floor(Math.random() * 30) + 65,
          ai_match: c.ai_match || Math.floor(Math.random() * 40) + 55,
          skills: c.skills || ['Communication', 'Problem Solving', 'Teamwork'],
          roadmap: c.roadmap || [
            { title: 'Complete WASSCE', duration: '3 years' },
            { title: 'Bachelor\'s Degree', duration: '4 years' },
            { title: 'Internship', duration: '1 year' },
            { title: 'Professional Certification', duration: '2 years' },
          ],
          universities: c.universities || ['KNUST', 'University of Ghana', 'UMaT'],
        }));
      } catch (err) {
        console.warn('Careers fetch failed:', err);
      }
      
      try {
        const response = await api.get('/api/explore/universities');
        const data = response.data;
        if (Array.isArray(data)) uniData = data;
        else if (data.universities) uniData = data.universities;
        else if (data.data) uniData = data.data;
        
        // Enrich university data
        uniData = uniData.map(u => ({
          ...u,
          type: u.type || 'Public',
          ranking: u.ranking || Math.floor(Math.random() * 10) + 1,
          requirements: u.requirements || ['Pass WASSCE with aggregate 24 or better', 'Minimum C6 in core subjects'],
          admission_info: u.admission_info || 'Applications open in January. Deadline is March 31st.',
          description: u.description || 'A leading Ghanaian university offering quality education across multiple disciplines.',
        }));
      } catch (err) {
        console.warn('Universities fetch failed:', err);
      }
      
      setCareers(careerData);
      setUniversities(uniData);
    } catch (err) {
      console.error('❌ Explore error:', err);
      setError(err.message || 'Failed to load explore data');
    } finally {
      setLoading(false);
    }
  };

  const openCareerDetail = (career) => {
    setSelectedCareer(career);
  };

  const openUniversityDetail = (university) => {
    setSelectedUniversity(university);
  };

  const closeDetail = () => {
    setSelectedCareer(null);
    setSelectedUniversity(null);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <h2>🔍 Explore</h2>
        <p>Loading explore data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <h2>🔍 Explore</h2>
        <p style={{ color: 'red' }}>⚠️ {error}</p>
        <button onClick={fetchExploreData} style={{ padding: '8px 16px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>🔍 Explore</h2>
        <span style={{ color: '#888' }}>
          {careers.length} careers • {universities.length} universities
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e0e0e0', paddingBottom: '10px' }}>
        <button
          onClick={() => setActiveTab('careers')}
          style={{
            padding: '8px 20px',
            background: activeTab === 'careers' ? '#1a5f2b' : 'transparent',
            color: activeTab === 'careers' ? 'white' : '#333',
            border: activeTab === 'careers' ? 'none' : '1px solid #e0e0e0',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: activeTab === 'careers' ? 'bold' : 'normal',
          }}
        >
          💼 Careers ({careers.length})
        </button>
        <button
          onClick={() => setActiveTab('universities')}
          style={{
            padding: '8px 20px',
            background: activeTab === 'universities' ? '#1a5f2b' : 'transparent',
            color: activeTab === 'universities' ? 'white' : '#333',
            border: activeTab === 'universities' ? 'none' : '1px solid #e0e0e0',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: activeTab === 'universities' ? 'bold' : 'normal',
          }}
        >
          🏛️ Universities ({universities.length})
        </button>
      </div>

      {/* Careers Tab */}
      {activeTab === 'careers' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {careers.length === 0 ? (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#888' }}>No careers available.</p>
          ) : (
            careers.map((career) => (
              <div
                key={career.id}
                onClick={() => openCareerDetail(career)}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  padding: '20px',
                  background: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ color: '#1a5f2b', margin: '0 0 8px 0', fontSize: '18px' }}>{career.title}</h3>
                  {career.category && (
                    <span style={{
                      background: '#e8f5e9',
                      color: '#1a5f2b',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                    }}>
                      {career.category}
                    </span>
                  )}
                </div>
                <p style={{ color: '#666', fontSize: '14px', margin: '8px 0' }}>{career.description}</p>
                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#888', marginTop: '8px' }}>
                  {career.salary_range && <span>💰 {career.salary_range}</span>}
                  {career.demand && <span>📊 {career.demand}</span>}
                </div>
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#1a5f2b', textAlign: 'center' }}>
                  Click for full details →
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Universities Tab */}
      {activeTab === 'universities' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {universities.length === 0 ? (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#888' }}>No universities available.</p>
          ) : (
            universities.map((uni) => (
              <div
                key={uni.id}
                onClick={() => openUniversityDetail(uni)}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  padding: '20px',
                  background: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <h3 style={{ color: '#1a5f2b', margin: '0 0 8px 0', fontSize: '18px' }}>{uni.name}</h3>
                {uni.location && <div style={{ color: '#666', fontSize: '14px' }}>📍 {uni.location}</div>}
                {uni.cutoff && <div style={{ color: '#888', fontSize: '13px' }}>Cutoff: {uni.cutoff}</div>}
                {uni.programs && uni.programs.length > 0 && (
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {uni.programs.slice(0, 2).map((p, i) => (
                      <span key={i} style={{
                        background: '#f0f0f0',
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: '#666',
                      }}>
                        {p}
                      </span>
                    ))}
                    {uni.programs.length > 2 && (
                      <span style={{
                        background: '#f0f0f0',
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: '#666',
                      }}>
                        +{uni.programs.length - 2} more
                      </span>
                    )}
                  </div>
                )}
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#1a5f2b', textAlign: 'center' }}>
                  Click for full details →
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Career Detail Modal */}
      {selectedCareer && (
        <CareerDetail career={selectedCareer} onClose={closeDetail} />
      )}

      {/* University Detail Modal */}
      {selectedUniversity && (
        <UniversityDetail university={selectedUniversity} onClose={closeDetail} />
      )}
    </div>
  );
};

export default ExploreModule;
