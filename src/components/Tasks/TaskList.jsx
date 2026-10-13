import React, { useState, useMemo } from 'react';
import { Check, Pause } from 'lucide-react';

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
    } catch (e) {
      return new Date().toISOString().split('T')[0];
    }
  };

  const todayStr = useMemo(() => getLocalDateStr(), []);
  const [filterTab, setFilterTab] = useState('Today');

  // Daily Focus Hours Calculation
  const { todayHours, targetHours, progressPercent } = useMemo(() => {
    try {
      const todaySessions = (sessions || []).filter((s) => {
        if (!s.completedAt) return false;
        const sDateStr = getLocalDateStr(s.completedAt);
        return sDateStr === todayStr;
      });

      const todayMinutes = todaySessions.reduce((acc, s) => acc + (s.duration || 0), 0) / 60;
      const todayHours = parseFloat((todayMinutes / 60).toFixed(1));
      const targetHours = settings?.dailyGoalHours || 4.0;
      const progressPercent = Math.min(100, Math.round((todayHours / targetHours) * 100));

      return { todayHours, targetHours, progressPercent };
    } catch (err) {
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
        return false;
      }

      if (filterTab === 'Planned') {
        if (st === 'date' && task.scheduledDate && task.scheduledDate > todayStr) return true;
        return false;
      }

      return true;
    });
  }, [tasks, filterTab, todayStr, justCompletedId]);

  return (
    <div className="w-full max-w-[430px] min-h-screen bg-canvas flex flex-col justify-between relative px-6 pt-12 pb-28 mx-auto">
      <div className="w-full flex flex-col flex-1">
        {/* BEGIN: TopBarAndHeader */}
        <header className="w-full flex flex-col pt-2" data-purpose="header-section">
          <div className="flex items-center justify-between pt-1 pb-1">
            <div className="flex items-baseline space-x-2">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[#667463]">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              <span className="text-[#667463]/40 text-xs">·</span>
              <span className="text-sm font-semibold tracking-tight text-[#1B1F1A]">
                {filterTab}
              </span>
            </div>
          </div>
        </header>
        {/* END: TopBarAndHeader */}

        {/* BEGIN: DailyGoalProgress */}
        <section className="mt-8 mb-6" data-purpose="hero-progress-metric">
          <div className="flex flex-col pt-5 pb-2">
            <div className="flex items-baseline space-x-2.5">
              <span className="text-[64px] font-black leading-none tracking-tight text-[#1B1F1A] font-display">
                {todayHours.toFixed(1)}
                <span className="text-3xl font-bold ml-0.5 text-[#1B1F1A]">h</span>
              </span>
              <span className="text-xl font-normal tracking-tight text-[#8B9E87]">
                / {targetHours.toFixed(1)}h goal
              </span>
            </div>
            <div className="mt-5">
              <div className="w-full h-[3px] bg-[#E2E6E0] rounded-full overflow-hidden">
                <div
                  aria-valuemax="100"
                  aria-valuemin="0"
                  aria-valuenow={progressPercent}
                  className="h-full bg-[#1B1F1A] rounded-full transition-all duration-700 ease-out"
                  role="progressbar"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#5F6C5C]">
                FOCUS HOURS COMPLETED
              </span>
              <span className="text-[11px] font-mono font-medium text-[#1B1F1A]">
                {progressPercent}% complete
              </span>
            </div>
          </div>
        </section>
        {/* END: DailyGoalProgress */}

        {/* BEGIN: TimelineTabs */}
        <nav aria-label="Task Status Filter" className="my-3" data-purpose="segmented-tabs">
          <div className="flex items-center space-x-5 py-2 border-b border-[#1B1F1A]/10">
            {['Today', 'Planned', 'Done'].map((tab) => {
              const on = filterTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterTab(tab)}
                  className={`tap-effect pb-1 text-xs tracking-wider uppercase transition-colors border-b-2 ${
                    on
                      ? 'font-semibold text-[#1B1F1A] border-[#1B1F1A]'
                      : 'font-medium text-[#667463] hover:text-[#1B1F1A] border-transparent'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </nav>
        {/* END: TimelineTabs */}

        {/* BEGIN: TaskList */}
        <section className="flex-1 mt-2" data-purpose="task-list">
          <div className="divide-y divide-[#1B1F1A]/8">
            {filteredTasks.length === 0 ? (
              <div className="py-12 text-center text-xs font-mono text-[#667463]">
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
                    className={`group py-4 flex items-center justify-between transition-colors ${
                      isJust ? 'animate-task-exit' : ''
                    } ${task.completed ? 'opacity-60' : ''}`}
                    onClick={() => onEditTask && onEditTask(task)}
                  >
                    <div className="flex items-center space-x-3.5 flex-1 min-w-0 pr-3 cursor-pointer">
                      <button
                        aria-label="Mark task as complete"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.navigator?.vibrate) window.navigator.vibrate(15);
                          onToggleComplete && onToggleComplete(task.id);
                        }}
                        className={`tap-effect w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                          task.completed
                            ? 'border-[#41493F] bg-[#41493F] text-white shadow-2xs'
                            : isCurrentFocus
                            ? 'border-[#41493F] hover:bg-[#D6F3D0]/30'
                            : 'border-[#7B8479]/70 hover:border-[#1B1F1A]'
                        }`}
                      >
                        {task.completed ? (
                          <Check size={12} strokeWidth={3} className="text-white" />
                        ) : isCurrentFocus ? (
                          <span className="w-2 h-2 rounded-full bg-[#41493F]" />
                        ) : null}
                      </button>
                      <div className="flex items-center space-x-2 truncate">
                        <span
                          className={`text-sm tracking-tight text-[#1B1F1A] truncate ${
                            task.completed
                              ? 'line-through text-[#667463]'
                              : isCurrentFocus
                              ? 'font-semibold'
                              : 'font-normal'
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

                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <span className="text-xs font-mono text-[#667463]">
                        {completedPomos}/{estimatedPomos}
                      </span>
                      {!task.completed && (
                        <button
                          aria-label={`Focus on ${task.title}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.navigator?.vibrate) window.navigator.vibrate(10);
                            onStartPomodoro && onStartPomodoro(task);
                          }}
                          className={`tap-effect w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            isCurrentFocus
                              ? 'bg-[#41493F] text-white hover:bg-[#1B1F1A] shadow-xs'
                              : 'border border-[#D5DAD3] text-[#1B1F1A] hover:bg-white'
                          }`}
                        >
                          {isCurrentFocus ? (
                            <Pause size={12} className="fill-current" />
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
        {/* END: TaskList */}
      </div>

      {/* BEGIN: Floating Add Button */}
      <div className="fixed bottom-24 inset-x-0 mx-auto w-full max-w-[430px] px-6 pointer-events-none z-30 flex justify-end">
        <button
          type="button"
          aria-label="Add new focus task"
          onClick={() => {
            if (window.navigator?.vibrate) window.navigator.vibrate(15);
            if (onAddTask) onAddTask();
          }}
          className="tap-effect pointer-events-auto w-12 h-12 rounded-full bg-[#1B1F1A] text-white flex items-center justify-center shadow-lg hover:bg-[#41493F] transition-all cursor-pointer"
        >
          <svg className="w-5 h-5 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <line x1="12" x2="12" y1="5" y2="19" />
            <line x1="5" x2="19" y1="12" y2="12" />
          </svg>
        </button>
      </div>
      {/* END: Floating Add Button */}
    </div>
  );
}

export default React.memo(TaskList);
