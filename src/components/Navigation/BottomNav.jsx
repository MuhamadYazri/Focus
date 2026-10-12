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
      // Decouple by 1 frame so layout measurements settle before SVG path animation ticks
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

  return (
    <nav
      className={`fixed bottom-0 w-full z-50 pointer-events-none transition-all duration-500 pb-[env(safe-area-inset-bottom,0px)] will-change-transform transform-gpu ${
        isHidden ? 'translate-y-24 opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      <div className="max-w-md mx-auto px-4 pb-5 pt-1 pointer-events-auto flex justify-center">
        <div className="w-full bg-surface/95 border border-border backdrop-blur-xl rounded-full p-1.5 shadow-xl shadow-black/5 ring-1 ring-white/60 flex items-center justify-between transform-gpu">
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
                    className="absolute inset-0 bg-primary rounded-full shadow-md shadow-primary/20 ring-1 ring-white/20 z-[-1]"
                    transition={{ type: 'spring', bounce: 0.1, duration: 0.55 }}
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
                          stiffness: 320,
                          damping: 28,
                          mass: 0.9,
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
