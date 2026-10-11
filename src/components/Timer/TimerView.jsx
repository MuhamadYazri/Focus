import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import studyingLottie1 from '../../assets/studyingAnimation.lottie';
import studyingLottie2 from '../../assets/studyingAnimation2.lottie';
import relaxLottie from '../../assets/relaxAnimation.lottie';
import catSleepLottie from '../../assets/catSleepAnimation.lottie';
import {
  SkipForward,
  Headphones,
  Volume2,
  VolumeX,
  Unlock,
  CloudRain,
  Trees,
  Waves,
  Coffee,
  Clock,
} from 'lucide-react';
import {
  PlayIcon as Play,
  PauseIcon as Pause,
  RotateCcwIcon as RotateCcw,
  LockIcon as Lock,
  XIcon,
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
      {animating && (
        <span
          key={`out-${prev}`}
          className="absolute top-0 left-0 w-full h-full flex items-center justify-center animate-tick-out pointer-events-none"
        >
          {prev}
        </span>
      )}
      <span
        key={`in-${curr}`}
        className={`absolute top-0 left-0 w-full h-full flex items-center justify-center ${
          animating ? 'animate-tick-in' : ''
        }`}
      >
        {curr}
      </span>
    </span>
  );
};

const TimerClockRing = React.memo(function TimerClockRing({
  timeLeft,
  totalTime,
  isNavHidden,
  mode = 'work',
}) {
  const circumference = 691.15;
  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;
  const strokeDashoffset = circumference * progress;

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const timeString = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  const isBreak = mode === 'shortBreak' || mode === 'longBreak';

  return (
    <div
      className={`relative w-full aspect-square max-w-[270px] mx-auto flex items-center justify-center transition-transform duration-700 ${
        isNavHidden ? 'scale-110' : 'scale-100'
      }`}
    >
      <svg className="w-full h-full -rotate-90 transform drop-shadow-sm" viewBox="0 0 260 260">
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
          className={`${
            isBreak ? 'text-[#4F7775]' : 'text-secondary'
          } transition-all duration-1000 ease-linear`}
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
          {timeString.split('').map((char, i) => (
            <AnimatedDigit key={i} char={char} isColon={char === ':'} />
          ))}
        </div>
      </div>
    </div>
  );
});

const MODE_TABS = [
  { key: 'work', label: 'Focus' },
  { key: 'shortBreak', label: 'Short Break' },
  { key: 'longBreak', label: 'Long Break' },
];

const soundscapes = [
  { id: 'none', label: 'Silent', Icon: VolumeX },
  { id: 'forest', label: 'Forest', Icon: Trees },
  { id: 'rain', label: 'Rain', Icon: CloudRain },
  { id: 'waves', label: 'Waves', Icon: Waves },
  { id: 'cafe', label: 'Cafe', Icon: Coffee },
  { id: 'clock', label: 'Ticking', Icon: Clock },
];

