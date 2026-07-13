import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const NotificationBell = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/notifications', {
        params: { user_id: user?.id || 'test_user' }
      }).catch(() => ({ data: [] }));
      const data = Array.isArray(response.data) ? response.data : [];
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (err) {
      console.error('Notification error:', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.post(`/api/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/api/notifications/read-all', {
        user_id: user?.id || 'test_user'
      });
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark all read error:', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'course': return '📚';
      case 'quiz': return '📝';
      case 'achievement': return '🏆';
      case 'reminder': return '⏰';
      default: return '🔔';
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          position: 'relative',
          padding: '4px 8px',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#d32f2f',
            color: 'white',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '40px',
          right: '0',
          width: '380px',
          maxHeight: '400px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          border: '1px solid #e0e0e0',
          overflow: 'hidden',
          zIndex: 1000,
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8f9fa',
          }}>
            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
              🔔 Notifications ({unreadCount} unread)
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1a5f2b',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textDecoration: 'underline',
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ overflowY: 'auto', maxHeight: '320px' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#888' }}>
                <div style={{ fontSize: '32px' }}>🎉</div>
                <p>No notifications yet!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f0f0f0',
                    background: n.read ? 'white' : '#f0f7f0',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.background = n.read ? 'white' : '#f0f7f0'}
                >
                  <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
                    <span style={{ fontSize: '20px' }}>{getIcon(n.type)}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: n.read ? 'normal' : 'bold', fontSize: '14px' }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>{n.message}</div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                        {n.time ? new Date(n.time).toLocaleDateString() : 'Recently'}
                      </div>
                    </div>
                    {!n.read && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#1a5f2b',
                        flexShrink: 0,
                        marginTop: '6px',
                      }} />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => setIsOpen(false)}
            style={{
              width: '100%',
              padding: '10px',
              background: '#f8f9fa',
              border: 'none',
              borderTop: '1px solid #e0e0e0',
              cursor: 'pointer',
              fontSize: '13px',
              color: '#888',
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
