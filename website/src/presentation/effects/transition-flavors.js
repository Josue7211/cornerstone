export function applyTransitionFlavor(refs, tl, style = 'warp', direction = 1) {
  if (!refs || !tl) return;
  const { veil, transitionStage, stageRing, stageSweep, stageNoise, endFlash, bladeA, bladeB, cineTop, cineBottom } = refs;
  const useNoise = style === 'finale';
  const config = {
    warp: { ringOpacity: 0.52, ringScaleFrom: 0.78, ringScaleTo: 1.18, sweepOpacity: 0.62, sweepDur: 0.46, veilOpacity: 0.24, flashOpacity: 0.62 },
    iris: { ringOpacity: 0.44, ringScaleFrom: 0.9, ringScaleTo: 1.08, sweepOpacity: 0.3, sweepDur: 0.32, veilOpacity: 0.14, flashOpacity: 0 },
    shard: { ringOpacity: 0.34, ringScaleFrom: 0.88, ringScaleTo: 1.06, sweepOpacity: 0.5, sweepDur: 0.34, veilOpacity: 0.16, flashOpacity: 0 },
    katana: { ringOpacity: 0.22, ringScaleFrom: 0.94, ringScaleTo: 1.02, sweepOpacity: 0.78, sweepDur: 0.22, veilOpacity: 0.12, flashOpacity: 0 },
    parallax: { ringOpacity: 0.26, ringScaleFrom: 0.9, ringScaleTo: 1.05, sweepOpacity: 0.26, sweepDur: 0.36, veilOpacity: 0.12, flashOpacity: 0 },
    pulse: { ringOpacity: 0.42, ringScaleFrom: 0.76, ringScaleTo: 1.1, sweepOpacity: 0.18, sweepDur: 0.28, veilOpacity: 0.16, flashOpacity: 0 },
    scanline: { ringOpacity: 0.2, ringScaleFrom: 0.92, ringScaleTo: 1.02, sweepOpacity: 0.38, sweepDur: 0.3, veilOpacity: 0.1, flashOpacity: 0 },
    finale: { ringOpacity: 0.72, ringScaleFrom: 0.7, ringScaleTo: 1.24, sweepOpacity: 0.7, sweepDur: 0.52, veilOpacity: 0.28, flashOpacity: 0.82 }
  }[style] || { ringOpacity: 0.4, ringScaleFrom: 0.84, ringScaleTo: 1.12, sweepOpacity: 0.42, sweepDur: 0.36, veilOpacity: 0.16, flashOpacity: 0 };

  if (transitionStage) tl.set(transitionStage, { display: 'block', opacity: 1 }, 0);
  if (stageRing) tl.set(stageRing, { opacity: 0, scale: 0.84, rotate: 0 }, 0);
  if (stageSweep) tl.set(stageSweep, { opacity: 0, xPercent: -130 * direction, skewX: -12 * direction }, 0);
  if (stageNoise) tl.set(stageNoise, { opacity: 0, display: useNoise ? 'block' : 'none' }, 0);
  if (bladeA) tl.set(bladeA, { opacity: 0, xPercent: -140 }, 0);
  if (bladeB) tl.set(bladeB, { opacity: 0, xPercent: 140 }, 0);
  if (endFlash) tl.set(endFlash, { opacity: 0, display: 'none' }, 0);
  if (cineTop) tl.set(cineTop, { opacity: 0, height: 0 }, 0);
  if (cineBottom) tl.set(cineBottom, { opacity: 0, height: 0 }, 0);

  if (veil) {
    veil.style.mixBlendMode = 'screen';
    veil.style.background = 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.42) 0%, rgba(145,211,255,0.16) 26%, rgba(7,10,22,0.0) 72%)';
    tl.fromTo(veil, { opacity: 0 }, { opacity: config.veilOpacity, duration: 0.14, ease: 'power2.out' }, 0);
    tl.to(veil, { opacity: 0, duration: 0.38, ease: 'power2.out' }, 0.2);
  }

  if (stageRing) {
    tl.fromTo(
      stageRing,
      { opacity: 0, scale: config.ringScaleFrom, rotate: -10 * direction },
      { opacity: config.ringOpacity, scale: config.ringScaleTo, rotate: 8 * direction, duration: 0.4, ease: 'expo.out' },
      0.04
    );
    tl.to(stageRing, { opacity: 0, scale: config.ringScaleTo + 0.12, duration: 0.3, ease: 'power2.out' }, 0.34);
  }

  if (stageSweep) {
    tl.fromTo(
      stageSweep,
      { opacity: 0, xPercent: -118 * direction, skewX: -12 * direction },
      { opacity: config.sweepOpacity, xPercent: 112 * direction, skewX: -5 * direction, duration: config.sweepDur, ease: 'power3.inOut' },
      style === 'katana' ? 0.08 : 0.1
    );
    tl.to(stageSweep, { opacity: 0, duration: 0.18, ease: 'power2.out' }, (style === 'katana' ? 0.22 : 0.34));
  }

  if (stageNoise && useNoise) {
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
    tl.fromTo(endFlash, { opacity: 0 }, { opacity: config.flashOpacity, duration: 0.14, ease: 'power2.out' }, 0.18);
    tl.to(endFlash, { opacity: 0, duration: 0.2, ease: 'power2.out' }, 0.28);
    tl.set(endFlash, { display: 'none' }, 0.52);
  }

  if (style === 'finale' && cineTop && cineBottom) {
    tl.fromTo(cineTop, { opacity: 0, height: 0 }, { opacity: 0.58, height: 28, duration: 0.14, ease: 'power2.out' }, 0.02);
    tl.fromTo(cineBottom, { opacity: 0, height: 0 }, { opacity: 0.58, height: 28, duration: 0.14, ease: 'power2.out' }, 0.02);
    tl.to([cineTop, cineBottom], { opacity: 0, duration: 0.18, ease: 'power2.out' }, 0.34);
  }

  if (stageSweep) tl.set(stageSweep, { opacity: 0, clearProps: 'transform' }, 0.56);
  if (stageRing) tl.set(stageRing, { opacity: 0, clearProps: 'transform' }, 0.58);
  if (stageNoise) tl.set(stageNoise, { opacity: 0, display: 'none' }, 0.42);
  if (bladeA) tl.set(bladeA, { opacity: 0 }, 0.34);
  if (bladeB) tl.set(bladeB, { opacity: 0 }, 0.34);
  if (cineTop) tl.set(cineTop, { opacity: 0, height: 0 }, 0.56);
  if (cineBottom) tl.set(cineBottom, { opacity: 0, height: 0 }, 0.56);
  if (veil) tl.set(veil, { opacity: 0, display: 'none' }, 0.62);
  if (transitionStage) tl.set(transitionStage, { opacity: 0, display: 'none' }, 0.62);
}
