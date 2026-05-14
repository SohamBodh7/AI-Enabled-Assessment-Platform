import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineShieldCheck, HiOutlineCode, HiOutlineClock,
  HiOutlineLightningBolt, HiOutlineAcademicCap, HiOutlineUserGroup,
  HiOutlineChartBar, HiOutlinePlay, HiOutlineArrowRight,
  HiOutlineCheckCircle
} from 'react-icons/hi';

const FEATURES = [
  {
    icon: HiOutlineShieldCheck,
    color: '#00d2ff',
    title: 'AI Proctoring',
    desc: 'Real-time webcam monitoring using OpenCV face detection. Every session logged with severity levels.',
  },
  {
    icon: HiOutlineCode,
    color: '#7b2ff7',
    title: 'Monaco Code Editor',
    desc: 'Industry-grade VS Code editor in the browser. Write, run, and submit Python code with instant feedback.',
  },
  {
    icon: HiOutlineClock,
    color: '#00e676',
    title: 'Auto Evaluation',
    desc: 'MCQ scores computed instantly. Coding solutions evaluated against hidden test cases automatically.',
  },
  {
    icon: HiOutlineChartBar,
    color: '#ffd740',
    title: 'Detailed Analytics',
    desc: 'Faculty can review every student\'s MCQ answer choices and submitted code with colour-coded results.',
  },
];

const ROLES = [
  {
    icon: HiOutlineUserGroup,
    role: 'Administrator',
    color: '#ff5252',
    points: ['Manage faculty accounts', 'View system-wide analytics', 'Monitor proctoring logs per student'],
  },
  {
    icon: HiOutlineAcademicCap,
    role: 'Faculty',
    color: '#7b2ff7',
    points: ['Create MCQ & Coding exams', 'AI-powered question generation', 'Live exam monitoring & chat'],
  },
  {
    icon: HiOutlinePlay,
    role: 'Student',
    color: '#00d2ff',
    points: ['Attempt exams in a secure environment', 'Monaco Editor for coding problems', 'View results instantly'],
  },
];

