---
phase: 11-final-project-interactive-website
plan: 01
subsystem: ui
tags: [three.js, gltf, hdri, webgl, post-processing, bloom, chromatic-aberration, effectcomposer, wasd, portals]

requires: []
provides:
  - "ESM importmap-based index.html with Three.js r160 CDN imports"
  - "style.css with full cyberpunk dark theme: HUD, panels, loader, minimap (160px)"
  - "main.js ES module: GLTFLoader loading cyberpunk-scene.gltf, RGBELoader HDRI, EffectComposer pipeline"
  - "WASD movement at speed 0.06, portal proximity detection, panel open/close"
  - "Bloom + chromatic aberration post-processing via EffectComposer"
affects:
  - "11-02-PLAN.md — content panels (paper, pres, exp) are placeholder skeletons ready to fill"

tech-stack:
  added:
    - "Three.js r160 via ESM importmap (CDN, no bundler)"
    - "GLTFLoader (three/addons/loaders/GLTFLoader.js)"
    - "RGBELoader (three/addons/loaders/RGBELoader.js)"
    - "EffectComposer + RenderPass + UnrealBloomPass + ShaderPass"
  patterns:
    - "Importmap ESM pattern for CDN Three.js without npm/bundler"
    - "EffectComposer-first rendering — all frames via composer.render()"
    - "Pointer-events: none on hidden panels (pitfall #5 fix)"
    - "GLTF error fallback — lobby shows with primitives on load failure"
    - "HDRI for reflections only, dark void background kept"

key-files:
  created: []
  modified:
    - "website/index.html — full rewrite: importmap, ESM module script, HUD, 3 panels, portal labels"
    - "website/style.css — full rewrite: 160px minimap, .loader-logo, .loader-pct, .panel-placeholder"
    - "website/main.js — full rewrite: ES module, GLTFLoader, RGBELoader, EffectComposer, speed 0.06"
  deleted:
    - "website/altman.jpg, amodei.jpg, feifei.jpg, hinton.jpg, jensen.jpg, karpathy.jpg, keller.jpg, lisasu.jpg, moore.jpg (root)"
    - "website/assets/altman.jpg ... moore.jpg (assets/ copies)"

key-decisions:
  - "Use Three.js r160 importmap for ESM — only viable CDN approach for GLTFLoader, EffectComposer without a bundler"
  - "Speed: 0.06 per user feedback (original 0.12 was too fast)"
  - "Minimap: 160px per user feedback (original 100px was too small)"
  - "GLTF scale: 0.05 — fits 51MB cyberpunk-scene into the 30-unit lobby floor"
  - "HDRI: applied as scene.environment only (not background) — preserves dark void aesthetic"
  - "chromaPass.renderToScreen = true — required final pass for EffectComposer"
  - "Pioneer photos from portraits/ directory replace initials avatars in Experience panel"
  - "Panel content for pres and exp preserved from WIP; paper panel content preserved from WIP"

patterns-established:
  - "ESM importmap: add new Three.js addons by adding imports to the importmap in index.html"
  - "Panel open/close: toggle .open class + pointerEvents style together"
  - "All rendering: composer.render() only — never renderer.render(scene, camera)"

requirements-completed: [AWARD-01, AWARD-02, AWARD-03, AWARD-04, AWARD-06, AWARD-07]

duration: 8min
completed: 2026-03-30
---

# Phase 11 Plan 01: Website Rebuild Summary

**Three.js r160 ESM lobby with GLTFLoader (cyberpunk-scene 51MB), RGBELoader HDRI, EffectComposer bloom + chromatic aberration, WASD at 0.06 speed, 160px minimap, 3 portal panels**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-30T16:01:27Z
- **Completed:** 2026-03-30T16:09:30Z
- **Tasks:** 2/2 auto tasks complete (1 checkpoint remaining)
- **Files modified:** 3 rewritten + 18 deleted

## Accomplishments
- Deleted all 18 HTML-disguised-as-JPG broken files from website/ root and website/assets/
- Rewrote index.html with Three.js r160 ESM importmap — GLTFLoader, RGBELoader, EffectComposer load via CDN without a bundler
- Rewrote main.js as ES module loading real 51MB GLTF scene with progress bar, HDRI for lighting, and full EffectComposer pipeline (bloom + chromatic aberration)
- Rewrote style.css incorporating user feedback: minimap 100px→160px, added .loader-logo brand header, .loader-pct percentage display
- Applied research pitfall #5 fix: pointer-events: none on hidden panels prevents invisible click blocking
- Pioneer portrait avatars now use real photos from portraits/ directory

