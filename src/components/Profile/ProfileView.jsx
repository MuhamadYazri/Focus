import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import SharedActivitySection from '../Analytics/SharedActivitySection';
import { storage } from '../../services/storage';
import { backupToDrive, restoreFromDrive } from '../../services/googleDriveBackup';

const G = "'Poppins', sans-serif";
const M = "'Poppins', sans-serif";

export default function ProfileView({
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
}) {
  const [showReport, setShowReport] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const realSessions = (sessions || []).filter((s) => s && s.id && s.id.length > 15);
  const baseMinutes = 758 * 60 + 26;
  const totalMinutes = Math.round(realSessions.reduce((acc, s) => acc + (s.duration || 25), baseMinutes));
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const totalHoursDisplay = `${hours}h ${String(mins).padStart(2, '0')}m`;

  const totalPomos = realSessions.length + 10008;
  const totalDays = 600;

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
        'Are you sure you want to reset all telemetry data and tasks to default values?'
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
      await backupToDrive(data);
      const now = new Date().toLocaleString();
      setBackupStatus('idle');
      setBackupMsg(`Backed up: ${now}`);
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
      const data = await restoreFromDrive();
      await storage.importAllData(data);
      setBackupStatus('idle');
      setBackupMsg('Restored! Reloading...');
      setTimeout(() => window.location.reload(), 1200);
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

  return (
    <main className="flex-1 w-full bg-[#F9FBEE] pt-safe pb-32 selection:bg-[#E5D9B6] selection:text-[#40513B]">
      <div className="flex flex-col w-full max-w-md mx-auto px-5 pt-4 gap-4">
        
        {/* ── Activity ── */}
        <SharedActivitySection showKPIs={false} sessions={sessions} onPeriodChange={setReportData} />

        {/* ── 3 Key Metric Cards ── */}
        <div className="grid grid-cols-3 gap-3">
          {/* Streak */}
          <div className="bg-white rounded-2xl p-4 flex flex-col items-center text-center justify-center gap-1.5 shadow-sm border border-[#EDE7DA]">
            <svg fill="none" height="24" stroke="#E67E22" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24">
              <path d="M12 21.5C16.1421 21.5 19.5 18.1421 19.5 14C19.5 10.5 17 8 15 5.5C14.5 9 12 10 10.5 7.5C9.5 10.5 7.5 12 6.5 13.5C5.5 15 4.5 16.5 4.5 18C4.5 19.933 6.067 21.5 8 21.5"></path>
              <path d="M12 21.5C13.5 21.5 15 20 15 18.5C15 16.5 13.5 15.5 12 14C10.5 15.5 9.5 16.5 9.5 18.5C9.5 20 10.5 21.5 12 21.5Z"></path>
            </svg>
            <span className="text-2xl font-bold text-[#191D15] font-sans">14</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#747870] font-sans">DAY STREAK</span>
          </div>
          {/* Focused */}
          <div className="bg-white rounded-2xl p-4 flex flex-col items-center text-center justify-center gap-1.5 shadow-sm border border-[#EDE7DA]">
            <svg fill="none" height="24" stroke="#628141" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24">
              <circle cx="12" cy="13" r="9"></circle>
              <path d="M12 9V13L15 15"></path>
              <path d="M10 2H14"></path>
            </svg>
            <span className="text-2xl font-bold text-[#191D15] font-sans">{hours}h</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#747870] font-sans">FOCUSED</span>
          </div>
          {/* Sessions */}
          <div className="bg-white rounded-2xl p-4 flex flex-col items-center text-center justify-center gap-1.5 shadow-sm border border-[#EDE7DA]">
            <svg fill="none" height="24" stroke="#40513B" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M8.5 12.5L11 15L16 9"></path>
            </svg>
            <span className="text-xl font-bold text-[#191D15] font-sans">{totalPomos.toLocaleString()}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#747870] font-sans">SESSIONS</span>
          </div>
        </div>

        {/* ── Primary Action: Share Profile ── */}
        <button
          onClick={() => { if (window.navigator?.vibrate) window.navigator.vibrate(15); setShowReport(true); }}
          className="w-full h-12 py-3 px-5 rounded-full bg-[#40513B] text-white font-semibold text-sm flex items-center justify-center gap-2.5 shadow-sm active:scale-[0.99] hover:bg-[#344230] transition-all"
        >
          <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18">
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
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#747870] font-sans">FOCUS CATEGORIES</h2>
            <button
              onClick={() => { if (window.navigator?.vibrate) window.navigator.vibrate(10); if (onAddProject) onAddProject(); }}
              className="flex items-center gap-1 text-[#628141] text-xs font-bold hover:text-[#40513B] transition-colors"
            >
              <svg fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="15">
                <path d="M12 5V19"></path>
                <path d="M5 12H19"></path>
              </svg>
              <span className="font-sans">NEW</span>
            </button>
          </div>
          {projects.map((proj) => {
            const cleanName = proj.name.replace(/^[0-9]+\s*(\/\/|·|\.)\s*/, '').replace(/_/g, ' ');
            return (
              <div key={proj.id} className="bg-white rounded-full px-5 py-3.5 flex items-center justify-between shadow-sm border border-[#EDE7DA]">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: proj.color || '#40513B' }}></div>
                  <span className="text-xs font-bold text-[#191D15] tracking-wide font-sans truncate max-w-[140px]">{cleanName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { if (window.navigator?.vibrate) window.navigator.vibrate(10); if (onEditProject) onEditProject(proj); }} aria-label="Edit category" className="p-1 text-[#747870] hover:text-[#191D15] transition-colors flex items-center justify-center">
                    <svg fill="none" height="17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="17"><path d="M16.474 5.408l2.118 2.118m-.756-3.95a2.121 2.121 0 113 3L7.5 19.914 3 21l1.086-4.5 13.332-13.042z"></path></svg>
                  </button>
                  {projects.length > 1 && (
                    <button onClick={() => { if (window.navigator?.vibrate) window.navigator.vibrate(10); if (confirm(`Delete "${cleanName}" and its tasks?`)) { if (onDeleteProject) onDeleteProject(proj.id); } }} aria-label="Delete category" className="p-1 text-[#BA1A1A] hover:opacity-80 transition-opacity flex items-center justify-center">
                      <svg fill="none" height="17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="17"><path d="M19 6L18 20H6L5 6"></path><path d="M10 11V16"></path><path d="M14 11V16"></path><path d="M3 6H21"></path><path d="M9 6V3H15V6"></path></svg>
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
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-[#747870] font-sans">PREFERENCES</h2>
          </div>
          
          {/* Timer Durations Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4 border border-[#EDE7DA]">
            <div className="flex items-center gap-2 pb-1 border-b border-[#EDE7DA]">
              <svg fill="none" height="20" stroke="#628141" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20">
                <path d="M5 22H19"></path>
                <path d="M5 2H19"></path>
                <path d="M17 22V16.6C17 15.6 16.5 14.6 15.6 14L12 11.5L8.4 14C7.5 14.6 7 15.6 7 16.6V22"></path>
                <path d="M7 2V7.4C7 8.4 7.5 9.4 8.4 10L12 12.5L15.6 10C16.5 9.4 17 8.4 17 7.4V2"></path>
              </svg>
              <span className="text-sm font-bold text-[#191D15] font-sans">Timer Durations</span>
            </div>
            {[
              { key: 'workDuration', label: 'Focus Session', presets: [25, 45, 60] },
              { key: 'shortBreakDuration', label: 'Short Break', presets: [5, 10, 15] },
              { key: 'longBreakDuration', label: 'Long Break', presets: [15, 20, 30] },
            ].map(({ key, label, presets }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#191D15] font-sans">{label}</span>
                <div className="bg-[#F4F0E8] p-1 rounded-full flex items-center gap-1 border border-[#EDE7DA]">
                  {presets.map((p) => {
                    const isActive = (settings[key] ?? presets[0]) === p;
                    return (
                      <button
                        key={p} type="button"
                        onClick={() => { if (window.navigator?.vibrate) window.navigator.vibrate(10); handleChange(key, p); }}
                        className={`px-3 py-1 rounded-full text-xs font-sans transition-colors ${isActive ? 'bg-[#40513B] font-bold text-white shadow-sm' : 'text-[#576652] hover:text-[#191D15]'}`}
                      >{p}m</button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Daily Goal Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-3.5 border border-[#EDE7DA]">
            <div className="flex items-center justify-between pb-1 border-b border-[#EDE7DA]">
              <div className="flex items-center gap-2">
                <svg fill="none" height="20" stroke="#628141" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="6"></circle>
                  <circle cx="12" cy="12" r="2"></circle>
                </svg>
                <span className="text-sm font-bold text-[#191D15] font-sans">Daily Goal</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#191D15] font-sans">Target Hours</span>
              <span className="text-base font-bold text-[#40513B] font-sans">{settings.dailyGoalHours || 4.0}h</span>
            </div>
            <div className="grid grid-cols-4 gap-2 pt-1">
              {[2.0, 4.0, 6.0, 8.0].map((h) => {
                const isActive = (settings.dailyGoalHours || 4.0) === h;
                return (
                  <button
                    key={h} type="button"
                    onClick={() => { if (window.navigator?.vibrate) window.navigator.vibrate(10); handleChange('dailyGoalHours', h); }}
                    className={`py-1.5 rounded-full text-xs text-center font-sans transition-colors ${isActive ? 'bg-[#40513B] font-bold text-white shadow-sm' : 'bg-[#F4F0E8] text-[#191D15] border border-[#EDE7DA] hover:bg-[#EDE7DA]'}`}
                  >{h}h</button>
                );
              })}
            </div>
          </div>

          {/* System Toggles Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4 border border-[#EDE7DA]">
            {[
              { 
                key: 'keepAwake', label: 'Keep Screen Awake', desc: 'Prevent display from turning off',
                svg: <svg fill="none" height="20" stroke="#576652" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20"><rect height="20" rx="2" width="14" x="5" y="2"></rect><line x1="12" x2="12.01" y1="18" y2="18"></line></svg>
              },
              { 
                key: 'strictMode', label: 'Strict Mode', desc: 'Block tab switching while running',
                svg: <svg fill="none" height="20" stroke="#576652" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20"><rect height="11" rx="2" width="18" x="3" y="11"></rect><path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11"></path></svg>
              },
              { 
                key: 'liveNotification', label: 'Origin Island & Live Notif', desc: 'Persistent ticking countdown in background',
                svg: <svg fill="none" height="20" stroke="#576652" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20"><path d="M18 8C18 4.68629 15.3137 2 12 2C8.68629 2 6 4.68629 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"></path><path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"></path></svg>
              }
            ].map(({ key, label, desc, svg }) => {
              const isOn = !!settings[key];
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {svg}
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#191D15] font-sans">{label}</span>
                      <span className="text-[11px] text-[#8A7968] font-sans">{desc}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => { if (window.navigator?.vibrate) window.navigator.vibrate(10); handleChange(key, !isOn); }}
                    className={`w-11 h-6 rounded-full p-0.5 flex items-center shadow-inner cursor-pointer transition-all ${isOn ? 'bg-[#628141] justify-end' : 'bg-[#EDE7DA] justify-start'}`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow-sm transition-transform"></div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Cloud Backup Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-3 border border-[#EDE7DA]">
            <div className="flex items-center gap-2">
              <svg fill="none" height="20" stroke="#628141" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.36 0 10.91 0 14C0 17.31 2.69 20 6 20H19C21.76 20 24 17.76 24 15C24 12.36 21.95 10.22 19.35 10.04Z"></path>
              </svg>
              <span className="text-sm font-bold text-[#191D15] font-sans">Cloud Backup</span>
            </div>
            <p className="text-xs text-[#8A7968] font-sans">Sync your data to Google Drive for safe keeping</p>
            
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button onClick={handleBackup} disabled={backupStatus !== 'idle'} className="py-2.5 px-4 rounded-full bg-[#40513B] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] hover:bg-[#344230] transition-all disabled:opacity-50">
                {backupStatus === 'backing-up' ? <Loader2 size={16} className="animate-spin" /> : (
                  <svg fill="none" height="17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="17"><path d="M12 17V3"></path><path d="M6 9L12 3L18 9"></path><path d="M20 21H4"></path></svg>
                )}
                <span className="font-sans">{backupStatus === 'backing-up' ? 'Saving...' : 'Backup'}</span>
              </button>
              <button onClick={handleRestore} disabled={backupStatus !== 'idle'} className="py-2.5 px-4 rounded-full bg-[#F4F0E8] text-[#191D15] text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#EDE7DA] transition-colors border border-[#EDE7DA] active:scale-[0.98] disabled:opacity-50">
                {backupStatus === 'restoring' ? <Loader2 size={16} className="animate-spin" /> : (
                  <svg fill="none" height="17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="17"><path d="M12 3V17"></path><path d="M6 11L12 17L18 11"></path><path d="M20 21H4"></path></svg>
                )}
                <span className="font-sans">{backupStatus === 'restoring' ? 'Restoring...' : 'Restore'}</span>
              </button>
            </div>
            {backupMsg && (
              <p className={`text-[11px] font-sans pt-1 ${backupMsg.startsWith('Error') ? 'text-[#BA1A1A]' : 'text-[#628141]'}`}>{backupMsg}</p>
            )}
          </div>

          {/* Reset Telemetry Data Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between border border-[#EDE7DA] mb-6">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#191D15] font-sans">Reset Telemetry Data</span>
              <span className="text-[11px] text-[#8A7968] font-sans">Restore initial sample tasks & projects</span>
            </div>
            <button onClick={handleResetData} className="px-3.5 py-1.5 rounded-full bg-[#E67E22]/15 text-[#E67E22] text-[11px] font-bold flex items-center gap-1.5 hover:bg-[#E67E22]/25 transition-colors border border-[#E67E22]/30">
              <svg fill="none" height="14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="14"><path d="M21.5 2V8H15.5"></path><path d="M2.5 22V16H8.5"></path><path d="M19.94 15.5C18.66 18.73 15.5 21 12 21C7.03 21 3 16.97 3 12C3 9.4 4.1 7.06 5.86 5.43L2.5 2"></path><path d="M4.06 8.5C5.34 5.27 8.5 3 12 3C16.97 3 21 7.03 21 12C21 14.6 19.9 16.94 18.14 18.57L21.5 22"></path></svg>
              <span className="font-sans">RESET</span>
            </button>
          </div>
          
        </div>
      </div>

      {/* ── Share Report Modal ── */}
      {showReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(25, 29, 21, 0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
          onClick={() => setShowReport(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-5 flex flex-col gap-5 border border-[#EDE7DA] bg-white shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* The "Share Card" */}
            <div 
              className="relative w-full rounded-2xl overflow-hidden flex flex-col p-6 border border-[#EDE7DA]"
              style={{ background: 'linear-gradient(135deg, #F9FBEE 0%, #EDE7DA 100%)' }}
            >
              <div className="flex items-center justify-between z-10 mb-8">
                <span className="text-[10px] text-[#747870] tracking-widest font-sans font-bold">
                  FOCUS // {getReportTitle()}
                </span>
                <svg fill="none" height="18" stroke="#40513B" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"></line><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"></line></svg>
              </div>

              <div className="z-10 flex flex-col gap-1 mb-10">
                <h3 className="text-3xl font-bold text-[#191D15] tracking-tight leading-tight font-sans">
                  {getReportHeading()}
                </h3>
                <p className="text-xs text-[#628141] font-bold mt-1 font-sans">
                  {reportData.displaySubDays}
                </p>
              </div>

              <div className="z-10 grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-[#747870] font-bold font-sans">TOTAL FOCUS</span>
                  <span className="text-2xl font-bold text-[#191D15] font-sans">{reportData.displayHours}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-[#747870] font-bold font-sans">SESSIONS</span>
                  <span className="text-2xl font-bold text-[#191D15] font-sans">{reportData.displayPomos}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button 
                onClick={() => setShowReport(false)} 
                className="flex items-center justify-center p-4 rounded-2xl transition-all border border-[#EDE7DA] text-[#40513B] bg-[#F4F0E8] hover:bg-[#EDE7DA]"
              >
                <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20"><path d="M18 6L6 18"></path><path d="M6 6L18 18"></path></svg>
              </button>
              <button 
                onClick={handleCopyReport} 
                className="flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl bg-[#40513B] text-white font-semibold font-sans text-sm hover:bg-[#344230]" 
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{copied ? 'check' : 'content_copy'}</span>
                {copied ? 'Copied to Clipboard' : 'Copy Text'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
