import * as THREE from 'three';
import { initIconDragModule } from './modules/icon-drag.js?v=icongrid2';
import { initContextMenuModule } from './modules/context-menu.js';
import { animatePresSlides } from './modules/presentation-animations.js';
import { createTerminalRuntime } from './modules/terminal-runtime.js';
import { createMediaWindows } from './modules/media-windows.js';
import { createWindowManager } from './modules/window-manager.js';
import { createStartMenuController } from './modules/start-menu.js';
import { startBootSequence } from './modules/boot-sequence.js';
import { createWin95Audio } from './modules/audio-effects.js';
import { createAISystem } from './modules/ai-system.js';
import { createNotepadSystem } from './modules/notepad-system.js';

// Disable native browser context menu globally; app-specific menus still work.
document.addEventListener('contextmenu', function(event) {
  event.preventDefault();
}, { capture: true });

// ═══════════════════════════════════════════════════
// THREE.JS PARTICLE BACKGROUND (ambient behind desktop)
// ═══════════════════════════════════════════════════
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(0, 0, 80);

// Floating particle field
const PTC = 1500;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(PTC * 3);
const pVel = new Float32Array(PTC * 3);
const pCol = new Float32Array(PTC * 3);
const pal = [new THREE.Color(0x00ffaa), new THREE.Color(0xff00aa), new THREE.Color(0x00aaff), new THREE.Color(0xffaa00)];
for (let i = 0; i < PTC; i++) {
  pPos[i*3]=(Math.random()-0.5)*200; pPos[i*3+1]=(Math.random()-0.5)*200; pPos[i*3+2]=(Math.random()-0.5)*200;
  pVel[i*3]=(Math.random()-0.5)*0.015; pVel[i*3+1]=(Math.random()-0.5)*0.015; pVel[i*3+2]=(Math.random()-0.5)*0.015;
  const c=pal[Math.floor(Math.random()*pal.length)]; pCol[i*3]=c.r; pCol[i*3+1]=c.g; pCol[i*3+2]=c.b;
}
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
const pMat = new THREE.PointsMaterial({ size: 0.5, vertexColors: true, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false });
const particles = new THREE.Points(pGeo, pMat);
scene.add(particles);

// ═══════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════
const state = { phase: 'boot' };
let desktopActive = false;

// ═══════════════════════════════════════════════════
// BOOT SEQUENCE
// ═══════════════════════════════════════════════════


// ═══════════════════════════════════════════════════
// DESKTOP UI
// ═══════════════════════════════════════════════════
const desktop = document.getElementById('desktop');
let win95DesktopReadyFired = false;

// ─── WEB AUDIO ───────────────────────────────────
const audioFx = createWin95Audio();
const getAudioCtx = audioFx.getAudioCtx;
const playClickSound = audioFx.playClickSound;
const playStartupChime = audioFx.playStartupChime;
const playWindowSound = audioFx.playWindowSound;

startBootSequence({
  onStartupChime: playStartupChime,
  onDesktopReady: showWin95Desktop
});

const OS_EVENT_LIMIT = 80;
const osEventLog = [];
let terminalSession = null;
let terminalRuntime = null;
const recentAppIds = [];
const recentEntries = [];
const EXPLORER_MUTATION_LOG_KEY = 'ai98.explorer.mutations.v1';
const aiSystem = createAISystem();
const getClippyAiConfig = (...args) => aiSystem.getClippyAiConfig(...args);
const getLocalAiStatus = (...args) => aiSystem.getLocalAiStatus(...args);
const queryClippyOllama = (...args) => aiSystem.queryClippyOllama(...args);
let notepadSystem = null;
const iconHelper = (typeof window !== 'undefined' && window.Win95Shared) ? window.Win95Shared : null;

function renderUiIcon(target, value, opts = {}) {
  if (!target) return;
  if (iconHelper && typeof iconHelper.renderIcon === 'function') {
    iconHelper.renderIcon(target, value, opts);
    return;
  }
  const raw = String(value || '');
  target.textContent = raw.indexOf('icon:') === 0 ? '' : raw;
}

function readExplorerMutationLog() {
  try {
    const raw = localStorage.getItem(EXPLORER_MUTATION_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function summarizeOsEvent(type, detail = {}) {
  const title = detail.title || detail.appId || 'system';
  switch (type) {
    case 'desktop_ready': return 'Desktop initialized.';
    case 'window_open': return title + ' opened.';
    case 'window_focus': return title + ' focused.';
    case 'window_minimize': return title + ' minimized.';
    case 'window_restore': return title + ' restored.';
    case 'window_close': return title + ' closed.';
    case 'window_maximize': return title + ' maximized.';
    case 'window_unmaximize': return title + ' restored from maximize.';
    case 'window_snap': return title + ' snapped ' + (detail.target || 'into place') + '.';
    case 'app_launch': return title + ' launched from ' + (detail.source || 'desktop') + '.';
    default: return type + '.';
  }
}

function dispatchOsEvent(type, detail = {}) {
  const event = {
    type,
    detail,
    timestamp: new Date().toISOString(),
    message: summarizeOsEvent(type, detail)
  };
  osEventLog.push(event);
  if (osEventLog.length > OS_EVENT_LIMIT) osEventLog.shift();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('win95-os-event', { detail: event }));
  }
  return event;
}

function getOpenWindowSummary() {
  if (!window.wm || !window.wm.windows) return [];
  return Array.from(window.wm.windows.entries()).map(([appId, entry]) => ({
    appId,
    title: entry.title,
    minimized: !!entry.minimized,
    focused: !!(entry.el && entry.el.classList.contains('focused'))
  }));
}

function resolveAppAlias(rawValue) {
  const alias = String(rawValue || '').trim().toLowerCase();
  const aliasMap = {
    presentation: 'pres',
    slides: 'pres',
    pres: 'pres',
    paper: 'paper',
    research: 'paper',
    explorer: 'explorer',
    files: 'explorer',
    terminal: 'terminal',
    cmd: 'terminal',
    console: 'terminal',
    notes: 'notepad',
    note: 'notepad',
    notepad: 'notepad',
    steam: 'steam',
    games: 'steam',
    recycle: 'recycle',
    trash: 'recycle',
    defrag: 'defrag',
    scandisk: 'scandisk',
    scan: 'scandisk',
    cleanup: 'cleanup',
    diskcleanup: 'cleanup',
    paint: 'paint',
    ie: 'ie',
    browser: 'ie',
    messenger: 'msn',
    msn: 'msn',
    system: 'sysprops',
    settings: 'sysprops',
    props: 'sysprops',
    winamp: 'winamp',
    music: 'winamp'
  };
  if (aliasMap[alias]) return aliasMap[alias];
  return alias;
}

function launchAppByAlias(rawValue, source = 'desktop') {
  const appId = resolveAppAlias(rawValue);
  const app = typeof APP_CONFIG !== 'undefined' ? APP_CONFIG[appId] : null;
  if (!app) return null;
  recordRecentApp(appId);
  dispatchOsEvent('app_launch', { appId, title: app.title || appId, source });
  app.open();
  return appId;
}
window.launchAppByAlias = launchAppByAlias;

function recordRecentApp(appId) {
  if (!appId) return;
  const existingIndex = recentAppIds.indexOf(appId);
  if (existingIndex !== -1) recentAppIds.splice(existingIndex, 1);
  recentAppIds.unshift(appId);
  if (recentAppIds.length > 6) recentAppIds.length = 6;
  const app = typeof APP_CONFIG !== 'undefined' ? APP_CONFIG[appId] : null;
  if (app) {
    const dedupe = recentEntries.findIndex((entry) => entry.type === 'app' && entry.id === appId);
    if (dedupe !== -1) recentEntries.splice(dedupe, 1);
    recentEntries.unshift({ type: 'app', id: appId, label: app.title || appId, icon: app.icon || 'icon:apps' });
    if (recentEntries.length > 12) recentEntries.length = 12;
  }
  refreshStartMenuRecentItems();
}

function recordRecentFile(file) {
  if (!file || !file.name) return;
  const fullPath = Array.isArray(file.fullPath) ? file.fullPath.join('\\') : String(file.name);
  const dedupe = recentEntries.findIndex((entry) => entry.type === 'file' && entry.pathKey === fullPath);
  if (dedupe !== -1) recentEntries.splice(dedupe, 1);
  recentEntries.unshift({
    type: 'file',
    pathKey: fullPath,
    file: {
      name: file.name,
      url: file.url || '',
      content: file.content || '',
      icon: file.icon || ''
    }
  });
  if (recentEntries.length > 12) recentEntries.length = 12;
  refreshStartMenuRecentItems();
}

function refreshStartMenuRecentItems() {
  return;
}

window.Win95OS = {
  dispatchOsEvent,
  getRecentEvents(limit = 12) {
    return osEventLog.slice(-Math.max(1, limit));
  },
  getOpenWindowSummary,
  getLocalAiStatus() {
    return getLocalAiStatus();
  },
  getSystemHealth() {
    return systemHealth ? systemHealth.getState() : null;
  },
  launchApp(appId, source) {
    return launchAppByAlias(appId, source);
  }
};

function createSystemHealthModel() {
  const STORAGE_KEY = 'win95-system-health-v1';
  const DEFAULT_STATE = {
    fragmentation: 72,
    errors: 5,
    junk: 61,
    lastDefragAt: 0,
    lastScanAt: 0,
    lastCleanupAt: 0
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, Number(value) || 0));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return Object.assign({}, DEFAULT_STATE);
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return Object.assign({}, DEFAULT_STATE);
      return {
        fragmentation: clamp(parsed.fragmentation, 0, 100),
        errors: clamp(parsed.errors, 0, 100),
        junk: clamp(parsed.junk, 0, 100),
        lastDefragAt: Number(parsed.lastDefragAt) || 0,
        lastScanAt: Number(parsed.lastScanAt) || 0,
        lastCleanupAt: Number(parsed.lastCleanupAt) || 0
      };
    } catch (e) {
      return Object.assign({}, DEFAULT_STATE);
    }
  }

  let state = loadState();

  function calcScore(nextState) {
    const weighted = (100 - nextState.fragmentation) * 0.45 + (100 - nextState.junk) * 0.25 + (100 - Math.min(nextState.errors * 10, 100)) * 0.3;
    return Math.max(0, Math.min(100, Math.round(weighted)));
  }

  function emitUpdate(source) {
    const detail = { source: source || 'system-health', state: getState() };
    window.dispatchEvent(new CustomEvent('win95-system-health', { detail }));
    dispatchOsEvent('system_health_update', detail);
  }

  function persist(source) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
    emitUpdate(source);
  }

  function getState() {
    return Object.assign({}, state, { score: calcScore(state) });
  }

  function update(patch = {}, source = 'system-health') {
    state = {
      fragmentation: clamp(Object.prototype.hasOwnProperty.call(patch, 'fragmentation') ? patch.fragmentation : state.fragmentation, 0, 100),
      errors: clamp(Object.prototype.hasOwnProperty.call(patch, 'errors') ? patch.errors : state.errors, 0, 100),
      junk: clamp(Object.prototype.hasOwnProperty.call(patch, 'junk') ? patch.junk : state.junk, 0, 100),
      lastDefragAt: Object.prototype.hasOwnProperty.call(patch, 'lastDefragAt') ? (Number(patch.lastDefragAt) || 0) : state.lastDefragAt,
      lastScanAt: Object.prototype.hasOwnProperty.call(patch, 'lastScanAt') ? (Number(patch.lastScanAt) || 0) : state.lastScanAt,
      lastCleanupAt: Object.prototype.hasOwnProperty.call(patch, 'lastCleanupAt') ? (Number(patch.lastCleanupAt) || 0) : state.lastCleanupAt
    };
    persist(source);
    return getState();
  }

  function applyDefrag(progressPct) {
    const pct = clamp(progressPct, 0, 100);
    const start = state.fragmentation;
    const minTarget = Math.max(4, Math.round(start * 0.15));
    const nextFragmentation = Math.round(start - ((start - minTarget) * (pct / 100)));
    return update({
      fragmentation: nextFragmentation,
      lastDefragAt: pct >= 100 ? Date.now() : state.lastDefragAt
    }, 'defrag');
  }

  function runScan() {
    const repaired = Math.max(1, Math.round((state.errors || 0) * 0.7));
    return update({
      errors: Math.max(0, state.errors - repaired),
      lastScanAt: Date.now()
    }, 'scandisk');
  }

  function runCleanup() {
    const removed = Math.max(8, Math.round((state.junk || 0) * 0.45));
    return update({
      junk: Math.max(0, state.junk - removed),
      lastCleanupAt: Date.now()
    }, 'disk-cleanup');
  }

  // Emit once so listeners have initial state.
  emitUpdate('init');

  return {
    getState,
    update,
    applyDefrag,
    runScan,
    runCleanup
  };
}

