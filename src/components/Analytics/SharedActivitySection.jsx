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

const HeatmapCell = React.memo(function HeatmapCell({ cell, period, setOffset }) {
  const dayNum = cell?.dayNum;
  const isCur = !!cell?.isCurrent;
  const isSameMo = !!cell?.isSameMonth;
  const hasHours = (cell?.curMins || 0) > 0;
  const isGoalMet = !!cell?.isGoalMet;
  const isToday = !!cell?.isToday;
  const isSelected =
    period === 'Daily'
      ? isCur
      : period === 'Weekly'
      ? isCur
      : period === 'Monthly'
      ? isCur && isSameMo
      : false;

  let bgClass = 'bg-[#F0F2EF] text-[#1B1F1A]/90 font-bold';
  let borderClass = '';

  if (!isSameMo) {
    bgClass = 'bg-[#E8EDE6]/50 text-[#8B9E87]/40 font-normal';
  } else if (hasHours) {
    bgClass = 'bg-[#B1C9AC] text-[#1B1F1A]/90 font-bold';
  }

  if (isSelected || (period !== 'Daily' && isToday) || (period === 'Daily' && isToday)) {
    borderClass = 'border border-[#1B1F1A] !bg-[#1B1F1A]/5 !text-[#1B1F1A] !font-extrabold z-10';
  }

  const handleCellClick = () => {
    if (!cell?.dateStr) return;
    if (window.navigator?.vibrate) window.navigator.vibrate(10);
    const now = new Date();
    const [y, m, d] = cell.dateStr.split('-').map(Number);
    const cellDate = new Date(y, m - 1, d);

    if (period === 'Daily') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diffDays = Math.round((cellDate - todayStart) / (1000 * 60 * 60 * 24));
      setOffset(diffDays);
    } else if (period === 'Weekly') {
      const nowDayOfWeek = now.getDay() || 7;
      const currentMon = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - nowDayOfWeek + 1
      );
      const cellDayOfWeek = cellDate.getDay() || 7;
      const cellMon = new Date(
        cellDate.getFullYear(),
        cellDate.getMonth(),
        cellDate.getDate() - cellDayOfWeek + 1
      );
      const diffWeeks = Math.round((cellMon - currentMon) / (1000 * 60 * 60 * 24 * 7));
      setOffset(diffWeeks);
    } else if (period === 'Monthly') {
      const currentYearMonth = now.getFullYear() * 12 + now.getMonth();
      const cellYearMonth = cellDate.getFullYear() * 12 + cellDate.getMonth();
      setOffset(cellYearMonth - currentYearMonth);
    }
  };

  return (
    <div
      onClick={handleCellClick}
      className={`relative h-[34px] rounded-[10px] flex flex-col items-center justify-center text-[10px] font-sans transition-all overflow-hidden cursor-pointer active:scale-95 ${bgClass} ${borderClass}`}
      title={
        hasHours
          ? `${cell?.dateStr}: ${cell?.curHours?.toFixed(1)}h / ${cell?.targetHours}h goal`
          : cell?.dateStr
      }
    >
      <span className="relative z-10">{dayNum}</span>

      {/* Day with focus activity: bottom green bar from Figma (#588157, 7px height) */}
      {hasHours && isSameMo && (
        <div className="absolute inset-x-0 bottom-0 h-[7px] bg-[#588157] z-0" />
      )}
    </div>
  );
});

