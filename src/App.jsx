import React, { useState, useEffect, useRef, useCallback, startTransition } from 'react';
import BottomNav from './components/Navigation/BottomNav';
import TaskList from './components/Tasks/TaskList';
import TaskModal from './components/Tasks/TaskModal';
import ProjectModal from './components/Projects/ProjectModal';
import TimerView from './components/Timer/TimerView';
import StrictModeModal from './components/Timer/StrictModeModal';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import ProfileView from './components/Profile/ProfileView';
import { storage, DEFAULT_PROJECTS, DEFAULT_TASKS, DEFAULT_SETTINGS } from './services/storage';
import { soundEngine } from './services/soundEngine';
import { StatusBar } from '@capacitor/status-bar';
import { KeepAwake } from '@capacitor-community/keep-awake';
import clockTickingLottie from './assets/clockTicking.lottie';
import { ForegroundService } from '@capawesome-team/capacitor-android-foreground-service';
import { Haptics } from '@capacitor/haptics';
import { App as CapApp } from '@capacitor/app';
import { timerWorker } from './services/timerWorker';
import SplitRevealPreloader from './components/animata/preloader/SplitRevealPreloader';
import UndoToast from './components/Feedback/UndoToast';
import SessionCompletionScreen from './components/Feedback/SessionCompletionScreen';

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

function processDailyRollover(tasksList) {
  if (!tasksList || !tasksList.length) return tasksList;
  const todayStr = getLocalDateStr();
  const currentDayOfWeek = new Date().getDay(); // 0 is Sun, 1 is Mon...
  
  return tasksList.map((task) => {
    const compDate = task.completedDateStr || (typeof task.completedAt === 'string' ? task.completedAt.split('T')[0] : null);
    
    let shouldRollover = false;
    if (task.scheduleType === 'daily') {
      shouldRollover = true;
    } else if (task.scheduleType === 'weekly' && Array.isArray(task.weeklyDays) && task.weeklyDays.includes(currentDayOfWeek)) {
      shouldRollover = true;
    }

    if (task && shouldRollover && task.completed && compDate && compDate !== todayStr) {
      return { ...task, completed: false, completedPomos: 0, completedDateStr: null, completedAt: null };
    }
    return task;
  });
}