const systemHealth = createSystemHealthModel();
window.__WIN95_SYSTEM_HEALTH = systemHealth;

// (Old showBios removed — replaced by Award BIOS boot in startBoot)

// ─── WIN95 DESKTOP ────────────────────────────────
const startMenu = createStartMenuController({
  launchAppByAlias,
  openNotepadDocument,
  getRecentAppIds: () => recentAppIds,
  getRecentEntries: () => recentEntries,
  openFileInWindow: (file) => openFileInWindow(file),
  getAppConfig: () => (typeof APP_CONFIG !== 'undefined' ? APP_CONFIG : {})
});

function showWin95Desktop() {
  desktopActive = true;
  state.phase = 'desktop';
  desktop.classList.add('visible');
  startMenu.buildStartMenu();

  // Start button click
  document.getElementById('startBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    playClickSound();
    const menu = document.getElementById('startMenu');
    if (menu) {
      menu.classList.toggle('visible');
      if (menu.classList.contains('visible')) {
        startMenu.closeOpenSubmenus(menu);
        const firstItem = startMenu.getVisibleItems()[0] || null;
        if (firstItem) {
          startMenu.setActiveItem(firstItem);
          firstItem.click();
        }
      } else {
        startMenu.setActiveItem(null);
      }
    }
  });

  // Close start menu when clicking elsewhere
  document.getElementById('desktop').addEventListener('click', (e) => {
    if (!e.target.closest('#startBtn') && !e.target.closest('#startMenu')) {
      const menu = document.getElementById('startMenu');
      if (menu) startMenu.closeStartMenu();
    }
  });

  document.addEventListener('keydown', startMenu.handleKeydown);

  if (wm && wm.pillsContainer) {
    wm.pillsContainer.addEventListener('wheel', (event) => {
      if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
        wm.pillsContainer.scrollLeft += event.deltaY;
      } else {
        wm.pillsContainer.scrollLeft += event.deltaX;
      }
      event.preventDefault();
    }, { passive: false });
  }

  updateClock();
  setInterval(updateClock, 1000);

  // Initialize BonziBuddy desktop companion (Phase 16)
  if (window.BonziBuddy && window.BonziBuddy.init) {
    window.BonziBuddy.init();
  }

  // Initialize screensaver (Phase 17)
  if (window.Win95Extras && window.Win95Extras.initScreensaver) {
    window.Win95Extras.initScreensaver();
  }

  if (!win95DesktopReadyFired && typeof window !== 'undefined') {
    win95DesktopReadyFired = true;
    const readyEvent = typeof CustomEvent === 'function'
      ? new CustomEvent('win95-desktop-ready')
      : new Event('win95-desktop-ready');
    window.dispatchEvent(readyEvent);
  }
  dispatchOsEvent('desktop_ready', { title: 'AI 98 OS Desktop' });
}

function updateClock() {
  const clock = document.getElementById('taskbarClock');
  if (!clock) return;
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const mm = minutes < 10 ? '0' + minutes : minutes;
  clock.textContent = hours + ':' + mm + ' ' + ampm;
}

const wm = createWindowManager({
  desktopEl: desktop,
  playWindowSound,
  dispatchOsEvent,
  onTerminalClosed: () => {
    terminalSession = null;
  }
});
window.__wm = wm;
window.wm = wm; // expose to extras.js
window._win95AudioCtx = getAudioCtx;
window._win95AnimateOpen = animateWindowOpen;

// ─── GSAP WINDOW ANIMATIONS ──────────────────────
function animateWindowOpen(appId, el) {
  if (!el || typeof gsap === 'undefined') return;

  // Win98-style: short, subtle open motion.
  gsap.killTweensOf(el);
  gsap.fromTo(el,
    { opacity: 0, y: 6, scale: 0.985, transformOrigin: 'center top' },
    { opacity: 1, y: 0, scale: 1, duration: 0.12, ease: 'power1.out' }
  );
  return;

  switch (appId) {
    case 'paper': {
      // Pixel scatter dissolve — child elements fly in from random positions
      const children = el.querySelectorAll('.paper-section, .paper-abstract, .timeline-item');
      if (children.length > 0) {
        gsap.set(el, { opacity: 0 });
        gsap.to(el, { opacity: 1, duration: 0.05 });
        children.forEach(child => {
          gsap.fromTo(child,
            { x: (Math.random() - 0.5) * 200, y: (Math.random() - 0.5) * 200, opacity: 0, scale: 0.3 },
            { x: 0, y: 0, opacity: 1, scale: 1, duration: 0.5 + Math.random() * 0.3,
              ease: 'power3.out', delay: Math.random() * 0.2 }
          );
        });
      } else {
        // Fallback: elastic bounce
        gsap.fromTo(el,
          { scale: 0.3, opacity: 0, transformOrigin: 'center center' },
          { scale: 1, opacity: 1, duration: 0.6, ease: 'elastic.out(1.2, 0.5)' }
        );
      }
      break;
    }

    case 'pres': {
      // 3D flip on Y axis
      el.style.perspective = '1200px';
      gsap.fromTo(el,
        { rotationY: -90, opacity: 0, transformOrigin: 'left center' },
        { rotationY: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }
      );
      break;
    }

    case 'exp': {
      // Glitch effect — chromatic shift flicker
      const tl = gsap.timeline();
      gsap.set(el, { opacity: 1, x: 0 });
      tl.to(el, { x: -6, duration: 0.04, repeat: 4, yoyo: true, ease: 'none' });
      tl.fromTo(el,
        { filter: 'hue-rotate(0deg)' },
        { filter: 'hue-rotate(360deg)', duration: 0.3, ease: 'none' }
      );
      tl.to(el, { filter: 'none', x: 0 });
      gsap.fromTo(el,
        { scaleX: 1.04, scaleY: 0.96 },
        { scaleX: 1, scaleY: 1, duration: 0.3, ease: 'elastic.out(1, 0.5)' }
      );
      break;
    }

    case 'terminal': {
      // Matrix rain burst
      gsap.set(el, { opacity: 0, scale: 0.95 });
      const chars = 'ABCDEF0123456789';
      const numRains = 10;
      for (let c = 0; c < numRains; c++) {
        const span = document.createElement('span');
        span.style.cssText = 'position:absolute;top:0;left:' + (c * 12) + 'px;color:#33ff33;font-family:"Space Mono",monospace;font-size:12px;pointer-events:none;z-index:1000;';
        let txt = '';
        for (let k = 0; k < 10; k++) txt += chars[Math.floor(Math.random() * chars.length)];
        span.textContent = txt;
        el.appendChild(span);
        const h = el.clientHeight || 300;
        gsap.fromTo(span,
          { y: -20, opacity: 1 },
          { y: h, opacity: 0, duration: 0.4 + Math.random() * 0.3, ease: 'none',
            onComplete: () => { if (span.parentNode) span.remove(); } }
        );
      }
      setTimeout(() => {
        gsap.to(el, { opacity: 1, scale: 1, duration: 0.2, ease: 'power2.out' });
      }, 300);
      break;
    }

    case 'explorer': {
      // Elastic bounce from center
      gsap.fromTo(el,
        { scale: 0.3, opacity: 0, transformOrigin: 'center center' },
        { scale: 1, opacity: 1, duration: 0.6, ease: 'elastic.out(1.2, 0.5)' }
      );
      break;
    }

    case 'notepad': {
      // Typewriter reveal — fade in window then type out textarea content
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.1 });
      const ta = el.querySelector('textarea');
      if (ta) {
        const fullText = ta.value;
        ta.value = '';
        ta.dispatchEvent(new Event('input'));
        let idx = 0;
        const batchSize = Math.ceil(fullText.length / 75); // ~1.5s max
        const typeInterval = setInterval(() => {
          idx = Math.min(idx + Math.max(1, batchSize), fullText.length);
          ta.value = fullText.slice(0, idx);
          ta.dispatchEvent(new Event('input'));
          if (idx >= fullText.length) clearInterval(typeInterval);
        }, 20);
      }
      break;
    }

    case 'recycle': {
      // Items fall in from top
      gsap.set(el, { opacity: 1 });
      const contentArea = el.querySelector('.win95-content') || el;
      const kids = contentArea.querySelectorAll('div > div, li');
      if (kids.length > 0) {
        gsap.fromTo(kids,
          { y: -60, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, stagger: 0.12, ease: 'bounce.out' }
        );
      } else {
        gsap.fromTo(el, { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 });
      }
      break;
    }

    default: {
      // Default: elastic bounce
      gsap.fromTo(el,
        { scale: 0.3, opacity: 0, transformOrigin: 'center center' },
        { scale: 1, opacity: 1, duration: 0.6, ease: 'elastic.out(1.2, 0.5)' }
      );
    }
  }
}

