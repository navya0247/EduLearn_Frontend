import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { courseService, authService, reviewService } from '../services/api';

const AdminDashboard = () => {
  const [tab, setTab]           = useState('courses');
  const [courses, setCourses]   = useState([]);
  const [users, setUsers]       = useState([]);
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [searchTerm, setSearch] = useState('');

  useEffect(() => { loadData(); }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'courses') {
        const allCourses = [];
        const seenIds    = new Set();

        // ✅ KEY FIX: Get all instructors → get their courses (includes PENDING ones)
        try {
          const instrRes    = await authService.getUsersByRole('INSTRUCTOR');
          const instructors = Array.isArray(instrRes.data) ? instrRes.data : [];

          const results = await Promise.allSettled(
            instructors.map(i => courseService.getByInstructor(i.userId))
          );

          results.forEach(r => {
            if (r.status === 'fulfilled') {
              const data = Array.isArray(r.value.data) ? r.value.data : [];
              data.forEach(c => {
                if (!seenIds.has(c.courseId)) {
                  seenIds.add(c.courseId);
                  allCourses.push(c);
                }
              });
            }
          });
        } catch { }

        // Also add any approved courses not already included
        try {
          const pubRes  = await courseService.getPublished();
          const pubData = Array.isArray(pubRes.data) ? pubRes.data : [];
          pubData.forEach(c => {
            if (!seenIds.has(c.courseId)) {
              seenIds.add(c.courseId);
              allCourses.push(c);
            }
          });
        } catch { }

        setCourses(allCourses);

      } else if (tab === 'users') {
        const [s, i, a] = await Promise.all([
          authService.getUsersByRole('STUDENT'),
          authService.getUsersByRole('INSTRUCTOR'),
          authService.getUsersByRole('ADMIN'),
        ]);
        setUsers([...s.data, ...i.data, ...a.data]);

      } else if (tab === 'reviews') {
        const res = await reviewService.getPending();
        setReviews(Array.isArray(res.data) ? res.data : []);
      }
    } catch { }
    finally { setLoading(false); }
  };

  const handleApprove = async (id) => {
    try {
      await courseService.approve(id);
      toast.success('✅ Course approved and visible in catalogue!');
      setCourses(prev => prev.map(c =>
        c.courseId === id ? { ...c, isApproved: true } : c));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (id) => {
    try {
      await courseService.reject(id);
      toast.success('Course rejected');
      setCourses(prev => prev.map(c =>
        c.courseId === id ? { ...c, isApproved: false, isPublished: false } : c));
    } catch { toast.error('Failed to reject'); }
  };

  const handleSuspend = async (id) => {
    try {
      await authService.suspendUser(id);
      toast.success('User suspended');
      setUsers(prev => prev.map(u =>
        u.userId === id ? { ...u, isActive: false } : u));
    } catch { toast.error('Failed'); }
  };

  const handleReactivate = async (id) => {
    try {
      await authService.reactivateUser(id);
      toast.success('User reactivated');
      setUsers(prev => prev.map(u =>
        u.userId === id ? { ...u, isActive: true } : u));
    } catch { toast.error('Failed'); }
  };

  const handleApproveReview = async (id) => {
    try {
      await reviewService.approve(id);
      toast.success('Review approved!');
      setReviews(prev => prev.filter(r => r.reviewId !== id));
    } catch { toast.error('Failed'); }
  };

  const handleHideReview = async (id) => {
    try {
      await reviewService.hide(id);
      toast.success('Review hidden');
      setReviews(prev => prev.filter(r => r.reviewId !== id));
    } catch { toast.error('Failed'); }
  };

  const filteredUsers   = users.filter(u =>
    u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const pendingCourses  = courses.filter(c => c.isPublished && !c.isApproved);
  const approvedCourses = courses.filter(c => c.isApproved);

  const stats = [
    { icon: '📚', label: 'Total Courses',    value: courses.length,        color: 'var(--primary)'   },
    { icon: '⏳', label: 'Pending Approval', value: pendingCourses.length, color: 'var(--warning)'   },
    { icon: '👥', label: 'Total Users',      value: users.length,          color: 'var(--secondary)' },
    { icon: '💬', label: 'Pending Reviews',  value: reviews.length,        color: 'var(--danger)'    },
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="container">
          <h1>⚙️ Admin Dashboard</h1>
          <p>Manage courses, users and reviews across the platform</p>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 20px' }}>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: 32 }}>
          {stats.map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-card-icon">{s.icon}</div>
              <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid var(--border)', marginBottom: 24 }}>
          {[
            { key: 'courses', label: '📚 Courses' },
            { key: 'users',   label: '👥 Users'   },
            { key: 'reviews', label: '💬 Reviews'  },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                padding: '10px 20px', border: 'none', background: 'none',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
                borderBottom: tab === t.key ? '3px solid var(--primary)' : '3px solid transparent',
                color: tab === t.key ? 'var(--primary)' : 'var(--gray)',
                marginBottom: -2,
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>

        ) : tab === 'courses' ? (
          <div>
            {/* Pending */}
            {pendingCourses.length > 0 ? (
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ color: 'var(--warning)', marginBottom: 16 }}>
                  ⏳ Pending Approval ({pendingCourses.length})
                </h3>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr><th>Course</th><th>Category</th><th>Level</th><th>Price</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {pendingCourses.map(c => (
                        <tr key={c.courseId}>
                          <td>
                            <div style={{ fontWeight: 700 }}>{c.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--gray)' }}>ID: {c.courseId}</div>
                          </td>
                          <td><span className="badge badge-blue">{c.category}</span></td>
                          <td>{c.level}</td>
                          <td><strong>{c.price > 0 ? `₹${c.price}` : 'Free'}</strong></td>
                          <td>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="btn btn-success btn-sm"
                                onClick={() => handleApprove(c.courseId)}>✅ Approve</button>
                              <button className="btn btn-danger btn-sm"
                                onClick={() => handleReject(c.courseId)}>❌ Reject</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div style={{
                background: '#f0fdf4', border: '1px solid #86efac',
                borderRadius: 8, padding: 16, marginBottom: 24,
                color: '#16a34a', fontWeight: 600
              }}>
                ✅ No pending courses — all reviewed!
              </div>
            )}

            {/* Approved */}
            <h3 style={{ marginBottom: 16 }}>✅ Approved Courses ({approvedCourses.length})</h3>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Course</th><th>Category</th><th>Level</th><th>Students</th><th>Price</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {approvedCourses.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray)' }}>No approved courses yet</td></tr>
                  ) : approvedCourses.map(c => (
                    <tr key={c.courseId}>
                      <td><div style={{ fontWeight: 700 }}>{c.title}</div></td>
                      <td><span className="badge badge-blue">{c.category}</span></td>
                      <td>{c.level}</td>
                      <td><strong>{c.enrollmentCount || 0}</strong></td>
                      <td><strong>{c.price > 0 ? `₹${c.price}` : 'Free'}</strong></td>
                      <td>
                        <button className="btn btn-warning btn-sm"
                          onClick={() => handleReject(c.courseId)}>Revoke</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        ) : tab === 'users' ? (
          <div>
            <div style={{ marginBottom: 16 }}>
              <input className="form-input" placeholder="Search by name or email..."
                value={searchTerm} onChange={e => setSearch(e.target.value)}
                style={{ maxWidth: 400 }} />
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray)' }}>No users found</td></tr>
                  ) : filteredUsers.map(u => (
                    <tr key={u.userId}>
                      <td><strong>{u.fullName}</strong></td>
                      <td style={{ color: 'var(--gray)', fontSize: 13 }}>{u.email}</td>
                      <td>
                        <span className={`badge ${u.role === 'ADMIN' ? 'badge-red' : u.role === 'INSTRUCTOR' ? 'badge-blue' : 'badge-green'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        {u.isActive
                          ? <span className="badge badge-green">Active</span>
                          : <span className="badge badge-red">Suspended</span>}
                      </td>
                      <td>
                        {u.role !== 'ADMIN' && (
                          u.isActive
                            ? <button className="btn btn-warning btn-sm" onClick={() => handleSuspend(u.userId)}>Suspend</button>
                            : <button className="btn btn-success btn-sm" onClick={() => handleReactivate(u.userId)}>Reactivate</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        ) : (
          <div>
            {reviews.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: 48 }}>💬</div>
                <h3>No pending reviews</h3>
                <p>All reviews have been moderated</p>
              </div>
            ) : reviews.map(r => (
              <div key={r.reviewId} className="card" style={{ padding: 20, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>
                      {'⭐'.repeat(r.rating)} Course ID: {r.courseId}
                    </div>
                    <p style={{ color: 'var(--gray)', fontSize: 14 }}>{r.comment}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-success btn-sm" onClick={() => handleApproveReview(r.reviewId)}>✅ Approve</button>
                    <button className="btn btn-danger btn-sm"  onClick={() => handleHideReview(r.reviewId)}>🗑️ Hide</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;