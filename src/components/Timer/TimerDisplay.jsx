import React, { useState, useEffect } from 'react';

const M = "'JetBrains Mono', monospace";

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
      setClockTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
    <div className="relative flex flex-col items-center select-none py-4 w-[280px] landscape:w-full landscape:max-w-2xl">

      {/* Mode label & Task title */}
      <div
        style={{
          fontFamily: M,
          color: '#3F3F46',
          letterSpacing: '0.15em',
        }}
        className="text-[9px] mb-8 landscape:mb-2 landscape:text-xs font-medium flex items-center justify-center gap-2 max-w-full px-4 text-center truncate"
      >
        <span>{getModeLabel()}</span>
        {taskTitle && (
          <>
            <span style={{ color: '#27272A' }}>•</span>
            <span style={{ color: '#8BA0B0' }} className="truncate max-w-[180px] landscape:max-w-[350px] font-normal tracking-normal">{taskTitle}</span>
          </>
        )}
      </div>

      {/* Time display */}
      <div
        style={{
          fontFamily: M,
          fontWeight: 700,
          color: '#FFFFFF',
          letterSpacing: '-3px',
          lineHeight: 1,
          opacity: isRunning ? 1 : 0.6,
          transition: 'opacity 0.4s ease',
        }}
        className="tabular-nums text-[72px] landscape:text-[110px] md:landscape:text-[140px]"
      >
        {formatTime(timeLeft)}
      </div>

      {/* Real-time Clock */}
      <div
        style={{
          fontFamily: M,
          color: '#71717A',
          letterSpacing: '0.1em',
        }}
        className="tabular-nums transition-opacity duration-300 text-xs mt-2 landscape:mt-1 landscape:text-sm"
      >
        {clockTime}
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2 mt-5 landscape:mt-2">
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
            color: isRunning ? '#8BA0B0' : '#3F3F46',
            letterSpacing: '0.08em',
            transition: 'color 0.3s ease',
          }}
          className="text-[8px] landscape:text-[10px]"
        >
          {isRunning ? 'Active' : 'Paused'}
        </span>
      </div>

      {/* Progress bar */}
      <div
        style={{
          borderTop: '1px solid #18181B',
        }}
        className="w-full max-w-[280px] landscape:max-w-[400px] mt-7 pt-4 landscape:mt-3 landscape:pt-2"
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
        <div className="flex items-center justify-between mt-3 landscape:mt-1.5">
          <span
            style={{
              fontFamily: M,
              color: '#3F3F46',
              letterSpacing: '0.06em',
            }}
            className="text-[7px] landscape:text-[9px]"
          >
            Session {currentSessionNumber}/4
          </span>
          <span
            style={{
              fontFamily: M,
              color: '#27272A',
              letterSpacing: '0.06em',
            }}
            className="text-[7px] landscape:text-[9px]"
          >
            {getSubLabel()}
          </span>
        </div>
      </div>

      {/* Session pips */}
      <div className="flex items-center justify-center gap-2.5 mt-4 landscape:mt-2">
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
