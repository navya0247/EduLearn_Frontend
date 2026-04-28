import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { assessmentService, courseService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ManageQuizzes = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    passingScore: 70,
    maxAttempts: 3,
    timeLimitMinutes: 30,
    isPublished: false
  });
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: ''
  });

  useEffect(() => {
    loadData();
  }, [courseId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [courseRes, quizzesRes] = await Promise.all([
        courseService.getById(courseId),
        assessmentService.getByCourse(courseId)
      ]);
      setCourse(courseRes.data);
      setQuizzes(Array.isArray(quizzesRes.data) ? quizzesRes.data : []);
    } catch (err) {
      console.error('Load error:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleAddQuestion = () => {
    if (!currentQuestion.question.trim()) {
      toast.error('Please enter a question');
      return;
    }
    if (currentQuestion.options.some(opt => !opt.trim())) {
      toast.error('Please fill all options');
      return;
    }
    if (!currentQuestion.correctAnswer) {
      toast.error('Please select the correct answer');
      return;
    }

    setQuestions([...questions, { 
      ...currentQuestion, 
      id: Date.now(),
      question: currentQuestion.question.trim(),
      options: currentQuestion.options.map(opt => opt.trim())
    }]);
    
    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: ''
    });
    
    toast.success('Question added!');
  };

  const handleRemoveQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    
    if (!form.title.trim()) {
      toast.error('Quiz title is required');
      return;
    }
    if (questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    setLoading(true);
    try {
      const quizData = {
        ...form,
        title: form.title.trim(),
        description: form.description?.trim() || '',
        courseId: parseInt(courseId),
        passingScore: parseInt(form.passingScore),
        maxAttempts: parseInt(form.maxAttempts),
        timeLimitMinutes: parseInt(form.timeLimitMinutes),
        questions: questions.map(q => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer
        }))
      };

      if (editId) {
        await assessmentService.updateQuiz(editId, quizData);
        toast.success('Quiz updated successfully!');
      } else {
        await assessmentService.createQuiz(quizData);
        toast.success('Quiz created successfully!');
      }

      // Reset form
      setShowForm(false);
      setEditId(null);
      setForm({
        title: '',
        description: '',
        passingScore: 70,
        maxAttempts: 3,
        timeLimitMinutes: 30,
        isPublished: false
      });
      setQuestions([]);
      loadData();
    } catch (err) {
      console.error('Save error:', err);
      toast.error(err.response?.data?.message || 'Failed to save quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuiz = (quiz) => {
    setForm({
      title: quiz.title,
      description: quiz.description || '',
      passingScore: quiz.passingScore,
      maxAttempts: quiz.maxAttempts,
      timeLimitMinutes: quiz.timeLimitMinutes || 30,
      isPublished: quiz.isPublished || false
    });
    setQuestions(quiz.questions || []);
    setEditId(quiz.quizId);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePublishQuiz = async (id) => {
    try {
      await assessmentService.publishQuiz(id);
      toast.success('Quiz published! Students can now take it.');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish quiz');
    }
  };

  const handleDeleteQuiz = async (id) => {
    if (!window.confirm('Delete this quiz? This action cannot be undone.')) return;
    try {
      await assessmentService.deleteQuiz(id);
      toast.success('Quiz deleted successfully');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete quiz');
    }
  };

  if (loading && !showForm) {
    return (
      <div className="page-content">
        <div className="loading-center"><div className="spinner" /></div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1>📋 Manage Quizzes</h1>
              <p>{course?.title} — Create and manage course quizzes</p>
              {course?.isApproved ? (
                <span className="badge badge-green">✅ Course Approved — Quizzes auto-approved</span>
              ) : (
                <span className="badge badge-yellow">⏳ Course Pending — Quiz will be available after course approval</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {!showForm && (
                <button className="btn btn-success" onClick={() => setShowForm(true)}>
                  + Create New Quiz
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

        {/* Create/Edit Quiz Form */}
        {showForm && (
          <div className="card" style={{ padding: 32, marginBottom: 32 }}>
            <h2 style={{ marginBottom: 24, color: 'var(--primary)' }}>
              {editId ? '✏️ Edit Quiz' : '➕ Create New Quiz'}
            </h2>
            <form onSubmit={handleCreateQuiz}>
              
              {/* Quiz Details */}
              <div className="grid-2" style={{ gap: 16, marginBottom: 24 }}>
                <div className="form-group">
                  <label className="form-label">Quiz Title *</label>
                  <input 
                    className="form-input" 
                    name="title" 
                    value={form.title}
                    onChange={handleFormChange}
                    placeholder="e.g., Python Basics Quiz"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea 
                    className="form-textarea" 
                    name="description" 
                    value={form.description}
                    onChange={handleFormChange}
                    rows={2}
                    placeholder="What will this quiz test?"
                  />
                </div>
              </div>

              <div className="grid-3" style={{ gap: 16, marginBottom: 24 }}>
                <div className="form-group">
                  <label className="form-label">Passing Score (%)</label>
                  <input 
                    className="form-input" 
                    type="number" 
                    name="passingScore" 
                    value={form.passingScore}
                    onChange={handleFormChange}
                    min={0} 
                    max={100}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Attempts</label>
                  <input 
                    className="form-input" 
                    type="number" 
                    name="maxAttempts" 
                    value={form.maxAttempts}
                    onChange={handleFormChange}
                    min={1} 
                    max={10}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Time Limit (minutes) - 0 = No limit</label>
                  <input 
                    className="form-input" 
                    type="number" 
                    name="timeLimitMinutes" 
                    value={form.timeLimitMinutes}
                    onChange={handleFormChange}
                    min={0}
                  />
                </div>
              </div>

              {/* Questions Section */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  📝 Questions ({questions.length})
                  <span style={{ fontSize: 12, color: 'var(--gray)', fontWeight: 'normal' }}>
                    Add at least 1 question
                  </span>
                </h3>

                {/* Add Question Form */}
                <div className="card" style={{ padding: 20, marginBottom: 20, background: 'var(--light-gray)' }}>
                  <h4 style={{ marginBottom: 16 }}>Add New Question</h4>
                  <div className="form-group">
                    <label className="form-label">Question Text</label>
                    <input 
                      className="form-input" 
                      value={currentQuestion.question}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                      placeholder="e.g., What is a variable in Python?"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Options (4 options)</label>
                    {currentQuestion.options.map((opt, idx) => (
                      <input 
                        key={idx}
                        className="form-input" 
                        style={{ marginBottom: 8 }}
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...currentQuestion.options];
                          newOpts[idx] = e.target.value;
                          setCurrentQuestion({ ...currentQuestion, options: newOpts });
                        }}
                        placeholder={`Option ${idx + 1}`}
                      />
                    ))}
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Correct Answer</label>
                    <select 
                      className="form-select"
                      value={currentQuestion.correctAnswer}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
                    >
                      <option value="">Select correct answer</option>
                      {currentQuestion.options.map((opt, idx) => (
                        opt && <option key={idx} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                  
                  <button type="button" className="btn btn-primary" onClick={handleAddQuestion}>
                    + Add Question
                  </button>
                </div>

                {/* Questions List */}
                {questions.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <h4>Added Questions</h4>
                    {questions.map((q, idx) => (
                      <div key={q.id} className="card" style={{ padding: 16, background: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <strong>Q{idx + 1}: {q.question}</strong>
                            <div style={{ fontSize: 13, color: 'var(--gray)', marginTop: 8 }}>
                              Options: {q.options.join(' | ')}
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--success)', marginTop: 4 }}>
                              ✓ Correct: {q.correctAnswer}
                            </div>
                          </div>
                          <button 
                            type="button" 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRemoveQuestion(idx)}
                          >
                            🗑️ Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    name="isPublished" 
                    checked={form.isPublished}
                    onChange={handleFormChange}
                  />
                  ✅ Publish immediately (students can take the quiz)
                </label>
                {!course?.isApproved && (
                  <p style={{ fontSize: 12, color: 'var(--warning)', marginTop: 8 }}>
                    ⚠️ Note: Quiz will be available only after the course is approved by admin
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                  {loading ? 'Saving...' : editId ? '💾 Update Quiz' : '✅ Create Quiz'}
                </button>
                <button type="button" className="btn btn-secondary btn-lg" onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                  setQuestions([]);
                  setForm({
                    title: '',
                    description: '',
                    passingScore: 70,
                    maxAttempts: 3,
                    timeLimitMinutes: 30,
                    isPublished: false
                  });
                }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Quizzes List */}
        {!showForm && (
          <>
            {quizzes.length === 0 ? (
              <div className="empty-state card" style={{ padding: 60 }}>
                <div style={{ fontSize: 64 }}>📋</div>
                <h3>No quizzes yet</h3>
                <p>Create quizzes to test your students' knowledge</p>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowForm(true)}>
                  + Create First Quiz
                </button>
              </div>
            ) : (
              <div>
                <h2 style={{ marginBottom: 16 }}>Course Quizzes ({quizzes.length})</h2>
                <div className="grid-2">
                  {quizzes.map(quiz => (
                    <div key={quiz.quizId} className="card" style={{ padding: 24 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div style={{ fontSize: 40 }}>📋</div>
                        <div>
                          {quiz.isPublished ? (
                            <span className="badge badge-green">✅ Published</span>
                          ) : (
                            <span className="badge badge-yellow">📝 Draft</span>
                          )}
                        </div>
                      </div>
                      <h3 style={{ marginBottom: 8 }}>{quiz.title}</h3>
                      {quiz.description && (
                        <p style={{ color: 'var(--gray)', fontSize: 14, marginBottom: 16 }}>{quiz.description}</p>
                      )}
                      <div style={{ display: 'flex', gap: 16, marginBottom: 20, fontSize: 13, color: 'var(--gray)' }}>
                        <span>📊 {quiz.questionCount || quiz.questions?.length || 0} questions</span>
                        <span>🎯 Pass: {quiz.passingScore}%</span>
                        <span>🔄 Max: {quiz.maxAttempts} attempts</span>
                        {quiz.timeLimitMinutes > 0 && <span>⏱️ {quiz.timeLimitMinutes} min</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEditQuiz(quiz)}>
                          ✏️ Edit
                        </button>
                        {!quiz.isPublished && (
                          <button className="btn btn-success btn-sm" onClick={() => handlePublishQuiz(quiz.quizId)}>
                            📢 Publish
                          </button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteQuiz(quiz.quizId)}>
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ManageQuizzes;