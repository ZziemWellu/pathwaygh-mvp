import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { getUser, setUser } from '../../constants/auth';

const ProfileModule = () => {
  const [user, setUserState] = useState(getUser());
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formData, setFormData] = useState({});
  const [tempAvatar, setTempAvatar] = useState(null);
  const fileInputRef = useRef(null);
  const [notification, setNotification] = useState(null);
  const [stats, setStats] = useState({
    coursesCompleted: 0,
    totalLessons: 0,
    quizzesTaken: 0,
    quizAverage: 0,
    studyStreak: 0,
    xp: 0,
    badges: []
  });
  const [savedCareers, setSavedCareers] = useState([]);
  const [savedUniversities, setSavedUniversities] = useState([]);
  const [savedScholarships, setSavedScholarships] = useState([]);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const userId = user?.id || 'test';
      const profileRes = await api.get(`/api/profile/${userId}`).catch(() => ({ data: null }));
      const profileData = profileRes.data || {};
      setProfile(profileData);
      setFormData(profileData);

      const statsRes = await api.get('/api/dashboard/statistics', { 
        params: { user_id: userId } 
      }).catch(() => ({ data: {} }));
      setStats(prev => ({ ...prev, ...statsRes.data }));

      const [careersRes, uniRes, schRes] = await Promise.all([
        api.get('/api/profile/saved/careers').catch(() => ({ data: [] })),
        api.get('/api/profile/saved/universities').catch(() => ({ data: [] })),
        api.get('/api/profile/saved/scholarships').catch(() => ({ data: [] })),
      ]);
      setSavedCareers(careersRes.data || []);
      setSavedUniversities(uniRes.data || []);
      setSavedScholarships(schRes.data || []);
    } catch (err) {
      console.error('Profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      showNotification('Please upload a JPG, PNG, WebP, or GIF image.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification('Image must be less than 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setTempAvatar(event.target.result);
    };
    reader.readAsDataURL(file);

    await uploadAvatar(file);
  };

  const uploadAvatar = async (file) => {
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('user_id', user?.id || 'test');

    try {
      const response = await api.post('/api/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      const avatarUrl = response.data.avatar_url;
      setProfile(prev => ({ ...prev, avatar_url: avatarUrl }));
      setTempAvatar(null);
      const updatedUser = { ...user, avatar_url: avatarUrl };
      setUser(updatedUser);
      setUserState(updatedUser);
      showNotification('✅ Profile photo updated successfully!');
    } catch (err) {
      console.error('Upload error:', err);
      showNotification('Failed to upload photo. Please try again.', 'error');
      setTempAvatar(null);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm('Remove your profile photo?')) return;
    try {
      await api.delete('/api/profile/avatar', { params: { user_id: user?.id || 'test' } });
      setProfile(prev => ({ ...prev, avatar_url: null }));
      const updatedUser = { ...user, avatar_url: null };
      setUser(updatedUser);
      setUserState(updatedUser);
      showNotification('Profile photo removed.');
    } catch (err) {
      console.error('Remove avatar error:', err);
      showNotification('Failed to remove photo.', 'error');
    }
  };

  const handleEdit = () => {
    setFormData(profile || {});
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setFormData(profile || {});
    setTempAvatar(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.put(`/api/profile/${user?.id || 'test'}`, formData);
      setProfile(response.data);
      const updatedUser = { ...user, ...formData };
      setUser(updatedUser);
      setUserState(updatedUser);
      setEditing(false);
      showNotification('✅ Profile updated successfully!');
    } catch (err) {
      console.error('Save error:', err);
      showNotification('Failed to save profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleArrayChange = (e, field) => {
    const values = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
    setFormData({ ...formData, [field]: values });
  };

  const getAvatarUrl = () => {
    if (tempAvatar) return tempAvatar;
    if (profile?.avatar_url) return profile.avatar_url;
    return null;
  };

  const tabs = [
    { id: 'overview', icon: '📋', label: 'Overview' },
    { id: 'academic', icon: '📚', label: 'Academic' },
    { id: 'goals', icon: '🎯', label: 'Goals' },
    { id: 'saved', icon: '💾', label: 'Saved' },
    { id: 'settings', icon: '⚙️', label: 'Settings' },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}>⏳</div>
          <p style={{ color: '#888' }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {notification && (
        <div style={{
          padding: '12px 20px',
          borderRadius: '8px',
          marginBottom: '16px',
          background: notification.type === 'error' ? '#ffebee' : '#e8f5e9',
          color: notification.type === 'error' ? '#c62828' : '#1a5f2b',
          border: `1px solid ${notification.type === 'error' ? '#ef9a9a' : '#a5d6a7'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'inherit' }}>✕</button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#1a5f2b' }}>👤 Profile</h2>
        {!editing && (
          <button onClick={handleEdit} style={{ padding: '8px 20px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ✏️ Edit Profile
          </button>
        )}
      </div>

      <div style={{
        background: 'white',
        borderRadius: '16px',
        border: '1px solid #e0e0e0',
        overflow: 'hidden',
        marginBottom: '24px'
      }}>
        <div style={{
          height: '120px',
          background: 'linear-gradient(135deg, #1a5f2b, #2d8a4e)',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            bottom: '-50px',
            left: '30px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '20px'
          }}>
            <div style={{ position: 'relative' }}>
              <div
                onClick={!editing ? handleAvatarClick : undefined}
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: '#f0f0f0',
                  border: '4px solid white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  cursor: !editing ? 'pointer' : 'default',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => { if (!editing) e.currentTarget.style.opacity = '0.8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                {getAvatarUrl() ? (
                  <img src={getAvatarUrl()} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  '👤'
                )}
                {!editing && !uploading && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    fontSize: '10px',
                    textAlign: 'center',
                    padding: '4px 0',
                    opacity: 0,
                    transition: 'opacity 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}>
                    📷 Change
                  </div>
                )}
              </div>
              {uploading && (
                <div style={{
                  position: 'absolute',
                  bottom: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.8)',
                  color: 'white',
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  whiteSpace: 'nowrap'
                }}>
                  Uploading {uploadProgress}%
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileSelect} style={{ display: 'none' }} disabled={uploading} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ color: 'white', margin: 0, fontSize: '22px' }}>
                {profile?.full_name || user?.full_name || 'Student'}
              </h3>
              {/* FIXED: Changed text color so it's visible */}
              <p style={{ color: '#e0e0e0', margin: '2px 0 0 0', fontSize: '14px' }}>
                {profile?.role || 'Student'} • Member since: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
              </p>
              {!editing && (
                <button
                  onClick={handleAvatarClick}
                  style={{
                    background: 'rgba(255,255,255,0.25)',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '4px',
                    padding: '2px 12px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    marginTop: '4px',
                    fontWeight: '500'
                  }}
                >
                  📷 Change Photo
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: '70px 30px 30px 30px' }}>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#888', marginBottom: '4px' }}>Full Name</label>
                  <input name="full_name" value={formData.full_name || ''} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#888', marginBottom: '4px' }}>Email</label>
                  <input name="email" value={formData.email || ''} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '8px' }} disabled />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#888', marginBottom: '4px' }}>School</label>
                  <input name="school" value={formData.school || ''} onChange={handleChange} placeholder="Your school name" style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#888', marginBottom: '4px' }}>Grade/Level</label>
                  <select name="grade" value={formData.grade || ''} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                    <option value="">Select Grade</option>
                    <option value="JHS 1">JHS 1</option>
                    <option value="JHS 2">JHS 2</option>
                    <option value="JHS 3">JHS 3</option>
                    <option value="SHS 1">SHS 1</option>
                    <option value="SHS 2">SHS 2</option>
                    <option value="SHS 3">SHS 3</option>
                    <option value="University">University</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#888', marginBottom: '4px' }}>Bio / About Me</label>
                  <textarea name="bio" value={formData.bio || ''} onChange={handleChange} placeholder="Tell us about yourself..." rows="3" style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '8px', resize: 'vertical' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#888', marginBottom: '4px' }}>Phone Number</label>
                  <input name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="+233 XX XXX XXXX" style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#888', marginBottom: '4px' }}>Location</label>
                  <input name="location" value={formData.location || ''} onChange={handleChange} placeholder="Accra, Kumasi, ..." style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#888', marginBottom: '4px' }}>Career Interests (comma separated)</label>
                  <input name="interests" value={formData.interests?.join(', ') || ''} onChange={(e) => handleArrayChange(e, 'interests')} placeholder="Engineering, Medicine, Technology, ..." style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: '#888', marginBottom: '4px' }}>Learning Goals (comma separated)</label>
                  <input name="goals" value={formData.goals?.join(', ') || ''} onChange={(e) => handleArrayChange(e, 'goals')} placeholder="Pass WASSCE, Study Engineering, ..." style={{ width: '100%', padding: '10px', border: '1px solid #e0e0e0', borderRadius: '8px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button onClick={handleCancel} style={{ padding: '10px 24px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} style={{ padding: '10px 24px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving...' : '💾 Save Changes'}</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '16px' }}>
              <div style={{ textAlign: 'center', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px' }}>📚</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a5f2b' }}>{stats.coursesCompleted || 0}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>Courses</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px' }}>📖</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a5f2b' }}>{stats.totalLessons || 0}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>Lessons</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px' }}>📝</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a5f2b' }}>{stats.quizzesTaken || 0}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>Quizzes</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px' }}>🔥</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a5f2b' }}>{stats.studyStreak || 0}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>Day Streak</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px' }}>⭐</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a5f2b' }}>{stats.xp || 0}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>XP</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '4px',
        borderBottom: '2px solid #e0e0e0',
        marginBottom: '24px',
        paddingBottom: '0',
        overflowX: 'auto'
      }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '3px solid #1a5f2b' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              color: activeTab === tab.id ? '#1a5f2b' : '#666',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0', padding: '24px' }}>
        {activeTab === 'overview' && (
          <div>
            <h3 style={{ color: '#333', marginBottom: '16px' }}>📋 Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <p><strong style={{ color: '#666' }}>Name:</strong> {profile?.full_name || user?.full_name || 'Not set'}</p>
                <p><strong style={{ color: '#666' }}>Email:</strong> {profile?.email || user?.email || 'Not set'}</p>
                <p><strong style={{ color: '#666' }}>Role:</strong> {profile?.role || 'Student'}</p>
                <p><strong style={{ color: '#666' }}>School:</strong> {profile?.school || 'Not specified'}</p>
              </div>
              <div>
                <p><strong style={{ color: '#666' }}>Grade:</strong> {profile?.grade || 'Not specified'}</p>
                <p><strong style={{ color: '#666' }}>Member since:</strong> {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</p>
                <p><strong style={{ color: '#666' }}>Study Streak:</strong> 🔥 {stats.studyStreak || 0} days</p>
                <p><strong style={{ color: '#666' }}>XP:</strong> ⭐ {stats.xp || 0}</p>
              </div>
            </div>
            {profile?.bio && (
              <div style={{ marginTop: '12px' }}>
                <p><strong style={{ color: '#666' }}>📝 Bio:</strong></p>
                <p style={{ color: '#555' }}>{profile.bio}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'academic' && (
          <div>
            <h3 style={{ color: '#333', marginBottom: '16px' }}>📚 Academic Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <p><strong style={{ color: '#666' }}>School/Institution:</strong> {profile?.school || 'Not specified'}</p>
                <p><strong style={{ color: '#666' }}>Grade/Level:</strong> {profile?.grade || 'Not specified'}</p>
                <p><strong style={{ color: '#666' }}>Courses Completed:</strong> {stats.coursesCompleted || 0}</p>
              </div>
              <div>
                <p><strong style={{ color: '#666' }}>Quiz Average:</strong> {stats.quizAverage || 0}%</p>
                <p><strong style={{ color: '#666' }}>Subjects:</strong> {profile?.subjects?.length > 0 ? profile.subjects.join(', ') : 'No subjects added yet'}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div>
            <h3 style={{ color: '#333', marginBottom: '16px' }}>🎯 Goals & Interests</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <p><strong style={{ color: '#666' }}>Career Interests:</strong></p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                  {profile?.interests?.length > 0 ? (
                    profile.interests.map((interest, i) => (
                      <span key={i} style={{ background: '#e8f5e9', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', color: '#1a5f2b' }}>{interest}</span>
                    ))
                  ) : (
                    <span style={{ color: '#888' }}>No interests added yet</span>
                  )}
                </div>
              </div>
              <div>
                <p><strong style={{ color: '#666' }}>Goals:</strong></p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                  {profile?.goals?.length > 0 ? (
                    profile.goals.map((goal, i) => (
                      <span key={i} style={{ background: '#fff3e0', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', color: '#e65100' }}>{goal}</span>
                    ))
                  ) : (
                    <span style={{ color: '#888' }}>No goals added yet</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'saved' && (
          <div>
            <h3 style={{ color: '#333', marginBottom: '16px' }}>💾 Saved Items</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#1a5f2b' }}>💼 Careers ({savedCareers.length})</h4>
                {savedCareers.length > 0 ? (
                  savedCareers.map((career, i) => <div key={i} style={{ fontSize: '13px', color: '#555', padding: '4px 0' }}>• {career}</div>)
                ) : (
                  <span style={{ color: '#888', fontSize: '13px' }}>No saved careers</span>
                )}
              </div>
              <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#1a5f2b' }}>🏛️ Universities ({savedUniversities.length})</h4>
                {savedUniversities.length > 0 ? (
                  savedUniversities.map((uni, i) => <div key={i} style={{ fontSize: '13px', color: '#555', padding: '4px 0' }}>• {uni}</div>)
                ) : (
                  <span style={{ color: '#888', fontSize: '13px' }}>No saved universities</span>
                )}
              </div>
              <div style={{ background: '#f8f9fa', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#1a5f2b' }}>💰 Scholarships ({savedScholarships.length})</h4>
                {savedScholarships.length > 0 ? (
                  savedScholarships.map((sch, i) => <div key={i} style={{ fontSize: '13px', color: '#555', padding: '4px 0' }}>• {sch}</div>)
                ) : (
                  <span style={{ color: '#888', fontSize: '13px' }}>No saved scholarships</span>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h3 style={{ color: '#333', marginBottom: '16px' }}>⚙️ Settings</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <p><strong style={{ color: '#666' }}>Phone Number:</strong> {profile?.phone || 'Not specified'}</p>
                <p><strong style={{ color: '#666' }}>Location:</strong> {profile?.location || 'Not specified'}</p>
              </div>
              <div>
                <p><strong style={{ color: '#666' }}>Privacy Settings:</strong></p>
                <p style={{ color: '#888', fontSize: '13px' }}>Account settings and privacy controls coming soon.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileModule;
