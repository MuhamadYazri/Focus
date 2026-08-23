import React from 'react';

const NAV_ITEMS = [
  { key: 'home',    label: 'Dashboard', icon: 'grid_view' },
  { key: 'timer',   label: 'Timer',     icon: 'timer' },
  { key: 'reports', label: 'Reports',   icon: 'bar_chart' },
  { key: 'profile', label: 'Profile',   icon: 'person' },
];

export default function BottomNav({ activeTab, setActiveTab, isHidden = false }) {
  return (
    <nav
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
        isHidden ? 'translate-y-24 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
    >
      <div 
        className="flex items-center p-1.5 gap-1 rounded-full"
        style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--surface-border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        }}
      >
        {NAV_ITEMS.map(({ key, label, icon }) => {
          const on = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => {
                if (window.navigator?.vibrate) window.navigator.vibrate(10);
                setActiveTab(key);
              }}
              className={`relative flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                on ? 'px-4' : 'w-[42px] hover:scale-105 active:scale-95'
              }`}
              style={{
                height: 42,
                borderRadius: 21,
                background: on ? 'var(--accent)' : 'transparent',
                color: on ? 'var(--text-on-accent)' : 'var(--text-secondary)',
              }}
            >
              <span className={`material-symbols-outlined text-[20px] transition-transform duration-500 ${on ? 'fill scale-110' : ''}`}>
                {icon}
              </span>
              
              <span
                className={`font-mono text-[11px] font-bold tracking-wide transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden whitespace-nowrap ${
                  on ? 'max-w-[80px] opacity-100 ml-1.5 translate-x-0' : 'max-w-0 opacity-0 ml-0 -translate-x-2'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
