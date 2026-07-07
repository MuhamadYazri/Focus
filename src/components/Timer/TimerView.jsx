import React from 'react';
import { Lock, Unlock } from 'lucide-react';
import TimerDisplay from './TimerDisplay';
import TimerControls from './TimerControls';

const G = "Geist, 'Helvetica Neue', sans-serif";
const M = "'JetBrains Mono', monospace";

export default function TimerView({
  mode,
  timeLeft,
  totalTime,
  isRunning,
  cycleCount,
  activeTask,
  projects,
  currentSound,
  soundVolume,
  onTogglePlay,
  onReset,
  onSkip,
  onSelectSound,
  onChangeVolume,
  onClearActiveTask,
  strictMode = false,
  onToggleStrictMode,
  isNavHidden = false,
  onToggleNav,
}) {
  const taskTitle = activeTask ? activeTask.title : '';

  const handleScreenTouch = (e) => {
    if (
      e.target.closest('button') ||
      e.target.closest('input') ||
      e.target.closest('a') ||
      e.target.closest('[role="button"]') ||
      e.target.closest('[data-interactive="true"]')
    ) {
      return;
    }
    if (onToggleNav) {
      onToggleNav();
    }
  };

  return (
    <div
      onClick={handleScreenTouch}
      className={`pt-4 px-4 max-w-md mx-auto flex flex-col justify-between select-none relative transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
        isNavHidden ? 'pb-6 min-h-[94vh]' : 'pb-28 min-h-[85vh]'
      } landscape:max-w-full landscape:w-full landscape:h-screen landscape:min-h-screen landscape:py-0 landscape:px-6 landscape:justify-center landscape:items-center`}
      style={{ background: '#000000', fontFamily: G }}
    >
      {/* Top bar */}
      <div
        className={`relative z-10 flex items-center justify-between pt-2 pb-2 transition-all duration-500 w-full landscape:max-w-4xl ${
          isNavHidden ? 'landscape:hidden landscape:opacity-0 landscape:pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="w-12" />
        <div className="flex-1" />

        <button
          type="button"
          onClick={onToggleStrictMode}
          className="flex items-center gap-1.5 transition-opacity active:opacity-70"
          style={{
            background: '#090A0C',
            border: `1px solid ${strictMode ? '#B9DAFF' : '#27272A'}`,
            borderRadius: 4,
            padding: '5px 8px',
          }}
        >
          {strictMode ? (
            <Lock size={10} color="#B9DAFF" strokeWidth={1.5} />
          ) : (
            <Unlock size={10} color="#8BA0B0" strokeWidth={1.5} />
          )}
          <span
            style={{
              fontFamily: M,
              fontSize: 7,
              color: strictMode ? '#B9DAFF' : '#8BA0B0',
              letterSpacing: '0.06em',
            }}
          >
            {strictMode ? 'Strict' : 'Open'}
          </span>
        </button>
      </div>

      {/* Centerpiece: Timer Display */}
      <div className="relative z-10 flex-1 flex items-center justify-center my-auto">
        <TimerDisplay
          mode={mode}
          timeLeft={timeLeft}
          totalTime={totalTime}
          isRunning={isRunning}
          cycleCount={cycleCount}
          taskTitle={taskTitle}
        />
      </div>

      {/* Control Deck */}
      <div
        className={`relative z-10 mt-auto transition-all duration-500 w-full landscape:max-w-md ${
          isNavHidden ? 'landscape:hidden landscape:opacity-0 landscape:pointer-events-none' : 'opacity-100'
        }`}
      >
        <TimerControls
          isRunning={isRunning}
          isInitial={timeLeft === totalTime || (mode === 'stopwatch' && timeLeft === 0)}
          mode={mode}
          onTogglePlay={onTogglePlay}
          onReset={onReset}
          onSkip={onSkip}
          currentSound={currentSound}
          onSelectSound={onSelectSound}
          volume={soundVolume}
          onChangeVolume={onChangeVolume}
        />
      </div>
    </div>
  );
}
