import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Minimize2,
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
  const radius = 135;
  const circumference = 2 * Math.PI * radius; // ~848.23
  const progress = totalTime > 0 ? (totalTime - timeLeft) / totalTime : 0;
  const strokeDashoffset = circumference * (1 - progress);

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  const timeString = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  const isBreak = mode === 'shortBreak' || mode === 'longBreak';
  const currentSessionNumber = (cycleCount % 4) + 1;

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
    <div className="relative w-[310px] h-[310px] mx-auto flex items-center justify-center select-none">
      <svg className="w-[310px] h-[310px] -rotate-90 transform" viewBox="0 0 310 310">
        {/* Subtle architectural track from Figma: 2.5px solid #CBD7C9 */}
        <circle
          cx="155"
          cy="155"
          r={radius}
          fill="transparent"
          stroke="#CBD7C9"
          strokeWidth="2.5"
        />
        {/* Active progress stroke from Figma: 2.8px solid #41493F */}
        <circle
          className="transition-all duration-1000 ease-linear"
          cx="155"
          cy="155"
          r={radius}
          fill="transparent"
          stroke={isBreak ? '#8B9E87' : '#41493F'}
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>

      {/* Centerpiece typography and pips */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
        {/* Large Numerals: 80px font-black Manrope, line-height 88px, letter-spacing -4px */}
        <div className="text-[80px] leading-[88px] font-black tracking-[-4px] text-[#1B1F1A] font-sans flex items-center justify-center overflow-hidden h-[88px] tabular-nums">
          {timeString.split('').map((char, i) => (
            <AnimatedDigit key={i} char={char} isColon={char === ':'} />
          ))}
        </div>

        {/* Subtitle from Figma: 12px 400 line-height 18px letter-spacing 0.1px #8B9E87 */}
        <p className="font-sans text-[12px] leading-[18px] tracking-[0.1px] text-[#8B9E87] font-normal mt-2.5 text-center">
          {getSubLabel()}
        </p>

        {/* 4 Horizon Dots from Figma: Active dot 18x5px #41493F, Inactive 5x5px #CBD7C9 */}
        <div className="flex items-center gap-[5px] mt-2.5">
          {[1, 2, 3, 4].map((n) => {
            const isCurrent = n === currentSessionNumber;
            const isDone = n < currentSessionNumber;
            return (
              <span
                key={n}
                className={`h-[5px] rounded-full transition-all duration-300 ${
                  isCurrent
                    ? `w-[18px] ${isBreak ? 'bg-[#667463]' : 'bg-[#41493F]'}`
                    : isDone
                    ? `w-[5px] ${isBreak ? 'bg-[#667463]' : 'bg-[#41493F]'}`
                    : 'w-[5px] bg-[#CBD7C9]'
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
  activeTask: _activeTask,
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
  const [showSoundModal, setShowSoundModal] = useState(false);

  // Fullscreen immersive mode is active whenever navigation is hidden
  const isImmersive = isNavHidden;

  const handleSelectSound = (soundId) => {
    if (onSelectSound) onSelectSound(soundId);
    if (soundId === 'none') soundEngine.stop();
    else soundEngine.play(soundId, soundVolume);
  };

  const [previewMode, setPreviewMode] = useState(null);

  // When timer stops or mode changes from parent, sync preview
  useEffect(() => {
    if (!isRunning) {
      setPreviewMode(null);
    }
  }, [isRunning, mode]);

  const activeTabMode = previewMode || mode;
  const isPreviewingDifferentMode = isRunning && previewMode && previewMode !== mode;

  const stopProp = (e) => e.stopPropagation();
  const lastNavToggleRef = useRef(0);

  const safeToggleNav = () => {
    const now = Date.now();
    if (now - lastNavToggleRef.current < 450) return;
    lastNavToggleRef.current = now;
    if (onToggleNav) onToggleNav();
  };

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-y-auto overflow-x-hidden transition-colors duration-700 ease-in-out bg-transparent text-text-main selection:bg-secondary/20">
      <div className="w-full max-w-[440px] mx-auto flex flex-col justify-between min-h-[100dvh] px-7 pt-[52px] pb-[100px] select-none">
        {/* ── TOP SECTION: Mode Tabs & Strict Mode ── */}
        <header
          className={`flex flex-col gap-4 transition-all duration-500 will-change-transform ${
            isNavHidden
              ? 'opacity-0 -translate-y-4 pointer-events-none'
              : 'opacity-100 translate-y-0 pointer-events-auto'
          }`}
          onClick={stopProp}
        >
          {/* Segmented Mode Switcher from Figma: 384px x 36px #E4EAE2 border #CBD7C9 */}
          <div className="w-full max-w-[384px] mx-auto h-[36px] bg-[#E4EAE2] border border-[#CBD7C9] rounded-full p-[3px] flex items-center justify-between shadow-[0px_1px_2px_rgba(27,31,26,0.03)]">
            {MODE_TABS.map(({ key, label }) => {
              const on = activeTabMode === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    if (window.navigator?.vibrate) window.navigator.vibrate(10);
                    if (isRunning) {
                      // While running, do NOT interrupt running timer: just set preview tab
                      if (key === mode) {
                        setPreviewMode(null);
                      } else {
                        setPreviewMode(key);
                      }
                    } else {
                      setPreviewMode(null);
                      if (onModeChange) onModeChange(key);
                    }
                  }}
                  className={`relative flex-1 h-[30px] rounded-full text-[12px] leading-[16px] transition-all flex items-center justify-center z-10 ${
                    on
                      ? 'font-bold text-white shadow-[0px_0px_0px_1px_rgba(255,255,255,0.13),0px_1px_4px_-1px_rgba(27,31,26,0.09)]'
                      : 'font-medium text-[#667463] hover:text-[#1B1F1A]'
                  }`}
                >
                  {on && (
                    <motion.div
                      layoutId="timerModeTabPill"
                      className={`absolute inset-0 rounded-full z-[-1] ${
                        isPreviewingDifferentMode ? 'bg-[#5F6C5C]' : 'bg-[#41493F]'
                      }`}
                      transition={{
                        type: 'spring',
                        stiffness: 420,
                        damping: 32,
                        mass: 0.8,
                      }}
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Strict Mode Toggle (Right aligned under tabs from Figma) */}
          <div className="w-full max-w-[384px] mx-auto flex items-center justify-end">
            <button
              aria-label="Toggle strict mode"
              onClick={() => {
                iconRefs.current.lock?.startAnimation();
                setTimeout(() => iconRefs.current.lock?.stopAnimation(), 600);
                setTimeout(() => onToggleStrictMode && onToggleStrictMode(), 50);
              }}
              className="h-[20px] px-2.5 bg-white border border-[#CBD7C9] rounded-full flex items-center gap-[5px] transition-colors"
            >
              {strictMode ? (
                <Lock
                  ref={(el) => (iconRefs.current.lock = el)}
                  animateOnHover={false}
                  size={11}
                  className="text-[#41493F]"
                />
              ) : (
                <Unlock size={11} className="text-[#5F6C5C]" />
              )}
              <span className="text-[9px] font-bold leading-[12px] tracking-[0.8px] text-[#5F6C5C] uppercase font-sans">
                {strictMode ? 'STRICT' : 'NORMAL'}
              </span>
            </button>
          </div>
        </header>

        {/* ── MIDDLE SECTION: Circular Hero Timer ── */}
        <main
          className="flex flex-col items-center justify-center my-auto w-full py-4 relative cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (isRunning && mode === 'work') {
              safeToggleNav();
            }
          }}
        >
          <TimerClockRing
            timeLeft={timeLeft}
            totalTime={totalTime}
            mode={mode}
            cycleCount={cycleCount}
          />
        </main>

        {/* ── BOTTOM SECTION: Controls & Soundscape Capsule ── */}
        <footer
          className={`flex flex-col items-center gap-5 transition-all duration-500 will-change-transform ${
            isNavHidden
              ? 'opacity-0 translate-y-4 pointer-events-none'
              : 'opacity-100 translate-y-0 pointer-events-auto'
          }`}
          onClick={stopProp}
        >
          {/* Controls from Figma: Reset 44px, Start 72px, Skip 44px */}
          <div className="flex items-center justify-center gap-5">
            {/* Reset Button */}
            <button
              onClick={() => {
                if (window.navigator?.vibrate) window.navigator.vibrate(10);
                iconRefs.current.reset?.startAnimation();
                setTimeout(() => iconRefs.current.reset?.stopAnimation(), 600);
                setTimeout(() => onReset && onReset(), 50);
              }}
              aria-label="Reset timer"
              className="tap-effect w-[44px] h-[44px] rounded-full bg-white border border-[#D6E0D4] text-[#667463] hover:text-[#1B1F1A] flex items-center justify-center shadow-[0px_1px_2px_rgba(27,31,26,0.04)]"
            >
              <RotateCcw
                ref={(el) => (iconRefs.current.reset = el)}
                animateOnHover={false}
                size={17}
                strokeWidth={2}
              />
            </button>

            {/* Play/Pause Button from Figma: 72x72 bg #1B1F1A with subtle mint ring */}
            <button
              onClick={() => {
                if (window.navigator?.vibrate) window.navigator.vibrate(20);
                iconRefs.current.playPause?.startAnimation();
                setTimeout(() => iconRefs.current.playPause?.stopAnimation(), 600);
                setTimeout(() => {
                  if (onTogglePlay) onTogglePlay(previewMode);
                  setPreviewMode(null);
                }, 50);
              }}
              aria-label={
                isPreviewingDifferentMode
                  ? `Switch and start ${MODE_TABS.find((t) => t.key === previewMode)?.label || 'mode'}`
                  : isRunning
                  ? 'Pause timer'
                  : 'Start timer'
              }
              className="tap-effect w-[72px] h-[72px] rounded-full bg-[#1B1F1A] text-white flex items-center justify-center shadow-[0px_0px_0px_3px_rgba(214,243,208,0.2),0px_8px_20px_-4px_rgba(27,31,26,0.125)] transition-all active:scale-90 hover:scale-105"
            >
              {isRunning && !isPreviewingDifferentMode ? (
                <Pause
                  ref={(el) => (iconRefs.current.playPause = el)}
                  animateOnHover={false}
                  size={28}
                  className="fill-current text-white"
                />
              ) : (
                <Play
                  ref={(el) => (iconRefs.current.playPause = el)}
                  animateOnHover={false}
                  size={28}
                  className="translate-x-0.5 fill-current text-white"
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
              className="tap-effect w-[44px] h-[44px] rounded-full bg-white border border-[#D6E0D4] text-[#667463] hover:text-[#1B1F1A] flex items-center justify-center shadow-[0px_1px_2px_rgba(27,31,26,0.04)]"
            >
              <SkipForward size={17} strokeWidth={2} />
            </button>
          </div>

          {/* Floating Soundscape Capsule from Figma: 264px x 32px */}
          <div
            onClick={() => {
              if (window.navigator?.vibrate) window.navigator.vibrate(10);
              setShowSoundModal(true);
            }}
            className="w-full max-w-[264px] h-[32px] bg-white border border-[#D6E0D4] backdrop-blur-md rounded-full px-3.5 flex items-center justify-between shadow-[0px_1px_2px_rgba(27,31,26,0.03)] cursor-pointer hover:bg-white/95 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-2 truncate">
              <Headphones size={14} className="text-[#667463] shrink-0" />
              <span className="text-[12px] leading-[16px] font-semibold text-[#1B1F1A] truncate font-sans">
                {soundscapes.find((s) => s.id === currentSound)?.label || 'Silent'}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0 text-[#8B9E87] font-sans text-[10px] leading-[14px] font-bold">
              {currentSound !== 'none' ? (
                <span className="flex items-center gap-1 text-[#667463]">
                  <Volume2 size={12} />
                  <span>{Math.round(soundVolume * 100)}%</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[#8B9E87]">
                  <VolumeX size={12} />
                  <span>OFF</span>
                </span>
              )}
            </div>
          </div>
        </footer>
      </div>

      {/* ── FULLSCREEN MINIMALIST TIMER (Image 1 & Figma CSS) ── */}
      <AnimatePresence>
        {isImmersive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex flex-col justify-between px-7 pt-12 pb-12 bg-[#F0F2EF] text-[#1B1F1A] select-none cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              safeToggleNav();
            }}
            onTouchEnd={(e) => {
              if (e.target.closest('button') || e.target.closest('[role="button"]')) return;
              e.stopPropagation();
              safeToggleNav();
            }}
          >
            {/* Top Bar with Minimalist Back/Minimize Button */}
            <div className="w-full max-w-[384px] mx-auto flex items-center justify-between pointer-events-auto"></div>

            {/* Minimalist Hero Section with Stacked 168px Numerals from Figma */}
            <div className="w-full max-w-[384px] mx-auto flex flex-col justify-start pt-4 pointer-events-none">
              {/* Row 1: Minutes (168px font-weight 800 Manrope, line-height 148px, letter-spacing -8px, color #1B1F1A) */}
              <div className="w-full flex items-baseline">
                <span className="text-[168px] leading-[148px] font-extrabold tracking-[-8px] text-[#1B1F1A] font-sans">
                  {m < 10 ? `0${m}` : m}
                </span>
              </div>

              {/* Divider: 1px height #CBD7C9 */}
              <div className="w-full h-[1px] bg-[#CBD7C9] my-2" />

              {/* Row 2: Seconds (168px font-weight 800 Manrope, line-height 148px, letter-spacing -8px, color #41493F) */}
              <div className="w-full flex items-baseline">
                <span className="text-[168px] leading-[148px] font-extrabold tracking-[-8px] text-[#41493F] font-sans">
                  {s < 10 ? `0${s}` : s}
                </span>
              </div>

              {/* MIN · SEC Subtitle */}
              <div className="pt-2">
                <span className="text-[10px] font-bold uppercase tracking-[2px] text-[#8B9E87]">
                  MIN · SEC
                </span>
              </div>

              {/* Session Status & Indicator Dots */}
              <div className="pt-14">
                <p className="text-[12px] font-normal leading-[18px] text-[#667463]">
                  session {(cycleCount % 4) + 1} of 4 today
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="w-4 h-[3px] bg-[#41493F] rounded-full" />
                  <span className="w-1 h-1 bg-[#CBD7C9] rounded-full" />
                  <span className="w-1 h-1 bg-[#CBD7C9] rounded-full" />
                  <span className="w-1 h-1 bg-[#CBD7C9] rounded-full" />
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar from Image 1: PAUSE · · · END */}
            <div
              className="w-full max-w-[384px] mx-auto flex items-center justify-between pb-6 cursor-default"
              onClick={stopProp}
            >
              <button
                onClick={(e) => {
                  stopProp(e);
                  if (window.navigator?.vibrate) window.navigator.vibrate(20);
                  if (onTogglePlay) onTogglePlay();
                }}
                className="text-[11px] font-bold uppercase tracking-[2px] text-[#1B1F1A] hover:opacity-70 transition-opacity"
              >
                {isRunning ? 'PAUSE' : 'RESUME'}
              </button>

              <button
                onClick={(e) => {
                  stopProp(e);
                  setShowSoundModal(true);
                }}
                className="text-[#8B9E87] hover:text-[#1B1F1A] transition-colors tracking-widest text-[14px]"
                aria-label="Sound options"
              >
                · · ·
              </button>

              <button
                onClick={(e) => {
                  stopProp(e);
                  if (window.navigator?.vibrate) window.navigator.vibrate(10);
                  if (onSkip) onSkip();
                }}
                className="text-[11px] font-bold uppercase tracking-[2px] text-[#1B1F1A] hover:opacity-70 transition-opacity"
              >
                END
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
