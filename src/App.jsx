import React, { useState, useEffect, useRef } from 'react';
import BottomNav from './components/Navigation/BottomNav';
import TaskList from './components/Tasks/TaskList';
import TaskModal from './components/Tasks/TaskModal';
import ProjectList from './components/Projects/ProjectList';
import ProjectModal from './components/Projects/ProjectModal';
import TimerView from './components/Timer/TimerView';
import StrictModeModal from './components/Timer/StrictModeModal';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import ProfileView from './components/Profile/ProfileView';
import { storage, DEFAULT_PROJECTS, DEFAULT_TASKS, DEFAULT_SETTINGS, generateSampleSessions } from './services/storage';
import { soundEngine } from './services/soundEngine';
import { StatusBar, Style } from '@capacitor/status-bar';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { ForegroundService } from '@capawesome-team/capacitor-android-foreground-service';

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
  // Navigation State: 4 monochrome tabs: 'home', 'timer', 'reports', 'profile'
  const [activeTab, setActiveTab] = useState('home');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [prevTab, setPrevTab] = useState(null);
  const [slideDir, setSlideDir] = useState('left');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Data State
  const [projects, setProjects] = useState(DEFAULT_PROJECTS);
  const [tasks, setTasks] = useState(() => processDailyRollover(DEFAULT_TASKS));
  const [sessions, setSessions] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Timer State
  const [timerMode, setTimerMode] = useState('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [activeTask, setActiveTask] = useState(null);
  const [currentSound, setCurrentSound] = useState('none');
  const [sessionDoneAlert, setSessionDoneAlert] = useState(null);
  const [isNavHidden, setIsNavHidden] = useState(false);

  // Modals State
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [strictModalOpen, setStrictModalOpen] = useState(false);

  const timerRef = useRef(null);
  const lastTickRef = useRef(null);

  // Swipe gesture refs
  const touchStart = useRef({ x: null, y: null });
  const touchEnd = useRef({ x: null, y: null });

  const TAB_ORDER = { home: 0, timer: 1, reports: 2, profile: 3 };

  const handleTabSwitch = (newTab) => {
    if (newTab === activeTab || isTransitioning) return;
    const dir = TAB_ORDER[newTab] > TAB_ORDER[activeTab] ? 'left' : 'right';
    setSlideDir(dir);
    setPrevTab(activeTab);
    setActiveTab(newTab);
    setIsTransitioning(true);

    setTimeout(() => {
      setIsTransitioning(false);
      setPrevTab(null);
    }, 320);
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
      setSettings(set || DEFAULT_SETTINGS);
      setTimeLeft((set ? set.workDuration : 25) * 60);
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

  useEffect(() => {
    if (isLoaded) {
      storage.saveSettings(settings);
      if (!isRunning && timerMode === 'work') {
        setTimeLeft(settings.workDuration * 60);
      }
    }
  }, [settings, isLoaded]);

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

          const modeLabel = timerMode === 'work' ? 'Focus Session' : (timerMode === 'shortBreak' ? 'Short Break' : 'Long Break');
          const mins = Math.floor(timeLeft / 60);
          const rem = timeLeft % 60;
          const formattedTime = `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
          
          await ForegroundService.startForegroundService({
            id: 1993,
            title: modeLabel,
            body: `CHRONO:${formattedTime}`,
            smallIcon: 'ic_stat_icon',
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
    if (isRunning && activeTab === 'timer') {
      setIsNavHidden(true);
    } else {
      setIsNavHidden(false);
    }
  }, [isRunning, activeTab]);

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
              const modeLabel = timerMode === 'work' ? 'Focus Session' : (timerMode === 'shortBreak' ? 'Short Break' : 'Long Break');
              ForegroundService.updateForegroundService({
                id: 1993,
                title: modeLabel,
                body: `CHRONO:${formattedTime}`,
                smallIcon: 'ic_stat_icon',
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
    soundEngine.playChime();
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([100, 50, 100, 50, 200]);
    }

    setSessionDoneAlert({
      mode: timerMode,
      title: timerMode === 'work' ? `Session ${cycleCount + 1} Completed` : 'Break Completed',
      subtitle: timerMode === 'work' ? 'Great focus! Enjoy a moment of calm.' : 'Refreshed? Ready to focus again?',
    });
    setTimeout(() => {
      setSessionDoneAlert(null);
    }, 5000);

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

  const handleTogglePlay = () => {
    if (!isRunning && currentSound !== 'none') {
      soundEngine.play(currentSound, settings.soundVolume);
    } else if (isRunning) {
      soundEngine.stop();
    }
    setIsRunning(!isRunning);
  };

  const handleSelectMode = (mode) => {
    setIsRunning(false);
    soundEngine.stop();
    setTimerMode(mode);
    if (mode === 'work') setTimeLeft(settings.workDuration * 60);
    else if (mode === 'shortBreak') setTimeLeft(settings.shortBreakDuration * 60);
    else if (mode === 'longBreak') setTimeLeft(settings.longBreakDuration * 60);
    else if (mode === 'stopwatch') setTimeLeft(0);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    soundEngine.stop();
    if (timerMode === 'work') setTimeLeft(settings.workDuration * 60);
    else if (timerMode === 'shortBreak') setTimeLeft(settings.shortBreakDuration * 60);
    else if (timerMode === 'longBreak') setTimeLeft(settings.longBreakDuration * 60);
    else if (timerMode === 'stopwatch') setTimeLeft(0);
  };

  const handleSkipBreak = () => {
    setIsRunning(false);
    soundEngine.stop();
    setTimerMode('work');
    setTimeLeft(settings.workDuration * 60);
    if (settings.autoStartPomodoros) {
      setTimeout(() => setIsRunning(true), 500);
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

  const handleToggleComplete = (id) => {
    const todayStr = getLocalDateStr();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextCompleted = !t.completed;
          return {
            ...t,
            completed: nextCompleted,
            completedDateStr: nextCompleted ? todayStr : null,
            completedAt: nextCompleted ? new Date().toISOString() : null,
          };
        }
        return t;
      })
    );
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
    setProjects([{ id: 'proj-1', name: 'Personal', color: '#40513B' }]);
    setTasks([]);
    setSessions([]);
    setSettings(DEFAULT_SETTINGS);
    setActiveTask(null);
    setCycleCount(0);
    setTimeLeft(25 * 60);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center font-mono font-bold text-xs animate-pulse tracking-widest" style={{ background: 'var(--canvas)', color: 'var(--text-primary)' }}>
        INITIALIZING FOCUS LEDGER // SOLO_OS...
      </div>
    );
  }

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
          onSkip={handleSkipBreak}
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
        handleTabSwitch(tabs[currentIndex + 1]);
      }
      if (isRightSwipe && currentIndex > 0) {
        handleTabSwitch(tabs[currentIndex - 1]);
      }
    }
    
    touchStart.current = { x: null, y: null };
    touchEnd.current = { x: null, y: null };
  };

  return (
    <div 
      className={`min-h-[100dvh] flex flex-col font-sans ${isNavHidden ? 'overflow-hidden h-[100dvh]' : ''}`} 
      style={{ background: 'var(--canvas)', color: 'var(--text-primary)' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Active Tab Screen */}
      <main className={`flex-1 relative ${isNavHidden ? 'overflow-hidden' : 'overflow-x-hidden'}`}>
        <div className="relative w-full min-h-full">
          {isTransitioning && prevTab && (
            <div className={`absolute inset-0 w-full ${slideDir === 'left' ? 'animate-slide-out-left' : 'animate-slide-out-right'}`}>
              {renderTabContent(prevTab)}
            </div>
          )}
          <div className={`w-full min-h-full ${isTransitioning ? (slideDir === 'left' ? 'animate-slide-in-right' : 'animate-slide-in-left') : ''}`}>
            {renderTabContent(activeTab)}
          </div>
        </div>
      </main>

      {/* Bottom Screen Fade Overlay */}
      <div 
        className="fixed bottom-0 left-0 right-0 h-32 pointer-events-none z-40 transition-opacity duration-500 backdrop-blur-md"
        style={{
          background: 'rgba(250, 250, 250, 0.8)', // slight transparency for the blur to show
          maskImage: 'linear-gradient(to top, black 25%, transparent)',
          WebkitMaskImage: 'linear-gradient(to top, black 25%, transparent)',
          opacity: (isNavHidden && activeTab === 'timer') ? 0 : 1,
        }}
      />

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
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

      {/* Minimalist Session Completion Banner */}
      {sessionDoneAlert && (
        <div className="fixed top-8 left-1/2 z-50 animate-slideDown" style={{ transform: 'translateX(-50%)' }}>
          <div
            className="flex items-center gap-3.5 select-none"
            style={{
              background: 'rgba(250, 250, 250, 0.85)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              border: '1px solid var(--surface-border)',
              boxShadow: '0 16px 40px -12px rgba(0,0,0,0.15)',
              borderRadius: 99,
              padding: '12px 24px 12px 14px',
            }}
          >
            <div className="flex items-center justify-center shrink-0" style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--text-primary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#fff' }}>check</span>
            </div>
            <div className="flex flex-col justify-center whitespace-nowrap" style={{ marginTop: -2 }}>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {sessionDoneAlert.title}
              </span>
              <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.04em', marginTop: 3 }}>
                {sessionDoneAlert.subtitle}
              </span>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