// ─── TERMINAL COMMAND PARSER ─────────────────────
// Terminal runtime moved to ./modules/terminal-runtime.js

window.__animateWindowOpen = animateWindowOpen;

// ─── APP CONFIG ──────────────────────────────────
// ─── PRESENTATION SCROLL ANIMATIONS ─────────────────
// Presentation slide animation moved to ./modules/presentation-animations.js

function setWindowTitle(appId, title, icon) {
  const entry = wm.windows.get(appId);
  if (!entry) return;
  const winEl = entry.el;
  const titlebarText = winEl.querySelector('.win95-titlebar-text');
  if (titlebarText) titlebarText.textContent = title;
  const sb = winEl.querySelector('.win95-statusbar span');
  if (sb) sb.textContent = title;
  const pill = document.getElementById('pill-' + appId);
  if (pill) {
    const shortTitle = title.length > 15 ? title.slice(0, 15) : title;
    const iconNode = pill.querySelector('.taskbar-pill-icon');
    const titleNode = pill.querySelector('.taskbar-pill-title');
    if (iconNode) renderUiIcon(iconNode, icon || entry.icon || '', { alt: title });
    if (titleNode) titleNode.textContent = shortTitle;
    pill.title = title;
  }
}

function openNotepadDocument(doc = {}) {
  if (!notepadSystem) return;
  notepadSystem.openNotepadDocument(doc);
}

function openFileInWindow(file) {
  if (!notepadSystem) return;
  recordRecentFile(file);
  notepadSystem.openFileInWindow(file);
}

window.NotepadApp = { openDocument: openNotepadDocument };
window.FileHandlers = { openFile: openFileInWindow };

const mediaWindows = createMediaWindows({ wm, researchPaperPdf: encodeURI('./assets/docs/research-paper.pdf') });
notepadSystem = createNotepadSystem({
  wm,
  animateWindowOpen,
  mediaWindows,
  getClippyAiConfig,
  queryClippyOllama,
  setWindowTitle,
  getAppConfig: () => APP_CONFIG
});
const DEFAULT_NOTEPAD_TEXT = notepadSystem.DEFAULT_NOTEPAD_TEXT;


