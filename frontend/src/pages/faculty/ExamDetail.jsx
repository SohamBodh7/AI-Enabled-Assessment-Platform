import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExamDetails, addMCQQuestion, deleteMCQQuestion, addCodingQuestion, deleteCodingQuestion, addTestCase, deleteTestCase, getStudents, getExamAssignments, assignExamToStudents, generateQuestions, saveAIQuestions } from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineX, HiOutlineCode, HiOutlineClipboardList, HiOutlineUsers, HiOutlineCheck, HiOutlineLightningBolt, HiOutlineCheckCircle, HiOutlineKey } from 'react-icons/hi';

export default function ExamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [showModal, setShowModal] = useState(null);
  const [mcqForm, setMcqForm] = useState({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'a' });
  const [codingForm, setCodingForm] = useState({ title: '', problem_statement: '', input_format: '', output_format: '', constraints: '' });
  const [tcForm, setTcForm] = useState({ input_data: '', expected_output: '' });
  const [tcTarget, setTcTarget] = useState(null);

  // AI Generation State
  const [showAI, setShowAI] = useState(false);
  const [aiForm, setAiForm] = useState({ topic: '', difficulty: 'medium', count: 5 });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPreview, setAiPreview] = useState([]);
  const [aiSelected, setAiSelected] = useState(new Set());
  const [aiSaving, setAiSaving] = useState(false);

  // Assignments State
  const [tab, setTab] = useState('questions');
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [savingAssignments, setSavingAssignments] = useState(false);

  const load = () => {
    getExamDetails(id).then(r => { setExam(r.data.exam); setQuestions(r.data.exam.questions || []); }).catch(() => toast.error('Failed to load exam'));
    getStudents().then(r => setStudents(r.data.students || [])).catch(() => {});
    getExamAssignments(id).then(r => {
      const assigned = r.data.assignments || [];
      setSelectedStudents(new Set(assigned.map(a => a.student_id)));
    }).catch(() => {});
  };
  useEffect(() => { load(); }, [id]);

  const handleAddMCQ = async (e) => { e.preventDefault(); try { await addMCQQuestion(id, mcqForm); toast.success('Added'); setShowModal(null); setMcqForm({ question_text: '', option_a: '', option_b: '', option_c: '', option_d: '', correct_option: 'a' }); load(); } catch { toast.error('Failed'); }};
  const handleAddCoding = async (e) => { e.preventDefault(); try { await addCodingQuestion(id, codingForm); toast.success('Added'); setShowModal(null); setCodingForm({ title: '', problem_statement: '', input_format: '', output_format: '', constraints: '' }); load(); } catch { toast.error('Failed'); }};
  const handleAddTC = async (e) => { e.preventDefault(); try { await addTestCase(tcTarget, tcForm); toast.success('Added'); setShowModal(null); setTcForm({ input_data: '', expected_output: '' }); load(); } catch { toast.error('Failed'); }};
  const handleDeleteQ = async (qid, type) => { if (!confirm('Delete?')) return; try { type === 'mcq' ? await deleteMCQQuestion(qid) : await deleteCodingQuestion(qid); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }};
  const handleDeleteTC = async (tcid) => { if (!confirm('Delete?')) return; try { await deleteTestCase(tcid); toast.success('Deleted'); load(); } catch { toast.error('Failed'); } };

  // AI Generation Handlers
  const handleAIGenerate = async () => {
    if (!aiForm.topic.trim()) { toast.error('Enter a topic'); return; }
    setAiLoading(true); setAiPreview([]); setAiSelected(new Set());
    try {
      const r = await generateQuestions({ exam_type: exam.type, ...aiForm });
      const qs = r.data.questions || [];
      setAiPreview(qs);
      setAiSelected(new Set(qs.map((_, i) => i)));
      if (qs.length === 0) toast.error('No questions generated. Try a different topic.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'AI generation failed');
    } finally { setAiLoading(false); }
  };

  const handleAISave = async () => {
    const selected = aiPreview.filter((_, i) => aiSelected.has(i));
    if (selected.length === 0) { toast.error('Select at least one question'); return; }
    setAiSaving(true);
    try {
      await saveAIQuestions({ exam_id: id, exam_type: exam.type, questions: selected });
      toast.success(`${selected.length} questions added!`);
      setShowAI(false); setAiPreview([]); setAiForm({ topic: '', difficulty: 'medium', count: 5 }); load();
    } catch { toast.error('Failed to save'); } finally { setAiSaving(false); }
  };

  const handleToggleStudent = (sid) => {
    const next = new Set(selectedStudents);
    if (next.has(sid)) next.delete(sid);
    else next.add(sid);
    setSelectedStudents(next);
  };

  const handleSaveAssignments = async () => {
    setSavingAssignments(true);
    try {
      await assignExamToStudents(id, { student_ids: Array.from(selectedStudents) });
      toast.success('Assignments updated');
    } catch {
      toast.error('Failed to update assignments');
    } finally {
      setSavingAssignments(false);
    }
  };

  if (!exam) return <div style={{display: 'flex', justifyContent: 'center', padding: '4rem'}}><span className="spinner"/></div>;

  return (
    <div className="fade-in" style={{maxWidth: '900px'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem'}}>
        <div style={{width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: exam.type === 'mcq' ? 'rgba(0,210,255,0.1)' : 'rgba(123,47,247,0.1)'}}>
          {exam.type === 'mcq' ? <HiOutlineClipboardList size={22} color="#00d2ff" /> : <HiOutlineCode size={22} color="#7b2ff7" />}
        </div>
        <div>
          <h1 style={{fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em'}}>{exam.title}</h1>
          <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem'}}>
            <span className={`badge ${exam.type === 'mcq' ? 'badge-cyan' : 'badge-purple'}`}>{exam.type?.toUpperCase()}</span>
            <span className={`badge ${exam.is_public ? 'badge-green' : 'badge-red'}`}>{exam.is_public ? 'PUBLIC' : 'PRIVATE'}</span>
            <span style={{color: '#64748b', fontSize: '0.8125rem'}}>{exam.duration} min</span>
            <span style={{color: '#64748b', fontSize: '0.8125rem'}}>{questions.length} questions</span>
          </div>
        </div>
      </div>

      <div className="tab-bar" style={{marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.06)'}}>
        <button className={`tab-item ${tab === 'questions' ? 'active' : ''}`} onClick={() => setTab('questions')}>Questions</button>
        <button className={`tab-item ${tab === 'answerkey' ? 'active' : ''}`} onClick={() => setTab('answerkey')}>Answer Key</button>
        {!exam.is_public && (
          <button className={`tab-item ${tab === 'assignments' ? 'active' : ''}`} onClick={() => setTab('assignments')}>Assignments</button>
        )}
      </div>

      {tab === 'questions' ? (
        <div>
          {/* Add Buttons */}
          <div style={{marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap'}}>
            <button className="btn btn-primary" onClick={() => setShowModal(exam.type === 'mcq' ? 'mcq' : 'coding')}>
              <HiOutlinePlus size={16} /> Add {exam.type === 'mcq' ? 'MCQ Question' : 'Coding Problem'}
            </button>
            <button className="btn" onClick={() => { setShowAI(true); setAiPreview([]); }}
              style={{background: 'linear-gradient(135deg,#7b2ff7,#00d2ff)', color: '#fff', border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.375rem'}}>
              <HiOutlineLightningBolt size={16} /> Generate with AI
            </button>
          </div>

          {/* Questions */}
          <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
            {questions.map((q, i) => (
              <div key={q.id} className="glass" style={{borderRadius: '14px', overflow: 'hidden'}}>
                <div style={{height: '3px', background: exam.type === 'mcq' ? 'linear-gradient(90deg, #00d2ff, transparent)' : 'linear-gradient(90deg, #7b2ff7, transparent)'}} />
                <div style={{padding: '1.25rem'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem'}}>
                    <div>
                      <span style={{fontSize: '0.625rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em'}}>Question {i + 1}</span>
                      <h3 style={{fontSize: '0.9375rem', fontWeight: 700, marginTop: '0.25rem'}}>{q.question_text || q.title}</h3>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteQ(q.id, exam.type)} style={{color: '#ff5252'}}>
                      <HiOutlineTrash size={14} />
                    </button>
                  </div>
                  {exam.type === 'mcq' && (
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem'}}>
                      {['a','b','c','d'].map(opt => (
                        <div key={opt} style={{padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.8125rem',
                          background: q.correct_option === opt ? 'rgba(0,230,118,0.08)' : 'rgba(255,255,255,0.02)',
                          border: q.correct_option === opt ? '1px solid rgba(0,230,118,0.2)' : '1px solid rgba(255,255,255,0.04)',
                          color: q.correct_option === opt ? '#00e676' : '#94a3b8'}}>
                          <span style={{fontWeight: 700, marginRight: '0.5rem'}}>{opt.toUpperCase()}</span>{q[`option_${opt}`]}
                        </div>
                      ))}
                    </div>
                  )}
                  {exam.type === 'coding' && (
                    <div>
                      <p style={{fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '0.75rem'}}>{q.problem_statement?.substring(0, 150)}...</p>
                      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                        <span style={{fontSize: '0.75rem', color: '#64748b'}}>{q.test_cases?.length || 0} test cases</span>
                        <button className="btn btn-outline btn-sm" onClick={() => { setTcTarget(q.id); setShowModal('testcase'); }}>
                          <HiOutlinePlus size={14} /> Add Test Case
                        </button>
                      </div>
                      {q.test_cases?.map(tc => (
                        <div key={tc.id} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', marginTop: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)'}}>
                          <div style={{fontSize: '0.75rem', fontFamily: 'monospace'}}>
                            <span style={{color: '#64748b'}}>In:</span> <span style={{color: '#00d2ff'}}>{tc.input_data?.substring(0,30)}</span>
                            <span style={{margin: '0 0.5rem', color: '#333'}}>→</span>
                            <span style={{color: '#64748b'}}>Out:</span> <span style={{color: '#00e676'}}>{tc.expected_output?.substring(0,30)}</span>
                          </div>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteTC(tc.id)} style={{color: '#ff5252'}}><HiOutlineTrash size={12}/></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          {questions.length === 0 && <div className="glass" style={{padding: '2rem', textAlign: 'center', color: '#64748b', borderRadius: '14px'}}>No questions added yet.</div>}
          </div>
        </div>
      ) : tab === 'answerkey' ? (
        <div className="fade-in">
          <div style={{display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem'}}>
            <HiOutlineKey size={18} color="#ffd740" />
            <h3 style={{fontSize: '1rem', fontWeight: 700}}>Answer Key</h3>
            <span style={{fontSize: '0.75rem', color: '#64748b'}}>({questions.length} questions)</span>
          </div>

          {exam.type === 'mcq' ? (
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
              {questions.map((q, i) => (
                <div key={q.id} className="glass" style={{borderRadius: '12px', padding: '1rem 1.25rem'}}>
                  <div style={{fontSize: '0.8125rem', fontWeight: 600, color: '#e8eaf6', marginBottom: '0.75rem'}}>
                    <span style={{fontSize: '0.625rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: '0.5rem'}}>Q{i + 1}</span>
                    {q.question_text}
                  </div>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem'}}>
                    {['a', 'b', 'c', 'd'].map(opt => {
                      const isCorrect = q.correct_option?.toLowerCase() === opt;
                      return (
                        <div key={opt} style={{
                          padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.8125rem',
                          background: isCorrect ? 'rgba(0,230,118,0.08)' : 'rgba(255,255,255,0.02)',
                          border: isCorrect ? '1px solid rgba(0,230,118,0.25)' : '1px solid rgba(255,255,255,0.04)',
                          color: isCorrect ? '#00e676' : '#94a3b8',
                          display: 'flex', alignItems: 'center', gap: '0.375rem',
                        }}>
                          <span style={{fontWeight: 700}}>{opt.toUpperCase()}.</span>
                          <span style={{flex: 1}}>{q[`option_${opt}`]}</span>
                          {isCorrect && <span style={{fontSize: '0.625rem', fontWeight: 800}}>✓ CORRECT</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
              {questions.map((q, i) => (
                <div key={q.id} className="glass" style={{borderRadius: '12px', padding: '1rem 1.25rem'}}>
                  <div style={{marginBottom: '0.75rem'}}>
                    <span style={{fontSize: '0.625rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em'}}>Problem {i + 1}</span>
                    <h4 style={{fontSize: '0.9375rem', fontWeight: 700, color: '#e8eaf6', margin: '0.125rem 0 0'}}>{q.title}</h4>
                  </div>
                  <div style={{fontSize: '0.8125rem', color: '#94a3b8', lineHeight: 1.7, marginBottom: '0.75rem'}}>{q.problem_statement}</div>
                  {q.test_cases && q.test_cases.length > 0 && (
                    <div>
                      <div style={{fontSize: '0.6875rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem'}}>Test Cases ({q.test_cases.length})</div>
                      {q.test_cases.map((tc, j) => (
                        <div key={tc.id} style={{display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '8px', marginBottom: '0.375rem',
                          background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)'}}>
                          <div>
                            <div style={{fontSize: '0.5625rem', color: '#475569', textTransform: 'uppercase', fontWeight: 700}}>Input</div>
                            <pre style={{fontSize: '0.75rem', color: '#00d2ff', margin: 0, fontFamily: 'monospace'}}>{tc.input_data}</pre>
                          </div>
                          <div>
                            <div style={{fontSize: '0.5625rem', color: '#475569', textTransform: 'uppercase', fontWeight: 700}}>Expected Output</div>
                            <pre style={{fontSize: '0.75rem', color: '#00e676', margin: 0, fontFamily: 'monospace'}}>{tc.expected_output}</pre>
                          </div>
                          <span className={`badge ${tc.is_hidden ? 'badge-yellow' : 'badge-cyan'}`} style={{fontSize: '0.5625rem', alignSelf: 'center'}}>
                            {tc.is_hidden ? 'HIDDEN' : 'SAMPLE'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {questions.length === 0 && <div className="glass" style={{padding: '2rem', textAlign: 'center', color: '#64748b', borderRadius: '14px'}}>No questions added yet.</div>}
        </div>
      ) : (
        <div className="fade-in">
          <div className="glass" style={{borderRadius: '14px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                <h3 style={{fontSize: '1rem', fontWeight: 700}}>Assign Students</h3>
                <p style={{fontSize: '0.8125rem', color: '#64748b', marginTop: '0.25rem'}}>Select students who are allowed to take this private exam.</p>
              </div>
              <button className="btn btn-primary" onClick={handleSaveAssignments} disabled={savingAssignments}>
                 {savingAssignments ? <span className="spinner" /> : <><HiOutlineCheck size={16} /> Save Assignments</>}
              </button>
            </div>
            
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.75rem'}}>
              {students.map(s => {
                const isSelected = selectedStudents.has(s.id);
                return (
                  <button key={s.id} onClick={() => handleToggleStudent(s.id)} type="button"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                      borderRadius: '10px', border: isSelected ? '1px solid #00d2ff' : '1px solid rgba(255,255,255,0.06)',
                      background: isSelected ? 'rgba(0,210,255,0.1)' : 'rgba(255,255,255,0.02)',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', width: '100%'
                    }}>
                    <div style={{width: '32px', height: '32px', borderRadius: '50%', background: isSelected ? '#00d2ff' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
                      {isSelected ? <HiOutlineCheck size={16} color="#fff" /> : <HiOutlineUsers size={16} color="#94a3b8" />}
                    </div>
                    <div style={{overflow: 'hidden'}}>
                      <div style={{fontSize: '0.875rem', fontWeight: 600, color: isSelected ? '#fff' : '#e8eaf6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{s.name}</div>
                      <div style={{fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{s.email}</div>
                    </div>
                  </button>
                );
              })}
              {students.length === 0 && <div style={{color: '#64748b', fontSize: '0.8125rem'}}>No students found.</div>}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{maxWidth: showModal === 'mcq' ? '560px' : '500px'}}>
            <div className="modal-header">
              <h3 style={{fontSize: '1rem', fontWeight: 700}}>{showModal === 'mcq' ? 'Add MCQ Question' : showModal === 'coding' ? 'Add Coding Problem' : 'Add Test Case'}</h3>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowModal(null)}><HiOutlineX size={18}/></button>
            </div>
            {showModal === 'mcq' && (
              <form onSubmit={handleAddMCQ}>
                <div className="modal-body" style={{display: 'flex', flexDirection: 'column', gap: '0.875rem'}}>
                  <div><label className="label">Question</label><textarea className="input" required rows={2} value={mcqForm.question_text} onChange={e => setMcqForm({...mcqForm, question_text: e.target.value})}/></div>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem'}}>
                    {['a','b','c','d'].map(o => <div key={o}><label className="label">Option {o.toUpperCase()}</label><input className="input" required value={mcqForm[`option_${o}`]} onChange={e => setMcqForm({...mcqForm, [`option_${o}`]: e.target.value})}/></div>)}
                  </div>
                  <div><label className="label">Correct Answer</label><select className="input" value={mcqForm.correct_option} onChange={e => setMcqForm({...mcqForm, correct_option: e.target.value})}><option value="a">A</option><option value="b">B</option><option value="c">C</option><option value="d">D</option></select></div>
                </div>
                <div className="modal-footer"><button type="button" className="btn btn-ghost" onClick={() => setShowModal(null)}>Cancel</button><button type="submit" className="btn btn-primary">Add</button></div>
              </form>
            )}
            {showModal === 'coding' && (
              <form onSubmit={handleAddCoding}>
                <div className="modal-body" style={{display: 'flex', flexDirection: 'column', gap: '0.875rem'}}>
                  <div><label className="label">Title</label><input className="input" required value={codingForm.title} onChange={e => setCodingForm({...codingForm, title: e.target.value})}/></div>
                  <div><label className="label">Problem Statement</label><textarea className="input" required rows={4} value={codingForm.problem_statement} onChange={e => setCodingForm({...codingForm, problem_statement: e.target.value})}/></div>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem'}}>
                    <div><label className="label">Input Format</label><input className="input" value={codingForm.input_format} onChange={e => setCodingForm({...codingForm, input_format: e.target.value})}/></div>
                    <div><label className="label">Output Format</label><input className="input" value={codingForm.output_format} onChange={e => setCodingForm({...codingForm, output_format: e.target.value})}/></div>
                  </div>
                  <div><label className="label">Constraints</label><input className="input" value={codingForm.constraints} onChange={e => setCodingForm({...codingForm, constraints: e.target.value})}/></div>
                </div>
                <div className="modal-footer"><button type="button" className="btn btn-ghost" onClick={() => setShowModal(null)}>Cancel</button><button type="submit" className="btn btn-primary">Add</button></div>
              </form>
            )}
            {showModal === 'testcase' && (
              <form onSubmit={handleAddTC}>
                <div className="modal-body" style={{display: 'flex', flexDirection: 'column', gap: '0.875rem'}}>
                  <div><label className="label">Input Data</label><textarea className="input mono" rows={3} required value={tcForm.input_data} onChange={e => setTcForm({...tcForm, input_data: e.target.value})}/></div>
                  <div><label className="label">Expected Output</label><textarea className="input mono" rows={3} required value={tcForm.expected_output} onChange={e => setTcForm({...tcForm, expected_output: e.target.value})}/></div>
                </div>
                <div className="modal-footer"><button type="button" className="btn btn-ghost" onClick={() => setShowModal(null)}>Cancel</button><button type="submit" className="btn btn-primary">Add</button></div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* AI Generate Modal */}
      {showAI && (
        <div className="modal-overlay" onClick={() => setShowAI(false)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{maxWidth: '640px', maxHeight: '85vh', overflowY: 'auto'}}>
            <div className="modal-header">
              <div style={{display:'flex',alignItems:'center',gap:'0.625rem'}}>
                <div style={{width:'34px',height:'34px',borderRadius:'10px',background:'linear-gradient(135deg,#7b2ff7,#00d2ff)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <HiOutlineLightningBolt size={16} color="#fff" />
                </div>
                <div>
                  <h3 style={{fontSize:'1rem',fontWeight:700,margin:0}}>Generate with AI</h3>
                  <p style={{fontSize:'0.6875rem',color:'#64748b',margin:0}}>Powered by Google Gemini</p>
                </div>
              </div>
              <button className="btn btn-icon btn-ghost" onClick={() => setShowAI(false)}><HiOutlineX size={18}/></button>
            </div>

            <div className="modal-body" style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
              {/* Form */}
              <div>
                <label className="label">Topic / Description</label>
                <input className="input" placeholder={exam?.type==='mcq' ? 'e.g. Data Structures - Arrays & Linked Lists' : 'e.g. String manipulation in Python'} value={aiForm.topic} onChange={e => setAiForm({...aiForm, topic: e.target.value})} />
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0.75rem'}}>
                <div>
                  <label className="label">Difficulty</label>
                  <select className="input" value={aiForm.difficulty} onChange={e => setAiForm({...aiForm, difficulty: e.target.value})}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="label">Number of Questions</label>
                  <input className="input" type="number" min={1} max={15} value={aiForm.count} onChange={e => setAiForm({...aiForm, count: parseInt(e.target.value)||5})} />
                </div>
              </div>
              <button className="btn btn-primary" onClick={handleAIGenerate} disabled={aiLoading} style={{background:'linear-gradient(135deg,#7b2ff7,#00d2ff)',border:'none'}}>
                {aiLoading ? <><span className="spinner" style={{width:'16px',height:'16px'}}/> Generating...</> : <><HiOutlineLightningBolt size={16}/> Generate Questions</>}
              </button>

              {/* Preview */}
              {aiPreview.length > 0 && (
                <div style={{borderTop:'1px solid rgba(255,255,255,0.06)',paddingTop:'1rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
                    <span style={{fontSize:'0.8125rem',fontWeight:700,color:'#e8eaf6'}}>{aiPreview.length} questions generated</span>
                    <span style={{fontSize:'0.75rem',color:'#64748b'}}>{aiSelected.size} selected</span>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:'0.625rem',maxHeight:'350px',overflowY:'auto'}}>
                    {aiPreview.map((q, i) => {
                      const sel = aiSelected.has(i);
                      return (
                        <div key={i} onClick={() => { const n=new Set(aiSelected); sel?n.delete(i):n.add(i); setAiSelected(n); }}
                          style={{padding:'0.875rem 1rem',borderRadius:'10px',cursor:'pointer',transition:'all 0.15s',
                            border: sel ? '1px solid rgba(0,230,118,0.3)' : '1px solid rgba(255,255,255,0.06)',
                            background: sel ? 'rgba(0,230,118,0.04)' : 'rgba(255,255,255,0.02)'}}>
                          <div style={{display:'flex',alignItems:'flex-start',gap:'0.625rem'}}>
                            <div style={{width:'22px',height:'22px',borderRadius:'6px',flexShrink:0,marginTop:'1px',
                              background: sel ? '#00e676' : 'rgba(255,255,255,0.06)',
                              display:'flex',alignItems:'center',justifyContent:'center'}}>
                              {sel && <HiOutlineCheckCircle size={14} color="#0f0f1a"/>}
                            </div>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{fontSize:'0.8125rem',fontWeight:600,color:'#e8eaf6'}}>{q.question_text||q.title}</div>
                              {exam?.type==='mcq' && q.correct_option && (
                                <div style={{fontSize:'0.6875rem',color:'#00e676',marginTop:'0.25rem'}}>Answer: {q.correct_option.toUpperCase()}</div>
                              )}
                              {exam?.type==='coding' && q.test_cases && (
                                <div style={{fontSize:'0.6875rem',color:'#64748b',marginTop:'0.25rem'}}>{q.test_cases.length} test cases</div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {aiPreview.length > 0 && (
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setShowAI(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAISave} disabled={aiSaving || aiSelected.size===0}>
                  {aiSaving ? <><span className="spinner" style={{width:'14px',height:'14px'}}/> Saving...</> : <><HiOutlineCheck size={16}/> Add {aiSelected.size} Selected</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
