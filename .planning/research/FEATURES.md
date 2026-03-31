# Feature Landscape: Win95 App Experiences & Immersive Presentations

**Domain:** Interactive educational website with Win95 desktop metaphor + award-winning immersive presentation
**Researched:** 2026-03-30
**Confidence:** MEDIUM-HIGH (award-winning patterns verified across multiple sources, existing tech stack confirmed viable)

---

## Table Stakes

Features users expect. Capstone rubric requires these or product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **9-Slide GPU/AI Hardware Evolution Presentation** | Rubric requires Communicate + Create + Design criteria; user's capstone deliverable | High | Must be scene-per-slide with unique visual treatment per architecture (AlexNet/ImageNet → GPU scaling → Tensor cores → TPUs → NPUs → Future). Each slide a distinct "world" |
| **Fullscreen Scene Transitions** | Capstone "Design" criterion requires visual polish equivalent to Awwwards sites; scroll/arrow navigation between slides | High | ScrollTrigger-based or fullscreen portal jumps. Must feel cinematic, not like a traditional slide deck |
| **File Explorer with Real Markdown Content** | Rubric "Prepare" criterion requires showing semester assignments/research; My Computer is Win95 metaphor for "filing cabinet of evidence" | Medium | Browse `.md` files (assignment-*.md, sections of research-paper.md) organized hierarchically. Render markdown with syntax highlighting |
| **Interactive Hardware Evolution Demo (Experience.exe)** | Rubric "Create" + "Communicate" criteria; visual proof of understanding CPU→GPU→TPU→NPU architectures | High | Side-by-side or animated comparisons: clock cycles, parallel cores, tensor operations, power efficiency. Interactive stats/metrics |
| **Terminal & Notepad Content** | Rubric "Reflect" criterion; easter eggs, methodology notes, research context | Medium | Terminal shows research process logs, "commands" for deep-dives. Notepad houses reflection + methodology |
| **Zero Console Errors** | Rubric implicit requirement; professional polish, no broken 3D assets or missing data | High | BIOS boot, all 3D models load, animations smooth, no JS exceptions |
| **3D Immersive Lobby Exploration** | User feedback: "like messenger.abeto.co" — exploring a world, not scrolling a page; sets tone for entire experience | High | Player-controlled character or guided scene navigation through cyberpunk lobby with 3 paths (Paper/Presentation/Experience). GLTF models load without errors |

---

## Differentiators

Features that set product apart. Not expected, but valued. Likely what gets Awwwards attention.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Animated Hardware Architecture Diagrams** | Competitors show static CPUs/GPUs; this shows evolution over time via morphing/scaling 3D visualizations | High | Tensor cores growing in size, clock speeds decreasing but throughput increasing, power per FLOP improving. Data-driven animations tied to real metrics from research paper |
| **Post-Processing Visual Effects** | Separates "good website" from "Awwwards-level" — bloom, chromatic aberration, depth-of-field | Medium | Three.js EffectComposer + pmndrs postprocessing library. Bloom on 3D models, chromatic aberration on scene transitions |
| **Scroll-Scrubbing Presentation** | Users can scrub through presentation via scroll (GSAP ScrollTrigger scrubbing) OR arrow keys for discrete slide jumps | Medium | Dual navigation: smooth scroll reveals layers of each slide; discrete arrow keys jump between slides. Both feel responsive |
| **Typography as Storytelling** | Inspired by pangrampangram.com — text animates in, morphs between themes, sizes reflect importance | Medium | Hardware names (Kepler, Pascal, Volta) scale/animate based on narrative significance. Color progression shifts as story unfolds (gaming era → AI era → specialized era) |
| **Portrait Gallery with Pioneers** | Humanize hardware evolution: Jensen Huang, Geoffrey Hinton, Lisa Su, Jim Keller, etc. with photos + bios + quotes | Low | Already have images downloaded. Hover/click to expand. Links to research paper citations |
| **Win95 File Explorer Showing Real Artifacts** | Instead of dummy files, explore actual assignment PDFs, research sections, rendered markdown — immersive proof of work | Medium | Custom file explorer that parses `.md` files, renders them in-window, supports folder navigation. Shows file "size" and "type" metadata |
| **Hardware Demo with Real Metrics** | GPU: 16,000 CUDA cores @ 2.5 GHz; TPU: 131,000 operations/cycle; CPU: 8 cores @ 3.5 GHz — animate the scale difference | Medium | Pull metrics from research paper, display side-by-side with 3D scale visualization (NVIDIA H100 vs RTX 4090 vs M3 CPU) |
| **Cinematic Camera Moves** | Rather than static panels, camera pans/zooms into 3D assets during transitions (inspired by bruno-simon.com driving mechanic) | Medium | Three.js camera.position animation tied to GSAP timeline. Feels like "flying into" each section of the presentation |
| **Sound Design (Boot + Transitions)** | BIOS beep on startup, whoosh on portal transitions, subtle ambient for 3D scenes | Low | Already have boot.mp3 downloaded. Use Howler.js or Web Audio API for positional audio in 3D lobby |

