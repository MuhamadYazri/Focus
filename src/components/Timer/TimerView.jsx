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
}) {
  const taskTitle = activeTask ? activeTask.title : '';

  return (
    <div
      className="pb-28 pt-4 px-4 max-w-md mx-auto flex flex-col justify-between select-none relative min-h-[85vh]"
      style={{ background: '#000000', fontFamily: G }}
    >
      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between pt-2 pb-2">
        <div className="w-12" />

        <div className="flex-1 mx-3 overflow-hidden">
          <p
            style={{
              fontFamily: G,
              fontSize: 11,
              fontWeight: 500,
              color: '#8BA0B0',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {taskTitle}
          </p>
        </div>

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
        />
      </div>

      {/* Control Deck */}
      <div className="relative z-10 mt-auto">
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
