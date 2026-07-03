import { get, set } from 'idb-keyval';

const STORAGE_KEYS = {
  PROJECTS: 'focus_projects_v1',
  TASKS: 'focus_tasks_v1',
  SESSIONS: 'focus_sessions_v1',
  SETTINGS: 'focus_settings_v1',
  DAILY_GOALS_HISTORY: 'focus_daily_goals_history_v1',
};

export const DEFAULT_PROJECTS = [
  { id: 'proj-1', name: '01 // PERSONAL_APP_DEV', color: '#B9DAFF', icon: 'Code', pomodoros: 24 },
  { id: 'proj-2', name: '02 // CLIENT_WEB_PIPELINE', color: '#8BA0B0', icon: 'Layers', pomodoros: 18 },
  { id: 'proj-3', name: '03 // SYS_ARCHITECTURE', color: '#A1A1AA', icon: 'Database', pomodoros: 32 },
];

export const DEFAULT_TASKS = [
  {
    id: 'task-1',
    title: 'Refactor Auth Backend API',
    projectId: 'proj-1',
    priority: 'P1',
    estimatedPomos: 4,
    completedPomos: 2,
    completed: false,
    dueDate: new Date().toISOString().split('T')[0],
    subtasks: [
      { id: 'sub-1', title: 'Migrate JWT validator to middleware', completed: true },
      { id: 'sub-2', title: 'Implement refresh token rotation', completed: true },
      { id: 'sub-3', title: 'Write integration test suite', completed: false },
    ],
    notes: 'Critical operational pipeline task for auth security.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    title: 'Optimize WebGL Canvas Performance',
    projectId: 'proj-2',
    priority: 'P2',
    estimatedPomos: 2,
    completedPomos: 1,
    completed: false,
    dueDate: new Date().toISOString().split('T')[0],
    subtasks: [
      { id: 'sub-4', title: 'Profile shader execution time in DevTools', completed: true },
      { id: 'sub-5', title: 'Reduce draw calls by batching meshes', completed: false },
    ],
    notes: 'Maintain 60fps telemetry rendering.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    title: 'Review System Data Models',
    projectId: 'proj-3',
    priority: 'P3',
    estimatedPomos: 1,
    completedPomos: 0,
    completed: false,
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    subtasks: [],
    notes: 'Verify indexing and relationship constraints.',
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
  dailyGoalHours: 4.0,
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
    if (settings && settings.dailyGoalHours) {
      this.recordDailyGoalForToday(settings.dailyGoalHours);
    }
  },

  async getDailyGoalsHistory() {
    const defaultHist = {
      '2026-07-03': 4.0,
      '2026-07-02': 4.0,
      '2026-07-01': 4.0,
    };
    try {
      const data = await get(STORAGE_KEYS.DAILY_GOALS_HISTORY);
      return data || getLocal(STORAGE_KEYS.DAILY_GOALS_HISTORY, defaultHist);
    } catch (e) {
      return getLocal(STORAGE_KEYS.DAILY_GOALS_HISTORY, defaultHist);
    }
  },
  async saveDailyGoalsHistory(map) {
    setLocal(STORAGE_KEYS.DAILY_GOALS_HISTORY, map);
    try { await set(STORAGE_KEYS.DAILY_GOALS_HISTORY, map); } catch (e) {}
  },
  async recordDailyGoalForToday(hours) {
    const todayStr = new Date().toISOString().split('T')[0];
    const map = await this.getDailyGoalsHistory();
    map[todayStr] = hours;
    await this.saveDailyGoalsHistory(map);
  },
};
