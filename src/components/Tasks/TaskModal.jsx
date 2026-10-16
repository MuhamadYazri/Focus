import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, ChevronUp, ChevronDown, Check, Trash2 } from 'lucide-react';

const toTitleCase = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  onDelete = null,
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
  const [weeklyDays, setWeeklyDays] = useState([]);

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
  const [isClosing, setIsClosing] = useState(false);

  // Direct DOM refs for 120Hz zero-re-render bottom-sheet dragging
  const sheetRef = useRef(null);
  const handlePillRef = useRef(null);
  const dragStateRef = useRef({ isDragging: false, startY: 0, currentY: 0 });

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setProjectId(taskToEdit.projectId || (projects[0] ? projects[0].id : ''));
      setPomoTotal(taskToEdit.estimatedPomos || 1);
      setSubtasks(taskToEdit.subtasks || []);
      setScheduleType(taskToEdit.scheduleType || 'today');
      setScheduledDate(taskToEdit.scheduledDate || getLocalDateStr());
      setWeeklyDays(taskToEdit.weeklyDays || []);
    } else {
      setTitle('');
      setProjectId(defaultProjectId || (projects[0] ? projects[0].id : ''));
      setPomoTotal(1);
      setSubtasks([]);
      setScheduleType('today');
      setScheduledDate(getLocalDateStr());
      setWeeklyDays([]);
    }
    setNewSubtaskTitle('');
    setShowTags(false);
    setShowSubtasks(false);
    setIsClosing(false);
    dragStateRef.current = { isDragging: false, startY: 0, currentY: 0 };
  }, [taskToEdit, isOpen, projects, defaultProjectId]);

  if (!isOpen) return null;

  const currentProjectIndex = projects.findIndex((p) => p.id === projectId);
  const selectedProject =
    currentProjectIndex >= 0 ? projects[currentProjectIndex] : projects[0] || { name: 'Personal App', id: 'default' };

  const handleSubmit = () => {
    if (!title.trim()) return;
    const cleanName = selectedProject.name.replace(/^[0-9]+\s*(\/\/|·|\.)\s*/, '').replace(/_/g, ' ');
    const idNum = selectedProject.id
      ? selectedProject.id.replace('proj-', '0').padStart(2, '0')
      : String(currentProjectIndex + 1).padStart(2, '0');
    
    onSave({
      ...(taskToEdit || {}),
      id: taskToEdit ? taskToEdit.id : `task-${Date.now()}`,
      title: title.trim(),
      projectId: selectedProject.id,
      estimatedPomos: pomoTotal,
      completedPomos: taskToEdit ? taskToEdit.completedPomos : 0,
      completed: taskToEdit ? taskToEdit.completed : false,
      priority: taskToEdit ? taskToEdit.priority : 'NONE',
      accent: selectedProject.color || 'var(--theme-primary)',
      tag: toTitleCase(cleanName),
      index: idNum,
      subtasks: subtasks,
      scheduleType: scheduleType,
      scheduledDate: scheduleType === 'date' ? scheduledDate : null,
      weeklyDays: scheduleType === 'weekly' ? weeklyDays : [],
      createdAt: taskToEdit ? taskToEdit.createdAt : new Date().toISOString(),
    });
    onClose();
  };

  const handleDeleteClick = () => {
    if (!taskToEdit || !onDelete) return;
    if (window.navigator?.vibrate) window.navigator.vibrate(15);
    onDelete(taskToEdit);
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
    const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    dragStateRef.current = { isDragging: true, startY: clientY, currentY: 0 };
    if (sheetRef.current) {
      sheetRef.current.classList.remove('animate-sheet-up');
      sheetRef.current.style.transition = 'none';
    }
    if (handlePillRef.current) {
      handlePillRef.current.classList.remove('bg-border');
      handlePillRef.current.classList.add('bg-secondary');
    }
  };

  const handlePointerMove = (e) => {
    if (!dragStateRef.current.isDragging) return;
    const currentY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    const diff = Math.max(0, currentY - dragStateRef.current.startY);
    dragStateRef.current.currentY = diff;
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translate3d(0, ${diff}px, 0)`;
    }
  };

  const handlePointerUp = (e) => {
    if (!dragStateRef.current.isDragging) return;
    try {
      if (e && e.pointerId) e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
    dragStateRef.current.isDragging = false;
    if (handlePillRef.current) {
      handlePillRef.current.classList.remove('bg-secondary');
      handlePillRef.current.classList.add('bg-border');
    }
    const endY = (e && e.clientY) || (e && e.changedTouches && e.changedTouches[0].clientY) || 0;
    const diff = endY ? endY - dragStateRef.current.startY : dragStateRef.current.currentY;
    if (diff > 100 || dragStateRef.current.currentY > 100) {
      if (sheetRef.current) {
        sheetRef.current.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)';
        sheetRef.current.style.transform = 'translate3d(0, 100%, 0)';
      }
      setIsClosing(true);
      setTimeout(() => {
        setIsClosing(false);
        onClose();
      }, 200);
    } else if (sheetRef.current) {
      sheetRef.current.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)';
      sheetRef.current.style.transform = 'translate3d(0, 0, 0)';
    }
    dragStateRef.current.currentY = 0;
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[70] flex flex-col items-end justify-end select-none transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100 animate-fadeIn'
      }`}
      style={{ background: 'rgba(26, 31, 24, 0.45)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      onClick={onClose}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    >
      <div
        ref={sheetRef}
        className={`w-full max-w-md mx-auto bg-surface rounded-t-3xl overflow-hidden shadow-2xl border-t border-l border-r border-border ring-1 ring-white/60 will-change-transform ${
          isClosing ? '' : 'animate-sheet-up'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: isClosing ? 'translate3d(0, 100%, 0)' : 'translate3d(0, 0, 0)',
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-4 pb-2 cursor-grab active:cursor-grabbing touch-none bg-surface"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          style={{ touchAction: 'none' }}
        >
          <div ref={handlePillRef} className="w-10 h-1.5 rounded-full transition-colors bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-1 pb-4 border-b border-surface-hover">
          <h3 className="font-display text-xl font-bold text-text-main tracking-tight">
            {taskToEdit ? 'Edit task' : 'New task'}
          </h3>
          <div className="flex items-center gap-2">
            {taskToEdit && onDelete && (
              <button
                type="button"
                aria-label="Delete task"
                onClick={handleDeleteClick}
                className="tap-effect p-1.5 rounded-full bg-[#BA1A1A]/10 text-[#BA1A1A] hover:bg-[#BA1A1A]/20 transition-colors"
              >
                <Trash2 size={17} strokeWidth={2.2} />
              </button>
            )}
            <button
              type="button"
              aria-label="Close modal"
              onClick={onClose}
              className="tap-effect p-1.5 rounded-full bg-surface-hover text-text-sub hover:text-text-main hover:bg-border transition-colors"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 flex flex-col gap-6 max-h-[75vh] overflow-y-auto bg-surface">
          {/* Title input */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-text-sub font-mono mb-1.5">
              Task title
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="What needs to be done?"
              className="w-full bg-canvas border border-border rounded-xl px-4 py-3.5 font-sans text-[15px] font-semibold text-text-main placeholder:text-text-sub/50 outline-none focus:border-secondary focus:bg-surface transition-all shadow-inner"
            />
          </div>

          {/* Category/Project selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-text-sub font-mono mb-1.5">
              Category
            </label>
            <button
              type="button"
              onClick={() => setShowTags((v) => !v)}
              className={`w-full flex items-center justify-between bg-surface border ${showTags ? 'border-secondary shadow-sm ring-1 ring-white/60' : 'border-border shadow-2xs ring-1 ring-white/40'} rounded-xl px-4 py-3.5 transition-all`}
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: selectedProject.color || 'var(--theme-primary)' }} />
                <span className="font-sans text-[14px] font-bold text-text-main">
                  {toTitleCase(selectedProject.name.replace(/^[0-9]+\s*(\/\/|·|\.)\s*/, '').replace(/_/g, ' '))}
                </span>
              </div>
              {showTags ? <ChevronUp size={16} className="text-text-main" strokeWidth={2.5} /> : <ChevronDown size={16} className="text-text-sub/50" strokeWidth={2.5} />}
            </button>

            {showTags && (
              <div className="mt-2 bg-surface border border-border rounded-xl overflow-hidden shadow-lg ring-1 ring-white/60 max-h-48 overflow-y-auto">
                {projects.map((p) => {
                  const isSel = p.id === selectedProject.id;
                  const cleanPName = toTitleCase(p.name.replace(/^[0-9]+\s*(\/\/|·|\.)\s*/, '').replace(/_/g, ' '));
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setProjectId(p.id); setShowTags(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-surface-hover last:border-none ${isSel ? 'bg-canvas' : 'hover:bg-surface-hover'}`}
                    >
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: p.color || 'var(--theme-primary)' }} />
                      <span className={`font-sans text-[14px] ${isSel ? 'font-bold text-primary' : 'font-medium text-text-main'}`}>
                        {cleanPName}
                      </span>
                      {isSel && <Check size={16} className="ml-auto text-secondary font-bold" strokeWidth={3} />}
                    </button>
                  );
                })}
                {onOpenCreateProject && (
                  <button
                    type="button"
                    onClick={() => { setShowTags(false); onOpenCreateProject(); }}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-surface-hover text-secondary font-bold text-xs font-sans hover:bg-border transition-colors"
                  >
                    <Plus size={14} strokeWidth={3} /> New Category
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Schedule selection */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-text-sub font-mono mb-1.5">
              Schedule
            </label>
            <div className="flex gap-1.5 p-1 bg-surface-hover rounded-xl border border-border shadow-inner flex-wrap">
              {[
                { id: 'today', label: 'Today' },
                { id: 'daily', label: 'Every Day' },
                { id: 'weekly', label: 'Custom' },
                { id: 'date', label: 'Date' },
              ].map((item) => {
                const isSelected = scheduleType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setScheduleType(item.id)}
                    className={`flex-1 min-w-[70px] transition-all active:scale-95 py-2 px-1 rounded-lg text-center text-xs font-sans ${
                      isSelected ? 'bg-surface font-bold text-primary shadow-xs ring-1 ring-white/80' : 'font-medium text-text-sub hover:text-text-main'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            {scheduleType === 'weekly' && (
              <div className="mt-2 flex gap-1.5 justify-between">
                {[
                  { day: 1, label: 'M' },
                  { day: 2, label: 'T' },
                  { day: 3, label: 'W' },
                  { day: 4, label: 'T' },
                  { day: 5, label: 'F' },
                  { day: 6, label: 'S' },
                  { day: 0, label: 'S' },
                ].map(({ day, label }) => {
                  const isSel = weeklyDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        if (isSel) {
                          setWeeklyDays(weeklyDays.filter(d => d !== day));
                        } else {
                          setWeeklyDays([...weeklyDays, day]);
                        }
                      }}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-sans font-bold transition-all ${
                        isSel ? 'bg-primary text-white shadow-xs ring-1 ring-white/20' : 'bg-surface-hover text-text-sub border border-border shadow-2xs'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
            {scheduleType === 'date' && (
              <div className="mt-2">
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full bg-canvas border border-border rounded-xl px-4 py-3 font-sans text-sm font-semibold text-text-main outline-none focus:border-secondary focus:bg-surface transition-all shadow-inner"
                />
              </div>
            )}
          </div>

          {/* Pomodoros Planned */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-text-sub font-mono mb-1.5">
              Pomodoros planned
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setPomoTotal((v) => Math.max(1, v - 1))}
                className="w-12 h-12 shrink-0 rounded-xl border border-border bg-surface-hover flex items-center justify-center text-primary active:scale-95 transition-all hover:bg-border shadow-xs ring-1 ring-white/60"
              >
                <span className="font-sans text-3xl leading-none font-medium mb-1">−</span>
              </button>
              <div className="flex-1 text-center flex flex-col justify-center h-12">
                <span className="font-display text-3xl text-text-main font-bold tracking-tight leading-none">
                  {pomoTotal}
                </span>
                <span className="font-sans text-[10px] uppercase font-bold tracking-widest text-text-sub mt-1 leading-none">
                  {pomoTotal === 1 ? 'session' : 'sessions'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPomoTotal((v) => Math.min(12, v + 1))}
                className="w-12 h-12 shrink-0 rounded-xl border border-border bg-surface-hover flex items-center justify-center text-primary active:scale-95 transition-all hover:bg-border shadow-xs ring-1 ring-white/60"
              >
                <Plus size={20} strokeWidth={3} />
              </button>
            </div>
            
            <div className="flex gap-1.5 mt-4 h-2 rounded-full overflow-hidden">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-colors ${i < pomoTotal ? 'bg-primary' : 'bg-surface-hover'}`}
                />
              ))}
            </div>
          </div>

          {/* Subtasks Expandable */}
          <div>
            <button
              type="button"
              onClick={() => setShowSubtasks(!showSubtasks)}
              className="flex items-center justify-between w-full py-2 group active:opacity-70 transition-opacity"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-text-sub font-mono group-hover:text-primary transition-colors">
                SUBTASKS ({subtasks.length})
              </span>
              <div className="p-1 rounded-full bg-surface-hover group-hover:bg-border text-text-sub transition-colors">
                {showSubtasks ? <ChevronUp size={14} strokeWidth={3} /> : <ChevronDown size={14} strokeWidth={3} />}
              </div>
            </button>
            {showSubtasks && (
              <div className="mt-2 p-3 rounded-xl bg-canvas border border-border flex flex-col gap-3 shadow-inner">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask(e)}
                    placeholder="Add a subtask..."
                    className="flex-1 bg-surface px-3 py-2.5 border border-border rounded-lg text-sm font-sans font-medium text-text-main placeholder:text-text-sub/50 outline-none focus:border-secondary transition-colors shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="px-4 py-2.5 bg-primary text-white text-xs font-bold font-sans rounded-lg active:scale-95 transition-transform shadow-sm hover:bg-primary-hover"
                  >
                    Add
                  </button>
                </div>
                {subtasks.length > 0 && (
                  <div className="flex flex-col mt-1 bg-surface rounded-lg border border-border shadow-sm overflow-hidden">
                    {subtasks.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between py-2.5 px-3 border-b border-surface-hover last:border-none">
                        <span className="font-sans text-xs font-semibold text-text-main">{sub.title}</span>
                        <button
                          type="button"
                          onClick={() => setSubtasks(subtasks.filter((s) => s.id !== sub.id))}
                          className="text-text-sub/50 hover:text-[#BA1A1A] p-1 transition-colors"
                        >
                          <X size={14} strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Confirm button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!title.trim()}
            className={`w-full flex items-center justify-center gap-2 rounded-full py-3.5 mt-2 transition-all active:scale-[0.98] ${
              title.trim() 
                ? 'bg-primary text-white shadow-md shadow-primary/25 ring-1 ring-white/20 hover:bg-primary-hover' 
                : 'bg-surface-hover text-text-sub/50 border border-border cursor-not-allowed'
            }`}
          >
            {title.trim() && <Plus size={18} strokeWidth={3} />}
            <span className="font-sans text-[15px] font-bold tracking-wide">
              {taskToEdit ? 'Save changes' : 'Create Task'}
            </span>
          </button>

          {/* safe-area spacer */}
          <div className="h-4" />
        </div>
      </div>
    </div>,
    document.body
  );
}
