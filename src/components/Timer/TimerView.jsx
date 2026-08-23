import React from 'react';
import TimerDisplay from './TimerDisplay';
import TimerControls from './TimerControls';

const G = "'Geist', system-ui, sans-serif";
const M = "'JetBrains Mono', monospace";

const MODE_TABS = [
  { key: 'work',       label: 'Focus' },
  { key: 'shortBreak', label: 'Short Break' },
  { key: 'longBreak',  label: 'Long Break' },
];

export default function TimerView({
  mode,
  timeLeft,
  totalTime,
  isRunning,
  cycleCount,
  activeTask,
  currentSound,
  soundVolume,
  onTogglePlay,
  onReset,
  onSkip,
  onSelectSound,
  onChangeVolume,
  strictMode = false,
  onToggleStrictMode,
  onModeChange,
}) {
  const taskTitle = activeTask ? activeTask.title : '';

  return (
    <div className="flex flex-col min-h-[100dvh]" style={{ fontFamily: G, background: 'var(--canvas)' }}>

      {/* ── Top Bar ── */}
      <header className="glass sticky top-0 z-40 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined" style={{ color: 'var(--text-primary)', fontSize: 22 }}>timer</span>
          <h1 style={{ fontFamily: G, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Focus
          </h1>
        </div>

        {/* Strict Mode Toggle */}
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: M, fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
            STRICT MODE
          </span>
          <input
            type="checkbox"
            checked={strictMode}
            onChange={() => { if (onToggleStrictMode) onToggleStrictMode(); }}
            className="ios-toggle"
          />
        </div>
      </header>

      {/* ── Mode Selector ── */}
      <div className="flex justify-center mt-6 px-5">
        <div
          className="flex p-1 rounded-full"
          style={{ background: 'var(--surface-low)', border: '1px solid var(--surface-border)' }}
        >
          {MODE_TABS.map(({ key, label }) => {
            const on = mode === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => { if (window.navigator?.vibrate) window.navigator.vibrate(10); if (onModeChange) onModeChange(key); }}
                className="transition-all"
                style={{
                  padding: '6px 16px',
                  borderRadius: 9999,
                  fontFamily: G,
                  fontSize: 14,
                  fontWeight: on ? 600 : 400,
                  color: on ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: on ? 'var(--surface-card)' : 'transparent',
                  boxShadow: on ? 'var(--shadow-soft)' : 'none',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Timer Display (centered, fills space) ── */}
      <div className="flex-1 flex items-center justify-center py-8 px-5">
        <TimerDisplay
          mode={mode}
          timeLeft={timeLeft}
          totalTime={totalTime}
          isRunning={isRunning}
          cycleCount={cycleCount}
          taskTitle={taskTitle}
        />
      </div>

      {/* ── Control Deck (fixed above bottom nav) ── */}
      <div className="px-5 pb-28">
        <TimerControls
          isRunning={isRunning}
          isInitial={timeLeft === totalTime}
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
