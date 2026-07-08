import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001'
});

function CourseCatalog() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ level: '', subject: '' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, [filter]);

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
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const getLevelBadge = (level) => {
    const colors = {
      jhs: '#4caf50',
      shs: '#2196f3',
      skills: '#ff9800'
    };
    return {
      label: level ? level.toUpperCase() : 'N/A',
      color: colors[level] || '#666'
    };
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>Loading courses...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ color: '#1a5f2b', margin: 0 }}>📚 Course Catalog</h2>
          <p style={{ color: '#666' }}>Browse all available courses</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <select
            value={filter.level}
            onChange={(e) => setFilter({ ...filter, level: e.target.value })}
            style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }}
          >
            <option value="">All Levels</option>
            <option value="jhs">JHS</option>
            <option value="shs">SHS</option>
            <option value="skills">Skills</option>
          </select>
          <select
            value={filter.subject}
            onChange={(e) => setFilter({ ...filter, subject: e.target.value })}
            style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }}
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
      </div>

      {courses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f5f5f5', borderRadius: '12px' }}>
          <h3 style={{ color: '#888' }}>No courses found</h3>
          <p style={{ color: '#999' }}>Try adjusting your filters or check back later</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {courses.map(course => {
            const badge = getLevelBadge(course.level);
            const lessonCount = course.lessons ? course.lessons.length : 0;
            
            return (
              <div
                key={course.id}
                onClick={() => navigate(`courses/${course.id}`)}
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '12px',
                  padding: '20px',
                  background: 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <h3 style={{ color: '#1a5f2b', margin: '0 0 8px 0' }}>{course.title}</h3>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: '16px',
                    background: badge.color + '20',
                    color: badge.color,
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}>
                    {badge.label}
                  </span>
                </div>
                <p style={{ color: '#666', fontSize: '14px', margin: '8px 0' }}>{course.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#888', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #eee' }}>
                  <span>📖 {lessonCount} lessons</span>
                  <span>⏱️ {course.duration_hours || 0}h</span>
                  <span>{course.is_published ? '✅ Published' : '📝 Draft'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CourseCatalog;
