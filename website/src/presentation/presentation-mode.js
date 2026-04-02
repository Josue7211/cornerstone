import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import {
  TOTAL_SLIDES,
  MANUAL_HINT,
  AUTO_HINT,
  TRANSITION_STYLE_BY_SLIDE,
  PARTICLE_SHAPE_BY_SLIDE,
  EXPERIENCE_PROFILES,
  BONZI_LINES,
  BONZI_LABELS,
  BONZI_NARRATION_LINES
} from './config.js';
import { buildParticleShapeBuffers } from './particle-shapes.js';
import TransitionEngine from './transition-engine.js';
import { createSceneController } from './scenes/index.js';

class PresentationMode {
  constructor() {
    this.isOpen = false;
    this.current = 0;
    this.transitioning = false;
    this.closing = false;
    this.autoPlayEnabled = false;
    this.autoPaused = false;
    this.autoTimer = null;
    this.autoNarrationPromise = null;
    this.autoNarrationSlide = -1;
    this.autoNarrationToken = 0;
    this.autoStatusInterval = null;
    this.overlay = null;
    this.scenes = [];
    this.dots = [];
    this.cleanupFns = [];
    this.sceneControllers = [];
    this.boundKeydown = this._onKeyDown.bind(this);
    this.boundResize = this._onResize.bind(this);

    this.three = null;
    this.raf = 0;
    this.lastTick = 0;
    this.threeGroups = {};
    this.threeTransitions = null;
    this.threeMode = 'chip';
    this.sceneTimelines = [];
    this.threeTransitionActive = false;
    this.escapeWarpActive = false;
    this.particleMorph = null;
    this.pointer = { x: 0, y: 0 };
    this.boundPointerMove = this._onPointerMove.bind(this);
    this.boundPointerDown = this._onPointerDown.bind(this);
    this.shipRoot = null;
    this.transitionResetCall = null;
    this.transitionUnlockTimer = 0;
    this.bonziIntroCall = null;
    this.cameraHome = null;
    this.initialIntroPlayed = false;
    this.midPresentationHeckleShown = false;
    this.finalAchievementShown = false;
    this.transitionEngine = new TransitionEngine(this);
  }

  launch() {
    if (this.isOpen) return;
    this._cleanupLegacyOverlays();
    const panel = document.getElementById('panelPres');
    const sourceSlides = panel ? Array.from(panel.querySelectorAll('.pres-slide')) : [];
    if (!sourceSlides.length) return;

    const openPanel = panel ? panel.closest('.window') : null;
    if (openPanel && openPanel.classList.contains('open')) {
      openPanel.classList.remove('open');
    }

    this.isOpen = true;
    this.closing = false;
    this.current = -1;
    this.initialIntroPlayed = false;
    this.midPresentationHeckleShown = false;
    this.finalAchievementShown = false;
    this.sceneControllers = [];
    this.autoPlayEnabled = false;
    this.autoPaused = false;
    this.autoNarrationPromise = null;
    this.autoNarrationSlide = -1;
    this.autoNarrationToken = 0;
    this.autoStatusInterval = null;
    this.overlay = this._buildOverlay(sourceSlides);
    document.body.appendChild(this.overlay);
    document.body.classList.add('presentation-open');

    this._initThree();
    this._bindEvents();
    this.transitionEngine.goTo(0, false);
    this.overlay.focus();
  }

  close(reason = 'manual', force = false) {
    if (!this.isOpen) return;
    if (this.closing && !force) return;
    if (!force && reason === 'esc' && window.gsap) {
      this.closing = true;
      this._playExitWarp();
      return;
    }
    this._finalizeClose();
  }

  _finalizeClose() {
    if (this.overlay) this.overlay.classList.remove('pfs-hyperspace-active');
    if (this.overlay) this.overlay.classList.remove('pfs-in-transition');
    this.isOpen = false;
    this.transitioning = false;
    this.closing = false;
    this.escapeWarpActive = false;
    if (this.transitionUnlockTimer) {
      clearTimeout(this.transitionUnlockTimer);
      this.transitionUnlockTimer = 0;
    }

    this._clearAutoPlay();
    if (this.bonziIntroCall && typeof this.bonziIntroCall.kill === 'function') {
      this.bonziIntroCall.kill();
      this.bonziIntroCall = null;
    }
    this._unbindEvents();
    this._runCleanupFns();
    this._destroySceneControllers();
    this._destroyThree();
    if (window.Win95Speech && typeof window.Win95Speech.cancel === 'function') {
      window.Win95Speech.cancel('bonzi');
    }

    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    this.overlay = null;
    this.scenes = [];
    this.dots = [];
    document.body.classList.remove('presentation-open');
  }

  _playExitWarp() {
    const activeScene = this.scenes[this.current];
    if (!this.overlay || !window.gsap) {
      this._finalizeClose();
      return;
    }

    this._clearAutoPlay();
    this._unbindEvents();
    this.escapeWarpActive = true;
    this.threeTransitionActive = true;
    if (this.overlay) this.overlay.classList.add('pfs-in-transition');

    const tl = gsap.timeline({
      onComplete: () => this.close('warp-complete', true)
    });

    if (this.overlay) this.overlay.classList.add('pfs-hyperspace-active');

    if (this.three && this.three.renderer && this.three.renderer.domElement) {
      const { renderer, camera, stars, tunnelStars, portal, portalHalo } = this.three;
      tl.fromTo(renderer.domElement, { opacity: 0 }, { opacity: 1, duration: 0.1, ease: 'power2.in' }, 0);
      tl.to(camera.position, { z: 3.6, duration: 0.62, ease: 'power3.in' }, 0.02);
      tl.to(stars.material, { opacity: 0.95, duration: 0.28, ease: 'power2.out' }, 0.02);
      tl.to(tunnelStars.material, { opacity: 0.92, duration: 0.22, ease: 'power2.out' }, 0.02);
      tl.fromTo(portal.material, { opacity: 0.2 }, { opacity: 1.0, duration: 0.24, ease: 'power3.out' }, 0.08);
      tl.fromTo(portalHalo.material, { opacity: 0.1 }, { opacity: 0.7, duration: 0.24, ease: 'power3.out' }, 0.1);
      tl.to(portal.scale, { x: 2.2, y: 2.2, z: 1.3, duration: 0.52, ease: 'expo.in' }, 0.12);
      tl.to(portalHalo.scale, { x: 2.6, y: 2.6, z: 1.2, duration: 0.52, ease: 'expo.in' }, 0.12);
      tl.to(renderer.domElement, { opacity: 0, duration: 0.18, ease: 'power2.in' }, 0.62);
    }

    if (this.refs && this.refs.veil) {
      tl.fromTo(this.refs.veil, { opacity: 0 }, { opacity: 0.7, duration: 0.22, ease: 'power2.in' }, 0.12);
      tl.to(this.refs.veil, { opacity: 0, duration: 0.18, ease: 'power2.out' }, 0.44);
    }

    if (this.shipRoot) {
      this.shipRoot.visible = true;
      this.shipRoot.position.set(0.25, -0.18, -7.8);
      this.shipRoot.rotation.set(0.12, Math.PI * 1.02, -0.04);
      this.shipRoot.scale.set(1, 1, 1);
      tl.to(this.shipRoot.position, { x: 0.02, y: -0.08, z: -4.35, duration: 0.58, ease: 'expo.in' }, 0.06);
      tl.to(this.shipRoot.rotation, { x: -0.02, y: Math.PI * 1.12, z: 0.08, duration: 0.58, ease: 'expo.in' }, 0.06);
      tl.to(this.shipRoot.scale, { x: 0.14, y: 0.14, z: 0.14, duration: 0.3, ease: 'power3.in' }, 0.46);
      tl.set(this.shipRoot, { visible: false }, 0.7);
    }

    if (this.refs && this.refs.bladeA && this.refs.bladeB) {
      tl.fromTo(this.refs.bladeA, { xPercent: -150, opacity: 0 }, { xPercent: 130, opacity: 0.62, duration: 0.24, ease: 'power4.in' }, 0.08);
      tl.fromTo(this.refs.bladeB, { xPercent: 150, opacity: 0 }, { xPercent: -130, opacity: 0.58, duration: 0.24, ease: 'power4.in' }, 0.1);
      tl.to([this.refs.bladeA, this.refs.bladeB], { opacity: 0, duration: 0.14, ease: 'power2.out' }, 0.36);
    }

    if (activeScene) {
      tl.to(activeScene, { opacity: 0, scale: 1.05, filter: 'blur(10px)', duration: 0.42, ease: 'power3.in' }, 0.12);
    }

    if (this.refs && this.refs.endFlash) {
      tl.set(this.refs.endFlash, {
        display: 'block',
        background: 'radial-gradient(circle at 50% 45%, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.72) 34%, rgba(220,235,255,0.3) 58%, rgba(8,12,28,0.0) 100%)'
      }, 0.45);
      tl.fromTo(this.refs.endFlash, { opacity: 0 }, { opacity: 1, duration: 0.12, ease: 'power2.in' }, 0.46);
      tl.to(this.refs.endFlash, { opacity: 0, duration: 0.2, ease: 'power2.out' }, 0.6);
      tl.set(this.refs.endFlash, { display: 'none' }, 0.82);
    }
  }

