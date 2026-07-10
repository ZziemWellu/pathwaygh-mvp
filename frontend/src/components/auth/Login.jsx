import React, { useState } from 'react';

function Login({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('pathwaygh_token', data.token);
        localStorage.setItem('pathwaygh_user', JSON.stringify(data.user));
        if (onSuccess) onSuccess(data.user);
        window.location.reload();
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '40px auto', padding: '30px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <h2 style={{ color: '#1a5f2b', textAlign: 'center' }}>Login</h2>
      
      {error && (
        <div style={{ padding: '10px', background: '#ffebee', color: '#c62828', borderRadius: '8px', marginBottom: '15px' }}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
          />
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
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <p style={{ textAlign: 'center', marginTop: '15px', color: '#666' }}>
        Don't have an account? <a href="/register" style={{ color: '#1a5f2b' }}>Register</a>
      </p>
    </div>
  );
}

export default Login;
