import React, { useState } from 'react';
import { Plus, Activity } from 'lucide-react';
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
}) {
  const [filterTab, setFilterTab] = useState('Today');

  const filteredTasks = tasks.filter((task) => {
    if (selectedProjectId && task.projectId !== selectedProjectId) return false;
    if (filterTab === 'Archive') return task.completed;
    if (filterTab === 'Today' || filterTab === 'This Week' || filterTab === 'Planned') {
      return !task.completed;
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
        <div
          style={{
            background: '#090A0C',
            border: '1px solid #27272A',
            borderRadius: 6,
            padding: '6px 8px',
          }}
          className="flex items-center gap-1.5"
        >
          <Activity size={12} color="#B9DAFF" strokeWidth={2} />
          <span
            style={{
              fontFamily: M,
              fontSize: 8,
              color: '#B9DAFF',
              letterSpacing: '0.06em',
            }}
          >
            SYS: ONLINE
          </span>
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
