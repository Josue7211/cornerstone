import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ═══════════════════════════════════════════════════
// RENDERER + SCENE
// ═══════════════════════════════════════════════════
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x020206);
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x020206, 0.015);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
// Start pulled back, will animate into the screen
camera.position.set(0, 3, 8);
camera.lookAt(0, 2, 0);

// Post-processing
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight), 0.4, 0.4, 0.9
));

// Lights
scene.add(new THREE.AmbientLight(0x445566, 0.5));
const dirLight = new THREE.DirectionalLight(0x8888ff, 0.4);
dirLight.position.set(5, 15, 5);
scene.add(dirLight);

// HDRI
new RGBELoader().load('./assets/hdri/night_sky.hdr', (tex) => {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  scene.environment = pmrem.fromEquirectangular(tex).texture;
  tex.dispose();
  pmrem.dispose();
});

// ═══════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════
const state = {
  phase: 'loading', // loading → zooming → desktop
  loaded: false,
  zoomStart: 0,
  zoomDuration: 3.5, // seconds to zoom into screen
};

// ═══════════════════════════════════════════════════
// LOAD ROOM
// ═══════════════════════════════════════════════════
const loader = new GLTFLoader();
const loaderFill = document.getElementById('loaderFill');
const loaderText = document.getElementById('loaderText');
const loaderPct = document.getElementById('loaderPct');

// Camera targets — hardcoded after inspecting the room
// These get recalculated after the room loads and we know actual positions
let camStart = new THREE.Vector3(0, 4, 6);
let camEnd = new THREE.Vector3(0, 2.5, 1);
let lookStart = new THREE.Vector3(0, 2, 0);
let lookEnd = new THREE.Vector3(0, 2.5, -3);

loader.load('./assets/models/futuristic-room/scene.gltf', (gltf) => {
  const model = gltf.scene;
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 25 / maxDim;
  model.scale.setScalar(scale);
  const sBox = new THREE.Box3().setFromObject(model);
  const center = sBox.getCenter(new THREE.Vector3());
  model.position.set(-center.x, -sBox.min.y, -center.z);
  model.traverse(c => {
    if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; }
  });
  scene.add(model);

  // Force update world matrices so getWorldPosition works
  model.updateMatrixWorld(true);

  // Find the main monitor and log ALL positions
  const positions = {};
  model.traverse(c => {
    if (!c.name) return;
    const n = c.name;
    if (n.match(/^Monitor\.|^OfficeTable$|^OfficeChair$/)) {
      const wp = new THREE.Vector3();
      c.getWorldPosition(wp);
      positions[n] = { x: wp.x, y: wp.y, z: wp.z };
    }
  });

  window._roomPositions = positions;
  console.log('Room positions:', JSON.stringify(Object.fromEntries(
    Object.entries(positions).map(([k, v]) => [k, [v.x.toFixed(1), v.y.toFixed(1), v.z.toFixed(1)]])
  )));

  // Chair is at (-0.8, 0.2, 0.2), desk at (1.5, 1.3, 0.6)
  // Camera sits at chair, looks at desk/monitors
  const desk = positions['OfficeTable'] || { x: 1.5, y: 1.3, z: 0.6 };
  const chair = positions['OfficeChair'] || { x: -0.8, y: 0.2, z: 0.2 };

  // Hardcoded from user positioning
  camEnd.set(-0.90, 4.01, 0.06);
  lookEnd.set(1.80, 1.75, 0.54);

  // Start: pulled back from chair (away from desk)
  const dx = chair.x - desk.x;
  const dz = chair.z - desk.z;
  const len = Math.sqrt(dx*dx + dz*dz) || 1;
  camStart.set(chair.x + (dx/len)*5, chair.y + 3, chair.z + (dz/len)*5);
  lookStart.set(desk.x, desk.y, desk.z);

  console.log('Camera: chair→desk, start:', camStart.x.toFixed(1), camStart.y.toFixed(1), camStart.z.toFixed(1));
  camera.position.copy(camStart);

  // Debug controls removed — camera position locked in

  loaderFill.style.width = '100%';
  loaderPct.textContent = '100%';
  loaderText.textContent = 'ENTERING THE GRID...';

  setTimeout(() => {
    document.getElementById('loader').classList.add('done');
    state.loaded = true;
    state.phase = 'zooming';
    state.zoomStart = performance.now() / 1000;
  }, 600);
}, (p) => {
  const pct = p.total > 0 ? Math.round(p.loaded / p.total * 100) : Math.min(99, Math.round(p.loaded / 580000000 * 100));
  loaderFill.style.width = pct + '%';
  loaderPct.textContent = pct + '%';
  loaderText.textContent = pct < 50 ? 'LOADING ENVIRONMENT...' : 'COMPILING SHADERS...';
});

