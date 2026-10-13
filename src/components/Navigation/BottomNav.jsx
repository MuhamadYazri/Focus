import React from 'react';

const NAV_ITEMS = [
  {
    key: 'home',
    label: 'Today',
    icon: (
      <svg className="w-4 h-4 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect height="18" rx="2" ry="2" width="18" x="3" y="4" />
        <line x1="16" x2="16" y1="2" y2="6" />
        <line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
      </svg>
    ),
  },
  {
    key: 'timer',
    label: 'Timer',
    icon: (
      <svg className="w-4 h-4 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    key: 'reports',
    label: 'Report',
    icon: (
      <svg className="w-4 h-4 stroke-[1.8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <line x1="18" x2="18" y1="20" y2="10" />
        <line x1="12" x2="12" y1="20" y2="4" />
        <line x1="6" x2="6" y1="20" y2="14" />
      </svg>
    ),
  },
];

function BottomNav({ activeTab, setActiveTab, isHidden = false }) {
  return (
    <aside
      className={`fixed bottom-6 inset-x-0 mx-auto w-[calc(100%-3rem)] max-w-[382px] z-50 transition-all duration-300 ${
        isHidden ? 'translate-y-28 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
      data-purpose="floating-dock-container"
    >
      <nav
        aria-label="Primary Navigation"
        className="bg-white/95 backdrop-blur-xl border border-[#E7ECE5] shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-full px-2.5 py-1.5 flex items-center justify-between"
      >
        {NAV_ITEMS.map(({ key, label, icon }) => {
          const on = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => {
                if (window.navigator?.vibrate) window.navigator.vibrate(10);
                setActiveTab(key);
              }}
              className={`tap-effect flex-1 flex items-center justify-center py-2 px-3 rounded-full transition-all relative ${
                on ? 'bg-[#161916] text-white shadow-xs' : 'text-[#485046] hover:text-[#161916]'
              }`}
            >
              <div className="flex items-center space-x-1.5 z-10">
                {icon}
                <span className={`text-xs tracking-tight ${on ? 'font-medium' : 'font-normal'}`}>
                  {label}
                </span>
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export default React.memo(BottomNav);
