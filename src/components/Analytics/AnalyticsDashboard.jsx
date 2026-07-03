import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import SharedActivitySection from './SharedActivitySection';

const G = "Geist, 'Helvetica Neue', sans-serif";
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

function filterSessionsForPeriod(sessions, period, offset) {
  if (!sessions || !sessions.length) return [];
  if (period === 'All') return sessions;
  const now = new Date();
  if (period === 'Daily') {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    const targetStr = d.toISOString().split('T')[0];
    return sessions.filter((s) => s.dateStr === targetStr || (s.completedAt && s.completedAt.startsWith(targetStr)));
  }
  if (period === 'Weekly') {
    const day = now.getDay() || 7;
    const start = new Date(now);
    start.setDate(now.getDate() - day + 1 + offset * 7);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    const startTime = start.getTime();
    const endTime = end.getTime();
    return sessions.filter((s) => {
      const t = new Date(s.completedAt || s.dateStr || Date.now()).getTime();
      return t >= startTime && t <= endTime;
    });
  }
  if (period === 'Monthly') {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const monthStr = d.toISOString().slice(0, 7);
    return sessions.filter((s) => (s.dateStr || s.completedAt || '').startsWith(monthStr));
  }
  if (period === 'Yearly') {
    const yearStr = String(now.getFullYear() + offset);
    return sessions.filter((s) => (s.dateStr || s.completedAt || '').startsWith(yearStr));
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

  const todayStr = new Date().toISOString().split('T')[0];
  const filteredSessions = filterSessionsForPeriod(sessions, currentPeriod, currentOffset);
  const totalSessionsCount = filteredSessions.length || 1;
  const displayPomos = filteredSessions.length || 0;

  const computedSegments = (projects && projects.length ? projects : [
    { id: 'proj-1', name: '01 // STUDY', color: '#B9DAFF' },
    { id: 'proj-2', name: '02 // PERSONAL_APP_DEV', color: '#8BA0B0' },
    { id: 'proj-3', name: '03 // SYS_ARCHITECTURE', color: '#A1A1AA' },
  ])
    .map((proj, idx) => {
      const isStudyProj = proj.name.toLowerCase().includes('study') || idx === 0;
      const projSessions = (filteredSessions || []).filter((s) => {
        const isPast = s.dateStr < todayStr || (s.id && s.id.startsWith('sess-'));
        if (isPast) {
          return isStudyProj; // All past sessions belong to Study
        }
        return s.projectId === proj.id;
      });
      const count = projSessions.length;
      const pct = totalSessionsCount > 0 ? Math.round((count / totalSessionsCount) * 100) : 0;
      return {
        label: proj.name.replace(/^[0-9]+\s*(\/\/|·|\.)\s*/, '').replace(/_/g, ' '),
        pct,
        count,
        color: proj.color || '#B9DAFF',
      };
    })
    .filter((seg) => seg.pct > 0 || seg.count > 0)
    .sort((a, b) => b.pct - a.pct);

  const activeSegments = computedSegments.length ? computedSegments : [{ label: 'Study', pct: 100, count: 0, color: '#B9DAFF' }];

  return (
    <div
      className="pb-32 pt-4 px-4 max-w-md mx-auto space-y-4 select-none relative min-h-[85vh]"
      style={{ fontFamily: G }}
    >
      {/* Header */}
      <div>
        <span
          style={{
            fontFamily: M,
            fontSize: 9,
            color: '#3F3F46',
            letterSpacing: '0.1em',
            display: 'block',
          }}
        >
          Focus
        </span>
        <h1
          style={{
            fontFamily: G,
            fontSize: 22,
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '-0.03em',
            marginTop: 2,
          }}
        >
          Reports
        </h1>
      </div>

      {/* Shared Activity Section with interactive tabs, checkmark heatmap, and dynamic chart */}
      <SharedActivitySection
        showKPIs={true}
        sessions={sessions}
        onPeriodChange={(data) => {
          setCurrentPeriod(data.period);
          setCurrentOffset(data.offset);
        }}
      />

      {/* Donut */}
      <div>
        <div
          style={{
            background: '#090A0C',
            border: '1px solid #27272A',
            borderRadius: 8,
            padding: '12px 14px',
          }}
        >
          <span
            style={{
              fontFamily: M,
              fontSize: 8,
              color: '#A1A1AA',
              display: 'block',
              marginBottom: 12,
            }}
          >
            Time split
          </span>
          <div className="flex items-center gap-4">
            <svg width={140} height={140} viewBox="0 0 140 140" style={{ flexShrink: 0 }}>
              <circle
                cx={cx}
                cy={cy}
                r={(r + ri) / 2}
                fill="none"
                stroke="#0F0F0F"
                strokeWidth={r - ri}
              />
              {activeSegments.map((seg) => {
                const sweep = (seg.pct / 100) * 360;
                const s = deg + gap / 2;
                const e = deg + sweep - gap / 2;
                const path = donutArc(cx, cy, r, ri, s, e);
                deg += sweep;
                return <path key={seg.label} d={path} fill={seg.color} opacity={0.9} />;
              })}
              <text
                x={cx}
                y={cy - 6}
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize={13}
                fontWeight={700}
                fontFamily="Geist"
              >
                {displayPomos.toLocaleString()}
              </text>
              <text
                x={cx}
                y={cy + 10}
                textAnchor="middle"
                fill="#3F3F46"
                fontSize={8}
                fontFamily="JetBrains Mono"
              >
                sessions
              </text>
            </svg>
            <div className="flex flex-col gap-2.5 flex-1 min-w-0">
              {activeSegments.map((seg) => (
                <div key={seg.label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          background: seg.color,
                          borderRadius: 1,
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontFamily: M,
                          fontSize: 7,
                          color: seg.color === '#B9DAFF' ? '#B9DAFF' : '#A1A1AA',
                        }}
                        className="truncate"
                      >
                        {seg.label}
                      </span>
                    </div>
                    <span style={{ fontFamily: M, fontSize: 7, color: '#A1A1AA', marginLeft: 4 }}>
                      {seg.pct}%
                    </span>
                  </div>
                  <div
                    style={{ width: '100%', height: 2, background: '#1A1A1A', borderRadius: 1 }}
                  >
                    <div
                      style={{
                        height: 2,
                        width: `${seg.pct}%`,
                        background: seg.color,
                        borderRadius: 1,
                      }}
                    />
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
