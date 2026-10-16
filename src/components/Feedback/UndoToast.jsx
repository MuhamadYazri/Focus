import React, { useEffect, useState } from 'react';
import { Undo2 } from 'lucide-react';

const DURATION_MS = 4000;

/**
 * Bottom toast with an Undo action and a countdown bar.
 * `toast` = { id, message, onUndo? } | null. A new id restarts the timer.
 */
export default function UndoToast({ toast, onDismiss }) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!toast) return undefined;
    setClosing(false);
    const closeTimer = setTimeout(() => setClosing(true), DURATION_MS - 220);
    const removeTimer = setTimeout(() => onDismiss(toast.id), DURATION_MS);
    return () => {
      clearTimeout(closeTimer);
      clearTimeout(removeTimer);
    };
  }, [toast?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!toast) return null;

  const handleUndo = () => {
    if (window.navigator?.vibrate) window.navigator.vibrate(10);
    if (toast.onUndo) toast.onUndo();
    onDismiss(toast.id);
  };

  return (
    <div className="fixed left-0 right-0 bottom-28 z-[70] flex justify-center px-5 pointer-events-none">
      <div
        key={toast.id}
        role="status"
        aria-live="polite"
        className={`pointer-events-auto relative w-full max-w-md overflow-hidden rounded-2xl bg-primary text-white shadow-xl shadow-primary/30 ring-1 ring-white/15 ${
          closing ? 'animate-toast-out' : 'animate-toast-in'
        }`}
      >
        <div className="flex items-center justify-between gap-3 pl-4 pr-2 py-2.5">
          <span className="font-sans text-[13px] font-semibold truncate">
            {toast.message}
          </span>
          {toast.onUndo && (
            <button
              type="button"
              onClick={handleUndo}
              className="shrink-0 flex items-center gap-1.5 h-8 px-3.5 rounded-full bg-white hover:bg-white/90 active:scale-95 transition-all text-primary font-mono text-[11px] font-bold uppercase tracking-wider shadow-sm"
            >
              <Undo2 size={14} strokeWidth={2.5} />
              Undo
            </button>
          )}
        </div>
        <div
          className="absolute left-0 bottom-0 h-[3px] w-full bg-secondary origin-left"
          style={{ animation: `toastCountdown ${DURATION_MS}ms linear forwards` }}
        />
      </div>
    </div>
  );
}
