import React, { useState } from 'react';
import api from '../../../services/api';

const PlanModal = ({ isOpen, onClose, onPlanCreated, user }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_months: 3,
    goal: 'exam_preparation',
    subjects: [],
    target_exam: '',
    priority: 'medium',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);
  const [subjectInput, setSubjectInput] = useState('');

  const goals = [
    { value: 'exam_preparation', label: '📝 Exam Preparation' },
    { value: 'career_readiness', label: '💼 Career Readiness' },
    { value: 'skill_development', label: '🛠️ Skill Development' },
    { value: 'university_admission', label: '🎓 University Admission' },
    { value: 'general_improvement', label: '📚 General Improvement' },
  ];

  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubjectAdd = () => {
    if (subjectInput.trim() && !formData.subjects.includes(subjectInput.trim())) {
      setFormData(prev => ({
        ...prev,
        subjects: [...prev.subjects, subjectInput.trim()]
      }));
      setSubjectInput('');
    }
  };

  const handleSubjectRemove = (subject) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => s !== subject)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate
      if (!formData.name.trim()) {
        setError('Please enter a plan name');
        setLoading(false);
        return;
      }
      if (formData.subjects.length === 0) {
        setError('Please add at least one subject');
        setLoading(false);
        return;
      }

      // Submit to API
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || `Study plan for ${formData.goal}`,
        duration_months: parseInt(formData.duration_months),
        goal: formData.goal,
        subjects: formData.subjects,
        target_exam: formData.target_exam || null,
        priority: formData.priority,
        user_id: user?.id || 'test_user',
      };

      console.log('📤 Creating plan:', payload);

      const response = await api.post('/api/plan/study-plans/create', payload);

      if (response.data?.success) {
        onPlanCreated(response.data);
        onClose();
        // Reset form
        setFormData({
          name: '',
          description: '',
          duration_months: 3,
          goal: 'exam_preparation',
          subjects: [],
          target_exam: '',
          priority: 'medium',
        });
        setStep(1);
        setSubjectInput('');
      } else {
        setError(response.data?.message || 'Failed to create plan');
      }
    } catch (err) {
      console.error('❌ Create plan error:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to create plan');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !formData.name.trim()) {
      setError('Please enter a plan name');
      return;
    }
    setError(null);
    setStep(step + 1);
  };

  const prevStep = () => {
    setError(null);
    setStep(step - 1);
  };

  if (!isOpen) return null;

  return (
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
        zIndex: 2000,
        padding: '20px',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          padding: '32px',
          borderRadius: '16px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#1a5f2b', margin: 0, fontSize: '22px' }}>
            📋 Create Study Plan
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#888',
              padding: '0 8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                background: step >= s ? '#1a5f2b' : '#e0e0e0',
                transition: 'background 0.3s ease',
              }}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                background: '#ffebee',
                color: '#c62828',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>
                  Plan Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., WASSCE Preparation Plan"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="What do you want to achieve with this plan?"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    minHeight: '60px',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>
                  Duration (months)
                </label>
                <input
                  type="number"
                  name="duration_months"
                  value={formData.duration_months}
                  onChange={handleChange}
                  min={1}
                  max={36}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 2: Subjects & Goals */}
          {step === 2 && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>
                  Subjects *
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={subjectInput}
                    onChange={(e) => setSubjectInput(e.target.value)}
                    placeholder="e.g., Mathematics"
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSubjectAdd())}
                  />
                  <button
                    type="button"
                    onClick={handleSubjectAdd}
                    style={{
                      padding: '10px 20px',
                      background: '#1a5f2b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Add
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                  {formData.subjects.map((subject) => (
                    <span
                      key={subject}
                      style={{
                        background: '#e8f5e9',
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '13px',
                        color: '#1a5f2b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {subject}
                      <button
                        type="button"
                        onClick={() => handleSubjectRemove(subject)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#888',
                          fontSize: '14px',
                          padding: '0',
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                {formData.subjects.length === 0 && (
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                    Add at least one subject to continue
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>
                  Goal
                </label>
                <select
                  name="goal"
                  value={formData.goal}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'white',
                  }}
                >
                  {goals.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>
                  Target Exam (optional)
                </label>
                <input
                  type="text"
                  name="target_exam"
                  value={formData.target_exam}
                  onChange={handleChange}
                  placeholder="e.g., WASSCE, BECE, University Entrance"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>
          )}

          {/* Step 3: Review & Submit */}
          {step === 3 && (
            <div>
              <div
                style={{
                  background: '#f8f9fa',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                }}
              >
                <h4 style={{ color: '#1a5f2b', margin: '0 0 8px 0' }}>Plan Summary</h4>
                <div style={{ fontSize: '14px', color: '#555' }}>
                  <p><strong>Name:</strong> {formData.name}</p>
                  <p><strong>Duration:</strong> {formData.duration_months} months</p>
                  <p><strong>Goal:</strong> {goals.find(g => g.value === formData.goal)?.label}</p>
                  <p><strong>Subjects:</strong> {formData.subjects.join(', ') || 'None'}</p>
                  {formData.target_exam && <p><strong>Target Exam:</strong> {formData.target_exam}</p>}
                  <p><strong>Priority:</strong> {formData.priority}</p>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'white',
                  }}
                >
                  {priorities.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', gap: '12px' }}>
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                style={{
                  padding: '10px 24px',
                  background: '#f0f0f0',
                  color: '#333',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                ← Back
              </button>
            )}
            {step < 3 && (
              <button
                type="button"
                onClick={nextStep}
                style={{
                  padding: '10px 24px',
                  background: '#1a5f2b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginLeft: 'auto',
                }}
              >
                Next →
              </button>
            )}
            {step === 3 && (
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '10px 24px',
                  background: loading ? '#ccc' : '#1a5f2b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  marginLeft: 'auto',
                  minWidth: '120px',
                }}
              >
                {loading ? 'Creating...' : '✅ Create Plan'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlanModal;
