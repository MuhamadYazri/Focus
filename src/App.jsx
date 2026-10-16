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
import relaxLottie from './assets/relaxAnimation.lottie';
import { ForegroundService } from '@capawesome-team/capacitor-android-foreground-service';
import SplitRevealPreloader from './components/animata/preloader/SplitRevealPreloader';
import UndoToast from './components/Feedback/UndoToast';
import GoalCelebration from './components/Feedback/GoalCelebration';

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
  const [exitingTab, setExitingTab] = useState(null); // Screen currently fading out
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

  // Swipe gesture refs
  const touchStart = useRef({ x: null, y: null });
  const touchEnd = useRef({ x: null, y: null });

  const TAB_ORDER = { home: 0, timer: 1, reports: 2, profile: 3 };

  const exitTimerRef = useRef(null);

  const handleTabSwitch = (newTab) => {
    if (newTab === navTab) return;
    // 1. Immediate UI update for the bottom dock indicator (Paint occurs in <16ms, INP remains green)
    setNavTab(newTab);
    
    // 2. Capture outgoing screen for seamless crossfade opacity out
    const previous = activeTab;
    setExitingTab(previous);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    exitTimerRef.current = setTimeout(() => {
      setExitingTab(null);
    }, 300);

    // 3. React 19 startTransition yields main thread to browser paint before rendering heavy incoming tab
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

  // Manage Live Notification (Origin Island Foreground Service)
  useEffect(() => {
    const manageForegroundService = async () => {
      if (isRunning && settings.liveNotification) {
        try {
          // Android 13+ requires explicit permission for notifications
          if (ForegroundService.requestPermissions) {
            await ForegroundService.requestPermissions();
          }

          const modeLabel = timerMode === 'work' ? 'Focus' : (timerMode === 'shortBreak' ? 'Short Break' : (timerMode === 'stopwatch' ? 'Focus' : 'Long Break'));
          const mins = Math.floor(timeLeft / 60);
          const rem = timeLeft % 60;
          const formattedTime = `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
          
          const prefix = timerMode === 'stopwatch' ? 'CHRONO_UP:' : 'CHRONO:';
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
  }, [isRunning, settings.liveNotification, timerMode]);

  // Auto hide/show bottom nav when timer starts or stops
  useEffect(() => {
    if (isRunning) {
      setIsNavHidden(true);
    } else {
      setIsNavHidden(false);
    }
  }, [isRunning]);

  // Immediate catch-up when returning to foreground / unlocking screen
  useEffect(() => {
    const handleSyncOnForeground = () => {
      if (isRunning && lastTickRef.current) {
        const now = Date.now();
        const deltaSecs = Math.floor((now - lastTickRef.current) / 1000);
        if (deltaSecs >= 1) {
          lastTickRef.current += deltaSecs * 1000;
          setTimeLeft((prev) => {
            let nextVal = prev;
            if (timerMode === 'stopwatch') nextVal = prev + deltaSecs;
            else if (prev - deltaSecs <= 0) nextVal = 0;
            else nextVal = prev - deltaSecs;

            if (nextVal === 0 && timerMode !== 'stopwatch') {
              if (timerRef.current) clearInterval(timerRef.current);
              setTimeout(() => handleTimerFinish(), 0);
              return 0;
            }
            return nextVal;
          });
        }
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleSyncOnForeground();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isRunning, timerMode]);

  // Timer Tick Logic
  useEffect(() => {
    if (isRunning) {
      lastTickRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const deltaSecs = Math.floor((now - lastTickRef.current) / 1000);

        if (deltaSecs >= 1) {
          lastTickRef.current += deltaSecs * 1000;
          setTimeLeft((prev) => {
            let nextVal = prev;
            if (timerMode === 'stopwatch') nextVal = prev + deltaSecs;
            else if (prev - deltaSecs <= 0) nextVal = 0;
            else nextVal = prev - deltaSecs;

            if (settings.liveNotification) {
              const mins = Math.floor(nextVal / 60);
              const rem = nextVal % 60;
              const formattedTime = `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
              const modeLabel = timerMode === 'work' ? 'Focus' : (timerMode === 'shortBreak' ? 'Short Break' : (timerMode === 'stopwatch' ? 'Focus' : 'Long Break'));
              const prefix = timerMode === 'stopwatch' ? 'CHRONO_UP:' : 'CHRONO:';
              ForegroundService.updateForegroundService({
                id: 1993,
                title: modeLabel,
                body: `${prefix}${formattedTime}`,
                smallIcon: 'ic_stat_focus_text',
                silent: true,
                serviceType: 1073741824 // FOREGROUND_SERVICE_TYPE_SPECIAL_USE
              }).catch(() => {});
            }

            if (nextVal === 0 && timerMode !== 'stopwatch') {
              clearInterval(timerRef.current);
              setTimeout(() => handleTimerFinish(), 0);
              return 0;
            }
            return nextVal;
          });
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, timerMode, cycleCount, activeTask, settings]);

  const handleTimerFinish = () => {
    setIsRunning(false);
    setIsNavHidden(false);
    soundEngine.playChime();
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([100, 50, 100, 50, 200]);
    }

    enqueueCelebration({
      title: timerMode === 'work' ? `Session ${cycleCount + 1} Completed` : 'Break Completed',
      subtitle: timerMode === 'work' ? 'Great focus! Enjoy a moment of calm.' : 'Refreshed? Ready to focus again?',
      lottie: clockTickingLottie,
    });

    if (timerMode === 'work') {
      const nextCycle = cycleCount + 1;
      setCycleCount(nextCycle);

      const newSess = {
        id: `sess-${Date.now()}`,
        projectId: activeTask ? activeTask.projectId : (projects[0] ? projects[0].id : 'proj-1'),
        duration: settings.workDuration,
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

      if (nextCycle % (settings.longBreakInterval || 4) === 0) {
        setTimerMode('longBreak');
        setTimeLeft(settings.longBreakDuration * 60);
      } else {
        setTimerMode('shortBreak');
        setTimeLeft(settings.shortBreakDuration * 60);
      }

      if (settings.autoStartBreaks) {
        setTimeout(() => setIsRunning(true), 1500);
      }
    } else {
      setTimerMode('work');
      setTimeLeft(settings.workDuration * 60);
      if (settings.autoStartPomodoros) {
        setTimeout(() => setIsRunning(true), 1500);
      }
    }
  };

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
    setIsNavHidden(false);
    soundEngine.stop();
    if (timerMode === 'work') setTimeLeft(settings.workDuration * 60);
    else if (timerMode === 'shortBreak') setTimeLeft(settings.shortBreakDuration * 60);
    else if (timerMode === 'longBreak') setTimeLeft(settings.longBreakDuration * 60);
    else if (timerMode === 'stopwatch') setTimeLeft(0);
  };

  const handleSkip = () => {
    setIsRunning(false);
    setIsNavHidden(false);
    soundEngine.stop();

    if (timerMode === 'work') {
      const totalSecs = settings.workDuration * 60;
      const elapsedSecs = Math.max(0, totalSecs - timeLeft);
      saveFocusProgress(elapsedSecs);

      const nextCycle = cycleCount + 1;
      setCycleCount(nextCycle);

      if (nextCycle % (settings.longBreakInterval || 4) === 0) {
        setTimerMode('longBreak');
        setTimeLeft(settings.longBreakDuration * 60);
      } else {
        setTimerMode('shortBreak');
        setTimeLeft(settings.shortBreakDuration * 60);
      }

      if (settings.autoStartBreaks) {
        setTimeout(() => setIsRunning(true), 500);
      }
    } else {
      // Skipping break transitions back to work
      setTimerMode('work');
      setTimeLeft(settings.workDuration * 60);
      if (settings.autoStartPomodoros) {
        setTimeout(() => setIsRunning(true), 500);
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
          onUpdateSettings={setSettings}
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

      {/* Tab Screen with Smooth Crossfade Opacity */}
      <main className={`flex-1 relative ${isNavHidden ? 'overflow-hidden' : 'overflow-x-hidden'}`}>
        {/* Outgoing Screen (Fade Out) */}
        {exitingTab && exitingTab !== activeTab && (
          <div
            key={`exit-${exitingTab}`}
            className="absolute inset-0 w-full min-h-full pointer-events-none animate-page-fade-out z-10"
            style={{ willChange: 'opacity' }}
          >
            {renderTabContent(exitingTab)}
          </div>
        )}

        {/* Incoming Screen (Fade In) */}
        <div
          key={`active-${activeTab}`}
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
      {/* Shared full-width modal: session done, break done, daily goal (queued one at a time) */}
      <GoalCelebration celebration={celebrations[0] || null} onDone={dismissCelebration} />

    </div>
  );
}
