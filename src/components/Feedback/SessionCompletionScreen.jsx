import React, { useEffect, useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import { ArrowRight } from 'lucide-react';
import successLottie from '../../assets/successfulTarget.lottie';
import relaxLottie from '../../assets/relaxAnimation.lottie';
import clockTickingLottie from '../../assets/clockTicking.lottie';

/**
 * Dedicated Full-Screen Celebration View for completed focus sessions, breaks, or daily goals.
 * Replaces the modal overlay with an unhurried, serene, full-screen milestone experience.
 */
export default function SessionCompletionScreen({ celebration, onDismiss, onPrimaryAction }) {
  const [closing, setClosing] = useState(false);

  const celebrationId = celebration?.id;

  useEffect(() => {
    if (!celebrationId) return;
    setClosing(false);
  }, [celebrationId]);

  if (!celebration) return null;

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      if (onDismiss) onDismiss(celebration.id);
    }, 240);
  };

  const handleAction = () => {
    setClosing(true);
    setTimeout(() => {
      if (onPrimaryAction) {
        onPrimaryAction(celebration);
      } else if (onDismiss) {
        onDismiss(celebration.id);
      }
    }, 240);
  };

  const isBreak =
    celebration.type === 'break' || celebration.title?.toLowerCase().includes('break');
  const isGoal = celebration.type === 'goal' || celebration.title?.toLowerCase().includes('goal');
  const isFocus = !isBreak && !isGoal;

  // Select appropriate aesthetic lottie animation
  let animationSrc = celebration.lottie;
  if (!animationSrc) {
    if (isBreak) animationSrc = relaxLottie;
    else if (isGoal) animationSrc = successLottie;
    else animationSrc = successLottie || clockTickingLottie;
  }

  // Primary button copy
  let primaryBtnText = 'Continue';
  if (isFocus) {
    primaryBtnText = celebration.autoStarted ? 'Continue to Break' : 'Start Break';
  } else if (isBreak) {
    primaryBtnText = celebration.autoStarted ? 'Continue to Focus' : 'Start Next Focus';
  } else if (isGoal) {
    primaryBtnText = 'Keep Going';
  }

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-label={celebration.title}
      className={`fixed inset-0 z-[100] bg-[#F0F2EF] text-[#1B1F1A] flex flex-col justify-between select-none overflow-y-auto px-6 py-8 transition-opacity duration-240 ${
        closing ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ willChange: 'opacity' }}
    >
      {/* ── Center Stage: Lottie, Hero Typography & Stats Card ── */}
      <div className="w-full max-w-md mx-auto flex flex-col items-center text-center my-auto py-6">
        {/* Lottie Animation */}
        <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center relative mb-4">
          <DotLottieReact
            src={animationSrc}
            autoplay
            loop
            loopCount={3}
            mode="bounce"
            className="w-full h-full object-contain mix-blend-multiply"
          />
        </div>

        {/* Milestone Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B1F1A] tracking-tight font-display mb-1.5">
          {celebration.title}
        </h1>

        {/* Subtitle */}
        <p className="text-[13px] sm:text-[14px] text-[#667463] max-w-xs leading-relaxed font-sans mb-5">
          {celebration.subtitle}
        </p>
      </div>

      {/* ── Action Footer ── */}
      <footer className="w-full max-w-md mx-auto flex flex-col gap-2 pb-2">
        <button
          type="button"
          onClick={handleAction}
          className="tap-effect w-full h-[52px] rounded-full bg-[#1B1F1A] text-white font-bold text-[14px] shadow-sm flex items-center justify-center gap-2 hover:bg-[#40513B] transition-colors cursor-pointer"
        >
          <span>{primaryBtnText}</span>
          <ArrowRight size={16} />
        </button>

        <button
          type="button"
          onClick={handleClose}
          className="tap-effect py-2 text-[12px] font-medium text-[#667463] hover:text-[#1B1F1A] transition-colors cursor-pointer text-center"
        >
          Return to Dashboard
        </button>
      </footer>
    </section>
  );
}
