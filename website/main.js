import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// ─── State ───
const state = {
  keys: {},
  activePanel: null,
  loaded: false,
  portalProximity: { paper: false, pres: false, exp: false },
  moveSpeed: 8,
  direction: new THREE.Vector3()
};

// ─── Portal positions ───
const PORTALS = {
  paper: { x: 0,   z: -12, color: 0x00f0ff, panel: 'panelPaper', label: 'labelPaper' },
  pres:  { x: -10, z: 8,   color: 0xff00aa, panel: 'panelPres',  label: 'labelPres' },
  exp:   { x: 10,  z: 8,   color: 0x00ff88, panel: 'panelExp',   label: 'labelExp' }
};
const PORTAL_RADIUS = 2.5;
const BOUNDARY = 18;

// ─── Renderer ───
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x020206);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// ─── Scene + Camera ───
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x020206, 0.025);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 1.7, 0);

// ─── PointerLock FPS Controls ───
const controls = new PointerLockControls(camera, document.body);

document.getElementById('hud').addEventListener('click', () => {
  if (state.loaded && !state.activePanel) controls.lock();
});

controls.addEventListener('lock', () => {
  const el = document.getElementById('hudControls');
  el.textContent = '';
  const s1 = document.createElement('span');
  s1.textContent = 'WASD TO MOVE \u00B7 MOUSE TO LOOK';
  const s2 = document.createElement('span');
  s2.textContent = 'WALK INTO A GLOWING PORTAL';
  el.appendChild(s1);
  el.appendChild(s2);
});
controls.addEventListener('unlock', () => {
  if (!state.activePanel) {
    const el = document.getElementById('hudControls');
    el.textContent = '';
    const s = document.createElement('span');
    s.textContent = 'CLICK TO START';
    el.appendChild(s);
  }
});

// ─── EffectComposer: Bloom only ───
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.6, 0.4, 0.9
);
composer.addPass(bloomPass);

// ─── Lights ───
scene.add(new THREE.AmbientLight(0x334466, 0.4));
const mainLight = new THREE.DirectionalLight(0x8888ff, 0.3);
mainLight.position.set(10, 20, 10);
mainLight.castShadow = true;
scene.add(mainLight);

Object.values(PORTALS).forEach(p => {
  const light = new THREE.PointLight(p.color, 3, 20);
  light.position.set(p.x, 3, p.z);
  scene.add(light);
});

// ─── HDRI ───
new RGBELoader().load('./assets/hdri/night_sky.hdr', (tex) => {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envMap = pmrem.fromEquirectangular(tex).texture;
  scene.environment = envMap;
  tex.dispose();
  pmrem.dispose();
});

// ─── Floor ───
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.3, metalness: 0.7 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const grid = new THREE.GridHelper(50, 50, 0x222244, 0x111133);
grid.position.y = 0.01;
scene.add(grid);

// ─── Portal structures ───
const portalMeshes = {};
Object.entries(PORTALS).forEach(([key, p]) => {
  const group = new THREE.Group();
  group.position.set(p.x, 0, p.z);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.5, 0.1, 16, 64),
    new THREE.MeshStandardMaterial({ color: p.color, emissive: p.color, emissiveIntensity: 1.0 })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.1;
  group.add(ring);

  const ring2 = new THREE.Mesh(
    new THREE.TorusGeometry(1.0, 0.05, 8, 32),
    new THREE.MeshStandardMaterial({ color: p.color, emissive: p.color, emissiveIntensity: 0.5 })
  );
  ring2.rotation.x = -Math.PI / 2;
  ring2.position.y = 0.05;
  group.add(ring2);

  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 8, 8),
    new THREE.MeshBasicMaterial({ color: p.color, transparent: true, opacity: 0.4 })
  );
  beam.position.y = 4;
  group.add(beam);

  const crystal = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.5, 0),
    new THREE.MeshStandardMaterial({ color: p.color, emissive: p.color, emissiveIntensity: 1.5 })
  );
  crystal.position.y = 3;
  group.add(crystal);

  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(1.5, 32),
    new THREE.MeshBasicMaterial({ color: p.color, transparent: true, opacity: 0.15, side: THREE.DoubleSide })
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.02;
  group.add(disc);

  scene.add(group);
  portalMeshes[key] = { group, crystal, ring };
});

