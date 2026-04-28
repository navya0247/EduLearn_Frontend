import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './CourseCard.css';

const CATEGORY_IMAGES = {
  'Programming':   'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400&auto=format&fit=crop&q=80',
  'Design':        'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&auto=format&fit=crop&q=80',
  'Business':      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&auto=format&fit=crop&q=80',
  'Mobile Dev':    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&auto=format&fit=crop&q=80',
  'AI & ML':       'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=400&auto=format&fit=crop&q=80',
  'Web Dev':       'https://images.unsplash.com/photo-1547658719-da2b51169166?w=400&auto=format&fit=crop&q=80',
  'Cybersecurity': 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=400&auto=format&fit=crop&q=80',
  'Marketing':     'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=400&auto=format&fit=crop&q=80',
  'default':       'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&auto=format&fit=crop&q=80',
};

const LEVEL_COLORS = {
  Beginner:     'badge-green',
  Intermediate: 'badge-yellow',
  Advanced:     'badge-red',
};

const CourseCard = ({ course }) => {
  const { courseId, title, category, level, price, thumbnailUrl, enrollmentCount } = course;
  const { isAdmin, isInstructor } = useAuth();
  const img = thumbnailUrl || CATEGORY_IMAGES[category] || CATEGORY_IMAGES['default'];

  // ✅ Show "View Course" for Admin/Instructor, "Enroll Now" for Students/Guests
  const ctaText = isAdmin() || isInstructor() ? 'View Course →' : 'Enroll Now →';

  return (
    <Link to={`/courses/${courseId}`} className="course-card card">
      <div className="course-thumb">
        <img src={img} alt={title} loading="lazy" />
        <div className="course-thumb-overlay" />
        <span className={`badge ${LEVEL_COLORS[level] || 'badge-blue'} course-level`}>{level}</span>
        {price === 0 && <span className="badge badge-green course-free">Free</span>}
      </div>
      <div className="course-body">
        <span className="course-category">{category}</span>
        <h3 className="course-title">{title}</h3>
        <div className="course-meta">
          <span>👥 {enrollmentCount?.toLocaleString() || 0} students</span>
        </div>
        <div className="course-footer">
          <span className="course-price">{price > 0 ? `₹${price}` : 'Free'}</span>
          <span className="course-cta">{ctaText}</span>
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;