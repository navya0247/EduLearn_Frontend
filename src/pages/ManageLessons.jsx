import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { lessonService, courseService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CONTENT_TYPES = [
  { value: 'VIDEO',     label: '🎥 Video (YouTube)',  hint: 'Paste YouTube embed URL' },
  { value: 'ARTICLE',   label: '📝 Article / Text',   hint: 'Paste article URL or write content URL' },
  { value: 'PDF',       label: '📄 PDF Document',     hint: 'Paste PDF URL' },
  { value: 'QUIZ_LINK', label: '📋 Quiz Link',        hint: 'Link to quiz resource' },
];

// Convert YouTube watch URL to embed URL automatically
const toEmbedUrl = (url) => {
  if (!url) return '';
  if (url.includes('youtube.com/watch?v=')) {
    const id = new URL(url).searchParams.get('v');
    return `https://www.youtube.com/embed/${id}`;
  }
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1].split('?')[0];
    return `https://www.youtube.com/embed/${id}`;
  }
  return url; // already embed or other URL
};

const emptyForm = {
  title: '', description: '',
  contentType: 'VIDEO', contentUrl: '',
  durationMinutes: 10, displayOrder: 1,
  isPreview: false, isPublished: true,
};

const ManageLessons = () => {
  const { courseId }    = useParams();
  const navigate        = useNavigate();
  const { user }        = useAuth();
  const [course, setCourse]   = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]       = useState(emptyForm);
  const [editId, setEditId]   = useState(null);
  const [preview, setPreview] = useState('');

  useEffect(() => { loadData(); }, [courseId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [courseRes, lessonRes] = await Promise.all([
        courseService.getById(courseId),
        lessonService.getByCourse(courseId),
      ]);
      setCourse(courseRes.data);
      setLessons(Array.isArray(lessonRes.data) ? lessonRes.data : []);
    } catch {
      toast.error('Failed to load course data');
    } finally { setLoading(false); }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setForm(prev => ({ ...prev, [name]: val }));
    // Auto convert YouTube URL and show preview
    if (name === 'contentUrl') {
      setPreview(toEmbedUrl(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title)      { toast.error('Lesson title is required'); return; }
    if (!form.contentUrl) { toast.error('Content URL is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        courseId:        parseInt(courseId),
        durationMinutes: parseInt(form.durationMinutes) || 10,
        displayOrder:    parseInt(form.displayOrder)    || lessons.length + 1,
        contentUrl:      toEmbedUrl(form.contentUrl),
      };

      if (editId) {
        await lessonService.updateLesson(editId, payload);
        toast.success('Lesson updated!');
      } else {
        await lessonService.addLesson(payload);
        toast.success('Lesson added!');
      }

      setForm({ ...emptyForm, displayOrder: lessons.length + 2 });
      setEditId(null);
      setShowForm(false);
      setPreview('');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save lesson');
    } finally { setSaving(false); }
  };

  const handleEdit = (lesson) => {
    setForm({
      title:           lesson.title,
      description:     lesson.description || '',
      contentType:     lesson.contentType,
      contentUrl:      lesson.contentUrl,
      durationMinutes: lesson.durationMinutes,
      displayOrder:    lesson.displayOrder,
      isPreview:       lesson.isPreview,
      isPublished:     lesson.isPublished,
    });
    setPreview(lesson.contentType === 'VIDEO' ? lesson.contentUrl : '');
    setEditId(lesson.lessonId);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lesson?')) return;
    try {
      await lessonService.deleteLesson(id);
      toast.success('Lesson deleted');
      loadData();
    } catch { toast.error('Failed to delete lesson'); }
  };

  const handlePublish = async (id) => {
    try {
      await lessonService.publishLesson(id);
      toast.success('Lesson published!');
      loadData();
    } catch { toast.error('Failed to publish lesson'); }
  };

  const cancelForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setShowForm(false);
    setPreview('');
  };

  if (loading) return (
    <div className="page-content">
      <div className="loading-center"><div className="spinner" /></div>
    </div>
  );

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1>📚 Manage Lessons</h1>
              <p>{course?.title} — {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} added</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {!showForm && (
                <button className="btn btn-success" onClick={() => { setShowForm(true); setForm({ ...emptyForm, displayOrder: lessons.length + 1 }); }}>
                  + Add Lesson
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => navigate('/instructor/dashboard')}>
                ← Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '32px 20px' }}>

        {/* ── Add / Edit Lesson Form ── */}
        {showForm && (
          <div className="card" style={{ padding: 32, marginBottom: 32 }}>
            <h2 style={{ marginBottom: 24, color: 'var(--primary)' }}>
              {editId ? '✏️ Edit Lesson' : '➕ Add New Lesson'}
            </h2>
            <form onSubmit={handleSubmit}>

              {/* Title */}
              <div className="form-group">
                <label className="form-label">Lesson Title *</label>
                <input className="form-input" name="title" value={form.title}
                  onChange={handleChange} placeholder="e.g. Introduction to Python Variables" />
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <textarea className="form-textarea" name="description" rows={3}
                  value={form.description} onChange={handleChange}
                  placeholder="What will students learn in this lesson?" />
              </div>

              {/* Content Type */}
              <div className="form-group">
                <label className="form-label">Content Type *</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
                  {CONTENT_TYPES.map(ct => (
                    <label key={ct.value} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 16px', borderRadius: 8, cursor: 'pointer',
                      border: `2px solid ${form.contentType === ct.value ? 'var(--primary)' : 'var(--border)'}`,
                      background: form.contentType === ct.value ? 'var(--primary-light)' : 'white',
                      transition: 'all 0.15s',
                    }}>
                      <input type="radio" name="contentType" value={ct.value}
                        checked={form.contentType === ct.value} onChange={handleChange}
                        style={{ accentColor: 'var(--primary)' }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{ct.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray)' }}>{ct.hint}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Content URL */}
              <div className="form-group">
                <label className="form-label">
                  {form.contentType === 'VIDEO' ? '🎥 YouTube URL *' : '🔗 Content URL *'}
                </label>
                <input className="form-input" name="contentUrl" value={form.contentUrl}
                  onChange={handleChange}
                  placeholder={form.contentType === 'VIDEO'
                    ? 'https://www.youtube.com/watch?v=... or https://www.youtube.com/embed/...'
                    : 'https://example.com/content'} />
                {form.contentType === 'VIDEO' && (
                  <p style={{ fontSize: 12, color: 'var(--gray)', marginTop: 4 }}>
                    💡 Paste any YouTube link — it will be converted to embed automatically
                  </p>
                )}
              </div>

              {/* YouTube Preview */}
              {form.contentType === 'VIDEO' && preview && (
                <div className="form-group">
                  <label className="form-label">Video Preview</label>
                  <div style={{ borderRadius: 8, overflow: 'hidden', background: '#000', aspectRatio: '16/9', maxWidth: 560 }}>
                    <iframe src={preview} width="100%" height="100%"
                      style={{ border: 'none', display: 'block' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen title="Video Preview" />
                  </div>
                </div>
              )}

              {/* Duration + Order */}
              <div className="grid-2" style={{ gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Duration (minutes) *</label>
                  <input className="form-input" type="number" name="durationMinutes"
                    value={form.durationMinutes} onChange={handleChange} min={1} max={300} />
                </div>
                <div className="form-group">
                  <label className="form-label">Display Order</label>
                  <input className="form-input" type="number" name="displayOrder"
                    value={form.displayOrder} onChange={handleChange} min={1} />
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: 'flex', gap: 32, marginBottom: 24 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                  <input type="checkbox" name="isPreview" checked={form.isPreview}
                    onChange={handleChange} style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
                  👁️ Free Preview (visible without enrollment)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                  <input type="checkbox" name="isPublished" checked={form.isPublished}
                    onChange={handleChange} style={{ width: 18, height: 18, accentColor: 'var(--success)' }} />
                  ✅ Publish immediately
                </label>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                  {saving ? 'Saving...' : editId ? '💾 Update Lesson' : '➕ Add Lesson'}
                </button>
                <button type="button" className="btn btn-secondary btn-lg" onClick={cancelForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Lessons List ── */}
        {lessons.length === 0 ? (
          <div className="empty-state card" style={{ padding: 60 }}>
            <div style={{ fontSize: 64 }}>🎬</div>
            <h3>No lessons yet</h3>
            <p>Add your first lesson to get started. Students will see lessons in display order.</p>
            {!showForm && (
              <button className="btn btn-primary" style={{ marginTop: 16 }}
                onClick={() => setShowForm(true)}>
                + Add First Lesson
              </button>
            )}
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2>Course Lessons ({lessons.length})</h2>
              {!showForm && (
                <button className="btn btn-primary"
                  onClick={() => { setShowForm(true); setForm({ ...emptyForm, displayOrder: lessons.length + 1 }); }}>
                  + Add Lesson
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {lessons
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((lesson, idx) => (
                  <div key={lesson.lessonId} className="card" style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>

                      {/* Order number */}
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'var(--primary)', color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: 16, flexShrink: 0,
                      }}>
                        {idx + 1}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: 15 }}>{lesson.title}</span>
                          {lesson.isPreview   && <span className="badge badge-green">👁️ Free Preview</span>}
                          {lesson.isPublished && <span className="badge badge-blue">✅ Published</span>}
                          {!lesson.isPublished && <span className="badge badge-yellow">📝 Draft</span>}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--gray)', marginTop: 4, display: 'flex', gap: 16 }}>
                          <span>
                            {lesson.contentType === 'VIDEO'     && '🎥'}
                            {lesson.contentType === 'ARTICLE'   && '📝'}
                            {lesson.contentType === 'PDF'       && '📄'}
                            {lesson.contentType === 'QUIZ_LINK' && '📋'}
                            {' '}{lesson.contentType}
                          </span>
                          <span>⏱️ {lesson.durationMinutes} min</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        {!lesson.isPublished && (
                          <button className="btn btn-success btn-sm"
                            onClick={() => handlePublish(lesson.lessonId)}>
                            Publish
                          </button>
                        )}
                        <button className="btn btn-secondary btn-sm"
                          onClick={() => handleEdit(lesson)}>
                          ✏️ Edit
                        </button>
                        <button className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(lesson.lessonId)}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageLessons;
