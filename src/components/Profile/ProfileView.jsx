import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FlameIcon, ClockIcon, BookmarkCheckIcon, CopyIcon, CheckIcon, XIcon } from 'lucide-animated';
import { Loader2, Share2 } from 'lucide-react';
import SharedActivitySection from '../Analytics/SharedActivitySection';
import { storage } from '../../services/storage';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

const toTitleCase = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

const G = "'Poppins', sans-serif";
const M = "'Poppins', sans-serif";

function ProfileView({
  sessions = [],
  settings = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    strictMode: false,
    autoStartBreaks: false,
  },
  onUpdateSettings,
  onResetAllData,
  projects = [],
  onAddProject,
  onEditProject,
  onDeleteProject,
  period: controlledPeriod,
  setPeriod: controlledSetPeriod,
  offset: controlledOffset,
  setOffset: controlledSetOffset,
  hideHeader = false,
}) {
  const [showReport, setShowReport] = useState(false);
  const [copied, setCopied] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [reportData, setReportData] = useState({
    period: 'Daily',
    offset: 0,
    dateLabel: 'Today',
    displayHours: '4h 10m',
    displayPomos: 10,
    displaySubToday: '4h 10m today',
    displaySubDays: '1 day focused',
  });
  const [backupStatus, setBackupStatus] = useState('idle');
  const [backupMsg, setBackupMsg] = useState('');
  const maxBarH = 48;

  const flameRef = useRef(null);
  const clockRef = useRef(null);
  const sessionRef = useRef(null);

  useEffect(() => {
    let isReversed = false;
    const interval = setInterval(() => {
      isReversed = !isReversed;
      if (isReversed) {
        flameRef.current?.startAnimation?.();
        clockRef.current?.startAnimation?.();
        sessionRef.current?.startAnimation?.();
      } else {
        flameRef.current?.stopAnimation?.();
        clockRef.current?.stopAnimation?.();
        sessionRef.current?.stopAnimation?.();
      }
    }, 1500); // 1.5s loop gives it time to animate and reverse
    return () => clearInterval(interval);
  }, []);

  const realSessions = sessions || [];
  const totalMinutes = Math.round(
    realSessions.reduce((acc, s) => acc + (s.duration || 0), 0)
  );
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const totalHoursDisplay = `${hours}h ${String(mins).padStart(2, '0')}m`;

  const totalPomos = realSessions.length;
  
  // Calculate total unique days focused based on sessions
  const uniqueDays = new Set(realSessions.map(s => {
    if (s.dateStr) return s.dateStr;
    try { return new Date(s.completedAt).toISOString().split('T')[0]; }
    catch(e) { return ''; }
  }).filter(Boolean));
  const totalDays = uniqueDays.size;

  // Calculate Streak
  let currentStreak = 0;
  if (uniqueDays.size > 0) {
    const sortedDates = Array.from(uniqueDays).sort((a, b) => (a < b ? 1 : -1)); // Descending
    const today = new Date();
    const todayStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = new Date(yesterday.getTime() - yesterday.getTimezoneOffset() * 60000).toISOString().split('T')[0];

    let checkDate = new Date(sortedDates[0]);
    if (sortedDates[0] === todayStr || sortedDates[0] === yesterdayStr) {
      currentStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const expectedNextDate = new Date(checkDate);
        expectedNextDate.setDate(expectedNextDate.getDate() - 1);
        const expectedNextDateStr = new Date(expectedNextDate.getTime() - expectedNextDate.getTimezoneOffset() * 60000).toISOString().split('T')[0];
        
        if (sortedDates[i] === expectedNextDateStr) {
          currentStreak++;
          checkDate = expectedNextDate;
        } else {
          break;
        }
      }
    }
  }

  const handleChange = (key, value) => {
    if (onUpdateSettings) onUpdateSettings({ ...settings, [key]: value });
  };

  const handleNumberChange = (key, valStr) => {
    if (valStr === '' || valStr === '-' || valStr === '-0' || valStr.endsWith('.')) {
      handleChange(key, valStr);
    } else {
      const num = Number(valStr);
      handleChange(key, isNaN(num) ? '' : num);
    }
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'Are you sure you want to completely wipe all tasks, projects, and focus history? This cannot be undone.'
      )
    ) {
      if (onResetAllData) onResetAllData();
    }
  };



  const handleBackup = async () => {
    try {
      setBackupStatus('backing-up');
      setBackupMsg('');
      const data = await storage.exportAllData();
      const stringData = JSON.stringify(data, null, 2);
      const fileName = `focus_backup_${new Date().toISOString().split('T')[0]}.json`;

      // Natively write to the app's cache directory
      const result = await Filesystem.writeFile({
        path: fileName,
        data: stringData,
        directory: Directory.Cache,
        encoding: 'utf8'
      });

      // Pop up the native Android share sheet
      await Share.share({
        title: 'Focus Backup',
        text: 'Backup file for Focus To-Do app',
        url: result.uri,
        dialogTitle: 'Save or Share Backup',
      });

      const now = new Date().toLocaleString();
      setBackupStatus('idle');
      setBackupMsg(`Shared locally: ${now}`);
    } catch (e) {
      setBackupStatus('idle');
      setBackupMsg(`Error: ${e.message}`);
    }
  };

  const handleRestore = async () => {
    if (!window.confirm('Restore will overwrite ALL current data. Continue?')) return;
    try {
      setBackupStatus('restoring');
      setBackupMsg('');

      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
          setBackupStatus('idle');
          return;
        }
        try {
          const text = await file.text();
          const data = JSON.parse(text);
          await storage.importAllData(data);
          setBackupStatus('idle');
          setBackupMsg('Restored! Reloading...');
          setTimeout(() => window.location.reload(), 1200);
        } catch (err) {
          setBackupStatus('idle');
          setBackupMsg(`Parse Error: ${err.message}`);
        }
      };
      input.click();

      // If user cancels file dialog, we reset status (not always easy to detect, but we try)
      window.addEventListener(
        'focus',
        () => {
          setTimeout(() => {
            if (backupStatus === 'restoring') setBackupStatus('idle');
          }, 1000);
        },
        { once: true }
      );
    } catch (e) {
      setBackupStatus('idle');
      setBackupMsg(`Error: ${e.message}`);
    }
  };

  const getReportTitle = () => {
    const p = reportData.period;
    if (p === 'Daily') return 'DAILY REPORT';
    if (p === 'Weekly') return 'WEEKLY REPORT';
    if (p === 'Monthly') return 'MONTHLY REPORT';
    if (p === 'Yearly') return 'YEARLY REPORT';
    return 'ALL TIME REPORT';
  };

  const getReportHeading = () => {
    const p = reportData.period;
    if (p === 'All') return 'All Time Summary';
    return reportData.dateLabel || 'Summary';
  };

  const handleCopyReport = () => {
    if (navigator.clipboard) {
      const p = reportData.period;
      let text = `Focus // ${getReportTitle()}\n`;
      text += `📅 ${getReportHeading()}\n\n`;
      text += `⏱ Total Focus: ${reportData.displayHours}\n`;
      text += `🍅 Sessions: ${reportData.displayPomos.toLocaleString()} pomodoros\n`;
      text += `📊 ${reportData.displaySubToday}\n`;
      text += `📆 ${reportData.displaySubDays}`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareReport = async () => {
    const text = `Focus // ${getReportTitle()}\n📅 ${getReportHeading()}\n\n⏱ Total Focus: ${reportData.displayHours}\n🍅 Sessions: ${reportData.displayPomos.toLocaleString()} pomodoros\n📊 ${reportData.displaySubToday}\n📆 ${reportData.displaySubDays}`;
    try {
      if (Share?.share) {
        await Share.share({
          title: `Focus - ${getReportTitle()}`,
          text: text,
          dialogTitle: 'Share Focus Report',
        });
      } else if (navigator.share) {
        await navigator.share({
          title: `Focus - ${getReportTitle()}`,
          text: text,
        });
      } else {
        handleCopyReport();
      }
    } catch (e) {
      if (e?.name !== 'AbortError') {
        handleCopyReport();
      }
    }
  };

  return (
    <main className={`flex-1 w-full bg-transparent ${hideHeader ? 'pt-2.5' : 'pt-15'} pb-36 selection:bg-[#E5D9B6] selection:text-primary`}>
      <div className="flex flex-col w-full max-w-md mx-auto px-5  gap-4">
        {/* ── Activity ── */}
        <SharedActivitySection
          showKPIs={false}
          sessions={sessions}
          period={controlledPeriod}
          setPeriod={controlledSetPeriod}
          offset={controlledOffset}
          setOffset={controlledSetOffset}
          hideHeader={hideHeader}
          onPeriodChange={setReportData}
        />

        {/* ── 3 Key Metric Cards ── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Streak */}
          <div className="bg-surface rounded-2xl p-4 flex flex-col items-center text-center justify-center gap-1.5 shadow-sm ring-1 ring-white/70 border border-border">
            <FlameIcon ref={flameRef} size={24} color="#E67E22" strokeWidth={2} />
            <span className="text-2xl font-bold text-text-main font-sans">{currentStreak}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-sub font-sans">
              DAY STREAK
            </span>
          </div>
          {/* Focused */}
          <div className="bg-surface rounded-2xl p-4 flex flex-col items-center text-center justify-center gap-1.5 shadow-sm ring-1 ring-white/70 border border-border">
            <ClockIcon ref={clockRef} size={24} className="text-secondary" strokeWidth={2} />
            <span className="text-2xl font-bold text-text-main font-sans">{hours}h</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-sub font-sans">
              FOCUSED
            </span>
          </div>
          {/* Sessions */}
          <div className="bg-surface rounded-2xl p-4 flex flex-col items-center text-center justify-center gap-1.5 shadow-sm ring-1 ring-white/70 border border-border">
            <BookmarkCheckIcon ref={sessionRef} size={24} className="text-primary" strokeWidth={2} />
            <span className="text-xl font-bold text-text-main font-sans">
              {totalPomos.toLocaleString()}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-sub font-sans">
              SESSIONS
            </span>
          </div>
        </div>

        {/* ── Primary Action: Share Profile ── */}
        <button
          onClick={() => {
            if (window.navigator?.vibrate) window.navigator.vibrate(15);
            setShowReport(true);
          }}
          className="w-full h-12 py-3 px-5 rounded-full bg-primary text-white font-semibold text-sm flex items-center justify-center gap-2.5 shadow-md shadow-primary/20 ring-1 ring-white/20 active:scale-[0.99] hover:bg-primary-hover transition-all"
        >
          <svg
            fill="none"
            height="18"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="18"
          >
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line>
            <line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line>
          </svg>
          <span className="font-sans">Share Profile</span>
        </button>

        {/* ── Section: Focus Categories ── */}
        <div className="flex flex-col gap-2.5 pt-2">
          <div className="flex items-center justify-between px-1 pb-1">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-text-sub font-sans">
              FOCUS CATEGORIES
            </h2>
            <button
              onClick={() => {
                if (window.navigator?.vibrate) window.navigator.vibrate(10);
                if (onAddProject) onAddProject();
              }}
              className="flex items-center gap-1 text-secondary text-xs font-bold hover:text-primary transition-colors"
            >
              <svg
                fill="none"
                height="15"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                width="15"
              >
                <path d="M12 5V19"></path>
                <path d="M5 12H19"></path>
              </svg>
              <span className="font-sans">NEW</span>
            </button>
          </div>
          {projects.map((proj) => {
            const cleanName = proj.name.replace(/^[0-9]+\s*(\/\/|·|\.)\s*/, '').replace(/_/g, ' ');
            const displayName = toTitleCase(cleanName);
            return (
              <div
                key={proj.id}
                className="bg-surface rounded-full px-5 py-3 flex items-center justify-between shadow-xs border border-border ring-1 ring-white/60 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full shadow-sm shrink-0"
                    style={{ backgroundColor: proj.color || 'var(--theme-primary)' }}
                  />
                  <span className="text-xs font-bold text-text-main tracking-wide font-sans truncate">
                    {displayName}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      if (window.navigator?.vibrate) window.navigator.vibrate(10);
                      if (onEditProject) onEditProject(proj);
                    }}
                    aria-label="Edit category"
                    className="p-1.5 rounded-lg text-text-sub hover:text-text-main hover:bg-[#F4F0E8] transition-colors flex items-center justify-center active:scale-95"
                  >
                    <svg
                      fill="none"
                      height="16"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      width="16"
                    >
                      <path d="M16.474 5.408l2.118 2.118m-.756-3.95a2.121 2.121 0 113 3L7.5 19.914 3 21l1.086-4.5 13.332-13.042z"></path>
                    </svg>
                  </button>
                  {projects.length > 1 && (
                    <button
                      onClick={() => {
                        if (window.navigator?.vibrate) window.navigator.vibrate(10);
                        setProjectToDelete(proj);
                      }}
                      aria-label="Delete category"
                      className="p-1.5 rounded-lg text-[#BA1A1A] hover:bg-[#BA1A1A]/10 transition-colors flex items-center justify-center active:scale-95"
                    >
                      <svg
                        fill="none"
                        height="16"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="16"
                      >
                        <path d="M19 6L18 20H6L5 6"></path>
                        <path d="M10 11V16"></path>
                        <path d="M14 11V16"></path>
                        <path d="M3 6H21"></path>
                        <path d="M9 6V3H15V6"></path>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Section: Preferences ── */}
        <div className="flex flex-col gap-3 pt-2">
          <div className="px-1 pb-1">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-text-sub font-sans">
              PREFERENCES
            </h2>
          </div>



          {/* Timer Durations Card */}
          <div className="bg-surface rounded-2xl p-5 shadow-xs flex flex-col gap-4 border border-border ring-1 ring-white/70">
            <div className="flex items-center gap-2 pb-1 border-b border-border">
              <svg
                fill="none"
                height="20"
                className="stroke-secondary"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="20"
              >
                <path d="M5 22H19"></path>
                <path d="M5 2H19"></path>
                <path d="M17 22V16.6C17 15.6 16.5 14.6 15.6 14L12 11.5L8.4 14C7.5 14.6 7 15.6 7 16.6V22"></path>
                <path d="M7 2V7.4C7 8.4 7.5 9.4 8.4 10L12 12.5L15.6 10C16.5 9.4 17 8.4 17 7.4V2"></path>
              </svg>
              <span className="text-sm font-bold text-text-main font-sans">Timer Durations</span>
            </div>
            {[
              { key: 'workDuration', label: 'Focus Session', presets: [25, 45, 60] },
              { key: 'shortBreakDuration', label: 'Short Break', presets: [5, 10, 15] },
              { key: 'longBreakDuration', label: 'Long Break', presets: [15, 20, 30] },
            ].map(({ key, label, presets }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs font-medium text-text-main font-sans">{label}</span>
                <div className="bg-[#F4F0E8] p-1 rounded-full flex items-center gap-1 border border-border shadow-inner">
                  {presets.map((p) => {
                    const isActive = (settings[key] ?? presets[0]) === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          if (window.navigator?.vibrate) window.navigator.vibrate(10);
                          handleChange(key, p);
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-sans transition-colors ${
                          isActive
                            ? 'bg-primary font-bold text-white shadow-xs ring-1 ring-white/20'
                            : 'text-[#576652] hover:text-text-main'
                        }`}
                      >
                        {p}m
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Daily Goal Card */}
          <div className="bg-surface rounded-2xl p-5 shadow-xs flex flex-col gap-3.5 border border-border ring-1 ring-white/70">
            <div className="flex items-center justify-between pb-1 border-b border-border">
              <div className="flex items-center gap-2">
                <svg
                  fill="none"
                  height="20"
                  className="stroke-secondary"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  width="20"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="6"></circle>
                  <circle cx="12" cy="12" r="2"></circle>
                </svg>
                <span className="text-sm font-bold text-text-main font-sans">Daily Goal</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-main font-sans">Target Hours</span>
              <div className="bg-[#F4F0E8] p-1 rounded-full flex items-center gap-1 border border-border shadow-inner">
                {[2.0, 4.0, 6.0, 8.0].map((h) => {
                  const isActive = (settings.dailyGoalHours || 4.0) === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => {
                        if (window.navigator?.vibrate) window.navigator.vibrate(10);
                        handleChange('dailyGoalHours', h);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-sans transition-all ${
                        isActive
                          ? 'bg-primary font-bold text-white shadow-xs ring-1 ring-white/20'
                          : 'text-[#576652] hover:text-text-main'
                      }`}
                    >
                      {h}h
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* System Toggles Card */}
          <div className="bg-surface rounded-2xl p-5 shadow-xs flex flex-col gap-4 border border-border ring-1 ring-white/70">
            {[
              {
                key: 'autoStartBreaks',
                label: 'Auto-Start Breaks',
                desc: 'Breaks start automatically after focus',
                svg: (
                  <svg
                    fill="none"
                    height="20"
                    stroke="#576652"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="20"
                  >
                    <path d="M5 12h14"></path>
                    <path d="M12 5l7 7-7 7"></path>
                  </svg>
                ),
              },
              {
                key: 'autoStartPomodoros',
                label: 'Auto-Start Focus',
                desc: 'Focus starts automatically after break',
                svg: (
                  <svg
                    fill="none"
                    height="20"
                    stroke="#576652"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="20"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                ),
              },
              {
                key: 'keepAwake',
                label: 'Keep Screen Awake',
                desc: 'Prevent display from turning off',
                svg: (
                  <svg
                    fill="none"
                    height="20"
                    stroke="#576652"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="20"
                  >
                    <rect height="20" rx="2" width="14" x="5" y="2"></rect>
                    <line x1="12" x2="12.01" y1="18" y2="18"></line>
                  </svg>
                ),
              },
              {
                key: 'strictMode',
                label: 'Strict Mode',
                desc: 'Block tab switching while running',
                svg: (
                  <svg
                    fill="none"
                    height="20"
                    stroke="#576652"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="20"
                  >
                    <rect height="11" rx="2" width="18" x="3" y="11"></rect>
                    <path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11"></path>
                  </svg>
                ),
              },
              {
                key: 'liveNotification',
                label: 'Origin Island & Live Notif',
                desc: 'Persistent ticking countdown in background',
                svg: (
                  <svg
                    fill="none"
                    height="20"
                    stroke="#576652"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="20"
                  >
                    <path d="M18 8C18 4.68629 15.3137 2 12 2C8.68629 2 6 4.68629 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"></path>
                    <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"></path>
                  </svg>
                ),
              },
            ].map(({ key, label, desc, svg }) => {
              const isOn = !!settings[key];
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {svg}
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-text-main font-sans">{label}</span>
                      <span className="text-[11px] text-[#8A7968] font-sans">{desc}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (window.navigator?.vibrate) window.navigator.vibrate(10);
                      handleChange(key, !isOn);
                    }}
                    aria-label={`Toggle ${label}`}
                    className={`relative w-11 h-6 rounded-full p-0.5 transition-colors duration-200 ease-out cursor-pointer shadow-inner ${
                      isOn ? 'bg-primary ring-1 ring-primary/40' : 'bg-[#DDD6C8]/80'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-surface shadow-xs ring-1 ring-black/5 transform transition-transform duration-200 ease-out ${
                        isOn ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Local Backup Card */}
          <div className="bg-surface rounded-2xl p-5 shadow-xs flex flex-col gap-3 border border-border ring-1 ring-white/70">
            <div className="flex items-center gap-2">
              <svg
                fill="none"
                height="20"
                className="stroke-secondary"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                width="20"
              >
                <path d="M19 21H5C4.44772 21 4 20.5523 4 20V4C4 3.44772 4.44772 3 5 3H14L20 9V20C20 20.5523 19.5523 21 19 21Z"></path>
                <path d="M14 3V9H20"></path>
              </svg>
              <span className="text-sm font-bold text-text-main font-sans">Local Backup</span>
            </div>
            <p className="text-xs text-[#8A7968] font-sans">
              Save your data as a local file for safe keeping
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handleBackup}
                disabled={backupStatus !== 'idle'}
                className="py-2.5 px-4 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs ring-1 ring-white/20 active:scale-[0.98] hover:bg-primary-hover transition-all disabled:opacity-50"
              >
                {backupStatus === 'backing-up' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <svg
                    fill="none"
                    height="17"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="17"
                  >
                    <path d="M12 17V3"></path>
                    <path d="M6 9L12 3L18 9"></path>
                    <path d="M20 21H4"></path>
                  </svg>
                )}
                <span className="font-sans">
                  {backupStatus === 'backing-up' ? 'Saving...' : 'Backup'}
                </span>
              </button>
              <button
                onClick={handleRestore}
                disabled={backupStatus !== 'idle'}
                className="py-2.5 px-4 rounded-full bg-[#F4F0E8] text-text-main text-xs font-semibold flex items-center justify-center gap-2 hover:bg-border transition-colors border border-border shadow-2xs active:scale-[0.98] disabled:opacity-50"
              >
                {backupStatus === 'restoring' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <svg
                    fill="none"
                    height="17"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="17"
                  >
                    <path d="M12 3V17"></path>
                    <path d="M6 11L12 17L18 11"></path>
                    <path d="M20 21H4"></path>
                  </svg>
                )}
                <span className="font-sans">
                  {backupStatus === 'restoring' ? 'Restoring...' : 'Restore'}
                </span>
              </button>
            </div>
            {backupMsg && (
              <p
                className={`text-[11px] font-sans pt-1 ${
                  backupMsg.startsWith('Error') ? 'text-[#BA1A1A]' : 'text-secondary'
                }`}
              >
                {backupMsg}
              </p>
            )}
          </div>

          {/* Reset Telemetry Data Card */}
          <div className="bg-surface rounded-2xl p-5 shadow-xs flex items-center justify-between border border-border ring-1 ring-white/70 mb-6">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-text-main font-sans">Wipe All Data</span>
              <span className="text-[11px] text-[#8A7968] font-sans">
                Permanently delete all tasks and focus history
              </span>
            </div>
            <button
              onClick={handleResetData}
              className="px-3.5 py-1.5 rounded-full bg-[#BA1A1A]/10 text-[#BA1A1A] text-[11px] font-bold flex items-center gap-1.5 hover:bg-[#BA1A1A]/15 active:scale-95 transition-all border border-[#BA1A1A]/25 shadow-2xs"
            >
              <svg
                fill="none"
                height="14"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
                width="14"
              >
                <path d="M21.5 2V8H15.5"></path>
                <path d="M2.5 22V16H8.5"></path>
                <path d="M19.94 15.5C18.66 18.73 15.5 21 12 21C7.03 21 3 16.97 3 12C3 9.4 4.1 7.06 5.86 5.43L2.5 2"></path>
                <path d="M4.06 8.5C5.34 5.27 8.5 3 12 3C16.97 3 21 7.03 21 12C21 14.6 19.9 16.94 18.14 18.57L21.5 22"></path>
              </svg>
              <span className="font-sans">RESET</span>
            </button>
          </div>

          {/* App Version, Copyright & Attribution Badge */}
          <div className="flex flex-col items-center justify-center py-4 text-center select-none space-y-1">
            <span className="text-[11px] font-semibold text-text-sub tracking-wider uppercase opacity-75">
              Focus v1.0.1
            </span>
            <span className="text-[10px] text-text-sub/70">
              © 2026 Muhamad Yazri. All rights reserved.
            </span>
            <span className="text-[10px] text-text-sub/60">
              Animations credit to creators on{' '}
              <a
                href="https://app.lottiefiles.com"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-text-main transition-colors"
              >
                LottieFiles
              </a>
            </span>
          </div>

          {/* Full-width Brand Signature */}
          <div className="w-full pt-8 pb-3 select-none pointer-events-none flex items-center justify-center">
            <svg
              viewBox="10 -745 1418 755"
              className="w-full h-auto select-none pointer-events-none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="YAZRI"
            >
              <defs>
                <linearGradient id="yazriSculptedGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--theme-text-main, #191D15)" />
                  <stop offset="100%" stopColor="var(--theme-primary, #384834)" />
                </linearGradient>
                <filter id="yazriTactileDrop" x="-6%" y="-6%" width="112%" height="128%">
                  <feDropShadow dx="0" dy="10" stdDeviation="7" floodColor="#384834" floodOpacity="0.12" />
                  <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#191D15" floodOpacity="0.08" />
                </filter>
              </defs>
              {/* Tactile deboss / rim highlight */}
              <path
                d="M201 0H110Q85 0 85 -25V-182Q85 -226 71 -254L42 -312Q10 -373 10 -459V-710Q10 -735 35 -735H126Q151 -735 151 -710V-463Q151 -419 178 -363L197 -323Q226 -265 226 -209V-25Q226 0 201 0ZM246 -297H244Q233 -297 224 -314L195 -372Q171 -423 171 -463V-710Q171 -735 196 -735H287Q312 -735 312 -710V-471Q312 -392 285 -339L272 -316Q262 -297 246 -297ZM609 0H518Q493 0 493 -25V-341Q493 -366 518 -366H557Q561 -366 561 -370V-381Q561 -386 557 -386H518Q493 -386 493 -411V-710Q493 -735 518 -735H532Q559 -735 571 -704L606 -615Q623 -567 628.5 -535.5Q634 -504 634 -448V-25Q634 0 609 0ZM448 0H357Q332 0 332 -25V-448Q332 -504 337.5 -535.5Q343 -567 361 -615L395 -704Q407 -735 435 -735H448Q473 -735 473 -710V-411Q473 -386 448 -386H409Q405 -386 405 -381V-370Q405 -366 409 -366H448Q473 -366 473 -341V-25Q473 0 448 0ZM770 0H679Q654 0 654 -25V-219Q654 -285 669.0 -319.0Q684 -353 726 -392L753 -417Q786 -447 795.0 -462.5Q804 -478 804 -509V-710Q804 -735 829 -735H920Q945 -735 945 -710V-509Q945 -443 930.0 -408.5Q915 -374 873 -336L846 -311Q813 -281 804.0 -265.5Q795 -250 795 -219V-25Q795 0 770 0ZM741 -468H679Q654 -468 654 -493V-710Q654 -735 679 -735H759Q784 -735 784 -710V-509Q784 -468 741 -468ZM920 0H840Q815 0 815 -25V-219Q815 -261 858 -261H920Q945 -261 945 -236V-25Q945 0 920 0ZM1081 0H990Q965 0 965 -25V-710Q965 -735 990 -735H1081Q1106 -735 1106 -710V-25Q1106 0 1081 0ZM1152 -380H1151Q1126 -380 1126 -405V-710Q1126 -735 1151 -735H1152Q1202 -735 1234.5 -702.0Q1267 -669 1267 -609V-506Q1267 -447 1234.5 -413.5Q1202 -380 1152 -380ZM1242 0H1151Q1126 0 1126 -25V-337Q1126 -362 1151 -362H1160Q1205 -362 1236.0 -328.5Q1267 -295 1267 -236V-25Q1267 0 1242 0ZM1403 0H1312Q1287 0 1287 -25V-710Q1287 -735 1312 -735H1403Q1428 -735 1428 -710V-25Q1428 0 1403 0Z"
                fill="var(--theme-border, #EDE7DA)"
                transform="translate(0, 5)"
                opacity="0.85"
              />
              {/* Sculpted body with gradient & ambient depth */}
              <path
                d="M201 0H110Q85 0 85 -25V-182Q85 -226 71 -254L42 -312Q10 -373 10 -459V-710Q10 -735 35 -735H126Q151 -735 151 -710V-463Q151 -419 178 -363L197 -323Q226 -265 226 -209V-25Q226 0 201 0ZM246 -297H244Q233 -297 224 -314L195 -372Q171 -423 171 -463V-710Q171 -735 196 -735H287Q312 -735 312 -710V-471Q312 -392 285 -339L272 -316Q262 -297 246 -297ZM609 0H518Q493 0 493 -25V-341Q493 -366 518 -366H557Q561 -366 561 -370V-381Q561 -386 557 -386H518Q493 -386 493 -411V-710Q493 -735 518 -735H532Q559 -735 571 -704L606 -615Q623 -567 628.5 -535.5Q634 -504 634 -448V-25Q634 0 609 0ZM448 0H357Q332 0 332 -25V-448Q332 -504 337.5 -535.5Q343 -567 361 -615L395 -704Q407 -735 435 -735H448Q473 -735 473 -710V-411Q473 -386 448 -386H409Q405 -386 405 -381V-370Q405 -366 409 -366H448Q473 -366 473 -341V-25Q473 0 448 0ZM770 0H679Q654 0 654 -25V-219Q654 -285 669.0 -319.0Q684 -353 726 -392L753 -417Q786 -447 795.0 -462.5Q804 -478 804 -509V-710Q804 -735 829 -735H920Q945 -735 945 -710V-509Q945 -443 930.0 -408.5Q915 -374 873 -336L846 -311Q813 -281 804.0 -265.5Q795 -250 795 -219V-25Q795 0 770 0ZM741 -468H679Q654 -468 654 -493V-710Q654 -735 679 -735H759Q784 -735 784 -710V-509Q784 -468 741 -468ZM920 0H840Q815 0 815 -25V-219Q815 -261 858 -261H920Q945 -261 945 -236V-25Q945 0 920 0ZM1081 0H990Q965 0 965 -25V-710Q965 -735 990 -735H1081Q1106 -735 1106 -710V-25Q1106 0 1081 0ZM1152 -380H1151Q1126 -380 1126 -405V-710Q1126 -735 1151 -735H1152Q1202 -735 1234.5 -702.0Q1267 -669 1267 -609V-506Q1267 -447 1234.5 -413.5Q1202 -380 1152 -380ZM1242 0H1151Q1126 0 1126 -25V-337Q1126 -362 1151 -362H1160Q1205 -362 1236.0 -328.5Q1267 -295 1267 -236V-25Q1267 0 1242 0ZM1403 0H1312Q1287 0 1287 -25V-710Q1287 -735 1312 -735H1403Q1428 -735 1428 -710V-25Q1428 0 1403 0Z"
                fill="url(#yazriSculptedGrad)"
                filter="url(#yazriTactileDrop)"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Share Report Modal ── */}
      {showReport && createPortal(
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fadeIn"
          style={{
            background: 'rgba(25, 29, 21, 0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          onClick={() => setShowReport(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-5 flex flex-col gap-5 border border-border bg-surface shadow-2xl ring-1 ring-white/80"
            onClick={(e) => e.stopPropagation()}
          >
            {/* The "Share Card" */}
            <div
              className="relative w-full rounded-2xl overflow-hidden flex flex-col p-6 border border-border shadow-xs ring-1 ring-white/60"
              style={{ background: 'linear-gradient(135deg, var(--theme-canvas) 0%, var(--theme-border) 100%)' }}
            >
              <div className="flex items-center justify-between z-10 mb-8">
                <span className="text-[10px] text-text-sub tracking-widest font-sans font-bold">
                  FOCUS // {getReportTitle()}
                </span>
                <Share2 size={18} className="text-primary" strokeWidth={2} />
              </div>

              <div className="z-10 flex flex-col gap-1 mb-8">
                <h3 className="text-3xl font-bold text-text-main tracking-tight leading-tight font-sans">
                  {getReportHeading()}
                </h3>
                <p className="text-xs text-secondary font-bold mt-1 font-sans">
                  {reportData.displaySubDays}
                </p>
              </div>

              <div className="z-10 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-text-sub font-bold font-sans">
                    TOTAL FOCUS
                  </span>
                  <span className="text-2xl font-bold text-text-main font-sans">
                    {reportData.displayHours}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-text-sub font-bold font-sans">SESSIONS</span>
                  <span className="text-2xl font-bold text-text-main font-sans">
                    {reportData.displayPomos}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => setShowReport(false)}
                aria-label="Close"
                className="flex items-center justify-center p-3.5 rounded-2xl transition-all border border-border text-primary bg-[#F4F0E8] hover:bg-border active:scale-95 shadow-2xs"
              >
                <XIcon size={20} strokeWidth={2} />
              </button>
              <button
                onClick={handleCopyReport}
                className="flex-1 flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-[#F4F0E8] text-text-main font-semibold font-sans text-xs hover:bg-border active:scale-[0.98] transition-all border border-border shadow-2xs"
              >
                {copied ? <CheckIcon size={16} strokeWidth={2.5} className="text-secondary" /> : <CopyIcon size={16} strokeWidth={2} />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
              <button
                onClick={handleShareReport}
                className="flex-1 flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-primary text-white font-semibold font-sans text-xs hover:bg-primary-hover active:scale-[0.98] transition-all shadow-md shadow-primary/25 ring-1 ring-white/20"
              >
                <Share2 size={16} strokeWidth={2} />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Project Modal */}
      {projectToDelete && createPortal(
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fadeIn"
          style={{
            background: 'rgba(25, 29, 21, 0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          onClick={() => setProjectToDelete(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6 flex flex-col gap-5 border border-border bg-surface shadow-2xl ring-1 ring-white/80"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-2">
              <span className="text-lg font-bold text-text-main font-sans">
                Delete Category?
              </span>
              <p className="text-sm text-text-sub font-sans leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-text-main">{toTitleCase(projectToDelete.name.replace(/^[0-9]+\s*(\/\/|·|\.)\s*/, '').replace(/_/g, ' '))}</span> and all of its associated tasks?
              </p>
            </div>
            
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => setProjectToDelete(null)}
                className="flex-1 p-3 rounded-2xl border border-border text-text-main bg-surface-hover hover:bg-border font-sans font-semibold text-sm transition-colors shadow-2xs active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (window.navigator?.vibrate) window.navigator.vibrate(20);
                  if (onDeleteProject) onDeleteProject(projectToDelete.id);
                  setProjectToDelete(null);
                }}
                className="flex-1 p-3 rounded-2xl border border-transparent text-white bg-[#BA1A1A] hover:opacity-90 font-sans font-semibold text-sm transition-opacity shadow-md shadow-[#BA1A1A]/20 active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </main>
  );
}

export default React.memo(ProfileView);
