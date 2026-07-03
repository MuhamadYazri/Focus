import React from 'react';
import { Settings, Clock, ShieldAlert, Volume2, RefreshCw, Smartphone, Award, ExternalLink } from 'lucide-react';
import { DEFAULT_SETTINGS, DEFAULT_PROJECTS, DEFAULT_TASKS, generateSampleSessions } from '../../services/storage';
import confetti from 'canvas-confetti';

export default function SettingsView({ settings, onUpdateSettings, onResetAllData }) {
  const handleChange = (key, value) => {
    onUpdateSettings({ ...settings, [key]: value });
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
    if (confirm('Apakah Anda yakin ingin mereset semua proyek, tugas, dan sesi ke data awal?')) {
      onResetAllData();
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-[#6c5ce7]" />
            Pengaturan
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Sesuaikan durasi timer, mode fokus, dan sistem suara
          </p>
        </div>
      </div>

      {/* Timer Durations Section */}
      <div className="bg-[#1c1c24] border border-[#2e2e3a] rounded-2xl p-4 space-y-4 shadow-lg">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 border-b border-[#2e2e3a] pb-2">
          <Clock className="w-4 h-4 text-[#ff5252]" />
          Durasi Sesi (Menit)
        </h3>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Fokus Kerja
            </label>
            <input
              type="number"
              value={settings.workDuration ?? 25}
              onChange={(e) => handleNumberChange('workDuration', e.target.value)}
              className="w-full bg-[#131318] border border-[#2e2e3a] rounded-xl py-2 px-3 text-center font-bold text-white focus:border-[#ff5252] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Istirahat Pendek
            </label>
            <input
              type="number"
              value={settings.shortBreakDuration ?? 5}
              onChange={(e) => handleNumberChange('shortBreakDuration', e.target.value)}
              className="w-full bg-[#131318] border border-[#2e2e3a] rounded-xl py-2 px-3 text-center font-bold text-white focus:border-[#2ecc71] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Istirahat Panjang
            </label>
            <input
              type="number"
              value={settings.longBreakDuration ?? 15}
              onChange={(e) => handleNumberChange('longBreakDuration', e.target.value)}
              className="w-full bg-[#131318] border border-[#2e2e3a] rounded-xl py-2 px-3 text-center font-bold text-white focus:border-[#34ace0] focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-2">
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            Interval Istirahat Panjang (Setiap Berapa Siklus?)
          </label>
          <select
            value={settings.longBreakInterval}
            onChange={(e) => handleChange('longBreakInterval', parseInt(e.target.value) || 4)}
            className="w-full bg-[#131318] border border-[#2e2e3a] rounded-xl py-2 px-3 text-sm text-white focus:border-[#34ace0] focus:outline-none cursor-pointer"
          >
            <option value="2">Setiap 2 Siklus Fokus</option>
            <option value="3">Setiap 3 Siklus Fokus</option>
            <option value="4">Setiap 4 Siklus Fokus (Standar Ilmiah)</option>
            <option value="5">Setiap 5 Siklus Fokus</option>
            <option value="6">Setiap 6 Siklus Fokus</option>
          </select>
        </div>
      </div>

      {/* Focus & Strict Mode */}
      <div className="bg-[#1c1c24] border border-[#2e2e3a] rounded-2xl p-4 space-y-4 shadow-lg">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 border-b border-[#2e2e3a] pb-2">
          <ShieldAlert className="w-4 h-4 text-[#ffb142]" />
          Mode Fokus & Distractions
        </h3>

        <div className="flex items-center justify-between py-1">
          <div>
            <h4 className="text-sm font-bold text-white">Strict Mode (Perisai Distraksi)</h4>
            <p className="text-[11px] text-slate-400">
              Peringatan dan getaran aktif jika Anda meninggalkan layar aplikasi saat timer berjalan
            </p>
          </div>
          <button
            onClick={() => handleChange('strictMode', !settings.strictMode)}
            className={`w-12 h-7 rounded-full p-1 transition-colors relative flex items-center ${
              settings.strictMode ? 'bg-[#ff5252]' : 'bg-[#2e2e3a]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.strictMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between py-1 border-t border-[#2e2e3a] pt-3">
          <div>
            <h4 className="text-sm font-bold text-white">Mulai Otomatis Istirahat</h4>
            <p className="text-[11px] text-slate-400">
              Langsung transisi ke istirahat sesaat setelah timer fokus 25 menit selesai
            </p>
          </div>
          <button
            onClick={() => handleChange('autoStartBreaks', !settings.autoStartBreaks)}
            className={`w-12 h-7 rounded-full p-1 transition-colors relative flex items-center ${
              settings.autoStartBreaks ? 'bg-[#2ecc71]' : 'bg-[#2e2e3a]'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                settings.autoStartBreaks ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Android & Data Management */}
      <div className="bg-[#1c1c24] border border-[#2e2e3a] rounded-2xl p-4 space-y-4 shadow-lg">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 border-b border-[#2e2e3a] pb-2">
          <Smartphone className="w-4 h-4 text-[#34ace0]" />
          Sistem & Manajemen Data
        </h3>

        <div className="flex items-center justify-between py-1">
          <div>
            <h4 className="text-sm font-bold text-white">Reset Semua Data Sampel</h4>
            <p className="text-[11px] text-slate-400">
              Kembalikan proyek, tugas, dan statistik ke pengaturan awal Focus To-Do
            </p>
          </div>
          <button
            onClick={handleResetData}
            className="px-3 py-1.5 rounded-xl bg-[#ff5252]/10 hover:bg-[#ff5252] text-[#ff5252] hover:text-white font-bold text-xs transition flex items-center gap-1.5 border border-[#ff5252]/30"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Data
          </button>
        </div>

        <div className="bg-[#131318] border border-[#2e2e3a] rounded-xl p-3 text-center text-xs text-slate-400 space-y-1">
          <p className="font-bold text-white">Focus — Productivity Time Tracker</p>
          <p className="text-[10px]">Version 1.0.0 (Android MVP Hybrid Built with Vite + Tailwind v4 + Capacitor)</p>
        </div>
      </div>
    </div>
  );
}
