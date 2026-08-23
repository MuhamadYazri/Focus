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
        className="flex items-center p-2 gap-1 rounded-full shadow-ambient backdrop-blur-2xl"
        style={{
          background: 'rgba(255, 255, 255, 0.75)',
          border: '1px solid var(--surface-border)',
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
              className={`relative flex items-center justify-center transition-all duration-500 ease-out overflow-hidden ${
                on ? 'w-32 px-4 py-2' : 'w-12 h-12 hover:scale-110 active:scale-95'
              }`}
              style={{
                borderRadius: 99,
                background: on ? 'var(--accent)' : 'transparent',
                color: on ? 'var(--text-on-accent)' : 'var(--text-secondary)',
              }}
            >
              <div className={`flex items-center justify-center gap-2 transition-all duration-500`}>
                <span className={`material-symbols-outlined text-[22px] transition-transform duration-500 ${on ? 'fill scale-110' : ''}`}>
                  {icon}
                </span>
                
                {/* Text only visible when active, absolute positioned when inactive to allow smooth width expansion */}
                <span
                  className={`font-mono text-[11px] font-bold tracking-wide transition-all duration-500 ease-out ${
                    on ? 'opacity-100 translate-x-0 w-auto' : 'opacity-0 translate-x-4 w-0 absolute right-0'
                  }`}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
