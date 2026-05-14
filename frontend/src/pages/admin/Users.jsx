import { useState, useEffect } from 'react';
import { getUsers, createFaculty } from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineX } from 'react-icons/hi';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const load = () => getUsers(filter || undefined).then(r => setUsers(r.data.users || [])).catch(() => {});
  useEffect(() => { load(); }, [filter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createFaculty(form);
      toast.success('Faculty created');
      setShowModal(false); setForm({ name: '', email: '', password: '' }); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const roleColors = { admin: 'badge-red', faculty: 'badge-blue', student: 'badge-green' };

  return (
    <div className="fade-in" style={{maxWidth: '1100px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem'}}>
        <div>
          <h1 style={{fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em'}}>Users</h1>
          <p style={{color: '#64748b', fontSize: '0.8125rem', marginTop: '0.25rem'}}>{users.length} accounts</p>
        </div>
        <div style={{display: 'flex', gap: '0.75rem', alignItems: 'center'}}>
          <select className="input" style={{width: '140px'}} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="faculty">Faculty</option>
            <option value="student">Student</option>
          </select>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <HiOutlinePlus size={16} /> Add Faculty
          </button>
        </div>
      </div>

      <div className="glass" style={{borderRadius: '14px'}}>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{fontWeight: 600, color: '#e8eaf6'}}>{u.name}</td>
                  <td style={{color: '#94a3b8'}}>{u.email}</td>
                  <td><span className={`badge ${roleColors[u.role] || 'badge-cyan'}`}>{u.role?.toUpperCase()}</span></td>
                  <td style={{fontSize: '0.75rem', color: '#64748b'}}>{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{fontSize: '1rem', fontWeight: 700}}>Add Faculty</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowModal(false)}><HiOutlineX size={18}/></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                <div><label className="label">Name</label><input className="input" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                <div><label className="label">Email</label><input type="email" className="input" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                <div><label className="label">Password</label><input type="password" className="input" required minLength={6} value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Faculty</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
