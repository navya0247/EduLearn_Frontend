import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { courseService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const InstructorDashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.userId) {
      courseService.getByInstructor(user.userId)
        .then(res => setCourses(res.data))
        .catch(() => setCourses([]))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const totalEnrollments = courses.reduce((s, c) => s + (c.enrollmentCount || 0), 0);

  const handlePublish = async (courseId) => {
    try {
      await courseService.publish(courseId);
      toast.success('Course submitted for admin review!');
      setCourses(prev => prev.map(x =>
        x.courseId === courseId ? { ...x, isPublished: true } : x));
    } catch { toast.error('Failed to publish course'); }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="container">
          <h1>Instructor Dashboard</h1>
          <p>Welcome back, {user?.fullName}! Manage your courses and track performance.</p>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 20px' }}>

        {/* Stats */}
        <div className="stats-grid" style={{ marginBottom: 32 }}>
          {[
            { icon: '📚', label: 'Total Courses', value: courses.length, color: 'var(--primary)' },
            { icon: '✅', label: 'Approved', value: courses.filter(c => c.isApproved).length, color: 'var(--success)' },
            { icon: '⏳', label: 'Pending Approval', value: courses.filter(c => c.isPublished && !c.isApproved).length, color: 'var(--warning)' },
            { icon: '👥', label: 'Total Students', value: totalEnrollments, color: 'var(--secondary)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-card-icon">{s.icon}</div>
              <div className="stat-card-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Course List */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2>My Courses</h2>
          <Link to="/instructor/create-course" className="btn btn-primary">+ Create New Course</Link>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : courses.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 64 }}>📚</div>
            <h3>No courses yet</h3>
            <p>Create your first course to start teaching!</p>
            <Link to="/instructor/create-course" className="btn btn-primary" style={{ marginTop: 16 }}>
              Create Course
            </Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Students</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.courseId}>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{c.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--gray)' }}>{c.level}</div>
                    </td>
                    <td><span className="badge badge-blue">{c.category}</span></td>
                    <td>
                      {c.isApproved
                        ? <span className="badge badge-green">✅ Approved</span>
                        : c.isPublished
                          ? <span className="badge badge-yellow">⏳ Pending</span>
                          : <span className="badge badge-red">📝 Draft</span>}
                    </td>
                    <td><strong>{c.enrollmentCount}</strong></td>
                    <td><strong>{c.price > 0 ? `₹${c.price}` : 'Free'}</strong></td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {/* Lessons button */}
                        <Link
                          to={`/instructor/courses/${c.courseId}/lessons`}
                          className="btn btn-primary btn-sm">
                          🎬 Lessons
                        </Link>
                        {/* ✅ NEW - Quizzes button */}
                        <Link
                          to={`/instructor/courses/${c.courseId}/quizzes`}
                          className="btn btn-primary btn-sm">
                          📋 Quizzes
                        </Link>
                        <Link to={`/courses/${c.courseId}`} className="btn btn-secondary btn-sm">
                          View
                        </Link>
                        {!c.isPublished && (
                          <button className="btn btn-success btn-sm"
                            onClick={() => handlePublish(c.courseId)}>
                            Publish
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorDashboard;