import React, { useState } from 'react';
import { Share2, Clock, RefreshCw, X, Download, Copy, Check } from 'lucide-react';
import SharedActivitySection from '../Analytics/SharedActivitySection';

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
  const maxBarH = 48;

  const realSessions = (sessions || []).filter((s) => s && s.id && s.id.length > 15);
  const baseMinutes = 758 * 60 + 26;
  const totalMinutes = realSessions.reduce((acc, s) => acc + (s.duration || 25), baseMinutes);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const totalHoursDisplay = `${hours}h ${mins}m`;

  const totalPomos = realSessions.length + 10008;
  const totalDays = 600;

  const handleChange = (key, value) => {
    if (onUpdateSettings) onUpdateSettings({ ...settings, [key]: value });
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
        <span
          style={{
            fontFamily: M,
            fontSize: 8,
            color: '#B9DAFF',
            background: '#090A0C',
            border: '1px solid #27272A',
            padding: '4px 8px',
            borderRadius: 4,
            letterSpacing: '0.06em',
          }}
        >
          VERIFIED
        </span>
      </div>

      {/* Shared Activity Section with tabs, heatmap, and dynamic time distribution chart */}
      <SharedActivitySection showKPIs={false} onPeriodChange={setReportData} />

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
                min="1"
                max="120"
                value={settings.workDuration || 25}
                onChange={(e) => handleChange('workDuration', Math.max(1, parseInt(e.target.value) || 25))}
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
                min="1"
                max="30"
                value={settings.shortBreakDuration || 5}
                onChange={(e) =>
                  handleChange('shortBreakDuration', Math.max(1, parseInt(e.target.value) || 5))
                }
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
                min="1"
                max="60"
                value={settings.longBreakDuration || 15}
                onChange={(e) =>
                  handleChange('longBreakDuration', Math.max(1, parseInt(e.target.value) || 15))
                }
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
              min="0.5"
              max="24"
              value={settings.dailyGoalHours || 4.0}
              onChange={(e) => handleChange('dailyGoalHours', Math.max(0.5, parseFloat(e.target.value) || 4.0))}
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
              <span
                style={{
                  fontFamily: M,
                  fontSize: 8,
                  color: '#B9DAFF',
                  background: '#000000',
                  border: '1px solid #27272A',
                  padding: '3px 6px',
                  borderRadius: 4,
                }}
              >
                VERIFIED
              </span>
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