---

## Anti-Features

Features to explicitly NOT build. They'd hurt the experience or violate constraints.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Mobile Responsive Design** | User constraint: "website is PC only — no mobile responsive needed." Responsive breakpoints waste dev time; fullscreen desktop assumptions allow more immersive effects | Build for 16:9 aspect ratio, assume mouse + keyboard, no touch. Skip media queries. Use viewport-width calculations only |
| **Google Slides Iframe Embed** | User rejected this explicitly: "the rubric is for the presentation built INTO the website." Embedding defers the work, breaks immersion, can't apply custom animations | Build slides as native components with GSAP + Three.js. Each slide is a scene, not a DOM element from Google's server |
| **Geometric Primitives (BoxGeometry, TorusGeometry)** | User feedback: "looks like a 2005 WebGL demo." Primitives feel cheap; users expect real 3D assets | Use GLTF models (quaternius sci-fi kit, cyberpunk scene). No procedural geometry except for data viz (hardware scale bars) |
| **Scroll-Only Navigation** | Limits accessibility, feels dated. But also: presentation needs discrete slides, not continuous scroll blend | Support BOTH: smooth scroll for detail/flavor, arrow keys for discrete slide jumps. ScrollTrigger + keyboard handler |
| **Generic "Loading..." Screen** | BIOS boot IS the loading screen; placeholder spinners break immersion | Boot sequence shows POST checks (Memory Test, HDD Check, GPU Init, AUDIO OK) while assets load in background. Keeps player engaged |
| **Narrative Branching / Multiple Endings** | Scope creep; capstone is 10-12 minutes linear narrative, not interactive story game | One story path. Hardware evolution is linear in time (1999 GPU → 2024 NPU). No player choice points |
| **Full Physics Simulation (Player Movement)** | Tempting to add Cannon.js for gravity/collisions in lobby, but adds complexity without payoff for a short experience | WASD movement in lobby is simple raycast or grid-based. No gravity, no collision system. Faster to build, easier to debug |
| **Dynamic Content Generation (MD→HTML at Runtime)** | Parsing markdown in browser is fragile; better to pre-process | Parse `.md` files at build time (or via Node script) into structured JSON. File explorer reads pre-built content, not raw markdown parsing |
| **Video as Slide Content** | Can't guarantee codec support across all browsers; adds file size; user already has research paper text + static assets | Animated visualizations (Three.js + GSAP) > embedded videos. Anything that moves, animate it with GSAP or GPU shaders |

---

## Feature Dependencies

