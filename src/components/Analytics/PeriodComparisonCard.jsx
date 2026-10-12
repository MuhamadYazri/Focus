import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';

const formatDisplayHours = (mins) => {
  if (!mins || mins <= 0) return '0h 00m';
  const rounded = Math.round(mins);
  const h = Math.floor(rounded / 60);
  const m = rounded % 60;
  return `${h}h ${m < 10 ? '0' : ''}${m}m`;
};

const formatDeltaHours = (mins) => {
  const abs = Math.abs(Math.round(mins));
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const str = h > 0 ? `${h}h ${m > 0 ? `${m}m` : ''}` : `${m}m`;
  return mins >= 0 ? `+${str.trim()}` : `-${str.trim()}`;
};

export default function PeriodComparisonCard({
  sessions = [],
  filteredSessions = [],
  period = 'Daily',
  offset = 0,
  filterSessionsForPeriod,
}) {
  const isAll = period === 'All';

  const stats = useMemo(() => {
    const curTotalMins = filteredSessions.reduce((acc, s) => acc + (s.duration || 25), 0);

    const activeDates = new Set(
      filteredSessions
        .map((s) => s.dateStr || (s.completedAt && s.completedAt.split('T')[0]))
        .filter(Boolean)
    );
    const activeDaysCount = activeDates.size;

    let periodDays = 1;
    let prevPeriodLabel = 'vs. yesterday';

    if (period === 'Daily') {
      periodDays = 1;
      prevPeriodLabel = offset === 0 ? 'vs. yesterday' : 'vs. previous day';
    } else if (period === 'Weekly') {
      periodDays = 7;
      prevPeriodLabel = offset === 0 ? 'vs. last week' : 'vs. previous week';
    } else if (period === 'Monthly') {
      const now = new Date();
      const targetMonth = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
      periodDays = targetMonth.getDate();
      prevPeriodLabel = offset === 0 ? 'vs. last month' : 'vs. previous month';
    } else if (period === 'Yearly') {
      periodDays = 365;
      prevPeriodLabel = offset === 0 ? 'vs. last year' : 'vs. previous year';
    } else if (isAll) {
      const allDates = new Set(
        sessions
          .map((s) => s.dateStr || (s.completedAt && s.completedAt.split('T')[0]))
          .filter(Boolean)
      );
      periodDays = Math.max(1, allDates.size);
    }

    const prevSessions =
      !isAll && typeof filterSessionsForPeriod === 'function'
        ? filterSessionsForPeriod(sessions, period, offset - 1)
        : [];
    const prevTotalMins = prevSessions.reduce((acc, s) => acc + (s.duration || 25), 0);

    const diffMins = curTotalMins - prevTotalMins;

    let pctChange = 0;
    if (prevTotalMins === 0 && curTotalMins > 0) {
      pctChange = 100;
    } else if (prevTotalMins > 0) {
      pctChange = Math.round(((curTotalMins - prevTotalMins) / prevTotalMins) * 100);
    }

    const dailyAvgMins = period === 'Daily' ? curTotalMins : Math.round(curTotalMins / periodDays);
    const consistencyPct =
      period === 'Daily'
        ? activeDaysCount > 0
          ? 100
          : 0
        : Math.min(100, Math.round((activeDaysCount / periodDays) * 100));

    return {
      curTotalMins,
      prevTotalMins,
      diffMins,
      pctChange,
      dailyAvgMins,
      activeDaysCount,
      periodDays,
      prevPeriodLabel,
      consistencyPct,
    };
  }, [sessions, filteredSessions, period, offset, isAll, filterSessionsForPeriod]);

  const isNeutral = stats.diffMins === 0;
  const isPositive = stats.diffMins > 0;

  return (
    <div className="bg-surface rounded-2xl p-4 shadow-xs border border-border ring-1 ring-white/80 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] uppercase tracking-wider text-secondary font-bold font-sans">
          {isAll ? 'ALL-TIME VELOCITY' : 'PERIOD TREND & CONSISTENCY'}
        </span>
        {!isAll && (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 font-sans ${
              isNeutral
                ? 'bg-canvas text-text-sub border border-border'
                : isPositive
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'bg-[#BA1A1A]/10 text-[#BA1A1A] border border-[#BA1A1A]/20'
            }`}
          >
            {isNeutral ? (
              <Minus size={12} strokeWidth={2.5} />
            ) : isPositive ? (
              <TrendingUp size={12} strokeWidth={2.5} />
            ) : (
              <TrendingDown size={12} strokeWidth={2.5} />
            )}
            <span>
              {isNeutral ? 'No change' : `${stats.pctChange > 0 ? '+' : ''}${stats.pctChange}%`}
            </span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* Metric 1: Relative Velocity / Total */}
        <div className="bg-canvas/50 rounded-xl p-3 border border-border/60 flex flex-col justify-between min-h-[82px]">
          <span className="text-[10px] uppercase font-bold text-text-sub tracking-wider font-sans">
            {isAll ? 'TOTAL FOCUSED' : 'CHANGE'}
          </span>
          <div>
            <span
              className={`text-lg font-bold font-sans ${
                isAll
                  ? 'text-text-main'
                  : isPositive
                  ? 'text-primary'
                  : isNeutral
                  ? 'text-text-main'
                  : 'text-[#BA1A1A]'
              }`}
            >
              {isAll ? formatDisplayHours(stats.curTotalMins) : formatDeltaHours(stats.diffMins)}
            </span>
            <span className="text-[10px] text-text-sub block mt-0.5 font-sans font-medium">
              {isAll ? `${sessions.length} sessions total` : stats.prevPeriodLabel}
            </span>
          </div>
        </div>

        {/* Metric 2: Daily Average */}
        <div className="bg-canvas/50 rounded-xl p-3 border border-border/60 flex flex-col justify-between min-h-[82px]">
          <span className="text-[10px] uppercase font-bold text-text-sub tracking-wider font-sans">
            DAILY AVERAGE
          </span>
          <div>
            <span className="text-lg font-bold text-text-main font-sans">
              {formatDisplayHours(stats.dailyAvgMins)}
            </span>
            <span className="text-[10px] text-text-sub block mt-0.5 font-sans font-medium">
              per day in {period.toLowerCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Consistency Progress (For Weekly, Monthly, Yearly) */}
      {period !== 'Daily' && (
        <div className="mt-3 pt-3 border-t border-border/50 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-sans">
            <span className="text-text-sub font-medium flex items-center gap-1.5">
              <Calendar size={13} className="text-secondary" />
              <span>Active Consistency</span>
            </span>
            <span className="text-text-main font-bold">
              {stats.activeDaysCount} of {stats.periodDays} days ({stats.consistencyPct}%)
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-border/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-secondary transition-all duration-500 ease-out"
              style={{ width: `${stats.consistencyPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
