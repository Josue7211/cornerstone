export function applyTransitionFlavor(refs, tl, style = 'push', direction = 1) {
  if (!refs || !tl) return;
  const { veil, transitionStage, stageRing, stageSweep, stageNoise, stageTrace, endFlash, bladeA, bladeB, cineTop, cineBottom } = refs;

  // Reset all overlay elements
  if (transitionStage) tl.set(transitionStage, { display: 'block', opacity: 1 }, 0);
  if (stageRing) tl.set(stageRing, { opacity: 0 }, 0);
  if (stageSweep) tl.set(stageSweep, { opacity: 0 }, 0);
  if (stageNoise) tl.set(stageNoise, { opacity: 0, display: 'none' }, 0);
  if (stageTrace) tl.set(stageTrace, { opacity: 0, display: 'none' }, 0);
  if (bladeA) tl.set(bladeA, { opacity: 0 }, 0);
  if (bladeB) tl.set(bladeB, { opacity: 0 }, 0);
  if (endFlash) tl.set(endFlash, { opacity: 0, display: 'none' }, 0);
  if (cineTop) tl.set(cineTop, { opacity: 0, height: 0 }, 0);
  if (cineBottom) tl.set(cineBottom, { opacity: 0, height: 0 }, 0);

  if (style === 'push') {
    // Subtle depth veil — slightly heavier than before so the Z-push reads
    if (veil) {
      veil.style.mixBlendMode = 'screen';
      veil.style.background = 'radial-gradient(circle at 50% 50%, rgba(80,160,255,0.18) 0%, rgba(20,60,140,0.08) 40%, rgba(7,10,22,0) 74%)';
      tl.fromTo(veil, { opacity: 0 }, { opacity: 0.22, duration: 0.18, ease: 'power2.out' }, 0);
      tl.to(veil, { opacity: 0, duration: 0.38, ease: 'power2.out' }, 0.2);
    }
  } else if (style === 'trace') {
    // Signal trace sweeps across — sharp glowing vertical line
    if (veil) {
      veil.style.mixBlendMode = 'screen';
      veil.style.background = 'radial-gradient(circle at 50% 50%, rgba(120,230,255,0.12) 0%, rgba(7,10,22,0) 60%)';
      tl.fromTo(veil, { opacity: 0 }, { opacity: 0.14, duration: 0.1, ease: 'none' }, 0);
      tl.to(veil, { opacity: 0, duration: 0.24, ease: 'power2.out' }, 0.16);
    }
    if (stageTrace) {
      stageTrace.style.position = 'absolute';
      stageTrace.style.top = '0';
      stageTrace.style.left = '0';
      stageTrace.style.width = '8px';
      stageTrace.style.height = '100%';
      stageTrace.style.background = 'linear-gradient(to right, transparent 0%, rgba(80,200,255,0.6) 30%, rgba(200,240,255,0.95) 50%, rgba(80,200,255,0.6) 70%, transparent 100%)';
      stageTrace.style.mixBlendMode = 'screen';
      stageTrace.style.pointerEvents = 'none';
      stageTrace.style.zIndex = '20';
      stageTrace.style.filter = 'blur(1px)';

      const startX = direction > 0 ? -1 : 101;
      const endX = direction > 0 ? 101 : -1;

      tl.set(stageTrace, { display: 'block', opacity: 0, xPercent: 0, left: `${startX}%` }, 0);
      tl.fromTo(
        stageTrace,
        { opacity: 0, left: `${startX}%` },
        { opacity: 1, left: `${endX}%`, duration: 0.28, ease: 'power2.inOut' },
        0.04
      );
      tl.to(stageTrace, { opacity: 0, duration: 0.06, ease: 'none' }, 0.3);
      tl.set(stageTrace, { display: 'none', opacity: 0 }, 0.38);
    }
  } else if (style === 'finale') {
    if (veil) {
      veil.style.mixBlendMode = 'screen';
      veil.style.background = 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.16) 0%, rgba(145,211,255,0.08) 30%, rgba(7,10,22,0.0) 74%)';
      tl.fromTo(veil, { opacity: 0 }, { opacity: 0.08, duration: 0.16, ease: 'power2.out' }, 0);
      tl.to(veil, { opacity: 0, duration: 0.34, ease: 'power2.out' }, 0.18);
    }
    if (stageRing) {
      stageRing.style.background = 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0) 0 22%, rgba(255,255,255,0.14) 24%, rgba(173,247,255,0.08) 30%, rgba(255,125,224,0.04) 36%, rgba(8,12,24,0) 48%)';
      stageRing.style.filter = 'saturate(1.0) blur(0.7px)';
      tl.fromTo(stageRing, { opacity: 0, scale: 0.98, rotate: -6 * direction }, { opacity: 0.05, scale: 1.02, rotate: 4 * direction, duration: 0.42, ease: 'power2.out' }, 0.06);
      tl.to(stageRing, { opacity: 0, scale: 1.04, duration: 0.22, ease: 'power2.out' }, 0.3);
    }
    if (stageSweep) {
      stageSweep.style.background = 'linear-gradient(112deg, transparent 0%, rgba(255,255,255,0) 36%, rgba(196,243,255,0.08) 46%, rgba(255,143,220,0.05) 54%, rgba(170,255,236,0.03) 60%, rgba(255,255,255,0) 72%, transparent 100%)';
      stageSweep.style.mixBlendMode = 'screen';
      tl.fromTo(stageSweep, { opacity: 0, xPercent: -118 * direction, skewX: -10 * direction }, { opacity: 0.03, xPercent: 96 * direction, skewX: -3 * direction, duration: 0.32, ease: 'power2.inOut' }, 0.12);
      tl.to(stageSweep, { opacity: 0, duration: 0.16, ease: 'power2.out' }, 0.28);
    }
    if (stageNoise) {
      stageNoise.style.backgroundImage = 'radial-gradient(circle at center, rgba(255,255,255,0.08) 0.55px, transparent 0.7px)';
      stageNoise.style.backgroundSize = '3px 3px';
      tl.set(stageNoise, { display: 'block' }, 0);
      tl.fromTo(stageNoise, { opacity: 0 }, { opacity: 0.08, duration: 0.14, ease: 'none' }, 0.08);
      tl.to(stageNoise, { opacity: 0, duration: 0.24, ease: 'none' }, 0.28);
    }
    if (endFlash) {
      tl.set(endFlash, { display: 'block', background: 'radial-gradient(circle at 50% 45%, rgba(255,255,255,0.86) 0%, rgba(214,234,255,0.44) 34%, rgba(10,12,22,0) 74%)' }, 0.16);
      tl.fromTo(endFlash, { opacity: 0 }, { opacity: 0.05, duration: 0.16, ease: 'power2.out' }, 0.22);
      tl.to(endFlash, { opacity: 0, duration: 0.24, ease: 'power2.out' }, 0.38);
      tl.set(endFlash, { display: 'none' }, 0.66);
    }
    if (cineTop && cineBottom) {
      tl.fromTo(cineTop, { opacity: 0, height: 0 }, { opacity: 0.16, height: 16, duration: 0.14, ease: 'sine.out' }, 0.08);
      tl.fromTo(cineBottom, { opacity: 0, height: 0 }, { opacity: 0.16, height: 16, duration: 0.14, ease: 'sine.out' }, 0.08);
      tl.to([cineTop, cineBottom], { opacity: 0, duration: 0.2, ease: 'power2.out' }, 0.44);
    }
  } else {
    // warp / legacy fallback — simple veil flash
    if (veil) {
      veil.style.mixBlendMode = 'screen';
      veil.style.background = 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.16) 0%, rgba(145,211,255,0.08) 30%, rgba(7,10,22,0.0) 74%)';
      tl.fromTo(veil, { opacity: 0 }, { opacity: 0.05, duration: 0.16, ease: 'power2.out' }, 0);
      tl.to(veil, { opacity: 0, duration: 0.34, ease: 'power2.out' }, 0.18);
    }
  }

  // Cleanup
  if (stageSweep) tl.set(stageSweep, { opacity: 0, clearProps: 'transform,background,mixBlendMode,skewX' }, 0.9);
  if (stageRing) tl.set(stageRing, { opacity: 0, clearProps: 'transform,background,filter' }, 0.92);
  if (stageNoise) tl.set(stageNoise, { opacity: 0, display: 'none', clearProps: 'backgroundImage,backgroundSize' }, 0.72);
  if (stageTrace) tl.set(stageTrace, { opacity: 0, display: 'none' }, 0.4);
  if (bladeA) tl.set(bladeA, { opacity: 0 }, 0.52);
  if (bladeB) tl.set(bladeB, { opacity: 0 }, 0.52);
  if (cineTop) tl.set(cineTop, { opacity: 0, height: 0 }, 0.92);
  if (cineBottom) tl.set(cineBottom, { opacity: 0, height: 0 }, 0.92);
  if (veil) tl.set(veil, { opacity: 0, display: 'none', clearProps: 'background,mixBlendMode' }, 0.96);
  if (transitionStage) tl.set(transitionStage, { opacity: 0, display: 'none' }, 0.96);
}