  next() {
    this.transitionEngine.next();
  }

  prev() {
    this.transitionEngine.prev();
  }

  _cleanupLegacyOverlays() {
    const staleRoots = document.querySelectorAll(
      '.pres-fullscreen, .pfs-overlay, .pfs-root, #presentation-fullscreen-overlay'
    );
    staleRoots.forEach((root) => root.remove());
  }

  _buildOverlay(sourceSlides) {
    const root = document.createElement('div');
    root.className = 'pres-fullscreen';
    root.dataset.slide = '0';
    root.dataset.experience = EXPERIENCE_PROFILES[0].experience;
    root.tabIndex = 0;
    root.style.setProperty('--pfs-accent', EXPERIENCE_PROFILES[0].accent);

    const threeHost = document.createElement('div');
    threeHost.className = 'pfs-three-host';
    root.appendChild(threeHost);

    const ambient = document.createElement('div');
    ambient.className = 'pfs-ambient';
    ambient.innerHTML = `
      <div class="pfs-grid"></div>
      <div class="pfs-beam"></div>
      <div class="pfs-noise"></div>
      <div class="pfs-orb pfs-orb--a"></div>
      <div class="pfs-orb pfs-orb--b"></div>
    `;
    root.appendChild(ambient);

    const veil = document.createElement('div');
    veil.className = 'pfs-transition-veil';
    root.appendChild(veil);

    const transitionStage = document.createElement('div');
    transitionStage.className = 'pfs-transition-stage';
    transitionStage.innerHTML = `
      <div class="pfs-stage-ring"></div>
      <div class="pfs-stage-sweep"></div>
      <div class="pfs-stage-noise"></div>
    `;
    root.appendChild(transitionStage);

    const endFlash = document.createElement('div');
    endFlash.className = 'pfs-end-flash';
    root.appendChild(endFlash);

    const bladeA = document.createElement('div');
    bladeA.className = 'pfs-blade pfs-blade--a';
    root.appendChild(bladeA);
    const bladeB = document.createElement('div');
    bladeB.className = 'pfs-blade pfs-blade--b';
    root.appendChild(bladeB);

    const cineTop = document.createElement('div');
    cineTop.className = 'pfs-cinebar pfs-cinebar--top';
    root.appendChild(cineTop);
    const cineBottom = document.createElement('div');
    cineBottom.className = 'pfs-cinebar pfs-cinebar--bottom';
    root.appendChild(cineBottom);

    this.scenes = sourceSlides.map((source, index) => this._buildSceneFromSlide(source, index));
    this.scenes.forEach((scene) => root.appendChild(scene));

    const chapter = document.createElement('div');
    chapter.className = 'pfs-chapter';
    chapter.innerHTML = `
      <div class="pfs-chapter-tag"></div>
      <div class="pfs-chapter-title"></div>
    `;
    root.appendChild(chapter);

    const autoChip = document.createElement('button');
    autoChip.className = 'pfs-auto-chip';
    autoChip.type = 'button';
    autoChip.textContent = 'AUTO OFF';
    root.appendChild(autoChip);

    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'pfs-nav pfs-nav--prev';
    prevBtn.setAttribute('aria-label', 'Previous slide');
    prevBtn.textContent = '←';
    root.appendChild(prevBtn);

    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'pfs-nav pfs-nav--next';
    nextBtn.setAttribute('aria-label', 'Next slide');
    nextBtn.textContent = '→';
    root.appendChild(nextBtn);

    const dots = document.createElement('div');
    dots.className = 'pfs-dots';
    this.dots = this.scenes.map((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'pfs-dot';
      dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
      dots.appendChild(dot);
      return dot;
    });
    root.appendChild(dots);

    const hint = document.createElement('div');
    hint.className = 'pfs-hint';
    hint.textContent = MANUAL_HINT;
    root.appendChild(hint);

    const counter = document.createElement('div');
    counter.className = 'pfs-counter';
    counter.textContent = '01 / 09';
    root.appendChild(counter);

    const progress = document.createElement('div');
    progress.className = 'pfs-progress';
    progress.innerHTML = '<div class="pfs-progress-fill"></div>';
    root.appendChild(progress);

    const completion = document.createElement('div');
    completion.className = 'pfs-completion-chip';
    completion.style.cssText = 'position:absolute;right:18px;bottom:18px;padding:8px 10px;border:1px solid rgba(255,255,255,0.35);background:rgba(5,12,28,0.78);color:#d8e6ff;font-family:var(--font-pixel);font-size:7px;letter-spacing:0.02em;border-radius:6px;z-index:32;';
    completion.textContent = 'Progress: 14% ████░░░░░░';
    root.appendChild(completion);

    const bonzi = document.createElement('div');
    bonzi.className = 'pfs-bonzi is-visible';
    bonzi.dataset.side = EXPERIENCE_PROFILES[0].stage.side;
    bonzi.dataset.face = EXPERIENCE_PROFILES[0].stage.face;
    bonzi.innerHTML = `
      <div class="pfs-bonzi-bubble">
        <span class="pfs-bonzi-label">${BONZI_LABELS[0]}</span>
        <span class="pfs-bonzi-text">${BONZI_LINES[0]}</span>
      </div>
      <div class="pfs-bonzi-body">
        <img class="pfs-bonzi-figure" src="./assets/media/photos/bonzi-real.gif" alt="BonziBuddy">
      </div>
    `;
    root.appendChild(bonzi);

    this.refs = {
      root,
      threeHost,
      chapterTag: chapter.querySelector('.pfs-chapter-tag'),
      chapterTitle: chapter.querySelector('.pfs-chapter-title'),
      autoChip,
      autoStatus: null,
      prevBtn,
      nextBtn,
      hint,
      counter,
      progressFill: progress.querySelector('.pfs-progress-fill'),
      completion,
      bonzi,
      bonziLabel: bonzi.querySelector('.pfs-bonzi-label'),
      bonziText: bonzi.querySelector('.pfs-bonzi-text'),
      veil,
      transitionStage,
      stageRing: transitionStage.querySelector('.pfs-stage-ring'),
      stageSweep: transitionStage.querySelector('.pfs-stage-sweep'),
      stageNoise: transitionStage.querySelector('.pfs-stage-noise'),
      endFlash,
      bladeA,
      bladeB,
      cineTop,
      cineBottom
    };

    autoChip.addEventListener('click', () => {
      this.autoPlayEnabled = !this.autoPlayEnabled;
      if (this.autoPlayEnabled) this.autoPaused = false;
      this._applyAutoModeUi();
      if (this.autoPlayEnabled) {
        const currentText = BONZI_NARRATION_LINES[this.current] || (this.refs && this.refs.bonziText ? this.refs.bonziText.textContent : '');
        this._queueBonziNarration(currentText);
        this._scheduleAutoPlay(this.current);
      }
      else this._clearAutoPlay();
    });
    prevBtn.addEventListener('click', () => this.prev());
    nextBtn.addEventListener('click', () => this.next());
    this.dots.forEach((dot, index) => dot.addEventListener('click', () => this.transitionEngine.goTo(index)));

    return root;
  }

