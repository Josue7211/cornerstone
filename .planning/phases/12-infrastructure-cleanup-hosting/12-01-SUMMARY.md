---
phase: 12-infrastructure-cleanup-hosting
plan: 01
subsystem: infra
tags: [three.js, raf, gpu-optimization, dead-code-cleanup, win95]

# Dependency graph
requires:
  - phase: 11-final-project-interactive-website
    provides: Win95 desktop OS shell, Three.js 3D lobby, animate() loop, showWin95Desktop()
provides:
  - desktopActive flag killing Three.js render work after Win95 desktop loads
  - Dead HTML blocks removed (HUD, portal labels) from index.html
  - Dead JS removed (window.closePanel shim, legacy close listeners, HUD null reference fixed)
affects: [12-02, 12-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "desktopActive boolean flag checked in rAF loop to halt GPU work — keeps rAF registered but skips render"

key-files:
  created: []
  modified:
    - website/main.js
    - website/index.html

key-decisions:
  - "Kept state object (zoom animation state) — plan assumed it was dead code but it drives the camera zoom in animate()"
  - "Kept live loader div in index.html — it is actively used by GLTF load progress, not dead code as plan's audit assumed"
  - "Removed state.phase = 'desktop' since animate() only checks for 'zooming', never 'desktop'"
  - "Used early-return guard in animate() after requestAnimationFrame — keeps rAF alive but skips all render/particle work"

patterns-established:
  - "desktopActive: boolean flag pattern for halting heavy render work when UI overlay takes over"

requirements-completed: [INFRA-03, INFRA-04]

# Metrics
duration: 4min
completed: 2026-03-31
---

# Phase 12 Plan 01: Infrastructure Cleanup — Three.js Kill Switch + Dead Code Summary

**Three.js rAF guarded by desktopActive flag, HUD/portal label HTML removed, window.closePanel shim and legacy listeners cleaned from main.js**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-31T02:52:54Z
- **Completed:** 2026-03-31T02:56:03Z
- **Tasks:** 3 of 3
- **Files modified:** 2

## Accomplishments

- Three.js render loop now returns immediately after desktop loads — GPU work halted once Win95 desktop is visible
- Removed ~30 lines of dead HTML (HUD div with minimap + 3 portal label divs) from index.html
- Removed window.closePanel shim, 4 legacy event listeners, and fixed HUD null reference in showBios()

## Task Commits

1. **Task 1: Kill Three.js rAF loop when desktop activates** - `6492d9f` (feat)
2. **Task 2: Remove dead HTML blocks (HUD, portals, loader)** - `b779304` (feat)
3. **Task 3: Remove dead JS and fix HUD null reference** - `87f724b` (feat)

## Files Created/Modified

- `website/main.js` - Added desktopActive flag, removed state.phase='desktop', removed window.closePanel + legacy listeners, fixed HUD null ref
- `website/index.html` - Removed HUD div, portal-label divs (~31 lines deleted)

## Decisions Made

- Kept `state` object: plan's CODE-AUDIT.md assumed state was never read, but it actively drives the zoom animation (`state.phase`, `state.zoomStart`, `state.zoomDuration` all read in `animate()`). Only `state.phase = 'desktop'` was dead.
- Kept live loader div: the loader HTML has `loaderFill`, `loaderText`, `loaderPct` children referenced in main.js for GLTF progress. Plan described an older "stale loader comment + empty div" that no longer exists in this version.
- Used early-return guard pattern: `if (desktopActive) return;` placed after `requestAnimationFrame(animate)` call to keep rAF alive cheaply while skipping all expensive work.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Kept state object — plan's audit was based on older codebase version**
- **Found during:** Task 3 (Remove dead JS)
- **Issue:** Plan said `grep -c "\bstate\b"` should return 0, but `state` is actively read in `animate()` for the zoom camera interpolation (`state.phase`, `state.zoomStart`, `state.zoomDuration`). Removing it would break the 3D lobby zoom-to-desk animation.
- **Fix:** Removed only `state.phase = 'desktop'` (one unread write). Kept `const state = { ... }` and all read references.
- **Files modified:** website/main.js
- **Committed in:** `87f724b` (Task 3 commit)

**2. [Rule 1 - Bug] Kept live loader div in index.html — plan's audit described a different element**
- **Found during:** Task 2 (Remove dead HTML)
- **Issue:** Plan described "stale loader comment + empty div" at lines 24-26, but current index.html has a fully functional loader screen with `loaderFill`, `loaderText`, `loaderPct` children actively updated by JS during GLTF asset loading.
- **Fix:** Kept the loader div entirely. Removed only confirmed dead elements: HUD and portal labels.
- **Files modified:** website/index.html
- **Committed in:** `b779304` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 — live code preserved that plan assumed dead)
**Impact on plan:** Both deviations preserved working functionality. Plan goals achieved (GPU kill switch, dead HTML/JS removed). Code audit in plan was from an older version of main.js/index.html.

## Issues Encountered

None beyond the codebase-vs-audit mismatch documented as deviations above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- main.js is cleaner: ~14 lines removed, desktopActive flag in place for future animation work
- index.html reduced by ~31 lines
- Plan 02 (module split) and Plan 03 can proceed on this cleaner baseline

---
*Phase: 12-infrastructure-cleanup-hosting*
*Completed: 2026-03-31*
