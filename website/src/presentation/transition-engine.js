import { TOTAL_SLIDES, AUTO_DWELLS, TRANSITION_STYLE_BY_SLIDE, EXPERIENCE_PROFILES } from './config.js';
import { buildContentMotion } from './effects/content-motion.js';
import { applyTransitionFlavor } from './effects/transition-flavors.js';

const DIRECTOR_SLOWDOWN = 1.0;

const SIGNATURE_BY_SLIDE = [
  { content: 1.34, three: 1.46, unlock: 2.42 }, // title
  { content: 1.18, three: 1.14, unlock: 2.18 },
  { content: 1.2, three: 1.18, unlock: 2.24 },
  { content: 1.18, three: 1.24, unlock: 2.28 },
  { content: 1.28, three: 1.3, unlock: 2.36 }, // connections
  { content: 1.22, three: 1.2, unlock: 2.26 },
  { content: 1.18, three: 1.26, unlock: 2.32 },
  { content: 1.2, three: 1.16, unlock: 2.3 },
  { content: 1.42, three: 1.56, unlock: 2.58 } // finale
];

class TransitionEngine {
  constructor(mode) {
    this.mode = mode;
    this.activeContentTl = null;
  }

  _resetSceneElements(scene) {
    if (!scene) return;
    scene.style.filter = '';
    scene.style.clipPath = '';
    scene.style.transform = '';
    const nodes = scene.querySelectorAll(
      '.slide-num, .slide-tag, h2, .slide-body, .slide-thesis, .slide-connections, .slide-implications, .slide-advocacy-points, .slide-prep, .slide-qa, .rq-item, .method-card, .persp-item, .connection-item, .impl-item, .advocacy-point, .prep-item'
    );
    nodes.forEach((el) => {
      el.style.opacity = '1';
      el.style.filter = '';
      el.style.transform = '';
      el.style.clipPath = '';
    });
  }

  _finalizeTransition(target, newScene) {
    const m = this.mode;
    if (!m.isOpen) return;
    m.scenes.forEach((scene, idx) => {
      const isTarget = idx === target;
      scene.classList.toggle('active', isTarget);
      scene.style.pointerEvents = isTarget ? 'auto' : 'none';
      scene.style.visibility = isTarget ? 'visible' : 'hidden';
      scene.style.opacity = isTarget ? '1' : '0';
      scene.style.zIndex = isTarget ? '2' : '1';
      if (!isTarget) {
        scene.style.filter = '';
        scene.style.clipPath = '';
        scene.style.transform = '';
      }
    });
    if (newScene) {
      newScene.style.opacity = '1';
      newScene.style.filter = '';
      newScene.style.clipPath = '';
      newScene.style.transform = '';
    }
    if (m.overlay) m.overlay.classList.remove('pfs-hyperspace-active');
    if (m.overlay) m.overlay.classList.remove('pfs-in-transition');
    if (m.refs && m.refs.veil) {
      m.refs.veil.style.opacity = '0';
      m.refs.veil.style.display = 'none';
      m.refs.veil.style.mixBlendMode = 'normal';
      m.refs.veil.style.background = '';
    }
    if (m.refs && m.refs.transitionStage) {
      m.refs.transitionStage.style.opacity = '0';
      m.refs.transitionStage.style.display = 'none';
    }
    if (m.refs && m.refs.stageRing) {
      m.refs.stageRing.style.opacity = '0';
      m.refs.stageRing.style.transform = '';
    }
    if (m.refs && m.refs.stageSweep) {
      m.refs.stageSweep.style.opacity = '0';
      m.refs.stageSweep.style.transform = '';
    }
    if (m.refs && m.refs.stageNoise) {
      m.refs.stageNoise.style.opacity = '0';
    }
    m._resetThreeTransitionState(m._particleShapeForSlide(target));
    if (this.activeContentTl) {
      this.activeContentTl.kill();
      this.activeContentTl = null;
    }
    m.transitioning = false;
    if (m.autoPlayEnabled) m._scheduleAutoPlay(target);
  }

