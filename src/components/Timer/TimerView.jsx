import React, { useState, useEffect } from 'react';
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

const AnimatedDigit = ({ char, isColon }) => {
  const [prev, setPrev] = useState(char);
  const [curr, setCurr] = useState(char);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (char !== curr) {
      setPrev(curr);
      setCurr(char);
      setAnimating(true);
      const t = setTimeout(() => setAnimating(false), 250);
      return () => clearTimeout(t);
    }
  }, [char, curr]);

  return (
    <span
      className="relative inline-block text-center h-[64px]"
      style={{ width: isColon ? '18px' : '40px' }}
    >
      <style>
        {`
          @keyframes tickOut {
            0% { transform: translateY(0%); opacity: 1; filter: blur(0px); }
            100% { transform: translateY(50%); opacity: 0; filter: blur(2px); }
          }
          @keyframes tickIn {
            0% { transform: translateY(-50%); opacity: 0; filter: blur(2px); }
            100% { transform: translateY(0%); opacity: 1; filter: blur(0px); }
          }
        `}
      </style>
      {animating && (
        <span
          key={`out-${prev}`}
          className="absolute top-0 left-0 w-full h-full flex items-center justify-center"
          style={{ animation: 'tickOut 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
        >
          {prev}
        </span>
      )}
      <span
        key={`in-${curr}`}
        className="absolute top-0 left-0 w-full h-full flex items-center justify-center"
        style={{
          animation: animating ? 'tickIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'none',
        }}
      >
        {curr}
      </span>
    </span>
  );
};

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
  const strokeDashoffset = circumference * progress;

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
      className="flex flex-col h-[100dvh] w-full overflow-y-auto overflow-x-hidden transition-colors duration-700 ease-in-out bg-[#F9FBEE] text-[#191D15] selection:bg-[#628141]/20"
      onClick={() => {
        if (onToggleNav) onToggleNav();
      }}
    >
      <div className="w-full max-w-md mx-auto grid grid-rows-[auto_1fr_auto] min-h-[100dvh] px-6 pt-15 pb-[110px] select-none">
        {/* TOP SECTION (Mode Pill & Status) */}
        <div
          className={`grid transition-all duration-700 ease-in-out ${
            isNavHidden ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
          }`}
        >
          <div className="overflow-hidden flex flex-col justify-end pointer-events-none">
            {/* Wrapper to restore pointer events for children */}
            <div className="pointer-events-auto">
              <div
                className="w-full bg-white border border-[#EDE7DA] rounded-full p-1.5 flex items-center justify-between shadow-sm mb-4"
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
                      className={`flex-1 py-1.5 px-3 rounded-full font-semibold text-xs md:text-sm transition-all ${
                        on
                          ? 'bg-[#40513B] text-white shadow-[0_2px_8px_rgba(64,81,59,0.2)]'
                          : 'text-[#444841] font-medium hover:text-[#40513B]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Status Indicator */}
              {activeTask?.title ? (
                <div className="flex flex-col items-center justify-center gap-1.5 mb-2 h-6">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isRunning
                          ? 'bg-[#628141] shadow-[0_0_8px_rgba(98,129,65,0.4)] animate-pulse'
                          : 'bg-[#E5D9B6]'
                      }`}
                    ></span>
                    <span className="font-sans font-medium text-xs text-[#444841] tracking-wide">
                      {activeTask.title.substring(0, 25)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-6 mb-2"></div>
              )}
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION (TIMER) */}
        <div className="flex flex-col items-center justify-center w-full relative">
          <div
            className={`relative w-full aspect-square max-w-[270px] mx-auto flex items-center justify-center transition-transform duration-700 ${
              isNavHidden ? 'scale-110' : 'scale-100'
            }`}
          >
            <svg
              className="w-full h-full -rotate-90 transform drop-shadow-sm"
              viewBox="0 0 260 260"
            >
              <circle
                className="text-[#E5D9B6]"
                cx="130"
                cy="130"
                r="110"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="10"
              />
              <circle
                className="text-[#628141] transition-all duration-1000 ease-linear"
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
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-[60px] leading-none font-bold tracking-normal text-[#40513B] font-sans flex items-center justify-center overflow-hidden h-[64px]">
                {formatTime(timeLeft)
                  .split('')
                  .map((char, i) => (
                    <AnimatedDigit key={i} char={char} isColon={char === ':'} />
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div
          className={`grid transition-all duration-700 ease-in-out ${
            isNavHidden ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
          }`}
        >
          <div className="overflow-hidden flex flex-col justify-start pointer-events-none">
            {/* Wrapper to restore pointer events for children */}
            <div className="pointer-events-auto w-full flex flex-col gap-3">
              {/* Cycle Stepper (Below timer) */}
              <div className="flex flex-col items-center justify-center gap-1 mt-3 mb-4">
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
                <span className="font-sans text-[11px] text-[#628141] font-bold tracking-wider uppercase">
                  {getSubLabel()}
                </span>
              </div>

              {/* Elevated Controls Card */}
              <div
                className="w-full bg-white border border-[#EDE7DA] rounded-3xl p-4 shadow-sm flex flex-col gap-3"
                onClick={stopProp}
              >
                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-5 pt-1">
                  <button
                    onClick={() => {
                      if (window.navigator?.vibrate) window.navigator.vibrate(10);
                      if (onReset) onReset();
                    }}
                    className="w-12 h-12 rounded-full bg-[#F9FBEE] border border-[#EDE7DA] text-[#40513B] flex items-center justify-center transition-transform active:scale-95 hover:bg-[#EDE7DA]"
                  >
                    <RotateCcw size={20} strokeWidth={2.5} />
                  </button>

                  <button
                    onClick={() => {
                      if (window.navigator?.vibrate) window.navigator.vibrate(20);
                      if (onTogglePlay) onTogglePlay();
                    }}
                    className="w-16 h-16 rounded-full bg-[#40513B] text-white flex items-center justify-center shadow-md transition-transform active:scale-90 hover:scale-105"
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
                    className="w-12 h-12 rounded-full bg-[#F9FBEE] border border-[#EDE7DA] text-[#40513B] flex items-center justify-center transition-transform active:scale-95 hover:bg-[#EDE7DA]"
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
                    <span className="text-sm font-semibold text-[#40513B] font-sans">
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
                className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-white border border-[#EDE7DA] shadow-sm"
                onClick={stopProp}
              >
                <div className="flex items-center gap-3">
                  {strictMode ? (
                    <Lock size={20} className="text-[#628141]" />
                  ) : (
                    <Unlock size={20} className="text-[#8D9A82]" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-[#40513B] leading-tight font-sans">
                      Strict Focus
                    </span>
                    <span className="text-[11px] text-[#444841] leading-tight mt-0.5 font-sans">
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
                  <div className="w-10 h-5 bg-[#E5D9B6] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-[#E5D9B6] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#628141] shadow-inner"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
