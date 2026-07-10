import React from 'react';

function ProfileModule({ user }) {
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ color: '#1a5f2b' }}>👤 Profile</h2>
      <p style={{ color: '#888' }}>Manage your profile and preferences</p>
      
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h4>Profile Information</h4>
        <div style={{ marginTop: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
            <span style={{ color: '#666' }}>Role</span>
            <span>{user?.role || 'Student'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
            <span style={{ color: '#666' }}>Education Level</span>
            <span>{user?.education_level || 'SHS'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
            <span style={{ color: '#666' }}>Region</span>
            <span>{user?.geographic?.region || 'Not set'}</span>
          </div>
        </div>
        <button style={{ marginTop: '20px', padding: '10px 20px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Edit Profile
        </button>
      </div>
    </div>
  )
}

export default ProfileModule
