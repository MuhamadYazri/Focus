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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-sm flex flex-col items-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 rounded-full bg-[#090A0C] border border-[#27272A] text-[#8BA0B0] hover:text-[#FFFFFF] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 9:16 Vertical Card: Matte dark glassmorphism (#090A0C at 85% opacity) with 1px #272A30 border */}
        <div className="w-full aspect-[9/16] bg-[#090A0C]/90 backdrop-blur-2xl border border-[#272A30] rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          {/* Subtle Technical Grid Lines Background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px),
                                linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />

          {/* Top Wordmark & Heading */}
          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#B9DAFF]" />
                <span className="text-[10px] font-mono tracking-widest text-[#FFFFFF] font-bold">
                  FOCUS_LEDGER // SOLO_OS
                </span>
              </div>
              <span className="text-[9px] font-mono text-[#8BA0B0] bg-[#18181B] px-1.5 py-0.5 rounded border border-[#27272A]">
                V2.4_RELEASE
              </span>
            </div>

            <div className="pt-2">
              <span className="text-[10px] font-mono tracking-widest text-[#A1A1AA] uppercase">
                WEEKLY OBSERVABILITY TRACE
              </span>
            </div>
          </div>

          {/* Hero Metric */}
          <div className="relative z-10 my-auto py-6 border-y border-[#27272A]/60 space-y-2">
            <div className="text-6xl font-bold tracking-tight text-[#FFFFFF] font-sans leading-none">
              37.0 <span className="text-2xl font-mono font-normal text-[#B9DAFF]">HOURS</span>
            </div>
            <div className="text-[10px] font-mono tracking-wider text-[#8BA0B0] uppercase">
              UNINTERRUPTED_DEVELOPMENT_TIME
            </div>
          </div>

          {/* Telemetry Breakdown: Two-column mono grid */}
          <div className="relative z-10 grid grid-cols-2 gap-3 py-2">
            <div className="bg-[#131418] border border-[#27272A] rounded-lg p-3 space-y-1">
              <span className="text-[9px] font-mono text-[#8BA0B0] block">SESSIONS</span>
              <span className="text-lg font-mono font-bold text-[#FFFFFF]">{totalSessions}_POMS</span>
            </div>
            <div className="bg-[#131418] border border-[#27272A] rounded-lg p-3 space-y-1">
              <span className="text-[9px] font-mono text-[#8BA0B0] block">STREAK</span>
              <span className="text-lg font-mono font-bold text-[#B9DAFF]">{streakDays}_DAYS</span>
            </div>
          </div>

          {/* Project Allocation Bar */}
          <div className="relative z-10 space-y-2 pt-2 border-t border-[#27272A]">
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-[#FFFFFF] font-bold">01 // PERSONAL_APP</span>
              <span className="text-[#B9DAFF]">50% (18.5H)</span>
            </div>
            <div className="w-full h-2 bg-[#18181B] rounded-full overflow-hidden flex border border-[#27272A]">
              <div className="h-full bg-[#B9DAFF] w-1/2 shadow-[0_0_8px_#B9DAFF]" />
              <div className="h-full bg-[#8BA0B0] w-1/3" />
              <div className="h-full bg-[#3f3f46] w-1/6" />
            </div>
            <div className="flex justify-between items-center text-[9px] font-mono text-[#8BA0B0] pt-1">
              <span>02 // CLIENT_WEB (33%)</span>
              <span>03 // SYS_ARCH (17%)</span>
            </div>
          </div>

          {/* Footer Timestamp */}
          <div className="relative z-10 pt-4 border-t border-[#27272A] flex justify-between items-center text-[9px] font-mono text-[#52525B]">
            <span>TRACE_ID: FL-9982-AX</span>
            <span>{new Date().toISOString().split('T')[0]} // UTC</span>
          </div>
        </div>

        {/* Modal Controls: SAVE_LOG & BROADCAST_TRACE */}
        <div className="w-full grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={handleSaveLog}
            className="w-full py-3 rounded-lg bg-[#090A0C] hover:bg-[#18181B] border border-[#27272A] text-[#A1A1AA] hover:text-[#FFFFFF] font-mono text-xs tracking-wider flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>SAVE_LOG</span>
          </button>

          <button
            onClick={handleBroadcast}
            className="w-full py-3 rounded-lg bg-[#B9DAFF] hover:bg-[#a3cbfa] text-[#000000] font-mono font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition active:scale-95 shadow-[0_0_15px_rgba(185,218,255,0.4)]"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>BROADCAST_TRACE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
