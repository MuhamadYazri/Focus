import { get, set } from 'idb-keyval';

const STORAGE_KEYS = {
  PROJECTS: 'focus_projects_v1',
  TASKS: 'focus_tasks_v1',
  SESSIONS: 'focus_sessions_v1',
  SETTINGS: 'focus_settings_v1',
  DAILY_GOALS_HISTORY: 'focus_daily_goals_history_v1',
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
  dailyGoalHours: 4.0,
};

// Generate historical study sessions from Focus To-Do data (Nov 2024 - Jul 2026)
// Total Focus Time: 787h 6m (47,226 mins) | 1,010 Pomodoros | 232 Active Days
export const generateSampleSessions = () => {
  const HISTORICAL_MONTHS = [
    // Nov 2024: 87h 28m = 5248m, 22 days, 112 sessions, peak 6.3h (378m)
    { year: 2024, month: 11, totalMins: 5248, days: 22, sessions: 112, peakDay: 15, peakMins: 378 },
    // Dec 2024: 115h 54m = 6954m, 31 days, 149 sessions, peak 6.3h (378m)
    { year: 2024, month: 12, totalMins: 6954, days: 31, sessions: 149, peakDay: 18, peakMins: 378 },
    // Jan 2025: 120h 33m = 7233m, 31 days, 155 sessions, peak 5.8h (348m)
    { year: 2025, month: 1, totalMins: 7233, days: 31, sessions: 155, peakDay: 20, peakMins: 348 },
    // Feb 2025: 37h 30m = 2250m, 10 days, 48 sessions, peak 5.0h (300m)
    { year: 2025, month: 2, totalMins: 2250, days: 10, sessions: 48, peakDay: 12, peakMins: 300 },
    // Mar 2025: 9h 10m = 550m, 4 days (27,28,29,30), 12 sessions, peak 3.3h (198m)
    { year: 2025, month: 3, totalMins: 550, days: 4, sessions: 12, exactDays: [27, 28, 29, 30], peakDay: 30, peakMins: 198 },
    // Apr 2025: 28h 20m = 1700m, 16 days, 36 sessions, peak 5.0h (300m)
    { year: 2025, month: 4, totalMins: 1700, days: 16, sessions: 36, peakDay: 28, peakMins: 300 },
    // May 2025: 84h 04m = 5044m, 26 days, 108 sessions, peak 6.0h (360m)
    { year: 2025, month: 5, totalMins: 5044, days: 26, sessions: 108, peakDay: 31, peakMins: 360 },
    // Jun 2025: 55h 23m = 3323m, 21 days, 71 sessions, peak 5.5h (330m)
    { year: 2025, month: 6, totalMins: 3323, days: 21, sessions: 71, peakDay: 16, peakMins: 330 },
    // Jul 2025: 20h 19m = 1219m, 13 days, 26 sessions, peak 3.3h (198m)
    { year: 2025, month: 7, totalMins: 1219, days: 13, sessions: 26, peakDay: 15, peakMins: 198 },
    // Apr 2026: 26h 27m = 1587m, 10 days, 34 sessions, peak 5.0h (300m)
    { year: 2026, month: 4, totalMins: 1587, days: 10, sessions: 34, peakDay: 20, peakMins: 300 },
    // May 2026: 65h 33m = 3933m, 20 days, 84 sessions, peak 6.9h (414m)
    { year: 2026, month: 5, totalMins: 3933, days: 20, sessions: 84, peakDay: 18, peakMins: 414 },
    // Jun 2026: 130h 35m = 7835m, 27 days, 167 sessions, peak 11.3h (678m on Jun 9)
    { year: 2026, month: 6, totalMins: 7835, days: 27, sessions: 167, peakDay: 9, peakMins: 678 },
    // Jul 2026: 5h 50m = 350m, 1 day (Jul 3), 8 sessions, peak 5.8h (350m on Jul 3)
    { year: 2026, month: 7, totalMins: 350, days: 1, sessions: 8, exactDays: [3], peakDay: 3, peakMins: 350 },
  ];

  const sessions = [];

  HISTORICAL_MONTHS.forEach((config) => {
    const daysInMonth = new Date(config.year, config.month, 0).getDate();
    let activeDays = [];

    if (config.exactDays) {
      activeDays = [...config.exactDays];
    } else if (config.days === daysInMonth) {
      for (let d = 1; d <= daysInMonth; d++) activeDays.push(d);
    } else {
      activeDays.push(config.peakDay);
      const allOther = [];
      for (let d = 1; d <= daysInMonth; d++) {
        if (d !== config.peakDay) allOther.push(d);
      }
      const needed = config.days - 1;
      for (let i = 0; i < needed; i++) {
        const idx = Math.floor((i * allOther.length) / needed);
        if (!activeDays.includes(allOther[idx])) {
          activeDays.push(allOther[idx]);
        }
      }
      activeDays.sort((a, b) => a - b);
    }

    const dayBuckets = activeDays.map((d) => ({
      day: d,
      mins: 0,
      count: 0,
      isPeak: d === config.peakDay,
    }));

    const peakBucket = dayBuckets.find((b) => b.isPeak) || dayBuckets[0];
    peakBucket.mins = config.peakMins;
    peakBucket.count = Math.max(
      1,
      Math.min(
        config.sessions - (activeDays.length - 1),
        Math.round(config.peakMins / 48)
      )
    );

    const otherBuckets = dayBuckets.filter((b) => !b.isPeak);
    if (otherBuckets.length > 0) {
      const remCount = config.sessions - peakBucket.count;
      const actualRemMins = config.totalMins - peakBucket.mins;

      otherBuckets.forEach((b) => (b.count = 1));
      let extraCount = remCount - otherBuckets.length;
      let idx = 0;
      while (extraCount > 0) {
        otherBuckets[idx % otherBuckets.length].count++;
        extraCount--;
        idx++;
      }

      let assignedMins = 0;
      otherBuckets.forEach((b) => {
        b.mins = Math.floor((b.count / remCount) * actualRemMins);
        assignedMins += b.mins;
      });
      let extraMins = actualRemMins - assignedMins;
      idx = 0;
      while (extraMins > 0) {
        otherBuckets[idx % otherBuckets.length].mins++;
        extraMins--;
        idx++;
      }
    }

    dayBuckets.forEach((b) => {
      const baseDur = Math.floor(b.mins / b.count);
      const remDur = b.mins % b.count;
      for (let sIdx = 0; sIdx < b.count; sIdx++) {
        const dur = baseDur + (sIdx < remDur ? 1 : 0);
        const mStr = String(config.month).padStart(2, '0');
        const dStr = String(b.day).padStart(2, '0');
        const hourStr = String(8 + ((sIdx * 2) % 14)).padStart(2, '0');
        const dateStr = `${config.year}-${mStr}-${dStr}`;
        const completedAt = `${dateStr}T${hourStr}:00:00.000Z`;

        sessions.push({
          id: `hist-${config.year}-${mStr}-${dStr}-${sIdx}`,
          projectId: 'proj-1',
          duration: dur,
          completedAt,
          dateStr,
        });
      }
    });
  });

  return sessions.sort((a, b) => (a.completedAt < b.completedAt ? 1 : -1));
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
      if (data && Array.isArray(data) && data.length > 0) {
        let changed = false;
        if (data[0].id === 'proj-1' && (!data[0].name.toLowerCase().includes('study') || data[0].icon !== 'BookOpen' || data[0].pomodoros === 74 || data[0].pomodoros < 1000)) {
          data[0].name = '01 // STUDY';
          data[0].icon = 'BookOpen';
          data[0].pomodoros = 1010;
          changed = true;
        }
        if (changed) await this.saveProjects(data);
      }
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
      const defaultSess = generateSampleSessions();
      data = data || getLocal(STORAGE_KEYS.SESSIONS, defaultSess);
      if (data && Array.isArray(data)) {
        let changed = false;
        // Check if historical data is missing or needs migration
        const hasHist = data.some((s) => s && s.id && String(s.id).startsWith('hist-'));
        if (!hasHist) {
          // Keep only user runtime sessions (exclude old dummy sess-0-0 pattern)
          const runtimeSessions = data.filter((s) => s && s.id && !/^sess-\d+-\d+$/.test(String(s.id)));
          data = [...runtimeSessions, ...defaultSess];
          changed = true;
        } else {
          data = data.map((s) => {
            if (s && s.id && String(s.id).startsWith('sess-') && s.projectId !== 'proj-1') {
              changed = true;
              return { ...s, projectId: 'proj-1' };
            }
            return s;
          });
        }
        if (changed) await this.saveSessions(data);
      }
      return data;
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
