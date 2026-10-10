import React, { useState, useEffect, useRef } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import studyingLottie1 from '../../assets/studyingAnimation.lottie';
import studyingLottie2 from '../../assets/studyingAnimation2.lottie';
import relaxLottie from '../../assets/relaxAnimation.lottie';
import catSleepLottie from '../../assets/catSleepAnimation.lottie';
import { SkipForward, Headphones, Volume2, Unlock } from 'lucide-react';
import {
  PlayIcon as Play,
  PauseIcon as Pause,
  RotateCcwIcon as RotateCcw,
  LockIcon as Lock,
} from 'lucide-animated';
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
  const iconRefs = useRef({});
  const [lottieIndex, setLottieIndex] = useState(0);

  // Toggle Lottie every time user enters immersive fullscreen mode
  useEffect(() => {
    if (isRunning && isNavHidden) {
      setLottieIndex((prev) => (prev === 0 ? 1 : 0));
    }
  }, [isRunning, isNavHidden]);

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
  const bgClass = isImmersive ? 'bg-[#E5D9B6]' : 'bg-canvas';
  
  const currentLottie = (() => {
    if (mode === 'work') {
      return lottieIndex === 0 ? studyingLottie1 : studyingLottie2;
    } else {
      return lottieIndex === 0 ? relaxLottie : catSleepLottie;
    }
  })();

  // Sub Label Logic
  const getSubLabel = () => {
    if (mode === 'work') return 'Next: Short break';
    if (mode === 'shortBreak') return 'Next: Focus session';
    return 'Next: Focus session';
  };

  const currentSessionNumber = (cycleCount % 4) + 1;

  return (
    <div
      className="flex flex-col h-[100dvh] w-full overflow-y-auto overflow-x-hidden transition-colors duration-700 ease-in-out bg-canvas text-text-main selection:bg-secondary/20"
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
                className="w-full bg-surface border border-border rounded-full p-1.5 flex items-center justify-between shadow-sm mb-4"
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
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-[#444841] font-medium hover:text-primary'
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
                        isRunning ? 'bg-secondary shadow-sm animate-pulse' : 'bg-[#E5D9B6]'
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
                className="text-secondary transition-all duration-1000 ease-linear"
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
              <div className="text-[60px] leading-none font-bold tracking-normal text-primary font-sans flex items-center justify-center overflow-hidden h-[64px]">
                {formatTime(timeLeft)
                  .split('')
                  .map((char, i) => (
                    <AnimatedDigit key={i} char={char} isColon={char === ':'} />
                  ))}
              </div>
            </div>
          </div>

          {/* Immersive Animation */}
          <div
            className={`transition-all duration-700 ease-in-out flex justify-center items-center pointer-events-none overflow-hidden w-full ${
              isImmersive ? 'opacity-100 max-h-[400px] mt-12' : 'opacity-0 max-h-0 mt-0'
            }`}
          >
            <DotLottieReact
              key={currentLottie}
              src={currentLottie}
              loop
              autoplay
              className="w-full h-auto object-contain mix-blend-multiply opacity-90"
            />
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div
          className={`grid transition-all duration-700 ease-in-out ${
            isNavHidden ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
          }`}
        >
          <div className="transition-all duration-700 ease-in-out overflow-hidden flex flex-col justify-start pointer-events-none p-6 -m-6">
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
                            ? 'w-4 bg-secondary'
                            : isDone
                            ? 'w-1.5 bg-secondary/60'
                            : 'w-1.5 bg-[#E5D9B6]'
                        }`}
                      ></span>
                    );
                  })}
                </div>
                <span className="font-sans text-[11px] text-secondary font-bold tracking-wider uppercase">
                  {getSubLabel()}
                </span>
              </div>

              {/* Elevated Controls Card */}
              <div
                className="w-full bg-surface border border-border rounded-3xl p-4 shadow-sm flex flex-col gap-3"
                onClick={stopProp}
              >
                {/* Action Buttons */}
                <div className="flex items-center justify-center gap-5 pt-1">
                  <button
                    onClick={() => {
                      if (window.navigator?.vibrate) window.navigator.vibrate(10);
                      iconRefs.current.reset?.startAnimation();
                      setTimeout(() => {
                        iconRefs.current.reset?.stopAnimation();
                      }, 600);
                      setTimeout(() => {
                        if (onReset) onReset();
                      }, 50);
                    }}
                    className="w-12 h-12 rounded-full bg-canvas border border-border text-primary flex items-center justify-center transition-transform active:scale-95 hover:bg-border"
                  >
                    <RotateCcw
                      ref={(el) => (iconRefs.current.reset = el)}
                      animateOnHover={false}
                      size={20}
                      strokeWidth={2.5}
                    />
                  </button>

                  <button
                    onClick={() => {
                      if (window.navigator?.vibrate) window.navigator.vibrate(20);
                      iconRefs.current.playPause?.startAnimation();
                      setTimeout(() => {
                        iconRefs.current.playPause?.stopAnimation();
                      }, 600);
                      setTimeout(() => {
                        if (onTogglePlay) onTogglePlay();
                      }, 50);
                    }}
                    className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-md transition-transform active:scale-90 hover:scale-105"
                  >
                    {isRunning ? (
                      <Pause
                        ref={(el) => (iconRefs.current.playPause = el)}
                        animateOnHover={false}
                        size={28}
                        className="fill-current"
                      />
                    ) : (
                      <Play
                        ref={(el) => (iconRefs.current.playPause = el)}
                        animateOnHover={false}
                        size={28}
                        className="translate-x-0.5 fill-current"
                      />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (window.navigator?.vibrate) window.navigator.vibrate(10);
                      if (onSkip) onSkip();
                    }}
                    className="w-12 h-12 rounded-full bg-canvas border border-border text-primary flex items-center justify-center transition-transform active:scale-95 hover:bg-border"
                  >
                    <SkipForward size={20} strokeWidth={2.5} />
                  </button>
                </div>

                <div className="w-full h-px bg-border"></div>

                {/* Sound & Volume */}
                <div className="flex items-center justify-between text-[#444841] px-1 pb-0.5">
                  <div className="relative flex items-center gap-2 cursor-pointer px-2.5 py-1.5 rounded-full hover:bg-canvas transition-colors">
                    <Headphones size={18} className="text-secondary" />
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
                    <span className="text-sm font-semibold text-primary font-sans">
                      {soundscapes.find((s) => s.id === currentSound)?.label || 'Silent'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Volume2 size={16} className="text-secondary" />
                    <div className="w-20 h-1.5 bg-[#E5D9B6] rounded-full overflow-hidden flex relative">
                      <div
                        className="h-full bg-secondary rounded-full"
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
                className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-surface border border-border shadow-sm"
                onClick={stopProp}
              >
                <div className="flex items-center gap-3">
                  {strictMode ? (
                    <Lock
                      ref={(el) => (iconRefs.current.lock = el)}
                      animateOnHover={false}
                      size={20}
                      className="text-secondary"
                    />
                  ) : (
                    <Unlock size={20} className="text-[#8D9A82]" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-primary leading-tight font-sans">
                      Strict Focus
                    </span>
                    <span className="text-[11px] text-text-sub leading-tight mt-0.5 font-sans">
                      Block app interruptions
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    iconRefs.current.lock?.startAnimation();
                    setTimeout(() => {
                      iconRefs.current.lock?.stopAnimation();
                    }, 600);
                    setTimeout(() => {
                      if (onToggleStrictMode) onToggleStrictMode();
                    }, 50);
                  }}
                  className={`w-11 h-6 rounded-full p-0.5 flex items-center shadow-inner cursor-pointer transition-all ${
                    strictMode ? 'bg-secondary justify-end' : 'bg-border justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-surface shadow-sm transition-transform"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
