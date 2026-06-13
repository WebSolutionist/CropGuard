import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Search, SlidersHorizontal, X, FileImage, ShieldCheck, HelpCircle } from 'lucide-react';

export default function ReportsPage({ reports = [], onReportUpdated }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCrop, setFilterCrop] = useState('');
  const [filterDisease, setFilterDisease] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDays, setFilterDays] = useState(''); // last N days

  const [selectedReport, setSelectedReport] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // 1. Get unique values for dropdown filters
  const uniqueCrops = Array.from(new Set(reports.map(r => r.crop).filter(Boolean)));
  const uniqueDiseases = Array.from(new Set(reports.map(r => r.disease).filter(Boolean)));
  const uniqueStates = Array.from(new Set(reports.map(r => r.state).filter(Boolean)));

  // 2. Filter logic
  const filteredReports = reports.filter(r => {
    // Search matching
    const searchString = `${r.farmer_number || ''} ${r.crop || ''} ${r.disease || ''} ${r.state || ''} ${r.lga || ''}`.toLowerCase();
    if (searchTerm && !searchString.includes(searchTerm.toLowerCase())) return false;

    // Filter dropdown matching
    if (filterCrop && r.crop !== filterCrop) return false;
    if (filterDisease && r.disease !== filterDisease) return false;
    if (filterState && r.state !== filterState) return false;
    if (filterStatus && r.status !== filterStatus) return false;

    // Date range filter
    if (filterDays) {
      const days = parseInt(filterDays);
      const reportDate = new Date(r.timestamp);
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - days);
      if (reportDate < limitDate) return false;
    }

    return true;
  });

  // Handle status write back to Supabase
  const handleStatusChange = async (newStatus) => {
    if (!selectedReport) return;
    setIsUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: newStatus })
        .eq('id', selectedReport.id);

      if (error) throw error;

      // Update local detailed state
      setSelectedReport(prev => ({ ...prev, status: newStatus }));
      
      if (onReportUpdated) {
        onReportUpdated(selectedReport.id, newStatus);
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status. Please try again.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div>
      {/* Search and Filters Bar */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1rem',
          alignItems: 'center'
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search 
              size={18} 
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
            />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem 0.6rem 2.25rem',
                borderRadius: '10px',
                border: '1.5px solid var(--border-light)',
                outline: 'none',
                fontSize: '0.875rem',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                color: 'var(--text-light)'
              }}
            />
          </div>

          {/* Crop Filter */}
          <select
            value={filterCrop}
            onChange={e => setFilterCrop(e.target.value)}
            style={{
              padding: '0.6rem 0.75rem',
              borderRadius: '10px',
              border: '1.5px solid var(--border-light)',
              outline: 'none',
              fontSize: '0.875rem',
              backgroundColor: 'rgba(2, 6, 2, 0.95)',
              color: 'var(--text-light)'
            }}
          >
            <option value="">All Crops</option>
            {uniqueCrops.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Disease Filter */}
          <select
            value={filterDisease}
            onChange={e => setFilterDisease(e.target.value)}
            style={{
              padding: '0.6rem 0.75rem',
              borderRadius: '10px',
              border: '1.5px solid var(--border-light)',
              outline: 'none',
              fontSize: '0.875rem',
              backgroundColor: 'rgba(2, 6, 2, 0.95)',
              color: 'var(--text-light)'
            }}
          >
            <option value="">All Diseases</option>
            {uniqueDiseases.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          {/* State Filter */}
          <select
            value={filterState}
            onChange={e => setFilterState(e.target.value)}
            style={{
              padding: '0.6rem 0.75rem',
              borderRadius: '10px',
              border: '1.5px solid var(--border-light)',
              outline: 'none',
              fontSize: '0.875rem',
              backgroundColor: 'rgba(2, 6, 2, 0.95)',
              color: 'var(--text-light)'
            }}
          >
            <option value="">All States</option>
            {uniqueStates.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{
              padding: '0.6rem 0.75rem',
              borderRadius: '10px',
              border: '1.5px solid var(--border-light)',
              outline: 'none',
              fontSize: '0.875rem',
              backgroundColor: 'rgba(2, 6, 2, 0.95)',
              color: 'var(--text-light)'
            }}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Verified">Verified</option>
            <option value="False Positive">False Positive</option>
          </select>

          {/* Date Filter */}
          <select
            value={filterDays}
            onChange={e => setFilterDays(e.target.value)}
            style={{
              padding: '0.6rem 0.75rem',
              borderRadius: '10px',
              border: '1.5px solid var(--border-light)',
              outline: 'none',
              fontSize: '0.875rem',
              backgroundColor: 'rgba(2, 6, 2, 0.95)',
              color: 'var(--text-light)'
            }}
          >
            <option value="">Any Time</option>
            <option value="1">Last 24 Hours</option>
            <option value="3">Last 3 Days</option>
            <option value="7">Last 7 Days</option>
          </select>
        </div>
      </div>

      {/* Reports Table Grid */}
      <div className="table-container">
        <table className="reports-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Time</th>
              <th>Farmer</th>
              <th>Crop</th>
              <th>Disease</th>
              <th>Confidence</th>
              <th>State</th>
              <th>LGA</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No reports match your filters.
                </td>
              </tr>
            ) : (
              filteredReports.map(report => {
                const confidence = report.confidence ? report.confidence.toLowerCase() : 'low';
                let confColor = 'var(--text-muted)';
                if (confidence === 'high') confColor = 'var(--danger-red)';
                if (confidence === 'medium') confColor = 'var(--warning-amber)';

                let statusBadgeStyle = {
                  padding: '0.25rem 0.6rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 600
                };
                if (report.status === 'Verified') {
                  statusBadgeStyle = { ...statusBadgeStyle, backgroundColor: '#dcfce7', color: '#15803d' };
                } else if (report.status === 'False Positive') {
                  statusBadgeStyle = { ...statusBadgeStyle, backgroundColor: '#fee2e2', color: '#b91c1c' };
                } else {
                  statusBadgeStyle = { ...statusBadgeStyle, backgroundColor: '#f1f5f9', color: '#475569' };
                }

                return (
                  <tr key={report.id} onClick={() => setSelectedReport(report)}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {report.id.substring(0, 8)}...
                    </td>
                    <td>
                      {new Date(report.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td style={{ fontWeight: 600 }}>{report.farmer_number || 'Unknown'}</td>
                    <td>{report.crop}</td>
                    <td style={{ color: 'var(--white)', fontWeight: 500 }}>{report.disease}</td>
                    <td style={{ color: confColor, fontWeight: 700 }}>{report.confidence}</td>
                    <td>{report.state}</td>
                    <td>{report.lga}</td>
                    <td>
                      <span style={statusBadgeStyle}>{report.status}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Slide Drawer Side Panel Detail View */}
      {selectedReport && (
        <>
          <div className="drawer-overlay" onClick={() => setSelectedReport(null)}></div>
          <div className={`side-drawer ${selectedReport ? 'open' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--white)' }}>Diagnostic Details</h3>
              <button 
                onClick={() => setSelectedReport(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Crop photo analysis preview */}
            <div style={{
              width: '100%',
              height: '200px',
              borderRadius: '16px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--border-light)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              {selectedReport.image_url ? (
                <img 
                  src={selectedReport.image_url} 
                  alt="Crop analysis specimen" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  <FileImage size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                  <span style={{ fontSize: '0.8rem' }}>No image specimen provided</span>
                </div>
              )}
            </div>

            {/* Specimen Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>CROP PATHOGEN</span>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--white)', fontWeight: 800 }}>
                  {selectedReport.disease}
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Detected in host specimen {selectedReport.crop}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Confidence</span>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-green)' }}>{selectedReport.confidence}</div>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Farmer Mobile</span>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--white)' }}>{selectedReport.farmer_number}</div>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>LOCATION DATA</span>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', fontWeight: 500, marginTop: '0.2rem' }}>
                  📍 {selectedReport.lga} Local Govt Area, {selectedReport.state} State, Nigeria
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>LOG TIMESTAMP</span>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginTop: '0.2rem' }}>
                  🕒 {new Date(selectedReport.timestamp).toLocaleString()}
                </div>
              </div>

              {/* Status Update Action Dropdown */}
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-light)', display: 'block', marginBottom: '0.5rem' }}>
                  DIAGNOSTIC STATUS
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    value={selectedReport.status}
                    onChange={e => handleStatusChange(e.target.value)}
                    disabled={isUpdatingStatus}
                    style={{
                      flexGrow: 1,
                      padding: '0.75rem',
                      borderRadius: '12px',
                      border: '1.5px solid var(--border-light)',
                      outline: 'none',
                      fontSize: '0.9rem',
                      backgroundColor: 'rgba(5, 12, 6, 0.95)',
                      color: 'var(--text-light)',
                      fontWeight: 600
                    }}
                  >
                    <option value="Pending">🕒 Pending Review</option>
                    <option value="Verified">🟢 Verified Positive</option>
                    <option value="False Positive">🔴 False Positive</option>
                  </select>
                </div>
                {isUpdatingStatus && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--primary-green)', marginTop: '0.25rem', fontWeight: 500 }}>
                    Syncing status change with database...
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
