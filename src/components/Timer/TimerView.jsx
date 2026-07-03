import React from 'react';
import { ArrowLeft, Lock, Unlock } from 'lucide-react';
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
  onSelectSound,
  onChangeVolume,
  onClearActiveTask,
  strictMode = false,
  onToggleStrictMode,
}) {
  const taskTitle = activeTask ? activeTask.title : 'Focus Session Standby';

  return (
    <div
      className="pb-28 pt-2 px-4 max-w-md mx-auto flex flex-col justify-between select-none relative min-h-[85vh]"
      style={{ background: '#000000', fontFamily: G }}
    >
      {/* Top notch */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 z-20"
        style={{
          width: 120,
          height: 20,
          background: '#000000',
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
          borderBottom: '1px solid #27272A',
        }}
      />

      {/* Status bar */}
      <div className="relative z-10 flex items-center justify-between pt-3 pb-1">
        <span style={{ fontFamily: M, fontSize: 11, color: '#3F3F46' }}>09:41</span>
        <span style={{ fontFamily: M, fontSize: 8, color: '#3F3F46', letterSpacing: '0.06em' }}>
          Focus Mode
        </span>
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between pt-2 pb-2">
        <button
          type="button"
          onClick={onClearActiveTask}
          className="flex items-center gap-1.5 transition-opacity active:opacity-50"
        >
          <ArrowLeft size={14} color="#3F3F46" strokeWidth={1.5} />
          <span style={{ fontFamily: M, fontSize: 8, color: '#3F3F46' }}>Back</span>
        </button>

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
          onTogglePlay={onTogglePlay}
          onReset={onReset}
          currentSound={currentSound}
          onSelectSound={onSelectSound}
          volume={soundVolume}
          onChangeVolume={onChangeVolume}
        />
      </div>
    </div>
  );
}