  goTo(index, immediate = false) {
    const m = this.mode;
    if (!m.isOpen || !m.overlay) return;
    const target = Math.max(0, Math.min(TOTAL_SLIDES - 1, index));
    if (!immediate && m.transitioning) return;
    if (!immediate && target === m.current) return;

    const prevIndex = m.current;
    m.current = target;
    m.transitioning = true;
    if (m.overlay) m.overlay.classList.add('pfs-in-transition');
    m._clearAutoPlay();
    if (this.activeContentTl) {
      this.activeContentTl.kill();
      this.activeContentTl = null;
    }
    if (m.threeTransitions) {
      m.threeTransitions.kill();
      m.threeTransitions = null;
    }
    m._resetThreeTransitionState(m._particleShapeForSlide(target));

    const oldScene = m.scenes[prevIndex];
    const newScene = m.scenes[target];
    if (!newScene) {
      m.transitioning = false;
      return;
    }

    const prevController = m.sceneControllers[prevIndex];
    if (prevController && typeof prevController.exit === 'function') {
      try { prevController.exit(); } catch (_) {}
    }

    m.scenes.forEach((scene, sceneIndex) => {
      const isOld = scene === oldScene;
      const isNew = scene === newScene;
      scene.style.filter = '';
      scene.style.clipPath = '';
      scene.style.transform = '';
      this._resetSceneElements(scene);
      if (isOld || isNew) {
        scene.classList.add('active');
        scene.style.visibility = 'visible';
        scene.style.pointerEvents = 'none';
      } else {
        scene.classList.remove('active');
        scene.style.visibility = 'hidden';
        scene.style.pointerEvents = 'none';
        scene.style.opacity = '0';
      }
    });
    if (oldScene) oldScene.style.opacity = '1';
    if (oldScene) oldScene.style.zIndex = '2';
    newScene.scrollTop = 0;
    newScene.style.opacity = '0';
    newScene.style.zIndex = '3';
    newScene.style.filter = '';
    newScene.style.clipPath = '';
    newScene.style.transform = '';
    if (m.overlay) m.overlay.classList.remove('pfs-hyperspace-active');
    if (m.refs && m.refs.veil) m.refs.veil.style.opacity = '0';
    this._resetSceneElements(newScene);

    m._applyProfile(target);
    m._updateNavUi();
    const direction = target > prevIndex ? 1 : -1;
    const signature = SIGNATURE_BY_SLIDE[target] || SIGNATURE_BY_SLIDE[0];
    const style = TRANSITION_STYLE_BY_SLIDE[target] || 'warp';
    m._setThreeWorld(target, immediate ? 0.95 : 1);
    const threeDuration = 0;
    m._playBonziIntro(target);
    if (typeof m.playMidPresentationHeckle === 'function') {
      m.playMidPresentationHeckle(target);
    }
    m._refreshSceneScroll(newScene);

    const nextController = m.sceneControllers[target];
    if (nextController && typeof nextController.reset === 'function') {
      try { nextController.reset(); } catch (_) {}
    }
    if (nextController && typeof nextController.enter === 'function') {
      try { nextController.enter(); } catch (_) {}
    }

    const transitionDuration = this.animateSceneTransition(oldScene, newScene, direction, target, immediate, signature, style);
    m._playTransitionSting(target);
    m._playNavSound(direction);
    if (m.transitionResetCall && window.gsap) {
      m.transitionResetCall.kill();
      m.transitionResetCall = null;
    }
    if (m.transitionUnlockTimer) {
      clearTimeout(m.transitionUnlockTimer);
      m.transitionUnlockTimer = 0;
    }
    let finalized = false;
    const finalize = () => {
      if (finalized) return;
      finalized = true;
      this._finalizeTransition(target, newScene);
    };
    const computedUnlock = Math.max(
      signature.unlock || 2.2,
      (transitionDuration || 0) + 0.24,
      (threeDuration || 0) + 0.18
    );
    const unlockMs = immediate ? 0 : Math.round(computedUnlock * 1000);
    m.transitionUnlockTimer = setTimeout(finalize, unlockMs);
    if (!immediate && window.gsap) {
      m.transitionResetCall = gsap.delayedCall(Math.max(1.2, computedUnlock - 0.18), finalize);
    } else {
      finalize();
    }
  }

  next() {
    const m = this.mode;
    if (!m.isOpen) return;
    if (m.current >= TOTAL_SLIDES - 1) return;
    if (m.transitioning) return;
    this.goTo(m.current + 1);
  }

