import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { courseService } from '../services/api';
import CourseCard from '../components/CourseCard';
import './CourseCatalogue.css';

const LEVELS    = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const CATEGORIES = ['All', 'Programming', 'Design', 'Business', 'Mobile Dev', 'AI & ML', 'Web Dev', 'Cybersecurity', 'Marketing'];

const CourseCatalogue = () => {
  const [courses, setCourses]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [activeCategory, setActiveCat] = useState('All');
  const [activeLevel, setActiveLvl]    = useState('All');
  const [searchParams]              = useSearchParams();

  useEffect(() => {
    const kw  = searchParams.get('search')   || '';
    const cat = searchParams.get('category') || '';
    if (kw)  setSearch(kw);
    if (cat) setActiveCat(cat);
    fetchCourses(kw, cat, '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchCourses = async (kw = '', cat = '', lvl = '') => {
    setLoading(true);
    try {
      let res;
      if (kw) {
        res = await courseService.search(kw);
      } else if (cat && cat !== 'All') {
        res = await courseService.filter({ category: cat, level: lvl && lvl !== 'All' ? lvl : undefined });
      } else if (lvl && lvl !== 'All') {
        res = await courseService.filter({ level: lvl });
      } else {
        res = await courseService.getPublished();
      }
      setCourses(res.data);
    } catch { setCourses([]); }
    finally  { setLoading(false); }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCourses(search, activeCategory !== 'All' ? activeCategory : '', activeLevel !== 'All' ? activeLevel : '');
  };

  const handleCategory = (cat) => {
    setActiveCat(cat);
    fetchCourses(search, cat !== 'All' ? cat : '', activeLevel !== 'All' ? activeLevel : '');
  };

  const handleLevel = (lvl) => {
    setActiveLvl(lvl);
    fetchCourses(search, activeCategory !== 'All' ? activeCategory : '', lvl !== 'All' ? lvl : '');
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="container">
          <h1>All Courses</h1>
          <p>Explore our complete catalogue of expert-led courses</p>
          {/* Search */}
          <form className="catalogue-search" onSubmit={handleSearch}>
            <input className="form-input" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search courses, topics, skills..." />
            <button type="submit" className="btn btn-primary">🔍 Search</button>
          </form>
        </div>
      </div>

      <div className="container catalogue-body">
        {/* Filters */}
        <div className="filters-panel">
          <div className="filter-section">
            <h4 className="filter-title">Category</h4>
            <div className="filter-pills">
              {CATEGORIES.map(cat => (
                <button key={cat}
                  className={`filter-pill ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => handleCategory(cat)}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-section">
            <h4 className="filter-title">Level</h4>
            <div className="filter-pills">
              {LEVELS.map(lvl => (
                <button key={lvl}
                  className={`filter-pill ${activeLevel === lvl ? 'active' : ''}`}
                  onClick={() => handleLevel(lvl)}>
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="catalogue-results">
          <div className="results-header">
            <p className="results-count">
              {loading ? 'Loading...' : `${courses.length} courses found`}
            </p>
          </div>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : courses.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 64 }}>🔍</div>
              <h3>No courses found</h3>
              <p>Try different search terms or filters</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }}
                onClick={() => { setSearch(''); setActiveCat('All'); setActiveLvl('All'); fetchCourses(); }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid-4">
              {courses.map(c => <CourseCard key={c.courseId} course={c} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCatalogue;