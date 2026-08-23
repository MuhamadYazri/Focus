import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

const G = "'Geist', system-ui, sans-serif";
const M = "'JetBrains Mono', monospace";

const PERIODS = ['All', 'Daily', 'Weekly', 'Monthly', 'Yearly'];
const HMAP_FILL = ['var(--surface-low)', 'var(--accent-pale)', '#A8F1FF', '#6FE6FC', 'var(--accent)'];
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

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
  const maxBarH = 48;

  const isAll = period === 'All';

  const getDateRangeLabel = (p, off) => {
    const d = new Date(now);
    if (p === 'Daily') {
      d.setDate(d.getDate() + off);
      const isToday = off === 0;
      const isYesterday = off === -1;
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
      const sStr = sun.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
        const curSess = (sessions || []).filter(s => {
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
  let chartTitle = 'Focus distribution';
  let chartPeakLabel = 'No activity';
  let chartSubLabel = 'Time breakdown';

  if (period === 'Daily') {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + offset);
    const targetStr = getLocalDateStr(targetDate);
    const daySessions = (sessions || []).filter(s => {
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
      const dSess = (sessions || []).filter(s => {
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
    activeChart = dailySlots.map(s => ({
      ...s,
      v: maxDayMins > 0 ? s.mins / maxDayMins : 0,
      isPeak: maxDayMins > 0 && s.mins === maxDayMins,
    }));
    chartTitle = 'Total per day (Week)';
    chartPeakLabel = maxDayMins > 0 ? `Peak: ${peakDayLabel} (${formatTimeNoDecimals(maxDayMins)})` : 'No activity';
    chartSubLabel = 'Hours focused by day of week';
    activeHeatmap = generateHeatmapGrid(targetDate, targetStr, targetStr);

  } else if (period === 'Weekly') {
    const dayOfWeek = now.getDay() || 7;
    const wkStart = new Date(now);
    wkStart.setDate(now.getDate() - dayOfWeek + 1 + offset * 7);
    const wkEnd = new Date(wkStart);
    wkEnd.setDate(wkStart.getDate() + 6);
    const sStr = getLocalDateStr(wkStart);
    const eStr = getLocalDateStr(wkEnd);

    const weekSessions = (sessions || []).filter(s => {
      const dt = s.dateStr || (s.completedAt && s.completedAt.split('T')[0]);
      return dt >= sStr && dt <= eStr;
    });
    const totalMins = weekSessions.reduce((acc, s) => acc + (s.duration || 25), 0);
    displayHours = formatDisplayHours(totalMins);
    displayPomos = weekSessions.length;
    const uniqueDays = new Set(weekSessions.map(s => s.dateStr || (s.completedAt && s.completedAt.split('T')[0]))).size;
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
      const wSess = (sessions || []).filter(s => {
        const dt = s.dateStr || (s.completedAt && s.completedAt.split('T')[0]);
        return dt >= csStr && dt <= ceStr;
      });
      const mins = wSess.reduce((acc, s) => acc + (s.duration || 25), 0);
      const label = i === 0 ? 'This Wk' : `${Math.abs(i)}Wk Ago`;
      if (mins > maxWkMins) { maxWkMins = mins; peakWkLabel = label; }
      weeklySlots.push({ h: label, mins, val: mins > 0 ? formatTimeNoDecimals(mins) : '0h', isCurrent: i === 0 });
    }
    activeChart = weeklySlots.map(s => ({
      ...s,
      v: maxWkMins > 0 ? s.mins / maxWkMins : 0,
      isPeak: maxWkMins > 0 && s.mins === maxWkMins,
    }));
    chartTitle = 'Total per week (Last 4 Weeks)';
    chartPeakLabel = maxWkMins > 0 ? `Peak: ${peakWkLabel} (${formatTimeNoDecimals(maxWkMins)})` : 'No activity';
    chartSubLabel = 'Hours focused by weekly interval';
    activeHeatmap = generateHeatmapGrid(wkEnd, sStr, eStr);

  } else if (period === 'Monthly') {
    const targetMoDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const yrStr = String(targetMoDate.getFullYear());
    const moNum = targetMoDate.getMonth();
    const prefix = `${yrStr}-${String(moNum + 1).padStart(2, '0')}`;

    const moSessions = (sessions || []).filter(s => (s.dateStr || s.completedAt || '').startsWith(prefix));
    const totalMins = moSessions.reduce((acc, s) => acc + (s.duration || 25), 0);
    displayHours = formatDisplayHours(totalMins);
    displayPomos = moSessions.length;
    const uniqueDays = new Set(moSessions.map(s => s.dateStr || (s.completedAt && s.completedAt.split('T')[0]))).size;
    displaySubToday = `${formatTimeNoDecimals(totalMins / Math.max(1, uniqueDays))} avg / active day`;
    displaySubDays = `${uniqueDays} days focused`;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let maxMoMins = 0;
    let peakMoLabel = 'None';
    const monthlySlots = monthNames.map((mName, idx) => {
      const pfx = `${yrStr}-${String(idx + 1).padStart(2, '0')}`;
      const mSess = (sessions || []).filter(s => (s.dateStr || s.completedAt || '').startsWith(pfx));
      const mins = mSess.reduce((acc, s) => acc + (s.duration || 25), 0);
      if (mins > maxMoMins) { maxMoMins = mins; peakMoLabel = mName; }
      return {
        h: mName,
        mins,
        val: mins > 0 ? formatTimeNoDecimals(mins) : '0h',
        isCurrent: idx === moNum,
      };
    });
    activeChart = monthlySlots.map(s => ({
      ...s,
      v: maxMoMins > 0 ? s.mins / maxMoMins : 0,
      isPeak: maxMoMins > 0 && s.mins === maxMoMins,
    }));
    chartTitle = `Total per month (${yrStr})`;
    chartPeakLabel = maxMoMins > 0 ? `Peak: ${peakMoLabel} (${formatTimeNoDecimals(maxMoMins)})` : 'No activity';
    chartSubLabel = `Hours focused across ${yrStr}`;
    const endOfMo = (offset === 0 && now.getMonth() === moNum && now.getFullYear() === Number(yrStr))
      ? now
      : new Date(Number(yrStr), moNum + 1, 0);
    const moStart = `${yrStr}-${String(moNum + 1).padStart(2, '0')}-01`;
    const moEnd = getLocalDateStr(new Date(Number(yrStr), moNum + 1, 0));
    activeHeatmap = generateHeatmapGrid(endOfMo, moStart, moEnd);

  } else if (period === 'Yearly') {
    const targetYr = now.getFullYear() + offset;
    const yrStr = String(targetYr);
    const yrSessions = (sessions || []).filter(s => (s.dateStr || s.completedAt || '').startsWith(yrStr));
    const totalMins = yrSessions.reduce((acc, s) => acc + (s.duration || 25), 0);
    displayHours = formatDisplayHours(totalMins);
    displayPomos = yrSessions.length;
    const uniqueDays = new Set(yrSessions.map(s => s.dateStr || (s.completedAt && s.completedAt.split('T')[0]))).size;
    displaySubToday = `${formatTimeNoDecimals(totalMins / Math.max(1, uniqueDays))} avg / active day`;
    displaySubDays = `${uniqueDays} days focused`;

    const years = [targetYr - 2, targetYr - 1, targetYr];
    let maxYrMins = 0;
    let peakYrLabel = 'None';
    const yearlySlots = years.map(y => {
      const yStr = String(y);
      const ySess = (sessions || []).filter(s => (s.dateStr || s.completedAt || '').startsWith(yStr));
      const mins = ySess.reduce((acc, s) => acc + (s.duration || 25), 0);
      if (mins > maxYrMins) { maxYrMins = mins; peakYrLabel = yStr; }
      return {
        h: yStr,
        mins,
        val: mins > 0 ? formatTimeNoDecimals(mins) : '0h',
        isCurrent: y === targetYr,
      };
    });
    activeChart = yearlySlots.map(s => ({
      ...s,
      v: maxYrMins > 0 ? s.mins / maxYrMins : 0,
      isPeak: maxYrMins > 0 && s.mins === maxYrMins,
    }));
    chartTitle = 'Total per year';
    chartPeakLabel = maxYrMins > 0 ? `Peak: ${peakYrLabel} (${formatTimeNoDecimals(maxYrMins)})` : 'No activity';
    chartSubLabel = 'Annual focus time progression';
    activeHeatmap = generateHeatmapGrid(new Date(targetYr, 11, 31));

  } else if (period === 'All') {
    const totalMins = (sessions || []).reduce((acc, s) => acc + (s.duration || 25), 0);
    displayHours = formatDisplayHours(totalMins);
    displayPomos = (sessions || []).length;
    const uniqueDays = new Set((sessions || []).map(s => s.dateStr || (s.completedAt && s.completedAt.split('T')[0]))).size;
    displaySubToday = `${formatTimeNoDecimals(totalMins / Math.max(1, uniqueDays))} avg / active day`;
    displaySubDays = `${uniqueDays} active days total`;
    activeHeatmap = generateHeatmapGrid(now);
  }

  const dateLabel = getDateRangeLabel(period, offset);

  // Notify parent of period/data changes
  useEffect(() => {
    if (onPeriodChange) {
      onPeriodChange({ period, offset, dateLabel, displayHours, displayPomos, displaySubToday, displaySubDays });
    }
  }, [period, offset, sessions]);

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs Row */}
      <div className="animate-slideUp" style={{ animationDelay: '0.05s' }}>
        <div className="flex rounded-xl p-1 gap-1" style={{ background: 'var(--surface-low)' }}>
          {PERIODS.map((p) => {
            const active = p === period;
            return (
              <button
                key={p}
                onClick={() => {
                  if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
                  setPeriod(p);
                  setOffset(0);
                }}
                className="flex-1 py-2 rounded-lg transition-all"
                style={{
                  background: active ? 'var(--surface-card)' : 'transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: active ? 'var(--shadow-soft)' : 'none',
                }}
              >
                <span style={{ fontFamily: M, fontSize: 10, fontWeight: active ? 700 : 500 }}>{p}</span>
              </button>
            );
          })}
        </div>

        {/* Date Slider */}
        <div
          className="flex items-center justify-between mt-2 px-3 py-2 rounded-xl"
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--surface-border)',
            opacity: isAll ? 0.4 : 1,
            pointerEvents: isAll ? 'none' : 'auto',
          }}
        >
          <button
            onClick={() => {
              if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
              setOffset((prev) => prev - 1);
            }}
            disabled={isAll}
            className="p-1 rounded transition-all active:scale-90 disabled:opacity-30"
            style={{ color: 'var(--text-secondary)' }}>
            <span style={{ fontFamily: M, fontSize: 11, fontWeight: 700 }}>{'< PREV'}</span>
          </button>
          <span style={{ fontFamily: M, fontSize: 10, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
            {isAll ? `All Time (${displaySubDays})` : getDateRangeLabel(period, offset)}
          </span>
          <button
            onClick={() => {
              if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
              setOffset((prev) => Math.min(0, prev + 1));
            }}
            disabled={isAll || offset >= 0}
            className="p-1 rounded transition-all active:scale-90 disabled:opacity-30"
            style={{ color: 'var(--text-secondary)' }}>
            <span style={{ fontFamily: M, fontSize: 11, fontWeight: 700 }}>{'NEXT >'}</span>
          </button>
        </div>
      </div>

      {/* KPI Row (Only shown when requested or in Reports) */}
      {showKPIs && (
        <div className="grid grid-cols-2 gap-3 animate-slideUp" style={{ animationDelay: '0.1s' }}>
          <div
            className="card-2xl p-4"
            style={{ borderLeft: '3px solid var(--accent)' }}
          >
            <p style={{ fontFamily: M, fontSize: 10, color: 'var(--text-muted)' }}>FOCUS TIME</p>
            <p style={{ fontFamily: G, fontSize: 22, color: 'var(--text-primary)', fontWeight: 700, marginTop: 4, letterSpacing: '-0.03em' }}>
              {displayHours}
            </p>
            <p style={{ fontFamily: M, fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>{displaySubToday}</p>
          </div>
          <div
            className="card-2xl p-4"
            style={{ borderLeft: '3px solid var(--accent-soft)' }}
          >
            <p style={{ fontFamily: M, fontSize: 10, color: 'var(--text-muted)' }}>SESSIONS</p>
            <p style={{ fontFamily: G, fontSize: 22, color: 'var(--text-primary)', fontWeight: 700, marginTop: 4, letterSpacing: '-0.03em' }}>
              {displayPomos.toLocaleString()}
            </p>
            <p style={{ fontFamily: M, fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>{displaySubDays}</p>
          </div>
        </div>
      )}

      {/* Activity Heatmap Grid (Hidden when period === 'All' or 'Yearly') */}
      {!isAll && period !== 'Yearly' && (
        <div className="animate-slideUp" style={{ animationDelay: '0.15s' }}>
          <div className="card-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontFamily: M, fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>ACTIVITY GRID</span>
              <span style={{ fontFamily: M, fontSize: 10, color: 'var(--text-muted)' }}>5×7 month</span>
            </div>
            <div className="flex gap-[3px] mb-1">
              {DAY_LABELS.map((d, i) => (
                <div
                  key={i}
                  style={{ flex: 1, textAlign: 'center', fontFamily: M, fontSize: 9, color: 'var(--text-muted)', fontWeight: 500 }}
                >{d}</div>
              ))}
            </div>
            <div className="flex flex-col gap-[3px]">
              {activeHeatmap.map((week, wi) => (
                <div key={wi} className="flex gap-[3px]">
                  {week.map((cell, di) => {
                    const dayNum = cell && cell.dayNum !== undefined ? cell.dayNum : (wi * 7 + di + 1);
                    const targetHours = cell && cell.targetHours !== undefined ? cell.targetHours : 4.0;
                    const achievedHours = cell && cell.achievedHours !== undefined ? cell.achievedHours : 0;
                    const val = cell && cell.val !== undefined ? cell.val : 0;
                    const isGoalMet = val > 0 && achievedHours >= targetHours;
                    const isCur = !!cell.isCurrent;

                    // Compute fill — current cell gets a subtle overlay tint
                    const baseFill = HMAP_FILL[val];
                    const cellBg = isCur && val === 0
                      ? 'rgba(185, 218, 255, 0.06)'
                      : baseFill;

                    return (
                      <div
                        key={di}
                        className="transition-all duration-200 cursor-pointer hover:scale-105 hover:z-10"
                        title={`${cell.dateStr || `Day ${dayNum}`}: ${achievedHours}h / ${targetHours}h goal`}
                        style={{
                          flex: 1,
                          height: 36,
                          background: cellBg,
                          borderRadius: 6,
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: isCur
                            ? '1.5px solid var(--accent)'
                            : '1px solid var(--surface-border)',
                          boxShadow: isCur ? '0 0 8px rgba(78, 215, 241, 0.3)' : 'none',
                        }}
                      >
                        {/* Day number — always visible */}
                        <span
                          style={{
                            fontFamily: M,
                            fontSize: 8,
                            color: !cell.isSameMonth
                              ? 'var(--surface-mid)'
                              : isCur
                                ? 'var(--accent)'
                                : val >= 3 ? 'var(--text-secondary)' : val > 0 ? 'var(--text-muted)' : 'var(--text-muted)',
                            position: 'absolute',
                            top: 3,
                            left: 4,
                            fontWeight: isCur ? 800 : 600,
                            letterSpacing: '-0.02em',
                          }}
                        >
                          {dayNum}
                        </span>

                        {/* Status indicator */}
                        {isGoalMet ? (
                          <div
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              background: isCur
                                ? 'var(--accent)'
                                : 'var(--accent-soft)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: isCur ? '0 0 8px rgba(78,215,241,0.6)' : 'none',
                            }}
                          >
                            <Check size={8} color={'#fff'} strokeWidth={3.5} />
                          </div>
                        ) : val > 0 ? (
                          <div
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              border: isCur ? '2px solid var(--accent)' : '1.5px solid var(--accent-pale)',
                              background: isCur ? 'rgba(78,215,241,0.1)' : 'transparent',
                              boxShadow: isCur ? '0 0 6px rgba(78,215,241,0.3)' : 'none',
                            }}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Time Distribution Bar Chart (Hidden when period === 'All') */}
      {!isAll && (
        <div className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
          <div
            className="card-2xl p-4 transition-all duration-300 hover:shadow-ambient"
          >
            <div className="flex items-center justify-between ">
              <span style={{ fontFamily: M, fontSize: 10, color: 'var(--text-secondary)' }}>{chartTitle}</span>
              <span style={{ fontFamily: M, fontSize: 10, color: 'var(--accent)' }}>{chartPeakLabel}</span>
            </div>
            <br />
            <p style={{ fontFamily: M, fontSize: 10, color: 'var(--text-muted)', marginBottom: 36 }}>{chartSubLabel}</p>
            <div className="flex items-end gap-[4px]" style={{ height: maxBarH + 20 }}>
              {activeChart.map((slot) => {
                const hasVal = slot.v > 0;
                const barH = Math.max(3, slot.v * maxBarH);
                return (
                  <div key={slot.h} className="flex flex-col items-center gap-1 min-w-0" style={{ flex: 1 }}>
                    <span
                      style={{
                        fontFamily: M,
                        fontSize: 9,
                        color: slot.isCurrent && hasVal ? 'var(--accent)' : (hasVal ? 'var(--text-secondary)' : 'var(--text-muted)'),
                        fontWeight: slot.isCurrent ? 700 : (hasVal ? 600 : 400),
                      }}
                      className="truncate max-w-full"
                    >
                      {slot.val}
                    </span>
                    <div
                      style={{
                        width: '100%',
                        height: maxBarH,
                        display: 'flex',
                        alignItems: 'flex-end',
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          height: barH,
                          background: slot.isCurrent && hasVal ? 'var(--accent)' : (hasVal ? 'var(--accent-pale)' : 'var(--surface-low)'),
                          borderRadius: '2px 2px 0 0',
                          transition: 'height 0.3s ease',
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontFamily: M,
                        fontSize: 9,
                        color: slot.isCurrent ? 'var(--accent)' : (hasVal ? 'var(--text-primary)' : 'var(--text-secondary)'),
                        fontWeight: slot.isCurrent ? 700 : (hasVal ? 600 : 400),
                      }}
                      className="truncate max-w-full"
                    >{slot.h}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ height: 1, background: 'var(--surface-border)', marginTop: 4 }} />
          </div>
        </div>
      )}
    </div>
  );
}
