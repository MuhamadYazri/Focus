import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import errorIconLottie from '../../assets/errorIcon.lottie';

export default function StrictModeModal({ isOpen, onClose, onResetTimer }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none animate-fadeIn bg-black/25 backdrop-blur-xs">
      <div className="w-full max-w-[280px] bg-surface border border-border rounded-[28px] p-5 text-center flex flex-col items-center shadow-2xl ring-1 ring-white/80 relative animate-slideUp">
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
        <h3 className="text-[16px] font-bold text-text-main font-sans tracking-tight">
          Fokus Terputus
        </h3>
        <p className="text-[12px] text-text-sub font-sans leading-relaxed mt-1 mb-4 px-1">
          Kamu meninggalkan aplikasi saat sesi Strict Mode sedang berjalan.
        </p>

        {/* Actions */}
        <div className="w-full flex flex-col gap-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-full bg-primary text-white font-semibold text-[13px] font-sans shadow-md shadow-primary/25 ring-1 ring-white/20 hover:bg-primary-hover active:scale-95 transition-all"
          >
            Lanjutkan Fokus
          </button>

          <button
            onClick={() => {
              onResetTimer();
              onClose();
            }}
            className="w-full py-2 rounded-full text-text-sub hover:text-text-main font-medium text-[12px] font-sans active:scale-95 transition-all"
          >
            Menyerah &amp; Reset
          </button>
        </div>
      </div>
    </div>
  );
}

