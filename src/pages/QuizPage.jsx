import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { assessmentService } from '../services/api';

const QuizPage = () => {
  const { courseId, id } = useParams();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('list');

  const loadQuizzes = useCallback(async () => {
    try {
      const res = await assessmentService.getByCourse(courseId);
      let quizList = [];
      if (res.data && res.data.$values) {
        quizList = res.data.$values;
      } else if (Array.isArray(res.data)) {
        quizList = res.data;
      }
      setQuizzes(quizList);
    } catch {
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      loadQuizzes();
    } else if (id) {
      loadSingleQuiz();
    }
  }, [courseId, id, loadQuizzes]);

  const loadSingleQuiz = async () => {
    try {
      const res = await assessmentService.getById(id);
      setSelectedQuiz(res.data);
      const questionsRes = await assessmentService.getQuestions(id);
      let questionsList = [];
      if (questionsRes.data && questionsRes.data.$values) {
        questionsList = questionsRes.data.$values;
      } else if (Array.isArray(questionsRes.data)) {
        questionsList = questionsRes.data;
      }
      setQuestions(questionsList);
      setStep('quiz');
    } catch {
      toast.error('Quiz not found');
      navigate('/my-courses');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async (quiz) => {
    setSelectedQuiz(quiz);
    setLoading(true);
    try {
      const questionsRes = await assessmentService.getQuestions(quiz.quizId);
      let questionsList = [];
      if (questionsRes.data && questionsRes.data.$values) {
        questionsList = questionsRes.data.$values;
      } else if (Array.isArray(questionsRes.data)) {
        questionsList = questionsRes.data;
      }
      setQuestions(questionsList);
      
      const attemptRes = await assessmentService.startAttempt(quiz.quizId);
      setAttempt(attemptRes.data);
      setStep('quiz');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot start quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex, answer) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: answer }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      toast.warning(`Please answer all ${questions.length} questions`);
      return;
    }
    
    setLoading(true);
    try {
      const res = await assessmentService.submitAttempt(attempt.attemptId, { answers });
      setResult(res.data);
      setStep('result');
      
      if (res.data.isPassed) {
        toast.success('🎉 Congratulations! You passed the quiz!');
      } else {
        toast.warning(`Score: ${res.data.score}%. Need ${res.data.passingScore}% to pass.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-center"><div className="spinner" /></div>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ background: '#F8FAFC', minHeight: '100vh', paddingTop: 80 }}>
      <div className="container" style={{ maxWidth: 800 }}>
        
        {step === 'list' && (
          <>
            <div className="page-header" style={{ marginBottom: 32 }}>
              <h1>📝 Course Quizzes</h1>
              <p>Test your knowledge and earn certificates</p>
            </div>
            
            {quizzes.length === 0 ? (
              <div className="empty-state card" style={{ padding: 60 }}>
                <div style={{ fontSize: 64 }}>📋</div>
                <h3>No quizzes available</h3>
                <p>This course doesn't have any quizzes yet.</p>
                <button className="btn btn-secondary" onClick={() => navigate(-1)}>
                  ← Back to Course
                </button>
              </div>
            ) : (
              <div className="grid-2">
                {quizzes.map((quiz, quizIdx) => (
                  <div key={quiz.quizId || quizIdx} className="card" style={{ padding: 24 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                    <h3 style={{ marginBottom: 8 }}>{quiz.title}</h3>
                    {quiz.description && (
                      <p style={{ color: 'var(--gray)', fontSize: 14, marginBottom: 16 }}>{quiz.description}</p>
                    )}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 20, fontSize: 13, color: 'var(--gray)' }}>
                      <span>📊 {quiz.questionCount || 0} questions</span>
                      <span>🎯 Pass: {quiz.passingScore}%</span>
                      <span>🔄 Max: {quiz.maxAttempts} attempts</span>
                    </div>
                    <button className="btn btn-primary btn-full" onClick={() => handleStartQuiz(quiz)}>
                      Start Quiz →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Quiz Taking */}
        {step === 'quiz' && selectedQuiz && questions.length > 0 && (
          <div className="card" style={{ padding: 32 }}>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ marginBottom: 8 }}>{selectedQuiz.title}</h2>
              <div className="progress-bar-wrap" style={{ height: 6 }}>
                <div className="progress-bar-fill" style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%`, background: 'var(--primary)' }} />
              </div>
              <p style={{ fontSize: 13, color: 'var(--gray)', marginTop: 8 }}>
                {Object.keys(answers).length} of {questions.length} answered
              </p>
            </div>

            {questions.map((q, qIdx) => {
              const currentAnswer = answers[qIdx];
              // Extract options - handle both array and object with $values
              let options = [];
              if (q.options && Array.isArray(q.options)) {
                options = q.options;
              } else if (q.options && q.options.$values && Array.isArray(q.options.$values)) {
                options = q.options.$values;
              }
              
              return (
                <div key={qIdx} style={{ marginBottom: 24, padding: 20, background: 'var(--light-gray)', borderRadius: 8 }}>
                  <p style={{ fontWeight: 700, marginBottom: 16 }}>Q{qIdx + 1}. {q.question}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {options.map((opt, optIdx) => {
                      // Create a unique key using question index + option index + option text
                      const uniqueKey = `${qIdx}_${optIdx}_${opt}`;
                      const isSelected = currentAnswer === opt;
                      
                      return (
                        <label 
                          key={uniqueKey}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                            borderRadius: 8, border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                            background: isSelected ? 'var(--primary-light)' : 'white',
                            cursor: 'pointer', transition: 'all 0.15s'
                          }}
                        >
                          <input 
                            type="radio" 
                            name={`question_${qIdx}`}
                            value={opt} 
                            style={{ display: 'none' }}
                            checked={isSelected}
                            onChange={() => handleAnswerChange(qIdx, opt)}
                          />
                          <span style={{ 
                            width: 20, height: 20, borderRadius: '50%', 
                            border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`, 
                            background: isSelected ? 'var(--primary)' : 'white',
                            flexShrink: 0 
                          }} />
                          {opt}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <button className="btn btn-primary btn-lg btn-full" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Quiz →'}
            </button>
          </div>
        )}

        {step === 'result' && result && (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 80, marginBottom: 16 }}>{result.isPassed ? '🎉' : '😔'}</div>
            <h1 style={{ marginBottom: 8 }}>{result.isPassed ? 'Congratulations!' : 'Better luck next time!'}</h1>
            <p style={{ color: 'var(--gray)', marginBottom: 32 }}>
              {result.isPassed ? 'You passed the quiz!' : 'You did not reach the passing score.'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 48, marginBottom: 32 }}>
              <div>
                <div style={{ fontSize: 52, fontWeight: 800, color: result.isPassed ? 'var(--success)' : 'var(--danger)' }}>{result.score}%</div>
                <div style={{ color: 'var(--gray)' }}>Your Score</div>
              </div>
              <div>
                <div style={{ fontSize: 52, fontWeight: 800, color: 'var(--warning)' }}>{result.passingScore}%</div>
                <div style={{ color: 'var(--gray)' }}>Passing Score</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => navigate(`/lesson/${courseId}`)}>
                ← Back to Course
              </button>
              {!result.isPassed && (
                <button className="btn btn-primary" onClick={() => { 
                  setStep('list'); 
                  setAnswers({}); 
                  setResult(null);
                  loadQuizzes();
                }}>
                  Try Again
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizPage;