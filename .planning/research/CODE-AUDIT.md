# Code Audit: website/main.js, style.css, index.html

**Date:** 2026-03-30
**Scope:** Dead code, unused CSS, cleanup opportunities across the three core website files.

---

## 1. Functions Defined but Never Called

No standalone functions are defined and never called. All functions (`startBoot`, `runBoot`, `showScreen2`, `showWin95Splash`, `transitionToDesktop`, `showWin95Desktop`, `buildStartMenu`, `updateClock`, `playClickSound`, `playStartupChime`, `playWindowSound`, `animateWindowOpen`, `runTerminalCommand`, `animateCounters`, `animatePresSlides`) are invoked somewhere.

**However:** `window.closePanel` (line 1269) is a legacy shim attached to close buttons that are **hidden by CSS** (`.win95-content .panel-close { display: none !important; }`). The close-button event listeners on `closePanelBtn`, `closePanelPres`, `closePanelExp` (lines 1273-1275) fire `window.closePanel`, but these buttons are invisible inside Win95 windows. The actual close action uses the Win95 titlebar close button via `wm.closeWindow()`. The `window.closePanel` function, its three event listeners, and the Escape key handler on line 1276-1278 are **effectively dead code** -- they only matter if panels are opened outside of windows, which never happens in the current flow.

---

## 2. Variables Declared but Unused

| Variable | Line | Status |
|----------|------|--------|
| `state` | 37 | Only mutated once (`state.phase = 'desktop'` on line 397). Never read anywhere. Dead state object. |
| `pVel` | 20 | Used in the animation loop -- **not unused**, but declared at module scope and only consumed inside `animate()`. |

The `state` object was likely planned for phase-tracking (boot/desktop/panel) but the code uses DOM class toggling instead. It can be removed.

---

## 3. CSS Classes Not Referenced in HTML or JS

These CSS selectors exist in `style.css` but have **zero references** in `index.html` or `main.js`:

### Loader subsystem (lines 63-102) -- entirely dead
- `.loader-inner`
- `.loader-logo`
- `.loader-bar`
- `.loader-fill`
- `.loader-text`
- `.loader-pct`

The loader HTML was gutted (line 26: `<div class="loader done" id="loader" style="display:none"></div>`). The old inner elements are gone but the CSS for them remains.

### Old cyberpunk desktop theme (lines 506-588) -- entirely dead
These are from a pre-Win95 iteration. The current desktop uses `.win95-desktop`, `.win95-wallpaper`, `.icon-grid`, etc.:
- `.desktop` (old class; current desktop uses `.win95-desktop`)
- `.desktop.visible`
- `.desktop-wallpaper` (current uses `.win95-wallpaper`)
- `.desktop-icons` (current uses `.icon-grid`)
- `.desktop-taskbar` (current uses `.win95-taskbar`)
- `.taskbar-title`
- `.taskbar-user`
- `.taskbar-time`
- `.icon-img` (current icons use `.icon-emoji`)

### Paper/Pres elements from old layout (lines 341-412, 415-484)
- `.paper-cards`, `.paper-card`, `.paper-card-num`, `.paper-card h3`, `.paper-card p` -- old card layout; current paper uses `.paper-section` grid
- `.paper-table`, `.paper-table th`, `.paper-table td`, `.paper-table .highlight td` -- no `<table>` exists in the paper panel
- `.panel-placeholder` -- no element uses this class
- `.pres-outline` -- old presentation outline grid; current uses `.pres-slide-track`
- `.pres-num` -- old presentation numbering; current uses `.slide-num`
- `.slide-arch-compare`, `.arch-compare-item`, `.arch-compare-item--ai`, `.arch-label`, `.arch-detail` -- unused architecture comparison cards
- `.slide-timeline-mini`, `.tl-mini-item`, `.tl-mini-highlight`, `.tl-mini-year` -- unused mini-timeline
- `.slide-video`, `.slide-video iframe`, `.video-caption` -- no video embeds in the presentation
- `.slide-chip-compare`, `.chip-item`, `.chip-name`, `.chip-desc` -- unused chip comparison grid

