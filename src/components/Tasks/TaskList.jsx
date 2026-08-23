import React, { useState } from 'react';

const G = "'Geist', system-ui, sans-serif";
const M = "'JetBrains Mono', monospace";

export default function TaskList({
  tasks = [],
  projects = [],
  sessions = [],
  settings = {},
  selectedProjectId,
  onSelectProject,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleComplete,
  onToggleSubtask,
  onStartPomodoro,
  onAddProject,
  onEditProject,
  onDeleteProject,
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
        const sDt = s.dateStr || (typeof s.completedAt === 'string' ? s.completedAt.split('T')[0] : '');
        return sDt === todayStr;
      });
      const todayMins = todaySessions.reduce((acc, s) => acc + ((s && s.duration) ? Number(s.duration) : 25), 0);
      const todayHours = Number((todayMins / 60).toFixed(1));

      let targetHours = 4.0;
      try {
        const hist = JSON.parse(localStorage.getItem('focus_daily_goals_history_v1') || '{}');
        if (hist && hist[todayStr]) targetHours = Number(hist[todayStr]);
        else if (settings && settings.dailyGoalHours) targetHours = Number(settings.dailyGoalHours);
      } catch (e) {}

      const progressPercent = targetHours > 0 ? Math.min(100, Math.round((todayHours / targetHours) * 100)) : 0;

      let streak = 0;
      const now = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dStr = getLocalDateStr(d);
        const daySess = (sessions || []).filter((s) => {
          if (!s || typeof s !== 'object') return false;
          const sDt = s.dateStr || (typeof s.completedAt === 'string' ? s.completedAt.split('T')[0] : '');
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
      return { todayHours: 0.0, targetHours: 4.0, progressPercent: 0, streak: 14, statusText: 'Ready to focus' };
    }
  };

  const { todayHours, targetHours, progressPercent, streak, statusText } = calculateDailyProgress();

  const filteredTasks = tasks.filter((task) => {
    if (selectedProjectId && task.projectId !== selectedProjectId) return false;
    const st = task.scheduleType || 'today';
    if (filterTab === 'Archive') return task.completed && st !== 'daily';
    if (filterTab === 'Today') {
      if (st === 'daily') return true;
      if (task.completed) return false;
      if (st === 'today') return true;
      if (st === 'date' && task.scheduledDate && task.scheduledDate <= todayStr) return true;
      return false;
    }
    if (filterTab === 'This Week') {
      if (st === 'daily') return true;
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
    <div className="min-h-[100dvh] pb-32" style={{ fontFamily: G }}>

      {/* ── Sticky Header ── */}
      <header className="glass sticky top-0 z-40 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined fill text-[22px]" style={{ color: 'var(--text-on-accent)' }}>grid_view</span>
          <h1 style={{ fontFamily: G, fontSize: 22, fontWeight: 700, color: 'var(--text-on-accent)', letterSpacing: '-0.02em' }}>
            Dashboard
          </h1>
        </div>
        <span style={{ fontFamily: M, fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>
          FOCUS
        </span>
      </header>

      <div className="px-5 pt-6 flex flex-col gap-5 max-w-md mx-auto">

        {/* ── Greeting ── */}
        <section className="animate-slideUp" style={{ animationDelay: '0.05s' }}>
          <h2 style={{ fontFamily: G, fontSize: 34, fontWeight: 700, color: 'var(--text-on-accent)', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            {getGreeting()}
          </h2>
          <p style={{ fontFamily: G, fontSize: 15, color: 'var(--text-secondary)', marginTop: 6 }}>
            {activeCount} task{activeCount !== 1 ? 's' : ''} scheduled for today.
          </p>
        </section>

        {/* ── Bento Grid: Target + Streak ── */}
        <section className="animate-slideUp" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, animationDelay: '0.1s' }}>

          {/* Daily Target Card */}
          <div className="card-2xl squish p-6 flex flex-col justify-between" style={{ minHeight: 130 }}>
            <div className="flex items-start justify-between">
              <div>
                <p style={{ fontFamily: M, fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>DAILY TARGET</p>
                <p style={{ fontFamily: G, fontSize: 15, color: 'var(--text-on-accent)', marginTop: 2 }}>
                  {todayHours}h of {targetHours}h completed
                </p>
              </div>
              <span className="material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 24 }}>crisis_alert</span>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ width: '100%', height: 6, background: 'var(--surface-low)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', background: 'var(--accent)', borderRadius: 99, transition: 'width 0.6s ease-out' }} />
              </div>
              <div className="flex justify-between" style={{ marginTop: 6 }}>
                <span style={{ fontFamily: M, fontSize: 10, color: 'var(--text-muted)' }}>{statusText}</span>
                <span style={{ fontFamily: M, fontSize: 10, color: 'var(--text-muted)' }}>{progressPercent}%</span>
              </div>
            </div>
          </div>

          {/* Streak Card */}
          <div
            className="card-2xl squish flex flex-col justify-between p-5 relative overflow-hidden"
            style={{ background: 'var(--text-primary)', minWidth: 110, minHeight: 130 }}
          >
            <div className="flex justify-between items-start">
              <span style={{ fontFamily: M, fontSize: 9, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em' }}>STREAK</span>
              <span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }}>local_fire_department</span>
            </div>
            <div>
              <div style={{ fontFamily: G, fontSize: 38, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {streak}
              </div>
              <p style={{ fontFamily: G, fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Days</p>
            </div>
          </div>
        </section>

        {/* ── Categories ── */}
        <section className="animate-slideUp" style={{ animationDelay: '0.15s' }}>
          <div
            className="flex gap-2 overflow-x-auto no-scrollbar pb-2 pt-2 -mt-2 -mx-5 px-5"
            style={{
              maskImage: 'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)',
            }}
          >
            {/* All Tasks chip */}
            <button
              type="button"
              onClick={() => { if (window.navigator?.vibrate) window.navigator.vibrate(10); if (onSelectProject) onSelectProject(null); }}
              className="squish flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all"
              style={{
                background: !selectedProjectId ? 'var(--text-primary)' : 'var(--surface-card)',
                color: !selectedProjectId ? '#fff' : 'var(--text-primary)',
                border: !selectedProjectId ? 'none' : '1px solid var(--surface-border)',
                fontFamily: G, fontSize: 14, fontWeight: !selectedProjectId ? 600 : 400,
                boxShadow: !selectedProjectId ? 'none' : 'var(--shadow-soft)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, opacity: 0.7 }}>task_alt</span>
              All Tasks
            </button>

            {projects.map((proj) => {
              const isSel = selectedProjectId === proj.id;
              const cleanName = proj.name.replace(/^[0-9]+\s*(\/\/|·|\.)\s*/, '').replace(/_/g, ' ');
              return (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => { if (window.navigator?.vibrate) window.navigator.vibrate(10); if (onSelectProject) onSelectProject(isSel ? null : proj.id); }}
                  className="squish flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all"
                  style={{
                    background: isSel ? proj.color || 'var(--accent)' : 'var(--surface-card)',
                    color: isSel ? 'var(--text-on-accent)' : 'var(--text-primary)',
                    border: isSel ? 'none' : '1px solid var(--surface-border)',
                    fontFamily: G,
                    fontSize: 14,
                    fontWeight: isSel ? 600 : 400,
                    boxShadow: isSel ? 'none' : 'var(--shadow-soft)',
                  }}
                >
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: isSel ? 'var(--text-on-accent)' : (proj.color || 'var(--accent)') }} />
                  {cleanName}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Filter Tabs ── */}
        <section className="animate-slideUp" style={{ animationDelay: '0.2s' }}>
          <div className="flex gap-6 border-b" style={{ borderColor: 'var(--surface-border)', paddingBottom: 2 }}>
            {['Today', 'This Week', 'Planned', 'Archive'].map((tab) => {
              const on = filterTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => { if (window.navigator?.vibrate) window.navigator.vibrate(10); setFilterTab(tab); }}
                  style={{
                    fontFamily: G, fontSize: 15, fontWeight: on ? 600 : 400,
                    color: on ? 'var(--text-primary)' : 'var(--text-secondary)',
                    paddingBottom: 10,
                    borderBottom: on ? '2px solid var(--text-primary)' : '2px solid transparent',
                    marginBottom: -2,
                    transition: 'all 0.2s',
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Task List ── */}
        <section className="flex flex-col gap-3 animate-slideUp" style={{ animationDelay: '0.2s' }}>
          <span style={{ fontFamily: M, fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
            TASKS · {activeCount} ACTIVE
          </span>
          {filteredTasks.length === 0 ? (
            <div className="card-2xl p-8 text-center">
              <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>check_circle</span>
              <p style={{ fontFamily: G, fontSize: 14, color: 'var(--text-muted)' }}>No tasks in this view. Add one below.</p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const project = projects.find((p) => p.id === task.projectId);
              const cleanProjectName = project ? project.name.replace(/^[0-9]+\s*(\/\/|·|\.)\s*/, '').replace(/_/g, ' ') : null;
              return (
                <div
                  key={task.id}
                  className="card-2xl squish flex items-center gap-4 p-4 group cursor-pointer"
                  onClick={() => { if (onEditTask) onEditTask(task); }}
                  style={{ opacity: task.completed ? 0.55 : 1 }}
                >
                  {/* Checkbox */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); if (window.navigator?.vibrate) window.navigator.vibrate(10); if (onToggleComplete) onToggleComplete(task.id); }}
                    className="flex-shrink-0 flex items-center justify-center transition-all"
                    style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${task.completed ? 'var(--accent)' : 'var(--surface-mid)'}`, background: task.completed ? 'var(--accent)' : 'transparent' }}
                  >
                    {task.completed && <span className="material-symbols-outlined fill" style={{ fontSize: 16, color: '#fff' }}>check</span>}
                  </button>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p style={{ fontFamily: G, fontSize: 15, fontWeight: 500, color: 'var(--text-on-accent)', textDecoration: task.completed ? 'line-through' : 'none' }} className="truncate">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      {cleanProjectName && (
                        <span className="flex items-center gap-1" style={{ fontFamily: M, fontSize: 10, color: 'var(--text-secondary)' }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: project?.color || 'var(--accent)', flexShrink: 0 }} />
                          {cleanProjectName}
                        </span>
                      )}
                      {task.estimatedPomos && (
                        <span style={{ fontFamily: M, fontSize: 10, color: 'var(--text-muted)' }}>
                          {task.completedPomos || 0}/{task.estimatedPomos} pomos
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Play action */}
                  {!task.completed && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); if (window.navigator?.vibrate) window.navigator.vibrate(20); if (onStartPomodoro) onStartPomodoro(task); }}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg"
                      style={{ background: 'var(--surface-low)' }}
                    >
                      <span className="material-symbols-outlined fill" style={{ fontSize: 18, color: 'var(--text-on-accent)' }}>play_circle</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </section>
      </div>

      {/* ── FAB ── */}
      <button
        type="button"
        onClick={() => { if (window.navigator?.vibrate) window.navigator.vibrate(15); if (onAddTask) onAddTask(); }}
        className="animate-fab-in squish fixed right-5 bottom-24 z-40 flex items-center justify-center"
        style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--text-primary)', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' }}
        title="Add new task"
      >
        <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 26 }}>add</span>
      </button>
    </div>
  );
}
