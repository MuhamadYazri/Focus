import React from 'react';
import { CheckSquare, Timer, FolderKanban, BarChart2, Settings } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'tasks', label: 'Tugas', icon: CheckSquare },
    { id: 'timer', label: 'Fokus', icon: Timer },
    { id: 'projects', label: 'Proyek', icon: FolderKanban },
    { id: 'analytics', label: 'Laporan', icon: BarChart2 },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  const handleTabClick = (id) => {
    // Optional haptic vibration in Android WebView
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(15);
    }
    setActiveTab(id);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-[#2e2e3a] px-2 py-1.5 pb-safe md:pb-2">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-200 relative ${
                isActive
                  ? 'text-[#ff5252] scale-105 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <span className="absolute -top-1 w-8 h-1 bg-[#ff5252] rounded-full shadow-[0_0_10px_rgba(255,82,82,0.8)]" />
              )}
              <Icon className={`w-6 h-6 mb-1 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className="text-[11px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
