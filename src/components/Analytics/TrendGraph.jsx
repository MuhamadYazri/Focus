import React from 'react';
import { TrendingUp, Award, Clock } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export default function TrendGraph({ sessions, tasks }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate last 7 days stats
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Count sessions on this day
    const daySessions = sessions.filter((s) => s.dateStr === dateStr);
    const pomos = daySessions.length;
    const hours = (pomos * 25) / 60;

    return {
      dateStr,
      label: format(date, 'EEE', { locale: idLocale }),
      dayNum: format(date, 'dd'),
      pomos,
      hours: hours.toFixed(1),
    };
  });

  const maxPomos = Math.max(8, ...last7Days.map((d) => d.pomos));
  const total7DaysPomos = last7Days.reduce((acc, d) => acc + d.pomos, 0);
  const totalHours = ((total7DaysPomos * 25) / 60).toFixed(1);

  return (
    <div className="bg-[#1c1c24] border border-[#2e2e3a] rounded-2xl p-4 space-y-4 shadow-lg animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#2ecc71]" />
            Tren Fokus 7 Hari Terakhir
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Total <strong className="text-white">{total7DaysPomos} sesi</strong> ({totalHours} jam fokus)
          </p>
        </div>
        <div className="w-8 h-8 rounded-xl bg-[#2ecc71]/10 border border-[#2ecc71]/30 flex items-center justify-center text-[#2ecc71]">
          <Award className="w-4 h-4" />
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="pt-4 pb-2 px-1 flex items-end justify-between gap-2 h-36 border-b border-[#2e2e3a]">
        {last7Days.map((d, idx) => {
          const heightPct = Math.max(10, Math.min(100, (d.pomos / maxPomos) * 100));
          const isToday = idx === 6;

          return (
            <div key={d.dateStr} className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer">
              {/* Tooltip value on hover */}
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-white transition opacity-0 group-hover:opacity-100 -mb-1">
                {d.pomos}p
              </span>

              {/* Bar */}
              <div className="w-full max-w-[28px] bg-[#131318] rounded-t-lg overflow-hidden flex items-end h-24 p-0.5 border border-[#2e2e3a] group-hover:border-slate-500 transition">
                <div
                  className={`w-full rounded-t-md transition-all duration-500 ${
                    isToday ? 'bg-[#ff5252] shadow-[0_0_10px_rgba(255,82,82,0.5)]' : 'bg-[#6c5ce7] group-hover:bg-[#a55eea]'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>

              {/* Day Label */}
              <div className="text-center">
                <div className={`text-[11px] font-bold ${isToday ? 'text-[#ff5252]' : 'text-slate-300'}`}>
                  {d.label}
                </div>
                <div className="text-[9px] text-slate-500">{d.dayNum}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="bg-[#131318] border border-[#2e2e3a] rounded-xl p-2.5 flex items-center gap-2.5">
          <Clock className="w-5 h-5 text-[#ffb142]" />
          <div>
            <span className="text-[10px] text-slate-400 block">Rata-rata Harian</span>
            <span className="text-sm font-bold text-white">
              {(total7DaysPomos / 7).toFixed(1)} <span className="text-xs font-normal text-slate-400">Pomo/hari</span>
            </span>
          </div>
        </div>

        <div className="bg-[#131318] border border-[#2e2e3a] rounded-xl p-2.5 flex items-center gap-2.5">
          <Award className="w-5 h-5 text-[#34ace0]" />
          <div>
            <span className="text-[10px] text-slate-400 block">Penyelesaian Tugas</span>
            <span className="text-sm font-bold text-white">
              {tasks.filter((t) => t.completed).length} <span className="text-xs font-normal text-slate-400">Tugas</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
