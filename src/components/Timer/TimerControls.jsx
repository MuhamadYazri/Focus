import React, { useState } from 'react';
import { soundEngine } from '../../services/soundEngine';

const G = "'Poppins', sans-serif";
const M = "'Poppins', sans-serif";

export default function TimerControls({
  isRunning,
  isInitial = true,
  mode = 'work',
  onTogglePlay,
  onReset,
  onSkip,
  currentSound = 'none',
  onSelectSound,
  volume = 0.8,
  onChangeVolume,
}) {
  const soundscapes = [
    { id: 'none',   label: 'Silent Trace' },
    { id: 'forest', label: 'Forest Wind' },
    { id: 'rain',   label: 'Rain' },
    { id: 'waves',  label: 'Oceanic Waves' },
    { id: 'cafe',   label: 'Urban Cafe' },
    { id: 'clock',  label: 'Ticking Chrono' },
  ];

  const handleSelectSound = (soundId) => {
    if (onSelectSound) onSelectSound(soundId);
    if (soundId === 'none') soundEngine.stop();
    else soundEngine.play(soundId, volume);
  };

  const currentSoundObj = soundscapes.find((s) => s.id === currentSound) || soundscapes[0];
  const isBreak = mode === 'shortBreak' || mode === 'longBreak';

  return (
    <div
      className="glass w-full rounded-3xl p-5 flex flex-col gap-5"
      style={{ border: '1px solid var(--surface-border)', background: 'var(--glass-bg)' }}
    >
      {/* ── Main Controls ── */}
      <div className="flex items-center justify-center gap-8">
        {/* Reset */}
        <button
          type="button"
          onClick={() => { if (window.navigator?.vibrate) window.navigator.vibrate(10); if (onReset) onReset(); }}
          className="squish flex items-center justify-center rounded-full transition-all"
          style={{ width: 48, height: 48, background: 'var(--surface-low)' }}
        >
          <span className="material-symbols-outlined fill" style={{ fontSize: 22, color: 'var(--text-secondary)' }}>replay</span>
        </button>

        {/* Play / Pause — large pill */}
        <button
          type="button"
          onClick={() => { if (window.navigator?.vibrate) window.navigator.vibrate(20); if (onTogglePlay) onTogglePlay(); }}
          className="squish flex items-center justify-center rounded-full transition-all"
          style={{ width: 72, height: 72, background: 'var(--text-primary)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
        >
          <span className="material-symbols-outlined fill" style={{ fontSize: 36, color: '#fff' }}>
            {isRunning ? 'pause' : 'play_arrow'}
          </span>
        </button>

        {/* Skip */}
        <button
          type="button"
          onClick={() => { if (window.navigator?.vibrate) window.navigator.vibrate(10); if (isBreak && onSkip) onSkip(); else if (onSkip) onSkip(); }}
          className="squish flex items-center justify-center rounded-full transition-all"
          style={{ width: 48, height: 48, background: 'var(--surface-low)' }}
        >
          <span className="material-symbols-outlined fill" style={{ fontSize: 22, color: 'var(--text-secondary)' }}>skip_next</span>
        </button>
      </div>

      {/* ── Sound Bar ── */}
      <div className="border-t flex items-center justify-between gap-4 pt-4" style={{ borderColor: 'var(--surface-border)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--text-secondary)', flexShrink: 0 }}>headphones</span>
          <select
            value={currentSound}
            onChange={(e) => handleSelectSound(e.target.value)}
            style={{
              fontFamily: G, fontSize: 13, color: 'var(--text-primary)', background: 'transparent',
              border: 'none', outline: 'none', cursor: 'pointer', minWidth: 0,
            }}
          >
            {soundscapes.map((s) => (
              <option key={s.id} value={s.id} style={{ color: 'var(--text-primary)', background: '#fff' }}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Volume slider */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-muted)' }}>volume_down</span>
          <div style={{ width: 80, height: 6, background: 'var(--surface-low)', borderRadius: 99, overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
            <div style={{ width: `${volume * 100}%`, height: '100%', background: 'var(--text-primary)', borderRadius: 99 }} />
            <input
              type="range" min="0" max="1" step="0.05" value={volume}
              onChange={(e) => { const v = parseFloat(e.target.value); if (onChangeVolume) onChangeVolume(v); if (currentSound !== 'none') soundEngine.setVolume(v); }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-muted)' }}>volume_up</span>
        </div>
      </div>
    </div>
  );
}
