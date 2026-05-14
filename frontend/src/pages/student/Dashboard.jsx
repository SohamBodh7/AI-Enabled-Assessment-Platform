import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentExams } from '../../services/api';
import { HiOutlineClipboardList, HiOutlineCode, HiOutlineChartBar, HiOutlineClock, HiOutlineLightningBolt } from 'react-icons/hi';

export default function StudentDashboard() {
  const [exams, setExams] = useState([]);
  const navigate = useNavigate();

  useEffect(() => { getStudentExams().then(r => setExams(r.data.exams || [])).catch(() => {}); }, []);

  const available = exams.filter(e => !e.submitted);
  const completed = exams.filter(e => e.submitted);

  return (
    <div className="fade-in" style={{maxWidth: '1100px'}}>
      <div style={{marginBottom: '2rem'}}>
        <h1 style={{fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em'}}>Dashboard</h1>
        <p style={{color: '#64748b', fontSize: '0.8125rem', marginTop: '0.25rem'}}>Your assessments overview</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{marginBottom: '2rem'}}>
        {[
          { val: exams.length, label: 'Total Exams', accent: 'accent-cyan', icon: HiOutlineClipboardList, color: '#00d2ff' },
          { val: available.length, label: 'Available', accent: 'accent-green', icon: HiOutlineLightningBolt, color: '#00e676' },
          { val: completed.length, label: 'Completed', accent: 'accent-purple', icon: HiOutlineChartBar, color: '#7b2ff7' },
        ].map((s, i) => (
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

      {/* Available Exams */}
      <div style={{marginBottom: '2rem'}}>
        <h2 style={{fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem'}}>
          Available Assessments
          {available.length > 0 && <span className="badge badge-green" style={{marginLeft: '0.75rem'}}>{available.length} new</span>}
        </h2>
        {available.length === 0 ? (
          <div className="glass" style={{padding: '2.5rem', textAlign: 'center', borderRadius: '14px'}}>
            <p style={{color: '#475569'}}>No assessments available right now</p>
          </div>
        ) : (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem'}}>
            {available.map(exam => (
              <div key={exam.id} className="glass" style={{borderRadius: '14px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s'}}
                onClick={() => navigate(`/student/${exam.type === 'mcq' ? 'mcq' : 'coding'}/${exam.id}`)}>
                <div style={{height: '3px', background: exam.type === 'mcq' ? 'linear-gradient(90deg, #00d2ff, transparent)' : 'linear-gradient(90deg, #7b2ff7, transparent)'}} />
                <div style={{padding: '1.25rem'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem'}}>
                    <div style={{width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: exam.type === 'mcq' ? 'rgba(0,210,255,0.1)' : 'rgba(123,47,247,0.1)'}}>
                      {exam.type === 'mcq' ? <HiOutlineClipboardList size={20} color="#00d2ff" /> : <HiOutlineCode size={20} color="#7b2ff7" />}
                    </div>
                    <div>
                      <h3 style={{fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.125rem'}}>{exam.title}</h3>
                      <span className={`badge ${exam.type === 'mcq' ? 'badge-cyan' : 'badge-purple'}`}>{exam.type?.toUpperCase()}</span>
                    </div>
                  </div>
                  <div style={{display: 'flex', gap: '1.5rem', alignItems: 'center'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#94a3b8', fontSize: '0.8125rem'}}>
                      <HiOutlineClock size={14} /> {exam.duration} min
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#94a3b8', fontSize: '0.8125rem'}}>
                      <HiOutlineClipboardList size={14} /> {exam.question_count || '?'} questions
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" style={{width: '100%', marginTop: '1rem'}}>
                    <HiOutlineLightningBolt size={14} /> Start Exam
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <h2 style={{fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem'}}>
            Completed <span className="badge badge-purple" style={{marginLeft: '0.5rem'}}>{completed.length}</span>
          </h2>
          <div className="glass" style={{borderRadius: '14px'}}>
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Exam</th><th>Type</th><th>Score</th><th>Submitted</th></tr></thead>
                <tbody>
                  {completed.map(e => (
                    <tr key={e.id}>
                      <td style={{fontWeight: 600, color: '#e8eaf6'}}>{e.title}</td>
                      <td><span className={`badge ${e.type === 'mcq' ? 'badge-cyan' : 'badge-purple'}`}>{e.type?.toUpperCase()}</span></td>
                      <td><span className="mono" style={{fontWeight: 700, color: '#00e676'}}>{e.score ?? '—'}</span></td>
                      <td style={{color: '#64748b', fontSize: '0.75rem'}}>{e.submitted_at ? new Date(e.submitted_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
