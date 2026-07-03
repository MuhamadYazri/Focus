import React from 'react';
import { Flame, Coffee, Moon, CheckCircle2, Play } from 'lucide-react';
import ProjectBadge from '../Projects/ProjectBadge';

const MODE_CONFIG = {
  work: { label: 'Fokus Kerja', color: '#ff5252', glow: 'glow-red', icon: Flame },
  shortBreak: { label: 'Istirahat Singkat', color: '#2ecc71', glow: 'glow-green', icon: Coffee },
  longBreak: { label: 'Istirahat Panjang', color: '#34ace0', glow: 'shadow-[0_0_25px_rgba(52,172,224,0.3)]', icon: Moon },
  stopwatch: { label: 'Mode Stopwatch', color: '#ffb142', glow: 'shadow-[0_0_25px_rgba(255,177,66,0.3)]', icon: Play },
};

export default function TimerDisplay({
  mode,
  timeLeft,
  totalTime,
  isRunning,
  cycleCount,
  activeTask,
  project,
  onClearActiveTask,
}) {
  const config = MODE_CONFIG[mode] || MODE_CONFIG.work;
  const Icon = config.icon;

  // Calculate SVG circular progress percentage
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const progress = mode === 'stopwatch' ? 1 : Math.max(0, Math.min(1, timeLeft / totalTime));
  const strokeDashoffset = circumference * (1 - progress);

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center pt-2 pb-6 space-y-6 select-none">
      {/* Mode Indicator & Cycle Badge */}
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-md transition-all ${config.glow}`}
          style={{
            backgroundColor: `${config.color}15`,
            color: config.color,
            borderColor: `${config.color}40`,
          }}
        >
          <Icon className="w-3.5 h-3.5 animate-pulse" />
          {config.label}
        </span>
        {mode !== 'stopwatch' && (
          <span className="text-xs font-semibold text-slate-400 bg-[#1c1c24] border border-[#2e2e3a] px-3 py-1 rounded-full">
            Siklus {(cycleCount % 4) + 1} / 4
          </span>
        )}
      </div>

      {/* SVG Circular Progress Ring */}
      <div className="relative w-72 h-72 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 280 280">
          {/* Background track */}
          <circle
            cx="140"
            cy="140"
            r={radius}
            className="stroke-[#1c1c24]"
            strokeWidth="10"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx="140"
            cy="140"
            r={radius}
            stroke={config.color}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={mode === 'stopwatch' ? 0 : strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-500 ease-linear"
            style={{ filter: `drop-shadow(0 0 8px ${config.color})` }}
          />
        </svg>

        {/* Center Time Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span
            className="text-6xl font-black tracking-tighter transition-all tabular-nums text-white drop-shadow-md"
            style={{ color: isRunning ? config.color : '#ffffff' }}
          >
            {formatTime(timeLeft)}
          </span>
          <span className="text-xs font-medium text-slate-400 mt-2 uppercase tracking-widest">
            {isRunning ? 'Sedang Berjalan...' : 'Jeda / Siap'}
          </span>
        </div>
      </div>

      {/* Active Task Card */}
      {activeTask ? (
        <div className="w-full max-w-sm bg-[#1c1c24] border border-[#2e2e3a] rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-lg relative overflow-hidden group">
          <div
            className="absolute left-0 top-0 bottom-0 w-1"
            style={{ backgroundColor: project ? project.color : '#ff5252' }}
          />
          <div className="flex-1 min-w-0 pl-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
              Fokus Saat Ini:
            </span>
            <p className="text-sm font-bold text-white truncate group-hover:text-[#ff5252] transition">
              {activeTask.title}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <ProjectBadge project={project} size="sm" />
              <span className="text-[11px] text-slate-400">
                {activeTask.completedPomos || 0} / {activeTask.estimatedPomos || 1} Pomo
              </span>
            </div>
          </div>
          <button
            onClick={onClearActiveTask}
            className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition flex-shrink-0"
            title="Ganti Tugas"
          >
            Ganti
          </button>
        </div>
      ) : (
        <div className="w-full max-w-sm bg-[#1c1c24]/60 border border-dashed border-[#2e2e3a] rounded-2xl p-3 text-center text-xs text-slate-400">
          <span>Belum ada tugas dipilih. </span>
          <span className="text-[#ff5252] font-semibold underline cursor-pointer" onClick={onClearActiveTask}>
            Pilih dari daftar
          </span>
        </div>
      )}
    </div>
  );
}
