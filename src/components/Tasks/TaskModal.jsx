import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, Clock, AlertCircle, FolderKanban, ListChecks } from 'lucide-react';

export default function TaskModal({ isOpen, onClose, onSave, projects, taskToEdit = null, defaultProjectId = null }) {
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [priority, setPriority] = useState('NONE');
  const [estimatedPomos, setEstimatedPomos] = useState(1);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title || '');
      setProjectId(taskToEdit.projectId || (projects[0] ? projects[0].id : ''));
      setPriority(taskToEdit.priority || 'NONE');
      setEstimatedPomos(taskToEdit.estimatedPomos || 1);
      setDueDate(taskToEdit.dueDate || '');
      setNotes(taskToEdit.notes || '');
      setSubtasks(taskToEdit.subtasks || []);
    } else {
      setTitle('');
      setProjectId(defaultProjectId || (projects[0] ? projects[0].id : ''));
      setPriority('NONE');
      setEstimatedPomos(1);
      setDueDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setSubtasks([]);
    }
    setNewSubtaskTitle('');
  }, [taskToEdit, isOpen, projects, defaultProjectId]);

  if (!isOpen) return null;

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      { id: `sub-${Date.now()}`, title: newSubtaskTitle.trim(), completed: false },
    ]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      id: taskToEdit ? taskToEdit.id : `task-${Date.now()}`,
      title: title.trim(),
      projectId: projectId || (projects[0] ? projects[0].id : ''),
      priority,
      estimatedPomos: Number(estimatedPomos) || 1,
      completedPomos: taskToEdit ? taskToEdit.completedPomos || 0 : 0,
      completed: taskToEdit ? taskToEdit.completed || false : false,
      dueDate,
      notes,
      subtasks,
      createdAt: taskToEdit ? taskToEdit.createdAt : new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-[#1c1c24] border border-[#2e2e3a] rounded-2xl shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto relative">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#2e2e3a] sticky top-0 bg-[#1c1c24] z-10">
          <h3 className="text-lg font-bold flex items-center gap-2">
            {taskToEdit ? 'Edit Tugas' : 'Buat Tugas Baru'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Nama Tugas <span className="text-[#ff5252]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Apa yang ingin Anda kerjakan?"
              className="w-full bg-[#131318] border border-[#2e2e3a] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff5252] transition font-medium"
            />
          </div>

          {/* Project & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <FolderKanban className="w-3.5 h-3.5 text-[#ff5252]" />
                Proyek
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-[#131318] border border-[#2e2e3a] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff5252] transition"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-[#ffb142]" />
                Prioritas
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'P1', label: 'P1', color: 'bg-[#ff5252] text-white' },
                  { id: 'P2', label: 'P2', color: 'bg-[#ffb142] text-black' },
                  { id: 'P3', label: 'P3', color: 'bg-[#34ace0] text-white' },
                  { id: 'NONE', label: '---', color: 'bg-[#2e2e3a] text-slate-300' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPriority(item.id)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      priority === item.id
                        ? `${item.color} border-white/40 scale-105 shadow-md`
                        : 'bg-[#131318] border-[#2e2e3a] text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pomodoros & Due Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#ffb142]" />
                Estimasi Pomodoro (25m)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEstimatedPomos(Math.max(1, estimatedPomos - 1))}
                  className="w-10 h-10 rounded-xl bg-[#131318] border border-[#2e2e3a] font-bold text-lg hover:border-[#ff5252] transition"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={estimatedPomos}
                  onChange={(e) => setEstimatedPomos(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full text-center bg-[#131318] border border-[#2e2e3a] rounded-xl py-2 font-bold text-base text-white focus:outline-none focus:border-[#ff5252]"
                />
                <button
                  type="button"
                  onClick={() => setEstimatedPomos(estimatedPomos + 1)}
                  className="w-10 h-10 rounded-xl bg-[#131318] border border-[#2e2e3a] font-bold text-lg hover:border-[#ff5252] transition"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#34ace0]" />
                Tanggal Jatuh Tempo
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[#131318] border border-[#2e2e3a] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff5252] transition"
              />
            </div>
          </div>

          {/* Subtasks (Checklist) Section */}
          <div className="bg-[#131318] border border-[#2e2e3a] rounded-2xl p-4 space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ListChecks className="w-4 h-4 text-[#6c5ce7]" />
                Sub-tugas (Checklist)
              </span>
              <span className="text-slate-500 font-normal">{subtasks.length} item</span>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Tambahkan sub-tugas baru..."
                className="flex-1 bg-[#1c1c24] border border-[#2e2e3a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6c5ce7] transition"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask(e);
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-2 rounded-xl bg-[#6c5ce7] hover:bg-[#5b4bc4] text-white text-xs font-bold transition flex items-center gap-1"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Tambah
              </button>
            </div>

            {subtasks.length > 0 ? (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {subtasks.map((sub, idx) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between gap-2 bg-[#1c1c24] border border-[#2e2e3a] px-3 py-2 rounded-xl text-xs"
                  >
                    <span className="truncate flex-1 text-slate-300">
                      <span className="text-slate-500 mr-2">{idx + 1}.</span>
                      {sub.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(sub.id)}
                      className="p-1 text-slate-400 hover:text-[#ff5252] transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 text-center py-2 italic">
                Belum ada sub-tugas. Pecah tugas besar menjadi langkah-langkah kecil!
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Catatan / Detail
            </label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan khusus untuk tugas ini..."
              className="w-full bg-[#131318] border border-[#2e2e3a] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#ff5252] transition resize-none"
            />
          </div>

          {/* Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2e2e3a] sticky bottom-0 bg-[#1c1c24] py-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#ff5252] hover:bg-[#ff3b3b] text-white shadow-lg shadow-[#ff5252]/20 transition"
            >
              Simpan Tugas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