// ─── Particles ───
const particleCount = 500;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  pPos[i * 3] = (Math.random() - 0.5) * 50;
  pPos[i * 3 + 1] = Math.random() * 12;
  pPos[i * 3 + 2] = (Math.random() - 0.5) * 50;
}
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
  color: 0x6666cc, size: 0.05, transparent: true, opacity: 0.5
}));
scene.add(particles);

// ─── Load GLTF modular pieces ───
const gltfLoader = new GLTFLoader();
const loaderFill = document.getElementById('loaderFill');
const loaderText = document.getElementById('loaderText');
const loaderPct = document.getElementById('loaderPct');

const SCIFI_BASE = './assets/models/quaternius-scifi/Modular SciFi MegaKit[Standard]/glTF';

let loadedCount = 0;
const totalToLoad = 25;

function updateLoadBar() {
  loadedCount++;
  const pct = Math.min(99, Math.round((loadedCount / totalToLoad) * 100));
  loaderFill.style.width = pct + '%';
  loaderPct.textContent = pct + '%';
  if (pct < 40) loaderText.textContent = 'LOADING SCI-FI MODULES...';
  else if (pct < 70) loaderText.textContent = 'ASSEMBLING CORRIDOR...';
  else loaderText.textContent = 'INITIALIZING NEURAL PATHWAYS...';
}

function placeModel(url, pos, rot, scale) {
  rot = rot || 0;
  scale = scale || 1;
  return new Promise((resolve) => {
    gltfLoader.load(url, (gltf) => {
      const m = gltf.scene;
      m.position.set(pos.x, pos.y || 0, pos.z);
      m.rotation.y = rot;
      m.scale.setScalar(scale);
      m.traverse(child => {
        if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
      });
      scene.add(m);
      updateLoadBar();
      resolve(m);
    }, undefined, () => { updateLoadBar(); resolve(null); });
  });
}

async function buildHub() {
  const S = 2.0;
  const promises = [];

  // Walls around perimeter
  for (let x = -12; x <= 12; x += 4) {
    promises.push(placeModel(SCIFI_BASE + '/Walls/BottomMetal_Straight.gltf', { x, y: 0, z: -16 }, 0, S));
  }
  for (let z = -16; z <= 12; z += 4) {
    promises.push(placeModel(SCIFI_BASE + '/Walls/BottomMetal_Straight.gltf', { x: -14, y: 0, z }, Math.PI / 2, S));
    promises.push(placeModel(SCIFI_BASE + '/Walls/BottomMetal_Straight.gltf', { x: 14, y: 0, z }, -Math.PI / 2, S));
  }
  for (let x = -12; x <= 12; x += 4) {
    if (Math.abs(x) > 2) {
      promises.push(placeModel(SCIFI_BASE + '/Walls/BottomMetal_Straight.gltf', { x, y: 0, z: 12 }, Math.PI, S));
    }
  }

  // Door frames at portals
  promises.push(placeModel(SCIFI_BASE + '/Platforms/Door_Frame_SquareTall.gltf', { x: 0, y: 0, z: -14 }, 0, S));
  promises.push(placeModel(SCIFI_BASE + '/Platforms/Door_Frame_SquareTall.gltf', { x: -12, y: 0, z: 8 }, Math.PI / 2, S));
  promises.push(placeModel(SCIFI_BASE + '/Platforms/Door_Frame_SquareTall.gltf', { x: 12, y: 0, z: 8 }, -Math.PI / 2, S));

  // Props
  const props = [
    ['Props/Prop_Computer.gltf', { x: -8, z: -10 }, 0.5],
    ['Props/Prop_Computer.gltf', { x: 6, z: -8 }, -0.3],
    ['Props/Prop_Barrel_Large.gltf', { x: -5, z: 3 }, 0],
    ['Props/Prop_Barrel_Large.gltf', { x: 8, z: -3 }, 1.2],
    ['Props/Prop_Crate3.gltf', { x: -3, z: 6 }, 0.7],
    ['Props/Prop_Crate3.gltf', { x: 5, z: -5 }, 2.1],
    ['Props/Prop_Chest.gltf', { x: -10, z: -4 }, 0],
    ['Props/Prop_AccessPoint.gltf', { x: 0, z: 4 }, 0],
  ];
  for (const [url, pos, rot] of props) {
    promises.push(placeModel(SCIFI_BASE + '/' + url, pos, rot, S));
  }

  // Columns
  for (const c of [{ x: -6, z: -6 }, { x: 6, z: -6 }, { x: -6, z: 4 }, { x: 6, z: 4 }]) {
    promises.push(placeModel(SCIFI_BASE + '/Columns/Column_Metal_A.gltf', c, 0, S));
  }

  await Promise.all(promises);

  loaderFill.style.width = '100%';
  loaderPct.textContent = '100%';
  loaderText.textContent = 'ENTERING THE GRID...';
  setTimeout(() => {
    document.getElementById('loader').classList.add('done');
    document.getElementById('hud').classList.add('visible');
    state.loaded = true;
  }, 500);
}

