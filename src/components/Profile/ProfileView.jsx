import React, { useState } from 'react';
import { Share2, Clock, RefreshCw, X, Download, Copy, Check, CloudUpload, CloudDownload, Loader2 } from 'lucide-react';
import SharedActivitySection from '../Analytics/SharedActivitySection';
import { storage } from '../../services/storage';
import { backupToDrive, restoreFromDrive } from '../../services/googleDriveBackup';

const G = "Geist, 'Helvetica Neue', sans-serif";
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
    <div
      className="pb-32 pt-4 px-4 max-w-md mx-auto space-y-4 select-none relative min-h-[85vh]"
      style={{ fontFamily: G }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span
            style={{
              fontFamily: M,
              fontSize: 9,
              color: '#3F3F46',
              letterSpacing: '0.1em',
              display: 'block',
            }}
          >
            Focus
          </span>
          <h1
            style={{
              fontFamily: G,
              fontSize: 22,
              fontWeight: 700,
              color: '#FFFFFF',
              letterSpacing: '-0.03em',
              marginTop: 2,
            }}
          >
            Achievements
          </h1>
        </div>
      </div>

      {/* Shared Activity Section with tabs, heatmap, and dynamic time distribution chart */}
      <SharedActivitySection showKPIs={false} sessions={sessions} onPeriodChange={setReportData} />

      {/* Quick stats row */}
      <div className="flex gap-2">
        <div
          style={{
            flex: 1,
            background: '#090A0C',
            border: '1px solid #27272A',
            borderRadius: 8,
            padding: '10px 12px',
          }}
        >
          <p style={{ fontFamily: M, fontSize: 7, color: '#3F3F46' }}>Streak</p>
          <p style={{ fontFamily: M, fontSize: 12, fontWeight: 700, color: '#FFFFFF', marginTop: 4 }}>
            14 days
          </p>
          <p style={{ fontFamily: M, fontSize: 7, color: '#3F3F46', marginTop: 2 }}>{totalDays} days total</p>
        </div>
        <div
          style={{
            flex: 1,
            background: '#090A0C',
            border: '1px solid #27272A',
            borderRadius: 8,
            padding: '10px 12px',
          }}
        >
          <p style={{ fontFamily: M, fontSize: 7, color: '#3F3F46' }}>Best day</p>
          <p style={{ fontFamily: M, fontSize: 12, fontWeight: 700, color: '#FFFFFF', marginTop: 4 }}>
            Tue
          </p>
          <p style={{ fontFamily: M, fontSize: 7, color: '#3F3F46', marginTop: 2 }}>6.2h max</p>
        </div>
        <div
          style={{
            flex: 1,
            background: '#090A0C',
            border: '1px solid #27272A',
            borderRadius: 8,
            padding: '10px 12px',
          }}
        >
          <p style={{ fontFamily: M, fontSize: 7, color: '#3F3F46' }}>Pomodoros</p>
          <p style={{ fontFamily: M, fontSize: 12, fontWeight: 700, color: '#FFFFFF', marginTop: 4 }}>
            {totalPomos.toLocaleString()}
          </p>
          <p style={{ fontFamily: M, fontSize: 7, color: '#3F3F46', marginTop: 2 }}>Total done</p>
        </div>
      </div>

      {/* Share button */}
      <div>
        <button
          type="button"
          onClick={() => {
            if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(15);
            setShowReport(true);
          }}
          className="w-full flex items-center justify-center gap-2 transition-opacity active:opacity-80"
          style={{ background: '#B9DAFF', borderRadius: 8, padding: '13px 0' }}
        >
          <Share2 size={13} color="#000000" strokeWidth={2} />
          <span style={{ fontFamily: G, fontSize: 14, fontWeight: 600, color: '#000000' }}>
            Share report
          </span>
        </button>
      </div>

      {/* Section: System Configuration / Settings */}
      <div className="pt-4 space-y-3">
        <span
          style={{
            fontFamily: M,
            fontSize: 8,
            color: '#8BA0B0',
            letterSpacing: '0.08em',
            display: 'block',
          }}
        >
          SYSTEM CONFIGURATION // SETTINGS
        </span>

        {/* Timer Durations Card */}
        <div
          style={{
            background: '#090A0C',
            border: '1px solid #27272A',
            borderRadius: 8,
            padding: '12px 14px',
          }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 border-b border-[#27272A] pb-2">
            <Clock size={14} color="#B9DAFF" />
            <span style={{ fontFamily: M, fontSize: 9, color: '#FFFFFF', fontWeight: 600 }}>
              SESSION DURATIONS (MINUTES)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label style={{ fontFamily: M, fontSize: 8, color: '#8BA0B0', display: 'block', marginBottom: 4 }}>
                WORK
              </label>
              <input
                type="number"
                value={settings.workDuration ?? 25}
                onChange={(e) => handleNumberChange('workDuration', e.target.value)}
                style={{
                  width: '100%',
                  background: '#000000',
                  border: '1px solid #27272A',
                  borderRadius: 4,
                  padding: '6px',
                  textAlign: 'center',
                  fontFamily: M,
                  fontSize: 12,
                  color: '#FFFFFF',
                }}
              />
            </div>
            <div>
              <label style={{ fontFamily: M, fontSize: 8, color: '#8BA0B0', display: 'block', marginBottom: 4 }}>
                SHORT BREAK
              </label>
              <input
                type="number"
                value={settings.shortBreakDuration ?? 5}
                onChange={(e) => handleNumberChange('shortBreakDuration', e.target.value)}
                style={{
                  width: '100%',
                  background: '#000000',
                  border: '1px solid #27272A',
                  borderRadius: 4,
                  padding: '6px',
                  textAlign: 'center',
                  fontFamily: M,
                  fontSize: 12,
                  color: '#FFFFFF',
                }}
              />
            </div>
            <div>
              <label style={{ fontFamily: M, fontSize: 8, color: '#8BA0B0', display: 'block', marginBottom: 4 }}>
                LONG BREAK
              </label>
              <input
                type="number"
                value={settings.longBreakDuration ?? 15}
                onChange={(e) => handleNumberChange('longBreakDuration', e.target.value)}
                style={{
                  width: '100%',
                  background: '#000000',
                  border: '1px solid #27272A',
                  borderRadius: 4,
                  padding: '6px',
                  textAlign: 'center',
                  fontFamily: M,
                  fontSize: 12,
                  color: '#FFFFFF',
                }}
              />
            </div>
          </div>
        </div>

        {/* Daily Focus Goal Card */}
        <div
          style={{
            background: '#090A0C',
            border: '1px solid #27272A',
            borderRadius: 8,
            padding: '12px 14px',
          }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between border-b border-[#27272A] pb-2">
            <div className="flex items-center gap-2">
              <Check size={14} color="#B9DAFF" />
              <span style={{ fontFamily: M, fontSize: 9, color: '#FFFFFF', fontWeight: 600 }}>
                DAILY FOCUS GOAL (HOURS)
              </span>
            </div>
            <span style={{ fontFamily: M, fontSize: 8, color: '#8BA0B0' }}>
              Today: {settings.dailyGoalHours || 4.0}h
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.5"
              value={settings.dailyGoalHours ?? 4.0}
              onChange={(e) => handleNumberChange('dailyGoalHours', e.target.value)}
              style={{
                width: 70,
                background: '#000000',
                border: '1px solid #27272A',
                borderRadius: 4,
                padding: '6px',
                textAlign: 'center',
                fontFamily: M,
                fontSize: 12,
                color: '#FFFFFF',
              }}
            />
            <div className="flex gap-1.5 flex-1 justify-end">
              {[2.0, 4.0, 6.0, 8.0].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => {
                    if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
                    handleChange('dailyGoalHours', h);
                  }}
                  style={{
                    background: (settings.dailyGoalHours || 4.0) === h ? '#B9DAFF' : '#1A2530',
                    color: (settings.dailyGoalHours || 4.0) === h ? '#000000' : '#8BA0B0',
                    borderRadius: 4,
                    padding: '4px 8px',
                    fontFamily: M,
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  {h}h
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Keep Screen Awake Card */}
        <div
          style={{
            background: '#090A0C',
            border: '1px solid #27272A',
            borderRadius: 8,
            padding: '12px 14px',
          }}
          className="flex items-center justify-between"
        >
          <div>
            <p style={{ fontFamily: G, fontSize: 13, fontWeight: 500, color: '#FFFFFF' }}>
              Keep Screen Awake
            </p>
            <p style={{ fontFamily: M, fontSize: 8, color: '#8BA0B0', marginTop: 2 }}>
              Prevent phone display from turning off during active sessions
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
              handleChange('keepAwake', !settings.keepAwake);
            }}
            className="flex items-center gap-1.5 transition-opacity active:opacity-70"
            style={{
              background: settings.keepAwake ? '#B9DAFF' : '#000000',
              border: `1px solid ${settings.keepAwake ? '#B9DAFF' : '#27272A'}`,
              borderRadius: 4,
              padding: '6px 10px',
            }}
          >
            <span
              style={{
                fontFamily: M,
                fontSize: 9,
                color: settings.keepAwake ? '#000000' : '#8BA0B0',
                fontWeight: 700,
              }}
            >
              {settings.keepAwake ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Cloud Backup Card */}
        <div
          style={{
            background: '#090A0C',
            border: '1px solid #27272A',
            borderRadius: 8,
            padding: '12px 14px',
          }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 border-b border-[#27272A] pb-2">
            <CloudUpload size={14} color="#B9DAFF" />
            <span style={{ fontFamily: M, fontSize: 9, color: '#FFFFFF', fontWeight: 600 }}>
              CLOUD BACKUP
            </span>
          </div>

          <p style={{ fontFamily: M, fontSize: 8, color: '#8BA0B0' }}>
            Sync your data to Google Drive for safe keeping
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleBackup}
              disabled={backupStatus !== 'idle'}
              className="flex-1 flex items-center justify-center gap-1.5 transition-opacity active:opacity-70 disabled:opacity-40"
              style={{
                background: '#B9DAFF',
                borderRadius: 6,
                padding: '10px 0',
              }}
            >
              {backupStatus === 'backing-up' ? (
                <Loader2 size={13} color="#000000" className="animate-spin" />
              ) : (
                <CloudUpload size={13} color="#000000" />
              )}
              <span style={{ fontFamily: M, fontSize: 10, fontWeight: 600, color: '#000000' }}>
                {backupStatus === 'backing-up' ? 'Backing up...' : 'Backup'}
              </span>
            </button>
            <button
              type="button"
              onClick={handleRestore}
              disabled={backupStatus !== 'idle'}
              className="flex-1 flex items-center justify-center gap-1.5 transition-opacity active:opacity-70 disabled:opacity-40"
              style={{
                background: '#18181B',
                border: '1px solid #27272A',
                borderRadius: 6,
                padding: '10px 0',
              }}
            >
              {backupStatus === 'restoring' ? (
                <Loader2 size={13} color="#B9DAFF" className="animate-spin" />
              ) : (
                <CloudDownload size={13} color="#B9DAFF" />
              )}
              <span style={{ fontFamily: M, fontSize: 10, fontWeight: 600, color: '#B9DAFF' }}>
                {backupStatus === 'restoring' ? 'Restoring...' : 'Restore'}
              </span>
            </button>
          </div>

          {backupMsg && (
            <p
              style={{
                fontFamily: M,
                fontSize: 8,
                color: backupMsg.startsWith('Error') ? '#FF6B6B' : '#B9DAFF',
                marginTop: 4,
              }}
            >
              {backupMsg}
            </p>
          )}
        </div>

        {/* Reset Data Card */}
        <div
          style={{
            background: '#090A0C',
            border: '1px solid #27272A',
            borderRadius: 8,
            padding: '12px 14px',
          }}
          className="flex items-center justify-between"
        >
          <div>
            <p style={{ fontFamily: G, fontSize: 13, fontWeight: 500, color: '#FFFFFF' }}>
              Reset Telemetry Data
            </p>
            <p style={{ fontFamily: M, fontSize: 8, color: '#8BA0B0', marginTop: 2 }}>
              Restore initial sample tasks & project nomenclature
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetData}
            className="flex items-center gap-1.5 transition-opacity active:opacity-70"
            style={{
              background: '#000000',
              border: '1px solid #27272A',
              borderRadius: 4,
              padding: '6px 10px',
            }}
          >
            <RefreshCw size={12} color="#B9DAFF" />
            <span style={{ fontFamily: M, fontSize: 9, color: '#B9DAFF', fontWeight: 600 }}>
              RESET
            </span>
          </button>
        </div>
      </div>

      {/* Weekly Report Modal Overlay */}
      {showReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-5 select-none animate-fadeIn"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setShowReport(false)}
        >
          <div
            className="w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#090A0C',
              border: '1px solid #27272A',
              borderRadius: 12,
              padding: '20px',
            }}
          >
            {/* Modal header */}
            <div
              className="flex items-center justify-between pb-3 mb-4"
              style={{ borderBottom: '1px solid #27272A' }}
            >
              <div>
                <p style={{ fontFamily: M, fontSize: 8, color: '#3F3F46', letterSpacing: '0.1em' }}>
                  FOCUS // {getReportTitle()}
                </p>
                <h3
                  style={{
                    fontFamily: G,
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    marginTop: 2,
                  }}
                >
                  {getReportHeading()}
                </h3>
              </div>
            </div>

            {/* Report content */}
            <div className="space-y-3 mb-5">
              <div
                style={{
                  background: '#000000',
                  border: '1px solid #27272A',
                  borderRadius: 8,
                  padding: '12px',
                }}
              >
                <div className="flex justify-between mb-2">
                  <span style={{ fontFamily: M, fontSize: 8, color: '#8BA0B0' }}>Total Focus</span>
                  <span style={{ fontFamily: M, fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>
                    {reportData.displayHours}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span style={{ fontFamily: M, fontSize: 8, color: '#8BA0B0' }}>Sessions</span>
                  <span style={{ fontFamily: M, fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>
                    {reportData.displayPomos.toLocaleString()} pomodoros
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span style={{ fontFamily: M, fontSize: 8, color: '#8BA0B0' }}>Detail</span>
                  <span style={{ fontFamily: M, fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>
                    {reportData.displaySubToday}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ fontFamily: M, fontSize: 8, color: '#8BA0B0' }}>Activity</span>
                  <span style={{ fontFamily: M, fontSize: 12, fontWeight: 700, color: '#B9DAFF' }}>
                    {reportData.displaySubDays}
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
                  setShowReport(false);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 transition-opacity active:opacity-60"
                style={{
                  background: '#18181B',
                  border: '1px solid #27272A',
                  borderRadius: 8,
                  padding: '11px 0',
                }}
              >
                <Download size={12} color="#FFFFFF" />
                <span style={{ fontFamily: G, fontSize: 13, color: '#FFFFFF' }}>Download</span>
              </button>
              <button
                type="button"
                onClick={handleCopyReport}
                className="flex-1 flex items-center justify-center gap-1.5 transition-opacity active:opacity-80"
                style={{ background: '#B9DAFF', borderRadius: 8, padding: '11px 0' }}
              >
                {copied ? <Check size={12} color="#000000" /> : <Copy size={12} color="#000000" />}
                <span style={{ fontFamily: G, fontSize: 13, fontWeight: 600, color: '#000000' }}>
                  {copied ? 'Copied!' : 'Copy text'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
