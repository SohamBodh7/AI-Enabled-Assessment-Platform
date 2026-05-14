import { useState, useEffect } from 'react';
import { getAdminStats, getAdminExams } from '../../services/api';
import { HiOutlineUsers, HiOutlineClipboardList, HiOutlineShieldCheck, HiOutlineAcademicCap, HiOutlineExclamation } from 'react-icons/hi';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total_users: 0, total_exams: 0, total_students: 0, total_faculty: 0, total_alerts: 0 });
  const [exams, setExams] = useState([]);

  useEffect(() => {
    getAdminStats().then(r => setStats(r.data)).catch(() => {});
    getAdminExams().then(r => setExams(r.data.exams || [])).catch(() => {});
  }, []);

  const statCards = [
    { val: stats.total_users, label: 'Total Users', icon: HiOutlineUsers, accent: 'accent-cyan', color: '#00d2ff' },
    { val: stats.total_students, label: 'Students', icon: HiOutlineAcademicCap, accent: 'accent-purple', color: '#7b2ff7' },
    { val: stats.total_faculty, label: 'Faculty', icon: HiOutlineAcademicCap, accent: 'accent-blue', color: '#448aff' },
    { val: stats.total_exams, label: 'Total Exams', icon: HiOutlineClipboardList, accent: 'accent-green', color: '#00e676' },
    { val: stats.total_alerts, label: 'Alerts', icon: HiOutlineExclamation, accent: 'accent-red', color: '#ff5252' },
  ];

  return (
    <div className="fade-in" style={{maxWidth: '1100px'}}>
      <div style={{marginBottom: '2rem'}}>
        <h1 style={{fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em'}}>Admin Dashboard</h1>
        <p style={{color: '#64748b', fontSize: '0.8125rem', marginTop: '0.25rem'}}>System overview & analytics</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{marginBottom: '2rem'}}>
        {statCards.map((s, i) => (
          <div key={i} className={`glass stat-card ${s.accent}`}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem'}}>
              <div style={{width: '40px', height: '40px', borderRadius: '10px', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <s.icon size={20} color={s.color} />
              </div>
            </div>
            <div className="stat-value">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Exams */}
      <div className="glass" style={{borderRadius: '14px'}}>
        <div className="glass-header" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <h3 style={{fontSize: '0.9375rem', fontWeight: 700}}>Recent Exams</h3>
          <span className="badge badge-cyan">{exams.length} total</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Title</th><th>Type</th><th>Created By</th><th>Created</th></tr>
            </thead>
            <tbody>
              {exams.length === 0 ? (
                <tr><td colSpan={4} style={{textAlign: 'center', padding: '2.5rem', color: '#475569'}}>No exams created yet</td></tr>
              ) : exams.map(e => (
                <tr key={e.id}>
                  <td style={{fontWeight: 600, color: '#e8eaf6'}}>{e.title}</td>
                  <td><span className={`badge ${e.type === 'mcq' ? 'badge-cyan' : 'badge-purple'}`}>{e.type?.toUpperCase()}</span></td>
                  <td>{e.creator_name || '—'}</td>
                  <td style={{fontSize: '0.75rem', color: '#64748b'}}>{new Date(e.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
