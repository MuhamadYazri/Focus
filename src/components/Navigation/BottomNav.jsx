import React from 'react';

const NAV_ITEMS = [
  {
    key: 'home',
    label: 'Today',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect height="18" rx="2" ry="2" width="18" x="3" y="4" strokeWidth="2" />
        <line x1="16" x2="16" y1="2" y2="6" strokeWidth="2" />
        <line x1="8" x2="8" y1="2" y2="6" strokeWidth="2" />
        <line x1="3" x2="21" y1="10" y2="10" strokeWidth="2" />
      </svg>
    ),
  },
  {
    key: 'timer',
    label: 'Timer',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
        <polyline points="12 7 12 12 15 14" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    key: 'reports',
    label: 'Report',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <line x1="18" x2="18" y1="20" y2="10" strokeWidth="1.8" />
        <line x1="12" x2="12" y1="20" y2="5" strokeWidth="1.8" />
        <line x1="6" x2="6" y1="20" y2="14" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    key: 'profile',
    label: 'Profile',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeWidth="1.8" />
        <circle cx="12" cy="7" r="4" strokeWidth="1.8" />
      </svg>
    ),
  },
];

const TAB_INDEX_MAP = { home: 0, timer: 1, reports: 2, profile: 3 };

function BottomNav({ activeTab, setActiveTab, isHidden = false }) {
  const activeIndex = TAB_INDEX_MAP[activeTab] ?? 0;

  return (
    <aside
      className={`fixed bottom-6 inset-x-0 mx-auto w-[calc(100%-2.5rem)] max-w-[382px] z-50 transition-all duration-300 ${
        isHidden ? 'translate-y-28 opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'
      }`}
      data-purpose="floating-dock-container"
    >
      <nav
        aria-label="Primary Navigation"
        className="h-[44px] bg-white/95 border border-[#E2E6E0] shadow-[0px_6px_24px_rgba(0,0,0,0.04)] rounded-full p-[4px_6px] flex items-center justify-between gap-1 relative overflow-hidden"
      >
        {/* Hardware-accelerated GPU sliding pill indicator (Zero getBoundingClientRect, zero layout reflow, INP < 30ms) */}
        <div
          aria-hidden="true"
          className="absolute top-[4px] bottom-[4px] w-[calc((100%-12px-12px)/4)] bg-[#1B1F1A] rounded-full shadow-[0px_1px_4px_-1px_rgba(27,31,26,0.15)] pointer-events-none transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
          style={{
            left: '6px',
            transform: `translate3d(calc(${activeIndex} * 100% + ${activeIndex * 4}px), 0, 0)`,
            willChange: 'transform',
          }}
        />

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
              className={`tap-effect flex-1 h-[32px] min-w-0 px-1.5 flex items-center justify-center rounded-full relative select-none z-10 transition-colors duration-150 ${
                on ? 'text-white' : 'text-[#667463] hover:text-[#1B1F1A]'
              }`}
            >
              <div className="flex items-center gap-[5px] truncate relative">
                <span className={`inline-flex items-center justify-center transition-colors duration-150 ${on ? 'text-white' : 'text-[#667463]'}`}>
                  {icon}
                </span>
                <span
                  className={`text-[12px] leading-[14px] tracking-[-0.2px] whitespace-nowrap transition-colors duration-150 ${
                    on ? 'font-semibold text-white' : 'font-medium text-[#667463]'
                  }`}
                >
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
