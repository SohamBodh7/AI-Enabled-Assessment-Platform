import { useState, useEffect } from 'react';
import { getAdminExams } from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlineClipboardList, HiOutlineCode } from 'react-icons/hi';

export default function AdminExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminExams().then(r => {
      setExams(r.data.exams || []);
      setLoading(false);
    }).catch(() => {
      toast.error('Failed to load exams');
      setLoading(false);
    });
  }, []);

  return (
    <div className="fade-in" style={{maxWidth: '1200px'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem'}}>
        <div style={{width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0,210,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <HiOutlineClipboardList size={20} color="#00d2ff" />
        </div>
        <div>
          <h1 style={{fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em'}}>All Assessments</h1>
          <p style={{color: '#64748b', fontSize: '0.8125rem', marginTop: '0.125rem'}}>System-wide examination records</p>
        </div>
      </div>

      <div className="glass" style={{borderRadius: '14px'}}>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Duration</th>
                <th>Created By</th>
                <th>Questions</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{textAlign: 'center', padding: '2rem'}}><span className="spinner" /></td></tr>
              ) : exams.length === 0 ? (
                <tr><td colSpan={6} style={{textAlign: 'center', padding: '2.5rem', color: '#475569'}}>No exams found</td></tr>
              ) : exams.map(exam => (
                <tr key={exam.id}>
                  <td style={{fontWeight: 600, color: '#e8eaf6'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                      {exam.type === 'mcq' ? <HiOutlineClipboardList color="#00d2ff" /> : <HiOutlineCode color="#7b2ff7" />}
                      {exam.title}
                    </div>
                  </td>
                  <td><span className={`badge ${exam.type === 'mcq' ? 'badge-cyan' : 'badge-purple'}`}>{exam.type?.toUpperCase()}</span></td>
                  <td>{exam.duration} mins</td>
                  <td><div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}><div className="avatar-sm">{exam.creator_name?.[0]?.toUpperCase()}</div><span style={{color: '#94a3b8', fontSize: '0.8125rem'}}>{exam.creator_name}</span></div></td>
                  <td><span className="mono" style={{fontWeight: 600}}>{exam.question_count}</span></td>
                  <td style={{color: '#64748b', fontSize: '0.75rem'}}>{new Date(exam.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