function TimerView({
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
  const [showSoundModal, setShowSoundModal] = useState(false);

  // Toggle Lottie every time user enters immersive fullscreen mode
  useEffect(() => {
    if (isRunning && isNavHidden) {
      setLottieIndex((prev) => (prev === 0 ? 1 : 0));
    }
  }, [isRunning, isNavHidden]);

  // Keep Lottie mounted during the 500ms exit fade-out transition, then unmount canvas for 0% CPU
  const isImmersive = isRunning && isNavHidden;
  const [shouldRenderLottie, setShouldRenderLottie] = useState(isImmersive);

  useEffect(() => {
    let t;
    if (isImmersive) {
      setShouldRenderLottie(true);
    } else {
      // Allow the 500ms CSS fade & collapse animation to finish before destroying the canvas
      t = setTimeout(() => {
        setShouldRenderLottie(false);
      }, 500);
    }
    return () => clearTimeout(t);
  }, [isImmersive]);

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
      className="flex flex-col h-[100dvh] w-full overflow-y-auto overflow-x-hidden transition-colors duration-700 ease-in-out bg-transparent text-text-main selection:bg-secondary/20"
      onClick={() => {
        if (showSoundModal) return;
        if (onToggleNav) onToggleNav();
      }}
    >
      <div className="w-full max-w-md mx-auto grid grid-rows-[auto_1fr_auto] min-h-[100dvh] px-6 pt-15 pb-[110px] select-none">
        {/* TOP SECTION (Mode Pill & Status) */}
        <div
          className={`grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[grid-template-rows,opacity] ${
            isNavHidden ? 'grid-rows-[0fr] opacity-0 pointer-events-none' : 'grid-rows-[1fr] opacity-100 pointer-events-auto'
          }`}
        >
          <div className="overflow-visible flex flex-col justify-end pointer-events-none">
            {/* Wrapper to restore pointer events for children */}
            <div className="pointer-events-auto">
              <div
                className="w-full bg-surface border border-border rounded-full p-1.5 flex items-center justify-between shadow-inner ring-1 ring-white/60 mb-4 relative"
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
                      className={`relative flex-1 py-2.5 px-3 rounded-full font-semibold text-xs md:text-sm transition-colors z-10 ${
                        on ? 'text-white' : 'text-[#444841] font-medium hover:text-primary'
                      }`}
                    >
                      {on && (
                        <motion.div
                          layoutId="timerModeTabPill"
                          className="absolute inset-0 bg-primary rounded-full shadow-xs ring-1 ring-white/20 z-[-1]"
                          transition={{ type: 'spring', bounce: 0.15, duration: 0.45 }}
                        />
                      )}
                      <span className="relative z-10">{label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Status Indicator */}
              <div className="flex items-center justify-center mb-2 h-7" onClick={stopProp}>
                {activeTask?.title ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border shadow-2xs ring-1 ring-white/70 max-w-[270px]">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isRunning ? 'bg-secondary shadow-xs animate-pulse' : 'bg-[#E5D9B6]'
                      }`}
                    ></span>
                    <span className="font-sans font-semibold text-xs text-primary truncate">
                      {activeTask.title}
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface/60 border border-border/60 text-text-sub text-[11px] font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D8D2C4] shrink-0"></span>
                    <span>Focus Session · General</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION (TIMER) */}
        <div className="flex flex-col items-center justify-center w-full relative">
          <TimerClockRing
            timeLeft={timeLeft}
            totalTime={totalTime}
            isNavHidden={isNavHidden}
            mode={mode}
          />

          {/* Immersive Animation */}
          <div
            className={`transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,opacity] transform-gpu flex justify-center items-center pointer-events-none overflow-hidden w-full ${
              isImmersive
                ? 'opacity-100 max-h-[380px] mt-8 scale-100 translate-y-0'
                : 'opacity-0 max-h-0 mt-0 scale-90 translate-y-4'
            }`}
          >
            {shouldRenderLottie && (
              <DotLottieReact
                key={currentLottie}
                src={currentLottie}
                loop
                autoplay
                className="w-full h-auto object-contain mix-blend-multiply opacity-90"
              />
            )}
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div
          className={`grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[grid-template-rows,opacity] ${
            isNavHidden ? 'grid-rows-[0fr] opacity-0 pointer-events-none' : 'grid-rows-[1fr] opacity-100 pointer-events-auto'
          }`}
        >
          <div className="transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden flex flex-col justify-start pointer-events-none p-6 -m-6">
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
                            ? `w-4 ${mode === 'work' ? 'bg-secondary' : 'bg-[#4F7775]'}`
                            : isDone
                            ? `w-1.5 ${mode === 'work' ? 'bg-secondary/60' : 'bg-[#4F7775]/60'}`
                            : 'w-1.5 bg-[#E5D9B6]'
                        }`}
                      ></span>
                    );
                  })}
                </div>
                <span
                  className={`font-sans text-[11px] font-bold tracking-wider uppercase ${
                    mode === 'work' ? 'text-secondary' : 'text-[#4F7775]'
                  }`}
                >
                  {getSubLabel()}
                </span>
              </div>

              {/* Elevated Controls Card */}
              <div
                className="w-full bg-surface border border-border rounded-3xl p-4 shadow-md ring-1 ring-white/80 flex flex-col gap-3"
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
                    className="w-12 h-12 rounded-full bg-canvas border border-border text-primary flex items-center justify-center shadow-xs ring-1 ring-white/60 transition-transform active:scale-95 hover:bg-border"
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
                    className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 ring-2 ring-white/25 transition-transform active:scale-90 hover:scale-105"
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
                    className="w-12 h-12 rounded-full bg-canvas border border-border text-primary flex items-center justify-center shadow-xs ring-1 ring-white/60 transition-transform active:scale-95 hover:bg-border"
                  >
                    <SkipForward size={20} strokeWidth={2.5} />
                  </button>
                </div>

                <div className="w-full h-px bg-border"></div>

                {/* Sound & Volume */}
                <div className="flex items-center justify-between text-[#444841] px-1 pb-0.5">
                  <div
                    onClick={() => {
                      if (window.navigator?.vibrate) window.navigator.vibrate(10);
                      setShowSoundModal(true);
                    }}
                    className="relative flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-full hover:bg-canvas transition-colors border border-transparent hover:border-border"
                  >
                    <Headphones size={18} className="text-secondary" />
                    <span className="text-sm font-semibold text-primary font-sans">
                      {soundscapes.find((s) => s.id === currentSound)?.label || 'Silent'}
                    </span>
                  </div>

                  <div
                    className={`flex items-center gap-2.5 ${
                      currentSound === 'none' ? 'opacity-40 pointer-events-none' : ''
                    }`}
                  >
                    {currentSound === 'none' ? (
                      <VolumeX size={16} className="text-text-sub" />
                    ) : (
                      <Volume2 size={16} className="text-secondary" />
                    )}
                    <div className="w-22 h-2 bg-[#EDE7DA] rounded-full overflow-hidden flex relative shadow-inner">
                      <div
                        className="h-full bg-secondary rounded-full transition-all duration-150"
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
                className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-surface border border-border shadow-xs ring-1 ring-white/70"
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
                  aria-label="Toggle strict mode"
                  onClick={() => {
                    iconRefs.current.lock?.startAnimation();
                    setTimeout(() => {
                      iconRefs.current.lock?.stopAnimation();
                    }, 600);
                    setTimeout(() => {
                      if (onToggleStrictMode) onToggleStrictMode();
                    }, 50);
                  }}
                  className={`relative w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-out cursor-pointer shadow-inner ${
                    strictMode ? 'bg-primary ring-1 ring-primary/40' : 'bg-[#DDD6C8]/80'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-surface shadow-xs ring-1 ring-black/5 transform transition-transform duration-200 ease-out ${
                      strictMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Soundscape Modal */}
      {showSoundModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fadeIn select-none"
            style={{
              background: 'rgba(25, 29, 21, 0.45)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            onClick={(e) => {
              e.stopPropagation();
              setShowSoundModal(false);
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <div
              className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-5 border border-border bg-surface shadow-2xl ring-1 ring-white/80"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between z-10 pb-2 border-b border-border">
                <span className="text-sm text-text-main font-sans font-bold">Select Soundscape</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSoundModal(false);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-hover text-text-sub hover:bg-border transition-colors active:scale-95"
                >
                  <XIcon size={18} strokeWidth={2.5} />
                </button>
              </div>

              <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto no-scrollbar pr-0.5">
                {soundscapes.map((s) => {
                  const isActive = s.id === currentSound;
                  const SoundIcon = s.Icon;
                  return (
                    <button
                      key={s.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.navigator?.vibrate) window.navigator.vibrate(10);
                        handleSelectSound(s.id);
                        setShowSoundModal(false);
                      }}
                      className={`flex items-center justify-between p-2.5 px-3 rounded-2xl border transition-all text-left ${
                        isActive
                          ? 'border-primary/80 bg-surface-hover shadow-xs ring-1 ring-white/50'
                          : 'border-border bg-surface hover:border-secondary shadow-2xs active:scale-[0.99]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            isActive
                              ? 'bg-primary text-white shadow-xs'
                              : 'bg-[#F4F1EA] text-[#636F5A]'
                          }`}
                        >
                          <SoundIcon size={16} strokeWidth={2.2} />
                        </div>
                        <span
                          className={`text-sm font-sans ${
                            isActive ? 'font-bold text-primary' : 'font-medium text-text-main'
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                      {isActive && (
                        <svg
                          fill="none"
                          height="18"
                          stroke="currentColor"
                          className="stroke-primary mr-1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          viewBox="0 0 24 24"
                          width="18"
                        >
                          <path d="M20 6L9 17l-5-5"></path>
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

export default React.memo(TimerView);
