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
      className={`glass-nav fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-4 pt-3 pb-8 transition-all duration-500 ${
        isHidden ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
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
            className={`flex flex-col items-center gap-1 transition-all duration-200 ${on ? 'scale-110' : 'scale-100'}`}
          >
            <span
              className={`material-symbols-outlined text-[24px] ${on ? 'fill' : ''}`}
              style={{ color: on ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            >
              {icon}
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                fontWeight: on ? 600 : 400,
                color: on ? 'var(--text-primary)' : 'var(--text-secondary)',
                letterSpacing: '0.02em',
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
