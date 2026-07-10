import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001' });

function CourseCatalog({ user }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ level: '', subject: '' });
  const [recommended, setRecommended] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
    if (user) {
      fetchRecommendations();
      fetchRecentActivity();
    }
  }, [filter, user]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.level) params.append('level', filter.level);
      if (filter.subject) params.append('subject', filter.subject);
      const response = await API.get(`/api/learn/courses?${params}`);
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await API.post('/api/learn/recommend', {
        user_id: user?.user_id || 'guest',
        interests: user?.career?.interests || [],
        subjects: user?.academic?.subjects || []
      });
      setRecommended(response.data.recommendations || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await API.get(`/api/learn/recent/${user?.user_id || 'guest'}`);
      setRecentActivity(response.data.activities || []);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const handleCourseClick = (courseId) => {
    navigate(`/learn/courses/${courseId}`);
  };

  const renderRecommendations = () => {
    if (!recommended.length) return null;
    return (
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ color: '#1a5f2b' }}>🤖 Recommended for You</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
          {recommended.map(course => (
            <div
              key={course.id}
              onClick={() => handleCourseClick(course.id)}
              style={{
                border: '2px solid #ffd700',
                borderRadius: '12px',
                padding: '15px',
                background: '#fff9e6',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(255,215,0,0.2)'
              }}
            >
              <h4 style={{ margin: '0 0 5px 0', color: '#1a5f2b' }}>{course.title}</h4>
              <span style={{ fontSize: '12px', color: '#666' }}>{course.subject} • {course.level}</span>
              <p style={{ fontSize: '13px', color: '#555', margin: '8px 0' }}>{course.description}</p>
              <div style={{ fontSize: '12px', color: '#888' }}>
                ⏱️ {course.duration_hours}h • {course.lesson_count || 0} lessons
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRecentActivity = () => {
    if (!recentActivity.length) return null;
    return (
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ color: '#1a5f2b' }}>📖 Continue Learning</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
          {recentActivity.map(activity => (
            <div
              key={activity.course_id}
              onClick={() => handleCourseClick(activity.course_id)}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                padding: '15px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <h4 style={{ margin: '0 0 5px 0', color: '#1a5f2b' }}>{activity.title}</h4>
              <div style={{ margin: '8px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>Progress</span>
                  <span>{activity.progress || 0}%</span>
                </div>
                <div style={{ height: '6px', background: '#e0e0e0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${activity.progress || 0}%`, height: '100%', background: '#1a5f2b' }} />
                </div>
              </div>
              <span style={{ fontSize: '12px', color: '#666' }}>
                Last: {activity.last_accessed ? new Date(activity.last_accessed).toLocaleDateString() : 'Not started'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <h2 style={{ color: '#1a5f2b' }}>📚 Learn</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>Discover courses to achieve your goals</p>

      {renderRecommendations()}
      {renderRecentActivity()}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '15px', margin: '20px 0', flexWrap: 'wrap' }}>
        <select
          value={filter.level}
          onChange={(e) => setFilter({ ...filter, level: e.target.value })}
          style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
        >
          <option value="">All Levels</option>
          <option value="jhs">JHS</option>
          <option value="shs">SHS</option>
          <option value="tvet">TVET</option>
          <option value="skills">Skills</option>
        </select>
        <select
          value={filter.subject}
          onChange={(e) => setFilter({ ...filter, subject: e.target.value })}
          style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
        >
          <option value="">All Subjects</option>
          <option value="English">English</option>
          <option value="Mathematics">Mathematics</option>
          <option value="Science">Science</option>
          <option value="Biology">Biology</option>
          <option value="Chemistry">Chemistry</option>
          <option value="Physics">Physics</option>
        </select>
      </div>

      {loading ? (
        <p>Loading courses...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {courses.map(course => (
            <div
              key={course.id}
              onClick={() => handleCourseClick(course.id)}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                padding: '20px',
                background: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <h3 style={{ margin: '0 0 8px 0', color: '#1a5f2b' }}>{course.title}</h3>
              <span style={{ display: 'inline-block', padding: '4px 12px', background: '#e8f5e9', borderRadius: '16px', fontSize: '12px' }}>
                {course.level?.toUpperCase()} • {course.subject}
              </span>
              <p style={{ fontSize: '14px', color: '#555', margin: '12px 0' }}>{course.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#888' }}>
                <span>📚 {course.lesson_count || 0} lessons</span>
                <span>⏱️ {course.duration_hours || 0}h</span>
                <span>⭐ {course.rating || 0}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CourseCatalog;
