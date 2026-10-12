import React, { useEffect, useRef } from 'react';

export default function SplitRevealPreloader({ onFinish }) {
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    // 1.4s total continuous choreographed animation on GPU compositor
    const timer = setTimeout(() => {
      if (onFinishRef.current) onFinishRef.current();
    }, 1420);

    return () => clearTimeout(timer);
  }, []); // Run strictly once on mount

  return (
    <div
      className="fixed inset-0 z-[9999] pointer-events-none select-none overscroll-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Top Shutter */}
      <div className="absolute inset-x-0 top-0 h-1/2 bg-[#F4F1EA] animate-shutter-top-split" />

      {/* Bottom Shutter */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[#F4F1EA] animate-shutter-bottom-split" />

      {/* Center "FOCUS" Branding (Runs continuous fluid animation once) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none animate-split-text-flow">
        <div className="overflow-hidden relative flex items-center justify-center">
          <span className="text-3xl font-extrabold tracking-[0.35em] text-[#40513B] font-sans uppercase block">
            FOCUS
          </span>
        </div>
        <span className="text-[11px] tracking-[0.25em] text-[#747870] font-sans font-semibold uppercase mt-1 opacity-70">
          by Yazzzz
        </span>
      </div>
    </div>
  );
}