const STEPS = [
  { num: '01', title: 'Register & Login', desc: 'Create your account and access your role-based dashboard.' },
  { num: '02', title: 'Faculty Creates Exam', desc: 'Build MCQ or coding assessments with AI-assisted question generation.' },
  { num: '03', title: 'Students Attempt', desc: 'Take exams in a proctored environment with Monaco editor support.' },
  { num: '04', title: 'Instant Results', desc: 'Scores computed automatically. Faculty reviews answers per student.' },
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const heroRef = useRef();

  // Parallax tilt on hero section
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const handleMove = (e) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = (clientX / innerWidth - 0.5) * 20;
      const y = (clientY / innerHeight - 0.5) * 20;
      el.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', color: '#e8eaf6', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2rem',
        background: 'rgba(15,15,26,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg,#00d2ff,#7b2ff7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(0,210,255,0.3)' }}>
            <HiOutlineCode size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.0625rem', letterSpacing: '-0.02em' }}>
            Exam<span style={{ background: 'linear-gradient(135deg,#00d2ff,#7b2ff7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {user ? (
            <Link to={`/${user.role}`} style={{ padding: '0.5rem 1.25rem', borderRadius: '10px', background: 'linear-gradient(135deg,#00d2ff,#7b2ff7)', color: '#fff', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, boxShadow: '0 4px 15px rgba(0,210,255,0.25)', transition: 'all 0.2s' }}>
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" style={{ padding: '0.5rem 1.25rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.2s' }}
                onMouseEnter={e => { e.target.style.color = '#fff'; e.target.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                onMouseLeave={e => { e.target.style.color = '#94a3b8'; e.target.style.borderColor = 'rgba(255,255,255,0.1)'; }}>
                Sign In
              </Link>
              <Link to="/register" style={{ padding: '0.5rem 1.25rem', borderRadius: '10px', background: 'linear-gradient(135deg,#00d2ff,#7b2ff7)', color: '#fff', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600, boxShadow: '0 4px 15px rgba(0,210,255,0.25)', transition: 'all 0.2s' }}
                onMouseEnter={e => e.target.style.opacity = '0.9'}
                onMouseLeave={e => e.target.style.opacity = '1'}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: '6rem 2rem 4rem', overflow: 'hidden' }}>
        {/* Background blobs */}
        <div style={{ position: 'absolute', top: '20%', left: '10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,210,255,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,47,247,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div ref={heroRef} style={{ textAlign: 'center', maxWidth: '820px', transition: 'transform 0.1s ease-out', position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 1rem', borderRadius: '20px', border: '1px solid rgba(0,210,255,0.3)', background: 'rgba(0,210,255,0.06)', fontSize: '0.8125rem', color: '#00d2ff', marginBottom: '1.5rem' }}>
            <HiOutlineLightningBolt size={14} />
            AI-Powered · Proctor-Ready · Auto-Graded
          </div>

          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
            The Smarter Way to{' '}
            <span style={{ background: 'linear-gradient(135deg,#00d2ff,#7b2ff7,#00e676)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
              Run Exams
            </span>
          </h1>

          <p style={{ fontSize: '1.125rem', color: '#64748b', lineHeight: 1.7, maxWidth: '600px', margin: '0 auto 2.5rem' }}>
            A complete online examination platform with AI proctoring, Monaco code editor, instant grading, and live monitoring — built for IMCC.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {user ? (
              <Link to={`/${user.role}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 2rem', borderRadius: '12px', background: 'linear-gradient(135deg,#00d2ff,#7b2ff7)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '0.9375rem', boxShadow: '0 8px 30px rgba(0,210,255,0.3)', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,210,255,0.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,210,255,0.3)'; }}>
                Go to Dashboard <HiOutlineArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link to="/register" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 2rem', borderRadius: '12px', background: 'linear-gradient(135deg,#00d2ff,#7b2ff7)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '0.9375rem', boxShadow: '0 8px 30px rgba(0,210,255,0.3)', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,210,255,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,210,255,0.3)'; }}>
                  Get Started Free <HiOutlineArrowRight size={16} />
                </Link>
                <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.875rem 2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.12)', color: '#e8eaf6', textDecoration: 'none', fontWeight: 600, fontSize: '0.9375rem', transition: 'all 0.2s', background: 'rgba(255,255,255,0.03)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}>
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Floating stats */}
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '4rem', flexWrap: 'wrap' }}>
            {[['3', 'User Roles'], ['2', 'Exam Types'], ['AI', 'Proctored'], ['100%', 'Auto-Graded']].map(([val, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, background: 'linear-gradient(135deg,#00d2ff,#7b2ff7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{val}</div>
                <div style={{ fontSize: '0.6875rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '5rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Everything you need for{' '}
            <span style={{ background: 'linear-gradient(135deg,#00d2ff,#7b2ff7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>modern assessment</span>
          </h2>
          <p style={{ color: '#64748b', marginTop: '0.75rem', fontSize: '1rem' }}>Built from scratch — no third-party exam tools.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {FEATURES.map(({ icon: Icon, color, title, desc }) => (
            <div key={title} style={{ padding: '1.75rem', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.25s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.background = `${color}08`; e.currentTarget.style.borderColor = `${color}30`; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Icon size={22} color={color} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#e8eaf6' }}>{title}</h3>
              <p style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.65 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it Works ── */}
      <section style={{ padding: '5rem 2rem', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>How it works</h2>
            <p style={{ color: '#64748b', marginTop: '0.75rem' }}>Four simple steps from setup to results.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {STEPS.map(({ num, title, desc }, i) => (
              <div key={num} style={{ position: 'relative' }}>
                {i < STEPS.length - 1 && (
                  <div style={{ position: 'absolute', top: '22px', left: '100%', width: '100%', height: '1px', background: 'linear-gradient(90deg, rgba(0,210,255,0.3), transparent)', display: 'none' }} />
                )}
                <div style={{ fontSize: '0.6875rem', fontWeight: 800, color: '#00d2ff', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>{num}</div>
                <div style={{ width: '40px', height: '3px', background: 'linear-gradient(90deg,#00d2ff,#7b2ff7)', borderRadius: '2px', marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', color: '#e8eaf6' }}>{title}</h3>
                <p style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Role Cards ── */}
      <section style={{ padding: '5rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Built for every role</h2>
          <p style={{ color: '#64748b', marginTop: '0.75rem' }}>Three dashboards, one platform.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {ROLES.map(({ icon: Icon, role, color, points }) => (
            <div key={role} style={{ padding: '2rem', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${color}20` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} color={color} />
                </div>
                <span style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#e8eaf6' }}>{role}</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                {points.map(p => (
                  <li key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.8125rem', color: '#94a3b8' }}>
                    <HiOutlineCheckCircle size={15} color={color} style={{ flexShrink: 0, marginTop: '1px' }} />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '5rem 2rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
          Ready to get started?
        </h2>
        <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '1rem' }}>
          Create your account in seconds — no credit card required.
        </p>
        {user ? (
          <Link to={`/${user.role}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2.5rem', borderRadius: '12px', background: 'linear-gradient(135deg,#00d2ff,#7b2ff7)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '1rem', boxShadow: '0 8px 30px rgba(0,210,255,0.3)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,210,255,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,210,255,0.3)'; }}>
            Go to Dashboard <HiOutlineArrowRight size={16} />
          </Link>
        ) : (
          <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2.5rem', borderRadius: '12px', background: 'linear-gradient(135deg,#00d2ff,#7b2ff7)', color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '1rem', boxShadow: '0 8px 30px rgba(0,210,255,0.3)', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,210,255,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,210,255,0.3)'; }}>
            Create Free Account <HiOutlineArrowRight size={16} />
          </Link>
        )}
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', color: '#334155', fontSize: '0.8125rem' }}>
        <div style={{ marginBottom: '0.5rem', fontWeight: 700, color: '#475569' }}>ExamAI · IMCC Pune · MCA 2025-26</div>
        <div>AI-Enabled Online Examination &amp; Assessment Management System</div>
      </footer>

    </div>
  );
}
