import React, { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

const G = "Geist, 'Helvetica Neue', sans-serif";
const M = "'JetBrains Mono', monospace";

const PERIODS = ['All', 'Daily', 'Weekly', 'Monthly', 'Yearly'];

const HEATMAP = [
  [0, 2, 3, 1, 4, 2, 0],
  [1, 3, 4, 2, 3, 1, 0],
  [2, 4, 3, 4, 2, 3, 1],
  [0, 1, 2, 3, 4, 3, 0],
];
const HMAP_FILL = ['#0F0F0F', '#1A2A38', '#2A4055', '#4A7090', '#B9DAFF'];
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const HMAP_DAILY = [
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 4, 0, 0, 0],
];

const HMAP_WEEKLY = [
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 3, 0, 4, 0, 3, 0],
];

const HMAP_APR = [
  [0, 2, 0, 1, 0, 2, 0],
  [1, 0, 2, 0, 1, 0, 0],
  [0, 1, 0, 2, 0, 1, 0],
  [0, 0, 1, 0, 2, 0, 0],
];

const HMAP_MAY = [
  [1, 3, 2, 4, 1, 3, 0],
  [2, 3, 1, 3, 2, 0, 1],
  [3, 2, 4, 1, 3, 2, 0],
  [1, 3, 2, 3, 0, 1, 0],
];

const HMAP_JUN = [
  [3, 4, 4, 3, 4, 3, 2],
  [4, 3, 4, 4, 3, 4, 3],
  [3, 4, 3, 4, 4, 3, 4],
  [4, 3, 4, 4, 3, 4, 2],
];

