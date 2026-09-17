import React, { useState } from 'react';
import axios from 'axios';

// Използва .env за локална среда и автоматично превключва към Render в продакшън
const API_BASE = process.env.REACT_APP_API_BASE || 'https://trading-backend-5s2w.onrender.com/api';

export default function Auth({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    const endpoint = isLogin ? '/auth/login' : '/auth/register';

    axios
      .post(`${API_BASE}${endpoint}`, { username, password })
      .then((res) => {
        const userData = res.data;
        localStorage.setItem('user', JSON.stringify(userData));
        onLoginSuccess(userData);
      })
      .catch((err) => {
        const msg = err.response?.data?.message || err.response?.data || 'Authentication failed';
        setError(msg);
      });
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        {/* Lightning Icon Header */}
        <div style={styles.iconBadge}>⚡</div>

        <h2 style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        <p style={styles.subtitle}>
          {isLogin ? 'Sign in to access your trading dashboard' : 'Enter your details to get started'}
        </p>

        {error && <div style={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          </div>

          <button type="submit" style={styles.submitBtn}>
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={{ color: '#848e9c', fontSize: '14px' }}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            style={styles.switchBtn}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121214',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#1e2329',
    borderRadius: '16px',
    padding: '40px 32px',
    border: '1px solid #2b313a',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    textAlign: 'center',
  },
  iconBadge: {
    fontSize: '32px',
    marginBottom: '12px',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '24px',
    fontWeight: '700',
    color: '#eaecef',
  },
  subtitle: {
    margin: '0 0 24px 0',
    fontSize: '14px',
    color: '#848e9c',
  },
  errorBanner: {
    backgroundColor: 'rgba(246, 70, 93, 0.15)',
    color: '#f6465d',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '20px',
    border: '1px solid rgba(246, 70, 93, 0.3)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    textAlign: 'left',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: '#848e9c',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    backgroundColor: '#121214',
    border: '1px solid #2b313a',
    color: '#eaecef',
    padding: '12px 14px',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  submitBtn: {
    width: '100%',
    backgroundColor: '#f0b90b',
    color: '#000000',
    border: 'none',
    padding: '12px',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '15px',
    cursor: 'pointer',
    marginTop: '8px',
  },
  footer: {
    marginTop: '24px',
    fontSize: '14px',
  },
  switchBtn: {
    background: 'none',
    border: 'none',
    color: '#f0b90b',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    padding: 0,
  },
};