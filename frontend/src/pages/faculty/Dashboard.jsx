import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFacultyExams, deleteExam } from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineChartBar, HiOutlinePencil, HiOutlineCode, HiOutlineClipboardList } from 'react-icons/hi';

export default function FacultyDashboard() {
  const [exams, setExams] = useState([]);
  const navigate = useNavigate();

  const load = () => getFacultyExams().then(r => setExams(r.data.exams || [])).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this exam?')) return;
    try { await deleteExam(id); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  return (
    <div className="fade-in" style={{maxWidth: '1100px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem'}}>
        <div>
          <h1 style={{fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em'}}>My Exams</h1>
          <p style={{color: '#64748b', fontSize: '0.8125rem', marginTop: '0.25rem'}}>{exams.length} assessments created</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/faculty/create-exam')}>
          <HiOutlinePlus size={16} /> New Exam
        </button>
      </div>

      {exams.length === 0 ? (
        <div className="glass" style={{padding: '3rem', textAlign: 'center', borderRadius: '14px'}}>
          <div style={{fontSize: '2.5rem', marginBottom: '0.75rem'}}>📝</div>
          <p style={{color: '#94a3b8', fontSize: '0.875rem'}}>No exams yet. Create your first assessment.</p>
          <button className="btn btn-primary" style={{marginTop: '1rem'}} onClick={() => navigate('/faculty/create-exam')}>
            <HiOutlinePlus size={16} /> Create Exam
          </button>
        </div>
      ) : (
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem'}}>
          {exams.map(exam => (
            <div key={exam.id} className="glass" style={{borderRadius: '14px', overflow: 'hidden', position: 'relative'}}>
              {/* Top accent bar */}
              <div style={{height: '3px', background: exam.exam_type === 'mcq' ? 'linear-gradient(90deg, #00d2ff, transparent)' : 'linear-gradient(90deg, #7b2ff7, transparent)'}} />
              <div style={{padding: '1.25rem'}}>
                <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                    <div style={{width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: exam.exam_type === 'mcq' ? 'rgba(0,210,255,0.1)' : 'rgba(123,47,247,0.1)'}}>
                      {exam.exam_type === 'mcq' ? <HiOutlineClipboardList size={20} color="#00d2ff" /> : <HiOutlineCode size={20} color="#7b2ff7" />}
                    </div>
                    <div>
                      <h3 style={{fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.125rem'}}>{exam.title}</h3>
                      <span className={`badge ${exam.exam_type === 'mcq' ? 'badge-cyan' : 'badge-purple'}`}>{exam.exam_type?.toUpperCase()}</span>
                    </div>
                  </div>
                </div>

                <div style={{display: 'flex', gap: '1.5rem', marginBottom: '1rem'}}>
                  <div><div className="mono" style={{fontSize: '0.875rem', fontWeight: 700, color: '#e8eaf6'}}>{exam.duration || 0}</div><div style={{fontSize: '0.625rem', color: '#64748b', textTransform: 'uppercase'}}>Minutes</div></div>
                  <div><div className="mono" style={{fontSize: '0.875rem', fontWeight: 700, color: '#e8eaf6'}}>{exam.question_count || 0}</div><div style={{fontSize: '0.625rem', color: '#64748b', textTransform: 'uppercase'}}>Questions</div></div>
                </div>

                <div style={{display: 'flex', gap: '0.5rem'}}>
                  <button className="btn btn-outline btn-sm" style={{flex: 1}} onClick={() => navigate(`/faculty/exams/${exam.id}`)}>
                    <HiOutlinePencil size={14} /> Manage
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/faculty/results?exam=${exam.id}`)}>
                    <HiOutlineChartBar size={14} />
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(exam.id)} style={{color: '#ff5252'}}>
                    <HiOutlineTrash size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
