// Web Audio API Synthesizer for Ambient White Noise & Alarm Chimes
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.activeSource = null;
    this.activeFilter = null;
    this.activeLfo = null;
    this.activeLfoGain = null;
    this.gainNode = null;
    this.clockInterval = null;
    this.currentSound = 'none';
    this.volume = 0.6;
    this.noiseBuffer = null;
    this.noiseBufferSampleRate = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  getOrCreateNoiseBuffer() {
    if (!this.ctx) return null;
    if (this.noiseBuffer && this.noiseBufferSampleRate === this.ctx.sampleRate) {
      return this.noiseBuffer;
    }

    // Create noise buffer once (3 seconds looped) and cache across plays
    const bufferSize = 3 * this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Fill buffer with Pink/White noise
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.1;
      b6 = white * 0.115926;
    }

    this.noiseBuffer = noiseBuffer;
    this.noiseBufferSampleRate = this.ctx.sampleRate;
    return this.noiseBuffer;
  }

  setVolume(val) {
    this.volume = val;
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(val, this.ctx.currentTime);
    }
  }

  stop() {
    if (this.activeSource) {
      try {
        this.activeSource.stop();
        this.activeSource.disconnect();
      } catch {}
      this.activeSource = null;
    }
    if (this.activeLfo) {
      try {
        this.activeLfo.stop();
        this.activeLfo.disconnect();
      } catch {}
      this.activeLfo = null;
    }
    if (this.activeLfoGain) {
      try {
        this.activeLfoGain.disconnect();
      } catch {}
      this.activeLfoGain = null;
    }
    if (this.activeFilter) {
      try {
        this.activeFilter.disconnect();
      } catch {}
      this.activeFilter = null;
    }
    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch {}
      this.gainNode = null;
    }
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }
    this.currentSound = 'none';
  }

  play(soundType, volume = 0.6) {
    this.stop();
    this.currentSound = soundType;
    this.volume = volume;
    if (soundType === 'none') return;

    this.init();
    if (!this.ctx) return;

    if (soundType === 'clock') {
      this.playClock();
      return;
    }

    const noiseBuffer = this.getOrCreateNoiseBuffer();
    if (!noiseBuffer) return;

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter audio based on soundscape
    const filter = this.ctx.createBiquadFilter();
    this.activeFilter = filter;
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.setValueAtTime(this.volume, this.ctx.currentTime);

    if (soundType === 'rain') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    } else if (soundType === 'forest') {
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(600, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.5, this.ctx.currentTime);
    } else if (soundType === 'waves') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, this.ctx.currentTime);
      // Simple LFO for wave modulation
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // 8 seconds wave cycle
      lfoGain.gain.setValueAtTime(300, this.ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      this.activeLfo = lfo;
      this.activeLfoGain = lfoGain;
    } else if (soundType === 'cafe') {
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, this.ctx.currentTime);
    }

    whiteNoise.connect(filter);
    filter.connect(this.gainNode);
    this.gainNode.connect(this.ctx.destination);

    whiteNoise.start();
    this.activeSource = whiteNoise;
  }

  playClock() {
    this.init();
    if (!this.ctx) return;
    this.clockInterval = setInterval(() => {
      if (!this.ctx || this.ctx.state === 'suspended') return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.03);
      
      gain.gain.setValueAtTime(this.volume * 0.3, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    }, 1000);
  }

  playChime() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // 5-second peaceful zen bell / vibraphone melody
    const notes = [
      { freq: 523.25, time: 0.0, duration: 2.2 },  // C5
      { freq: 783.99, time: 0.4, duration: 2.2 },  // G5
      { freq: 880.00, time: 0.8, duration: 2.2 },  // A5
      { freq: 1318.51, time: 1.3, duration: 2.2 }, // E6
      { freq: 1174.66, time: 1.9, duration: 2.2 }, // D6
      { freq: 1046.50, time: 2.5, duration: 2.2 }, // C6
      { freq: 880.00, time: 3.1, duration: 2.2 },  // A5
      { freq: 1046.50, time: 3.7, duration: 1.3 }, // C6 final chord note 1
      { freq: 1567.98, time: 3.7, duration: 1.3 }, // G6 final chord note 2
    ];

    notes.forEach(({ freq, time, duration }) => {
      const startTime = now + time;
      const endTime = startTime + duration;

      // Fundamental oscillator
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.volume * 0.35, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

      // Harmonic overtone for glass/bell timbre
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2.0, startTime);
      gain2.gain.setValueAtTime(0, startTime);
      gain2.gain.linearRampToValueAtTime(this.volume * 0.1, startTime + 0.02);
      gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * 0.6);

      osc.connect(gain);
      osc2.connect(gain2);
      gain.connect(this.ctx.destination);
      gain2.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(endTime);
      osc2.start(startTime);
      osc2.stop(startTime + duration * 0.6);
    });
  }
}

export const soundEngine = new SoundEngine();
