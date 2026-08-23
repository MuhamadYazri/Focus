import React from 'react';
import { Volume2, VolumeX, CloudRain, Trees, Waves, Coffee, Clock, Volume1 } from 'lucide-react';
import { soundEngine } from '../../services/soundEngine';

export default function WhiteNoisePlayer({ currentSound, onSelectSound, volume, onChangeVolume }) {
  const sounds = [
    { id: 'none', label: 'Hening', icon: VolumeX, color: 'text-slate-400' },
    { id: 'rain', label: 'Hujan', icon: CloudRain, color: 'text-[#34ace0]' },
    { id: 'forest', label: 'Hutan', icon: Trees, color: 'text-[#2ecc71]' },
    { id: 'waves', label: 'Ombak', icon: Waves, color: 'text-[#00cec9]' },
    { id: 'cafe', label: 'Kafe', icon: Coffee, color: 'text-[#ffb142]' },
    { id: 'clock', label: 'Jam Tik-Tok', icon: Clock, color: 'text-[#ff5252]' },
  ];

  const handleSoundClick = (id) => {
    onSelectSound(id);
    if (id === 'none') {
      soundEngine.stop();
    } else {
      soundEngine.play(id, volume);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    onChangeVolume(val);
    soundEngine.setVolume(val);
  };

  return (
    <div className="w-full max-w-md mx-auto border rounded-2xl p-4 space-y-3 shadow-[var(--shadow-soft)]" style={{ background: 'var(--surface-card)', borderColor: 'var(--surface-border)' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
          <Volume2 className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          White Noise & Soundscape
        </span>
        <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
          {sounds.find((s) => s.id === currentSound)?.label || 'Hening'}
        </span>
      </div>

      {/* Soundscape Selector Grid */}
      <div className="grid grid-cols-6 gap-1.5">
        {sounds.map((s) => {
          const IconComp = s.icon;
          const isSelected = currentSound === s.id;
          return (
            <button
              key={s.id}
              onClick={() => handleSoundClick(s.id)}
              className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center border transition-all ${
                isSelected
                  ? 'shadow-sm scale-105'
                  : 'hover:opacity-80'
              }`}
              style={{
                background: isSelected ? 'var(--accent-pale)' : 'var(--surface-low)',
                borderColor: isSelected ? 'var(--accent)' : 'var(--surface-border)',
                color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
              title={s.label}
            >
              <IconComp className={`w-4 h-4 mb-1 ${isSelected ? s.color : ''}`} />
              <span className="text-[9px] tracking-tighter truncate w-full text-center">
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Volume Slider */}
      {currentSound !== 'none' && (
        <div className="flex items-center gap-3 pt-1 animate-fadeIn">
          <Volume1 className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
            style={{ background: 'var(--surface-border)', accentColor: 'var(--accent)' }}
          />
          <span className="text-xs font-bold w-8 text-right" style={{ color: 'var(--text-primary)' }}>
            {Math.round(volume * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
