import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import './AuthPages.css';

const LoginPage = () => {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login }             = useAuth();
  const navigate              = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Please fill all fields'); return; }
    setLoading(true);
    try {
      const res = await authService.login(form);
      const { token, userId, fullName, email, role } = res.data;
      login(token, { userId, fullName, email, role });
      toast.success(`Welcome back, ${fullName}!`);
      if (role === 'ADMIN')       navigate('/admin/dashboard');
      else if (role === 'INSTRUCTOR') navigate('/instructor/dashboard');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      {/* Left Banner with image */}
      <div className="auth-banner">
        <div className="auth-banner-bg"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80)` }} />
        <div className="auth-banner-overlay" />
        <div className="auth-banner-content">
          <div className="banner-logo">E</div>
          <h1>Welcome Back!</h1>
          <p>Continue your learning journey and unlock your full potential with EduLearn LMS</p>
          <div className="banner-stats">
            <div className="bstat"><span>500+</span><p>Courses</p></div>
            <div className="bstat"><span>10K+</span><p>Students</p></div>
            <div className="bstat"><span>95%</span><p>Satisfaction</p></div>
          </div>
        </div>
      </div>

      {/* Right Form */}
      <div className="auth-form-panel">
        <div className="auth-form-box">
          <div className="auth-logo-small">E</div>
          <h2 className="auth-title">Sign In to EduLearn</h2>
          <p className="auth-subtitle">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Signing in...' : '🔐 Sign In'}
            </button>
          </form>

          {/* Test Credentials */}
          <div className="test-creds">
            <p className="test-title">Test Accounts</p>
            <div className="cred-row">
              <span className="badge badge-blue">STUDENT</span>
              <code>student@edulearn.com / Student@123</code>
            </div>
            <div className="cred-row">
              <span className="badge badge-purple">INSTRUCTOR</span>
              <code>instructor@edulearn.com / Instructor@123</code>
            </div>
            <div className="cred-row">
              <span className="badge badge-red">ADMIN</span>
              <code>admin@edulearn.com / Admin@123</code>
            </div>
          </div>

          <p className="auth-switch">
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;