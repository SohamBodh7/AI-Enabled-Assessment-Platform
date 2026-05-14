import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getFacultyExams, getActiveSessions, getAllSessions, sendWarning, terminateSession, reopenSession, getChat, sendChatMessage } from '../../services/api';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import {
  HiOutlineEye, HiOutlineExclamation, HiOutlineBan, HiOutlineRefresh,
  HiOutlineChat, HiOutlineX, HiOutlinePaperAirplane, HiOutlineStatusOnline,
} from 'react-icons/hi';

const SOCKET_URL = 'http://localhost:5000';

export default function LiveMonitor() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [sessions, setSessions] = useState([]);
  const [chatSession, setChatSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);
  const [cameraFrames, setCameraFrames] = useState({});

  useEffect(() => {
    getFacultyExams().then(r => setExams(r.data.exams || [])).catch(() => {});
  }, []);

  // Connect socket & join exam room
  useEffect(() => {
    if (!selectedExam) return;
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;
    socket.on('connect', () => {
      socket.emit('faculty_join', { exam_id: selectedExam });
    });
    socket.on('student_joined', () => loadSessions());
    socket.on('session_updated', () => loadSessions());
    socket.on('student_camera_frame', (data) => {
      setCameraFrames(prev => ({ ...prev, [data.session_id]: data.frame }));
    });
    socket.on('new_message', (data) => {
      if (chatSession && data.session_id === chatSession.id) {
        setMessages(prev => [...prev, data]);
      }
    });
    loadSessions();
    const interval = setInterval(loadSessions, 8000);
    return () => { socket.disconnect(); clearInterval(interval); };
  }, [selectedExam]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadSessions = () => {
    if (!selectedExam) return;
    setLoading(true);
    getAllSessions(selectedExam).then(r => setSessions(r.data.sessions || [])).catch(() => {}).finally(() => setLoading(false));
  };

  const handleWarn = async (session) => {
    if (session.warnings >= 3 && !confirm(`This is warning #${session.warnings + 1}. The exam will be AUTO-TERMINATED. Continue?`)) return;
    try {
      const r = await sendWarning({ session_id: session.id, message: `Warning ${session.warnings + 1}: Please follow exam rules.` });
      socketRef.current?.emit('send_warning', { session_id: session.id, exam_id: selectedExam, warnings: r.data.warnings });
      if (r.data.auto_terminated) {
        socketRef.current?.emit('terminate_exam', { session_id: session.id, exam_id: selectedExam });
        toast.error(`${session.student_name}'s exam auto-terminated (4th warning)`);
      } else {
        toast.success(`Warning ${r.data.warnings}/3 sent to ${session.student_name}`);
      }
      loadSessions();
    } catch { toast.error('Failed to send warning'); }
  };

  const handleTerminate = async (session) => {
    if (!confirm(`Terminate ${session.student_name}'s exam?`)) return;
    try {
      await terminateSession({ session_id: session.id, time_spent: session.time_spent });
      socketRef.current?.emit('terminate_exam', { session_id: session.id, exam_id: selectedExam });
      toast.success('Exam terminated');
      loadSessions();
    } catch { toast.error('Failed'); }
  };

  const handleReopen = async (session) => {
    if (!confirm(`Reopen exam for ${session.student_name}?`)) return;
    try {
      const r = await reopenSession({ session_id: session.id });
      toast.success(`Reopened with ${Math.round(r.data.remaining_seconds / 60)} mins remaining`);
      loadSessions();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const openChat = async (session) => {
    setChatSession(session);
    try {
      const r = await getChat(session.id);
      setMessages(r.data.messages || []);
    } catch { setMessages([]); }
  };

  const handleSendMsg = async () => {
    if (!msgInput.trim() || !chatSession) return;
    try {
      const r = await sendChatMessage({ session_id: chatSession.id, message: msgInput });
      socketRef.current?.emit('send_message', { ...r.data.message, session_id: chatSession.id });
      setMessages(prev => [...prev, r.data.message]);
      setMsgInput('');
    } catch { toast.error('Failed to send'); }
  };

  const statusColor = { active: '#00e676', reopened: '#ffd740', submitted: '#00d2ff', terminated: '#ff5252' };
  const warnColor = (w) => w >= 3 ? '#ff5252' : w >= 2 ? '#ffd740' : w >= 1 ? '#ff9100' : '#475569';
  const activeSessions = sessions.filter(s => s.status === 'active' || s.status === 'reopened');

  return (
    <div className="fade-in" style={{ maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0,230,118,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HiOutlineEye size={20} color="#00e676" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Live Monitor</h1>
            <p style={{ color: '#64748b', fontSize: '0.8125rem' }}>
              {activeSessions.length > 0 ? <><HiOutlineStatusOnline size={12} color="#00e676" style={{ display: 'inline' }} /> {activeSessions.length} student{activeSessions.length > 1 ? 's' : ''} online</> : 'Select an exam to monitor'}
            </p>
          </div>
        </div>
        <select className="input" style={{ width: '280px' }} value={selectedExam} onChange={e => setSelectedExam(e.target.value)}>
          <option value="">Select an exam</option>
          {exams.map(e => <option key={e.id} value={e.id}>{e.title} ({e.type})</option>)}
        </select>
      </div>

      {!selectedExam ? (
        <div className="glass" style={{ borderRadius: '14px', padding: '3rem', textAlign: 'center', color: '#475569' }}>
          Select an exam to start live monitoring
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: chatSession ? '1fr 320px' : '1fr', gap: '1rem' }}>
          {/* Sessions Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sessions.length === 0 && !loading && (
              <div className="glass" style={{ borderRadius: '14px', padding: '2.5rem', textAlign: 'center', color: '#475569' }}>
                No sessions yet. Students will appear here when they start the exam.
              </div>
            )}
            {sessions.map(s => (
              <div key={s.id} className="glass" style={{ borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem',
                borderLeft: `3px solid ${statusColor[s.status] || '#475569'}` }}>
                {/* Camera Feed / Avatar */}
                {cameraFrames[s.id] ? (
                  <img src={cameraFrames[s.id]} alt={`${s.student_name} cam`} style={{
                    width: '52px', height: '40px', borderRadius: '8px', objectFit: 'cover',
                    border: `2px solid ${statusColor[s.status] || '#475569'}`,
                    flexShrink: 0, boxShadow: `0 0 8px ${statusColor[s.status]}40`,
                  }} />
                ) : (
                  <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: `${statusColor[s.status]}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.875rem', color: statusColor[s.status], flexShrink: 0 }}>
                    {s.student_name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#e8eaf6' }}>{s.student_name}</div>
                  <div style={{ fontSize: '0.6875rem', color: '#475569', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ color: statusColor[s.status], fontWeight: 600 }}>{s.status?.toUpperCase()}</span>
                    <span>⚠️ {s.warnings}/3</span>
                    {s.started_at && <span>{new Date(s.started_at).toLocaleTimeString()}</span>}
                  </div>
                </div>
                {/* Warning badges */}
                {s.warnings > 0 && (
                  <div style={{ padding: '0.25rem 0.625rem', borderRadius: '8px', background: `${warnColor(s.warnings)}15`, color: warnColor(s.warnings), fontSize: '0.6875rem', fontWeight: 800 }}>
                    {s.warnings}/3
                  </div>
                )}
                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                  {(s.status === 'active' || s.status === 'reopened') && (
                    <>
                      <button className="btn btn-sm" onClick={() => openChat(s)} title="Chat"
                        style={{ background: 'rgba(0,210,255,0.1)', border: '1px solid rgba(0,210,255,0.2)', color: '#00d2ff', padding: '0.375rem' }}>
                        <HiOutlineChat size={14} />
                      </button>
                      <button className="btn btn-sm" onClick={() => handleWarn(s)} title="Send Warning"
                        style={{ background: 'rgba(255,145,0,0.1)', border: '1px solid rgba(255,145,0,0.2)', color: '#ff9100', padding: '0.375rem' }}>
                        <HiOutlineExclamation size={14} />
                      </button>
                      <button className="btn btn-sm" onClick={() => handleTerminate(s)} title="Terminate"
                        style={{ background: 'rgba(255,82,82,0.1)', border: '1px solid rgba(255,82,82,0.2)', color: '#ff5252', padding: '0.375rem' }}>
                        <HiOutlineBan size={14} />
                      </button>
                    </>
                  )}
                  {s.status === 'terminated' && (
                    <button className="btn btn-sm" onClick={() => handleReopen(s)} title="Reopen"
                      style={{ background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.2)', color: '#00e676', padding: '0.375rem' }}>
                      <HiOutlineRefresh size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Panel */}
          {chatSession && (
            <div className="glass" style={{ borderRadius: '14px', display: 'flex', flexDirection: 'column', height: '500px', overflow: 'hidden' }}>
              <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{chatSession.student_name}</div>
                  <div style={{ fontSize: '0.625rem', color: '#64748b' }}>⚠️ {chatSession.warnings}/3 warnings</div>
                </div>
                <button className="btn btn-icon btn-ghost btn-sm" onClick={() => setChatSession(null)}><HiOutlineX size={16} /></button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ alignSelf: m.sender_role === 'faculty' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                    <div style={{ padding: '0.5rem 0.75rem', borderRadius: '10px', fontSize: '0.8125rem',
                      background: m.is_warning ? 'rgba(255,82,82,0.15)' : m.sender_role === 'faculty' ? 'rgba(0,210,255,0.1)' : 'rgba(255,255,255,0.05)',
                      border: m.is_warning ? '1px solid rgba(255,82,82,0.3)' : '1px solid rgba(255,255,255,0.06)',
                      color: m.is_warning ? '#ff5252' : '#e8eaf6' }}>
                      {m.is_warning && <span style={{ fontSize: '0.625rem', fontWeight: 800, display: 'block', marginBottom: '0.25rem', color: '#ff5252' }}>⚠️ WARNING</span>}
                      {m.message}
                    </div>
                    <div style={{ fontSize: '0.5625rem', color: '#475569', marginTop: '0.125rem', textAlign: m.sender_role === 'faculty' ? 'right' : 'left' }}>
                      {m.sent_at ? new Date(m.sent_at).toLocaleTimeString() : ''}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.5rem' }}>
                <input className="input" style={{ flex: 1 }} placeholder="Type a message..." value={msgInput}
                  onChange={e => setMsgInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMsg()} />
                <button className="btn btn-primary btn-sm" onClick={handleSendMsg} style={{ padding: '0.5rem' }}>
                  <HiOutlinePaperAirplane size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
