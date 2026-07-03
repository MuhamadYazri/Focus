import { get, set } from 'idb-keyval';

const STORAGE_KEYS = {
  PROJECTS: 'focus_projects_v1',
  TASKS: 'focus_tasks_v1',
  SESSIONS: 'focus_sessions_v1',
  SETTINGS: 'focus_settings_v1',
};

export const DEFAULT_PROJECTS = [
  { id: 'proj-1', name: 'Work & Coding', color: '#ff5252', icon: 'Briefcase', pomodoros: 12 },
  { id: 'proj-2', name: 'Study & Reading', color: '#ffb142', icon: 'BookOpen', pomodoros: 8 },
  { id: 'proj-3', name: 'Personal & Health', color: '#34ace0', icon: 'Heart', pomodoros: 5 },
  { id: 'proj-4', name: 'Side Projects', color: '#6c5ce7', icon: 'Rocket', pomodoros: 15 },
];

export const DEFAULT_TASKS = [
  {
    id: 'task-1',
    title: 'Selesaikan desain UI Android di Figma',
    projectId: 'proj-1',
    priority: 'P1', // P1: Red, P2: Yellow, P3: Blue, NONE
    estimatedPomos: 4,
    completedPomos: 2,
    completed: false,
    dueDate: new Date().toISOString().split('T')[0],
    subtasks: [
      { id: 'sub-1', title: 'Buat wireframe komponen utama', completed: true },
      { id: 'sub-2', title: 'Terapkan INTXXSI dark mode color palette', completed: true },
      { id: 'sub-3', title: 'Siapkan spesifikasi animasi untuk developer', completed: false },
    ],
    notes: 'Prioritas utama minggu ini untuk meluncurkan MVP.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    title: 'Membaca buku Atomic Habits - Bab 10 & 11',
    projectId: 'proj-2',
    priority: 'P2',
    estimatedPomos: 2,
    completedPomos: 1,
    completed: false,
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
    subtasks: [
      { id: 'sub-4', title: 'Baca bab 10: Hukum ke-3 Atur Lingkungan', completed: true },
      { id: 'sub-5', title: 'Baca bab 11: Berjalan perlahan tapi tidak mundur', completed: false },
    ],
    notes: 'Catat poin penting di jurnal.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    title: 'Latihan cardio & stretching 30 menit',
    projectId: 'proj-3',
    priority: 'P3',
    estimatedPomos: 1,
    completedPomos: 1,
    completed: true,
    dueDate: new Date().toISOString().split('T')[0],
    subtasks: [],
    notes: 'Di taman dekat rumah.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'task-4',
    title: 'Implementasi Capacitor SQLite / IDB di App',
    projectId: 'proj-4',
    priority: 'P1',
    estimatedPomos: 5,
    completedPomos: 3,
    completed: false,
    dueDate: new Date().toISOString().split('T')[0],
    subtasks: [
      { id: 'sub-6', title: 'Setup arsitektur idb-keyval modular', completed: true },
      { id: 'sub-7', title: 'Uji sinkronisasi offline di WebView Android', completed: false },
    ],
    notes: 'Pastikan performa 60fps tanpa jeda loading.',
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_SETTINGS = {
  workDuration: 25, // minutes
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4, // every 4 pomodoros
  autoStartBreaks: true,
  autoStartPomodoros: false,
  soundscape: 'rain', // 'none', 'rain', 'forest', 'waves', 'cafe', 'clock'
  soundVolume: 0.6,
  strictMode: false,
};

// Generate sample sessions for 365 days heatmap & statistics
export const generateSampleSessions = () => {
  const sessions = [];
  const now = Date.now();
  const dayMs = 86400000;
  
  for (let i = 0; i < 60; i++) {
    const date = new Date(now - i * dayMs);
    const dateStr = date.toISOString().split('T')[0];
    const count = Math.floor(Math.random() * 8) + (i % 7 === 0 ? 0 : 2); // 2-9 pomos per workday
    
    for (let j = 0; j < count; j++) {
      const projIndex = Math.floor(Math.random() * DEFAULT_PROJECTS.length);
      sessions.push({
        id: `sess-${i}-${j}`,
        projectId: DEFAULT_PROJECTS[projIndex].id,
        duration: 25,
        completedAt: new Date(date.getTime() + j * 3600000).toISOString(),
        dateStr: dateStr,
      });
    }
  }
  return sessions;
};

// Helper for safe localStorage fallback
const getLocal = (key, defaultVal) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
};

const setLocal = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
};

export const storage = {
  async getProjects() {
    try {
      const data = await get(STORAGE_KEYS.PROJECTS);
      return data || getLocal(STORAGE_KEYS.PROJECTS, DEFAULT_PROJECTS);
    } catch (e) {
      return getLocal(STORAGE_KEYS.PROJECTS, DEFAULT_PROJECTS);
    }
  },
  async saveProjects(projects) {
    setLocal(STORAGE_KEYS.PROJECTS, projects);
    try { await set(STORAGE_KEYS.PROJECTS, projects); } catch (e) {}
  },

  async getTasks() {
    try {
      const data = await get(STORAGE_KEYS.TASKS);
      return data || getLocal(STORAGE_KEYS.TASKS, DEFAULT_TASKS);
    } catch (e) {
      return getLocal(STORAGE_KEYS.TASKS, DEFAULT_TASKS);
    }
  },
  async saveTasks(tasks) {
    setLocal(STORAGE_KEYS.TASKS, tasks);
    try { await set(STORAGE_KEYS.TASKS, tasks); } catch (e) {}
  },

  async getSessions() {
    try {
      const data = await get(STORAGE_KEYS.SESSIONS);
      const defaultSess = generateSampleSessions();
      return data || getLocal(STORAGE_KEYS.SESSIONS, defaultSess);
    } catch (e) {
      return getLocal(STORAGE_KEYS.SESSIONS, generateSampleSessions());
    }
  },
  async saveSessions(sessions) {
    setLocal(STORAGE_KEYS.SESSIONS, sessions);
    try { await set(STORAGE_KEYS.SESSIONS, sessions); } catch (e) {}
  },

  async getSettings() {
    try {
      const data = await get(STORAGE_KEYS.SETTINGS);
      return data || getLocal(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    } catch (e) {
      return getLocal(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    }
  },
  async saveSettings(settings) {
    setLocal(STORAGE_KEYS.SETTINGS, settings);
    try { await set(STORAGE_KEYS.SETTINGS, settings); } catch (e) {}
  },
};