// ═══════════════════════════════════════════════════
// DESKTOP UI
// ═══════════════════════════════════════════════════
const desktop = document.getElementById('desktop');

// ─── WEB AUDIO ───────────────────────────────────
let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}

function playClickSound() {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch(e) {}
}

function playStartupChime() {
  try {
    const ctx = getAudioCtx();
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      const t = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.35);
      osc.frequency.setValueAtTime(freq, t);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  } catch(e) {}
}

function playWindowSound(type) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    const now = ctx.currentTime;
    if (type === 'open') {
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'close') {
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.linearRampToValueAtTime(220, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'minimize') {
      osc.frequency.setValueAtTime(660, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    }
  } catch(e) {}
}

// ─── BIOS SEQUENCE ─── showBios() called after camera zoom ──────────────────
const biosLines = [
  'NEURAL ARCHITECTURE BIOS v2.026.04',
  'Copyright (C) 2026 Josue Aparcedo Gonzalez. All Rights Reserved.',
  '',
  'CPU: AMD Ryzen 9 7950X3D @ 4.2GHz ... OK',
  'DRAM: 64GB DDR5-6000 ECC ... OK',
  '',
  'Detecting NVIDIA RTX 4070 Ti SUPER ...',
  '  VRAM: 16GB GDDR6X ............... OK',
  '  CUDA Cores: 8448 ................. OK',
  '  Tensor Cores (4th Gen): 264 ...... OK',
  '  TFLOPS FP16: 641.3 .............. OK',
  '',
  'Loading AI Acceleration Cores .... OK',
  'Initializing Neural Pathways ...... OK',
  'Calibrating Transformer Engine .... OK',
  '',
  'Boot Device: NVMe SSD Samsung 980 Pro 1TB',
  'Loading FROM_PIXELS_TO_INTELLIGENCE.OS ...',
  '',
  'System Ready. Initializing Desktop Environment...',
];

function showBios() {
  const biosScreen = document.getElementById('biosScreen');
  const biosOutput = document.getElementById('biosOutput');
  document.getElementById('hud').classList.remove('visible');
  biosScreen.classList.add('active');
  biosOutput.textContent = '';
  const fullText = biosLines.join('\n');
  let charIdx = 0;
  const interval = setInterval(() => {
    charIdx += 18;
    biosOutput.textContent = fullText.slice(0, charIdx);
    if (charIdx >= fullText.length) {
      clearInterval(interval);
      biosOutput.textContent = fullText;
      setTimeout(() => {
        biosScreen.classList.remove('active');
        showWin95Desktop();
      }, 800);
    }
  }, 50);
}

