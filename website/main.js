import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ═══════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════
const state = {
  keys: {},
  activePanel: null,
  loaded: false,
  phase: 'loading', // loading → cutscene → playing
  portalProximity: { paper: false, pres: false, exp: false },
  moveSpeed: 5,
  rotSpeed: 3,
  colliders: [],
  mixer: null,
  actions: {},
  currentAction: null,
  character: null,
  characterAngle: 0,
};

const PORTALS = {
  paper: { x: 0,   z: -10, color: 0x00f0ff, panel: 'panelPaper', label: 'labelPaper' },
  pres:  { x: -8,  z: 6,   color: 0xff00aa, panel: 'panelPres',  label: 'labelPres' },
  exp:   { x: 8,   z: 6,   color: 0x00ff88, panel: 'panelExp',   label: 'labelExp' }
};
const PORTAL_RADIUS = 2.5;
const BOUNDARY = 16;

// ═══════════════════════════════════════════════════
// RENDERER
// ═══════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════
// SCENE + CAMERA
// ═══════════════════════════════════════════════════
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x020206, 0.02);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 3, 6);

// Third-person orbit camera (disabled during cutscene)
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.1;
orbitControls.maxPolarAngle = Math.PI * 0.85;
orbitControls.minPolarAngle = Math.PI * 0.1;
orbitControls.minDistance = 2;
orbitControls.maxDistance = 10;
orbitControls.enabled = false; // disabled until cutscene ends

// ═══════════════════════════════════════════════════
// POST-PROCESSING
// ═══════════════════════════════════════════════════
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.4, 0.9
));

// ═══════════════════════════════════════════════════
// LIGHTS
// ═══════════════════════════════════════════════════
scene.add(new THREE.AmbientLight(0x445566, 0.5));
const dirLight = new THREE.DirectionalLight(0x8888ff, 0.4);
dirLight.position.set(5, 15, 5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(1024, 1024);
scene.add(dirLight);

// Portal lights
Object.values(PORTALS).forEach(p => {
  const light = new THREE.PointLight(p.color, 3, 18);
  light.position.set(p.x, 2.5, p.z);
  scene.add(light);
});

// ═══════════════════════════════════════════════════
// HDRI
// ═══════════════════════════════════════════════════
new RGBELoader().load('./assets/hdri/night_sky.hdr', (tex) => {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  scene.environment = pmrem.fromEquirectangular(tex).texture;
  tex.dispose();
  pmrem.dispose();
});

// ═══════════════════════════════════════════════════
// FLOOR + GRID
// ═══════════════════════════════════════════════════
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.3, metalness: 0.7 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
scene.add(new THREE.GridHelper(40, 40, 0x222244, 0x111133));

// ═══════════════════════════════════════════════════
// PORTAL STRUCTURES
// ═══════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════
// PARTICLES
// ═══════════════════════════════════════════════════
const particleCount = 400;
const pGeo = new THREE.BufferGeometry();
const pArr = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  pArr[i*3] = (Math.random()-0.5)*40;
  pArr[i*3+1] = Math.random()*10;
  pArr[i*3+2] = (Math.random()-0.5)*40;
}
pGeo.setAttribute('position', new THREE.BufferAttribute(pArr, 3));
const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
  color: 0x6666cc, size: 0.05, transparent: true, opacity: 0.5
}));
scene.add(particles);

// ═══════════════════════════════════════════════════
// LOAD ASSETS
// ═══════════════════════════════════════════════════
const loader = new GLTFLoader();
const loaderFill = document.getElementById('loaderFill');
const loaderText = document.getElementById('loaderText');
const loaderPct = document.getElementById('loaderPct');

let roomLoaded = false;
let charLoaded = false;

function checkAllLoaded() {
  if (roomLoaded && charLoaded) {
    loaderFill.style.width = '100%';
    loaderPct.textContent = '100%';
    loaderText.textContent = 'ENTERING THE GRID...';
    setTimeout(() => {
      document.getElementById('loader').classList.add('done');
      document.getElementById('hud').classList.add('visible');
      state.loaded = true;
      startCutscene();
    }, 600);
  }
}

// ─── Room ───
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
    if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; state.colliders.push(c); }
  });
  scene.add(model);
  console.log('Room loaded, scale:', scale.toFixed(3));
  roomLoaded = true;
  checkAllLoaded();
}, (p) => {
  const pct = p.total > 0 ? Math.round(p.loaded/p.total*50) : Math.min(49, Math.round(p.loaded/580000000*50));
  loaderFill.style.width = pct + '%';
  loaderPct.textContent = pct + '%';
  loaderText.textContent = 'LOADING ENVIRONMENT...';
});

