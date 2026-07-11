/**
 * Plan Module - Complete Implementation
 * Connects to backend /api/plan endpoints using shared API client
 */

import React, { useState, useEffect } from 'react';
import API from '../../services/api';

const PlanModule = ({ user }) => {
  const [plans, setPlans] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('plans');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    duration_months: 3,
    subjects: [{ id: 'math', name: 'Mathematics', hours_per_week: 4 }]
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [plansRes, roadmapsRes, templatesRes] = await Promise.all([
        API.get('/api/plan/study-plans'),
        API.get('/api/plan/roadmaps'),
        API.get('/api/plan/templates'),
      ]);

      if (plansRes.data.success) setPlans(plansRes.data.data || []);
      if (roadmapsRes.data.success) setRoadmaps(roadmapsRes.data.data || []);
      if (templatesRes.data.success) setTemplates(templatesRes.data.data || []);
    } catch (err) {
      setError('Failed to load plan data: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await API.post('/api/plan/study-plans/create', newPlan);
      if (response.data.success) {
        setShowCreateForm(false);
        setNewPlan({
          name: '',
          description: '',
          duration_months: 3,
          subjects: [{ id: 'math', name: 'Mathematics', hours_per_week: 4 }]
        });
        await fetchAllData();
      } else {
        setError('Failed to create plan: ' + response.data.message);
      }
    } catch (err) {
      setError('Failed to create plan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    setLoading(true);
    try {
      const response = await API.delete(`/api/plan/study-plans/${planId}`);
      if (response.data.success) {
        setSelectedPlan(null);
        await fetchAllData();
      } else {
        setError('Failed to delete plan: ' + response.data.message);
      }
    } catch (err) {
      setError('Failed to delete plan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProgress = async (planId, progress) => {
    try {
      const response = await API.put(`/api/plan/study-plans/${planId}/progress`, { progress });
      if (response.data.success) {
        await fetchAllData();
        if (selectedPlan?.id === planId) {
          setSelectedPlan(response.data.data);
        }
      }
    } catch (err) {
      setError('Failed to update progress: ' + err.message);
    }
  };

  const handleGenerateSchedule = async (planId) => {
    setLoading(true);
    try {
      const response = await API.get(
        `/api/plan/study-plans/${planId}/schedule?start_date=${new Date().toISOString().split('T')[0]}`
      );
      if (response.data.success) {
        alert('Schedule generated! Check the plan details.');
        console.log('Schedule:', response.data.data);
      } else {
        setError('Failed to generate schedule: ' + response.data.message);
      }
    } catch (err) {
      setError('Failed to generate schedule: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Render loading state
  if (loading && plans.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>📋 Loading your study plans...</h2>
        <p>Please wait...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#d32f2f' }}>
        <h2>❌ Error</h2>
        <p>{error}</p>
        <button onClick={fetchAllData} style={{ padding: '10px 20px', marginTop: '10px', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    );
  }

  // Render plan detail view
  if (selectedPlan) {
    return (
      <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
        <button
          onClick={() => setSelectedPlan(null)}
          style={{ padding: '8px 16px', marginBottom: '20px', cursor: 'pointer', background: '#f0f0f0', border: 'none', borderRadius: '4px' }}
        >
          ← Back to Plans
        </button>
        <h2 style={{ color: '#1a5f2b' }}>{selectedPlan.name}</h2>
        <p style={{ color: '#666' }}>{selectedPlan.description}</p>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', margin: '15px 0' }}>
          <span>📅 {selectedPlan.duration_months} months</span>
          <span>📊 Progress: {selectedPlan.progress || 0}%</span>
          <span>Status: {selectedPlan.status}</span>
        </div>

        <div style={{ margin: '20px 0', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Update Progress</h4>
          <input
            type="range"
            min="0"
            max="100"
            value={selectedPlan.progress || 0}
            onChange={(e) => handleUpdateProgress(selectedPlan.id, parseInt(e.target.value))}
            style={{ width: '200px' }}
          />
          <span style={{ marginLeft: '10px', fontWeight: 'bold' }}>{selectedPlan.progress || 0}%</span>
        </div>

        <div style={{ margin: '20px 0' }}>
          <h4>Subjects</h4>
          {selectedPlan.subjects?.map((subject) => (
            <div key={subject.id} style={{ padding: '10px', border: '1px solid #ddd', margin: '5px 0', borderRadius: '4px', background: '#fafafa' }}>
              <strong>{subject.name}</strong> - {subject.hours_per_week} hours/week
              {subject.topics && (
                <div style={{ marginTop: '5px' }}>
                  {subject.topics.map((topic, i) => (
                    <span key={i} style={{ display: 'inline-block', padding: '2px 8px', background: '#e0e0e0', margin: '2px', borderRadius: '4px', fontSize: '12px' }}>
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedPlan.milestones?.length > 0 && (
          <div style={{ margin: '20px 0' }}>
            <h4>Milestones</h4>
            {selectedPlan.milestones.map((milestone, i) => (
              <div key={i} style={{ padding: '8px', borderLeft: '3px solid #1a5f2b', margin: '5px 0', background: '#f9f9f9' }}>
                Week {milestone.week}: {milestone.goal}
              </div>
            ))}
          </div>
        )}

        <div style={{ margin: '20px 0', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleGenerateSchedule(selectedPlan.id)}
            style={{ padding: '10px 20px', cursor: 'pointer', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            📅 Generate Schedule
          </button>
          <button
            onClick={() => handleDeletePlan(selectedPlan.id)}
            style={{ padding: '10px 20px', cursor: 'pointer', background: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            🗑️ Delete Plan
          </button>
        </div>
      </div>
    );
  }

  // Render create form
  if (showCreateForm) {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ color: '#1a5f2b' }}>📝 Create New Study Plan</h2>
        <form onSubmit={handleCreatePlan}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Plan Name *</label>
            <input
              type="text"
              required
              value={newPlan.name}
              onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              placeholder="e.g., WASSCE Preparation"
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Description</label>
            <textarea
              value={newPlan.description}
              onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minHeight: '80px' }}
              placeholder="Describe your study plan..."
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Duration (months) *</label>
            <input
              type="number"
              required
              min="1"
              max="24"
              value={newPlan.duration_months}
              onChange={(e) => setNewPlan({ ...newPlan, duration_months: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Subjects</label>
            {newPlan.subjects.map((subject, index) => (
              <div key={index} style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                <input
                  type="text"
                  value={subject.name}
                  onChange={(e) => {
                    const newSubjects = [...newPlan.subjects];
                    newSubjects[index].name = e.target.value;
                    setNewPlan({ ...newPlan, subjects: newSubjects });
                  }}
                  placeholder="Subject name"
                  style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
                <input
                  type="number"
                  value={subject.hours_per_week}
                  onChange={(e) => {
                    const newSubjects = [...newPlan.subjects];
                    newSubjects[index].hours_per_week = parseInt(e.target.value);
                    setNewPlan({ ...newPlan, subjects: newSubjects });
                  }}
                  placeholder="Hours/week"
                  style={{ width: '100px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const newSubjects = newPlan.subjects.filter((_, i) => i !== index);
                    setNewPlan({ ...newPlan, subjects: newSubjects });
                  }}
                  style={{ padding: '8px 12px', background: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setNewPlan({
                  ...newPlan,
                  subjects: [...newPlan.subjects, { id: `subject_${Date.now()}`, name: '', hours_per_week: 0 }]
                });
              }}
              style={{ marginTop: '10px', padding: '8px 16px', cursor: 'pointer', background: '#f0f0f0', border: 'none', borderRadius: '4px' }}
            >
              + Add Subject
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" style={{ padding: '10px 20px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Create Plan
            </button>
            <button type="button" onClick={() => setShowCreateForm(false)} style={{ padding: '10px 20px', cursor: 'pointer', background: '#f0f0f0', border: 'none', borderRadius: '4px' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Main view
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <h1 style={{ color: '#1a5f2b' }}>📋 Study Planner</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          style={{ padding: '10px 20px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}
        >
          + Create Plan
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e0e0e0', paddingBottom: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('plans')}
          style={{ padding: '8px 16px', background: activeTab === 'plans' ? '#1a5f2b' : 'none', color: activeTab === 'plans' ? 'white' : '#555', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          📚 Plans ({plans.length})
        </button>
        <button
          onClick={() => setActiveTab('roadmaps')}
          style={{ padding: '8px 16px', background: activeTab === 'roadmaps' ? '#1a5f2b' : 'none', color: activeTab === 'roadmaps' ? 'white' : '#555', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          🗺️ Roadmaps ({roadmaps.length})
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          style={{ padding: '8px 16px', background: activeTab === 'templates' ? '#1a5f2b' : 'none', color: activeTab === 'templates' ? 'white' : '#555', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          📄 Templates ({templates.length})
        </button>
      </div>

      {activeTab === 'plans' && (
        <div>
          {plans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f9f9f9', borderRadius: '8px' }}>
              <h3>No Study Plans Yet</h3>
              <p>Create your first study plan to get started!</p>
              <button
                onClick={() => setShowCreateForm(true)}
                style={{ padding: '10px 20px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}
              >
                Create First Plan
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', background: 'white' }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
                >
                  <h4 style={{ color: '#1a5f2b', margin: '0 0 10px 0' }}>{plan.name}</h4>
                  <p style={{ color: '#666', fontSize: '14px', margin: '0 0 10px 0' }}>{plan.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span>📅 {plan.duration_months}m</span>
                    <span>📊 {plan.progress || 0}%</span>
                    <span style={{ color: plan.status === 'active' ? '#1a5f2b' : '#888' }}>{plan.status}</span>
                  </div>
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ background: '#f0f0f0', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                      <div style={{ background: '#1a5f2b', width: `${plan.progress || 0}%`, height: '100%' }} />
                    </div>
                  </div>
                  <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {plan.subjects?.slice(0, 3).map((subject) => (
                      <span key={subject.id} style={{ padding: '2px 8px', background: '#f0f0f0', borderRadius: '12px', fontSize: '12px' }}>
                        {subject.name}
                      </span>
                    ))}
                    {plan.subjects?.length > 3 && (
                      <span style={{ padding: '2px 8px', background: '#f0f0f0', borderRadius: '12px', fontSize: '12px' }}>
                        +{plan.subjects.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'roadmaps' && (
        <div>
          {roadmaps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f9f9f9', borderRadius: '8px' }}>
              <h3>No Roadmaps Available</h3>
              <p>Career roadmaps will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {roadmaps.map((roadmap) => (
                <div key={roadmap.id} style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', background: 'white' }}>
                  <h4 style={{ color: '#1a5f2b', margin: '0 0 10px 0' }}>🗺️ {roadmap.name}</h4>
                  <p><strong>Career:</strong> {roadmap.career}</p>
                  <p><strong>Duration:</strong> {roadmap.total_duration}</p>
                  <div style={{ marginTop: '10px' }}>
                    {roadmap.stages?.slice(0, 3).map((stage, i) => (
                      <div key={i} style={{ padding: '5px 0', borderBottom: '1px solid #f0f0f0', fontSize: '14px' }}>
                        <strong>Stage {stage.stage}:</strong> {stage.name}
                      </div>
                    ))}
                    {roadmap.stages?.length > 3 && (
                      <div style={{ fontSize: '14px', color: '#888', marginTop: '5px' }}>
                        +{roadmap.stages.length - 3} more stages
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'templates' && (
        <div>
          {templates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f9f9f9', borderRadius: '8px' }}>
              <h3>No Templates Available</h3>
              <p>Study templates will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {templates.map((template) => (
                <div key={template.id} style={{ padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', background: 'white' }}>
                  <h4 style={{ color: '#1a5f2b', margin: '0 0 10px 0' }}>📄 {template.name}</h4>
                  <p style={{ fontSize: '14px' }}>{template.description}</p>
                  <button style={{ marginTop: '10px', padding: '8px 16px', cursor: 'pointer', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '4px' }}>
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <button
          onClick={fetchAllData}
          style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '14px', background: '#f0f0f0', border: 'none', borderRadius: '4px' }}
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
};

export default PlanModule;
