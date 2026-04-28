import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { enrollmentService, courseService, progressService } from '../services/api';
import './MyCourses.css';

const STATUS_COLOR = {
  ACTIVE: 'badge-blue',
  COMPLETED: 'badge-green',
  DROPPED: 'badge-red'
};

const CATEGORY_IMAGES = {
  'Programming': 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400&q=80',
  'Design': 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&q=80',
  'Business': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80',
  'Mobile Dev': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&q=80',
  'AI & ML': 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&q=80',
  'Web Dev': 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=400&q=80',
  'Cybersecurity': 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=400&q=80',
  'Marketing': 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=400&q=80',
  'default': 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&q=80',
};

const MyCourses = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [courses, setCourses] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [progressMap, setProgressMap] = useState({});
  const [certificateMap, setCertificateMap] = useState({});
  const location = useLocation();

  useEffect(() => {
    loadData();
  }, []);

  // Reload when coming back from certificates page
  useEffect(() => {
    if (location.state?.refresh) {
      loadData();
    }
  }, [location]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await enrollmentService.getMyCourses();
      let data = [];
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (res.data && Array.isArray(res.data.$values)) {
        data = res.data.$values;
      }
      setEnrollments(data);

      const courseMap = {};
      const progressMapTemp = {};
      const certificateMapTemp = {};

      await Promise.allSettled(
        data.map(async (e) => {
          try {
            const cr = await courseService.getById(e.courseId);
            courseMap[e.courseId] = cr.data;
            
            // Fetch progress
            try {
              const progressData = await progressService.getCourseProgress(e.courseId, 0);
              progressMapTemp[e.courseId] = progressData.data?.progressPercent || e.progressPercent || 0;
            } catch {
              progressMapTemp[e.courseId] = e.progressPercent || 0;
            }
            
            // Check if certificate exists for completed courses
            if (e.progressPercent === 100 || progressMapTemp[e.courseId] === 100) {
              try {
                const certData = await progressService.getCertificate(e.courseId);
                if (certData.data) {
                  certificateMapTemp[e.courseId] = certData.data;
                }
              } catch {
                // No certificate yet
              }
            }
          } catch { }
        })
      );
      
      setCourses(courseMap);
      setProgressMap(progressMapTemp);
      setCertificateMap(certificateMapTemp);
    } catch (err) {
      console.error('Load error:', err);
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = tab === 'all'
    ? enrollments
    : enrollments.filter(e => e.status === tab.toUpperCase());

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="container">
          <h1>My Learning</h1>
          <p>Track your progress and continue learning</p>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 20px' }}>
        <div className="my-tabs">
          {['all', 'active', 'completed', 'dropped'].map(t => (
            <button key={t} className={`my-tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
              <span className="tab-count">
                {t === 'all' ? enrollments.length
                  : enrollments.filter(e => e.status === t.toUpperCase()).length}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 64 }}>📚</div>
            <h3>{tab === 'all' ? 'No courses yet' : `No ${tab} courses`}</h3>
            <p>{tab === 'all' ? 'Browse and enroll in courses to start learning' : `You have no ${tab} courses`}</p>
            {tab === 'all' && (
              <Link to="/courses" className="btn btn-primary" style={{ marginTop: 16 }}>
                Browse Courses
              </Link>
            )}
          </div>
        ) : (
          <div className="grid-3">
            {filtered.map(e => {
              const course = courses[e.courseId];
              const title = course?.title || `Course #${e.courseId}`;
              const category = course?.category || '';
              const thumb = course?.thumbnailUrl || CATEGORY_IMAGES[category] || CATEGORY_IMAGES['default'];
              const progress = progressMap[e.courseId] || e.progressPercent || 0;
              const isCompleted = e.status === 'COMPLETED' || progress === 100;

              return (
                <div key={e.enrollmentId} className="my-course-card card">
                  <div style={{
                    height: 140, overflow: 'hidden',
                    borderRadius: '8px 8px 0 0', margin: '-1px -1px 0',
                  }}>
                    <img src={thumb} alt={title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>

                  <div style={{ padding: '16px' }}>
                    <div className="my-course-header">
                      <span className={`badge ${isCompleted ? 'badge-green' : STATUS_COLOR[e.status] || 'badge-blue'}`}>
                        {isCompleted ? 'COMPLETED' : e.status}
                      </span>
                      <span className="my-course-date">
                        {new Date(e.enrolledAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="my-course-title" style={{ margin: '8px 0' }}>{title}</h3>
                    {category && (
                      <span style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>
                        {category}
                      </span>
                    )}

                    <div className="my-progress" style={{ marginTop: 12 }}>
                      <div className="my-progress-header">
                        <span>Progress</span>
                        <span className="my-progress-pct">{progress}%</span>
                      </div>
                      <div className="progress-bar-wrap">
                        <div className="progress-bar-fill"
                          style={{
                            width: `${progress}%`,
                            background: progress === 100 ? 'var(--success)' : 'var(--primary)'
                          }} />
                      </div>
                    </div>

                    <div className="my-course-footer" style={{ marginTop: 16 }}>
                      {progress === 100 ? (
                        <Link to="/certificates" className="btn btn-success btn-full btn-sm">
                          🏆 View Certificate
                        </Link>
                      ) : (
                        <Link to={`/lesson/${e.courseId}`} className="btn btn-primary btn-full btn-sm">
                          ▶ Continue Learning
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCourses;