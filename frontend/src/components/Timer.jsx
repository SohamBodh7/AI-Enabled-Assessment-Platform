import { useState, useEffect, useRef } from 'react';
import { HiOutlineClock } from 'react-icons/hi';

export default function Timer({ duration, onTimeUp }) {
  const [secs, setSecs] = useState(duration);
  const called = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setSecs(s => s > 0 ? s - 1 : 0), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (secs === 0 && !called.current) { called.current = true; onTimeUp?.(); }
  }, [secs, onTimeUp]);

  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  const isLow = secs < 60;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.375rem',
      padding: '0.375rem 0.75rem', borderRadius: '8px',
      background: isLow ? 'rgba(255,82,82,0.1)' : 'rgba(0,210,255,0.08)',
      border: `1px solid ${isLow ? 'rgba(255,82,82,0.2)' : 'rgba(0,210,255,0.15)'}`,
    }}>
      <HiOutlineClock size={14} color={isLow ? '#ff5252' : '#00d2ff'} />
      <span className="mono" style={{
        fontSize: '0.875rem', fontWeight: 700, letterSpacing: '0.05em',
        color: isLow ? '#ff5252' : '#00d2ff',
        animation: isLow ? 'pulse 1s ease-in-out infinite' : 'none',
      }}>
        {m}:{s}
      </span>
    </div>
  );
}
