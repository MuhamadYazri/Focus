import React, { useState } from 'react';
import SharedActivitySection from './SharedActivitySection';

const G = "'Geist', system-ui, sans-serif";
const M = "'JetBrains Mono', monospace";

function polarToXY(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutArc(cx, cy, r, ri, s, e) {
  const a = polarToXY(cx, cy, r, s),
    b = polarToXY(cx, cy, r, e);
  const c = polarToXY(cx, cy, ri, e),
    d = polarToXY(cx, cy, ri, s);
  const lg = e - s > 180 ? 1 : 0;
  return `M${a.x} ${a.y} A${r} ${r} 0 ${lg} 1 ${b.x} ${b.y} L${c.x} ${c.y} A${ri} ${ri} 0 ${lg} 0 ${d.x} ${d.y}Z`;
}

function getDateRangeLabel(period, offset) {
  const now = new Date();
  if (period === 'Daily') {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    if (offset === 0) return `Today (${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
    if (offset === -1) return `Yesterday (${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  if (period === 'Weekly') {
    const day = now.getDay() || 7;
    const start = new Date(now);
    start.setDate(now.getDate() - day + 1 + offset * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const sStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const eStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${sStr} – ${eStr}`;
  }
  if (period === 'Monthly') {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  if (period === 'Yearly') {
    return `${now.getFullYear() + offset}`;
  }
  return '';
}

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
}export default function AnalyticsDashboard({ tasks = [], projects = [], sessions = [] }) {
  const [currentPeriod, setCurrentPeriod] = useState('Daily');
  const [currentOffset, setCurrentOffset] = useState(0);

  const cx = 70,
    cy = 70,
    r = 54,
    ri = 36,
    gap = 4;
  let deg = 0;

  const formatDisplayHours = (mins) => {
    if (!mins || mins <= 0) return '0h 00m';
    const rounded = Math.round(mins);
    const h = Math.floor(rounded / 60);
    const m = rounded % 60;
    return `${h}h ${m < 10 ? '0' : ''}${m}m`;
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const filteredSessions = filterSessionsForPeriod(sessions, currentPeriod, currentOffset);
  const totalMins = (filteredSessions || []).reduce((acc, s) => acc + (s.duration || 25), 0);
  const displayTotalTime = formatDisplayHours(totalMins);

  const computedSegments = (projects && projects.length ? projects : [
    { id: 'proj-1', name: '01 // STUDY', color: '#B9DAFF' },
    { id: 'proj-2', name: '02 // PERSONAL_APP_DEV', color: '#8BA0B0' },
    { id: 'proj-3', name: '03 // SYS_ARCHITECTURE', color: '#A1A1AA' },
  ])
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
        color: proj.color || '#B9DAFF',
      };
    })
    .filter((seg) => seg.pct > 0 || seg.count > 0)
    .sort((a, b) => b.mins - a.mins);

  const activeSegments = computedSegments.length ? computedSegments : [{ label: 'No Data', pct: 100, count: 0, mins: 0, displayTime: '0h 00m', color: '#27272A' }];

  return (
    <div className="min-h-[100dvh] pb-32" style={{ fontFamily: G, background: 'var(--canvas)' }}>

      {/* ── Sticky Header ── */}
      <header className="glass sticky top-0 z-40 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined fill" style={{ color: 'var(--text-primary)', fontSize: 22 }}>bar_chart</span>
          <h1 style={{ fontFamily: G, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Reports</h1>
        </div>
        <span style={{ fontFamily: M, fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>FOCUS</span>
      </header>

      <div className="px-5 pt-5 flex flex-col gap-5 max-w-md mx-auto">

      {/* Shared Activity Section with interactive tabs, checkmark heatmap, and dynamic chart */}
      <SharedActivitySection
        showKPIs={true}
        sessions={sessions}
        onPeriodChange={(data) => {
          setCurrentPeriod(data.period);
          setCurrentOffset(data.offset);
        }}
      />

        {/* ── Donut Card ── */}
        <div className="card-2xl p-6">
          <span style={{ fontFamily: M, fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.06em', display: 'block', marginBottom: 16 }}>FOCUS DISTRIBUTION</span>
          <div className="flex items-center gap-5">
            {/* Donut SVG */}
            <svg width={140} height={140} viewBox="0 0 140 140" style={{ flexShrink: 0 }}>
              <circle cx={cx} cy={cy} r={(r + ri) / 2} fill="none" stroke="var(--surface-low)" strokeWidth={r - ri} />
              {activeSegments.map((seg) => {
                const sweep = (seg.pct / 100) * 360;
                const s = deg + gap / 2;
                const e = deg + sweep - gap / 2;
                const path = donutArc(cx, cy, r, ri, s, e);
                deg += sweep;
                return <path key={seg.label} d={path} fill={seg.color} opacity={0.9} />;
              })}
              <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--text-primary)" fontSize={14} fontWeight={700} fontFamily="Geist">{displayTotalTime}</text>
              <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-secondary)" fontSize={9} fontFamily="JetBrains Mono">TOTAL</text>
            </svg>

            {/* Legend */}
            <div className="flex flex-col gap-3 flex-1 min-w-0">
              {activeSegments.map((seg) => (
                <div key={seg.label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
                      <span style={{ fontFamily: G, fontSize: 12, color: 'var(--text-primary)' }} className="truncate">{seg.label}</span>
                    </div>
                    <span style={{ fontFamily: M, fontSize: 11, color: 'var(--text-secondary)', marginLeft: 6, flexShrink: 0 }}>{seg.pct}%</span>
                  </div>
                  <div style={{ width: '100%', height: 4, background: 'var(--surface-low)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${seg.pct}%`, background: seg.color, borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
