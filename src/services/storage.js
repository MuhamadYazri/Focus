import { get, set } from 'idb-keyval';

const STORAGE_KEYS = {
  PROJECTS: 'focus_projects_v1',
  TASKS: 'focus_tasks_v1',
  SESSIONS: 'focus_sessions_v1',
  SETTINGS: 'focus_settings_v1',
  DAILY_GOALS_HISTORY: 'focus_daily_goals_history_v1',
};

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

export const DEFAULT_PROJECTS = [
  { id: 'proj-1', name: '01 // STUDY', color: '#B9DAFF', icon: 'BookOpen', pomodoros: 1010 },
  { id: 'proj-2', name: '02 // PERSONAL_APP_DEV', color: '#8BA0B0', icon: 'Code', pomodoros: 18 },
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
  keepAwake: true,
  dailyGoalHours: 4.0,
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
      let data = await get(STORAGE_KEYS.PROJECTS);
      data = data || getLocal(STORAGE_KEYS.PROJECTS, DEFAULT_PROJECTS);
      return data;
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
      let data = await get(STORAGE_KEYS.SESSIONS);
      data = data || getLocal(STORAGE_KEYS.SESSIONS, []);
      return data;
    } catch (e) {
      return getLocal(STORAGE_KEYS.SESSIONS, []);
    }
  },
  async saveSessions(sessions) {
    setLocal(STORAGE_KEYS.SESSIONS, sessions);
    try { await set(STORAGE_KEYS.SESSIONS, sessions); } catch (e) {}
  },

  async getSettings() {
    try {
      let data = await get(STORAGE_KEYS.SETTINGS);
      data = data || getLocal(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
      if (data && data.keepAwake === undefined) {
        data.keepAwake = true;
        await this.saveSettings(data);
      }
      return data;
    } catch (e) {
      const local = getLocal(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
      if (local && local.keepAwake === undefined) local.keepAwake = true;
      return local;
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
    const todayStr = getLocalDateStr();
    const map = await this.getDailyGoalsHistory();
    map[todayStr] = hours;
    await this.saveDailyGoalsHistory(map);
  },

  async exportAllData() {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      projects: await this.getProjects(),
      tasks: await this.getTasks(),
      sessions: await this.getSessions(),
      settings: await this.getSettings(),
      dailyGoalsHistory: await this.getDailyGoalsHistory(),
    };
  },

  async importAllData(data) {
    if (!data || data.version !== 1) throw new Error('Invalid backup format');
    if (data.projects) await this.saveProjects(data.projects);
    if (data.tasks) await this.saveTasks(data.tasks);
    if (data.sessions) await this.saveSessions(data.sessions);
    if (data.settings) await this.saveSettings(data.settings);
    if (data.dailyGoalsHistory) await this.saveDailyGoalsHistory(data.dailyGoalsHistory);
  },
};
