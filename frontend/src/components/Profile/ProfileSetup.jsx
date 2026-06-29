import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001' });

function ProfileSetup({ onComplete }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [regions, setRegions] = useState([]);
  const [profile, setProfile] = useState({
    role: '',
    education_level: '',
    school_type: '',
    school_name: '',
    region: '',
    district: '',
    aggregate: '',
    subjects: [],
    interests: [],
    career_goal: '',
    needs_scholarship: false,
    constraints: []
  });

  const subjectOptions = ['Biology', 'Chemistry', 'Physics', 'Elective Mathematics', 'Government', 'Literature in English', 'Accounting', 'Business Management', 'General Knowledge in Art', 'ICT'];
  const interestOptions = ['healthcare', 'technology', 'business', 'creative', 'engineering', 'law', 'education'];
  const constraintOptions = ['public_universities_only', 'needs_scholarship', 'prefers_short_programmes', 'wants_local_employment', 'prefers_technology', 'prefers_healthcare'];

  useEffect(() => {
    fetchRoles();
    fetchRegions();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await API.get('/api/profile/roles');
      setRoles(response.data.roles);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchRegions = async () => {
    try {
      const response = await API.get('/api/profile/regions');
      setRegions(response.data.regions);
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const updateProfile = (field, value) => {
    setProfile({ ...profile, [field]: value });
  };

  const toggleSubject = (subject) => {
    if (profile.subjects.includes(subject)) {
      setProfile({ ...profile, subjects: profile.subjects.filter(s => s !== subject) });
    } else {
      setProfile({ ...profile, subjects: [...profile.subjects, subject] });
    }
  };

  const toggleInterest = (interest) => {
    if (profile.interests.includes(interest)) {
      setProfile({ ...profile, interests: profile.interests.filter(i => i !== interest) });
    } else {
      setProfile({ ...profile, interests: [...profile.interests, interest] });
    }
  };

  const toggleConstraint = (constraint) => {
    if (profile.constraints.includes(constraint)) {
      setProfile({ ...profile, constraints: profile.constraints.filter(c => c !== constraint) });
    } else {
      setProfile({ ...profile, constraints: [...profile.constraints, constraint] });
    }
  };

  const createProfile = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('pathwaygh_user_id') || 'user_' + Date.now();
      localStorage.setItem('pathwaygh_user_id', userId);

      const response = await API.post('/api/profile/create', {
        user_id: userId,
        profile: {
          role: profile.role,
          education_level: profile.education_level,
          school_type: profile.school_type,
          school_name: profile.school_name,
          geographic: { region: profile.region, district: profile.district },
          academic: { aggregate: profile.aggregate ? parseInt(profile.aggregate) : null, subjects: profile.subjects },
          career: { interests: profile.interests, career_goal: profile.career_goal },
          financial: { needs_scholarship: profile.needs_scholarship, constraints: profile.constraints }
        }
      });

      localStorage.setItem('pathwaygh_profile', JSON.stringify(response.data.profile));
      onComplete && onComplete(response.data.profile);
    } catch (error) {
      console.error('Error creating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div>
            <h3>Who are you?</h3>
            <p style={{ color: '#666' }}>Select your role to get personalized guidance</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', marginTop: '15px' }}>
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => { updateProfile('role', role.id); setStep(2); }}
                  style={{
                    padding: '15px',
                    borderRadius: '12px',
                    border: profile.role === role.id ? '2px solid #1a5f2b' : '1px solid #e0e0e0',
                    background: profile.role === role.id ? '#e8f5e9' : 'white',
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontSize: '14px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '32px' }}>{role.emoji}</div>
                  <div style={{ fontWeight: 'bold', marginTop: '5px' }}>{role.name}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h3>📚 Education Level</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginTop: '15px' }}>
              {['jhs', 'shs', 'tvet', 'university', 'graduate'].map(level => (
                <button
                  key={level}
                  onClick={() => { updateProfile('education_level', level); setStep(3); }}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: profile.education_level === level ? '2px solid #1a5f2b' : '1px solid #e0e0e0',
                    background: profile.education_level === level ? '#e8f5e9' : 'white',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    fontSize: '14px',
                    fontWeight: profile.education_level === level ? 'bold' : 'normal'
                  }}
                >
                  {level.toUpperCase()}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(1)} style={{ marginTop: '15px', background: 'none', border: 'none', color: '#1a5f2b', cursor: 'pointer' }}>
              ← Back
            </button>
          </div>
        );

      case 3:
        return (
          <div>
            <h3>📍 Where are you?</h3>
            <div style={{ marginTop: '15px' }}>
              <label>Region</label>
              <select
                value={profile.region}
                onChange={(e) => updateProfile('region', e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', marginTop: '5px' }}
              >
                <option value="">Select your region...</option>
                {regions.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div style={{ marginTop: '10px' }}>
              <label>District (Optional)</label>
              <input
                type="text"
                value={profile.district}
                onChange={(e) => updateProfile('district', e.target.value)}
                placeholder="e.g., Kumasi Metro"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', marginTop: '5px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button onClick={() => setStep(2)} style={{ padding: '10px 20px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>← Back</button>
              <button onClick={() => setStep(4)} style={{ padding: '10px 20px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }} disabled={!profile.region}>Next →</button>
            </div>
          </div>
        );

      case 4:
        return (
          <div>
            <h3>📊 Academic Profile</h3>
            <div style={{ marginTop: '15px' }}>
              <label>WASSCE Aggregate (if available)</label>
              <input
                type="number"
                min="6"
                max="36"
                value={profile.aggregate}
                onChange={(e) => updateProfile('aggregate', e.target.value)}
                placeholder="e.g., 12"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', marginTop: '5px' }}
              />
            </div>
            <div style={{ marginTop: '10px' }}>
              <label>Your Subjects</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '5px' }}>
                {subjectOptions.map(subject => (
                  <button
                    key={subject}
                    onClick={() => toggleSubject(subject)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: profile.subjects.includes(subject) ? '2px solid #1a5f2b' : '1px solid #ccc',
                      background: profile.subjects.includes(subject) ? '#e8f5e9' : 'white',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button onClick={() => setStep(3)} style={{ padding: '10px 20px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>← Back</button>
              <button onClick={() => setStep(5)} style={{ padding: '10px 20px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Next →</button>
            </div>
          </div>
        );

      case 5:
        return (
          <div>
            <h3>🎯 Career Interests</h3>
            <div style={{ marginTop: '15px' }}>
              <label>Career Goal (Optional)</label>
              <input
                type="text"
                value={profile.career_goal}
                onChange={(e) => updateProfile('career_goal', e.target.value)}
                placeholder="e.g., Medical Doctor, Software Engineer"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', marginTop: '5px' }}
              />
            </div>
            <div style={{ marginTop: '10px' }}>
              <label>Your Interests</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '5px' }}>
                {interestOptions.map(interest => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: profile.interests.includes(interest) ? '2px solid #1a5f2b' : '1px solid #ccc',
                      background: profile.interests.includes(interest) ? '#e8f5e9' : 'white',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button onClick={() => setStep(4)} style={{ padding: '10px 20px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>← Back</button>
              <button onClick={() => setStep(6)} style={{ padding: '10px 20px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Next →</button>
            </div>
          </div>
        );

      case 6:
        return (
          <div>
            <h3>💰 Financial Preferences</h3>
            <div style={{ marginTop: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={profile.needs_scholarship}
                  onChange={(e) => updateProfile('needs_scholarship', e.target.checked)}
                />
                I need scholarship opportunities
              </label>
            </div>
            <div style={{ marginTop: '10px' }}>
              <label>Other Constraints</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '5px' }}>
                {constraintOptions.map(constraint => (
                  <button
                    key={constraint}
                    onClick={() => toggleConstraint(constraint)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '20px',
                      border: profile.constraints.includes(constraint) ? '2px solid #1a5f2b' : '1px solid #ccc',
                      background: profile.constraints.includes(constraint) ? '#e8f5e9' : 'white',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {constraint.replace(/_/g, ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button onClick={() => setStep(5)} style={{ padding: '10px 20px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>← Back</button>
              <button
                onClick={createProfile}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: '#1a5f2b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Creating...' : '✅ Complete Profile'}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '40px auto',
      padding: '30px',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.1)'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#1a5f2b', margin: 0 }}>🇬🇭 PathwayGH</h1>
        <p style={{ color: '#666' }}>Let's personalize your experience</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '15px' }}>
          {[1, 2, 3, 4, 5, 6].map(s => (
            <div
              key={s}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: s === step ? '#1a5f2b' : s < step ? '#a5d6a7' : '#e0e0e0',
                transition: 'all 0.3s'
              }}
            />
          ))}
        </div>
      </div>
      {renderStep()}
    </div>
  );
}

export default ProfileSetup;
