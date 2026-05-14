import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudentExamDetails, submitMCQExam, sendProctorFrame, startSession, endSession } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import Timer from '../../components/Timer';
import toast from 'react-hot-toast';
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineCheck, HiOutlineEye, HiOutlineExclamation } from 'react-icons/hi';

export default function MCQExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [warningCount, setWarningCount] = useState(0);
  const [showWarning, setShowWarning] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [timerDuration, setTimerDuration] = useState(null);
  const { user } = useAuth();
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    getStudentExamDetails(id).then(r => {
      setExam(r.data.exam);
      setQuestions(r.data.exam.questions || []);
      setTimerDuration(r.data.exam.duration * 60);
    }).catch(() => toast.error('Failed to load exam'));

    // Start session
    startSession({ exam_id: id }).then(r => {
      const sess = r.data.session;
      setSessionData(sess);
      setWarningCount(sess.warnings || 0);
      if (sess.remaining_seconds) setTimerDuration(sess.remaining_seconds);
      // Connect WebSocket
      const socket = io('http://localhost:5000', { transports: ['websocket', 'polling'] });
      socketRef.current = socket;
      socket.on('connect', () => {
        socket.emit('student_join', { exam_id: id, session_id: sess.id, student_id: user?.id, student_name: user?.name });
      });
      socket.on('warning_received', (data) => {
        const w = data.warnings || warningCount + 1;
        setWarningCount(w);
        setShowWarning(`Warning ${w}/3: Please follow exam rules!`);
        toast.error(`⚠️ Warning ${w}/3 from faculty!`, { duration: 5000 });
      });
      socket.on('exam_terminated', () => {
        toast.error('Your exam has been terminated by the faculty.', { duration: 8000 });
        handleSubmit();
      });
      socket.on('new_message', (data) => {
        if (data.sender_role === 'faculty') toast(`💬 Faculty: ${data.message}`, { duration: 6000 });
      });
    }).catch(() => {});

    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
      .catch(() => {});

    const interval = setInterval(() => {
      if (videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = 160; canvas.height = 120;
        canvas.getContext('2d').drawImage(videoRef.current, 0, 0, 160, 120);
        const frameData = canvas.toDataURL('image/jpeg', 0.5);
        sendProctorFrame({ exam_id: id, frame: frameData }).catch(() => {});
        socketRef.current?.emit('camera_frame', { exam_id: id, session_id: sessionData?.id, student_id: user?.id, frame: frameData });
      }
    }, 10000);
    return () => { clearInterval(interval); socketRef.current?.disconnect(); };
  }, [id]);

  const select = (qId, opt) => setAnswers({ ...answers, [qId]: opt });

  const handleSubmit = useCallback(async () => {
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    try {
      await submitMCQExam(id, { answers });
      if (sessionData) endSession({ session_id: sessionData.id, time_spent: elapsed }).catch(() => {});
      socketRef.current?.emit('student_submitted', { exam_id: id, session_id: sessionData?.id });
      toast.success('Exam submitted!');
      navigate('/student/results');
    } catch { toast.error('Submission failed'); }
  }, [id, answers, navigate, sessionData]);

  if (!exam) return <div style={{display: 'flex', justifyContent: 'center', padding: '4rem'}}><span className="spinner" /></div>;
  const q = questions[current];

  return (
    <div style={{position: 'relative', zIndex: 1, maxWidth: '100%', minHeight: 'calc(100vh - 56px)'}}>
      {/* Top Bar */}
      <div className="glass" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1.25rem', borderRadius: 0, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 0}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <h3 style={{fontSize: '0.9375rem', fontWeight: 700}}>{exam.title}</h3>
          <span className="badge badge-cyan">MCQ</span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <Timer duration={timerDuration || exam.duration * 60} onTimeUp={handleSubmit} />
          {warningCount > 0 && (
            <div style={{ padding: '0.25rem 0.625rem', borderRadius: '8px', background: 'rgba(255,82,82,0.15)', color: '#ff5252', fontSize: '0.6875rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <HiOutlineExclamation size={12} /> {warningCount}/3
            </div>
          )}
          <div style={{position: 'relative'}}>
            <video ref={videoRef} autoPlay muted style={{width: '48px', height: '36px', borderRadius: '6px', objectFit: 'cover', border: '2px solid rgba(0,210,255,0.3)'}} />
            <div style={{position: 'absolute', top: '-3px', right: '-3px', width: '8px', height: '8px', borderRadius: '50%', background: '#00e676', boxShadow: '0 0 6px #00e676'}} />
          </div>
        </div>
      </div>

      <div style={{display: 'flex', height: 'calc(100vh - 56px - 52px)'}}>
        {/* Question Navigator */}
        <div style={{width: '200px', padding: '1rem', borderRight: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', background: 'rgba(0,0,0,0.1)', flexShrink: 0}}>
          <div style={{fontSize: '0.6875rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem'}}>Questions</div>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px'}}>
            {questions.map((q, i) => (
              <button key={i} onClick={() => setCurrent(i)} style={{
                width: '36px', height: '36px', borderRadius: '8px', display: 'flex',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none',
                fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.15s',
                background: i === current ? 'linear-gradient(135deg, #00d2ff, #7b2ff7)' : answers[q.id] ? 'rgba(0,230,118,0.15)' : 'rgba(255,255,255,0.04)',
                color: i === current ? '#fff' : answers[q.id] ? '#00e676' : '#94a3b8',
                boxShadow: i === current ? '0 4px 12px rgba(0,210,255,0.3)' : 'none',
              }}>
                {i + 1}
              </button>
            ))}
          </div>
          <div style={{marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.03)'}}>
            <div style={{fontSize: '0.6875rem', color: '#64748b', marginBottom: '0.5rem'}}>Progress</div>
            <div style={{height: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden'}}>
              <div style={{height: '100%', borderRadius: '4px', background: 'linear-gradient(90deg, #00d2ff, #7b2ff7)', width: `${(Object.keys(answers).length / questions.length) * 100}%`, transition: 'width 0.3s'}} />
            </div>
            <div style={{fontSize: '0.6875rem', color: '#94a3b8', marginTop: '0.375rem'}}>{Object.keys(answers).length}/{questions.length} answered</div>
          </div>
        </div>

        {/* Question Panel */}
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto'}}>
          {q && (
            <div className="fade-in" style={{padding: '2rem', flex: 1}}>
              <div style={{marginBottom: '0.5rem', fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em'}}>
                Question {current + 1} of {questions.length}
              </div>
              <h2 style={{fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.75rem', lineHeight: 1.6}}>{q.question_text}</h2>

              <div style={{display: 'flex', flexDirection: 'column', gap: '0.625rem', maxWidth: '600px'}}>
                {['a', 'b', 'c', 'd'].map(opt => (
                  <button key={opt} onClick={() => select(q.id, opt)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.875rem',
                    padding: '0.875rem 1.125rem', borderRadius: '10px', cursor: 'pointer',
                    textAlign: 'left', border: 'none', transition: 'all 0.15s',
                    background: answers[q.id] === opt ? 'linear-gradient(135deg, rgba(0,210,255,0.12), rgba(123,47,247,0.08))' : 'rgba(255,255,255,0.03)',
                    color: answers[q.id] === opt ? '#fff' : '#94a3b8',
                    borderLeft: answers[q.id] === opt ? '3px solid #00d2ff' : '3px solid transparent',
                    boxShadow: answers[q.id] === opt ? '0 2px 12px rgba(0,210,255,0.1)' : 'none',
                  }}>
                    <span style={{
                      width: '28px', height: '28px', borderRadius: '8px', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                      background: answers[q.id] === opt ? 'linear-gradient(135deg, #00d2ff, #7b2ff7)' : 'rgba(255,255,255,0.06)',
                      color: answers[q.id] === opt ? '#fff' : '#64748b',
                    }}>
                      {opt.toUpperCase()}
                    </span>
                    <span style={{fontSize: '0.875rem'}}>{q[`option_${opt}`]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Nav */}
          <div style={{padding: '1rem 2rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <button className="btn btn-ghost" onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0}>
              <HiOutlineChevronLeft size={16} /> Previous
            </button>
            {current === questions.length - 1 ? (
              <button className="btn btn-success" onClick={handleSubmit}>
                <HiOutlineCheck size={16} /> Submit Exam
              </button>
            ) : (
              <button className="btn btn-primary" onClick={() => setCurrent(Math.min(questions.length - 1, current + 1))}>
                Next <HiOutlineChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
