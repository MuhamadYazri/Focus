import React from 'react';
import { Activity, Timer, BarChart2, BookOpen } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const items = [
    { key: 'home', label: 'Home', Icon: Activity },
    { key: 'timer', label: 'Timer', Icon: Timer },
    { key: 'reports', label: 'Reports', Icon: BarChart2 },
    { key: 'profile', label: 'Profile', Icon: BookOpen },
  ];

  return (
    <div
      style={{ borderTop: '1px solid #27272A', background: '#000000' }}
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-4 pt-3 pb-6 select-none"
    >
      <div className="w-full max-w-md mx-auto flex items-center justify-around">
        {items.map(({ key, label, Icon }) => {
          const on = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => {
                if (window.navigator && window.navigator.vibrate) {
                  window.navigator.vibrate(10);
                }
                setActiveTab(key);
              }}
              className="flex flex-col items-center gap-1.5 transition-opacity active:opacity-50 flex-1"
            >
              <div className="relative flex flex-col items-center gap-1.5">
                {on && (
                  <span
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: '#B9DAFF' }}
                  />
                )}
                <Icon size={18} color={on ? '#B9DAFF' : '#3F3F46'} strokeWidth={1.5} />
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 8,
                    color: on ? '#B9DAFF' : '#3F3F46',
                    letterSpacing: '0.06em',
                  }}
                >
                  {label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