```
PRESENTATION (9-slide fullscreen scenes)
  ↓ requires
  GSAP ScrollTrigger + GSAP timeline (for slide-per-scroll + animations)
  Three.js camera + post-processing (for cinematic camera + visual polish)
  EffectComposer + pmndrs postprocessing (bloom, chromatic aberration)

EXPERIENCE.EXE (Hardware demo)
  ↓ requires
  Hardware metrics data (from research paper)
  Three.js instancing or Object3D scaling (to visualize core/throughput differences)
  D3.js OR custom Three.js charts (for metrics visualization)

MY COMPUTER (File explorer)
  ↓ requires
  Structured JSON of `.md` file contents (pre-parsed at build time)
  Markdown → HTML renderer (showdown.js OR pre-rendered HTML snippets)
  Win95-style file list UI (already have from existing code)

3D LOBBY
  ↓ requires
  GLTF models (already downloaded: cyberpunk-scene, quaternius sci-fi kit)
  Three.js scene with 3 portal zones (Paper/Presentation/Experience)
  Minimap + HUD navigation (already partially built)

SOUND DESIGN
  ↓ requires
  boot.mp3 (already have)
  Web Audio API or Howler.js
  Transition SFX (create or find CC0 assets)
```

---

## MVP Recommendation

**Phase order for capstone deadline (Apr 19):**

### Priority 1 (CRITICAL — Rubric Blockers)
1. **Presentation.exe Scenes** — 9 slides with scene-per-slide animations, fullscreen transitions, arrow key navigation
   - Why first: Rubric Design + Communicate criteria depend on this. Must look Awwwards-level.
   - Dependencies: GSAP, Three.js camera, post-processing
   - Estimated: 8–12 hours (animations + scene setup + camera choreography)

2. **Hardware Evolution Metrics Viz** (Experience.exe)
   - Why second: Rubric Create + Communicate criteria. Visualize CPU→GPU→TPU→NPU progression.
   - Dependencies: Data from research paper, Three.js scaling/morphing
   - Estimated: 6–8 hours

3. **File Explorer Rendering** (My Computer)
   - Why third: Rubric Prepare criterion requires showing assignments. Visual proof of semester work.
   - Dependencies: Pre-parsed JSON of `.md` files, markdown→HTML renderer
   - Estimated: 4–6 hours

### Priority 2 (VISUAL POLISH)
4. **Post-Processing Effects** — Apply bloom/chromatic aberration to elevate from "good" to "Awwwards"
   - Estimated: 2–4 hours (pmndrs library mostly handles heavy lifting)

5. **Portrait Gallery** — Pioneers (Jensen, Hinton, etc.) with hover interactions
   - Estimated: 2 hours

### Priority 3 (NICE-TO-HAVE, Defer if Tight on Time)
6. **Cinematic Camera Choreography** — Advanced camera pans/zooms on transitions
7. **Typography Animations** — Text morphing/scaling per slide theme
8. **Sound Design** — Boot sequence audio + transition SFX
9. **Advanced Hardware Visualizations** — Real-time core scaling, power efficiency graphs

### Defer (Post-Capstone Polish)
- Full physics simulation in lobby
- Video content
- Branching narratives
- Mobile responsive design

---

## Feature Complexity Assessment

| Feature | Dev Hours | Risk | Why |
|---------|-----------|------|-----|
| 9-Slide Presentation + Scenes | 10–15 | Medium | GSAP timeline logic + Three.js camera choreography. Requires careful timing/sync. |
| Fullscreen Scene Transitions | 3–5 | Low | ScrollTrigger examples abundant; mostly glue + tweaking |
| Hardware Metrics Visualization | 6–10 | Medium | Data accuracy matters; 3D scaling needs to match research paper claims. Risk: numbers wrong = credibility hit |
| File Explorer + MD Rendering | 4–6 | Low | Markdown parsing is solved problem; file explorer UI already exists (Win95 code) |
| Post-Processing Effects | 2–4 | Low | pmndrs library does heavy lifting; mostly configuration |
| 3D Lobby Exploration | 5–8 | Medium | GLTF loading is straightforward; portal collision/navigation is tricky. Risk: portal zones hard to fine-tune |
| Interactive Hardware Demo | 6–8 | Medium | Requires understanding hardware specs deeply; animations must be accurate to claims in paper |
| Portrait Gallery | 2 | Low | Static content + hover effects; low technical risk |
| Sound Design | 3–4 | Low | Web Audio simple; risk is asset creation/sourcing |

