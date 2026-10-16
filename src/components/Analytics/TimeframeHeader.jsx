import React, { startTransition } from 'react';

const PERIODS = ['All', 'Daily', 'Weekly', 'Monthly', 'Yearly'];

const getDateRangeLabel = (p, off) => {
  const d = new Date();
  if (p === 'Daily') {
    d.setDate(d.getDate() + off);
    const isToday = off === 0;
    const isYesterday = off === -1;
    const dateStr = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    if (isToday) return `Today (${dateStr})`;
    if (isYesterday) return `Yesterday (${dateStr})`;
    return dateStr;
  }
  if (p === 'Weekly') {
    const dayOfWeek = d.getDay() || 7;
    const mon = new Date(d);
    mon.setDate(d.getDate() - dayOfWeek + 1 + off * 7);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const mStr = mon.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const sStr = sun.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${mStr} – ${sStr}`;
  }
  if (p === 'Monthly') {
    const m = new Date(d.getFullYear(), d.getMonth() + off, 1);
    return m.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  if (p === 'Yearly') {
    return `${d.getFullYear() + off}`;
  }
  return 'All Time';
};

function TimeframeHeader({ period, setPeriod, offset, setOffset }) {
  const isAll = period === 'All';
  const dateLabel = getDateRangeLabel(period, offset);

  return (
    <div className="flex flex-col gap-3.5 w-full max-w-[400px] mx-auto select-none">
      {/* Time Frame Segmented Track from Figma: 400px x 33px #E8EDE6 */}
      <div className="w-full h-[33px] bg-[#E8EDE6] p-[4px] rounded-full flex items-center justify-between relative overflow-hidden">
        {/* Hardware-accelerated GPU sliding pill indicator (Zero getBoundingClientRect, zero layout reflow, INP < 30ms) */}
        {(() => {
          const activeIdx = PERIODS.indexOf(period);
          if (activeIdx !== -1) {
            return (
              <div
                aria-hidden="true"
                className="absolute top-[4px] bottom-[4px] w-[calc((100%-8px)/5)] bg-[#1B1F1A] rounded-full shadow-[0px_2px_6px_rgba(27,31,26,0.15)] pointer-events-none transition-transform duration-250 ease-[cubic-bezier(0.25,1,0.5,1)]"
                style={{
                  left: '4px',
                  transform: `translate3d(calc(${activeIdx} * 100%), 0, 0)`,
                  willChange: 'transform',
                }}
              />
            );
          }
          return null;
        })()}

        {PERIODS.map((p) => {
          const active = p === period;
          return (
            <button
              key={p}
              onClick={() => {
                if (window.navigator?.vibrate) window.navigator.vibrate(10);
                startTransition(() => {
                  setPeriod(p);
                  setOffset(0);
                });
              }}
              className={`tap-effect relative flex-1 h-[25px] px-2 text-center rounded-full text-[11px] leading-[15px] flex items-center justify-center transition-colors duration-150 z-10 select-none ${
                active ? 'font-bold text-white' : 'font-medium text-[#667463] hover:text-[#1B1F1A]'
              }`}
            >
              <span className="relative z-10">{p}</span>
            </button>
          );
        })}
      </div>

      {/* Date Navigation from Figma: ‹ PREV | Date Label | NEXT › */}
      <div
        className={`w-full h-[30px] px-0.5 flex items-center justify-between transition-opacity ${
          isAll ? 'opacity-40 pointer-events-none' : 'opacity-100'
        }`}
      >
        <button
          onClick={() => {
            if (window.navigator?.vibrate) window.navigator.vibrate(10);
            startTransition(() => {
              setOffset((prev) => prev - 1);
            });
          }}
          className="tap-effect h-[26px] px-2.5 bg-[#E8EDE6] rounded-full text-[10px] leading-none font-bold tracking-[0.8px] text-[#667463] hover:text-[#1B1F1A] flex items-center justify-center gap-1.5 transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 256 512"
            fill="currentColor"
            aria-hidden="true"
            className="h-2.5 w-auto shrink-0"
          >
            <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" />
          </svg>
          <span>PREV</span>
        </button>

        <span className="text-[13px] font-extrabold leading-[18px] tracking-[-0.4px] text-[#1B1F1A] font-sans">
          {dateLabel}
        </span>

        <button
          onClick={() => {
            if (window.navigator?.vibrate) window.navigator.vibrate(10);
            startTransition(() => {
              setOffset((prev) => Math.min(0, prev + 1));
            });
          }}
          disabled={offset >= 0}
          className={`tap-effect h-[26px] px-2.5 bg-[#E8EDE6] rounded-full text-[10px] leading-none font-bold tracking-[0.8px] flex items-center justify-center gap-1.5 transition-all ${
            offset >= 0
              ? 'text-[#5F6C5C]/40 cursor-not-allowed'
              : 'text-[#667463] hover:text-[#1B1F1A]'
          }`}
        >
          <span>NEXT</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 256 512"
            fill="currentColor"
            aria-hidden="true"
            className="h-2.5 w-auto shrink-0"
          >
            <path d="M247.1 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L179.2 256 41.9 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default React.memo(TimeframeHeader);
