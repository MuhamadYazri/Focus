import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Headphones,
  Volume2,
  Lock,
  Unlock,
} from 'lucide-react';
import { soundEngine } from '../../services/soundEngine';

const MODE_TABS = [
  { key: 'work', label: 'Focus' },
  { key: 'shortBreak', label: 'Short Break' },
  { key: 'longBreak', label: 'Long Break' },
];

const soundscapes = [
  { id: 'none', label: 'Silent' },
  { id: 'forest', label: 'Forest' },
  { id: 'rain', label: 'Rain' },
  { id: 'waves', label: 'Waves' },
  { id: 'cafe', label: 'Cafe' },
  { id: 'clock', label: 'Ticking' },
];

export default function TimerView({
  mode,
  timeLeft,
  totalTime,
  isRunning,
  cycleCount,
  activeTask,
  currentSound = 'none',
  soundVolume = 0.8,
  onTogglePlay,
  onReset,
  onSkip,
  onSelectSound,
  onChangeVolume,
  strictMode = false,
  onToggleStrictMode,
  onModeChange,
  isNavHidden,
  onToggleNav,
}) {
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const circumference = 691.15;
  const progress = (totalTime - timeLeft) / totalTime;
  const strokeDashoffset = circumference - circumference * (0.15 + progress * 0.7);

  const handleSelectSound = (soundId) => {
    if (onSelectSound) onSelectSound(soundId);
    if (soundId === 'none') soundEngine.stop();
    else soundEngine.play(soundId, soundVolume);
  };

  const stopProp = (e) => e.stopPropagation();

  // Immersive Background Check
  // In focus mode and running, we show a clean warm sand background.
  const isImmersive = isRunning && isNavHidden;
  const bgClass = isImmersive ? 'bg-[#E5D9B6]' : 'bg-[#F9FBEE]';

  // Sub Label Logic
  const getSubLabel = () => {
    if (mode === 'work') return 'Next: Short break';
    if (mode === 'shortBreak') return 'Next: Focus session';
    return 'Next: Focus session';
  };

  const currentSessionNumber = (cycleCount % 4) + 1;

  return (
    <div
      className={`flex flex-col h-[100dvh] w-full overflow-hidden transition-colors duration-700 ease-in-out ${bgClass} text-[#191D15] selection:bg-[#628141]/20`}
      onClick={() => {
        if (onToggleNav) onToggleNav();
      }}
    >
      <div className="flex flex-col w-full px-5 pt-12 pb-32 max-w-md mx-auto flex-1 select-none">
        {/* Mode Selector Pill */}
        <div
          className={`w-full bg-[#EAE4D7] border border-[#EDE7DA] rounded-full p-1.5 flex items-center justify-between shadow-sm mb-4 transition-all duration-500 ${
            isImmersive
              ? 'opacity-0 -translate-y-4 pointer-events-none'
              : 'opacity-100 translate-y-0'
          }`}
          onClick={stopProp}
        >
          {MODE_TABS.map(({ key, label }) => {
            const on = mode === key;
            return (
              <button
                key={key}
                onClick={() => {
                  if (window.navigator?.vibrate) window.navigator.vibrate(10);
                  if (onModeChange) onModeChange(key);
                }}
                className={`flex-1 py-2 px-3 rounded-full font-semibold text-xs md:text-sm transition-all ${
                  on
                    ? 'bg-white text-[#40513B] shadow-[0_2px_8px_rgba(64,81,59,0.08)]'
                    : 'text-[#444841] font-medium hover:text-[#40513B]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Center: Large Circular Progress Ring */}
        <div
          className={`relative w-full aspect-square max-w-[270px] mx-auto flex items-center justify-center my-2 transition-transform duration-700 ${
            isImmersive ? 'scale-110 mt-16' : 'scale-100'
          }`}
        >
          <svg className="w-full h-full -rotate-90 transform drop-shadow-sm" viewBox="0 0 260 260">
            <circle
              className={isImmersive ? 'text-white/30' : 'text-[#E5D9B6]'}
              cx="130"
              cy="130"
              r="110"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="10"
            />
            <circle
              className="text-[#628141] transition-all duration-1000 ease-out"
              cx="130"
              cy="130"
              r="110"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
            <span
              className={`text-[60px] leading-none font-bold tracking-tight tabular-nums transition-colors duration-700 ${
                isImmersive ? 'text-[#40513B]' : 'text-[#40513B]'
              }`}
            >
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Status & Cycle Stepper Indicator */}
        <div
          className={`flex flex-col items-center justify-center mb-5 gap-1.5 transition-all duration-700 ${
            isImmersive ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isRunning
                  ? 'bg-[#628141] shadow-[0_0_8px_rgba(98,129,65,0.4)] animate-pulse'
                  : 'bg-[#E5D9B6]'
              }`}
            ></span>
            <span className="font-mono text-xs text-[#444841] tracking-wide">
              {isRunning ? 'Active' : 'Paused'}
              {activeTask?.title ? ` · ${activeTask.title.substring(0, 15)}` : ''}
            </span>
          </div>

          <div className="flex items-center gap-1.5 my-0.5">
            {[1, 2, 3, 4].map((n) => {
              const isCurrent = n === currentSessionNumber;
              const isDone = n < currentSessionNumber;
              return (
                <span
                  key={n}
                  className={`h-1.5 rounded-full transition-all ${
                    isCurrent
                      ? 'w-4 bg-[#628141]'
                      : isDone
                      ? 'w-1.5 bg-[#628141]/60'
                      : 'w-1.5 bg-[#E5D9B6]'
                  }`}
                ></span>
              );
            })}
          </div>
          <span className="font-mono text-[11px] text-[#628141] font-semibold tracking-wider uppercase">
            {getSubLabel()}
          </span>
        </div>

        {/* Elevated Controls Card */}
        <div
          className={`w-full bg-white border border-[#EDE7DA] rounded-3xl p-5 shadow-[0_8px_24px_-4px_rgba(64,81,59,0.06),0_2px_6px_-1px_rgba(64,81,59,0.03)] flex flex-col gap-4 transition-all duration-700 ${
            isImmersive
              ? 'opacity-10 shadow-none bg-transparent border-transparent translate-y-12'
              : 'opacity-100 translate-y-0'
          }`}
          onClick={stopProp}
        >
          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-6 pt-1">
            <button
              onClick={() => {
                if (window.navigator?.vibrate) window.navigator.vibrate(10);
                if (onReset) onReset();
              }}
              className="w-12 h-12 rounded-full bg-[#F5F1E8] border border-[#E5D9B6]/60 text-[#40513B] flex items-center justify-center transition-transform active:scale-95 hover:bg-[#EDE7DA]"
            >
              <RotateCcw size={20} strokeWidth={2.5} />
            </button>

            <button
              onClick={() => {
                if (window.navigator?.vibrate) window.navigator.vibrate(20);
                if (onTogglePlay) onTogglePlay();
              }}
              className="w-16 h-16 rounded-full bg-[#40513B] text-white flex items-center justify-center shadow-[0_10px_22px_rgba(64,81,59,0.28)] transition-transform active:scale-90 hover:scale-105"
            >
              {isRunning ? (
                <Pause size={28} className="fill-current" />
              ) : (
                <Play size={28} className="translate-x-0.5 fill-current" />
              )}
            </button>

            <button
              onClick={() => {
                if (window.navigator?.vibrate) window.navigator.vibrate(10);
                if (onSkip) onSkip();
              }}
              className="w-12 h-12 rounded-full bg-[#F5F1E8] border border-[#E5D9B6]/60 text-[#40513B] flex items-center justify-center transition-transform active:scale-95 hover:bg-[#EDE7DA]"
            >
              <SkipForward size={20} strokeWidth={2.5} />
            </button>
          </div>

          <div className="w-full h-px bg-[#EDE7DA]"></div>

          {/* Sound & Volume */}
          <div className="flex items-center justify-between text-[#444841] px-1 pb-0.5">
            <div className="relative flex items-center gap-2 cursor-pointer px-2.5 py-1.5 rounded-full hover:bg-[#F9FBEE] transition-colors">
              <Headphones size={18} className="text-[#628141]" />
              <select
                value={currentSound}
                onChange={(e) => handleSelectSound(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-sm"
              >
                {soundscapes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <span className="text-sm font-semibold text-[#40513B]">
                {soundscapes.find((s) => s.id === currentSound)?.label || 'Silent'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Volume2 size={16} className="text-[#628141]" />
              <div className="w-20 h-1.5 bg-[#E5D9B6] rounded-full overflow-hidden flex relative">
                <div
                  className="h-full bg-[#628141] rounded-full"
                  style={{ width: `${soundVolume * 100}%` }}
                ></div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={soundVolume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (onChangeVolume) onChangeVolume(v);
                    if (currentSound !== 'none') soundEngine.setVolume(v);
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Strict Focus Toggle Card */}
        <div
          className={`w-full flex items-center justify-between px-5 py-3.5 mt-4 rounded-2xl bg-[#EAE4D7]/70 border border-[#EDE7DA] transition-all duration-700 ${
            isImmersive
              ? 'opacity-0 translate-y-8 pointer-events-none'
              : 'opacity-100 translate-y-0'
          }`}
          onClick={stopProp}
        >
          <div className="flex items-center gap-3">
            {strictMode ? (
              <Lock size={20} className="text-[#628141]" />
            ) : (
              <Unlock size={20} className="text-[#8D9A82]" />
            )}
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-[#40513B] leading-tight">
                Strict Focus
              </span>
              <span className="text-[11px] text-[#444841] leading-tight mt-0.5">
                Block app interruptions
              </span>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={strictMode}
              onChange={() => {
                if (onToggleStrictMode) onToggleStrictMode();
              }}
            />
            <div className="w-10 h-5 bg-[#E5D9B6] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E5D9B6] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#628141] shadow-inner"></div>
          </label>
        </div>
      </div>
    </div>
  );
}
