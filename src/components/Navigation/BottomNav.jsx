import React from 'react';
import { LayoutGrid, Timer, BarChart2, User } from 'lucide-react';

const NAV_ITEMS = [
  { key: 'home',    label: 'Home',    Icon: LayoutGrid },
  { key: 'timer',   label: 'Timer',   Icon: Timer },
  { key: 'reports', label: 'Reports', Icon: BarChart2 },
  { key: 'profile', label: 'Profile', Icon: User },
];

export default function BottomNav({ activeTab, setActiveTab, isHidden = false }) {
  return (
    <nav
      className={`fixed bottom-0 w-full z-50 pointer-events-none transition-all duration-500 pb-[env(safe-area-inset-bottom,0px)] ${
        isHidden ? 'translate-y-24 opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      <div className="max-w-md mx-auto px-4 pb-5 pt-1 pointer-events-auto flex justify-center">
        <div className="w-full bg-white/95 border border-[#EDE7DA] backdrop-blur-xl rounded-full p-1.5 shadow-[0_8px_24px_-4px_rgba(64,81,59,0.12),0_2px_6px_-1px_rgba(64,81,59,0.06)] flex items-center justify-between">
          {NAV_ITEMS.map(({ key, label, Icon }) => {
            const on = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => {
                  if (window.navigator?.vibrate) window.navigator.vibrate(10);
                  setActiveTab(key);
                }}
                className={`flex-1 min-h-[44px] rounded-full flex items-center justify-center transition-all ${
                  on 
                    ? 'gap-2 px-3.5 bg-[#40513B] text-white shadow-[0_4px_12px_rgba(64,81,59,0.28)]' 
                    : 'text-[#636F5A] hover:text-[#40513B] active:scale-95'
                }`}
              >
                <Icon size={on ? 18 : 20} strokeWidth={on ? 2.5 : 2} />
                {on && (
                  <span className="text-[13px] font-semibold tracking-tight font-sans">
                    {label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
