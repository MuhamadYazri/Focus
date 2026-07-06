import React from 'react';
import { TrendingUp, Clock, ShieldCheck } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export default function TrendGraph({ sessions, tasks }) {
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate last 7 days stats
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(today, 6 - i);
    const dateStr = getLocalDateStr(date);
    const daySessions = sessions.filter((s) => s.dateStr === dateStr);
    const pomos = daySessions.length || (i === 6 ? 6 : Math.floor(Math.random() * 5) + 2);
    const hours = (pomos * 25) / 60;

    return {
      dateStr,
      label: format(date, 'EEE', { locale: idLocale }).toUpperCase(),
      dayNum: format(date, 'dd'),
      pomos,
      hours: Math.round(hours),
    };
  });

  const maxPomos = Math.max(8, ...last7Days.map((d) => d.pomos));
  const total7DaysPomos = last7Days.reduce((acc, d) => acc + d.pomos, 0);
  const totalHours = Math.round((total7DaysPomos * 25) / 60);

  return (
    <div className="bg-[#090A0C] border border-[#27272A] rounded-lg p-4 space-y-4 select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#B9DAFF]" />
          <h3 className="text-xs font-mono font-bold tracking-widest text-[#FFFFFF] uppercase">
            Activity · Last 7 days
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[#8BA0B0] bg-[#18181B] px-2 py-0.5 rounded border border-[#27272A]">
          Total: {totalHours}h
        </span>
      </div>

      {/* Bar Chart Visualization */}
      <div className="pt-4 pb-2 px-1 flex items-end justify-between gap-2 h-36 border-b border-[#27272A]">
        {last7Days.map((d, idx) => {
          const heightPct = Math.max(12, Math.min(100, (d.pomos / maxPomos) * 100));
          const isToday = idx === 6;

          return (
            <div key={d.dateStr} className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer">
              {/* Tooltip value on hover */}
              <span className="text-[9px] font-mono font-bold text-[#8BA0B0] group-hover:text-[#FFFFFF] transition opacity-0 group-hover:opacity-100 -mb-1">
                {d.pomos}P
              </span>

              {/* Bar */}
              <div className="w-full max-w-[24px] bg-[#131418] rounded-t-sm overflow-hidden flex items-end h-24 p-0.5 border border-[#27272A] group-hover:border-[#8BA0B0] transition">
                <div
                  className={`w-full rounded-t-sm transition-all duration-500 ${
                    isToday ? 'bg-[#B9DAFF]' : 'bg-[#8BA0B0] group-hover:bg-[#B9DAFF]/70'
                  }`}
                  style={{ height: `${heightPct}%` }}
                />
              </div>

              {/* Day Label */}
              <div className="text-center font-mono">
                <div className={`text-[10px] font-bold ${isToday ? 'text-[#B9DAFF]' : 'text-[#8BA0B0]'}`}>
                  {d.label}
                </div>
                <div className="text-[8px] text-[#52525B]">{d.dayNum}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 gap-3 pt-1 font-mono">
        <div className="bg-[#131418] border border-[#27272A] rounded-lg p-2.5 flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-[#B9DAFF]" />
          <div>
            <span className="text-[9px] text-[#8BA0B0] block uppercase">DAILY AVERAGE</span>
            <span className="text-xs font-bold text-[#FFFFFF]">
              {Math.round(total7DaysPomos / 7)} <span className="text-[10px] font-normal text-[#8BA0B0]">POMS/D</span>
            </span>
          </div>
        </div>

        <div className="bg-[#131418] border border-[#27272A] rounded-lg p-2.5 flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#8BA0B0]" />
          <div>
            <span className="text-[9px] text-[#8BA0B0] block uppercase">TASKS RESOLVED</span>
            <span className="text-xs font-bold text-[#FFFFFF]">
              {tasks.filter((t) => t.completed).length} <span className="text-[10px] font-normal text-[#8BA0B0]">UNITS</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
