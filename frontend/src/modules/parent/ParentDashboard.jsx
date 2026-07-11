import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8001' });

function ParentDashboard() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const parentId = 'parent_001';
    fetchChildren(parentId);
    fetchNotifications(parentId);
  }, []);

  const fetchChildren = async (parentId) => {
    try {
      const response = await API.get(`/api/parent/children/${parentId}`);
      setChildren(response.data.children || []);
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async (parentId) => {
    try {
      const response = await API.get(`/api/parent/notifications/${parentId}`);
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading dashboard...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#1a5f2b' }}>👨‍👩‍👧‍👦 Parent Dashboard</h2>
        <button
          onClick={() => alert('Notifications coming soon!')}
          style={{
            padding: '10px 20px',
            background: unreadCount > 0 ? '#ff5722' : '#f0f0f0',
            color: unreadCount > 0 ? 'white' : '#333',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          🔔 Notifications
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              background: 'red',
              color: 'white',
              borderRadius: '50%',
              padding: '2px 6px',
              fontSize: '10px'
            }}>
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {children.map(child => (
          <div
            key={child.child_id}
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e0e0e0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              cursor: 'pointer'
            }}
            onClick={() => alert(`Viewing ${child.child_name}'s progress`)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: '0 0 5px 0', color: '#1a5f2b' }}>{child.child_name}</h3>
              <span style={{ fontSize: '12px', color: '#888' }}>{child.relationship}</span>
            </div>
            <p style={{ fontSize: '14px', color: '#666', margin: '5px 0' }}>
              {child.grade_level} • {child.school || 'School not specified'}
            </p>
            
            <div style={{ margin: '15px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666' }}>
                <span>Overall Progress</span>
                <span style={{ fontWeight: 'bold', color: '#1a5f2b' }}>{child.overall_progress || 0}%</span>
              </div>
              <div style={{ height: '6px', background: '#e0e0e0', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${child.overall_progress || 0}%`,
                  height: '100%',
                  background: '#1a5f2b',
                  borderRadius: '3px'
                }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', fontSize: '13px', color: '#888' }}>
              <span>📚 {child.courses_enrolled || 0} courses</span>
              <span>📝 {child.lessons_completed || 0}/{child.total_lessons || 0} lessons</span>
              <span>📊 {child.quiz_score_avg || 0}% avg</span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => alert('Child linking feature coming soon!')}
        style={{
          marginTop: '20px',
          padding: '12px 24px',
          background: '#1a5f2b',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        ➕ Link New Child
      </button>
    </div>
  );
}

export default ParentDashboard;