const ChartBarColumn = React.memo(function ChartBarColumn({ slot, setOffset }) {
  const isSelected = slot.isCurrent;
  const hasVal = slot.v > 0;
  const barH = hasVal ? Math.max(6, Math.min(58, Math.round(slot.v * 58))) : 0;

  const handleSlotClick = () => {
    if (slot.targetOffset !== undefined) {
      if (window.navigator?.vibrate) window.navigator.vibrate(10);
      setOffset(slot.targetOffset);
    }
  };

  return (
    <div
      onClick={handleSlotClick}
      className="flex flex-col items-center gap-1.5 min-w-0 flex-1 cursor-pointer active:scale-95 transition-transform"
    >
      {/* Top Value: e.g. 50m green or 0h */}
      <span
        className={`text-[9px] leading-[12px] font-sans transition-colors ${
          isSelected
            ? 'text-[#1B1F1A] font-extrabold'
            : hasVal
            ? 'text-[#588157] font-bold'
            : 'text-[#8B9E87]/60 font-medium'
        }`}
      >
        {slot.val}
      </span>

      {/* Bar Outer from Figma: 45px max-w, 58px height, bg #E8EDE6 rounded-full */}
      <div
        className={`w-full max-w-[45px] h-[58px] bg-[#E8EDE6] rounded-full flex flex-col justify-end overflow-hidden relative ${
          isSelected ? 'border border-[#1B1F1A]' : ''
        }`}
      >
        {hasVal && (
          <div
            className="w-full bg-[#588157] transition-all duration-500 ease-out"
            style={{ height: `${barH}px` }}
          />
        )}
      </div>

      {/* Day Label: Mon, Tue... */}
      <span
        className={`text-[10px] leading-[14px] font-sans transition-colors ${
          isSelected ? 'text-[#1B1F1A] font-extrabold' : 'text-[#667463] font-medium'
        } truncate w-full text-center`}
      >
        {slot.h}
      </span>
    </div>
  );
});

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

  // Fast O(1) date session map to avoid repeatedly filtering large session arrays
  const { sessionDateMap, sessionMonthMap, sessionYearMap } = useMemo(() => {
    const dateMap = new Map();
    const monthMap = new Map();
    const yearMap = new Map();

    (sessions || []).forEach((s) => {
      const dt = s.dateStr || (s.completedAt && s.completedAt.split('T')[0]);
      if (!dt) return;
      const dur = s.duration || 25;

      // By exact date
      dateMap.set(dt, (dateMap.get(dt) || 0) + dur);

      // By YYYY-MM
      const mo = dt.slice(0, 7);
      monthMap.set(mo, (monthMap.get(mo) || 0) + dur);

      // By YYYY
      const yr = dt.slice(0, 4);
      yearMap.set(yr, (yearMap.get(yr) || 0) + dur);
    });

    return { sessionDateMap: dateMap, sessionMonthMap: monthMap, sessionYearMap: yearMap };
  }, [sessions]);

  // Pre-cached goals map from localStorage to avoid 35x JSON.parse calls per render
  const goalsHistory = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('focus_daily_goals_history_v1') || '{}');
    } catch {
      return {};
    }
  }, [period, offset]);

  const defaultGoal = Number(settings?.dailyGoalHours) || 4.0;

  const getDailyGoalHours = (dateStr) => {
    if (goalsHistory[dateStr]) return Number(goalsHistory[dateStr]);
    return defaultGoal;
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
        const curMins = sessionDateMap.get(curStr) || 0;
        const curHours = curMins / 60;
        const targetHours = getDailyGoalHours(curStr);
        let val = 0;
        if (curHours >= targetHours && targetHours > 0) val = 4;
        else if (curHours >= targetHours * 0.75) val = 3;
        else if (curHours >= targetHours * 0.4) val = 2;
        else if (curHours > 0) val = 1;

        const isSameMonth = curStr.startsWith(targetMonthPrefix);
        const progressRatio = targetHours > 0 ? curHours / targetHours : curHours > 0 ? 1 : 0;
        const isGoalMet = targetHours > 0 && curHours >= targetHours;
        const fillPct =
          curMins > 0
            ? isGoalMet
              ? 100
              : Math.max(16, Math.min(100, Math.round(progressRatio * 100)))
            : 0;

        row.push({
          val,
          dayNum: cur.getDate(),
          curMins,
          curHours,
          progressRatio,
          isGoalMet,
          fillPct,
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
      
      const totalMins = sessionDateMap.get(targetStr) || 0;
      const daySessions = (sessions || []).filter((s) => {
        const sDt = s.dateStr || (s.completedAt && s.completedAt.split('T')[0]);
        return sDt === targetStr;
      });
      displayHours = formatDisplayHours(totalMins);
      displayPomos = daySessions.length;
      displaySubToday = `${displayHours} on this day`;
      displaySubDays = totalMins > 0 ? '1 active day' : '0 active days';

      const dayOfWeek = targetDate.getDay() || 7;
      const monDate = new Date(targetDate);
      monDate.setDate(targetDate.getDate() - dayOfWeek + 1);
      const chartDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      let maxDayMins = 0;
      let peakDayLabel = 'None';
      const targetDailyGoalHours = getDailyGoalHours(targetStr);

      const dailySlots = chartDays.map((label, idx) => {
        const d = new Date(monDate);
        d.setDate(monDate.getDate() + idx);
        const dStr = getLocalDateStr(d);
        const mins = sessionDateMap.get(dStr) || 0;
        if (mins > maxDayMins) {
          maxDayMins = mins;
          peakDayLabel = label;
        }

        const slotGoalHours = getDailyGoalHours(dStr);
        const slotGoalMins = slotGoalHours * 60;
        const progressRatio = slotGoalMins > 0 ? mins / slotGoalMins : 0;
        const isGoalMet = slotGoalMins > 0 && mins >= slotGoalMins;

        const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const diffDays = Math.round((dStart - nowStart) / (1000 * 60 * 60 * 24));

        return {
          h: label,
          mins,
          val: mins > 0 ? formatTimeNoDecimals(mins) : '0h',
          isCurrent: dStr === targetStr,
          targetOffset: diffDays,
          v: Math.min(1, progressRatio),
          progressRatio,
          isGoalMet,
          goalHours: slotGoalHours,
        };
      });

      activeChart = dailySlots;
      chartTitle = 'Total per day';
      chartPeakLabel = `Goal: ${targetDailyGoalHours}h`;
      chartSubLabel = `Bar focused by daily goal`;
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

      const targetDailyGoalHours = getDailyGoalHours(getLocalDateStr(now));
      const weeklyTargetHours = targetDailyGoalHours * 7;
      const weeklyTargetMins = weeklyTargetHours * 60;

      const weeklySlots = [];
      let maxWkMins = 0;

      // Keep a sliding 4-week window containing the active week offset (clamped to max 0 for future)
      const maxW = Math.min(0, offset + 3);
      const thisWeekMon = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek + 1);

      for (let w = maxW - 3; w <= maxW; w++) {
        const curStart = new Date(thisWeekMon);
        curStart.setDate(thisWeekMon.getDate() + w * 7);
        const curEnd = new Date(curStart);
        curEnd.setDate(curStart.getDate() + 6);
        const csStr = getLocalDateStr(curStart);
        const ceStr = getLocalDateStr(curEnd);
        
        let mins = 0;
        for (let d = new Date(curStart); d <= curEnd; d.setDate(d.getDate() + 1)) {
          mins += sessionDateMap.get(getLocalDateStr(d)) || 0;
        }

        const label = w === 0 ? 'This Wk' : `${Math.abs(w)}Wk Ago`;
        if (mins > maxWkMins) {
          maxWkMins = mins;
        }

        const progressRatio = weeklyTargetMins > 0 ? mins / weeklyTargetMins : 0;
        const isGoalMet = weeklyTargetMins > 0 && mins >= weeklyTargetMins;

        weeklySlots.push({
          h: label,
          mins,
          val: mins > 0 ? formatTimeNoDecimals(mins) : '0h',
          isCurrent: w === offset,
          targetOffset: w,
          v: Math.min(1, progressRatio),
          progressRatio,
          isGoalMet,
        });
      }

      activeChart = weeklySlots;
      chartTitle = 'Total per week';
      chartPeakLabel = `Goal: ${weeklyTargetHours}h/wk`;
      chartSubLabel = `Bar focused by weekly goal`;
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

      const totalMins = sessionMonthMap.get(prefix) || 0;
      const moSessions = (sessions || []).filter((s) =>
        (s.dateStr || s.completedAt || '').startsWith(prefix)
      );
      displayHours = formatDisplayHours(totalMins);
      displayPomos = moSessions.length;
      const uniqueDays = new Set(
        moSessions.map((s) => s.dateStr || (s.completedAt && s.completedAt.split('T')[0]))
      ).size;
      displaySubToday = `${formatTimeNoDecimals(
        totalMins / Math.max(1, uniqueDays)
      )} avg / active day`;
      displaySubDays = `${uniqueDays} days focused`;

      const targetDailyGoalHours = getDailyGoalHours(getLocalDateStr(now));
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
        const mins = sessionMonthMap.get(pfx) || 0;
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
          targetOffset: idx - now.getMonth(),
          v: Math.min(1, progressRatio),
          progressRatio,
          isGoalMet,
        };
      });

      activeChart = monthlySlots;
      chartTitle = `Total per month (${yrStr})`;
      chartPeakLabel = `Goal: ${monthlyTargetHours}h/mo`;
      chartSubLabel = `Bar focused by monthly goal`;
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
      
      const totalMins = sessionYearMap.get(yrStr) || 0;
      const yrSessions = (sessions || []).filter((s) =>
        (s.dateStr || s.completedAt || '').startsWith(yrStr)
      );
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
        const mins = sessionYearMap.get(yStr) || 0;
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
      let totalMins = 0;
      sessionYearMap.forEach((v) => { totalMins += v; });
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
        const mins = sessionYearMap.get(yStr) || 0;
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

      {/* Dual Metric Summary Tiles from Figma: 195px x 120px rounded-[18px] */}
      {showKPIs && (
        <div className="grid grid-cols-2 gap-2.5">
          {/* Focus Time Card */}
          <div className="bg-white rounded-[18px] p-4 border border-[#D6E0D4] shadow-[0px_2px_8px_rgba(27,31,26,0.031)] flex flex-col justify-between h-[120px]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-extrabold uppercase tracking-[1.2px] text-[#8B9E87] font-sans">
                FOCUS TIME
              </span>
              <div className="w-[26px] h-[26px] rounded-[7px] bg-[#1B1F1A]/5 text-[#41493F] flex items-center justify-center">
                <Clock size={13} strokeWidth={2} />
              </div>
            </div>
            <div>
              <p className="text-[28px] leading-[38px] font-extrabold tracking-[-1px] text-[#1B1F1A] font-sans">
                {displayHours}
              </p>
              <p className="text-[10px] leading-[14px] text-[#8B9E87] font-normal font-sans">
                {displaySubToday}
              </p>
            </div>
          </div>

          {/* Sessions Card */}
          <div className="bg-white rounded-[18px] p-4 border border-[#D6E0D4] shadow-[0px_2px_8px_rgba(27,31,26,0.031)] flex flex-col justify-between h-[120px]">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-extrabold uppercase tracking-[1.2px] text-[#8B9E87] font-sans">
                SESSIONS
              </span>
              <div className="w-[26px] h-[26px] rounded-[7px] bg-[#1B1F1A]/5 text-[#667463] flex items-center justify-center">
                <CheckCircle size={13} strokeWidth={2} />
              </div>
            </div>
            <div>
              <p className="text-[28px] leading-[38px] font-extrabold tracking-[-1px] text-[#1B1F1A] font-sans">
                {displayPomos.toLocaleString()}
              </p>
              <p className="text-[10px] leading-[14px] text-[#8B9E87] font-normal font-sans">
                {displaySubDays}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Activity Heatmap Grid Card from Figma */}
      <div className="bg-white rounded-[18px] p-4 border border-[#D6E0D4] shadow-[0px_2px_8px_rgba(27,31,26,0.031)] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-[1.2px] text-[#8B9E87] font-extrabold font-sans">
            ACTIVITY GRID
          </span>
          <span className="text-[10px] leading-[14px] text-[#667463] font-semibold font-sans px-2.5 py-[3px] rounded-full bg-[#F0F2EF] border border-[#D6E0D4]/50">
            {heatmapTitleDate}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <span key={i} className="text-[9px] font-bold text-[#8B9E87] tracking-[0.5px]">
              {d}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center select-none">
          {activeHeatmap.map((week, wi) =>
            week.map((cell, di) => (
              <HeatmapCell
                key={`${wi}-${di}`}
                cell={cell}
                period={period}
                setOffset={setOffset}
              />
            ))
          )}
        </div>
      </div>

      {/* Total Per Day Column Chart Card from Figma: 400px x 176px */}
      <div className="bg-white rounded-[18px] p-4 border border-[#D6E0D4] shadow-[0px_2px_8px_rgba(27,31,26,0.031)] flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] leading-[18px] font-extrabold text-[#1B1F1A] font-sans tracking-[-0.3px]">
              {chartTitle}
            </span>
            <p className="text-[10px] leading-[14px] text-[#8B9E87] font-normal font-sans">
              {chartSubLabel}
            </p>
          </div>
          <span className="text-[10px] font-bold text-[#41493F] px-2.5 py-[3px] rounded-full bg-[#1B1F1A]/5 border border-[#1B1F1A]/10">
            {chartPeakLabel}
          </span>
        </div>

        <div
          className="grid gap-2.5 items-end min-h-[96px] pt-1"
          style={{ gridTemplateColumns: `repeat(${activeChart.length}, minmax(0, 1fr))` }}
        >
          {activeChart.map((slot) => (
            <ChartBarColumn
              key={`${slot.targetOffset !== undefined ? slot.targetOffset : slot.h}-${slot.h}`}
              slot={slot}
              setOffset={setOffset}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default React.memo(SharedActivitySection);
