import React, { useState, startTransition } from 'react';
import { createPortal } from 'react-dom';
import {
  Clock,
  Volume2,
  VolumeX,
  Headphones,
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  X,
  Loader2,
  Shield,
  Coffee,
  CloudRain,
  Trees,
  Waves,
} from 'lucide-react';
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

const SOUNDSCAPES = [
  { id: 'none', label: 'Silent', Icon: VolumeX },
  { id: 'forest', label: 'Forest', Icon: Trees },
  { id: 'rain', label: 'Rain', Icon: CloudRain },
  { id: 'waves', label: 'Waves', Icon: Waves },
  { id: 'cafe', label: 'Cafe', Icon: Coffee },
  { id: 'clock', label: 'Clock', Icon: Clock },
];

function ProfileView({
  settings = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    dailyGoalHours: 4.0,
    strictMode: false,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    keepAwake: true,
    liveNotification: true,
    soundscape: 'none',
    soundVolume: 0.8,
  },
  onUpdateSettings,
  onResetAllData,
  projects = [],
  onAddProject,
  onEditProject,
  onDeleteProject,
}) {
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // 'reset' | 'restore' | null
  const [backupStatus, setBackupStatus] = useState('idle');
  const [backupMsg, setBackupMsg] = useState('');
  const [customModal, setCustomModal] = useState(null);
  const [customVal, setCustomVal] = useState(25);

  const handleChange = (key, value) => {
    if (onUpdateSettings) {
      startTransition(() => {
        onUpdateSettings({ ...settings, [key]: value });
      });
    }
  };

  const handleResetData = () => {
    if (window.navigator?.vibrate) window.navigator.vibrate(15);
    setConfirmAction('reset');
  };

  const executeResetData = () => {
    if (window.navigator?.vibrate) window.navigator.vibrate(20);
    setConfirmAction(null);
    if (onResetAllData) onResetAllData();
  };

  const handleBackup = async () => {
    try {
      setBackupStatus('backing-up');
      setBackupMsg('');
      const data = await storage.exportAllData();
      const stringData = JSON.stringify(data, null, 2);
      const fileName = `focus_backup_${new Date().toISOString().split('T')[0]}.json`;

      const result = await Filesystem.writeFile({
        path: fileName,
        data: stringData,
        directory: Directory.Cache,
        encoding: 'utf8',
      });

      await Share.share({
        title: 'Focus Backup',
        text: 'Backup file for Focus app',
        url: result.uri,
        dialogTitle: 'Save or Share Backup',
      });

      setBackupStatus('idle');
      setBackupMsg('Backup exported successfully');
    } catch (e) {
      setBackupStatus('idle');
      setBackupMsg(`Error: ${e.message}`);
    }
  };

  const handleRestore = () => {
    if (window.navigator?.vibrate) window.navigator.vibrate(15);
    setConfirmAction('restore');
  };

  const executeRestore = async () => {
    if (window.navigator?.vibrate) window.navigator.vibrate(15);
    setConfirmAction(null);
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
          setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
          setBackupStatus('idle');
          setBackupMsg(`Parse Error: ${err.message}`);
        }
      };
      input.click();
    } catch (e) {
      setBackupStatus('idle');
      setBackupMsg(`Error: ${e.message}`);
    }
  };

  return (
    <main className="flex-1 w-full bg-[#F0F2EF] pt-14 pb-36 min-h-[100dvh] overflow-y-auto relative text-[#1B1F1A] select-none">
      <div className="flex flex-col w-full max-w-[440px] mx-auto px-5 gap-4">
        {/* ── Profile & Settings Header ── */}
        <header className="flex items-center justify-between pb-1">
          <div className="flex flex-col">
            <h1 className="text-[22px] font-extrabold leading-[28px] tracking-[-0.4px] text-[#1B1F1A] font-sans">
              Settings
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-[2px] text-[#667463]">
              PROFILE & PREFERENCES
            </span>
          </div>
        </header>

        {/* ── 1. TIMER DURATIONS & SETUP ── */}
        <section className="bg-white rounded-[18px] p-5 border border-[#D6E0D4] shadow-[0px_2px_8px_rgba(27,31,26,0.031)] flex flex-col gap-4">
          <div className="flex items-center justify-between pb-1 border-b border-[#D6E0D4]/60">
            <span className="text-[11px] font-extrabold uppercase tracking-[1.2px] text-[#8B9E87] font-sans">
              TIMER DURATIONS
            </span>
            <Clock size={14} className="text-[#667463]" />
          </div>

          {[
            {
              key: 'workDuration',
              label: 'Focus Session',
              presets: [20, 25, 45, 50, 60],
              min: 1,
              max: 180,
              unit: 'm',
            },
            {
              key: 'shortBreakDuration',
              label: 'Short Break',
              presets: [3, 5, 10, 15],
              min: 1,
              max: 60,
              unit: 'm',
            },
            {
              key: 'longBreakDuration',
              label: 'Long Break',
              presets: [15, 20, 30, 45],
              min: 1,
              max: 90,
              unit: 'm',
            },
          ].map(({ key, label, presets, min, max, unit }) => {
            const currentVal = settings[key] ?? presets[0];
            const isCustom = !presets.some((p) => Number(p) === Number(currentVal));
            const totalSlots = presets.length + 1; // presets + custom button
            const activeIdx = presets.findIndex((p) => Number(p) === Number(currentVal));
            const selectedIdx = isCustom ? presets.length : (activeIdx !== -1 ? activeIdx : 0);

            return (
              <div key={key} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium text-[#1B1F1A]">{label}</span>
                  <span className="text-[12px] font-bold text-[#1B1F1A]">
                    {currentVal}
                    {unit}
                  </span>
                </div>

                <div className="relative flex items-center p-1 bg-[#E8EDE6] rounded-full overflow-hidden">
                  {/* Fluid sliding pill indicator */}
                  <div
                    aria-hidden="true"
                    className="absolute top-1 bottom-1 bg-[#1B1F1A] rounded-full shadow-[0px_1px_2px_rgba(27,31,26,0.1)] pointer-events-none transition-transform duration-250 ease-[cubic-bezier(0.25,1,0.5,1)]"
                    style={{
                      left: '4px',
                      width: `calc((100% - 8px) / ${totalSlots})`,
                      transform: `translate3d(calc(${selectedIdx} * 100%), 0, 0)`,
                      willChange: 'transform',
                    }}
                  />

                  {presets.map((p) => {
                    const isActive = Number(currentVal) === Number(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          if (window.navigator?.vibrate) window.navigator.vibrate(10);
                          handleChange(key, p);
                        }}
                        className={`tap-effect flex-1 h-[26px] rounded-full text-[11px] relative z-10 transition-colors duration-150 flex items-center justify-center select-none ${
                          isActive
                            ? 'text-white font-bold'
                            : 'text-[#667463] hover:text-[#1B1F1A] font-medium'
                        }`}
                      >
                        <span className="relative z-10">{p}m</span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      if (window.navigator?.vibrate) window.navigator.vibrate(10);
                      setCustomModal({ key, label, min, max, unit: 'm', step: 1 });
                      setCustomVal(currentVal);
                    }}
                    className={`tap-effect flex-1 h-[26px] rounded-full text-[11px] relative z-10 transition-colors duration-150 flex items-center justify-center select-none ${
                      isCustom
                        ? 'text-white font-bold'
                        : 'text-[#667463] hover:text-[#1B1F1A] font-medium'
                    }`}
                  >
                    <span className="relative z-10">{isCustom ? `${currentVal}m` : 'Custom'}</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* Long Break Interval Cycles */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-[#1B1F1A]">Long Break Interval</span>
              <span className="text-[12px] font-bold text-[#1B1F1A]">
                Every {settings.longBreakInterval || 4} sessions
              </span>
            </div>
            <div className="relative flex items-center p-1 bg-[#E8EDE6] rounded-full overflow-hidden">
              {/* Fluid sliding pill indicator */}
              {(() => {
                const intervalPresets = [2, 3, 4, 5];
                const activeIdx = intervalPresets.findIndex((c) => Number(c) === Number(settings.longBreakInterval || 4));
                if (activeIdx !== -1) {
                  return (
                    <div
                      aria-hidden="true"
                      className="absolute top-1 bottom-1 w-[calc((100%-8px)/4)] bg-[#1B1F1A] rounded-full shadow-[0px_1px_2px_rgba(27,31,26,0.1)] pointer-events-none transition-transform duration-250 ease-[cubic-bezier(0.25,1,0.5,1)]"
                      style={{
                        left: '4px',
                        transform: `translate3d(calc(${activeIdx} * 100%), 0, 0)`,
                        willChange: 'transform',
                      }}
                    />
                  );
                }
                return null;
              })()}
              {[2, 3, 4, 5].map((count) => {
                const isActive = Number(settings.longBreakInterval || 4) === Number(count);
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => {
                      if (window.navigator?.vibrate) window.navigator.vibrate(10);
                      handleChange('longBreakInterval', count);
                    }}
                    className={`tap-effect flex-1 h-[26px] rounded-full text-[11px] relative z-10 transition-colors duration-150 flex items-center justify-center select-none ${
                      isActive
                        ? 'text-white font-bold'
                        : 'text-[#667463] hover:text-[#1B1F1A] font-medium'
                    }`}
                  >
                    <span className="relative z-10">{count} cycles</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily Target Goal */}
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-[#1B1F1A]">Daily Target Goal</span>
              <span className="text-[12px] font-bold text-[#1B1F1A]">
                {(Number(settings.dailyGoalHours) || 4.0).toFixed(1)}h / day
              </span>
            </div>
            <div className="relative flex items-center p-1 bg-[#E8EDE6] rounded-full overflow-hidden">
              {/* Fluid sliding pill indicator */}
              {(() => {
                const goalPresets = [2.0, 4.0, 6.0, 8.0];
                const curGoal = Number(settings.dailyGoalHours) || 4.0;
                const isCustom = !goalPresets.some((h) => Number(h) === curGoal);
                const activeIdx = goalPresets.findIndex((h) => Number(h) === curGoal);
                const selectedIdx = isCustom ? goalPresets.length : (activeIdx !== -1 ? activeIdx : 1);
                return (
                  <div
                    aria-hidden="true"
                    className="absolute top-1 bottom-1 w-[calc((100%-8px)/5)] bg-[#1B1F1A] rounded-full shadow-[0px_1px_2px_rgba(27,31,26,0.1)] pointer-events-none transition-transform duration-250 ease-[cubic-bezier(0.25,1,0.5,1)]"
                    style={{
                      left: '4px',
                      transform: `translate3d(calc(${selectedIdx} * 100%), 0, 0)`,
                      willChange: 'transform',
                    }}
                  />
                );
              })()}
              {[2.0, 4.0, 6.0, 8.0].map((h) => {
                const isActive = Number(settings.dailyGoalHours || 4.0) === Number(h);
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      if (window.navigator?.vibrate) window.navigator.vibrate(10);
                      handleChange('dailyGoalHours', h);
                    }}
                    className={`tap-effect flex-1 h-[26px] rounded-full text-[11px] relative z-10 transition-colors duration-150 flex items-center justify-center select-none ${
                      isActive
                        ? 'text-white font-bold'
                        : 'text-[#667463] hover:text-[#1B1F1A] font-medium'
                    }`}
                  >
                    <span className="relative z-10">{h}h</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => {
                  if (window.navigator?.vibrate) window.navigator.vibrate(10);
                  setCustomModal({
                    key: 'dailyGoalHours',
                    label: 'Daily Target Goal',
                    min: 0.5,
                    max: 16,
                    unit: 'h',
                    step: 0.5,
                  });
                  setCustomVal(Number(settings.dailyGoalHours) || 4.0);
                }}
                className={`tap-effect flex-1 h-[26px] rounded-full text-[11px] relative z-10 transition-colors duration-150 flex items-center justify-center select-none ${
                  ![2.0, 4.0, 6.0, 8.0].some((h) => Number(h) === Number(settings.dailyGoalHours || 4.0))
                    ? 'text-white font-bold'
                    : 'text-[#667463] hover:text-[#1B1F1A] font-medium'
                }`}
              >
                <span className="relative z-10">
                  {![2.0, 4.0, 6.0, 8.0].some((h) => Number(h) === Number(settings.dailyGoalHours || 4.0))
                    ? `${settings.dailyGoalHours}h`
                    : 'Custom'}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* ── 2. FOCUS & AUTOMATION RULES (SYNCED STRICT MODE) ── */}
        <section className="bg-white rounded-[18px] p-5 border border-[#D6E0D4] shadow-[0px_2px_8px_rgba(27,31,26,0.031)] flex flex-col gap-4">
          <div className="flex items-center justify-between pb-1 border-b border-[#D6E0D4]/60">
            <span className="text-[11px] font-extrabold uppercase tracking-[1.2px] text-[#8B9E87] font-sans">
              FOCUS RULES & BEHAVIOR
            </span>
            <Shield size={14} className="text-[#667463]" />
          </div>

          {/* Strict Mode (Synced with Timer Screen) */}
          <div className="flex items-center justify-between py-1">
            <div className="flex flex-col pr-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-bold text-[#1B1F1A]">Strict Focus Mode</span>
                <span
                  className={`text-[9px] font-bold uppercase tracking-[0.8px] px-2 py-0.5 rounded-full transition-colors duration-200 ${
                    settings.strictMode ? 'bg-[#1B1F1A] text-white' : 'bg-[#E8EDE6] text-[#667463]'
                  }`}
                >
                  {settings.strictMode ? 'STRICT' : 'NORMAL'}
                </span>
              </div>
              <span className="text-[11px] text-[#667463] leading-snug mt-0.5">
                Syncs with timer toggle; alerts and pauses on app exit
              </span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={!!settings.strictMode}
              onClick={() => {
                if (window.navigator?.vibrate) window.navigator.vibrate(10);
                handleChange('strictMode', !settings.strictMode);
              }}
              className={`tap-effect w-11 h-6 rounded-full p-0.5 transition-colors duration-250 cursor-pointer shrink-0 ${
                settings.strictMode ? 'bg-[#1B1F1A]' : 'bg-[#CBD7C9]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-250 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  settings.strictMode ? 'translate-x-5' : 'translate-x-0'
                }`}
                style={{ willChange: 'transform' }}
              />
            </button>
          </div>

          {/* Auto-Start Breaks */}
          <div className="flex items-center justify-between py-1 border-t border-[#D6E0D4]/40 pt-3">
            <div className="flex flex-col pr-4">
              <span className="text-[13px] font-medium text-[#1B1F1A]">Auto-Start Breaks</span>
              <span className="text-[11px] text-[#667463] leading-snug mt-0.5">
                Begin break countdown automatically when focus ends
              </span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={!!settings.autoStartBreaks}
              onClick={() => {
                if (window.navigator?.vibrate) window.navigator.vibrate(10);
                handleChange('autoStartBreaks', !settings.autoStartBreaks);
              }}
              className={`tap-effect w-11 h-6 rounded-full p-0.5 transition-colors duration-250 cursor-pointer shrink-0 ${
                settings.autoStartBreaks ? 'bg-[#1B1F1A]' : 'bg-[#CBD7C9]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-250 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  settings.autoStartBreaks ? 'translate-x-5' : 'translate-x-0'
                }`}
                style={{ willChange: 'transform' }}
              />
            </button>
          </div>

          {/* Auto-Start Pomodoros */}
          <div className="flex items-center justify-between py-1 border-t border-[#D6E0D4]/40 pt-3">
            <div className="flex flex-col pr-4">
              <span className="text-[13px] font-medium text-[#1B1F1A]">Auto-Start Focus</span>
              <span className="text-[11px] text-[#667463] leading-snug mt-0.5">
                Begin next focus session automatically when break ends
              </span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={!!settings.autoStartPomodoros}
              onClick={() => {
                if (window.navigator?.vibrate) window.navigator.vibrate(10);
                handleChange('autoStartPomodoros', !settings.autoStartPomodoros);
              }}
              className={`tap-effect w-11 h-6 rounded-full p-0.5 transition-colors duration-250 cursor-pointer shrink-0 ${
                settings.autoStartPomodoros ? 'bg-[#1B1F1A]' : 'bg-[#CBD7C9]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-250 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  settings.autoStartPomodoros ? 'translate-x-5' : 'translate-x-0'
                }`}
                style={{ willChange: 'transform' }}
              />
            </button>
          </div>

          {/* Keep Screen Awake */}
          <div className="flex items-center justify-between py-1 border-t border-[#D6E0D4]/40 pt-3">
            <div className="flex flex-col pr-4">
              <span className="text-[13px] font-medium text-[#1B1F1A]">Keep Screen Awake</span>
              <span className="text-[11px] text-[#667463] leading-snug mt-0.5">
                Prevent display from sleeping during active sessions
              </span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={!!settings.keepAwake}
              onClick={() => {
                if (window.navigator?.vibrate) window.navigator.vibrate(10);
                handleChange('keepAwake', !settings.keepAwake);
              }}
              className={`tap-effect w-11 h-6 rounded-full p-0.5 transition-colors duration-250 cursor-pointer shrink-0 ${
                settings.keepAwake ? 'bg-[#1B1F1A]' : 'bg-[#CBD7C9]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-250 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  settings.keepAwake ? 'translate-x-5' : 'translate-x-0'
                }`}
                style={{ willChange: 'transform' }}
              />
            </button>
          </div>

          {/* Background Live Notification */}
          <div className="flex items-center justify-between py-1 border-t border-[#D6E0D4]/40 pt-3">
            <div className="flex flex-col pr-4">
              <span className="text-[13px] font-medium text-[#1B1F1A]">Live Notification</span>
              <span className="text-[11px] text-[#667463] leading-snug mt-0.5">
                Display ongoing timer progress in notification tray
              </span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={!!settings.liveNotification}
              onClick={() => {
                if (window.navigator?.vibrate) window.navigator.vibrate(10);
                handleChange('liveNotification', !settings.liveNotification);
              }}
              className={`tap-effect w-11 h-6 rounded-full p-0.5 transition-colors duration-250 cursor-pointer shrink-0 ${
                settings.liveNotification ? 'bg-[#1B1F1A]' : 'bg-[#CBD7C9]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-250 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  settings.liveNotification ? 'translate-x-5' : 'translate-x-0'
                }`}
                style={{ willChange: 'transform' }}
              />
            </button>
          </div>
        </section>

        {/* ── 3. SOUND & ATMOSPHERE ── */}
        <section className="bg-white rounded-[18px] p-5 border border-[#D6E0D4] shadow-[0px_2px_8px_rgba(27,31,26,0.031)] flex flex-col gap-4">
          <div className="flex items-center justify-between pb-1 border-b border-[#D6E0D4]/60">
            <span className="text-[11px] font-extrabold uppercase tracking-[1.2px] text-[#8B9E87] font-sans">
              SOUND & ATMOSPHERE
            </span>
            <Headphones size={14} className="text-[#667463]" />
          </div>

          {/* Soundscape Pills */}
          <div className="grid grid-cols-3 gap-2">
            {SOUNDSCAPES.map(({ id, label, Icon }) => {
              const isSelected = (settings.soundscape || 'none') === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    if (window.navigator?.vibrate) window.navigator.vibrate(10);
                    handleChange('soundscape', id);
                  }}
                  className={`tap-effect h-[38px] rounded-xl flex items-center justify-center gap-1.5 border transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)] ${
                    isSelected
                      ? 'bg-[#1B1F1A] border-[#1B1F1A] text-white shadow-xs scale-[1.02]'
                      : 'bg-[#F0F2EF] border-[#D6E0D4]/60 text-[#667463] hover:text-[#1B1F1A] hover:bg-[#E8EDE6]'
                  }`}
                  style={{ willChange: 'transform' }}
                >
                  <Icon size={14} />
                  <span className="text-[11px] font-semibold">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Volume Slider */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <VolumeX size={15} className="text-[#8B9E87] shrink-0" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.soundVolume ?? 0.8}
              onChange={(e) => handleChange('soundVolume', parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-[#E8EDE6] rounded-full accent-[#1B1F1A] cursor-pointer"
            />
            <Volume2 size={15} className="text-[#667463] shrink-0" />
            <span className="text-[11px] font-bold text-[#1B1F1A] w-9 text-right font-sans">
              {Math.round((settings.soundVolume ?? 0.8) * 100)}%
            </span>
          </div>
        </section>

        {/* ── 4. FOCUS CATEGORIES / PROJECTS ── */}
        <section className="bg-white rounded-[18px] p-5 border border-[#D6E0D4] shadow-[0px_2px_8px_rgba(27,31,26,0.031)] flex flex-col gap-3">
          <div className="flex items-center justify-between pb-1 border-b border-[#D6E0D4]/60">
            <span className="text-[11px] font-extrabold uppercase tracking-[1.2px] text-[#8B9E87] font-sans">
              FOCUS CATEGORIES
            </span>
            <button
              onClick={() => {
                if (window.navigator?.vibrate) window.navigator.vibrate(10);
                if (onAddProject) onAddProject();
              }}
              className="tap-effect flex items-center gap-1 text-[11px] font-bold text-[#1B1F1A] hover:opacity-75 transition-opacity"
            >
              <Plus size={14} />
              <span>Add</span>
            </button>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            {projects.map((proj) => {
              const cleanName = proj.name
                .replace(/^[0-9]+\s*(\/\/|·|\.)\s*/, '')
                .replace(/_/g, ' ');
              const displayName = toTitleCase(cleanName);
              return (
                <div
                  key={proj.id}
                  className="h-[44px] bg-[#F0F2EF] rounded-xl px-3.5 flex items-center justify-between border border-[#D6E0D4]/50"
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: proj.color || '#41493F' }}
                    />
                    <span className="text-[12px] font-semibold text-[#1B1F1A] truncate font-sans">
                      {displayName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        if (window.navigator?.vibrate) window.navigator.vibrate(10);
                        if (onEditProject) onEditProject(proj);
                      }}
                      aria-label="Edit category"
                      className="tap-effect w-7 h-7 rounded-lg text-[#667463] hover:text-[#1B1F1A] flex items-center justify-center transition-colors"
                    >
                      <Edit2 size={13} />
                    </button>
                    {projects.length > 1 && (
                      <button
                        onClick={() => {
                          if (window.navigator?.vibrate) window.navigator.vibrate(10);
                          setProjectToDelete(proj);
                        }}
                        aria-label="Delete category"
                        className="tap-effect w-7 h-7 rounded-lg text-[#BA1A1A] hover:bg-[#BA1A1A]/10 flex items-center justify-center transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 5. DATA & BACKUP ── */}
        <section className="bg-white rounded-[18px] p-5 border border-[#D6E0D4] shadow-[0px_2px_8px_rgba(27,31,26,0.031)] flex flex-col gap-3">
          <div className="flex items-center justify-between pb-1 border-b border-[#D6E0D4]/60">
            <span className="text-[11px] font-extrabold uppercase tracking-[1.2px] text-[#8B9E87] font-sans">
              DATA MANAGEMENT
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleBackup}
              disabled={backupStatus !== 'idle'}
              className="tap-effect h-[38px] rounded-xl bg-[#1B1F1A] text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {backupStatus === 'backing-up' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} />
              )}
              <span>Export</span>
            </button>

            <button
              onClick={handleRestore}
              disabled={backupStatus !== 'idle'}
              className="tap-effect h-[38px] rounded-xl bg-[#F0F2EF] text-[#1B1F1A] border border-[#D6E0D4] text-[12px] font-semibold flex items-center justify-center gap-1.5 hover:bg-[#E8EDE6] transition-colors disabled:opacity-50"
            >
              {backupStatus === 'restoring' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              <span>Restore</span>
            </button>
          </div>

          {backupMsg && (
            <p
              className={`text-[11px] text-center pt-1 ${
                backupMsg.startsWith('Error') ? 'text-[#BA1A1A]' : 'text-[#588157]'
              }`}
            >
              {backupMsg}
            </p>
          )}

          <div className="pt-2 border-t border-[#D6E0D4]/60 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[12px] font-semibold text-[#1B1F1A]">Wipe All Data</span>
              <span className="text-[10px] text-[#8B9E87]">Delete all tasks and telemetry</span>
            </div>
            <button
              onClick={handleResetData}
              className="tap-effect h-[28px] px-3 rounded-full bg-[#BA1A1A]/10 text-[#BA1A1A] border border-[#BA1A1A]/20 text-[10px] font-bold tracking-wider hover:bg-[#BA1A1A]/15 transition-colors"
            >
              RESET
            </button>
          </div>
        </section>

        {/* ── App Version & Credit Footer ── */}
        <footer className="flex flex-col items-center justify-center pt-5 text-center select-none gap-3.5">
          {/* Stylized Styro FOCUS with Gradient */}
          <div className="flex flex-col items-center w-full">
            <span className="font-styro text-9xl bg-gradient-to-b from-[#1B1F1A] via-[#41493F]  bg-clip-text text-transparent uppercase select-none leading-none">
              FOCUS
            </span>
            <span className="text-[12px] font-medium text-[#667463] mt-2 tracking-wide">
              Focus 1.0.1 by <span className="font-bold text-[#1B1F1A]">Muhamad Yazri</span>
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] text-[#8B9E87]/70 mt-0.5">
              Make for smooth flowwwwwwwwwwwwwww.
            </span>
          </div>

          {/* Social Links with Tactile Capsule Buttons */}
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/MuhamadYazri"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub - Muhamad Yazri"
              className="tap-effect w-9 h-9 rounded-full  flex items-center justify-center text-[#1B1F1A] cursor-pointer"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/Yqzriii"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram - Yqzriii"
              className="tap-effect w-9 h-9 rounded-full flex items-center justify-center text-[#1B1F1A] transition-all cursor-pointer"
            >
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/muhamad-yazri-165b4b34b"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn - Muhamad Yazri"
              className="tap-effect w-9 h-9 rounded-full flex items-center justify-center text-[#1B1F1A] cursor-pointer"
            >
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.79v8.37H6.46v-8.37M7.86 6.54a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26z" />
              </svg>
            </a>
          </div>
        </footer>
      </div>

      {/* ── Custom Duration Modal ── */}
      {customModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fadeIn select-none"
            style={{
              background: 'rgba(27, 31, 26, 0.45)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            onClick={() => setCustomModal(null)}
          >
            <div
              className="w-full max-w-xs bg-white border border-[#D6E0D4] rounded-[24px] p-5 shadow-2xl flex flex-col gap-4 animate-slideUp"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#D6E0D4]">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-[#8B9E87] tracking-[1px] uppercase">
                    CUSTOM VALUE
                  </span>
                  <h3 className="text-[14px] font-bold text-[#1B1F1A]">{customModal.label}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomModal(null)}
                  className="w-7 h-7 rounded-full bg-[#F0F2EF] flex items-center justify-center text-[#667463]"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="flex items-center justify-center gap-4 py-2">
                <button
                  type="button"
                  onClick={() => {
                    const step = customModal.step || 1;
                    setCustomVal((v) => Math.max(customModal.min, Number((v - step).toFixed(1))));
                  }}
                  className="tap-effect w-10 h-10 rounded-full bg-[#F0F2EF] border border-[#D6E0D4] flex items-center justify-center text-xl font-bold text-[#1B1F1A]"
                >
                  -
                </button>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    step={customModal.step || 1}
                    min={customModal.min}
                    max={customModal.max}
                    value={customVal}
                    onChange={(e) => {
                      const num = parseFloat(e.target.value);
                      if (!isNaN(num)) {
                        setCustomVal(Math.min(customModal.max, Math.max(customModal.min, num)));
                      }
                    }}
                    className="w-16 text-center text-3xl font-extrabold text-[#1B1F1A] bg-transparent outline-none border-b-2 border-[#1B1F1A]"
                  />
                  <span className="text-sm font-bold text-[#8B9E87]">{customModal.unit}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const step = customModal.step || 1;
                    setCustomVal((v) => Math.min(customModal.max, Number((v + step).toFixed(1))));
                  }}
                  className="tap-effect w-10 h-10 rounded-full bg-[#F0F2EF] border border-[#D6E0D4] flex items-center justify-center text-xl font-bold text-[#1B1F1A]"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (window.navigator?.vibrate) window.navigator.vibrate(10);
                  handleChange(customModal.key, customVal);
                  setCustomModal(null);
                }}
                className="tap-effect w-full h-[40px] rounded-full bg-[#1B1F1A] text-white font-bold text-[12px] shadow-sm"
              >
                Save
              </button>
            </div>
          </div>,
          document.body
        )}

      {/* ── Delete Project Modal ── */}
      {projectToDelete &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fadeIn"
            style={{
              background: 'rgba(27, 31, 26, 0.45)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            onClick={() => setProjectToDelete(null)}
          >
            <div
              className="w-full max-w-sm rounded-[24px] p-5 flex flex-col gap-4 border border-[#D6E0D4] bg-white shadow-2xl animate-slideUp"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-1">
                <span className="text-[16px] font-bold text-[#1B1F1A]">Delete Category?</span>
                <p className="text-[12px] text-[#667463] leading-relaxed">
                  Are you sure you want to delete{' '}
                  <span className="font-semibold text-[#1B1F1A]">
                    {toTitleCase(
                      projectToDelete.name
                        .replace(/^[0-9]+\s*(\/\/|·|\.)\s*/, '')
                        .replace(/_/g, ' ')
                    )}
                  </span>
                  ?
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setProjectToDelete(null)}
                  className="tap-effect flex-1 h-[40px] rounded-full border border-[#D6E0D4] bg-[#F0F2EF] text-[#1B1F1A] font-bold text-[12px]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (window.navigator?.vibrate) window.navigator.vibrate(20);
                    if (onDeleteProject) onDeleteProject(projectToDelete.id);
                    setProjectToDelete(null);
                  }}
                  className="tap-effect flex-1 h-[40px] rounded-full bg-[#BA1A1A] text-white font-bold text-[12px] shadow-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ── Reset / Restore Confirmation Modal ── */}
      {confirmAction &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fadeIn select-none"
            style={{
              background: 'rgba(27, 31, 26, 0.45)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            onClick={() => setConfirmAction(null)}
          >
            <div
              className="w-full max-w-sm rounded-[24px] p-5 flex flex-col gap-4 border border-[#D6E0D4] bg-white shadow-2xl animate-slideUp"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-1">
                <span className="text-[16px] font-bold text-[#1B1F1A]">
                  {confirmAction === 'reset' ? 'Wipe All Data?' : 'Restore Backup?'}
                </span>
                <p className="text-[12px] text-[#667463] leading-relaxed">
                  {confirmAction === 'reset'
                    ? 'Are you sure you want to completely reset all tasks, categories, and focus telemetry? This cannot be undone.'
                    : 'Restoring from a backup file will overwrite your current tasks, categories, and focus history. Continue?'}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="tap-effect flex-1 h-[40px] rounded-full border border-[#D6E0D4] bg-[#F0F2EF] text-[#1B1F1A] font-bold text-[12px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmAction === 'reset' ? executeResetData : executeRestore}
                  className={`tap-effect flex-1 h-[40px] rounded-full text-white font-bold text-[12px] shadow-sm ${
                    confirmAction === 'reset' ? 'bg-[#BA1A1A]' : 'bg-[#1B1F1A]'
                  }`}
                >
                  {confirmAction === 'reset' ? 'Wipe Data' : 'Choose File'}
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
