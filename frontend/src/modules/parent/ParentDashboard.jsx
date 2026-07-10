import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8001' });

function ParentDashboard() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchChildren();
    fetchNotifications();
  }, []);

  const fetchChildren = async () => {
    try {
      const response = await API.get('/api/parent/parent_001/children');
      setChildren(response.data.children || []);
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await API.get('/api/parent/parent_001/notifications');
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ color: '#1a5f2b' }}>👨‍👩‍👧‍👦 Parent Portal</h2>
      <p style={{ color: '#666' }}>Monitor your children's learning progress</p>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginTop: '20px' }}>
        {/* Children List */}
        <div>
          <h3 style={{ color: '#1a5f2b' }}>📚 My Children</h3>
          {loading ? (
            <p>Loading...</p>
          ) : (
            children.map(child => (
              <div
                key={child.id}
                onClick={() => navigate(`/parent/child/${child.id}`)}
                style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '12px',
                  marginBottom: '15px',
                  border: '1px solid #e0e0e0',
                  cursor: 'pointer',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0 }}>{child.name}</h4>
                    <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                      {child.school} • {child.level}
                    </p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a5f2b' }}>
                      {child.progress}%
                    </div>
                    <div style={{ fontSize: '12px', color: '#888' }}>Progress</div>
                  </div>
                </div>
                <div style={{ marginTop: '10px', height: '6px', background: '#e0e0e0', borderRadius: '3px' }}>
                  <div style={{
                    width: `${child.progress}%`,
                    height: '100%',
                    background: '#1a5f2b',
                    borderRadius: '3px'
                  }} />
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                  Last active: {new Date(child.last_active).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Notifications */}
        <div>
          <h3 style={{ color: '#1a5f2b' }}>🔔 Notifications</h3>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
            {notifications.map(notif => (
              <div
                key={notif.id}
                style={{
                  padding: '12px 0',
                  borderBottom: '1px solid #f0f0f0',
                  opacity: notif.read ? 0.7 : 1
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{notif.title}</div>
                <div style={{ fontSize: '13px', color: '#666' }}>{notif.message}</div>
                <div style={{ fontSize: '11px', color: '#888' }}>
                  {new Date(notif.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <p style={{ color: '#888', textAlign: 'center' }}>No notifications</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ParentDashboard;