---

## Critical Dependencies on Existing Codebase

| Component | Existing? | Status | Reuse? |
|-----------|-----------|--------|--------|
| WindowManager | Yes | WORKING | Extend for Presentation.exe window behavior |
| GSAP animations | Yes | WORKING | Extend for slide animations + scene transitions |
| BIOS boot sequence | Yes | PARTIAL | Keep as-is; use for initial loading |
| Start menu | Yes | WORKING | Keep; add Presentation.exe + Experience.exe shortcuts |
| Terminal | Yes | WORKING | Extend for hardware evolution CLI commands (e.g., `gpu-stats`, `tpu-specs`) |
| File Explorer | Yes | BASIC | Extend to parse + render `.md` files with syntax highlighting |
| Notepad | Yes | WORKING | Keep for methodology/reflection notes |
| Recycle Bin | Yes | WORKING | Keep; maybe add easter egg (deleted research iterations) |
| Three.js scene + models | YES | DOWNLOADED | Ready to use; cyberpunk-scene + quaternius sci-fi models in `/website/assets/models/` |
| HDRI environment maps | Yes | DOWNLOADED | Ready to use; night_sky.hdr + dark_night.hdr in `/website/assets/hdri/` |
| Portrait images | Yes | DOWNLOADED | 9 pioneers (Jensen, Hinton, Moore, etc.) ready in `/website/portraits/` |
| Research paper content | Yes | FINAL (13,455 words) | Source of hardware metrics + narrative structure |

---

## Architectural Patterns to Implement

### Pattern 1: Scene-Per-Slide Architecture

**What:** Each slide is a Three.js scene (or scene variant) with its own camera, lights, and animated objects. Transitions between slides either:
- Crossfade between scenes (fastest)
- Animate camera between scene positions (cinematic)
- SVG mask reveals (visual direction)

**When:** Building immersive presentations where each slide feels like entering a different visual world.

**Example Implementation:**
```javascript
// Pseudo-code structure
class PresentationScene {
  constructor(slideNumber, theme, title) {
    this.slideNum = slideNumber;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(...);
    this.objects = []; // 3D models for this slide
    this.timeline = gsap.timeline(); // Slide-specific animations
  }

  enter() {
    // Camera flies in, objects animate in, lights fade up
    this.timeline.play();
  }

  exit() {
    // Reverse animations, prepare for next slide
    this.timeline.reverse();
  }
}

// 9 slides = 9 instances
const slides = [
  new PresentationScene(1, 'genesis', 'GeForce 256: The Accidental Revolution'),
  new PresentationScene(2, 'axial', 'Tensor Cores: The Inflection Point'),
  // ... 7 more
];
```

### Pattern 2: ScrollTrigger + Discrete Slide Navigation

**What:** Allow BOTH smooth scroll (reveals detail layers) AND arrow keys (jumps slides). ScrollTrigger scrubbing for continuous playback, KeyboardEvent for discrete jumps.

**Example:**
```javascript
// Slide 1 animations on scroll
gsap.timeline({
  scrollTrigger: {
    trigger: "#slide-1",
    markers: false,
    scrub: 1, // Tie to scroll position
  }
})
.from("#title", { opacity: 0, y: 100 })
.to("#subtitle", { opacity: 1, duration: 0.5 });

// Also: Arrow key handler
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') nextSlide();
  if (e.key === 'ArrowLeft') prevSlide();
});
```

### Pattern 3: Hardware Metrics as 3D Scale Visualization

**What:** Instead of charts, use 3D objects whose size/color encodes metrics. E.g., a cube that's 2000 pixels tall for GPU cores vs a small cube for CPU cores.

