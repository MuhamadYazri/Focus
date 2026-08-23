import React from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';

const G = "Geist, 'Helvetica Neue', sans-serif";
const M = "'JetBrains Mono', monospace";

const ACCENTS = ['var(--accent)', 'var(--text-secondary)', '#4A7090', '#6A7090'];

export default function TaskItem({
  task,
  project,
  onEdit,
  onDelete,
  onToggleComplete,
  onToggleSubtask,
  onStartPomodoro,
}) {
  const [expanded, setExpanded] = React.useState(false);

  // Derive accent color
  const accent =
    task.accent ||
    (project ? ACCENTS[(project.id ? project.id.charCodeAt(project.id.length - 1) : 0) % ACCENTS.length] : 'var(--accent)');

  // Format project tag (e.g. "01 · Personal App")
  const formatTag = () => {
    if (task.tag && task.index) return `${task.index} · ${task.tag}`;
    if (!project) return '00 · Unassigned';
    const cleanName = project.name.replace(/^[0-9]+\s*(\/\/|·|\.)\s*/, '').replace(/_/g, ' ');
    const idNum = project.id ? project.id.replace('proj-', '0').padStart(2, '0') : '01';
    return `${idNum} · ${cleanName}`;
  };

  const getStatusText = () => {
    if (task.status) return task.status;
    if (task.completed) return 'Completed';
    if (task.completedPomos && task.completedPomos > 0) return 'In Progress';
    if (task.priority === 'HIGH') return 'Queued';
    return 'Idle';
  };

  const tagText = formatTag();
  const statusText = getStatusText();
  const pomoDone = task.completedPomos || task.pomoDone || 0;
  const pomoTotal = task.estimatedPomos || task.pomoTotal || 1;

  return (
    <div
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--surface-border)',
        borderLeft: `2px solid ${accent}`,
        borderRadius: 8,
        padding: '12px 14px',
      }}
      onClick={() => onEdit && onEdit(task)}
      className="cursor-pointer active:opacity-70 transition-opacity select-none group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
              onToggleComplete(task.id);
            }}
            style={{
              width: 14,
              height: 14,
              borderRadius: 2,
              flexShrink: 0,
              border: `1px solid ${task.completed ? accent : 'var(--surface-border)'}`,
              background: task.completed ? accent : 'transparent',
            }}
            className="flex items-center justify-center transition-colors hover:border-[var(--accent)]"
          >
            {task.completed && (
              <svg width={8} height={8} viewBox="0 0 8 8">
                <path
                  d="M1 4 L3 6 L7 2"
                  stroke="#000"
                  strokeWidth={1.5}
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
          <span
            style={{
              fontFamily: M,
              fontSize: 8,
              color: accent,
              letterSpacing: '0.06em',
            }}
            className="truncate"
          >
            {tagText}
          </span>
        </div>
        <span
          style={{
            fontFamily: M,
            fontSize: 8,
            color: 'var(--text-secondary)',
            background: 'var(--surface-low)',
            border: '1px solid var(--surface-border)',
            borderRadius: 4,
            padding: '2px 7px',
            flexShrink: 0,
            marginLeft: 8,
          }}
        >
          {pomoDone} / {pomoTotal} pomo
        </span>
      </div>

      <p
        style={{
          fontFamily: G,
          fontSize: 13,
          fontWeight: 500,
          color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)',
          letterSpacing: '-0.01em',
          lineHeight: 1.35,
          textDecoration: task.completed ? 'line-through' : 'none',
        }}
      >
        {task.title}
      </p>

      {/* Subtasks summary pill if exists */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          style={{
            fontFamily: M,
            fontSize: 8,
            color: 'var(--text-secondary)',
            background: 'var(--surface-low)',
            border: '1px solid var(--surface-border)',
            borderRadius: 4,
            padding: '2px 6px',
            marginTop: 8,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span>
            SUBTASKS: {task.subtasks.filter((s) => s.completed).length} / {task.subtasks.length}
          </span>
          {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </div>
      )}

      <div className="flex items-center justify-between mt-2.5">
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: M, fontSize: 7.5, color: 'var(--text-muted)' }}>{statusText}</span>
          {task.scheduleType === 'daily' && (
            <span
              style={{
                fontFamily: M,
                fontSize: 7.5,
                color: 'var(--accent)',
                background: 'rgba(185, 218, 255, 0.1)',
                border: '1px solid rgba(185, 218, 255, 0.2)',
                borderRadius: 4,
                padding: '1px 5px',
              }}
            >
              Every Day
            </span>
          )}
          {task.scheduleType === 'date' && task.scheduledDate && (
            <span
              style={{
                fontFamily: M,
                fontSize: 7.5,
                color: 'var(--text-secondary)',
                background: 'rgba(139, 160, 176, 0.1)',
                border: '1px solid rgba(139, 160, 176, 0.2)',
                borderRadius: 4,
                padding: '1px 5px',
              }}
            >
              📅 {task.scheduledDate}
            </span>
          )}
        </div>
        {!task.completed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onStartPomodoro) onStartPomodoro(task);
            }}
            style={{ fontFamily: M, fontSize: 7.5, color: 'var(--accent)' }}
            className="hover:underline"
          >
            Start timer →
          </button>
        )}
      </div>

      {/* Expanded Subtasks */}
      {expanded && task.subtasks && task.subtasks.length > 0 && (
        <div
          style={{ borderTop: '1px solid var(--surface-border)', marginTop: 10, paddingTop: 10 }}
          className="space-y-1.5"
        >
          {task.subtasks.map((sub) => (
            <div
              key={sub.id}
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleSubtask) onToggleSubtask(task.id, sub.id);
              }}
              className="flex items-center gap-2 text-xs cursor-pointer py-0.5"
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  border: `1px solid ${sub.completed ? 'var(--text-secondary)' : 'var(--surface-border)'}`,
                  background: sub.completed ? 'var(--text-secondary)' : 'var(--surface-low)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {sub.completed && <Check size={8} color="var(--surface-low)" strokeWidth={3} />}
              </div>
              <span
                style={{
                  fontFamily: M,
                  fontSize: 10,
                  color: sub.completed ? '#52525B' : 'var(--text-secondary)',
                  textDecoration: sub.completed ? 'line-through' : 'none',
                }}
              >
                {sub.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