### Unused keyframe
- `@keyframes glitchShift` (line 1392) -- defined but never referenced in any `animation` property

### HUD system (lines 106-191) -- functionally dead
All HUD CSS (`.hud`, `.hud-top`, `.hud-title`, `.hud-author`, `.hud-controls`, `.hud-minimap`, `.minimap-dot`, `.minimap-portal`, `.portal-label`) exists in both CSS and HTML, but:
- The HUD is hidden immediately on boot: `document.getElementById('hud').style.display = 'none'` (line 49)
- It is **never shown again** -- no code ever sets `hud.style.display = ''` or adds `.visible`
- The portal labels (`#labelPaper`, `#labelPres`, `#labelExp`) are never referenced in JS
- The minimap dot is never moved

The entire HUD + portal label + minimap system is leftover from the 3D lobby concept and is dead.

**Total dead CSS:** ~160 lines of selectors across loader, old desktop, old paper/pres layout, HUD, and minimap.

---

## 4. Commented-Out Code Blocks

| Location | Content |
|----------|---------|
| main.js line 324 | `// (Old showBios removed -- replaced by Award BIOS boot in startBoot)` -- comment-only, the function itself was already removed. Harmless but can be deleted. |
| main.js line 1268 | `// Close panel (legacy -- harmless)` -- self-documenting comment acknowledging dead code. |
| index.html line 25 | `<!-- Old loader removed -- boot goes straight to BIOS POST screen -->` -- stale comment |
| style.css line 1051 | `/* .crt-overlay is always present over win95-desktop when visible */` -- informational, fine to keep |

No large commented-out code blocks found. The codebase is clean in this regard.

---

## 5. Old Code from Previous Iterations

The biggest legacy artifact is the **old cyberpunk desktop theme** in style.css (lines 506-588). This was the pre-Win95 design with:
- `.desktop` / `.desktop.visible` (superseded by `.win95-desktop`)
- `.desktop-wallpaper` (superseded by `.win95-wallpaper`)
- `.desktop-icons` (superseded by `.icon-grid`)
- `.desktop-taskbar` (superseded by `.win95-taskbar`)
- `.taskbar-title`, `.taskbar-user`, `.taskbar-time` (superseded by Win95 taskbar elements)
- `.icon-img` with `drop-shadow` filter (superseded by `.icon-emoji`)

This entire block (~80 lines) can be removed.

Also: the **HUD/portal/minimap** system in both HTML and CSS is from the 3D lobby walkthrough concept. It adds ~100 lines of HTML and ~90 lines of CSS that are never visible.

---

## 6. Duplicate Logic

### Duplicate CSS declarations for `.panel-header` and its variants
- Lines 264-278 define `.panel-header` and `::before` pseudo-elements
- Lines 754-761 redefine the **same selectors** with slightly different values (e.g., opacity 0.08 vs explicit rgba, different padding interpretation)
- Both declarations are active -- the later one wins via cascade, making lines 264-278 partially overridden dead rules

### Duplicate `.panel-eyebrow` color rules
- Lines 287-289 set color per `.panel-header--*` variant
- Line 758 resets `.panel-eyebrow` color to `var(--text-dim)` globally, overriding the per-variant colors from the earlier block

### `showWin95Splash()` redundant cleanup
- Line 189-195: `showWin95Splash()` removes BIOS classes and hides elements that `showScreen2()` on line 179 already removed. Double-cleanup is harmless but indicates copy-paste.

---

## 7. Console.log Statements

**None found.** The codebase is clean of `console.log`, `console.warn`, or `console.error` statements. Empty `catch(e) {}` blocks are used for audio errors (lines 267, 288, 321), which silently swallow errors -- acceptable for optional audio.

---

## 8. Event Listeners / setInterval Leaks

