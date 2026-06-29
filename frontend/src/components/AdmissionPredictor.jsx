import React, { useState } from 'react';
import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001' });

function AdmissionPredictor() {
  const [career, setCareer] = useState('');
  const [aggregate, setAggregate] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [preferredUniversity, setPreferredUniversity] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const careerOptions = [
    'Medical Doctor', 'Software Engineer', 'Lawyer', 'Accountant',
    'Nurse', 'Pharmacist', 'Civil Engineer', 'Teacher', 'Architect'
  ];

  const subjectOptions = [
    'Biology', 'Chemistry', 'Physics', 'Elective Mathematics',
    'Government', 'Literature in English', 'Accounting', 'Business Management',
    'General Knowledge in Art', 'ICT'
  ];

  const universityOptions = [
    'University of Ghana', 'KNUST', 'UHAS', 'UCC', 'UEW', 'UPSA',
    'Ashesi', 'GIMPA', 'Central University', 'GCTU'
  ];

  const handleSubjectToggle = (subject) => {
    if (subjects.includes(subject)) {
      setSubjects(subjects.filter(s => s !== subject));
    } else {
      setSubjects([...subjects, subject]);
    }
  };

  const predictChance = async () => {
    if (!career || !aggregate || subjects.length === 0) {
      alert('Please select a career, enter aggregate, and select subjects!');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/api/admission-chance', {
        career: career,
        aggregate: parseInt(aggregate),
        subjects: subjects,
        preferred_university: preferredUniversity || undefined
      });
      setResult(response.data);
    } catch (error) {
      console.error('Error:', error);
      alert('Error predicting admission chance. Make sure backend is running!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ color: '#1a5f2b' }}>🎯 Admission Probability Predictor</h1>
      <p style={{ fontSize: '16px', color: '#555' }}>
        Enter your profile to see your chances of admission to Ghanaian universities
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Input Panel */}
        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '12px' }}>
          <h3>Your Profile</h3>

          <div style={{ marginBottom: '20px' }}>
            <label>Target Career</label>
            <select
              value={career}
              onChange={(e) => setCareer(e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: '1px solid #ccc' }}
            >
              <option value="">Select a career...</option>
              {careerOptions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>WASSCE Aggregate (lower is better)</label>
            <input
              type="number"
              min="6"
              max="36"
              value={aggregate}
              onChange={(e) => setAggregate(e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: '1px solid #ccc' }}
              placeholder="e.g., 12"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>Your Subjects</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
              {subjectOptions.map(subject => (
                <button
                  key={subject}
                  onClick={() => handleSubjectToggle(subject)}
                  style={{
                    padding: '8px 16px',
                    background: subjects.includes(subject) ? '#1a5f2b' : 'white',
                    color: subjects.includes(subject) ? 'white' : '#333',
                    border: '1px solid #ccc',
                    borderRadius: '20px',
                    cursor: 'pointer'
                  }}
                >
                  {subject}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label>Preferred University (Optional)</label>
            <select
              value={preferredUniversity}
              onChange={(e) => setPreferredUniversity(e.target.value)}
              style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: '1px solid #ccc' }}
            >
              <option value="">Any university</option>
              {universityOptions.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <button
            onClick={predictChance}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: '#1a5f2b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Calculating...' : '🎯 Predict Admission Chance'}
          </button>
        </div>

        {/* Results Panel */}
        <div>
          {result && (
            <div>
              <h3>📊 Admission Probability</h3>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                Based on real Ghanaian university admission data
              </p>

              {result.best_match && (
                <div style={{ background: '#e8f5e9', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                  <h4 style={{ margin: 0 }}>🏆 Best Match</h4>
                  <h2 style={{ color: '#1a5f2b', margin: '10px 0' }}>{result.best_match.university}</h2>
                  <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#1a5f2b' }}>
                    {result.best_match.admission_chance}%
                  </div>
                  <p style={{ fontSize: '18px' }}>{result.best_match.status}</p>
                  <div style={{ display: 'flex', gap: '20px', marginTop: '10px', flexWrap: 'wrap' }}>
                    <span><strong>Program:</strong> {result.best_match.program}</span>
                    <span><strong>Cutoff:</strong> ≤{result.best_match.cutoff}</span>
                    <span><strong>Subjects:</strong> {result.best_match.subject_match}</span>
                  </div>
                </div>
              )}

              <h4>Other Options</h4>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {result.predictions?.map((pred, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '15px',
                      marginBottom: '10px',
                      background: 'white',
                      borderRadius: '8px',
                      border: '1px solid #e0e0e0'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{pred.university}</strong>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '20px',
                        background: pred.admission_chance >= 70 ? '#e8f5e9' :
                                  pred.admission_chance >= 50 ? '#fff3e0' : '#ffebee',
                        color: pred.admission_chance >= 70 ? '#2e7d32' :
                               pred.admission_chance >= 50 ? '#e65100' : '#c62828'
                      }}>
                        {pred.admission_chance}%
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                      {pred.program} • Cutoff: ≤{pred.cutoff} • {pred.competitive_score}
                    </div>
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      Subjects: {pred.subject_match}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdmissionPredictor;