const APP_CONFIG = {
  paper: {
    title: 'Research Paper.pdf',
    icon: 'icon:paper',
    width: 900,
    height: 640,
    open() {
      const winEl = mediaWindows.openPdfWindow('paper', this.title, mediaWindows.researchPaperPdf, {
        width: this.width,
        height: this.height
      });
      animateWindowOpen('paper', winEl);
    }
  },
  pres: {
    title: 'Presentation.exe',
    icon: 'icon:presentation',
    width: 900,
    height: 640,
    open() {
      // Launch fullscreen presentation mode with GSAP animations
      if (window.PresentationMode && typeof window.PresentationMode.launch === 'function') {
        window.PresentationMode.launch();
      } else {
        // Fallback: open as window if fullscreen mode not available
        const panel = document.getElementById('panelPres');
        const winEl = wm.createWindow('pres', this.title, this.icon, panel, { width: 900, height: 640 });
        if (panel) panel.classList.add('open');
        animateWindowOpen('pres', winEl);
        setTimeout(() => animatePresSlides(panel), 400);
      }
    }
  },
  exp: {
    title: 'Experience.exe',
    icon: 'icon:apps',
    width: 900,
    height: 640,
    open() {
      animateCounters();
      const panel = document.getElementById('panelExp');
      const winEl = wm.createWindow('exp', this.title, this.icon, panel, { width: 900, height: 640 });
      if (panel) panel.classList.add('open');
      animateWindowOpen('exp', winEl);
    }
  },
  explorer: {
    title: 'File Explorer',
    icon: 'icon:explorer',
    width: 1100,
    height: 680,
    open() {
      if (window.ExplorerApp) {
        const explorerOpts = window.__WIN95_EXPLORER_OPEN_OPTS || null;
        window.__WIN95_EXPLORER_OPEN_OPTS = null;
        window.ExplorerApp.launch(wm, animateWindowOpen, explorerOpts);
      } else {
        // Fallback if explorer.js hasn't loaded
        const div = document.createElement('div');
        div.textContent = 'File Explorer loading...';
        wm.createWindow('explorer', this.title, this.icon, div, { width: 1100, height: 680 });
      }
    }
  },
  steam: {
    title: 'Steam95',
    icon: 'icon:steam',
    width: 820,
    height: 560,
    open() {
      if (window.SteamApp) {
        window.SteamApp.launch(wm, animateWindowOpen);
      } else {
        const div = document.createElement('div');
        div.textContent = 'Steam95 loading...';
        wm.createWindow('steam', this.title, this.icon, div, { width: 820, height: 560 });
      }
    }
  },
  terminal: {
    title: 'Terminal.exe',
    icon: 'icon:terminal',
    width: 560,
    height: 400,
    open() {
      if (terminalSession && wm.windows.has('terminal')) {
        wm.restoreWindow('terminal');
        wm.focusWindow('terminal');
        if (terminalSession.input) setTimeout(() => terminalSession.input.focus(), 50);
        return;
      }

      const wrap = document.createElement('div');
      wrap.className = 'terminal-shell';

      const matrixLayer = document.createElement('div');
      matrixLayer.className = 'terminal-matrix-layer';
      wrap.appendChild(matrixLayer);

      const matrixVeil = document.createElement('div');
      matrixVeil.className = 'terminal-matrix-veil';
      matrixVeil.style.display = 'none';
      wrap.appendChild(matrixVeil);

      const statusbar = document.createElement('div');
      statusbar.className = 'terminal-statusbar';
      const statusLeft = document.createElement('strong');
      statusLeft.textContent = 'AI 98 Shell';
      const statusWindows = document.createElement('span');
      const statusFocus = document.createElement('span');
      statusbar.appendChild(statusLeft);
      statusbar.appendChild(statusWindows);
      statusbar.appendChild(statusFocus);
      statusbar.addEventListener('mousedown', (e) => e.stopPropagation());
      statusbar.addEventListener('click', (e) => e.stopPropagation());
      wrap.appendChild(statusbar);

      const output = document.createElement('div');
      output.id = 'termOutput';
      output.className = 'terminal-output';
      output.__matrixLayer = matrixLayer;
      output.__matrixVeil = matrixVeil;
      wrap.appendChild(output);

      const buffer = document.createElement('div');
      buffer.className = 'terminal-buffer';
      output.appendChild(buffer);

      const inputRow = document.createElement('div');
      inputRow.className = 'terminal-input-row';
      output.appendChild(inputRow);

      const prompt = document.createElement('span');
      prompt.className = 'terminal-prompt';

      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'termInput';
      input.className = 'terminal-input';
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('spellcheck', 'false');

      inputRow.appendChild(prompt);
      inputRow.appendChild(input);
      const session = {
        output,
        buffer,
        input,
        promptEl: prompt,
        inputRow,
        statusWindows,
        statusFocus,
        currentPath: terminalRuntime.TERMINAL_ROOT,
        userName: 'STUDENT1',
        workspacePath: '',
        adminUnlocked: false,
        auditLog: [],
        showOsEvents: false,
        historyIndex: terminalRuntime.getHistory().length,
        osListener: null
      };
      if (terminalRuntime && typeof terminalRuntime.initializeSessionWorkspace === 'function') {
        terminalRuntime.initializeSessionWorkspace(session, session.userName);
      }
      terminalSession = session;
      terminalRuntime.updatePrompt(session);

      terminalRuntime.appendBlock(session, [
        'From Pixels to Intelligence OS [Version 2.026.04]',
        '(C) 2026 Josue Aparcedo Gonzalez. All Rights Reserved.',
        '',
        'Workspace: ' + (session.workspacePath || session.currentPath),
        'Type "help" for classroom commands.',
        'Type "--help" for advanced OS commands.',
        ''
      ].join('\n'));
      terminalRuntime.updateStatus(session);
      terminalRuntime.attachOsMonitor(session);

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const cmd = input.value.trim();
          input.value = '';
          terminalRuntime.runCommand(cmd, session);
          terminalRuntime.scrollToBottom(session);
        } else if (e.key === 'Tab') {
          e.preventDefault();
          const matches = terminalRuntime.getCompletionCandidates(session, input.value);
          if (matches.length === 1) {
            const trimmed = input.value.trimStart();
            const parts = trimmed.split(/\s+/);
            if (parts.length <= 1 && !/\s/.test(trimmed.slice(-1))) {
              input.value = matches[0] + ' ';
            } else {
              const command = (parts.shift() || '').toLowerCase();
              input.value = command + ' ' + matches[0];
            }
          } else if (matches.length > 1) {
            const commonPrefix = matches.reduce((prefix, current) => {
              let idx = 0;
              const base = String(prefix || '');
              const compare = String(current || '');
              while (idx < base.length && idx < compare.length && base[idx].toLowerCase() === compare[idx].toLowerCase()) idx++;
              return base.slice(0, idx);
            }, matches[0] || '');
            const trimmed = input.value.trimStart();
            const parts = trimmed.split(/\s+/);
            if (commonPrefix) {
              if (parts.length <= 1 && !/\s/.test(trimmed.slice(-1))) {
                input.value = commonPrefix;
              } else {
                const command = (parts.shift() || '').toLowerCase();
                input.value = command + ' ' + commonPrefix;
              }
            }
            if (matches.length <= 12) {
              terminalRuntime.appendBlock(session, ['Possible matches:'].concat(matches.map((item) => '  ' + item)).join('\n'));
            }
          }
        } else if (e.key === 'ArrowUp') {
          const history = terminalRuntime.getHistory();
          if (!history.length) return;
          e.preventDefault();
          session.historyIndex = Math.max(0, (session.historyIndex == null ? history.length : session.historyIndex) - 1);
          input.value = history[session.historyIndex] || '';
          setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
        } else if (e.key === 'ArrowDown') {
          const history = terminalRuntime.getHistory();
          if (!history.length) return;
          e.preventDefault();
          session.historyIndex = Math.min(history.length, (session.historyIndex == null ? history.length : session.historyIndex) + 1);
          input.value = session.historyIndex >= history.length ? '' : (history[session.historyIndex] || '');
          setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
        }
      });

      // Focus input when window is clicked
      wrap.addEventListener('click', () => input.focus());
      output.addEventListener('click', () => input.focus());

      const winEl = wm.createWindow('terminal', this.title, this.icon, wrap, { width: 560, height: 400 });
      animateWindowOpen('terminal', winEl);
      // Auto-focus after window creation
      setTimeout(() => input.focus(), 100);
    }
  },
  notepad: {
    title: 'Notepad.exe',
    icon: 'icon:notepad',
    width: 520,
    height: 440,
    open() {
      openNotepadDocument({
        content: DEFAULT_NOTEPAD_TEXT
      });
    }
  },
  recycle: {
    title: 'Recycle Bin',
    icon: 'icon:recycle',
    width: 480,
    height: 400,
    _hasItems: true,
    open() {
      try {
      const self = this;
      const div = document.createElement('div');
      div.style.cssText = 'background:#fff;padding:12px;font-family:var(--font-pixel);font-size:8px;color:#000;height:100%;overflow-y:auto;';

      const toolbar = document.createElement('div');
      toolbar.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;';
      const heading = document.createElement('p');
      heading.style.fontSize = '9px';
      heading.textContent = 'Deleted Items (5 items) - Revision History';
      const emptyBtn = document.createElement('button');
      emptyBtn.textContent = 'Empty Recycle Bin';
      emptyBtn.style.cssText = 'font-family:var(--font-pixel);font-size:7px;padding:3px 8px;cursor:pointer;border:2px outset #c0c0c0;background:#c0c0c0;';
      toolbar.appendChild(heading);
      toolbar.appendChild(emptyBtn);
      div.appendChild(toolbar);

      const items = [
        { name: 'Draft_v1_too_boring.docx', date: '2026-02-14', reason: 'First draft was a generic summary of AI. No thesis, no argument, no personal stake.' },
        { name: 'Proposal_with_fake_sources.docx', date: '2026-02-28', reason: 'Used sources I hadn\'t actually read. Professor caught it. Lesson: cite what you know.' },
        { name: 'Essay_about_ChatGPT_only.docx', date: '2026-03-01', reason: 'Focused only on ChatGPT instead of the hardware layer. Missed the real story.' },
        { name: 'Draft_v3_no_personal_voice.docx', date: '2026-03-10', reason: 'Technically solid but read like a Wikipedia article. Added homelab experience to fix this.' },
        { name: 'Website_v1_basic_slideshow.html', date: '2026-03-18', reason: 'Original website was just a slideshow. Rebuilt as Win95 desktop to match the thesis.' },
      ];

      const itemContainer = document.createElement('div');
      itemContainer.id = 'recycleItems';
      items.forEach(item => {
        const row = document.createElement('div');
        row.style.cssText = 'padding:6px 4px;border-bottom:1px solid #ccc;';

        const topRow = document.createElement('div');
        topRow.style.cssText = 'display:flex;gap:8px;align-items:center;';
        const ico = document.createElement('span');
        ico.textContent = '\uD83D\uDCC4';
        const nameEl = document.createElement('span');
        nameEl.textContent = item.name;
        nameEl.style.flex = '1';
        const dateEl = document.createElement('span');
        dateEl.textContent = item.date;
        dateEl.style.color = '#808080';
        topRow.appendChild(ico);
        topRow.appendChild(nameEl);
        topRow.appendChild(dateEl);

        const reasonEl = document.createElement('p');
        reasonEl.textContent = 'Why deleted: ' + item.reason;
        reasonEl.style.cssText = 'margin-top:4px;color:#666;font-size:7px;font-style:italic;';

        row.appendChild(topRow);
        row.appendChild(reasonEl);
        itemContainer.appendChild(row);
      });
      div.appendChild(itemContainer);

      const note = document.createElement('p');
      note.textContent = 'Every deleted draft taught something. The final paper exists because these versions failed.';
      note.style.cssText = 'margin-top:12px;color:#808080;font-size:7px;';
      div.appendChild(note);

      // Empty Recycle Bin button
      emptyBtn.addEventListener('click', () => {
        if (!self._hasItems) return;
        itemContainer.textContent = '';
        heading.textContent = 'Deleted Items (0 items)';
        note.textContent = 'The Recycle Bin is empty.';
        self._hasItems = false;
        // Update desktop icon to empty
        const iconEl = document.querySelector('.desktop-icon[data-app="recycle"] .icon-emoji');
        if (iconEl) renderUiIcon(iconEl, 'icon:recycle', { alt: 'Recycle Bin' });
      });

      const recycleWinEl = wm.createWindow('recycle', this.title, this.icon, div, { width: 480, height: 400 });
      animateWindowOpen('recycle', recycleWinEl);
      } catch(e) { console.warn('Recycle Bin open error:', e); }
    }
  },
  defrag: {
    title: 'Disk Defragmenter',
    icon: 'icon:defrag',
    width: 560,
    height: 420,
    open() {
      try {
      const div = document.createElement('div');
      div.style.cssText = 'background:#c0c0c0;height:100%;display:flex;flex-direction:column;padding:8px;font-family:var(--font-pixel);font-size:8px;color:#000;';

      const header = document.createElement('div');
      header.style.cssText = 'margin-bottom:8px;';
      const titleEl = document.createElement('p');
      titleEl.textContent = 'Microslop Disk Defragmenter - Drive C: [Research Topics]';
      titleEl.style.fontWeight = 'bold';
      header.appendChild(titleEl);
      div.appendChild(header);

      // Grid of colored blocks
      const gridWrap = document.createElement('div');
      gridWrap.style.cssText = 'flex:1;background:#000;border:2px inset #808080;padding:4px;overflow:hidden;display:flex;flex-wrap:wrap;align-content:flex-start;gap:1px;';

      const topics = [
        { color: '#ff4444', label: 'GPU History' },
        { color: '#44ff44', label: 'Software' },
        { color: '#4488ff', label: 'Economics' },
        { color: '#ffaa00', label: 'Psychology' },
        { color: '#ff44ff', label: 'Politics' },
        { color: '#44ffff', label: 'Ethics' },
        { color: '#ffff44', label: 'Hardware' },
        { color: '#ffffff', label: 'Free Space' },
      ];

      const TOTAL_BLOCKS = 200;
      const blocks = [];
      for (let i = 0; i < TOTAL_BLOCKS; i++) {
        const block = document.createElement('div');
        const topicIdx = i < TOTAL_BLOCKS - 30 ? Math.floor(Math.random() * (topics.length - 1)) : topics.length - 1;
        block.style.cssText = 'width:10px;height:10px;background:' + topics[topicIdx].color + ';';
        block.dataset.topic = String(topicIdx);
        gridWrap.appendChild(block);
        blocks.push(block);
      }
      div.appendChild(gridWrap);

      // Legend
      const legend = document.createElement('div');
      legend.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin:6px 0;';
      topics.forEach(function(t) {
        const item = document.createElement('span');
        item.style.cssText = 'display:flex;align-items:center;gap:3px;';
        const swatch = document.createElement('span');
        swatch.style.cssText = 'display:inline-block;width:8px;height:8px;background:' + t.color + ';border:1px solid #000;';
        const lbl = document.createElement('span');
        lbl.textContent = t.label;
        item.appendChild(swatch);
        item.appendChild(lbl);
        legend.appendChild(item);
      });
      div.appendChild(legend);

      // Progress bar area
      const progWrap = document.createElement('div');
      progWrap.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:4px;';
      const progBarOuter = document.createElement('div');
      progBarOuter.style.cssText = 'flex:1;height:16px;border:2px inset #808080;background:#fff;';
      const progBar = document.createElement('div');
      progBar.style.cssText = 'height:100%;width:0%;background:#000080;transition:width 0.3s;';
      progBarOuter.appendChild(progBar);
      const progText = document.createElement('span');
      progText.textContent = '0% Complete';
      progText.style.whiteSpace = 'nowrap';
      progWrap.appendChild(progBarOuter);
      progWrap.appendChild(progText);
      div.appendChild(progWrap);

      const statusText = document.createElement('div');
      statusText.style.cssText = 'margin-top:4px;color:#111;min-height:12px;';
      statusText.textContent = 'Status: Ready to analyze drive C:.';
      div.appendChild(statusText);

      // Buttons
      const btnRow = document.createElement('div');
      btnRow.style.cssText = 'display:flex;gap:8px;margin-top:6px;justify-content:center;';
      const startDefragBtn = document.createElement('button');
      startDefragBtn.textContent = 'Start';
      startDefragBtn.style.cssText = 'font-family:var(--font-pixel);font-size:7px;padding:3px 16px;cursor:pointer;border:2px outset #c0c0c0;background:#c0c0c0;';
      const pauseBtn = document.createElement('button');
      pauseBtn.textContent = 'Pause';
      pauseBtn.style.cssText = 'font-family:var(--font-pixel);font-size:7px;padding:3px 16px;cursor:pointer;border:2px outset #c0c0c0;background:#c0c0c0;';
      pauseBtn.disabled = true;
      const stopBtn = document.createElement('button');
      stopBtn.textContent = 'Stop';
      stopBtn.style.cssText = 'font-family:var(--font-pixel);font-size:7px;padding:3px 16px;cursor:pointer;border:2px outset #c0c0c0;background:#c0c0c0;';
      stopBtn.disabled = true;
      const soundBtn = document.createElement('button');
      soundBtn.textContent = 'Sound: On';
      soundBtn.style.cssText = 'font-family:var(--font-pixel);font-size:7px;padding:3px 10px;cursor:pointer;border:2px outset #c0c0c0;background:#c0c0c0;';
      btnRow.appendChild(startDefragBtn);
      btnRow.appendChild(pauseBtn);
      btnRow.appendChild(stopBtn);
      btnRow.appendChild(soundBtn);
      div.appendChild(btnRow);

      const defragVolume = 90;
      let defragMuted = false;

      let running = false;
      let paused = false;
      let defragInterval = null;
      let step = 0;
      const totalSteps = TOTAL_BLOCKS;
      const initialFragmentation = Math.max(5, (systemHealth.getState() || {}).fragmentation || 72);
      const sortedOrder = blocks.slice().sort((a, b) => parseInt(a.dataset.topic, 10) - parseInt(b.dataset.topic, 10));
      let defragAudio = null;

      function getVolumeScalar() {
        return defragMuted ? 0 : Math.max(0, Math.min(1, defragVolume / 100));
      }

      function syncSoundButton() {
        soundBtn.textContent = defragMuted ? 'Sound: Off' : 'Sound: On';
      }

      function getPhaseName(pct) {
        if (pct < 0.25) return 'scan';
        if (pct < 0.55) return 'relocate';
        if (pct < 0.85) return 'consolidate';
        return 'index';
      }

      function getDefragAudio() {
        if (defragAudio) return defragAudio;
        try {
          const ctx = window._win95AudioCtx ? window._win95AudioCtx() : new (window.AudioContext || window.webkitAudioContext)();
          const master = ctx.createGain();
          master.gain.value = 0.0001;
          master.connect(ctx.destination);

          const humOsc = ctx.createOscillator();
          humOsc.type = 'sawtooth';
          humOsc.frequency.value = 86;
          const humGain = ctx.createGain();
          humGain.gain.value = 0.0001;
          humOsc.connect(humGain);
          humGain.connect(master);
          humOsc.start();

          const spindleOsc = ctx.createOscillator();
          spindleOsc.type = 'triangle';
          spindleOsc.frequency.value = 138;
          const spindleGain = ctx.createGain();
          spindleGain.gain.value = 0.0001;
          spindleOsc.connect(spindleGain);
          spindleGain.connect(master);
          spindleOsc.start();

          const textureOsc = ctx.createOscillator();
          textureOsc.type = 'square';
          textureOsc.frequency.value = 220;
          const textureGain = ctx.createGain();
          textureGain.gain.value = 0.0001;
          textureOsc.connect(textureGain);
          textureGain.connect(master);
          textureOsc.start();

          defragAudio = { ctx, master, humOsc, humGain, spindleOsc, spindleGain, textureOsc, textureGain };
          return defragAudio;
        } catch (e) {
          return null;
        }
      }

      function updateMasterGain(active) {
        const audio = getDefragAudio();
        if (!audio) return;
        const now = audio.ctx.currentTime;
        const scalar = getVolumeScalar();
        const target = active ? (0.012 + (scalar * 0.12)) : 0.0001;
        audio.master.gain.cancelScheduledValues(now);
        audio.master.gain.setValueAtTime(Math.max(0.0001, audio.master.gain.value), now);
        audio.master.gain.exponentialRampToValueAtTime(Math.max(0.0001, target), now + (active ? 0.15 : 0.12));
      }

      function updateDriveEngine(on, pct) {
        const audio = getDefragAudio();
        if (!audio) return;
        const now = audio.ctx.currentTime;
        const phasePct = Math.max(0, Math.min(1, Number(pct) || 0));
        const phase = getPhaseName(phasePct);
        const scalar = getVolumeScalar();

        let humTarget = 0.0001;
        let spindleTarget = 0.0001;
        let textureTarget = 0.0001;

        if (on && scalar > 0) {
          if (phase === 'scan') {
            humTarget = 0.014 + (phasePct * 0.008);
            spindleTarget = 0.005 + (phasePct * 0.005);
            textureTarget = 0.0025 + (phasePct * 0.003);
          } else if (phase === 'relocate') {
            humTarget = 0.018 + (phasePct * 0.012);
            spindleTarget = 0.009 + (phasePct * 0.010);
            textureTarget = 0.004 + (phasePct * 0.005);
          } else if (phase === 'consolidate') {
            humTarget = 0.017 + (phasePct * 0.008);
            spindleTarget = 0.007 + (phasePct * 0.006);
            textureTarget = 0.0035 + (phasePct * 0.004);
          } else {
            humTarget = 0.011 + (phasePct * 0.006);
            spindleTarget = 0.004 + (phasePct * 0.004);
            textureTarget = 0.002 + (phasePct * 0.002);
          }
        }

        audio.humOsc.frequency.setTargetAtTime(74 + (phasePct * 30), now, 0.08);
        audio.spindleOsc.frequency.setTargetAtTime(120 + (phasePct * 90), now, 0.08);
        audio.textureOsc.frequency.setTargetAtTime(220 + (phasePct * 170), now, 0.09);

        audio.humGain.gain.cancelScheduledValues(now);
        audio.spindleGain.gain.cancelScheduledValues(now);
        audio.textureGain.gain.cancelScheduledValues(now);
        audio.humGain.gain.setValueAtTime(Math.max(0.0001, audio.humGain.gain.value), now);
        audio.spindleGain.gain.setValueAtTime(Math.max(0.0001, audio.spindleGain.gain.value), now);
        audio.textureGain.gain.setValueAtTime(Math.max(0.0001, audio.textureGain.gain.value), now);
        audio.humGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, humTarget), now + 0.14);
        audio.spindleGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, spindleTarget), now + 0.14);
        audio.textureGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, textureTarget), now + 0.14);
        updateMasterGain(on && !paused && running);
      }

      function playSeekClick(intensity, pct, pan) {
        if (defragMuted) return;
        const audio = getDefragAudio();
        if (!audio) return;
        const now = audio.ctx.currentTime;
        const amount = Math.max(0.008, Math.min(0.05, (intensity || 0.02) * (0.6 + getVolumeScalar())));
        const osc = audio.ctx.createOscillator();
        const gain = audio.ctx.createGain();
        osc.type = 'triangle';
        const progress = Math.max(0, Math.min(1, Number(pct) || 0));
        const start = 640 + (progress * 1400) + (Math.random() * 460);
        osc.frequency.setValueAtTime(start, now);
        osc.frequency.exponentialRampToValueAtTime(start * 0.58, now + 0.025);
        gain.gain.setValueAtTime(amount, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
        if (typeof audio.ctx.createStereoPanner === 'function') {
          const panner = audio.ctx.createStereoPanner();
          panner.pan.value = Math.max(-1, Math.min(1, Number(pan) || 0));
          osc.connect(gain);
          gain.connect(panner);
          panner.connect(audio.master);
        } else {
          osc.connect(gain);
          gain.connect(audio.master);
        }
        osc.start(now);
        osc.stop(now + 0.032);
      }

      function playDefragChirp(freqA, freqB, durMs, gainAmount) {
        const audio = getDefragAudio();
        if (!audio) return;
        const now = audio.ctx.currentTime;
        const osc = audio.ctx.createOscillator();
        const gain = audio.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freqA, now);
        if (Number.isFinite(freqB)) osc.frequency.exponentialRampToValueAtTime(Math.max(80, freqB), now + durMs / 1000);
        gain.gain.setValueAtTime((gainAmount || 0.03) * Math.max(0.2, getVolumeScalar()), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + durMs / 1000);
        osc.connect(gain);
        gain.connect(audio.master);
        osc.start(now);
        osc.stop(now + durMs / 1000);
      }

      function shutdownDefragAudio() {
        if (!defragAudio) return;
        try { defragAudio.humOsc.stop(); } catch (e) {}
        try { defragAudio.spindleOsc.stop(); } catch (e) {}
        try { defragAudio.textureOsc.stop(); } catch (e) {}
        try { defragAudio.humOsc.disconnect(); } catch (e) {}
        try { defragAudio.spindleOsc.disconnect(); } catch (e) {}
        try { defragAudio.textureOsc.disconnect(); } catch (e) {}
        try { defragAudio.humGain.disconnect(); } catch (e) {}
        try { defragAudio.spindleGain.disconnect(); } catch (e) {}
        try { defragAudio.textureGain.disconnect(); } catch (e) {}
        try { defragAudio.master.disconnect(); } catch (e) {}
        defragAudio = null;
      }

      function updateProgressDisplay() {
        const pct = Math.round((step / totalSteps) * 100);
        progBar.style.width = pct + '%';
        progText.textContent = pct + '% Complete';
        const target = Math.max(4, Math.round(initialFragmentation * 0.15));
        const nextFragmentation = Math.round(initialFragmentation - ((initialFragmentation - target) * (pct / 100)));
        systemHealth.update({ fragmentation: nextFragmentation }, 'defrag-progress');
        updateDriveEngine(running && !paused, step / totalSteps);
      }

      function getPhaseLabel() {
        const pct = step / totalSteps;
        if (pct < 0.25) return 'Scanning fragmented clusters';
        if (pct < 0.55) return 'Relocating file blocks';
        if (pct < 0.85) return 'Consolidating contiguous regions';
        if (pct < 1) return 'Writing final index map';
        return 'Defragmentation complete';
      }

      function finishDefrag() {
        running = false;
        paused = false;
        pauseBtn.textContent = 'Pause';
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
        startDefragBtn.disabled = false;
        progBar.style.width = '100%';
        progText.textContent = '100% Complete';
        statusText.textContent = 'Status: Completed. Drive C: is optimized.';
        systemHealth.applyDefrag(100);
        updateDriveEngine(false, 1);
        playDefragChirp(720, 960, 110, 0.04);
        setTimeout(() => playDefragChirp(960, 1280, 130, 0.035), 120);
        if (window.Win95ExtrasParts && typeof window.Win95ExtrasParts.openTemporaryBsod === 'function') {
          window.Win95ExtrasParts.openTemporaryBsod();
        }
      }

      function runStep() {
        if (!running || paused) return;
        if (step >= totalSteps) {
          if (defragInterval) clearInterval(defragInterval);
          finishDefrag();
          return;
        }

        const target = sortedOrder[step];
        const current = blocks[step];
        if (current && target) {
          const tmpColor = current.style.background;
          const tmpTopic = current.dataset.topic;
          current.style.background = target.style.background;
          current.dataset.topic = target.dataset.topic;
          target.style.background = tmpColor;
          target.dataset.topic = tmpTopic;

          current.style.outline = '1px solid #fff';
          setTimeout(() => { current.style.outline = 'none'; }, 150);
        }

        step++;
        updateProgressDisplay();
        statusText.textContent = 'Status: ' + getPhaseLabel() + '...';
        const pct = step / totalSteps;
        const intensity = 0.025 + (pct * 0.035);
        const pan = (((step % 20) / 19) * 2) - 1;
        playSeekClick(intensity, pct, pan);
        if (step % 4 === 0) {
          playSeekClick(intensity * 0.9, pct, -pan * 0.6);
        }
      }

      function stopDefrag(resetStatus) {
        if (defragInterval) clearInterval(defragInterval);
        running = false;
        paused = false;
        pauseBtn.textContent = 'Pause';
        pauseBtn.disabled = true;
        stopBtn.disabled = true;
        startDefragBtn.disabled = false;
        if (resetStatus) statusText.textContent = 'Status: Stopped at ' + Math.round((step / totalSteps) * 100) + '%.';
        updateDriveEngine(false, step / totalSteps);
        if (resetStatus) playDefragChirp(360, 220, 90, 0.035);
      }

      startDefragBtn.addEventListener('click', () => {
        if (running && paused) {
          paused = false;
          pauseBtn.textContent = 'Pause';
          statusText.textContent = 'Status: ' + getPhaseLabel() + '...';
          return;
        }
        if (running) return;
        if (step >= totalSteps) step = 0;
        updateProgressDisplay();
        running = true;
        paused = false;
        startDefragBtn.disabled = true;
        pauseBtn.disabled = false;
        pauseBtn.textContent = 'Pause';
        stopBtn.disabled = false;
        statusText.textContent = 'Status: ' + getPhaseLabel() + '...';
        getDefragAudio();
        updateDriveEngine(true, step / totalSteps);
        playDefragChirp(420, 560, 80, 0.03);

        defragInterval = setInterval(() => {
          runStep();
        }, 50);
      });

      pauseBtn.addEventListener('click', () => {
        if (!running) return;
        paused = !paused;
        pauseBtn.textContent = paused ? 'Resume' : 'Pause';
        statusText.textContent = paused
          ? 'Status: Paused at ' + Math.round((step / totalSteps) * 100) + '%.'
          : 'Status: ' + getPhaseLabel() + '...';
        updateDriveEngine(!paused, step / totalSteps);
        playDefragChirp(paused ? 280 : 500, paused ? 240 : 620, paused ? 90 : 80, 0.03);
      });


      stopBtn.addEventListener('click', () => {
        stopDefrag(true);
      });
      soundBtn.addEventListener('click', () => {
        defragMuted = !defragMuted;
        syncSoundButton();
        updateDriveEngine(running && !paused, step / totalSteps);
      });
      syncSoundButton();

      const winEl = wm.createWindow('defrag', this.title, this.icon, div, { width: 560, height: 420 });
      const defragEntry = wm.windows.get('defrag');
      if (defragEntry) {
        defragEntry.onClose = () => {
          stopDefrag(false);
          shutdownDefragAudio();
        };
      }
      animateWindowOpen('defrag', winEl);
      } catch(e) { console.warn('Defrag open error:', e); }
    }
  },
  scandisk: {
    title: 'ScanDisk',
    icon: 'icon:defrag',
    open() {
      try {
        const wrap = document.createElement('div');
        wrap.style.cssText = 'background:#c0c0c0;height:100%;display:flex;flex-direction:column;padding:10px;font-family:var(--font-pixel);font-size:8px;color:#000;';

        const title = document.createElement('div');
        title.style.cssText = 'font-weight:bold;margin-bottom:8px;';
        title.textContent = 'ScanDisk - Drive C:';
        wrap.appendChild(title);

        const state = systemHealth.getState();
        const summary = document.createElement('div');
        summary.style.cssText = 'padding:6px;border:2px inset #808080;background:#fff;margin-bottom:8px;line-height:1.6;';
        summary.textContent = 'Current errors: ' + state.errors + ' | Fragmentation: ' + state.fragmentation + '%';
        wrap.appendChild(summary);

        const progressOuter = document.createElement('div');
        progressOuter.style.cssText = 'height:16px;border:2px inset #808080;background:#fff;';
        const progressInner = document.createElement('div');
        progressInner.style.cssText = 'height:100%;width:0%;background:#000080;transition:width .2s;';
        progressOuter.appendChild(progressInner);
        wrap.appendChild(progressOuter);

        const status = document.createElement('div');
        status.style.cssText = 'margin-top:8px;min-height:28px;line-height:1.4;';
        status.textContent = 'Status: Ready to scan.';
        wrap.appendChild(status);

        const row = document.createElement('div');
        row.style.cssText = 'margin-top:8px;display:flex;gap:8px;justify-content:center;';
        const startBtn = document.createElement('button');
        startBtn.textContent = 'Start Scan';
        startBtn.style.cssText = 'font-family:var(--font-pixel);font-size:7px;padding:3px 14px;cursor:pointer;border:2px outset #c0c0c0;background:#c0c0c0;';
        const fixBtn = document.createElement('button');
        fixBtn.textContent = 'Fix Errors';
        fixBtn.style.cssText = 'font-family:var(--font-pixel);font-size:7px;padding:3px 14px;cursor:pointer;border:2px outset #c0c0c0;background:#c0c0c0;';
        fixBtn.disabled = true;
        row.appendChild(startBtn);
        row.appendChild(fixBtn);
        wrap.appendChild(row);

        let interval = null;
        let progress = 0;

        function stopScan() {
          if (interval) clearInterval(interval);
          interval = null;
        }

        startBtn.addEventListener('click', () => {
          if (interval) return;
          progress = 0;
          progressInner.style.width = '0%';
          status.textContent = 'Status: Scanning file allocation table...';
          fixBtn.disabled = true;
          startBtn.disabled = true;

          interval = setInterval(() => {
            progress += 5;
            progressInner.style.width = Math.min(100, progress) + '%';
            if (progress >= 35) status.textContent = 'Status: Checking directory structure...';
            if (progress >= 70) status.textContent = 'Status: Validating index records...';
            if (progress >= 100) {
              stopScan();
              startBtn.disabled = false;
              fixBtn.disabled = false;
              const latest = systemHealth.getState();
              status.textContent = 'Scan complete: ' + latest.errors + ' errors found.';
            }
          }, 120);
        });

        fixBtn.addEventListener('click', () => {
          const before = systemHealth.getState();
          const after = systemHealth.runScan();
          const repaired = Math.max(0, before.errors - after.errors);
          status.textContent = 'ScanDisk repaired ' + repaired + ' file-system errors.';
          fixBtn.disabled = true;
          summary.textContent = 'Current errors: ' + after.errors + ' | Fragmentation: ' + after.fragmentation + '%';
        });

        const winEl = wm.createWindow('scandisk', this.title, this.icon, wrap, { width: 420, height: 300 });
        const entry = wm.windows.get('scandisk');
        if (entry) {
          entry.onClose = () => {
            stopScan();
          };
        }
        animateWindowOpen('scandisk', winEl);
      } catch (e) { console.warn('ScanDisk open error:', e); }
    }
  },
  cleanup: {
    title: 'Disk Cleanup',
    icon: 'icon:settings',
    open() {
      try {
        const wrap = document.createElement('div');
        wrap.style.cssText = 'background:#c0c0c0;height:100%;display:flex;flex-direction:column;padding:10px;font-family:var(--font-pixel);font-size:8px;color:#000;';

        const title = document.createElement('div');
        title.style.cssText = 'font-weight:bold;margin-bottom:8px;';
        title.textContent = 'Disk Cleanup - Drive C:';
        wrap.appendChild(title);

        const state = systemHealth.getState();
        const summary = document.createElement('div');
        summary.style.cssText = 'padding:6px;border:2px inset #808080;background:#fff;margin-bottom:8px;line-height:1.6;';
        summary.textContent = 'Temporary junk: ' + state.junk + '% of fake drive';
        wrap.appendChild(summary);

        const checklist = document.createElement('div');
        checklist.style.cssText = 'border:2px inset #808080;background:#fff;padding:8px;line-height:1.7;min-height:92px;';
        checklist.innerHTML = [
          '<div><input type=\"checkbox\" checked> Temporary Internet Files</div>',
          '<div><input type=\"checkbox\" checked> Downloaded Program Files</div>',
          '<div><input type=\"checkbox\" checked> Recycle Bin</div>',
          '<div><input type=\"checkbox\" checked> Setup Log Files</div>'
        ].join('');
        wrap.appendChild(checklist);

        const status = document.createElement('div');
        status.style.cssText = 'margin-top:8px;min-height:24px;line-height:1.4;';
        status.textContent = 'Status: Select files to remove.';
        wrap.appendChild(status);

        const row = document.createElement('div');
        row.style.cssText = 'margin-top:8px;display:flex;gap:8px;justify-content:center;';
        const runBtn = document.createElement('button');
        runBtn.textContent = 'Clean Up';
        runBtn.style.cssText = 'font-family:var(--font-pixel);font-size:7px;padding:3px 14px;cursor:pointer;border:2px outset #c0c0c0;background:#c0c0c0;';
        row.appendChild(runBtn);
        wrap.appendChild(row);

        runBtn.addEventListener('click', () => {
          const before = systemHealth.getState();
          const after = systemHealth.runCleanup();
          const removed = Math.max(0, before.junk - after.junk);
          summary.textContent = 'Temporary junk: ' + after.junk + '% of fake drive';
          status.textContent = 'Cleanup complete: removed ' + removed + '% junk data.';
        });

        const winEl = wm.createWindow('cleanup', this.title, this.icon, wrap, { width: 420, height: 320 });
        animateWindowOpen('cleanup', winEl);
      } catch (e) { console.warn('Disk Cleanup open error:', e); }
    }
  },
  // ─── PHASE 17: Win95 Extra Apps ───────────────────
  paint: {
    title: 'Paint',
    icon: 'icon:paint',
    open() {
      if (!window.Win95Extras) return;
      const content = window.Win95Extras.createPaint();
      const winEl = wm.createWindow('paint', this.title, this.icon, content, { width: 920, height: 700 });
      animateWindowOpen('paint', winEl);
    }
  },
  ie: {
    title: 'Internet Explorer',
    icon: 'icon:internet',
    open() {
      if (!window.Win95Extras) return;
      const bootTarget = window.__WIN95_IE_BOOT_TARGET || null;
      window.__WIN95_IE_BOOT_TARGET = null;
      const content = window.Win95Extras.createInternetExplorer(bootTarget);
      const appId = bootTarget ? 'ie-' + Date.now().toString(36) : 'ie';
      const title = bootTarget ? this.title + ' (New Window)' : this.title;
      const winEl = wm.createWindow(appId, title, this.icon, content, { width: 1180, height: 780 });
      animateWindowOpen(appId, winEl);
    }
  },
  msn: {
    title: 'MSN Messenger',
    icon: 'icon:msn',
    open() {
      if (!window.Win95Extras) return;
      const content = window.Win95Extras.createMSNMessenger();
      const winEl = wm.createWindow('msn', this.title, this.icon, content, { width: 360, height: 460 });
      animateWindowOpen('msn', winEl);
    }
  },
  sysprops: {
    title: 'Settings',
    icon: 'icon:settings',
    open() {
      if (!window.Win95Extras) return;
      const content = window.Win95Extras.createSystemProperties();
      const winEl = wm.createWindow('sysprops', this.title, this.icon, content, { width: 400, height: 440 });
      animateWindowOpen('sysprops', winEl);
    }
  },
  winamp: {
    title: 'Winamp',
    icon: 'icon:winamp',
    open() {
      const winEl = mediaWindows.openWinampWindow({
        title: 'Ready',
        url: '',
        autoplay: false
      }, {
        width: 360,
        height: 500
      });
      animateWindowOpen('winamp', winEl);
    }
  }
};