**Example:**
```javascript
// CPU: 8 cores
const cpuCores = createCubes(8, { height: 20 });

// GPU: 16,000 CUDA cores
const gpuCores = createCubes(16000, { height: 20, instancedGeometry: true });

// Instantly visual: GPU is MASSIVE. Aids understanding.
```

### Pattern 4: Portal Navigation in 3D Lobby

**What:** 3 distinct zones in the lobby (Paper/Presentation/Experience). Walking into a zone triggers transition to that section. Minimap shows player position + portals.

**Example:**
```javascript
const portals = {
  paper: { position: new THREE.Vector3(-50, 0, 0), zone: 'research' },
  pres: { position: new THREE.Vector3(50, 0, 0), zone: 'presentation' },
  exp: { position: new THREE.Vector3(0, 0, -50), zone: 'experience' },
};

// On each frame, check if player is in portal radius
if (distance(player.pos, portals.paper.pos) < 10) {
  triggerTransition(portals.paper.zone);
}
```

### Pattern 5: Pre-Parsed Markdown for Win95 File Explorer

**What:** Parse `.md` files at build time into structured JSON. File explorer reads pre-built content, avoiding browser-side markdown parsing fragility.

**Pre-build Step (Node.js):**
```javascript
// build-manifest.js
const fs = require('fs');
const marked = require('marked');

const manifest = {
  'Assignments': {},
  'Research': {},
  'Reflection': {}
};

// Parse each .md file to JSON
fs.readdirSync('./assignments').forEach(file => {
  const content = fs.readFileSync(`./assignments/${file}`, 'utf8');
  const html = marked.parse(content);
  manifest['Assignments'][file] = { html, size: content.length };
});

fs.writeFileSync('./website/manifest.json', JSON.stringify(manifest));
```

**Runtime (Explorer):**
```javascript
// Load pre-built manifest
const manifest = await fetch('/manifest.json').then(r => r.json());
function openFile(category, filename) {
  const { html } = manifest[category][filename];
  renderSafeHtml(html); // Using DOMPurify or trusted HTML
}
```

---

## Sources

