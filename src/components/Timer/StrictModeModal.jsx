import React from 'react';
import { ShieldAlert, RotateCcw, Play } from 'lucide-react';

export default function StrictModeModal({ isOpen, onClose, onResetTimer }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm bg-[#1c1c24] border-2 border-[#ff5252] rounded-3xl shadow-2xl p-6 text-center text-white space-y-5 relative">
        <div className="w-16 h-16 bg-[#ff5252]/20 border border-[#ff5252] rounded-full flex items-center justify-center mx-auto text-[#ff5252] animate-bounce">
          <ShieldAlert className="w-8 h-8 stroke-[2.5]" />
        </div>

        <div>
          <h3 className="text-xl font-black text-[#ff5252]">
            Perhatian Terdistraksi!
          </h3>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Anda telah meninggalkan layar saat <strong className="text-white">Strict Mode</strong> aktif. Fokus ilmiah membutuhkan konsentrasi penuh tanpa gangguan dari aplikasi lain!
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2.5">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-[#ff5252] hover:bg-[#ff3b3b] text-white font-bold text-sm shadow-lg transition flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            Kembali Fokus Sekarang
          </button>

          <button
            onClick={() => {
              onResetTimer();
              onClose();
            }}
            className="w-full py-2.5 rounded-xl bg-transparent hover:bg-white/5 text-slate-400 hover:text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Menyerah & Reset Sesi Ini
          </button>
        </div>
      </div>
    </div>
  );
}
