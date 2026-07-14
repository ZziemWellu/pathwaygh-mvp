import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { getUser } from '../../../constants/auth';

const ScholarshipsPage = () => {
  const [scholarships, setScholarships] = useState([]);
  const [filteredScholarships, setFilteredScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedScholarship, setSelectedScholarship] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [savedScholarships, setSavedScholarships] = useState([]);
  
  const user = getUser();

  useEffect(() => {
    fetchScholarships();
    fetchSavedScholarships();
  }, []);

  useEffect(() => {
    filterScholarships();
  }, [scholarships, searchTerm, filterType, filterStatus]);

  const fetchScholarships = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/explore/scholarships');
      const data = response.data;
      let schData = [];
      if (Array.isArray(data)) schData = data;
      else if (data.scholarships) schData = data.scholarships;
      else if (data.data) schData = data.data;
      setScholarships(schData);
      setFilteredScholarships(schData);
    } catch (err) {
      console.error('Scholarships error:', err);
      setError(err.message || 'Failed to load scholarships');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedScholarships = async () => {
    try {
      const userId = user?.id || 'test_user';
      const response = await api.get(`/api/profile/saved/scholarships`, {
        params: { user_id: userId }
      }).catch(() => ({ data: [] }));
      setSavedScholarships(response.data || []);
    } catch (err) {
      console.error('Saved scholarships error:', err);
    }
  };

  const filterScholarships = () => {
    let filtered = [...scholarships];
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.title.toLowerCase().includes(term) ||
        s.sponsor.toLowerCase().includes(term) ||
        s.description?.toLowerCase().includes(term)
      );
    }
    
    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(s => s.type === filterType);
    }
    
    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(s => s.status === filterStatus);
    }
    
    setFilteredScholarships(filtered);
  };

  const saveScholarship = async (scholarshipId) => {
    try {
      const userId = user?.id || 'test_user';
      await api.post('/api/profile/saved/scholarships', {
        user_id: userId,
        scholarship_id: scholarshipId
      });
      await fetchSavedScholarships();
      alert('✅ Scholarship saved successfully!');
    } catch (err) {
      console.error('Save scholarship error:', err);
      alert('❌ Failed to save scholarship. Please try again.');
    }
  };

  const isSaved = (scholarshipId) => {
    return savedScholarships.some(s => s.id === scholarshipId);
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'government': return '#1a5f2b';
      case 'private': return '#1565c0';
      case 'international': return '#6a1b9a';
      default: return '#888';
    }
  };

  const getStatusColor = (status) => {
    return status === 'open' ? '#2e7d32' : '#c62828';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #f0f0f0', borderTopColor: '#1a5f2b', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#888' }}>Loading scholarships...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2 style={{ color: '#1a5f2b' }}>💰 Scholarships</h2>
        <p style={{ color: '#c62828' }}>⚠️ {error}</p>
        <button onClick={fetchScholarships} style={{ padding: '8px 20px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  if (scholarships.length === 0) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ color: '#1a5f2b' }}>💰 Scholarships</h2>
          <span style={{ color: '#888' }}>0 scholarships available</span>
        </div>
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎓</div>
          <h3 style={{ color: '#666' }}>Scholarships Coming Soon</h3>
          <p style={{ color: '#888', maxWidth: '400px', margin: '0 auto' }}>
            We're working on adding scholarship opportunities. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ color: '#1a5f2b' }}>💰 Scholarships</h2>
        <span style={{ color: '#888' }}>{filteredScholarships.length} scholarships available</span>
      </div>

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="🔍 Search scholarships..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '10px 14px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '14px'
          }}
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            padding: '10px 14px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '14px',
            background: 'white'
          }}
        >
          <option value="all">All Types</option>
          <option value="government">🏛️ Government</option>
          <option value="private">💼 Private</option>
          <option value="international">🌍 International</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '10px 14px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            fontSize: '14px',
            background: 'white'
          }}
        >
          <option value="all">All Status</option>
          <option value="open">🟢 Open</option>
          <option value="closed">🔴 Closed</option>
        </select>
      </div>

      {/* Scholarships Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {filteredScholarships.length === 0 ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#888' }}>
            No scholarships match your filters.
          </p>
        ) : (
          filteredScholarships.map((sch) => (
            <div
              key={sch.id}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                padding: '20px',
                background: 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.04)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              onClick={() => setSelectedScholarship(sch)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 style={{ color: '#1a5f2b', margin: 0, fontSize: '17px' }}>{sch.title}</h3>
                <span style={{
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  background: getStatusColor(sch.status),
                  color: 'white'
                }}>
                  {sch.status.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                🏛️ {sch.sponsor}
              </div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                💰 {sch.amount || 'Full tuition'}
              </div>
              <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                📅 Deadline: {formatDate(sch.deadline)}
              </div>
              <div style={{ marginTop: '12px' }}>
                <span style={{
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  background: getTypeColor(sch.type),
                  color: 'white'
                }}>
                  {sch.type.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '12px' }}>
                Click for full details →
              </div>
            </div>
          ))
        )}
      </div>

      {/* Scholarship Detail Modal */}
      {selectedScholarship && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setSelectedScholarship(null)}
        >
          <div
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '16px',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              width: '100%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              style={{ float: 'right', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#888' }}
              onClick={() => setSelectedScholarship(null)}
            >
              ✕
            </button>
            <h2 style={{ color: '#1a5f2b', marginBottom: '8px' }}>{selectedScholarship.title}</h2>
            <span style={{
              padding: '2px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold',
              background: getStatusColor(selectedScholarship.status),
              color: 'white',
              display: 'inline-block',
              marginBottom: '12px'
            }}>
              {selectedScholarship.status.toUpperCase()}
            </span>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              🏛️ <strong>Sponsor:</strong> {selectedScholarship.sponsor}
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              💰 <strong>Coverage:</strong> {selectedScholarship.coverage || selectedScholarship.amount || 'Full tuition'}
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              📅 <strong>Deadline:</strong> {formatDate(selectedScholarship.deadline)}
            </div>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
              🏛️ <strong>Type:</strong> {selectedScholarship.type.toUpperCase()}
            </div>
            {selectedScholarship.eligibility && (
              <div style={{ margin: '12px 0' }}>
                <strong>✅ Eligibility:</strong>
                <p style={{ color: '#555', fontSize: '14px', margin: '4px 0 0 0' }}>{selectedScholarship.eligibility}</p>
              </div>
            )}
            {selectedScholarship.description && (
              <div style={{ margin: '12px 0' }}>
                <strong>📋 Description:</strong>
                <p style={{ color: '#555', fontSize: '14px', margin: '4px 0 0 0' }}>{selectedScholarship.description}</p>
              </div>
            )}
            {selectedScholarship.website && (
              <div style={{ margin: '12px 0' }}>
                <strong>🔗 Website:</strong>
                <a href={selectedScholarship.website} target="_blank" rel="noopener noreferrer" style={{ color: '#1a5f2b' }}>
                  {selectedScholarship.website}
                </a>
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
              <button
                onClick={() => window.open(selectedScholarship.website, '_blank')}
                style={{
                  flex: 1,
                  padding: '10px 20px',
                  background: '#1a5f2b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🚀 Apply Now
              </button>
              <button
                onClick={() => {
                  saveScholarship(selectedScholarship.id);
                }}
                style={{
                  padding: '10px 20px',
                  background: isSaved(selectedScholarship.id) ? '#e8f5e9' : '#f0f0f0',
                  color: isSaved(selectedScholarship.id) ? '#1a5f2b' : '#333',
                  border: isSaved(selectedScholarship.id) ? '1px solid #1a5f2b' : '1px solid #e0e0e0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: isSaved(selectedScholarship.id) ? 'bold' : 'normal'
                }}
              >
                {isSaved(selectedScholarship.id) ? '✅ Saved' : '💾 Save Scholarship'}
              </button>
              <button
                onClick={() => setSelectedScholarship(null)}
                style={{
                  padding: '10px 20px',
                  background: '#f0f0f0',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScholarshipsPage;