terminalRuntime = createTerminalRuntime({
  wm,
  resolveAppAlias,
  launchAppByAlias,
  playWindowSound,
  getOpenWindowSummary,
  getAppConfig: () => APP_CONFIG,
  getRecentAppIds: () => recentAppIds,
});

window.__APP_CONFIG = APP_CONFIG;

function applyDesktopIconsFromConfig() {
  document.querySelectorAll('.desktop-icon').forEach((iconEl) => {
    const appId = iconEl.dataset.app;
    const app = APP_CONFIG[appId];
    const glyph = iconEl.querySelector('.icon-emoji');
    if (!app || !glyph) return;
    renderUiIcon(glyph, app.icon, { alt: app.title || appId });
    bindDesktopIconInteractions(iconEl);
  });
  const startLogo = document.querySelector('.start-logo');
  if (startLogo) renderUiIcon(startLogo, 'icon:start', { alt: 'Start' });
}

function deriveDesktopDynamicEntries() {
  const mutations = readExplorerMutationLog();
  const map = new Map();
  const isDesktopDirectPath = (pathParts) => Array.isArray(pathParts) && pathParts.length === 2 && pathParts[0] === 'Desktop';
  mutations.forEach((entry) => {
    if (!entry || typeof entry !== 'object') return;
    if (entry.type === 'create' && isDesktopDirectPath(entry.path)) {
      const name = entry.path[1];
      map.set(name, {
        name,
        nodeType: entry.nodeType || 'file',
        size: entry.size || '1 KB',
        modified: entry.modified || '',
        shortcut: entry.shortcut || null
      });
      return;
    }
    if (entry.type === 'rename' && isDesktopDirectPath(entry.path)) {
      const from = entry.path[1];
      const to = String(entry.to || '').trim();
      if (!to) return;
      if (!map.has(from)) return;
      const row = map.get(from);
      map.delete(from);
      row.name = to;
      map.set(to, row);
      return;
    }
    if (entry.type === 'delete' && isDesktopDirectPath(entry.path)) {
      map.delete(entry.path[1]);
    }
  });
  return Array.from(map.values()).filter((entry) => {
    if (!entry) return false;
    if (entry.nodeType === 'folder') return true;
    if (entry.shortcut) return true;
    return /\.lnk$/i.test(entry.name || '');
  });
}

