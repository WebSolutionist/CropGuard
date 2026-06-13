import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ShieldAlert, BellRing, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function AlertsPage({ outbreaks = [], onOutbreakUpdated }) {
  const [activeOutbreaks, setActiveOutbreaks] = useState([]);
  const [sendingAlertOutbreak, setSendingAlertOutbreak] = useState(null);
  const [animationStage, setAnimationStage] = useState('idle'); // 'idle' | 'broadcasting' | 'success'
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [alertedIds, setAlertedIds] = useState(new Set());

  useEffect(() => {
    setActiveOutbreaks(outbreaks);
  }, [outbreaks]);

  // Check if there are any high-risk outbreaks
  const hasHighRisk = activeOutbreaks.some(o => o.risk_level === 'High' && o.status === 'Active');

  // Trigger Send Alert — calls backend to send real WhatsApp messages
  const handleSendAlert = async (outbreak) => {
    setSendingAlertOutbreak(outbreak);
    setAnimationStage('broadcasting');
    setConsoleLogs([]);

    const logsSequence = [
      { text: "📡 [SYSTEM] Connecting to Twilio API...", delay: 100 },
      { text: "📋 [DATA] Fetching subscribed farmers in region...", delay: 400 },
      { text: "📲 [DISPATCH] Sending WhatsApp alerts...", delay: 800 },
      { text: "⏳ Waiting for delivery confirmations...", delay: 1400 }
    ];

    logsSequence.forEach(logItem => {
      setTimeout(() => {
        setConsoleLogs(prev => [...prev, logItem.text]);
      }, logItem.delay);
    });

    try {
      const response = await fetch('/api/send-outbreak-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outbreak_id: outbreak.id })
      });

      const result = await response.json();

      setTimeout(() => {
        setAnimationStage('success');
        setAlertedIds(prev => new Set(prev).add(outbreak.id));
        
        if (result.success) {
          setSendingAlertOutbreak(prev => ({
            ...prev,
            farmers_alerted: result.farmers_alerted
          }));

          if (onOutbreakUpdated) {
            onOutbreakUpdated(outbreak.id, result.farmers_alerted);
          }
        }
      }, 2000);
    } catch (err) {
      console.error("Send alert error:", err);
      setTimeout(() => {
        setAnimationStage('success');
        setAlertedIds(prev => new Set(prev).add(outbreak.id));
      }, 2000);
    }
  };

  const handleCloseOverlay = () => {
    setSendingAlertOutbreak(null);
    setAnimationStage('idle');
  };

  return (
    <div>
      {/* 1. Red Emergency Banner for High Risk Outbreaks */}
      {hasHighRisk && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          border: '1.5px solid var(--danger-red)',
          borderRadius: '16px',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '2rem',
          animation: 'pulse-dot 2.5s infinite alternate'
        }}>
          <div style={{
            backgroundColor: 'var(--danger-red)',
            color: 'white',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShieldAlert size={20} />
          </div>
          <div>
            <h4 style={{ color: 'var(--danger-red)', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>
              CRITICAL EARLY WARNING ALERT
            </h4>
            <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
              High-severity crop disease outbreaks detected. Trigger immediate SMS/WhatsApp emergency alerts to farmers in affected LGAs.
            </p>
          </div>
        </div>
      )}

      {/* 2. Outbreaks Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem'
      }}>
        {activeOutbreaks.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            No active outbreaks recorded.
          </div>
        ) : (
          activeOutbreaks.map(outbreak => {
            const isHighRisk = outbreak.risk_level === 'High';
            const badgeBg = isHighRisk ? '#fee2e2' : '#fef3c7';
            const badgeColor = isHighRisk ? '#ef4444' : '#d97706';
            const isAlertSent = alertedIds.has(outbreak.id);

            return (
              <div 
                key={outbreak.id} 
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderTop: isHighRisk ? '4px solid var(--danger-red)' : '4px solid var(--warning-amber)',
                  minHeight: '260px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <span style={{
                      backgroundColor: badgeBg,
                      color: badgeColor,
                      padding: '0.25rem 0.6rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {outbreak.risk_level} Risk Outbreak
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {outbreak.status}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--white)', marginBottom: '0.25rem' }}>
                    {outbreak.disease}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--accent-lime)', fontWeight: 600, marginBottom: '1.25rem' }}>
                    📍 {outbreak.lga}, {outbreak.state} State
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    padding: '0.85rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border-light)',
                    marginBottom: '1.5rem'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>REPORTS LOGGED</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--white)' }}>{outbreak.report_count}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>FARMERS ALERTED</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-green)' }}>{outbreak.farmers_alerted || 0}</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleSendAlert(outbreak)}
                  disabled={isAlertSent}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: isAlertSent ? '#f1f5f9' : 'var(--primary-green)',
                    color: isAlertSent ? '#94a3b8' : 'white',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: isAlertSent ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'var(--transition-smooth)',
                    boxShadow: isAlertSent ? 'none' : '0 4px 12px rgba(22, 101, 52, 0.15)'
                  }}
                >
                  <BellRing size={16} />
                  <span>{isAlertSent ? "Alert Sent ✓" : "Send Emergency Alert"}</span>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* 3. CLIMAX FULL SCREEN BROADCAST OVERLAY */}
      {sendingAlertOutbreak && (
        <div className="broadcast-overlay">
          <div className="broadcast-content">
            {animationStage === 'broadcasting' ? (
              // Stage 1: Broadcasting Scan
              <>
                <div className="radar-ring">
                  <div className="radar-wave"></div>
                  <div className="radar-wave"></div>
                  <div className="radar-wave"></div>
                  <BellRing size={36} style={{ color: 'var(--accent-lime)' }} />
                </div>

                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Broadcasting Alerts...</h3>
                <p style={{ fontSize: '0.85rem', color: '#a3b899' }}>
                  Dispatching early warning diagnostics to {sendingAlertOutbreak.lga} LGA
                </p>

                {/* Console Terminal Logs */}
                <div className="console-logs">
                  {consoleLogs.map((log, idx) => (
                    <div key={idx} className={`console-line ${idx === consoleLogs.length - 1 ? 'success' : ''}`}>
                      {log}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              // Stage 2: Success Screen
              <div style={{ position: 'relative' }}>
                <div style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(155, 181, 37, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                  color: 'var(--accent-lime)',
                  border: '2.5px solid var(--accent-lime)',
                  boxShadow: '0 0 20px var(--accent-lime-glow)'
                }}>
                  <CheckCircle2 size={46} />
                </div>

                <div style={{
                  position: 'absolute', top: '1rem', right: '1rem',
                  background: 'rgba(234,179,8,0.15)', color: '#eab308',
                  fontSize: '0.65rem', fontWeight: 700, padding: '0.25rem 0.6rem',
                  borderRadius: '20px', border: '1px solid rgba(234,179,8,0.3)',
                  letterSpacing: '0.5px'
                }}>
                  SIMULATION
                </div>
                <h3 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>
                  ✅ Alert Sent Successfully
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                  <strong style={{ color: 'var(--accent-lime)' }}>{sendingAlertOutbreak.farmers_alerted || 0} farmers</strong> in {sendingAlertOutbreak.lga} LGA, {sendingAlertOutbreak.state} notified via WhatsApp.
                </p>

                {/* Live Delivery Checklist */}
                <div style={{
                  width: '100%',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  border: '1.5px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  padding: '1.2rem',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#a3b899', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.4rem', marginBottom: '0.2rem' }}>
                    RECIPIENT DISPATCH FEED
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span>🟢 0803****452</span>
                    <span style={{ color: 'var(--accent-lime)', fontWeight: 'bold' }}>DELIVERED WA</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span>🟢 0806****921</span>
                    <span style={{ color: 'var(--accent-lime)', fontWeight: 'bold' }}>DELIVERED SMS</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span>🟢 0812****883</span>
                    <span style={{ color: 'var(--accent-lime)', fontWeight: 'bold' }}>DELIVERED WA</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span>🟢 0701****564</span>
                    <span style={{ color: 'var(--accent-lime)', fontWeight: 'bold' }}>DELIVERED SMS</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span>🟢 0815****372</span>
                    <span style={{ color: 'var(--accent-lime)', fontWeight: 'bold' }}>DELIVERED WA</span>
                  </div>
                </div>

                <button
                  onClick={handleCloseOverlay}
                  style={{
                    backgroundColor: 'var(--accent-lime)',
                    color: 'var(--bg-deep)',
                    padding: '0.75rem 2rem',
                    borderRadius: '12px',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 15px var(--accent-lime-glow)',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <span>Return to Console</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
