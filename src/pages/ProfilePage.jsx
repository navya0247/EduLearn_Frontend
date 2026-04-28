import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

const ProfilePage = () => {
  const { user } = useAuth();
  const [form, setForm]       = useState({ fullName: user?.fullName || '', avatarUrl: '' });
  const [pwForm, setPwForm]   = useState({ oldPassword: '', newPassword: '' });
  const [saving, setSaving]   = useState(false);
  const [changing, setChanging] = useState(false);

  const handleProfile = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await authService.updateProfile(user.userId, form);
      toast.success('Profile updated!');
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const handlePassword = async (e) => {
    e.preventDefault(); setChanging(true);
    try {
      await authService.changePassword(user.userId, pwForm);
      toast.success('Password changed!');
      setPwForm({ oldPassword: '', newPassword: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setChanging(false); }
  };

  return (
    <div className="page-content">
      <div className="page-header"><div className="container"><h1>My Profile</h1><p>Manage your account</p></div></div>
      <div className="container" style={{ padding: '32px 20px', maxWidth: 700 }}>
        <div className="card" style={{ padding: 28, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
            <div style={{ width: 80, height: 80, background: 'var(--primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800 }}>
              {user?.fullName?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h2 style={{ marginBottom: 4 }}>{user?.fullName}</h2>
              <p style={{ color: 'var(--gray)', fontSize: 14 }}>{user?.email}</p>
              <span className={`badge ${user?.role === 'ADMIN' ? 'badge-red' : user?.role === 'INSTRUCTOR' ? 'badge-purple' : 'badge-blue'}`}>{user?.role}</span>
            </div>
          </div>
          <form onSubmit={handleProfile}>
            <h3 style={{ marginBottom: 16 }}>Update Profile</h3>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </form>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handlePassword}>
            <h3 style={{ marginBottom: 16 }}>Change Password</h3>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input className="form-input" type="password" value={pwForm.oldPassword} onChange={e => setPwForm({...pwForm, oldPassword: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-input" type="password" value={pwForm.newPassword} onChange={e => setPwForm({...pwForm, newPassword: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={changing}>{changing ? 'Changing...' : 'Change Password'}</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;