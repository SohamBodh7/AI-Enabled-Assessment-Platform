import { useState, useEffect } from 'react';
import { getProctoringLogs, getUsers } from '../../services/api';
import { HiOutlineShieldCheck, HiOutlineUser, HiOutlineChevronRight } from 'react-icons/hi';

const EVENT_ICON  = { no_face: '🚫', multiple_faces: '👥', face_detected: '✅', detection_error: '⚠️' };
const SEV_BADGE   = { high: 'badge-red', medium: 'badge-yellow', low: 'badge-green' };

export default function ProctoringLogs() {
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState(null);   // selected student object
  const [logs, setLogs]         = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Load student list once
  useEffect(() => {
    getUsers('student').then(r => setStudents(r.data.users || [])).catch(() => {});
  }, []);

  // Load logs whenever selected student changes
  useEffect(() => {
    if (!selected) { setLogs([]); return; }
    setLoadingLogs(true);
    getProctoringLogs({ student_id: selected.id })
      .then(r => setLogs(r.data.logs || []))
      .catch(() => setLogs([]))
      .finally(() => setLoadingLogs(false));
  }, [selected]);

  // Count high-severity events per student for the badge
  const [alertCounts, setAlertCounts] = useState({});
  useEffect(() => {
    if (students.length === 0) return;
    getProctoringLogs().then(r => {
      const counts = {};
      (r.data.logs || []).forEach(l => {
        if (l.severity === 'high') counts[l.student_id] = (counts[l.student_id] || 0) + 1;
      });
      setAlertCounts(counts);
    }).catch(() => {});
  }, [students]);

  return (
    <div className="fade-in" style={{ maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,82,82,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <HiOutlineShieldCheck size={20} color="#ff5252" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Proctoring Logs</h1>
          <p style={{ color: '#64748b', fontSize: '0.8125rem', marginTop: '0.125rem' }}>
            {selected ? `Showing logs for ${selected.name}` : `${students.length} students monitored — select one to view logs`}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1rem', alignItems: 'start' }}>

        {/* ── Left: Student List ── */}
        <div className="glass" style={{ borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '0.6875rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Students
          </div>
          {students.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#475569', fontSize: '0.8125rem' }}>No students found</div>
          ) : students.map(s => {
            const isActive = selected?.id === s.id;
            const alerts   = alertCounts[s.id] || 0;
            return (
              <button key={s.id} onClick={() => setSelected(s)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.875rem 1rem', border: 'none', cursor: 'pointer',
                  background: isActive ? 'rgba(0,210,255,0.08)' : 'transparent',
                  borderLeft: isActive ? '2px solid #00d2ff' : '2px solid transparent',
                  transition: 'all 0.15s', textAlign: 'left',
                }}>
                {/* Avatar */}
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                  background: isActive ? 'rgba(0,210,255,0.2)' : 'rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <HiOutlineUser size={15} color={isActive ? '#00d2ff' : '#64748b'} />
                </div>
                {/* Name + email */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: isActive ? '#fff' : '#e8eaf6',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.email}</div>
                </div>
                {/* Alert count badge */}
                {alerts > 0 && (
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '2px 7px',
                    borderRadius: '20px', background: 'rgba(255,82,82,0.15)', color: '#ff5252', flexShrink: 0 }}>
                    {alerts}
                  </span>
                )}
                <HiOutlineChevronRight size={14} color={isActive ? '#00d2ff' : '#334155'} />
              </button>
            );
          })}
        </div>

        {/* ── Right: Logs Table ── */}
        <div className="glass" style={{ borderRadius: '14px', minHeight: '300px' }}>
          {!selected ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '4rem 2rem', color: '#475569', textAlign: 'center' }}>
              <HiOutlineShieldCheck size={36} color="#1e293b" style={{ marginBottom: '0.75rem' }} />
              <p style={{ fontSize: '0.875rem' }}>Select a student to view their proctoring log</p>
            </div>
          ) : loadingLogs ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <span className="spinner" />
            </div>
          ) : (
            <>
              {/* Summary bar */}
              <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>{logs.length} events</span>
                {['high','medium','low'].map(sev => {
                  const count = logs.filter(l => l.severity === sev).length;
                  if (!count) return null;
                  return <span key={sev} className={`badge ${SEV_BADGE[sev]}`}>{count} {sev}</span>;
                })}
              </div>

              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>Event</th><th>Exam</th><th>Severity</th><th>Time</th></tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2.5rem', color: '#475569' }}>No events for this student</td></tr>
                    ) : logs.map((l, i) => (
                      <tr key={i}>
                        <td>
                          <span style={{ marginRight: '0.5rem' }}>{EVENT_ICON[l.event_type] || '📋'}</span>
                          <span style={{ fontWeight: 500, color: '#e8eaf6' }}>{l.event_type?.replace(/_/g, ' ')}</span>
                        </td>
                        <td style={{ color: '#94a3b8' }}>{l.exam_title || l.exam_id}</td>
                        <td><span className={`badge ${SEV_BADGE[l.severity] || 'badge-cyan'}`}>{l.severity?.toUpperCase()}</span></td>
                        <td style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                          {l.timestamp ? new Date(l.timestamp).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
