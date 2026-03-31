import * as THREE from 'three';

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

// ═══════════════════════════════════════════════════
// BOOT — Real 90s Award BIOS POST (youtube.com/watch?v=692Z_adAsMQ)
// Each phase CLEARS the screen like a real BIOS
// ═══════════════════════════════════════════════════
const bootAudio = new Audio('./boot.mp3');
bootAudio.volume = 1.0;

(function startBoot() {
  const loaderEl = document.getElementById('loader');
  if (loaderEl) loaderEl.style.display = 'none';
  document.getElementById('hud').style.display = 'none';

  const bios = document.getElementById('biosScreen');
  const out = document.getElementById('biosOutput');
  const energyStar = document.getElementById('biosEnergyStarLogo');
  const awardRibbon = document.getElementById('biosAwardRibbon');
  const biosFooter = document.getElementById('biosFooter');
  bios.classList.add('active');
  out.textContent = '';

  // "Click to power on" — required for browser audio autoplay policy
  const prompt = document.createElement('div');
  prompt.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10;';
  const label = document.createElement('div');
  label.textContent = 'CLICK TO POWER ON';
  label.style.cssText = 'font-size:16px;color:#888;letter-spacing:0.3em;animation:biosBlink 1.2s step-end infinite;';
  prompt.appendChild(label);
  bios.appendChild(prompt);

  prompt.addEventListener('click', () => {
    prompt.remove();
    bootAudio.play().catch(() => {});
    runBoot();
  }, { once: true });

  function runBoot() {
    // ─── SCREEN 1: Award BIOS header + Energy Star + memory count + drives ───
    let text = '';
    if (energyStar) energyStar.classList.add('visible');
    if (awardRibbon) awardRibbon.classList.add('visible');

    const screen1Lines = [
      'Award Modular BIOS v4.51PG, An Energy Star Ally',
      'Copyright (C) 1984-2026, Award Software, Inc.',
      '',
      '(7800X3DE) AMD X670E PCIset(TM)',
      '',
      'AMD Ryzen 7 7800X3D 8-Core Processor at 4674MHz',
    ];

    const screen1Drives = [
      '',
      '',
      'Award Plug and Play BIOS Extension  v1.0A',
      'Copyright (C) 2026, Award Software, Inc.',
      '',
      '    Detecting IDE Primary Master  ... Samsung 990 PRO 2TB',
      '    Detecting IDE Primary Slave   ... PCemCD',
      '    Detecting IDE Secondary Master... None',
      '    Detecting IDE Secondary Slave ... None',
    ];

    function typeLines(lines, idx, cb) {
      if (idx >= lines.length) { cb(); return; }
      const line = lines[idx];
      text += line + '\n';
      out.textContent = text;
      const delay = line === '' ? 80 : line.includes('Detecting') ? 250 : 40;
      setTimeout(() => typeLines(lines, idx + 1, cb), delay);
    }

    function memoryCount(kb, cb) {
      if (kb > 32768) {
        text += 'Memory Test :    32768K OK\n';
        out.textContent = text;
        setTimeout(cb, 200);
        return;
      }
      out.textContent = text + 'Memory Test :    ' + kb + 'K';
      setTimeout(() => memoryCount(kb + 4096, cb), 30);
    }

    // Run Screen 1
    typeLines(screen1Lines, 0, () => {
      memoryCount(0, () => {
        typeLines(screen1Drives, 0, () => {
          // Show bottom-pinned footer like real BIOS
          biosFooter.textContent = '';
          const footerLine1 = document.createElement('div');
          footerLine1.append('Press ');
          const del1 = document.createElement('span');
          del1.textContent = 'DEL';
          del1.style.cssText = 'color:#fff;font-weight:bold';
          footerLine1.append(del1);
          footerLine1.append(' to enter SETUP, ');
          const esc1 = document.createElement('span');
          esc1.textContent = 'ESC';
          esc1.style.cssText = 'color:#fff;font-weight:bold';
          footerLine1.append(esc1);
          footerLine1.append(' to skip memory test');
          biosFooter.appendChild(footerLine1);
          const footerLine2 = document.createElement('div');
          footerLine2.textContent = '03/30/2026-AMD-X670E-7800X3D-00';
          biosFooter.appendChild(footerLine2);
          // Pause then CLEAR for Screen 2
          setTimeout(showScreen2, 800);
        });
      });
    });

    // ─── SCREEN 2: System Configurations (CLEARS previous, shows boxes + PCI) ───
    function showScreen2() {
      if (energyStar) energyStar.classList.remove('visible');
      if (awardRibbon) awardRibbon.classList.remove('visible');
      biosFooter.textContent = '';
      bios.classList.add('screen2-layout');
      text = '';
      out.textContent =
        '                      System Configurations\n' +
        '\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n' +
        '\u2502 CPU Type     : Ryzen 7 7800X3D    Base Memory    :    640K \u2502\n' +
        '\u2502 Co-Processor : Installed          Extended Memory : 32768K \u2502\n' +
        '\u2502 CPU Clock    : 4674MHz            Cache Memory   :  96MB  \u2502\n' +
        '\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n' +
        '\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n' +
        '\u2502 Pri. Master Disk : NVMe, 1907729MB  Display Type  : EGA/VGA\u2502\n' +
        '\u2502 Pri. Slave  Disk : None             Serial Port(s): 3F8    \u2502\n' +
        '\u2502 Sec. Master Disk : None             DDR5 at Row(s): 0 1    \u2502\n' +
        '\u2502 Sec. Slave  Disk : None             L2 Cache Type : 96MB   \u2502\n' +
        '\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n' +
        '\n' +
        'PCI device listing.....\n' +
        'Bus No.  Device No.  Func No.  Vendor ID   Device ID   Device Class          IRQ\n' +
        '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n' +
        '  1        0           0        10DE        2705     VGA Controller          11\n' +
        '  8        0           0        8086        15F3     Ethernet Controller     10\n' +
        ' 12        0           1        1002        AB38     Multimedia Device        5\n';

      // Go straight to splash — hide BIOS first
      setTimeout(() => {
        bios.classList.remove('active', 'screen2-layout');
        bios.style.display = 'none';
        out.textContent = '';
        biosFooter.textContent = '';
        showWin95Splash();
      }, 1500);
    }

    // ─── SCREEN 4: Windows 95 splash (flag + progress bar) ───
    function showWin95Splash() {
      bios.classList.remove('active', 'screen2-layout');
      bios.style.display = 'none';
      out.textContent = '';
      biosFooter.textContent = '';

      if (energyStar) energyStar.classList.remove('visible');
      if (awardRibbon) awardRibbon.classList.remove('visible');

      const splash = document.getElementById('win95Splash');
      splash.classList.add('active');
      const bar = document.getElementById('win95SplashBar');
      let pct = 0;
      const barInterval = setInterval(() => {
        pct += 2;
        bar.style.width = pct + '%';
        if (pct >= 100) {
          clearInterval(barInterval);
          setTimeout(transitionToDesktop, 400);
        }
      }, 50);
    }

    // ─── TRANSITION: CRT shutoff → desktop CRT power-on ───
    function transitionToDesktop() {
      const splash = document.getElementById('win95Splash');
      if (typeof gsap !== 'undefined') {
        const tl = gsap.timeline();
        // CRT shutoff
        tl.to(splash, { scaleY: 0.003, duration: 0.2, ease: 'power4.in' });
        tl.to(splash, { scaleX: 0, opacity: 0, duration: 0.12, ease: 'power2.in' });
        tl.call(() => { splash.classList.remove('active'); splash.style.cssText = ''; });
        // Brief black
        tl.set({}, {}, '+=0.3');
        // Desktop CRT power-on
        tl.call(() => {
          const dt = document.getElementById('desktop');
          dt.style.transform = 'scaleY(0.003)';
          dt.classList.add('visible');
          gsap.to(dt, { scaleY: 1, duration: 0.25, ease: 'power2.out', onComplete: () => {
            dt.style.transform = '';
            playStartupChime();
            showWin95Desktop();
          }});
        });
      } else {
        splash.classList.remove('active');
        showWin95Desktop();
      }
    }
  }
})();

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
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
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
      const t = ctx.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.4, t + 0.03);
      gain.gain.linearRampToValueAtTime(0.01, t + 0.4);
      osc.frequency.setValueAtTime(freq, t);
      osc.start(t);
      osc.stop(t + 0.45);
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
      osc.frequency.linearRampToValueAtTime(660, now + 0.08);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'close') {
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.linearRampToValueAtTime(330, now + 0.08);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'minimize') {
      osc.frequency.setValueAtTime(550, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    }
  } catch(e) {}
}