// ─── WIN95 DESKTOP ────────────────────────────────
function showWin95Desktop() {
  state.phase = 'desktop';
  desktop.classList.add('visible');
  playStartupChime();
  updateClock();
  setInterval(updateClock, 1000);
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

// ─── WINDOW MANAGER ──────────────────────────────
class WindowManager {
  constructor() {
    this.windows = new Map();
    this.zCounter = 300;
    this.layer = document.getElementById('windowLayer');
    this.pillsContainer = document.getElementById('taskbarPills');
  }

  createWindow(appId, title, icon, contentEl, opts = {}) {
    if (this.windows.has(appId)) {
      this.restoreWindow(appId);
      return;
    }
    const w = opts.width || 820;
    const h = opts.height || 560;
    const jx = (Math.random() - 0.5) * 40;
    const jy = (Math.random() - 0.5) * 40;
    const x = Math.max(0, (window.innerWidth - w) / 2 + jx);
    const y = Math.max(0, (window.innerHeight - h) / 2 - 14 + jy);

    const win = document.createElement('div');
    win.className = 'win95-window focused';
    win.style.left = x + 'px';
    win.style.top = y + 'px';
    win.style.width = w + 'px';
    win.style.height = h + 'px';
    win.style.zIndex = ++this.zCounter;
    win.dataset.appId = appId;

    // Titlebar
    const titlebar = document.createElement('div');
    titlebar.className = 'win95-titlebar';
    titlebar.dataset.drag = 'true';

    const tbIcon = document.createElement('span');
    tbIcon.className = 'win95-titlebar-icon';
    tbIcon.textContent = icon;

    const tbText = document.createElement('span');
    tbText.className = 'win95-titlebar-text';
    tbText.textContent = title;

    const tbBtns = document.createElement('div');
    tbBtns.className = 'win95-titlebar-btns';

    const minBtn = document.createElement('button');
    minBtn.className = 'win95-btn min-btn';
    minBtn.textContent = '_';

    const maxBtn = document.createElement('button');
    maxBtn.className = 'win95-btn max-btn';
    maxBtn.textContent = '\u25A1';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'win95-btn close-btn';
    closeBtn.textContent = '\u2715';

    tbBtns.appendChild(minBtn);
    tbBtns.appendChild(maxBtn);
    tbBtns.appendChild(closeBtn);
    titlebar.appendChild(tbIcon);
    titlebar.appendChild(tbText);
    titlebar.appendChild(tbBtns);

    // Content area
    const content = document.createElement('div');
    content.className = 'win95-content';
    content.id = 'win-content-' + appId;

    // Statusbar
    const statusbar = document.createElement('div');
    statusbar.className = 'win95-statusbar';
    const sb1 = document.createElement('span');
    sb1.textContent = title;
    const sb2 = document.createElement('span');
    sb2.textContent = 'Ready';
    statusbar.appendChild(sb1);
    statusbar.appendChild(sb2);

    win.appendChild(titlebar);
    win.appendChild(content);
    win.appendChild(statusbar);

    if (contentEl) content.appendChild(contentEl);

    this.layer.appendChild(win);
    this.windows.set(appId, { el: win, minimized: false, title, icon });

    this._addPill(appId, title, icon);

    win.addEventListener('mousedown', () => this.focusWindow(appId));
    this._makeDraggable(win, titlebar);

    minBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playWindowSound('minimize');
      this.minimizeWindow(appId);
    });
    maxBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleMaximize(appId);
    });
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playWindowSound('close');
      this.closeWindow(appId);
    });

    playWindowSound('open');
    return win;
  }

  _addPill(appId, title, icon) {
    const pill = document.createElement('div');
    pill.className = 'taskbar-pill active';
    pill.id = 'pill-' + appId;
    const shortTitle = title.length > 15 ? title.slice(0, 15) : title;
    pill.textContent = icon + ' ' + shortTitle;
    pill.title = title;
    pill.addEventListener('click', () => {
      const entry = this.windows.get(appId);
      if (!entry) return;
      if (entry.minimized) {
        this.restoreWindow(appId);
      } else {
        this.minimizeWindow(appId);
      }
    });
    this.pillsContainer.appendChild(pill);
  }

  focusWindow(appId) {
    document.querySelectorAll('.win95-window').forEach(w => w.classList.remove('focused'));
    const entry = this.windows.get(appId);
    if (entry && !entry.minimized) {
      entry.el.classList.add('focused');
      entry.el.style.zIndex = ++this.zCounter;
    }
    document.querySelectorAll('.taskbar-pill').forEach(p => p.classList.remove('active'));
    const pill = document.getElementById('pill-' + appId);
    if (pill) pill.classList.add('active');
  }

  minimizeWindow(appId) {
    const entry = this.windows.get(appId);
    if (!entry) return;
    entry.minimized = true;
    entry.el.classList.add('minimized');
    const pill = document.getElementById('pill-' + appId);
    if (pill) pill.classList.remove('active');
  }

  restoreWindow(appId) {
    const entry = this.windows.get(appId);
    if (!entry) return;
    entry.minimized = false;
    entry.el.classList.remove('minimized');
    this.focusWindow(appId);
  }

  closeWindow(appId) {
    const entry = this.windows.get(appId);
    if (!entry) return;
    const contentArea = entry.el.querySelector('.win95-content');
    if (contentArea) {
      const panel = contentArea.querySelector('.panel');
      if (panel) {
        panel.classList.remove('open');
        panel.style.cssText = '';
        document.body.appendChild(panel);
      }
    }
    entry.el.remove();
    this.windows.delete(appId);
    const pill = document.getElementById('pill-' + appId);
    if (pill) pill.remove();
  }

  _toggleMaximize(appId) {
    const entry = this.windows.get(appId);
    if (!entry) return;
    const win = entry.el;
    if (win.dataset.maximized === 'true') {
      win.style.cssText = win.dataset.prevStyle;
      win.dataset.maximized = 'false';
    } else {
      win.dataset.prevStyle = win.style.cssText;
      win.style.left = '0';
      win.style.top = '0';
      win.style.width = '100%';
      win.style.height = 'calc(100% - 28px)';
      win.style.zIndex = ++this.zCounter;
      win.dataset.maximized = 'true';
    }
  }

  _makeDraggable(win, handle) {
    handle.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('win95-btn')) return;
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const startL = parseInt(win.style.left) || 0;
      const startT = parseInt(win.style.top) || 0;
      const onMove = (e) => {
        win.style.left = (startL + e.clientX - startX) + 'px';
        win.style.top = (startT + e.clientY - startY) + 'px';
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }
}

