import React from 'react';
import { Activity, Flame } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export default function HeatmapGrid({ sessions }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate 60 days grid (approx 8.5 weeks)
  const totalDays = 63; // 9 weeks * 7 days
  const days = Array.from({ length: totalDays }, (_, i) => {
    const date = subDays(today, totalDays - 1 - i);
    const dateStr = date.toISOString().split('T')[0];
    const count = sessions.filter((s) => s.dateStr === dateStr).length;
    return {
      date,
      dateStr,
      count,
      label: format(date, 'dd MMM', { locale: idLocale }),
    };
  });

  // Calculate streak
  let currentStreak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0 || (i === days.length - 1 && days[i].count === 0)) {
      if (days[i].count > 0) currentStreak++;
    } else {
      break;
    }
  }

  // Helper for color scale
  const getColor = (count) => {
    if (count === 0) return 'bg-[#131318] border-[#2e2e3a]';
    if (count <= 2) return 'bg-[#ff5252]/30 border-[#ff5252]/50 text-white';
    if (count <= 5) return 'bg-[#ff5252]/60 border-[#ff5252]/80 text-white font-bold';
    return 'bg-[#ff5252] border-[#ff5252] text-white font-black shadow-[0_0_8px_rgba(255,82,82,0.5)]';
  };

  return (
    <div className="bg-[#1c1c24] border border-[#2e2e3a] rounded-2xl p-4 space-y-4 shadow-lg animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#ff5252]" />
            Heatmap Konsistensi Fokus
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Jejak aktivitas Pomodoro 60 hari terakhir
          </p>
        </div>
        <div className="flex items-center gap-1 bg-[#ff5252]/15 border border-[#ff5252]/30 px-2.5 py-1 rounded-full text-[#ff5252] text-xs font-bold">
          <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
          {currentStreak} Hari Streak!
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
        <div className="grid grid-flow-col grid-rows-7 gap-1.5 min-w-[340px]">
          {days.map((d) => (
            <div
              key={d.dateStr}
              className={`w-4 h-4 rounded-md border flex items-center justify-center transition-transform hover:scale-125 cursor-pointer group relative ${getColor(d.count)}`}
            >
              {/* Tooltip */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] py-1 px-2 rounded border border-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition z-20 shadow-xl">
                <strong>{d.count} sesi</strong> pada {d.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 text-[10px] text-slate-400 pt-1">
        <span>Sedikit</span>
        <div className="w-3 h-3 rounded bg-[#131318] border border-[#2e2e3a]" />
        <div className="w-3 h-3 rounded bg-[#ff5252]/30 border border-[#ff5252]/50" />
        <div className="w-3 h-3 rounded bg-[#ff5252]/60 border border-[#ff5252]/80" />
        <div className="w-3 h-3 rounded bg-[#ff5252] border border-[#ff5252]" />
        <span>Banyak</span>
      </div>
    </div>
  );
}