function makeDynamicDesktopIcon(entry) {
  const iconEl = document.createElement('div');
  iconEl.className = 'desktop-icon dynamic-user';
  iconEl.dataset.dynamicUser = '1';
  iconEl.dataset.iconKey = 'dyn:' + String(entry.name || '').toLowerCase();
  iconEl.dataset.desktopName = String(entry.name || '');

  const labelBase = String(entry.name || 'Shortcut').replace(/\.lnk$/i, '');
  let iconValue = 'icon:file';
  if (entry.nodeType === 'folder') {
    iconValue = 'icon:folderClosed';
    iconEl.dataset.shortcutType = 'folder';
    iconEl.dataset.targetPath = JSON.stringify(['Desktop', entry.name]);
  } else if (entry.shortcut && entry.shortcut.shortcutType === 'app') {
    const appId = entry.shortcut.targetApp;
    const app = APP_CONFIG[appId];
    iconValue = app && app.icon ? app.icon : '↗️';
    iconEl.dataset.shortcutType = 'app';
    iconEl.dataset.targetApp = appId || '';
  } else if (entry.shortcut && entry.shortcut.shortcutType === 'folder') {
    iconValue = 'icon:folderClosed';
    iconEl.dataset.shortcutType = 'folder';
    iconEl.dataset.targetPath = JSON.stringify(entry.shortcut.targetPath || []);
  } else if (entry.shortcut && entry.shortcut.shortcutType === 'file') {
    iconValue = '↗️';
    iconEl.dataset.shortcutType = 'file';
    iconEl.dataset.filePayload = JSON.stringify(entry.shortcut.file || {});
  } else {
    iconValue = '↗️';
    iconEl.dataset.shortcutType = 'folder';
    iconEl.dataset.targetPath = JSON.stringify(['Desktop', entry.name]);
  }
  iconEl.dataset.label = labelBase;

  const iconGlyph = document.createElement('span');
  iconGlyph.className = 'icon-emoji';
  renderUiIcon(iconGlyph, iconValue, { alt: labelBase });

  const label = document.createElement('span');
  label.className = 'icon-label';
  label.textContent = labelBase;

  iconEl.appendChild(iconGlyph);
  iconEl.appendChild(label);
  return iconEl;
}

