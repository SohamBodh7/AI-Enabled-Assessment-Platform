import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register as registerApi } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineCode, HiOutlineUserAdd } from 'react-icons/hi';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await registerApi({ name, email, password });
      loginUser(data.token, data.user);
      toast.success('Account created!');
      navigate('/student');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: '#0f0f1a', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(123,47,247,0.08), transparent 60%)', top: '-10%', left: '-5%' }} />
        <div style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,210,255,0.06), transparent 60%)', bottom: '-15%', right: '-10%' }} />
      </div>

      {/* Left branding */}
      <div style={{ flex: '0 0 45%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3rem', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: '420px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #7b2ff7, #00d2ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 25px rgba(123, 47, 247, 0.3)' }}>
              <HiOutlineCode size={26} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.375rem', color: '#fff' }}>Exam<span className="gradient-text">AI</span></span>
          </div>
          <h1 style={{ fontSize: '2.75rem', fontWeight: 800, lineHeight: 1.15, marginBottom: '1rem', letterSpacing: '-0.03em' }}>
            <span style={{ color: '#fff' }}>Start Your</span><br />
            <span className="gradient-text">Coding Journey</span><br />
            <span style={{ color: '#fff' }}>Today</span>
          </h1>
          <p style={{ fontSize: '1rem', color: '#94a3b8', lineHeight: 1.8, maxWidth: '380px' }}>
            Register as a student to access MCQ tests, coding challenges, and track your progress.
          </p>
        </div>
      </div>

      {/* Right — Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative', zIndex: 1 }}>
        <div className="glass fade-in glow-purple" style={{ width: '100%', maxWidth: '400px', borderRadius: '16px' }}>
          <div style={{ padding: '2.25rem' }}>
            <div style={{ marginBottom: '1.75rem' }}>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 800, marginBottom: '0.375rem' }}>Create Account</h2>
              <p style={{ color: '#64748b', fontSize: '0.8125rem' }}>Join as a student</p>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Full Name</label>
                <input type="text" className="input" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" className="input" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
              <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '0.25rem' }} disabled={loading}>
                {loading ? <span className="spinner" /> : <><HiOutlineUserAdd size={16} /> Create Account</>}
              </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                Already registered?{' '}
                <Link to="/login" className="gradient-text" style={{ fontWeight: 600 }}>Sign in</Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
