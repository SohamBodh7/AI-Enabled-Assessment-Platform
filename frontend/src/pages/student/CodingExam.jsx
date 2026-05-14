import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStudentExamDetails, runCode, submitCode, sendProctorFrame, startSession, endSession } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import CodeEditor from '../../components/CodeEditor';
import Timer from '../../components/Timer';
import toast from 'react-hot-toast';
import { HiOutlinePlay, HiOutlineCheck, HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineTerminal, HiOutlineExclamation } from 'react-icons/hi';

export default function CodingExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [codes, setCodes] = useState({});
  const [output, setOutput] = useState(null);
  const [showConsole, setShowConsole] = useState(false);
  const [running, setRunning] = useState(false);
  const [tab, setTab] = useState('desc');
  const [customInput, setCustomInput] = useState('');
  const [runMode, setRunMode] = useState('testcase');
  const [warningCount, setWarningCount] = useState(0);
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
    }).catch(() => toast.error('Failed to load'));

    startSession({ exam_id: id }).then(r => {
      const sess = r.data.session;
      setSessionData(sess);
      setWarningCount(sess.warnings || 0);
      if (sess.remaining_seconds) setTimerDuration(sess.remaining_seconds);
      const socket = io('http://localhost:5000', { transports: ['websocket', 'polling'] });
      socketRef.current = socket;
      socket.on('connect', () => {
        socket.emit('student_join', { exam_id: id, session_id: sess.id, student_id: user?.id, student_name: user?.name });
      });
      socket.on('warning_received', (data) => {
        const w = data.warnings || warningCount + 1;
        setWarningCount(w);
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
      .then(s => { if (videoRef.current) videoRef.current.srcObject = s; }).catch(() => {});

    const interval = setInterval(() => {
      if (videoRef.current) {
        const c = document.createElement('canvas');
        c.width = 160; c.height = 120;
        c.getContext('2d').drawImage(videoRef.current, 0, 0, 160, 120);
        const frameData = c.toDataURL('image/jpeg', 0.5);
        sendProctorFrame({ exam_id: id, frame: frameData }).catch(() => {});
        socketRef.current?.emit('camera_frame', { exam_id: id, session_id: sessionData?.id, student_id: user?.id, frame: frameData });
      }
    }, 10000);
    return () => { clearInterval(interval); socketRef.current?.disconnect(); };
  }, [id]);

  const q = questions[current];
  const code = codes[q?.id] || '# Write your solution here\n';

  const handleRun = async () => {
    setRunning(true); setShowConsole(true);
    try {
      if (runMode === 'custom') {
        // Run with custom input (no test case evaluation)
        const { data } = await runCode({ code, input_data: customInput });
        setOutput(data);
      } else {
        // Run against sample test cases
        const { data } = await runCode({ question_id: q.id, code });
        setOutput(data);
      }
    } catch (err) { setOutput({ error: err.response?.data?.error || 'Execution failed' }); }
    finally { setRunning(false); }
  };

  const handleSubmit = useCallback(async () => {
    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    try {
      for (const question of questions) {
        const c = codes[question.id] || '';
        if (c.trim()) await submitCode({ question_id: question.id, exam_id: id, code: c });
      }
      if (sessionData) endSession({ session_id: sessionData.id, time_spent: elapsed }).catch(() => {});
      socketRef.current?.emit('student_submitted', { exam_id: id, session_id: sessionData?.id });
      toast.success('All solutions submitted!');
      navigate('/student/results');
    } catch { toast.error('Submission failed'); }
  }, [questions, codes, navigate, sessionData]);

  if (!exam) return <div style={{display: 'flex', justifyContent: 'center', padding: '4rem'}}><span className="spinner" /></div>;

  return (
    <div style={{position: 'relative', zIndex: 1}}>
      {/* Top Bar */}
      <div className="glass" style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1.25rem', borderRadius: 0, borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <h3 style={{fontSize: '0.9375rem', fontWeight: 700}}>{exam.title}</h3>
          <span className="badge badge-purple">CODING</span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
          {/* Question tabs */}
          <div style={{display: 'flex', gap: '4px'}}>
            {questions.map((_, i) => (
              <button key={i} onClick={() => { setCurrent(i); setOutput(null); }} style={{
                width: '30px', height: '30px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.15s',
                background: i === current ? 'linear-gradient(135deg, #7b2ff7, #00d2ff)' : 'rgba(255,255,255,0.04)',
                color: i === current ? '#fff' : '#64748b',
              }}>Q{i + 1}</button>
            ))}
          </div>
          <Timer duration={timerDuration || exam.duration * 60} onTimeUp={handleSubmit} />
          {warningCount > 0 && (
            <div style={{ padding: '0.25rem 0.625rem', borderRadius: '8px', background: 'rgba(255,82,82,0.15)', color: '#ff5252', fontSize: '0.6875rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <HiOutlineExclamation size={12} /> {warningCount}/3
            </div>
          )}
          <div style={{position: 'relative'}}>
            <video ref={videoRef} autoPlay muted style={{width: '48px', height: '36px', borderRadius: '6px', objectFit: 'cover', border: '2px solid rgba(123,47,247,0.3)'}} />
            <div style={{position: 'absolute', top: '-3px', right: '-3px', width: '8px', height: '8px', borderRadius: '50%', background: '#00e676', boxShadow: '0 0 6px #00e676'}} />
          </div>
        </div>
      </div>

      {/* Split Pane */}
      <div className="split-pane">
        {/* Left — Problem */}
        <div className="split-left">
          <div className="tab-bar">
            <button className={`tab-item ${tab === 'desc' ? 'active' : ''}`} onClick={() => setTab('desc')}>Description</button>
            <button className={`tab-item ${tab === 'submissions' ? 'active' : ''}`} onClick={() => setTab('submissions')}>Submissions</button>
          </div>
          <div style={{padding: '1.5rem', overflowY: 'auto', flex: 1}}>
            {tab === 'desc' && q && (
              <div className="fade-in">
                <h2 style={{fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem'}}>{q.title}</h2>
                <div style={{color: '#94a3b8', lineHeight: 1.8, fontSize: '0.875rem', marginBottom: '1.5rem'}}>
                  {q.problem_statement}
                </div>
                {q.input_format && (
                  <div style={{marginBottom: '1rem'}}>
                    <h4 style={{fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.375rem'}}>Input Format</h4>
                    <div className="glass" style={{padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.8125rem', color: '#94a3b8', fontFamily: 'monospace'}}>{q.input_format}</div>
                  </div>
                )}
                {q.output_format && (
                  <div style={{marginBottom: '1rem'}}>
                    <h4 style={{fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.375rem'}}>Output Format</h4>
                    <div className="glass" style={{padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.8125rem', color: '#94a3b8', fontFamily: 'monospace'}}>{q.output_format}</div>
                  </div>
                )}
                {q.constraints && (
                  <div style={{marginBottom: '1rem'}}>
                    <h4 style={{fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.375rem'}}>Constraints</h4>
                    <div className="glass" style={{padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.8125rem', color: '#94a3b8', fontFamily: 'monospace'}}>{q.constraints}</div>
                  </div>
                )}
                {q.sample_input && (
                  <div style={{marginBottom: '1rem'}}>
                    <h4 style={{fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.375rem'}}>Sample Input</h4>
                    <pre style={{background: 'rgba(0,0,0,0.3)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.8125rem', color: '#00d2ff', fontFamily: 'monospace', margin: 0, overflowX: 'auto'}}>{q.sample_input}</pre>
                  </div>
                )}
                {q.sample_output && (
                  <div>
                    <h4 style={{fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.375rem'}}>Sample Output</h4>
                    <pre style={{background: 'rgba(0,0,0,0.3)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.8125rem', color: '#00e676', fontFamily: 'monospace', margin: 0, overflowX: 'auto'}}>{q.sample_output}</pre>
                  </div>
                )}
              </div>
            )}
            {tab === 'submissions' && <p style={{color: '#475569'}}>Previous submissions will appear here</p>}
          </div>
        </div>

        {/* Right — Editor + Console */}
        <div className="split-right">
          {/* Toolbar */}
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.15)'}}>
            <span style={{fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Python 3</span>
            <div style={{display: 'flex', gap: '0.5rem'}}>
              <button className="btn btn-ghost btn-sm" onClick={handleRun} disabled={running}>
                {running ? <span className="spinner" /> : <><HiOutlinePlay size={14} /> Run</>}
              </button>
              <button className="btn btn-success btn-sm" onClick={handleSubmit}>
                <HiOutlineCheck size={14} /> Submit All
              </button>
            </div>
          </div>

          {/* Editor */}
          <div className="split-editor">
            <CodeEditor value={code} onChange={(val) => setCodes({ ...codes, [q?.id]: val })} />
          </div>

          {/* Console */}
          <div className="split-console">
            <button onClick={() => setShowConsole(!showConsole)} style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%',
              padding: '0.5rem 1rem', background: 'rgba(0,0,0,0.2)', border: 'none',
              cursor: 'pointer', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600,
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
              <HiOutlineTerminal size={14} /> Console
              {showConsole ? <HiOutlineChevronDown size={14} /> : <HiOutlineChevronUp size={14} />}
            </button>
            {showConsole && (
              <div style={{padding: '0.75rem 1rem'}}>
                {/* Run mode toggle */}
                <div style={{display: 'flex', gap: '0.5rem', marginBottom: '0.75rem'}}>
                  <button onClick={() => setRunMode('testcase')} style={{
                    padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.6875rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                    background: runMode === 'testcase' ? 'rgba(0,210,255,0.15)' : 'rgba(255,255,255,0.04)',
                    color: runMode === 'testcase' ? '#00d2ff' : '#64748b',
                  }}>Test Cases</button>
                  <button onClick={() => setRunMode('custom')} style={{
                    padding: '0.25rem 0.75rem', borderRadius: '6px', fontSize: '0.6875rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                    background: runMode === 'custom' ? 'rgba(0,230,118,0.15)' : 'rgba(255,255,255,0.04)',
                    color: runMode === 'custom' ? '#00e676' : '#64748b',
                  }}>Custom Input</button>
                </div>

                {/* Custom input textarea */}
                {runMode === 'custom' && (
                  <div style={{marginBottom: '0.75rem'}}>
                    <div style={{fontSize: '0.625rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.375rem'}}>Stdin Input</div>
                    <textarea
                      value={customInput} onChange={e => setCustomInput(e.target.value)}
                      placeholder={"Enter your input here...\ne.g.\n5\n3 1 4 1 5"}
                      rows={4}
                      style={{
                        width: '100%', fontFamily: "'Fira Code', monospace", fontSize: '0.8125rem',
                        background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px', padding: '0.625rem 0.75rem', color: '#e8eaf6',
                        resize: 'vertical', outline: 'none',
                      }}
                    />
                  </div>
                )}

                {/* Output */}
                <div style={{fontFamily: 'monospace', fontSize: '0.8125rem'}}>
                  {output?.error && <div style={{color: '#ff5252', whiteSpace: 'pre-wrap'}}>{output.error}</div>}
                  {output?.output && !output?.results && (
                    <div style={{whiteSpace: 'pre-wrap'}}>
                      <div style={{fontSize: '0.625rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.25rem'}}>Output</div>
                      <div style={{color: '#00e676', background: 'rgba(0,0,0,0.2)', padding: '0.625rem', borderRadius: '8px'}}>{output.output}</div>
                      {output.execution_time !== undefined && (
                        <div style={{fontSize: '0.625rem', color: '#475569', marginTop: '0.375rem'}}>Executed in {output.execution_time}s</div>
                      )}
                    </div>
                  )}
                  {output?.results?.map((r, i) => (
                    <div key={i} style={{marginBottom: '0.75rem', padding: '0.625rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)'}}>
                      <span className={`badge ${r.passed ? 'badge-green' : 'badge-red'}`} style={{marginBottom: '0.25rem'}}>
                        Test {i + 1}: {r.passed ? 'PASSED' : 'FAILED'}
                      </span>
                      {!r.passed && r.expected && (
                        <div style={{marginTop: '0.375rem', fontSize: '0.75rem'}}>
                          <div style={{color: '#64748b'}}>Expected: <span style={{color: '#00e676'}}>{r.expected}</span></div>
                          <div style={{color: '#64748b'}}>Got: <span style={{color: '#ff5252'}}>{r.actual}</span></div>
                        </div>
                      )}
                    </div>
                  ))}
                  {output?.score !== undefined && (
                    <div style={{marginTop: '0.5rem', padding: '0.625rem', borderRadius: '8px', background: 'rgba(0,210,255,0.06)'}}>
                      <span style={{fontWeight: 700, color: '#00d2ff'}}>Score: {output.score}%</span>
                      <span style={{marginLeft: '0.75rem', color: '#64748b', fontSize: '0.75rem'}}>({output.passed}/{output.total} passed)</span>
                    </div>
                  )}
                  {!output && <div style={{color: '#475569', fontSize: '0.75rem'}}>Run your code to see output here</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
