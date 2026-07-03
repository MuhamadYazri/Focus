import React from 'react';
import { PieChart, FolderKanban } from 'lucide-react';
import * as Icons from 'lucide-react';

export default function ProjectDonut({ sessions, projects }) {
  const totalSessions = sessions.length || 1;

  // Calculate stats per project
  const stats = projects.map((proj) => {
    const projSessions = sessions.filter((s) => s.projectId === proj.id);
    const count = projSessions.length;
    const percentage = Math.round((count / totalSessions) * 100);
    return {
      ...proj,
      count,
      percentage,
    };
  }).sort((a, b) => b.count - a.count);

  // Calculate SVG stroke Dashoffsets for simple donut visualization
  let accumulatedPercent = 0;

  return (
    <div className="bg-[#1c1c24] border border-[#2e2e3a] rounded-2xl p-4 space-y-4 shadow-lg animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-[#ffb142]" />
            Distribusi Waktu Proyek
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Proporsi fokus berdasarkan folder proyek
          </p>
        </div>
        <span className="text-[10px] font-semibold text-slate-400 bg-[#131318] px-2.5 py-1 rounded-full border border-[#2e2e3a]">
          30 Hari
        </span>
      </div>

      <div className="flex items-center justify-around gap-4 pt-2">
        {/* Simple CSS Circular Donut using SVG */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="38" className="stroke-[#131318]" strokeWidth="16" fill="transparent" />
            {stats.map((item, idx) => {
              if (item.percentage === 0) return null;
              const circumference = 2 * Math.PI * 38; // ~238.76
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
            <span className="text-xl font-black text-white">{sessions.length}</span>
            <span className="text-[9px] text-slate-400 uppercase tracking-tight">Total Pomo</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 space-y-2 max-h-36 overflow-y-auto pr-1">
          {stats.map((item) => {
            const IconComp = Icons[item.icon] || Icons.Folder;
            return (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate pr-2">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${item.color}20`, color: item.color }}
                  >
                    <IconComp className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-slate-300 font-medium truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 font-bold whitespace-nowrap">
                  <span className="text-white">{item.count}p</span>
                  <span className="text-[10px] text-slate-500 w-8 text-right">({item.percentage}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