// (Old showBios removed — replaced by Award BIOS boot in startBoot)

// ─── WIN95 DESKTOP ────────────────────────────────
function buildStartMenu() {
  if (document.getElementById('startMenu')) return;
  const menu = document.createElement('div');
  menu.id = 'startMenu';
  menu.className = 'start-menu';

  // Left colored header strip
  const header = document.createElement('div');
  header.className = 'start-menu-header';
  const brand = document.createElement('span');
  brand.className = 'start-menu-brand';
  brand.textContent = 'From Pixels to Intelligence';
  header.appendChild(brand);
  menu.appendChild(header);

  // Items list
  const itemsDiv = document.createElement('div');
  itemsDiv.className = 'start-menu-items';

  const appList = [
    { id: 'paper',    icon: '📄', label: 'Research Paper.exe' },
    { id: 'pres',     icon: '🎬', label: 'Presentation.exe' },
    { id: 'exp',      icon: '🔬', label: 'Experience.exe' },
    { id: 'explorer', icon: '💾', label: 'My Computer' },
    { id: 'terminal', icon: '⌨️', label: 'Terminal.exe' },
    { id: 'notepad',  icon: '📝', label: 'Notepad.exe' },
    { id: 'recycle',  icon: '🗑️', label: 'Recycle Bin' },
  ];

  appList.forEach(app => {
    const item = document.createElement('div');
    item.className = 'start-menu-item';
    item.dataset.app = app.id;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'start-menu-icon';
    iconSpan.textContent = app.icon;

    const labelSpan = document.createElement('span');
    labelSpan.className = 'start-menu-label';
    labelSpan.textContent = app.label;

    item.appendChild(iconSpan);
    item.appendChild(labelSpan);
    itemsDiv.appendChild(item);
  });
  menu.appendChild(itemsDiv);

  // Footer
  const footer = document.createElement('div');
  footer.className = 'start-menu-footer';
  const footerSpan = document.createElement('span');
  footerSpan.textContent = '\u00A9 2026 Josue Aparcedo Gonzalez';
  footer.appendChild(footerSpan);
  menu.appendChild(footer);

  document.getElementById('desktop').appendChild(menu);

  // Start menu item click — open app and close menu
  itemsDiv.addEventListener('click', (e) => {
    const item = e.target.closest('.start-menu-item');
    if (!item) return;
    const appId = item.dataset.app;
    const app = APP_CONFIG[appId];
    if (app) app.open();
    menu.classList.remove('visible');
  });
}

