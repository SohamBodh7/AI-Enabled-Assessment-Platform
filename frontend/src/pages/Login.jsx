import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineCode, HiOutlineLightningBolt, HiOutlineShieldCheck, HiOutlineTerminal, HiOutlineClock } from 'react-icons/hi';

const FEATURES = [
  { icon: HiOutlineShieldCheck, val: 'AI', label: 'Proctoring', color: '#00d2ff' },
  { icon: HiOutlineTerminal,    val: 'Monaco', label: 'Code Editor', color: '#7b2ff7' },
  { icon: HiOutlineClock,       val: 'Auto', label: 'Evaluation', color: '#00e676' },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await loginApi({ email, password });
      loginUser(data.token, data.user);
      toast.success('Welcome back!');
      navigate(`/${data.user.role}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: '#0f0f1a',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Animated background orbs */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,210,255,0.08), transparent 60%)',
          top: '-10%', right: '-5%',
        }} />
        <div style={{
          position: 'absolute', width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(123,47,247,0.08), transparent 60%)',
          bottom: '-15%', left: '-10%',
        }} />
        <div style={{
          position: 'absolute', width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,107,107,0.05), transparent 60%)',
          top: '40%', left: '30%',
        }} />
      </div>

      {/* Left Panel — Branding */}
      <div style={{
        flex: '0 0 45%', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '3rem',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ maxWidth: '420px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px',
              background: 'linear-gradient(135deg, #00d2ff, #7b2ff7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 25px rgba(0, 210, 255, 0.3)',
            }}>
              <HiOutlineCode size={26} color="#fff" />
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: '1.375rem', color: '#fff' }}>
                Exam<span className="gradient-text">AI</span>
              </span>
            </div>
          </div>

          <h1 style={{
            fontSize: '2.75rem', fontWeight: 800, lineHeight: 1.15,
            marginBottom: '1rem', letterSpacing: '-0.03em',
          }}>
            <span style={{ color: '#fff' }}>Online Exam &</span><br />
            <span className="gradient-text">Coding Assessment</span><br />
            <span style={{ color: '#fff' }}>Platform</span>
          </h1>

          <p style={{ fontSize: '1rem', color: '#94a3b8', lineHeight: 1.8, maxWidth: '380px' }}>
            Secure MCQ tests, real-time coding challenges, and AI-powered proctoring — all in one platform.
          </p>

          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2.5rem' }}>
            {FEATURES.map(({ icon: Icon, val, label, color }, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.5rem 0.875rem',
                borderRadius: '10px',
                background: `${color}12`,
                border: `1px solid ${color}28`,
              }}>
                <Icon size={15} color={color} />
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 800, color }}>{val}</div>
                  <div style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '1px' }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem', position: 'relative', zIndex: 1,
      }}>
        <div className="glass fade-in glow-cyan" style={{ width: '100%', maxWidth: '400px', borderRadius: '16px' }}>
          <div style={{ padding: '2.25rem' }}>
            <div style={{ marginBottom: '1.75rem' }}>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '0.375rem' }}>Welcome back</h2>
              <p style={{ color: '#64748b', fontSize: '0.8125rem' }}>Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" className="input" placeholder="Enter your password"
                  value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '0.25rem' }}
                disabled={loading}>
                {loading ? <span className="spinner" /> : <><HiOutlineLightningBolt size={16} /> Sign In</>}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                New student?{' '}
                <Link to="/register" className="gradient-text" style={{ fontWeight: 600 }}>Create account</Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
