import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { progressService } from '../services/api';

const CertificatePage = () => {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyCode, setVerifyCode] = useState('');
  const [verified, setVerified] = useState(null);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    loadCertificates();
  }, []);

  const loadCertificates = async () => {
    setLoading(true);
    try {
      const res = await progressService.getMyCertificates();
      let certificates = [];
      if (res.data && Array.isArray(res.data)) {
        certificates = res.data;
      } else if (res.data && res.data.$values) {
        certificates = res.data.$values;
      }
      console.log('Certificates:', certificates);
      setCerts(certificates);
    } catch (err) {
      console.error('Failed to load certificates:', err);
      setCerts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!verifyCode.trim()) {
      toast.error('Please enter a certificate code');
      return;
    }
    try {
      const res = await progressService.verifyCertificate(verifyCode);
      setVerified(res.data);
      toast.success('Certificate verified!');
    } catch (err) {
      toast.error('Certificate not found');
      setVerified(null);
    }
  };

  const handleDownload = async (certificateId) => {
    setDownloading(certificateId);
    try {
      // Try direct fetch as fallback
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/certificates/${certificateId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${certificateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Download started!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Download failed. PDF generation may not be configured.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div className="container">
          <h1>🏆 My Certificates</h1>
          <p>Your earned certificates</p>
        </div>
      </div>
      <div className="container" style={{ padding: '32px 20px' }}>
        {/* Verify Section */}
        <div className="card" style={{ padding: 24, marginBottom: 32 }}>
          <h3 style={{ marginBottom: 16 }}>🔍 Verify a Certificate</h3>
          <form onSubmit={handleVerify} style={{ display: 'flex', gap: 12, maxWidth: 500, flexWrap: 'wrap' }}>
            <input 
              className="form-input" 
              placeholder="Enter certificate code (e.g. CERT-A1B2C3D4)"
              value={verifyCode} 
              onChange={e => setVerifyCode(e.target.value)} 
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary">Verify</button>
          </form>
          {verified && (
            <div style={{ marginTop: 16, padding: 16, background: '#D1FAE5', borderRadius: 8, border: '1px solid #6EE7B7' }}>
              <p style={{ color: '#065F46', fontWeight: 700 }}>✅ Certificate is Valid!</p>
              <p style={{ fontSize: 14, marginTop: 4 }}>Issued to: <strong>{verified.studentName}</strong></p>
              <p style={{ fontSize: 14 }}>Course: <strong>{verified.courseName}</strong></p>
              <p style={{ fontSize: 14 }}>Date: <strong>{new Date(verified.issuedAt).toLocaleDateString()}</strong></p>
            </div>
          )}
        </div>

        {/* My Certs */}
        <h2 style={{ marginBottom: 16 }}>My Certificates ({certs.length})</h2>
        
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : certs.length === 0 ? (
          <div className="empty-state">
            <div style={{ fontSize: 64 }}>🏆</div>
            <h3>No certificates yet</h3>
            <p>Complete a course to earn your first certificate!</p>
            <Link to="/my-courses" className="btn btn-primary" style={{ marginTop: 16 }}>
              Go to My Courses
            </Link>
          </div>
        ) : (
          <div className="grid-3">
            {certs.map(c => (
              <div key={c.certificateId} className="card" style={{ padding: 24 }}>
                <div style={{ textAlign: 'center', padding: '20px 0', background: 'linear-gradient(135deg,#EFF6FF,#F5F3FF)', borderRadius: 8, marginBottom: 16 }}>
                  <div style={{ fontSize: 48 }}>🏆</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray)', marginTop: 8 }}>CERTIFICATE OF COMPLETION</div>
                </div>
                <h3 style={{ fontSize: 16, marginBottom: 6 }}>{c.courseName}</h3>
                <p style={{ fontSize: 13, color: 'var(--gray)', marginBottom: 4 }}>Issued to: {c.studentName}</p>
                <p style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 12 }}>
                  {new Date(c.issuedAt).toLocaleDateString()}
                </p>
                <code style={{ fontSize: 11, background: 'var(--light-gray)', padding: '4px 8px', borderRadius: 4, display: 'block', marginBottom: 16, wordBreak: 'break-all' }}>
                  {c.certificateCode}
                </code>
                <button 
                  className="btn btn-primary btn-full btn-sm" 
                  onClick={() => handleDownload(c.certificateId)}
                  disabled={downloading === c.certificateId}
                >
                  {downloading === c.certificateId ? 'Downloading...' : '📥 Download PDF'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificatePage;