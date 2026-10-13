import React from 'react';
import { motion } from 'framer-motion';
import {
  HomeIcon as Home,
  HourglassIcon as Timer,
  TrendingUpIcon as BarChart2,
  UserIcon as User,
  PlusIcon as Plus,
} from 'lucide-animated';

const LEFT_ITEMS = [
  { key: 'home', label: 'Home', Icon: Home },
  { key: 'timer', label: 'Timer', Icon: Timer },
];

const RIGHT_ITEMS = [
  { key: 'reports', label: 'Reports', Icon: BarChart2 },
  { key: 'profile', label: 'Profile', Icon: User },
];

function BottomNav({ activeTab, setActiveTab, onOpenNewTask, isHidden = false }) {
  const iconRefs = React.useRef({});
  const plusRef = React.useRef(null);
  const isInitialMount = React.useRef(true);

  // Trigger icon animation whenever activeTab changes
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (activeTab && iconRefs.current[activeTab]) {
      const raf = requestAnimationFrame(() => {
        if (iconRefs.current[activeTab]) {
          iconRefs.current[activeTab].startAnimation();
        }
      });
      const timer = setTimeout(() => {
        if (iconRefs.current[activeTab]) {
          iconRefs.current[activeTab].stopAnimation();
        }
      }, 650);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }
  }, [activeTab]);

  const renderNavButton = ({ key, label, Icon }) => {
    const on = activeTab === key;
    return (
      <button
        key={key}
        aria-label={label}
        onClick={() => {
          if (window.navigator?.vibrate) window.navigator.vibrate(10);
          if (activeTab === key) {
            if (iconRefs.current[key]) {
              iconRefs.current[key].startAnimation();
              setTimeout(() => {
                if (iconRefs.current[key]) iconRefs.current[key].stopAnimation();
              }, 650);
            }
            return;
          }
          setActiveTab(key);
        }}
        className={`relative flex-1 min-h-[44px] rounded-full flex items-center justify-center transition-colors z-0 ${
          on ? 'text-[#D6F3D0]' : 'text-[#B1C9AC] hover:text-white active:scale-95'
        }`}
      >
        {on && (
          <motion.div
            layoutId="fluidNavTab"
            className="absolute inset-0 bg-white/15 rounded-full shadow-inner ring-1 ring-white/10 z-[-1]"
            transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
          />
        )}
        <div className="relative z-10 flex items-center justify-center gap-1.5 px-3">
          <Icon
            ref={(el) => (iconRefs.current[key] = el)}
            animateOnHover={false}
            on={on}
            size={on ? 18 : 20}
            strokeWidth={on ? 2.5 : 2}
          />
          {on && (
            <motion.span
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="text-[11px] font-bold tracking-tight whitespace-nowrap block text-[#D6F3D0]"
            >
              {label}
            </motion.span>
          )}
        </div>
      </button>
    );
  };

  return (
    <nav
      className={`fixed bottom-0 w-full z-50 pointer-events-none transition-all duration-500 pb-[env(safe-area-inset-bottom,0px)] will-change-transform transform-gpu ${
        isHidden ? 'translate-y-28 opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      <div className="max-w-md mx-auto px-4 pb-4 pt-1 pointer-events-auto flex justify-center">
        <div className="w-full bg-[#41493F]/98 border border-[#2E342C]/80 backdrop-blur-2xl rounded-full p-1.5 shadow-[0_20px_40px_-10px_rgba(27,31,26,0.35)] ring-1 ring-white/10 flex items-center justify-between relative transform-gpu">
          {/* Left Tabs */}
          <div className="flex-1 flex items-center justify-around">
            {LEFT_ITEMS.map(renderNavButton)}
          </div>

          {/* Elevated Center (+) Action Button */}
          <div className="px-1.5 shrink-0 relative flex items-center justify-center">
            <button
              aria-label="Add Task"
              onClick={() => {
                if (window.navigator?.vibrate) window.navigator.vibrate(15);
                if (plusRef.current) {
                  plusRef.current.startAnimation();
                  setTimeout(() => plusRef.current?.stopAnimation(), 600);
                }
                if (onOpenNewTask) onOpenNewTask();
              }}
              className="w-12 h-12 rounded-full bg-[#D6F3D0] hover:bg-[#C5EBBB] text-[#1B1F1A] font-extrabold flex items-center justify-center -mt-6 shadow-xl shadow-black/25 border-[3.5px] border-[#41493F] active:scale-90 transition-transform cursor-pointer"
            >
              <Plus
                ref={plusRef}
                animateOnHover={false}
                size={22}
                strokeWidth={3}
              />
            </button>
          </div>

          {/* Right Tabs */}
          <div className="flex-1 flex items-center justify-around">
            {RIGHT_ITEMS.map(renderNavButton)}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default React.memo(BottomNav);