### Award-Winning Patterns & Immersive Design
- [Best GSAP Animation Websites | Awwwards](https://www.awwwards.com/websites/gsap/)
- [10 Best Interactive Websites and How to Build One in 2026 | Lovable](https://lovable.dev/guides/best-interactive-websites)
- [Building a Scroll-Revealed WebGL Gallery with GSAP, Three.js, Astro and Barba.js | Codrops](https://tympanus.net/codrops/2026/02/02/building-a-scroll-revealed-webgl-gallery-with-gsap-three-js-astro-and-barba-js/)
- [Build an award Winning 3D Website with scroll-based animations | Next.js, three.js & GSAP - DEV Community](https://dev.to/robinzon100/build-an-award-winning-3d-website-with-scroll-based-animations-nextjs-threejs-gsap-3630)
- [Scroll Driven presentation in Three.js with GSAP | Medium](https://medium.com/@pablobandinopla/scroll-driven-presentation-in-threejs-with-gsap-a2be523e430a)

### Interactive Storytelling & Scrollytelling
- [25 Stunning Interactive Website Examples & Design Trends (2025) | The Web Factory](https://www.thewebfactory.us/blogs/25-stunning-interactive-website-examples-design-trends/)
- [10 visual storytelling website examples to inspire your next project | Webflow Blog](https://webflow.com/blog/storytelling-websites)
- [Immersive Storytelling Websites: The 2026 Guide to Interactive Narrative Experiences | Utsubo](https://www.utsubo.com/blog/immersive-storytelling-websites-guide)
- [Scrollytelling | Vev](https://www.vev.design/scrollytelling/)
- [7 exceptional storytelling websites for UX design inspiration | Framer](https://www.framer.com/blog/storytelling-websites)

### Three.js & WebGL Immersion
- [How to Use Three.js for Interactive 3D Web Experiences - DEV Community](https://dev.to/smok/how-to-use-threejs-for-interactive-3d-web-experiences-4ame)
- [20 Best Three.js Examples 2026 | UIcookies](https://uicookies.com/threejs-examples/)
- [Immersive Experiences with Three.js | Medium](https://medium.com/@matruszczycky/immersive-experiences-with-three-js-12abb3e7c590)
- [10 Striking 3D Website Examples (and How They're Made) | Vev](https://www.vev.design/blog/3d-website-examples/)
- [WebGL and 3D on the Web: How to Create Immersive 3D Experiences | DEV Community](https://dev.to/okoye_ndidiamaka_5e3b7d30/webgl-and-3d-on-the-web-how-to-create-immersive-3d-experiences-that-wow-users-2d2j)

### Post-Processing & Visual Effects
- [Post-processing - Effects for TresJS](https://post-processing.tresjs.org/guide/)
- [pmndrs/postprocessing: A post processing library for three.js | GitHub](https://github.com/pmndrs/postprocessing)
- [Three.js Post Processing | Three.js Fundamentals](https://threejsfundamentals.org/threejs/lessons/threejs-post-processing.html)
- [Filmic Effects in WebGL. post-processing with ThreeJS | Medium](https://medium.com/@mattdesl/filmic-effects-for-webgl-9dab4bc899dc)

### GSAP ScrollTrigger & Scroll Animation
- [SVG Mask Transitions on Scroll with GSAP and ScrollTrigger | Codrops](https://tympanus.net/codrops/2026/03/11/svg-mask-transitions-on-scroll-with-gsap-and-scrolltrigger/)
- [57 GSAP ScrollTrigger Examples | Free Frontend](https://freefrontend.com/scroll-trigger-js/)
- [20 GSAP ScrollTrigger Examples for Inspiration | Animation Addons](https://animation-addons.com/blog/gsap-scrolltrigger-examples/)
- [30 GSAP ScrollTrigger Examples for Inspiration | Animation Addons](https://animation-addons.com/blog/30-gsap-scrolltrigger-examples/)
- [ScrollTrigger | GSAP Docs & Learning](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)

### Hardware Architecture Visualization
- [CPU vs GPU vs TPU vs NPU: AI Hardware Architecture Guide 2025 | The Purple Struct](https://www.thepurplestruct.com/blog/cpu-vs-gpu-vs-tpu-vs-npu-ai-hardware-architecture-guide-2025/)
- [CPU vs GPU vs TPU vs NPU vs LPU | Daily Dose of Data Science](https://blog.dailydoseofds.com/p/cpu-vs-gpu-vs-tpu-vs-npu-vs-lpu)
- [Understanding CPU vs GPU vs TPU vs NPU in Modern AI Systems | L&P Knowledge](https://resources.l-p.com/knowledge-center/cpu-vs-gpu-vs-tpu-vs-npu-architecture-comparison-explained)
- [AI 101: GPU vs. TPU vs. NPU What's the Difference? | Backblaze](https://www.backblaze.com/blog/ai-101-gpu-vs-tpu-vs-npu/)

### Typography Animation & Kinetic Typography
- [Pangram Pangram® Academy | Articles on Type, Design & Culture](https://pangrampangram.com/blogs/journal)
- [The best kinetic typography: 15 must-see examples | Creative Bloq](https://www.creativebloq.com/typography/examples-kinetic-typography-11121304)
- [8.25 Seconds to Impress: Typography Animation Examples | DesignRush](https://www.designrush.com/best-designs/video/trends/8-25-seconds-to-impress-typography-animation-examples-that-maximize-viewer-retention)

### Markdown & Content Rendering
- [Interactive Components in Markdown - DEV Community](https://dev.to/valeriavg/interactive-components-in-markdown-2l1h)
- [GitHub - mundimark/awesome-markdown-editors](https://github.com/mundimark/awesome-markdown-editors)

### Product Showcase Patterns
- [Shopify Editions | Winter '26](https://www.shopify.com/editions/winter2026)
- [Shopify Editions Winter '26 | Coalition Technologies](https://coalitiontechnologies.com/blog/shopify-editions-winter-26)