function refreshDynamicDesktopIcons() {
  const iconGrid = document.getElementById('iconGrid');
  if (!iconGrid) return;
  iconGrid.querySelectorAll('.desktop-icon.dynamic-user').forEach((el) => el.remove());
  const entries = deriveDesktopDynamicEntries();
  entries.forEach((entry) => {
    const icon = makeDynamicDesktopIcon(entry);
    iconGrid.appendChild(icon);
    bindDesktopIconInteractions(icon);
  });
  if (typeof window.__win95IconGridRefresh === 'function') {
    window.__win95IconGridRefresh();
  }
}
window.__refreshDynamicDesktopIcons = refreshDynamicDesktopIcons;

const desktopIconLastClick = new WeakMap();
function launchDesktopShortcut(iconEl) {
  if (!iconEl) return;
  const appId = iconEl.dataset.app;
  if (appId) {
    launchAppByAlias(appId, 'desktop-icon');
    return;
  }
  const type = iconEl.dataset.shortcutType;
  if (type === 'app') {
    if (iconEl.dataset.targetApp) launchAppByAlias(iconEl.dataset.targetApp, 'desktop-shortcut');
    return;
  }
  if (type === 'folder') {
    let path = ['Desktop'];
    try {
      const parsed = JSON.parse(iconEl.dataset.targetPath || '[]');
      if (Array.isArray(parsed) && parsed.length) path = parsed;
    } catch (e) {}
    window.__WIN95_EXPLORER_BOOT_PATH = path;
    if (window.__wm && window.__wm.windows && window.__wm.windows.has('explorer')) {
      window.__WIN95_EXPLORER_OPEN_OPTS = { newWindow: true };
    }
    launchAppByAlias('explorer', 'desktop-shortcut');
    return;
  }
  if (type === 'file') {
    if (!window.FileHandlers || typeof window.FileHandlers.openFile !== 'function') return;
    try {
      const payload = JSON.parse(iconEl.dataset.filePayload || '{}');
      window.FileHandlers.openFile(payload);
    } catch (e) {}
  }
}
window.__openDesktopIcon = launchDesktopShortcut;