const wm = new WindowManager();

// ─── APP CONFIG ──────────────────────────────────
const APP_CONFIG = {
  paper: {
    title: 'Research Paper.exe',
    icon: '\uD83D\uDCC4',
    width: 900,
    height: 640,
    open() {
      const panel = document.getElementById('panelPaper');
      const win = wm.createWindow('paper', this.title, this.icon, panel, { width: 900, height: 640 });
      if (panel) panel.classList.add('open');
    }
  },
  pres: {
    title: 'Presentation.exe',
    icon: '\uD83C\uDFAC',
    width: 900,
    height: 640,
    open() {
      const panel = document.getElementById('panelPres');
      const win = wm.createWindow('pres', this.title, this.icon, panel, { width: 900, height: 640 });
      if (panel) panel.classList.add('open');
    }
  },
  exp: {
    title: 'Experience.exe',
    icon: '\uD83D\uDD2C',
    width: 900,
    height: 640,
    open() {
      animateCounters();
      const panel = document.getElementById('panelExp');
      const win = wm.createWindow('exp', this.title, this.icon, panel, { width: 900, height: 640 });
      if (panel) panel.classList.add('open');
    }
  },
  explorer: {
    title: 'My Computer',
    icon: '\uD83D\uDCBE',
    width: 480,
    height: 360,
    open() {
      const div = document.createElement('div');
      div.style.background = '#fff';
      div.style.padding = '12px';
      div.style.fontFamily = 'var(--font-pixel)';
      div.style.fontSize = '8px';
      div.style.color = '#000';

      const heading = document.createElement('p');
      heading.textContent = 'My Computer';
      heading.style.color = '#000080';
      heading.style.marginBottom = '12px';
      heading.style.fontSize = '10px';
      div.appendChild(heading);

      const grid = document.createElement('div');
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
      grid.style.gap = '8px';
      grid.style.marginBottom = '12px';
      const items = ['Research', 'Slides', 'Sources', 'C: Drive', 'Network', 'Printers'];
      items.forEach(name => {
        const item = document.createElement('div');
        item.style.padding = '8px';
        item.style.border = '1px solid #808080';
        item.style.textAlign = 'center';
        item.style.cursor = 'default';
        item.textContent = name;
        grid.appendChild(item);
      });
      div.appendChild(grid);

      const info = document.createElement('p');
      info.textContent = '6 object(s) * 13,455 words of research * 35 APA sources';
      info.style.fontSize = '7px';
      info.style.color = '#444';
      div.appendChild(info);

      wm.createWindow('explorer', this.title, this.icon, div, { width: 480, height: 360 });
    }
  },
  terminal: {
    title: 'Terminal.exe',
    icon: '\u2328\uFE0F',
    width: 560,
    height: 400,
    open() {
      const termDiv = document.createElement('div');
      termDiv.style.background = '#000';
      termDiv.style.color = '#33ff33';
      termDiv.style.fontFamily = "'Space Mono', monospace";
      termDiv.style.padding = '12px';
      termDiv.style.overflow = 'auto';
      termDiv.style.height = '100%';
      termDiv.style.display = 'flex';
      termDiv.style.flexDirection = 'column';

      const output = document.createElement('pre');
      output.textContent = 'Terminal ready. Type help for commands.';
      output.style.flex = '1';
      output.style.margin = '0 0 8px 0';
      output.style.whiteSpace = 'pre-wrap';
      output.style.fontSize = '12px';

      const input = document.createElement('input');
      input.type = 'text';
      input.style.background = 'transparent';
      input.style.border = 'none';
      input.style.borderBottom = '1px solid #33ff33';
      input.style.color = '#33ff33';
      input.style.fontFamily = "'Space Mono', monospace";
      input.style.fontSize = '12px';
      input.style.outline = 'none';
      input.style.width = '100%';
      input.placeholder = '> type here...';

      termDiv.appendChild(output);
      termDiv.appendChild(input);

      wm.createWindow('terminal', this.title, this.icon, termDiv, { width: 560, height: 400 });
    }
  },
  notepad: {
    title: 'Notepad.exe',
    icon: '\uD83D\uDCDD',
    width: 480,
    height: 380,
    open() {
      const div = document.createElement('div');
      div.style.height = '100%';
      div.style.display = 'flex';
      div.style.flexDirection = 'column';

      const ta = document.createElement('textarea');
      ta.style.flex = '1';
      ta.style.fontFamily = "'Courier New', monospace";
      ta.style.fontSize = '12px';
      ta.style.border = 'none';
      ta.style.outline = 'none';
      ta.style.resize = 'none';
      ta.style.padding = '8px';
      ta.style.background = '#fff';
      ta.style.color = '#000';
      ta.textContent = 'FROM PIXELS TO INTELLIGENCE\n============================\nBy Josue Aparcedo Gonzalez\nIDS2891 Cornerstone, Spring 2026\n\nThanks for exploring this project.\nThis entire website was built with\nClaude Code + Three.js + GSAP.\n\nResearch: 13,455 words, 35 APA sources\nTopic: Local AI democratization\n\nFun fact: The GPU rendering this\nretro OS is the same type of hardware\nthis paper argues will obsolete the cloud.\n\n-- J.A.G.';
      div.appendChild(ta);

      wm.createWindow('notepad', this.title, this.icon, div, { width: 480, height: 380 });
    }
  },
  recycle: {
    title: 'Recycle Bin',
    icon: '\uD83D\uDDD1\uFE0F',
    width: 440,
    height: 340,
    open() {
      const div = document.createElement('div');
      div.style.background = '#fff';
      div.style.padding = '12px';
      div.style.fontFamily = 'var(--font-pixel)';
      div.style.fontSize = '8px';
      div.style.color = '#000';

      const heading = document.createElement('p');
      heading.textContent = 'Deleted Items (3 items)';
      heading.style.marginBottom = '12px';
      heading.style.fontSize = '9px';
      div.appendChild(heading);

      const items = [
        { name: 'Draft_v1_too_boring.docx', date: '2026-02-14' },
        { name: 'Proposal_with_fake_sources.docx', date: '2026-02-28' },
        { name: 'Essay_about_ChatGPT_only.docx', date: '2026-03-01' },
      ];
      items.forEach(item => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.gap = '8px';
        row.style.padding = '4px';
        row.style.borderBottom = '1px solid #ccc';
        row.style.alignItems = 'center';

        const ico = document.createElement('span');
        ico.textContent = '\uD83D\uDCC4';

        const name = document.createElement('span');
        name.textContent = item.name;
        name.style.flex = '1';

        const date = document.createElement('span');
        date.textContent = item.date;
        date.style.color = '#808080';

        row.appendChild(ico);
        row.appendChild(name);
        row.appendChild(date);
        div.appendChild(row);
      });

      const note = document.createElement('p');
      note.textContent = 'These drafts were deleted during the research process.';
      note.style.marginTop = '12px';
      note.style.color = '#808080';
      note.style.fontSize = '7px';
      div.appendChild(note);

      wm.createWindow('recycle', this.title, this.icon, div, { width: 440, height: 340 });
    }
  }
};

