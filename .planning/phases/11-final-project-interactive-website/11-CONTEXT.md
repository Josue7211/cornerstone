# Phase 11: Final Project — Interactive Website - Context

**Gathered:** 2026-03-30 (updated for Desktop OS pivot)
**Status:** Ready for planning
**Source:** User discussion + HANDOFF.md + last-seen-online reference

<domain>
## Phase Boundary

Build an interactive desktop OS experience as the main interface for the final project website (Assignment #17). The 3D futuristic room is the cinematic intro — camera zooms into a monitor, BIOS boot sequence plays, then a retro Win95-style desktop appears. All graded content (Research Paper, Presentation, Experience) is accessed by opening apps on the desktop. Additional fake apps (Terminal, File Explorer, Notepad, Recycle Bin) create immersion. Due Apr 19, 100 points, Capstone Rubric.

**What's already built (Plans 11-01 through 11-03):**
- 3D futuristic room with GLTF scene, HDRI lighting, bloom post-processing
- Camera zoom animation from behind chair into monitor
- All 3 content panels: Research Paper (5 sections + timeline + thesis), Presentation (8 slides with discipline tags), Experience (CPU vs GPU demo, 9 pioneers with photos, stat counters)
- Loading screen with progress bar

**What this context covers (new plans 11-04+):**
- Desktop OS UI — the entire retro computer interface
- Window management system
- Extra apps (Terminal, File Explorer, Notepad, Recycle Bin)
- BIOS boot sequence
- Sound effects
- Polish and submission

</domain>

<decisions>
## Implementation Decisions

### OS Visual Style
- **D-01:** Windows 95/98 retro aesthetic — classic silver/gray toolbars, blue title bars, white content areas, chunky beveled borders
- **D-02:** CRT monitor effect overlay — CSS scanlines + subtle border-radius curve to mimic CRT screen. Reinforces the "zoomed into a monitor" narrative
- **D-03:** Pixel font for all OS chrome — use 'Press Start 2P' or 'VT323' from Google Fonts. Orbitron stays for 3D loading screen only
- **D-04:** Custom GPU/circuit board pixel art as desktop wallpaper — ties research topic into the visual design

### Desktop Layout
- **D-05:** 7 desktop icons total:
  1. Research Paper (opens paper panel — existing)
  2. Presentation (opens presentation panel — existing)
  3. Experience (opens experience panel — existing)
  4. My Computer / File Explorer (research file tree)
  5. Terminal / Command Prompt (interactive commands)
  6. Notepad (personal note / credits)
  7. Recycle Bin (deleted drafts easter egg)
- **D-06:** Win95 Start bar at bottom — Start button with menu listing all apps, running app indicators, system clock
- **D-07:** Icons arranged on left side of desktop, Win95-style grid

### Window Behavior
- **D-08:** CRAZY unique opening animations for EACH window — nothing basic. Each app gets a different wild animation (glitch effect, matrix rain dissolve, pixel scatter, elastic bounce, 3D flip, etc.)
- **D-09:** Full Win95 window chrome — draggable title bar, minimize/maximize/close buttons, resize handles
- **D-10:** Multiple windows can be open simultaneously — clicking brings to front (z-index management). Taskbar shows all open apps
- **D-11:** Minimize sends to taskbar, maximize fills viewport (within CRT frame), close removes window

### Extra Apps
- **D-12:** Terminal is interactive — user types commands: 'help' (shows menu), 'thesis' (prints thesis statement), 'about' (bio), 'gpu' (GPU timeline), 'credits' (attribution)
- **D-13:** File Explorer shows research file tree: /Research Paper/, /Presentation/, /Sources/, /About Me/. Clicking files opens relevant content or shows text
- **D-14:** Notepad contains a personal note or credits page
- **D-15:** Recycle Bin shows "deleted drafts" — humorous/meta content about research iterations

### Boot Sequence
- **D-16:** Full BIOS/POST boot sequence after 3D zoom completes — scrolling text detecting hardware ("Detecting NVIDIA RTX 4070 Ti SUPER...", "Loading AI Cores...", "Initializing Neural Pathways..."). 3-5 seconds of theater before desktop appears

### Sound Effects
- **D-17:** Win95-style startup chime on boot
- **D-18:** Click sounds on icon interactions, window open/close sounds
- **D-19:** Use Web Audio API with short base64-encoded audio clips (no external audio files needed)

### Carried Forward (Still Valid)
- **D-20:** PC only — no mobile responsive
- **D-21:** Vanilla HTML/CSS/JS + GSAP + Three.js (existing stack)
- **D-22:** Single index.html + style.css + main.js for submission
- **D-23:** Content panels draw from 13,455-word research paper

### Claude's Discretion
- Exact pixel dimensions of windows and icons
- Specific GSAP easing curves for each window animation
- Terminal command responses (tone and content)
- CRT scanline opacity and curve radius
- Boot sequence text content (have fun with it)
- Pixel art wallpaper design approach (CSS-generated, SVG, or inline image)
- Icon visual design (pixel art style matching Win95)
- Start menu layout details

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Primary content source
- `research-paper.md` — 13,455-word paper. Content for all panels and terminal responses.

### Existing website code (modify, don't rewrite)
- `website/index.html` — Current HTML structure with all 3 content panels
- `website/style.css` — Current styles (26KB, includes panel styles)
- `website/main.js` — Three.js scene, camera zoom, desktop logic, panel interactions

### Design reference
- `.planning/phases/11-final-project-interactive-website/HANDOFF.md` — Full context on 3D assets, portraits, reference sites
- `.planning/phases/11-final-project-interactive-website/.continue-here.md` — Resumption context for desktop OS pivot

### Existing assets
- `website/portraits/*.jpg` — 9 pioneer photos (Jensen, Hinton, Moore, Lisa Su, Fei-Fei Li, Karpathy, Altman, Amodei, Keller)
- `website/assets/models/futuristic-room/` — 51MB GLTF room scene
- `website/assets/hdri/night_sky.hdr` — Environment map

### Course requirements
- `.planning/ROADMAP.md` §Phase 11

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- 3 fully built content panels in index.html (panelPaper, panelPres, panelExp) with working GSAP animations
- Camera zoom animation (camStart → camEnd with cubic easing) transitions to `showDesktop()` — hook point for boot sequence
- `animateCounters()` function for stat counters
- Desktop icon double-click handler exists but needs major rework for window management
- GSAP 3.12.5 loaded as UMD global

### Established Patterns
- State machine in main.js: `state.phase` = 'loading' → 'zooming' → 'desktop'
- Panel open/close: `.panel.open` class toggle + GSAP entrance animations
- Three.js scene with EffectComposer (bloom pass)

### Integration Points
- `showDesktop()` function is the transition point — insert boot sequence BEFORE desktop reveal
- Panel close returns to desktop via `window.closePanel()`
- Desktop div already exists (`#desktop`) — needs to be rebuilt with OS UI
- All content panel HTML stays as-is — just wrap in window chrome

</code_context>

<specifics>
## Specific Ideas

- Reference site: https://qwook.itch.io/last-seen-online — interactive retro computer desktop game in Three.js
- Awwwards reference sites from HANDOFF.md for animation inspiration (messenger.abeto.co, bruno-simon.com, etc.)
- The BIOS boot text should be themed to the research topic — detecting GPUs, counting CUDA cores, checking neural pathways
- Terminal should feel like a real hacking experience — green text on black, blinking cursor, each command "processes" with a brief delay
- Every window should feel ALIVE — not just static content containers but individual experiences with their own personality
- The contrast between dark cyberpunk 3D room and bright Win95 desktop is intentional — it's the "entering the computer" moment

</specifics>

<deferred>
## Deferred Ideas

- 3D character controller with Mixamo animations (character.glb with 12 clips saved in assets)
- Mobile responsive version
- Multiplayer / shared desktop experience
- Phase 8 Co-Curricular Reflection (blocked on FSW events)

</deferred>

---

*Phase: 11-final-project-interactive-website*
*Context gathered: 2026-03-30 (updated for Desktop OS pivot)*
