import React, { useState, useMemo } from 'react';
import { Zap, Flame, Check, ListFilter, Play, Pause, Plus } from 'lucide-react';
import fireWebm from '../../assets/fireAnimation.webm';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import emptyLottie from '../../assets/emptyAnimation.lottie';

function TaskList({
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
  const todayStr = useMemo(() => getLocalDateStr(), []);

  const { todayHours, targetHours, progressPercent, streak, statusText } = useMemo(() => {
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

      return { todayHours, targetHours, progressPercent, streak, statusText };
    } catch (err) {
      return {
        todayHours: 0.0,
        targetHours: 4.0,
        progressPercent: 0,
        streak: 0,
        statusText: 'Ready to focus',
      };
    }
  }, [sessions, settings?.dailyGoalHours, todayStr]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
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
  }, [tasks, selectedProjectId, filterTab, todayStr]);

  const activeCount = useMemo(() => tasks.filter((t) => !t.completed).length, [tasks]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning.';
    if (h < 17) return 'Good afternoon.';
    return 'Good evening.';
  };

  return (
    <div className="flex-1 w-full bg-transparent pb-28 min-h-[100dvh] relative text-[#2A3A26]">
      <div className="flex flex-col w-full px-5 pt-15 pb-24 max-w-md mx-auto">
        {/* Greeting Header */}
        <header className="pt-2 pb-5 flex flex-col gap-1">
          <h1 className="text-[32px] leading-[38px] text-primary font-bold tracking-tight font-sans">
            {getGreeting()}
          </h1>
          <p className="text-[15px] leading-5 text-[#636F5A] font-normal font-sans">
            {activeCount} task{activeCount !== 1 ? 's' : ''} scheduled for today.
          </p>
        </header>

        {/* Metric Highlights Bento Row */}
        <section className="grid grid-cols-12 gap-3">
          {/* Daily Target Progress Card */}
          <div className="col-span-8 bg-surface border border-border rounded-[24px] p-5 shadow-sm ring-1 ring-white/80 flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <span className="font-mono text-[11px] font-bold text-[#636F5A] tracking-wider uppercase">
                DAILY TARGET
              </span>
              <div className="w-8 h-8 rounded-full bg-[#E5D9B6]/30 border border-[#E5D9B6]/40 flex items-center justify-center text-secondary shadow-2xs">
                <Zap size={16} className="text-secondary" />
              </div>
            </div>
            <div className="my-3 relative z-10">
              <h2 className="text-[19px] font-bold text-primary leading-tight font-sans">
                {todayHours}h of {targetHours}h completed
              </h2>
            </div>
            <div className="flex flex-col gap-1.5 relative z-10">
              <div className="w-full h-2.5 bg-[#EDE7DA] rounded-full overflow-hidden p-0.5 shadow-inner">
                <div
                  className="h-full bg-secondary rounded-full transition-all duration-500 shadow-xs"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between pt-0.5">
                <span className="font-mono text-[11px] text-[#636F5A]">{statusText}</span>
                <span className="font-mono text-[11px] font-bold text-primary">
                  {progressPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Streak Card */}
          <div className="col-span-4 bg-primary text-canvas rounded-[24px] p-5 shadow-md shadow-primary/25 ring-1 ring-white/15 flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-center justify-center gap-1.5 translate-x-1 relative z-10">
              <span className="font-mono text-[11px] text-[#E5D9B6] tracking-wider font-bold uppercase translate-y-0.5">
                STREAK
              </span>
              <video
                src={fireWebm}
                autoPlay
                loop
                muted
                playsInline
                className="w-8 h-8 object-contain drop-shadow-sm"
              />
            </div>
            <div className="my-auto pt-1 flex items-center flex-col text-center relative z-10">
              <span className="text-[34px] font-bold text-white leading-none tracking-tight font-sans drop-shadow-sm">
                {streak}
              </span>
              <span className="text-[13px] text-[#E5D9B6] font-medium mt-1 font-sans">Days</span>
            </div>
          </div>
        </section>

        {/* Category Filter Pills */}
        <section className="no-swipe -mx-5 px-5 flex items-center gap-2 overflow-x-auto py-4 mb-2 no-scrollbar after:content-[''] after:w-1 after:shrink-0">
          <button
            onClick={() => onSelectProject(null)}
            className={`shrink-0 h-10 px-4 rounded-full flex items-center gap-2 transition-transform active:scale-95 font-semibold text-[13px] font-sans ${
              !selectedProjectId
                ? 'bg-primary text-white shadow-sm shadow-primary/25 ring-1 ring-white/20'
                : 'bg-surface border border-border text-primary shadow-xs ring-1 ring-white/60 hover:bg-[#F4F1EA]'
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
                className={`shrink-0 h-10 px-4 rounded-full flex items-center gap-2 transition-transform active:scale-95 font-semibold text-[13px] font-sans ${
                  isSel
                    ? 'bg-primary text-white shadow-sm shadow-primary/25 ring-1 ring-white/20'
                    : 'bg-surface border border-border text-primary shadow-xs ring-1 ring-white/60 hover:bg-[#F4F1EA]'
                }`}
              >
                {!isSel && (
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: proj.color || 'var(--theme-secondary)' }}
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
              {['Today', 'This Week', 'Planned', 'Done'].map((tab) => {
                const on = filterTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setFilterTab(tab)}
                    className={`relative pb-2.5 text-[15px] font-sans transition-colors shrink-0 ${
                      on
                        ? 'font-bold text-primary'
                        : 'font-medium text-[#636F5A] hover:text-primary'
                    }`}
                  >
                    {tab}
                    {on && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="w-full h-px bg-border mt-[-1px]"></div>
        </section>

        {/* Tasks Subheader with Filter Icon */}
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="font-mono text-[11px] text-[#636F5A] tracking-wider font-bold uppercase">
            TASKS · {activeCount} ACTIVE
          </span>
          <button
            aria-label="Sort or filter tasks"
            className="text-[#636F5A] hover:text-primary transition-colors"
          >
            <ListFilter size={18} />
          </button>
        </div>

        {/* Task List Cards */}
        <section className="flex flex-col gap-3">
          {filteredTasks.length === 0 ? (
            <div className="bg-surface border border-border rounded-[24px] p-8 text-center flex flex-col items-center shadow-xs ring-1 ring-white/70">
              <DotLottieReact
                src={emptyLottie}
                loop
                autoplay
                className="w-32 h-32 mb-1 opacity-80 mix-blend-multiply"
              />
              <p className="font-sans text-[14px] text-[#636F5A]">
                No <span className="font-bold">tasks</span> in this view. Add one below.
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
                  className={`group bg-surface border border-border rounded-full p-2.5 pl-4 flex items-center justify-between shadow-xs ring-1 ring-white/60 transition-all hover:shadow-sm active:scale-[0.99] cursor-pointer ${
                    task.completed ? 'opacity-60 bg-surface/70' : ''
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
                      className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors shadow-2xs ${
                        task.completed
                          ? 'bg-secondary border-secondary text-white'
                          : 'border-border bg-[#F4F1EA] hover:border-secondary'
                      }`}
                    >
                      {task.completed ? (
                        <Check size={12} className="text-white" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full bg-surface shadow-inner"></span>
                      )}
                    </button>
                    <div className="flex flex-col min-w-0">
                      <h3
                        className={`text-[15px] font-bold text-primary truncate font-sans ${
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
                              style={{
                                backgroundColor: project?.color || 'var(--theme-secondary)',
                              }}
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
                      className="w-11 h-11 rounded-full bg-[#F4F1EA] border border-border/60 text-primary flex items-center justify-center shrink-0 hover:bg-secondary hover:text-white transition-all shadow-xs ring-1 ring-white/80 active:scale-95"
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
      </div>
    </div>
  );
}

export default React.memo(TaskList);
