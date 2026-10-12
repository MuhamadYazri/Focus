import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import successLottie from '../../assets/successfulTarget.lottie';

const CLOSE_ANIM_MS = 300;
const FALLBACK_MS = 45000; // safety net only; 3 bounce cycles of a 6s lottie ≈ 36s

/**
 * Compact goal-reached card, same style as the session-done alert.
 * `celebration` = { id, title, subtitle } | null. Closes when the lottie
 * finishes, after a fallback timeout, or on tap.
 */
export default function GoalCelebration({ celebration, onDone }) {
  const [closing, setClosing] = useState(false);
  const [lottieRef, setLottieRef] = useState(null);
  const closingRef = useRef(false);

  const close = () => {
    if (closingRef.current || !celebration) return;
    closingRef.current = true;
    setClosing(true);
    const id = celebration.id;
    setTimeout(() => onDone(id), CLOSE_ANIM_MS);
  };

  // Reset state for each new celebration + fallback timer
  useEffect(() => {
    if (!celebration) return undefined;
    closingRef.current = false;
    setClosing(false);
    const t = setTimeout(close, FALLBACK_MS);
    return () => clearTimeout(t);
  }, [celebration?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close when the animation finishes playing
  useEffect(() => {
    if (!lottieRef) return undefined;
    lottieRef.addEventListener('complete', close);
    return () => lottieRef.removeEventListener('complete', close);
  }, [lottieRef, celebration?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!celebration) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 select-none ${
        closing ? 'animate-fadeOut' : 'animate-fadeIn'
      }`}
      style={{
        background: 'rgba(25, 29, 21, 0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={close}
      role="status"
      aria-live="polite"
    >
      <div
        key={celebration.id}
        className={`bg-surface rounded-[28px] px-6 pt-4 pb-7 w-full max-w-md flex flex-col items-center text-center shadow-2xl ring-1 ring-white/80 border border-border ${
          closing ? 'animate-zoomOutAlert' : 'animate-zoomInAlert'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <DotLottieReact
          src={celebration.lottie || successLottie}
          autoplay
          loop
          loopCount={2} /* 2 extra replays = 3 cycles total */
          mode="bounce" /* forward, then reverse back to start (no jump-cut) */
          dotLottieRefCallback={setLottieRef}
          className="w-full h-auto mb-2 opacity-90 mix-blend-multiply"
        />
        <h2 className="text-[17px] font-bold text-text-main mb-1 font-display tracking-tight">
          {celebration.title}
        </h2>
        <p className="text-[12px] text-text-sub font-sans leading-relaxed">{celebration.subtitle}</p>
      </div>
    </div>,
    document.body
  );
}
