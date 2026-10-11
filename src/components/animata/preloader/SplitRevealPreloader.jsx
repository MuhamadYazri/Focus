import React, { useEffect, useState } from 'react';

export default function SplitRevealPreloader({ onFinish }) {
  // phase: 'loading' -> 'text-out' -> 'reveal' -> 'done'
  const [phase, setPhase] = useState('loading');

  useEffect(() => {
    // 1. Show "FOCUS" text for 700ms
    const t1 = setTimeout(() => {
      setPhase('text-out');
    }, 750);

    // 2. Start splitting shutters after text slides out (250ms fade)
    const t2 = setTimeout(() => {
      setPhase('reveal');
    }, 1000);

    // 3. Mark preloader as completely done after shutters slide open (750ms duration)
    const t3 = setTimeout(() => {
      setPhase('done');
      if (onFinish) onFinish();
    }, 1750);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onFinish]);

  if (phase === 'done') return null;

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none select-none overscroll-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Top Shutter */}
      <div
        className={`absolute inset-x-0 top-0 h-1/2 bg-[#F4F1EA] transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] will-change-transform ${
          phase === 'reveal' ? '-translate-y-full' : 'translate-y-0'
        }`}
        style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}
      />

      {/* Bottom Shutter */}
      <div
        className={`absolute inset-x-0 bottom-0 h-1/2 bg-[#F4F1EA] transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] will-change-transform ${
          phase === 'reveal' ? 'translate-y-full' : 'translate-y-0'
        }`}
        style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}
      />

      {/* Center "FOCUS" Branding with vertical mask reveal */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300 ease-out z-10 ${
          phase === 'text-out' || phase === 'reveal'
            ? 'opacity-0 scale-95'
            : 'opacity-100 scale-100'
        }`}
      >
        <div className="overflow-hidden relative flex items-center justify-center h-14">
          <span
            className="text-2xl md:text-3xl font-extrabold tracking-[0.35em] text-[#40513B] font-sans uppercase animate-slideInUp block"
            style={{ animationDuration: '0.6s' }}
          >
            FOCUS
          </span>
        </div>
        <span
          className="text-[11px] tracking-[0.25em] text-[#747870] font-sans font-semibold uppercase mt-1 opacity-70 animate-fadeIn"
          style={{ animationDuration: '0.8s' }}
        >
          by Yazzzz
        </span>
      </div>
    </div>
  );
}
