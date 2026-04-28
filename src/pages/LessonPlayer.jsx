import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { lessonService, progressService, enrollmentService, courseService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const LessonPlayer = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [contentUrl, setContentUrl] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [progressPercent, setProgressPercent] = useState(0);
  const [certificateIssued, setCertificateIssued] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        // Get course details for certificate
        try {
          const courseData = await courseService.getById(id);
          setCourseTitle(courseData.data?.title || `Course ${id}`);
        } catch (err) {
          console.error('Failed to get course details:', err);
        }

        const res = await lessonService.getByCourse(id);
        const data = Array.isArray(res.data) ? res.data : [];
        const sorted = data.sort((a, b) => a.displayOrder - b.displayOrder);
        setLessons(sorted);
        
        if (sorted.length > 0) {
          setCurrentLesson(sorted[0]);
        }

        await fetchCompletedLessons(sorted.length);
        
      } catch (err) {
        console.error('Load error:', err);
        toast.error('Could not load lessons');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const fetchCompletedLessons = async (totalLessons) => {
    try {
      const progressRes = await progressService.getLessonProgress(id);
      let completedIds = [];
      
      // Handle different response formats
      if (Array.isArray(progressRes.data)) {
        completedIds = progressRes.data.filter(p => p.isCompleted).map(p => p.lessonId);
      } else if (progressRes.data && Array.isArray(progressRes.data.$values)) {
        completedIds = progressRes.data.$values.filter(p => p.isCompleted).map(p => p.lessonId);
      }
      
      setCompletedLessons(completedIds);
      const percent = totalLessons > 0 ? Math.round((completedIds.length / totalLessons) * 100) : 0;
      setProgressPercent(percent);
      
      if (percent === 100 && totalLessons > 0 && !certificateIssued) {
        await checkAndIssueCertificate();
      }
    } catch (err) {
      console.error('Failed to fetch progress:', err);
      const saved = localStorage.getItem(`progress_${id}`);
      if (saved) {
        const completedIds = JSON.parse(saved);
        setCompletedLessons(completedIds);
        const percent = totalLessons > 0 ? Math.round((completedIds.length / totalLessons) * 100) : 0;
        setProgressPercent(percent);
      }
    }
  };

  const checkAndIssueCertificate = async () => {
    try {
      // Get course details
      const courseData = await courseService.getById(id);
      const courseName = courseData.data?.title || courseTitle || `Course ${id}`;
      
      // Check if certificate already exists
      const certs = await progressService.getMyCertificates();
      let certificates = [];
      
      // Handle different response formats
      if (Array.isArray(certs.data)) {
        certificates = certs.data;
      } else if (certs.data && Array.isArray(certs.data.$values)) {
        certificates = certs.data.$values;
      }
      
      const hasCert = certificates.some(c => c.courseId == id || c.courseId === parseInt(id));
      
      if (!hasCert && progressPercent === 100) {
        // Issue certificate with ALL required fields
        await progressService.issueCertificate({ 
          courseId: parseInt(id),
          studentId: user?.userId,
          studentName: user?.fullName || "Student",
          courseName: courseName
        });
        
        setCertificateIssued(true);
        toast.success('🏆 Certificate issued! Check your Certificates page');
        
        // Update enrollment status to COMPLETED
        try {
          const enrollments = await enrollmentService.getMyCourses();
          let enrollmentList = [];
          if (Array.isArray(enrollments.data)) {
            enrollmentList = enrollments.data;
          } else if (enrollments.data && Array.isArray(enrollments.data.$values)) {
            enrollmentList = enrollments.data.$values;
          }
          
          const enrollment = enrollmentList.find(e => e.courseId == id);
          if (enrollment && enrollment.status !== 'COMPLETED') {
            await enrollmentService.complete(enrollment.enrollmentId);
          }
        } catch (e) {
          console.error('Failed to update enrollment:', e);
        }
      }
    } catch (err) {
      console.error('Certificate check failed:', err);
    }
  };

  const fetchContentUrl = async (lessonId) => {
    setLoadingContent(true);
    try {
      const response = await lessonService.getContentUrl(lessonId);
      setContentUrl(response.data?.contentUrl);
    } catch (error) {
      console.error('Failed to fetch content URL:', error);
    } finally {
      setLoadingContent(false);
    }
  };

  useEffect(() => {
    if (currentLesson && currentLesson.contentType === 'VIDEO') {
      fetchContentUrl(currentLesson.lessonId);
    } else if (currentLesson) {
      setContentUrl(currentLesson.contentUrl);
    }
    
    if (currentLesson && completedLessons.includes(currentLesson.lessonId)) {
      setCompleted(true);
    } else {
      setCompleted(false);
    }
  }, [currentLesson, completedLessons]);

  const handleComplete = async () => {
    if (!currentLesson) return;
    if (completed) {
      toast.info('Lesson already completed!');
      return;
    }
    
    setCompleting(true);
    try {
      // 1. Mark lesson as complete
      await progressService.completeLesson({
        lessonId: currentLesson.lessonId,
        courseId: parseInt(id)
      });

      // 2. Force refresh progress from backend
      const progressRes = await progressService.getLessonProgress(id);
      let completedIds = [];
      if (Array.isArray(progressRes.data)) {
        completedIds = progressRes.data.filter(p => p.isCompleted).map(p => p.lessonId);
      } else if (progressRes.data && Array.isArray(progressRes.data.$values)) {
        completedIds = progressRes.data.$values.filter(p => p.isCompleted).map(p => p.lessonId);
      }
      
      setCompletedLessons(completedIds);
      
      // 3. Calculate progress
      const newPercent = Math.round((completedIds.length / lessons.length) * 100);
      setProgressPercent(newPercent);
      
      // 4. Update enrollment progress in backend
      try {
        const enrollments = await enrollmentService.getMyCourses();
        let enrollmentList = [];
        if (Array.isArray(enrollments.data)) {
          enrollmentList = enrollments.data;
        } else if (enrollments.data && Array.isArray(enrollments.data.$values)) {
          enrollmentList = enrollments.data.$values;
        }
        const enrollment = enrollmentList.find(e => e.courseId == id);
        if (enrollment) {
          await enrollmentService.updateProgress(enrollment.enrollmentId, { progressPercent: newPercent });
        }
      } catch (e) {
        console.error('Failed to update enrollment progress:', e);
      }
      
      setCompleted(true);
      localStorage.setItem(`progress_${id}`, JSON.stringify(completedIds));
      
      toast.success(`✅ Lesson completed! Progress: ${newPercent}%`);

      // 5. Auto-issue certificate when 100%
      if (newPercent === 100) {
        toast.success('🎉 Congratulations! You completed the course!');
        await checkAndIssueCertificate();
      }

      // 6. Move to next lesson
      const idx = lessons.findIndex(l => l.lessonId === currentLesson.lessonId);
      const next = lessons[idx + 1];
      if (next) {
        setTimeout(() => {
          setCurrentLesson(next);
        }, 1500);
      }

    } catch (error) {
      console.error('Complete lesson error:', error);
      toast.error(error.response?.data?.message || 'Failed to mark lesson complete');
    } finally {
      setCompleting(false);
    }
  };

  const renderContent = (lesson) => {
    if (!lesson) return null;
    
    if (lesson.contentType === 'VIDEO' && loadingContent) {
      return (
        <div style={{ padding: 60, textAlign: 'center', minHeight: 400, background: '#1a1a2e' }}>
          <div className="spinner" style={{ margin: '0 auto' }} />
          <p style={{ color: 'white', marginTop: 20 }}>Loading video...</p>
        </div>
      );
    }

    const url = contentUrl || lesson.contentUrl;

    if (lesson.contentType === 'VIDEO') {
      if (!url) {
        return (
          <div style={{ padding: 60, textAlign: 'center', minHeight: 400, background: '#1a1a2e' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎬</div>
            <p style={{ color: 'white' }}>Video URL not available</p>
          </div>
        );
      }

      const isYouTube = url.includes('youtube.com/embed') || url.includes('youtu.be') || url.includes('youtube.com/watch');
      
      if (isYouTube) {
        let embedUrl = url;
        if (url.includes('watch?v=')) {
          const videoId = new URLSearchParams(url.split('?')[1]).get('v');
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (url.includes('youtu.be/')) {
          const videoId = url.split('youtu.be/')[1].split('?')[0];
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
        
        return (
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', background: '#000' }}>
            <iframe
              src={embedUrl}
              title={lesson.title}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              frameBorder="0"
            />
          </div>
        );
      } else {
        return (
          <div style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <video
              controls
              autoPlay
              style={{ width: '100%', maxHeight: '520px' }}
              src={url}
              onError={(e) => {
                console.error('Video load error:', e);
                toast.error('Video failed to load');
              }}
            >
              <source src={url} />
              Your browser does not support the video tag.
            </video>
          </div>
        );
      }
    }

    if (lesson.contentType === 'PDF') {
      return (
        <div style={{ padding: 60, textAlign: 'center', minHeight: 400, background: '#1a1a2e' }}>
          <div style={{ fontSize: 80, marginBottom: 20 }}>📄</div>
          <h2 style={{ color: 'white', marginBottom: 12 }}>{lesson.title}</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
            Click below to open or download the PDF document
          </p>
          <a href={url} target="_blank" rel="noreferrer" className="btn btn-primary btn-lg">
            📥 Open PDF
          </a>
        </div>
      );
    }

    if (lesson.contentType === 'ARTICLE') {
      return (
        <div style={{ padding: 60, textAlign: 'center', minHeight: 400, background: '#1a1a2e' }}>
          <div style={{ fontSize: 80, marginBottom: 20 }}>📝</div>
          <h2 style={{ color: 'white', marginBottom: 12 }}>{lesson.title}</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
            Click below to read the article
          </p>
          <a href={url} target="_blank" rel="noreferrer" className="btn btn-primary btn-lg">
            📖 Read Article
          </a>
        </div>
      );
    }

    if (lesson.contentType === 'QUIZ_LINK') {
      return (
        <div style={{ padding: 60, textAlign: 'center', minHeight: 400, background: '#1a1a2e' }}>
          <div style={{ fontSize: 80, marginBottom: 20 }}>📋</div>
          <h2 style={{ color: 'white', marginBottom: 12 }}>{lesson.title}</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
            Test your knowledge with this quiz
          </p>
          <button 
            className="btn btn-primary btn-lg"
            onClick={() => navigate(`/quiz/course/${id}`)}
          >
            📝 Take Quiz
          </button>
        </div>
      );
    }

    return (
      <div style={{ padding: 60, textAlign: 'center', minHeight: 400, background: '#1a1a2e' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎬</div>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>Content not available</p>
      </div>
    );
  };

  if (loading) return <div className="loading-center" style={{ paddingTop: 100 }}><div className="spinner" /></div>;

  if (lessons.length === 0) return (
    <div className="empty-state" style={{ paddingTop: 100 }}>
      <div style={{ fontSize: 64 }}>🎬</div>
      <h3>No lessons available yet</h3>
      <p>The instructor has not added any lessons to this course.</p>
      <Link to={`/courses/${id}`} className="btn btn-primary" style={{ marginTop: 16 }}>
        ← Back to Course
      </Link>
    </div>
  );

  return (
    <div style={{ background: '#0F172A', minHeight: '100vh', paddingTop: 60 }}>
      <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
        <div style={{
          width: 300, background: '#1E293B', overflowY: 'auto',
          borderRight: '1px solid rgba(255,255,255,0.1)', flexShrink: 0
        }}>
          <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <Link to={`/courses/${id}`}
              style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              ← Back to Course
            </Link>
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white', fontSize: 12, marginBottom: 4 }}>
                <span>Course Progress</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="progress-bar-wrap">
                <div className="progress-bar-fill" style={{ width: `${progressPercent}%`, background: progressPercent === 100 ? '#10B981' : '#6366F1' }} />
              </div>
            </div>
          </div>

          {lessons.map((l, idx) => {
            const isCompleted = completedLessons.includes(l.lessonId);
            return (
              <div key={l.lessonId}
                onClick={() => { 
                  setCurrentLesson(l); 
                  setContentUrl(null);
                }}
                style={{
                  padding: '14px 16px', cursor: 'pointer',
                  background: currentLesson?.lessonId === l.lessonId
                    ? 'rgba(99,102,241,0.3)' : 'transparent',
                  borderLeft: currentLesson?.lessonId === l.lessonId
                    ? '3px solid #6366F1' : '3px solid transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  transition: 'all 0.15s',
                  opacity: isCompleted ? 0.7 : 1,
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: isCompleted ? '#10B981' : (currentLesson?.lessonId === l.lessonId ? '#6366F1' : 'rgba(255,255,255,0.1)'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: 12, fontWeight: 700, flexShrink: 0
                  }}>
                    {isCompleted ? '✓' : idx + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontSize: 13, fontWeight: 600, lineHeight: 1.3 }}>
                      {l.title}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>
                      {l.contentType === 'VIDEO' && '🎬'}
                      {l.contentType === 'PDF' && '📄'}
                      {l.contentType === 'ARTICLE' && '📝'}
                      {l.contentType === 'QUIZ_LINK' && '📋'}
                      {' '}{l.durationMinutes} min
                      {l.isPreview && <span style={{ color: '#10B981', marginLeft: 6 }}>Free</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ minHeight: 400 }}>
            {renderContent(currentLesson)}
          </div>

          <div style={{ padding: '24px 32px', color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 6 }}>
                  {currentLesson?.contentType}
                </div>
                <h1 style={{ color: 'white', fontSize: 22, marginBottom: 8 }}>
                  {currentLesson?.title}
                </h1>
                {currentLesson?.description && (
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.6 }}>
                    {currentLesson.description}
                  </p>
                )}
              </div>

              <div style={{ flexShrink: 0, paddingTop: 8 }}>
                {currentLesson?.contentType === 'QUIZ_LINK' ? (
                  <button 
                    className="btn btn-primary btn-lg"
                    onClick={() => navigate(`/quiz/course/${id}`)}
                  >
                    📝 Take Quiz
                  </button>
                ) : completed ? (
                  <div className="badge badge-green" style={{ fontSize: 14, padding: '10px 20px' }}>
                    ✅ Completed!
                  </div>
                ) : (
                  <button className="btn btn-success btn-lg"
                    onClick={handleComplete} disabled={completing}>
                    {completing ? 'Marking...' : '✅ Mark as Complete'}
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              {lessons.findIndex(l => l.lessonId === currentLesson?.lessonId) > 0 && (
                <button className="btn btn-secondary"
                  onClick={() => {
                    const idx = lessons.findIndex(l => l.lessonId === currentLesson?.lessonId);
                    setCurrentLesson(lessons[idx - 1]);
                    setContentUrl(null);
                  }}>
                  ← Previous Lesson
                </button>
              )}
              {lessons.findIndex(l => l.lessonId === currentLesson?.lessonId) < lessons.length - 1 && (
                <button className="btn btn-primary"
                  onClick={() => {
                    const idx = lessons.findIndex(l => l.lessonId === currentLesson?.lessonId);
                    setCurrentLesson(lessons[idx + 1]);
                    setContentUrl(null);
                  }}>
                  Next Lesson →
                </button>
              )}
              {progressPercent === 100 && (
                <Link to="/certificates" className="btn btn-warning">
                  🏆 View My Certificates
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPlayer;