export function applyTransitionFlavor(refs, tl, style = 'warp', direction = 1) {
  if (!refs || !tl) return;
  const { veil, transitionStage, stageRing, stageSweep, stageNoise, endFlash, bladeA, bladeB, cineTop, cineBottom } = refs;

  if (transitionStage) tl.set(transitionStage, { display: 'block', opacity: 1 }, 0);
  if (stageRing) tl.set(stageRing, { opacity: 0, scale: 0.84, rotate: 0 }, 0);
  if (stageSweep) tl.set(stageSweep, { opacity: 0, xPercent: -130 * direction, skewX: -12 * direction }, 0);
  if (stageNoise) tl.set(stageNoise, { opacity: 0 }, 0);
  if (bladeA) tl.set(bladeA, { opacity: 0, xPercent: -140 }, 0);
  if (bladeB) tl.set(bladeB, { opacity: 0, xPercent: 140 }, 0);
  if (endFlash) tl.set(endFlash, { opacity: 0, display: 'none' }, 0);
  if (cineTop) tl.set(cineTop, { opacity: 0, height: 0 }, 0);
  if (cineBottom) tl.set(cineBottom, { opacity: 0, height: 0 }, 0);

  if (veil) {
    veil.style.mixBlendMode = 'screen';
    veil.style.background = 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.42) 0%, rgba(145,211,255,0.16) 26%, rgba(7,10,22,0.0) 72%)';
    tl.fromTo(veil, { opacity: 0 }, { opacity: 0.22, duration: 0.12, ease: 'power2.out' }, 0);
    tl.to(veil, { opacity: 0, duration: 0.34, ease: 'power2.out' }, 0.18);
  }

  if (stageRing) {
    tl.fromTo(
      stageRing,
      { opacity: 0, scale: style === 'finale' ? 0.72 : 0.84, rotate: -10 * direction },
      { opacity: style === 'finale' ? 0.72 : 0.46, scale: 1.12, rotate: 8 * direction, duration: 0.34, ease: 'expo.out' },
      0.02
    );
    tl.to(stageRing, { opacity: 0, scale: 1.28, duration: 0.28, ease: 'power2.out' }, 0.28);
  }

  if (stageSweep) {
    tl.fromTo(
      stageSweep,
      { opacity: 0, xPercent: -118 * direction, skewX: -12 * direction },
      { opacity: 0.58, xPercent: 112 * direction, skewX: -5 * direction, duration: 0.42, ease: 'power3.inOut' },
      0.04
    );
    tl.to(stageSweep, { opacity: 0, duration: 0.16, ease: 'power2.out' }, 0.34);
  }

  if (stageNoise) {
    tl.fromTo(stageNoise, { opacity: 0 }, { opacity: 0.12, duration: 0.08, ease: 'none' }, 0.06);
    tl.to(stageNoise, { opacity: 0, duration: 0.2, ease: 'none' }, 0.18);
  }

  if (style === 'katana' && bladeA && bladeB) {
    tl.fromTo(bladeA, { opacity: 0, xPercent: -130 }, { opacity: 0.52, xPercent: 0, duration: 0.14, ease: 'power4.out' }, 0.06);
    tl.fromTo(bladeB, { opacity: 0, xPercent: 130 }, { opacity: 0.46, xPercent: 0, duration: 0.14, ease: 'power4.out' }, 0.08);
    tl.to([bladeA, bladeB], { opacity: 0, duration: 0.16, ease: 'power2.out' }, 0.22);
  }

  if ((style === 'warp' || style === 'finale') && endFlash) {
    tl.set(endFlash, {
      display: 'block',
      background: 'radial-gradient(circle at 50% 45%, rgba(255,255,255,0.96) 0%, rgba(214,234,255,0.62) 32%, rgba(10,12,22,0) 72%)'
    }, 0.14);
    tl.fromTo(endFlash, { opacity: 0 }, { opacity: style === 'finale' ? 0.82 : 0.56, duration: 0.12, ease: 'power2.out' }, 0.14);
    tl.to(endFlash, { opacity: 0, duration: 0.2, ease: 'power2.out' }, 0.28);
    tl.set(endFlash, { display: 'none' }, 0.52);
  }

  if (style === 'finale' && cineTop && cineBottom) {
    tl.fromTo(cineTop, { opacity: 0, height: 0 }, { opacity: 0.58, height: 28, duration: 0.14, ease: 'power2.out' }, 0.02);
    tl.fromTo(cineBottom, { opacity: 0, height: 0 }, { opacity: 0.58, height: 28, duration: 0.14, ease: 'power2.out' }, 0.02);
    tl.to([cineTop, cineBottom], { opacity: 0, duration: 0.18, ease: 'power2.out' }, 0.34);
  }
}
