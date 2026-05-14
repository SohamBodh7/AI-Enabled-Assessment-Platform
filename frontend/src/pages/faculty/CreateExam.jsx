import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createExam } from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlineLightningBolt, HiOutlineCode, HiOutlineClipboardList } from 'react-icons/hi';

export default function CreateExam() {
  const [form, setForm] = useState({ title: '', description: '', exam_type: 'mcq', duration: 30, is_public: true });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const payload = { ...form, type: form.exam_type };
      delete payload.exam_type;
      const { data } = await createExam(payload);
      toast.success('Exam created');
      navigate(`/faculty/exams/${data.exam?.id || ''}`);
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="fade-in" style={{maxWidth: '620px'}}>
      <div style={{marginBottom: '2rem'}}>
        <h1 style={{fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em'}}>Create Assessment</h1>
        <p style={{color: '#64748b', fontSize: '0.8125rem', marginTop: '0.25rem'}}>Set up a new exam for your students</p>
      </div>

      <div className="glass" style={{borderRadius: '14px'}}>
        <form onSubmit={handleSubmit}>
          <div style={{padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem'}}>
            <div>
              <label className="label">Exam Title</label>
              <input className="input" placeholder="e.g. Python Fundamentals Quiz" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input" placeholder="Brief description of the exam..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} />
            </div>
            <div>
              <label className="label">Assessment Type</label>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem'}}>
                {['mcq', 'coding'].map(t => (
                  <button key={t} type="button" className="glass" onClick={() => setForm({...form, exam_type: t})}
                    style={{
                      padding: '1rem', textAlign: 'center', cursor: 'pointer', borderRadius: '10px',
                      border: form.exam_type === t ? '1.5px solid #00d2ff' : '1px solid rgba(255,255,255,0.06)',
                      background: form.exam_type === t ? 'rgba(0,210,255,0.06)' : 'transparent',
                      boxShadow: form.exam_type === t ? '0 0 20px rgba(0,210,255,0.1)' : 'none',
                      transition: 'all 0.2s',
                    }}>
                    {t === 'mcq' ? <HiOutlineClipboardList size={24} color={form.exam_type === t ? '#00d2ff' : '#64748b'} /> : <HiOutlineCode size={24} color={form.exam_type === t ? '#00d2ff' : '#64748b'} />}
                    <div style={{marginTop: '0.5rem', fontWeight: 700, fontSize: '0.8125rem', color: form.exam_type === t ? '#fff' : '#94a3b8'}}>{t.toUpperCase()}</div>
                    <div style={{fontSize: '0.6875rem', color: '#64748b', marginTop: '0.125rem'}}>{t === 'mcq' ? 'Multiple Choice' : 'Code Problems'}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{display: 'flex', gap: '1.5rem'}}>
              <div style={{flex: 1}}>
                <label className="label">Duration (minutes)</label>
                <input type="number" className="input" min={5} max={180} required value={form.duration} onChange={e => setForm({...form, duration: parseInt(e.target.value)})} />
              </div>
              <div style={{flex: 1}}>
                <label className="label">Visibility</label>
                <div style={{display: 'flex', gap: '0.75rem'}}>
                  <button type="button" className={`btn btn-sm ${form.is_public ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setForm({...form, is_public: true})} style={{flex: 1}}>Public</button>
                  <button type="button" className={`btn btn-sm ${!form.is_public ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setForm({...form, is_public: false})} style={{flex: 1}}>Private</button>
                </div>
                <div style={{fontSize: '0.6875rem', color: '#64748b', marginTop: '0.5rem'}}>
                  {form.is_public ? 'All students can see this exam' : 'Only assigned students can see this exam'}
                </div>
              </div>
            </div>
          </div>
          <div style={{padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem'}}>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/faculty')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : <><HiOutlineLightningBolt size={15} /> Create Exam</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
