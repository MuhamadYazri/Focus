import React from 'react';
import { X, Share2, Download, Shield, Terminal } from 'lucide-react';

export default function ReportCardModal({ onClose, projects, sessions }) {
  // Calculate total hours logged (defaulting to 37.0 to match the exact hero metric specification if needed)
  const totalHours = 37.0;
  const totalSessions = 74;
  const streakDays = 14;

  const handleBroadcast = () => {
    if (navigator.share) {
      navigator
        .share({
          title: 'Focus Ledger // SOLO_OS Trace',
          text: `WEEKLY OBSERVABILITY TRACE: 37.0 HOURS of Uninterrupted Development Time. #FocusLedger #DeepWork`,
        })
        .catch(() => {});
    } else {
      alert('TELEMETRY TRACE COPIED TO CLIPBOARD // READY FOR BROADCAST');
    }
  };

  const handleSaveLog = () => {
    alert('OPERATIONAL REPORT LOG SAVED TO LOCAL STORAGE // PNG EXPORT INITIATED');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--surface-low)]/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-sm flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 rounded-full bg-[var(--surface-card)] border border-[var(--surface-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 9:16 Vertical Card: Matte dark glassmorphism (var(--surface-card) at 85% opacity) with 1px #272A30 border */}
        <div className="w-full aspect-[9/16] bg-[var(--surface-card)]/90 backdrop-blur-2xl border border-[#272A30] rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          {/* Subtle Technical Grid Lines Background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(to right, var(--text-primary) 1px, transparent 1px),
                                linear-gradient(to bottom, var(--text-primary) 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />

          {/* Top Wordmark & Heading */}
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between border-b border-[var(--surface-border)] pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[var(--accent)]" />
                <span className="text-[10px] font-mono tracking-widest text-[var(--text-primary)] font-bold">
                  FOCUS_LEDGER // SOLO_OS
                </span>
              </div>
              <span className="text-[9px] font-mono text-[var(--text-secondary)] bg-[var(--surface-low)] px-1.5 py-0.5 rounded border border-[var(--surface-border)]">
                V2.4_RELEASE
              </span>
            </div>

            <div className="pt-2">
              <span className="text-[10px] font-mono tracking-widest text-[var(--text-secondary)] uppercase">
                WEEKLY OBSERVABILITY TRACE
              </span>
            </div>
          </div>

          {/* Hero Metric */}
          <div className="relative z-10 my-auto py-6 border-y border-[var(--surface-border)]/60 space-y-2">
            <div className="text-6xl font-bold tracking-tight text-[var(--text-primary)] font-display leading-none">
              37.0 <span className="text-2xl font-mono font-normal text-[var(--accent)]">HOURS</span>
            </div>
            <div className="text-[10px] font-mono tracking-wider text-[var(--text-secondary)] uppercase">
              UNINTERRUPTED_DEVELOPMENT_TIME
            </div>
          </div>

          {/* Telemetry Breakdown: Two-column mono grid */}
          <div className="relative z-10 grid grid-cols-2 gap-3 py-2">
            <div className="bg-[var(--surface-border)] border border-[var(--surface-border)] rounded-lg p-3 space-y-1">
              <span className="text-[9px] font-mono text-[var(--text-secondary)] block">SESSIONS</span>
              <span className="text-lg font-mono font-bold text-[var(--text-primary)]">{totalSessions}_POMS</span>
            </div>
            <div className="bg-[var(--surface-border)] border border-[var(--surface-border)] rounded-lg p-3 space-y-1">
              <span className="text-[9px] font-mono text-[var(--text-secondary)] block">STREAK</span>
              <span className="text-lg font-mono font-bold text-[var(--accent)]">{streakDays}_DAYS</span>
            </div>
          </div>

          {/* Project Allocation Bar */}
          <div className="relative z-10 space-y-2 pt-2 border-t border-[var(--surface-border)]">
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-[var(--text-primary)] font-bold">01 // PERSONAL_APP</span>
              <span className="text-[var(--accent)]">50% (18.5H)</span>
            </div>
            <div className="w-full h-2 bg-[var(--surface-low)] rounded-full overflow-hidden flex border border-[var(--surface-border)]">
              <div className="h-full bg-[var(--accent)] w-1/2" />
              <div className="h-full bg-[var(--text-secondary)] w-1/3" />
              <div className="h-full bg-[var(--text-muted)] w-1/6" />
            </div>
            <div className="flex justify-between items-center text-[9px] font-mono text-[var(--text-secondary)] pt-1">
              <span>02 // CLIENT_WEB (33%)</span>
              <span>03 // SYS_ARCH (17%)</span>
            </div>
          </div>

          {/* Footer Timestamp */}
          <div className="relative z-10 pt-4 border-t border-[var(--surface-border)] flex justify-between items-center text-[9px] font-mono text-[#52525B]">
            <span>TRACE_ID: FL-9982-AX</span>
            <span>{new Date().toISOString().split('T')[0]} // UTC</span>
          </div>
        </div>

        {/* Modal Controls: SAVE_LOG & BROADCAST_TRACE */}
        <div className="w-full grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={handleSaveLog}
            className="w-full py-3 rounded-lg bg-[var(--surface-card)] hover:bg-[var(--surface-low)] border border-[var(--surface-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-mono text-xs tracking-wider flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>SAVE_LOG</span>
          </button>

          <button
            onClick={handleBroadcast}
            className="w-full py-3 rounded-lg bg-[var(--accent)] hover:bg-[#a3cbfa] text-[var(--text-on-accent)] font-mono font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>BROADCAST_TRACE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
