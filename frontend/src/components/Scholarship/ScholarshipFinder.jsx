import React, { useState } from 'react';
import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001' });

function ScholarshipFinder() {
  const [career, setCareer] = useState('');
  const [loading, setLoading] = useState(false);
  const [scholarships, setScholarships] = useState([]);

  const careerOptions = [
    'Medical Doctor', 'Software Engineer', 'Lawyer', 'Accountant',
    'Nurse', 'Pharmacist', 'Civil Engineer', 'Teacher', 'Architect',
    'Agricultural Scientist'
  ];

  const searchScholarships = async () => {
    if (!career) {
      alert('Please select a career!');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/api/scholarship/find', {
        career: career
      });
      setScholarships(response.data);
    } catch (error) {
      console.error('Error:', error);
      alert('Error finding scholarships');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ color: '#1a5f2b' }}>💰 Scholarship Finder</h1>
      <p style={{ fontSize: '16px', color: '#555' }}>
        Find scholarships available for Ghanaian students
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Input Panel */}
        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '12px' }}>
          <h3>Search Scholarships</h3>

          <div style={{ marginBottom: '20px' }}>
            <label>Your Target Career</label>
            <select
              value={career}
              onChange={(e) => setCareer(e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: '1px solid #ccc' }}
            >
              <option value="">Select a career...</option>
              {careerOptions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <button
            onClick={searchScholarships}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: '#1a5f2b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Searching...' : '🔍 Find Scholarships'}
          </button>
        </div>

        {/* Results Panel */}
        <div>
          {scholarships.length > 0 && (
            <div>
              <h3>📋 Available Scholarships</h3>
              {scholarships.map((scholarship, idx) => (
                <div key={idx} style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  marginBottom: '15px',
                  border: '1px solid #e0e0e0'
                }}>
                  <h4 style={{ marginTop: 0, color: '#1a5f2b' }}>{scholarship.name}</h4>
                  <p><strong>Provider:</strong> {scholarship.provider}</p>
                  <p><strong>Amount:</strong> {scholarship.amount}</p>
                  <p><strong>Deadline:</strong> {scholarship.deadline}</p>
                  <p><strong>Eligibility:</strong> {scholarship.eligibility}</p>
                  <p><strong>Fields:</strong> {scholarship.fields.join(', ')}</p>
                  <p><strong>Level:</strong> {scholarship.level}</p>
                  {scholarship.notes && (
                    <div style={{
                      background: '#f5f5f5',
                      padding: '10px',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}>
                      <strong>📌 Note:</strong> {scholarship.notes}
                    </div>
                  )}
                  <a
                    href={scholarship.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      marginTop: '10px',
                      padding: '8px 16px',
                      background: '#1a5f2b',
                      color: 'white',
                      borderRadius: '8px',
                      textDecoration: 'none'
                    }}
                  >
                    Apply Now
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ScholarshipFinder;