## Task Commits

1. **Task 1: Clean up broken files, scaffold index.html + style.css** - `8bd038b` (feat)
2. **Task 2: Rebuild main.js — GLTF, HDRI, post-processing, WASD, portals** - `a5cf71b` (feat)

## Files Created/Modified
- `website/index.html` — importmap with Three.js r160, module script, HUD, 3 panels, portal labels
- `website/style.css` — cyberpunk theme, 160px minimap, loader enhancements, pioneer photo styles
- `website/main.js` — ES module: GLTFLoader + HDRI + EffectComposer + WASD 0.06 speed

## Decisions Made
- **Three.js r160 vs r182:** Used r160 because it is the version matching existing unpkg CDN URL in the WIP; all required addons (GLTFLoader, RGBELoader, EffectComposer, UnrealBloomPass) are available at this version
- **GLTF scale 0.05:** Chosen to fit the 51MB cyberpunk-scene (which exports at large real-world units) into the 30-unit lobby floor. Will need tuning after seeing the actual model
- **HDRI as environment only:** scene.environment = envMap but NOT scene.background — preserves the dark void fog aesthetic while adding reflections/lighting to materials
- **Speed 0.06:** Direct user feedback: previous 0.12 was too fast
- **Minimap 160px:** Direct user feedback: previous 100px was too small

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Replaced pioneer initials avatars with real portrait photos**
- **Found during:** Task 1 (index.html scaffold)
- **Issue:** WIP code used initials-based .pioneer-avatar with CSS `hsl(var(--h))` color hack. The real portraits are already downloaded at website/portraits/*.jpg per HANDOFF.md.
- **Fix:** Replaced .pioneer-avatar div with .pioneer-photo img pointing to portraits/*.jpg. Added corresponding CSS for .pioneer-photo in style.css.
- **Files modified:** website/index.html, website/style.css
- **Verification:** HTML references portraits/jensen.jpg etc.; portraits directory confirmed present
- **Committed in:** 8bd038b (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 - missing critical feature: real photos already downloaded)
**Impact on plan:** Using actual downloaded portraits was clearly intended per HANDOFF.md. No scope creep.

## Issues Encountered
- Port 8080 was occupied by another service; switched dev server to port 9090. Server confirmed serving correct files at http://localhost:9090/.

## GLTF Model Notes
- **Path:** `./assets/models/cyberpunk-scene/scene.gltf`
- **Scale:** 0.05 (initial — may need tuning after visual inspection)
- **HDRI Path:** `./assets/hdri/night_sky.hdr`
- **Fallback:** If GLTF fails to load, error is caught, lobby shows with geometric primitives, state.loaded is still set to true after 1 second

## Known Stubs
- `panelPres` — Presentation panel has outline + placeholder div; full animated content is Wave 2 (plan 11-02)
- `panelExp` — Experience panel has CPU/GPU demo + pioneers but no animated stats counters; plan 11-02
- Presentation section does NOT have the 10-12 minute cinematic content yet — this is intentional, plan 11-01 is the scaffold

## Next Phase Readiness
- Dev server running at http://localhost:9090/ — ready for browser verification (Task 3 checkpoint)
- All Three.js infrastructure in place for plan 11-02 content additions
- Portal panel IDs match main.js PORTALS config: panelPaper, panelPres, panelExp
- Close button IDs: closePanelBtn, closePanelPres, closePanelExp — all wired

## Self-Check: PASSED

- FOUND: website/index.html
- FOUND: website/style.css
- FOUND: website/main.js
- FOUND: .planning/phases/11-final-project-interactive-website/11-01-SUMMARY.md
- CONFIRMED: website/jensen.jpg deleted (broken file)
- CONFIRMED: website/assets/jensen.jpg deleted (broken file)
- FOUND commit 8bd038b: feat(11-01): scaffold fresh index.html + style.css
- FOUND commit a5cf71b: feat(11-01): rebuild main.js as ES module
- Dev server running at http://localhost:9090/

---
*Phase: 11-final-project-interactive-website*
*Completed: 2026-03-30*