// ─── Character ───
loader.load('./assets/models/character.glb', (gltf) => {
  const model = gltf.scene;
  model.scale.setScalar(1.0);
  model.position.set(0, 0, 0);
  model.traverse(c => {
    if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; }
  });
  scene.add(model);
  state.character = model;

  // Set up animation mixer
  state.mixer = new THREE.AnimationMixer(model);
  gltf.animations.forEach(clip => {
    const action = state.mixer.clipAction(clip);
    state.actions[clip.name] = action;
    console.log('Animation clip:', clip.name, 'duration:', clip.duration.toFixed(2));
  });

  console.log('Character loaded, animations:', Object.keys(state.actions));
  charLoaded = true;
  loaderFill.style.width = '75%';
  loaderPct.textContent = '75%';
  loaderText.textContent = 'RIGGING CHARACTER...';
  checkAllLoaded();
});

// ═══════════════════════════════════════════════════
// ANIMATION HELPERS
// ═══════════════════════════════════════════════════
function playAction(name, options) {
  options = options || {};
  const fadeTime = options.fade || 0.4;
  const loop = options.loop !== undefined ? options.loop : true;
  const timeScale = options.timeScale || 1;
  const clampWhenFinished = options.clamp || false;

  const action = state.actions[name];
  if (!action) { console.warn('No animation:', name); return; }

  if (state.currentAction === action) return;

  action.reset();
  action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce);
  action.clampWhenFinished = clampWhenFinished;
  action.timeScale = timeScale;
  action.fadeIn(fadeTime);
  action.play();

  if (state.currentAction) {
    state.currentAction.fadeOut(fadeTime);
  }

  state.currentAction = action;
  return action;
}

// ═══════════════════════════════════════════════════
// CUTSCENE
// ═══════════════════════════════════════════════════
function startCutscene() {
  state.phase = 'cutscene';
  orbitControls.enabled = false;

  // Position character lying down
  if (state.character) {
    state.character.position.set(0, 0, 0);
    state.character.rotation.y = 0;
  }

  // Camera looking at character from above
  camera.position.set(2, 3, 4);
  camera.lookAt(0, 0.5, 0);

  // Play sleeping animation
  playAction('SleepIdle', { loop: true });

  // After 2 seconds, wake up
  setTimeout(() => {
    playAction('Waking', { loop: false, clamp: true, fade: 0.6 });

    // After waking finishes, play LyingDown reversed (getting up) then idle
    setTimeout(() => {
      const lyingAction = state.actions['LyingDown'];
      if (lyingAction) {
        playAction('LyingDown', { loop: false, clamp: true, timeScale: -1, fade: 0.5 });
        // LyingDown reversed starts at end, plays backward to standing
        lyingAction.time = lyingAction.getClip().duration;
      }

      setTimeout(() => {
        playAction('Idle', { loop: true, fade: 0.6 });

        // Give player control
        setTimeout(() => {
          state.phase = 'playing';
          orbitControls.enabled = true;
          // Position camera behind character
          camera.position.set(0, 3, 6);
          orbitControls.target.set(0, 1, 0);
          orbitControls.update();

          const el = document.getElementById('hudControls');
          el.textContent = '';
          const s = document.createElement('span');
          s.textContent = 'WASD TO MOVE \u00B7 MOUSE TO ORBIT';
          el.appendChild(s);
        }, 500);
      }, 2500);
    }, 2000);
  }, 2500);
}

// ═══════════════════════════════════════════════════
// INPUT
// ═══════════════════════════════════════════════════
document.addEventListener('keydown', e => { state.keys[e.code] = true; });
document.addEventListener('keyup', e => { state.keys[e.code] = false; });

// ═══════════════════════════════════════════════════
// PANEL MANAGEMENT
// ═══════════════════════════════════════════════════
function openPanel(key) {
  const portal = PORTALS[key];
  const panel = document.getElementById(portal.panel);
  panel.classList.add('open');
  panel.style.pointerEvents = 'auto';
  state.activePanel = key;
  document.getElementById('hud').classList.remove('visible');
  orbitControls.enabled = false;

  // Play sit animation if computer
  if (key === 'paper') {
    playAction('SitDown', { loop: false, clamp: true, fade: 0.4 });
    setTimeout(() => playAction('SitIdle', { loop: true, fade: 0.3 }), 1500);
  }

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
  orbitControls.enabled = true;

  // Stand back up
  playAction('Idle', { loop: true, fade: 0.5 });

  // Push back from portal
  if (state.character) {
    const p = portal;
    const dx = state.character.position.x - p.x;
    const dz = state.character.position.z - p.z;
    const len = Math.sqrt(dx*dx + dz*dz) || 1;
    state.character.position.x += (dx/len) * 3;
    state.character.position.z += (dz/len) * 3;
  }
  Object.keys(state.portalProximity).forEach(k => { state.portalProximity[k] = false; });
};

