import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
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
    this.narrationLoadingTimer = null;
    this.autoStatusInterval = null;
    this.narrationAudioCache = new Map();
    this.audioCtx = null;
    this.audioMaster = null;
    this.audioCompressor = null;
    this.lastNavSfxAt = 0;
    this.lastStingSfxAt = 0;
    this.sfxEnabled = true;
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
    this.threeTransitionStyle = 'none';
    this.escapeWarpActive = false;
    this.particleMorph = null;
    this.pointer = { x: 0, y: 0 };
    this.boundPointerMove = this._onPointerMove.bind(this);
    this.boundPointerDown = this._onPointerDown.bind(this);
    this.shipRoot = null;
    this.shipWake = null;
    this.shipModelLoaded = false;
    this.transitionResetCall = null;
    this.transitionUnlockTimer = 0;
    this.transitionFailSafeTimer = 0;
    this.transitionNonce = 0;
    this.bonziIntroCall = null;
    this.bonziBubbleCall = null;
    this.bonziIntroToken = 0;
    this.lastSlideSwitchAt = 0;
    this.notesVisible = false;
    this.rehearsalMode = false;
    this.presenterStartAt = 0;
    this.presenterTicker = 0;
    this.cameraHome = null;
    this.initialIntroPlayed = false;
    this.midPresentationHeckleShown = false;
    this.finalAchievementShown = false;
    this.pendingSceneEnterCall = null;
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
    this.narrationLoadingTimer = null;
    this.autoStatusInterval = null;
    this.narrationAudioCache.clear();
    this.notesVisible = false;
    this.rehearsalMode = false;
    this.presenterStartAt = Date.now();
    this.presenterTicker = 0;
    this.overlay = this._buildOverlay(sourceSlides);
    document.body.appendChild(this.overlay);
    document.body.classList.add('presentation-open');

    this._initThree();
    this._bindEvents();
    this._primeNarrationForSlide(0);
    this._primeNarrationForSlide(1);
    this.transitionEngine.goTo(0, false);
    this._startPresenterHud();
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
    if (this.overlay) this.overlay.classList.remove('pfs-exit-warp');
    this.isOpen = false;
    this.transitioning = false;
    this.closing = false;
    this.escapeWarpActive = false;
    if (this.transitionUnlockTimer) {
      clearTimeout(this.transitionUnlockTimer);
      this.transitionUnlockTimer = 0;
    }
    if (this.transitionFailSafeTimer) {
      clearTimeout(this.transitionFailSafeTimer);
      this.transitionFailSafeTimer = 0;
    }

    this._clearAutoPlay();
    if (this.bonziIntroCall && typeof this.bonziIntroCall.kill === 'function') {
      this.bonziIntroCall.kill();
      this.bonziIntroCall = null;
    }
    if (this.bonziBubbleCall && typeof this.bonziBubbleCall.kill === 'function') {
      this.bonziBubbleCall.kill();
      this.bonziBubbleCall = null;
    }
    if (this.pendingSceneEnterCall && typeof this.pendingSceneEnterCall.kill === 'function') {
      this.pendingSceneEnterCall.kill();
      this.pendingSceneEnterCall = null;
    }
    if (this.presenterTicker) {
      clearInterval(this.presenterTicker);
      this.presenterTicker = 0;
    }
    this._unbindEvents();
    this._runCleanupFns();
    this._destroySceneControllers();
    this._destroyThree();
    this.narrationAudioCache.clear();
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

    // Hard-cancel any in-flight slide transition work so ESC warp cannot be overridden.
    this.transitionNonce += 1;
    if (this.transitionUnlockTimer) {
      clearTimeout(this.transitionUnlockTimer);
      this.transitionUnlockTimer = 0;
    }
    if (this.transitionFailSafeTimer) {
      clearTimeout(this.transitionFailSafeTimer);
      this.transitionFailSafeTimer = 0;
    }
    if (this.transitionResetCall && typeof this.transitionResetCall.kill === 'function') {
      this.transitionResetCall.kill();
      this.transitionResetCall = null;
    }
    if (this.transitionEngine && this.transitionEngine.activeContentTl && typeof this.transitionEngine.activeContentTl.kill === 'function') {
      this.transitionEngine.activeContentTl.kill();
      this.transitionEngine.activeContentTl = null;
    }
    if (this.threeTransitions && typeof this.threeTransitions.kill === 'function') {
      this.threeTransitions.kill();
      this.threeTransitions = null;
    }

    this._clearAutoPlay();
    this._unbindEvents();
    this.escapeWarpActive = true;
    this.threeTransitionActive = true;
    this.transitioning = false;
    if (this.overlay) this.overlay.classList.add('pfs-in-transition');
    if (this.overlay) this.overlay.classList.add('pfs-exit-warp');

    const tl = gsap.timeline({
      onComplete: () => this.close('warp-complete', true)
    });

    if (this.overlay) this.overlay.classList.add('pfs-hyperspace-active');

    // Hide world geometry so the exit reads as a focused warp moment.
    if (this.threeGroups) {
      const { chipGroup, researchGroup, connectionsGroup, implicationsGroup, finaleGroup } = this.threeGroups;
      this._setGroupOpacity(chipGroup, 0);
      this._setGroupOpacity(researchGroup, 0);
      this._setGroupOpacity(connectionsGroup, 0);
      this._setGroupOpacity(implicationsGroup, 0);
      this._setGroupOpacity(finaleGroup, 0);
    }
    if (this.particleMorph && this.particleMorph.material) {
      this.particleMorph.material.opacity = 0;
      if (this.particleMorph.points) this.particleMorph.points.visible = false;
    }

    if (this.three && this.three.renderer && this.three.renderer.domElement) {
      const { renderer, camera, stars, tunnelStars, portal, portalHalo } = this.three;
      gsap.killTweensOf(renderer.domElement);
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(stars.material);
      gsap.killTweensOf(tunnelStars.material);
      gsap.killTweensOf(portal.material);
      gsap.killTweensOf(portalHalo.material);
      gsap.killTweensOf(portal.scale);
      gsap.killTweensOf(portalHalo.scale);
      tl.fromTo(renderer.domElement, { opacity: 0 }, { opacity: 1, duration: 0.16, ease: 'power2.inOut' }, 0);

      // Get on-axis immediately so the shot does not hang in empty space.
      tl.to(camera.position, { x: 0.08, y: 0.12, z: 6.3, duration: 0.34, ease: 'power2.out' }, 0.0);
      tl.to(camera.position, { x: 0.02, y: 0.02, z: 5.2, duration: 0.62, ease: 'power2.inOut' }, 0.34);

      // For ESC, the tunnel itself owns the front edge. Do not render a separate portal mouth.
      portal.visible = false;
      portalHalo.visible = false;
      portal.material.opacity = 0;
      portalHalo.material.opacity = 0;
      tl.to(stars.material, { opacity: 0.2, duration: 0.9, ease: 'power2.out' }, 0.12);
      tl.to(tunnelStars.material, { opacity: 1.0, duration: 1.35, ease: 'power2.out' }, 0.06);
      tl.to(tunnelStars.material, { size: 0.24, duration: 1.2, ease: 'power2.out' }, 0.1);
      tl.to(tunnelStars.material, { size: 0.06, duration: 0.22, ease: 'power2.out' }, 1.62);
      tl.to(renderer.domElement, { opacity: 0, duration: 0.18, ease: 'power2.in' }, 1.86);
    }

    if (this.refs && this.refs.veil) {
      this.refs.veil.style.mixBlendMode = 'screen';
      this.refs.veil.style.background = 'radial-gradient(circle at 50% 46%, rgba(255,255,255,0.72) 0%, rgba(148,214,255,0.42) 30%, rgba(10,16,34,0.0) 74%)';
      tl.fromTo(this.refs.veil, { opacity: 0 }, { opacity: 0.18, duration: 0.18, ease: 'power2.in' }, 1.06);
      tl.to(this.refs.veil, { opacity: 0, duration: 0.16, ease: 'power2.out' }, 1.28);
    }

    if (this.refs && this.refs.stageRing && this.refs.stageSweep) {
      tl.fromTo(this.refs.stageRing, { opacity: 0, scale: 0.55 }, { opacity: 0.56, scale: 1.08, duration: 0.26, ease: 'power2.out' }, 0.04);
      tl.to(this.refs.stageRing, { opacity: 0.04, scale: 1.42, duration: 0.54, ease: 'expo.in' }, 0.28);
      tl.fromTo(this.refs.stageSweep, { opacity: 0, xPercent: -110 }, { opacity: 0.28, xPercent: 95, duration: 0.24, ease: 'power2.inOut' }, 0.22);
      tl.to(this.refs.stageSweep, { opacity: 0, duration: 0.12, ease: 'power2.out' }, 0.48);
    }

    if (this.refs && this.refs.exitShip) {
      const ship = this.refs.exitShip;
      const shipWake = this.refs.exitShipWake;
      const shipCore = this.refs.exitShipCore;
      const shipBody = this.refs.exitShipBody;
      const shipNose = this.refs.exitShipNose;
      const shipWingA = this.refs.exitShipWingA;
      const shipWingB = this.refs.exitShipWingB;
      tl.set(ship, { display: 'block', opacity: 0 }, 0);
      tl.set([shipBody, shipNose, shipWingA, shipWingB, shipCore], { opacity: 1 }, 0);
      if (shipWake) {
        tl.set(shipWake, { opacity: 0, scaleX: 0.15, scaleY: 0.15 }, 0);
        tl.fromTo(shipWake, { opacity: 0, scaleX: 0.18, scaleY: 0.15 }, { opacity: 0.7, scaleX: 1.0, scaleY: 0.84, duration: 0.12, ease: 'power2.out' }, 0.04);
        tl.to(shipWake, { opacity: 0.2, scaleX: 1.34, scaleY: 0.9, duration: 0.34, ease: 'power2.inOut' }, 0.22);
        tl.to(shipWake, { opacity: 0, duration: 0.12, ease: 'power2.out' }, 0.78);
      }
      tl.fromTo(ship, { opacity: 0, xPercent: -46, yPercent: 10, scale: 0.72, rotate: -6 }, { opacity: 1, xPercent: -8, yPercent: 1, scale: 0.9, rotate: -1, duration: 0.24, ease: 'power2.out' }, 0.04);
      tl.to(ship, { xPercent: 10, yPercent: -2, scale: 0.72, rotate: 2, duration: 0.24, ease: 'power2.inOut' }, 0.28);
      tl.to(ship, { xPercent: 30, yPercent: -4, scale: 0.18, opacity: 0, rotate: 8, duration: 0.22, ease: 'power3.in' }, 0.54);
      tl.set(ship, { display: 'none' }, 0.82);
    }

    if (!this.shipRoot && this.three && this.three.scene) {
      const tempShipRoot = new THREE.Group();
      tempShipRoot.visible = true;
      tempShipRoot.position.set(-3.75, -1.38, 2.95);
      tempShipRoot.rotation.set(0.1, Math.PI * 0.93, -0.14);
      tempShipRoot.scale.set(6.0, 6.0, 6.0);

      const tempBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.14, 1.02, 12, 1, false),
        new THREE.MeshStandardMaterial({
          color: 0xdff7ff,
          emissive: 0x2f7fff,
          emissiveIntensity: 1.7,
          metalness: 0.78,
          roughness: 0.18
        })
      );
      tempBody.rotation.z = Math.PI / 2;
      tempShipRoot.add(tempBody);

      const tempNose = new THREE.Mesh(
        new THREE.ConeGeometry(0.16, 0.38, 12),
        new THREE.MeshStandardMaterial({
          color: 0xf7fcff,
          emissive: 0x73d8ff,
          emissiveIntensity: 1.3,
          metalness: 0.72,
          roughness: 0.08
        })
      );
      tempNose.rotation.z = -Math.PI / 2;
      tempNose.position.x = 0.75;
      tempShipRoot.add(tempNose);

      const tempBeacon = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 16, 12),
        new THREE.MeshBasicMaterial({
          color: 0xe8fbff,
          transparent: true,
          opacity: 1,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      tempBeacon.position.set(0.84, 0.04, 0.02);
      tempShipRoot.add(tempBeacon);

      const tempWake = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.24, 1.9, 12, 1, true),
        new THREE.MeshBasicMaterial({
          color: 0x7fdfff,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      tempWake.rotation.z = Math.PI / 2;
      tempWake.position.set(-1.0, 0.02, 0);
      tempWake.scale.set(0.18, 0.14, 0.14);
      tempShipRoot.add(tempWake);

      this.three.scene.add(tempShipRoot);
      this.shipRoot = tempShipRoot;
      this.shipBeacon = tempBeacon;
      this.shipWake = tempWake;
      this.shipModelLoaded = true;
    }

    if (this.shipRoot && this.shipModelLoaded) {
      this.shipRoot.visible = true;
      if (this.shipWake) {
        this.shipWake.visible = true;
        this.shipWake.material.opacity = 0;
        this.shipWake.scale.set(0.18, 0.14, 0.14);
      }
      if (this.shipBeacon) {
        this.shipBeacon.visible = true;
        this.shipBeacon.material.opacity = 0.98;
        this.shipBeacon.scale.set(1, 1, 1);
      }
      // Keep the ship close to the tunnel centerline and make the dive immediate.
      this.shipRoot.position.set(-0.34, -0.22, 0.88);
      this.shipRoot.rotation.set(0.02, Math.PI * 1.02, -0.01);
      this.shipRoot.scale.set(3.5, 3.5, 3.5);

      const shipMats = [];
      this.shipRoot.traverse((node) => {
        if (!node || !node.isMesh || !node.material) return;
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        mats.forEach((mat) => {
          if (!mat || typeof mat.emissiveIntensity !== 'number') return;
          const baseIntensity = typeof mat._warpBaseEmissiveIntensity === 'number' ? mat._warpBaseEmissiveIntensity : mat.emissiveIntensity;
          mat._warpBaseEmissiveIntensity = baseIntensity;
          shipMats.push({ mat, baseIntensity });
        });
      });
      shipMats.forEach(({ mat, baseIntensity }) => {
        tl.fromTo(mat, { emissiveIntensity: baseIntensity * 3.6 }, { emissiveIntensity: baseIntensity * 2.1, duration: 0.32, ease: 'power2.out' }, 0.02);
        tl.to(mat, { emissiveIntensity: baseIntensity * 1.06, duration: 0.16, ease: 'power2.out' }, 0.94);
      });

      if (this.shipWake) {
        tl.fromTo(this.shipWake.material, { opacity: 0 }, { opacity: 0.66, duration: 0.1, ease: 'power2.out' }, 0.04);
        tl.fromTo(this.shipWake.scale, { x: 0.12, y: 0.12, z: 0.12 }, { x: 1.0, y: 0.82, z: 0.82, duration: 0.34, ease: 'power2.out' }, 0.04);
        tl.to(this.shipWake.scale, { x: 1.28, y: 0.9, z: 0.9, duration: 0.22, ease: 'power1.inOut' }, 0.4);
        tl.to(this.shipWake.material, { opacity: 0.04, duration: 0.12, ease: 'power2.out' }, 0.72);
        tl.set(this.shipWake, { visible: false }, 0.86);
      }

      // Immediate centered dive.
      tl.fromTo(this.shipRoot.position, { x: -0.32, y: -0.22, z: 0.82 }, { x: -0.08, y: -0.1, z: -0.36, duration: 0.24, ease: 'power2.out' }, 0.02);
      tl.to(this.shipRoot.rotation, { x: 0.0, y: Math.PI * 1.05, z: 0.0, duration: 0.24, ease: 'power2.out' }, 0.02);
      tl.to(this.shipRoot.scale, { x: 2.8, y: 2.8, z: 2.8, duration: 0.24, ease: 'power2.out' }, 0.02);
      tl.to(this.shipRoot.position, { x: 0.0, y: -0.02, z: -2.72, duration: 0.4, ease: 'expo.in' }, 0.28);
      tl.to(this.shipRoot.rotation, { x: -0.06, y: Math.PI * 1.12, z: 0.04, duration: 0.4, ease: 'power2.inOut' }, 0.28);
      tl.to(this.shipRoot.scale, { x: 0.92, y: 0.92, z: 0.92, duration: 0.28, ease: 'power2.out' }, 0.28);
      tl.to(this.shipRoot.scale, { x: 0.1, y: 0.1, z: 0.1, duration: 0.16, ease: 'power3.in' }, 0.72);
      tl.to(this.shipRoot.position, { x: 0.0, y: 0.0, z: -5.8, duration: 0.16, ease: 'power3.in' }, 0.74);
      tl.set(this.shipRoot, { visible: false }, 0.96);
    }

    // Disable blades for ESC warp so ship and wormhole stay visually clean.
    if (this.refs && this.refs.bladeA && this.refs.bladeB) {
      tl.set([this.refs.bladeA, this.refs.bladeB], { opacity: 0 }, 0);
    }

    if (activeScene) {
      tl.to(activeScene, { opacity: 0, scale: 1.03, filter: 'blur(6px)', duration: 0.52, ease: 'power2.inOut' }, 0.0);
    }

    if (this.refs && this.refs.endFlash) {
      tl.set(this.refs.endFlash, {
        display: 'block',
        background: 'radial-gradient(circle at 50% 45%, rgba(255,255,255,1.0) 0%, rgba(235,246,255,0.9) 34%, rgba(160,210,255,0.34) 60%, rgba(8,12,28,0.0) 100%)'
      }, 1.72);
      tl.fromTo(this.refs.endFlash, { opacity: 0 }, { opacity: 1, duration: 0.12, ease: 'power2.in' }, 1.76);
      tl.to(this.refs.endFlash, { opacity: 0, duration: 0.16, ease: 'power2.out' }, 1.9);
      tl.set(this.refs.endFlash, { display: 'none' }, 2.06);
    }

    tl.to({}, { duration: 0.01 }, 2.06);
  }

  _playIntroArrival() {
    const activeScene = this.scenes[0];
    if (!this.overlay || !activeScene || !window.gsap) {
      this.transitioning = false;
      this._setThreeWorld(0, 1);
      return;
    }

    this.transitioning = true;
    this.threeTransitionActive = true;
    this.threeTransitionStyle = 'intro';
    this.overlay.classList.add('pfs-in-transition');
    this.overlay.classList.add('pfs-hyperspace-active');
    this.overlay.classList.add('pfs-intro-arrival');

    const headlineNodes = Array.from(activeScene.querySelectorAll('.slide-num, .slide-tag, h2')).filter(Boolean);
    const supportNodes = Array.from(activeScene.querySelectorAll('.slide-subtitle-big, .slide-body, .slide-meta-info')).filter(Boolean);
    const previewNode = activeScene.querySelector('.slide-preview');
    const kickerNodes = Array.from(activeScene.querySelectorAll('.slide-kicker-card')).filter(Boolean);
    const hudNodes = [
      this.refs && this.refs.chapterTag,
      this.refs && this.refs.chapterTitle,
      this.refs && this.refs.counter,
      this.refs && this.refs.hint,
      this.refs && this.refs.autoChip,
      this.refs && this.refs.sfxChip
    ].filter(Boolean);
    const progressFill = this.refs && this.refs.progressFill ? this.refs.progressFill : null;
    const progressTarget = progressFill ? getComputedStyle(progressFill).width : '';
    const ambient = this.overlay.querySelector('.pfs-ambient');
    const chipGroup = this.threeGroups && this.threeGroups.chipGroup ? this.threeGroups.chipGroup : null;
    const chipMaterials = [];
    if (chipGroup) {
      chipGroup.traverse((node) => {
        if (!node || !node.material) return;
        const mats = Array.isArray(node.material) ? node.material : [node.material];
        mats.forEach((mat) => {
          if (mat && !chipMaterials.includes(mat)) chipMaterials.push(mat);
        });
      });
    }

    const contentNodes = [...headlineNodes, ...supportNodes, previewNode, ...kickerNodes, ...hudNodes].filter(Boolean);
    gsap.killTweensOf([activeScene, ...contentNodes]);
    if (progressFill) gsap.killTweensOf(progressFill);
    if (ambient) gsap.killTweensOf(ambient);
    if (this.refs) {
      gsap.killTweensOf([
        this.refs.veil,
        this.refs.introShutterLeft,
        this.refs.introShutterRight,
        this.refs.introGrid,
        this.refs.introFrame,
        this.refs.introReticle,
        this.refs.introCore,
        this.refs.stageRing,
        this.refs.stageSweep,
        this.refs.stageTrace,
        this.refs.stageNoise,
        this.refs.endFlash,
        this.refs.cineTop,
        this.refs.cineBottom,
        this.refs.exitShip
      ].filter(Boolean));
    }
    if (this.three && this.three.renderer && this.three.renderer.domElement) {
      const { renderer, camera, portal, portalHalo, tunnelStars, stars, bloomPass } = this.three;
      gsap.killTweensOf([
        renderer.domElement,
        camera.position,
        portal.scale,
        portalHalo.scale,
        portal.material,
        portalHalo.material,
        tunnelStars.material,
        stars.material,
        bloomPass
      ].filter(Boolean));
    }
    if (chipMaterials.length) gsap.killTweensOf(chipMaterials);
    if (this.shipRoot) gsap.killTweensOf([this.shipRoot.position, this.shipRoot.rotation, this.shipRoot.scale]);
    if (this.shipWake) gsap.killTweensOf([this.shipWake.material, this.shipWake.scale]);
    if (this.shipBeacon) gsap.killTweensOf([this.shipBeacon.material, this.shipBeacon.scale]);

    this._prepareTransitionMode('chip');
    if (this.shipRoot) this.shipRoot.visible = false;
    if (this.shipWake) this.shipWake.visible = false;
    if (this.shipBeacon) this.shipBeacon.visible = false;

    gsap.set(activeScene, {
      visibility: 'hidden',
      pointerEvents: 'none',
      opacity: 0
    });
    gsap.set(contentNodes, { opacity: 0 });
    if (progressFill) gsap.set(progressFill, { width: '0%' });
    if (ambient) gsap.set(ambient, { opacity: 0 });
    if (chipMaterials.length) {
      chipMaterials.forEach((mat) => {
        mat.transparent = true;
        mat.opacity = 0;
      });
    }

    const tl = gsap.timeline({
      onComplete: () => {
        this.transitioning = false;
        this.threeTransitionActive = false;
        this.threeTransitionStyle = 'none';
        this.overlay.classList.remove('pfs-in-transition');
        this.overlay.classList.remove('pfs-hyperspace-active');
        this.overlay.classList.remove('pfs-intro-arrival');
        activeScene.style.pointerEvents = 'auto';
        this._setThreeWorld(0, 1);
      }
    });

    if (this.refs && this.refs.bladeA && this.refs.bladeB) {
      tl.set([this.refs.bladeA, this.refs.bladeB], { opacity: 0 }, 0);
    }

    if (this.refs && this.refs.introShutterLeft && this.refs.introShutterRight) {
      tl.set([this.refs.introShutterLeft, this.refs.introShutterRight], { opacity: 1 }, 0);
      tl.to(this.refs.introShutterLeft, {
        xPercent: -112,
        duration: 0.54,
        ease: 'expo.inOut'
      }, 1.56);
      tl.to(this.refs.introShutterRight, {
        xPercent: 112,
        duration: 0.54,
        ease: 'expo.inOut'
      }, 1.56);
      tl.to([this.refs.introShutterLeft, this.refs.introShutterRight], {
        opacity: 0,
        duration: 0.14,
        ease: 'power2.out'
      }, 2.02);
    }

    if (this.refs && this.refs.introGrid) {
      tl.fromTo(this.refs.introGrid, {
        opacity: 0,
        scale: 1.22,
        filter: 'blur(6px)'
      }, {
        opacity: 0.62,
        scale: 1,
        filter: 'blur(0px)',
        duration: 0.42,
        ease: 'power2.out'
      }, 0.04);
      tl.to(this.refs.introGrid, {
        opacity: 0.12,
        duration: 0.54,
        ease: 'power2.out'
      }, 0.82);
      tl.to(this.refs.introGrid, {
        opacity: 0,
        duration: 0.18,
        ease: 'power2.out'
      }, 1.48);
    }

    if (this.refs && this.refs.introFrame) {
      tl.fromTo(this.refs.introFrame, {
        opacity: 0,
        scale: 1.18,
        filter: 'blur(4px)'
      }, {
        opacity: 0.84,
        scale: 1,
        filter: 'blur(0px)',
        duration: 0.34,
        ease: 'power2.out'
      }, 0.12);
      tl.to(this.refs.introFrame, {
        opacity: 0.34,
        duration: 0.44,
        ease: 'power2.out'
      }, 0.62);
      tl.to(this.refs.introFrame, {
        opacity: 0,
        duration: 0.18,
        ease: 'power2.out'
      }, 1.42);
    }

    if (this.refs && this.refs.introReticle) {
      tl.fromTo(this.refs.introReticle, {
        opacity: 0,
        scale: 1.7,
        xPercent: -50,
        yPercent: -50,
        filter: 'blur(6px)'
      }, {
        opacity: 0.96,
        scale: 1,
        xPercent: -50,
        yPercent: -50,
        filter: 'blur(0px)',
        duration: 0.54,
        ease: 'expo.out'
      }, 0.18);
      tl.to(this.refs.introReticle, {
        scale: 0.78,
        duration: 0.34,
        ease: 'power2.inOut'
      }, 0.84);
      tl.to(this.refs.introReticle, {
        scale: 0.88,
        opacity: 0.22,
        duration: 0.22,
        ease: 'power2.out'
      }, 1.18);
      tl.to(this.refs.introReticle, {
        opacity: 0,
        duration: 0.12,
        ease: 'power2.out'
      }, 1.44);
    }

    if (this.refs && this.refs.introCore) {
      tl.fromTo(this.refs.introCore, {
        opacity: 0,
        scaleX: 0.08,
        scaleY: 0.5,
        filter: 'blur(10px)'
      }, {
        opacity: 0.94,
        scaleX: 1,
        scaleY: 1,
        filter: 'blur(0px)',
        duration: 0.24,
        ease: 'power2.out'
      }, 1.08);
      tl.to(this.refs.introCore, {
        opacity: 0,
        scaleX: 1.24,
        duration: 0.22,
        ease: 'power2.out'
      }, 1.34);
    }

    if (this.refs && this.refs.cineTop && this.refs.cineBottom) {
      tl.fromTo(this.refs.cineTop, { opacity: 0, height: 0 }, { opacity: 0.6, height: 20, duration: 0.18, ease: 'power2.out' }, 0.02);
      tl.fromTo(this.refs.cineBottom, { opacity: 0, height: 0 }, { opacity: 0.6, height: 20, duration: 0.18, ease: 'power2.out' }, 0.02);
      tl.to([this.refs.cineTop, this.refs.cineBottom], { opacity: 0, duration: 0.16, ease: 'power2.out' }, 2.34);
      tl.set([this.refs.cineTop, this.refs.cineBottom], { height: 0 }, 2.52);
    }

    if (this.refs && this.refs.veil) {
      this.refs.veil.style.mixBlendMode = 'screen';
      this.refs.veil.style.background = 'radial-gradient(circle at 50% 48%, rgba(180,236,255,0.28) 0%, rgba(60,154,255,0.16) 24%, rgba(6,10,26,0.0) 72%)';
      tl.fromTo(this.refs.veil, { opacity: 0 }, { opacity: 0.3, duration: 0.32, ease: 'power2.out' }, 0.08);
      tl.to(this.refs.veil, { opacity: 0.08, duration: 0.46, ease: 'power2.out' }, 0.58);
      tl.to(this.refs.veil, { opacity: 0, duration: 0.2, ease: 'power2.out' }, 1.86);
    }

    if (this.refs && this.refs.stageRing) {
      tl.fromTo(this.refs.stageRing, { opacity: 0, scale: 0.58 }, { opacity: 0.72, scale: 1.08, duration: 0.4, ease: 'power2.out' }, 0.36);
      tl.to(this.refs.stageRing, { opacity: 0.2, scale: 1.42, duration: 0.42, ease: 'power2.out' }, 0.88);
      tl.to(this.refs.stageRing, { opacity: 0, scale: 1.58, duration: 0.18, ease: 'power2.out' }, 1.42);
    }

    if (this.refs && this.refs.stageNoise) {
      tl.set(this.refs.stageNoise, { display: 'block' }, 0);
      tl.fromTo(this.refs.stageNoise, { opacity: 0 }, { opacity: 0.18, duration: 0.12, ease: 'none' }, 0.06);
      tl.to(this.refs.stageNoise, { opacity: 0.05, duration: 0.34, ease: 'none' }, 0.48);
      tl.to(this.refs.stageNoise, { opacity: 0, duration: 0.12, ease: 'none' }, 1.26);
    }

    if (this.refs && this.refs.exitShip) {
      tl.set(this.refs.exitShip, { display: 'none', opacity: 0 }, 0);
    }

    if (this.three && this.three.renderer && this.three.renderer.domElement) {
      const { renderer, camera, portal, portalHalo, tunnelStars, stars, bloomPass, warpRings } = this.three;
      tl.fromTo(renderer.domElement, { opacity: 0, scale: 1.06, filter: 'blur(8px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.3, ease: 'power2.out' }, 0);
      tl.fromTo(camera.position, { x: 0, y: 1.42, z: 11.6 }, { x: 0, y: 0.35, z: 8.2, duration: 1.78, ease: 'expo.out' }, 0.04);
      tl.fromTo(portal.scale, { x: 0.26, y: 0.26, z: 1 }, { x: 1.02, y: 1.02, z: 1, duration: 1.18, ease: 'expo.out' }, 0.24);
      tl.fromTo(portalHalo.scale, { x: 0.44, y: 0.44, z: 1 }, { x: 1.06, y: 1.06, z: 1, duration: 1.24, ease: 'expo.out' }, 0.22);
      tl.fromTo(portal.material, { opacity: 0.0 }, { opacity: 0.18, duration: 0.84, ease: 'power2.out' }, 0.22);
      tl.fromTo(portalHalo.material, { opacity: 0.0 }, { opacity: 0.12, duration: 0.92, ease: 'power2.out' }, 0.22);
      tl.fromTo(tunnelStars.material, { opacity: 0.0, size: 0.04 }, { opacity: 0.12, size: 0.08, duration: 0.72, ease: 'power2.out' }, 0.12);
      tl.fromTo(stars.material, { opacity: 0.06 }, { opacity: 0.38, duration: 1.2, ease: 'power2.out' }, 0.1);
      if (bloomPass) {
        tl.fromTo(bloomPass, { strength: 0.18 }, { strength: 0.62, duration: 1.14, ease: 'power2.out' }, 0.12);
      }
      if (chipGroup) {
        chipGroup.visible = true;
        tl.fromTo(chipGroup.rotation, { x: 1.18, y: -2.24, z: 0.82 }, { x: 0, y: 0, z: 0, duration: 1.48, ease: 'expo.out' }, 0.24);
        tl.fromTo(chipGroup.scale, { x: 0.08, y: 0.08, z: 0.08 }, { x: 1, y: 1, z: 1, duration: 1.22, ease: 'expo.out' }, 0.3);
        tl.fromTo(chipGroup.position, { x: 0, y: -0.18, z: -2.4 }, { x: -2.2, y: -1.0, z: -4.4, duration: 1.42, ease: 'power2.out' }, 0.24);
      }
      if (warpRings) {
        warpRings.visible = true;
        warpRings.children.forEach((ring) => {
          const baseZ = typeof ring.userData.baseZ === 'number' ? ring.userData.baseZ : ring.position.z;
          ring.position.z = baseZ + 1.2;
          ring.scale.setScalar(0.2);
          if (ring.material) {
            ring.material.transparent = true;
            ring.material.opacity = 0;
          }
        });
        warpRings.children.slice(0, 6).forEach((ring, idx) => {
          const baseZ = typeof ring.userData.baseZ === 'number' ? ring.userData.baseZ : ring.position.z;
          tl.to(ring.scale, { x: 1, y: 1, z: 1, duration: 0.62, ease: 'expo.out' }, 0.18 + idx * 0.05);
          tl.to(ring.position, { z: baseZ, duration: 0.74, ease: 'expo.out' }, 0.18 + idx * 0.05);
          if (ring.material) {
            tl.to(ring.material, { opacity: 0.18 - idx * 0.018, duration: 0.28, ease: 'power2.out' }, 0.18 + idx * 0.05);
            tl.to(ring.material, { opacity: 0, duration: 0.24, ease: 'power2.out' }, 0.92 + idx * 0.03);
          }
        });
      }
    }

    if (chipMaterials.length) {
      tl.to(chipMaterials, { opacity: 0.78, duration: 0.52, ease: 'power2.out' }, 0.36);
      tl.to(chipMaterials, { opacity: 0.24, duration: 0.32, ease: 'power2.out' }, 1.84);
    }

    if (this.refs && this.refs.endFlash) {
      tl.set(this.refs.endFlash, {
        display: 'block',
        background: 'radial-gradient(circle at 50% 46%, rgba(224,248,255,0.86) 0%, rgba(120,212,255,0.28) 38%, rgba(8,12,24,0.0) 100%)'
      }, 1.46);
      tl.fromTo(this.refs.endFlash, { opacity: 0 }, { opacity: 0.72, duration: 0.12, ease: 'power2.in' }, 1.5);
      tl.to(this.refs.endFlash, { opacity: 0, duration: 0.22, ease: 'power2.out' }, 1.64);
      tl.set(this.refs.endFlash, { display: 'none' }, 1.9);
    }

    if (this.refs && this.refs.stageTrace) {
      tl.set(this.refs.stageTrace, {
        display: 'block',
        opacity: 0,
        left: '18%',
        width: '8px',
        background: 'linear-gradient(to right, transparent 0%, rgba(124,220,255,0.22) 24%, rgba(255,255,255,0.88) 50%, rgba(124,220,255,0.22) 76%, transparent 100%)',
        filter: 'blur(1px)'
      }, 0.18);
      tl.to(this.refs.stageTrace, {
        opacity: 0.9,
        left: '82%',
        duration: 0.44,
        ease: 'power2.inOut'
      }, 0.18);
      tl.to(this.refs.stageTrace, { opacity: 0, duration: 0.1, ease: 'none' }, 0.64);
      tl.set(this.refs.stageTrace, { left: '82%' }, 0.72);
      tl.to(this.refs.stageTrace, { opacity: 0.56, left: '26%', duration: 0.28, ease: 'power2.inOut' }, 0.74);
      tl.to(this.refs.stageTrace, { opacity: 0, duration: 0.08, ease: 'none' }, 1.04);
      tl.set(this.refs.stageTrace, { display: 'none' }, 1.16);
    }

    if (this.refs && this.refs.stageSweep) {
      tl.fromTo(
        this.refs.stageSweep,
        { opacity: 0, xPercent: -104, skewX: -12 },
        { opacity: 0.34, xPercent: 88, skewX: -3, duration: 0.34, ease: 'power2.inOut' },
        1.76
      );
      tl.to(this.refs.stageSweep, { opacity: 0, duration: 0.14, ease: 'power2.out' }, 2.08);
    }

    if (ambient) {
      tl.to(ambient, {
        opacity: '',
        scale: 1,
        duration: 0.34,
        ease: 'power2.out',
        clearProps: 'opacity,transform'
      }, 1.92);
    }

    tl.set(activeScene, { visibility: 'visible' }, 2.04);
    tl.fromTo(activeScene, {
      opacity: 0,
      scale: 0.94,
      y: 24,
      filter: 'blur(8px)',
      rotateX: -6,
      transformPerspective: 1400
    }, {
      opacity: 1,
      scale: 1,
      y: 0,
      filter: 'blur(0px)',
      rotateX: 0,
      duration: 0.42,
      ease: 'expo.out',
      clearProps: 'transform,opacity,filter'
    }, 2.08);

    if (hudNodes.length) {
      tl.fromTo(hudNodes, {
        opacity: 0,
        y: -10,
        filter: 'blur(6px)'
      }, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.22,
        stagger: 0.016,
        ease: 'power2.out',
        clearProps: 'transform,opacity,filter'
      }, 2.22);
    }
    if (progressFill) {
      tl.to(progressFill, {
        width: progressTarget || '11.1111%',
        duration: 0.32,
        ease: 'power2.out',
        clearProps: 'width'
      }, 2.28);
    }
    if (headlineNodes.length) {
      tl.fromTo(headlineNodes, {
        opacity: 0,
        y: 18,
        scale: 0.96,
        filter: 'blur(8px)'
      }, {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        duration: 0.34,
        stagger: 0.024,
        ease: 'expo.out',
        clearProps: 'transform,opacity,filter'
      }, 2.34);
    }
    if (supportNodes.length) {
      tl.fromTo(supportNodes, {
        opacity: 0,
        x: -18,
        y: 8,
        filter: 'blur(6px)'
      }, {
        opacity: 1,
        x: 0,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.26,
        stagger: 0.022,
        ease: 'power2.out',
        clearProps: 'transform,opacity,filter'
      }, 2.44);
    }
    if (previewNode) {
      tl.fromTo(previewNode, {
        opacity: 0,
        x: 24,
        y: 16,
        scale: 0.96,
        filter: 'blur(8px)'
      }, {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        duration: 0.32,
        ease: 'power2.out',
        clearProps: 'transform,opacity,filter'
      }, 2.52);
    }
    if (kickerNodes.length) {
      tl.fromTo(kickerNodes, {
        opacity: 0,
        x: 0,
        y: 16,
        scale: 0.94,
        filter: 'blur(6px)'
      }, {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        duration: 0.24,
        stagger: 0.028,
        ease: 'power3.out',
        clearProps: 'transform,opacity,filter'
      }, 2.62);
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
      <div class="pfs-intro-shutter pfs-intro-shutter--left"></div>
      <div class="pfs-intro-shutter pfs-intro-shutter--right"></div>
      <div class="pfs-intro-grid"></div>
      <div class="pfs-intro-frame"></div>
      <div class="pfs-intro-reticle"></div>
      <div class="pfs-intro-core"></div>
      <div class="pfs-stage-ring"></div>
      <div class="pfs-stage-sweep"></div>
      <div class="pfs-stage-noise"></div>
      <div class="pfs-stage-trace"></div>
    `;
    root.appendChild(transitionStage);

    const exitShip = document.createElement('div');
    exitShip.className = 'pfs-exit-ship';
    exitShip.innerHTML = `
      <div class="pfs-exit-ship-wake"></div>
      <div class="pfs-exit-ship-body"></div>
      <div class="pfs-exit-ship-nose"></div>
      <div class="pfs-exit-ship-wing pfs-exit-ship-wing--a"></div>
      <div class="pfs-exit-ship-wing pfs-exit-ship-wing--b"></div>
      <div class="pfs-exit-ship-core"></div>
    `;
    root.appendChild(exitShip);

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

    const sfxChip = document.createElement('button');
    sfxChip.className = 'pfs-auto-chip pfs-audio-chip';
    sfxChip.type = 'button';
    sfxChip.textContent = 'SFX ON';
    root.appendChild(sfxChip);

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

    const presenterHud = document.createElement('div');
    presenterHud.className = 'pfs-presenter-hud';
    presenterHud.innerHTML = `
      <span class="pfs-hud-chip"><strong>Elapsed</strong> <span class="pfs-hud-elapsed">00:00</span></span>
      <span class="pfs-hud-chip"><strong>Target</strong> <span class="pfs-hud-target">12:00</span></span>
      <span class="pfs-hud-chip"><strong>Left</strong> <span class="pfs-hud-left">12:00</span></span>
    `;
    root.appendChild(presenterHud);

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

    const notesPanel = document.createElement('div');
    notesPanel.className = 'pfs-notes-panel';
    notesPanel.innerHTML = `
      <div class="pfs-notes-head">Speaker Notes</div>
      <div class="pfs-notes-body">Press N to show notes.</div>
    `;
    root.appendChild(notesPanel);

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
      sfxChip,
      autoStatus: null,
      prevBtn,
      nextBtn,
      hint,
      presenterHud,
      hudElapsed: presenterHud.querySelector('.pfs-hud-elapsed'),
      hudTarget: presenterHud.querySelector('.pfs-hud-target'),
      hudLeft: presenterHud.querySelector('.pfs-hud-left'),
      counter,
      progressFill: progress.querySelector('.pfs-progress-fill'),
      completion,
      notesPanel,
      notesBody: notesPanel.querySelector('.pfs-notes-body'),
      bonzi,
      bonziLabel: bonzi.querySelector('.pfs-bonzi-label'),
      bonziText: bonzi.querySelector('.pfs-bonzi-text'),
      veil,
      transitionStage,
      introShutterLeft: transitionStage.querySelector('.pfs-intro-shutter--left'),
      introShutterRight: transitionStage.querySelector('.pfs-intro-shutter--right'),
      introGrid: transitionStage.querySelector('.pfs-intro-grid'),
      introFrame: transitionStage.querySelector('.pfs-intro-frame'),
      introReticle: transitionStage.querySelector('.pfs-intro-reticle'),
      introCore: transitionStage.querySelector('.pfs-intro-core'),
      stageRing: transitionStage.querySelector('.pfs-stage-ring'),
      stageSweep: transitionStage.querySelector('.pfs-stage-sweep'),
      stageNoise: transitionStage.querySelector('.pfs-stage-noise'),
      stageTrace: transitionStage.querySelector('.pfs-stage-trace'),
      exitShip,
      exitShipWake: exitShip.querySelector('.pfs-exit-ship-wake'),
      exitShipBody: exitShip.querySelector('.pfs-exit-ship-body'),
      exitShipNose: exitShip.querySelector('.pfs-exit-ship-nose'),
      exitShipWingA: exitShip.querySelector('.pfs-exit-ship-wing--a'),
      exitShipWingB: exitShip.querySelector('.pfs-exit-ship-wing--b'),
      exitShipCore: exitShip.querySelector('.pfs-exit-ship-core'),
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
        this._primeNarrationForSlide(this.current);
        this._primeNarrationForSlide(this.current + 1);
        this._queueBonziNarration(this._getNarrationSpeechForSlide(this.current));
      }
      else this._clearAutoPlay();
    });
    sfxChip.addEventListener('click', () => {
      this.sfxEnabled = !this.sfxEnabled;
      this._applyAudioUi();
      if (this.sfxEnabled) this._playUiConfirmSound();
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
      ? `${AUTO_HINT} · SPACE pause/resume · M SFX · N notes · R rehearse`
      : `${MANUAL_HINT} · 1-9 jump · M SFX · N notes · R rehearse`;
    this._setAutoStatus(
      !this.autoPlayEnabled ? 'AUTO OFF' : (this.autoPaused ? 'AUTO PAUSED' : 'AUTO STANDBY'),
      this.autoPlayEnabled && !this.autoPaused
    );
    this._applyAudioUi();
  }

  _applyAudioUi() {
    if (!this.refs || !this.refs.sfxChip) return;
    this.refs.sfxChip.textContent = this.sfxEnabled ? 'SFX ON' : 'SFX OFF';
    this.refs.sfxChip.classList.toggle('is-live', this.sfxEnabled);
  }

  _ensureAudioCtx() {
    if (!this.sfxEnabled) return null;
    if (!window.AudioContext && !window.webkitAudioContext) return null;
    if (!this.audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new Ctx();
      this.audioMaster = this.audioCtx.createGain();
      this.audioMaster.gain.value = 0.24;
      this.audioCompressor = this.audioCtx.createDynamicsCompressor();
      this.audioCompressor.threshold.value = -22;
      this.audioCompressor.knee.value = 18;
      this.audioCompressor.ratio.value = 3;
      this.audioCompressor.attack.value = 0.01;
      this.audioCompressor.release.value = 0.18;
      this.audioMaster.connect(this.audioCompressor).connect(this.audioCtx.destination);
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  _audioDestination() {
    return this.audioMaster || (this.audioCtx ? this.audioCtx.destination : null);
  }

  _scheduleAutoPlay(index) {
    this.transitionEngine.scheduleAutoPlay(index);
  }

  _startPresenterHud() {
    if (!this.refs) return;
    if (this.presenterTicker) clearInterval(this.presenterTicker);
    this.presenterStartAt = Date.now();
    const tick = () => this._updatePresenterHud();
    tick();
    this.presenterTicker = setInterval(tick, 250);
  }

  _formatClock(ms) {
    const safe = Math.max(0, Math.floor(ms / 1000));
    const m = String(Math.floor(safe / 60)).padStart(2, '0');
    const s = String(safe % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  _updatePresenterHud() {
    if (!this.refs || !this.refs.hudElapsed || !this.refs.hudTarget || !this.refs.hudLeft) return;
    const elapsedMs = Date.now() - (this.presenterStartAt || Date.now());
    const targetMs = 12 * 60 * 1000;
    const leftMs = Math.max(0, targetMs - elapsedMs);
    this.refs.hudElapsed.textContent = this._formatClock(elapsedMs);
    this.refs.hudTarget.textContent = this._formatClock(targetMs);
    this.refs.hudLeft.textContent = this._formatClock(leftMs);
    this.refs.presenterHud.classList.toggle('is-over', elapsedMs > targetMs);
  }

  _buildNotesForSlide(index) {
    const notes = [
      'Hook the room: gaming GPU became AI infrastructure.',
      'State thesis early. Tie to privacy, cost, access, power.',
      'Walk method lens: timeline, compare/contrast, cause/effect.',
      'Defend scope choices. Mention in-scope vs out-of-scope.',
      'Show cross-discipline impact: CS, math, econ, policy, ethics.',
      'Translate findings into practical consequences for users.',
      'Advocacy asks: open-source support and hardware literacy.',
      'Explain build process and why format reinforces thesis.',
      'Strong close: restate thesis, invite targeted questions.'
    ];
    return notes[index] || 'Use this slide to bridge to the next section.';
  }

  _toggleNotes() {
    if (!this.refs || !this.refs.notesPanel || !this.refs.notesBody) return;
    this.notesVisible = !this.notesVisible;
    this.refs.notesPanel.classList.toggle('is-open', this.notesVisible);
    this.refs.notesBody.textContent = this._buildNotesForSlide(this.current);
  }

  _toggleRehearsalMode() {
    this.rehearsalMode = !this.rehearsalMode;
    if (!this.overlay) return;
    this.overlay.classList.toggle('pfs-rehearsal', this.rehearsalMode);
    if (this.rehearsalMode) {
      this.sfxEnabled = false;
      this._applyAudioUi();
      this._setBonziBubble('Rehearsal', 'Rehearsal mode on: reduced sensory load.');
      return;
    }
    this._setBonziBubble('Rehearsal', 'Rehearsal mode off.');
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
    if (this.narrationLoadingTimer) {
      clearTimeout(this.narrationLoadingTimer);
      this.narrationLoadingTimer = null;
    }
    if (!this.autoPlayEnabled) this._setAutoStatus('AUTO OFF', false);
  }

  _queueAutoAdvance(index, maxWaitMs = 18000) {
    this._clearAutoPlay();
    if (!this.autoPlayEnabled || this.autoPaused || !this.isOpen) return;
    const token = ++this.autoNarrationToken;
    const speechBudgetMs = this._estimateNarrationDurationMs(this._getNarrationSpeechForSlide(index));
    const fallbackWaitMs = Math.min(60000, Math.max(maxWaitMs, speechBudgetMs + 30000));
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
    }, Math.max(1500, fallbackWaitMs));
    startCountdown(Math.max(1500, fallbackWaitMs), 'FALLBACK');

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

  _normalizeNarrationText(text) {
    return String(text || '')
      .replace(/\r\n/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();
  }

  _isObviousNarrationLabel(text) {
    const normalized = this._normalizeNarrationText(text).toLowerCase();
    if (!normalized) return true;
    if (/^slide\s*\d+(\s*\/\s*\d+)?$/.test(normalized)) return true;
    if (/^slide\s*0*\d+$/.test(normalized)) return true;
    if (/^title slide$/.test(normalized)) return true;
    if (/^questions?\s*&?\s*ending$/.test(normalized)) return true;
    if (/^chapter\s+slide$/.test(normalized)) return true;
    if (/^(context|scope|connections|implications|advocacy|build notes|finale|interact|fun fact)$/.test(normalized)) return true;
    if (/^(01|02|03|04|05|06|07|08|09)$/.test(normalized)) return true;
    return false;
  }

  _collectSpeakableSlideLines(scene) {
    if (!scene) return [];
    const selectors = [
      'h2',
      '.slide-subtitle-big',
      '.slide-body',
      '.slide-thesis',
      '.slide-connections',
      '.slide-implications',
      '.slide-advocacy-points',
      '.slide-prep',
      '.slide-qa',
      '.slide-meta-info',
      '.slide-preview',
      '.slide-ending-note',
      '.rq-item',
      '.method-card',
      '.persp-item',
      '.connection-item',
      '.impl-item',
      '.advocacy-point',
      '.prep-item',
      '.reflection-item',
      '.slide-kicker-card'
    ];
    const lines = [];
    const seen = new Set();

    selectors.forEach((selector) => {
      scene.querySelectorAll(selector).forEach((node) => {
        if (!(node instanceof HTMLElement)) return;
        const text = this._normalizeNarrationText(node.textContent);
        if (!text || this._isObviousNarrationLabel(text)) return;
        const key = text.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        lines.push(text);
      });
    });

    return lines;
  }

  _getSourceSlide(index) {
    const panel = document.getElementById('panelPres');
    if (!panel) return null;
    const slides = panel.querySelectorAll('.pres-slide');
    return slides[index] || null;
  }

  _buildSlideNarrationText(index) {
    const scene = this.scenes[index] || this._getSourceSlide(index);
    const slideLines = this._collectSpeakableSlideLines(scene);
    const slideText = slideLines.map((line) => this._ensureNarrationSentence(line)).join(' ');
    const bonziLine = this._ensureNarrationSentence(BONZI_NARRATION_LINES[index] || '');
    const parts = [];
    if (slideText) parts.push(slideText);
    if (bonziLine) parts.push(bonziLine);
    return this._trimNarrationSpeech(this._normalizeNarrationText(parts.join(' ')));
  }

  _getNarrationSpeechForSlide(index) {
    const script = this._buildSlideNarrationText(index);
    if (script) return script;
    return this._trimNarrationSpeech(this._normalizeNarrationText(BONZI_NARRATION_LINES[index] || this._slideTag(index)));
  }

  _trimNarrationSpeech(text) {
    const cleaned = this._normalizeNarrationText(text);
    if (!cleaned) return '';
    const sentences = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleaned];
    let output = '';
    for (const sentence of sentences) {
      const next = (output ? output + ' ' : '') + sentence.trim();
      if (next.length > 420) break;
      output = next;
      if (output.split(/[.!?]+/).filter(Boolean).length >= 3) break;
    }
    return output || cleaned.slice(0, 420).trim();
  }

  _estimateNarrationDurationMs(text) {
    const value = this._normalizeNarrationText(text);
    if (!value) return 2200;
    const words = value.split(/\s+/).filter(Boolean).length;
    const byWords = Math.round((words / 2.6) * 1000);
    const byChars = Math.round((value.length / 10) * 120);
    return Math.max(2200, Math.min(15000, Math.max(byWords, byChars)));
  }

  _getNarrationCacheKey(text) {
    const value = this._trimNarrationSpeech(text);
    if (!value) return '';
    return `bonzi:${value}`;
  }

  _pruneNarrationAudioCache(keepKeys = []) {
    const keep = new Set((keepKeys || []).filter(Boolean));
    for (const key of this.narrationAudioCache.keys()) {
      if (!keep.has(key)) this.narrationAudioCache.delete(key);
    }
  }

  _primeNarrationForSlide(index) {
    if (index < 0 || index >= TOTAL_SLIDES) return null;
    if (!window.Win95Speech || typeof window.Win95Speech.requestKokoro !== 'function') return null;
    const text = this._getNarrationSpeechForSlide(index);
    const key = this._getNarrationCacheKey(text);
    if (!key) return null;
    const existing = this.narrationAudioCache.get(key);
    if (existing) return existing.promise || Promise.resolve(existing);

    const cfg = window.Win95Speech.getConfig ? window.Win95Speech.getConfig('bonzi') : {};
    const entry = {
      status: 'pending',
      text,
      promise: null,
      blob: null,
      endpoint: ''
    };
    entry.promise = window.Win95Speech.requestKokoro(text, cfg).then((result) => {
      entry.status = 'ready';
      entry.blob = result && result.blob ? result.blob : null;
      entry.endpoint = result && result.endpoint ? result.endpoint : '';
      return entry;
    }).catch((err) => {
      this.narrationAudioCache.delete(key);
      throw err;
    });
    this.narrationAudioCache.set(key, entry);
    return entry.promise;
  }

  primeNarrationCatalog(startIndex = 0) {
    const start = Math.max(0, startIndex | 0);
    let chain = Promise.resolve();
    for (let index = start; index < TOTAL_SLIDES; index += 1) {
      chain = chain.then(() => this._primeNarrationForSlide(index)).catch(() => null);
    }
    return chain;
  }

  async _consumeNarrationAudio(text) {
    const key = this._getNarrationCacheKey(text);
    if (!key) return null;
    const entry = this.narrationAudioCache.get(key);
    if (!entry) return null;
    if (entry.status === 'ready' && entry.blob) return entry;
    if (!entry.promise) return null;
    try {
      const resolved = await entry.promise;
      return resolved && resolved.blob ? resolved : null;
    } catch (_) {
      return null;
    }
  }

  _speakWithSpeechSynthesisWait(text) {
    const value = this._trimNarrationSpeech(text);
    if (!value || !window.speechSynthesis) return Promise.resolve(false);
    return new Promise((resolve) => {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(value);
        utterance.rate = 1.03;
        utterance.pitch = 1.02;
        utterance.volume = 0.82;
        utterance.onend = () => resolve(true);
        utterance.onerror = () => resolve(false);
        window.speechSynthesis.speak(utterance);
      } catch (_) {
        resolve(false);
      }
    });
  }

  _ensureNarrationSentence(text) {
    const cleaned = this._normalizeNarrationText(text);
    if (!cleaned) return '';
    if (/[.!?…]$/.test(cleaned)) return cleaned;
    return `${cleaned}.`;
  }

  _setBonziBubble(label, text) {
    if (!this.refs || !this.refs.bonziLabel || !this.refs.bonziText) return;
    this.refs.bonziLabel.textContent = label;
    this.refs.bonziText.textContent = text;
    if (
      this.autoPlayEnabled &&
      !this.autoPaused &&
      !(this.autoNarrationSlide === this.current && this.autoNarrationPromise)
    ) {
      const script = this._getNarrationSpeechForSlide(this.current);
      this._queueBonziNarration(script);
    }
    if (this.notesVisible && this.refs && this.refs.notesBody) {
      this.refs.notesBody.textContent = this._buildNotesForSlide(this.current);
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
    if (this.narrationLoadingTimer) {
      clearTimeout(this.narrationLoadingTimer);
      this.narrationLoadingTimer = null;
    }
    this.narrationLoadingTimer = setTimeout(() => {
      if (token !== this.autoNarrationToken) return;
      if (this.autoNarrationSlide !== this.current) return;
      this._setAutoStatus('NARRATOR LOADING', true);
    }, 220);
    this.autoNarrationPromise = this._speakBonzi(text).then((ok) => {
      if (this.narrationLoadingTimer) {
        clearTimeout(this.narrationLoadingTimer);
        this.narrationLoadingTimer = null;
      }
      if (token === this.autoNarrationToken) {
        this._runSceneNarrationHook('afterSpeak', { slide: this.current, text, token, ok });
      }
      return ok;
    });
    if (this.autoPlayEnabled && !this.autoPaused) {
      this._scheduleAutoPlay(this.current);
    }
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
    const introToken = ++this.bonziIntroToken;
    const sinceSlideSwitch = performance.now() - (this.lastSlideSwitchAt || 0);
    const rapidSwitch = Number.isFinite(sinceSlideSwitch) && sinceSlideSwitch > 0 && sinceSlideSwitch < 340;

    this.refs.bonzi.dataset.side = profile.stage.side || 'right';
    this.refs.bonzi.dataset.face = profile.stage.face || 'normal';
    this.refs.bonzi.classList.add('is-visible');

    if (!window.gsap) {
      this._setBonziBubble(BONZI_LABELS[index] || 'Note', BONZI_LINES[index] || BONZI_LINES[0]);
      return;
    }
    if (this.bonziIntroCall && typeof this.bonziIntroCall.kill === 'function') {
      this.bonziIntroCall.kill();
      this.bonziIntroCall = null;
    }
    if (this.bonziBubbleCall && typeof this.bonziBubbleCall.kill === 'function') {
      this.bonziBubbleCall.kill();
      this.bonziBubbleCall = null;
    }
    gsap.killTweensOf(this.refs.bonzi);
    const signatureBySlide = [
      { duration: 0.7, settle: 0.16 }, // title
      { duration: 0.56, settle: 0.12 },
      { duration: 0.6, settle: 0.14 },
      { duration: 0.58, settle: 0.12 },
      { duration: 0.66, settle: 0.16 },
      { duration: 0.64, settle: 0.16 },
      { duration: 0.6, settle: 0.14 },
      { duration: 0.6, settle: 0.12 },
      { duration: 0.72, settle: 0.18 } // finale
    ];
    const sig = signatureBySlide[index] || signatureBySlide[0];
    const delayBySlide = [0.34, 0.18, 0.2, 0.18, 0.26, 0.24, 0.22, 0.2, 0.34];
    const introDelay = delayBySlide[index] ?? 0.14;
    const bubbleDelay = rapidSwitch ? 0.2 : Math.min(0.22, introDelay + 0.06);
    const from = { x: 0, y: 0, scale: 1 };
    if (introStyle === 'peek') from.x = profile.stage.side === 'left' ? -26 : 26;
    if (introStyle === 'jump') { from.y = 28; from.scale = 0.97; }
    if (introStyle === 'drop') { from.y = -28; from.scale = 1.03; }
    if (introStyle === 'ascend') { from.y = 36; from.scale = 0.96; }
    if (introStyle === 'spark') { from.y = -14; from.x = profile.stage.side === 'left' ? -18 : 18; }

    this.bonziBubbleCall = gsap.delayedCall(bubbleDelay, () => {
      if (introToken !== this.bonziIntroToken) return;
      if (this.current !== index) return;
      this._setBonziBubble(BONZI_LABELS[index] || 'Note', BONZI_LINES[index] || BONZI_LINES[0]);
      this.bonziBubbleCall = null;
    });

    this.bonziIntroCall = gsap.delayedCall(introDelay, () => {
      if (introToken !== this.bonziIntroToken) return;
      if (this.current !== index) return;
      const tl = gsap.timeline();
      if (rapidSwitch) {
        tl.fromTo(
          this.refs.bonzi,
          { opacity: 0.76, x: 0, y: 0, scale: 0.992 },
          { opacity: 1, x: 0, y: 0, scale: 1, duration: 0.2, ease: 'power2.out', clearProps: 'transform,opacity' }
        );
      } else {
        tl.fromTo(
          this.refs.bonzi,
          { opacity: 0, x: from.x, y: from.y, scale: from.scale },
          { opacity: 1, x: 0, y: 0, scale: 1, duration: sig.duration, ease: 'power2.out', clearProps: 'transform,opacity' }
        );
        tl.to(this.refs.bonzi, { y: -3, duration: sig.settle, yoyo: true, repeat: 1, ease: 'sine.inOut' }, '-=0.04');
      }
    });
  }

  _speakBonzi(text) {
    const value = this._trimNarrationSpeech(text);
    if (!value) return Promise.resolve(false);
    if (window.Win95Speech && typeof window.Win95Speech.cancel === 'function') {
      try { window.Win95Speech.cancel('bonzi'); } catch (_) {}
    }
    if (window.Win95Speech && typeof window.Win95Speech.playBlob === 'function') {
      return this._consumeNarrationAudio(value).then(async (entry) => {
        if (entry && entry.blob) {
          try {
            const played = await window.Win95Speech.playBlob(entry.blob);
            if (played) return true;
          } catch (_) {}
        }
        return null;
      }).then((played) => {
        if (played != null) return played;
        if (window.Win95Speech && typeof window.Win95Speech.speakKokoro === 'function') {
          return window.Win95Speech
            .speakKokoro(value, 'bonzi')
            .then(async (ok) => {
              if (ok) return true;
              if (window.Win95Speech && typeof window.Win95Speech.speak === 'function') {
                try {
                  return await window.Win95Speech.speak(value, { character: 'bonzi', prefer: 'kokoro', ignoreEnabled: true });
                } catch (_) {}
              }
              return this._speakWithSpeechSynthesisWait(value);
            })
            .catch(async () => {
              if (window.Win95Speech && typeof window.Win95Speech.speak === 'function') {
                try {
                  return await window.Win95Speech.speak(value, { character: 'bonzi', prefer: 'kokoro', ignoreEnabled: true });
                } catch (_) {}
              }
              return this._speakWithSpeechSynthesisWait(value);
            });
        }
        if (window.Win95Speech && typeof window.Win95Speech.speak === 'function') {
          return window.Win95Speech
            .speak(value, { character: 'bonzi', prefer: 'kokoro', ignoreEnabled: true })
            .then((ok) => !!ok)
            .catch(() => false);
        }
        return Promise.resolve(false);
      });
    }
    if (window.Win95Speech && typeof window.Win95Speech.speakKokoro === 'function') {
      return window.Win95Speech
        .speakKokoro(value, 'bonzi')
        .then(async (ok) => {
          if (ok) return true;
          if (window.Win95Speech && typeof window.Win95Speech.speak === 'function') {
            try {
              return await window.Win95Speech.speak(value, { character: 'bonzi', prefer: 'kokoro', ignoreEnabled: true });
            } catch (_) {}
          }
          return this._speakWithSpeechSynthesisWait(value);
        })
        .catch(async () => {
          if (window.Win95Speech && typeof window.Win95Speech.speak === 'function') {
            try {
              return await window.Win95Speech.speak(value, { character: 'bonzi', prefer: 'kokoro', ignoreEnabled: true });
            } catch (_) {}
          }
          return this._speakWithSpeechSynthesisWait(value);
        });
    }
    if (window.Win95Speech && typeof window.Win95Speech.speak === 'function') {
      return window.Win95Speech
        .speak(value, { character: 'bonzi', prefer: 'kokoro', ignoreEnabled: true })
        .then((ok) => !!ok)
        .catch(() => false);
    }
    return this._speakWithSpeechSynthesisWait(value);
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
    const target = event.target;
    const isEditableTarget =
      target &&
      (
        target.isContentEditable ||
        /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName || '') ||
        (target.closest && target.closest('[contenteditable="true"]'))
      );
    if (isEditableTarget) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
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
      return;
    }
    if (event.key.toLowerCase() === 'm') {
      event.preventDefault();
      this.sfxEnabled = !this.sfxEnabled;
      this._applyAudioUi();
      if (this.sfxEnabled) this._playUiConfirmSound();
      return;
    }
    if (event.key === 'Home') {
      event.preventDefault();
      this.transitionEngine.goTo(0);
      return;
    }
    if (event.key === 'End') {
      event.preventDefault();
      this.transitionEngine.goTo(TOTAL_SLIDES - 1);
      return;
    }
    if (/^[1-9]$/.test(event.key)) {
      const target = Number(event.key) - 1;
      if (target >= 0 && target < TOTAL_SLIDES) {
        event.preventDefault();
        this.transitionEngine.goTo(target);
      }
      return;
    }
    if (event.key.toLowerCase() === 'n') {
      event.preventDefault();
      this._toggleNotes();
      return;
    }
    if (event.key.toLowerCase() === 'r') {
      event.preventDefault();
      this._toggleRehearsalMode();
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
    this._queueBonziNarration(this._getNarrationSpeechForSlide(this.current));
  }

  _onResize() {
    if (!this.isOpen) return;
    this._refreshSceneScroll(this.scenes[this.current]);
    if (!this.three) return;
    const { camera, renderer, composer } = this.three;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    if (composer && typeof composer.setSize === 'function') {
      composer.setSize(window.innerWidth, window.innerHeight);
    }
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

  _playUiConfirmSound() {
    const ctx = this._ensureAudioCtx();
    const dest = this._audioDestination();
    if (!ctx || !dest) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.11);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.02, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain).connect(dest);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  _playNavSound(direction) {
    const ctx = this._ensureAudioCtx();
    const dest = this._audioDestination();
    if (!ctx || !dest) return;
    const nowMs = performance.now();
    if (nowMs - this.lastNavSfxAt < 70) return;
    this.lastNavSfxAt = nowMs;
    const freq = direction >= 0 ? 720 : 420;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(direction >= 0 ? 910 : 310, now + 0.1);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.016, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(direction >= 0 ? 1440 : 980, now);
    shimmerGain.gain.setValueAtTime(0.001, now);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0046, now + 0.02);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
    osc.connect(gain).connect(dest);
    shimmer.connect(shimmerGain).connect(dest);
    osc.start(now);
    shimmer.start(now + 0.008);
    osc.stop(now + 0.12);
    shimmer.stop(now + 0.095);
  }

  _playTransitionSting(index) {
    const ctx = this._ensureAudioCtx();
    const dest = this._audioDestination();
    if (!ctx || !dest) return;
    const nowMs = performance.now();
    if (nowMs - this.lastStingSfxAt < 180) return;
    this.lastStingSfxAt = nowMs;
    const style = TRANSITION_STYLE_BY_SLIDE[index] || 'ignite';
    const now = ctx.currentTime;
    const mk = (type, f0, f1, t0, t1, g0, g1) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f0, now + t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), now + t1);
      gain.gain.setValueAtTime(g0, now + t0);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, g1), now + t1);
      osc.connect(gain).connect(dest);
      osc.start(now + t0);
      osc.stop(now + t1 + 0.02);
    };

    if (style === 'warp' || style === 'finale') {
      mk('triangle', 180, 740, 0.0, 0.18, 0.001, 0.006);
      mk('sine', 460, 120, 0.04, 0.28, 0.004, 0.001);
      mk('triangle', 900, 340, 0.06, 0.16, 0.002, 0.0008);
      mk('sine', 1200, 1680, 0.0, 0.07, 0.001, 0.0018);
    } else if (style === 'trace') {
      mk('triangle', 300, 520, 0, 0.12, 0.001, 0.0045);
      mk('sine', 920, 760, 0.02, 0.08, 0.001, 0.0016);
    } else if (style === 'katana') {
      mk('square', 1000, 380, 0, 0.1, 0.0032, 0.001);
      mk('triangle', 240, 520, 0.08, 0.2, 0.0014, 0.0008);
      mk('sine', 1600, 820, 0.01, 0.07, 0.001, 0.0018);
    } else if (style === 'iris') {
      mk('sine', 280, 620, 0, 0.2, 0.001, 0.006);
      mk('sine', 520, 320, 0.1, 0.3, 0.0018, 0.0008);
      mk('triangle', 920, 1180, 0.02, 0.1, 0.001, 0.0018);
    } else if (style === 'scanline') {
      mk('sine', 320, 1400, 0, 0.16, 0.001, 0.0048);
      mk('triangle', 180, 420, 0.1, 0.24, 0.0014, 0.0008);
      mk('square', 2200, 880, 0.0, 0.055, 0.001, 0.0016);
    } else if (style === 'shard') {
      mk('triangle', 240, 780, 0, 0.14, 0.001, 0.0056);
      mk('sine', 520, 260, 0.07, 0.22, 0.002, 0.0008);
      mk('square', 1480, 620, 0.015, 0.085, 0.001, 0.0016);
    } else if (style === 'pulse') {
      mk('sine', 220, 480, 0, 0.18, 0.001, 0.006);
      mk('sine', 480, 260, 0.12, 0.28, 0.0018, 0.0008);
      mk('triangle', 760, 980, 0.03, 0.12, 0.001, 0.0018);
    } else {
      mk('triangle', 260, 560, 0, 0.16, 0.001, 0.0056);
      mk('sine', 980, 720, 0.02, 0.1, 0.001, 0.0018);
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

    const fallbackShip = new THREE.Group();
    fallbackShip.name = 'fallbackShip';
    const shipBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.16, 1.08, 12, 1, false),
      new THREE.MeshStandardMaterial({
        color: 0xe5f7ff,
        emissive: 0x2a78d8,
        emissiveIntensity: 1.5,
        metalness: 0.82,
        roughness: 0.18
      })
    );
    shipBody.rotation.z = Math.PI / 2;
    fallbackShip.add(shipBody);

    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.42, 12),
      new THREE.MeshStandardMaterial({
        color: 0xf3fbff,
        emissive: 0x4eb7ff,
        emissiveIntensity: 1.1,
        metalness: 0.7,
        roughness: 0.1
      })
    );
    nose.rotation.z = -Math.PI / 2;
    nose.position.x = 0.8;
    fallbackShip.add(nose);

    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 16, 12),
      new THREE.MeshStandardMaterial({
        color: 0x10182d,
        emissive: 0x6db8ff,
        emissiveIntensity: 0.8,
        metalness: 0.28,
        roughness: 0.06,
        transparent: true,
        opacity: 0.9
      })
    );
    canopy.position.set(0.54, 0.08, 0.02);
    canopy.scale.set(1.0, 0.72, 0.88);
    fallbackShip.add(canopy);

    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xa9d2ff,
      emissive: 0x134f9c,
      emissiveIntensity: 0.9,
      metalness: 0.74,
      roughness: 0.2
    });
    const wingGeo = new THREE.BoxGeometry(0.56, 0.06, 0.16);
    const wingL = new THREE.Mesh(wingGeo, wingMat);
    wingL.position.set(-0.08, -0.08, 0.28);
    wingL.rotation.z = -0.28;
    fallbackShip.add(wingL);
    const wingR = wingL.clone();
    wingR.position.z = -0.28;
    wingR.rotation.z = 0.28;
    fallbackShip.add(wingR);

    const tailFin = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.34, 0.42),
      new THREE.MeshStandardMaterial({
        color: 0x7bcfff,
        emissive: 0x0f4f9d,
        emissiveIntensity: 1.0,
        metalness: 0.7,
        roughness: 0.16
      })
    );
    tailFin.position.set(-0.75, 0.1, 0);
    tailFin.rotation.z = 0.1;
    fallbackShip.add(tailFin);

    const engineGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 14, 10),
      new THREE.MeshBasicMaterial({
        color: 0x8fe8ff,
        transparent: true,
        opacity: 0.95
      })
    );
    engineGlow.position.set(-0.98, 0, 0);
    fallbackShip.add(engineGlow);

    fallbackShip.scale.set(0.72, 0.72, 0.72);
    const shipBeacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 16, 12),
      new THREE.MeshBasicMaterial({
        color: 0xe8fbff,
        transparent: true,
        opacity: 0.98,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    shipBeacon.position.set(0.88, 0.05, 0.02);
    fallbackShip.add(shipBeacon);

    const shipWake = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.24, 1.85, 12, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0x7fdfff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    shipWake.rotation.z = Math.PI / 2;
    shipWake.position.set(-1.0, 0.02, 0);
    shipWake.scale.set(0.12, 0.12, 0.12);
    shipWake.visible = false;
    fallbackShip.add(shipWake);
    shipWrap.add(fallbackShip);
    this.shipFallback = fallbackShip;
    this.shipBeacon = shipBeacon;
    this.shipWake = shipWake;
    this.shipModelLoaded = true;

    const loader = new OBJLoader();
    const mtlLoader = new MTLLoader();
    const modelDirPaths = [
      '/assets/models/interstellar-runner/Package/',
      './assets/models/interstellar-runner/Package/'
    ];
    const modelPaths = [
      '/assets/models/interstellar-runner/Package/InterstellarRunner.obj',
      './assets/models/interstellar-runner/Package/InterstellarRunner.obj'
    ];
    const materialPaths = [
      '/assets/models/interstellar-runner/Package/InterstellarRunner.mtl',
      './assets/models/interstellar-runner/Package/InterstellarRunner.mtl'
    ];
    const finalizeLoadedShip = (obj) => {
      if (this.shipFallback) this.shipFallback.visible = false;
      if (this.shipBeacon) this.shipBeacon.visible = false;
      if (this.shipWake) this.shipWake.visible = false;
      obj.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = false;
        child.receiveShadow = false;
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((mat) => {
            if (!mat) return;
            mat.side = THREE.DoubleSide;
            if ('transparent' in mat) mat.transparent = true;
            if (typeof mat.opacity !== 'number') mat.opacity = 1;
            if ('alphaTest' in mat) mat.alphaTest = 0.02;
            if ('needsUpdate' in mat) mat.needsUpdate = true;
          });
        }
      });

      const box = new THREE.Box3().setFromObject(obj);
      const size = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(size);
      box.getCenter(center);
      obj.position.sub(center);
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const target = 1.6;
      const scale = target / maxDim;
      obj.scale.setScalar(scale);
      shipWrap.add(obj);
      this.shipModelLoaded = true;
    };
    const tryLoad = (idx) => {
      const src = modelPaths[idx];
      const mtlSrc = materialPaths[idx];
      const modelDir = modelDirPaths[idx];
      if (!src) {
        this.shipModelLoaded = false;
        return;
      }
      const loadObjOnly = () => {
        loader.load(
          src,
          (obj) => finalizeLoadedShip(obj),
          undefined,
          () => tryLoad(idx + 1)
        );
      };
      if (!mtlSrc) {
        loadObjOnly();
        return;
      }
      mtlLoader.setResourcePath(modelDir);
      mtlLoader.load(
        mtlSrc,
        (materials) => {
          materials.preload();
          loader.setMaterials(materials);
          loadObjOnly();
        },
        undefined,
        () => loadObjOnly()
      );
    };
    tryLoad(0);
  }

  _initThree() {
    const host = this.refs ? this.refs.threeHost : null;
    if (!host) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.domElement.style.opacity = '0';
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060611, 0.045);
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 0.35, 8.25);
    this.cameraHome = { x: 0, y: 0.35, z: 8.25 };

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      this.rehearsalMode ? 0.26 : 0.62,
      0.9,
      0.22
    );
    composer.addPass(renderPass);
    composer.addPass(bloomPass);

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

    const warpRings = new THREE.Group();
    const warpRingCount = 96;
    const warpRingSpacing = 0.11;
    for (let i = 0; i < warpRingCount; i += 1) {
      const depthT = i / Math.max(1, warpRingCount - 1);
      const radius = 2.7 - (depthT * 1.45);
      const tube = 0.024 - (depthT * 0.01);
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, Math.max(0.012, tube), 12, 84),
        new THREE.MeshBasicMaterial({
          color: i % 2 ? 0x7fd8ff : 0xff85d8,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending
        })
      );
      ring.position.set(0, -0.08, -0.82 - (i * warpRingSpacing));
      ring.rotation.x = 0.32;
      ring.userData.baseZ = ring.position.z;
      warpRings.add(ring);
    }
    warpRings.visible = false;
    scene.add(warpRings);

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

    this.three = { renderer, composer, bloomPass, scene, camera, portal, portalHalo, stars, tunnelStars, warpRings, particleSphere };
    this.threeGroups = { chipGroup, researchGroup, connectionsGroup, implicationsGroup, finaleGroup };
    this._loadInterstellarRunner(scene);
    this._setThreeWorld(0, 1);
    this.lastTick = performance.now();
    this._renderThree();
  }

  _setThreeWorld(index, intensity = 1) {
    if (!this.three) return;
    const { camera, portal, portalHalo, scene, tunnelStars, warpRings, particleSphere, renderer, bloomPass } = this.three;
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

    // Keep a subtle ambient 3D layer in resting slide state.
    show(chipGroup, mode === 'chip', 0.24, 0.035);
    show(researchGroup, mode === 'research', 0.24, 0.035);
    show(connectionsGroup, mode === 'connections', 0.26, 0.04);
    show(implicationsGroup, mode === 'implications', 0.26, 0.04);
    show(finaleGroup, mode === 'finale', 0.24, 0.035);

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
        x: mode === 'finale' ? 1.12 : 1.02,
        y: mode === 'finale' ? 1.12 : 1.02,
        z: 1,
        duration: 0.55,
        ease: 'power2.out'
      });
      gsap.to(portalHalo.scale, {
        x: mode === 'finale' ? 1.22 : 1.06,
        y: mode === 'finale' ? 1.22 : 1.06,
        z: 1,
        duration: 0.55,
        ease: 'power2.out'
      });
      const fogTarget = mode === 'finale' ? 0.034 : mode === 'connections' ? 0.052 : 0.045;
      gsap.to(scene.fog, { density: fogTarget, duration: 0.6, ease: 'power2.out' });
      if (bloomPass) {
        gsap.to(
          bloomPass,
          {
            strength: this.escapeWarpActive ? 1.3 : mode === 'finale' ? 0.82 : this.rehearsalMode ? 0.24 : 0.62,
            radius: mode === 'finale' ? 0.95 : 0.88,
            threshold: 0.22,
            duration: 0.6,
            ease: 'power2.out'
          }
        );
      }
      const resting = !this.threeTransitionActive && !this.escapeWarpActive;
      gsap.to(tunnelStars.material, {
        opacity: resting ? (mode === 'finale' ? 0.2 : 0.16) : 0,
        duration: 0.55,
        ease: 'power2.out'
      });
      gsap.to(particleSphere.material, {
        opacity: 0,
        duration: 0.35,
        ease: 'power2.out'
      });
      gsap.to(portal.material, {
        opacity: resting ? (mode === 'finale' ? 0.18 : 0.11) : 0,
        duration: 0.35,
        ease: 'power2.out'
      });
      gsap.to(portalHalo.material, {
        opacity: resting ? (mode === 'finale' ? 0.12 : 0.07) : 0,
        duration: 0.35,
        ease: 'power2.out'
      });
      if (renderer && renderer.domElement) {
        gsap.to(renderer.domElement, {
          opacity: resting ? (this.rehearsalMode ? 0.42 : 0.66) : 0,
          duration: 0.28,
          ease: 'power2.out'
        });
      }
      if (warpRings) {
        const cinematicWarp =
          this.escapeWarpActive
          || (this.threeTransitionActive && (this.threeTransitionStyle === 'warp' || this.threeTransitionStyle === 'finale'));
        warpRings.visible = cinematicWarp;
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
    if (mode === 'finale') this._setGroupOpacity(finaleGroup, 0.32);
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
    if (style !== 'warp' && style !== 'finale') {
      state.mix = 0;
      state.target = 0;
      state.material.opacity = 0;
      particleSphere.visible = false;
      return;
    }
    if (style === 'finale') {
      state.mix = 0;
      state.target = 0;
      state.material.opacity = 0;
      particleSphere.visible = false;
      return;
    }
    const fromKey = state.activeKey || 'portal';
    const toKey = this._particleShapeForSlide(nextIndex);
    state.from = state.shapes[fromKey] || state.shapes.portal;
    state.to = state.shapes[toKey] || state.shapes.portal;
    state.activeKey = toKey;
    state.mix = 0;
    state.target = 1;
    state.twist = 0.22;
    state.noisePhase = 0;
    particleSphere.visible = true;

    const rise = 0.03;
    tl.fromTo(state, { mix: 0 }, { mix: 1, duration: 0.42, ease: 'power2.out' }, 0.02);
    tl.fromTo(
      state.material,
      { opacity: rise, size: 0.012 },
      { opacity: 0, size: 0.008, duration: 0.38, ease: 'power2.out' },
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

    const { renderer, composer, scene, camera, portal, portalHalo, stars, tunnelStars, warpRings, particleSphere } = this.three;
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
      const allowMorph = this.threeTransitionStyle === 'warp' || this.threeTransitionStyle === 'finale' || this.escapeWarpActive;
      if (allowMorph && (this.threeTransitionActive || pm.points.visible)) {
        const inv = 1 - mix;
        pm.noisePhase = (pm.noisePhase || 0) + dt * (this.threeTransitionActive ? 2.4 : 0.8);
        for (let i = 0; i < cur.length; i += 1) {
          const n = Math.sin((i * 0.00075) + pm.noisePhase) * 0.016 * (1 - Math.abs(0.5 - mix) * 2);
          cur[i] = (from[i] * inv + to[i] * mix) + n;
        }
        pm.geometry.attributes.position.needsUpdate = true;
      }
      particleSphere.rotation.y += dt * (allowMorph && this.threeTransitionActive ? 0.42 : 0.02);
      particleSphere.rotation.x += dt * (allowMorph && this.threeTransitionActive ? 0.16 : 0.01);
      particleSphere.scale.x = allowMorph ? (0.44 + mix * 0.18) : 0.2;
      particleSphere.scale.y = allowMorph ? (0.44 + mix * 0.18) : 0.2;
      particleSphere.scale.z = 1;
      particleSphere.visible = allowMorph && (this.threeTransitionActive || pm.material.opacity > 0.01);
    }

    if (warpRings) {
      const cinematicWarp =
        this.escapeWarpActive
        || (this.threeTransitionActive && (this.threeTransitionStyle === 'warp' || this.threeTransitionStyle === 'finale'));
      const ringSpeed = this.escapeWarpActive ? 15.8 : cinematicWarp ? 8.4 : 0.8;
      warpRings.visible = cinematicWarp || this.threeMode === 'finale';
      warpRings.children.forEach((ring, idx) => {
        ring.position.z += dt * ringSpeed * (1 + (idx * 0.02));
        if (ring.position.z > 3.2) ring.position.z = -25 - (idx * 1.25);
        const depthFade = 1 - Math.min(1, Math.max(0, (ring.position.z + 1.4) / 6.8));
      const targetOpacity =
          this.escapeWarpActive ? (0.14 * depthFade)
          : cinematicWarp ? (0.06 * depthFade)
          : this.threeMode === 'finale' ? (0.03 * depthFade)
          : 0.0;
        if (ring.material) {
          ring.material.opacity += (targetOpacity - ring.material.opacity) * Math.min(1, dt * 6.5);
        }
      });
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
    if (this.shipRoot && this.shipRoot.visible && !this.escapeWarpActive && !this.threeTransitionActive) {
      this.shipRoot.rotation.z += (this.pointer.x * 0.12 - this.shipRoot.rotation.z) * Math.min(1, dt * 4.2);
      this.shipRoot.rotation.x += ((-0.04 + this.pointer.y * 0.08) - this.shipRoot.rotation.x) * Math.min(1, dt * 3.6);
    }

    // Resting mode: keep subtle portal/tunnel ambience while disabling intrusive effects.
    if (!this.threeTransitionActive && !this.escapeWarpActive) {
      if (renderer && renderer.domElement && renderer.domElement.style.opacity === '0') {
        renderer.domElement.style.opacity = this.rehearsalMode ? '0.42' : '0.66';
      }
      if (this.particleMorph && this.particleMorph.material) {
        this.particleMorph.material.opacity = 0;
        if (this.particleMorph.points) this.particleMorph.points.visible = false;
      }
      if (this.shipRoot) this.shipRoot.visible = false;
    }

    if (composer) composer.render();
    else renderer.render(scene, camera);
    this.raf = requestAnimationFrame(() => this._renderThree());
  }

  _destroyThree() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (!this.three) return;
    const { renderer, composer, scene } = this.three;
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((mat) => mat.dispose());
        else obj.material.dispose();
      }
    });
    if (composer && typeof composer.dispose === 'function') composer.dispose();
    renderer.dispose();
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    this.three = null;
    this.threeGroups = {};
  }

  _resetThreeTransitionState(particleKey = null) {
    if (!this.three) return;
    const { renderer, portal, portalHalo, warpRings, camera } = this.three;
    const { chipGroup, researchGroup, connectionsGroup, implicationsGroup, finaleGroup } = this.threeGroups;

    this._setGroupOpacity(chipGroup, 0);
    this._setGroupOpacity(researchGroup, 0);
    this._setGroupOpacity(connectionsGroup, 0);
    this._setGroupOpacity(implicationsGroup, 0);
    this._setGroupOpacity(finaleGroup, 0);

    portal.material.opacity = 0;
    portalHalo.material.opacity = 0;
    portal.visible = true;
    portalHalo.visible = true;
    portal.scale.set(1, 1, 1);
    portalHalo.scale.set(1, 1, 1);
    this.threeTransitionActive = false;
    this.threeTransitionStyle = 'none';
    this.escapeWarpActive = false;
    if (this.overlay) this.overlay.classList.remove('pfs-exit-warp');
    if (renderer && renderer.domElement) renderer.domElement.style.opacity = '0';
    if (camera && this.cameraHome) {
      camera.position.set(this.cameraHome.x, this.cameraHome.y, this.cameraHome.z);
    }

    if (this.refs && this.refs.endFlash) this.refs.endFlash.style.display = 'none';
    if (this.overlay) this.overlay.classList.remove('pfs-hyperspace-active');
    if (this.shipRoot) this.shipRoot.visible = false;
    if (this.shipWake) {
      this.shipWake.visible = false;
      this.shipWake.material.opacity = 0;
      this.shipWake.scale.set(0.18, 0.14, 0.14);
    }
    if (this.shipBeacon) {
      this.shipBeacon.visible = false;
      this.shipBeacon.material.opacity = 0;
      this.shipBeacon.scale.set(1, 1, 1);
    }
    if (warpRings) {
      warpRings.visible = false;
      warpRings.children.forEach((ring) => {
        ring.position.z = typeof ring.userData.baseZ === 'number' ? ring.userData.baseZ : ring.position.z;
        if (ring.material) ring.material.opacity = 0;
      });
    }

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
