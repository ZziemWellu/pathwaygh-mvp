import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { getUser, setUser } from '../../constants/auth';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { useAccessibility } from '../../contexts/AccessibilityContext';
import { formatDate } from '../../utils/date';
import { Award, BookOpen, BookOpenIcon, BookOpenTextIcon, Bookmark, BookmarkIcon, BriefcaseIcon, CameraIcon, ClipboardList, ClipboardListIcon, CoinsIcon, FileTextIcon, FlameIcon, HourglassIcon, LandmarkIcon, Pencil, School, SchoolIcon, Settings, SettingsIcon, StarIcon, Target, TargetIcon, TrophyIcon, User } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';

const ProfileModule = () => {
  const { dyslexiaFont, setDyslexiaFont, textScale, setTextScale, textScales } = useAccessibility();
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
  const [certificates, setCertificates] = useState([]);
  const [copiedCertCode, setCopiedCertCode] = useState(null);
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [schoolFormMode, setSchoolFormMode] = useState(null); // null | 'create' | 'join'
  const [schoolFormValue, setSchoolFormValue] = useState('');
  const [schoolSaving, setSchoolSaving] = useState(false);
  const [guardianEmailValue, setGuardianEmailValue] = useState('');
  const [guardianEmailSaving, setGuardianEmailSaving] = useState(false);
  const [guardianPhoneValue, setGuardianPhoneValue] = useState('');
  const [guardianWhatsappOptIn, setGuardianWhatsappOptIn] = useState(false);
  const [guardianPhoneSaving, setGuardianPhoneSaving] = useState(false);

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
      const profileRes = await api.get('/api/profile/me').catch(() => ({ data: null }));
      const profileData = profileRes.data || {};
      setProfile(profileData);
      setFormData(profileData);
      setGuardianEmailValue(profileData.guardian_email || '');
      setGuardianPhoneValue(profileData.guardian_phone || '');
      setGuardianWhatsappOptIn(!!profileData.guardian_whatsapp_opt_in);

      const statsRes = await api.get('/api/dashboard/statistics').catch(() => ({ data: {} }));
      setStats(prev => ({ ...prev, ...statsRes.data }));

      const [careersRes, uniRes, schRes, certRes] = await Promise.all([
        api.get('/api/profile/saved/careers').catch(() => ({ data: { careers: [] } })),
        api.get('/api/profile/saved/universities').catch(() => ({ data: { universities: [] } })),
        api.get('/api/profile/saved/scholarships').catch(() => ({ data: { scholarships: [] } })),
        api.get('/api/certificates/me').catch(() => ({ data: { certificates: [] } })),
      ]);
      setSavedCareers(careersRes.data?.careers || []);
      setSavedUniversities(uniRes.data?.universities || []);
      setCertificates(certRes.data?.certificates || []);
      setSavedScholarships(schRes.data?.scholarships || []);

      const schoolRes = await api.get('/api/school/me').catch(() => ({ data: { school: null, is_school_admin: false } }));
      setSchoolInfo(schoolRes.data);
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
      showNotification('Profile photo updated successfully!');
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
      await api.delete('/api/profile/avatar');
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
      const response = await api.put('/api/profile/me', formData);
      setProfile(response.data.profile);
      const updatedUser = { ...user, ...formData };
      setUser(updatedUser);
      setUserState(updatedUser);
      setEditing(false);
      showNotification('Profile updated successfully!');
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
    { id: 'overview', icon: ClipboardList, label: 'Overview' },
    { id: 'academic', icon: BookOpen, label: 'Academic' },
    { id: 'goals', icon: Target, label: 'Goals' },
    { id: 'saved', icon: Bookmark, label: 'Saved' },
    { id: 'certificates', icon: Award, label: 'Certificates' },
    { id: 'school', icon: School, label: 'School' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  // App.jsx's user state (and everything gated on user.is_school_admin, like
  // the nav item and the /school-admin route) is read from the cached
  // localStorage user object, not re-fetched on its own - creating/joining a
  // school changes that on the server, so the cache must be refreshed here
  // before the reload, or the new fields would never appear until the next
  // full login.
  const refreshCachedUser = async () => {
    const me = await api.get('/api/auth/me');
    setUser(me.data.user);
  };

  const handleSaveGuardianEmail = async () => {
    setGuardianEmailSaving(true);
    try {
      const response = await api.put('/api/profile/me', { guardian_email: guardianEmailValue.trim() || null });
      setProfile(response.data.profile);
      showNotification('Parent/Guardian email saved.');
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Failed to save parent/guardian email.', 'error');
    } finally {
      setGuardianEmailSaving(false);
    }
  };

  const handleSaveGuardianWhatsapp = async () => {
    setGuardianPhoneSaving(true);
    try {
      const response = await api.put('/api/profile/me', {
        guardian_phone: guardianPhoneValue.trim() || null,
        guardian_whatsapp_opt_in: guardianWhatsappOptIn,
      });
      setProfile(response.data.profile);
      showNotification('Guardian WhatsApp number saved.');
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Failed to save guardian WhatsApp number.', 'error');
    } finally {
      setGuardianPhoneSaving(false);
    }
  };

  const handleCreateSchool = async () => {
    if (!schoolFormValue.trim()) return;
    setSchoolSaving(true);
    try {
      await api.post('/api/school/create', { name: schoolFormValue.trim() });
      await refreshCachedUser();
      showNotification('School created! Reloading...', 'success');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Failed to create school.', 'error');
      setSchoolSaving(false);
    }
  };

  const handleJoinSchool = async () => {
    if (!schoolFormValue.trim()) return;
    setSchoolSaving(true);
    try {
      await api.post('/api/school/join', { join_code: schoolFormValue.trim() });
      await refreshCachedUser();
      showNotification('Joined school! Reloading...', 'success');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      showNotification(err.response?.data?.detail || 'Failed to join school.', 'error');
      setSchoolSaving(false);
    }
  };

  const copySchoolCode = () => {
    if (!schoolInfo?.school?.join_code) return;
    navigator.clipboard.writeText(schoolInfo.school.join_code);
    showNotification('Join code copied!', 'success');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '12px' }}><HourglassIcon className="icon-inline" size="1em" aria-hidden="true" /></div>
          <p style={{ color: 'var(--gray-500)' }}>Loading profile...</p>
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
          background: notification.type === 'error' ? 'var(--danger-bg)' : 'var(--primary-bg)',
          color: notification.type === 'error' ? 'var(--danger)' : 'var(--primary)',
          border: `1px solid ${notification.type === 'error' ? 'var(--danger-border)' : 'var(--primary-border)'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'inherit' }}>✕</button>
        </div>
      )}

      <PageHeader
        icon={User}
        title="Profile"
        actions={!editing && <Button icon={Pencil} onClick={handleEdit}>Edit Profile</Button>}
      />

      <div className="card card--flush" style={{ overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{
          height: '120px',
          background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
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
                  background: 'var(--surface-sunken)',
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
                  <User size={48} color="var(--text-subtle)" aria-hidden="true" />
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
                    <CameraIcon className="icon-inline" size="1em" aria-hidden="true" /> Change
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

          </div>
        </div>

        <div style={{ padding: '16px 30px 30px 30px' }}>
          {/* Name block sits on the white card beside the avatar. It used to
              hang off the bottom of the green cover in white text, so the
              "Member since" line was cut in half by the cover's edge and the
              white "Change Photo" button vanished on the white card - only
              its camera emoji stayed visible, looking like a stray icon. */}
          <div style={{ marginLeft: '120px', minHeight: '54px', marginBottom: '24px' }}>
            <h3 style={{ color: 'var(--gray-900)', margin: 0, fontSize: '22px' }}>
              {profile?.full_name || user?.full_name || 'Student'}
            </h3>
            <p style={{ color: 'var(--gray-600)', margin: '2px 0 0 0', fontSize: '14px' }}>
              {profile?.role || 'Student'} • Member since {formatDate(profile?.created_at, { fallback: 'N/A' })}
            </p>
            {!editing && (
              <Button variant="outline" size="sm" onClick={handleAvatarClick} style={{ marginTop: '8px' }}>
                <CameraIcon className="icon-inline" size="1em" aria-hidden="true" /> Change Photo
              </Button>
            )}
          </div>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--gray-500)', marginBottom: '4px' }}>Full Name</label>
                  <input name="full_name" value={formData.full_name || ''} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--gray-500)', marginBottom: '4px' }}>Email</label>
                  <input name="email" value={formData.email || ''} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }} disabled />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--gray-500)', marginBottom: '4px' }}>School</label>
                  <input name="school" value={formData.school || ''} onChange={handleChange} placeholder="Your school name" style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--gray-500)', marginBottom: '4px' }}>Grade/Level</label>
                  <select name="grade" value={formData.grade || ''} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }}>
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
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--gray-500)', marginBottom: '4px' }}>Bio / About Me</label>
                  <textarea name="bio" value={formData.bio || ''} onChange={handleChange} placeholder="Tell us about yourself..." rows="3" style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', resize: 'vertical' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--gray-500)', marginBottom: '4px' }}>Phone Number</label>
                  <input name="phone" value={formData.phone || ''} onChange={handleChange} placeholder="+233 XX XXX XXXX" style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--gray-500)', marginBottom: '4px' }}>Location</label>
                  <input name="location" value={formData.location || ''} onChange={handleChange} placeholder="Accra, Kumasi, ..." style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--gray-500)', marginBottom: '4px' }}>Career Interests (comma separated)</label>
                  <input name="interests" value={formData.interests?.join(', ') || ''} onChange={(e) => handleArrayChange(e, 'interests')} placeholder="Engineering, Medicine, Technology, ..." style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--gray-500)', marginBottom: '4px' }}>Learning Goals (comma separated)</label>
                  <input name="goals" value={formData.goals?.join(', ') || ''} onChange={(e) => handleArrayChange(e, 'goals')} placeholder="Pass WASSCE, Study Engineering, ..." style={{ width: '100%', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '16px' }}>
              <div style={{ textAlign: 'center', padding: '12px', background: 'var(--surface-muted)', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px' }}><BookOpenIcon className="icon-inline" size="1em" aria-hidden="true" /></div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.coursesCompleted || 0}</div>
                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Courses</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: 'var(--surface-muted)', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px' }}><BookOpenTextIcon className="icon-inline" size="1em" aria-hidden="true" /></div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.totalLessons || 0}</div>
                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Lessons</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: 'var(--surface-muted)', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px' }}><FileTextIcon className="icon-inline" size="1em" aria-hidden="true" /></div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.quizzesTaken || 0}</div>
                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Quizzes</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: 'var(--surface-muted)', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px' }}><FlameIcon className="icon-inline" size="1em" aria-hidden="true" /></div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.studyStreak || 0}</div>
                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Day Streak</div>
              </div>
              <div style={{ textAlign: 'center', padding: '12px', background: 'var(--surface-muted)', borderRadius: '8px' }}>
                <div style={{ fontSize: '24px' }}><StarIcon className="icon-inline" size="1em" aria-hidden="true" /></div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.xp || 0}</div>
                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>XP</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '4px',
        borderBottom: '2px solid var(--border)',
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
              borderBottom: activeTab === tab.id ? '3px solid var(--primary)' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            <tab.icon size={16} aria-hidden="true" /> {tab.label}
          </button>
        ))}
      </div>

      <div className="card" style={{ padding: '24px' }}>
        {activeTab === 'overview' && (
          <div>
            <h3 style={{ color: 'var(--text)', marginBottom: '16px' }}><ClipboardListIcon className="icon-inline" size="1em" aria-hidden="true" /> Overview</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <p><strong style={{ color: 'var(--text-muted)' }}>Name:</strong> {profile?.full_name || user?.full_name || 'Not set'}</p>
                <p><strong style={{ color: 'var(--text-muted)' }}>Email:</strong> {profile?.email || user?.email || 'Not set'}</p>
                <p><strong style={{ color: 'var(--text-muted)' }}>Role:</strong> {profile?.role || 'Student'}</p>
                <p><strong style={{ color: 'var(--text-muted)' }}>School:</strong> {profile?.school || 'Not specified'}</p>
              </div>
              <div>
                <p><strong style={{ color: 'var(--text-muted)' }}>Grade:</strong> {profile?.grade || 'Not specified'}</p>
                <p><strong style={{ color: 'var(--text-muted)' }}>Member since:</strong> {formatDate(profile?.created_at, { fallback: 'N/A' })}</p>
                <p><strong style={{ color: 'var(--text-muted)' }}>Study Streak:</strong> <FlameIcon className="icon-inline" size="1em" aria-hidden="true" /> {stats.studyStreak || 0} days</p>
                <p><strong style={{ color: 'var(--text-muted)' }}>XP:</strong> <StarIcon className="icon-inline" size="1em" aria-hidden="true" /> {stats.xp || 0}</p>
              </div>
            </div>
            {profile?.bio && (
              <div style={{ marginTop: '12px' }}>
                <p><strong style={{ color: 'var(--text-muted)' }}><FileTextIcon className="icon-inline" size="1em" aria-hidden="true" /> Bio:</strong></p>
                <p style={{ color: 'var(--text-muted)' }}>{profile.bio}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'academic' && (
          <div>
            <h3 style={{ color: 'var(--text)', marginBottom: '16px' }}><BookOpenIcon className="icon-inline" size="1em" aria-hidden="true" /> Academic Information</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <p><strong style={{ color: 'var(--text-muted)' }}>School/Institution:</strong> {profile?.school || 'Not specified'}</p>
                <p><strong style={{ color: 'var(--text-muted)' }}>Grade/Level:</strong> {profile?.grade || 'Not specified'}</p>
                <p><strong style={{ color: 'var(--text-muted)' }}>Courses Completed:</strong> {stats.coursesCompleted || 0}</p>
              </div>
              <div>
                <p><strong style={{ color: 'var(--text-muted)' }}>Quiz Average:</strong> {stats.quizAverage || 0}%</p>
                <p><strong style={{ color: 'var(--text-muted)' }}>Subjects:</strong> {profile?.subjects?.length > 0 ? profile.subjects.join(', ') : 'No subjects added yet'}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div>
            <h3 style={{ color: 'var(--text)', marginBottom: '16px' }}><TargetIcon className="icon-inline" size="1em" aria-hidden="true" /> Goals & Interests</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <p><strong style={{ color: 'var(--text-muted)' }}>Career Interests:</strong></p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                  {profile?.interests?.length > 0 ? (
                    profile.interests.map((interest, i) => (
                      <span key={i} style={{ background: 'var(--primary-bg)', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', color: 'var(--primary)' }}>{interest}</span>
                    ))
                  ) : (
                    <span style={{ color: 'var(--gray-500)' }}>No interests added yet</span>
                  )}
                </div>
              </div>
              <div>
                <p><strong style={{ color: 'var(--text-muted)' }}>Goals:</strong></p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                  {profile?.goals?.length > 0 ? (
                    profile.goals.map((goal, i) => (
                      <span key={i} style={{ background: 'var(--warning-bg)', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', color: 'var(--warning)' }}>{goal}</span>
                    ))
                  ) : (
                    <span style={{ color: 'var(--gray-500)' }}>No goals added yet</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'saved' && (
          <div>
            <h3 style={{ color: 'var(--text)', marginBottom: '16px' }}><BookmarkIcon className="icon-inline" size="1em" aria-hidden="true" /> Saved Items</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'var(--surface-muted)', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--primary)' }}><BriefcaseIcon className="icon-inline" size="1em" aria-hidden="true" /> Careers ({savedCareers.length})</h4>
                {savedCareers.length > 0 ? (
                  savedCareers.map((career, i) => <div key={i} style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '4px 0' }}>• {career}</div>)
                ) : (
                  <span style={{ color: 'var(--gray-500)', fontSize: '13px' }}>No saved careers</span>
                )}
              </div>
              <div style={{ background: 'var(--surface-muted)', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--primary)' }}><LandmarkIcon className="icon-inline" size="1em" aria-hidden="true" /> Universities ({savedUniversities.length})</h4>
                {savedUniversities.length > 0 ? (
                  savedUniversities.map((uni, i) => <div key={i} style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '4px 0' }}>• {uni}</div>)
                ) : (
                  <span style={{ color: 'var(--gray-500)', fontSize: '13px' }}>No saved universities</span>
                )}
              </div>
              <div style={{ background: 'var(--surface-muted)', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: 'var(--primary)' }}><CoinsIcon className="icon-inline" size="1em" aria-hidden="true" /> Scholarships ({savedScholarships.length})</h4>
                {savedScholarships.length > 0 ? (
                  savedScholarships.map((sch, i) => <div key={i} style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '4px 0' }}>• {sch}</div>)
                ) : (
                  <span style={{ color: 'var(--gray-500)', fontSize: '13px' }}>No saved scholarships</span>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'certificates' && (
          <div>
            <h3 style={{ color: 'var(--text)', marginBottom: '16px' }}><TrophyIcon className="icon-inline" size="1em" aria-hidden="true" /> Certificates</h3>
            {certificates.length === 0 ? (
              <p style={{ color: 'var(--gray-500)', fontSize: '13px' }}>Complete a course to earn your first certificate.</p>
            ) : (
              certificates.map((cert) => {
                const verifyUrl = `${window.location.origin}/certificates/verify/${cert.code}`;
                return (
                  <div key={cert.code} style={{ background: 'var(--surface-muted)', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
                    <h4 style={{ margin: '0 0 4px 0', color: 'var(--primary)' }}>{cert.course_title}</h4>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--gray-500)' }}>
                      Issued {formatDate(cert.issued_at, { long: true })} · {cert.lesson_count} lessons
                    </p>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <Link to={`/certificates/${cert.course_slug}`} style={{ color: 'var(--primary)', fontSize: '13px', fontWeight: 'bold' }}>
                        View / Print
                      </Link>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(verifyUrl);
                          setCopiedCertCode(cert.code);
                          setTimeout(() => setCopiedCertCode(null), 2000);
                        }}
                        style={{ padding: '4px 10px', background: 'none', border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        {copiedCertCode === cert.code ? 'Copied!' : 'Copy verification link'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'school' && (
          <div>
            <h3 style={{ color: 'var(--text)', marginBottom: '16px' }}><SchoolIcon className="icon-inline" size="1em" aria-hidden="true" /> School</h3>
            {schoolInfo?.school ? (
              <div>
                <p><strong style={{ color: 'var(--text-muted)' }}>School:</strong> {schoolInfo.school.name}</p>
                <p>
                  <strong style={{ color: 'var(--text-muted)' }}>Join code:</strong> {schoolInfo.school.join_code}{' '}
                  <Button variant="secondary" size="sm" onClick={copySchoolCode} style={{ marginLeft: '8px' }}>
                    Copy
                  </Button>
                </p>
                {schoolInfo.is_school_admin && (
                  <a href="/school-admin" style={{ display: 'inline-block', marginTop: '12px', padding: '10px 20px', background: 'var(--primary)', color: 'white', borderRadius: '8px', textDecoration: 'none' }}>
                    Open School Admin Dashboard →
                  </a>
                )}
              </div>
            ) : (
              <div>
                <p style={{ color: 'var(--gray-500)', marginBottom: '16px' }}>You're not linked to a school yet.</p>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <Button size="sm" onClick={() => { setSchoolFormMode('join'); setSchoolFormValue(''); }}>
                    Join a School
                  </Button>
                  <Button size="sm" onClick={() => { setSchoolFormMode('create'); setSchoolFormValue(''); }}>
                    Create a School
                  </Button>
                </div>
                {schoolFormMode === 'join' && (
                  <div style={{ display: 'flex', gap: '8px', maxWidth: '400px' }}>
                    <input
                      value={schoolFormValue}
                      onChange={(e) => setSchoolFormValue(e.target.value)}
                      placeholder="Enter join code"
                      style={{ flex: 1, padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }}
                    />
                    <Button onClick={handleJoinSchool} disabled={schoolSaving}>
                      {schoolSaving ? 'Joining...' : 'Join'}
                    </Button>
                  </div>
                )}
                {schoolFormMode === 'create' && (
                  <div style={{ display: 'flex', gap: '8px', maxWidth: '400px' }}>
                    <input
                      value={schoolFormValue}
                      onChange={(e) => setSchoolFormValue(e.target.value)}
                      placeholder="School name"
                      style={{ flex: 1, padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }}
                    />
                    <Button onClick={handleCreateSchool} disabled={schoolSaving}>
                      {schoolSaving ? 'Creating...' : 'Create'}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h3 style={{ color: 'var(--text)', marginBottom: '16px' }}><SettingsIcon className="icon-inline" size="1em" aria-hidden="true" /> Settings</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <p><strong style={{ color: 'var(--text-muted)' }}>Phone Number:</strong> {profile?.phone || 'Not specified'}</p>
                <p><strong style={{ color: 'var(--text-muted)' }}>Location:</strong> {profile?.location || 'Not specified'}</p>
              </div>
              <div>
                <p style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--text-muted)' }}>Language:</strong></p>
                <LanguageSwitcher style={{ marginBottom: '16px' }} />
              </div>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <p style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--text-muted)' }}>Parent/Guardian Email:</strong></p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', maxWidth: '400px' }}>
                <input
                  type="email"
                  value={guardianEmailValue}
                  onChange={(e) => setGuardianEmailValue(e.target.value)}
                  placeholder="parent@email.com"
                  style={{ flex: 1, padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }}
                />
                <Button onClick={handleSaveGuardianEmail} disabled={guardianEmailSaving}>
                  {guardianEmailSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
              <p style={{ color: 'var(--gray-500)', fontSize: '13px' }}>
                Consent given: {profile?.consent_given_at ? formatDate(profile.consent_given_at) : 'Not recorded (account predates consent tracking)'}
                {profile?.consent_version && ` · version ${profile.consent_version}`}
              </p>
              <Link to="/privacy" style={{ color: 'var(--primary)', fontSize: '13px' }}>View Privacy Policy</Link>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <p style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--text-muted)' }}>Guardian WhatsApp Updates:</strong></p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', maxWidth: '400px' }}>
                <input
                  type="tel"
                  value={guardianPhoneValue}
                  onChange={(e) => setGuardianPhoneValue(e.target.value)}
                  placeholder="+233241234567"
                  style={{ flex: 1, padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px', cursor: 'pointer', marginBottom: '12px' }}>
                <input
                  type="checkbox"
                  checked={guardianWhatsappOptIn}
                  onChange={(e) => setGuardianWhatsappOptIn(e.target.checked)}
                  style={{ marginTop: '3px' }}
                />
                <span>My guardian has agreed to receive a periodic WhatsApp study update at this number.</span>
              </label>
              <Button onClick={handleSaveGuardianWhatsapp} disabled={guardianPhoneSaving}>
                {guardianPhoneSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>

            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <p style={{ marginBottom: '8px' }}><strong style={{ color: 'var(--text-muted)' }}>Accessibility:</strong></p>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', marginBottom: '12px' }}>
                <input
                  type="checkbox"
                  checked={dyslexiaFont}
                  onChange={(e) => setDyslexiaFont(e.target.checked)}
                />
                <span>Use a dyslexia-friendly font</span>
              </label>
              <p style={{ marginBottom: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>Text size:</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {textScales.map((scale) => (
                  <button
                    key={scale}
                    onClick={() => setTextScale(scale)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: textScale === scale ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: textScale === scale ? 'var(--primary-bg, var(--primary-bg))' : 'white',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      fontWeight: textScale === scale ? 'bold' : 'normal',
                      textTransform: 'capitalize',
                    }}
                  >
                    {scale}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileModule;
