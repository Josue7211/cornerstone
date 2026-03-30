import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

// ─── Chromatic Aberration Shader ───
const ChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    offset: { value: new THREE.Vector2(0.002, 0.002) }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 offset;
    varying vec2 vUv;
    void main() {
      vec4 cr = texture2D(tDiffuse, vUv + offset);
      vec4 cg = texture2D(tDiffuse, vUv);
      vec4 cb = texture2D(tDiffuse, vUv - offset);
      gl_FragColor = vec4(cr.r, cg.g, cb.b, cg.a);
    }
  `
};

// ─── State ───
const state = {
  keys: {},
  playerPos: { x: 0, z: 0 },
  speed: 0.06, // User feedback: 0.12 was too fast
  activePanel: null,
  loaded: false,
  portalProximity: { paper: false, pres: false, exp: false }
};

// ─── Portal positions (world coords) ───
const PORTALS = {
  paper:  { x: 0,   z: -8,  color: 0x00f0ff, panel: 'panelPaper', label: 'labelPaper' },
  pres:   { x: -7,  z: 5,   color: 0xff00aa, panel: 'panelPres',  label: 'labelPres' },
  exp:    { x: 7,   z: 5,   color: 0x00ff88, panel: 'panelExp',   label: 'labelExp' }
};
const PORTAL_RADIUS = 2.2;
const BOUNDARY = 12;

// ─── Renderer ───
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x030308);
renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8;

// ─── Scene + Camera ───
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x030308, 0.018);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 8, 8);
camera.lookAt(0, 0, 0);

// ─── EffectComposer: Bloom + Chromatic Aberration ───
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.8,   // strength
  0.4,   // radius
  0.85   // threshold
);
composer.addPass(bloomPass);

const chromaPass = new ShaderPass(ChromaticAberrationShader);
chromaPass.renderToScreen = true;
composer.addPass(chromaPass);

// ─── Lights ───
const ambientLight = new THREE.AmbientLight(0x222244, 0.8);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0x4444ff, 0.4);
mainLight.position.set(5, 15, 5);
scene.add(mainLight);

// Point lights at portals
Object.values(PORTALS).forEach(p => {
  const light = new THREE.PointLight(p.color, 2.5, 18);
  light.position.set(p.x, 3, p.z);
  scene.add(light);
});

// ─── HDRI Environment Map ───
const hdrLoader = new RGBELoader();
hdrLoader.load('./assets/hdri/night_sky.hdr', (texture) => {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envMap = pmrem.fromEquirectangular(texture).texture;
  scene.environment = envMap;
  // Don't set scene.background — keep dark void look, HDRI only for reflections
  texture.dispose();
  pmrem.dispose();
}, undefined, (err) => {
  console.warn('HDR load failed, using ambient light fallback', err);
});

// ─── Ground ───
const groundGeo = new THREE.PlaneGeometry(30, 30);
const groundMat = new THREE.MeshStandardMaterial({
  color: 0x080812,
  roughness: 0.9,
  metalness: 0.1
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// ─── Grid lines on ground ───
const gridHelper = new THREE.GridHelper(30, 30, 0x111133, 0x0a0a1a);
gridHelper.position.y = 0.01;
scene.add(gridHelper);

// ─── Player (glowing capsule) ───
const playerGeo = new THREE.CapsuleGeometry(0.25, 0.5, 4, 8);
const playerMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  emissive: 0xffffff,
  emissiveIntensity: 0.8
});
const player = new THREE.Mesh(playerGeo, playerMat);
player.position.y = 0.5;
player.castShadow = true;
scene.add(player);

// Player glow
const playerLight = new THREE.PointLight(0xffffff, 0.6, 5);
playerLight.position.y = 1;
player.add(playerLight);

// ─── Portal structures ───
const portalMeshes = {};
Object.entries(PORTALS).forEach(([key, p]) => {
  const group = new THREE.Group();
  group.position.set(p.x, 0, p.z);

  // Base ring
  const ringGeo = new THREE.TorusGeometry(1.2, 0.08, 8, 32);
  const ringMat = new THREE.MeshStandardMaterial({
    color: p.color,
    emissive: p.color,
    emissiveIntensity: 0.6
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.05;
  group.add(ring);

  // Vertical beam
  const beamGeo = new THREE.CylinderGeometry(0.03, 0.03, 6, 8);
  const beamMat = new THREE.MeshBasicMaterial({ color: p.color, transparent: true, opacity: 0.3 });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.y = 3;
  group.add(beam);

  // Floating crystal
  const crystalGeo = new THREE.OctahedronGeometry(0.4, 0);
  const crystalMat = new THREE.MeshStandardMaterial({
    color: p.color,
    emissive: p.color,
    emissiveIntensity: 1.0,
    wireframe: false
  });
  const crystal = new THREE.Mesh(crystalGeo, crystalMat);
  crystal.position.y = 2.5;
  group.add(crystal);

  // Inner glow disc
  const discGeo = new THREE.CircleGeometry(1.0, 32);
  const discMat = new THREE.MeshBasicMaterial({
    color: p.color,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide
  });
  const disc = new THREE.Mesh(discGeo, discMat);
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.02;
  group.add(disc);

  scene.add(group);
  portalMeshes[key] = { group, crystal, ring, beam };
});

// ─── Decorative buildings (cyberpunk pillars) ───
const pillarPositions = [
  [-10, -10], [-10, 0], [-10, 10], [10, -10], [10, 0], [10, 10],
  [-5, -10], [5, -10], [-5, 10], [5, 10],
  [-12, -5], [12, -5], [-12, 5], [12, 5]
];
pillarPositions.forEach(([x, z]) => {
  const h = 2 + Math.random() * 6;
  const geo = new THREE.BoxGeometry(0.5 + Math.random() * 0.8, h, 0.5 + Math.random() * 0.8);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x0a0a18,
    emissive: 0x111133,
    emissiveIntensity: 0.2,
    roughness: 0.8
  });
  const pillar = new THREE.Mesh(geo, mat);
  pillar.position.set(x, h / 2, z);
  pillar.castShadow = true;
  scene.add(pillar);

  // Neon strip on some pillars
  if (Math.random() > 0.4) {
    const stripGeo = new THREE.BoxGeometry(0.02, h * 0.6, 0.02);
    const colors = [0x00f0ff, 0xff00aa, 0x00ff88, 0x4444ff];
    const stripMat = new THREE.MeshBasicMaterial({
      color: colors[Math.floor(Math.random() * colors.length)]
    });
    const strip = new THREE.Mesh(stripGeo, stripMat);
    strip.position.set(x + 0.3, h * 0.4, z + 0.3);
    scene.add(strip);
  }
});

// ─── Particles (floating dust) ───
const particleCount = 200;
const particleGeo = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  particlePositions[i * 3] = (Math.random() - 0.5) * 30;
  particlePositions[i * 3 + 1] = Math.random() * 8;
  particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 30;
}
particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
const particleMat = new THREE.PointsMaterial({
  color: 0x4444aa,
  size: 0.06,
  transparent: true,
  opacity: 0.6
});
const particles = new THREE.Points(particleGeo, particleMat);
scene.add(particles);

// ─── Input ───
document.addEventListener('keydown', e => { state.keys[e.key.toLowerCase()] = true; });
document.addEventListener('keyup', e => { state.keys[e.key.toLowerCase()] = false; });

// ─── GLTF Scene Loading with Real Progress Bar ───
const gltfLoader = new GLTFLoader();
const loaderFill = document.getElementById('loaderFill');
const loaderText = document.getElementById('loaderText');
const loaderPct = document.getElementById('loaderPct');

gltfLoader.load(
  './assets/models/cyberpunk-scene/scene.gltf',
  (gltf) => {
    const model = gltf.scene;
    // Auto-scale: measure the model, then fit it to ~30 units across the lobby
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 30; // lobby is ~30 units
    const scaleFactor = targetSize / maxDim;
    model.scale.setScalar(scaleFactor);
    // Re-center after scaling
    const scaledBox = new THREE.Box3().setFromObject(model);
    const center = scaledBox.getCenter(new THREE.Vector3());
    model.position.set(-center.x, -scaledBox.min.y, -center.z);
    scene.add(model);
    console.log('GLTF loaded — scale:', scaleFactor.toFixed(4), 'size:', size);

    // Fade out loader after scene is ready
    setTimeout(() => {
      document.getElementById('loader').classList.add('done');
      document.getElementById('hud').classList.add('visible');
      state.loaded = true;
    }, 400);
  },
  (progress) => {
    if (progress.total > 0) {
      const pct = Math.round((progress.loaded / progress.total) * 100);
      loaderFill.style.width = pct + '%';
      loaderPct.textContent = pct + '%';
      if (pct < 30) loaderText.textContent = 'LOADING CYBERPUNK ENVIRONMENT...';
      else if (pct < 60) loaderText.textContent = 'COMPILING SHADER PROGRAMS...';
      else if (pct < 90) loaderText.textContent = 'INITIALIZING NEURAL PATHWAYS...';
      else loaderText.textContent = 'ENTERING THE GRID...';
    }
  },
  (error) => {
    console.error('GLTF load failed:', error);
    loaderText.textContent = 'LOAD ERROR — CHECK CONSOLE';
    // Still let user in — show the lobby with primitives
    setTimeout(() => {
      document.getElementById('loader').classList.add('done');
      document.getElementById('hud').classList.add('visible');
      state.loaded = true;
    }, 1000);
  }
);

// ─── Panel management ───
function openPanel(key) {
  const portal = PORTALS[key];
  const panel = document.getElementById(portal.panel);
  panel.classList.add('open');
  panel.style.pointerEvents = 'auto';
  state.activePanel = key;
  document.getElementById('hud').classList.remove('visible');

  // GSAP: animate content in after panel opens
  if (typeof gsap !== 'undefined') {
    const sections = panel.querySelectorAll('.paper-section, .pres-slide, .arch-demo, .pioneers-grid, .exp-stat, .paper-abstract, .paper-timeline, .slide-implications, .slide-connections, .slide-advocacy-points');
    if (sections.length > 0) {
      gsap.fromTo(sections,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, delay: 0.3, ease: 'power2.out' }
      );
    }
    // Also animate the panel header
    const header = panel.querySelector('.panel-header, .pres-header');
    if (header) {
      gsap.fromTo(header,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }
  }

  // Animate stat counters when Experience panel opens
  if (key === 'exp') {
    animateCounters();
  }
}

// ─── Stat counter animation ───
function animateCounters() {
  if (typeof gsap === 'undefined') return;
  document.querySelectorAll('.exp-stat-num[data-target]').forEach(el => {
    const target = parseFloat(el.dataset.target);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const isDecimal = target % 1 !== 0;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 2,
      delay: 0.5,
      ease: 'power2.out',
      onUpdate: function() {
        const display = isDecimal ? obj.val.toFixed(1) : Math.round(obj.val).toString();
        el.textContent = prefix + display + suffix;
      }
    });
  });
}

window.closePanel = function() {
  if (!state.activePanel) return;
  const portal = PORTALS[state.activePanel];
  const panel = document.getElementById(portal.panel);
  panel.classList.remove('open');
  panel.style.pointerEvents = 'none';
  state.activePanel = null;
  // Move player back from portal so they don't re-trigger
  state.playerPos.x *= 0.7;
  state.playerPos.z *= 0.7;
  player.position.x = state.playerPos.x;
  player.position.z = state.playerPos.z;
  document.getElementById('hud').classList.add('visible');
};

// Wire close buttons (use IDs, not onclick — we're in a module)
document.getElementById('closePanelBtn').addEventListener('click', window.closePanel);
document.getElementById('closePanelPres').addEventListener('click', window.closePanel);
document.getElementById('closePanelExp').addEventListener('click', window.closePanel);

// ESC to close
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && state.activePanel) window.closePanel();
});

// ─── Pioneer click handler ───
document.querySelectorAll('.pioneer').forEach(el => {
  el.addEventListener('click', () => {
    const info = document.getElementById('pioneerInfo');
    info.textContent = el.dataset.info;
    info.style.borderColor = 'var(--green)';
    info.style.color = 'var(--text)';
  });
});

// ─── Architecture demo ───
document.getElementById('runBtn').addEventListener('click', function runArchDemo() {
  const cpuGrid = document.getElementById('cpuGrid');
  const gpuGrid = document.getElementById('gpuGrid');
  const cpuTime = document.getElementById('cpuTime');
  const gpuTime = document.getElementById('gpuTime');

  // Reset
  while (cpuGrid.firstChild) cpuGrid.removeChild(cpuGrid.firstChild);
  while (gpuGrid.firstChild) gpuGrid.removeChild(gpuGrid.firstChild);
  cpuTime.textContent = '\u2014';
  gpuTime.textContent = '\u2014';

  const totalTasks = 64;
  for (let i = 0; i < 8; i++) {
    const cell = document.createElement('div');
    cell.className = 'arch-cell';
    cell.style.width = '32px';
    cell.style.height = '32px';
    cpuGrid.appendChild(cell);
  }
  for (let i = 0; i < 256; i++) {
    const cell = document.createElement('div');
    cell.className = 'arch-cell';
    cell.style.width = '14px';
    cell.style.height = '14px';
    gpuGrid.appendChild(cell);
  }

  const cpuCells = cpuGrid.querySelectorAll('.arch-cell');
  const gpuCells = gpuGrid.querySelectorAll('.arch-cell');
  let cpuDone = 0;
  const cpuStart = performance.now();

  const cpuInterval = setInterval(() => {
    const batch = Math.min(8, totalTasks - cpuDone);
    cpuCells.forEach(c => c.classList.remove('active-cpu'));
    for (let i = 0; i < batch; i++) {
      if (cpuCells[i]) cpuCells[i].classList.add('active-cpu');
    }
    cpuDone += batch;
    cpuTime.textContent = ((performance.now() - cpuStart) / 1000).toFixed(2) + 's';
    if (cpuDone >= totalTasks) {
      clearInterval(cpuInterval);
      cpuCells.forEach(c => c.classList.remove('active-cpu'));
      cpuTime.textContent += ' \u2713';
    }
  }, 400);

  // GPU: all tasks light up nearly instantly
  setTimeout(() => {
    const gpuStart = performance.now();
    for (let i = 0; i < Math.min(totalTasks, 256); i++) {
      setTimeout(() => {
        if (gpuCells[i]) gpuCells[i].classList.add('active-gpu');
        if (i === totalTasks - 1) {
          gpuTime.textContent = ((performance.now() - gpuStart) / 1000).toFixed(2) + 's \u2713';
        }
      }, i * 3);
    }
  }, 100);
});

// ─── Resize ───
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// ─── Animation Loop ───
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();

  if (!state.loaded || state.activePanel) {
    composer.render();
    return;
  }

  // ── Player movement ──
  let dx = 0, dz = 0;
  if (state.keys['w'] || state.keys['arrowup']) dz -= 1;
  if (state.keys['s'] || state.keys['arrowdown']) dz += 1;
  if (state.keys['a'] || state.keys['arrowleft']) dx -= 1;
  if (state.keys['d'] || state.keys['arrowright']) dx += 1;

  if (dx !== 0 || dz !== 0) {
    const len = Math.sqrt(dx * dx + dz * dz);
    dx /= len;
    dz /= len;
    state.playerPos.x += dx * state.speed;
    state.playerPos.z += dz * state.speed;

    // Boundary clamp
    state.playerPos.x = Math.max(-BOUNDARY, Math.min(BOUNDARY, state.playerPos.x));
    state.playerPos.z = Math.max(-BOUNDARY, Math.min(BOUNDARY, state.playerPos.z));
  }

  player.position.x = state.playerPos.x;
  player.position.z = state.playerPos.z;
  player.position.y = 0.5 + Math.sin(elapsed * 3) * 0.05; // subtle bob

  // ── Camera follow ──
  const camTargetX = state.playerPos.x * 0.6;
  const camTargetZ = state.playerPos.z * 0.6 + 8;
  camera.position.x += (camTargetX - camera.position.x) * 0.05;
  camera.position.z += (camTargetZ - camera.position.z) * 0.05;
  camera.lookAt(state.playerPos.x, 0, state.playerPos.z);

  // ── Minimap ──
  const mmDot = document.getElementById('minimapDot');
  const mmX = 50 + (state.playerPos.x / BOUNDARY) * 40;
  const mmY = 50 + (state.playerPos.z / BOUNDARY) * 40;
  mmDot.style.left = mmX + '%';
  mmDot.style.top = mmY + '%';

  // ── Portal proximity & labels ──
  Object.entries(PORTALS).forEach(([key, p]) => {
    const dist = Math.sqrt(
      Math.pow(state.playerPos.x - p.x, 2) +
      Math.pow(state.playerPos.z - p.z, 2)
    );

    const label = document.getElementById(p.label);
    const mesh = portalMeshes[key];

    // Crystal animation
    mesh.crystal.rotation.y = elapsed * 1.5;
    mesh.crystal.position.y = 2.5 + Math.sin(elapsed * 2 + key.length) * 0.3;

    // Ring pulse
    const pulseScale = 1 + Math.sin(elapsed * 3) * 0.05;
    mesh.ring.scale.set(pulseScale, pulseScale, pulseScale);

    if (dist < 4) {
      // Show label — project 3D position to screen
      const vec = new THREE.Vector3(p.x, 3.5, p.z);
      vec.project(camera);
      const screenX = (vec.x * 0.5 + 0.5) * window.innerWidth;
      const screenY = (-vec.y * 0.5 + 0.5) * window.innerHeight;
      label.style.left = screenX + 'px';
      label.style.top = screenY + 'px';
      label.classList.add('visible');
    } else {
      label.classList.remove('visible');
    }

    // Enter portal
    if (dist < PORTAL_RADIUS && !state.portalProximity[key]) {
      state.portalProximity[key] = true;
      openPanel(key);
    }
    if (dist >= PORTAL_RADIUS + 1) {
      state.portalProximity[key] = false;
    }
  });

  // ── Particle drift ──
  const positions = particles.geometry.attributes.position.array;
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3 + 1] += 0.003;
    if (positions[i * 3 + 1] > 8) positions[i * 3 + 1] = 0;
  }
  particles.geometry.attributes.position.needsUpdate = true;

  composer.render();
}

animate();