  prev() {
    const m = this.mode;
    if (!m.isOpen) return;
    if (m.current <= 0) return;
    if (m.transitioning) return;
    this.goTo(m.current - 1);
  }

  scheduleAutoPlay(index) {
    const m = this.mode;
    const dwell = AUTO_DWELLS[index] || 18000;
    m._queueAutoAdvance(index, dwell);
  }

  animateSceneTransition(oldScene, newScene, direction, nextIndex, immediate, signature = null, style = 'warp') {
    const m = this.mode;
    const sig = signature || SIGNATURE_BY_SLIDE[nextIndex] || SIGNATURE_BY_SLIDE[0];
    const contentMult = (sig.content || 1) * DIRECTOR_SLOWDOWN;
    if (!window.gsap || immediate) {
      if (oldScene) oldScene.style.opacity = '0';
      newScene.style.opacity = '1';
      newScene.style.transform = 'none';
      newScene.style.clipPath = '';
      newScene.style.filter = '';
      this.animateSceneContentIn(newScene, nextIndex, direction, true, sig);
      return 0;
    }
    if (m.sceneTimelines[nextIndex]) {
      m.sceneTimelines[nextIndex].kill();
      m.sceneTimelines[nextIndex] = null;
    }
    if (oldScene && oldScene !== newScene) gsap.killTweensOf(oldScene);
    gsap.killTweensOf(newScene);
    const tl = gsap.timeline();
    this.activeContentTl = tl;
    const durOut = Math.max(0.16, 0.18 * contentMult);
    const durIn = Math.max(0.34, 0.42 * contentMult);

    applyTransitionFlavor(m.refs, tl, style, direction);

    if (oldScene && oldScene !== newScene) {
      tl.fromTo(
        oldScene,
        { opacity: 1, y: 0, scale: 1, force3D: true },
        { opacity: 0, y: -8, scale: 0.992, duration: durOut, ease: 'power2.inOut', force3D: true },
        0
      );
      tl.set(oldScene, { visibility: 'hidden', pointerEvents: 'none' }, durOut + 0.02);
    }

    tl.fromTo(
      newScene,
      { opacity: 0, y: 16, scale: 1.008, force3D: true },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: durIn,
        ease: 'expo.out',
        force3D: true,
        clearProps: 'x,y,scale,rotationX,rotationY,rotationZ,skewX,skewY,filter,clipPath,transform'
      },
      oldScene && oldScene !== newScene ? 0.12 : 0
    );

