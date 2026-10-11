import React, { useState, useMemo } from 'react';
import SharedActivitySection from './SharedActivitySection';

import RingChart from '../animata/graphs/ring-chart';

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

function filterSessionsForPeriod(sessions, period, offset) {
  if (!sessions || !sessions.length) return [];
  if (period === 'All') return sessions;
  const now = new Date();
  if (period === 'Daily') {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    const targetStr = getLocalDateStr(d);
    return sessions.filter((s) => {
      const sDt = s.dateStr || (s.completedAt && s.completedAt.split('T')[0]);
      return sDt === targetStr;
    });
  }
  if (period === 'Weekly') {
    const day = now.getDay() || 7;
    const start = new Date(now);
    start.setDate(now.getDate() - day + 1 + offset * 7);
    const startStr = getLocalDateStr(start);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const endStr = getLocalDateStr(end);
    return sessions.filter((s) => {
      const sDt = s.dateStr || (s.completedAt && s.completedAt.split('T')[0]);
      return sDt >= startStr && sDt <= endStr;
    });
  }
  if (period === 'Monthly') {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const monthStr = getLocalDateStr(d).slice(0, 7);
    return sessions.filter((s) => {
      const sDt = s.dateStr || (s.completedAt && s.completedAt.split('T')[0]);
      return sDt.startsWith(monthStr);
    });
  }
  if (period === 'Yearly') {
    const yearStr = String(now.getFullYear() + offset);
    return sessions.filter((s) => {
      const sDt = s.dateStr || (s.completedAt && s.completedAt.split('T')[0]);
      return sDt.startsWith(yearStr);
    });
  }
  return [];
}

const TAILWIND_COLORS = ['#E5D9B6', 'var(--theme-secondary)', 'var(--theme-primary)', '#D9CFC7'];

function AnalyticsDashboard({ tasks = [], projects = [], sessions = [] }) {
  const [currentPeriod, setCurrentPeriod] = useState('Daily');
  const [currentOffset, setCurrentOffset] = useState(0);

  const formatDisplayHours = (mins) => {
    if (!mins || mins <= 0) return '0h 00m';
    const rounded = Math.round(mins);
    const h = Math.floor(rounded / 60);
    const m = rounded % 60;
    return `${h}h ${m < 10 ? '0' : ''}${m}m`;
  };

  const filteredSessions = useMemo(() => {
    return filterSessionsForPeriod(sessions, currentPeriod, currentOffset);
  }, [sessions, currentPeriod, currentOffset]);

  const totalMins = useMemo(() => {
    return (filteredSessions || []).reduce((acc, s) => acc + (s.duration || 25), 0);
  }, [filteredSessions]);

  const displayTotalTime = useMemo(() => formatDisplayHours(totalMins), [totalMins]);

  const activeSegments = useMemo(() => {
    const projList = (projects && projects.length)
      ? projects
      : [
          { id: 'proj-1', name: '01 // STUDY', color: TAILWIND_COLORS[0] },
          { id: 'proj-2', name: '02 // PERSONAL_APP_DEV', color: TAILWIND_COLORS[1] },
          { id: 'proj-3', name: '03 // SYS_ARCHITECTURE', color: TAILWIND_COLORS[2] },
        ];

    const computed = projList
      .map((proj, idx) => {
        const projSessions = (filteredSessions || []).filter((s) => {
          return s.projectId === proj.id || (!s.projectId && idx === 0);
        });
        const count = projSessions.length;
        const projMins = projSessions.reduce((acc, s) => acc + (s.duration || 25), 0);
        const pct = totalMins > 0 ? Math.round((projMins / totalMins) * 100) : 0;
        return {
          label: proj.name.replace(/^[0-9]+\s*(\/\/|·|\.)\s*/, '').replace(/_/g, ' '),
          pct,
          count,
          mins: projMins,
          displayTime: formatDisplayHours(projMins),
          color:
            proj.color?.startsWith('var(') || !proj.color
              ? TAILWIND_COLORS[idx % TAILWIND_COLORS.length]
              : proj.color,
        };
      })
      .filter((seg) => seg.pct > 0 || seg.count > 0)
      .sort((a, b) => b.mins - a.mins);

    return computed.length
      ? computed
      : [{ label: 'No Data', pct: 100, count: 0, mins: 0, displayTime: '0h 00m', color: '#E5D9B6' }];
  }, [projects, filteredSessions, totalMins]);

  return (
    <main className="flex-1 w-full bg-canvas pt-15 pb-28 min-h-[100dvh] relative text-text-main selection:bg-primary selection:text-white">
      <div className="flex flex-col w-full px-5  pb-12 gap-3.5 max-w-md mx-auto">
        <SharedActivitySection
          showKPIs={true}
          sessions={sessions}
          onPeriodChange={(data) => {
            setCurrentPeriod(data.period);
            setCurrentOffset(data.offset);
          }}
        />

        {/* Focus Distribution Donut Card */}
        <div className="bg-surface rounded-2xl p-4 shadow-sm border border-border flex flex-col">
          <span className="text-[11px] uppercase tracking-wider text-secondary font-bold mb-3 font-sans">
            FOCUS DISTRIBUTION
          </span>
          <div className="flex items-center justify-between gap-4 py-1">
            {/* Animata Ring Chart */}
            <div className="relative shrink-0 flex items-center justify-center -ml-2 -mt-2">
              <RingChart
                size={60}
                gap={6}
                width={8}
                rings={activeSegments.map(seg => ({
                  progress: seg.pct,
                  color: seg.color,
                  trackColor: 'rgba(0,0,0,0.05)'
                }))}
              >
                <span className="text-sm text-text-main font-bold font-sans">
                  {displayTotalTime}
                </span>
                <span className="text-[9px] uppercase font-bold text-text-sub tracking-wider font-sans mt-0.5">
                  TOTAL
                </span>
              </RingChart>
            </div>

            {/* Legend & Baseline */}
            <div className="flex-1 flex flex-col gap-2.5 min-w-0 justify-center">
              {activeSegments.slice(0, 3).map((seg) => (
                <div key={seg.label} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: seg.color }}
                      ></span>
                      <span className="text-xs font-medium text-text-main truncate font-sans">
                        {seg.label}
                      </span>
                    </div>
                    <span className="text-xs text-secondary shrink-0 font-medium font-sans">
                      {seg.pct}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${seg.pct}%`, backgroundColor: seg.color }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default React.memo(AnalyticsDashboard);
