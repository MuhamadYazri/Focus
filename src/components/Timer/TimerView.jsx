import React from 'react';
import TimerDisplay from './TimerDisplay';
import TimerControls from './TimerControls';
import WhiteNoisePlayer from './WhiteNoisePlayer';

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
  onSkip,
  onReset,
  onSelectMode,
  onSelectSound,
  onChangeVolume,
  onClearActiveTask,
}) {
  const activeProject = activeTask
    ? projects.find((p) => p.id === activeTask.projectId)
    : null;

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6 animate-fadeIn">
      {/* Top Title */}
      <div className="text-center">
        <h1 className="text-xl font-black text-white tracking-tight">
          Teknik Pomodoro Ilmiah
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Fokus penuh 25 menit, istirahat teratur untuk produktivitas maksimal
        </p>
      </div>

      {/* Main Display Ring */}
      <TimerDisplay
        mode={mode}
        timeLeft={timeLeft}
        totalTime={totalTime}
        isRunning={isRunning}
        cycleCount={cycleCount}
        activeTask={activeTask}
        project={activeProject}
        onClearActiveTask={onClearActiveTask}
      />

      {/* Controls */}
      <TimerControls
        mode={mode}
        isRunning={isRunning}
        onTogglePlay={onTogglePlay}
        onSkip={onSkip}
        onReset={onReset}
        onSelectMode={onSelectMode}
      />

      {/* White Noise Audio Control Panel */}
      <WhiteNoisePlayer
        currentSound={currentSound}
        onSelectSound={onSelectSound}
        volume={soundVolume}
        onChangeVolume={onChangeVolume}
      />
    </div>
  );
}