// ─── ICON CLICK HANDLER ──────────────────────────
document.querySelectorAll('.desktop-icon').forEach(icon => {
  let lastClick = 0;
  icon.addEventListener('click', (e) => {
    const now = Date.now();
    document.querySelectorAll('.desktop-icon').forEach(i => i.classList.remove('selected'));
    icon.classList.add('selected');
    playClickSound();
    if (now - lastClick < 500) {
      const appId = icon.dataset.app;
      const app = APP_CONFIG[appId];
      if (app) app.open();
      lastClick = 0;
    } else {
      lastClick = now;
    }
  });
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
// RESIZE
// ═══════════════════════════════════════════════════
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// ═══════════════════════════════════════════════════
// ANIMATION LOOP
// ═══════════════════════════════════════════════════
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now() / 1000;

  // Zoom into screen
  if (state.phase === 'zooming') {
    const elapsed = now - state.zoomStart;
    const t = Math.min(1, elapsed / state.zoomDuration);
    // Smooth easing (ease-in-out cubic)
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    camera.position.lerpVectors(camStart, camEnd, ease);
    const lookTarget = new THREE.Vector3().lerpVectors(lookStart, lookEnd, ease);
    camera.lookAt(lookTarget);

    if (t >= 1) {
      showBios();
    }
  }

  composer.render();
}

animate();
