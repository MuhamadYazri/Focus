import React, { useMemo } from 'react';
import { Sunrise, Sun, Sunset, Moon, Clock } from 'lucide-react';

const BUCKETS = [
  {
    id: 'morning',
    label: 'Morning',
    timeRange: '06:00 – 12:00',
    Icon: Sunrise,
    color: 'var(--theme-primary)',
    startH: 6,
    endH: 12,
  },
  {
    id: 'afternoon',
    label: 'Afternoon',
    timeRange: '12:00 – 18:00',
    Icon: Sun,
    color: 'var(--theme-secondary)',
    startH: 12,
    endH: 18,
  },
  {
    id: 'evening',
    label: 'Evening',
    timeRange: '18:00 – 23:00',
    Icon: Sunset,
    color: '#B08968',
    startH: 18,
    endH: 23,
  },
  {
    id: 'night',
    label: 'Night',
    timeRange: '23:00 – 06:00',
    Icon: Moon,
    color: '#6C757D',
    startH: 23,
    endH: 6,
  },
];

export default function PeakFocusCard({ filteredSessions = [], allSessions = [] }) {
  // Use filtered sessions if available; otherwise fall back to all sessions to still offer value
  const sessionsToAnalyze = filteredSessions.length > 0 ? filteredSessions : allSessions;

  const analysis = useMemo(() => {
    const bucketMins = { morning: 0, afternoon: 0, evening: 0, night: 0 };
    let totalMins = 0;

    sessionsToAnalyze.forEach((s) => {
      const dur = s.duration || 25;
      totalMins += dur;

      if (!s.completedAt) {
        bucketMins.morning += dur;
        return;
      }

      try {
        const dt = new Date(s.completedAt);
        const h = dt.getHours();

        if (h >= 6 && h < 12) {
          bucketMins.morning += dur;
        } else if (h >= 12 && h < 18) {
          bucketMins.afternoon += dur;
        } else if (h >= 18 && h < 23) {
          bucketMins.evening += dur;
        } else {
          bucketMins.night += dur;
        }
      } catch {
        bucketMins.morning += dur;
      }
    });

    const segments = BUCKETS.map((b) => {
      const mins = bucketMins[b.id] || 0;
      const pct = totalMins > 0 ? Math.round((mins / totalMins) * 100) : 0;
      return {
        ...b,
        mins,
        pct,
      };
    });

    let peak = segments[0];
    segments.forEach((seg) => {
      if (seg.mins > peak.mins) {
        peak = seg;
      }
    });

    return {
      totalMins,
      segments,
      peak: peak.mins > 0 ? peak : null,
      isFallback: filteredSessions.length === 0 && allSessions.length > 0,
    };
  }, [sessionsToAnalyze, filteredSessions, allSessions]);

  const PeakIcon = analysis.peak ? analysis.peak.Icon : Clock;

  return (
    <div className="bg-surface rounded-2xl p-4 shadow-xs border border-border ring-1 ring-white/80 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] uppercase tracking-wider text-secondary font-bold font-sans">
          PEAK FOCUS WINDOW
        </span>
        {analysis.isFallback && (
          <span className="text-[10px] text-text-sub font-medium font-sans">
            Based on all-time
          </span>
        )}
      </div>

      {/* Hero Insight Pill */}
      {analysis.peak ? (
        <div className="bg-canvas/50 rounded-xl p-3 border border-border/60 flex items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
              style={{
                backgroundColor: `${analysis.peak.color}15`,
                color: analysis.peak.color,
              }}
            >
              <PeakIcon size={18} strokeWidth={2.2} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-text-main font-sans truncate">
                {analysis.peak.label} Peak ({analysis.peak.pct}%)
              </span>
              <span className="text-[11px] text-text-sub font-sans">
                Best flow: {analysis.peak.timeRange}
              </span>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0 font-sans border border-primary/20">
            Flow Zone
          </span>
        </div>
      ) : (
        <div className="bg-canvas/40 rounded-xl p-3 border border-border/60 text-center mb-3.5 text-xs text-text-sub font-sans">
          Complete your first focus sessions to reveal your natural flow rhythm.
        </div>
      )}

      {/* 4-Period Rhythm Breakdown */}
      <div className="grid grid-cols-2 gap-2.5">
        {analysis.segments.map((seg) => {
          const Icon = seg.Icon;
          const isPeak = analysis.peak && analysis.peak.id === seg.id;
          return (
            <div
              key={seg.id}
              className={`rounded-xl p-2.5 flex flex-col gap-1.5 border transition-all ${
                isPeak
                  ? 'bg-canvas/70 border-border shadow-2xs'
                  : 'bg-canvas/30 border-border/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-sans">
                <div className="flex items-center gap-1.5 text-text-main font-medium">
                  <Icon size={13} style={{ color: seg.color }} />
                  <span className="text-[11px]">{seg.label}</span>
                </div>
                <span className="text-[11px] font-bold text-text-main font-sans">
                  {seg.pct}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-border/50 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${seg.pct}%`,
                    backgroundColor: seg.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
