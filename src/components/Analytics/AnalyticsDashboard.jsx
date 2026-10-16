import React, { useState, useMemo } from 'react';
import SharedActivitySection from './SharedActivitySection';
import RingChart from '../animata/graphs/ring-chart';

const getLocalDateStr = (d) => {
  try {
    const dt = d ? new Date(d) : new Date();
    if (isNaN(dt.getTime())) return new Date().toISOString().split('T')[0];
    const z = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
    return z.toISOString().split('T')[0];
  } catch {
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

const TAILWIND_COLORS = [
  'var(--theme-primary)',
  'var(--theme-secondary)',
  'var(--theme-sage)',
  'var(--theme-celadon)',
];

const toTitleCase = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

function AnalyticsDashboard({
  projects = [],
  sessions = [],
  settings = {},
  period: controlledPeriod,
  setPeriod: controlledSetPeriod,
  offset: controlledOffset,
  setOffset: controlledSetOffset,
  hideHeader = false,
}) {
  const [internalPeriod, setInternalPeriod] = useState('Daily');
  const [internalOffset, setInternalOffset] = useState(0);

  const currentPeriod = controlledPeriod !== undefined ? controlledPeriod : internalPeriod;
  const setCurrentPeriod = controlledSetPeriod || setInternalPeriod;
  const currentOffset = controlledOffset !== undefined ? controlledOffset : internalOffset;
  const setCurrentOffset = controlledSetOffset || setInternalOffset;

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
    const projList =
      projects && projects.length
        ? projects
        : [
            { id: 'proj-1', name: '01 // STUDY', color: TAILWIND_COLORS[0] },
            { id: 'proj-2', name: '02 // PERSONAL_APP_DEV', color: TAILWIND_COLORS[1] },
            { id: 'proj-3', name: '03 // SYS_ARCHITECTURE', color: TAILWIND_COLORS[2] },
          ];

    // Single-pass O(N) grouping by projectId
    const projStats = new Map();
    (filteredSessions || []).forEach((s) => {
      const pid = s.projectId || projList[0]?.id || 'default';
      const dur = s.duration || 25;
      const cur = projStats.get(pid) || { count: 0, mins: 0 };
      projStats.set(pid, { count: cur.count + 1, mins: cur.mins + dur });
    });

    const filtered = projList
      .map((proj, idx) => {
        const stats = projStats.get(proj.id) || { count: 0, mins: 0 };
        const pct = totalMins > 0 ? Math.round((stats.mins / totalMins) * 100) : 0;
        const rawLabel = proj.name.replace(/^[0-9]+\s*(\/\/|·|\.)\s*/, '').replace(/_/g, ' ');
        return {
          label: toTitleCase(rawLabel),
          pct,
          count: stats.count,
          mins: stats.mins,
          displayTime: formatDisplayHours(stats.mins),
          color:
            proj.color?.startsWith('var(') || !proj.color
              ? TAILWIND_COLORS[idx % TAILWIND_COLORS.length]
              : proj.color,
        };
      })
      .filter((seg) => seg.pct > 0 || seg.count > 0)
      .sort((a, b) => b.mins - a.mins);

    return filtered.length
      ? filtered
      : [
          {
            label: 'No Data',
            pct: 100,
            count: 0,
            mins: 0,
            displayTime: '0h 00m',
            color: 'var(--theme-track, #C8D8CC)',
          },
        ];
  }, [projects, filteredSessions, totalMins]);

  return (
    <main
      className={`flex-1 w-full bg-[#F0F2EF] ${
        hideHeader ? 'pt-4' : 'pt-14'
      } pb-36 min-h-[100dvh] relative text-[#1B1F1A] select-none`}
    >
      <div className="flex flex-col w-full px-5 pb-12 gap-3.5 max-w-[440px] mx-auto">
        <SharedActivitySection
          showKPIs={true}
          sessions={sessions}
          settings={settings}
          period={currentPeriod}
          setPeriod={setCurrentPeriod}
          offset={currentOffset}
          setOffset={setCurrentOffset}
          hideHeader={hideHeader}
        />

        {/* Focus Distribution Donut Card from Figma: 400px x 156px rounded-[18px] */}
        <div className="bg-white rounded-[18px] p-4 border border-[#D6E0D4] shadow-[0px_2px_8px_rgba(27,31,26,0.031)] flex flex-col gap-4">
          <span className="text-[9px] uppercase tracking-[1.2px] text-[#8B9E87] font-extrabold font-sans">
            FOCUS DISTRIBUTION
          </span>

          <div className="flex items-center gap-5">
            {/* Donut Chart: 96px x 96px */}
            <div className="relative shrink-0 w-[96px] h-[96px] flex items-center justify-center">
              <RingChart
                size={55}
                gap={6}
                width={10}
                rings={activeSegments.map((seg) => ({
                  progress: seg.pct,
                  color: seg.color,
                  trackColor: '#E8EDE6',
                }))}
              >
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[13px] leading-[18px] text-[#1B1F1A] font-extrabold font-sans tracking-[-0.3px]">
                    {displayTotalTime}
                  </span>
                  <span className="text-[8px] leading-[11px] uppercase font-bold text-[#8B9E87] tracking-[1px] font-sans">
                    TOTAL
                  </span>
                </div>
              </RingChart>
            </div>

            {/* Legend & Progress Tracks from Figma */}
            <div className="flex-1 flex flex-col gap-2.5 min-w-0 justify-center">
              {activeSegments.slice(0, 3).map((seg) => (
                <div key={seg.label} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: seg.color }}
                      />
                      <span className="text-[11px] leading-[15px] font-medium text-[#41493F] truncate font-sans">
                        {seg.label}
                      </span>
                    </div>
                    <span className="text-[11px] leading-[15px] text-[#667463] shrink-0 font-bold font-sans">
                      {seg.pct}%
                    </span>
                  </div>

                  {/* 5px Progress Track from Figma (GPU scaleX) */}
                  <div className="w-full h-[5px] rounded-full bg-[#E8EDE6] overflow-hidden">
                    <div
                      className="w-full h-full rounded-full origin-left transition-transform duration-500 ease-out"
                      style={{
                        transform: `scaleX(${Math.max(0.02, seg.pct / 100)})`,
                        backgroundColor: seg.color,
                        willChange: 'transform',
                      }}
                    />
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
