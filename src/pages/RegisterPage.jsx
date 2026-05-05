import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useGoogleLogin } from '@react-oauth/google';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

const RegisterPage = () => {
  const [form, setForm]         = useState({ fullName: '', email: '', password: '', role: 'STUDENT' });
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const navigate                = useNavigate();
  const { login }               = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) { toast.error('Please fill all fields'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await authService.register(form);
      toast.success('Account created! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGLoading(true);
      try {
        const googleUserRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const googleUser = await googleUserRes.json();
        const res = await authService.googleLogin({
          email: googleUser.email,
          fullName: googleUser.name,
          googleId: googleUser.sub,
          avatarUrl: googleUser.picture
        });
        const { token, userId, fullName, email, role } = res.data;
        login(token, { userId, fullName, email, role });
        toast.success(`Welcome to EduLearn, ${fullName}!`);
        navigate('/');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Google signup failed');
      } finally { setGLoading(false); }
    },
    onError: () => toast.error('Google signup was cancelled or failed')
  });

  return (
    <div className="auth-page">
      <div className="auth-banner">
        <div className="auth-banner-bg"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&auto=format&fit=crop&q=80)` }} />
        <div className="auth-banner-overlay" />
        <div className="auth-banner-content">
          <div className="banner-logo">E</div>
          <h1>Join EduLearn Today</h1>
          <p>Start your learning journey and transform your career with 500+ expert-led courses</p>
          <div className="feature-list">
            <div className="feat-item">✅ Access 500+ expert courses</div>
            <div className="feat-item">✅ Learn at your own pace</div>
            <div className="feat-item">✅ Earn verified certificates</div>
            <div className="feat-item">✅ Get lifetime access</div>
            <div className="feat-item">✅ Learn on any device</div>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-box">
          <div className="auth-logo-small">E</div>
          <h2 className="auth-title">Create Your Account</h2>
          <p className="auth-subtitle">Fill in your details to get started for free</p>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" type="text" placeholder="Your full name"
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Min 6 characters"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>

            {/* Role Selector */}
            <div className="form-group">
              <label className="form-label">I want to join as</label>
              <div className="role-selector">
                <button type="button"
                  className={`role-btn ${form.role === 'STUDENT' ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, role: 'STUDENT' })}>
                  <span className="role-icon">🎓</span>
                  <span className="role-name">Student</span>
                  <span className="role-desc">I want to learn</span>
                </button>
                <button type="button"
                  className={`role-btn ${form.role === 'INSTRUCTOR' ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, role: 'INSTRUCTOR' })}>
                  <span className="role-icon">👨‍🏫</span>
                  <span className="role-name">Instructor</span>
                  <span className="role-desc">I want to teach</span>
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Creating Account...' : '🚀 Create Free Account'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            <span style={{ color: '#9ca3af', fontSize: 13 }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
          </div>

          {/* Google Button — below form like real websites */}
          <button
            type="button"
            onClick={() => handleGoogleLogin()}
            disabled={gLoading}
            style={{
              width: '100%',
              background: '#fff',
              border: '1.5px solid #ddd',
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: 8,
              padding: '12px 0',
              fontSize: 15,
              marginBottom: 20,
              transition: 'box-shadow 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'}
            onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}
          >
            {gLoading ? 'Signing up...' : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google" style={{ width: 20, height: 20 }} />
                Sign up with Google
              </>
            )}
          </button>

          <p className="auth-switch">
            Already have an account?{' '}
            <Link to="/login" className="auth-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;