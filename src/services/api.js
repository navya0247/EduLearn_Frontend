import axios from 'axios';

// ── Single Gateway URL — routes all requests to correct microservice ──────────
const GATEWAY = 'http://localhost:5000';

const createAxios = () => {
  const instance = axios.create({ baseURL: GATEWAY });
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  instance.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(err);
    }
  );
  return instance;
};

const api = createAxios();

export const authApi = api;
export const courseApi = api;
export const lessonApi = api;
export const enrollmentApi = api;
export const assessmentApi = api;
export const progressApi = api;
export const reviewApi = api;
export const paymentApi = api;

// ── Auth Service ──────────────────────────────────────────────────────────────
export const authService = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
  getProfile: (id) => api.get(`/api/auth/users/${id}/profile`),
  updateProfile: (id, data) => api.put(`/api/auth/users/${id}/profile`, data),
  changePassword: (id, data) => api.put(`/api/auth/users/${id}/change-password`, data),
  getUsersByRole: (role) => api.get(`/api/auth/users/by-role/${role}`),
  searchUsers: (term) => api.get(`/api/auth/users/search?term=${term}`),
  suspendUser: (id) => api.put(`/api/auth/users/${id}/suspend`),
  reactivateUser: (id) => api.put(`/api/auth/users/${id}/reactivate`),
  deleteUser: (id) => api.delete(`/api/auth/users/${id}`),
};

// ── Course Service ────────────────────────────────────────────────────────────
export const courseService = {
  getPublished: () => api.get('/api/courses/published'),
  getById: (id) => api.get(`/api/courses/${id}`),
  search: (kw) => api.get(`/api/courses/search?keyword=${kw}`),
  filter: (params) => api.get('/api/courses/filter', { params }),
  getTop: (n = 8) => api.get(`/api/courses/top?count=${n}`),
  create: (data) => api.post('/api/courses', data),
  update: (id, data) => api.put(`/api/courses/${id}`, data),
  publish: (id) => api.put(`/api/courses/${id}/publish`),
  approve: (id) => api.put(`/api/courses/${id}/approve`),
  reject: (id) => api.put(`/api/courses/${id}/reject`),
  deleteCourse: (id) => api.delete(`/api/courses/${id}`),
  getByInstructor: (id) => api.get(`/api/courses/instructor/${id}`),
  getByCategory: (cat) => api.get(`/api/courses/category/${cat}`),
};

// ── Lesson Service ────────────────────────────────────────────────────────────
export const lessonService = {
  getByCourse: (cid) => api.get(`/api/lessons/course/${cid}`),
  getById: (id) => api.get(`/api/lessons/${id}`),
  getPreview: (cid) => api.get(`/api/lessons/preview/${cid}`),
  getCount: (cid) => api.get(`/api/lessons/count/${cid}`),
  getContentUrl: (id) => api.get(`/api/lessons/${id}/content-url`),
  addLesson: (data) => api.post('/api/lessons', data),
  updateLesson: (id, d) => api.put(`/api/lessons/${id}`, d),
  publishLesson: (id) => api.put(`/api/lessons/${id}/publish`),
  deleteLesson: (id) => api.delete(`/api/lessons/${id}`),
  reorder: (data) => api.put('/api/lessons/reorder', data),
};

// ── Enrollment Service ────────────────────────────────────────────────────────
export const enrollmentService = {
  enroll: (data) => api.post('/api/enrollments', data),
  getMyCourses: () => api.get('/api/enrollments/my-courses'),
  getCompleted: () => api.get('/api/enrollments/my-courses/completed'),
  getInProgress: () => api.get('/api/enrollments/my-courses/in-progress'),
  isEnrolled: (cid) => api.get(`/api/enrollments/is-enrolled/${cid}`),
  drop: (id) => api.put(`/api/enrollments/${id}/drop`),
  complete: (id) => api.put(`/api/enrollments/${id}/complete`),
  updateProgress: (id, d) => api.put(`/api/enrollments/${id}/progress`, d),
  getAnalytics: (cid) => api.get(`/api/enrollments/course/${cid}/analytics`),
  getByCourse: (cid) => api.get(`/api/enrollments/course/${cid}`),
};

// ── Assessment Service ────────────────────────────────────────────────────────
export const assessmentService = {
  getByCourse: (cid) => api.get(`/api/quizzes/course/${cid}`),
  getById: (id) => api.get(`/api/quizzes/${id}`),
  getQuestions: (id) => api.get(`/api/quizzes/${id}/questions`),
  startAttempt: (id) => api.post(`/api/quizzes/${id}/start`),
  submitAttempt: (id, d) => api.put(`/api/quizzes/attempt/${id}/submit`, d),
  getMyAttempts: (id) => api.get(`/api/quizzes/${id}/my-attempts`),
  getBestAttempt: (id) => api.get(`/api/quizzes/${id}/best-attempt`),
  createQuiz: (data) => api.post('/api/quizzes', data),
  updateQuiz: (id, data) => api.put(`/api/quizzes/${id}`, data),
  publishQuiz: (id) => api.put(`/api/quizzes/${id}/publish`),
  deleteQuiz: (id) => api.delete(`/api/quizzes/${id}`),
};

// ── Progress Service ──────────────────────────────────────────────────────────
export const progressService = {
  trackLesson: (data) => api.post('/api/progress/lesson', data),
  completeLesson: (data) => api.put('/api/progress/lesson/complete', data),
  getCourseProgress: (cid, total) => api.get(`/api/progress/course/${cid}/summary?totalLessons=${total}`),
  getLessonProgress: (cid) => api.get(`/api/progress/course/${cid}`),
  getMyCertificates: () => api.get('/api/certificates/my-certificates'),
  getCertificate: (cid) => api.get(`/api/certificates/course/${cid}`),
  issueCertificate: (data) => api.post('/api/certificates', data),
  verifyCertificate: (code) => api.get(`/api/certificates/verify/${code}`),
  downloadCertificate: async (id) => {
    const response = await api.get(`/api/certificates/${id}/download`, {
      responseType: 'blob'
    });
    return response;
  },
};

// ── Review Service ────────────────────────────────────────────────────────────
export const reviewService = {
  getApproved: (cid) => api.get(`/api/reviews/course/${cid}`),
  getSummary: (cid) => api.get(`/api/reviews/course/${cid}/summary`),
  getAllByCourse: (cid) => api.get(`/api/reviews/course/${cid}/all`),
  submit: (data) => api.post('/api/reviews', data),
  update: (id, d) => api.put(`/api/reviews/${id}`, d),
  delete: (id) => api.delete(`/api/reviews/${id}`),
  getMyReviews: () => api.get('/api/reviews/my-reviews'),
  getPending: () => api.get('/api/reviews/pending'),
  approve: (id) => api.put(`/api/reviews/${id}/approve`),
  hide: (id) => api.put(`/api/reviews/${id}/hide`),
};

// ── Payment Service ───────────────────────────────────────────────────────────
export const paymentService = {
  createOrder: (data) => api.post('/api/payments/create-order', data),
  verify: (data) => api.post('/api/payments/verify', data),
  getById: (id) => api.get(`/api/payments/${id}`),
  getByStudent: (id) => api.get(`/api/payments/student/${id}`),
};

export default api;