import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import PlanModal from './components/PlanModal';
import { getUser } from '../../constants/auth';

const PlanModule = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const user = getUser();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/plan/study-plans');
      console.log('📋 Plan response:', response.data);
      
      const data = response.data;
      let planData = [];
      if (Array.isArray(data)) planData = data;
      else if (data.plans) planData = data.plans;
      else if (data.data) planData = data.data;
      
      setPlans(planData);
    } catch (err) {
      console.error('❌ Plan error:', err);
      setError(err.message || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanCreated = (newPlan) => {
    setPlans(prev => [newPlan, ...prev]);
  };

  const handleDeletePlan = async (planId) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    
    try {
      await api.delete(`/api/plan/study-plans/${planId}`);
      setPlans(prev => prev.filter(p => p.id !== planId));
    } catch (err) {
      console.error('❌ Delete error:', err);
      alert('Failed to delete plan');
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <h2>📋 Plan</h2>
        <p>Loading plans...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <h2>📋 Plan</h2>
        <p style={{ color: 'red' }}>⚠️ {error}</p>
        <button onClick={fetchPlans} style={{ padding: '8px 16px', background: '#1a5f2b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>📋 Study Planner</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            padding: '10px 20px',
            background: '#1a5f2b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#144d21'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#1a5f2b'}
        >
          + Create Plan
        </button>
      </div>

      {plans.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
          <p style={{ fontSize: '16px' }}>No study plans yet. Create your first plan!</p>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              marginTop: '16px',
              padding: '10px 24px',
              background: '#1a5f2b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            + Create Plan
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: '12px',
                padding: '20px',
                background: 'white',
                position: 'relative',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <h3 style={{ color: '#1a5f2b', margin: '0 0 8px 0', fontSize: '17px' }}>
                  {plan.name}
                </h3>
                <button
                  onClick={() => handleDeletePlan(plan.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#888',
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: '0 4px',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#d32f2f'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#888'}
                >
                  ✕
                </button>
              </div>
              
              <p style={{ color: '#666', fontSize: '14px', margin: '0 0 12px 0' }}>
                {plan.description}
              </p>
              
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#888', flexWrap: 'wrap' }}>
                <span>📅 {plan.duration_months || plan.duration || 'N/A'} months</span>
                <span>📊 {plan.progress || 0}% complete</span>
                {plan.subjects && plan.subjects.length > 0 && (
                  <span>📚 {plan.subjects.join(', ')}</span>
                )}
              </div>
              
              <div style={{ marginTop: '12px', height: '6px', background: '#f0f0f0', borderRadius: '3px' }}>
                <div
                  style={{
                    width: `${plan.progress || 0}%`,
                    height: '100%',
                    background: '#1a5f2b',
                    borderRadius: '3px',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>

              {plan.goal && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#888' }}>
                  🎯 {plan.goal.replace('_', ' ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Plan Modal */}
      <PlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPlanCreated={handlePlanCreated}
        user={user}
      />
    </div>
  );
};

export default PlanModule;
