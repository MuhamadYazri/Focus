// Dedicated Web Worker timer for unthrottled background execution
class TimerWorkerService {
  constructor() {
    this.worker = null;
    this.fallbackInterval = null;
    this.onTick = null;
    this.initWorker();
  }

  initWorker() {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') return;

    try {
      const workerCode = `
        let intervalId = null;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            if (intervalId) clearInterval(intervalId);
            intervalId = setInterval(function() {
              self.postMessage('tick');
            }, 1000);
          } else if (e.data === 'stop') {
            if (intervalId) {
              clearInterval(intervalId);
              intervalId = null;
            }
          }
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      this.worker = new Worker(workerUrl);

      this.worker.onmessage = (e) => {
        if (e.data === 'tick' && this.onTick) {
          this.onTick();
        }
      };

      this.worker.onerror = () => {
        // Fallback interval handles tick continuity if Worker errors
      };
    } catch {
      this.worker = null;
    }
  }

  start(tickCallback) {
    this.onTick = tickCallback;

    if (this.worker) {
      try {
        this.worker.postMessage('start');
      } catch {
        // Fallback interval below guarantees ticks
      }
    }

    // Secondary fallback interval to guarantee ticks even if Worker is paused
    if (this.fallbackInterval) clearInterval(this.fallbackInterval);
    this.fallbackInterval = setInterval(() => {
      if (this.onTick) {
        this.onTick();
      }
    }, 1000);
  }

  stop() {
    if (this.worker) {
      try {
        this.worker.postMessage('stop');
      } catch {}
    }

    if (this.fallbackInterval) {
      clearInterval(this.fallbackInterval);
      this.fallbackInterval = null;
    }

    this.onTick = null;
  }
}

export const timerWorker = new TimerWorkerService();
