import { TOTAL_SLIDES, AUTO_DWELLS, TRANSITION_STYLE_BY_SLIDE, EXPERIENCE_PROFILES } from './config.js';
import { buildContentMotion } from './effects/content-motion.js';
import { applyTransitionFlavor } from './effects/transition-flavors.js';

const DIRECTOR_SLOWDOWN = 1.0;

const SIGNATURE_BY_SLIDE = [
  { content: 1.02, three: 1.04, unlock: 1.12 }, // title
  { content: 0.99, three: 0.98, unlock: 1.02 },
  { content: 1.0, three: 1.0, unlock: 1.04 },
  { content: 1.0, three: 1.0, unlock: 1.06 },
  { content: 1.02, three: 1.02, unlock: 1.08 }, // connections
  { content: 1.0, three: 1.0, unlock: 1.04 },
  { content: 1.0, three: 1.01, unlock: 1.06 },
  { content: 0.99, three: 0.99, unlock: 1.04 },
  { content: 1.04, three: 1.06, unlock: 1.14 } // finale
];

const UNLOCK_BY_STYLE = {
  push: { min: 0.4, max: 0.62, add: 0.05, resetLead: 0.08, failSafeMs: 860 },
  trace: { min: 0.3, max: 0.48, add: 0.03, resetLead: 0.05, failSafeMs: 700 },
  warp: { min: 0.42, max: 0.68, add: 0.06, resetLead: 0.08, failSafeMs: 920 },
  iris: { min: 0.36, max: 0.56, add: 0.04, resetLead: 0.06, failSafeMs: 820 },
  shard: { min: 0.38, max: 0.58, add: 0.04, resetLead: 0.07, failSafeMs: 860 },
  katana: { min: 0.34, max: 0.52, add: 0.03, resetLead: 0.06, failSafeMs: 780 },
  parallax: { min: 0.38, max: 0.58, add: 0.04, resetLead: 0.07, failSafeMs: 840 },
  pulse: { min: 0.36, max: 0.56, add: 0.04, resetLead: 0.06, failSafeMs: 820 },
  scanline: { min: 0.34, max: 0.5, add: 0.03, resetLead: 0.06, failSafeMs: 760 },
  finale: { min: 0.46, max: 0.72, add: 0.08, resetLead: 0.09, failSafeMs: 980 }
};

class TransitionEngine {
  constructor(mode) {
    this.mode = mode;
    this.activeContentTl = null;
  }

  _scheduleSceneEnter(controller, delaySeconds = 0, timeline = null) {
    const m = this.mode;
    if (!controller || typeof controller.enter !== 'function') return;
    if (m.pendingSceneEnterCall && typeof m.pendingSceneEnterCall.kill === 'function') {
      m.pendingSceneEnterCall.kill();
      m.pendingSceneEnterCall = null;
    }
    if (timeline && typeof timeline.call === 'function') {
      timeline.call(() => {
        try { controller.enter(); } catch (_) {}
      }, null, Math.max(0, delaySeconds));
      return;
    }
    if (!window.gsap || delaySeconds <= 0) {
      try { controller.enter(); } catch (_) {}
      return;
    }
    m.pendingSceneEnterCall = gsap.delayedCall(delaySeconds, () => {
      try { controller.enter(); } catch (_) {}
      m.pendingSceneEnterCall = null;
    });
  }