  _buildSceneFromSlide(source, index) {
    const profile = EXPERIENCE_PROFILES[index];
    const scene = document.createElement('section');
    scene.className = `pfs-scene ${profile.sceneClass || ''}`.trim();
    scene.dataset.index = String(index);

    const content = document.createElement('div');
    content.className = 'pfs-content';
    const clone = source.cloneNode(true);
    clone.classList.add('pfs-slide-inner');
    content.appendChild(clone);
    scene.appendChild(content);

    const controller = createSceneController(index, { mode: this, scene, profile });
    if (controller && typeof controller.mount === 'function') {
      try { controller.mount(); } catch (_) {}
    }
    this.sceneControllers[index] = controller || null;
    return scene;
  }

  _refreshSceneScroll(scene) {
    if (!scene) return;
    const content = scene.querySelector('.pfs-content');
    if (!content) return;
    requestAnimationFrame(() => {
      const available = window.innerHeight - 180;
      const needed = content.scrollHeight;
      scene.style.overflowY = needed > available ? 'auto' : 'hidden';
    });
  }

  _animateSceneTransition(oldScene, newScene, direction, nextIndex, immediate) {
    return this.transitionEngine.animateSceneTransition(oldScene, newScene, direction, nextIndex, immediate);
  }

  _animateSceneContentIn(scene, index, direction, immediate = false) {
    return this.transitionEngine.animateSceneContentIn(scene, index, direction, immediate);
  }

  _applyProfile(index) {
    const profile = EXPERIENCE_PROFILES[index] || EXPERIENCE_PROFILES[0];
    this.overlay.dataset.slide = String(index);
    this.overlay.dataset.experience = profile.experience;
    this.overlay.style.setProperty('--pfs-accent', profile.accent);

    if (this.refs && this.refs.chapterTag && this.refs.chapterTitle) {
      this.refs.chapterTag.textContent = this._slideTag(index);
      this.refs.chapterTitle.textContent = profile.chapter;
    }
  }

  _updateNavUi() {
    if (!this.refs) return;
    this.refs.counter.textContent = `${String(this.current + 1).padStart(2, '0')} / ${String(TOTAL_SLIDES).padStart(2, '0')}`;
    this.refs.progressFill.style.width = `${((this.current + 1) / TOTAL_SLIDES) * 100}%`;
    this.refs.prevBtn.classList.toggle('disabled', this.current === 0);
    this.refs.nextBtn.classList.toggle('disabled', this.current === TOTAL_SLIDES - 1);
    this.dots.forEach((dot, index) => dot.classList.toggle('active', index === this.current));
    this._updateCompletionMeter();
    if (this.current === TOTAL_SLIDES - 1 && !this.finalAchievementShown) {
      this.finalAchievementShown = true;
      this._showFinalAchievementPopup();
    }
  }

  _applyAutoModeUi() {
    if (!this.refs) return;
    if (!this.autoPlayEnabled) this.refs.autoChip.textContent = 'AUTO OFF';
    else if (this.autoPaused) this.refs.autoChip.textContent = 'AUTO PAUSED';
    else this.refs.autoChip.textContent = 'AUTO ON';

    this.refs.hint.textContent = this.autoPlayEnabled
      ? `${AUTO_HINT} · SPACE pause/resume`
      : MANUAL_HINT;
    this._setAutoStatus(
      !this.autoPlayEnabled ? 'AUTO OFF' : (this.autoPaused ? 'AUTO PAUSED' : 'AUTO STANDBY'),
      this.autoPlayEnabled && !this.autoPaused
    );
  }

  _scheduleAutoPlay(index) {
    this.transitionEngine.scheduleAutoPlay(index);
  }

