import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { getUser } from '../../constants/auth';

const ProfileModule = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const user = getUser();

  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/profile/${user.id}`).catch(() => ({ data: null }));
      const data = response.data || {
        full_name: user?.full_name || user?.name || 'Student',
        email: user?.email || '',
        role: user?.role || 'Student',
        created_at: new Date().toISOString(),
        school: '',
        grade: '',
        subjects: [],
        interests: [],
        goals: [],
        bio: '',
        location: '',
        phone: ''
      };
      setProfile(data);
      setFormData(data);
    } catch (err) {
      console.warn('Profile not found:', err.message);
      setProfile({
        full_name: user?.full_name || user?.name || 'Student',
        email: user?.email || '',
        role: user?.role || 'Student',
        created_at: new Date().toISOString(),
        school: '',
        grade: '',
        subjects: [],
        interests: [],
        goals: [],
        bio: '',
        location: '',
        phone: ''
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await api.put(`/api/profile/${user.id}`, formData);
      setProfile(formData);
      setEditing(false);
    } catch (err) {
      console.error('Save error:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <h2>👤 Profile</h2>
        <p>Loading profile...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: '📋 Overview' },
    { id: 'academic', label: '📚 Academic' },
    { id: 'goals', label: '🎯 Goals' },
    { id: 'settings', label: '⚙️ Settings' },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#1a5f2b', margin: 0 }}>👤 Profile</h2>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            style={{
              padding: '8px 20px',
              background: '#1a5f2b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            ✏️ Edit Profile
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSave}
              style={{
                padding: '8px 20px',
                background: '#1a5f2b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              💾 Save
            </button>
            <button
              onClick={() => { setEditing(false); setFormData(profile); }}
              style={{
                padding: '8px 20px',
                background: '#f0f0f0',
                color: '#333',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e0e0e0', paddingBottom: '10px', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              background: activeTab === tab.id ? '#1a5f2b' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#333',
              border: activeTab === tab.id ? 'none' : '1px solid #e0e0e0',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px' }}>
          {/* Left Column - Avatar & Basic Info */}
          <div style={{
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '72px', marginBottom: '12px' }}>👤</div>
            <h3 style={{ color: '#1a5f2b', margin: '0 0 4px 0' }}>
              {editing ? (
                <input
                  value={formData.full_name || ''}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #e0e0e0', borderRadius: '8px', textAlign: 'center', fontSize: '18px' }}
                />
              ) : (
                profile?.full_name || user?.full_name || 'Student'
              )}
            </h3>
            <p style={{ color: '#888', margin: 0 }}>{profile?.role || 'Student'}</p>
            <p style={{ color: '#888', fontSize: '13px', marginTop: '8px' }}>{profile?.email || user?.email}</p>
            {profile?.created_at && (
              <p style={{ color: '#aaa', fontSize: '12px', marginTop: '8px' }}>
                Member since: {new Date(profile.created_at).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Right Column - Stats & Info */}
          <div style={{
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            padding: '24px',
          }}>
            <h4 style={{ color: '#333', margin: '0 0 16px 0' }}>📊 Statistics</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
              <div style={{ textAlign: 'center', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a5f2b' }}>0</div>
                <div style={{ fontSize: '12px', color: '#888' }}>Courses</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a5f2b' }}>0</div>
                <div style={{ fontSize: '12px', color: '#888' }}>Lessons</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a5f2b' }}>0</div>
                <div style={{ fontSize: '12px', color: '#888' }}>Quizzes</div>
              </div>
            </div>

            <h4 style={{ color: '#333', margin: '16px 0 8px 0' }}>📝 Bio</h4>
            {editing ? (
              <textarea
                value={formData.bio || ''}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #e0e0e0', borderRadius: '8px', minHeight: '80px' }}
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p style={{ color: '#666', margin: 0 }}>{profile?.bio || 'No bio yet. Click Edit Profile to add one.'}</p>
            )}
          </div>
        </div>
      )}

      {/* Academic Tab */}
      {activeTab === 'academic' && (
        <div style={{
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <h4 style={{ color: '#333', margin: '0 0 16px 0' }}>📚 Academic Information</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '13px' }}>School/Institution</label>
              {editing ? (
                <input
                  value={formData.school || ''}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                  placeholder="Your school name"
                />
              ) : (
                <p style={{ color: '#666', margin: 0 }}>{profile?.school || 'Not specified'}</p>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '13px' }}>Grade/Level</label>
              {editing ? (
                <input
                  value={formData.grade || ''}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  style={{ width: '100%', padding: '8px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                  placeholder="e.g., SHS 2, JHS 3"
                />
              ) : (
                <p style={{ color: '#666', margin: 0 }}>{profile?.grade || 'Not specified'}</p>
              )}
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '13px' }}>Subjects</label>
            {editing ? (
              <input
                value={formData.subjects?.join(', ') || ''}
                onChange={(e) => setFormData({ ...formData, subjects: e.target.value.split(',').map(s => s.trim()) })}
                style={{ width: '100%', padding: '8px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                placeholder="Mathematics, English, Science, ..."
              />
            ) : (
              <p style={{ color: '#666', margin: 0 }}>
                {profile?.subjects?.length > 0 ? profile.subjects.join(', ') : 'No subjects added yet'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div style={{
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <h4 style={{ color: '#333', margin: '0 0 16px 0' }}>🎯 Goals & Interests</h4>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '13px' }}>Career Interests</label>
            {editing ? (
              <input
                value={formData.interests?.join(', ') || ''}
                onChange={(e) => setFormData({ ...formData, interests: e.target.value.split(',').map(s => s.trim()) })}
                style={{ width: '100%', padding: '8px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                placeholder="Medical, Engineering, Business, ..."
              />
            ) : (
              <p style={{ color: '#666', margin: 0 }}>
                {profile?.interests?.length > 0 ? profile.interests.join(', ') : 'No interests added yet'}
              </p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '13px' }}>Goals</label>
            {editing ? (
              <input
                value={formData.goals?.join(', ') || ''}
                onChange={(e) => setFormData({ ...formData, goals: e.target.value.split(',').map(s => s.trim()) })}
                style={{ width: '100%', padding: '8px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                placeholder="Become a doctor, Study in USA, ..."
              />
            ) : (
              <p style={{ color: '#666', margin: 0 }}>
                {profile?.goals?.length > 0 ? profile.goals.join(', ') : 'No goals added yet'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div style={{
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <h4 style={{ color: '#333', margin: '0 0 16px 0' }}>⚙️ Settings</h4>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '13px' }}>Phone Number</label>
            {editing ? (
              <input
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                placeholder="+233 XX XXX XXXX"
              />
            ) : (
              <p style={{ color: '#666', margin: 0 }}>{profile?.phone || 'Not specified'}</p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '13px' }}>Location</label>
            {editing ? (
              <input
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #e0e0e0', borderRadius: '8px' }}
                placeholder="Accra, Kumasi, ..."
              />
            ) : (
              <p style={{ color: '#666', margin: 0 }}>{profile?.location || 'Not specified'}</p>
            )}
          </div>

          <div style={{ marginTop: '20px', padding: '16px', background: '#fff3e0', borderRadius: '8px' }}>
            <p style={{ color: '#e65100', margin: 0, fontSize: '13px' }}>
              ⚠️ Account settings and privacy controls coming soon.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileModule;
