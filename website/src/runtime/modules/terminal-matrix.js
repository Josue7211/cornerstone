export function createMatrixRainController() {
  const matrixRainStates = new WeakMap();

  function cleanupMatrixRainForTarget(target) {
    if (!target) return;
    const layer = target.__matrixLayer || target;
    const state = matrixRainStates.get(layer);
    if (state && typeof state.cleanup === 'function') {
      state.cleanup();
    }
  }

  function triggerMatrixRain(target, duration = 7000) {
    if (!target) return;
    const output = target;
    const layer = target.__matrixLayer || target;
    const veil = target.__matrixVeil || null;
    if (matrixRainStates.has(layer)) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'matrix-rain-overlay';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '2';

    const ctx = canvas.getContext('2d');
    let drops = [];
    let animationId;
    let timeoutId;

    function resizeCanvas() {
      canvas.width = layer.clientWidth;
      canvas.height = layer.clientHeight;
      const cols = Math.max(1, Math.floor(canvas.width / 16));
      drops = Array.from({ length: cols }, () => 0);
    }

    function drawFrame() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#50ff50';
      ctx.font = '16px "Space Mono", monospace';
      drops.forEach((y, index) => {
        const charCode = 0x30A0 + Math.floor(Math.random() * 96);
        const char = String.fromCharCode(charCode);
        const x = index * 16;
        ctx.fillText(char, x, y);
        if (y > canvas.height && Math.random() > 0.98) {
          drops[index] = 0;
        } else {
          drops[index] = y + 12 + Math.random() * 6;
        }
      });
      animationId = requestAnimationFrame(drawFrame);
    }

    function cleanup() {
      cancelAnimationFrame(animationId);
      clearTimeout(timeoutId);
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('keydown', handleKey);
      canvas.remove();
      layer.classList.remove('matrix-rain-active');
      layer.style.zIndex = '0';
      if (output) {
        output.style.opacity = '';
        output.style.textShadow = '';
      }
      if (veil) veil.style.display = 'none';
      matrixRainStates.delete(layer);
    }

    function handleKey(event) {
      if (event.key === 'Escape') cleanup();
    }

    resizeCanvas();
    layer.style.zIndex = '4';
    layer.appendChild(canvas);
    layer.classList.add('matrix-rain-active');
    if (output) {
      output.style.opacity = '0';
      output.style.textShadow = 'none';
    }
    if (veil) veil.style.display = 'none';
    window.addEventListener('resize', resizeCanvas);
    document.addEventListener('keydown', handleKey);
    drawFrame();
    timeoutId = setTimeout(cleanup, duration);
    matrixRainStates.set(layer, { cleanup });

    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(220 + Math.random() * 220, audioCtx.currentTime);
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.02);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (_) {
      // audio may be unavailable; ignore
    }
  }

  return {
    triggerMatrixRain,
    cleanupMatrixRainForTarget
  };
}
