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

  // End: at the chair, eye height, looking at desk
  camEnd.set(chair.x, chair.y + 1.5, chair.z);
  lookEnd.set(desk.x, desk.y + 0.5, desk.z);

  // Start: pulled back from chair (away from desk)
  const dx = chair.x - desk.x;
  const dz = chair.z - desk.z;
  const len = Math.sqrt(dx*dx + dz*dz) || 1;
  camStart.set(chair.x + (dx/len)*5, chair.y + 3, chair.z + (dz/len)*5);
  lookStart.set(desk.x, desk.y, desk.z);

  console.log('Camera: chair→desk, start:', camStart.x.toFixed(1), camStart.y.toFixed(1), camStart.z.toFixed(1));
  camera.position.copy(camStart);

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

function showDesktop() {
  state.phase = 'desktop';
  desktop.classList.add('visible');
  document.getElementById('hud').classList.remove('visible');
}

// Desktop icon clicks
document.querySelectorAll('.desktop-icon').forEach(icon => {
  icon.addEventListener('dblclick', () => {
    const target = icon.dataset.open;
    if (target) {
      const panel = document.getElementById(target);
      if (panel) {
        panel.classList.add('open');
        panel.style.pointerEvents = 'auto';
        desktop.classList.remove('visible');

        // GSAP animations
        if (typeof gsap !== 'undefined') {
          const sections = panel.querySelectorAll('.paper-section, .pres-slide, .arch-demo, .pioneers-grid, .exp-stat, .paper-abstract, .paper-timeline, .slide-implications, .slide-connections, .slide-advocacy-points');
          if (sections.length > 0) {
            gsap.fromTo(sections, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, delay: 0.3, ease: 'power2.out' });
          }
          const header = panel.querySelector('.panel-header, .pres-header');
          if (header) gsap.fromTo(header, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
        }

        if (target === 'panelExp') animateCounters();
      }
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

// Close panel → back to desktop
window.closePanel = function() {
  document.querySelectorAll('.panel.open').forEach(p => {
    p.classList.remove('open');
    p.style.pointerEvents = 'none';
  });
  desktop.classList.add('visible');
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
      showDesktop();
    }
  }

  composer.render();
}

animate();
