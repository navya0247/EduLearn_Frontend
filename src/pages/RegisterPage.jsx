import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authService } from '../services/api';
import './AuthPages.css';

const RegisterPage = () => {
  const [form, setForm]       = useState({ fullName: '', email: '', password: '', role: 'STUDENT' });
  const [loading, setLoading] = useState(false);
  const navigate              = useNavigate();

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

  return (
    <div className="auth-page">
      {/* Left Banner */}
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

      {/* Right Form */}
      <div className="auth-form-panel">
        <div className="auth-form-box">
          <div className="auth-logo-small">E</div>
          <h2 className="auth-title">Create Your Account</h2>
          <p className="auth-subtitle">Fill in your details to get started for free</p>

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