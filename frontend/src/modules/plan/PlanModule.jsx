import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { CalendarDaysIcon, ChartColumnIcon, ClipboardList, ClipboardListIcon, Plus, TargetIcon, TriangleAlertIcon } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';

// Goals are stored in more than one shape - seeded plans use
// "exam_preparation", the create form saves "exam preparation", and the
// API default is "general_improvement" - so normalise before display
// instead of showing students a raw code like "exam_preparation".
const formatGoal = (goal) =>
  goal
    .replace(/_/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const PlanModule = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_months: 3,
    subjects: [],
    goal: '',
  });
  const [saving, setSaving] = useState(false);

  // Subject options
  const subjectOptions = [
    'Mathematics', 'English Language', 'Integrated Science', 
    'Biology', 'Chemistry', 'Physics', 'Social Studies',
    'History', 'Geography', 'French', 'ICT'
  ];

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/plan/study-plans');
      console.log('Plan response:', response.data);
      
      const data = response.data;
      let planData = [];
      if (Array.isArray(data)) planData = data;
      else if (data.plans) planData = data.plans;
      else if (data.data) planData = data.data;
      
      setPlans(planData);
    } catch (err) {
      console.error('Plan error:', err);
      setError(err.message || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      name: '',
      description: '',
      duration_months: 3,
      subjects: [],
      goal: '',
    });
    setStep(1);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setStep(1);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubjectToggle = (subject) => {
    setFormData(prev => {
      const subjects = prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject];
      return { ...prev, subjects };
    });
  };

  const handleNext = () => {
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleDelete = async (planId) => {
    if (!window.confirm('Delete this plan? This cannot be undone.')) return;
    try {
      await api.delete(`/api/plan/study-plans/${planId}`);
      await fetchPlans();
    } catch (err) {
      console.error('Delete plan error:', err);
      alert(err.response?.status === 403 ? "You can't delete this plan." : 'Failed to delete plan. Please try again.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        duration_months: parseInt(formData.duration_months),
        subjects: formData.subjects,
        goal: formData.goal,
        progress: 0,
        status: 'active'
      };
      
      const response = await api.post('/api/plan/study-plans/create', payload);
      console.log('Plan created:', response.data);
      
      // Refresh plans
      await fetchPlans();
      handleCloseModal();
    } catch (err) {
      console.error('Create plan error:', err);
      alert('Failed to create plan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <PageHeader icon={ClipboardList} title="Study Planner" />
        <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Loading plans...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <PageHeader icon={ClipboardList} title="Study Planner" />
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p style={{ color: 'var(--danger)' }}><TriangleAlertIcon className="icon-inline" size="1em" aria-hidden="true" /> {error}</p>
          <Button onClick={fetchPlans}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <PageHeader
        icon={ClipboardList}
        title="Study Planner"
        actions={<Button icon={Plus} onClick={handleOpenModal}>New Plan</Button>}
      />

      {plans.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray-500)' }}>
          <p>No study plans yet. Create your first plan!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {plans.map((plan) => (
            <div className="card" key={plan.id} style={{ padding: '20px', position: 'relative', transition: 'all 0.2s ease' }}>
              <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-500)', fontSize: '16px' }}
                  onClick={() => handleDelete(plan.id)}
                  aria-label={`Delete ${plan.name}`}
                >
                  ✕
                </button>
              </div>
              <h3 style={{ color: 'var(--primary)', margin: '0 0 8px 0', paddingRight: '24px' }}>
                {plan.name}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '0 0 8px 0' }}>
                {plan.description}
              </p>
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--gray-500)', flexWrap: 'wrap' }}>
                <span><CalendarDaysIcon className="icon-inline" size="1em" aria-hidden="true" /> {plan.duration_months || plan.duration || 'N/A'} months</span>
                <span><ChartColumnIcon className="icon-inline" size="1em" aria-hidden="true" /> {plan.progress || 0}% complete</span>
              </div>
              {plan.subjects && plan.subjects.length > 0 && (
                <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {plan.subjects.map((subject, i) => (
                    <span key={i} style={{ background: 'var(--surface-sunken)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      {subject}
                    </span>
                  ))}
                </div>
              )}
              {plan.goal && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--gray-500)' }}>
                  <TargetIcon className="icon-inline" size="1em" aria-hidden="true" /> {formatGoal(plan.goal)}
                </div>
              )}
              <div style={{ marginTop: '12px', height: '6px', background: 'var(--surface-sunken)', borderRadius: '3px' }}>
                <div
                  style={{
                    width: `${plan.progress || 0}%`,
                    height: '100%',
                    background: 'var(--primary)',
                    borderRadius: '3px',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Plan Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              background: 'white',
              padding: '30px',
              borderRadius: '16px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: 'var(--primary)', margin: 0 }}><ClipboardListIcon className="icon-inline" size="1em" aria-hidden="true" /> Create Study Plan</h2>
              <button
                onClick={handleCloseModal}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--gray-500)' }}
              >
                ✕
              </button>
            </div>

            {step === 1 && (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                    Plan Name <span style={{ color: 'red' }}>*</span>
                  </label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., WASSCE Preparation Plan"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                    required
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="What do you want to achieve with this plan?"
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                    Duration (months)
                  </label>
                  <input
                    type="number"
                    name="duration_months"
                    value={formData.duration_months}
                    onChange={handleChange}
                    min="1"
                    max="36"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                    Goal
                  </label>
                  <select
                    name="goal"
                    value={formData.goal}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="">Select a goal</option>
                    <option value="exam preparation">Exam Preparation</option>
                    <option value="university admission">University Admission</option>
                    <option value="career readiness">Career Readiness</option>
                    <option value="skill development">Skill Development</option>
                    <option value="personal growth">Personal Growth</option>
                  </select>
                </div>

                <Button onClick={handleNext} disabled={!formData.name} style={{ width: '100%' }}>
                  Next →
                </Button>
              </div>
            )}

            {step === 2 && (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>
                    Select Subjects
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {subjectOptions.map((subject) => (
                      <label
                        key={subject}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          background: formData.subjects.includes(subject) ? 'var(--primary-bg)' : 'var(--surface-muted)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          border: formData.subjects.includes(subject) ? '1px solid var(--primary)' : '1px solid var(--border)',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.subjects.includes(subject)}
                          onChange={() => handleSubjectToggle(subject)}
                          style={{ accentColor: 'var(--primary)' }}
                        />
                        {subject}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <Button variant="secondary" onClick={handleBack} style={{ flex: 1 }}>
                    ← Back
                  </Button>
                  <Button onClick={handleSave} disabled={saving} style={{ flex: 2 }}>
                    {saving ? 'Creating...' : 'Create Plan'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanModule;