function showWin95Desktop() {
  desktopActive = true;
  state.phase = 'desktop';
  desktop.classList.add('visible');
  buildStartMenu();

  // Start button click
  document.getElementById('startBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    playClickSound();
    const menu = document.getElementById('startMenu');
    if (menu) menu.classList.toggle('visible');
  });

  // Close start menu when clicking elsewhere
  document.getElementById('desktop').addEventListener('click', (e) => {
    if (!e.target.closest('#startBtn') && !e.target.closest('#startMenu')) {
      const menu = document.getElementById('startMenu');
      if (menu) menu.classList.remove('visible');
    }
  });

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

// ─── GSAP WINDOW ANIMATIONS ──────────────────────
function animateWindowOpen(appId, el) {
  if (!el || typeof gsap === 'undefined') return;

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
        let idx = 0;
        const batchSize = Math.ceil(fullText.length / 75); // ~1.5s max
        const typeInterval = setInterval(() => {
          idx = Math.min(idx + Math.max(1, batchSize), fullText.length);
          ta.value = fullText.slice(0, idx);
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
function runTerminalCommand(cmd, output) {
  const responses = {
    help: () => [
      '',
      'Available commands:',
      '  help     -- Show this menu',
      '  thesis   -- Print the research thesis',
      '  about    -- About this project',
      '  gpu      -- GPU evolution timeline',
      '  credits  -- Attribution and tools used',
      '  clear    -- Clear terminal',
      ''
    ].join('\n'),

    thesis: () => [
      '',
      'THESIS STATEMENT:',
      '----------------',
      'The cloud-first era of artificial intelligence',
      'is a temporary phase in computing history,',
      'not its conclusion.',
      '',
      'Four converging trends -- silicon miniaturization,',
      'model compression, token optimization, and',
      'open-source model availability -- have made it',
      'possible for individuals to run AI systems on',
      'consumer hardware that rival cloud services',
      'costing thousands of dollars monthly.',
      '',
      'Source: research-paper.md, 13,455 words, 35 APA sources',
      ''
    ].join('\n'),

    about: () => [
      '',
      'FROM PIXELS TO INTELLIGENCE',
      '===========================',
      'Author: Josue Aparcedo Gonzalez',
      'Course: IDS2891 Cornerstone, Spring 2026',
      'FSW College',
      '',
      'Built with:',
      '  Three.js r160 -- 3D futuristic room',
      '  GSAP 3.12.5   -- Animations',
      '  Vanilla JS    -- Everything else',
      '',
      'Interesting fact: This website was built',
      'using local AI tools to prove',
      'the thesis that consumer AI tools are',
      'now powerful enough to replace expensive',
      'cloud-only workflows.',
      ''
    ].join('\n'),

    gpu: () => [
      '',
      'GPU EVOLUTION TIMELINE:',
      '-----------------------',
      '1999: GeForce 256 -- First GPU (gaming only)',
      '2007: CUDA        -- General-purpose GPU compute',
      '2012: Kepler      -- AlexNet moment (AI on consumer GPU)',
      '2017: Volta       -- Tensor Cores invented',
      '2020: Ampere      -- Sparsity-aware Tensor Cores',
      '2022: Hopper      -- Transformer Engine',
      '2024: Blackwell   -- 5th-gen Tensor Cores',
      '',
      'Key insight: Each generation doubles AI throughput.',
      'Consumer GPUs now rival last-gen datacenter cards.',
      ''
    ].join('\n'),

    credits: () => [
      '',
      'CREDITS:',
      '--------',
      'Three.js -- MIT License (three.js.org)',
      'GSAP     -- Standard License (greensock.com)',
      'Sketchfab -- Futuristic room model (CC license)',
      'Poly Haven -- HDRI environment (CC0)',
      'Google Fonts -- Press Start 2P, VT323 fonts',
      '',
      'Pioneer portraits from Wikipedia (CC BY-SA):',
      '  Jensen Huang, Geoffrey Hinton, Gordon Moore,',
      '  Lisa Su, Fei-Fei Li, Andrej Karpathy,',
      '  Sam Altman, Dario Amodei, Jim Keller',
      '',
      'Research: 35 APA sources (see Experience panel)',
      ''
    ].join('\n'),

    clear: () => null  // special case
  };

  if (cmd === 'clear') {
    output.textContent = 'C:\\RESEARCH> \n\n';
    output.textContent += 'C:\\RESEARCH> ';
    return;
  }

  const handler = responses[cmd];
  const result = handler ? handler() : '\nUnknown command: \'' + cmd + '\'\nType \'help\' for available commands.\n';

  // Simulate typing delay — append char by char
  const currentText = output.textContent;
  const toAppend = '\n' + (cmd ? cmd : '') + '\n' + result + 'C:\\RESEARCH> ';
  let i = 0;
  const typeInterval = setInterval(() => {
    i = Math.min(i + 3, toAppend.length);
    output.textContent = currentText + toAppend.slice(0, i);
    output.scrollTop = output.scrollHeight;
    if (i >= toAppend.length) clearInterval(typeInterval);
  }, 15);
}

// ─── APP CONFIG ──────────────────────────────────
// ─── PRESENTATION SCROLL ANIMATIONS ─────────────────
function animatePresSlides(panel) {
  if (typeof gsap === 'undefined') return;
  const scrollContainer = panel.querySelector('.panel-scroll');
  if (!scrollContainer) return;

  // Header entrance
  const header = panel.querySelector('.pres-header');
  if (header) {
    gsap.fromTo(header, { opacity: 0, y: -40, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' });
  }

  // Each slide gets a unique entrance animation on scroll
  const slides = panel.querySelectorAll('.pres-slide');
  const animations = [
    // Slide 1: Title — fade up with scale
    (el) => { gsap.fromTo(el, { opacity: 0, y: 60, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'back.out(1.4)' }); },
    // Slide 2: Intro — slide from left
    (el) => { gsap.fromTo(el, { opacity: 0, x: -80 }, { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out' }); },
    // Slide 3: RQs — stagger children
    (el) => {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      const items = el.querySelectorAll('.rq-item, .slide-methods');
      gsap.fromTo(items, { opacity: 0, y: 30, rotateX: -15 }, { opacity: 1, y: 0, rotateX: 0, duration: 0.5, stagger: 0.12, ease: 'power2.out', delay: 0.2 });
    },
    // Slide 4: Perspective — slide from right
    (el) => {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      const items = el.querySelectorAll('.persp-item');
      gsap.fromTo(items, { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.15, ease: 'power3.out', delay: 0.1 });
    },
    // Slide 5: Transdisciplinary — tags pop in, connections slide up
    (el) => {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      const tags = el.querySelectorAll('.discipline-tag');
      gsap.fromTo(tags, { opacity: 0, scale: 0, rotation: -10 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.4, stagger: 0.06, ease: 'back.out(2)', delay: 0.1 });
      const conns = el.querySelectorAll('.connection-item');
      gsap.fromTo(conns, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out', delay: 0.5 });
    },
    // Slide 6: Implications — cards flip in
    (el) => {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      const items = el.querySelectorAll('.impl-item');
      gsap.fromTo(items, { opacity: 0, rotateY: -30, x: -30 }, { opacity: 1, rotateY: 0, x: 0, duration: 0.6, stagger: 0.12, ease: 'power3.out', delay: 0.15 });
      const thesis = el.querySelector('.slide-thesis');
      if (thesis) gsap.fromTo(thesis, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'elastic.out(1, 0.5)', delay: 0.8 });
    },
    // Slide 7: Advocacy — points count up
    (el) => {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      const points = el.querySelectorAll('.advocacy-point');
      gsap.fromTo(points, { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.5, stagger: 0.15, ease: 'power2.out', delay: 0.15 });
    },
    // Slide 8: Preparing — cards cascade down
    (el) => {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      const items = el.querySelectorAll('.prep-item');
      gsap.fromTo(items, { opacity: 0, y: -30, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.12, ease: 'power2.out', delay: 0.1 });
    },
    // Slide 9: Reflection — thesis pulses, reflections fade in
    (el) => {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      const thesis = el.querySelector('.slide-thesis');
      if (thesis) {
        gsap.fromTo(thesis, { opacity: 0, scale: 0.7, filter: 'blur(10px)' },
          { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 1, ease: 'power3.out', delay: 0.1 });
      }
      const refs = el.querySelectorAll('.reflection-item');
      gsap.fromTo(refs, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.15, ease: 'power2.out', delay: 0.6 });
      const qa = el.querySelector('.slide-qa');
      if (qa) gsap.fromTo(qa, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.4)', delay: 1.2 });
    },
  ];

  // Set all slides to invisible initially
  slides.forEach(s => { s.style.opacity = '0'; });

  // Use IntersectionObserver to trigger animations on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const slide = entry.target;
      const idx = Array.from(slides).indexOf(slide);
      if (idx >= 0 && idx < animations.length) {
        animations[idx](slide);
      } else {
        gsap.fromTo(slide, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
      }
      observer.unobserve(slide);
    });
  }, { root: scrollContainer, threshold: 0.15 });

  slides.forEach(s => observer.observe(s));

  // Trigger first slide immediately (it's already in view)
  if (slides[0]) {
    setTimeout(() => animations[0](slides[0]), 100);
    observer.unobserve(slides[0]);
  }
}

const APP_CONFIG = {
  paper: {
    title: 'Research Paper.exe',
    icon: '\uD83D\uDCC4',
    width: 900,
    height: 640,
    open() {
      const iframe = document.createElement('iframe');
      iframe.src = './research-paper.pdf';
      iframe.style.cssText = 'width:100%;height:100%;border:none;background:#fff;';
      const winEl = wm.createWindow('paper', this.title, this.icon, iframe, { width: 900, height: 640 });
      animateWindowOpen('paper', winEl);
    }
  },
  pres: {
    title: 'Presentation.exe',
    icon: '\uD83C\uDFAC',
    width: 900,
    height: 640,
    open() {
      const panel = document.getElementById('panelPres');
      const winEl = wm.createWindow('pres', this.title, this.icon, panel, { width: 900, height: 640 });
      if (panel) panel.classList.add('open');
      animateWindowOpen('pres', winEl);
      setTimeout(() => animatePresSlides(panel), 400);
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
      const winEl = wm.createWindow('exp', this.title, this.icon, panel, { width: 900, height: 640 });
      if (panel) panel.classList.add('open');
      animateWindowOpen('exp', winEl);
    }
  },
  explorer: {
    title: 'My Computer',
    icon: '\uD83D\uDCBE',
    width: 520,
    height: 380,
    open() {
      const container = document.createElement('div');
      container.style.cssText = 'display:flex;height:100%;background:#fff;';

      // Left panel — tree
      const treePanel = document.createElement('div');
      treePanel.style.cssText = 'width:140px;border-right:2px solid #808080;overflow-y:auto;flex-shrink:0;';

      const treeItems = [
        { icon: '\uD83D\uDCC1', label: 'Research Paper', key: 'paper' },
        { icon: '\uD83D\uDCC1', label: 'Presentation', key: 'pres' },
        { icon: '\uD83D\uDCC1', label: '/Sources', key: 'sources' },
        { icon: '\uD83D\uDCC1', label: 'About Me', key: 'about' },
      ];

      const folderContents = {
        paper: 'research-paper.md -- 13,455 words, 35 APA sources\nTopics: GPU history, local AI, democratization, cloud disruption',
        pres: 'presentation.html -- 8 sections\nRubric: Design, Prepare, Create, Communicate, Reflect',
        sources: '35 APA sources including:\n- Krizhevsky et al. (2012) AlexNet\n- Vaswani et al. (2017) Attention Is All You Need\n- Dettmers et al. (2022) LLM.int8()\n- Hu et al. (2021) LoRA\n- ... and 31 more',
        about: 'Josue Aparcedo Gonzalez\nIDS2891 Cornerstone\nFSW College, Spring 2026\nInterests: Local AI, hardware democratization\nHardware: RTX 4070 Ti SUPER, Ollama',
      };

      // Right panel — content viewer
      const contentPanel = document.createElement('div');
      contentPanel.id = 'explorerContent';
      contentPanel.textContent = 'Select a folder to view files.';

      treeItems.forEach(item => {
        const row = document.createElement('div');
        row.className = 'tree-item';
        row.textContent = item.icon + ' ' + item.label;
        row.addEventListener('click', () => {
          contentPanel.textContent = folderContents[item.key] || 'No content available.';
        });
        treePanel.appendChild(row);
      });

      container.appendChild(treePanel);
      container.appendChild(contentPanel);

      const winEl = wm.createWindow('explorer', this.title, this.icon, container, { width: 520, height: 380 });
      animateWindowOpen('explorer', winEl);
    }
  },
  terminal: {
    title: 'Terminal.exe',
    icon: '\u2328\uFE0F',
    width: 560,
    height: 400,
    open() {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'background:#000;height:100%;display:flex;flex-direction:column;padding:8px;font-family:"Space Mono",monospace;font-size:12px;color:#33ff33;overflow:hidden;';

      const output = document.createElement('pre');
      output.id = 'termOutput';
      output.style.cssText = 'flex:1;overflow-y:auto;white-space:pre-wrap;word-break:break-word;margin-bottom:8px;';
      output.textContent = 'C:\\RESEARCH> ' + '\n\nFrom Pixels to Intelligence OS [Version 2.026.04]\n(C) 2026 Josue Aparcedo Gonzalez. All Rights Reserved.\n\nType \'help\' for available commands.\n\nC:\\RESEARCH> ';

      const inputRow = document.createElement('div');
      inputRow.style.cssText = 'display:flex;align-items:center;gap:4px;';

      const prompt = document.createElement('span');
      prompt.textContent = 'C:\\RESEARCH> ';
      prompt.style.cssText = 'color:#33ff33;white-space:nowrap;font-family:"Space Mono",monospace;font-size:12px;';

      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'termInput';
      input.style.cssText = 'background:transparent;border:none;outline:none;color:#33ff33;font-family:"Space Mono",monospace;font-size:12px;flex:1;caret-color:#33ff33;';
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('spellcheck', 'false');

      inputRow.appendChild(prompt);
      inputRow.appendChild(input);
      wrap.appendChild(output);
      wrap.appendChild(inputRow);

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const cmd = input.value.trim().toLowerCase();
          input.value = '';
          runTerminalCommand(cmd, output);
        }
      });

      // Focus input when window is clicked
      wrap.addEventListener('click', () => input.focus());

      const winEl = wm.createWindow('terminal', this.title, this.icon, wrap, { width: 560, height: 400 });
      animateWindowOpen('terminal', winEl);
      // Auto-focus after window creation
      setTimeout(() => input.focus(), 100);
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
      ta.textContent = 'FROM PIXELS TO INTELLIGENCE\n============================\nBy Josue Aparcedo Gonzalez\nIDS2891 Cornerstone, Spring 2026\n\nThanks for exploring this project.\nThis entire website was built with\nLocal AI + Three.js + GSAP.\n\nResearch: 13,455 words, 35 APA sources\nTopic: Local AI democratization\n\nFun fact: The GPU rendering this\nretro OS is the same type of hardware\nthis paper argues will obsolete the cloud.\n\n-- J.A.G.';
      div.appendChild(ta);

      const noteWinEl = wm.createWindow('notepad', this.title, this.icon, div, { width: 480, height: 380 });
      animateWindowOpen('notepad', noteWinEl);
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

      const recycleWinEl = wm.createWindow('recycle', this.title, this.icon, div, { width: 440, height: 340 });
      animateWindowOpen('recycle', recycleWinEl);
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
// RESIZE + PARTICLE ANIMATION LOOP
// ═══════════════════════════════════════════════════
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
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
