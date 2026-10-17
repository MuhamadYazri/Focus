import React from 'react';
import { createPortal } from 'react-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import errorIconLottie from '../../assets/errorIcon.lottie';

export default function StrictModeModal({ isOpen, onClose, onResetTimer }) {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 select-none animate-fadeIn"
      style={{
        background: 'rgba(26, 31, 24, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[280px] bg-surface border border-[#263124] rounded-[28px] p-5 text-center flex flex-col items-center shadow-2xl ring-1 ring-white/10 dark:ring-white/5 relative animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Error Lottie */}
        <div className="w-16 h-16 flex items-center justify-center mb-1">
          <DotLottieReact
            src={errorIconLottie}
            autoplay
            loop={false}
            className="w-full h-full"
          />
        </div>

        {/* Tag & Heading */}
        <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-primary/70 bg-primary/10 px-2.5 py-0.5 rounded-full mb-1.5 shadow-2xs">
          STRICT MODE
        </span>
        <h3 className="text-[17px] font-bold text-text-main font-display tracking-tight">
          Focus Interrupted
        </h3>
        <p className="text-[12px] text-text-sub font-sans leading-relaxed mt-1 mb-4 px-1">
          You left the app while a Strict Mode session was in progress.
        </p>

        {/* Actions */}
        <div className="w-full flex flex-col gap-2">
          <button
            onClick={() => {
              if (window.navigator?.vibrate) window.navigator.vibrate(10);
              onClose();
            }}
            className="w-full py-2.5 rounded-full bg-primary text-[#121512] dark:text-[#121512] font-semibold text-[13px] font-sans shadow-md shadow-primary/25 hover:bg-primary-hover active:scale-95 transition-all"
          >
            Resume Focus
          </button>

          <button
            onClick={() => {
              if (window.navigator?.vibrate) window.navigator.vibrate(20);
              onResetTimer();
              onClose();
            }}
            className="w-full py-2 rounded-full text-text-sub hover:text-[#BA1A1A] font-medium text-[12px] font-sans active:scale-95 transition-all"
          >
            Give Up &amp; Reset
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