  _resetSceneElements(scene) {
    if (!scene) return;
    scene.style.filter = '';
    scene.style.clipPath = '';
    scene.style.transform = '';
    const nodes = scene.querySelectorAll(
      '.slide-num, .slide-tag, h2, .slide-subtitle-big, .slide-body, .slide-thesis, .slide-connections, .slide-implications, .slide-advocacy-points, .slide-prep, .slide-qa, .slide-meta-info, .slide-preview, .slide-kicker-card, .reflection-item, .slide-ending-note, .rq-item, .method-card, .persp-item, .connection-item, .impl-item, .advocacy-point, .prep-item'
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
    if (m.transitionUnlockTimer) {
      clearTimeout(m.transitionUnlockTimer);
      m.transitionUnlockTimer = 0;
    }
    if (m.transitionFailSafeTimer) {
      clearTimeout(m.transitionFailSafeTimer);
      m.transitionFailSafeTimer = 0;
    }
    if (m.transitionResetCall && window.gsap) {
      m.transitionResetCall.kill();
      m.transitionResetCall = null;
    }
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
      this._resetSceneElements(newScene);
    }
    m.scenes.forEach((scene) => this._resetSceneElements(scene));
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
    m._setThreeWorld(target, 1);
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
    const cinematicThree = style === 'warp' || style === 'finale' || (prevIndex < 0 && target === 0);
    m._setThreeWorld(target, cinematicThree ? (immediate ? 0.95 : 1) : 0);
    const threeDuration = this.runThreeSceneIntro(prevIndex, target, direction, immediate, signature);
    m.lastSlideSwitchAt = performance.now();
    m._playBonziIntro(target);
    if (typeof m.playMidPresentationHeckle === 'function') {
      m.playMidPresentationHeckle(target);
    }
    m._refreshSceneScroll(newScene);

    const nextController = m.sceneControllers[target];
    if (nextController && typeof nextController.reset === 'function') {
      try { nextController.reset(); } catch (_) {}
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
    const transitionNonce = ++m.transitionNonce;
    const finalize = () => {
      if (finalized) return;
      if (transitionNonce !== m.transitionNonce) return;
      finalized = true;
      this._finalizeTransition(target, newScene);
    };
    const unlockProfile = UNLOCK_BY_STYLE[style] || { min: 0.44, max: 0.7, add: 0.06, resetLead: 0.08, failSafeMs: 940 };
    const computedUnlock = Math.min(
      unlockProfile.max,
      Math.max(
        unlockProfile.min,
        (transitionDuration || 0) + unlockProfile.add,
        Math.min(unlockProfile.max, (threeDuration || 0) * 0.42 + 0.12)
      )
    );
    const unlockMs = immediate ? 0 : Math.round(computedUnlock * 1000);
    m.transitionUnlockTimer = setTimeout(finalize, unlockMs);
    if (m.transitionFailSafeTimer) {
      clearTimeout(m.transitionFailSafeTimer);
      m.transitionFailSafeTimer = 0;
    }
    m.transitionFailSafeTimer = setTimeout(() => {
      if (transitionNonce !== m.transitionNonce) return;
      if (!m.transitioning) return;
      finalize();
    }, immediate ? 0 : unlockProfile.failSafeMs);
    if (!immediate && window.gsap) {
      m.transitionResetCall = gsap.delayedCall(
        Math.max(Math.max(0.32, unlockProfile.min - 0.06), computedUnlock - unlockProfile.resetLead),
        finalize
      );
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
    const styleOffsets = {
      push: { out: 0.22, in: 0.38, gap: 0.06, intro: 0.12, oldY: 0, newY: 0, oldScale: 0.985, oldXLead: 0, oldXExit: 0, newX: 0 },
      trace: { out: 0.12, in: 0.24, gap: 0.04, intro: 0.08, oldY: 0, newY: 0, oldScale: 1, oldXLead: 0, oldXExit: 0, newX: 0 },
      warp: { out: 0.24, in: 0.42, gap: 0.08, intro: 0.12, oldY: 0, newY: 0, oldScale: 0.94, oldXLead: 0, oldXExit: 0, newX: 0 },
      iris: { out: 0.18, in: 0.36, gap: 0.07, intro: 0.12, oldY: -2, newY: 4, oldScale: 0.996, oldXLead: 1, oldXExit: -3, newX: 4 },
      shard: { out: 0.18, in: 0.38, gap: 0.07, intro: 0.12, oldY: -2, newY: 4, oldScale: 0.996, oldXLead: 1, oldXExit: -3, newX: 4 },
      katana: { out: 0.14, in: 0.3, gap: 0.05, intro: 0.07, oldY: -1, newY: 2, oldScale: 0.998, oldXLead: 1, oldXExit: -5, newX: 5 },
      parallax: { out: 0.2, in: 0.42, gap: 0.08, intro: 0.12, oldY: -3, newY: 6, oldScale: 0.995, oldXLead: 1, oldXExit: -4, newX: 6 },
      pulse: { out: 0.14, in: 0.3, gap: 0.05, intro: 0.08, oldY: -1, newY: 2, oldScale: 1, oldXLead: 0, oldXExit: -1, newX: 1 },
      scanline: { out: 0.12, in: 0.26, gap: 0.04, intro: 0.07, oldY: 1, newY: -3, oldScale: 1, oldXLead: 0, oldXExit: 1, newX: -1 },
      finale: { out: 0.24, in: 0.46, gap: 0.09, intro: 0.12, oldY: -16, newY: 20, oldScale: 0.95, oldXLead: 0, oldXExit: 0, newX: 0 }
    }[style] || { out: 0.18, in: 0.36, gap: 0.07, intro: 0.12, oldY: -2, newY: 4, oldScale: 0.996, oldXLead: 1, oldXExit: -3, newX: 4 };
    const durOut = Math.max(styleOffsets.out, styleOffsets.out * contentMult);
    const durIn = Math.max(styleOffsets.in, styleOffsets.in * contentMult);
    const outEaseByStyle = {
      push: 'expo.in',
      trace: 'power3.in',
      warp: 'power2.inOut',
      iris: 'sine.inOut',
      shard: 'power2.inOut',
      katana: 'power3.inOut',
      parallax: 'sine.inOut',
      pulse: 'power2.inOut',
      scanline: 'sine.inOut',
      finale: 'expo.inOut'
    };
    const inEaseByStyle = {
      push: 'expo.out',
      trace: 'power3.out',
      warp: 'expo.out',
      iris: 'power2.out',
      shard: 'expo.out',
      katana: 'power3.out',
      parallax: 'power2.out',
      pulse: 'power2.out',
      scanline: 'sine.out',
      finale: 'expo.out'
    };
    const nextController = m.sceneControllers[nextIndex];

    applyTransitionFlavor(m.refs, tl, style, direction);

    if (style === 'push') {
      // Old slide slams back into Z — dramatic foreshortening
      if (oldScene && oldScene !== newScene) {
        tl.fromTo(
          oldScene,
          { opacity: 1, z: 0, rotationX: 0, transformPerspective: 900, force3D: true },
          { opacity: 0, z: -360, rotationX: 6, scale: 0.985, duration: durOut, ease: outEaseByStyle.push, force3D: true },
          0
        );
        tl.set(oldScene, { visibility: 'hidden', pointerEvents: 'none' }, durOut + 0.02);
      }
      // New slide punches in from deep Z
      tl.fromTo(
        newScene,
        { opacity: 0, z: -560, rotationX: -8, transformPerspective: 900, scale: 0.88, force3D: true },
        { opacity: 1, z: 0, rotationX: 0, scale: 1, duration: durIn, ease: inEaseByStyle.push, force3D: true, clearProps: 'x,y,z,scale,rotationX,rotationY,rotationZ,filter,transform,transformPerspective' },
        oldScene && oldScene !== newScene ? styleOffsets.gap : 0
      );
    } else if (style === 'trace') {
      // Clip-path wipe: new scene revealed as the trace line sweeps across
      const startClip = direction >= 0 ? 'inset(0 100% 0 0)' : 'inset(0 0% 0 100%)';
      const endClip = 'inset(0 0% 0 0%)';
      // Old scene fades out
      if (oldScene && oldScene !== newScene) {
        tl.fromTo(
          oldScene,
          { opacity: 1, force3D: true },
          { opacity: 0, duration: durOut, ease: outEaseByStyle.trace, force3D: true },
          0
        );
        tl.set(oldScene, { visibility: 'hidden', pointerEvents: 'none' }, durOut + 0.02);
      }
      // New scene wipes in via clipPath — line in transition-flavors is the boundary
      tl.fromTo(
        newScene,
        { opacity: 1, clipPath: startClip, force3D: true },
        { opacity: 1, clipPath: endClip, duration: durIn, ease: inEaseByStyle.trace, force3D: true, clearProps: 'x,y,scale,rotationX,rotationY,rotationZ,skewX,skewY,filter,clipPath,transform' },
        oldScene && oldScene !== newScene ? styleOffsets.gap : 0
      );
    } else if (style === 'warp') {
      // Portal suck: old shrinks and fades, new expands from center
      if (oldScene && oldScene !== newScene) {
        tl.fromTo(
          oldScene,
          { opacity: 1, scale: 1, force3D: true },
          { opacity: 0, scale: 0.94, duration: durOut, ease: 'power2.in', force3D: true },
          0
        );
        tl.set(oldScene, { visibility: 'hidden', pointerEvents: 'none' }, durOut + 0.02);
      }
      tl.fromTo(
        newScene,
        { opacity: 0, scale: 0.93, force3D: true },
        { opacity: 1, scale: 1, duration: durIn, ease: 'expo.out', force3D: true, clearProps: 'x,y,scale,rotationX,rotationY,rotationZ,skewX,skewY,filter,clipPath,transform' },
        oldScene && oldScene !== newScene ? styleOffsets.gap : 0
      );
    } else if (style === 'finale') {
      // Cinematic landing: old lifts and fades, new rises from below
      if (oldScene && oldScene !== newScene) {
        tl.fromTo(
          oldScene,
          { opacity: 1, scale: 1, y: 0, force3D: true },
          { opacity: 0, scale: 0.95, y: -16, duration: durOut, ease: 'expo.in', force3D: true },
          0
        );
        tl.set(oldScene, { visibility: 'hidden', pointerEvents: 'none' }, durOut + 0.02);
      }
      tl.fromTo(
        newScene,
        { opacity: 0, scale: 0.95, y: 20, force3D: true },
        { opacity: 1, scale: 1, y: 0, duration: durIn, ease: 'expo.out', force3D: true, clearProps: 'x,y,scale,rotationX,rotationY,rotationZ,skewX,skewY,filter,clipPath,transform' },
        oldScene && oldScene !== newScene ? styleOffsets.gap : 0
      );
    } else {
      if (oldScene && oldScene !== newScene) {
        tl.fromTo(
          oldScene,
          { opacity: 1, y: 0, scale: 1, force3D: true },
          {
            opacity: 0,
            x: direction * styleOffsets.oldXExit,
            y: styleOffsets.oldY,
            scale: styleOffsets.oldScale,
            duration: durOut,
            ease: outEaseByStyle[style] || 'power2.inOut',
            force3D: true
          },
          0
        );
        tl.set(oldScene, { visibility: 'hidden', pointerEvents: 'none' }, durOut + 0.02);
      }

      tl.fromTo(
        newScene,
        { opacity: 0, x: direction * styleOffsets.newX, y: styleOffsets.newY, scale: 1.005, force3D: true },
        {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration: durIn,
          ease: inEaseByStyle[style] || 'expo.out',
          force3D: true,
          clearProps: 'x,y,scale,rotationX,rotationY,rotationZ,skewX,skewY,filter,clipPath,transform'
        },
        oldScene && oldScene !== newScene ? styleOffsets.gap : 0
      );
    }

    const introTl = this.animateSceneContentIn(newScene, nextIndex, direction, false, sig);
    this._scheduleSceneEnter(nextController, oldScene && oldScene !== newScene ? styleOffsets.intro : 0.08, tl);
    if (introTl) {
      tl.add(introTl, oldScene && oldScene !== newScene ? styleOffsets.intro : 0.08);
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
        this._resetSceneElements(newScene);
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
        this._resetSceneElements(oldScene);
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
        this._resetSceneElements(newScene);
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
        this._resetSceneElements(oldScene);
      }
    });
    return tl.totalDuration();
  }

