import React, { useState } from 'react';
import { Users, Phone, MapPin, Briefcase, Check, X } from 'lucide-react';

const extensionWorkers = [
  { id: 1, name: "Chukwuemeka Obi", state: "Benue", lga: "Makurdi", phone: "08031234567", available: true },
  { id: 2, name: "Aisha Suleiman", state: "Kogi", lga: "Lokoja", phone: "08061234567", available: true },
  { id: 3, name: "Taiwo Adeyemi", state: "Oyo", lga: "Ibadan North", phone: "08121234567", available: false },
  { id: 4, name: "Garba Musa", state: "Kaduna", lga: "Zaria", phone: "07011234567", available: true },
  { id: 5, name: "Ngozi Eze", state: "Enugu", lga: "Enugu North", phone: "08151234567", available: true },
  { id: 6, name: "Ibrahim Aliyu", state: "Plateau", lga: "Jos North", phone: "08031239876", available: true },
  { id: 7, name: "Blessing Okoro", state: "Anambra", lga: "Onitsha", phone: "08061239876", available: false },
  { id: 8, name: "Fatima Yusuf", state: "Nasarawa", lga: "Lafia", phone: "08121239876", available: true }
];

export default function WorkersPage({ outbreaks = [] }) {
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [assignedOutbreakId, setAssignedOutbreakId] = useState('');
  const [assignmentSuccess, setAssignmentSuccess] = useState(false);

  const activeOutbreaks = outbreaks.filter(o => o.status === 'Active');

  const handleOpenAssignModal = (worker) => {
    setSelectedWorker(worker);
    setAssignedOutbreakId('');
    setAssignmentSuccess(false);
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    if (!assignedOutbreakId) return;

    // Simulate assignment to database / worker channel
    setAssignmentSuccess(true);

    setTimeout(() => {
      setSelectedWorker(null);
      setAssignmentSuccess(false);
    }, 1500);
  };

  return (
    <div>
      {/* Introduction text */}
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Coordinate directly with localized agricultural specialists in active zones to manage containment operations.
        </p>
      </div>

      {/* Workers Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem'
      }}>
        {extensionWorkers.map(worker => (
          <div 
            key={worker.id} 
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '220px',
              borderLeft: worker.available ? '4px solid var(--primary-green)' : '4px solid #94a3b8'
            }}
          >
            <div>
              {/* Header: Name and Availability Indicator */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: worker.available ? 'var(--primary-green)' : 'var(--text-muted)'
                }}>
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: worker.available ? 'var(--accent-lime)' : '#94a3b8',
                    display: 'inline-block'
                  }}></span>
                  {worker.available ? 'ON DUTY' : 'OUT OF OFFICE'}
                </span>
                <Users size={16} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
              </div>

              {/* Title */}
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--white)', marginBottom: '0.75rem' }}>
                {worker.name}
              </h3>

              {/* Specs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={14} style={{ color: 'var(--accent-lime)' }} />
                  <span>{worker.lga} LGA, {worker.state}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Phone size={14} style={{ color: 'var(--accent-lime)' }} />
                  <span style={{ fontFamily: 'monospace' }}>{worker.phone}</span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => handleOpenAssignModal(worker)}
              disabled={!worker.available}
              style={{
                width: '100%',
                marginTop: '1.25rem',
                padding: '0.6rem',
                borderRadius: '10px',
                border: '1px solid var(--border-light)',
                backgroundColor: worker.available ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.2)',
                color: worker.available ? 'var(--accent-lime)' : '#64748b',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: worker.available ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'var(--transition-smooth)'
              }}
            >
              <Briefcase size={14} />
              <span>Assign Outbreak Case</span>
            </button>
          </div>
        ))}
      </div>

      {/* Case Assignment Modal overlay */}
      {selectedWorker && (
        <>
          <div className="drawer-overlay" onClick={() => setSelectedWorker(null)}></div>
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1001,
            width: '100%',
            maxWidth: '420px',
            background: 'rgba(5, 12, 6, 0.98)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '2rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            border: '1.5px solid var(--border-light)',
            animation: 'modal-appear 0.85s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--white)' }}>Assign Incident Case</h3>
              <button 
                onClick={() => setSelectedWorker(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {assignmentSuccess ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(22, 101, 52, 0.2)',
                  color: 'var(--accent-lime)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto'
                }}>
                  <Check size={28} />
                </div>
                <h4 style={{ color: 'var(--accent-lime)', fontWeight: 800 }}>Case Assigned Successfully</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {selectedWorker.name} has been notified.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAssignSubmit}>
                <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                  Assigning field containment case to:  
                  <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--accent-lime)', marginTop: '0.2rem' }}>
                    {selectedWorker.name} ({selectedWorker.lga}, {selectedWorker.state})
                  </strong>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                    Select Active Outbreak
                  </label>
                  <select
                    required
                    value={assignedOutbreakId}
                    onChange={e => setAssignedOutbreakId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '12px',
                      border: '1.5px solid var(--border-light)',
                      fontSize: '0.9rem',
                      outline: 'none',
                      backgroundColor: 'rgba(0,0,0,0.4)',
                      color: 'var(--text-light)',
                      fontWeight: 600
                    }}
                  >
                    <option value="" style={{ background: '#050c05' }}>-- Choose active pathogen threat --</option>
                    {activeOutbreaks.map(o => (
                      <option key={o.id} value={o.id} style={{ background: '#050c05' }}>
                        {o.disease} ({o.lga}, {o.state})
                      </option>
                    ))}
                  </select>
                  {activeOutbreaks.length === 0 && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--danger-red)', marginTop: '0.4rem' }}>
                      ⚠️ No active outbreaks available to assign.
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedWorker(null)}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '12px',
                      border: '1px solid var(--border-light)',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-light)',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!assignedOutbreakId}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: assignedOutbreakId ? 'var(--primary-green)' : 'rgba(255, 255, 255, 0.05)',
                      color: assignedOutbreakId ? 'white' : '#64748b',
                      fontWeight: 700,
                      cursor: assignedOutbreakId ? 'pointer' : 'not-allowed',
                      boxShadow: assignedOutbreakId ? '0 4px 12px rgba(22, 101, 84, 0.15)' : 'none'
                    }}
                  >
                    Assign Case
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}
