import React, { useState } from 'react';
import { Plus, Search, CheckSquare, Calendar, Filter, Clock, ArrowUpDown, ChevronRight, Folder } from 'lucide-react';
import TaskItem from './TaskItem';
import { isToday, isTomorrow, parseISO, isThisWeek, isBefore } from 'date-fns';

export default function TaskList({
  tasks,
  projects,
  selectedProjectId,
  onSelectProject,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleComplete,
  onToggleSubtask,
  onStartPomodoro,
}) {
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'TODAY', 'TOMORROW', 'WEEK', 'COMPLETED', 'OVERDUE'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('PRIORITY'); // 'PRIORITY', 'DUE_DATE', 'TITLE'

  // Filter logic
  const filteredTasks = tasks.filter((t) => {
    // Project filter
    if (selectedProjectId && t.projectId !== selectedProjectId) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchNotes = t.notes && t.notes.toLowerCase().includes(q);
      if (!matchTitle && !matchNotes) return false;
    }

    // Tab filters
    if (filterType === 'COMPLETED') return t.completed;
    if (t.completed && filterType !== 'ALL') return false; // Hide completed in other tabs

    if (!t.dueDate) {
      if (filterType === 'TODAY' || filterType === 'TOMORROW' || filterType === 'OVERDUE') return false;
      return true;
    }

    const date = parseISO(t.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filterType === 'TODAY') return isToday(date);
    if (filterType === 'TOMORROW') return isTomorrow(date);
    if (filterType === 'WEEK') return isThisWeek(date, { weekStartsOn: 1 });
    if (filterType === 'OVERDUE') return isBefore(date, today) && !t.completed;

    return true;
  });

  // Sort logic
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'PRIORITY') {
      const order = { P1: 1, P2: 2, P3: 3, NONE: 4 };
      return (order[a.priority] || 4) - (order[b.priority] || 4);
    }
    if (sortBy === 'DUE_DATE') {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    }
    return a.title.localeCompare(b.title);
  });

  const selectedProjectObj = projects.find((p) => p.id === selectedProjectId);

  const smartFilters = [
    { id: 'ALL', label: 'Semua', count: tasks.filter((t) => !t.completed).length },
    {
      id: 'TODAY',
      label: 'Hari Ini',
      count: tasks.filter((t) => !t.completed && t.dueDate && isToday(parseISO(t.dueDate))).length,
      color: 'text-[#ff5252]',
    },
    {
      id: 'TOMORROW',
      label: 'Besok',
      count: tasks.filter((t) => !t.completed && t.dueDate && isTomorrow(parseISO(t.dueDate))).length,
      color: 'text-[#ffb142]',
    },
    {
      id: 'WEEK',
      label: 'Minggu Ini',
      count: tasks.filter((t) => !t.completed && t.dueDate && isThisWeek(parseISO(t.dueDate), { weekStartsOn: 1 })).length,
      color: 'text-[#34ace0]',
    },
    {
      id: 'COMPLETED',
      label: 'Selesai',
      count: tasks.filter((t) => t.completed).length,
      color: 'text-[#2ecc71]',
    },
  ];

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-4 animate-fadeIn">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          {selectedProjectObj ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectProject(null)}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Semua Proyek
              </button>
              <ChevronRight className="w-3 h-3 text-slate-600" />
              <span
                className="text-lg font-black flex items-center gap-1.5"
                style={{ color: selectedProjectObj.color }}
              >
                <Folder className="w-5 h-5 fill-current opacity-20" />
                {selectedProjectObj.name}
              </span>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <CheckSquare className="w-6 h-6 text-[#ff5252]" />
                Daftar Tugas
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola prioritas & mulai sesi Pomodoro
              </p>
            </>
          )}
        </div>

        <button
          onClick={onAddTask}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#ff5252] hover:bg-[#ff3b3b] text-white font-bold text-xs shadow-lg shadow-[#ff5252]/20 transition"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Tugas Baru
        </button>
      </div>

      {/* Smart Filters Horizontal Scroll */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
        {smartFilters.map((f) => {
          const isActive = filterType === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-white/10 border-[#ff5252] text-white shadow-sm scale-105'
                  : 'bg-[#1c1c24] border-[#2e2e3a] text-slate-400 hover:text-white'
              }`}
            >
              <span className={f.color || ''}>{f.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-[#ff5252] text-white font-bold' : 'bg-[#131318] text-slate-400'
                }`}
              >
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Sort Controls */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari tugas atau catatan..."
            className="w-full bg-[#1c1c24] border border-[#2e2e3a] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#ff5252] transition"
          />
        </div>

        <div className="relative flex-shrink-0">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none bg-[#1c1c24] border border-[#2e2e3a] rounded-xl pl-3 pr-8 py-2 text-xs text-slate-300 focus:outline-none focus:border-[#ff5252] cursor-pointer"
          >
            <option value="PRIORITY">Urut: Prioritas</option>
            <option value="DUE_DATE">Urut: Tanggal</option>
            <option value="TITLE">Urut: Nama</option>
          </select>
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Task List Items */}
      <div className="space-y-2.5 pt-1">
        {sortedTasks.length > 0 ? (
          sortedTasks.map((task) => {
            const proj = projects.find((p) => p.id === task.projectId);
            return (
              <TaskItem
                key={task.id}
                task={task}
                project={proj}
                onToggleComplete={onToggleComplete}
                onToggleSubtask={onToggleSubtask}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onStartPomodoro={onStartPomodoro}
              />
            );
          })
        ) : (
          <div className="text-center py-12 bg-[#1c1c24]/50 border border-dashed border-[#2e2e3a] rounded-2xl p-6">
            <CheckSquare className="w-10 h-10 text-slate-600 mx-auto mb-2 opacity-40" />
            <h4 className="text-sm font-bold text-slate-300">Tidak ada tugas ditemukan</h4>
            <p className="text-xs text-slate-500 mt-1">
              {searchQuery
                ? 'Coba gunakan kata kunci pencarian yang lain.'
                : filterType === 'COMPLETED'
                ? 'Belum ada tugas yang selesai. Semangat!'
                : 'Klik tombol "Tugas Baru" untuk menambah kegiatan baru.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
