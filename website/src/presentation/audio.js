import { TRANSITION_STYLE_BY_SLIDE } from './config.js';

export function playNavSound(mode, direction) {
  if (!window.AudioContext && !window.webkitAudioContext) return;
  if (!mode.audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    mode.audioCtx = new Ctx();
  }
  const freq = direction >= 0 ? 720 : 420;
  const now = mode.audioCtx.currentTime;
  const osc = mode.audioCtx.createOscillator();
  const gain = mode.audioCtx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.035, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  osc.connect(gain).connect(mode.audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.13);
}

export function playTransitionSting(mode, index) {
  if (!window.AudioContext && !window.webkitAudioContext) return;
  if (!mode.audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    mode.audioCtx = new Ctx();
  }
  const style = TRANSITION_STYLE_BY_SLIDE[index] || 'ignite';
  const now = mode.audioCtx.currentTime;
  const mk = (type, f0, f1, t0, t1, g0, g1) => {
    const osc = mode.audioCtx.createOscillator();
    const gain = mode.audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, now + t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), now + t1);
    gain.gain.setValueAtTime(g0, now + t0);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, g1), now + t1);
    osc.connect(gain).connect(mode.audioCtx.destination);
    osc.start(now + t0);
    osc.stop(now + t1 + 0.02);
  };

  if (style === 'warp' || style === 'finale') {
    mk('sawtooth', 140, 880, 0, 0.22, 0.001, 0.03);
    mk('triangle', 440, 70, 0.02, 0.34, 0.02, 0.001);
  } else if (style === 'katana') {
    mk('square', 1200, 240, 0, 0.12, 0.012, 0.001);
  } else if (style === 'scanline') {
    mk('sine', 300, 1800, 0, 0.18, 0.001, 0.015);
  } else {
    mk('triangle', 260, 620, 0, 0.18, 0.001, 0.018);
  }
}
