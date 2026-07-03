import React, { useState } from 'react';
import { Volume2, VolumeX, ChevronRight, Pause, Play, Square, Check } from 'lucide-react';
import { soundEngine } from '../../services/soundEngine';

const G = "Geist, 'Helvetica Neue', sans-serif";
const M = "'JetBrains Mono', monospace";

export default function TimerControls({
  isRunning,
  onTogglePlay,
  onReset,
  currentSound = 'none',
  onSelectSound,
  volume = 0.8,
  onChangeVolume,
}) {
  const [showSoundMenu, setShowSoundMenu] = useState(false);

  const soundscapes = [
    { id: 'none', label: 'Silent Trace' },
    { id: 'forest', label: 'Forest Wind' },
    { id: 'rain', label: 'Atmospheric Rain' },
    { id: 'waves', label: 'Oceanic Waves' },
    { id: 'cafe', label: 'Urban Cafe' },
    { id: 'clock', label: 'Ticking Chrono' },
  ];

  const handleSelectSound = (soundId) => {
    if (onSelectSound) onSelectSound(soundId);
    if (soundId === 'none') {
      soundEngine.stop();
    } else {
      soundEngine.play(soundId, volume);
    }
    setShowSoundMenu(false);
  };

  const currentSoundObj = soundscapes.find((s) => s.id === currentSound) || soundscapes[0];

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col gap-4 select-none pt-2">
      {/* Sound panel */}
      <div className="relative z-10">
        <div
          style={{
            background: '#090A0C',
            border: '1px solid #27272A',
            borderRadius: 8,
            padding: '10px 14px',
          }}
          className="flex items-center gap-3 transition-all"
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 4,
              border: '1px solid #27272A',
              background: '#000000',
            }}
            className="flex items-center justify-center flex-shrink-0"
          >
            {currentSound === 'none' ? (
              <VolumeX size={13} color="#B9DAFF" strokeWidth={1.5} />
            ) : (
              <Volume2 size={13} color="#B9DAFF" strokeWidth={1.5} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p
              style={{
                fontFamily: G,
                fontSize: 12,
                fontWeight: 500,
                color: '#A1A1AA',
              }}
              className="truncate"
            >
              {currentSoundObj.label}
            </p>
            <p
              style={{
                fontFamily: M,
                fontSize: 7,
                color: '#3F3F46',
                marginTop: 2,
              }}
            >
              Vol {Math.round(volume * 100)}%
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSoundMenu(!showSoundMenu)}
            className="flex items-center gap-1 flex-shrink-0 transition-opacity active:opacity-50"
            style={{
              background: '#000000',
              border: '1px solid #27272A',
              borderRadius: 4,
              padding: '4px 8px',
            }}
          >
            <span style={{ fontFamily: M, fontSize: 7, color: '#3F3F46' }}>Change</span>
            <ChevronRight
              size={9}
              color="#3F3F46"
              strokeWidth={1.5}
              className={`transition-transform ${showSoundMenu ? 'rotate-90' : ''}`}
            />
          </button>
        </div>

        {/* Expandable Soundscape Menu */}
        {showSoundMenu && (
          <div
            style={{
              background: '#090A0C',
              border: '1px solid #27272A',
              borderRadius: 8,
              padding: '12px',
              marginTop: 6,
            }}
            className="space-y-3"
          >
            {/* Volume Slider */}
            <div className="space-y-1">
              <div className="flex justify-between" style={{ fontFamily: M, fontSize: 8, color: '#8BA0B0' }}>
                <span>VOLUME</span>
                <span>{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => {
                  const newVol = parseFloat(e.target.value);
                  if (onChangeVolume) onChangeVolume(newVol);
                  if (currentSound !== 'none') soundEngine.setVolume(newVol);
                }}
                className="w-full accent-[#B9DAFF] bg-[#18181B] h-1.5 rounded-lg cursor-pointer"
              />
            </div>

            {/* Soundscape List */}
            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {soundscapes.map((s) => {
                const isActive = s.id === currentSound;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSound(s.id)}
                    className="flex items-center justify-between px-2.5 py-2 rounded text-left transition"
                    style={{
                      background: isActive ? 'rgba(185,218,255,0.1)' : '#000000',
                      border: `1px solid ${isActive ? '#B9DAFF' : '#27272A'}`,
                      fontFamily: M,
                      fontSize: 10,
                      color: isActive ? '#B9DAFF' : '#8BA0B0',
                    }}
                  >
                    <span className="truncate">{s.label}</span>
                    {isActive && <Check size={10} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="relative z-10 flex flex-col gap-2.5 mt-2">
        <button
          type="button"
          onClick={() => {
            if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(20);
            if (onTogglePlay) onTogglePlay();
          }}
          className="w-full flex items-center justify-center gap-2.5 transition-opacity active:opacity-80"
          style={{ background: '#B9DAFF', borderRadius: 8, padding: '14px 0' }}
        >
          {isRunning ? (
            <>
              <Pause size={15} color="#000000" strokeWidth={2} fill="#000000" />
              <span
                style={{
                  fontFamily: G,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#000000',
                }}
              >
                Pause
              </span>
            </>
          ) : (
            <>
              <Play size={15} color="#000000" strokeWidth={2} fill="#000000" />
              <span
                style={{
                  fontFamily: G,
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#000000',
                }}
              >
                Resume
              </span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(10);
            if (onReset) onReset();
          }}
          className="w-full flex items-center justify-center gap-2.5 transition-opacity active:opacity-60"
          style={{
            background: 'transparent',
            border: '1px solid #27272A',
            borderRadius: 8,
            padding: '12px 0',
          }}
        >
          <Square size={13} color="#A1A1AA" strokeWidth={1.5} />
          <span style={{ fontFamily: G, fontSize: 13, color: '#A1A1AA' }}>Stop</span>
        </button>
      </div>
    </div>
  );
}