document.getElementById('closePanelBtn').addEventListener('click', window.closePanel);
document.getElementById('closePanelPres').addEventListener('click', window.closePanel);
document.getElementById('closePanelExp').addEventListener('click', window.closePanel);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && state.activePanel) window.closePanel();
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
// GAME LOOP
// ═══════════════════════════════════════════════════
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  // Update animation mixer
  if (state.mixer) state.mixer.update(delta);

  // Update orbit controls
  if (orbitControls.enabled) orbitControls.update();

  if (!state.loaded) { composer.render(); return; }
  if (state.activePanel) { composer.render(); return; }

  // ─── Third-person movement ───
  if (state.phase === 'playing' && state.character) {
    let moving = false;
    const char = state.character;
    const speed = state.moveSpeed * delta;

    // Get camera's forward direction (flattened to XZ plane)
    const camForward = new THREE.Vector3();
    camera.getWorldDirection(camForward);
    camForward.y = 0;
    camForward.normalize();
    const camRight = new THREE.Vector3().crossVectors(camForward, new THREE.Vector3(0, 1, 0)).normalize();

    const moveDir = new THREE.Vector3();

    if (state.keys['KeyW'] || state.keys['ArrowUp']) { moveDir.add(camForward); moving = true; }
    if (state.keys['KeyS'] || state.keys['ArrowDown']) { moveDir.sub(camForward); moving = true; }
    if (state.keys['KeyA'] || state.keys['ArrowLeft']) { moveDir.sub(camRight); moving = true; }
    if (state.keys['KeyD'] || state.keys['ArrowRight']) { moveDir.add(camRight); moving = true; }

    if (moving && moveDir.length() > 0) {
      moveDir.normalize();

      // Rotate character to face movement direction
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      // Smooth rotation
      let angleDiff = targetAngle - char.rotation.y;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      char.rotation.y += angleDiff * Math.min(1, delta * 10);

      // Move
      const prevPos = char.position.clone();
      char.position.x += moveDir.x * speed;
      char.position.z += moveDir.z * speed;

      // Collision check
      if (state.colliders.length > 0) {
        const ray = new THREE.Raycaster(
          new THREE.Vector3(prevPos.x, prevPos.y + 1, prevPos.z),
          moveDir, 0, 1.0
        );
        const hits = ray.intersectObjects(state.colliders, false);
        if (hits.length > 0) {
          char.position.copy(prevPos);
        }
      }

      // Boundary
      char.position.x = Math.max(-BOUNDARY, Math.min(BOUNDARY, char.position.x));
      char.position.z = Math.max(-BOUNDARY, Math.min(BOUNDARY, char.position.z));

      // Play walk animation
      if (state.currentAction !== state.actions['Walking']) {
        playAction('Walking', { loop: true, fade: 0.3 });
      }
    } else if (state.phase === 'playing') {
      // Not moving — idle
      if (state.currentAction === state.actions['Walking'] ||
          state.currentAction === state.actions['WalkBack'] ||
          state.currentAction === state.actions['StrafeLeft'] ||
          state.currentAction === state.actions['StrafeRight']) {
        playAction('Idle', { loop: true, fade: 0.3 });
      }
    }

    // Camera follows character
    orbitControls.target.lerp(
      new THREE.Vector3(char.position.x, char.position.y + 1.2, char.position.z),
      0.1
    );
  }

  // ─── Minimap ───
  if (state.character) {
    const mmDot = document.getElementById('minimapDot');
    if (mmDot) {
      mmDot.style.left = (50 + (state.character.position.x / BOUNDARY) * 40) + '%';
      mmDot.style.top = (50 + (state.character.position.z / BOUNDARY) * 40) + '%';
    }
  }

  // ─── Portal proximity ───
  Object.entries(PORTALS).forEach(([key, p]) => {
    const charPos = state.character ? state.character.position : camera.position;
    const dist = Math.sqrt(Math.pow(charPos.x - p.x, 2) + Math.pow(charPos.z - p.z, 2));
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
        label.style.left = ((vec.x*0.5+0.5)*window.innerWidth) + 'px';
        label.style.top = ((-vec.y*0.5+0.5)*window.innerHeight) + 'px';
        label.classList.add('visible');
      } else { label.classList.remove('visible'); }
    } else { label.classList.remove('visible'); }

    if (state.phase === 'playing' && dist < PORTAL_RADIUS && !state.portalProximity[key]) {
      state.portalProximity[key] = true;
      openPanel(key);
    }
    if (dist >= PORTAL_RADIUS + 1.5) { state.portalProximity[key] = false; }
  });

  // ─── Particles ───
  const pos = particles.geometry.attributes.position.array;
  for (let i = 0; i < particleCount; i++) { pos[i*3+1] += 0.004; if (pos[i*3+1] > 10) pos[i*3+1] = 0; }
  particles.geometry.attributes.position.needsUpdate = true;

  composer.render();
}

animate();
