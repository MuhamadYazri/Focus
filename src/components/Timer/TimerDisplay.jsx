import React from 'react';

const M = "'JetBrains Mono', monospace";

export default function TimerDisplay({
  mode,
  timeLeft,
  totalTime,
  isRunning,
  cycleCount = 0,
}) {
  const progress = mode === 'stopwatch' ? 1 : Math.max(0, Math.min(1, timeLeft / (totalTime || 1)));

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const currentSessionNumber = (cycleCount % 4) + 1;

  const getSubLabel = () => {
    if (mode === 'shortBreak') return 'Next: 25 min focus';
    if (mode === 'longBreak') return 'Next: 25 min focus';
    return currentSessionNumber === 4 ? 'Next: 15 min break' : 'Next: 5 min break';
  };

  const getModeLabel = () => {
    if (mode === 'shortBreak') return 'SHORT BREAK';
    if (mode === 'longBreak') return 'LONG BREAK';
    return 'FOCUS';
  };

  return (
    <div className="relative flex flex-col items-center select-none py-4" style={{ width: 280 }}>

      {/* Mode label */}
      <span
        style={{
          fontFamily: M,
          fontSize: 9,
          color: '#3F3F46',
          letterSpacing: '0.18em',
          marginBottom: 32,
        }}
      >
        {getModeLabel()}
      </span>

      {/* Time display */}
      <div
        style={{
          fontFamily: M,
          fontSize: 72,
          fontWeight: 700,
          color: '#FFFFFF',
          letterSpacing: '-3px',
          lineHeight: 1,
          opacity: isRunning ? 1 : 0.6,
          transition: 'opacity 0.4s ease',
        }}
        className="tabular-nums"
      >
        {formatTime(timeLeft)}
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2 mt-5">
        <span
          style={{
            display: 'inline-block',
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: isRunning ? '#B9DAFF' : '#27272A',
            transition: 'background 0.3s ease, box-shadow 0.3s ease',
            boxShadow: isRunning ? '0 0 6px rgba(185, 218, 255, 0.6)' : 'none',
          }}
          className={isRunning ? 'animate-pulse' : ''}
        />
        <span
          style={{
            fontFamily: M,
            fontSize: 8,
            color: isRunning ? '#8BA0B0' : '#3F3F46',
            letterSpacing: '0.08em',
            transition: 'color 0.3s ease',
          }}
        >
          {isRunning ? 'Active' : 'Paused'}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          marginTop: 28,
          paddingTop: 16,
          borderTop: '1px solid #18181B',
        }}
      >
        <div
          style={{
            width: '100%',
            height: 2,
            background: '#18181B',
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress * 100}%`,
              height: '100%',
              background: '#B9DAFF',
              borderRadius: 1,
              transition: 'width 0.5s ease-out',
            }}
          />
        </div>

        {/* Session info + next label */}
        <div className="flex items-center justify-between mt-3">
          <span
            style={{
              fontFamily: M,
              fontSize: 7,
              color: '#3F3F46',
              letterSpacing: '0.06em',
            }}
          >
            Session {currentSessionNumber}/4
          </span>
          <span
            style={{
              fontFamily: M,
              fontSize: 7,
              color: '#27272A',
              letterSpacing: '0.06em',
            }}
          >
            {getSubLabel()}
          </span>
        </div>
      </div>

      {/* Session pips */}
      <div className="flex items-center justify-center gap-2.5 mt-4">
        {[1, 2, 3, 4].map((n) => {
          const isCurrent = n === currentSessionNumber;
          const isCompleted = n < currentSessionNumber;
          return (
            <div
              key={n}
              style={{
                width: isCurrent ? 20 : 4,
                height: 4,
                borderRadius: 2,
                background: isCompleted || isCurrent ? '#B9DAFF' : '#18181B',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
