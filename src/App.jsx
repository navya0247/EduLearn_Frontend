import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout
import Navbar from './components/Navbar';

// Public Pages
import HomePage        from './pages/HomePage';
import LoginPage       from './pages/LoginPage';
import RegisterPage    from './pages/RegisterPage';
import CourseCatalogue from './pages/CourseCatalogue';
import CourseDetail    from './pages/CourseDetail';

// Student Pages
import MyCourses       from './pages/MyCourses';
import LessonPlayer    from './pages/LessonPlayer';
import QuizPage        from './pages/QuizPage';
import CertificatePage from './pages/CertificatePage';
import ProfilePage     from './pages/ProfilePage';

// Instructor Pages
import InstructorDashboard from './pages/InstructorDashboard';
import CreateCourse        from './pages/CreateCourse';
import ManageLessons       from './pages/ManageLessons';
import ManageQuizzes       from './pages/ManageQuizzes';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';


const GOOGLE_CLIENT_ID = '252929684759-dnrn26ophajpqstq842i9qnfive6mduo.apps.googleusercontent.com';

// Protected Route
const ProtectedRoute = ({ children, roles }) => {
  const { isLoggedIn, user } = useAuth();
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  const { isLoggedIn } = useAuth();
  return (
    <>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/"            element={<HomePage />} />
        <Route path="/courses"     element={<CourseCatalogue />} />
        <Route path="/courses/:id" element={<CourseDetail />} />
        <Route path="/login"       element={isLoggedIn() ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="/register"    element={isLoggedIn() ? <Navigate to="/" /> : <RegisterPage />} />

        {/* Student */}
        <Route path="/my-courses"   element={<ProtectedRoute roles={['STUDENT']}><MyCourses /></ProtectedRoute>} />
        <Route path="/lesson/:id"   element={<ProtectedRoute roles={['STUDENT']}><LessonPlayer /></ProtectedRoute>} />
        <Route path="/quiz/:id"     element={<ProtectedRoute roles={['STUDENT']}><QuizPage /></ProtectedRoute>} />
        <Route path="/quiz/course/:courseId" element={<ProtectedRoute roles={['STUDENT']}><QuizPage /></ProtectedRoute>} />
        <Route path="/certificates" element={<ProtectedRoute roles={['STUDENT']}><CertificatePage /></ProtectedRoute>} />
        <Route path="/profile"      element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

        {/* Instructor */}
        <Route path="/instructor/dashboard"
          element={<ProtectedRoute roles={['INSTRUCTOR']}><InstructorDashboard /></ProtectedRoute>} />
        <Route path="/instructor/create-course"
          element={<ProtectedRoute roles={['INSTRUCTOR']}><CreateCourse /></ProtectedRoute>} />
        <Route path="/instructor/courses/:courseId/lessons"
          element={<ProtectedRoute roles={['INSTRUCTOR']}><ManageLessons /></ProtectedRoute>} />
        <Route path="/instructor/courses/:courseId/quizzes"
          element={<ProtectedRoute roles={['INSTRUCTOR']}><ManageQuizzes /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin/dashboard"
          element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <ToastContainer position="top-right" autoClose={3000} theme="colored" />
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;