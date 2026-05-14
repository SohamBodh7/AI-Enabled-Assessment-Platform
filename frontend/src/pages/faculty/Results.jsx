import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getFacultyExams, getExamResults, getExamDetails } from '../../services/api';
import { HiOutlineChartBar, HiOutlineX, HiOutlineCheck, HiOutlineCode, HiOutlineClipboardList } from 'react-icons/hi';

export default function FacultyResults() {
  const [searchParams] = useSearchParams();
  const [exams, setExams]               = useState([]);
  const [selectedExam, setSelectedExam] = useState(searchParams.get('exam') || '');
  const [results, setResults]           = useState([]);
  const [examData, setExamData]         = useState(null);   // exam + questions
  const [detail, setDetail]             = useState(null);   // selected submission for modal

  useEffect(() => {
    getFacultyExams().then(r => setExams(r.data.exams || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedExam) { setResults([]); setExamData(null); return; }
    getExamResults(selectedExam).then(r => setResults(r.data.results || [])).catch(() => setResults([]));
    getExamDetails(selectedExam).then(r => setExamData(r.data.exam)).catch(() => {});
  }, [selectedExam]);

  const isMCQ = examData?.type === 'mcq';

  // ── Score colour helper ────────────────────────────────────────────────────
  const scoreColor = (score, total) => {
    if (!total) return '#00d2ff';
    const pct = (score / total) * 100;
    if (pct >= 75) return '#00e676';
    if (pct >= 40) return '#ffd740';
    return '#ff5252';
  };

  // ── MCQ detail: build per-question breakdown ───────────────────────────────
  const buildMCQBreakdown = (submission) => {
    if (!examData?.questions) return [];
    const answers = submission.answers || {};
    return examData.questions.map(q => {
      const studentAns = answers[String(q.id)]?.toUpperCase() || answers[q.id]?.toUpperCase() || '—';
      const correct    = q.correct_option?.toUpperCase();
      return { ...q, studentAns, correct, isCorrect: studentAns === correct };
    });
  };

  return (
    <div className="fade-in" style={{ maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0,230,118,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HiOutlineChartBar size={20} color="#00e676" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Results</h1>
            <p style={{ color: '#64748b', fontSize: '0.8125rem', marginTop: '0.125rem' }}>
              {selectedExam && results.length > 0 ? `${results.length} submission${results.length > 1 ? 's' : ''} — click a row to see details` : 'Student performance'}
            </p>
          </div>
        </div>
        <select className="input" style={{ width: '260px' }} value={selectedExam} onChange={e => setSelectedExam(e.target.value)}>
          <option value="">Select an exam</option>
          {exams.map(e => <option key={e.id} value={e.id}>{e.title} ({e.type})</option>)}
        </select>
      </div>

      {/* Results Table */}
      <div className="glass" style={{ borderRadius: '14px' }}>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Score</th>
                {!isMCQ && <th>Test Cases</th>}
                <th>Status</th>
                <th>Submitted</th>
                <th style={{ textAlign: 'right' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {!selectedExam ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#475569' }}>Select an exam to view results</td></tr>
              ) : results.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#475569' }}>No submissions yet</td></tr>
              ) : results.map((r, i) => (
                <tr key={i} onClick={() => setDetail(r)} style={{ cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,210,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ fontWeight: 600, color: '#e8eaf6' }}>{r.student_name}</td>
                  <td>
                    <span className="mono" style={{ fontWeight: 700, color: scoreColor(r.score, r.total) }}>{r.score}</span>
                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}>/{r.total || '—'}</span>
                  </td>
                  {!isMCQ && (
                    <td style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                      {r.passed_cases ?? '—'}/{r.total_cases ?? '—'} passed
                    </td>
                  )}
                  <td>
                    <span className={`badge ${r.status === 'passed' ? 'badge-green' : r.status === 'partial' ? 'badge-yellow' : r.status === 'failed' ? 'badge-red' : 'badge-blue'}`}>
                      {r.status?.toUpperCase() || 'SUBMITTED'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-outline btn-sm" onClick={e => { e.stopPropagation(); setDetail(r); }}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {detail && (
        <div className="modal-overlay" onClick={() => setDetail(null)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()}
            style={{ maxWidth: '680px', maxHeight: '85vh', overflowY: 'auto' }}>

            {/* Modal Header */}
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px',
                  background: isMCQ ? 'rgba(0,210,255,0.1)' : 'rgba(123,47,247,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isMCQ ? <HiOutlineClipboardList size={18} color="#00d2ff" /> : <HiOutlineCode size={18} color="#7b2ff7" />}
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{detail.student_name}</h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                    {examData?.title} · {detail.submitted_at ? new Date(detail.submitted_at).toLocaleString() : ''}
                  </p>
                </div>
              </div>
              <button className="btn btn-icon btn-ghost" onClick={() => setDetail(null)}><HiOutlineX size={18} /></button>
            </div>

            {/* Score Summary Bar */}
            <div style={{ display: 'flex', gap: '1.5rem', padding: '1rem 1.5rem',
              borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: scoreColor(detail.score, detail.total) }}>
                  {detail.score}<span style={{ fontSize: '0.875rem', color: '#475569' }}>/{detail.total || '—'}</span>
                </div>
                <div style={{ fontSize: '0.625rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Score</div>
              </div>
              {!isMCQ && (
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#00d2ff' }}>
                    {detail.passed_cases ?? '—'}<span style={{ fontSize: '0.875rem', color: '#475569' }}>/{detail.total_cases ?? '—'}</span>
                  </div>
                  <div style={{ fontSize: '0.625rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Test Cases</div>
                </div>
              )}
              <div>
                <span className={`badge ${detail.status === 'passed' ? 'badge-green' : detail.status === 'partial' ? 'badge-yellow' : detail.status === 'failed' ? 'badge-red' : 'badge-blue'}`}
                  style={{ fontSize: '0.8125rem', padding: '4px 10px' }}>
                  {detail.status?.toUpperCase() || 'SUBMITTED'}
                </span>
                <div style={{ fontSize: '0.625rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '4px' }}>Status</div>
              </div>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

              {/* ── MCQ: per-question answer breakdown ── */}
              {isMCQ && (
                <>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                    Student's selected answers vs correct answers:
                  </p>
                  {buildMCQBreakdown(detail).map((q, idx) => (
                    <div key={q.id} style={{ borderRadius: '10px', overflow: 'hidden',
                      border: `1px solid ${q.isCorrect ? 'rgba(0,230,118,0.2)' : 'rgba(255,82,82,0.2)'}`,
                      background: q.isCorrect ? 'rgba(0,230,118,0.04)' : 'rgba(255,82,82,0.04)' }}>
                      <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.04)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#e8eaf6', flex: 1 }}>
                          <span style={{ fontSize: '0.625rem', color: '#475569', marginRight: '0.5rem' }}>Q{idx + 1}</span>
                          {q.question_text}
                        </div>
                        {q.isCorrect
                          ? <HiOutlineCheck size={16} color="#00e676" style={{ flexShrink: 0 }} />
                          : <HiOutlineX size={16} color="#ff5252" style={{ flexShrink: 0 }} />}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', padding: '0.75rem 1rem' }}>
                        {['A','B','C','D'].map(opt => {
                          const isStudent = q.studentAns === opt;
                          const isCorrect = q.correct === opt;
                          return (
                            <div key={opt} style={{ padding: '0.375rem 0.625rem', borderRadius: '7px', fontSize: '0.75rem',
                              background: isCorrect ? 'rgba(0,230,118,0.1)' : isStudent && !isCorrect ? 'rgba(255,82,82,0.1)' : 'rgba(255,255,255,0.02)',
                              border: isCorrect ? '1px solid rgba(0,230,118,0.3)' : isStudent && !isCorrect ? '1px solid rgba(255,82,82,0.3)' : '1px solid rgba(255,255,255,0.04)',
                              color: isCorrect ? '#00e676' : isStudent && !isCorrect ? '#ff5252' : '#64748b',
                              display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                              <span style={{ fontWeight: 700 }}>{opt}.</span>
                              <span>{q[`option_${opt.toLowerCase()}`]}</span>
                              {isStudent && <span style={{ marginLeft: 'auto', fontSize: '0.625rem', fontWeight: 700 }}>{isCorrect ? '✓' : '✗'}</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* ── Coding: submitted code ── */}
              {!isMCQ && detail.code_text && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Submitted code:</p>
                    <span style={{ fontSize: '0.6875rem', padding: '2px 8px', borderRadius: '6px',
                      background: 'rgba(123,47,247,0.1)', color: '#7b2ff7', fontWeight: 600 }}>
                      Python
                    </span>
                  </div>
                  <pre style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '1rem',
                    fontSize: '0.8125rem', fontFamily: 'monospace', color: '#e8eaf6',
                    overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    border: '1px solid rgba(255,255,255,0.06)', margin: 0, lineHeight: 1.7 }}>
                    {detail.code_text}
                  </pre>
                </>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
