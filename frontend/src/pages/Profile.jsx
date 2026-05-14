import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile, uploadProfilePhoto, PHOTO_BASE_URL } from '../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineUser, HiOutlineMail, HiOutlinePhone, HiOutlineOfficeBuilding,
  HiOutlineAcademicCap, HiOutlinePencil, HiOutlineCheck, HiOutlineCamera,
  HiOutlineIdentification, HiOutlineBookOpen,
} from 'react-icons/hi';

export default function Profile() {
  const { user: authUser, loginUser } = useAuth();
  const [user, setUser]       = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm]       = useState({});
  const fileRef = useRef();

  const load = () =>
    getProfile().then(r => {
      setUser(r.data.user);
      setForm(r.data.user);
    }).catch(() => toast.error('Failed to load profile'));

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await updateProfile(form);
      setUser(data.user);
      setForm(data.user);
      // Update auth context name
      const token = localStorage.getItem('token');
      loginUser(token, data.user);
      toast.success('Profile saved!');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('photo', file);
    try {
      await uploadProfilePhoto(fd);
      await load();
      toast.success('Photo updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally { setUploading(false); }
  };

  if (!user) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><span className="spinner" /></div>;

  const isStudent = user.role === 'student';
  const isFaculty = user.role === 'faculty';
  const photoUrl  = user.profile_photo ? `${PHOTO_BASE_URL}/${user.profile_photo}` : null;

  const Field = ({ icon: Icon, label, field, type = 'text', options }) => (
    <div>
      <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <Icon size={13} color="#64748b" /> {label}
      </label>
      {editing ? (
        options ? (
          <select className="input" value={form[field] || ''} onChange={e => setForm({ ...form, [field]: e.target.value })}>
            <option value="">— Select —</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input className="input" type={type} value={form[field] || ''}
            onChange={e => setForm({ ...form, [field]: e.target.value })} />
        )
      ) : (
        <div style={{ padding: '0.625rem 0.875rem', borderRadius: '10px', fontSize: '0.875rem',
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
          color: user[field] ? '#e8eaf6' : '#475569', minHeight: '40px', display: 'flex', alignItems: 'center' }}>
          {user[field] || <span style={{ fontStyle: 'italic' }}>Not set</span>}
        </div>
      )}
    </div>
  );

  return (
    <div className="fade-in" style={{ maxWidth: '760px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>My Profile</h1>
          <p style={{ color: '#64748b', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
            Manage your personal and institutional information
          </p>
        </div>
        {editing ? (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-ghost" onClick={() => { setEditing(false); setForm(user); }}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner" /> : <><HiOutlineCheck size={15} /> Save</>}
            </button>
          </div>
        ) : (
          <button className="btn btn-outline" onClick={() => setEditing(true)}>
            <HiOutlinePencil size={15} /> Edit Profile
          </button>
        )}
      </div>

      {/* Avatar + Basic Info Card */}
      <div className="glass" style={{ borderRadius: '16px', padding: '1.75rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>

          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: '88px', height: '88px', borderRadius: '50%', overflow: 'hidden',
              background: 'linear-gradient(135deg, #00d2ff, #7b2ff7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', fontWeight: 800, color: '#fff',
              boxShadow: '0 8px 24px rgba(0,210,255,0.25)',
              border: '3px solid rgba(0,210,255,0.3)' }}>
              {photoUrl
                ? <img src={photoUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : user.name?.charAt(0)?.toUpperCase()
              }
            </div>
            {/* Camera button */}
            <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              style={{ position: 'absolute', bottom: 0, right: 0, width: '28px', height: '28px',
                borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #00d2ff, #7b2ff7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
              {uploading ? <span className="spinner" style={{ width: '12px', height: '12px' }} />
                : <HiOutlineCamera size={14} color="#fff" />}
            </button>
          </div>

          {/* Name + Role + Email (read-only) */}
          <div style={{ flex: 1 }}>
            {editing ? (
              <input className="input" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })}
                style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }} />
            ) : (
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.25rem' }}>{user.name}</h2>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.625rem' }}>
              <span className={`badge ${user.role === 'student' ? 'badge-cyan' : 'badge-purple'}`}>
                {user.role?.toUpperCase()}
              </span>
              {isFaculty && user.designation && (
                <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>{user.designation}</span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.8125rem' }}>
              <HiOutlineMail size={14} />
              <span>{user.email}</span>
              <span style={{ fontSize: '0.6875rem', padding: '2px 6px', borderRadius: '6px',
                background: 'rgba(0,230,118,0.1)', color: '#00e676' }}>verified</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <label className="label">Bio</label>
          {editing
            ? <textarea className="input" rows={3} placeholder="Tell something about yourself..."
                value={form.bio || ''} onChange={e => setForm({ ...form, bio: e.target.value })} />
            : <p style={{ fontSize: '0.875rem', color: user.bio ? '#94a3b8' : '#475569', fontStyle: user.bio ? 'normal' : 'italic', lineHeight: 1.7, margin: 0 }}>
                {user.bio || 'No bio added yet.'}
              </p>
          }
        </div>
      </div>

      {/* Contact & Institute */}
      <div className="glass" style={{ borderRadius: '16px', padding: '1.5rem', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1.25rem', color: '#94a3b8',
          textTransform: 'uppercase', letterSpacing: '0.08em' }}>Contact & Institute</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Field icon={HiOutlinePhone} label="Phone Number" field="phone" type="tel" />
          <Field icon={HiOutlineOfficeBuilding} label="Institute / College" field="institute" />
          <Field icon={HiOutlineAcademicCap} label="Department" field="department" />
        </div>
      </div>

      {/* Role-specific fields */}
      <div className="glass" style={{ borderRadius: '16px', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1.25rem', color: '#94a3b8',
          textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {isStudent ? 'Academic Details' : 'Professional Details'}
        </h3>

        {isStudent && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field icon={HiOutlineIdentification} label="Roll Number" field="roll_no" />
            <Field icon={HiOutlineBookOpen} label="Year of Study" field="year"
              options={['1st Year', '2nd Year', '3rd Year', '4th Year']} />
          </div>
        )}

        {isFaculty && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Field icon={HiOutlineIdentification} label="Employee ID" field="employee_id" />
            <Field icon={HiOutlineUser} label="Designation" field="designation"
              options={['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'HOD']} />
          </div>
        )}
      </div>

    </div>
  );
}