  animateSceneContentIn(scene, index, direction, immediate = false, signature = null) {
    if (!scene) return null;
    const title = scene.querySelector('h2');
    const meta = scene.querySelectorAll('.slide-num, .slide-tag');
    const body = scene.querySelectorAll('.slide-subtitle-big, .slide-body, .slide-thesis, .slide-connections, .slide-implications, .slide-advocacy-points, .slide-prep, .slide-qa, .slide-meta-info, .slide-preview, .slide-ending-note');
    const rq = scene.querySelectorAll('.rq-item');
    const methods = scene.querySelectorAll('.method-card');
    const perspectives = scene.querySelectorAll('.persp-item');
    const connections = scene.querySelectorAll('.connection-item');
    const implications = scene.querySelectorAll('.impl-item');
    const advocacy = scene.querySelectorAll('.advocacy-point');
    const prep = scene.querySelectorAll('.prep-item');
    const kickers = scene.querySelectorAll('.slide-kicker-card');
    const reflections = scene.querySelectorAll('.reflection-item');

    const all = [
      ...meta,
      title,
      ...body,
      ...kickers,
      ...reflections,
      ...rq,
      ...methods,
      ...perspectives,
      ...connections,
      ...implications,
      ...advocacy,
      ...prep
    ].filter(Boolean);
    const visible = all.filter((el) => {
      if (!(el instanceof HTMLElement)) return false;
      return el.style.display !== 'none' && getComputedStyle(el).display !== 'none';
    });
    const primary = [...meta, title, ...body].filter(Boolean);
    const secondary = visible.filter((el) => !primary.includes(el));
    const animated = [...primary, ...secondary].slice(0, 9);

    if (!window.gsap || immediate) {
      all.forEach((el) => {
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.filter = '';
      });
      return null;
    }

    gsap.killTweensOf(animated);
    const style = TRANSITION_STYLE_BY_SLIDE[index] || 'ignite';
    const sig = signature || SIGNATURE_BY_SLIDE[index] || SIGNATURE_BY_SLIDE[0];
    const contentMult = sig.content || 1;
    const { fromVars, toVars } = buildContentMotion(style, direction);
    toVars.duration = Math.max(0.4, Math.min(0.62, (toVars.duration || 0.5) * contentMult * 0.92));
    if (toVars.stagger && typeof toVars.stagger.each === 'number') {
      toVars.stagger = { ...toVars.stagger, each: Math.min(0.038, toVars.stagger.each * Math.max(0.88, contentMult * 0.86)) };
    }

    gsap.set(animated, { opacity: 0, force3D: true, clearProps: 'x,y,z,scale,rotation,rotationX,rotationY,filter,skewX,transform' });
    const tl = gsap.timeline();
    tl.fromTo(animated, fromVars, toVars, Math.max(0.06, 0.02 * contentMult));
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
    const style = TRANSITION_STYLE_BY_SLIDE[nextIndex] || 'trace';
    const sig = signature || SIGNATURE_BY_SLIDE[nextIndex] || SIGNATURE_BY_SLIDE[0];
    const threeMult = (sig.three || 1) * DIRECTOR_SLOWDOWN;
    const { camera, portal, portalHalo, renderer } = m.three;
    const { chipGroup, researchGroup, connectionsGroup, implicationsGroup, finaleGroup } = m.threeGroups;
    m._prepareTransitionMode(mode);
    m.threeTransitionActive = true;

    const tl = gsap.timeline();
    if (m.overlay && style === 'finale') {
      m.overlay.classList.add('pfs-hyperspace-active');
      tl.to(m.overlay, { duration: 0.01, onComplete: () => m.overlay.classList.remove('pfs-hyperspace-active') }, 0.62);
    }
    applyTransitionFlavor(m.refs, tl, style, direction, { nextIndex, prevIndex, mode });

    const styleTuning = {
      push: { camPunch: 0.62, camDuration: 0.94, portalSpin: 0.54, haloSpin: 0.48, flash: 0.64 },
      trace: { camPunch: 0.48, camDuration: 0.78, portalSpin: 0.74, haloSpin: 0.62, flash: 0.7 },
      iris: { camPunch: 0.58, camDuration: 0.9, portalSpin: 0.58, haloSpin: 0.5, flash: 0.64 },
      warp: { camPunch: 0.72, camDuration: 1.02, portalSpin: 0.6, haloSpin: 0.52, flash: 0.58 },
      katana: { camPunch: 0.52, camDuration: 0.86, portalSpin: 0.92, haloSpin: 0.74, flash: 0.7 },
      shard: { camPunch: 0.6, camDuration: 0.92, portalSpin: 0.78, haloSpin: 0.68, flash: 0.72 },
      parallax: { camPunch: 0.56, camDuration: 0.9, portalSpin: 0.64, haloSpin: 0.54, flash: 0.64 },
      pulse: { camPunch: 0.5, camDuration: 0.82, portalSpin: 0.66, haloSpin: 0.58, flash: 0.66 },
      scanline: { camPunch: 0.46, camDuration: 0.8, portalSpin: 0.58, haloSpin: 0.52, flash: 0.62 },
      finale: { camPunch: 0.62, camDuration: 0.98, portalSpin: 0.46, haloSpin: 0.4, flash: 0.4 }
    };
    const tune = styleTuning[style] || { camPunch: 0.52, camDuration: 0.58, portalSpin: 0.72, haloSpin: 0.62, flash: 0.68 };

    // Prevent tween overlap from previous transitions.
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(camera);
    gsap.killTweensOf(portal.rotation);
    gsap.killTweensOf(portalHalo.rotation);
    gsap.killTweensOf(portal.scale);
    gsap.killTweensOf(portalHalo.scale);
    gsap.killTweensOf(portal.material);
    gsap.killTweensOf(portalHalo.material);
    if (renderer && renderer.domElement) gsap.killTweensOf(renderer.domElement);
    // Always reset portal opacity to 0 so interrupted transitions don't accumulate
    gsap.set(portal.material, { opacity: 0 });
    gsap.set(portalHalo.material, { opacity: 0 });
    portal.visible = true;
    portalHalo.visible = true;

    const baseCamX = camera.position.x;
    const baseCamY = camera.position.y;
    const baseCamZ = camera.position.z;
    const baseFov = camera.fov;
    const cinematicThree = style === 'finale';

    // Anticipation beat before impact to avoid snap/teleport feel.
    tl.to(
      camera.position,
      { z: baseCamZ + 0.1, x: baseCamX - (0.02 * direction), y: baseCamY + 0.015, duration: 0.14 * threeMult, ease: 'sine.out' },
      0
    );
    tl.to(
      camera,
      {
        fov: baseFov + (isFirstEntry ? 3.2 : 2.6),
        duration: 0.18 * threeMult,
        ease: 'power2.out',
        onUpdate: () => camera.updateProjectionMatrix()
      },
      0
    );
    const anticipScale = style === 'iris' ? 0.985 : 0.965;
    const reboundScale = style === 'iris' ? 1.03 : 1.0;
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
        z: baseCamZ + (isFirstEntry ? 0.24 : tune.camPunch),
        x: baseCamX - ((isFirstEntry ? 0.05 : 0.11) * direction),
        y: baseCamY + 0.035,
        duration: 0.18 * threeMult,
        ease: 'sine.out'
      },
      0.12 * threeMult
    );
    tl.to(
      camera.position,
      { z: baseCamZ, x: baseCamX, y: baseCamY, duration: (isFirstEntry ? 0.78 : tune.camDuration) * threeMult, ease: 'sine.out' },
      0.24 * threeMult
    );
    tl.to(
      camera,
      {
        fov: baseFov,
        duration: (isFirstEntry ? 0.56 : 0.78) * threeMult,
        ease: 'power2.out',
        onUpdate: () => camera.updateProjectionMatrix()
      },
      0.24 * threeMult
    );
    tl.to(camera.position, { x: baseCamX + (0.012 * direction), duration: 0.16 * threeMult, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0.3 * threeMult);
    tl.fromTo(
      portal.rotation,
      { z: portal.rotation.z - (tune.portalSpin * direction) },
      { z: portal.rotation.z, duration: 0.92 * threeMult, ease: 'power3.out' },
      0
    );
    tl.fromTo(
      portalHalo.rotation,
      { z: portalHalo.rotation.z + (tune.haloSpin * direction) },
      { z: portalHalo.rotation.z, duration: 0.94 * threeMult, ease: 'power3.out' },
      0.05
    );
    if (cinematicThree) {
      const pulsePeak =
        isFirstEntry ? 0.28
        : mode === 'finale' ? 0.52
        : 0.68;
      // Always animate from 0 (we reset above) to prevent accumulation
      tl.to(portal.material, { opacity: pulsePeak * tune.flash, duration: 0.14 * threeMult, ease: 'power2.out' }, 0);
      tl.to(portal.material, { opacity: 0, duration: (isFirstEntry ? 0.94 : 0.72) * threeMult, ease: 'power2.out' }, 0.16 * threeMult);
      tl.to(portalHalo.material, { opacity: pulsePeak * 0.58 * tune.flash, duration: 0.14 * threeMult, ease: 'power2.out' }, 0.04);
      tl.to(portalHalo.material, { opacity: 0, duration: (isFirstEntry ? 0.96 : 0.74) * threeMult, ease: 'power2.out' }, 0.18 * threeMult);
      if (renderer && renderer.domElement) {
        tl.fromTo(renderer.domElement, { opacity: 0 }, { opacity: 0.76, duration: 0.18 * threeMult, ease: 'power2.in' }, 0);
        tl.to(
          renderer.domElement,
          { opacity: 0, duration: (isFirstEntry ? 0.3 : 0.58) * threeMult, ease: 'sine.out' },
          (isFirstEntry ? 0.26 : 0.64) * threeMult
        );
      }
    } else if (renderer && renderer.domElement) {
      // Push/trace: brief portal flash so the Three.js canvas is visible during transition
      const flashPeak = isFirstEntry ? 0.1 : (style === 'push' ? 0.4 : 0.28);
      tl.to(portal.material, { opacity: flashPeak * tune.flash, duration: 0.08 * threeMult, ease: 'power3.out' }, 0);
      tl.to(portal.material, { opacity: 0, duration: 0.18 * threeMult, ease: 'power2.out' }, 0.08 * threeMult);
      tl.to(portalHalo.material, { opacity: flashPeak * 0.44 * tune.flash, duration: 0.08 * threeMult, ease: 'power3.out' }, 0.02);
      tl.to(portalHalo.material, { opacity: 0, duration: 0.18 * threeMult, ease: 'power2.out' }, 0.1 * threeMult);
      tl.fromTo(renderer.domElement, { opacity: 0 }, { opacity: isFirstEntry ? 0.22 : 0.5, duration: 0.1 * threeMult, ease: 'power2.in' }, 0);
      tl.to(renderer.domElement, { opacity: 0, duration: 0.18 * threeMult, ease: 'power2.out' }, 0.1 * threeMult);
    }

    m._startParticleMorph(nextIndex, style, tl);
    // Ship is reserved for ESC exit warp only.
    if (m.shipRoot) m.shipRoot.visible = false;

    if (mode === 'chip') {
      tl.fromTo(chipGroup.scale, { x: 0.86, y: 0.86, z: 0.86 }, { x: 1, y: 1, z: 1, duration: 0.62, ease: 'power2.out' }, 0.04);
      tl.fromTo(chipGroup.rotation, { y: chipGroup.rotation.y - 0.38 }, { y: chipGroup.rotation.y, duration: 0.68, ease: 'power2.out' }, 0.04);
    } else if (mode === 'research') {
      tl.fromTo(researchGroup.scale, { x: 0.86, y: 0.86, z: 0.86 }, { x: 1, y: 1, z: 1, duration: 0.64, ease: 'power2.out' }, 0.03);
      tl.fromTo(researchGroup.rotation, { y: researchGroup.rotation.y + 0.42 }, { y: researchGroup.rotation.y, duration: 0.7, ease: 'power2.out' }, 0.03);
    } else if (mode === 'connections') {
      tl.fromTo(connectionsGroup.scale, { x: 0.84, y: 0.84, z: 0.84 }, { x: 1, y: 1, z: 1, duration: 0.66, ease: 'power2.out' }, 0.03);
      tl.fromTo(connectionsGroup.rotation, { y: connectionsGroup.rotation.y + (Math.PI * 0.24 * direction) }, { y: connectionsGroup.rotation.y, duration: 0.72, ease: 'power2.out' }, 0.03);
    } else if (mode === 'implications') {
      tl.fromTo(implicationsGroup.scale, { x: 0.86, y: 0.86, z: 0.86 }, { x: 1, y: 1, z: 1, duration: 0.64, ease: 'power2.out' }, 0.03);
      tl.fromTo(implicationsGroup.rotation, { y: implicationsGroup.rotation.y - 0.22 }, { y: implicationsGroup.rotation.y, duration: 0.68, ease: 'power2.out' }, 0.03);
    } else if (mode === 'finale') {
      tl.fromTo(finaleGroup.scale, { x: 0.8, y: 0.8, z: 0.8 }, { x: 1, y: 1, z: 1, duration: 0.72, ease: 'power2.out' }, 0.03);
      tl.fromTo(finaleGroup.rotation, { y: finaleGroup.rotation.y - Math.PI * 0.22 }, { y: finaleGroup.rotation.y, duration: 0.74, ease: 'power2.out' }, 0.03);
    }

    tl.call(() => {
      camera.fov = baseFov;
      camera.updateProjectionMatrix();
      m._resetThreeTransitionState(m._particleShapeForSlide(nextIndex));
      m.initialIntroPlayed = true;
    });

    m.threeTransitions = tl;
    return tl.totalDuration();
  }
}

export default TransitionEngine;