### setInterval without cleanup scope
| Location | What | Leak risk |
|----------|------|-----------|
| Line 418 | `setInterval(updateClock, 1000)` | **Permanent.** Runs forever once the desktop is shown. Low impact (1 call/sec) but never cleared. |
| Line 201 | `setInterval` for splash bar | Cleared on line 205 via `clearInterval(barInterval)`. OK. |
| Lines 1303, 1313 | CPU/GPU demo intervals | CPU interval cleared on line 1308. GPU uses nested `setTimeout` -- OK. |
| Line 752 | Notepad typewriter interval | Cleared on line 755. OK. |
| Line 894 | Terminal typing interval | Cleared on line 898. OK. |

### Event listeners that accumulate
- `showWin95Desktop()` (line 396) adds click listeners to `#startBtn` and `#desktop` every time it's called. It's only called once in the current flow, but there's no guard. If `showWin95Desktop()` were called again, listeners would stack.

### Drag listeners
- `_makeDraggable()` correctly uses `removeEventListener` in `onUp`. No leak.

---

## 9. Elements Referenced by ID That Don't Exist

All IDs referenced in main.js exist in index.html:
- `scene`, `loader`, `hud`, `biosScreen`, `biosOutput`, `biosEnergyStarLogo`, `biosAwardRibbon`, `biosFooter`, `win95Splash`, `win95SplashBar`, `desktop`, `startBtn`, `startMenu` (created dynamically), `windowLayer`, `taskbarPills`, `taskbarClock`, `panelPaper`, `panelPres`, `panelExp`, `closePanelBtn`, `closePanelPres`, `closePanelExp`, `pioneerInfo`, `runBtn`, `cpuGrid`, `gpuGrid`, `cpuTime`, `gpuTime`

No orphan ID references found.

---

## 10. Three.js Particle Scene -- Resource Assessment

### What's running
- `animate()` on line 1327 calls `requestAnimationFrame(animate)` -- **runs forever at ~60fps**
- Each frame: updates 1500 particle positions (4500 float operations), rotates particle system, calls `renderer.render()`
- WebGL canvas (`#scene`) is `position: fixed; z-index: 0` -- it renders **behind everything**

### Is it visible?
- During BIOS boot: hidden behind `#biosScreen` (z-index: 2000)
- During Win95 splash: hidden behind `#win95Splash` (z-index: 2001)
- During desktop: hidden behind `.win95-desktop` (z-index: 100)
- The desktop wallpaper `.win95-wallpaper` has `background-color: #001a1a` with `background-image: url('./wallpaper.jpg')` covering the full area
- **The particle scene is NEVER visible** after boot starts. It renders every frame behind opaque layers.

### Impact
- Continuous GPU draw calls (~60/sec) for invisible content
- 1500 particles * 3 floats * 60fps = ~270K float operations/sec wasted
- WebGL context consumes VRAM for the particle geometry, material, and framebuffer
- On battery/low-end devices, this wastes power for zero visual benefit

### Recommendation
Either:
1. Stop the animation loop after the desktop loads (set a flag, skip `renderer.render()`)
2. Remove Three.js entirely if the 3D lobby concept is permanently abandoned
3. At minimum, add `renderer.setAnimationLoop(null)` when the desktop becomes visible

---

## Summary of Cleanup Opportunities

| Category | Estimated lines removable | Priority |
|----------|--------------------------|----------|
| Dead CSS: old loader styles | ~40 lines | Low |
| Dead CSS: old cyberpunk desktop theme | ~80 lines | Medium |
| Dead CSS: unused paper/pres layouts | ~70 lines | Medium |
| Dead CSS: unused keyframe `glitchShift` | ~5 lines | Low |
| Dead CSS: duplicate `.panel-header` declarations | ~15 lines | Low |
| Dead HTML+CSS: HUD/portal/minimap system | ~100 HTML + ~90 CSS | High |
| Dead JS: `state` object | 1 line + 1 usage | Low |
| Dead JS: `window.closePanel` + listeners | ~10 lines | Low |
| Three.js running invisibly | Performance concern | **High** |
| **Total** | **~410 lines removable** | |
