import React, { useState, useEffect } from 'react';
import { X, Plus, ChevronUp, ChevronDown, Check } from 'lucide-react';

const G = "Geist, 'Helvetica Neue', sans-serif";
const M = "'JetBrains Mono', monospace";

const ACCENTS = ['#B9DAFF', '#8BA0B0', '#4A7090', '#6A7090'];

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  projects = [],
  taskToEdit = null,
  defaultProjectId = null,
}) {
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [pomoTotal, setPomoTotal] = useState(1);
  const [showTags, setShowTags] = useState(false);
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showSubtasks, setShowSubtasks] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setProjectId(taskToEdit.projectId || (projects[0] ? projects[0].id : ''));
      setPomoTotal(taskToEdit.estimatedPomos || 1);
      setSubtasks(taskToEdit.subtasks || []);
    } else {
      setTitle('');
      setProjectId(defaultProjectId || (projects[0] ? projects[0].id : ''));
      setPomoTotal(1);
      setSubtasks([]);
    }
    setNewSubtaskTitle('');
    setShowTags(false);
    setShowSubtasks(false);
  }, [taskToEdit, isOpen, projects, defaultProjectId]);

  if (!isOpen) return null;

  const currentProjectIndex = projects.findIndex((p) => p.id === projectId);
  const selectedProject =
    currentProjectIndex >= 0 ? projects[currentProjectIndex] : projects[0] || { name: 'Personal App', id: 'default' };
  const currentAccent = ACCENTS[(currentProjectIndex >= 0 ? currentProjectIndex : 0) % ACCENTS.length];

  const handleSubmit = () => {
    if (!title.trim()) return;

    const cleanName = selectedProject.name.replace(/^[0-9]+\s*(\/\/|·|\.)\s*/, '').replace(/_/g, ' ');
    const idNum = selectedProject.id
      ? selectedProject.id.replace('proj-', '0').padStart(2, '0')
      : String(currentProjectIndex + 1).padStart(2, '0');
    const tag = cleanName;
    const index = idNum;

    onSave({
      ...(taskToEdit || {}),
      id: taskToEdit ? taskToEdit.id : `task-${Date.now()}`,
      title: title.trim(),
      projectId: selectedProject.id,
      estimatedPomos: pomoTotal,
      completedPomos: taskToEdit ? taskToEdit.completedPomos : 0,
      completed: taskToEdit ? taskToEdit.completed : false,
      priority: taskToEdit ? taskToEdit.priority : 'NONE',
      accent: currentAccent,
      tag: tag,
      index: index,
      subtasks: subtasks,
      createdAt: taskToEdit ? taskToEdit.createdAt : new Date().toISOString(),
    });
    onClose();
  };

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      { id: `sub-${Date.now()}`, title: newSubtaskTitle.trim(), completed: false },
    ]);
    setNewSubtaskTitle('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-end justify-end select-none"
      style={{ background: 'rgba(0,0,0,0.85)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#090A0C',
          borderTop: '1px solid #27272A',
          borderLeft: '1px solid #27272A',
          borderRight: '1px solid #27272A',
          borderRadius: '12px 12px 0 0',
          overflow: 'hidden',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div style={{ width: 32, height: 4, borderRadius: 2, background: '#27272A' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3">
          <div>
            <p style={{ fontFamily: M, fontSize: 8, color: '#3F3F46', letterSpacing: '0.1em' }}>
              Focus
            </p>
            <h3
              style={{
                fontFamily: G,
                fontSize: 16,
                fontWeight: 600,
                color: '#FFFFFF',
                marginTop: 2,
              }}
            >
              {taskToEdit ? 'Edit task' : 'New task'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: '1px solid #27272A',
              background: '#000000',
            }}
            className="flex items-center justify-center transition-opacity active:opacity-50"
          >
            <X size={14} color="#3F3F46" strokeWidth={1.5} />
          </button>
        </div>

        <div className="px-5 py-3 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          {/* Title input */}
          <div>
            <label
              style={{
                fontFamily: M,
                fontSize: 8,
                color: '#A1A1AA',
                letterSpacing: '0.08em',
                display: 'block',
                marginBottom: 8,
              }}
            >
              Task title
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="What needs to be done?"
              style={{
                width: '100%',
                background: '#000000',
                border: '1px solid #27272A',
                borderRadius: 8,
                padding: '11px 14px',
                fontFamily: G,
                fontSize: 14,
                color: '#FFFFFF',
                outline: 'none',
                caretColor: '#B9DAFF',
              }}
            />
          </div>

          {/* Category/Project selector */}
          <div>
            <label
              style={{
                fontFamily: M,
                fontSize: 8,
                color: '#A1A1AA',
                letterSpacing: '0.08em',
                display: 'block',
                marginBottom: 8,
              }}
            >
              Category
            </label>
            <button
              type="button"
              onClick={() => setShowTags((v) => !v)}
              className="w-full flex items-center justify-between transition-opacity active:opacity-70"
              style={{
                background: '#000000',
                border: `1px solid ${showTags ? currentAccent : '#27272A'}`,
                borderRadius: 8,
                padding: '10px 14px',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  style={{ width: 8, height: 8, borderRadius: 2, background: currentAccent }}
                />
                <span style={{ fontFamily: G, fontSize: 13, color: '#FFFFFF' }}>
                  {selectedProject.name.replace(/^[0-9]+\s*(\/\/|·|\.)\s*/, '').replace(/_/g, ' ')}
                </span>
              </div>
              {showTags ? (
                <ChevronUp size={13} color="#3F3F46" strokeWidth={1.5} />
              ) : (
                <ChevronDown size={13} color="#3F3F46" strokeWidth={1.5} />
              )}
            </button>

            {showTags && (
              <div
                style={{
                  background: '#000000',
                  border: '1px solid #27272A',
                  borderRadius: 8,
                  marginTop: 4,
                  overflow: 'hidden',
                  maxHeight: 160,
                  overflowY: 'auto',
                }}
              >
                {projects.map((p, i) => {
                  const isSel = p.id === selectedProject.id;
                  const pAccent = ACCENTS[i % ACCENTS.length];
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setProjectId(p.id);
                        setShowTags(false);
                      }}
                      className="w-full flex items-center gap-2.5 transition-opacity active:opacity-60 text-left"
                      style={{
                        padding: '10px 14px',
                        borderBottom: i < projects.length - 1 ? '1px solid #27272A' : 'none',
                        background: isSel ? 'rgba(185,218,255,0.04)' : 'transparent',
                      }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: pAccent }} />
                      <span
                        style={{
                          fontFamily: G,
                          fontSize: 13,
                          color: isSel ? '#FFFFFF' : '#A1A1AA',
                        }}
                      >
                        {p.name.replace(/^[0-9]+\s*(\/\/|·|\.)\s*/, '').replace(/_/g, ' ')}
                      </span>
                      {isSel && (
                        <span
                          style={{
                            fontFamily: M,
                            fontSize: 10,
                            color: '#B9DAFF',
                            marginLeft: 'auto',
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pomodoro count */}
          <div>
            <label
              style={{
                fontFamily: M,
                fontSize: 8,
                color: '#A1A1AA',
                letterSpacing: '0.08em',
                display: 'block',
                marginBottom: 8,
              }}
            >
              Pomodoros planned
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPomoTotal((v) => Math.max(1, v - 1))}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: '1px solid #27272A',
                  background: '#000000',
                }}
                className="flex items-center justify-center text-white transition-opacity active:opacity-50"
                aria-label="Decrease"
              >
                <span
                  style={{
                    fontFamily: G,
                    fontSize: 18,
                    color: '#FFFFFF',
                    lineHeight: 1,
                  }}
                >
                  −
                </span>
              </button>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <span
                  style={{
                    fontFamily: M,
                    fontSize: 22,
                    color: '#FFFFFF',
                    fontWeight: 700,
                    letterSpacing: '-1px',
                  }}
                >
                  {pomoTotal}
                </span>
                <span
                  style={{
                    fontFamily: M,
                    fontSize: 9,
                    color: '#3F3F46',
                    marginLeft: 6,
                  }}
                >
                  {pomoTotal === 1 ? 'session' : 'sessions'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPomoTotal((v) => Math.min(12, v + 1))}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border: '1px solid #27272A',
                  background: '#000000',
                }}
                className="flex items-center justify-center transition-opacity active:opacity-50"
                aria-label="Increase"
              >
                <Plus size={16} color="#FFFFFF" strokeWidth={1.5} />
              </button>
            </div>
            {/* Pomo pips preview */}
            <div className="flex gap-1.5 mt-3">
              {Array.from({ length: pomoTotal }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 4,
                    flex: 1,
                    borderRadius: 1,
                    background: '#B9DAFF',
                    maxWidth: 32,
                    opacity: 0.3 + 0.7 / pomoTotal,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Subtasks Expandable */}
          <div>
            <button
              type="button"
              onClick={() => setShowSubtasks(!showSubtasks)}
              className="flex items-center justify-between w-full text-left py-1"
              style={{ fontFamily: M, fontSize: 8, color: '#8BA0B0', letterSpacing: '0.06em' }}
            >
              <span>SUBTASKS ({subtasks.length})</span>
              {showSubtasks ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showSubtasks && (
              <div
                className="mt-2 p-2 rounded-lg space-y-2"
                style={{ background: '#000000', border: '1px solid #27272A' }}
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask(e)}
                    placeholder="Add a subtask..."
                    className="flex-1 bg-transparent text-xs text-[#FFFFFF] outline-none font-sans px-2 py-1 border border-[#27272A] rounded"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="px-2 py-1 bg-[#18181B] text-[#FFFFFF] text-xs font-mono rounded border border-[#27272A]"
                  >
                    Add
                  </button>
                </div>
                {subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between text-xs text-[#A1A1AA] py-1 px-2 border-b border-[#27272A]/50 last:border-none"
                  >
                    <span>{sub.title}</span>
                    <button
                      type="button"
                      onClick={() => setSubtasks(subtasks.filter((s) => s.id !== sub.id))}
                      className="text-[#3F3F46] hover:text-[#FF6B6B]"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Confirm button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="w-full flex items-center justify-center gap-2 transition-opacity active:opacity-80"
            style={{
              background: title.trim() ? '#B9DAFF' : '#1A1A1A',
              borderRadius: 8,
              padding: '13px 0',
              border: title.trim() ? 'none' : '1px solid #27272A',
              marginTop: 4,
            }}
          >
            <Plus size={15} color={title.trim() ? '#000000' : '#3F3F46'} strokeWidth={2.5} />
            <span
              style={{
                fontFamily: G,
                fontSize: 14,
                fontWeight: 600,
                color: title.trim() ? '#000000' : '#3F3F46',
              }}
            >
              {taskToEdit ? 'Save changes' : 'Add task'}
            </span>
          </button>

          {/* safe-area spacer */}
          <div style={{ height: 8 }} />
        </div>
      </div>
    </div>
  );
}