    const introTl = this.animateSceneContentIn(newScene, nextIndex, direction, false, sig);
    if (introTl) {
      tl.add(introTl, oldScene && oldScene !== newScene ? 0.2 : 0.08);
    }
    m.sceneTimelines[nextIndex] = null;
    tl.eventCallback('onInterrupt', () => {
      if (this.activeContentTl === tl) this.activeContentTl = null;
      if (newScene) {
        newScene.classList.add('active');
        newScene.style.visibility = 'visible';
        newScene.style.pointerEvents = 'auto';
        newScene.style.opacity = '1';
        newScene.style.filter = '';
        newScene.style.clipPath = '';
        newScene.style.transform = '';
        newScene.style.zIndex = '2';
      }
      if (oldScene && oldScene !== newScene) {
        oldScene.classList.remove('active');
        oldScene.style.visibility = 'hidden';
        oldScene.style.pointerEvents = 'none';
        oldScene.style.opacity = '0';
        oldScene.style.filter = '';
        oldScene.style.clipPath = '';
        oldScene.style.transform = '';
        oldScene.style.zIndex = '1';
      }
    });
    tl.eventCallback('onComplete', () => {
      if (this.activeContentTl === tl) this.activeContentTl = null;
      if (newScene) {
        newScene.classList.add('active');
        newScene.style.visibility = 'visible';
        newScene.style.pointerEvents = 'auto';
        newScene.style.opacity = '1';
        newScene.style.filter = '';
        newScene.style.clipPath = '';
        newScene.style.transform = '';
        newScene.style.zIndex = '2';
      }
      if (oldScene && oldScene !== newScene) {
        oldScene.classList.remove('active');
        oldScene.style.visibility = 'hidden';
        oldScene.style.pointerEvents = 'none';
        oldScene.style.opacity = '0';
        oldScene.style.filter = '';
        oldScene.style.clipPath = '';
        oldScene.style.transform = '';
        oldScene.style.zIndex = '1';
      }
    });
    return tl.totalDuration();
  }

  animateSceneContentIn(scene, index, direction, immediate = false, signature = null) {
    if (!scene) return null;
    const title = scene.querySelector('h2');
    const meta = scene.querySelectorAll('.slide-num, .slide-tag');
    const body = scene.querySelectorAll('.slide-body, .slide-thesis, .slide-connections, .slide-implications, .slide-advocacy-points, .slide-prep, .slide-qa');
    const rq = scene.querySelectorAll('.rq-item');
    const methods = scene.querySelectorAll('.method-card');
    const perspectives = scene.querySelectorAll('.persp-item');
    const connections = scene.querySelectorAll('.connection-item');
    const implications = scene.querySelectorAll('.impl-item');
    const advocacy = scene.querySelectorAll('.advocacy-point');
    const prep = scene.querySelectorAll('.prep-item');

    const all = [
      ...meta,
      title,
      ...body,
      ...rq,
      ...methods,
      ...perspectives,
      ...connections,
      ...implications,
      ...advocacy,
      ...prep
    ].filter(Boolean);

    if (!window.gsap || immediate) {
      all.forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.filter = '';
      });
      return null;
    }

    gsap.killTweensOf(all);
    const style = TRANSITION_STYLE_BY_SLIDE[index] || 'ignite';
    const sig = signature || SIGNATURE_BY_SLIDE[index] || SIGNATURE_BY_SLIDE[0];
    const contentMult = sig.content || 1;
    const { fromVars, toVars } = buildContentMotion(style, direction);
    toVars.duration = Math.max(0.42, (toVars.duration || 0.5) * contentMult);
    if (toVars.stagger && typeof toVars.stagger.each === 'number') {
      toVars.stagger = { ...toVars.stagger, each: Math.min(0.07, toVars.stagger.each * Math.max(1, contentMult * 0.94)) };
    }

    gsap.set(all, { opacity: 1, force3D: true, clearProps: 'x,y,scale,rotation,rotationX,rotationY,filter,skewX,transform' });
    const tl = gsap.timeline();
    tl.fromTo(all, fromVars, toVars, Math.max(0.06, 0.02 * contentMult));
    return tl;
  }

  runThreeSceneIntro(prevIndex, nextIndex, direction, immediate, signature = null) {
    const m = this.mode;
    if (!m.three || !window.gsap) return 0;
    if (m.threeTransitions) {
      m.threeTransitions.kill();
      m.threeTransitions = null;
    }

    if (immediate) return 0;
    const profile = EXPERIENCE_PROFILES[nextIndex] || EXPERIENCE_PROFILES[0];
    const mode = profile.three;
    const isFirstEntry = prevIndex < 0 && nextIndex === 0 && !m.initialIntroPlayed;
    const style = isFirstEntry ? 'warp' : (TRANSITION_STYLE_BY_SLIDE[nextIndex] || 'ignite');
    const sig = signature || SIGNATURE_BY_SLIDE[nextIndex] || SIGNATURE_BY_SLIDE[0];
    const threeMult = (sig.three || 1) * DIRECTOR_SLOWDOWN;
    const { camera, portal, portalHalo, renderer } = m.three;
    const { chipGroup, researchGroup, connectionsGroup, implicationsGroup, finaleGroup } = m.threeGroups;
    m._prepareTransitionMode(mode);
    m.threeTransitionActive = true;

    const tl = gsap.timeline();
    if (m.overlay) {
      m.overlay.classList.add('pfs-hyperspace-active');
      tl.to(m.overlay, { duration: 0.01, onComplete: () => m.overlay.classList.remove('pfs-hyperspace-active') }, isFirstEntry ? 0.56 : 0.42);
    }
    applyTransitionFlavor(m.refs, tl, style, direction, { nextIndex, prevIndex, mode });

    const styleTuning = {
      iris: { camPunch: 1.0, camDuration: 1.04, portalSpin: 0.94, haloSpin: 0.86, flash: 0.92 },
      warp: { camPunch: 1.54, camDuration: 1.34, portalSpin: 1.35, haloSpin: 1.12, flash: 1.3 },
      katana: { camPunch: 0.95, camDuration: 1.02, portalSpin: 1.62, haloSpin: 1.34, flash: 1.0 },
      shard: { camPunch: 1.08, camDuration: 1.08, portalSpin: 1.32, haloSpin: 1.14, flash: 1.08 },
      parallax: { camPunch: 1.0, camDuration: 1.02, portalSpin: 1.08, haloSpin: 0.9, flash: 0.92 },
      pulse: { camPunch: 0.9, camDuration: 0.96, portalSpin: 1.12, haloSpin: 1.0, flash: 1.02 },
      scanline: { camPunch: 0.84, camDuration: 0.94, portalSpin: 1.0, haloSpin: 0.92, flash: 0.92 },
      finale: { camPunch: 1.85, camDuration: 1.5, portalSpin: 2.02, haloSpin: 1.68, flash: 1.5 }
    };
    const tune = styleTuning[style] || { camPunch: 0.52, camDuration: 0.58, portalSpin: 0.72, haloSpin: 0.62, flash: 0.68 };

    // Prevent tween overlap from previous transitions.
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(portal.rotation);
    gsap.killTweensOf(portalHalo.rotation);
    gsap.killTweensOf(portal.scale);
    gsap.killTweensOf(portalHalo.scale);

    const baseCamX = camera.position.x;
    const baseCamY = camera.position.y;
    const baseCamZ = camera.position.z;

    // Anticipation beat before impact to avoid snap/teleport feel.
    tl.to(
      camera.position,
      { z: baseCamZ + 0.18, x: baseCamX - (0.04 * direction), y: baseCamY + 0.03, duration: 0.14 * threeMult, ease: 'power2.out' },
      0
    );
    const anticipScale = style === 'iris' ? 0.98 : 0.94;
    const reboundScale = style === 'iris' ? 1.06 : 1.0;
    tl.fromTo(
      portal.scale,
      { x: 1.02, y: 1.02, z: 1 },
      { x: anticipScale, y: anticipScale, z: 1, duration: 0.12 * threeMult, ease: 'power2.out' },
      0
    );
    tl.to(portal.scale, { x: reboundScale, y: reboundScale, z: 1, duration: 0.24 * threeMult, ease: 'expo.out' }, 0.12 * threeMult);

    tl.to(
      camera.position,
      {
        z: baseCamZ + (isFirstEntry ? 1.2 : tune.camPunch),
        x: baseCamX - ((isFirstEntry ? 0.24 : 0.18) * direction),
        y: baseCamY + 0.08,
        duration: 0.18 * threeMult,
        ease: 'power2.out'
      },
      0.12 * threeMult
    );
    tl.to(
      camera.position,
      { z: baseCamZ, x: baseCamX, y: baseCamY, duration: (isFirstEntry ? 1.5 : tune.camDuration) * threeMult, ease: 'expo.out' },
      0.28 * threeMult
    );
    tl.to(camera.position, { x: baseCamX + (0.08 * direction), duration: 0.2 * threeMult, yoyo: true, repeat: 2, ease: 'power1.inOut' }, 0.34 * threeMult);
    tl.fromTo(
      portal.rotation,
      { z: portal.rotation.z - (tune.portalSpin * direction) },
      { z: portal.rotation.z, duration: 1.12 * threeMult, ease: 'power3.out' },
      0
    );
    tl.fromTo(
      portalHalo.rotation,
      { z: portalHalo.rotation.z + (tune.haloSpin * direction) },
      { z: portalHalo.rotation.z, duration: 1.14 * threeMult, ease: 'power3.out' },
      0.05
    );
    const pulsePeak =
      mode === 'finale' ? 1.0
      : mode === 'connections' ? 0.9
      : mode === 'implications' ? 0.88
      : mode === 'research' ? 0.86
      : 0.82;
    tl.fromTo(portal.material, { opacity: pulsePeak * tune.flash }, { opacity: 0, duration: (isFirstEntry ? 1.22 : 0.98) * threeMult, ease: 'power2.out' }, 0);
    tl.fromTo(portalHalo.material, { opacity: pulsePeak * 0.62 * tune.flash }, { opacity: 0, duration: (isFirstEntry ? 1.22 : 1.0) * threeMult, ease: 'power2.out' }, 0.06);
    if (renderer && renderer.domElement) {
      tl.fromTo(renderer.domElement, { opacity: 0 }, { opacity: 1, duration: 0.14 * threeMult, ease: 'power2.in' }, 0);
      tl.to(renderer.domElement, { opacity: 0, duration: (isFirstEntry ? 0.86 : 0.74) * threeMult, ease: 'expo.out' }, (isFirstEntry ? 0.62 : 0.54) * threeMult);
    }

    m._startParticleMorph(nextIndex, style, tl);
    if (m.shipRoot && (style === 'warp' || style === 'finale')) {
      m.shipRoot.visible = true;
      m.shipRoot.position.set(0.5 * direction, -0.2, -7.2);
      m.shipRoot.rotation.set(0.1, Math.PI + (0.22 * direction), 0.04 * direction);
      m.shipRoot.scale.set(0.85, 0.85, 0.85);
      tl.to(m.shipRoot.position, { x: 0.05 * direction, y: -0.1, z: -4.8, duration: isFirstEntry ? 0.9 : 0.72, ease: 'expo.out' }, 0.02);
      tl.to(m.shipRoot.rotation, { x: -0.04, y: Math.PI + (0.04 * direction), z: -0.02 * direction, duration: isFirstEntry ? 0.9 : 0.72, ease: 'expo.out' }, 0.02);
      tl.to(m.shipRoot.scale, { x: 0.24, y: 0.24, z: 0.24, duration: 0.56, ease: 'power3.in' }, isFirstEntry ? 0.92 : 0.82);
      tl.set(m.shipRoot, { visible: false }, isFirstEntry ? 1.52 : 1.34);
    }

    if (mode === 'chip') {
      tl.fromTo(chipGroup.position, { x: chipGroup.position.x - 1.0, y: chipGroup.position.y - 0.18 }, { x: chipGroup.position.x, y: chipGroup.position.y, duration: 0.62, ease: 'expo.out' }, 0.04);
      tl.fromTo(chipGroup.rotation, { y: chipGroup.rotation.y - 1.0 }, { y: chipGroup.rotation.y, duration: 0.68, ease: 'power3.out' }, 0.04);
    } else if (mode === 'research') {
      tl.fromTo(researchGroup.rotation, { y: researchGroup.rotation.y + 1.2, x: -0.24 }, { y: researchGroup.rotation.y, x: 0, duration: 0.72, ease: 'expo.out' }, 0.02);
      tl.fromTo(researchGroup.position, { y: researchGroup.position.y + 0.45 }, { y: researchGroup.position.y, duration: 0.62, ease: 'power3.out' }, 0.04);
    } else if (mode === 'connections') {
      tl.fromTo(connectionsGroup.rotation, { y: connectionsGroup.rotation.y + (Math.PI * 0.5 * direction) }, { y: connectionsGroup.rotation.y, duration: 0.72, ease: 'expo.out' }, 0.03);
      tl.fromTo(connectionsGroup.position, { y: connectionsGroup.position.y - 0.4 }, { y: connectionsGroup.position.y, duration: 0.62, ease: 'power3.out' }, 0.03);
    } else if (mode === 'implications') {
      tl.fromTo(implicationsGroup.position, { y: implicationsGroup.position.y + 0.62 }, { y: implicationsGroup.position.y, duration: 0.68, ease: 'expo.out' }, 0.03);
      tl.fromTo(implicationsGroup.rotation, { y: implicationsGroup.rotation.y - 0.45 }, { y: implicationsGroup.rotation.y, duration: 0.62, ease: 'power3.out' }, 0.03);
    } else if (mode === 'finale') {
      tl.fromTo(finaleGroup.scale, { x: 0.4, y: 0.4, z: 0.4 }, { x: 1, y: 1, z: 1, duration: 0.65, ease: 'expo.out' }, 0.02);
      tl.fromTo(finaleGroup.rotation, { y: finaleGroup.rotation.y - Math.PI * 0.8 }, { y: finaleGroup.rotation.y, duration: 0.78, ease: 'power3.out' }, 0.02);
    }

    tl.call(() => {
      m._resetThreeTransitionState(m._particleShapeForSlide(nextIndex));
      m.initialIntroPlayed = true;
    });

    m.threeTransitions = tl;
    return tl.totalDuration();
  }
}

export default TransitionEngine;
