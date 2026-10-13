import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import RollText from '../animata/text/roll-text';

export const PERIODS = ['All', 'Daily', 'Weekly', 'Monthly', 'Yearly'];

export const getDateRangeLabel = (p, off) => {
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
    <div className="flex flex-col gap-2.5 w-full">
      {/* Time Frame Segmented Track */}
      <div className="w-full bg-surface/90 p-1 rounded-full flex items-center justify-between border border-border shadow-2xs relative select-none">
        {PERIODS.map((p) => {
          const active = p === period;
          return (
            <button
              key={p}
              onClick={() => {
                if (window.navigator?.vibrate) window.navigator.vibrate(10);
                setPeriod(p);
                setOffset(0);
              }}
              className={`relative flex-1 py-1.5 text-center rounded-full text-xs transition-colors duration-200 ${
                active
                  ? 'text-white font-bold'
                  : 'text-text-sub font-medium hover:text-text-main'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="timeframe-period-pill"
                  className="absolute inset-0 bg-primary rounded-full shadow-xs ring-1 ring-white/20"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}
              <span className="relative z-10">{p}</span>
            </button>
          );
        })}
      </div>

      {/* Date Navigation Capsule */}
      <div
        className={`w-full bg-surface rounded-full px-3.5 py-1.5 flex items-center justify-between shadow-2xs ring-1 ring-white/80 border border-border transition-opacity ${
          isAll ? 'opacity-50 pointer-events-none' : 'opacity-100'
        }`}
      >
        <button
          onClick={() => {
            if (window.navigator?.vibrate) window.navigator.vibrate(10);
            setOffset((prev) => prev - 1);
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest text-text-sub font-mono hover:text-text-main hover:bg-canvas/60 active:scale-95 transition-all"
        >
          <ChevronLeft size={13} strokeWidth={2.5} />
          <span>PREV</span>
        </button>
        <RollText
          text={dateLabel}
          className="text-xs text-text-main font-bold tracking-tight font-display"
        />
        <button
          onClick={() => {
            if (window.navigator?.vibrate) window.navigator.vibrate(10);
            setOffset((prev) => Math.min(0, prev + 1));
          }}
          disabled={offset >= 0}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest font-mono transition-all ${
            offset >= 0
              ? 'text-text-sub/40 cursor-not-allowed'
              : 'text-text-sub hover:text-text-main hover:bg-canvas/60 active:scale-95'
          }`}
        >
          <span>NEXT</span>
          <ChevronRight size={13} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

export default React.memo(TimeframeHeader);
