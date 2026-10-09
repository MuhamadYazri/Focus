import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, CheckCircle } from 'lucide-react';

const PERIODS = ['All', 'Daily', 'Weekly', 'Monthly', 'Yearly'];

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

export default function SharedActivitySection({ showKPIs = true, sessions = [], onPeriodChange }) {
  const [period, setPeriod] = useState('Daily');
  const [offset, setOffset] = useState(0);
  const now = new Date();
  const maxBarH = 64; // Adjusted for new design

  const isAll = period === 'All';

  const getDateRangeLabel = (p, off) => {
    const d = new Date(now);
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
      const st = JSON.parse(localStorage.getItem('focus_settings_v1') || '{}');
      return st && st.dailyGoalHours ? Number(st.dailyGoalHours) : 4.0;
    } catch (e) {
      return 4.0;
    }
  };

  const generateHeatmapGrid = (endDateRef, hlStart, hlEnd) => {
    const ref = new Date(endDateRef || now);
    const firstDayOfMonth = new Date(ref.getFullYear(), ref.getMonth(), 1);
    const dayOfWeek = firstDayOfMonth.getDay() || 7;
    const startMon = new Date(firstDayOfMonth);
    startMon.setDate(firstDayOfMonth.getDate() - (dayOfWeek - 1));

    const todayStr = getLocalDateStr(now);
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
          isSameMonth,
        });
      }
      grid.push(row);
    }
    return grid;
  };

  // Dynamically compute dataset based on period & offset
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
      return {
        h: label,
        mins,
        val: mins > 0 ? formatTimeNoDecimals(mins) : '0h',
        isCurrent: dStr === targetStr,
      };
    });
    activeChart = dailySlots.map((s) => ({
      ...s,
      v: maxDayMins > 0 ? s.mins / maxDayMins : 0,
      isPeak: maxDayMins > 0 && s.mins === maxDayMins,
    }));
    chartPeakLabel = maxDayMins > 0 ? formatDisplayHours(maxDayMins) : 'No activity';
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
      weeklySlots.push({
        h: label,
        mins,
        val: mins > 0 ? formatTimeNoDecimals(mins) : '0h',
        isCurrent: i === 0,
      });
    }
    activeChart = weeklySlots.map((s) => ({
      ...s,
      v: maxWkMins > 0 ? s.mins / maxWkMins : 0,
      isPeak: maxWkMins > 0 && s.mins === maxWkMins,
    }));
    chartTitle = 'Total per week';
    chartPeakLabel = maxWkMins > 0 ? formatDisplayHours(maxWkMins) : 'No activity';
    chartSubLabel = 'Hours focused by weekly interval';
    activeHeatmap = generateHeatmapGrid(wkEnd, sStr, eStr);
  } else if (period === 'Monthly') {
    const targetMoDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const yrStr = String(targetMoDate.getFullYear());
    const moNum = targetMoDate.getMonth();
    const prefix = `${yrStr}-${String(moNum + 1).padStart(2, '0')}`;
    heatmapTitleDate = targetMoDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

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
      return {
        h: mName,
        mins,
        val: mins > 0 ? formatTimeNoDecimals(mins) : '0h',
        isCurrent: idx === moNum,
      };
    });
    activeChart = monthlySlots.map((s) => ({
      ...s,
      v: maxMoMins > 0 ? s.mins / maxMoMins : 0,
      isPeak: maxMoMins > 0 && s.mins === maxMoMins,
    }));
    chartTitle = `Total per month (${yrStr})`;
    chartPeakLabel = maxMoMins > 0 ? formatDisplayHours(maxMoMins) : 'No activity';
    chartSubLabel = `Hours focused across ${yrStr}`;
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
    <div className="flex flex-col gap-3.5">
      {/* Time Frame Segmented Track */}
      <div className="w-full bg-[#EDE7DA]/70 p-1 rounded-full flex items-center justify-between border border-[#EDE7DA]">
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
                  ? 'bg-white text-[#191D15] shadow-sm font-semibold'
                  : 'text-[#444841] font-medium hover:text-[#191D15]'
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>

      {/* Date Navigation Capsule */}
      <div
        className={`w-full bg-white rounded-full px-4 py-2.5 flex items-center justify-between shadow-sm border border-[#EDE7DA] transition-opacity ${
          isAll ? 'opacity-50 pointer-events-none' : 'opacity-100'
        }`}
      >
        <button
          onClick={() => {
            if (window.navigator?.vibrate) window.navigator.vibrate(10);
            setOffset((prev) => prev - 1);
          }}
          className="flex items-center gap-1 text-[11px] font-bold tracking-wider text-[#444841] hover:text-[#191D15] transition-colors active:scale-95"
        >
          <ChevronLeft size={15} strokeWidth={2.5} />
          <span className="tracking-widest uppercase">PREV</span>
        </button>
        <span className="text-xs text-[#191D15] font-semibold tracking-tight font-sans">
          {dateLabel}
        </span>
        <button
          onClick={() => {
            if (window.navigator?.vibrate) window.navigator.vibrate(10);
            setOffset((prev) => Math.min(0, prev + 1));
          }}
          disabled={offset >= 0}
          className={`flex items-center gap-1 text-[11px] font-bold tracking-wider transition-colors ${
            offset >= 0
              ? 'text-[#C4C8BE] cursor-not-allowed'
              : 'text-[#444841] hover:text-[#191D15] active:scale-95'
          }`}
        >
          <span className="tracking-widest uppercase">NEXT</span>
          <ChevronRight size={15} strokeWidth={2.5} />
        </button>
      </div>

      {/* Dual Metric Summary Tiles */}
      {showKPIs && (
        <div className="grid grid-cols-2 gap-3.5 mt-1">
          {/* Focus Time Tile */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#EDE7DA] flex flex-col justify-between min-h-[110px]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#628141] mb-1.5 flex items-center justify-between">
                <span>FOCUS TIME</span>
                <Clock size={16} />
              </p>
              <p className="text-2xl text-[#191D15] font-bold tracking-tight font-sans">
                {displayHours}
              </p>
            </div>
            <p className="text-[11px] text-[#444841] mt-3 font-sans">{displaySubToday}</p>
          </div>

          {/* Sessions Tile */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#EDE7DA] flex flex-col justify-between min-h-[110px]">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#628141] mb-1.5 flex items-center justify-between">
                <span>SESSIONS</span>
                <CheckCircle size={16} />
              </p>
              <p className="text-2xl text-[#191D15] font-bold tracking-tight font-sans">
                {displayPomos.toLocaleString()}
              </p>
            </div>
            <p className="text-[11px] text-[#444841] mt-3 font-sans">{displaySubDays}</p>
          </div>
        </div>
      )}

      {/* Activity Heatmap Grid */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#EDE7DA] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] uppercase tracking-wider text-[#628141] font-bold">
            ACTIVITY GRID
          </span>
          <span className="text-xs text-[#747870] font-normal font-sans">{heatmapTitleDate}</span>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <span key={i} className="text-[11px] font-semibold text-[#628141]">
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

              let bgClass = 'bg-[#F9FBEE] text-[#444841]'; // default empty inside month
              if (!isSameMo) {
                bgClass = 'bg-[#F5F1E8]/70 text-[#C4C8BE]';
              } else if (val >= 3) {
                bgClass = 'bg-[#40513B] text-white font-semibold shadow-sm';
              } else if (val >= 1) {
                bgClass = 'bg-[#628141] text-white font-semibold';
              } else if (isCur) {
                bgClass = 'bg-[#E5D9B6]/40 text-[#191D15] font-bold border border-[#E5D9B6]';
              }

              return (
                <div
                  key={`${wi}-${di}`}
                  className={`h-9 rounded-xl flex items-center justify-center text-[11px] font-sans ${bgClass}`}
                >
                  {dayNum}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Total Per Day Column Chart */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#EDE7DA] flex flex-col">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-sm font-bold text-[#191D15] font-sans">{chartTitle}</span>
          <span className="text-[11px] text-[#628141] font-semibold px-2 py-0.5 rounded-full bg-[#E5D9B6]/40">
            {chartPeakLabel}
          </span>
        </div>
        <p className="text-[11px] text-[#444841] mb-6 font-sans">{chartSubLabel}</p>

        <div
          className="grid gap-2 items-end min-h-[88px] pb-1"
          style={{ gridTemplateColumns: `repeat(${activeChart.length}, minmax(0, 1fr))` }}
        >
          {activeChart.map((slot) => {
            const hasVal = slot.v > 0;
            const barH = hasVal ? Math.max(6, slot.v * maxBarH) : 6;
            const isSelected = slot.isCurrent;

            return (
              <div key={slot.h} className="flex flex-col items-center gap-1.5 min-w-0">
                <span
                  className={`text-[10px] font-sans ${
                    isSelected
                      ? 'text-[#40513B] font-bold'
                      : hasVal
                      ? 'text-[#628141] font-medium'
                      : 'text-[#747870]'
                  }`}
                >
                  {slot.val}
                </span>
                <div
                  className={`w-full rounded-full transition-all duration-300 ${
                    isSelected ? 'bg-[#40513B]' : hasVal ? 'bg-[#628141]' : 'bg-[#EDE7DA]'
                  }`}
                  style={{ height: barH }}
                ></div>
                <span
                  className={`text-[11px] font-sans ${
                    isSelected ? 'text-[#40513B] font-bold' : 'text-[#444841] font-medium'
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