buildHub();

// ─── Input ───
document.addEventListener('keydown', e => { state.keys[e.code] = true; });
document.addEventListener('keyup', e => { state.keys[e.code] = false; });

// ─── Panel management ───
function openPanel(key) {
  controls.unlock();
  const portal = PORTALS[key];
  const panel = document.getElementById(portal.panel);
  panel.classList.add('open');
  panel.style.pointerEvents = 'auto';
  state.activePanel = key;
  document.getElementById('hud').classList.remove('visible');

  if (typeof gsap !== 'undefined') {
    const sections = panel.querySelectorAll('.paper-section, .pres-slide, .arch-demo, .pioneers-grid, .exp-stat, .paper-abstract, .paper-timeline, .slide-implications, .slide-connections, .slide-advocacy-points');
    if (sections.length > 0) {
      gsap.fromTo(sections, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, delay: 0.3, ease: 'power2.out' });
    }
    const header = panel.querySelector('.panel-header, .pres-header');
    if (header) gsap.fromTo(header, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' });
  }
  if (key === 'exp') animateCounters();
}

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

window.closePanel = function() {
  if (!state.activePanel) return;
  const portal = PORTALS[state.activePanel];
  document.getElementById(portal.panel).classList.remove('open');
  document.getElementById(portal.panel).style.pointerEvents = 'none';
  state.activePanel = null;
  document.getElementById('hud').classList.add('visible');
  // Push back from portal
  const p = portal;
  const dx = camera.position.x - p.x;
  const dz = camera.position.z - p.z;
  const len = Math.sqrt(dx * dx + dz * dz) || 1;
  camera.position.x += (dx / len) * 3;
  camera.position.z += (dz / len) * 3;
  Object.keys(state.portalProximity).forEach(k => { state.portalProximity[k] = false; });
};

document.getElementById('closePanelBtn').addEventListener('click', window.closePanel);
document.getElementById('closePanelPres').addEventListener('click', window.closePanel);
document.getElementById('closePanelExp').addEventListener('click', window.closePanel);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && state.activePanel) window.closePanel();
});

// Pioneer click
document.querySelectorAll('.pioneer').forEach(el => {
  el.addEventListener('click', () => {
    const info = document.getElementById('pioneerInfo');
    info.textContent = el.dataset.info;
    info.style.borderColor = 'var(--green)';
    info.style.color = 'var(--text)';
  });
});

