import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import './AuthPages.css';

const LoginPage = () => {
  const [form, setForm]         = useState({ email: '', password: '' });
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const { login }               = useAuth();
  const navigate                = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Please fill all fields'); return; }
    setLoading(true);
    try {
      const res = await authService.login(form);
      const { token, userId, fullName, email, role } = res.data;
      login(token, { userId, fullName, email, role });
      toast.success(`Welcome back, ${fullName}!`);
      if (role === 'ADMIN')           navigate('/admin/dashboard');
      else if (role === 'INSTRUCTOR') navigate('/instructor/dashboard');
      else                            navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
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
        toast.success(`Welcome, ${fullName}!`);
        if (role === 'ADMIN')           navigate('/admin/dashboard');
        else if (role === 'INSTRUCTOR') navigate('/instructor/dashboard');
        else                            navigate('/');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Google login failed');
      } finally { setGLoading(false); }
    },
    onError: () => toast.error('Google login was cancelled or failed')
  });

  return (
    <div className="auth-page">
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

      <div className="auth-form-panel">
        <div className="auth-form-box">
          <div className="auth-logo-small">E</div>
          <h2 className="auth-title">Sign In to EduLearn</h2>
          <p className="auth-subtitle">Enter your credentials to continue</p>

          {/* Email/Password Form */}
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
            {gLoading ? 'Signing in...' : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google" style={{ width: 20, height: 20 }} />
                Continue with Google
              </>
            )}
          </button>

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