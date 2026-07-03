import React, { useState, useEffect, useRef } from 'react';
import BottomNav from './components/Navigation/BottomNav';
import TaskList from './components/Tasks/TaskList';
import TaskModal from './components/Tasks/TaskModal';
import ProjectList from './components/Projects/ProjectList';
import ProjectModal from './components/Projects/ProjectModal';
import TimerView from './components/Timer/TimerView';
import StrictModeModal from './components/Timer/StrictModeModal';
import AnalyticsDashboard from './components/Analytics/AnalyticsDashboard';
import SettingsView from './components/Settings/SettingsView';
import { storage, DEFAULT_PROJECTS, DEFAULT_TASKS, DEFAULT_SETTINGS, generateSampleSessions } from './services/storage';
import { soundEngine } from './services/soundEngine';
import confetti from 'canvas-confetti';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks', 'timer', 'projects', 'analytics', 'settings'
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // Data State
  const [projects, setProjects] = useState(DEFAULT_PROJECTS);
  const [tasks, setTasks] = useState(DEFAULT_TASKS);
  const [sessions, setSessions] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Timer State
  const [timerMode, setTimerMode] = useState('work'); // 'work', 'shortBreak', 'longBreak', 'stopwatch'
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(0);
  const [activeTask, setActiveTask] = useState(null);
  const [currentSound, setCurrentSound] = useState('none');

  // Modals State
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [strictModalOpen, setStrictModalOpen] = useState(false);

  const timerRef = useRef(null);

  // Load initial data from IDB/localStorage
  useEffect(() => {
    async function loadAll() {
      const p = await storage.getProjects();
      const t = await storage.getTasks();
      const s = await storage.getSessions();
      const set = await storage.getSettings();
      setProjects(p || DEFAULT_PROJECTS);
      setTasks(t || DEFAULT_TASKS);
      setSessions(s || []);
      setSettings(set || DEFAULT_SETTINGS);
      setTimeLeft((set ? set.workDuration : 25) * 60);
      setCurrentSound(set ? set.soundscape : 'none');
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

  // Timer Tick Logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (timerMode === 'stopwatch') return prev + 1;
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimerFinish();
            return 0;
          }
          return prev - 1;
        });
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

    if (timerMode === 'work') {
      // Trigger satisfying completion celebration
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
      });

      const nextCycle = cycleCount + 1;
      setCycleCount(nextCycle);

      // Record session
      const newSess = {
        id: `sess-${Date.now()}`,
        projectId: activeTask ? activeTask.projectId : (projects[0] ? projects[0].id : 'proj-1'),
        duration: settings.workDuration,
        completedAt: new Date().toISOString(),
        dateStr: new Date().toISOString().split('T')[0],
      };
      setSessions((prev) => [newSess, ...prev]);

      // Update project pomodoros
      setProjects((prev) =>
        prev.map((p) =>
          p.id === newSess.projectId ? { ...p, pomodoros: (p.pomodoros || 0) + 1 } : p
        )
      );

      // Update active task pomodoros if present
      if (activeTask) {
        setTasks((prev) =>
          prev.map((t) => {
            if (t.id === activeTask.id) {
              const updatedPomos = (t.completedPomos || 0) + 1;
              const isDone = updatedPomos >= t.estimatedPomos;
              return { ...t, completedPomos: updatedPomos, completed: isDone };
            }
            return t;
          })
        );
        setActiveTask((prev) =>
          prev ? { ...prev, completedPomos: (prev.completedPomos || 0) + 1 } : null
        );
      }

      // Check long break vs short break
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
      // Break ended -> switch back to work
      setTimerMode('work');
      setTimeLeft(settings.workDuration * 60);
      if (settings.autoStartPomodoros) {
        setTimeout(() => setIsRunning(true), 1500);
      }
    }
  };

  // Timer Handlers
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

  const handleSkipSession = () => {
    if (confirm('Lewati sesi ini ke tahap berikutnya?')) {
      handleTimerFinish();
    }
  };

  // Task & Project Handlers
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
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
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
    setActiveTab('timer');
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
    setProjects(DEFAULT_PROJECTS);
    setTasks(DEFAULT_TASKS);
    setSessions(generateSampleSessions());
    setSettings(DEFAULT_SETTINGS);
    setActiveTask(null);
    setCycleCount(0);
    setTimeLeft(25 * 60);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-white font-bold animate-pulse">
        Memuat Focus To-Do...
      </div>
    );
  }

  const getTotalTimeForMode = () => {
    if (timerMode === 'work') return settings.workDuration * 60;
    if (timerMode === 'shortBreak') return settings.shortBreakDuration * 60;
    if (timerMode === 'longBreak') return settings.longBreakDuration * 60;
    return 1;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#f8fafc] flex flex-col font-sans selection:bg-[#ff5252]/30">
      {/* Active Tab Screen */}
      <main className="flex-1">
        {activeTab === 'tasks' && (
          <TaskList
            tasks={tasks}
            projects={projects}
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
          />
        )}

        {activeTab === 'timer' && (
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
            onSkip={handleSkipSession}
            onReset={handleResetTimer}
            onSelectMode={handleSelectMode}
            onSelectSound={(snd) => {
              setCurrentSound(snd);
              setSettings({ ...settings, soundscape: snd });
            }}
            onChangeVolume={(vol) => setSettings({ ...settings, soundVolume: vol })}
            onClearActiveTask={() => {
              setActiveTask(null);
              setActiveTab('tasks');
            }}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectList
            projects={projects}
            tasks={tasks}
            onAddProject={() => {
              setProjectToEdit(null);
              setProjectModalOpen(true);
            }}
            onEditProject={(proj) => {
              setProjectToEdit(proj);
              setProjectModalOpen(true);
            }}
            onDeleteProject={handleDeleteProject}
            onSelectProject={(projId) => {
              setSelectedProjectId(projId);
              setActiveTab('tasks');
            }}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard tasks={tasks} projects={projects} sessions={sessions} />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={setSettings}
            onResetAllData={handleResetAllData}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Modals */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleSaveTask}
        projects={projects}
        taskToEdit={taskToEdit}
        defaultProjectId={selectedProjectId}
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
    </div>
  );
}
