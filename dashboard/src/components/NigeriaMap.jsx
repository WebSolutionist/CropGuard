import React, { useState } from 'react';

// Geographic arrangement of Nigerian states as a neural network mesh
const stateNodes = {
  // North West
  "Sokoto": { id: "SK", x: 80, y: 70, label: "Sokoto", neighbors: ["Kebbi", "Zamfara", "Katsina"] },
  "Kebbi": { id: "KB", x: 60, y: 120, label: "Kebbi", neighbors: ["Sokoto", "Zamfara", "Niger"] },
  "Zamfara": { id: "ZF", x: 120, y: 100, label: "Zamfara", neighbors: ["Sokoto", "Kebbi", "Katsina", "Kaduna", "Niger"] },
  "Katsina": { id: "KT", x: 170, y: 70, label: "Katsina", neighbors: ["Sokoto", "Zamfara", "Kano", "Jigawa", "Kaduna"] },
  "Kano": { id: "KN", x: 220, y: 90, label: "Kano", neighbors: ["Katsina", "Jigawa", "Bauchi", "Kaduna"] },
  "Jigawa": { id: "JG", x: 270, y: 70, label: "Jigawa", neighbors: ["Katsina", "Kano", "Yobe", "Bauchi"] },
  "Kaduna": { id: "KD", x: 180, y: 150, label: "Kaduna", neighbors: ["Katsina", "Kano", "Bauchi", "Plateau", "Nasarawa", "FCT", "Niger", "Zamfara"] },

  // North East
  "Yobe": { id: "YB", x: 330, y: 75, label: "Yobe", neighbors: ["Jigawa", "Borno", "Gombe", "Bauchi"] },
  "Borno": { id: "BN", x: 390, y: 85, label: "Borno", neighbors: ["Yobe", "Gombe", "Adamawa"] },
  "Bauchi": { id: "BC", x: 270, y: 130, label: "Bauchi", neighbors: ["Kano", "Jigawa", "Yobe", "Gombe", "Taraba", "Plateau", "Kaduna"] },
  "Gombe": { id: "GB", x: 330, y: 135, label: "Gombe", neighbors: ["Yobe", "Borno", "Adamawa", "Taraba", "Bauchi"] },
  "Adamawa": { id: "AD", x: 385, y: 190, label: "Adamawa", neighbors: ["Borno", "Gombe", "Taraba"] },
  "Taraba": { id: "TR", x: 325, y: 235, label: "Taraba", neighbors: ["Bauchi", "Gombe", "Adamawa", "Benue", "Plateau"] },

  // North Central
  "Niger": { id: "NG", x: 110, y: 180, label: "Niger", neighbors: ["Kebbi", "Zamfara", "Kaduna", "FCT", "Kogi", "Kwara"] },
  "Kwara": { id: "KW", x: 85, y: 220, label: "Kwara", neighbors: ["Niger", "Kogi", "Ekiti", "Osun", "Oyo"] },
  "FCT": { id: "FC", x: 175, y: 205, label: "FCT", neighbors: ["Niger", "Kaduna", "Nasarawa", "Kogi"] },
  "Nasarawa": { id: "NS", x: 225, y: 215, label: "Nasarawa", neighbors: ["FCT", "Kaduna", "Plateau", "Taraba", "Benue", "Kogi"] },
  "Plateau": { id: "PL", x: 255, y: 175, label: "Plateau", neighbors: ["Kaduna", "Bauchi", "Taraba", "Benue", "Nasarawa"] },
  "Kogi": { id: "KG", x: 170, y: 255, label: "Kogi", neighbors: ["Niger", "FCT", "Nasarawa", "Benue", "Enugu", "Anambra", "Edo", "Ondo", "Kwara"] },
  "Benue": { id: "BY", x: 260, y: 265, label: "Benue", neighbors: ["Kogi", "Nasarawa", "Plateau", "Taraba", "Cross River", "Ebonyi", "Enugu"] },

  // South West
  "Oyo": { id: "OY", x: 50, y: 250, label: "Oyo", neighbors: ["Kwara", "Osun", "Ogun", "Lagos"] },
  "Osun": { id: "OS", x: 90, y: 260, label: "Osun", neighbors: ["Oyo", "Kwara", "Ekiti", "Ondo", "Ogun"] },
  "Ekiti": { id: "EK", x: 115, y: 250, label: "Ekiti", neighbors: ["Kwara", "Ondo", "Osun"] },
  "Ondo": { id: "ON", x: 125, y: 275, label: "Ondo", neighbors: ["Ekiti", "Kogi", "Edo", "Ogun", "Osun"] },
  "Ogun": { id: "OG", x: 60, y: 285, label: "Ogun", neighbors: ["Oyo", "Osun", "Ondo", "Lagos"] },
  "Lagos": { id: "LA", x: 55, y: 315, label: "Lagos", neighbors: ["Oyo", "Ogun"] },

  // South South & South East
  "Edo": { id: "ED", x: 155, y: 295, label: "Edo", neighbors: ["Ondo", "Kogi", "Anambra", "Delta"] },
  "Delta": { id: "DL", x: 145, y: 335, label: "Delta", neighbors: ["Edo", "Anambra", "Rivers", "Bayelsa"] },
  "Anambra": { id: "AN", x: 195, y: 310, label: "Anambra", neighbors: ["Kogi", "Enugu", "Abia", "Imo", "Delta", "Edo"] },
  "Enugu": { id: "EN", x: 225, y: 300, label: "Enugu", neighbors: ["Kogi", "Benue", "Ebonyi", "Abia", "Anambra"] },
  "Ebonyi": { id: "EB", x: 255, y: 305, label: "Ebonyi", neighbors: ["Benue", "Cross River", "Abia", "Enugu"] },
  "Abia": { id: "AB", x: 220, y: 335, label: "Abia", neighbors: ["Enugu", "Ebonyi", "Cross River", "Akwa Ibom", "Imo", "Anambra"] },
  "Imo": { id: "IM", x: 195, y: 335, label: "Imo", neighbors: ["Anambra", "Abia", "Rivers"] },
  "Rivers": { id: "RV", x: 190, y: 365, label: "Rivers", neighbors: ["Delta", "Imo", "Abia", "Akwa Ibom", "Bayelsa"] },
  "Bayelsa": { id: "BY", x: 150, y: 365, label: "Bayelsa", neighbors: ["Delta", "Rivers"] },
  "Akwa Ibom": { id: "AK", x: 235, y: 360, label: "Akwa Ibom", neighbors: ["Abia", "Cross River", "Rivers"] },
  "Cross River": { id: "CR", x: 275, y: 330, label: "Cross River", neighbors: ["Benue", "Ebonyi", "Abia", "Akwa Ibom"] }
};