function bindDesktopIconInteractions(iconEl) {
  if (!iconEl || iconEl.dataset.iconBound === '1') return;
  iconEl.dataset.iconBound = '1';
  iconEl.addEventListener('click', () => {
    const now = Date.now();
    document.querySelectorAll('.desktop-icon').forEach((i) => i.classList.remove('selected'));
    iconEl.classList.add('selected');
    playClickSound();
    const lastClick = desktopIconLastClick.get(iconEl) || 0;
    if (now - lastClick < 500) {
      launchDesktopShortcut(iconEl);
      desktopIconLastClick.set(iconEl, 0);
    } else {
      desktopIconLastClick.set(iconEl, now);
    }
  });
}

applyDesktopIconsFromConfig();
refreshDynamicDesktopIcons();

function initDesktopMarqueeSelection() {
  const iconGrid = document.getElementById('iconGrid');
  if (!iconGrid || iconGrid.dataset.marqueeBound === '1') return;
  iconGrid.dataset.marqueeBound = '1';
  let box = null;
  let dragging = false;
  let startX = 0;
  let startY = 0;

  function clearBox() {
    if (box && box.parentNode) box.parentNode.removeChild(box);
    box = null;
  }

  function rectsIntersect(a, b) {
    return !(b.left > a.right || b.right < a.left || b.top > a.bottom || b.bottom < a.top);
  }

  iconGrid.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return;
    if (event.target.closest('.desktop-icon')) return;
    startX = event.clientX;
    startY = event.clientY;
    dragging = true;
    document.querySelectorAll('.desktop-icon').forEach((i) => i.classList.remove('selected'));
    box = document.createElement('div');
    box.className = 'desktop-selection-box';
    iconGrid.appendChild(box);

    const onMove = (moveEvent) => {
      if (!dragging || !box) return;
      const gridRect = iconGrid.getBoundingClientRect();
      const x1 = Math.max(0, Math.min(startX, moveEvent.clientX) - gridRect.left);
      const y1 = Math.max(0, Math.min(startY, moveEvent.clientY) - gridRect.top);
      const x2 = Math.max(0, Math.max(startX, moveEvent.clientX) - gridRect.left);
      const y2 = Math.max(0, Math.max(startY, moveEvent.clientY) - gridRect.top);
      box.style.left = x1 + 'px';
      box.style.top = y1 + 'px';
      box.style.width = Math.max(1, x2 - x1) + 'px';
      box.style.height = Math.max(1, y2 - y1) + 'px';

      const selectionRect = box.getBoundingClientRect();
      iconGrid.querySelectorAll('.desktop-icon').forEach((iconEl) => {
        const hit = rectsIntersect(selectionRect, iconEl.getBoundingClientRect());
        iconEl.classList.toggle('selected', hit);
      });
    };

    const onUp = () => {
      dragging = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      clearBox();
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}
initDesktopMarqueeSelection();

window.addEventListener('win95-explorer-mutation', function(event) {
  const detail = event && event.detail ? event.detail : null;
  if (!detail || !detail.payload || !Array.isArray(detail.payload.path)) return;
  if (detail.payload.path[0] !== 'Desktop') return;
  refreshDynamicDesktopIcons();
});

function animateCounters() {
  if (typeof gsap === 'undefined') return;
  document.querySelectorAll('.exp-stat-num[data-target]').forEach(el => {
    const target = parseFloat(el.dataset.target);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const isDecimal = target % 1 !== 0;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target, duration: 2, delay: 0.5, ease: 'power2.out',
      onUpdate() { el.textContent = prefix + (isDecimal ? obj.val.toFixed(1) : Math.round(obj.val)) + suffix; }
    });
  });
}

// Close panel (legacy — harmless)
window.closePanel = function() {
  document.querySelectorAll('.panel.open').forEach(p => p.classList.remove('open'));
};

document.getElementById('closePanelBtn').addEventListener('click', window.closePanel);
document.getElementById('closePanelPres').addEventListener('click', window.closePanel);
document.getElementById('closePanelExp').addEventListener('click', window.closePanel);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') window.closePanel();
});

// Pioneer + arch demo handlers
document.querySelectorAll('.pioneer').forEach(el => {
  el.addEventListener('click', () => {
    const info = document.getElementById('pioneerInfo');
    info.textContent = el.dataset.info;
    info.style.borderColor = 'var(--green)';
    info.style.color = 'var(--text)';
  });
});

document.getElementById('runBtn').addEventListener('click', function() {
  const cpuGrid = document.getElementById('cpuGrid');
  const gpuGrid = document.getElementById('gpuGrid');
  const cpuTime = document.getElementById('cpuTime');
  const gpuTime = document.getElementById('gpuTime');
  while (cpuGrid.firstChild) cpuGrid.removeChild(cpuGrid.firstChild);
  while (gpuGrid.firstChild) gpuGrid.removeChild(gpuGrid.firstChild);
  cpuTime.textContent = '\u2014'; gpuTime.textContent = '\u2014';
  for (let i = 0; i < 8; i++) { const c = document.createElement('div'); c.className = 'arch-cell'; c.style.cssText = 'width:32px;height:32px'; cpuGrid.appendChild(c); }
  for (let i = 0; i < 256; i++) { const c = document.createElement('div'); c.className = 'arch-cell'; c.style.cssText = 'width:14px;height:14px'; gpuGrid.appendChild(c); }
  const cpuCells = cpuGrid.querySelectorAll('.arch-cell');
  const gpuCells = gpuGrid.querySelectorAll('.arch-cell');
  let cpuDone = 0; const cpuStart = performance.now();
  const cpuInterval = setInterval(() => {
    const batch = Math.min(8, 64 - cpuDone);
    cpuCells.forEach(c => c.classList.remove('active-cpu'));
    for (let i = 0; i < batch; i++) { if (cpuCells[i]) cpuCells[i].classList.add('active-cpu'); }
    cpuDone += batch; cpuTime.textContent = ((performance.now()-cpuStart)/1000).toFixed(2)+'s';
    if (cpuDone >= 64) { clearInterval(cpuInterval); cpuCells.forEach(c => c.classList.remove('active-cpu')); cpuTime.textContent += ' \u2713'; }
  }, 400);
  setTimeout(() => {
    const gpuStart = performance.now();
    for (let i = 0; i < 64; i++) {
      setTimeout(() => { if (gpuCells[i]) gpuCells[i].classList.add('active-gpu'); if (i === 63) gpuTime.textContent = ((performance.now()-gpuStart)/1000).toFixed(2)+'s \u2713'; }, i*3);
    }
  }, 100);
});

// ═══════════════════════════════════════════════════
// RESIZE + PARTICLE ANIMATION LOOP
// ═══════════════════════════════════════════════════
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  wm.reflowWindows();
});

function animate() {
  requestAnimationFrame(animate);
  if (desktopActive) return;
  // Drift particles
  const pos = particles.geometry.attributes.position.array;
  for (let i = 0; i < PTC; i++) {
    pos[i*3]   += pVel[i*3];
    pos[i*3+1] += pVel[i*3+1];
    pos[i*3+2] += pVel[i*3+2];
    // Wrap around
    if (Math.abs(pos[i*3]) > 100) pos[i*3] *= -0.9;
    if (Math.abs(pos[i*3+1]) > 100) pos[i*3+1] *= -0.9;
    if (Math.abs(pos[i*3+2]) > 100) pos[i*3+2] *= -0.9;
  }
  particles.geometry.attributes.position.needsUpdate = true;
  particles.rotation.y += 0.0003;
  renderer.render(scene, camera);
}

animate();

// ═══════════════════════════════════════════════════
// PHASE 18: DESKTOP ICON DRAG + GRID SNAP
// ═══════════════════════════════════════════════════
initIconDragModule();

// ═══════════════════════════════════════════════════
// PHASE 18: RIGHT-CLICK CONTEXT MENU
// ═══════════════════════════════════════════════════
initContextMenuModule({ closeTaskbarMenu: () => wm.closeTaskbarMenu() });
