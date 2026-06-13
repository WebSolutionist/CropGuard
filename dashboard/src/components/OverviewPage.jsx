import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  FileText, 
  AlertTriangle, 
  Users, 
  Globe, 
  Activity, 
  Clock 
} from 'lucide-react';
import NigeriaMap from './NigeriaMap';

export default function OverviewPage({ reports = [], outbreaks = [] }) {
  // 1. Calculate live counts
  const totalReportsToday = reports.filter(r => {
    const reportDate = new Date(r.timestamp);
    const today = new Date();
    return reportDate.toDateString() === today.toDateString();
  }).length;

  const activeOutbreaks = outbreaks.filter(o => o.status === 'Active').length;

  const totalFarmersAlerted = outbreaks.reduce((acc, o) => acc + (o.farmers_alerted || 0), 0);

  const statesCovered = new Set(reports.map(r => r.state)).size;

  // 2. Format last 7 days reports for bar chart
  const getLast7DaysData = () => {
    const data = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateString = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      const count = reports.filter(r => {
        const reportDate = new Date(r.timestamp);
        return reportDate.toDateString() === d.toDateString();
      }).length;

      data.push({ name: dateString, Reports: count });
    }
    return data;
  };

  const chartData = getLast7DaysData();

  // Helper to format time ago
  const formatTimeAgo = (timestampString) => {
    const now = new Date();
    const diffMs = now - new Date(timestampString);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // 10 most recent reports
  const recentReports = [...reports]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);

  return (
    <div>
      {/* 4 Stat Cards */}
      <div className="stat-grid">
        <div className="card stat-card">
          <div>
            <div className="stat-label">TOTAL REPORTS TODAY</div>
            <div className="stat-value">{totalReportsToday}</div>
          </div>
          <div className="stat-footer">
            <FileText className="nav-item-icon" />
            <span>Active sync</span>
          </div>
        </div>

        <div className="card stat-card" style={{ borderLeft: '4px solid var(--danger-red)' }}>
          <div>
            <div className="stat-label">ACTIVE OUTBREAKS</div>
            <div className="stat-value" style={{ color: 'var(--danger-red)' }}>{activeOutbreaks}</div>
          </div>
          <div className="stat-footer" style={{ color: 'var(--danger-red)' }}>
            <AlertTriangle className="nav-item-icon" />
            <span>Spreading threats</span>
          </div>
        </div>

        <div className="card stat-card">
          <div>
            <div className="stat-label">FARMERS ALERTED</div>
            <div className="stat-value" style={{ color: 'var(--primary-green)' }}>{totalFarmersAlerted}</div>
          </div>
          <div className="stat-footer">
            <Users className="nav-item-icon" />
            <span>SMS/WA dispatch</span>
          </div>
        </div>

        <div className="card stat-card">
          <div>
            <div className="stat-label">STATES COVERED</div>
            <div className="stat-value">{statesCovered}</div>
          </div>
          <div className="stat-footer">
            <Globe className="nav-item-icon" />
            <span>Regional grids</span>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="overview-grid">
        {/* Left Side: Nigeria SVG Map */}
        <NigeriaMap reports={reports} outbreaks={outbreaks} />

        {/* Right Side: Live Activity Feed */}
        <div className="card feed-panel">
          <div className="feed-header">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)' }}>Live Reports Feed</h3>
            <div className="feed-indicator">
              <div className="live-pulse-dot"></div>
              <span>Live Sync</span>
            </div>
          </div>

          <div className="feed-list">
            {recentReports.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--text-muted)',
                fontSize: '0.9rem'
              }}>
                <Clock size={36} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
                <span>No reports logged yet</span>
              </div>
            ) : (
              recentReports.map(report => {
                const confidence = report.confidence ? report.confidence.toLowerCase() : 'low';
                let badgeClass = 'badge-low';
                if (confidence === 'high') badgeClass = 'badge-high';
                if (confidence === 'medium') badgeClass = 'badge-medium';

                return (
                  <div key={report.id} className="feed-item">
                    <div className={`feed-badge ${badgeClass}`}>
                      <Activity size={18} />
                    </div>
                    <div className="feed-details">
                      <div className="feed-title">
                        {report.crop} Disease Detected
                      </div>
                      <div className="feed-meta">
                        Farmer: {report.farmer_number || 'Unknown'} | {report.disease}
                      </div>
                      <div className="feed-location">
                        📍 {report.lga}, {report.state} State
                      </div>
                    </div>
                    <div className="feed-time">
                      {formatTimeAgo(report.timestamp)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom Chart Panel */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)' }}>Disease Activity Trend</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Daily incoming reports count for the last 7 days</p>
        </div>

        <div style={{ width: '100%', height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                allowDecimals={false}
              />
              <Tooltip 
                cursor={{ fill: 'rgba(22, 101, 52, 0.03)' }}
                contentStyle={{
                  background: 'var(--bg-deep)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-family)'
                }}
              />
              <Bar 
                dataKey="Reports" 
                fill="var(--primary-green)" 
                radius={[6, 6, 0, 0]} 
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
