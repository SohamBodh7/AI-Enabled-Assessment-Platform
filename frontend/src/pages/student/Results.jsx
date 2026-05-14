import { useState, useEffect } from 'react';
import { getStudentResults, getAnswerKey } from '../../services/api';
import toast from 'react-hot-toast';
import { HiOutlineChartBar, HiOutlineEye, HiOutlineX, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi';

export default function StudentResults() {
  const [mcqResults, setMcqResults] = useState([]);
  const [codingResults, setCodingResults] = useState([]);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    getStudentResults().then(r => {
      setMcqResults(r.data.mcq_results || []);
      setCodingResults(r.data.coding_results || []);
    }).catch(() => {});
  }, []);

  const openAnswerKey = async (examId) => {
    setDetailLoading(true);
    try {
      const r = await getAnswerKey(examId);
      setDetail(r.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load answer key');
    } finally { setDetailLoading(false); }
  };

  // Group coding results by exam
  const codingByExam = {};
  codingResults.forEach(r => {
    const key = r.exam_id;
    if (!codingByExam[key]) codingByExam[key] = { exam_title: r.exam_title || r.question_title, exam_id: r.exam_id, submissions: [], totalScore: 0, totalCases: 0, passedCases: 0 };
    codingByExam[key].submissions.push(r);
    codingByExam[key].totalCases += (r.total_cases || 0);
    codingByExam[key].passedCases += (r.passed_cases || 0);
  });

  const allResults = [
    ...mcqResults.map(r => ({ ...r, type: 'mcq' })),
    ...Object.values(codingByExam).map(g => ({
      exam_id: g.exam_id, exam_title: g.exam_title, type: 'coding',
      score: g.passedCases, total: g.totalCases,
      status: g.passedCases === g.totalCases ? 'passed' : 'partial',
      submitted_at: g.submissions[0]?.submitted_at
    })),
  ];

  return (
    <div className="fade-in" style={{maxWidth: '1100px'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem'}}>
        <div style={{width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0,230,118,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <HiOutlineChartBar size={20} color="#00e676" />
        </div>
        <div>
          <h1 style={{fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em'}}>My Results</h1>
          <p style={{color: '#64748b', fontSize: '0.8125rem', marginTop: '0.125rem'}}>{allResults.length} exams completed</p>
        </div>
      </div>

      <div className="glass" style={{borderRadius: '14px'}}>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Exam</th><th>Type</th><th>Score</th><th>Status</th><th>Submitted</th><th>Answer Key</th></tr></thead>
            <tbody>
              {allResults.length === 0 ? (
                <tr><td colSpan={6} style={{textAlign: 'center', padding: '2.5rem', color: '#475569'}}>No submissions yet. Take an exam first!</td></tr>
              ) : allResults.map((r, i) => (
                <tr key={i}>
                  <td style={{fontWeight: 600, color: '#e8eaf6'}}>{r.exam_title || '—'}</td>
                  <td><span className={`badge ${r.type === 'mcq' ? 'badge-cyan' : 'badge-purple'}`}>{r.type?.toUpperCase()}</span></td>
                  <td><span className="mono" style={{fontSize: '0.9375rem', fontWeight: 700, color: '#00d2ff'}}>{r.score}</span>{r.total && <span style={{color: '#64748b', fontSize: '0.75rem'}}>/{r.total}</span>}</td>
                  <td><span className={`badge ${r.status === 'passed' ? 'badge-green' : r.status === 'partial' ? 'badge-yellow' : 'badge-blue'}`}>{r.status?.toUpperCase() || 'SUBMITTED'}</span></td>
                  <td style={{fontSize: '0.75rem', color: '#64748b'}}>{r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '—'}</td>
                  <td>
                    <button className="btn btn-sm" onClick={() => openAnswerKey(r.exam_id)}
                      style={{background: 'rgba(0,210,255,0.1)', border: '1px solid rgba(0,210,255,0.2)', color: '#00d2ff', padding: '0.375rem 0.625rem', fontSize: '0.6875rem', fontWeight: 700}}>
                      <HiOutlineEye size={13} style={{marginRight: '0.25rem'}} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Answer Key Modal */}
      {(detail || detailLoading) && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{maxWidth: '700px', maxHeight: '85vh', overflowY: 'auto'}}>
            {detailLoading ? (
              <div style={{padding: '3rem', display: 'flex', justifyContent: 'center'}}><span className="spinner" /></div>
            ) : detail && (
              <>
                <div className="modal-header">
                  <div>
                    <h3 style={{fontSize: '1rem', fontWeight: 700, margin: 0}}>Answer Key — {detail.exam?.title}</h3>
                    {detail.type === 'mcq' && (
                      <p style={{fontSize: '0.75rem', color: '#64748b', margin: '0.25rem 0 0'}}>
                        Score: <span style={{color: '#00d2ff', fontWeight: 700}}>{detail.score}/{detail.total}</span>
                        {' '}({detail.total > 0 ? Math.round((detail.score / detail.total) * 100) : 0}%)
                      </p>
                    )}
                  </div>
                  <button className="btn btn-icon btn-ghost" onClick={() => setDetail(null)}><HiOutlineX size={18} /></button>
                </div>

                <div className="modal-body" style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                  {detail.type === 'mcq' && detail.answer_key?.map((q, i) => (
                    <div key={q.id} style={{padding: '1rem', borderRadius: '10px', border: q.is_correct ? '1px solid rgba(0,230,118,0.2)' : '1px solid rgba(255,82,82,0.2)', background: q.is_correct ? 'rgba(0,230,118,0.03)' : 'rgba(255,82,82,0.03)'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem'}}>
                        {q.is_correct ? <HiOutlineCheckCircle size={16} color="#00e676" /> : <HiOutlineXCircle size={16} color="#ff5252" />}
                        <span style={{fontSize: '0.625rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em'}}>Q{i + 1}</span>
                      </div>
                      <div style={{fontSize: '0.875rem', fontWeight: 600, color: '#e8eaf6', marginBottom: '0.75rem'}}>{q.question_text}</div>
                      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem'}}>
                        {['a', 'b', 'c', 'd'].map(opt => {
                          const isCorrect = q.correct_option?.toLowerCase() === opt;
                          const isStudent = q.student_answer?.toLowerCase() === opt;
                          const isWrong = isStudent && !isCorrect;
                          return (
                            <div key={opt} style={{
                              padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.8125rem',
                              background: isCorrect ? 'rgba(0,230,118,0.08)' : isWrong ? 'rgba(255,82,82,0.08)' : 'rgba(255,255,255,0.02)',
                              border: isCorrect ? '1px solid rgba(0,230,118,0.25)' : isWrong ? '1px solid rgba(255,82,82,0.25)' : '1px solid rgba(255,255,255,0.04)',
                              color: isCorrect ? '#00e676' : isWrong ? '#ff5252' : '#94a3b8',
                            }}>
                              <span style={{fontWeight: 700, marginRight: '0.5rem'}}>{opt.toUpperCase()}</span>
                              {q[`option_${opt}`]}
                              {isCorrect && <span style={{float: 'right', fontSize: '0.625rem', fontWeight: 800}}>✓ CORRECT</span>}
                              {isWrong && <span style={{float: 'right', fontSize: '0.625rem', fontWeight: 800}}>✗ YOUR ANSWER</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {detail.type === 'coding' && detail.answer_key?.map((q, i) => (
                    <div key={q.id} style={{padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem'}}>
                        <div>
                          <span style={{fontSize: '0.625rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em'}}>Problem {i + 1}</span>
                          <h4 style={{fontSize: '0.875rem', fontWeight: 700, color: '#e8eaf6', margin: '0.125rem 0 0'}}>{q.title}</h4>
                        </div>
                        <span className={`badge ${q.status === 'passed' ? 'badge-green' : 'badge-yellow'}`}>
                          {q.passed_cases}/{q.total_cases} passed
                        </span>
                      </div>
                      {q.submitted_code ? (
                        <pre style={{background: 'rgba(0,0,0,0.3)', padding: '0.875rem 1rem', borderRadius: '8px', fontSize: '0.75rem', color: '#00d2ff', fontFamily: "'Fira Code', monospace", margin: 0, overflowX: 'auto', maxHeight: '200px', overflowY: 'auto'}}>
                          {q.submitted_code}
                        </pre>
                      ) : (
                        <div style={{padding: '1rem', textAlign: 'center', color: '#475569', fontSize: '0.8125rem'}}>No code submitted</div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
