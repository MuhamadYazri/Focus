import React, { useState, useEffect, useMemo } from 'react';
import { Clock, CheckCircle } from 'lucide-react';
import TimeframeHeader, { PERIODS, getDateRangeLabel } from './TimeframeHeader';

const getLocalDateStr = (d) => {
  try {
    const dt = d ? new Date(d) : new Date();
    if (isNaN(dt.getTime())) return new Date().toISOString().split('T')[0];
    const z = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
    return z.toISOString().split('T')[0];
  } catch (e) {
    return new Date().toISOString().split('T')[0];
  }
};

const formatTimeNoDecimals = (totalMins) => {
  if (!totalMins || totalMins <= 0) return '0h';
  const rounded = Math.round(totalMins);
  const hrs = Math.floor(rounded / 60);
  const mins = rounded % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${String(mins).padStart(2, '0')}m`;
};

const formatDisplayHours = (totalMins) => {
  if (!totalMins || totalMins <= 0) return '0h 00m';
  const rounded = Math.round(totalMins);
  const hrs = Math.floor(rounded / 60);
  const mins = rounded % 60;
  return `${hrs}h ${String(mins).padStart(2, '0')}m`;
};

function SharedActivitySection({
  showKPIs = true,
  sessions = [],
  settings = {},
  onPeriodChange,
  period: controlledPeriod,
  setPeriod: controlledSetPeriod,
  offset: controlledOffset,
  setOffset: controlledSetOffset,
  hideHeader = false,
}) {
  const [internalPeriod, setInternalPeriod] = useState('Daily');
  const [internalOffset, setInternalOffset] = useState(0);

  const period = controlledPeriod !== undefined ? controlledPeriod : internalPeriod;
  const setPeriod = controlledSetPeriod || setInternalPeriod;
  const offset = controlledOffset !== undefined ? controlledOffset : internalOffset;
  const setOffset = controlledSetOffset || setInternalOffset;

  const maxBarH = 64; // Adjusted for new design

  const isAll = period === 'All';

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

  const getDailyGoalHours = (dayNum, dateStr) => {
    try {
      const hist = JSON.parse(localStorage.getItem('focus_daily_goals_history_v1') || '{}');
      const dateKey = dateStr || `2026-07-${String(dayNum).padStart(2, '0')}`;
      if (hist && hist[dateKey]) return Number(hist[dateKey]);
      if (settings && settings.dailyGoalHours) return Number(settings.dailyGoalHours);
      const st = JSON.parse(localStorage.getItem('focus_settings_v1') || '{}');
      return st && st.dailyGoalHours ? Number(st.dailyGoalHours) : 4.0;
    } catch (e) {
      return (settings && settings.dailyGoalHours) ? Number(settings.dailyGoalHours) : 4.0;
    }
  };

  const generateHeatmapGrid = (endDateRef, hlStart, hlEnd) => {
    const ref = new Date(endDateRef || new Date());
    const firstDayOfMonth = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const dayOfWeek = firstDayOfMonth.getDay() || 7;
    const startMon = new Date(firstDayOfMonth);
    startMon.setDate(firstDayOfMonth.getDate() - (dayOfWeek - 1));

    const todayStr = getLocalDateStr(new Date());
    const rangeStart = hlStart || todayStr;
    const rangeEnd = hlEnd || rangeStart;
    const targetMonthPrefix = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, '0')}`;

    const grid = [];
    for (let w = 0; w < 5; w++) {
      const row = [];
      for (let d = 0; d < 7; d++) {
        const cur = new Date(startMon);
        cur.setDate(startMon.getDate() + w * 7 + d);
        const curStr = getLocalDateStr(cur);
        const curSess = (sessions || []).filter((s) => {
          const sDt = s.dateStr || (s.completedAt && s.completedAt.split('T')[0]);
          return sDt === curStr;
        });
        const curMins = curSess.reduce((acc, s) => acc + (s.duration || 25), 0);
        const curHours = curMins / 60;
        const targetHours = getDailyGoalHours(cur.getDate(), curStr);
        let val = 0;
        if (curHours >= targetHours && targetHours > 0) val = 4;
        else if (curHours >= targetHours * 0.75) val = 3;
        else if (curHours >= targetHours * 0.4) val = 2;
        else if (curHours > 0) val = 1;

        const isSameMonth = curStr.startsWith(targetMonthPrefix);

        row.push({
          val,
          dayNum: cur.getDate(),
          achievedHours: Math.round(curHours),
          targetHours,
          dateStr: curStr,
          isCurrent: curStr >= rangeStart && curStr <= rangeEnd,
          isToday: curStr === todayStr,
          isSameMonth,
        });
      }
      grid.push(row);
    }
    return grid;
  };

  // Dynamically compute dataset based on period & offset using useMemo
  const {
    displayHours,
    displayPomos,
    displaySubToday,
    displaySubDays,
    activeHeatmap,
    activeChart,
    chartTitle,
    chartPeakLabel,
    chartSubLabel,
    heatmapTitleDate,
  } = useMemo(() => {
    const now = new Date();
    let displayHours = '0h 00m';
    let displayPomos = 0;
    let displaySubToday = '0h today';
    let displaySubDays = '0 active days';
    let activeHeatmap = [];
    let activeChart = [];
    let chartTitle = 'Total per day';
    let chartPeakLabel = 'No activity';
    let chartSubLabel = 'Hours focused by day of week';
    let heatmapTitleDate = 'Month';

    if (period === 'Daily') {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + offset);
      const targetStr = getLocalDateStr(targetDate);
      heatmapTitleDate = targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const daySessions = (sessions || []).filter((s) => {
        const sDt = s.dateStr || (s.completedAt && s.completedAt.split('T')[0]);
        return sDt === targetStr;
      });
      const totalMins = daySessions.reduce((acc, s) => acc + (s.duration || 25), 0);
      displayHours = formatDisplayHours(totalMins);
      displayPomos = daySessions.length;
      displaySubToday = `${displayHours} on this day`;
      displaySubDays = daySessions.length > 0 ? '1 active day' : '0 active days';

      const dayOfWeek = targetDate.getDay() || 7;
      const monDate = new Date(targetDate);
      monDate.setDate(targetDate.getDate() - dayOfWeek + 1);
      const chartDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      let maxDayMins = 0;
      let peakDayLabel = 'None';
      const targetDailyGoalHours = getDailyGoalHours(targetDate.getDate(), targetStr);

      const dailySlots = chartDays.map((label, idx) => {
        const d = new Date(monDate);
        d.setDate(monDate.getDate() + idx);
        const dStr = getLocalDateStr(d);
        const dSess = (sessions || []).filter((s) => {
          const sDt = s.dateStr || (s.completedAt && s.completedAt.split('T')[0]);
          return sDt === dStr;
        });
        const mins = dSess.reduce((acc, s) => acc + (s.duration || 25), 0);
        if (mins > maxDayMins) {
          maxDayMins = mins;
          peakDayLabel = label;
        }

        const slotGoalHours = getDailyGoalHours(d.getDate(), dStr);
        const slotGoalMins = slotGoalHours * 60;
        const progressRatio = slotGoalMins > 0 ? mins / slotGoalMins : 0;
        const isGoalMet = slotGoalMins > 0 && mins >= slotGoalMins;

        return {
          h: label,
          mins,
          val: mins > 0 ? formatTimeNoDecimals(mins) : '0h',
          isCurrent: dStr === targetStr,
          v: Math.min(1, progressRatio),
          progressRatio,
          isGoalMet,
          goalHours: slotGoalHours,
        };
      });

      activeChart = dailySlots;
      chartTitle = 'Total per day';
      chartPeakLabel = `Goal: ${targetDailyGoalHours}h`;
      chartSubLabel = `Bar fullness indicates progress toward ${targetDailyGoalHours}h daily goal`;
      activeHeatmap = generateHeatmapGrid(targetDate, targetStr, targetStr);
    } else if (period === 'Weekly') {
      const dayOfWeek = now.getDay() || 7;
      const wkStart = new Date(now);
      wkStart.setDate(now.getDate() - dayOfWeek + 1 + offset * 7);
      const wkEnd = new Date(wkStart);
      wkEnd.setDate(wkStart.getDate() + 6);
      heatmapTitleDate = wkStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const sStr = getLocalDateStr(wkStart);
      const eStr = getLocalDateStr(wkEnd);

      const weekSessions = (sessions || []).filter((s) => {
        const dt = s.dateStr || (s.completedAt && s.completedAt.split('T')[0]);
        return dt >= sStr && dt <= eStr;
      });
      const totalMins = weekSessions.reduce((acc, s) => acc + (s.duration || 25), 0);
      displayHours = formatDisplayHours(totalMins);
      displayPomos = weekSessions.length;
      const uniqueDays = new Set(
        weekSessions.map((s) => s.dateStr || (s.completedAt && s.completedAt.split('T')[0]))
      ).size;
      displaySubToday = `${formatTimeNoDecimals(totalMins / 7)} avg / day`;
      displaySubDays = `${uniqueDays} days focused`;

      const targetDailyGoalHours = getDailyGoalHours(now.getDate(), getLocalDateStr(now));
      const weeklyTargetHours = targetDailyGoalHours * 7;
      const weeklyTargetMins = weeklyTargetHours * 60;

      const weeklySlots = [];
      let maxWkMins = 0;
      let peakWkLabel = 'None';
      for (let i = -3; i <= 0; i++) {
        const curStart = new Date(wkStart);
        curStart.setDate(wkStart.getDate() + i * 7);
        const curEnd = new Date(curStart);
        curEnd.setDate(curStart.getDate() + 6);
        const csStr = getLocalDateStr(curStart);
        const ceStr = getLocalDateStr(curEnd);
        const wSess = (sessions || []).filter((s) => {
          const dt = s.dateStr || (s.completedAt && s.completedAt.split('T')[0]);
          return dt >= csStr && dt <= ceStr;
        });
        const mins = wSess.reduce((acc, s) => acc + (s.duration || 25), 0);
        const label = i === 0 ? 'This Wk' : `${Math.abs(i)}Wk Ago`;
        if (mins > maxWkMins) {
          maxWkMins = mins;
          peakWkLabel = label;
        }

        const progressRatio = weeklyTargetMins > 0 ? mins / weeklyTargetMins : 0;
        const isGoalMet = weeklyTargetMins > 0 && mins >= weeklyTargetMins;

        weeklySlots.push({
          h: label,
          mins,
          val: mins > 0 ? formatTimeNoDecimals(mins) : '0h',
          isCurrent: i === 0,
          v: Math.min(1, progressRatio),
          progressRatio,
          isGoalMet,
        });
      }

      activeChart = weeklySlots;
      chartTitle = 'Total per week';
      chartPeakLabel = `Goal: ${weeklyTargetHours}h/wk`;
      chartSubLabel = `Bar fullness indicates progress toward ${weeklyTargetHours}h weekly goal`;
      activeHeatmap = generateHeatmapGrid(wkEnd, sStr, eStr);
    } else if (period === 'Monthly') {
      const targetMoDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const yrStr = String(targetMoDate.getFullYear());
      const moNum = targetMoDate.getMonth();
      const prefix = `${yrStr}-${String(moNum + 1).padStart(2, '0')}`;
      heatmapTitleDate = targetMoDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });

      const moSessions = (sessions || []).filter((s) =>
        (s.dateStr || s.completedAt || '').startsWith(prefix)
      );
      const totalMins = moSessions.reduce((acc, s) => acc + (s.duration || 25), 0);
      displayHours = formatDisplayHours(totalMins);
      displayPomos = moSessions.length;
      const uniqueDays = new Set(
        moSessions.map((s) => s.dateStr || (s.completedAt && s.completedAt.split('T')[0]))
      ).size;
      displaySubToday = `${formatTimeNoDecimals(
        totalMins / Math.max(1, uniqueDays)
      )} avg / active day`;
      displaySubDays = `${uniqueDays} days focused`;

      const targetDailyGoalHours = getDailyGoalHours(now.getDate(), getLocalDateStr(now));
      const monthlyTargetHours = targetDailyGoalHours * 22;
      const monthlyTargetMins = monthlyTargetHours * 60;

      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      let maxMoMins = 0;
      let peakMoLabel = 'None';
      const monthlySlots = monthNames.map((mName, idx) => {
        const pfx = `${yrStr}-${String(idx + 1).padStart(2, '0')}`;
        const mSess = (sessions || []).filter((s) =>
          (s.dateStr || s.completedAt || '').startsWith(pfx)
        );
        const mins = mSess.reduce((acc, s) => acc + (s.duration || 25), 0);
        if (mins > maxMoMins) {
          maxMoMins = mins;
          peakMoLabel = mName;
        }

        const progressRatio = monthlyTargetMins > 0 ? mins / monthlyTargetMins : 0;
        const isGoalMet = monthlyTargetMins > 0 && mins >= monthlyTargetMins;

        return {
          h: mName,
          mins,
          val: mins > 0 ? formatTimeNoDecimals(mins) : '0h',
          isCurrent: idx === moNum,
          v: Math.min(1, progressRatio),
          progressRatio,
          isGoalMet,
        };
      });

      activeChart = monthlySlots;
      chartTitle = `Total per month (${yrStr})`;
      chartPeakLabel = `Goal: ${monthlyTargetHours}h/mo`;
      chartSubLabel = `Bar fullness indicates progress toward ${monthlyTargetHours}h monthly goal`;
      const endOfMo =
        offset === 0 && now.getMonth() === moNum && now.getFullYear() === Number(yrStr)
          ? now
          : new Date(Number(yrStr), moNum + 1, 0);
      const moStart = `${yrStr}-${String(moNum + 1).padStart(2, '0')}-01`;
      const moEnd = getLocalDateStr(new Date(Number(yrStr), moNum + 1, 0));
      activeHeatmap = generateHeatmapGrid(endOfMo, moStart, moEnd);
    } else if (period === 'Yearly') {
      const targetYr = now.getFullYear() + offset;
      const yrStr = String(targetYr);
      heatmapTitleDate = 'All Time';
      const yrSessions = (sessions || []).filter((s) =>
        (s.dateStr || s.completedAt || '').startsWith(yrStr)
      );
      const totalMins = yrSessions.reduce((acc, s) => acc + (s.duration || 25), 0);
      displayHours = formatDisplayHours(totalMins);
      displayPomos = yrSessions.length;
      const uniqueDays = new Set(
        yrSessions.map((s) => s.dateStr || (s.completedAt && s.completedAt.split('T')[0]))
      ).size;
      displaySubToday = `${formatTimeNoDecimals(
        totalMins / Math.max(1, uniqueDays)
      )} avg / active day`;
      displaySubDays = `${uniqueDays} days focused`;

      const years = [targetYr - 2, targetYr - 1, targetYr];
      let maxYrMins = 0;
      let peakYrLabel = 'None';
      const yearlySlots = years.map((y) => {
        const yStr = String(y);
        const ySess = (sessions || []).filter((s) =>
          (s.dateStr || s.completedAt || '').startsWith(yStr)
        );
        const mins = ySess.reduce((acc, s) => acc + (s.duration || 25), 0);
        if (mins > maxYrMins) {
          maxYrMins = mins;
          peakYrLabel = yStr;
        }
        return {
          h: yStr,
          mins,
          val: mins > 0 ? formatTimeNoDecimals(mins) : '0h',
          isCurrent: y === targetYr,
        };
      });
      activeChart = yearlySlots.map((s) => ({
        ...s,
        v: maxYrMins > 0 ? s.mins / maxYrMins : 0,
        isPeak: maxYrMins > 0 && s.mins === maxYrMins,
      }));
      chartTitle = 'Total per year';
      chartPeakLabel = maxYrMins > 0 ? formatDisplayHours(maxYrMins) : 'No activity';
      chartSubLabel = 'Annual focus time progression';
      activeHeatmap = generateHeatmapGrid(new Date(targetYr, 11, 31));
    } else if (period === 'All') {
      heatmapTitleDate = 'All Time';
      const totalMins = (sessions || []).reduce((acc, s) => acc + (s.duration || 25), 0);
      displayHours = formatDisplayHours(totalMins);
      displayPomos = (sessions || []).length;
      const uniqueDays = new Set(
        (sessions || []).map((s) => s.dateStr || (s.completedAt && s.completedAt.split('T')[0]))
      ).size;
      displaySubToday = `${formatTimeNoDecimals(
        totalMins / Math.max(1, uniqueDays)
      )} avg / active day`;
      displaySubDays = `${uniqueDays} active days total`;
      activeHeatmap = generateHeatmapGrid(now);

      // Generate activeChart for 'All' (same as Yearly)
      const targetYr = now.getFullYear();
      const years = [targetYr - 2, targetYr - 1, targetYr];
      let maxYrMins = 0;
      let peakYrLabel = 'None';
      const yearlySlots = years.map((y) => {
        const yStr = String(y);
        const ySess = (sessions || []).filter((s) =>
          (s.dateStr || s.completedAt || '').startsWith(yStr)
        );
        const mins = ySess.reduce((acc, s) => acc + (s.duration || 25), 0);
        if (mins > maxYrMins) {
          maxYrMins = mins;
          peakYrLabel = yStr;
        }
        return {
          h: yStr,
          mins,
          val: mins > 0 ? formatTimeNoDecimals(mins) : '0h',
          isCurrent: y === targetYr,
        };
      });
      activeChart = yearlySlots.map((s) => ({
        ...s,
        v: maxYrMins > 0 ? s.mins / maxYrMins : 0,
        isPeak: maxYrMins > 0 && s.mins === maxYrMins,
      }));
      chartTitle = 'Total per year';
      chartPeakLabel = maxYrMins > 0 ? formatDisplayHours(maxYrMins) : 'No activity';
      chartSubLabel = 'All-time focus progression';
    }

    return {
      displayHours,
      displayPomos,
      displaySubToday,
      displaySubDays,
      activeHeatmap,
      activeChart,
      chartTitle,
      chartPeakLabel,
      chartSubLabel,
      heatmapTitleDate,
    };
  }, [period, offset, sessions]);

  const dateLabel = getDateRangeLabel(period, offset);

  // Notify parent of period/data changes
  useEffect(() => {
    if (onPeriodChange) {
      onPeriodChange({
        period,
        offset,
        dateLabel,
        displayHours,
        displayPomos,
        displaySubToday,
        displaySubDays,
      });
    }
  }, [period, offset, sessions]);

  return (
    <div className="flex flex-col gap-3.5 ">
      {!hideHeader && (
        <TimeframeHeader
          period={period}
          setPeriod={setPeriod}
          offset={offset}
          setOffset={setOffset}
        />
      )}

      {/* Dual Metric Summary Tiles */}
      {showKPIs && (
        <div className="grid grid-cols-2 gap-3.5">
          {/* Focus Time Tile */}
          <div className="bg-surface rounded-2xl p-4 shadow-xs ring-1 ring-white/80 border border-border flex flex-col justify-between min-h-[112px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                  FOCUS TIME
                </span>
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shadow-2xs">
                  <Clock size={15} strokeWidth={2.2} />
                </div>
              </div>
              <p className="text-2xl text-text-main font-bold tracking-tight font-sans">
                {displayHours}
              </p>
            </div>
            <p className="text-[11px] text-[#635E52] mt-3 font-sans font-medium">
              {displaySubToday}
            </p>
          </div>

          {/* Sessions Tile */}
          <div className="bg-surface rounded-2xl p-4 shadow-xs ring-1 ring-white/80 border border-border flex flex-col justify-between min-h-[112px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-secondary/5 to-transparent rounded-bl-full pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                  SESSIONS
                </span>
                <div className="w-7 h-7 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shadow-2xs">
                  <CheckCircle size={15} strokeWidth={2.2} />
                </div>
              </div>
              <p className="text-2xl text-text-main font-bold tracking-tight font-sans">
                {displayPomos.toLocaleString()}
              </p>
            </div>
            <p className="text-[11px] text-[#635E52] mt-3 font-sans font-medium">
              {displaySubDays}
            </p>
          </div>
        </div>
      )}

      {/* Activity Heatmap Grid */}
      <div className="bg-surface rounded-2xl p-4 shadow-xs ring-1 ring-white/80 border border-border flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] uppercase tracking-wider text-secondary font-bold">
            ACTIVITY GRID
          </span>
          <span className="text-xs text-text-sub font-medium font-sans px-2.5 py-0.5 rounded-full bg-canvas/80 border border-border/50">
            {heatmapTitleDate}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <span key={i} className="text-[11px] font-semibold text-secondary/80">
              {d}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs select-none">
          {activeHeatmap.map((week, wi) =>
            week.map((cell, di) => {
              const dayNum = cell?.dayNum;
              const isCur = !!cell?.isCurrent;
              const isSameMo = !!cell?.isSameMonth;
              const val = cell?.val || 0;

              let bgClass = 'bg-canvas text-text-main/80 font-medium'; // default empty inside month
              if (!isSameMo) {
                bgClass = 'bg-[#EDE7DA]/30 text-text-sub/40 font-normal';
              } else if (val >= 3) {
                bgClass = 'bg-primary text-white font-bold shadow-xs';
              } else if (val >= 1) {
                bgClass = 'bg-[#4F7775] text-white font-semibold shadow-2xs';
              } else if (isCur) {
                bgClass = 'bg-primary/10 text-primary font-bold';
              }

              const isToday = !!cell?.isToday;

              // Daily view highlights the selected day with a ring.
              // Weekly/Monthly views give today the distinct ring, while the range receives the soft bg-primary/10 tint.
              const selectionRing =
                (period === 'Daily' && isCur) || (period !== 'Daily' && isToday)
                  ? 'ring-2 ring-primary ring-offset-1 ring-offset-surface z-10'
                  : '';

              return (
                <div
                  key={`${wi}-${di}`}
                  className={`h-9 rounded-xl flex items-center justify-center text-[11px] font-sans transition-all ${bgClass} ${selectionRing}`}
                >
                  {dayNum}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Total Per Day Column Chart */}
      <div className="bg-surface rounded-2xl p-4 shadow-xs ring-1 ring-white/80 border border-border flex flex-col">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-sm font-bold text-text-main font-sans">{chartTitle}</span>
          <span className="text-[11px] text-primary font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
            {chartPeakLabel}
          </span>
        </div>
        <p className="text-[11px] text-text-sub mb-5 font-sans">{chartSubLabel}</p>

        <div
          className="grid gap-2 items-end min-h-[96px] pb-1"
          style={{ gridTemplateColumns: `repeat(${activeChart.length}, minmax(0, 1fr))` }}
        >
          {activeChart.map((slot) => {
            const isSelected = slot.isCurrent;
            const hasVal = slot.v > 0;
            const isGoalMet = !!slot.isGoalMet;
            const barH = hasVal ? Math.max(8, Math.min(64, Math.round(slot.v * 64))) : 0;

            return (
              <div key={slot.h} className="flex flex-col items-center gap-1.5 min-w-0">
                <span
                  className={`text-[10px] font-sans transition-colors ${
                    isGoalMet
                      ? 'text-primary font-bold'
                      : isSelected
                      ? 'text-primary font-bold'
                      : hasVal
                      ? 'text-secondary font-semibold'
                      : 'text-text-sub/70'
                  }`}
                >
                  {slot.val}
                </span>

                {/* Tactile track capsule with seamless flush fill */}
                <div
                  className={`w-full h-16 bg-[#EDE7DA]/60 rounded-full flex flex-col justify-end overflow-hidden shadow-2xs relative ${
                    isSelected ? 'ring-1 ring-primary/40' : ''
                  }`}
                >
                  {hasVal && (
                    <div
                      className={`w-full rounded-t-full transition-all duration-500 ease-out ${
                        isGoalMet
                          ? 'bg-primary shadow-xs'
                          : isSelected
                          ? 'bg-primary shadow-xs'
                          : 'bg-[#4F7775]'
                      }`}
                      style={{ height: `${barH}px` }}
                    />
                  )}
                </div>

                <span
                  className={`text-[11px] font-sans transition-colors ${
                    isSelected ? 'text-primary font-bold' : 'text-text-sub font-medium'
                  } truncate w-full text-center`}
                >
                  {slot.h}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default React.memo(SharedActivitySection);
