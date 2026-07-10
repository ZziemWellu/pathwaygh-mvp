import React, { useState } from 'react';

function Register({ onSuccess }) {
  const [form, setForm] = useState({ email: '', full_name: '', password: '', role: 'student' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('http://localhost:8001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Registration successful! Please login.');
        setForm({ email: '', full_name: '', password: '', role: 'student' });
        if (onSuccess) onSuccess(data);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '30px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#1a5f2b', textAlign: 'center' }}>Register</h2>
      
      {error && (
        <div style={{ padding: '10px', background: '#ffebee', color: '#c62828', borderRadius: '8px', marginBottom: '15px' }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{ padding: '10px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '8px', marginBottom: '15px' }}>
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Full Name</label>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            placeholder="Your Full Name"
            required
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="your@email.com"
            required
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
            required
            minLength="6"
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Role</label>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
          >
            <option value="student">Student</option>
            <option value="parent">Parent</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: '#1a5f2b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>
      
      <p style={{ textAlign: 'center', marginTop: '15px', color: '#666' }}>
        Already have an account? <a href="/login" style={{ color: '#1a5f2b' }}>Login</a>
      </p>
    </div>
  );
}

export default Register;
