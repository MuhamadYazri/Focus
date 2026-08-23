import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import SharedActivitySection from '../Analytics/SharedActivitySection';
import { storage } from '../../services/storage';
import { backupToDrive, restoreFromDrive } from '../../services/googleDriveBackup';

const G = "'Geist', system-ui, sans-serif";
const M = "'JetBrains Mono', monospace";

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
    <div className="min-h-[100dvh] pb-32" style={{ fontFamily: G, background: 'var(--canvas)' }}>

      {/* ── Sticky Header ── */}
      <header className="glass sticky top-0 z-40 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined fill" style={{ color: 'var(--text-primary)', fontSize: 22 }}>person</span>
          <h1 style={{ fontFamily: G, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Profile</h1>
        </div>
        <span style={{ fontFamily: M, fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>FOCUS</span>
      </header>

      <div className="px-5 pt-5 flex flex-col gap-5 max-w-md mx-auto">

        {/* ── Activity ── */}
        <SharedActivitySection showKPIs={false} sessions={sessions} onPeriodChange={setReportData} />

        {/* ── Quick Stats Row ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: 'local_fire_department', value: '14', label: 'Day Streak' },
            { icon: 'timer', value: totalHoursDisplay, label: 'Focused' },
            { icon: 'task_alt', value: totalPomos.toLocaleString(), label: 'Sessions' },
          ].map(({ icon, value, label }, index) => (
            <div key={label} className="card-2xl flex flex-col items-center justify-center py-4 px-2 text-center gap-1 animate-slideUp" style={{ animationDelay: `${0.1 + index * 0.05}s` }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--text-secondary)' }}>{icon}</span>
              <span style={{ fontFamily: G, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{value}</span>
              <span style={{ fontFamily: M, fontSize: 9, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>{label.toUpperCase()}</span>
            </div>
          ))}
        </div>

        {/* ── Share Button ── */}
        <button
          type="button"
          onClick={() => { if (window.navigator?.vibrate) window.navigator.vibrate(15); setShowReport(true); }}
          className="w-full squish flex items-center justify-center gap-2 animate-slideUp"
          style={{ animationDelay: '0.25s', background: 'var(--text-primary)', borderRadius: 9999, padding: '14px 0', fontFamily: G, fontSize: 15, fontWeight: 600, color: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>ios_share</span>
          Share Profile
        </button>

        {/* ── Focus Categories ── */}
        <div className="flex flex-col gap-4 mb-4 animate-slideUp" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between">
            <span style={{ fontFamily: M, fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>FOCUS CATEGORIES</span>
            <button
              type="button"
              onClick={() => { if (window.navigator?.vibrate) window.navigator.vibrate(10); if (onAddProject) onAddProject(); }}
              style={{ fontFamily: M, fontSize: 10, color: 'var(--accent)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
              className="hover:opacity-80 transition"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span> NEW
            </button>
          </div>
          <div className="card-2xl p-2 flex flex-col">
            {projects.map((proj, i) => {
              const cleanName = proj.name.replace(/^[0-9]+\s*(\/\/|·|\.)\s*/, '').replace(/_/g, ' ');
              return (
                <div key={proj.id} className="flex items-center justify-between py-3 px-3 transition rounded-xl" style={{ borderBottom: i < projects.length - 1 ? '1px solid var(--surface-border)' : 'none' }}>
                  <div className="flex items-center gap-3">
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: proj.color || 'var(--accent)' }} />
                    <span style={{ fontFamily: G, fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{cleanName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => { if (window.navigator?.vibrate) window.navigator.vibrate(10); if (onEditProject) onEditProject(proj); }} className="p-2 transition hover:opacity-60" style={{ color: 'var(--text-secondary)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                    </button>
                    {projects.length > 1 && (
                      <button type="button" onClick={() => { if (window.navigator?.vibrate) window.navigator.vibrate(10); if (confirm(`Delete "${cleanName}" and its tasks?`)) { if (onDeleteProject) onDeleteProject(proj.id); } }} className="p-2 transition hover:opacity-60" style={{ color: '#EF4444' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Settings ── */}
        <div className="flex flex-col gap-4 animate-slideUp" style={{ animationDelay: '0.35s' }}>
          <span style={{ fontFamily: M, fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>PREFERENCES</span>

          {/* Timer Durations */}
          <div className="card-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid var(--surface-border)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--text-secondary)' }}>hourglass_empty</span>
              <span style={{ fontFamily: G, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Timer Durations</span>
            </div>
            {[
              { key: 'workDuration', label: 'Focus Session', presets: [25, 45, 60] },
              { key: 'shortBreakDuration', label: 'Short Break', presets: [5, 10, 15] },
              { key: 'longBreakDuration', label: 'Long Break', presets: [15, 20, 30] },
            ].map(({ key, label, presets }) => (
              <div key={key} className="flex items-center justify-between">
                <span style={{ fontFamily: G, fontSize: 14, color: 'var(--text-primary)' }}>{label}</span>
                <div className="flex rounded-lg p-1" style={{ background: 'var(--surface-low)' }}>
                  {presets.map((p) => (
                    <button
                      key={p} type="button"
                      onClick={() => { if (window.navigator?.vibrate) window.navigator.vibrate(10); handleChange(key, p); }}
                      className="transition-all"
                      style={{
                        padding: '4px 12px', borderRadius: 6,
                        background: (settings[key] ?? presets[0]) === p ? 'var(--surface-card)' : 'transparent',
                        fontFamily: M, fontSize: 12, fontWeight: 600,
                        color: (settings[key] ?? presets[0]) === p ? 'var(--text-primary)' : 'var(--text-secondary)',
                        boxShadow: (settings[key] ?? presets[0]) === p ? 'var(--shadow-soft)' : 'none',
                      }}
                    >{p}m</button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Daily Goal */}
          <div className="card-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid var(--surface-border)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--text-secondary)' }}>track_changes</span>
              <span style={{ fontFamily: G, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Daily Goal</span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ fontFamily: G, fontSize: 14, color: 'var(--text-primary)' }}>Target Hours</span>
              <span style={{ fontFamily: G, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{settings.dailyGoalHours || 4.0}h</span>
            </div>
            <div className="flex gap-2">
              {[2.0, 4.0, 6.0, 8.0].map((h) => (
                <button
                  key={h} type="button"
                  onClick={() => { if (window.navigator?.vibrate) window.navigator.vibrate(10); handleChange('dailyGoalHours', h); }}
                  className="flex-1 py-2 rounded-xl transition-all"
                  style={{
                    fontFamily: M, fontSize: 12, fontWeight: 600,
                    background: (settings.dailyGoalHours || 4.0) === h ? 'var(--text-primary)' : 'var(--surface-low)',
                    color: (settings.dailyGoalHours || 4.0) === h ? '#fff' : 'var(--text-secondary)',
                  }}
                >{h}h</button>
              ))}
            </div>
          </div>

          {/* Toggles Card */}
          <div className="card-2xl p-5 flex flex-col gap-0">
            {[
              { key: 'keepAwake', icon: 'screen_lock_portrait', label: 'Keep Screen Awake', desc: 'Prevent display from turning off' },
              { key: 'strictMode', icon: 'lock', label: 'Strict Mode', desc: 'Block tab switching while running' },
              { key: 'liveNotification', icon: 'notifications_active', label: 'Origin Island & Live Notif', desc: 'Persistent ticking countdown in background' },
            ].map(({ key, icon, label, desc }, i, arr) => (
              <div key={key} className="flex items-center justify-between py-4" style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--surface-border)' : 'none' }}>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--text-secondary)' }}>{icon}</span>
                  <div>
                    <p style={{ fontFamily: G, fontSize: 14, color: 'var(--text-primary)', fontWeight: 500 }}>{label}</p>
                    <p style={{ fontFamily: M, fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{desc}</p>
                  </div>
                </div>
                <input type="checkbox" checked={!!settings[key]} onChange={() => { if (window.navigator?.vibrate) window.navigator.vibrate(10); handleChange(key, !settings[key]); }} className="ios-toggle" />
              </div>
            ))}
          </div>

          {/* Cloud Backup */}
          <div className="card-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid var(--surface-border)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--accent)' }}>cloud_upload</span>
              <span style={{ fontFamily: G, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Cloud Backup</span>
            </div>
            <p style={{ fontFamily: G, fontSize: 13, color: 'var(--text-secondary)' }}>Sync your data to Google Drive for safe keeping</p>
            <div className="flex gap-3">
              <button type="button" onClick={handleBackup} disabled={backupStatus !== 'idle'} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all disabled:opacity-40" style={{ background: 'var(--text-primary)', fontFamily: G, fontSize: 14, fontWeight: 600, color: '#fff' }}>
                {backupStatus === 'backing-up' ? <Loader2 size={14} className="animate-spin" /> : <span className="material-symbols-outlined" style={{ fontSize: 18 }}>cloud_upload</span>}
                {backupStatus === 'backing-up' ? 'Saving...' : 'Backup'}
              </button>
              <button type="button" onClick={handleRestore} disabled={backupStatus !== 'idle'} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all disabled:opacity-40" style={{ border: '1px solid var(--surface-border)', fontFamily: G, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                {backupStatus === 'restoring' ? <Loader2 size={14} className="animate-spin" /> : <span className="material-symbols-outlined" style={{ fontSize: 18 }}>cloud_download</span>}
                {backupStatus === 'restoring' ? 'Restoring...' : 'Restore'}
              </button>
            </div>
            {backupMsg && (
              <p style={{ fontFamily: M, fontSize: 11, color: backupMsg.startsWith('Error') ? '#EF4444' : 'var(--accent)' }}>{backupMsg}</p>
            )}
          </div>

          {/* Reset */}
          <div className="card-2xl p-5 flex items-center justify-between">
            <div>
              <p style={{ fontFamily: G, fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Reset Telemetry Data</p>
              <p style={{ fontFamily: M, fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Restore initial sample tasks & projects</p>
            </div>
            <button type="button" onClick={handleResetData} className="flex items-center gap-1 py-2 px-4 rounded-xl transition-all" style={{ border: '1px solid var(--surface-border)', fontFamily: M, fontSize: 11, fontWeight: 600, color: '#EF4444' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#EF4444' }}>refresh</span>
              RESET
            </button>
          </div>
        </div>
      </div>

      {/* ── Share Report Modal ── */}
      {showReport && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center animate-fadeIn"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowReport(false)}
        >
          <div
            className="w-full max-w-md animate-slideUp rounded-t-3xl p-6"
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--surface-card)', borderTop: '1px solid var(--surface-border)' }}
          >
            <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid var(--surface-border)' }}>
              <div>
                <p style={{ fontFamily: M, fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>FOCUS // {getReportTitle()}</p>
                <h3 style={{ fontFamily: G, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{getReportHeading()}</h3>
              </div>
              <button type="button" onClick={() => setShowReport(false)} className="p-2 rounded-full" style={{ background: 'var(--surface-low)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--text-secondary)' }}>close</span>
              </button>
            </div>
            <div className="flex flex-col gap-2 py-4">
              {[['Total Focus', reportData.displayHours], ['Sessions', `${reportData.displayPomos.toLocaleString()} pomodoros`], ['Detail', reportData.displaySubToday], ['Activity', reportData.displaySubDays]].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2" style={{ borderBottom: '1px solid var(--surface-border)' }}>
                  <span style={{ fontFamily: M, fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontFamily: G, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowReport(false)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl" style={{ border: '1px solid var(--surface-border)', fontFamily: G, fontSize: 14, color: 'var(--text-primary)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span> Download
              </button>
              <button type="button" onClick={handleCopyReport} className="flex-1 squish flex items-center justify-center gap-2 py-3 rounded-2xl" style={{ background: 'var(--text-primary)', fontFamily: G, fontSize: 14, fontWeight: 600, color: '#fff' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{copied ? 'check' : 'content_copy'}</span>
                {copied ? 'Copied!' : 'Copy text'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