export default function NigeriaMap({ reports = [], outbreaks = [], selectedState = '', onSelectState }) {
  const [hoveredState, setHoveredState] = useState(null);

  // Group status/severity by state
  const stateStatus = {};
  Object.keys(stateNodes).forEach(state => {
    stateStatus[state] = { type: 'clear', count: 0, diseases: [] };
  });

  // Calculate reports per state
  reports.forEach(report => {
    const s = report.state;
    if (stateStatus[s]) {
      stateStatus[s].type = 'report';
      stateStatus[s].count += 1;
      if (!stateStatus[s].diseases.includes(report.disease)) {
        stateStatus[s].diseases.push(report.disease);
      }
    }
  });

  // Highlight outbreaks (Active outbreaks override reports)
  outbreaks.forEach(outbreak => {
    const s = outbreak.state;
    if (stateStatus[s] && outbreak.status === 'Active') {
      stateStatus[s].type = 'outbreak';
      if (!stateStatus[s].diseases.includes(outbreak.disease)) {
        stateStatus[s].diseases.push(outbreak.disease);
      }
    }
  });

  // Selected state status details
  const getSelectedStateDetails = () => {
    if (selectedState && stateStatus[selectedState]) {
      return {
        name: selectedState,
        ...stateStatus[selectedState]
      };
    }
    return null;
  };

  const activeDetailState = hoveredState || getSelectedStateDetails();

  return (
    <div className="map-container" style={{ width: '100%', minHeight: '520px' }}>
      <div style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', zIndex: 10 }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--white)', textShadow: '0 0 10px rgba(255,255,255,0.1)' }}>
          Geographical Neural Mesh Map
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Click state nodes to filter logs. Active threats pulse.
        </p>
      </div>

      <svg viewBox="0 0 450 400" style={{ width: '100%', height: '100%', maxHeight: '420px', marginTop: '1.5rem' }}>
        <defs>
          <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-lime" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Draw Mesh Connections */}
        {Object.entries(stateNodes).map(([name, node]) => {
          return node.neighbors.map(neighborName => {
            const neighborNode = stateNodes[neighborName];
            if (!neighborNode) return null;
            // Prevent duplicate lines by drawing only one direction
            if (name > neighborName) return null;

            // Determine line glowing properties
            const isOutbreakActive = stateStatus[name]?.type === 'outbreak' && stateStatus[neighborName]?.type === 'outbreak';
            const isReportActive = stateStatus[name]?.type !== 'clear' || stateStatus[neighborName]?.type !== 'clear';

            let strokeColor = "rgba(255, 255, 255, 0.05)";
            let strokeWidth = "1";
            if (isOutbreakActive) {
              strokeColor = "rgba(239, 68, 68, 0.35)";
              strokeWidth = "2.2";
            } else if (isReportActive) {
              strokeColor = "rgba(155, 181, 37, 0.2)";
              strokeWidth = "1.5";
            }

            return (
              <line
                key={`line-${name}-${neighborName}`}
                x1={node.x}
                y1={node.y}
                x2={neighborNode.x}
                y2={neighborNode.y}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                transition="all 0.3s ease"
              />
            );
          });
        })}

        {/* 2. Draw State Interactive Nodes */}
        {Object.entries(stateNodes).map(([name, node]) => {
          const status = stateStatus[name];
          const isSelected = selectedState === name;
          const isOutbreak = status.type === 'outbreak';
          const isReport = status.type === 'report';

          // Determine node color and size
          let nodeRadius = isSelected ? 11 : 9;
          let nodeFill = "rgba(10, 35, 15, 0.9)";
          let strokeColor = "rgba(155, 181, 37, 0.2)";
          let strokeWidth = "1.5";
          let glowEffect = "";

          if (isOutbreak) {
            nodeFill = "var(--danger-red)";
            strokeColor = "var(--white)";
            strokeWidth = "2.5";
            glowEffect = "url(#glow-red)";
          } else if (isReport) {
            nodeFill = "var(--warning-amber)";
            strokeColor = "var(--white)";
            strokeWidth = "2";
            glowEffect = "url(#glow-lime)";
          }

          if (isSelected) {
            strokeColor = "var(--accent-lime)";
            strokeWidth = "3.2";
          }

          return (
            <g 
              key={`node-${name}`}
              onClick={() => onSelectState && onSelectState(isSelected ? '' : name)}
              onMouseEnter={() => setHoveredState({ name, ...status })}
              onMouseLeave={() => setHoveredState(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Outer Pulse/Glow Circle for Active items */}
              {(isOutbreak || isReport) && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={nodeRadius + 8}
                  fill="none"
                  stroke={isOutbreak ? "var(--danger-red)" : "var(--warning-amber)"}
                  strokeWidth="1.5"
                  opacity="0.4"
                  style={{
                    transformOrigin: `${node.x}px ${node.y}px`,
                    animation: 'pulse-ring 2s infinite cubic-bezier(0.215, 0.610, 0.355, 1)'
                  }}
                />
              )}

              {/* Main Node Circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeRadius}
                fill={nodeFill}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                filter={glowEffect}
                style={{ transition: 'all 0.3s ease' }}
              />

              {/* Label inside node if selected or hovering */}
              <text
                x={node.x}
                y={node.y - 14}
                textAnchor="middle"
                fill={isSelected || isOutbreak || isReport ? "var(--white)" : "var(--text-muted)"}
                fontSize="8"
                fontWeight="700"
                letterSpacing="0.05em"
                style={{ pointerEvents: 'none', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
              >
                {node.id}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Map Legend */}
      <div style={{
        position: 'absolute',
        bottom: '1.5rem',
        left: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        background: 'rgba(5, 15, 6, 0.85)',
        backdropFilter: 'blur(10px)',
        border: '1.5px solid var(--border-light)',
        padding: '0.75rem 1rem',
        borderRadius: '16px',
        fontSize: '0.75rem',
        fontWeight: 600,
        zIndex: 5
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--danger-red)', boxShadow: '0 0 8px var(--danger-red)' }}></span>
          <span style={{ color: 'var(--text-light)' }}>Outbreak Threat</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--warning-amber)', boxShadow: '0 0 8px var(--warning-amber)' }}></span>
          <span style={{ color: 'var(--text-light)' }}>Report Registered</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(155,181,37,0.15)' }}></span>
          <span style={{ color: 'var(--text-muted)' }}>Monitoring Active</span>
        </div>
      </div>

      {/* Map Tooltip Detail Panel */}
      {activeDetailState && (
        <div style={{
          position: 'absolute',
          bottom: '1.5rem',
          right: '1.5rem',
          width: '210px',
          background: 'rgba(2, 6, 2, 0.95)',
          backdropFilter: 'blur(12px)',
          color: 'white',
          padding: '1.1rem',
          borderRadius: '20px',
          boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
          border: '1.5px solid var(--border-light)',
          zIndex: 20,
          animation: 'modal-appear 0.85s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--white)', fontWeight: 800 }}>{activeDetailState.name} State</h4>
          <p style={{ margin: '0.2rem 0 0.6rem 0', fontSize: '0.75rem', color: activeDetailState.type === 'outbreak' ? 'var(--danger-red)' : 'var(--accent-lime)', fontWeight: 600 }}>
            {activeDetailState.type === 'outbreak' ? '🚨 LOCAL OUTBREAK ACTIVE' : '📝 LOCALIZED DIAGNOSTICS'}
          </p>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.6rem', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Reports count:</span>
              <span style={{ fontWeight: '800', color: 'var(--white)' }}>{activeDetailState.count}</span>
            </div>
            {activeDetailState.diseases.length > 0 && (
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Active Pathogens:</span>
                <ul style={{ margin: '0', paddingLeft: '1.1rem', fontSize: '0.75rem', color: 'var(--text-light)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  {activeDetailState.diseases.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
