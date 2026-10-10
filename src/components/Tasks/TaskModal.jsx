import React, { useState, useEffect } from 'react';
import { X, Plus, ChevronUp, ChevronDown, Check } from 'lucide-react';

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
    setDragY(0);
    setIsDragging(false);
    setIsClosing(false);
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
      tag: cleanName,
      index: idNum,
      subtasks: subtasks,
      scheduleType: scheduleType,
      scheduledDate: scheduleType === 'date' ? scheduledDate : null,
      weeklyDays: scheduleType === 'weekly' ? weeklyDays : [],
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
    setDragY(diff > 0 ? diff : 0);
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
      style={{ background: 'rgba(25, 29, 21, 0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
      onClick={onClose}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    >
      <div
        className={`w-full max-w-md mx-auto bg-surface rounded-t-3xl overflow-hidden shadow-2xl border-t border-l border-r border-border ${isClosing || isDragging || dragY > 0 ? '' : 'animate-sheet-up'}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: isClosing ? 'translateY(100%)' : `translateY(${dragY}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
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
          <div className={`w-10 h-1.5 rounded-full transition-colors ${isDragging ? 'bg-secondary' : 'bg-border'}`} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-1 pb-4 border-b border-surface-hover">
          <h3 className="font-sans text-xl font-bold text-text-main tracking-tight">
            {taskToEdit ? 'Edit task' : 'New task'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-surface-hover text-text-sub hover:text-text-main hover:bg-border transition-colors"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-6 max-h-[75vh] overflow-y-auto bg-surface">
          {/* Title input */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-sub font-sans mb-1.5">
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
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-sub font-sans mb-1.5">
              Category
            </label>
            <button
              type="button"
              onClick={() => setShowTags((v) => !v)}
              className={`w-full flex items-center justify-between bg-surface border ${showTags ? 'border-secondary shadow-sm' : 'border-border'} rounded-xl px-4 py-3.5 transition-all`}
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: selectedProject.color || 'var(--theme-primary)' }} />
                <span className="font-sans text-[14px] font-bold text-text-main">
                  {selectedProject.name.replace(/^[0-9]+\s*(\/\/|·|\.)\s*/, '').replace(/_/g, ' ')}
                </span>
              </div>
              {showTags ? <ChevronUp size={16} className="text-[#444841]" strokeWidth={2.5} /> : <ChevronDown size={16} className="text-text-sub/50" strokeWidth={2.5} />}
            </button>

            {showTags && (
              <div className="mt-2 bg-surface border border-border rounded-xl overflow-hidden shadow-sm max-h-48 overflow-y-auto">
                {projects.map((p, i) => {
                  const isSel = p.id === selectedProject.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setProjectId(p.id); setShowTags(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-surface-hover last:border-none ${isSel ? 'bg-canvas' : 'hover:bg-surface-hover'}`}
                    >
                      <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: p.color || 'var(--theme-primary)' }} />
                      <span className={`font-sans text-[14px] ${isSel ? 'font-bold text-primary' : 'font-medium text-[#444841]'}`}>
                        {p.name.replace(/^[0-9]+\s*(\/\/|·|\.)\s*/, '').replace(/_/g, ' ')}
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
                    <Plus size={14} strokeWidth={3} /> NEW CATEGORY
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Schedule selection */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-sub font-sans mb-1.5">
              Schedule
            </label>
            <div className="flex gap-1.5 p-1 bg-surface-hover rounded-xl border border-border flex-wrap">
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
                      isSelected ? 'bg-surface font-bold text-primary shadow-sm' : 'font-medium text-text-sub hover:text-text-main'
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
                        isSel ? 'bg-primary text-white shadow-sm' : 'bg-surface-hover text-text-sub border border-border'
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
            <label className="block text-[11px] font-bold uppercase tracking-wider text-text-sub font-sans mb-1.5">
              Pomodoros planned
            </label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setPomoTotal((v) => Math.max(1, v - 1))}
                className="w-12 h-12 shrink-0 rounded-xl border border-border bg-surface-hover flex items-center justify-center text-primary active:scale-95 transition-all hover:bg-border shadow-sm"
              >
                <span className="font-sans text-3xl leading-none font-medium mb-1">−</span>
              </button>
              <div className="flex-1 text-center flex flex-col justify-center h-12">
                <span className="font-sans text-3xl text-text-main font-bold tracking-tight leading-none">
                  {pomoTotal}
                </span>
                <span className="font-sans text-[10px] uppercase font-bold tracking-widest text-text-sub mt-1 leading-none">
                  {pomoTotal === 1 ? 'session' : 'sessions'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPomoTotal((v) => Math.min(12, v + 1))}
                className="w-12 h-12 shrink-0 rounded-xl border border-border bg-surface-hover flex items-center justify-center text-primary active:scale-95 transition-all hover:bg-border shadow-sm"
              >
                <Plus size={20} strokeWidth={3} />
              </button>
            </div>
            
            <div className="flex gap-1.5 mt-4 h-2 rounded-full overflow-hidden">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-colors ${i < pomoTotal ? 'bg-secondary' : 'bg-surface-hover'}`}
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
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-sub font-sans group-hover:text-primary transition-colors">
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
                        <span className="font-sans text-xs font-semibold text-[#444841]">{sub.title}</span>
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
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-4 mt-2 transition-all active:scale-[0.98] ${
              title.trim() 
                ? 'bg-primary text-white shadow-md hover:bg-primary-hover' 
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
    </div>
  );
}