// Arch demo
document.getElementById('runBtn').addEventListener('click', function() {
  const cpuGrid = document.getElementById('cpuGrid');
  const gpuGrid = document.getElementById('gpuGrid');
  const cpuTime = document.getElementById('cpuTime');
  const gpuTime = document.getElementById('gpuTime');
  while (cpuGrid.firstChild) cpuGrid.removeChild(cpuGrid.firstChild);
  while (gpuGrid.firstChild) gpuGrid.removeChild(gpuGrid.firstChild);
  cpuTime.textContent = '\u2014'; gpuTime.textContent = '\u2014';
  const totalTasks = 64;
  for (let i = 0; i < 8; i++) { const c = document.createElement('div'); c.className = 'arch-cell'; c.style.cssText = 'width:32px;height:32px'; cpuGrid.appendChild(c); }
  for (let i = 0; i < 256; i++) { const c = document.createElement('div'); c.className = 'arch-cell'; c.style.cssText = 'width:14px;height:14px'; gpuGrid.appendChild(c); }
  const cpuCells = cpuGrid.querySelectorAll('.arch-cell');
  const gpuCells = gpuGrid.querySelectorAll('.arch-cell');
  let cpuDone = 0; const cpuStart = performance.now();
  const cpuInterval = setInterval(() => {
    const batch = Math.min(8, totalTasks - cpuDone);
    cpuCells.forEach(c => c.classList.remove('active-cpu'));
    for (let i = 0; i < batch; i++) { if (cpuCells[i]) cpuCells[i].classList.add('active-cpu'); }
    cpuDone += batch; cpuTime.textContent = ((performance.now() - cpuStart) / 1000).toFixed(2) + 's';
    if (cpuDone >= totalTasks) { clearInterval(cpuInterval); cpuCells.forEach(c => c.classList.remove('active-cpu')); cpuTime.textContent += ' \u2713'; }
  }, 400);
  setTimeout(() => {
    const gpuStart = performance.now();
    for (let i = 0; i < Math.min(totalTasks, 256); i++) {
      setTimeout(() => { if (gpuCells[i]) gpuCells[i].classList.add('active-gpu'); if (i === totalTasks - 1) gpuTime.textContent = ((performance.now() - gpuStart) / 1000).toFixed(2) + 's \u2713'; }, i * 3);
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
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  if (!state.loaded || state.activePanel) { composer.render(); return; }

  // FPS movement
  if (controls.isLocked) {
    const speed = state.moveSpeed * delta;
    state.direction.set(0, 0, 0);
    if (state.keys['KeyW'] || state.keys['ArrowUp']) state.direction.z = -1;
    if (state.keys['KeyS'] || state.keys['ArrowDown']) state.direction.z = 1;
    if (state.keys['KeyA'] || state.keys['ArrowLeft']) state.direction.x = -1;
    if (state.keys['KeyD'] || state.keys['ArrowRight']) state.direction.x = 1;
    if (state.direction.length() > 0) {
      state.direction.normalize();
      controls.moveRight(state.direction.x * speed);
      controls.moveForward(-state.direction.z * speed);
    }
    camera.position.x = Math.max(-BOUNDARY, Math.min(BOUNDARY, camera.position.x));
    camera.position.z = Math.max(-BOUNDARY, Math.min(BOUNDARY, camera.position.z));
    camera.position.y = 1.7;
  }

  // Minimap
  const mmDot = document.getElementById('minimapDot');
  if (mmDot) {
    mmDot.style.left = (50 + (camera.position.x / BOUNDARY) * 40) + '%';
    mmDot.style.top = (50 + (camera.position.z / BOUNDARY) * 40) + '%';
  }

  // Portal proximity
  Object.entries(PORTALS).forEach(([key, p]) => {
    const dist = Math.sqrt(Math.pow(camera.position.x - p.x, 2) + Math.pow(camera.position.z - p.z, 2));
    const label = document.getElementById(p.label);
    const mesh = portalMeshes[key];
    mesh.crystal.rotation.y = elapsed * 1.5;
    mesh.crystal.position.y = 3 + Math.sin(elapsed * 2 + key.length) * 0.3;
    const pulse = 1 + Math.sin(elapsed * 3) * 0.05;
    mesh.ring.scale.set(pulse, pulse, pulse);

    if (dist < 5) {
      const vec = new THREE.Vector3(p.x, 3.5, p.z);
      vec.project(camera);
      if (vec.z < 1) {
        label.style.left = ((vec.x * 0.5 + 0.5) * window.innerWidth) + 'px';
        label.style.top = ((-vec.y * 0.5 + 0.5) * window.innerHeight) + 'px';
        label.classList.add('visible');
      } else { label.classList.remove('visible'); }
    } else { label.classList.remove('visible'); }

    if (dist < PORTAL_RADIUS && !state.portalProximity[key]) { state.portalProximity[key] = true; openPanel(key); }
    if (dist >= PORTAL_RADIUS + 1.5) { state.portalProximity[key] = false; }
  });

  // Particles
  const pos = particles.geometry.attributes.position.array;
  for (let i = 0; i < particleCount; i++) { pos[i * 3 + 1] += 0.005; if (pos[i * 3 + 1] > 12) pos[i * 3 + 1] = 0; }
  particles.geometry.attributes.position.needsUpdate = true;

  composer.render();
}

animate();
