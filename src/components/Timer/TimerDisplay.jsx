import React, { useState, useEffect } from 'react';

const G = "'Poppins', sans-serif";
const M = "'Poppins', sans-serif";

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function AnimatedDigit({ digit }) {
  const [current, setCurrent] = useState(digit);
  const [previous, setPrevious] = useState(null);

  useEffect(() => {
    if (digit !== current) {
      setPrevious(current);
      setCurrent(digit);
    }
  }, [digit, current]);

  if (digit === ':') {
    return <span className="inline-block" style={{ width: '0.22em', textAlign: 'center', margin: '0 -2px' }}>:</span>;
  }

  return (
    <div className="relative inline-block" style={{ width: '1ch', height: '1.1em', verticalAlign: 'bottom', margin: '0 -2px' }}>
      {previous !== null && (
        <span 
          key={`prev-${previous}`} 
          className="absolute inset-0 flex items-center justify-center animate-slide-out-up"
          onAnimationEnd={() => setPrevious(null)}
        >
          {previous}
        </span>
      )}
      <span 
        key={`curr-${current}`} 
        className="absolute inset-0 flex items-center justify-center animate-slide-in-up"
      >
        {current}
      </span>
    </div>
  );
}

export default function TimerDisplay({
  mode,
  timeLeft,
  totalTime,
  isRunning,
  cycleCount = 0,
  taskTitle = '',
  isFullScreen = false,
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
      <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
        <svg
          viewBox="0 0 100 100"
          width={280}
          height={280}
          className="absolute inset-0"
          style={{ transform: 'rotate(-90deg)' }}
        >
          {/* Track */}
          <circle
            cx="50" cy="50" r={RADIUS}
            fill="transparent"
            stroke={isFullScreen ? '#222' : 'var(--surface-low)'}
            strokeWidth="3"
            style={{ transition: 'stroke 0.7s ease' }}
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
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
          {/* Countdown (Always dead center) */}
          <div
            className="flex items-center justify-center"
            style={{
              fontFamily: G,
              fontSize: 72,
              fontWeight: 300,
              color: isFullScreen ? '#fff' : 'var(--text-primary)',
              letterSpacing: '-2px',
              lineHeight: 1,
              opacity: isRunning ? 1 : 0.55,
              transition: 'color 0.7s ease, opacity 0.4s ease',
              fontFeatureSettings: "'tnum'",
              marginTop: -6, // Optical centering adjustment
            }}
          >
            {formatTime(timeLeft).split('').map((char, i) => (
              <AnimatedDigit key={i} digit={char} />
            ))}
          </div>
          
          {/* Sub Labels (Absolutely positioned so they don't offset the countdown) */}
          <div 
            className="absolute flex flex-col items-center w-full"
            style={{ 
              top: '64%', 
              opacity: isFullScreen ? 0 : 1, 
              transition: 'opacity 0.5s ease', 
              pointerEvents: isFullScreen ? 'none' : 'auto' 
            }}
          >
            <span style={{ fontFamily: M, fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>
              SESSION {currentSessionNumber}/4
            </span>
            {taskTitle && (
              <span style={{ fontFamily: G, fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
                {taskTitle}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Status row */}
      <div className="flex items-center gap-2 mt-2" style={{ opacity: isFullScreen ? 0 : 1, transition: 'opacity 0.5s ease', pointerEvents: isFullScreen ? 'none' : 'auto' }}>
        <span
          style={{
            display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
            background: isRunning ? accentColor : (isFullScreen ? '#444' : 'var(--surface-mid)'),
            transition: 'background 0.7s ease',
          }}
          className={isRunning ? 'animate-pulse-subtle' : ''}
        />
        <span style={{ fontFamily: M, fontSize: 10, color: isRunning ? 'var(--text-secondary)' : 'var(--text-muted)', letterSpacing: '0.06em', transition: 'color 0.7s ease' }}>
          {isRunning ? 'Active' : 'Paused'} · {clockTime}
        </span>
      </div>

      {/* Session pips */}
      <div className="flex items-center gap-2 mt-4" style={{ opacity: isFullScreen ? 0 : 1, transition: 'opacity 0.5s ease', pointerEvents: isFullScreen ? 'none' : 'auto' }}>
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
      <p style={{ fontFamily: M, fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.04em', marginTop: 6, opacity: isFullScreen ? 0 : 1, transition: 'opacity 0.5s ease', pointerEvents: isFullScreen ? 'none' : 'auto' }}>
        {getSubLabel()}
      </p>
    </div>
  );
}
