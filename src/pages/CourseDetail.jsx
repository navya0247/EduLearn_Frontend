import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { courseService, enrollmentService, reviewService, lessonService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PaymentButton from '../components/PaymentButton'; // ✅ ADD THIS IMPORT
import './CourseDetail.css';

const CATEGORY_IMAGES = {
  'Programming':   'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&auto=format&fit=crop&q=80',
  'Design':        'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop&q=80',
  'Business':      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
  'default':       'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&auto=format&fit=crop&q=80',
};

const CourseDetail = () => {
  const { id }                                        = useParams();
  const { isLoggedIn, isStudent, isAdmin, isInstructor, user } = useAuth();
  const navigate                                      = useNavigate();
  const [course, setCourse]       = useState(null);
  const [reviews, setReviews]     = useState([]);
  const [summary, setSummary]     = useState(null);
  const [lessons, setLessons]     = useState([]);
  const [enrolled, setEnrolled]   = useState(false);
  const [loading, setLoading]     = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [myReview, setMyReview]   = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [courseRes, reviewsRes, summaryRes] = await Promise.all([
          courseService.getById(id),
          reviewService.getApproved(id),
          reviewService.getSummary(id),
        ]);
        setCourse(courseRes.data);
        setReviews(reviewsRes.data);
        setSummary(summaryRes.data);

        try {
          const lr = await lessonService.getPreview(id);
          setLessons(lr.data);
        } catch { setLessons([]); }

        if (isLoggedIn() && isStudent()) {
          try {
            const er = await enrollmentService.isEnrolled(id);
            setEnrolled(er.data.isEnrolled);
          } catch { setEnrolled(false); }
        }
      } catch {
        toast.error('Course not found');
        navigate('/courses');
      } finally { setLoading(false); }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ✅ This is now only for free enrollment
  const handleFreeEnroll = async () => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    setEnrolling(true);
    try {
      await enrollmentService.enroll({ courseId: parseInt(id), paymentId: null });
      setEnrolled(true);
      toast.success('🎉 Enrolled successfully! Happy learning!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Enrollment failed');
    } finally { setEnrolling(false); }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reviewService.submit({ courseId: parseInt(id), ...myReview });
      toast.success('Review submitted! Waiting for admin approval.');
      setMyReview({ rating: 5, comment: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Review failed');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="loading-center" style={{ paddingTop: 100 }}><div className="spinner" /></div>;
  if (!course)  return null;

  const bannerImg = course.thumbnailUrl || CATEGORY_IMAGES[course.category] || CATEGORY_IMAGES['default'];

  // ✅ Show enroll button only to Students or non-logged-in users
  const showEnrollButton = !isAdmin() && !isInstructor();

  return (
    <div className="page-content course-detail-page">
      {/* Banner */}
      <div className="cd-banner" style={{ backgroundImage: `url(${bannerImg})` }}>
        <div className="cd-banner-overlay" />
        <div className="container cd-banner-content">
          <span className="badge badge-blue" style={{ marginBottom: 12 }}>{course.category}</span>
          <h1 className="cd-title">{course.title}</h1>
          <p className="cd-desc">{course.description?.substring(0, 150)}...</p>
          <div className="cd-meta">
            <span>⭐ {summary?.averageRating || 0} ({summary?.totalReviews || 0} reviews)</span>
            <span>👥 {course.enrollmentCount} students</span>
            <span>📊 {course.level}</span>
            <span>🌐 {course.language}</span>
          </div>
        </div>
      </div>

      <div className="container cd-body">
        <div className="cd-layout">
          {/* Left Content */}
          <div className="cd-main">
            {/* Preview Lessons */}
            {lessons.length > 0 && (
              <div className="cd-section">
                <h2>📚 Free Preview Lessons</h2>
                <div className="lessons-list">
                  {lessons.map((l, i) => (
                    <div key={l.lessonId} className="lesson-row">
                      <span className="lesson-num">{i + 1}</span>
                      <span className="lesson-icon">
                        {l.contentType === 'VIDEO' ? '🎬' : l.contentType === 'PDF' ? '📄' : '📝'}
                      </span>
                      <span className="lesson-title">{l.title}</span>
                      <span className="lesson-dur">{l.durationMinutes}min</span>
                      <span className="badge badge-green" style={{ fontSize: 11 }}>Free</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="cd-section">
              <h2>⭐ Student Reviews</h2>
              {summary && (
                <div className="rating-summary">
                  <div className="rating-big">
                    <span className="rating-num">{summary.averageRating}</span>
                    <div className="stars">{'★'.repeat(Math.round(summary.averageRating))}{'☆'.repeat(5 - Math.round(summary.averageRating))}</div>
                    <span style={{ color: 'var(--gray)', fontSize: 13 }}>{summary.totalReviews} reviews</span>
                  </div>
                  <div className="rating-bars">
                    {[5,4,3,2,1].map(n => {
                      const count = summary[`${['zero','one','two','three','four','five'][n]}Stars`] || 0;
                      const pct   = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;
                      return (
                        <div key={n} className="rating-bar-row">
                          <span style={{ fontSize: 13, width: 8 }}>{n}</span>
                          <span style={{ fontSize: 13 }}>★</span>
                          <div className="progress-bar-wrap" style={{ flex: 1 }}>
                            <div className="progress-bar-fill" style={{ width: `${pct}%`, background: '#F59E0B' }} />
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--gray)', width: 20 }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="reviews-list">
                {reviews.length === 0 ? (
                  <p style={{ color: 'var(--gray)' }}>No reviews yet. Be the first!</p>
                ) : (
                  reviews.map(r => (
                    <div key={r.reviewId} className="review-card">
                      <div className="review-header">
                        <div className="reviewer-avatar">{r.studentId}</div>
                        <div>
                          <div className="stars" style={{ fontSize: 14 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                          <span style={{ fontSize: 12, color: 'var(--gray)' }}>
                            {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <p className="review-text">{r.comment}</p>
                    </div>
                  ))
                )}
              </div>

              {enrolled && (
                <div className="review-form-wrap">
                  <h3>Write a Review</h3>
                  <form onSubmit={handleReview}>
                    <div className="form-group">
                      <label className="form-label">Rating</label>
                      <div className="star-selector">
                        {[1,2,3,4,5].map(n => (
                          <button key={n} type="button"
                            className={`star-btn ${myReview.rating >= n ? 'active' : ''}`}
                            onClick={() => setMyReview({ ...myReview, rating: n })}>★</button>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Your Review</label>
                      <textarea className="form-textarea" rows={4}
                        placeholder="Share your experience with this course..."
                        value={myReview.comment}
                        onChange={e => setMyReview({ ...myReview, comment: e.target.value })} />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Right — Enroll Card */}
          <div className="cd-sidebar">
            <div className="enroll-card card">
              <div className="enroll-price">
                {course.price > 0 ? `₹${course.price}` : '🆓 Free'}
              </div>

              {/* ✅ UPDATED: Show payment button for paid courses, free enroll for free courses */}
              {showEnrollButton ? (
                enrolled ? (
                  <div>
                    <div className="badge badge-green" style={{ marginBottom: 12, fontSize: 14 }}>
                      ✅ You are enrolled
                    </div>
                    <Link to="/my-courses" className="btn btn-success btn-full btn-lg">
                      Go to My Courses →
                    </Link>
                  </div>
                ) : (
                  <>
                    {course.price > 0 ? (
                      <PaymentButton 
                        courseId={course.courseId}
                        amount={course.price}
                        courseTitle={course.title}
                        onSuccess={() => {
                          setEnrolled(true);
                          toast.success('Enrollment successful!');
                        }}
                      />
                    ) : (
                      <button className="btn btn-primary btn-full btn-lg"
                        onClick={handleFreeEnroll} disabled={enrolling}>
                        {enrolling ? 'Enrolling...' : 'Enroll for Free'}
                      </button>
                    )}
                  </>
                )
              ) : (
                /* Admin / Instructor sees info box instead of enroll button */
                <div style={{
                  background: 'var(--light-gray)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: 16, textAlign: 'center',
                  color: 'var(--gray)', fontSize: 14
                }}>
                  {isAdmin()
                    ? '⚙️ Admin view — enrollment not applicable'
                    : '👨‍🏫 Instructor view — you created this course'}
                </div>
              )}

              <ul className="enroll-features">
                <li>✅ Full lifetime access</li>
                <li>✅ Certificate on completion</li>
                <li>✅ Access on all devices</li>
                <li>✅ Downloadable resources</li>
                {course.price > 0 && <li>✅ 30-day money back guarantee</li>}
              </ul>
            </div>

            {/* Course Info */}
            <div className="course-info-card card">
              <h4>Course Info</h4>
              <div className="info-row"><span>📊 Level</span><span>{course.level}</span></div>
              <div className="info-row"><span>🌐 Language</span><span>{course.language}</span></div>
              <div className="info-row"><span>👥 Students</span><span>{course.enrollmentCount}</span></div>
              <div className="info-row"><span>🏷️ Category</span><span>{course.category}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;