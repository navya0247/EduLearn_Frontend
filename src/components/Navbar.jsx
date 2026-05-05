import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, isLoggedIn, logout, isStudent, isInstructor, isAdmin } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path ? 'active' : '';

  const handleLogout = () => {
    logout();
    navigate('/login');
    setOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo">
          <div className="logo-icon">E</div>
          <span>EduLearn</span>
        </Link>

        {/* Desktop Links */}
        <div className="navbar-links">
          <Link to="/"        className={`nav-link ${isActive('/')}`}>Home</Link>
          <Link to="/courses" className={`nav-link ${isActive('/courses')}`}>Courses</Link>
          {isStudent()    && <Link to="/my-courses"           className={`nav-link ${isActive('/my-courses')}`}>My Courses</Link>}
          {isStudent()    && <Link to="/certificates"         className={`nav-link ${isActive('/certificates')}`}>Certificates</Link>}
          {isInstructor() && <Link to="/instructor/dashboard" className={`nav-link ${isActive('/instructor/dashboard')}`}>Dashboard</Link>}
          {isAdmin()      && <Link to="/admin/dashboard"      className={`nav-link ${isActive('/admin/dashboard')}`}>Admin</Link>}
        </div>

        {/* Auth */}
        <div className="navbar-auth">
          {isLoggedIn() ? (
            <div className="user-menu">
              <button className="user-avatar-btn" onClick={() => setOpen(!open)}>
                <div className="user-avatar">{user?.fullName?.charAt(0)?.toUpperCase()}</div>
                <span className="user-name-short">{user?.fullName?.split(' ')[0]}</span>
                <span className="chevron">▾</span>
              </button>
              {open && (
                <div className="dropdown">
                  <div className="dropdown-header">
                    <p className="dh-name">{user?.fullName}</p>
                    <p className="dh-email">{user?.email}</p>
                    <span className={`badge ${user?.role === 'ADMIN' ? 'badge-red' : user?.role === 'INSTRUCTOR' ? 'badge-purple' : 'badge-blue'}`}>
                      {user?.role}
                    </span>
                  </div>
                  <Link to="/profile"  className="dd-item" onClick={() => setOpen(false)}>👤 My Profile</Link>
                  {isStudent()    && <Link to="/my-courses"           className="dd-item" onClick={() => setOpen(false)}>📚 My Courses</Link>}
                  {isStudent()    && <Link to="/certificates"         className="dd-item" onClick={() => setOpen(false)}>🏆 Certificates</Link>}
                  {isInstructor() && <Link to="/instructor/dashboard" className="dd-item" onClick={() => setOpen(false)}>📊 Dashboard</Link>}
                  {isAdmin()      && <Link to="/admin/dashboard"      className="dd-item" onClick={() => setOpen(false)}>⚙️ Admin Panel</Link>}
                  <hr className="dd-divider" />
                  <button className="dd-item logout" onClick={handleLogout}>🚪 Logout</button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-btns">
              <Link to="/login"    className="btn btn-secondary btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign Up Free</Link>
            </div>
          )}
        </div>

        {/* Hamburger */}
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="mobile-menu">
          <Link to="/"        className="m-link" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/courses" className="m-link" onClick={() => setMenuOpen(false)}>Courses</Link>
          {isStudent()    && <Link to="/my-courses" className="m-link" onClick={() => setMenuOpen(false)}>My Courses</Link>}
          {isInstructor() && <Link to="/instructor/dashboard" className="m-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>}
          {isAdmin()      && <Link to="/admin/dashboard" className="m-link" onClick={() => setMenuOpen(false)}>Admin</Link>}
          {isLoggedIn() ? (
            <button className="m-link logout" onClick={handleLogout}>Logout</button>
          ) : (
            <>
              <Link to="/login"    className="m-link" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="m-link" onClick={() => setMenuOpen(false)}>Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;