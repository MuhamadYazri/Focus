import React from 'react';
import { ShieldAlert, RotateCcw, Play } from 'lucide-react';

export default function StrictModeModal({ isOpen, onClose, onResetTimer }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none animate-fadeIn"
      style={{ background: 'rgba(10, 38, 53, 0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
    >
      <div className="w-full max-w-sm border-2 border-[var(--accent)] rounded-3xl shadow-[var(--shadow-focus)] p-6 text-center space-y-5 relative animate-slideUp" style={{ background: 'var(--surface-card)', color: 'var(--text-on-accent)' }}>
        <div className="w-16 h-16 border rounded-full flex items-center justify-center mx-auto animate-bounce" style={{ background: 'var(--accent-pale)', borderColor: 'var(--accent)', color: 'var(--accent)' }}>
          <ShieldAlert className="w-8 h-8 stroke-[2.5]" />
        </div>

        <div>
          <h3 className="text-xl font-black" style={{ color: 'var(--accent)' }}>
            Perhatian Terdistraksi!
          </h3>
          <p className="text-xs mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Anda telah meninggalkan layar saat <strong style={{ color: 'var(--text-on-accent)' }}>Strict Mode</strong> aktif. Fokus ilmiah membutuhkan konsentrasi penuh tanpa gangguan dari aplikasi lain!
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2.5">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 hover:opacity-90"
            style={{ background: 'var(--accent)', color: 'var(--text-on-accent)' }}
          >
            <Play className="w-4 h-4 fill-current" />
            Kembali Fokus Sekarang
          </button>

          <button
            onClick={() => {
              onResetTimer();
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-transparent font-semibold text-xs transition flex items-center justify-center gap-1.5 hover:bg-[var(--surface-low)]/5"
            style={{ color: 'var(--text-muted)' }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Menyerah & Reset Sesi Ini
          </button>
        </div>
      </div>
    </div>
  );
}
