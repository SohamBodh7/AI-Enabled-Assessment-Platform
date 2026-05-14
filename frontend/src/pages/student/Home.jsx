import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getStudentExams, getStudentResults } from '../../services/api';
import { PHOTO_BASE_URL } from '../../services/api';
import {
  HiOutlinePlay, HiOutlineClipboardList, HiOutlineChartBar,
  HiOutlineUser, HiOutlineClock, HiOutlineLightningBolt,
  HiOutlineCheckCircle, HiOutlineArrowRight, HiOutlineCode,
} from 'react-icons/hi';

export default function StudentHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams]     = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getStudentExams().catch(() => ({ data: { exams: [] } })),
      getStudentResults().catch(() => ({ data: { results: [] } })),
    ]).then(([eRes, rRes]) => {
      setExams((eRes.data.exams || []).filter(e => !e.submitted).slice(0, 3));
      setResults((rRes.data.results || []).slice(0, 4));
    }).finally(() => setLoading(false));
  }, []);

  const profileComplete = !!(user?.phone && user?.institute && user?.roll_no);
  const photoUrl = user?.profile_photo ? `${PHOTO_BASE_URL}/${user.profile_photo}` : null;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const typeColor  = t => t === 'mcq' ? '#00d2ff' : '#7b2ff7';
  const scoreColor = (s, t) => { if (!t) return '#94a3b8'; const p = (s/t)*100; return p >= 75 ? '#00e676' : p >= 40 ? '#ffd740' : '#ff5252'; };

  return (
    <div className="fade-in" style={{ maxWidth: '1000px' }}>

      {/* ── Welcome Banner ── */}
      <div style={{ borderRadius: '20px', padding: '2rem 2.5rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(0,210,255,0.08) 0%, rgba(123,47,247,0.08) 100%)',
        border: '1px solid rgba(0,210,255,0.15)' }}>
        {/* bg decoration */}
        <div style={{ position: 'absolute', right: '-60px', top: '-60px', width: '250px', height: '250px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,210,255,0.08), transparent)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          {/* Avatar */}
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
            background: 'linear-gradient(135deg,#00d2ff,#7b2ff7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 800, color: '#fff',
            boxShadow: '0 6px 20px rgba(0,210,255,0.25)',
            border: '2px solid rgba(0,210,255,0.3)' }}>
            {photoUrl
              ? <img src={photoUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0 }}>{greeting},</p>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em', margin: '0.125rem 0' }}>{user?.name} 👋</h1>
            <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0 }}>
              {user?.institute || user?.department
                ? `${user.department ? user.department + ' · ' : ''}${user.institute || ''}`
                : 'Complete your profile to display your institute details'}
            </p>
          </div>
          <Link to="/student/profile" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid rgba(0,210,255,0.25)',
            color: '#00d2ff', textDecoration: 'none', fontSize: '0.8125rem', fontWeight: 600,
            background: 'rgba(0,210,255,0.05)', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(0,210,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(0,210,255,0.05)'}>
            <HiOutlineUser size={14} /> My Profile
          </Link>
        </div>

        {/* Profile completion nudge */}
        {!profileComplete && (
          <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8125rem' }}>
            <HiOutlineLightningBolt size={14} color="#ffd740" />
            <span style={{ color: '#64748b' }}>Your profile is incomplete —</span>
            <Link to="/student/profile" style={{ color: '#ffd740', textDecoration: 'none', fontWeight: 600 }}>
              Add roll number, institute & phone →
            </Link>
          </div>
        )}
      </div>

      {/* ── Quick Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { icon: HiOutlineClipboardList, color: '#00d2ff', val: exams.length || '—', label: 'Pending Exams' },
          { icon: HiOutlineCheckCircle, color: '#00e676', val: results.length, label: 'Completed' },
          { icon: HiOutlineChartBar, color: '#7b2ff7', val: results.length > 0
              ? `${Math.round(results.reduce((acc, r) => acc + (r.total ? (r.score / r.total) * 100 : 0), 0) / results.length)}%`
              : '—', label: 'Avg Score' },
        ].map(({ icon: Icon, color, val, label }) => (
          <div key={label} className="glass" style={{ borderRadius: '14px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{val}</div>
              <div style={{ fontSize: '0.6875rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>

        {/* ── Available Exams ── */}
        <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HiOutlinePlay size={16} color="#00d2ff" />
              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Available Exams</span>
            </div>
            <Link to="/student/exams" style={{ fontSize: '0.75rem', color: '#00d2ff', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View all <HiOutlineArrowRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}><span className="spinner" /></div>
          ) : exams.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#475569', fontSize: '0.875rem' }}>
              <HiOutlineCheckCircle size={28} color="#00e676" style={{ marginBottom: '0.5rem' }} />
              <p style={{ margin: 0 }}>All caught up! No pending exams.</p>
            </div>
          ) : exams.map(exam => (
            <div key={exam.id} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${typeColor(exam.type)}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {exam.type === 'mcq' ? <HiOutlineClipboardList size={16} color={typeColor(exam.type)} /> : <HiOutlineCode size={16} color={typeColor(exam.type)} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e8eaf6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{exam.title}</div>
                <div style={{ fontSize: '0.6875rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <HiOutlineClock size={11} /> {exam.duration} mins · <span style={{ color: typeColor(exam.type), fontWeight: 600 }}>{exam.type?.toUpperCase()}</span>
                </div>
              </div>
              <button onClick={() => navigate(`/student/${exam.type === 'mcq' ? 'mcq' : 'coding'}/${exam.id}`)}
                style={{ flexShrink: 0, padding: '0.375rem 0.875rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg,#00d2ff,#7b2ff7)', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
                Start
              </button>
            </div>
          ))}
        </div>

        {/* ── Recent Results ── */}
        <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <HiOutlineChartBar size={16} color="#00e676" />
              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Recent Results</span>
            </div>
            <Link to="/student/results" style={{ fontSize: '0.75rem', color: '#00d2ff', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View all <HiOutlineArrowRight size={12} />
            </Link>
          </div>
          {loading ? (
            <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}><span className="spinner" /></div>
          ) : results.length === 0 ? (
            <div style={{ padding: '2.5rem', textAlign: 'center', color: '#475569', fontSize: '0.875rem' }}>
              <HiOutlineChartBar size={28} color="#334155" style={{ marginBottom: '0.5rem' }} />
              <p style={{ margin: 0 }}>No results yet. Attempt your first exam!</p>
            </div>
          ) : results.map((r, i) => (
            <div key={i} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#e8eaf6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.exam_title || r.question_title || 'Exam'}</div>
                <div style={{ fontSize: '0.6875rem', color: '#475569' }}>
                  {r.submitted_at ? new Date(r.submitted_at).toLocaleDateString() : '—'}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: scoreColor(r.score, r.total) }}>{r.score}</span>
                <span style={{ fontSize: '0.75rem', color: '#475569' }}>/{r.total || '—'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