  _clearAutoPlay() {
    this.autoNarrationToken += 1;
    if (this.autoTimer) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }
    if (this.autoStatusInterval) {
      clearInterval(this.autoStatusInterval);
      this.autoStatusInterval = null;
    }
    if (!this.autoPlayEnabled) this._setAutoStatus('AUTO OFF', false);
  }

  _queueAutoAdvance(index, maxWaitMs = 18000) {
    this._clearAutoPlay();
    if (!this.autoPlayEnabled || this.autoPaused || !this.isOpen) return;
    const token = ++this.autoNarrationToken;
    const waitPromise =
      this.autoNarrationSlide === index && this.autoNarrationPromise
        ? this.autoNarrationPromise
        : Promise.resolve(false);

    const startCountdown = (ms, prefix = 'NEXT') => {
      if (this.autoStatusInterval) clearInterval(this.autoStatusInterval);
      const deadline = Date.now() + ms;
      const tick = () => {
        const remaining = Math.max(0, deadline - Date.now());
        const seconds = (remaining / 1000).toFixed(1);
        this._setAutoStatus(`${prefix} IN ${seconds}s`, true);
      };
      tick();
      this.autoStatusInterval = setInterval(tick, 120);
    };

    const advanceIfAllowed = () => {
      if (!this.isOpen || !this.autoPlayEnabled) return;
      if (token !== this.autoNarrationToken) return;
      if (this.current >= TOTAL_SLIDES - 1) return;
      this.transitionEngine.goTo(this.current + 1);
    };

    this.autoTimer = setTimeout(() => {
      this.autoTimer = null;
      advanceIfAllowed();
    }, Math.max(1500, maxWaitMs));
    startCountdown(Math.max(1500, maxWaitMs), 'FALLBACK');

    Promise.resolve(waitPromise)
      .catch(() => false)
      .then(() => {
        startCountdown(900, 'NEXT');
        return new Promise((resolve) => setTimeout(resolve, 900));
      })
      .then(() => {
        if (token !== this.autoNarrationToken) return;
        if (this.autoTimer) {
          clearTimeout(this.autoTimer);
          this.autoTimer = null;
        }
        if (this.autoStatusInterval) {
          clearInterval(this.autoStatusInterval);
          this.autoStatusInterval = null;
        }
        advanceIfAllowed();
      });
  }

  _slideTag(index) {
    const scene = this.scenes[index];
    const tag = scene ? scene.querySelector('.slide-tag') : null;
    return (tag ? tag.textContent : '').trim() || `Slide ${index + 1}`;
  }

  _setBonziBubble(label, text) {
    if (!this.refs || !this.refs.bonziLabel || !this.refs.bonziText) return;
    this.refs.bonziLabel.textContent = label;
    this.refs.bonziText.textContent = text;
    if (this.autoPlayEnabled && !this.autoPaused) {
      const script = BONZI_NARRATION_LINES[this.current] || text;
      this._queueBonziNarration(script);
    }
  }

  _updateCompletionMeter() {
    if (!this.refs || !this.refs.completion) return;
    const denominator = Math.max(1, TOTAL_SLIDES - 1);
    const pct = Math.round(14 + ((this.current / denominator) * 86));
    const blocks = Math.max(0, Math.min(10, Math.round(pct / 10)));
    const bar = '█'.repeat(blocks) + '░'.repeat(10 - blocks);
    this.refs.completion.textContent = `Progress: ${pct}% ${bar}`;
  }

  _showClippyStartupPopup() {
    if (!this.overlay) return;
    const popup = document.createElement('div');
    popup.style.cssText = 'position:absolute;left:24px;top:18px;max-width:460px;padding:10px 12px;background:#fff7cf;border:2px outset #e7d8a0;color:#171717;z-index:40;font-family:var(--font-pixel);font-size:8px;line-height:1.4;display:flex;align-items:flex-end;gap:10px;';

    const clippyImg = document.createElement('img');
    clippyImg.src = './assets/media/photos/clippy-body.png?v=2';
    clippyImg.alt = 'Clippy';
    clippyImg.style.cssText = 'width:72px;height:auto;image-rendering:pixelated;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35));flex-shrink:0;';

    const textWrap = document.createElement('div');
    textWrap.style.cssText = 'display:flex;flex-direction:column;gap:6px;';
    textWrap.innerHTML = [
      '<div style="font-size:9px;">Clippy</div>',
      '<div style="margin-bottom:2px;">It looks like you\'re giving a presentation! Would you like me to minimize it and play Minesweeper?</div>'
    ].join('');

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:6px;';
    const yes = document.createElement('button');
    yes.type = 'button';
    yes.textContent = 'Yes';
    yes.style.cssText = 'font-family:var(--font-pixel);font-size:8px;padding:3px 8px;cursor:pointer;';
    const no = document.createElement('button');
    no.type = 'button';
    no.textContent = 'No';
    no.style.cssText = 'font-family:var(--font-pixel);font-size:8px;padding:3px 8px;cursor:pointer;';
    actions.appendChild(yes);
    actions.appendChild(no);
    textWrap.appendChild(actions);
    popup.appendChild(clippyImg);
    popup.appendChild(textWrap);
    this.overlay.appendChild(popup);

    const dismiss = () => {
      if (!popup.parentNode) return;
      popup.parentNode.removeChild(popup);
    };
    yes.addEventListener('click', () => {
      this._setBonziBubble('Clippy', 'Too late. We\'re already in fullscreen panic mode.');
      dismiss();
    });
    no.addEventListener('click', dismiss);
    setTimeout(dismiss, 7000);
  }

  _showFinalAchievementPopup() {
    if (!this.overlay) return;
    const popup = document.createElement('div');
    popup.style.cssText = 'position:absolute;right:26px;top:24px;min-width:320px;padding:10px;border:2px outset #cfd7ec;background:#eef3ff;color:#0f1221;z-index:42;font-family:var(--font-pixel);font-size:8px;';
    popup.innerHTML = [
      '<div style="font-size:9px;margin-bottom:6px;">Achievement Unlocked</div>',
      '<div>Survived IDS2891</div>'
    ].join('');
    this.overlay.appendChild(popup);
    setTimeout(() => {
      if (popup.parentNode) popup.parentNode.removeChild(popup);
    }, 5500);
  }

  playMidPresentationHeckle(index) {
    void index;
  }

  _queueBonziNarration(text) {
    const token = ++this.autoNarrationToken;
    this.autoNarrationSlide = this.current;
    this._runSceneNarrationHook('beforeSpeak', { slide: this.current, text, token });
    this._setAutoStatus('BONZI SPEAKING', true);
    this.autoNarrationPromise = this._speakBonzi(text).then((ok) => {
      if (token === this.autoNarrationToken) {
        this._runSceneNarrationHook('afterSpeak', { slide: this.current, text, token, ok });
      }
      return ok;
    });
    return this.autoNarrationPromise;
  }

  _runSceneNarrationHook(hook, payload) {
    const controller = this.sceneControllers[this.current];
    if (!controller || typeof controller[hook] !== 'function') return;
    try { controller[hook](payload); } catch (_) {}
  }

  _setAutoStatus(text, active) {
    if (!this.refs || !this.refs.autoChip) return;
    this.refs.autoChip.title = String(text || '');
    this.refs.autoChip.classList.toggle('is-live', !!active && this.autoPlayEnabled && !this.autoPaused);
  }

  _playBonziIntro(index) {
    if (!this.refs || !this.refs.bonzi) return;
    const profile = EXPERIENCE_PROFILES[index] || EXPERIENCE_PROFILES[0];
    const introStyle = profile.introStyle || 'peek';

    this.refs.bonzi.dataset.side = profile.stage.side || 'right';
    this.refs.bonzi.dataset.face = profile.stage.face || 'normal';
    this.refs.bonzi.classList.add('is-visible');
    this._setBonziBubble(BONZI_LABELS[index] || 'Note', BONZI_LINES[index] || BONZI_LINES[0]);

    if (!window.gsap) return;
    if (this.bonziIntroCall && typeof this.bonziIntroCall.kill === 'function') {
      this.bonziIntroCall.kill();
      this.bonziIntroCall = null;
    }
    gsap.killTweensOf(this.refs.bonzi);
    const signatureBySlide = [
      { duration: 0.86, settle: 0.24 }, // title
      { duration: 0.68, settle: 0.16 },
      { duration: 0.74, settle: 0.18 },
      { duration: 0.7, settle: 0.16 },
      { duration: 0.8, settle: 0.2 },
      { duration: 0.78, settle: 0.2 },
      { duration: 0.72, settle: 0.18 },
      { duration: 0.72, settle: 0.16 },
      { duration: 0.9, settle: 0.26 } // finale
    ];
    const sig = signatureBySlide[index] || signatureBySlide[0];
    const delayBySlide = [0.22, 0.12, 0.16, 0.14, 0.2, 0.18, 0.16, 0.15, 0.24];
    const introDelay = delayBySlide[index] ?? 0.14;
    const from = { x: 0, y: 0, scale: 1 };
    if (introStyle === 'peek') from.x = profile.stage.side === 'left' ? -40 : 40;
    if (introStyle === 'jump') { from.y = 44; from.scale = 0.94; }
    if (introStyle === 'drop') { from.y = -46; from.scale = 1.05; }
    if (introStyle === 'ascend') { from.y = 62; from.scale = 0.92; }
    if (introStyle === 'spark') { from.y = -18; from.x = profile.stage.side === 'left' ? -26 : 26; }

    this.bonziIntroCall = gsap.delayedCall(introDelay, () => {
      const tl = gsap.timeline();
      tl.fromTo(
        this.refs.bonzi,
        { opacity: 0, x: from.x, y: from.y, scale: from.scale },
        { opacity: 1, x: 0, y: 0, scale: 1, duration: sig.duration, ease: 'power3.out' }
      );
      tl.to(this.refs.bonzi, { y: -4, duration: sig.settle, yoyo: true, repeat: 1, ease: 'sine.inOut' }, '-=0.06');
    });
  }

  _speakBonzi(text) {
    if (!window.Win95Speech || typeof window.Win95Speech.speak !== 'function') return Promise.resolve(false);
    return window.Win95Speech
      .speak(String(text || ''), { character: 'bonzi', prefer: 'kokoro' })
      .then(() => true)
      .catch(() => false);
  }

  _bindEvents() {
    window.addEventListener('keydown', this.boundKeydown);
    window.addEventListener('resize', this.boundResize);
    window.addEventListener('pointermove', this.boundPointerMove);
    window.addEventListener('pointerdown', this.boundPointerDown);
  }

  _unbindEvents() {
    window.removeEventListener('keydown', this.boundKeydown);
    window.removeEventListener('resize', this.boundResize);
    window.removeEventListener('pointermove', this.boundPointerMove);
    window.removeEventListener('pointerdown', this.boundPointerDown);
  }

  _onKeyDown(event) {
    if (!this.isOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close('esc');
      return;
    }
    if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key.toLowerCase() === 'd') {
      event.preventDefault();
      this.next();
      return;
    }
    if (event.key === 'ArrowLeft' || event.key === 'PageUp' || event.key.toLowerCase() === 'a') {
      event.preventDefault();
      this.prev();
      return;
    }
    if (event.code === 'Space' || event.key === ' ') {
      if (!this.autoPlayEnabled) return;
      event.preventDefault();
      this._toggleAutoPause();
    }
  }

  _toggleAutoPause() {
    if (!this.autoPlayEnabled) return;
    this.autoPaused = !this.autoPaused;
    if (this.autoPaused) {
      this._clearAutoPlay();
      if (window.Win95Speech && typeof window.Win95Speech.cancel === 'function') {
        window.Win95Speech.cancel('bonzi');
      }
      this._setAutoStatus('AUTO PAUSED', false);
      this._applyAutoModeUi();
      return;
    }

    this._applyAutoModeUi();
    const script = BONZI_NARRATION_LINES[this.current] || (this.refs && this.refs.bonziText ? this.refs.bonziText.textContent : '');
    this._queueBonziNarration(script);
    this._scheduleAutoPlay(this.current);
  }

  _onResize() {
    if (!this.isOpen) return;
    this._refreshSceneScroll(this.scenes[this.current]);
    if (!this.three) return;
    const { camera, renderer } = this.three;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  }

  _onPointerMove(event) {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;
    this.pointer.x = ((event.clientX / w) - 0.5) * 2;
    this.pointer.y = ((event.clientY / h) - 0.5) * 2;
    if (this.overlay) {
      this.overlay.style.setProperty('--pfs-px', String(this.pointer.x));
      this.overlay.style.setProperty('--pfs-py', String(this.pointer.y));
    }
  }

  _onPointerDown() {
    if (!this.isOpen || !window.gsap) return;
    if (this.current === 0 && this.refs && this.refs.veil) {
      gsap.fromTo(this.refs.veil, { opacity: 0 }, { opacity: 0.2, duration: 0.14, yoyo: true, repeat: 1, ease: 'power2.out' });
    }
  }

  _playNavSound(direction) {
    if (!window.AudioContext && !window.webkitAudioContext) return;
    if (!this.audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new Ctx();
    }
    const freq = direction >= 0 ? 720 : 420;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.035, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain).connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  _playTransitionSting(index) {
    if (!window.AudioContext && !window.webkitAudioContext) return;
    if (!this.audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new Ctx();
    }
    const style = TRANSITION_STYLE_BY_SLIDE[index] || 'ignite';
    const now = this.audioCtx.currentTime;
    const mk = (type, f0, f1, t0, t1, g0, g1) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f0, now + t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), now + t1);
      gain.gain.setValueAtTime(g0, now + t0);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, g1), now + t1);
      osc.connect(gain).connect(this.audioCtx.destination);
      osc.start(now + t0);
      osc.stop(now + t1 + 0.02);
    };

    if (style === 'warp' || style === 'finale') {
      mk('triangle', 180, 740, 0.0, 0.2, 0.001, 0.018);
      mk('sine', 460, 120, 0.04, 0.34, 0.012, 0.001);
      mk('triangle', 900, 340, 0.06, 0.18, 0.004, 0.0008);
    } else if (style === 'katana') {
      mk('square', 1000, 380, 0, 0.1, 0.008, 0.001);
      mk('triangle', 240, 520, 0.08, 0.2, 0.002, 0.0008);
    } else if (style === 'iris') {
      mk('sine', 280, 620, 0, 0.2, 0.001, 0.012);
      mk('sine', 520, 320, 0.1, 0.3, 0.003, 0.0008);
    } else if (style === 'scanline') {
      mk('sine', 320, 1400, 0, 0.16, 0.001, 0.01);
      mk('triangle', 180, 420, 0.1, 0.24, 0.002, 0.0008);
    } else if (style === 'shard') {
      mk('triangle', 240, 780, 0, 0.14, 0.001, 0.011);
      mk('sine', 520, 260, 0.07, 0.22, 0.004, 0.0008);
    } else if (style === 'pulse') {
      mk('sine', 220, 480, 0, 0.18, 0.001, 0.012);
      mk('sine', 480, 260, 0.12, 0.28, 0.003, 0.0008);
    } else {
      mk('triangle', 260, 560, 0, 0.18, 0.001, 0.012);
    }
  }

  _runCleanupFns() {
    this.cleanupFns.forEach((fn) => {
      try {
        fn();
      } catch (_) {}
    });
    this.cleanupFns = [];
  }

  _destroySceneControllers() {
    (this.sceneControllers || []).forEach((controller) => {
      if (!controller || typeof controller.destroy !== 'function') return;
      try { controller.destroy(); } catch (_) {}
    });
    this.sceneControllers = [];
  }

  _loadInterstellarRunner(scene) {
    const shipWrap = new THREE.Group();
    shipWrap.visible = false;
    shipWrap.position.set(0, -0.15, -6.2);
    shipWrap.rotation.set(0.05, Math.PI, 0);
    scene.add(shipWrap);
    this.shipRoot = shipWrap;

    const loader = new OBJLoader();
    loader.load(
      './assets/models/interstellar-runner/Package/InterstellarRunner.obj',
      (obj) => {
        obj.traverse((child) => {
          if (!child.isMesh) return;
          const mat = new THREE.MeshStandardMaterial({
            color: 0x9ecbff,
            emissive: 0x173a72,
            metalness: 0.78,
            roughness: 0.28
          });
          child.material = mat;
          child.castShadow = false;
          child.receiveShadow = false;
        });

        const box = new THREE.Box3().setFromObject(obj);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        obj.position.sub(center);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const target = 1.2;
        const scale = target / maxDim;
        obj.scale.setScalar(scale);
        shipWrap.add(obj);
      },
      undefined,
      () => {
        // Keep running without model if load fails.
      }
    );
  }

  _initThree() {
    const host = this.refs ? this.refs.threeHost : null;
    if (!host) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.domElement.style.opacity = '0';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060611, 0.045);
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 0.35, 8.25);
    this.cameraHome = { x: 0, y: 0.35, z: 8.25 };

    const lightA = new THREE.DirectionalLight(0xff7adf, 1.1);
    lightA.position.set(3, 4, 2);
    scene.add(lightA);
    const lightB = new THREE.DirectionalLight(0x4fdfff, 0.9);
    lightB.position.set(-3, 2, 3);
    scene.add(lightB);
    scene.add(new THREE.AmbientLight(0x8890ff, 0.5));

    const portal = new THREE.Mesh(
      new THREE.TorusGeometry(2.0, 0.11, 30, 120),
      new THREE.MeshStandardMaterial({
        color: 0xff47c4,
        emissive: 0x66204a,
        roughness: 0.32,
        metalness: 0.58,
        transparent: true,
        opacity: 0.2
      })
    );
    portal.rotation.x = 0.32;
    portal.position.set(0, -0.08, -4.2);
    scene.add(portal);

    const portalHalo = new THREE.Mesh(
      new THREE.TorusGeometry(2.45, 0.05, 16, 120),
      new THREE.MeshStandardMaterial({
        color: 0xff9be5,
        emissive: 0x8a2e72,
        roughness: 0.2,
        metalness: 0.8,
        transparent: true,
        opacity: 0.1
      })
    );
    portalHalo.rotation.x = 0.34;
    portalHalo.position.set(0, -0.08, -4.25);
    scene.add(portalHalo);

    const starsGeo = new THREE.BufferGeometry();
    const starCount = 320;
    const starsPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i += 1) {
      starsPos[i * 3] = (Math.random() - 0.5) * 40;
      starsPos[i * 3 + 1] = (Math.random() - 0.5) * 24;
      starsPos[i * 3 + 2] = -Math.random() * 30;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
    const stars = new THREE.Points(
      starsGeo,
      new THREE.PointsMaterial({
        color: 0xb5d9ff,
        size: 0.05,
        transparent: true,
        opacity: 0.5
      })
    );
    scene.add(stars);

    const tunnelGeo = new THREE.BufferGeometry();
    const tunnelCount = 140;
    const tunnelPos = new Float32Array(tunnelCount * 3);
    const tunnelSizes = new Float32Array(tunnelCount);
    for (let i = 0; i < tunnelCount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 4 + Math.random() * 7;
      tunnelPos[i * 3] = Math.cos(angle) * radius;
      tunnelPos[i * 3 + 1] = Math.sin(angle) * radius * 0.55;
      tunnelPos[i * 3 + 2] = -Math.random() * 45;
      tunnelSizes[i] = 0.02 + Math.random() * 0.07;
    }
    tunnelGeo.setAttribute('position', new THREE.BufferAttribute(tunnelPos, 3));
    tunnelGeo.setAttribute('aSize', new THREE.BufferAttribute(tunnelSizes, 1));
    const tunnelStars = new THREE.Points(
      tunnelGeo,
      new THREE.PointsMaterial({
        color: 0x8fd8ff,
        size: 0.06,
        transparent: true,
        opacity: 0.24
      })
    );
    scene.add(tunnelStars);

    const particleSphereGeo = new THREE.BufferGeometry();
    const particleCount = 1600;
    const particleShapes = this._buildParticleShapeBuffers(particleCount);
    const particleCurrent = new Float32Array(particleShapes.portal);
    particleSphereGeo.setAttribute('position', new THREE.BufferAttribute(particleCurrent, 3));
    const particleSphere = new THREE.Points(
      particleSphereGeo,
      new THREE.PointsMaterial({
        color: 0x7cbcff,
        size: 0.02,
        transparent: true,
        opacity: 0
      })
    );
    particleSphere.position.set(0, -0.1, -4.9);
    particleSphere.scale.set(0.2, 0.2, 0.2);
    particleSphere.visible = false;
    scene.add(particleSphere);
    this.particleMorph = {
      shapes: particleShapes,
      current: particleCurrent,
      from: particleShapes.portal,
      to: particleShapes.portal,
      activeKey: 'portal',
      mix: 0,
      target: 0,
      speed: 0.08
      ,
      material: particleSphere.material,
      geometry: particleSphere.geometry,
      points: particleSphere
    };

    const chipGroup = new THREE.Group();
    const chip = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.24, 1.8),
      new THREE.MeshStandardMaterial({
        color: 0x122139,
        emissive: 0x122648,
        roughness: 0.42,
        metalness: 0.72,
        transparent: true,
        opacity: 0.45
      })
    );
    chipGroup.add(chip);
    for (let i = -4; i <= 4; i += 1) {
      if (i === 0) continue;
      const pin = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.08, 0.3),
        new THREE.MeshStandardMaterial({ color: 0xc9d4ee, metalness: 0.92, roughness: 0.2, transparent: true, opacity: 0.42 })
      );
      pin.position.set(i * 0.2, -0.13, 0.98);
      chipGroup.add(pin);
      const pinBack = pin.clone();
      pinBack.position.z = -0.98;
      chipGroup.add(pinBack);
    }
    chipGroup.position.set(-2.2, -1.0, -4.4);
    const chipRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.6, 0.03, 12, 80),
      new THREE.MeshStandardMaterial({
        color: 0x62d5ff,
        emissive: 0x115570,
        roughness: 0.22,
        metalness: 0.65,
        transparent: true,
        opacity: 0.24
      })
    );
    chipRing.rotation.x = Math.PI / 2;
    chipRing.position.y = 0.05;
    chipGroup.add(chipRing);
    scene.add(chipGroup);

    const researchGroup = new THREE.Group();
    for (let i = 0; i < 3; i += 1) {
      const card = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 0.8, 0.03),
        new THREE.MeshStandardMaterial({
          color: 0x1d1f35,
          emissive: 0x11243b,
          roughness: 0.35,
          metalness: 0.25,
          transparent: true,
          opacity: 0.38
        })
      );
      card.position.set(-1.45 + i * 1.45, -0.24 + i * 0.08, -4.7 + i * 0.22);
      card.rotation.y = -0.2 + i * 0.22;
      card.rotation.x = -0.05 + i * 0.05;
      researchGroup.add(card);
    }
    const researchWire = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.9, 0.06, 110, 12),
      new THREE.MeshStandardMaterial({
        color: 0x6ec2ff,
        emissive: 0x12457f,
        roughness: 0.28,
        metalness: 0.7,
        transparent: true,
        opacity: 0.22
      })
    );
    researchWire.position.set(0, -0.4, -4.95);
    researchGroup.add(researchWire);
    scene.add(researchGroup);

    const connectionsGroup = new THREE.Group();
    for (let i = 0; i < 7; i += 1) {
      const panel = new THREE.Mesh(
        new THREE.BoxGeometry(0.65, 1.15, 0.04),
        new THREE.MeshStandardMaterial({
          color: 0x251533,
          emissive: 0x30174f,
          roughness: 0.45,
          metalness: 0.2,
          transparent: true,
          opacity: 0.3
        })
      );
      const theta = (i / 7) * Math.PI * 2;
      panel.position.set(Math.cos(theta) * 2.55, Math.sin(theta * 1.2) * 0.32 - 0.26, Math.sin(theta) * 1.0 - 5.2);
      panel.rotation.y = -theta + Math.PI / 2;
      connectionsGroup.add(panel);
    }
    const hub = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.35, 0),
      new THREE.MeshStandardMaterial({
        color: 0xff7ece,
        emissive: 0x641f52,
        roughness: 0.3,
        metalness: 0.66,
        transparent: true,
        opacity: 0.26
      })
    );
    hub.position.set(0, -0.24, -4.9);
    connectionsGroup.add(hub);
    scene.add(connectionsGroup);

    const implicationsGroup = new THREE.Group();
    for (let i = 0; i < 6; i += 1) {
      const tile = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.55, 0.06),
        new THREE.MeshStandardMaterial({
          color: i < 3 ? 0x17383a : 0x3a1e35,
          emissive: i < 3 ? 0x164d4f : 0x4c2451,
          roughness: 0.42,
          metalness: 0.2,
          transparent: true,
          opacity: 0.34
        })
      );
      const row = i < 3 ? 0 : 1;
      const col = i % 3;
      tile.position.set(-1.35 + col * 1.35, -0.34 - row * 0.7, -5.0 + row * 0.15);
      tile.rotation.y = -0.1 + col * 0.1;
      implicationsGroup.add(tile);
    }
    const warningRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.9, 0.07, 18, 90),
      new THREE.MeshStandardMaterial({
        color: 0x7ff6e8,
        emissive: 0x19625a,
        roughness: 0.24,
        metalness: 0.72,
        transparent: true,
        opacity: 0.2
      })
    );
    warningRing.rotation.x = 1.35;
    warningRing.position.set(0, -0.62, -5.15);
    implicationsGroup.add(warningRing);
    scene.add(implicationsGroup);

    const finaleGroup = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.48, 2),
      new THREE.MeshStandardMaterial({
        color: 0x9bffef,
        emissive: 0x3bd7c9,
        roughness: 0.22,
        metalness: 0.68,
        transparent: true,
        opacity: 0.42
      })
    );
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.92, 0.06, 18, 90),
      new THREE.MeshStandardMaterial({
        color: 0x57ffe4,
        emissive: 0x2fc7bb,
        roughness: 0.28,
        metalness: 0.74,
        transparent: true,
        opacity: 0.24
      })
    );
    ring.rotation.x = 1.1;
    finaleGroup.add(core);
    finaleGroup.add(ring);
    finaleGroup.position.set(1.9, -0.4, -4.75);
    scene.add(finaleGroup);

    this.three = { renderer, scene, camera, portal, portalHalo, stars, tunnelStars, particleSphere };
    this.threeGroups = { chipGroup, researchGroup, connectionsGroup, implicationsGroup, finaleGroup };
    this._loadInterstellarRunner(scene);
    this._setThreeWorld(0, 1);
    this.lastTick = performance.now();
    this._renderThree();
  }

  _setThreeWorld(index, intensity = 1) {
    if (!this.three) return;
    const { camera, portal, portalHalo, scene, tunnelStars, particleSphere, renderer } = this.three;
    const { chipGroup, researchGroup, connectionsGroup, implicationsGroup, finaleGroup } = this.threeGroups;
    const profile = EXPERIENCE_PROFILES[index] || EXPERIENCE_PROFILES[0];
    const mode = profile.three;
    this.threeMode = mode;

    const show = (group, active, activeOpacity, idleOpacity) => {
      const opacity = (active ? activeOpacity : idleOpacity) * intensity;
      group.visible = opacity > 0.02;
      group.traverse((child) => {
        if (!child.material) return;
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => { mat.transparent = true; mat.opacity = opacity; });
        } else {
          child.material.transparent = true;
          child.material.opacity = opacity;
        }
      });
    };

    show(chipGroup, mode === 'chip', 0.0, 0.0);
    show(researchGroup, mode === 'research', 0.0, 0.0);
    show(connectionsGroup, mode === 'connections', 0.0, 0.0);
    show(implicationsGroup, mode === 'implications', 0.0, 0.0);
    show(finaleGroup, mode === 'finale', 0.0, 0.0);

    if (window.gsap) {
      const camTargets = [
        { x: 0, y: 0.35, z: 8.2 },
        { x: 0, y: 0.4, z: 8.1 },
        { x: 0.08, y: 0.28, z: 7.95 },
        { x: -0.08, y: 0.22, z: 8.0 },
        { x: 0.12, y: 0.18, z: 7.9 },
        { x: -0.12, y: 0.14, z: 7.95 },
        { x: 0.08, y: 0.24, z: 8.0 },
        { x: -0.08, y: 0.3, z: 8.05 },
        { x: 0, y: 0.2, z: 7.85 }
      ];
      const target = camTargets[index] || camTargets[0];
      gsap.to(camera.position, { ...target, duration: 0.65, ease: 'power2.out' });
      gsap.to(portal.scale, {
        x: mode === 'finale' ? 1.08 : 1,
        y: mode === 'finale' ? 1.08 : 1,
        z: 1,
        duration: 0.55,
        ease: 'power2.out'
      });
      gsap.to(portalHalo.scale, {
        x: mode === 'finale' ? 1.14 : 1,
        y: mode === 'finale' ? 1.14 : 1,
        z: 1,
        duration: 0.55,
        ease: 'power2.out'
      });
      const fogTarget = mode === 'finale' ? 0.034 : mode === 'connections' ? 0.052 : 0.045;
      gsap.to(scene.fog, { density: fogTarget, duration: 0.6, ease: 'power2.out' });
      gsap.to(tunnelStars.material, {
        opacity: 0,
        duration: 0.55,
        ease: 'power2.out'
      });
      gsap.to(particleSphere.material, {
        opacity: 0,
        duration: 0.35,
        ease: 'power2.out'
      });
      gsap.to(portal.material, {
        opacity: 0,
        duration: 0.35,
        ease: 'power2.out'
      });
      gsap.to(portalHalo.material, {
        opacity: 0,
        duration: 0.35,
        ease: 'power2.out'
      });
      if (!this.threeTransitionActive && renderer && renderer.domElement) {
        gsap.to(renderer.domElement, { opacity: 0, duration: 0.2, ease: 'power2.out' });
      }
    }
  }

  _setGroupOpacity(group, opacity) {
    if (!group) return;
    const value = Math.max(0, Math.min(1, opacity));
    group.visible = value > 0.001;
    group.traverse((child) => {
      if (!child.material) return;
      if (Array.isArray(child.material)) {
        child.material.forEach((mat) => {
          mat.transparent = true;
          mat.opacity = value;
        });
      } else {
        child.material.transparent = true;
        child.material.opacity = value;
      }
    });
  }

  _prepareTransitionMode(mode) {
    const { chipGroup, researchGroup, connectionsGroup, implicationsGroup, finaleGroup } = this.threeGroups;
    const all = [chipGroup, researchGroup, connectionsGroup, implicationsGroup, finaleGroup];
    all.forEach((group) => this._setGroupOpacity(group, 0));
    if (mode === 'chip') this._setGroupOpacity(chipGroup, 0.75);
    if (mode === 'research') this._setGroupOpacity(researchGroup, 0.75);
    if (mode === 'connections') this._setGroupOpacity(connectionsGroup, 0.78);
    if (mode === 'implications') this._setGroupOpacity(implicationsGroup, 0.78);
    if (mode === 'finale') this._setGroupOpacity(finaleGroup, 0.85);
  }

  _particleShapeForSlide(index) {
    return PARTICLE_SHAPE_BY_SLIDE[index] || 'portal';
  }

  _buildParticleShapeBuffers(count) {
    return buildParticleShapeBuffers(count);
  }

  _startParticleMorph(nextIndex, style, tl) {
    if (!this.particleMorph || !this.three) return;
    const { particleSphere } = this.three;
    const state = this.particleMorph;
    const fromKey = state.activeKey || 'portal';
    const toKey = this._particleShapeForSlide(nextIndex);
    state.from = state.shapes[fromKey] || state.shapes.portal;
    state.to = state.shapes[toKey] || state.shapes.portal;
    state.activeKey = toKey;
    state.mix = 0;
    state.target = 1;
    state.twist = style === 'warp' ? 1.4 : style === 'finale' ? 2.1 : 0.75;
    state.noisePhase = 0;
    particleSphere.visible = true;

    const rise = style === 'finale' ? 1.0 : style === 'warp' ? 0.95 : 0.8;
    tl.fromTo(state, { mix: 0 }, { mix: 1, duration: style === 'finale' ? 0.72 : 0.54, ease: 'expo.out' }, 0.02);
    tl.fromTo(
      state.material,
      { opacity: rise, size: 0.023 },
      { opacity: 0, size: style === 'finale' ? 0.01 : 0.016, duration: style === 'finale' ? 0.66 : 0.5, ease: 'power2.out' },
      0.04
    );
  }

  _runThreeSceneIntro(prevIndex, nextIndex, direction, immediate) {
    return this.transitionEngine.runThreeSceneIntro(prevIndex, nextIndex, direction, immediate);
  }

  _renderThree() {
    if (!this.isOpen || !this.three) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastTick) / 1000);
    this.lastTick = now;

    const { renderer, scene, camera, portal, portalHalo, stars, tunnelStars, particleSphere } = this.three;
    const { chipGroup, researchGroup, connectionsGroup, implicationsGroup, finaleGroup } = this.threeGroups;

    const isIdlePhase = !this.threeTransitionActive && !this.escapeWarpActive;
    if (isIdlePhase) {
      portal.rotation.z += dt * 0.12;
      portal.rotation.y += dt * 0.08;
      portalHalo.rotation.z -= dt * 0.08;
      portalHalo.rotation.y += dt * 0.04;
      chipGroup.rotation.y += dt * 0.17;
      chipGroup.position.y = -1.0 + Math.sin(now * 0.0014) * 0.03;

      researchGroup.rotation.y += dt * 0.11;
      researchGroup.position.y = -0.24 + Math.sin(now * 0.0012) * 0.05;

      connectionsGroup.rotation.y -= dt * 0.12;
      connectionsGroup.position.y = -0.26 + Math.cos(now * 0.0013) * 0.05;

      implicationsGroup.position.y = -0.35 + Math.sin(now * 0.0017) * 0.04;
      implicationsGroup.rotation.y = Math.sin(now * 0.0008) * 0.03;

      finaleGroup.rotation.y += dt * 0.14;
      finaleGroup.position.y = -0.4 + Math.sin(now * 0.0021) * 0.05;
    }
    if (this.particleMorph) {
      const pm = this.particleMorph;
      const from = pm.from;
      const to = pm.to;
      const cur = pm.current;
      const mix = Math.max(0, Math.min(1, pm.mix));
      if (this.threeTransitionActive || pm.points.visible) {
        const inv = 1 - mix;
        pm.noisePhase = (pm.noisePhase || 0) + dt * (this.threeTransitionActive ? 2.4 : 0.8);
        for (let i = 0; i < cur.length; i += 1) {
          const n = Math.sin((i * 0.00075) + pm.noisePhase) * 0.016 * (1 - Math.abs(0.5 - mix) * 2);
          cur[i] = (from[i] * inv + to[i] * mix) + n;
        }
        pm.geometry.attributes.position.needsUpdate = true;
      }
      particleSphere.rotation.y += dt * (this.threeTransitionActive ? 1.15 : 0.05);
      particleSphere.rotation.x += dt * (this.threeTransitionActive ? 0.55 : 0.02);
      particleSphere.scale.x = 0.55 + mix * 0.6;
      particleSphere.scale.y = 0.55 + mix * 0.6;
      particleSphere.scale.z = 1;
      particleSphere.visible = this.threeTransitionActive || pm.material.opacity > 0.01;
    }

    const modeSpeed =
      this.escapeWarpActive ? 6.5
      : this.threeTransitionActive ? 2.4
      : this.threeMode === 'connections' ? 1.3
      : this.threeMode === 'finale' ? 1.6
      : this.threeMode === 'implications' ? 1.2
      : 0.9;
    stars.rotation.y += dt * 0.006 * modeSpeed;
    stars.rotation.x = Math.sin(now * 0.0003) * 0.03;
    tunnelStars.position.z += dt * 1.6 * modeSpeed;
    if (tunnelStars.position.z > 8) tunnelStars.position.z = -4;

    if (isIdlePhase) {
      const targetCamX = this.pointer.x * 0.18;
      const targetCamY = 0.35 + (-this.pointer.y * 0.1);
      camera.position.x += (targetCamX - camera.position.x) * Math.min(1, dt * 2.8);
      camera.position.y += (targetCamY - camera.position.y) * Math.min(1, dt * 2.8);
    }
    if (this.shipRoot && this.shipRoot.visible) {
      this.shipRoot.rotation.z += (this.pointer.x * 0.12 - this.shipRoot.rotation.z) * Math.min(1, dt * 4.2);
      this.shipRoot.rotation.x += ((-0.04 + this.pointer.y * 0.08) - this.shipRoot.rotation.x) * Math.min(1, dt * 3.6);
    }

    // Hard gate: 3D transition layers must never leak into resting slide state.
    if (!this.threeTransitionActive && !this.escapeWarpActive) {
      const { chipGroup, researchGroup, connectionsGroup, implicationsGroup, finaleGroup } = this.threeGroups || {};
      this._setGroupOpacity(chipGroup, 0);
      this._setGroupOpacity(researchGroup, 0);
      this._setGroupOpacity(connectionsGroup, 0);
      this._setGroupOpacity(implicationsGroup, 0);
      this._setGroupOpacity(finaleGroup, 0);
      portal.material.opacity = 0;
      portalHalo.material.opacity = 0;
      tunnelStars.material.opacity = 0;
      if (this.particleMorph && this.particleMorph.material) {
        this.particleMorph.material.opacity = 0;
      }
      if (renderer && renderer.domElement && renderer.domElement.style.opacity !== '0') {
        renderer.domElement.style.opacity = '0';
      }
    }

    renderer.render(scene, camera);
    this.raf = requestAnimationFrame(() => this._renderThree());
  }

  _destroyThree() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (!this.three) return;
    const { renderer, scene } = this.three;
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((mat) => mat.dispose());
        else obj.material.dispose();
      }
    });
    renderer.dispose();
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    this.three = null;
    this.threeGroups = {};
  }

  _resetThreeTransitionState(particleKey = null) {
    if (!this.three) return;
    const { renderer, portal, portalHalo, camera } = this.three;
    const { chipGroup, researchGroup, connectionsGroup, implicationsGroup, finaleGroup } = this.threeGroups;

    this._setGroupOpacity(chipGroup, 0);
    this._setGroupOpacity(researchGroup, 0);
    this._setGroupOpacity(connectionsGroup, 0);
    this._setGroupOpacity(implicationsGroup, 0);
    this._setGroupOpacity(finaleGroup, 0);

    portal.material.opacity = 0;
    portalHalo.material.opacity = 0;
    portal.scale.set(1, 1, 1);
    portalHalo.scale.set(1, 1, 1);
    this.threeTransitionActive = false;
    this.escapeWarpActive = false;
    if (renderer && renderer.domElement) renderer.domElement.style.opacity = '0';
    if (camera && this.cameraHome) {
      camera.position.set(this.cameraHome.x, this.cameraHome.y, this.cameraHome.z);
    }

    if (this.refs && this.refs.endFlash) this.refs.endFlash.style.display = 'none';
    if (this.overlay) this.overlay.classList.remove('pfs-hyperspace-active');
    if (this.shipRoot) this.shipRoot.visible = false;

    if (this.particleMorph && this.particleMorph.points) {
      this.particleMorph.points.visible = false;
      this.particleMorph.material.opacity = 0;
      this.particleMorph.mix = 0;
      this.particleMorph.target = 0;
      if (particleKey && this.particleMorph.shapes[particleKey]) {
        this.particleMorph.activeKey = particleKey;
        this.particleMorph.from = this.particleMorph.shapes[particleKey];
        this.particleMorph.to = this.particleMorph.shapes[particleKey];
      }
    }
  }
}

export default PresentationMode;
