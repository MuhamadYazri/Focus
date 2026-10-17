import React, { useState, useMemo, startTransition } from 'react';
import { Check, Pause } from 'lucide-react';

const FILTER_TABS = ['Today', 'Planned', 'Done'];

function TaskList({
  tasks = [],
  sessions = [],
  settings = {},
  onAddTask,
  onEditTask,
  onToggleComplete,
  justCompletedId = null,
  onStartPomodoro,
  activeTaskId = null,
  isTimerRunning = false,
}) {
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

  const todayStr = useMemo(() => getLocalDateStr(), []);
  const todayDayOfWeek = useMemo(() => new Date().getDay(), []);
  const [navFilterTab, setNavFilterTab] = useState('Today');
  const [filterTab, setFilterTab] = useState('Today');

  // Daily Focus Hours Calculation (s.duration is stored in minutes)
  const { todayHours, targetHours, progressPercent } = useMemo(() => {
    try {
      const todaySessions = (sessions || []).filter((s) => {
        if (!s || typeof s !== 'object') return false;
        const sDateStr = s.dateStr || (s.completedAt ? getLocalDateStr(s.completedAt) : '');
        return sDateStr === todayStr;
      });

      const todayMinutes = todaySessions.reduce((acc, s) => acc + (Number(s.duration) || 0), 0);
      const rawHours = todayMinutes / 60;
      const todayHours = parseFloat(rawHours.toFixed(1));
      const targetHours = Number(settings?.dailyGoalHours) || 4.0;
      const progressPercent = Math.min(100, Math.round((rawHours / targetHours) * 100));

      return { todayHours, targetHours, progressPercent };
    } catch {
      return {
        todayHours: 0.0,
        targetHours: 4.0,
        progressPercent: 0,
      };
    }
  }, [sessions, settings?.dailyGoalHours, todayStr]);

  // Tasks Filtered by 3 clean tabs: Today, Planned, Done
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (
        justCompletedId === task.id &&
        task.completed &&
        (filterTab === 'Today' || filterTab === 'Planned')
      ) {
        return true;
      }

      if (filterTab === 'Done') {
        return task.completed;
      }

      if (task.completed) return false;

      const st = task.scheduleType || 'today';

      if (filterTab === 'Today') {
        if (st === 'daily' || st === 'today') return true;
        if (st === 'date' && task.scheduledDate && task.scheduledDate <= todayStr) return true;
        if (st === 'weekly') {
          return (
            !Array.isArray(task.weeklyDays) ||
            task.weeklyDays.length === 0 ||
            task.weeklyDays.includes(todayDayOfWeek)
          );
        }
        return false;
      }

      if (filterTab === 'Planned') {
        if (st === 'date' && task.scheduledDate && task.scheduledDate > todayStr) return true;
        if (
          st === 'weekly' &&
          Array.isArray(task.weeklyDays) &&
          task.weeklyDays.length > 0 &&
          !task.weeklyDays.includes(todayDayOfWeek)
        ) {
          return true;
        }
        return false;
      }

      return true;
    });
  }, [tasks, filterTab, todayStr, todayDayOfWeek, justCompletedId]);

  return (
    <div className="w-full max-w-[440px] min-h-screen bg-[#F0F2EF] flex flex-col justify-between relative px-7 pt-[52px] pb-36 mx-auto select-none">
      <div className="w-full flex flex-col flex-1">
        {/* BEGIN: Header */}
        <header className="w-full flex items-center justify-between" data-purpose="header-section">
          <span className="text-[10px] font-bold leading-[14px] uppercase tracking-[2px] text-[#667463]">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
          <span className="text-[13px] font-bold leading-[14px] tracking-[-0.2px] text-[#1B1F1A]">
            {navFilterTab}
          </span>
        </header>
        {/* END: Header */}

        {/* BEGIN: DailyGoalProgress (Section-hours) */}
        <section className="pt-14" data-purpose="hero-progress-metric">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-[96px] font-extrabold leading-[88px] tracking-[-4px] text-[#1B1F1A] font-sans">
                {todayHours.toFixed(1)}
              </span>
              <span className="text-[40px] font-extrabold leading-[44px] tracking-[-2px] text-[#1B1F1A] font-sans">
                h
              </span>
            </div>

            <div className="pt-1.5">
              <span className="text-[14px] font-normal leading-[20px] tracking-[-0.2px] text-[#8B9E87]">
                / {targetHours.toFixed(1)}h goal
              </span>
            </div>

            {/* Progress Bar (2px height, #D6F3D0 track, #1B1F1A fill, GPU scaleX) */}
            <div className="pt-7">
              <div className="w-full h-[3px] bg-[#D6F3D0] dark:bg-[#263124] rounded-full overflow-hidden">
                <div
                  aria-valuemax="100"
                  aria-valuemin="0"
                  aria-valuenow={progressPercent}
                  className="w-full h-full bg-[#1B1F1A] dark:bg-[#8EAE88] rounded-full origin-left transition-transform duration-700 ease-out"
                  role="progressbar"
                  style={{
                    transform: `scaleX(${Math.max(0.01, progressPercent / 100)})`,
                    willChange: 'transform',
                  }}
                />
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-between pt-2.5">
              <span className="text-[9px] font-bold uppercase tracking-[2.2px] text-[#667463]">
                FOCUS HOURS COMPLETED
              </span>
              <span className="text-[11px] font-semibold leading-[16px] tracking-[-0.1px] text-[#1B1F1A]">
                {progressPercent}% complete
              </span>
            </div>
          </div>
        </section>
        {/* END: DailyGoalProgress */}

        {/* BEGIN: Navigation - Task Status Filter */}
        <nav aria-label="Task Status Filter" className="pt-11" data-purpose="segmented-tabs">
          <div className="flex items-center gap-6 border-b border-[#1B1F1A]/10 relative">
            {FILTER_TABS.map((tab) => {
              const on = navFilterTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    if (tab === navFilterTab) return;
                    if (window.navigator?.vibrate) window.navigator.vibrate(10);
                    setNavFilterTab(tab);
                    startTransition(() => {
                      setFilterTab(tab);
                    });
                  }}
                  className={`tap-effect pb-2.5 text-[10px] leading-[14px] tracking-[1.2px] uppercase transition-colors duration-150 relative select-none ${
                    on ? 'font-extrabold text-[#1B1F1A]' : 'font-medium text-[#8B9E87] hover:text-[#1B1F1A]'
                  }`}
                >
                  <span>{tab}</span>
                  <span
                    aria-hidden="true"
                    className={`absolute bottom-0 inset-x-0 h-[2px] bg-[#1B1F1A] rounded-full z-10 transition-transform duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] origin-center ${
                      on ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'
                    }`}
                    style={{ willChange: 'transform, opacity' }}
                  />
                </button>
              );
            })}
          </div>
        </nav>
        {/* END: Navigation - Task Status Filter */}

        {/* BEGIN: Section-tasks */}
        <section className="flex-1 pt-1" data-purpose="task-list">
          <div>
            {filteredTasks.length === 0 ? (
              <div className="py-12 text-center text-xs font-mono text-[#8B9E87]">
                No tasks in {filterTab.toLowerCase()}
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isCurrentFocus = activeTaskId === task.id && isTimerRunning;
                const isJust = justCompletedId === task.id && task.completed;
                const completedPomos = task.completedPomos || 0;
                const estimatedPomos = task.estimatedPomos || 1;

                return (
                  <article
                    key={task.id}
                    className={`group py-5 flex items-center justify-between border-b border-[#1B1F1A]/5 transition-colors ${
                      isJust ? 'animate-task-exit' : task.completed ? 'opacity-60' : ''
                    }`}
                    onClick={() => onEditTask && onEditTask(task)}
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-3 cursor-pointer">
                      <button
                        aria-label="Mark task as complete"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.navigator?.vibrate) window.navigator.vibrate(15);
                          onToggleComplete?.(task.id);
                        }}
                        className={`tap-effect w-[18px] h-[18px] rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                          task.completed
                            ? 'border-[#41493F] bg-[#41493F] text-white'
                            : 'border-[#8B9E87] hover:border-[#1B1F1A]'
                        } ${isJust ? 'animate-check-pop' : ''}`}
                      >
                        {task.completed ? (
                          <Check
                            size={11}
                            strokeWidth={3}
                            className={`text-white ${isJust ? 'check-draw' : ''}`}
                          />
                        ) : isCurrentFocus ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#41493F]" />
                        ) : null}
                      </button>

                      <div className="flex items-center gap-2 truncate">
                        <span
                          className={`text-[14px] leading-[20px] tracking-[-0.3px] truncate ${
                            isJust
                              ? 'strike-anim text-[#667463] font-medium'
                              : task.completed
                              ? 'line-through text-[#667463]'
                              : isCurrentFocus
                              ? 'font-semibold text-[#1B1F1A]'
                              : 'font-medium text-[#1B1F1A]'
                          }`}
                        >
                          {task.title}
                        </span>
                        {isCurrentFocus && (
                          <span
                            className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 status-pulse"
                            title="Active Now"
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-shrink-0">
                      <span className="text-[11px] leading-[16px] font-semibold text-[#8B9E87]">
                        {completedPomos}/{estimatedPomos}
                      </span>
                      {!task.completed && (
                        <button
                          aria-label={`Focus on ${task.title}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.navigator?.vibrate) window.navigator.vibrate(10);
                            onStartPomodoro?.(task);
                          }}
                          className={`tap-effect w-[30px] h-[30px] rounded-full border border-[#D5DAD3] flex items-center justify-center transition-colors ${
                            isCurrentFocus
                              ? 'bg-[#1B1F1A] text-white hover:bg-[#41493F]'
                              : 'text-[#1B1F1A] hover:bg-white'
                          }`}
                        >
                          {isCurrentFocus ? (
                            <Pause size={11} className="fill-current" />
                          ) : (
                            <svg className="w-3 h-3 ml-0.5 fill-current" viewBox="0 0 24 24">
                              <polygon points="6 4 20 12 6 20 6 4" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
        {/* END: Section-tasks */}
      </div>

      {/* BEGIN: Floating Add Button */}
      <div className="fixed bottom-0 inset-x-0 mx-auto w-full max-w-[440px] pointer-events-none z-30">
        <div className="absolute bottom-[92px] right-7 pointer-events-auto">
          <button
            type="button"
            aria-label="Add new focus task"
            onClick={() => {
              if (window.navigator?.vibrate) window.navigator.vibrate(15);
              if (onAddTask) onAddTask();
            }}
            className="tap-effect w-[44px] h-[44px] rounded-full bg-[#1B1F1A] text-primary-fg flex items-center justify-center shadow-[0px_8px_20px_-2px_rgba(27,31,26,0.11)] hover:bg-[#41493F] transition-all cursor-pointer"
          >
            <svg className="w-5 h-5 stroke-[1.67]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <line x1="12" x2="12" y1="5" y2="19" />
              <line x1="5" x2="19" y1="12" y2="12" />
            </svg>
          </button>
        </div>
      </div>
      {/* END: Floating Add Button */}
    </div>
  );
}

export default React.memo(TaskList);
