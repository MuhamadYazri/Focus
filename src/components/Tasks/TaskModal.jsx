import React, { useState, useEffect } from 'react';
import { X, Plus, ChevronUp, ChevronDown, Check } from 'lucide-react';

const G = "Geist, 'Helvetica Neue', sans-serif";
const M = "'JetBrains Mono', monospace";

const ACCENTS = ['var(--accent)', 'var(--text-secondary)', '#4A7090', '#6A7090'];

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  projects = [],
  taskToEdit = null,
  defaultProjectId = null,
  onOpenCreateProject = null,
}) {
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [pomoTotal, setPomoTotal] = useState(1);
  const [showTags, setShowTags] = useState(false);
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [scheduleType, setScheduleType] = useState('today');

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

  const [scheduledDate, setScheduledDate] = useState(() => getLocalDateStr());

  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setProjectId(taskToEdit.projectId || (projects[0] ? projects[0].id : ''));
      setPomoTotal(taskToEdit.estimatedPomos || 1);
      setSubtasks(taskToEdit.subtasks || []);
      setScheduleType(taskToEdit.scheduleType || 'today');
      setScheduledDate(taskToEdit.scheduledDate || getLocalDateStr());
    } else {
      setTitle('');
      setProjectId(defaultProjectId || (projects[0] ? projects[0].id : ''));
      setPomoTotal(1);
      setSubtasks([]);
      setScheduleType('today');
      setScheduledDate(getLocalDateStr());
    }
    setNewSubtaskTitle('');
    setShowTags(false);
    setShowSubtasks(false);
    setDragY(0);
    setIsDragging(false);
    setIsClosing(false);
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
      scheduleType: scheduleType,
      scheduledDate: scheduleType === 'date' ? scheduledDate : null,
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

  const handlePointerDown = (e) => {
    try {
      if (e && e.pointerId) e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
    setIsDragging(true);
    setStartY(e.clientY || (e.touches && e.touches[0].clientY) || 0);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const currentY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    const diff = currentY - startY;
    if (diff > 0) {
      setDragY(diff);
    } else {
      setDragY(0);
    }
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    try {
      if (e && e.pointerId) e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
    setIsDragging(false);
    const currentY = (e && e.clientY) || (e && e.changedTouches && e.changedTouches[0].clientY) || 0;
    const diff = currentY - startY;
    if (diff > 100 || dragY > 100) {
      setIsClosing(true);
      setTimeout(() => {
        setIsClosing(false);
        setDragY(0);
        onClose();
      }, 200);
    } else {
      setDragY(0);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-end justify-end select-none transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100 animate-fadeIn'
      }`}
      style={{ background: 'rgba(10, 38, 53, 0.4)' }}
      onClick={onClose}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    >
      <div
        className={`w-full max-w-md mx-auto ${isClosing || isDragging || dragY > 0 ? '' : 'animate-slideUp'}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface-card)',
          borderTop: '1px solid var(--surface-border)',
          borderLeft: '1px solid var(--surface-border)',
          borderRight: '1px solid var(--surface-border)',
          borderRadius: '16px 16px 0 0',
          overflow: 'hidden',
          transform: isClosing ? 'translateY(100%)' : `translateY(${dragY}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3.5 pb-2 cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          style={{ touchAction: 'none' }}
        >
          <div style={{ width: 36, height: 4, borderRadius: 2, background: isDragging ? 'var(--accent)' : 'var(--surface-border)', transition: 'background 0.2s' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3">
          <div>
            <p style={{ fontFamily: M, fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
              Focus
            </p>
            <h3
              style={{
                fontFamily: G,
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--text-on-accent)',
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
              border: '1px solid var(--surface-border)',
              background: 'var(--surface-low)',
            }}
            className="flex items-center justify-center transition-opacity hover:opacity-70 active:opacity-50 text-[var(--text-muted)]"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>

        <div className="px-5 py-3 flex flex-col gap-4 max-h-[75vh] overflow-y-auto">
          {/* Title input */}
          <div>
            <label
              style={{
                fontFamily: M,
                fontSize: 8,
                color: 'var(--text-secondary)',
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
                background: 'var(--surface-low)',
                border: '1px solid var(--surface-border)',
                borderRadius: 8,
                padding: '11px 14px',
                fontFamily: G,
                fontSize: 14,
                color: 'var(--text-on-accent)',
                outline: 'none',
                caretColor: 'var(--accent)',
              }}
            />
          </div>

          {/* Category/Project selector */}
          <div>
            <label
              style={{
                fontFamily: M,
                fontSize: 8,
                color: 'var(--text-secondary)',
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
                background: 'var(--surface-low)',
                border: `1px solid ${showTags ? currentAccent : 'var(--surface-border)'}`,
                borderRadius: 8,
                padding: '10px 14px',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  style={{ width: 8, height: 8, borderRadius: 2, background: currentAccent }}
                />
                <span style={{ fontFamily: G, fontSize: 13, color: 'var(--text-on-accent)' }}>
                  {selectedProject.name.replace(/^[0-9]+\s*(\/\/|·|\.)\s*/, '').replace(/_/g, ' ')}
                </span>
              </div>
              {showTags ? (
                <ChevronUp size={13} color="var(--text-muted)" strokeWidth={1.5} />
              ) : (
                <ChevronDown size={13} color="var(--text-muted)" strokeWidth={1.5} />
              )}
            </button>

            {showTags && (
              <div
                style={{
                  background: 'var(--surface-low)',
                  border: '1px solid var(--surface-border)',
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
                        borderBottom: i < projects.length - 1 ? '1px solid var(--surface-border)' : 'none',
                        background: isSel ? 'rgba(185,218,255,0.04)' : 'transparent',
                      }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: pAccent }} />
                      <span
                        style={{
                          fontFamily: G,
                          fontSize: 13,
                          color: isSel ? 'var(--text-primary)' : 'var(--text-secondary)',
                        }}
                      >
                        {p.name.replace(/^[0-9]+\s*(\/\/|·|\.)\s*/, '').replace(/_/g, ' ')}
                      </span>
                      {isSel && (
                        <span
                          style={{
                            fontFamily: M,
                            fontSize: 10,
                            color: 'var(--accent)',
                            marginLeft: 'auto',
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
                {onOpenCreateProject && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowTags(false);
                      onOpenCreateProject();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 transition hover:opacity-80 text-[var(--accent)] font-semibold text-xs border-t border-[var(--surface-border)]"
                    style={{ fontFamily: G }}
                  >
                    <Plus size={13} /> Create New Category
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Schedule selection */}
          <div>
            <label
              style={{
                fontFamily: M,
                fontSize: 8,
                color: 'var(--text-secondary)',
                letterSpacing: '0.08em',
                display: 'block',
                marginBottom: 8,
              }}
            >
              Schedule
            </label>
            <div className="flex gap-1.5">
              {[
                { id: 'today', label: 'Just Today' },
                { id: 'daily', label: 'Every Day' },
                { id: 'date', label: 'Specific Date' },
              ].map((item) => {
                const isSelected = scheduleType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setScheduleType(item.id)}
                    className="flex-1 transition-all active:scale-95 py-2 px-2 rounded-lg text-center"
                    style={{
                      fontFamily: G,
                      fontSize: 11,
                      fontWeight: isSelected ? 600 : 400,
                      background: isSelected ? 'var(--text-primary)' : 'var(--surface-low)',
                      color: isSelected ? 'var(--surface-low)' : 'var(--text-secondary)',
                      border: isSelected ? 'none' : '1px solid var(--surface-border)',
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            {scheduleType === 'date' && (
              <div className="mt-2">
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-[var(--surface-low)] border border-[var(--surface-border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-xs outline-none focus:border-[var(--accent)]"
                  style={{ fontFamily: M }}
                />
              </div>
            )}
          </div>


          {/* Pomodoro count */}
          <div>
            <label
              style={{
                fontFamily: M,
                fontSize: 8,
                color: 'var(--text-secondary)',
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
                  border: '1px solid var(--surface-border)',
                  background: 'var(--surface-low)',
                }}
                className="flex items-center justify-center text-[var(--text-primary)] transition-opacity active:opacity-50"
                aria-label="Decrease"
              >
                <span
                  style={{
                    fontFamily: G,
                    fontSize: 18,
                    color: 'var(--text-on-accent)',
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
                    color: 'var(--text-on-accent)',
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
                    color: 'var(--text-muted)',
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
                  border: '1px solid var(--surface-border)',
                  background: 'var(--surface-low)',
                }}
                className="flex items-center justify-center transition-opacity active:opacity-50"
                aria-label="Increase"
              >
                <Plus size={16} color="var(--text-primary)" strokeWidth={1.5} />
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
                    background: 'var(--accent)',
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
              style={{ fontFamily: M, fontSize: 8, color: 'var(--text-secondary)', letterSpacing: '0.06em' }}
            >
              <span>SUBTASKS ({subtasks.length})</span>
              {showSubtasks ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {showSubtasks && (
              <div
                className="mt-2 p-2 rounded-lg space-y-2"
                style={{ background: 'var(--surface-low)', border: '1px solid var(--surface-border)' }}
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask(e)}
                    placeholder="Add a subtask..."
                    className="flex-1 bg-transparent text-xs text-[var(--text-primary)] outline-none font-sans px-2 py-1 border border-[var(--surface-border)] rounded"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="px-2 py-1 bg-[var(--surface-low)] text-[var(--text-primary)] text-xs font-mono rounded border border-[var(--surface-border)]"
                  >
                    Add
                  </button>
                </div>
                {subtasks.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between text-xs text-[var(--text-secondary)] py-1 px-2 border-b border-[var(--surface-border)]/50 last:border-none"
                  >
                    <span>{sub.title}</span>
                    <button
                      type="button"
                      onClick={() => setSubtasks(subtasks.filter((s) => s.id !== sub.id))}
                      className="text-[var(--text-muted)] hover:text-[#FF6B6B]"
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
              background: title.trim() ? 'var(--accent)' : '#1A1A1A',
              borderRadius: 8,
              padding: '13px 0',
              border: title.trim() ? 'none' : '1px solid var(--surface-border)',
              marginTop: 4,
            }}
          >
            <Plus size={15} color={title.trim() ? 'var(--text-on-accent)' : 'var(--text-muted)'} strokeWidth={2.5} />
            <span
              style={{
                fontFamily: G,
                fontSize: 14,
                fontWeight: 600,
                color: title.trim() ? 'var(--text-on-accent)' : 'var(--text-muted)',
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
