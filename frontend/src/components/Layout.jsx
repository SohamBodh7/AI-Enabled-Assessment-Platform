import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HiOutlineHome, HiOutlineClipboardList, HiOutlineChartBar,
  HiOutlineUsers, HiOutlineShieldCheck, HiOutlinePlusCircle,
  HiOutlineLogout, HiOutlineCode, HiOutlineLightningBolt,
  HiOutlineUserCircle, HiOutlineEye,
} from 'react-icons/hi';

const NAV = {
  admin: [
    { to: '/admin', icon: HiOutlineHome, label: 'Dashboard', end: true },
    { to: '/admin/users', icon: HiOutlineUsers, label: 'Users' },
    { to: '/admin/exams', icon: HiOutlineClipboardList, label: 'Exams' },
    { to: '/admin/proctoring', icon: HiOutlineShieldCheck, label: 'Proctoring' },
  ],
  faculty: [
    { to: '/faculty', icon: HiOutlineHome, label: 'Dashboard', end: true },
    { to: '/faculty/create-exam', icon: HiOutlinePlusCircle, label: 'Create Exam' },
    { to: '/faculty/results', icon: HiOutlineChartBar, label: 'Results' },
    { to: '/faculty/monitor', icon: HiOutlineEye, label: 'Live Monitor' },
    { to: '/faculty/profile', icon: HiOutlineUserCircle, label: 'My Profile' },
  ],
  student: [
    { to: '/student', icon: HiOutlineHome, label: 'Home', end: true },
    { to: '/student/exams', icon: HiOutlineClipboardList, label: 'Exams' },
    { to: '/student/results', icon: HiOutlineChartBar, label: 'My Results' },
    { to: '/student/profile', icon: HiOutlineUserCircle, label: 'My Profile' },
  ],
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = NAV[user?.role] || [];
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
      {/* ── Top Bar ── */}
      <header style={{
        height: '56px',
        background: 'linear-gradient(180deg, rgba(15, 15, 26, 0.95), rgba(15, 15, 26, 0.85))',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 1.25rem',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer' }} onClick={() => navigate(`/${user?.role || ''}`)}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #00d2ff, #7b2ff7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(0, 210, 255, 0.3)',
          }}>
            <HiOutlineCode size={18} color="#fff" />
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1.0625rem', letterSpacing: '-0.02em', color: '#fff' }}>
              Exam<span className="gradient-text">AI</span>
            </span>
            <div style={{ fontSize: '0.5625rem', color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '-2px' }}>
              Assessment Platform
            </div>
          </div>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#e8eaf6' }}>{user?.name}</div>
            <div style={{ fontSize: '0.625rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user?.role}</div>
          </div>
          <div onClick={() => navigate(`/${user?.role}/profile`)} style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #00d2ff, #7b2ff7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.875rem', fontWeight: 800, color: '#fff',
            boxShadow: '0 4px 12px rgba(123, 47, 247, 0.3)',
            cursor: 'pointer', transition: 'transform 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* ── Sidebar ── */}
        <aside style={{
          width: '240px',
          background: 'linear-gradient(180deg, rgba(15, 15, 26, 0.9), rgba(22, 33, 62, 0.4))',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: '56px',
          height: 'calc(100vh - 56px)', overflowY: 'auto',
          flexShrink: 0,
        }}>
          {/* Navigation */}
          <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '0.625rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0.5rem 0.75rem 0.375rem', marginBottom: '0.25rem' }}>
              Navigation
            </div>
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.625rem 0.875rem', borderRadius: '10px',
                  fontSize: '0.8125rem', fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#fff' : '#94a3b8',
                  background: isActive ? 'linear-gradient(135deg, rgba(0, 210, 255, 0.12), rgba(123, 47, 247, 0.08))' : 'transparent',
                  textDecoration: 'none', transition: 'all 0.2s ease',
                  borderLeft: isActive ? '3px solid #00d2ff' : '3px solid transparent',
                  boxShadow: isActive ? '0 2px 10px rgba(0, 210, 255, 0.08)' : 'none',
                })}>
                <link.icon size={17} style={{ flexShrink: 0 }} />
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* User Card + Logout */}
          <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="glass" style={{ padding: '0.75rem', marginBottom: '0.5rem', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, #00d2ff, #7b2ff7)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 800, color: '#fff',
                }}>
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.8125rem', color: '#e8eaf6' }}>{user?.name}</p>
                  <p style={{ margin: 0, fontSize: '0.625rem', color: '#64748b' }}>{user?.email}</p>
                </div>
              </div>
            </div>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
              <HiOutlineLogout size={14} /> Sign Out
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main style={{
          flex: 1, padding: '1.75rem 2rem',
          overflow: 'auto', minHeight: 'calc(100vh - 56px)',
          position: 'relative', zIndex: 1,
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
