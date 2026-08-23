import React, { useState, useEffect } from 'react';

const G = "'Geist', system-ui, sans-serif";
const M = "'JetBrains Mono', monospace";

const RADIUS = 44;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function TimerDisplay({
  mode,
  timeLeft,
  totalTime,
  isRunning,
  cycleCount = 0,
  taskTitle = '',
}) {
  const [clockTime, setClockTime] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setClockTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const progress = mode === 'stopwatch' ? 1 : Math.max(0, Math.min(1, timeLeft / (totalTime || 1)));
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  const currentSessionNumber = (cycleCount % 4) + 1;

  const getModeLabel = () => {
    if (mode === 'shortBreak') return 'SHORT BREAK';
    if (mode === 'longBreak') return 'LONG BREAK';
    if (mode === 'stopwatch') return 'STOPWATCH';
    return 'FOCUS';
  };

  const getSubLabel = () => {
    if (mode === 'shortBreak') return 'Next: 25 min focus';
    if (mode === 'longBreak') return 'Next: 25 min focus';
    return currentSessionNumber === 4 ? 'Next: 15 min break' : 'Next: 5 min break';
  };

  const accentColor = mode === 'shortBreak' ? '#6FE6FC' : mode === 'longBreak' ? '#A8F1FF' : '#4ED7F1';

  return (
    <div className="flex flex-col items-center select-none" style={{ fontFamily: G }}>

      {/* Circular progress ring + countdown */}
      <div className="relative flex items-center justify-center" style={{ width: 260, height: 260 }}>
        <svg
          viewBox="0 0 100 100"
          width={260}
          height={260}
          className="absolute inset-0"
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Track */}
          <circle
            cx="50" cy="50" r={RADIUS}
            fill="transparent"
            stroke="var(--surface-low)"
            strokeWidth="3"
          />
          {/* Progress */}
          <circle
            cx="50" cy="50" r={RADIUS}
            fill="transparent"
            stroke={accentColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="progress-ring__circle"
          />
        </svg>

        {/* Text inside ring */}
        <div className="relative z-10 flex flex-col items-center gap-1">
          {/* Countdown */}
          <div
            style={{
              fontFamily: G,
              fontSize: 64,
              fontWeight: 500,
              color: 'var(--text-primary)',
              letterSpacing: '-3px',
              lineHeight: 1,
              opacity: isRunning ? 1 : 0.55,
              transition: 'opacity 0.4s ease',
              fontFeatureSettings: "'tnum'",
            }}
          >
            {formatTime(timeLeft)}
          </div>
          {/* Session label */}
          <span style={{ fontFamily: M, fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
            SESSION {currentSessionNumber}/4
          </span>
          {/* Task title */}
          {taskTitle && (
            <span style={{ fontFamily: G, fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
              {taskTitle}
            </span>
          )}
        </div>
      </div>

      {/* Status row */}
      <div className="flex items-center gap-2 mt-2">
        <span
          style={{
            display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
            background: isRunning ? accentColor : 'var(--surface-mid)',
            transition: 'background 0.3s ease',
          }}
          className={isRunning ? 'animate-pulse-subtle' : ''}
        />
        <span style={{ fontFamily: M, fontSize: 10, color: isRunning ? 'var(--text-secondary)' : 'var(--text-muted)', letterSpacing: '0.06em' }}>
          {isRunning ? 'Active' : 'Paused'} · {clockTime}
        </span>
      </div>

      {/* Session pips */}
      <div className="flex items-center gap-2 mt-4">
        {[1, 2, 3, 4].map((n) => {
          const isCurrent = n === currentSessionNumber;
          const isCompleted = n < currentSessionNumber;
          return (
            <div
              key={n}
              style={{
                width: isCurrent ? 20 : 5,
                height: 5,
                borderRadius: 3,
                background: (isCompleted || isCurrent) ? accentColor : 'var(--surface-mid)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          );
        })}
      </div>

      {/* Sub label */}
      <p style={{ fontFamily: M, fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.04em', marginTop: 6 }}>
        {getSubLabel()}
      </p>
    </div>
  );
}