export default function App() {
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const initialTab = urlParams?.get('tab') || 'home';
  const skipPreloader = urlParams?.has('no_preloader') || false;

  // Navigation State: 4 monochrome tabs: 'home', 'timer', 'reports', 'profile'
  const [navTab, setNavTab] = useState(initialTab); // Instant tab indicator state (<16ms INP)
  const [activeTab, setActiveTab] = useState(initialTab); // Screen content state (deferred via startTransition)
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // Data State
  const [projects, setProjects] = useState(DEFAULT_PROJECTS);
  const [tasks, setTasks] = useState(() => processDailyRollover(DEFAULT_TASKS));
  const [sessions, setSessions] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPreloader, setShowPreloader] = useState(!skipPreloader);
  const handleFinishPreloader = useCallback(() => {
    setShowPreloader(false);
  }, []);

  // Shared Analytics & Profile Timeframe State
  const [activityPeriod, setActivityPeriod] = useState('Daily');
  const [activityOffset, setActivityOffset] = useState(0);

  // Timer State
  const [timerMode, setTimerMode] = useState('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [activeTask, setActiveTask] = useState(null);
  const [currentSound, setCurrentSound] = useState('none');

  // Queue of full-width lottie modals (session done, break done, daily goal)
  const [celebrations, setCelebrations] = useState([]);
  const celebrationIdRef = useRef(0);

  const enqueueCelebration = useCallback((item) => {
    celebrationIdRef.current += 1;
    const id = celebrationIdRef.current;
    setCelebrations((q) => [...q, { ...item, id }]);
  }, []);

  const dismissCelebration = useCallback((id) => {
    setCelebrations((q) => q.filter((c) => c.id !== id));
  }, []);

  const triggerCelebration = useCallback(
    (title, subtitle) => {
      enqueueCelebration({ title, subtitle });
      if (window.navigator?.vibrate) window.navigator.vibrate([15, 40, 15, 40, 30]);
    },
    [enqueueCelebration]
  );

  // Dedicated Celebration Actions
  const handleCelebrationPrimaryAction = useCallback((celebration) => {
    dismissCelebration(celebration.id);
    if (!celebration) return;

    if (celebration.type === 'work') {
      // Focus ended -> go to break
      const isLong = (cycleCount > 0 && cycleCount % (settings.longBreakInterval || 4) === 0);
      const nextMode = isLong ? 'longBreak' : 'shortBreak';
      const nextSecs = (isLong ? settings.longBreakDuration : settings.shortBreakDuration) * 60;
      setTimerMode(nextMode);
      timerModeRef.current = nextMode;
      setTimeLeft(nextSecs);
      timeLeftRef.current = nextSecs;
      setIsRunning(true);
      isRunningRef.current = true;
    } else if (celebration.type === 'break') {
      // Break ended -> go to focus
      const nextSecs = (settings.workDuration || 25) * 60;
      setTimerMode('work');
      timerModeRef.current = 'work';
      setTimeLeft(nextSecs);
      timeLeftRef.current = nextSecs;
      setIsRunning(true);
      isRunningRef.current = true;
    }
  }, [dismissCelebration, cycleCount, settings]);

  const [isNavHidden, setIsNavHidden] = useState(false);

  // Modals State
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [strictModalOpen, setStrictModalOpen] = useState(false);

  // UX feedback state
  const [toast, setToast] = useState(null);
  const [justCompletedId, setJustCompletedId] = useState(null);

  const timerRef = useRef(null);
  const lastTickRef = useRef(null);

  // Synchronized state references for unthrottled background execution
  const timerModeRef = useRef(timerMode);
  timerModeRef.current = timerMode;

  const timeLeftRef = useRef(timeLeft);
  timeLeftRef.current = timeLeft;

  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;

  const cycleCountRef = useRef(cycleCount);
  cycleCountRef.current = cycleCount;

  const activeTaskRef = useRef(activeTask);
  activeTaskRef.current = activeTask;

  const projectsRef = useRef(projects);
  projectsRef.current = projects;

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Swipe gesture refs
  const touchStart = useRef({ x: null, y: null });
  const touchEnd = useRef({ x: null, y: null });

  const TAB_ORDER = { home: 0, timer: 1, reports: 2, profile: 3 };

  const handleTabSwitch = (newTab) => {
    if (newTab === navTab) return;
    // 1. Immediate UI update for the bottom dock indicator (Paint occurs in <16ms, INP < 60ms)
    setNavTab(newTab);

    // 2. React 19 startTransition yields main thread to browser paint before mounting incoming screen
    startTransition(() => {
      setActiveTab(newTab);
    });
  };

  // Load initial data from IDB/localStorage
  useEffect(() => {
    async function loadAll() {
      const p = await storage.getProjects();
      const t = await storage.getTasks();
      const s = await storage.getSessions();
      const set = await storage.getSettings();
      setProjects(p || DEFAULT_PROJECTS);
      setTasks(processDailyRollover(t || DEFAULT_TASKS));
      setSessions(s || []);
      const loadedSettings = set || DEFAULT_SETTINGS;
      setSettings(loadedSettings);
      
      document.documentElement.setAttribute('data-theme', 'japandi');
      setTimeLeft((loadedSettings.workDuration) * 60);
      setCurrentSound(set ? set.soundscape : 'none');
      try {
        await StatusBar.hide();
      } catch (e) {
        // Ignored on non-native environments
      }
      setIsLoaded(true);
    }
    loadAll();
  }, []);

  // Save changes to storage
  useEffect(() => {
    if (isLoaded) storage.saveProjects(projects);
  }, [projects, isLoaded]);

  useEffect(() => {
    if (isLoaded) storage.saveTasks(tasks);
  }, [tasks, isLoaded]);

  useEffect(() => {
    if (isLoaded) storage.saveSessions(sessions);
  }, [sessions, isLoaded]);

  const prevDurationsRef = useRef({
    workDuration: DEFAULT_SETTINGS.workDuration,
    shortBreakDuration: DEFAULT_SETTINGS.shortBreakDuration,
    longBreakDuration: DEFAULT_SETTINGS.longBreakDuration,
  });

  useEffect(() => {
    if (isLoaded) {
      storage.saveSettings(settings);
      document.documentElement.setAttribute('data-theme', 'japandi');
      const prevDurations = prevDurationsRef.current;
      const durationsChanged =
        prevDurations.workDuration !== settings.workDuration ||
        prevDurations.shortBreakDuration !== settings.shortBreakDuration ||
        prevDurations.longBreakDuration !== settings.longBreakDuration;

      if (!isRunning && durationsChanged) {
        if (timerMode === 'work') {
          setTimeLeft(settings.workDuration * 60);
        } else if (timerMode === 'shortBreak') {
          setTimeLeft(settings.shortBreakDuration * 60);
        } else if (timerMode === 'longBreak') {
          setTimeLeft(settings.longBreakDuration * 60);
        }
      }
      prevDurationsRef.current = {
        workDuration: settings.workDuration,
        shortBreakDuration: settings.shortBreakDuration,
        longBreakDuration: settings.longBreakDuration,
      };
    }
  }, [settings, isLoaded, isRunning, timerMode]);

  // Strict Mode Distraction Shield
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRunning && settings.strictMode && timerMode === 'work') {
        setIsRunning(false);
        if (timerRef.current) clearInterval(timerRef.current);
        soundEngine.stop();
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate([200, 100, 200, 100, 200]);
        }
        setStrictModalOpen(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRunning, settings.strictMode, timerMode]);

  // Keep Screen Awake during Active Session
  useEffect(() => {
    const manageWakeLock = async () => {
      if (isRunning && settings.keepAwake) {
        try {
          await KeepAwake.keepAwake();
        } catch (e) {
          try {
            if ('wakeLock' in navigator && !window._wakeLockSentinel) {
              window._wakeLockSentinel = await navigator.wakeLock.request('screen');
            }
          } catch (err) { }
        }
      } else {
        try {
          await KeepAwake.allowSleep();
        } catch (e) { }
        try {
          if (window._wakeLockSentinel) {
            await window._wakeLockSentinel.release();
            window._wakeLockSentinel = null;
          }
        } catch (err) { }
      }
    };
    manageWakeLock();
    return () => {
      try { KeepAwake.allowSleep(); } catch (e) { }
      try {
        if (window._wakeLockSentinel) {
          window._wakeLockSentinel.release();
          window._wakeLockSentinel = null;
        }
      } catch (err) { }
    };
  }, [isRunning, settings.keepAwake]);

  const updateNotification = useCallback((mode, seconds, currentSettings, running = true) => {
    if (!currentSettings || currentSettings.liveNotification === false) return;
    if (!running) {
      ForegroundService.stopForegroundService().catch(() => {});
      return;
    }
    const mins = Math.floor(seconds / 60);
    const rem = seconds % 60;
    const formattedTime = `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
    const modeLabel = mode === 'work' ? 'Focus' : (mode === 'shortBreak' ? 'Short Break' : (mode === 'stopwatch' ? 'Focus' : 'Long Break'));
    const prefix = mode === 'stopwatch' ? 'CHRONO_UP:' : 'CHRONO:';
    ForegroundService.updateForegroundService({
      id: 1993,
      title: modeLabel,
      body: `${prefix}${formattedTime}`,
      smallIcon: 'ic_stat_focus_text',
      silent: true,
      serviceType: 1073741824 // FOREGROUND_SERVICE_TYPE_SPECIAL_USE
    }).catch(() => {});
  }, []);

  // Manage Live Notification (Origin Island Foreground Service)
  useEffect(() => {
    const manageForegroundService = async () => {
      if (isRunning && settings.liveNotification !== false) {
        try {
          // Android 13+ requires explicit permission for notifications
          if (ForegroundService.requestPermissions) {
            await ForegroundService.requestPermissions();
          }

          const curMode = timerModeRef.current;
          const curTime = timeLeftRef.current;
          const modeLabel = curMode === 'work' ? 'Focus' : (curMode === 'shortBreak' ? 'Short Break' : (curMode === 'stopwatch' ? 'Focus' : 'Long Break'));
          const mins = Math.floor(curTime / 60);
          const rem = curTime % 60;
          const formattedTime = `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
          
          const prefix = curMode === 'stopwatch' ? 'CHRONO_UP:' : 'CHRONO:';
          await ForegroundService.startForegroundService({
            id: 1993,
            title: modeLabel,
            body: `${prefix}${formattedTime}`,
            smallIcon: 'ic_stat_focus_text',
            serviceType: 1073741824 // FOREGROUND_SERVICE_TYPE_SPECIAL_USE
          });
        } catch (e) {
          console.log('ForegroundService start error:', e);
        }
      } else {
        try {
          await ForegroundService.stopForegroundService();
        } catch (e) { }
      }
    };
    manageForegroundService();
  }, [isRunning, settings.liveNotification]);

  // Auto hide/show bottom nav when timer starts or stops
  useEffect(() => {
    if (isRunning) {
      setIsNavHidden(true);
    } else {
      setIsNavHidden(false);
    }
  }, [isRunning]);

  // Advance timer state and simulate background cycle transitions
  const advanceTime = useCallback((deltaSecs) => {
    if (deltaSecs <= 0) return;

    let remainingDelta = deltaSecs;
    let curMode = timerModeRef.current;
    let curTimeLeft = timeLeftRef.current;
    let curRunning = isRunningRef.current;
    let curCycles = cycleCountRef.current;
    const curSettings = settingsRef.current;
    const curTask = activeTaskRef.current;
    const curProjects = projectsRef.current;

    if (!curRunning) return;

    if (curMode === 'stopwatch') {
      const nextTime = curTimeLeft + remainingDelta;
      timeLeftRef.current = nextTime;
      setTimeLeft(nextTime);
      updateNotification(curMode, nextTime, curSettings, true);
      return;
    }

    const sessionsToAdd = [];
    let pomosEarned = 0;
    const celebrationsToEnqueue = [];

    while (remainingDelta > 0 && curRunning) {
      if (remainingDelta < curTimeLeft) {
        curTimeLeft -= remainingDelta;
        remainingDelta = 0;
      } else {
        // Current cycle completed!
        remainingDelta -= curTimeLeft;

        if (curMode === 'work') {
          pomosEarned += 1;
          curCycles += 1;

          const newSess = {
            id: `sess-${Date.now()}-${sessionsToAdd.length}`,
            projectId: curTask ? curTask.projectId : (curProjects[0] ? curProjects[0].id : 'proj-1'),
            duration: curSettings.workDuration,
            completedAt: new Date().toISOString(),
            dateStr: getLocalDateStr(),
          };
          sessionsToAdd.push(newSess);

          celebrationsToEnqueue.push({
            type: 'work',
            title: `Session ${curCycles} Completed`,
            subtitle: 'Great focus! Enjoy a moment of calm.',
            duration: curSettings.workDuration || 25,
            autoStarted: !!curSettings.autoStartBreaks,
            lottie: clockTickingLottie,
          });

          const isLong = curCycles % (curSettings.longBreakInterval || 4) === 0;
          curMode = isLong ? 'longBreak' : 'shortBreak';
          curTimeLeft = (isLong ? curSettings.longBreakDuration : curSettings.shortBreakDuration) * 60;

          if (!curSettings.autoStartBreaks) {
            curRunning = false;
            remainingDelta = 0;
          }
        } else {
          // Break completed!
          celebrationsToEnqueue.push({
            type: 'break',
            title: 'Break Completed',
            subtitle: 'Refreshed? Ready to focus again?',
            duration: (curMode === 'longBreak' ? curSettings.longBreakDuration : curSettings.shortBreakDuration) || 5,
            autoStarted: !!curSettings.autoStartPomodoros,
            lottie: clockTickingLottie,
          });

          curMode = 'work';
          curTimeLeft = (curSettings.workDuration || 25) * 60;

          if (!curSettings.autoStartPomodoros) {
            curRunning = false;
            remainingDelta = 0;
          }
        }
      }
    }

    if (sessionsToAdd.length > 0) {
      setSessions((prev) => [...sessionsToAdd, ...prev]);

      const primaryProjId = sessionsToAdd[0].projectId;
      setProjects((prev) =>
        prev.map((p) =>
          p.id === primaryProjId ? { ...p, pomodoros: (p.pomodoros || 0) + pomosEarned } : p
        )
      );

      if (curTask) {
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === curTask.id) {
              const updatedPomos = (t.completedPomos || 0) + pomosEarned;
              const isDone = updatedPomos >= t.estimatedPomos;
              const todayStr = getLocalDateStr();
              return {
                ...t,
                completedPomos: updatedPomos,
                completed: isDone,
                completedDateStr: isDone ? todayStr : t.completedDateStr,
                completedAt: isDone ? new Date().toISOString() : t.completedAt,
              };
            }
            return t;
          })
        );
        setActiveTask((prev) =>
          prev ? { ...prev, completedPomos: (prev.completedPomos || 0) + pomosEarned } : null
        );
      }
    }

    if (celebrationsToEnqueue.length > 0) {
      soundEngine.stop();
      soundEngine.playChime();
      if (window.navigator?.vibrate) {
        window.navigator.vibrate([100, 50, 100, 50, 200]);
      }
      try {
        Haptics.vibrate({ duration: 500 }).catch(() => {});
      } catch (e) {}

      celebrationsToEnqueue.forEach((c) => enqueueCelebration(c));
    }

    timeLeftRef.current = curTimeLeft;
    setTimeLeft(curTimeLeft);

    if (curMode !== timerModeRef.current) {
      timerModeRef.current = curMode;
      setTimerMode(curMode);
    }

    if (curCycles !== cycleCountRef.current) {
      cycleCountRef.current = curCycles;
      setCycleCount(curCycles);
    }

    if (curRunning !== isRunningRef.current) {
      isRunningRef.current = curRunning;
      setIsRunning(curRunning);
      if (!curRunning) {
        setIsNavHidden(false);
      }
    }

    updateNotification(curMode, curTimeLeft, curSettings, curRunning);
  }, [enqueueCelebration, updateNotification]);

  // Tick listener callback
  const handleTick = useCallback(() => {
    if (!isRunningRef.current) return;
    const now = Date.now();
    if (!lastTickRef.current) {
      lastTickRef.current = now;
      return;
    }
    const deltaSecs = Math.floor((now - lastTickRef.current) / 1000);
    if (deltaSecs >= 1) {
      lastTickRef.current += deltaSecs * 1000;
      advanceTime(deltaSecs);
    }
  }, [advanceTime]);

  // Manage unthrottled timer execution (Dedicated Web Worker + Fallback)
  useEffect(() => {
    if (isRunning) {
      lastTickRef.current = Date.now();
      timerWorker.start(handleTick);
    } else {
      timerWorker.stop();
      lastTickRef.current = null;
    }
    return () => {
      timerWorker.stop();
    };
  }, [isRunning, handleTick]);

  // Immediate catch-up when returning to foreground / unlocking screen / app resume
  useEffect(() => {
    const handleSync = () => {
      if (isRunningRef.current && lastTickRef.current) {
        const now = Date.now();
        const deltaSecs = Math.floor((now - lastTickRef.current) / 1000);
        if (deltaSecs >= 1) {
          lastTickRef.current += deltaSecs * 1000;
          advanceTime(deltaSecs);
        }
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleSync();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    let appStateHandle = null;
    try {
      CapApp.addListener('appStateChange', (state) => {
        if (state.isActive) {
          handleSync();
        }
      }).then((handle) => {
        appStateHandle = handle;
      }).catch(() => {});
    } catch (e) {}

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (appStateHandle && typeof appStateHandle.remove === 'function') {
        appStateHandle.remove();
      }
    };
  }, [advanceTime]);

  const saveFocusProgress = (elapsedSecs) => {
    if (elapsedSecs < 30) return;
    const elapsedMins = Math.round(elapsedSecs / 60);
    const savedDuration = Math.max(1, elapsedMins);
    const newSess = {
      id: `sess-${Date.now()}`,
      projectId: activeTask ? activeTask.projectId : (projects[0] ? projects[0].id : 'proj-1'),
      duration: savedDuration,
      completedAt: new Date().toISOString(),
      dateStr: getLocalDateStr(),
    };
    setSessions((prev) => [newSess, ...prev]);

    setProjects((prev) =>
      prev.map((p) =>
        p.id === newSess.projectId ? { ...p, pomodoros: (p.pomodoros || 0) + 1 } : p
      )
    );

    if (activeTask) {
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === activeTask.id) {
            const updatedPomos = (t.completedPomos || 0) + 1;
            const isDone = updatedPomos >= t.estimatedPomos;
            const todayStr = getLocalDateStr();
            return {
              ...t,
              completedPomos: updatedPomos,
              completed: isDone,
              completedDateStr: isDone ? todayStr : t.completedDateStr,
              completedAt: isDone ? new Date().toISOString() : t.completedAt,
            };
          }
          return t;
        })
      );
      setActiveTask((prev) =>
        prev ? { ...prev, completedPomos: (prev.completedPomos || 0) + 1 } : null
      );
    }
  };

  const handleTogglePlay = (targetMode) => {
    const effectiveMode = targetMode || timerMode;

    // If starting a different mode than the one currently running
    if (isRunning && targetMode && targetMode !== timerMode) {
      // If we were running a focus timer and are now starting a break timer: save focus progress
      if (timerMode === 'work') {
        const totalSecs = settings.workDuration * 60;
        const elapsedSecs = Math.max(0, totalSecs - timeLeft);
        saveFocusProgress(elapsedSecs);
        setCycleCount((prev) => prev + 1);
      }
      // Set new mode time
      let newDurationSecs = settings.workDuration * 60;
      if (effectiveMode === 'shortBreak') newDurationSecs = settings.shortBreakDuration * 60;
      else if (effectiveMode === 'longBreak') newDurationSecs = settings.longBreakDuration * 60;
      else if (effectiveMode === 'stopwatch') newDurationSecs = 0;

      setTimerMode(effectiveMode);
      setTimeLeft(newDurationSecs);
      setIsRunning(true);
      if (currentSound !== 'none') soundEngine.play(currentSound, settings.soundVolume);
      return;
    }

    // Normal play/pause toggle for current mode
    if (!isRunning && currentSound !== 'none') {
      soundEngine.play(currentSound, settings.soundVolume);
    } else if (isRunning) {
      soundEngine.stop();
    }
    setIsRunning(!isRunning);
  };

  const handleSelectMode = (mode) => {
    // If not running, change mode immediately
    if (!isRunning) {
      setIsNavHidden(false);
      soundEngine.stop();
      setTimerMode(mode);
      if (mode === 'work') setTimeLeft(settings.workDuration * 60);
      else if (mode === 'shortBreak') setTimeLeft(settings.shortBreakDuration * 60);
      else if (mode === 'longBreak') setTimeLeft(settings.longBreakDuration * 60);
      else if (mode === 'stopwatch') setTimeLeft(0);
    }
    // When timer is running, TimerView maintains a preview tab so accidental clicks do not interrupt the session
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    isRunningRef.current = false;
    setIsNavHidden(false);
    soundEngine.stop();
    ForegroundService.stopForegroundService().catch(() => {});
    let resetSecs = 0;
    if (timerMode === 'work') resetSecs = settings.workDuration * 60;
    else if (timerMode === 'shortBreak') resetSecs = settings.shortBreakDuration * 60;
    else if (timerMode === 'longBreak') resetSecs = settings.longBreakDuration * 60;
    else if (timerMode === 'stopwatch') resetSecs = 0;
    setTimeLeft(resetSecs);
    timeLeftRef.current = resetSecs;
  };

  const handleSkip = () => {
    soundEngine.stop();

    if (timerMode === 'work') {
      const totalSecs = settings.workDuration * 60;
      const elapsedSecs = Math.max(0, totalSecs - timeLeft);
      saveFocusProgress(elapsedSecs);

      const nextCycle = cycleCount + 1;
      setCycleCount(nextCycle);
      cycleCountRef.current = nextCycle;

      const isLong = nextCycle % (settings.longBreakInterval || 4) === 0;
      const nextMode = isLong ? 'longBreak' : 'shortBreak';
      const nextDuration = (isLong ? settings.longBreakDuration : settings.shortBreakDuration) * 60;

      setTimerMode(nextMode);
      timerModeRef.current = nextMode;
      setTimeLeft(nextDuration);
      timeLeftRef.current = nextDuration;

      const shouldAuto = !!settings.autoStartBreaks;
      setIsRunning(shouldAuto);
      isRunningRef.current = shouldAuto;
      if (!shouldAuto) {
        setIsNavHidden(false);
        ForegroundService.stopForegroundService().catch(() => {});
      } else {
        lastTickRef.current = Date.now();
        updateNotification(nextMode, nextDuration, settings, true);
      }
    } else {
      // Skipping break transitions back to work
      const nextDuration = settings.workDuration * 60;
      setTimerMode('work');
      timerModeRef.current = 'work';
      setTimeLeft(nextDuration);
      timeLeftRef.current = nextDuration;

      const shouldAuto = !!settings.autoStartPomodoros;
      setIsRunning(shouldAuto);
      isRunningRef.current = shouldAuto;
      if (!shouldAuto) {
        setIsNavHidden(false);
        ForegroundService.stopForegroundService().catch(() => {});
      } else {
        lastTickRef.current = Date.now();
        updateNotification('work', nextDuration, settings, true);
      }
    }
  };

  const handleSaveTask = (savedTask) => {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === savedTask.id);
      if (exists) return prev.map((t) => (t.id === savedTask.id ? savedTask : t));
      return [savedTask, ...prev];
    });
    if (activeTask && activeTask.id === savedTask.id) {
      setActiveTask(savedTask);
    }
  };

  const handleDeleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (activeTask && activeTask.id === id) setActiveTask(null);
  };

  const showToast = useCallback((message, onUndo) => {
    setToast({ id: Date.now(), message, onUndo });
  }, []);

  const dismissToast = useCallback((id) => {
    setToast((cur) => (cur && cur.id === id ? null : cur));
  }, []);

  // Celebrate once when today's focus time crosses the daily goal.
  const goalMetRef = useRef(null);
  useEffect(() => {
    if (!isLoaded) return;
    const todayStr = getLocalDateStr();
    const todayMins = (sessions || []).reduce((acc, s) => {
      if (!s || typeof s !== 'object') return acc;
      const sDt = s.dateStr || (typeof s.completedAt === 'string' ? s.completedAt.split('T')[0] : '');
      return sDt === todayStr ? acc + (Number(s.duration) || 25) : acc;
    }, 0);
    const goalHours = Number(settings?.dailyGoalHours) || 4;
    const met = todayMins >= goalHours * 60;
    if (goalMetRef.current === false && met) {
      triggerCelebration('Daily goal reached!', `${goalHours}h of focus completed today`);
    }
    goalMetRef.current = met;
  }, [sessions, settings?.dailyGoalHours, isLoaded, triggerCelebration]);

  const handleToggleComplete = (id) => {
    const todayStr = getLocalDateStr();
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const nextCompleted = !target.completed;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: nextCompleted,
              completedDateStr: nextCompleted ? todayStr : null,
              completedAt: nextCompleted ? new Date().toISOString() : null,
            }
          : t
      )
    );

    if (nextCompleted) {
      setJustCompletedId(id);
      setTimeout(() => setJustCompletedId((cur) => (cur === id ? null : cur)), 1100);
      if (window.navigator?.vibrate) window.navigator.vibrate([10, 30, 14]);
      showToast('Task completed', () => {
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...target } : t)));
        setJustCompletedId(null);
      });
    }
  };

  const handleToggleSubtask = (taskId, subId) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedSub = t.subtasks.map((s) =>
            s.id === subId ? { ...s, completed: !s.completed } : s
          );
          return { ...t, subtasks: updatedSub };
        }
        return t;
      })
    );
  };

  const handleStartPomodoroForTask = (task) => {
    setActiveTask(task);
    setTimerMode('work');
    setTimeLeft(settings.workDuration * 60);
    handleTabSwitch('timer');
    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(30);
  };

  const handleSaveProject = (savedProj) => {
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === savedProj.id);
      if (exists) return prev.map((p) => (p.id === savedProj.id ? savedProj : p));
      return [...prev, savedProj];
    });
  };

  const handleDeleteProject = (id) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setTasks((prev) => prev.filter((t) => t.projectId !== id));
    if (selectedProjectId === id) setSelectedProjectId(null);
  };

  const handleResetAllData = () => {
    // True clean wipe
    setProjects([{ id: 'proj-1', name: 'Personal', color: 'var(--theme-primary)' }]);
    setTasks([]);
    setSessions([]);
    setSettings(DEFAULT_SETTINGS);
    setActiveTask(null);
    setCycleCount(0);
    setTimeLeft(25 * 60);
  };

  const getTotalTimeForMode = () => {
    if (timerMode === 'work') return settings.workDuration * 60;
    if (timerMode === 'shortBreak') return settings.shortBreakDuration * 60;
    if (timerMode === 'longBreak') return settings.longBreakDuration * 60;
    return 1;
  };

  const handleUpdateSettings = useCallback((newSettings) => {
    startTransition(() => {
      setSettings(newSettings);
    });
  }, []);

  const renderTabContent = (tabKey) => {
    if (tabKey === 'home') {
      return (
        <TaskList
          tasks={tasks}
          projects={projects}
          sessions={sessions}
          settings={settings}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          onAddTask={() => {
            setTaskToEdit(null);
            setTaskModalOpen(true);
          }}
          onEditTask={(task) => {
            setTaskToEdit(task);
            setTaskModalOpen(true);
          }}
          onDeleteTask={handleDeleteTask}
          onToggleComplete={handleToggleComplete}
          justCompletedId={justCompletedId}
          onToggleSubtask={handleToggleSubtask}
          onStartPomodoro={handleStartPomodoroForTask}
          onAddProject={() => {
            setProjectToEdit(null);
            setProjectModalOpen(true);
          }}
          onEditProject={(proj) => {
            setProjectToEdit(proj);
            setProjectModalOpen(true);
          }}
          onDeleteProject={handleDeleteProject}
          activeTaskId={activeTask?.id}
          isTimerRunning={isRunning}
        />
      );
    }
    if (tabKey === 'timer') {
      return (
        <TimerView
          mode={timerMode}
          timeLeft={timeLeft}
          totalTime={getTotalTimeForMode()}
          isRunning={isRunning}
          cycleCount={cycleCount}
          activeTask={activeTask}
          projects={projects}
          currentSound={currentSound}
          soundVolume={settings.soundVolume}
          onTogglePlay={handleTogglePlay}
          onReset={handleResetTimer}
          onSkip={handleSkip}
          onModeChange={handleSelectMode}
          onSelectSound={(snd) => {
            setCurrentSound(snd);
            setSettings({ ...settings, soundscape: snd });
          }}
          onChangeVolume={(vol) => setSettings({ ...settings, soundVolume: vol })}
          onClearActiveTask={() => {
            setActiveTask(null);
            handleTabSwitch('home');
          }}
          strictMode={settings.strictMode}
          onToggleStrictMode={() => setSettings({ ...settings, strictMode: !settings.strictMode })}
          isNavHidden={isNavHidden && activeTab === 'timer'}
          onToggleNav={() => setIsNavHidden((prev) => !prev)}
        />
      );
    }
    if (tabKey === 'reports') {
      return (
        <AnalyticsDashboard
          tasks={tasks}
          projects={projects}
          sessions={sessions}
          settings={settings}
          period={activityPeriod}
          setPeriod={setActivityPeriod}
          offset={activityOffset}
          setOffset={setActivityOffset}
          hideHeader={false}
        />
      );
    }
    if (tabKey === 'profile') {
      return (
        <ProfileView
          sessions={sessions}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onResetAllData={handleResetAllData}
          projects={projects}
          onAddProject={() => {
            setProjectToEdit(null);
            setProjectModalOpen(true);
          }}
          onEditProject={(proj) => {
            setProjectToEdit(proj);
            setProjectModalOpen(true);
          }}
          onDeleteProject={handleDeleteProject}
        />
      );
    }
    return null;
  };

  // Swipe gesture handlers
  const handleTouchStart = (e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e) => {
    touchEnd.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e) => {
    if (isNavHidden) return; // Don't swipe when in fullscreen timer mode
    if (e.target.tagName?.toLowerCase() === 'input' && e.target.type === 'range') return;
    if (e.target.closest('.no-swipe')) return; // Ignore swipes in horizontal scroll areas

    if (!touchStart.current.x || !touchEnd.current.x) return;
    const dx = touchStart.current.x - touchEnd.current.x;
    const dy = touchStart.current.y - touchEnd.current.y;
    
    // Check if predominantly horizontal and past threshold
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 75) {
      const isLeftSwipe = dx > 0;
      const isRightSwipe = dx < 0;
      const tabs = ['home', 'timer', 'reports', 'profile'];
      const currentIndex = tabs.indexOf(activeTab);
      
      if (isLeftSwipe && currentIndex < tabs.length - 1) {
        if (window.navigator?.vibrate) window.navigator.vibrate(10);
        handleTabSwitch(tabs[currentIndex + 1]);
      }
      if (isRightSwipe && currentIndex > 0) {
        if (window.navigator?.vibrate) window.navigator.vibrate(10);
        handleTabSwitch(tabs[currentIndex - 1]);
      }
    }
    
    touchStart.current = { x: null, y: null };
    touchEnd.current = { x: null, y: null };
  };

  return (
    <div 
      className={`min-h-[100dvh] flex flex-col font-sans bg-canvas text-text-main ${isNavHidden ? 'overflow-hidden h-[100dvh]' : ''}`} 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* App Launch Split Reveal Animation */}
      {showPreloader && (
        <SplitRevealPreloader onFinish={handleFinishPreloader} />
      )}

      {/* Single Screen Mount with Hardware-Accelerated GPU Opacity Fade-In (Zero DOM stacking, INP < 60ms) */}
      <main className={`flex-1 relative ${isNavHidden ? 'overflow-hidden' : 'overflow-x-hidden'}`}>
        <div
          key={activeTab}
          className="relative w-full min-h-full animate-page-fade-in z-20"
          style={{ willChange: 'opacity' }}
        >
          {renderTabContent(activeTab)}
        </div>
      </main>

      {/* Bottom Screen Fade Overlay (Pure GPU gradient, zero backdrop-blur overhead) */}
      <div 
        className="fixed bottom-0 left-0 right-0 h-28 pointer-events-none z-40 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(to top, var(--theme-canvas) 20%, transparent 100%)',
          opacity: (isNavHidden && activeTab === 'timer') ? 0 : 1,
        }}
      />

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={navTab}
        setActiveTab={handleTabSwitch}
        onOpenNewTask={() => {
          setTaskToEdit(null);
          setTaskModalOpen(true);
        }}
        isHidden={isNavHidden && activeTab === 'timer'}
      />

      {/* Modals */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleSaveTask}
        projects={projects}
        taskToEdit={taskToEdit}
        defaultProjectId={selectedProjectId}
        onOpenCreateProject={() => {
          setProjectToEdit(null);
          setProjectModalOpen(true);
        }}
      />

      <ProjectModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSave={handleSaveProject}
        projectToEdit={projectToEdit}
      />

      <StrictModeModal
        isOpen={strictModalOpen}
        onClose={() => setStrictModalOpen(false)}
        onResetTimer={() => {
          handleResetTimer();
          setStrictModalOpen(false);
        }}
      />

      {/* UX feedback layers */}
      <UndoToast toast={toast} onDismiss={dismissToast} />
      {/* Dedicated Full-Screen Celebration: session done, break done, daily goal */}
      <SessionCompletionScreen
        celebration={celebrations[0] || null}
        onDismiss={dismissCelebration}
        onPrimaryAction={handleCelebrationPrimaryAction}
      />

    </div>
  );
}
