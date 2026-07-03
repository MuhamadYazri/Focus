import React, { useState } from 'react';
import { Check, Clock, Calendar, ChevronDown, ChevronUp, Play, Trash2, Edit3, ListChecks } from 'lucide-react';
import ProjectBadge from '../Projects/ProjectBadge';
import confetti from 'canvas-confetti';

const PRIORITY_STYLES = {
  P1: { label: 'P1 Tinggi', bg: 'bg-[#ff5252]/15', text: 'text-[#ff5252]', border: 'border-[#ff5252]/30' },
  P2: { label: 'P2 Sedang', bg: 'bg-[#ffb142]/15', text: 'text-[#ffb142]', border: 'border-[#ffb142]/30' },
  P3: { label: 'P3 Rendah', bg: 'bg-[#34ace0]/15', text: 'text-[#34ace0]', border: 'border-[#34ace0]/30' },
  NONE: null,
};

export default function TaskItem({
  task,
  project,
  onToggleComplete,
  onToggleSubtask,
  onEdit,
  onDelete,
  onStartPomodoro,
}) {
  const [expanded, setExpanded] = useState(false);

  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    if (!task.completed) {
      // Trigger subtle confetti on completion
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#ff5252', '#2ecc71', '#ffb142', '#34ace0'],
      });
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate([20, 30, 20]);
      }
    }
    onToggleComplete(task.id);
  };

  const pStyle = PRIORITY_STYLES[task.priority];
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const completedSubtasks = hasSubtasks
    ? task.subtasks.filter((s) => s.completed).length
    : 0;

  return (
    <div
      className={`group bg-[#1c1c24] hover:bg-[#252530] border rounded-2xl transition-all p-4 ${
        task.completed
          ? 'border-slate-800 opacity-60 bg-[#131318]'
          : 'border-[#2e2e3a] hover:border-slate-600 shadow-md'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleCheckboxClick}
          className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all flex-shrink-0 ${
            task.completed
              ? 'bg-[#2ecc71] border-[#2ecc71] text-black shadow-sm'
              : 'border-slate-500 hover:border-[#ff5252] bg-[#131318]'
          }`}
        >
          {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
        </button>

        {/* Main Content */}
        <div className="flex-1 min-w-0" onClick={() => hasSubtasks && setExpanded(!expanded)}>
          <div className="flex items-start justify-between gap-2">
            <h4
              className={`font-semibold text-base transition break-words ${
                task.completed ? 'line-through text-slate-400' : 'text-white group-hover:text-[#ff5252]'
              }`}
            >
              {task.title}
            </h4>

            {/* Quick Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {!task.completed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartPomodoro(task);
                  }}
                  className="p-1.5 rounded-lg bg-[#ff5252]/10 text-[#ff5252] hover:bg-[#ff5252] hover:text-white transition shadow-sm"
                  title="Fokus Tugas Ini"
                >
                  <Play className="w-4 h-4 fill-current" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(task);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
                title="Edit Tugas"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(task.id);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-[#ff5252] hover:bg-[#ff5252]/10 transition"
                title="Hapus Tugas"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Badges & Meta info */}
          <div className="flex flex-wrap items-center gap-2 mt-2 pt-1">
            <ProjectBadge project={project} size="sm" />

            {pStyle && (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${pStyle.bg} ${pStyle.text} ${pStyle.border}`}
              >
                {pStyle.label}
              </span>
            )}

            <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-[#131318] px-2 py-0.5 rounded-md border border-[#2e2e3a]">
              <Clock className="w-3 h-3 text-[#ffb142]" />
              {task.completedPomos || 0} / {task.estimatedPomos || 1} Pomo
            </span>

            {task.dueDate && (
              <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-[#131318] px-2 py-0.5 rounded-md border border-[#2e2e3a]">
                <Calendar className="w-3 h-3 text-[#34ace0]" />
                {task.dueDate}
              </span>
            )}

            {hasSubtasks && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(!expanded);
                }}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-300 hover:text-white bg-white/5 px-2 py-0.5 rounded-md transition"
              >
                <ListChecks className="w-3 h-3 text-[#6c5ce7]" />
                {completedSubtasks}/{task.subtasks.length} Subtugas
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Subtasks Accordion */}
      {hasSubtasks && expanded && (
        <div className="mt-3 pt-3 border-t border-[#2e2e3a] pl-9 space-y-2 animate-fadeIn">
          {task.subtasks.map((sub) => (
            <div
              key={sub.id}
              onClick={() => onToggleSubtask(task.id, sub.id)}
              className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-white cursor-pointer py-1 group/sub"
            >
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                  sub.completed
                    ? 'bg-[#6c5ce7] border-[#6c5ce7] text-white'
                    : 'border-slate-500 group-hover/sub:border-[#6c5ce7] bg-[#131318]'
                }`}
              >
                {sub.completed && <Check className="w-3 h-3 stroke-[3]" />}
              </div>
              <span className={sub.completed ? 'line-through text-slate-500' : ''}>
                {sub.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
