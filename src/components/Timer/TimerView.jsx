import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  ChevronDown,
  X as CloseIcon,
} from 'lucide-react';
import {
  PlayIcon as Play,
  PauseIcon as Pause,
  RotateCcwIcon as RotateCcw,
  LockIcon as Lock,
  XIcon,
} from 'lucide-animated';
import { soundEngine } from '../../services/soundEngine';

const AnimatedDigit = ({ char, isColon, isLight = false }) => {
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
      className={`relative inline-flex items-center justify-center text-center h-[1.1em] overflow-hidden select-none ${
        isLight ? 'text-white' : 'text-text-main'
      }`}
      style={{ width: isColon ? '0.24em' : '0.56em' }}
    >
      {animating && (
        <span
          key={`out-${prev}`}
          className="absolute inset-0 flex items-center justify-center animate-tick-out pointer-events-none"
        >
          {prev}
        </span>
      )}
      <span
        key={`in-${curr}`}
        className={`absolute inset-0 flex items-center justify-center ${
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
  mode = 'work',
  cycleCount = 0,
}) {
  const radius = 126;
  const circumference = 2 * Math.PI * radius; // ~791.68
  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;
  const strokeDashoffset = circumference * (1 - progress);

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const timeString = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  const isBreak = mode === 'shortBreak' || mode === 'longBreak';
  const currentSessionNumber = (cycleCount % 4) + 1;

  // Subtitle with deliberate Bold vs Thin font interplay (Ref 4)
  const getSubLabel = () => {
    if (mode === 'work') {
      return `session ${currentSessionNumber} of 4 today`;
    }
    if (mode === 'shortBreak') {
      return 'Rest & recharge · 5 min';
    }
    return 'Deep recovery · 15 min';
  };

  return (
    <div className="relative w-full aspect-square max-w-[310px] mx-auto flex items-center justify-center select-none">
      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 290 290">
        {/* Subtle architectural track */}
        <circle
          className="text-track"
          cx="145"
          cy="145"
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth="3"
        />
        {/* Active progress stroke (Jade for focus, Mint for break) */}
        <circle
          className={`${
            isBreak ? 'text-mint' : 'text-secondary'
          } transition-all duration-1000 ease-linear`}
          cx="145"
          cy="145"
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>

      {/* Centerpiece typography and pips */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
        {/* Large Sculptural Numerals (Bold display numbers with tight, even spacing) */}
        <div className="text-[74px] sm:text-[88px] leading-none font-black tracking-tighter text-text-main font-display flex items-center justify-center overflow-hidden h-[80px] sm:h-[92px] tabular-nums">
          {timeString.split('').map((char, i) => (
            <AnimatedDigit key={i} char={char} isColon={char === ':'} />
          ))}
        </div>

        {/* Thin, quiet subtitle directly below (Bold vs Thin interplay from Ref 4) */}
        <p className="font-sans text-[13px] text-text-sub font-normal mt-2 tracking-wide text-center">
          {getSubLabel()}
        </p>

        {/* 4 Minimalist Horizon Pips */}
        <div className="flex items-center gap-1.5 mt-3">
          {[1, 2, 3, 4].map((n) => {
            const isCurrent = n === currentSessionNumber;
            const isDone = n < currentSessionNumber;
            return (
              <span
                key={n}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isCurrent
                    ? `w-4 ${isBreak ? 'bg-mint' : 'bg-secondary'}`
                    : isDone
                    ? `w-1.5 ${isBreak ? 'bg-mint/50' : 'bg-secondary/50'}`
                    : 'w-1.5 bg-track'
                }`}
              />
            );
          })}
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

  // Keep Lottie mounted during transition
  const isImmersive = isRunning && isNavHidden;
  const [shouldRenderLottie, setShouldRenderLottie] = useState(isImmersive);

  useEffect(() => {
    let t;
    if (isImmersive) {
      setShouldRenderLottie(true);
    } else {
      t = setTimeout(() => {
        setShouldRenderLottie(false);
      }, 500);
    }
    return () => clearTimeout(t);
  }, [isImmersive]);

  const handleSelectSound = (soundId) => {
    if (onSelectSound) onSelectSound(soundId);
    if (soundId === 'none') soundEngine.stop();
    else soundEngine.play(soundId, soundVolume);
  };

  const stopProp = (e) => e.stopPropagation();

  const currentLottie = (() => {
    if (mode === 'work') {
      return lottieIndex === 0 ? studyingLottie1 : studyingLottie2;
    } else {
      return lottieIndex === 0 ? relaxLottie : catSleepLottie;
    }
  })();

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const timeString = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;

  return (
    <div
      className="flex flex-col h-[100dvh] w-full overflow-y-auto overflow-x-hidden transition-colors duration-700 ease-in-out bg-transparent text-text-main selection:bg-secondary/20"
      onClick={() => {
        if (showSoundModal) return;
        if (onToggleNav) onToggleNav();
      }}
    >
      <div className="w-full max-w-md mx-auto flex flex-col justify-between min-h-[100dvh] px-6 pt-12 pb-[100px] select-none">
        {/* ── TOP SECTION: Balanced Header & Mode Tabs ── */}
        <header
          className={`flex flex-col gap-3 transition-all duration-500 will-change-transform ${
            isNavHidden
              ? 'opacity-0 -translate-y-4 pointer-events-none'
              : 'opacity-100 translate-y-0 pointer-events-auto'
          }`}
          onClick={stopProp}
        >
          {/* Symmetrical Balanced Header Bar */}
          <div className="flex items-center justify-between w-full pt-2">
            {/* Left: Active Task or Focus Session Badge */}
            {activeTask?.title ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border shadow-2xs max-w-[210px]">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isRunning ? 'bg-secondary animate-pulse' : 'bg-track'
                  }`}
                />
                <span className="font-sans font-bold text-xs text-text-main truncate">
                  {activeTask.title}
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-border shadow-2xs">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isRunning ? 'bg-secondary animate-pulse' : 'bg-track'
                  }`}
                />
                <span className="font-mono text-[10px] font-bold text-text-sub tracking-wider uppercase">
                  {isRunning ? 'FOCUSING' : 'SOLO_OS'}
                </span>
              </div>
            )}

            {/* Right: Strict Mode Quick Toggle */}
            <button
              aria-label="Toggle strict mode"
              onClick={() => {
                iconRefs.current.lock?.startAnimation();
                setTimeout(() => iconRefs.current.lock?.stopAnimation(), 600);
                setTimeout(() => onToggleStrictMode && onToggleStrictMode(), 50);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-colors border ${
                strictMode
                  ? 'bg-primary/10 border-primary/20 text-primary font-semibold'
                  : 'bg-surface border-border text-text-sub hover:text-text-main'
              }`}
            >
              {strictMode ? (
                <Lock
                  ref={(el) => (iconRefs.current.lock = el)}
                  animateOnHover={false}
                  size={12}
                  className="text-primary"
                />
              ) : (
                <Unlock size={12} className="text-text-sub" />
              )}
              <span className="font-mono text-[10px] tracking-wider uppercase">
                {strictMode ? 'STRICT' : 'NORMAL'}
              </span>
            </button>
          </div>

          {/* Segmented Mode Switcher */}
          <div className="w-full bg-surface/90 border border-border rounded-full p-1 flex items-center justify-between shadow-2xs ring-1 ring-white/70">
            {MODE_TABS.map(({ key, label }) => {
              const on = mode === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    if (window.navigator?.vibrate) window.navigator.vibrate(10);
                    if (onModeChange) onModeChange(key);
                  }}
                  className={`relative flex-1 py-1.5 px-3 rounded-full font-semibold text-xs transition-colors z-10 ${
                    on ? 'text-white' : 'text-text-sub font-medium hover:text-primary'
                  }`}
                >
                  {on && (
                    <motion.div
                      layoutId="timerModeTabPill"
                      className="absolute inset-0 bg-primary rounded-full shadow-xs ring-1 ring-white/20 z-[-1]"
                      transition={{ type: 'spring', bounce: 0.1, duration: 0.55 }}
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </button>
              );
            })}
          </div>
        </header>

        {/* ── MIDDLE SECTION (Sculptural Hero Timer + Clock Dial) ── */}
        <main className="flex flex-col items-center justify-center my-auto w-full py-4 relative">
          <TimerClockRing
            timeLeft={timeLeft}
            totalTime={totalTime}
            mode={mode}
            cycleCount={cycleCount}
          />
        </main>

        {/* ── BOTTOM SECTION: Controls & Soundscape Pill ── */}
        <footer
          className={`flex flex-col items-center gap-4 transition-all duration-500 will-change-transform ${
            isNavHidden
              ? 'opacity-0 translate-y-4 pointer-events-none'
              : 'opacity-100 translate-y-0 pointer-events-auto'
          }`}
          onClick={stopProp}
        >
          {/* Primary Action Horizon (Circular Hero Play + Flanking Controls) */}
          <div className="flex items-center justify-center gap-6">
            {/* Reset Button */}
            <button
              onClick={() => {
                if (window.navigator?.vibrate) window.navigator.vibrate(10);
                iconRefs.current.reset?.startAnimation();
                setTimeout(() => iconRefs.current.reset?.stopAnimation(), 600);
                setTimeout(() => onReset && onReset(), 50);
              }}
              aria-label="Reset timer"
              className="w-12 h-12 rounded-full bg-surface border border-border text-text-sub hover:text-text-main flex items-center justify-center shadow-2xs ring-1 ring-white/60 transition-transform active:scale-95"
            >
              <RotateCcw
                ref={(el) => (iconRefs.current.reset = el)}
                animateOnHover={false}
                size={18}
                strokeWidth={2.2}
              />
            </button>

            {/* Hero Circular Play/Pause (Deep Spruce in Focus, Vibrant Jade in Break) */}
            <button
              onClick={() => {
                if (window.navigator?.vibrate) window.navigator.vibrate(20);
                iconRefs.current.playPause?.startAnimation();
                setTimeout(() => iconRefs.current.playPause?.stopAnimation(), 600);
                setTimeout(() => onTogglePlay && onTogglePlay(), 50);
              }}
              aria-label={isRunning ? 'Pause timer' : 'Start timer'}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl ring-4 transition-all active:scale-90 hover:scale-105 text-white ${
                mode === 'work'
                  ? 'bg-primary hover:bg-primary-hover shadow-primary/25 ring-mint/40'
                  : 'bg-secondary hover:bg-secondary-hover shadow-secondary/25 ring-mint/30'
              }`}
            >
              {isRunning ? (
                <Pause
                  ref={(el) => (iconRefs.current.playPause = el)}
                  animateOnHover={false}
                  size={32}
                  className="fill-current"
                />
              ) : (
                <Play
                  ref={(el) => (iconRefs.current.playPause = el)}
                  animateOnHover={false}
                  size={32}
                  className="translate-x-0.5 fill-current"
                />
              )}
            </button>

            {/* Skip Button */}
            <button
              onClick={() => {
                if (window.navigator?.vibrate) window.navigator.vibrate(10);
                if (onSkip) onSkip();
              }}
              aria-label="Skip session"
              className="w-12 h-12 rounded-full bg-surface border border-border text-text-sub hover:text-text-main flex items-center justify-center shadow-2xs ring-1 ring-white/60 transition-transform active:scale-95"
            >
              <SkipForward size={18} strokeWidth={2.2} />
            </button>
          </div>

          {/* Floating Soundscape Capsule */}
          <div
            onClick={() => {
              if (window.navigator?.vibrate) window.navigator.vibrate(10);
              setShowSoundModal(true);
            }}
            className="w-full max-w-[280px] bg-surface/90 border border-border backdrop-blur-md rounded-full px-4 py-2 flex items-center justify-between shadow-2xs ring-1 ring-white/80 cursor-pointer hover:bg-surface transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Headphones size={15} className="text-secondary shrink-0" />
              <span className="text-xs font-semibold text-text-main truncate font-sans">
                {soundscapes.find((s) => s.id === currentSound)?.label || 'Silent'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 text-text-sub font-mono text-[10px] font-bold">
              {currentSound !== 'none' ? (
                <span className="flex items-center gap-1 text-secondary">
                  <Volume2 size={13} />
                  <span>{Math.round(soundVolume * 100)}%</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-text-sub/60">
                  <VolumeX size={13} />
                  <span>OFF</span>
                </span>
              )}
            </div>
          </div>
        </footer>
      </div>

      {/* ── FULL-BLEED LIVE FOCUS POSTER MODE ── */}
      <AnimatePresence>
        {isImmersive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex flex-col justify-between p-8 bg-canvas text-text-main select-none"
            onClick={stopProp}
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 45%, rgba(42, 131, 95, 0.08) 0%, transparent 65%)',
            }}
          >
            {/* Top Bar: • LIVE Focus Pill & Exit Button */}
            <div className="flex items-center justify-between w-full max-w-md mx-auto pt-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-border shadow-2xs font-mono text-[10px] font-bold text-text-main tracking-widest">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                <span>LIVE FOCUS</span>
              </div>
              <button
                onClick={() => {
                  if (onToggleNav) onToggleNav();
                }}
                aria-label="Exit fullscreen"
                className="w-9 h-9 rounded-full bg-surface border border-border text-text-sub hover:text-text-main flex items-center justify-center transition-colors shadow-2xs active:scale-95"
              >
                <CloseIcon size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Center: Monumental Swiss Display Numerals + Thin Subtitle */}
            <div className="flex flex-col items-center justify-center my-auto w-full max-w-md mx-auto">
              <div className="text-[100px] sm:text-[124px] font-black font-display leading-none tracking-tighter text-text-main tabular-nums flex items-center justify-center overflow-hidden h-[110px] sm:h-[132px]">
                {timeString.split('').map((char, i) => (
                  <AnimatedDigit key={i} char={char} isColon={char === ':'} isLight={false} />
                ))}
              </div>
              <p className="font-sans text-xs sm:text-sm text-text-sub font-normal mt-3 tracking-wide text-center">
                Focus mode on · Deep flow state
              </p>

              {/* Radiant Jade Horizon Progress Capsule */}
              <div className="w-40 h-1.5 bg-track/60 rounded-full overflow-hidden mt-6 shadow-inner">
                <div
                  className="h-full bg-secondary rounded-full transition-all duration-1000 ease-linear shadow-xs"
                  style={{
                    width: `${totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0}%`,
                  }}
                />
              </div>

              {/* Optional Subtle Lottie Animation in Immersive Mode */}
              {shouldRenderLottie && (
                <div className="w-48 h-36 mt-4 flex items-center justify-center overflow-hidden opacity-80 pointer-events-none">
                  <DotLottieReact
                    key={currentLottie}
                    src={currentLottie}
                    loop
                    autoplay
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>

            {/* Bottom: Solid Tactile Pause Button with Mint Ring */}
            <div className="flex justify-center pb-8 w-full max-w-md mx-auto">
              <button
                onClick={() => {
                  if (window.navigator?.vibrate) window.navigator.vibrate(20);
                  if (onTogglePlay) onTogglePlay();
                }}
                aria-label="Pause focus"
                className="w-16 h-16 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center active:scale-95 transition-all shadow-xl shadow-primary/25 ring-4 ring-mint/40"
              >
                <Pause size={28} className="fill-current" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SOUNDSCAPE & VOLUME MODAL ── */}
      {showSoundModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fadeIn select-none"
            style={{
              background: 'rgba(27, 31, 26, 0.5)',
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
              className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-4 border border-border bg-surface shadow-2xl ring-1 ring-white/80"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between z-10 pb-2 border-b border-border">
                <span className="text-sm text-text-main font-sans font-bold">
                  Soundscape & Volume
                </span>
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

              {/* Volume Slider Card */}
              <div className="flex flex-col gap-2 p-3 rounded-2xl bg-surface-hover/80 border border-border">
                <div className="flex items-center justify-between text-xs font-semibold text-text-main">
                  <span className="flex items-center gap-1.5">
                    <Volume2 size={14} className="text-secondary" />
                    <span>Ambient Volume</span>
                  </span>
                  <span className="font-mono text-[11px] text-text-sub font-bold">
                    {Math.round(soundVolume * 100)}%
                  </span>
                </div>
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
                  className="w-full accent-primary h-2 bg-track rounded-full cursor-pointer"
                />
              </div>

              {/* Soundscapes List */}
              <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto no-scrollbar pr-0.5">
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
                          ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20'
                          : 'border-border bg-surface hover:border-secondary shadow-2xs active:scale-[0.99]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            isActive
                              ? 'bg-primary text-white shadow-xs'
                              : 'bg-surface-hover text-text-sub'
                          }`}
                        >
                          <SoundIcon size={16} strokeWidth={2.2} />
                        </div>
                        <span
                          className={`text-sm font-sans ${
                            isActive ? 'font-bold text-text-main' : 'font-medium text-text-sub'
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