const HMAP_JUL = [
  [0, 0, 4, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
];

// Time distribution chart definitions based on user rules
const CHART_DAILY = [
  { h: 'Mon', v: 0.0, val: '0h' },
  { h: 'Tue', v: 0.0, val: '0h' },
  { h: 'Wed', v: 1.0, val: '4.2h', isPeak: true },
  { h: 'Thu', v: 0.0, val: '0h' },
  { h: 'Fri', v: 0.0, val: '0h' },
  { h: 'Sat', v: 0.0, val: '0h' },
  { h: 'Sun', v: 0.0, val: '0h' },
];

const CHART_WEEKLY = [
  { h: 'Wk 1', v: 1.0, val: '18.3h', isPeak: true },
  { h: 'Wk 2', v: 0.6, val: '11.0h' },
  { h: 'Wk 3', v: 0.8, val: '14.5h' },
  { h: 'Wk 4', v: 0.7, val: '12.8h' },
];

const CHART_MONTHLY = [
  { h: 'Jan', v: 0.1, val: '12h' },
  { h: 'Feb', v: 0.15, val: '18h' },
  { h: 'Mar', v: 0.18, val: '22h' },
  { h: 'Apr', v: 0.2, val: '26.5h' },
  { h: 'May', v: 0.5, val: '65.5h' },
  { h: 'Jun', v: 1.0, val: '130.6h', isPeak: true },
  { h: 'Jul', v: 0.03, val: '4.2h' },
  { h: 'Aug', v: 0.0, val: '0h' },
  { h: 'Sep', v: 0.0, val: '0h' },
  { h: 'Oct', v: 0.0, val: '0h' },
  { h: 'Nov', v: 0.0, val: '0h' },
  { h: 'Dec', v: 0.0, val: '0h' },
];

const CHART_YEARLY = [
  { h: '2024', v: 0.25, val: '190h' },
  { h: '2025', v: 0.55, val: '415h' },
  { h: '2026', v: 1.0, val: '758.4h', isPeak: true },
];

export default function SharedActivitySection({ showKPIs = true, onPeriodChange }) {
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
      if (off === 0) return 'June 29 – July 5, 2026';
      if (off === -1) return 'June 22 – June 28, 2026';
      if (off === -2) return 'June 15 – June 21, 2026';
      const start = new Date(d);
      start.setDate(start.getDate() + off * 7 - start.getDay());
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    if (p === 'Monthly') {
      if (off === 0) return 'July 2026';
      if (off === -1) return 'June 2026';
      if (off === -2) return 'May 2026';
      if (off === -3) return 'April 2026';
      const m = new Date(d.getFullYear(), d.getMonth() + off, 1);
      return m.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    if (p === 'Yearly') {
      return `${d.getFullYear() + off}`;
    }
    return 'All Time';
  };

  // Determine active dataset based on tab & offset
  let displayHours = '758h 26m';
  let displayPomos = 10008;
  let displaySubToday = 'all time focus record';
  let displaySubDays = '600 days focused';
  let activeHeatmap = HEATMAP;
  let activeChart = CHART_DAILY;
  let chartTitle = 'Focus distribution';
  let chartPeakLabel = 'Peak: Wed (4.2h)';
  let chartSubLabel = 'Daily focus time breakdown';

  if (period === 'Daily') {
    if (offset === 0) {
      displayHours = '4h 10m';
      displayPomos = 10;
      displaySubToday = '4h 10m today';
      displaySubDays = '1 day focused';
      activeHeatmap = HMAP_DAILY;
      activeChart = CHART_DAILY;
      chartTitle = 'Total per day';
      chartPeakLabel = 'Peak: Today (4.2h)';
      chartSubLabel = 'Hours focused by day of week';
    } else {
      displayHours = '0h 00m';
      displayPomos = 0;
      displaySubToday = '0h today';
      displaySubDays = '0 days focused';
      activeHeatmap = HMAP_DAILY.map(row => row.map(() => 0));
      activeChart = CHART_DAILY.map(item => ({ ...item, v: 0, val: '0h', isPeak: false }));
      chartTitle = 'Total per day';
      chartPeakLabel = 'No activity';
      chartSubLabel = 'Hours focused by day of week';
    }
  } else if (period === 'Weekly') {
    if (offset === 0) {
      displayHours = '18h 17m';
      displayPomos = 44;
      displaySubToday = '6h 6m avg / day';
      displaySubDays = '3 days focused';
      activeHeatmap = HMAP_WEEKLY;
      activeChart = CHART_WEEKLY;
      chartTitle = 'Total per week';
      chartPeakLabel = 'Peak: Wk 1 (18.3h)';
      chartSubLabel = 'Hours focused by week of month';
    } else {
      displayHours = '0h 00m';
      displayPomos = 0;
      displaySubToday = '0h avg / day';
      displaySubDays = '0 days focused';
      activeHeatmap = HMAP_WEEKLY.map(row => row.map(() => 0));
      activeChart = CHART_WEEKLY.map(item => ({ ...item, v: 0, val: '0h', isPeak: false }));
      chartTitle = 'Total per week';
      chartPeakLabel = 'No activity';
      chartSubLabel = 'Hours focused by week of month';
    }
  } else if (period === 'Monthly') {
    if (offset === 0) {
      displayHours = '4h 10m';
      displayPomos = 10;
      displaySubToday = '4h 10m avg / day';
      displaySubDays = '1 day focused';
      activeHeatmap = HMAP_JUL;
      activeChart = CHART_MONTHLY.map(m => ({ ...m, isPeak: m.h === 'Jul' }));
      chartTitle = 'Total per month';
      chartPeakLabel = 'Current: Jul (4.2h)';
      chartSubLabel = 'Hours focused across the year';
    } else if (offset === -1) {
      displayHours = '130h 35m';
      displayPomos = 314;
      displaySubToday = '4h 53m avg / day';
      displaySubDays = '27 days focused';
      activeHeatmap = HMAP_JUN;
      activeChart = CHART_MONTHLY;
      chartTitle = 'Total per month';
      chartPeakLabel = 'Peak: Jun (130.6h)';
      chartSubLabel = 'Hours focused across the year';
    } else if (offset === -2) {
      displayHours = '65h 33m';
      displayPomos = 157;
      displaySubToday = '3h 17m avg / day';
      displaySubDays = '20 days focused';
      activeHeatmap = HMAP_MAY;
      activeChart = CHART_MONTHLY.map(m => ({ ...m, isPeak: m.h === 'May' }));
      chartTitle = 'Total per month';
      chartPeakLabel = 'May: 65.5h';
      chartSubLabel = 'Hours focused across the year';
    } else if (offset === -3) {
      displayHours = '26h 27m';
      displayPomos = 64;
      displaySubToday = '2h 38m avg / day';
      displaySubDays = '10 days focused';
      activeHeatmap = HMAP_APR;
      activeChart = CHART_MONTHLY.map(m => ({ ...m, isPeak: m.h === 'Apr' }));
      chartTitle = 'Total per month';
      chartPeakLabel = 'Apr: 26.5h';
      chartSubLabel = 'Hours focused across the year';
    } else {
      displayHours = '0h 00m';
      displayPomos = 0;
      displaySubToday = '0h avg / day';
      displaySubDays = '0 days focused';
      activeHeatmap = HMAP_APR.map(row => row.map(() => 0));
      activeChart = CHART_MONTHLY.map(m => ({ ...m, v: 0, val: '0h', isPeak: false }));
      chartTitle = 'Total per month';
      chartPeakLabel = 'No activity';
      chartSubLabel = 'Hours focused across the year';
    }
  } else if (period === 'Yearly') {
    if (offset === 0) {
      displayHours = '226h 45m';
      displayPomos = 545;
      displaySubToday = '3h 54m avg / active day';
      displaySubDays = '58 days focused';
      activeHeatmap = HEATMAP;
      activeChart = CHART_YEARLY;
      chartTitle = 'Total per year';
      chartPeakLabel = 'Peak: 2026 (758.4h)';
      chartSubLabel = 'Annual focus time progression';
    } else {
      displayHours = '0h 00m';
      displayPomos = 0;
      displaySubToday = '0h avg';
      displaySubDays = '0 days focused';
      activeHeatmap = HEATMAP.map(row => row.map(() => 0));
      activeChart = CHART_YEARLY.map(y => ({ ...y, v: 0, val: '0h', isPeak: false }));
      chartTitle = 'Total per year';
      chartPeakLabel = 'No activity';
      chartSubLabel = 'Annual focus time progression';
    }
  } else if (period === 'All') {
    displayHours = '758h 26m';
    displayPomos = 10008;
    displaySubToday = '3h 48m avg / active day';
    displaySubDays = '600 days focused';
    activeHeatmap = HEATMAP;
  }

  const dateLabel = getDateRangeLabel(period, offset);

  // Notify parent of period/data changes
  useEffect(() => {
    if (onPeriodChange) {
      onPeriodChange({ period, offset, dateLabel, displayHours, displayPomos, displaySubToday, displaySubDays });
    }
  }, [period, offset]);

  const getDailyGoalHours = (dayNum) => {
    try {
      const hist = JSON.parse(localStorage.getItem('focus_daily_goals_history_v1') || '{}');
      const dateKey = `2026-07-${String(dayNum).padStart(2, '0')}`;
      if (hist && hist[dateKey]) return Number(hist[dateKey]);
      const st = JSON.parse(localStorage.getItem('focus_settings_v1') || '{}');
      return st && st.dailyGoalHours ? Number(st.dailyGoalHours) : 4.0;
    } catch (e) {
      return 4.0;
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs Row */}
      <div>
        <div className="flex bg-[#090A0C] border border-[#27272A] rounded-lg p-1 gap-1">
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
                className="flex-1 py-1.5 rounded transition-all active:scale-95"
                style={{
                  background: active ? '#B9DAFF' : 'transparent',
                  color: active ? '#000000' : '#8BA0B0',
                }}
              >
                <span style={{ fontFamily: M, fontSize: 10, fontWeight: active ? 700 : 500 }}>{p}</span>
              </button>
            );
          })}
        </div>

        {/* Date Slider */}
        <div
          className="flex items-center justify-between mt-2 px-3 py-1.5 bg-[#090A0C] border border-[#27272A] rounded-lg"
          style={{
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
            className="p-1 rounded transition-all active:scale-90 disabled:opacity-20 hover:bg-[#1A2530]"
            style={{ color: '#B9DAFF' }}
          >
            <span style={{ fontFamily: M, fontSize: 11, fontWeight: 700 }}>&lt; PREV</span>
          </button>
          <span
            style={{
              fontFamily: M,
              fontSize: 10,
              fontWeight: 600,
              color: '#FFFFFF',
              letterSpacing: '0.04em',
            }}
          >
            {isAll ? 'All Time (600 Days)' : getDateRangeLabel(period, offset)}
          </span>
          <button
            onClick={() => {
              if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
              setOffset((prev) => Math.min(0, prev + 1));
            }}
            disabled={isAll || offset >= 0}
            className="p-1 rounded transition-all active:scale-90 disabled:opacity-20 hover:bg-[#1A2530]"
            style={{ color: '#B9DAFF' }}
          >
            <span style={{ fontFamily: M, fontSize: 11, fontWeight: 700 }}>NEXT &gt;</span>
          </button>
        </div>
      </div>

      {/* KPI Row (Only shown when requested or in Reports) */}
      {showKPIs && (
        <div className="flex gap-2.5">
          <div
            style={{
              flex: 1,
              background: '#090A0C',
              border: '1px solid #27272A',
              borderLeft: '2px solid #B9DAFF',
              borderRadius: 8,
              padding: '10px 12px',
            }}
          >
            <p style={{ fontFamily: M, fontSize: 7, color: '#3F3F46' }}>Focus time</p>
            <p
              style={{
                fontFamily: M,
                fontSize: 16,
                color: '#FFFFFF',
                fontWeight: 700,
                marginTop: 4,
                letterSpacing: '-0.5px',
              }}
            >
              {displayHours}
            </p>
            <div className="flex items-center gap-1 mt-1.5">
              <span style={{ fontFamily: M, fontSize: 7, color: '#3F3F46' }}>{displaySubToday}</span>
            </div>
          </div>
          <div
            style={{
              flex: 1,
              background: '#090A0C',
              border: '1px solid #27272A',
              borderLeft: '2px solid #4A7090',
              borderRadius: 8,
              padding: '10px 12px',
            }}
          >
            <p style={{ fontFamily: M, fontSize: 7, color: '#3F3F46' }}>Pomodoros</p>
            <p
              style={{
                fontFamily: M,
                fontSize: 16,
                color: '#FFFFFF',
                fontWeight: 700,
                marginTop: 4,
                letterSpacing: '-0.5px',
              }}
            >
              {displayPomos.toLocaleString()}
            </p>
            <div className="flex items-center gap-1 mt-1.5">
              <span style={{ fontFamily: M, fontSize: 7, color: '#3F3F46' }}>{displaySubDays}</span>
            </div>
          </div>
        </div>
      )}

      {/* Activity Heatmap Grid (Hidden when period === 'All') */}
      {!isAll && (
        <div>
          <div
            style={{
              background: '#090A0C',
              border: '1px solid #27272A',
              borderRadius: 8,
              padding: '12px 14px',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <span style={{ fontFamily: M, fontSize: 8, color: '#A1A1AA' }}>Activity</span>
              <span style={{ fontFamily: M, fontSize: 7, color: '#3F3F46' }}>Last 4 weeks</span>
            </div>
            <div className="flex gap-[4px] mb-1.5">
              {DAY_LABELS.map((d, i) => (
                <div
                  key={i}
                  style={{ flex: 1, textAlign: 'center', fontFamily: M, fontSize: 7, color: '#3F3F46' }}
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-[4px]">
              {activeHeatmap.map((week, wi) => (
                <div key={wi} className="flex gap-[4px]">
                  {week.map((val, di) => {
                    const dayNum = wi * 7 + di + 1;
                    const targetHours = getDailyGoalHours(dayNum);
                    const achievedHours = val === 4 ? 4.2 : val * 1.2;
                    const isGoalMet = val > 0 && achievedHours >= targetHours;
                    const dateColor = val === 4 ? '#000000' : val >= 2 ? '#FFFFFF' : '#A1A1AA';

                    return (
                      <div
                        key={di}
                        style={{
                          flex: 1,
                          height: 34,
                          background: HMAP_FILL[val],
                          borderRadius: 4,
                          border: isGoalMet ? '1px solid #B9DAFF' : '1px solid #1A2530',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title={`Day ${dayNum}: ${achievedHours}h / ${targetHours}h goal`}
                      >
                        {isGoalMet ? (
                          <>
                            <span
                              style={{
                                fontFamily: M,
                                fontSize: 7,
                                color: dateColor,
                                position: 'absolute',
                                top: 2,
                                left: 3,
                                fontWeight: 700,
                              }}
                            >
                              {dayNum}
                            </span>
                            <div
                              style={{
                                width: 15,
                                height: 15,
                                borderRadius: '50%',
                                background: '#B9DAFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 0 6px rgba(185, 218, 255, 0.5)',
                              }}
                            >
                              <Check size={9} color="#000000" strokeWidth={3.5} />
                            </div>
                          </>
                        ) : (
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              border: val > 0 ? '1.5px solid #4A7090' : '1px solid #27272A',
                              borderTopColor: val > 0 ? '#B9DAFF' : '#27272A',
                              background: val > 0 ? 'rgba(74, 112, 144, 0.2)' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <span
                              style={{
                                fontFamily: M,
                                fontSize: 8,
                                fontWeight: 600,
                                color: dateColor,
                              }}
                            >
                              {dayNum}
                            </span>
                          </div>
                        )}
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
        <div>
          <div
            style={{
              background: '#090A0C',
              border: '1px solid #27272A',
              borderRadius: 8,
              padding: '12px 14px',
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span style={{ fontFamily: M, fontSize: 8, color: '#A1A1AA' }}>{chartTitle}</span>
              <span style={{ fontFamily: M, fontSize: 7, color: '#B9DAFF' }}>{chartPeakLabel}</span>
            </div>
            <p style={{ fontFamily: M, fontSize: 7, color: '#3F3F46', marginBottom: 10 }}>
              {chartSubLabel}
            </p>
            <div className="flex items-end gap-[4px]" style={{ height: maxBarH + 20 }}>
              {activeChart.map((slot) => {
                const isPeak = slot.isPeak || slot.isCurrent;
                const barH = Math.max(3, slot.v * maxBarH);
                return (
                  <div key={slot.h} className="flex flex-col items-center gap-1 min-w-0" style={{ flex: 1 }}>
                    <span
                      style={{
                        fontFamily: M,
                        fontSize: 5.5,
                        color: isPeak ? '#B9DAFF' : '#3F3F46',
                        fontWeight: isPeak ? 700 : 400,
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
                          background: isPeak ? '#B9DAFF' : '#1A2530',
                          borderRadius: '2px 2px 0 0',
                          transition: 'height 0.3s ease',
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontFamily: M,
                        fontSize: 6.5,
                        color: isPeak ? '#FFFFFF' : '#8BA0B0',
                        fontWeight: isPeak ? 600 : 400,
                      }}
                      className="truncate max-w-full"
                    >
                      {slot.h}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ height: 1, background: '#27272A', marginTop: 4 }} />
          </div>
        </div>
      )}
    </div>
  );
}
