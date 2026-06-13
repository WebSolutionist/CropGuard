import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { clearAndSeedDatabase } from './utils/seedData';
import { 
  Leaf, 
  LayoutDashboard, 
  FileSpreadsheet, 
  BellRing, 
  UsersRound, 
  RotateCw, 
  CheckCircle,
  Database
} from 'lucide-react';

// Page imports
import OverviewPage from './components/OverviewPage';
import ReportsPage from './components/ReportsPage';
import AlertsPage from './components/AlertsPage';
import WorkersPage from './components/WorkersPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [reports, setReports] = useState([]);
  const [outbreaks, setOutbreaks] = useState([]);
  
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccessMsg, setSeedSuccessMsg] = useState('');

  // 1. Initial Data Load
  const fetchAllData = async () => {
    try {
      const { data: repData, error: repErr } = await supabase
        .from('reports')
        .select('*')
        .order('timestamp', { ascending: false });
      if (repErr) throw repErr;
      setReports(repData || []);

      const { data: outData, error: outErr } = await supabase
        .from('outbreaks')
        .select('*')
        .order('timestamp', { ascending: false });
      if (outErr) throw outErr;
      setOutbreaks(outData || []);
    } catch (err) {
      console.error("Error fetching initial dataset:", err);
    }
  };

  useEffect(() => {
    fetchAllData();

    // 2. REALTIME SUBSCRIPTIONS
    // Listen to all reports table changes
    const reportsSubscription = supabase
      .channel('public:reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, (payload) => {
        console.log('Realtime Reports Update:', payload);
        if (payload.eventType === 'INSERT') {
          setReports(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setReports(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
        } else if (payload.eventType === 'DELETE') {
          setReports(prev => prev.filter(r => r.id !== payload.old.id));
        }
      })
      .subscribe();

    // Listen to all outbreaks table changes
    const outbreaksSubscription = supabase
      .channel('public:outbreaks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'outbreaks' }, (payload) => {
        console.log('Realtime Outbreaks Update:', payload);
        if (payload.eventType === 'INSERT') {
          setOutbreaks(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setOutbreaks(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
        } else if (payload.eventType === 'DELETE') {
          setOutbreaks(prev => prev.filter(o => o.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(reportsSubscription);
      supabase.removeChannel(outbreaksSubscription);
    };
  }, []);

  // Handler for manual status changes in reports drawer
  const handleReportUpdated = (id, newStatus) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  // Handler for outbreak alert dispatches
  const handleOutbreakUpdated = (id, newAlertedCount) => {
    setOutbreaks(prev => prev.map(o => o.id === id ? { ...o, farmers_alerted: newAlertedCount } : o));
  };

  // Trigger Demo Control Seeding
  const handleSeedDatabase = async () => {
    if (window.confirm("This will clear your Supabase 'reports' and 'outbreaks' tables and seed them with 15 mock reports spaced across 7 days. Proceed?")) {
      setIsSeeding(true);
      setSeedSuccessMsg('');
      const res = await clearAndSeedDatabase();
      setIsSeeding(false);
      
      if (res.success) {
        setSeedSuccessMsg(`Successfully seeded ${res.count} records!`);
        fetchAllData(); // Refresh local dataset
        setTimeout(() => setSeedSuccessMsg(''), 3000);
      } else {
        alert(`Seeding failed: ${res.error}`);
      }
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Leaf className="logo-icon" size={28} />
          <h1 className="logo-text">CropGuard NG</h1>
        </div>
        <div className="tagline">Protecting Nigerian Farms, One Alert at a Time.</div>

        <nav className="nav-links">
          <div 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <LayoutDashboard className="nav-item-icon" />
            <span>Overview Dashboard</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <FileSpreadsheet className="nav-item-icon" />
            <span>Disease Reports</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            <BellRing className="nav-item-icon" />
            <span>Outbreak Alerts</span>
          </div>

          <div 
            className={`nav-item ${activeTab === 'workers' ? 'active' : ''}`}
            onClick={() => setActiveTab('workers')}
          >
            <UsersRound className="nav-item-icon" />
            <span>Extension Workers</span>
          </div>
        </nav>

        {/* Demo Control Center Button */}
        <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem' }}>
          <button 
            className="demo-control-btn" 
            onClick={handleSeedDatabase}
            disabled={isSeeding}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {isSeeding ? (
              <RotateCw className="nav-item-icon" style={{ animation: 'radar-pulse-wave 1.5s infinite linear' }} />
            ) : (
              <Database className="nav-item-icon" />
            )}
            <span>{isSeeding ? "Resetting database..." : "Demo Control Center"}</span>
          </button>
          {seedSuccessMsg && (
            <div style={{ 
              color: 'var(--accent-lime)', 
              fontSize: '0.75rem', 
              textAlign: 'center', 
              marginTop: '0.5rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.25rem'
            }}>
              <CheckCircle size={12} />
              <span>{seedSuccessMsg}</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Panel content switcher */}
      <main className="main-content">
        <header className="header-row">
          <h2 className="page-title">
            {activeTab === 'overview' && "Live Action Overview"}
            {activeTab === 'reports' && "Disease Diagnostic Logs"}
            {activeTab === 'alerts' && "Active Pathogen Outbreaks"}
            {activeTab === 'workers' && "Field Operator Network"}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-green)' }}>
            <span className="live-pulse-dot"></span>
            <span>Realtime Gateway Active</span>
          </div>
        </header>

        {activeTab === 'overview' && <OverviewPage reports={reports} outbreaks={outbreaks} />}
        {activeTab === 'reports' && <ReportsPage reports={reports} onReportUpdated={handleReportUpdated} />}
        {activeTab === 'alerts' && <AlertsPage outbreaks={outbreaks} onOutbreakUpdated={handleOutbreakUpdated} />}
        {activeTab === 'workers' && <WorkersPage outbreaks={outbreaks} />}
      </main>
    </div>
  );
}
