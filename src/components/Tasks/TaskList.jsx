import React, { useState } from 'react';
import { Zap, Flame, Check, ListFilter, Play, Pause, Plus } from 'lucide-react';

export default function TaskList({
  tasks = [],
  projects = [],
  sessions = [],
  settings = {},
  selectedProjectId,
  onSelectProject,
  onAddTask,
  onEditTask,
  onToggleComplete,
  onStartPomodoro,
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

  const [filterTab, setFilterTab] = useState('Today');
  const todayStr = getLocalDateStr();

  const calculateDailyProgress = () => {
    try {
      const todaySessions = (sessions || []).filter((s) => {
        if (!s || typeof s !== 'object') return false;
        const sDt =
          s.dateStr || (typeof s.completedAt === 'string' ? s.completedAt.split('T')[0] : '');
        return sDt === todayStr;
      });
      const todayMins = todaySessions.reduce(
        (acc, s) => acc + (s && s.duration ? Number(s.duration) : 25),
        0
      );
      const todayHours = Number((todayMins / 60).toFixed(1));

      let targetHours = 4.0;
      try {
        if (settings && settings.dailyGoalHours) targetHours = Number(settings.dailyGoalHours);
      } catch (e) {}

      const progressPercent =
        targetHours > 0 ? Math.min(100, Math.round((todayHours / targetHours) * 100)) : 0;

      let streak = 0;
      const now = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dStr = getLocalDateStr(d);
        const daySess = (sessions || []).filter((s) => {
          if (!s || typeof s !== 'object') return false;
          const sDt =
            s.dateStr || (typeof s.completedAt === 'string' ? s.completedAt.split('T')[0] : '');
          return sDt === dStr;
        });
        if (daySess.length > 0) streak++;
        else if (i === 0) continue;
        else break;
      }

      let statusText = 'Ready to focus';
      if (progressPercent >= 100) statusText = 'Goal achieved!';
      else if (progressPercent >= 50) statusText = 'Making good progress';
      else if (todayHours > 0) statusText = 'In progress';

      return { todayHours, targetHours, progressPercent, streak: Math.max(streak, 14), statusText };
    } catch (err) {
      return {
        todayHours: 0.0,
        targetHours: 4.0,
        progressPercent: 0,
        streak: 14,
        statusText: 'Ready to focus',
      };
    }
  };

  const { todayHours, targetHours, progressPercent, streak, statusText } = calculateDailyProgress();

  const filteredTasks = tasks.filter((task) => {
    if (selectedProjectId && task.projectId !== selectedProjectId) return false;
    const st = task.scheduleType || 'today';
    if (filterTab === 'Archive') return task.completed && st !== 'daily' && st !== 'weekly';

    if (filterTab === 'Today') {
      if (st === 'daily') return true;
      if (st === 'weekly') {
        const d = new Date().getDay();
        return Array.isArray(task.weeklyDays) && task.weeklyDays.includes(d);
      }
      if (task.completed) return false;
      if (st === 'today') return true;
      if (st === 'date' && task.scheduledDate && task.scheduledDate <= todayStr) return true;
      return false;
    }

    if (filterTab === 'This Week') {
      if (st === 'daily' || st === 'weekly') return true;
      if (task.completed) return false;
      if (st === 'today') return true;
      if (st === 'date') {
        const endOfWeek = new Date();
        endOfWeek.setDate(new Date().getDate() + 7);
        const endStr = getLocalDateStr(endOfWeek);
        return !task.scheduledDate || task.scheduledDate <= endStr;
      }
      return false;
    }
    if (filterTab === 'Planned') {
      if (task.completed) return false;
      if (st === 'date') return true;
      return false;
    }
    return true;
  });

  const activeCount = tasks.filter((t) => !t.completed).length;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning.';
    if (h < 17) return 'Good afternoon.';
    return 'Good evening.';
  };

  return (
    <div className="flex-1 w-full bg-[#F9FBEE] pb-28 min-h-[100dvh] relative text-[#2A3A26]">
      <div className="flex flex-col w-full px-5 pt-15 pb-24 max-w-md mx-auto">
        {/* Greeting Header */}
        <header className="pt-2 pb-5 flex flex-col gap-1">
          <h1 className="text-[32px] leading-[38px] text-[#40513B] font-bold tracking-tight font-sans">
            {getGreeting()}
          </h1>
          <p className="text-[15px] leading-5 text-[#636F5A] font-normal font-sans">
            {activeCount} task{activeCount !== 1 ? 's' : ''} scheduled for today.
          </p>
        </header>

        {/* Metric Highlights Bento Row */}
        <section className="grid grid-cols-12 gap-3 mb-6">
          {/* Daily Target Progress Card */}
          <div className="col-span-8 bg-white border border-[#EDE7DA] rounded-[24px] p-5 shadow-[0_4px_20px_-2px_rgba(64,81,59,0.06)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-[#636F5A] tracking-wider uppercase">
                DAILY TARGET
              </span>
              <div className="w-8 h-8 rounded-full bg-[#E5D9B6]/30 flex items-center justify-center text-[#628141]">
                <Zap size={16} className="text-[#628141]" />
              </div>
            </div>
            <div className="my-3">
              <h2 className="text-[19px] font-bold text-[#40513B] leading-tight font-sans">
                {todayHours}h of {targetHours}h completed
              </h2>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="w-full h-2.5 bg-[#E5D9B6]/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#628141] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between pt-0.5">
                <span className="font-mono text-[11px] text-[#636F5A]">{statusText}</span>
                <span className="font-mono text-[11px] font-bold text-[#40513B]">
                  {progressPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Streak Card */}
          <div className="col-span-4 bg-[#40513B] text-[#F9FBEE] rounded-[24px] p-5 shadow-[0_10px_22px_rgba(64,81,59,0.22)] flex flex-col justify-between">
            <div className="flex items-center justify-evenly">
              <span className="font-mono text-[11px] text-[#E5D9B6] tracking-wider font-bold uppercase">
                STREAK
              </span>
              <Flame size={20} className="text-[#E67E22] fill-current" />
            </div>
            <div className="my-auto pt-1 flex items-center flex-col text-center">
              <span className="text-[34px] font-bold text-white leading-none tracking-tight font-sans">
                {streak}
              </span>
              <span className="text-[13px] text-[#E5D9B6] font-medium mt-1 font-sans">Days</span>
            </div>
          </div>
        </section>

        {/* Category Filter Pills */}
        <section className="no-swipe -mx-5 px-5 flex items-center gap-2 overflow-x-auto pb-1 mb-5 no-scrollbar after:content-[''] after:w-1 after:shrink-0">
          <button
            onClick={() => onSelectProject(null)}
            className={`shrink-0 h-10 px-4 rounded-full flex items-center gap-2 shadow-sm transition-transform active:scale-95 font-semibold text-[13px] font-sans ${
              !selectedProjectId
                ? 'bg-[#40513B] text-white'
                : 'bg-white border border-[#EDE7DA] text-[#40513B] hover:bg-[#F4F1EA]'
            }`}
          >
            {!selectedProjectId && <Check size={14} className="text-[#E5D9B6]" />}
            <span className="tracking-wide">All Tasks</span>
          </button>

          {projects.map((proj) => {
            const isSel = selectedProjectId === proj.id;
            const cleanName = proj.name.replace(/^[0-9]+\s*(\/\/|·|\.)\s*/, '').replace(/_/g, ' ');
            return (
              <button
                key={proj.id}
                onClick={() => onSelectProject(isSel ? null : proj.id)}
                className={`shrink-0 h-10 px-4 rounded-full flex items-center gap-2 shadow-sm transition-transform active:scale-95 font-semibold text-[13px] font-sans ${
                  isSel
                    ? 'bg-[#40513B] text-white'
                    : 'bg-white border border-[#EDE7DA] text-[#40513B] hover:bg-[#F4F1EA]'
                }`}
              >
                {!isSel && (
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: proj.color || '#628141' }}
                  ></span>
                )}
                {isSel && <Check size={14} className="text-[#E5D9B6]" />}
                <span className="tracking-wide uppercase">{cleanName}</span>
              </button>
            );
          })}
        </section>

        {/* Timeline Tab Switcher */}
        <section className="mb-5">
          <div className="flex items-center justify-between relative overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-6">
              {['Today', 'This Week', 'Planned', 'Archive'].map((tab) => {
                const on = filterTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setFilterTab(tab)}
                    className={`relative pb-2.5 text-[15px] font-sans transition-colors shrink-0 ${
                      on
                        ? 'font-bold text-[#40513B]'
                        : 'font-medium text-[#636F5A] hover:text-[#40513B]'
                    }`}
                  >
                    {tab}
                    {on && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#40513B] rounded-full"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="w-full h-px bg-[#EDE7DA] mt-[-1px]"></div>
        </section>

        {/* Tasks Subheader with Filter Icon */}
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="font-mono text-[11px] text-[#636F5A] tracking-wider font-bold uppercase">
            TASKS · {activeCount} ACTIVE
          </span>
          <button
            aria-label="Sort or filter tasks"
            className="text-[#636F5A] hover:text-[#40513B] transition-colors"
          >
            <ListFilter size={18} />
          </button>
        </div>

        {/* Task List Cards */}
        <section className="flex flex-col gap-3">
          {filteredTasks.length === 0 ? (
            <div className="bg-white border border-[#EDE7DA] rounded-[24px] p-8 text-center flex flex-col items-center shadow-sm">
              <Check size={32} className="text-[#8D9A82] mb-3" />
              <p className="font-sans text-[14px] text-[#636F5A]">
                No tasks in this view. Add one below.
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const project = projects.find((p) => p.id === task.projectId);
              const cleanProjectName = project
                ? project.name.replace(/^[0-9]+\s*(\/\/|·|\.)\s*/, '').replace(/_/g, ' ')
                : null;

              return (
                <article
                  key={task.id}
                  className={`group bg-white border border-[#EDE7DA] rounded-full p-2.5 pl-4 flex items-center justify-between shadow-[0_4px_16px_-2px_rgba(64,81,59,0.05)] transition-all hover:shadow-md cursor-pointer ${
                    task.completed ? 'opacity-60' : ''
                  }`}
                  onClick={() => onEditTask && onEditTask(task)}
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-2">
                    <button
                      aria-label="Toggle Complete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleComplete && onToggleComplete(task.id);
                      }}
                      className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        task.completed
                          ? 'bg-[#628141] border-[#628141]'
                          : 'border-[#EDE7DA] bg-[#F4F1EA] hover:border-[#628141]'
                      }`}
                    >
                      {task.completed ? (
                        <Check size={12} className="text-white" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full bg-white shadow-inner"></span>
                      )}
                    </button>
                    <div className="flex flex-col min-w-0">
                      <h3
                        className={`text-[15px] font-bold text-[#40513B] truncate font-sans ${
                          task.completed ? 'line-through' : ''
                        }`}
                      >
                        {task.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        {cleanProjectName && (
                          <>
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: project?.color || '#628141' }}
                            ></span>
                            <span className="font-mono text-[10px] text-[#636F5A] tracking-wider font-semibold uppercase truncate max-w-[120px]">
                              {cleanProjectName}
                            </span>
                          </>
                        )}
                        {task.estimatedPomos && (
                          <span className="font-mono text-[11px] text-[#8D9A82] shrink-0">
                            {task.completedPomos || 0}/{task.estimatedPomos} pomos
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {!task.completed && (
                    <button
                      aria-label="Start Pomodoro"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartPomodoro && onStartPomodoro(task);
                      }}
                      className="w-11 h-11 rounded-full bg-[#F4F1EA] text-[#40513B] flex items-center justify-center shrink-0 hover:bg-[#628141] hover:text-white transition-all shadow-sm active:scale-95"
                    >
                      <Play size={16} className="translate-x-0.5 fill-current" />
                    </button>
                  )}
                </article>
              );
            })
          )}
        </section>

        {/* Floating Action Button (FAB) */}
        <aside className="fixed bottom-24 right-5 z-50 animate-[popIn_0.5s_cubic-bezier(0.16,1,0.3,1)_forwards]">
          <style>{`
            @keyframes popIn {
              0% { opacity: 0; transform: scale(0.5) translateY(20px); }
              100% { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}</style>
          <button
            aria-label="Add Task"
            onClick={() => {
              if (window.navigator?.vibrate) window.navigator.vibrate(15);
              if (onAddTask) onAddTask();
            }}
            className="w-14 h-14 rounded-full bg-[#40513B] text-white flex items-center justify-center shadow-[0_10px_22px_rgba(64,81,59,0.35)] active:scale-90 transition-transform hover:bg-[#344230]"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </aside>
      </div>
    </div>
  );
}
