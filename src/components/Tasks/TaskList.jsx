import React, { useState } from 'react';
import { Plus, Edit2, Trash2, FolderKanban } from 'lucide-react';
import TaskItem from './TaskItem';

const G = "Geist, 'Helvetica Neue', sans-serif";
const M = "'JetBrains Mono', monospace";

export default function TaskList({
  tasks = [],
  projects = [],
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
  const [filterTab, setFilterTab] = useState('Today');

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredTasks = tasks.filter((task) => {
    if (selectedProjectId && task.projectId !== selectedProjectId) return false;
    const st = task.scheduleType || 'today';
    if (filterTab === 'Archive') {
      return task.completed && st !== 'daily';
    }
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
        const now = new Date();
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() + 7);
        const endStr = endOfWeek.toISOString().split('T')[0];
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

  return (
    <div
      className="pb-32 pt-4 px-4 max-w-md mx-auto space-y-4 select-none relative min-h-[85vh]"
      style={{ fontFamily: G }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <span
            style={{
              fontFamily: M,
              fontSize: 9,
              color: '#3F3F46',
              letterSpacing: '0.1em',
              display: 'block',
            }}
          >
            Focus
          </span>
          <h1
            style={{
              fontFamily: G,
              fontSize: 22,
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.03em',
              marginTop: 2,
            }}
          >
            Dashboard
          </h1>
        </div>
      </div>

      {/* Daily Target Card */}
      <div
        style={{
          background: '#090A0C',
          border: '1px solid #27272A',
          borderRadius: 8,
          padding: '12px 14px',
        }}
        className="space-y-2.5"
      >
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: M, fontSize: 8, color: '#A1A1AA', letterSpacing: '0.08em' }}>
            DAILY TARGET
          </span>
          <span style={{ fontFamily: M, fontSize: 11, fontWeight: 700, color: '#B9DAFF' }}>
            0.0h · 0%
          </span>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            width: '100%',
            height: 4,
            background: '#1A1A1A',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '0%',
              height: '100%',
              background: '#B9DAFF',
              borderRadius: 2,
            }}
          />
        </div>

        <div className="flex items-center justify-between pt-0.5">
          <span style={{ fontFamily: M, fontSize: 8, color: '#3F3F46' }}>Status: Ready to focus</span>
          <span style={{ fontFamily: M, fontSize: 8, color: '#3F3F46' }}>Streak: 14 days</span>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: M, fontSize: 8, color: '#A1A1AA', letterSpacing: '0.08em' }}>
            CATEGORIES
          </span>
          <button
            type="button"
            onClick={() => {
              if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
              if (onAddProject) onAddProject();
            }}
            className="flex items-center gap-1 text-xs transition-opacity hover:opacity-80"
            style={{ fontFamily: M, fontSize: 8, color: '#B9DAFF', fontWeight: 600 }}
          >
            <Plus size={10} /> NEW CATEGORY
          </button>
        </div>
        <div
          className="flex gap-1.5 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <button
            type="button"
            onClick={() => {
              if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
              if (onSelectProject) onSelectProject(null);
            }}
            className="flex-shrink-0 transition-all active:scale-95"
            style={{
              fontFamily: G,
              fontSize: 11,
              padding: '6px 12px',
              borderRadius: 6,
              background: !selectedProjectId ? '#FFFFFF' : '#090A0C',
              color: !selectedProjectId ? '#000000' : '#A1A1AA',
              border: !selectedProjectId ? 'none' : '1px solid #27272A',
              fontWeight: !selectedProjectId ? 600 : 400,
            }}
          >
            All Tasks
          </button>
          {projects.map((proj) => {
            const isSel = selectedProjectId === proj.id;
            const cleanName = proj.name.replace(/^[0-9]+\s*(\/\/|·|\.)\s*/, '').replace(/_/g, ' ');
            return (
              <div
                key={proj.id}
                className="flex items-center flex-shrink-0 transition-all"
                style={{
                  background: isSel ? proj.color : '#090A0C',
                  border: isSel ? 'none' : '1px solid #27272A',
                  borderRadius: 6,
                  overflow: 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
                    if (onSelectProject) onSelectProject(isSel ? null : proj.id);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 transition-opacity active:opacity-80"
                  style={{
                    fontFamily: G,
                    fontSize: 11,
                    color: isSel ? '#000000' : '#FFFFFF',
                    fontWeight: isSel ? 600 : 400,
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: isSel ? '#000000' : proj.color,
                    }}
                  />
                  <span>{cleanName}</span>
                </button>
                <div
                  className="flex items-center border-l pr-1.5 pl-1 gap-1"
                  style={{
                    borderColor: isSel ? 'rgba(0,0,0,0.15)' : '#27272A',
                  }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onEditProject) onEditProject(proj);
                    }}
                    className="p-1 transition hover:opacity-80"
                    title="Edit category"
                    style={{ color: isSel ? '#000000' : '#A1A1AA' }}
                  >
                    <Edit2 size={11} />
                  </button>
                  {projects.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete category "${cleanName}" and its tasks?`)) {
                          if (onDeleteProject) onDeleteProject(proj.id);
                        }
                      }}
                      className="p-1 transition hover:opacity-80"
                      title="Delete category"
                      style={{ color: isSel ? '#000000' : '#FF6B6B' }}
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        className="flex gap-1.5 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {['Today', 'This Week', 'Planned', 'Archive'].map((tab) => {
          const on = filterTab === tab;
          return (
            <button
              key={tab}
              onClick={() => {
                if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
                setFilterTab(tab);
              }}
              className="flex-shrink-0 transition-all active:scale-95"
              style={{
                fontFamily: M,
                fontSize: 9,
                letterSpacing: '0.06em',
                padding: '5px 12px',
                borderRadius: 4,
                background: on ? '#B9DAFF' : 'transparent',
                color: on ? '#000000' : '#3F3F46',
                border: on ? 'none' : '1px solid #27272A',
                fontWeight: on ? 600 : 400,
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Section label */}
      <div className="flex items-center justify-between pt-1">
        <span style={{ fontFamily: M, fontSize: 8, color: '#3F3F46', letterSpacing: '0.08em' }}>
          Tasks · {activeCount} active
        </span>
      </div>

      {/* Task cards list */}
      <div className="flex flex-col space-y-2">
        {filteredTasks.length === 0 ? (
          <div
            style={{
              background: '#090A0C',
              border: '1px solid #27272A',
              borderRadius: 8,
              padding: '24px 14px',
            }}
            className="text-center"
          >
            <p style={{ fontFamily: M, fontSize: 10, color: '#3F3F46' }}>
              No tasks found in this view.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const project = projects.find((p) => p.id === task.projectId);
            return (
              <TaskItem
                key={task.id}
                task={task}
                project={project}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onToggleComplete={onToggleComplete}
                onToggleSubtask={onToggleSubtask}
                onStartPomodoro={onStartPomodoro}
              />
            );
          })
        )}
      </div>

      {/* FAB (Floating Action Button) */}
      <button
        type="button"
        onClick={() => {
          if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(15);
          if (onAddTask) onAddTask();
        }}
        className="fixed right-5 bottom-20 z-40 flex items-center justify-center transition-all duration-200 active:scale-90 hover:bg-[#A3CDFA]"
        style={{
          width: 44,
          height: 44,
          borderRadius: 8,
          background: '#B9DAFF',
        }}
        title="Add new task"
      >
        <Plus size={20} color="#000000" strokeWidth={2.5} />
      </button>
    </div>
  );
}
