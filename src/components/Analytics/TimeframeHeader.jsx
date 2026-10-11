import React from 'react';
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
      <div className="w-full bg-[#EDE7DA]/80 p-1 rounded-full flex items-center justify-between border border-border shadow-inner">
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
              className={`flex-1 py-1.5 text-center rounded-full text-xs transition-all ${
                active
                  ? 'bg-surface text-text-main shadow-xs ring-1 ring-white/80 font-semibold'
                  : 'text-[#444841] font-medium hover:text-text-main'
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>

      {/* Date Navigation Capsule */}
      <div
        className={`w-full bg-surface rounded-full px-4 py-2.5 flex items-center justify-between shadow-xs ring-1 ring-white/80 border border-border transition-opacity ${
          isAll ? 'opacity-50 pointer-events-none' : 'opacity-100'
        }`}
      >
        <button
          onClick={() => {
            if (window.navigator?.vibrate) window.navigator.vibrate(10);
            setOffset((prev) => prev - 1);
          }}
          className="flex items-center gap-1 text-[11px] font-bold tracking-wider text-[#444841] hover:text-text-main transition-colors active:scale-95"
        >
          <ChevronLeft size={15} strokeWidth={2.5} />
          <span className="tracking-widest uppercase">PREV</span>
        </button>
        <RollText
          text={dateLabel}
          className="text-xs text-text-main font-semibold tracking-tight font-sans"
        />
        <button
          onClick={() => {
            if (window.navigator?.vibrate) window.navigator.vibrate(10);
            setOffset((prev) => Math.min(0, prev + 1));
          }}
          disabled={offset >= 0}
          className={`flex items-center gap-1 text-[11px] font-bold tracking-wider transition-colors ${
            offset >= 0
              ? 'text-text-sub/50 cursor-not-allowed'
              : 'text-[#444841] hover:text-text-main active:scale-95'
          }`}
        >
          <span className="tracking-widest uppercase">NEXT</span>
          <ChevronRight size={15} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

export default React.memo(TimeframeHeader);
