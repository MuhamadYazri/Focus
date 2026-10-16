import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import homeActiveJson from '../../assets/home-morph-active.json';
import homeInactiveJson from '../../assets/home-morph-inactive.json';

const HomeLottieIcon = forwardRef(function HomeLottieIcon(
  { on = false, size = 20, className = '' },
  ref
) {
  const [dotLottie, setDotLottie] = useState(null);

  // Expose imperative API for BottomNav triggers (like startAnimation)
  useImperativeHandle(
    ref,
    () => ({
      startAnimation: () => {
        if (dotLottie) {
          try {
            dotLottie.setSegment(0, 30);
            dotLottie.setLoop(false);
            dotLottie.setFrame(0);
            dotLottie.play();
          } catch {
            // Fail gracefully if player state is transitioning
          }
        }
      },
      stopAnimation: () => {
        // Keep final solid frame when selected
      },
    }),
    [dotLottie]
  );

  // When activeTab switches to home, play select morph (frames 0 -> 30)
  useEffect(() => {
    if (!dotLottie) return;

    if (on) {
      try {
        dotLottie.setSegment(0, 30);
        dotLottie.setLoop(false);
        dotLottie.setFrame(0);
        dotLottie.play();
      } catch {
        // Ignore transition error
      }
    } else {
      try {
        dotLottie.setFrame(0);
        dotLottie.stop();
      } catch {
        // Ignore transition error
      }
    }
  }, [on, dotLottie]);

  // Adjust icon dimensions to match surrounding lucide navigation icons (18-20px)
  const pxSize = size || (on ? 18 : 20);

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden ${className}`}
      style={{
        width: `${pxSize + 2}px`,
        height: `${pxSize + 2}px`,
      }}
    >
      <DotLottieReact
        key={on ? 'active-home' : 'inactive-home'}
        data={on ? homeActiveJson : homeInactiveJson}
        autoplay={on}
        loop={false}
        segment={on ? [0, 30] : [0, 0]}
        dotLottieRefCallback={setDotLottie}
        className="w-full h-full object-contain pointer-events-none"
      />
    </div>
  );
});

export default React.memo(HomeLottieIcon);
