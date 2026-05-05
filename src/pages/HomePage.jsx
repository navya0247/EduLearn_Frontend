import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { courseService } from '../services/api';
import CourseCard from '../components/CourseCard';
import './HomePage.css';

const HomePage = () => {
  const [courses, setCourses]   = useState([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const navigate                = useNavigate();

  useEffect(() => {
    courseService.getTop(8)
      .then(res => setCourses(res.data))
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/courses?search=${search.trim()}`);
  };

  const categories = [
    { icon: '💻', label: 'Programming' },
    { icon: '🎨', label: 'Design' },
    { icon: '📊', label: 'Business' },
    { icon: '📱', label: 'Mobile' },
    { icon: '🤖', label: 'AI & ML' },
    { icon: '🌐', label: 'Web Dev' },
    { icon: '🔐', label: 'Security' },
    { icon: '📈', label: 'Marketing' },
  ];

  return (
    <div className="home-page page-content">

      {/* ── Hero Section ──────────────────────────────────────────────── */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">🎓 #1 Online Learning Platform</div>
            <h1 className="hero-title">
              Learn Without <span className="highlight">Limits</span>
            </h1>
            <p className="hero-desc">
              Access 500+ expert-led courses in programming, design, business and more.
              Learn at your own pace and earn certificates.
            </p>

            {/* Search Bar */}
            <form className="hero-search" onSubmit={handleSearch}>
              <input
                className="hero-search-input"
                type="text"
                placeholder="Search for courses, skills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-primary btn-lg">
                Search
              </button>
            </form>

            <p className="hero-hint">Popular: Python, React, Machine Learning, UI/UX</p>
          </div>

          {/* Stats */}
          <div className="hero-stats">
            {[
              { value: '500+', label: 'Courses' },
              { value: '10K+', label: 'Students' },
              { value: '200+', label: 'Instructors' },
              { value: '95%',  label: 'Satisfaction' },
            ].map((s) => (
              <div key={s.label} className="hero-stat">
                <span className="stat-value">{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ────────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">Browse by Category</h2>
          <p className="section-subtitle">Find courses in your area of interest</p>
          <div className="categories-grid">
            {categories.map((cat) => (
              <Link
                key={cat.label}
                to={`/courses?category=${cat.label}`}
                className="category-card"
              >
                <span className="cat-icon">{cat.icon}</span>
                <span className="cat-label">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Courses ──────────────────────────────────────────── */}
      <section className="section section-gray">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Featured Courses</h2>
              <p className="section-subtitle">Most popular courses this month</p>
            </div>
            <Link to="/courses" className="btn btn-outline">View All →</Link>
          </div>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : courses.length === 0 ? (
            <div className="empty-state">
              <h3>No courses available yet</h3>
              <p>Check back soon — instructors are adding new courses!</p>
            </div>
          ) : (
            <div className="grid-4">
              {courses.map((c) => <CourseCard key={c.courseId} course={c} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── Why EduLearn ──────────────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center' }}>Why Choose EduLearn?</h2>
          <p className="section-subtitle" style={{ textAlign: 'center' }}>Everything you need to succeed</p>
          <div className="grid-3 why-grid">
            {[
              { icon: '🏆', title: 'Expert Instructors', desc: 'Learn from industry professionals with real-world experience' },
              { icon: '📜', title: 'Earn Certificates', desc: 'Get verified certificates on course completion to boost your career' },
              { icon: '📱', title: 'Learn Anywhere', desc: 'Access courses on any device — desktop, tablet or mobile' },
              { icon: '🎯', title: 'Hands-on Learning', desc: 'Practice with quizzes and assignments to reinforce your learning' },
              { icon: '💬', title: 'Community Support', desc: 'Connect with fellow learners and get help from instructors' },
              { icon: '🔄', title: 'Lifetime Access', desc: 'Purchase once and get lifetime access to all course materials' },
            ].map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Start Learning?</h2>
            <p>Join 10,000+ students already learning on EduLearn</p>
            <div className="cta-buttons">
              <Link to="/register" className="btn btn-primary btn-lg">Get Started Free</Link>
              <Link to="/courses"  className="btn btn-outline btn-lg" style={{ color: 'white', borderColor: 'white' }}>Browse Courses</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;