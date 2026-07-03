import React from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle2 } from 'lucide-react';
import { format, addDays, differenceInDays, parseISO, isSameDay } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export default function GanttChart({ tasks, projects }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate 7 days timeline window (Today to Today+6)
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  // Filter tasks that have a due date or estimated time
  const timelineTasks = tasks.filter((t) => !t.completed || t.completedPomos > 0).slice(0, 8);

  return (
    <div className="bg-[#1c1c24] border border-[#2e2e3a] rounded-2xl p-4 space-y-4 shadow-lg overflow-hidden animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-[#34ace0]" />
            Gantt Chart Timeline Proyek
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Jadwal kegiatan 7 hari ke depan
          </p>
        </div>
        <span className="text-[10px] font-semibold text-slate-400 bg-[#131318] px-2.5 py-1 rounded-full border border-[#2e2e3a]">
          Minggu Ini
        </span>
      </div>

      {/* Timeline Grid */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
        <div className="min-w-[420px]">
          {/* Days Header */}
          <div className="grid grid-cols-8 gap-1 pb-2 border-b border-[#2e2e3a] text-[10px] text-center font-bold text-slate-400">
            <div className="text-left pl-1 col-span-2">Tugas</div>
            {days.map((day, idx) => {
              const isCurr = idx === 0;
              return (
                <div
                  key={idx}
                  className={`py-1 rounded-lg ${
                    isCurr ? 'bg-[#ff5252]/10 text-[#ff5252] font-black' : ''
                  }`}
                >
                  <div>{format(day, 'EEE', { locale: idLocale })}</div>
                  <div className="text-xs">{format(day, 'dd')}</div>
                </div>
              );
            })}
          </div>

          {/* Task Rows */}
          <div className="space-y-2 pt-2">
            {timelineTasks.length > 0 ? (
              timelineTasks.map((task) => {
                const proj = projects.find((p) => p.id === task.projectId);
                const color = proj ? proj.color : '#ff5252';
                
                // Determine start and end col on grid
                const taskDate = task.dueDate ? parseISO(task.dueDate) : today;
                const dayOffset = Math.max(0, Math.min(5, differenceInDays(taskDate, today)));
                const durationSpan = Math.min(2, Math.ceil((task.estimatedPomos || 1) / 3));

                return (
                  <div key={task.id} className="grid grid-cols-8 gap-1 items-center text-xs">
                    <div className="col-span-2 pr-2 truncate text-slate-300 font-medium flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate" title={task.title}>
                        {task.title}
                      </span>
                    </div>

                    {/* Gantt Bar spanning across columns */}
                    <div className="col-span-6 grid grid-cols-6 gap-1 relative h-6 items-center">
                      <div
                        className="absolute h-5 rounded-lg flex items-center px-2 text-[10px] font-bold text-white shadow-sm transition-transform hover:scale-105 cursor-pointer overflow-hidden truncate"
                        style={{
                          left: `${(dayOffset / 6) * 100}%`,
                          width: `${Math.max(16, (durationSpan / 6) * 100)}%`,
                          backgroundColor: `${color}cc`,
                          border: `1px solid ${color}`,
                        }}
                      >
                        <span className="truncate">{task.completedPomos}/{task.estimatedPomos} Pomo</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-xs text-slate-500 italic">
                Belum ada tugas aktif untuk ditampilkan di timeline.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
