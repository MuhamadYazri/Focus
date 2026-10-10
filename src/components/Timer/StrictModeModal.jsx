import React from 'react';
import { ShieldAlert } from 'lucide-react';

const G = "'Poppins', sans-serif";
const M = "'Poppins', sans-serif";

export default function StrictModeModal({ isOpen, onClose, onResetTimer }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none animate-fadeIn"
      style={{ background: 'rgba(10, 38, 53, 0.4)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
    >
      <div className="w-full max-w-sm border rounded-2xl shadow-lg p-6 text-center space-y-6 relative animate-slideUp" style={{ background: 'var(--surface-card)', borderColor: 'var(--surface-border)' }}>
        
        <div className="flex flex-col items-center gap-1">
          <ShieldAlert className="w-6 h-6 mb-3" style={{ color: 'var(--text-primary)' }} strokeWidth={1.5} />
          <span style={{ fontFamily: M, fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>
            STRICT MODE
          </span>
          <h3 className="text-lg mt-1" style={{ fontFamily: G, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Fokus Terputus
          </h3>
          <p className="text-sm mt-1.5 leading-relaxed" style={{ fontFamily: G, color: 'var(--text-secondary)' }}>
            Anda meninggalkan aplikasi saat sesi strict mode sedang berjalan.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-medium text-sm transition squish"
            style={{ fontFamily: G, background: 'var(--text-primary)', color: '#fff' }}
          >
            Lanjutkan Fokus
          </button>

          <button
            onClick={() => {
              onResetTimer();
              onClose();
            }}
            className="w-full py-3 rounded-xl bg-transparent font-medium text-sm transition squish"
            style={{ fontFamily: G, color: 'var(--text-secondary)' }}
          >
            Menyerah & Reset
          </button>
        </div>
      </div>
    </div>
  );
}
