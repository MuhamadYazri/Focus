import React from 'react';
import { Play, Pause, SkipForward, RotateCcw, Flame, Coffee, Moon, Clock } from 'lucide-react';

export default function TimerControls({
  mode,
  isRunning,
  onTogglePlay,
  onSkip,
  onReset,
  onSelectMode,
}) {
  const modes = [
    { id: 'work', label: 'Pomodoro', icon: Flame, color: 'text-[#ff5252]', border: 'border-[#ff5252]' },
    { id: 'shortBreak', label: 'Istirahat', icon: Coffee, color: 'text-[#2ecc71]', border: 'border-[#2ecc71]' },
    { id: 'longBreak', label: 'Panjang', icon: Moon, color: 'text-[#34ace0]', border: 'border-[#34ace0]' },
    { id: 'stopwatch', label: 'Stopwatch', icon: Clock, color: 'text-[#ffb142]', border: 'border-[#ffb142]' },
  ];

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#1c1c24] border border-[#2e2e3a] rounded-2xl">
        {modes.map((m) => {
          const IconComp = m.icon;
          const isActive = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelectMode(m.id)}
              className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all ${
                isActive
                  ? `bg-white/10 ${m.color} font-bold shadow-sm scale-105`
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <IconComp className={`w-4 h-4 mb-1 ${isActive ? m.color : ''}`} />
              <span className="text-[10px] tracking-tight">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Control Buttons */}
      <div className="flex items-center justify-center gap-4">
        {/* Reset Button */}
        <button
          onClick={onReset}
          className="w-14 h-14 rounded-2xl bg-[#1c1c24] border border-[#2e2e3a] hover:border-slate-500 text-slate-300 hover:text-white flex items-center justify-center shadow-md transition active:scale-95"
          title="Reset Timer"
        >
          <RotateCcw className="w-6 h-6" />
        </button>

        {/* Play / Pause Button */}
        <button
          onClick={onTogglePlay}
          className={`w-20 h-20 rounded-3xl flex items-center justify-center font-bold shadow-xl transition-transform active:scale-95 ${
            isRunning
              ? 'bg-[#ffb142] text-black shadow-[#ffb142]/30'
              : 'bg-[#ff5252] hover:bg-[#ff3b3b] text-white shadow-[#ff5252]/30 glow-red'
          }`}
          title={isRunning ? 'Jeda' : 'Mulai Fokus'}
        >
          {isRunning ? (
            <Pause className="w-10 h-10 fill-current" />
          ) : (
            <Play className="w-10 h-10 fill-current ml-1" />
          )}
        </button>

        {/* Skip Button */}
        <button
          onClick={onSkip}
          className="w-14 h-14 rounded-2xl bg-[#1c1c24] border border-[#2e2e3a] hover:border-slate-500 text-slate-300 hover:text-white flex items-center justify-center shadow-md transition active:scale-95"
          title="Lewati ke Sesi Berikutnya"
        >
          <SkipForward className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
