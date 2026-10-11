import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGridIcon as LayoutGrid,
  HourglassIcon as Timer,
  TrendingUpIcon as BarChart2,
  UserIcon as User,
} from 'lucide-animated';

const NAV_ITEMS = [
  { key: 'home', label: 'Home', Icon: LayoutGrid },
  { key: 'timer', label: 'Timer', Icon: Timer },
  { key: 'reports', label: 'Reports', Icon: BarChart2 },
  { key: 'profile', label: 'Profile', Icon: User },
];

function BottomNav({ activeTab, setActiveTab, isHidden = false }) {
  const iconRefs = React.useRef({});
  const isInitialMount = React.useRef(true);

  // Trigger icon animation whenever activeTab changes (via tap OR horizontal slide gesture)
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (activeTab && iconRefs.current[activeTab]) {
      iconRefs.current[activeTab].startAnimation();
      const timer = setTimeout(() => {
        if (iconRefs.current[activeTab]) {
          iconRefs.current[activeTab].stopAnimation();
        }
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  return (
    <nav
      className={`fixed bottom-0 w-full z-50 pointer-events-none transition-all duration-500 pb-[env(safe-area-inset-bottom,0px)] ${
        isHidden ? 'translate-y-24 opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      <div className="max-w-md mx-auto px-4 pb-5 pt-1 pointer-events-auto flex justify-center">
        <div className="w-full bg-surface/95 border border-border backdrop-blur-xl rounded-full p-1.5 shadow-lg flex items-center justify-between">
          {NAV_ITEMS.map(({ key, label, Icon }) => {
            const on = activeTab === key;
            return (
              <button
                key={key}
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
                  on ? 'text-white' : 'text-text-sub hover:text-primary active:scale-95'
                }`}
              >
                {on && (
                  <motion.div
                    layoutId="fluidNavTab"
                    className="absolute inset-0 bg-primary rounded-full shadow-md z-[-1]"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <div className="relative z-10 flex items-center justify-center gap-2">
                  <Icon
                    ref={(el) => (iconRefs.current[key] = el)}
                    animateOnHover={false}
                    size={on ? 18 : 20}
                    strokeWidth={on ? 2.5 : 2}
                  />
                  {on && (
                    <div className="overflow-hidden relative h-[18px] flex items-center">
                      <motion.span
                        key={key}
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: '0%', opacity: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 450,
                          damping: 32,
                          mass: 0.8,
                        }}
                        className="text-[13px] font-semibold tracking-tight font-sans whitespace-nowrap block"
                      >
                        {label}
                      </motion.span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default React.memo(BottomNav);
