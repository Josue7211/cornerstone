export function createWin95Audio() {
  let audioCtx = null;
  const pool = new Map();

  const SOUND_MAP = {
    click: './assets/sounds/win98/click.wav',
    startup: './assets/sounds/win98/startup.wav',
    open: './assets/sounds/win98/open.wav',
    close: './assets/sounds/win98/close.wav',
    focus: './assets/sounds/win98/focus.wav',
    restore: './assets/sounds/win98/restore.wav',
    maximize: './assets/sounds/win98/maximize.wav',
    snap: './assets/sounds/win98/maximize.wav',
    minimize: './assets/sounds/win98/focus.wav'
  };

  function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }

  function pooledAudio(url) {
    if (!pool.has(url)) {
      const a = new Audio(url);
      a.preload = 'auto';
      pool.set(url, a);
    }
    return pool.get(url);
  }

  function playSoundFile(url, volume) {
    if (!url) return Promise.resolve(false);
    try {
      const base = pooledAudio(url);
      const clip = base.cloneNode(true);
      clip.volume = volume == null ? 0.72 : volume;
      clip.currentTime = 0;
      return clip.play().then(function() { return true; }).catch(function() { return false; });
    } catch (_) {
      return Promise.resolve(false);
    }
  }

  function playFallbackTone(freqA, freqB, durMs, gainValue) {
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(freqA, now);
      if (freqB != null) osc.frequency.linearRampToValueAtTime(freqB, now + durMs / 1000);
      gain.gain.setValueAtTime(gainValue == null ? 0.1 : gainValue, now);
      gain.gain.linearRampToValueAtTime(0.01, now + durMs / 1000);
      osc.start(now);
      osc.stop(now + durMs / 1000);
    } catch (_) {}
  }

  function playClickSound() {
    playSoundFile(SOUND_MAP.click, 0.65).then(function(ok) {
      if (!ok) playFallbackTone(880, 700, 35, 0.09);
    });
  }

  function playStartupChime() {
    try {
      const ctx = getAudioCtx();
      const freqs = [392.0, 523.25, 659.25];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        const t = ctx.currentTime + i * 0.115;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.22, t + 0.02);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.22);
        osc.frequency.setValueAtTime(freq, t);
        osc.start(t);
        osc.stop(t + 0.23);
      });
    } catch (_) {
      playFallbackTone(392, 659, 220, 0.16);
    }
  }

  function playWindowSound(type) {
    const key = SOUND_MAP[type] ? type : 'focus';
    playSoundFile(SOUND_MAP[key], 0.7).then(function(ok) {
      if (ok) return;
      switch (type) {
        case 'open':
          playFallbackTone(440, 587, 70, 0.1);
          break;
        case 'close':
          playFallbackTone(587, 392, 70, 0.1);
          break;
        case 'maximize':
        case 'snap':
          playFallbackTone(587, 740, 60, 0.1);
          break;
        case 'restore':
          playFallbackTone(392, 659, 80, 0.1);
          break;
        case 'minimize':
          playFallbackTone(523, 440, 45, 0.08);
          break;
        default:
          playFallbackTone(392, 466, 40, 0.07);
          break;
      }
    });
  }

  return {
    getAudioCtx,
    playClickSound,
    playStartupChime,
    playWindowSound
  };
}
