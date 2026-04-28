import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { courseService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['Programming', 'Design', 'Business', 'Mobile Dev', 'AI & ML', 'Web Dev', 'Cybersecurity', 'Marketing'];
const LEVELS     = ['Beginner', 'Intermediate', 'Advanced'];
const LANGUAGES  = ['English', 'Hindi', 'Tamil', 'Telugu', 'Marathi'];

const CreateCourse = () => {
  const navigate      = useNavigate();
  const { user }      = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', category: 'Programming',
    level: 'Beginner', language: 'English',
    price: 0, thumbnailUrl: '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) { toast.error('Title and description are required'); return; }
    setLoading(true);
    try {
      const res = await courseService.create({ ...form, price: parseFloat(form.price) || 0 });
      toast.success('Course created as draft! Publish it when ready.');
      navigate('/instructor/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create course');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="container">
          <h1>Create New Course</h1>
          <p>Fill in the details to create your course. You can publish it when ready.</p>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 20px', maxWidth: 800 }}>
        <div className="card" style={{ padding: 40 }}>
          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className="form-group">
              <label className="form-label">Course Title *</label>
              <input className="form-input" name="title" value={form.title}
                onChange={handleChange} placeholder="e.g. Complete Python Bootcamp 2024" />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea className="form-textarea" name="description" rows={5}
                value={form.description} onChange={handleChange}
                placeholder="Describe what students will learn in this course..." />
            </div>

            {/* Category + Level */}
            <div className="grid-2" style={{ gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" name="category" value={form.category} onChange={handleChange}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Level</label>
                <select className="form-select" name="level" value={form.level} onChange={handleChange}>
                  {LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>

            {/* Language + Price */}
            <div className="grid-2" style={{ gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Language</label>
                <select className="form-select" name="language" value={form.language} onChange={handleChange}>
                  {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Price (₹) — 0 for Free</label>
                <input className="form-input" type="number" name="price"
                  value={form.price} onChange={handleChange} min={0} placeholder="0" />
              </div>
            </div>

            {/* Thumbnail */}
            <div className="form-group">
              <label className="form-label">Thumbnail URL (optional)</label>
              <input className="form-input" name="thumbnailUrl" value={form.thumbnailUrl}
                onChange={handleChange} placeholder="https://example.com/image.jpg" />
              {form.thumbnailUrl && (
                <img src={form.thumbnailUrl} alt="preview"
                  style={{ marginTop: 12, height: 160, borderRadius: 8, objectFit: 'cover' }}
                  onError={e => e.target.style.display = 'none'} />
              )}
            </div>

            {/* Info Box */}
            <div style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', borderRadius: 8, padding: 16, marginBottom: 24 }}>
              <p style={{ color: 'var(--primary)', fontSize: 14, fontWeight: 600 }}>
                ℹ️ Your course will be saved as a <strong>Draft</strong>. 
                Go to Dashboard → click <strong>Publish</strong> to submit for admin review.
                Admin approval makes it visible to students.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                {loading ? 'Creating...' : '✅ Create Course'}
              </button>
              <button type="button" className="btn btn-secondary btn-lg"
                onClick={() => navigate('/instructor/dashboard')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCourse;