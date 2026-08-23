import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export default function GanttChart({ tasks, projects }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate 7 days timeline window (Today to Today+6)
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const timelineTasks = tasks.filter((t) => !t.completed || t.completedPomos > 0).slice(0, 8);

  return (
    <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-lg p-4 space-y-4 select-none font-mono">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-[var(--accent)]" />
          <h3 className="text-xs font-bold tracking-widest text-[var(--text-primary)] uppercase">
            GANTT TIMELINE // 7D
          </h3>
        </div>
        <span className="text-[10px] text-[var(--text-secondary)] bg-[var(--surface-low)] px-2 py-0.5 rounded border border-[var(--surface-border)]">
          SCHEDULE
        </span>
      </div>

      {/* Timeline Grid */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2 no-scrollbar">
        <div className="min-w-[420px]">
          {/* Days Header */}
          <div className="grid grid-cols-8 gap-1 pb-2 border-b border-[var(--surface-border)] text-[9px] text-center font-bold text-[var(--text-secondary)]">
            <div className="text-left pl-1 col-span-2 uppercase">SIGNAL / TASK</div>
            {days.map((day, idx) => {
              const isCurr = idx === 0;
              return (
                <div
                  key={idx}
                  className={`py-1 rounded-sm ${
                    isCurr ? 'bg-[var(--accent)] text-[var(--text-on-accent)] font-black' : ''
                  }`}
                >
                  <div>{format(day, 'EEE', { locale: idLocale }).toUpperCase()}</div>
                  <div className="text-[10px]">{format(day, 'dd')}</div>
                </div>
              );
            })}
          </div>

          {/* Task Rows */}
          <div className="space-y-2 pt-2">
            {timelineTasks.length > 0 ? (
              timelineTasks.map((task) => {
                const proj = projects.find((p) => p.id === task.projectId);
                const color = proj ? proj.color : 'var(--accent)';

                const taskDate = task.dueDate ? parseISO(task.dueDate) : today;
                const dayOffset = Math.max(0, Math.min(5, differenceInDays(taskDate, today)));
                const durationSpan = Math.min(2, Math.ceil((task.estimatedPomos || 1) / 3));

                return (
                  <div key={task.id} className="grid grid-cols-8 gap-1 items-center text-xs">
                    <div className="col-span-2 pr-2 truncate text-[var(--text-primary)] font-medium flex items-center gap-1.5 text-[11px]">
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="truncate font-sans" title={task.title}>
                        {task.title}
                      </span>
                    </div>

                    {/* Gantt Bar spanning across columns */}
                    <div className="col-span-6 grid grid-cols-6 gap-1 relative h-6 items-center">
                      <div
                        className="absolute h-5 rounded-sm flex items-center px-2 text-[9px] font-bold text-[var(--text-on-accent)] shadow-sm transition-transform hover:scale-105 cursor-pointer overflow-hidden truncate"
                        style={{
                          left: `${(dayOffset / 6) * 100}%`,
                          width: `${Math.max(16, (durationSpan / 6) * 100)}%`,
                          backgroundColor: color,
                        }}
                      >
                        <span className="truncate font-mono">{task.completedPomos}/{task.estimatedPomos} POMS</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-xs text-[#52525B] font-mono">
                NO ACTIVE SCHEDULED TRACES
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
