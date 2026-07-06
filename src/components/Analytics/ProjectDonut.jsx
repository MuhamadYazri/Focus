import React from 'react';
import { PieChart } from 'lucide-react';
import * as Icons from 'lucide-react';

export default function ProjectDonut({ sessions = [], projects = [] }) {
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
  const todayStr = getLocalDateStr();
  const totalSessions = sessions.length || 1;

  // Calculate stats per project
  const stats = projects
    .map((proj, idx) => {
      const isStudyProj = proj.name.toLowerCase().includes('study') || idx === 0;
      const projSessions = sessions.filter((s) => {
        const isPast = s.dateStr < todayStr || (s.id && s.id.startsWith('sess-'));
        if (isPast) {
          return isStudyProj;
        }
        return s.projectId === proj.id;
      });
      const count = projSessions.length;
      const percentage = Math.round((count / totalSessions) * 100);
      return {
        ...proj,
        count,
        percentage,
      };
    })
    .sort((a, b) => b.count - a.count);

  let accumulatedPercent = 0;

  return (
    <div className="bg-[#090A0C] border border-[#27272A] rounded-lg p-4 space-y-4 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieChart className="w-4 h-4 text-[#B9DAFF]" />
          <h3 className="text-xs font-mono font-bold tracking-widest text-[#FFFFFF] uppercase">
            Time Split
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[#8BA0B0] bg-[#18181B] px-2 py-0.5 rounded border border-[#27272A]">
          Distribution
        </span>
      </div>

      <div className="flex items-center justify-around gap-4 pt-2 font-mono">
        {/* Simple CSS Circular Donut using SVG */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="38" className="stroke-[#131418]" strokeWidth="16" fill="transparent" />
            {stats.map((item) => {
              if (item.percentage === 0) return null;
              const circumference = 2 * Math.PI * 38;
              const dashArray = `${(item.percentage / 100) * circumference} ${circumference}`;
              const dashOffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += item.percentage;

              return (
                <circle
                  key={item.id}
                  cx="50"
                  cy="50"
                  r="38"
                  stroke={item.color}
                  strokeWidth="16"
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  fill="transparent"
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-bold text-[#FFFFFF]">{stats.reduce((acc, s) => acc + s.count, 0)}</span>
            <span className="text-[8px] text-[#8BA0B0] uppercase tracking-wider">TOTAL_POMS</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 space-y-2 max-h-36 overflow-y-auto pr-1">
          {stats.map((item) => {
            const IconComp = Icons[item.icon] || Icons.Folder;
            const cleanName = item.name.replace(/^[0-9]+\s*(\/\/|·|\.)\s*/, '').replace(/_/g, ' ');
            return (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate pr-2">
                  <div
                    className="w-5 h-5 rounded-sm flex items-center justify-center flex-shrink-0 border border-[#27272A]"
                    style={{ backgroundColor: `${item.color}15`, color: item.color }}
                  >
                    <IconComp className="w-3 h-3" />
                  </div>
                  <span className="text-[#FFFFFF] text-[11px] truncate capitalize">{cleanName.toLowerCase()}</span>
                </div>
                <div className="flex items-center gap-2 font-bold whitespace-nowrap">
                  <span className="text-[#FFFFFF] text-xs">{item.count}P</span>
                  <span className="text-[10px] text-[#8BA0B0] w-8 text-right">({item.percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
