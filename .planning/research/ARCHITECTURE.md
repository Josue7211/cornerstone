# Architecture Patterns: Win95 Desktop OS + Presentation Integration

**Project:** Win95 App Experiences for "From Pixels to Intelligence"
**Researched:** 2026-03-30
**Confidence:** HIGH

---

## Current Architecture (Existing)

The Win95 desktop is a **monolithic single-file application** with three layers:

### Layer 1: Boot Sequence (Lines 40–239)
- Award BIOS POST simulation → Win95 splash → CRT transitions
- State machine: `phase: 'boot'` → `phase: 'desktop'`
- Orchestrates all screen transitions via callbacks
- Audio: boot.mp3 file + Web Audio API (synthesized chimes, click sounds)

### Layer 2: WindowManager Class (Lines 434–650)
Core windowing system for the desktop paradigm:

| Responsibility | Implementation |
|---|---|
| Window creation/destruction | `createWindow(appId, title, icon, contentEl, opts)` |
| Z-order management | `zCounter` tracks focus state |
| Minimize/maximize/close | State stored in `this.windows.get(appId).minimized` |
| Drag-and-drop | `_makeDraggable()` with mousedown/move/up handlers |
| Taskbar pills | `_addPill()` creates taskbar buttons |
| Focus behavior | `focusWindow()` updates z-index, CSS class |

Key: Window content is HTML elements passed in, then wrapped in a chrome container.

### Layer 3: APP_CONFIG Object (Lines 1005–1232)
Declarative app registry:

```javascript
APP_CONFIG = {
  [appId]: {
    title: string,
    icon: emoji,
    width: number,
    height: number,
    open() { /* create content + call wm.createWindow() */ }
  }
}
```

**Current apps:**
- `paper` → PDF iframe
- `pres` → scrollable HTML panel
- `exp` → stateful counters + grid demo
- `explorer` → split-pane tree navigator
- `terminal` → command parser + output
- `notepad` → textarea
- `recycle` → item list

### Layer 4: GSAP Animations (Lines 654–1003)
Per-app entrance animations:

| App | Animation |
|---|---|
| paper | Pixel scatter dissolve (children fly in) |
| pres | 3D flip on Y axis + scroll-triggered slide animations |
| exp | Chromatic glitch effect |
| terminal | Matrix rain burst |
| explorer | Elastic bounce |
| notepad | Typewriter reveal |
| recycle | Items fall in with bounce |

**Presentation-specific:** `animatePresSlides()` uses IntersectionObserver on `.pres-slide` elements to trigger staggered child animations (tags pop, connections slide up, etc.) as slides scroll into view.

---

## QUESTION: Fullscreen Presentation Integration

**Requirement:** Add immersive fullscreen presentation scenes (from HANDOFF.md — Awwwards-level animated sections, Markdown-to-HTML rendering, interactive demos).

**Current state of Presentation.exe:**
- Scrollable HTML panel in a WindowManager window (900x640px)
- 9 slides with scroll-triggered animations
- Static HTML structure (slides hard-coded in index.html)

**The tension:**
- Fullscreen presentation = bypass WindowManager (fills viewport, overlays everything)
- Current Presentation.exe = constrained to window chrome
- Two different paradigms fighting for space

---

## Recommended Architecture: Presentation Layer (NEW)

### Design Decision: **Presentation Mode is a Global State** (not an app)

**Rationale:**
- Presentation is "special" — it's the centerpiece of the capstone (HANDOFF.md: "the point of the website is making the presentation INSIDE one of these pages")
- Fullscreen immersion requires viewport takeover that WindowManager can't cleanly provide
- Presentation has its own lifecycle: enter → navigate slides → exit
- Other apps should still be launchable from within Presentation (research paper panel, demo windows)

**Pattern:** Presentation is a **top-level mode** like the BIOS boot, not an APP_CONFIG entry. It owns the viewport but can launch modals.

---

## New Component: PresentationMode Class

**File:** `main.js` (new section, ~300–400 lines)

### Responsibilities

| Method | Purpose | Data Flow |
|---|---|---|
| `constructor()` | Initialize slides, Three.js scene for section backgrounds | Creates Presentation singleton |
| `load(slideData)` | Parse markdown/JSON, render slides | External: `presentation-data.json` or embedded |
| `enter()` | Take over viewport, hide WindowManager, fade in slides | Global state: `state.phase = 'presentation'` |
| `nextSlide()` | Animate to next slide with transition | Updates internal slide index, triggers GSAP animation |
| `prevSlide()` | Animate to previous slide | Reverse direction |
| `exit()` | Restore WindowManager, cleanup presentation state | `state.phase = 'desktop'` |
| `fullscreenDemo(demoId)` | Launch interactive demo (CPU vs GPU grid, etc.) in fullscreen overlay | Can be called from within a slide |

### Interaction Points

```
WindowManager (existing)
├─ Desktop icons / Start menu
│  └─ "Presentation.exe" button
│     └─ Calls: presentation.enter()
│
PresentationMode (new)
├─ Keyboard: ARROW LEFT/RIGHT to navigate slides
├─ Keyboard: ESC to exit
├─ Mouse: Click sections to advance or interact
├─ Can overlay: modal panels (Research Paper in small window, terminal commands, etc.)
│
Three.js Scene (existing — repurposed)
├─ Particle background (existing)
└─ NEW: Optional section backgrounds (cyberpunk city, sci-fi interior — from HANDOFF.md assets)
```

---

## Markdown-to-HTML Rendering Strategy

### Option A: Server-Side (not applicable — vanilla JS)

### Option B: Client-Side Markdown Parser

**Recommended:** Lightweight markdown library bundled with the site.

| Library | Size | Recommendation |
|---|---|---|
| `markdown-it` | ~30KB gzip | Standard choice, full CommonMark |
| `marked` | ~20KB gzip | Faster, good for slide content |
| `showdown` | ~25KB gzip | Older but stable |

**Decision: Use `marked`** — sufficient for presentation slides, smallest overhead.

### File Structure

```
website/
├── index.html
├── main.js
├── style.css
├── assets/
│  ├── slides/
│  │  ├── 01-title.md
│  │  ├── 02-intro.md
│  │  ├── 03-rqs.md
│  │  ├── 04-perspective.md
│  │  ├── 05-transdisciplinary.md
│  │  ├── 06-implications.md
│  │  ├── 07-advocacy.md
│  │  ├── 08-preparing.md
│  │  └── 09-reflection.md
│  ├── models/    (existing: cyberpunk-scene, quaternius assets)
│  └── hdri/      (existing: night_sky.hdr, dark_night.hdr)
├── lib/
│  └── marked.min.js (new)
└── research-paper.pdf
```

### Loading & Rendering Flow

```javascript
// 1. Load slide markdown files
async function loadPresentation() {
  const slideFiles = [
    'assets/slides/01-title.md',
    'assets/slides/02-intro.md',
    // ... 03–09
  ];
  const slides = await Promise.all(
    slideFiles.map(f => fetch(f).then(r => r.text()))
  );
  // slides = [mdString, mdString, ...]

  return slides.map((md, idx) => ({
    index: idx,
    markdown: md,
    html: marked.parse(md),  // Convert markdown to HTML
    element: null  // Created on demand
  }));
}

// 2. In PresentationMode.enter():
// Create a fullscreen container div
// Populate with first slide's HTML (use textContent or DOMPurify for safety)
// Apply GSAP animations to children
```

### Styling Presentation Slides

**CSS Challenge:** Markdown HTML is unstyled. Need consistent theme.

**Solution:** Use CSS custom properties + utility classes:

```css
/* pres-fullscreen container */
.pres-fullscreen {
  position: fixed;
  inset: 0;
  background: var(--pres-bg);
  z-index: 9999;
  overflow: hidden;
  font-family: var(--font-sans);
  color: var(--text);
}

.pres-fullscreen h1 { font-size: 3.5rem; margin-bottom: 1.5rem; }
.pres-fullscreen h2 { font-size: 2.5rem; margin-bottom: 1rem; }
.pres-fullscreen p { font-size: 1.2rem; line-height: 1.8; margin: 0.5rem 0; }
.pres-fullscreen li { font-size: 1.1rem; margin: 0.3rem 0; }
.pres-fullscreen code { background: var(--code-bg); padding: 2px 6px; border-radius: 3px; }
.pres-fullscreen blockquote { border-left: 4px solid var(--accent); padding-left: 1rem; }
```

---

## Interactive Demos Integration

### Current State
- `Experience.exe` has CPU vs GPU architecture comparison
- Counters that animate with GSAP
- Pioneer portraits that are clickable
- Demo grid cells that light up

### Requirement
**Interactive demos should be** accessible from:
1. Experience.exe window (existing)
2. Fullscreen presentation slides (new)

### Architecture Pattern: Modal Overlays

```javascript
class DemoManager {
  static demos = {
    cpuVsGpu: { /* ... */ },
    gpuEvolution: { /* ... */ },
    quantization: { /* ... */ },
    // ...
  };

  static launch(demoId, mode = 'windowed') {
    const demo = this.demos[demoId];
    if (mode === 'fullscreen') {
      // Create overlay on top of presentation
      const overlay = document.createElement('div');
      overlay.className = 'demo-overlay';
      // Use safe DOM methods to populate content
      overlay.appendChild(demo.createElements());
      document.body.appendChild(overlay);
      // Apply animations + interaction handlers
      demo.init(overlay);
    } else {
      // Create WindowManager window (existing behavior)
      wm.createWindow('demo-' + demoId, demo.title, demo.icon, demo.element);
    }
  }

  static close(demoId) {
    // Clean up overlay or window
  }
}
```

**Key:** Same demo content, different containers (window vs fullscreen overlay).

---

## Data Flow Diagram

```
┌─ Boot Sequence (state: 'boot')
│  ├─ Award BIOS POST
│  ├─ Win95 splash
│  └─ CRT transition
│     └─ state: 'desktop'
│
├─ Desktop (state: 'desktop')
│  ├─ WindowManager active
│  ├─ Three.js particles (background)
│  ├─ Start menu / desktop icons
│  │  └─ Click "Presentation.exe"
│  │     └─ presentation.enter()
│  │        └─ state: 'presentation'
│  │
│  └─ APP_CONFIG[appId].open()
│     ├─ Create content element
│     ├─ wm.createWindow(appId, ...)
│     ├─ animateWindowOpen(appId, ...)
│     └─ Content-specific setup
│
├─ Presentation Mode (state: 'presentation')
│  ├─ Fullscreen overlay (z-index: 9999)
│  ├─ Slide 1: Title
│  ├─ Slide 2: Introduction
│  ├─ ... Slide 9: Reflection
│  ├─ Keyboard nav: ARROW LEFT/RIGHT, ESC to exit
│  ├─ Optional: Three.js section backgrounds
│  │
│  ├─ Within-slide interactions:
│  │  ├─ Click section header → scroll to section
│  │  ├─ Click demo icon → DemoManager.launch(demoId, 'fullscreen')
│  │  └─ ESC → DemoManager.close() then presentation.exit()
│  │
│  └─ presentation.exit()
│     └─ state: 'desktop' (restore WindowManager)
│
└─ Resize listener (affects both modes)
   ├─ Desktop: WindowManager adapts
   └─ Presentation: Fullscreen slides re-layout
```

---

## Component Boundaries

### WindowManager
**Owns:**
- Window chrome (titlebar, buttons, statusbar)
- Z-order management
- Drag/minimize/maximize logic
- Taskbar pill rendering

**Does NOT own:**
- App content (passed in)
- Boot sequence or Presentation mode
- Three.js scene

### PresentationMode (new)
**Owns:**
- Slide navigation state (current slide index)
- Markdown parsing + HTML rendering
- Fullscreen container + animations
- Keyboard handlers (arrow keys, ESC)

**Does NOT own:**
- Window management (that's WindowManager)
- Desktop state (that's global `state` object)
- Individual demo implementations (that's DemoManager)

### APP_CONFIG
**Owns:**
- App metadata (title, icon, dimensions)
- Content creation logic (per app)
- Window creation calls

**Does NOT own:**
- Windowing itself (that's WindowManager)
- Animations (that's animateWindowOpen)

### Three.js Scene
**Owns:**
- Particle background
- Optional section background models (loaded from GLTF)
- Camera + renderer

**Does NOT own:**
- UI overlay (that's HTML/CSS/WindowManager)
- Slide transitions (that's GSAP)

---

## Suggested Build Order (Phase Dependencies)

### Phase 1: Presentation Data Structure
**Deliverable:** Slide markdown files in `assets/slides/`

1. Extract presentation slides from `index.html` pres-slide divs
2. Convert to markdown files (one per slide)
3. Add metadata (title, timing, speaker notes)
4. Verify markdown parses correctly with `marked.js`

**Why first:** All downstream components depend on having clean slide data.

**Output:** `assets/slides/01-title.md` through `09-reflection.md`

---

### Phase 2: PresentationMode Class
**Deliverable:** `main.js` with new PresentationMode class (~300 lines)

1. Create `PresentationMode` class skeleton
2. Implement `load()` to fetch + parse markdown
3. Implement `enter()` to create fullscreen container
4. Implement `nextSlide()` / `prevSlide()` with basic transitions
5. Implement `exit()` to restore desktop
6. Add keyboard handlers (arrow keys, ESC)
7. Test: Launch from Start menu → verify navigation → verify exit

**Why second:** Core presentation mechanic before styling or demos.

**Integration point:** Modify APP_CONFIG.pres.open() to call `presentation.enter()` instead of creating a window.

---

### Phase 3: Slide Animations with GSAP
**Deliverable:** GSAP animations for each fullscreen slide

1. Copy existing `animatePresSlides()` patterns (stagger children, pop tags, flip cards, etc.)
2. Adapt for fullscreen viewport (larger transforms, longer durations)
3. Add scroll-based animations OR keyboard-triggered animations
4. Test: Navigate through all 9 slides, verify animations fire on demand

**Why third:** Foundational presentation mode must work before adding visual polish.

---

### Phase 4: Three.js Section Backgrounds (Optional)
**Deliverable:** Background scene for presentation sections

1. Load cyberpunk-scene GLTF model (from HANDOFF.md assets — already downloaded)
2. Create Three.js scene with lighting
3. Position camera to show interesting angles
4. Fade between scenes as slides advance (or use same scene with camera pans)
5. Ensure particles layer under presentation (z-index: 9000)

**Why fourth:** Visual enhancement, not critical path. Presentation works without it.

**Note:** This is the "Awwwards-level" immersive background mentioned in HANDOFF.md.

---

### Phase 5: Interactive Demos in Fullscreen
**Deliverable:** DemoManager class + modal overlays for demos

1. Refactor existing demo content (CPU vs GPU grid, architecture comparison) into reusable modules
2. Create `DemoManager` class with `launch(demoId, mode)` and `close(demoId)`
3. Implement fullscreen overlay styling (modal + semi-transparent backdrop)
4. Add demo launchers within slides (clickable sections that call `DemoManager.launch()`)
5. Test: Click demo icon in slide → fullscreen overlay appears → interact → click X or ESC → return to presentation

**Why fifth:** Depends on presentation mode being stable. Demos are secondary features.

---

### Phase 6: Markdown-to-HTML Rendering (Inline)
**Deliverable:** Styled slide HTML from markdown

1. Include `marked.js` library
2. In PresentationMode.load(), convert markdown to HTML
3. Wrap HTML in `.pres-slide` div with CSS classes
4. Add utility classes for styling (`.pres-h1`, `.pres-p`, `.pres-list`, etc.)
5. Test: Verify all slide content renders correctly, spacing is consistent

**Why sixth:** Depends on presentation mode + animations working. Styling refinement.

---

### Phase 7: Keyboard Navigation + Accessibility
**Deliverable:** Full keyboard + screen reader support

1. Add arrow key handlers (left = prev, right = next)
2. Add numpad handlers (1–9 jump to slide)
3. Add Home/End handlers (first/last slide)
4. Add Page Up/Down handlers
5. Announce slide changes to screen readers (aria-live region)
6. Test: Navigate entire presentation using keyboard only

**Why seventh:** Polish phase after core functionality is solid.

---

### Phase 8: Polish + Final QA
**Deliverable:** Zero console errors, smooth animations, rubric compliance

1. Test all presentation slides render correctly
2. Test all transitions animate smoothly
3. Test desktop mode still works (minimize/close apps, navigate)
4. Test exit from presentation returns to desktop cleanly
5. Test all nested modals (research paper in window, terminal commands during presentation)
6. Verify console has ZERO errors
7. Verify rubric criteria are met (Design, Prepare, Create, Communicate, Reflect)

---

## Integration Checklist

- [ ] Presentation mode accessible from Start menu (via APP_CONFIG.pres)
- [ ] Keyboard navigation works (arrows, ESC)
- [ ] Slide animations fire correctly on navigation
- [ ] Markdown parsing produces valid HTML
- [ ] Fullscreen overlay doesn't break WindowManager state
- [ ] Exit from presentation restores desktop cleanly
- [ ] Three.js scene renders correctly under presentation (if using backgrounds)
- [ ] Demo overlays appear/disappear correctly
- [ ] All 9 slides load and animate
- [ ] Console has ZERO errors
- [ ] Rubric requirements covered:
  - **Design:** Fullscreen immersive presentation ✓
  - **Prepare:** Markdown slide source files ✓
  - **Create:** Slide animations + demo interactions ✓
  - **Communicate:** Presentation content covers thesis ✓
  - **Reflect:** Reflection slide + terminal commands ✓

---

## Patterns to Follow

### 1. State Machine for Modes
Keep global `state.phase` consistent:
```javascript
state.phase ∈ ['boot', 'desktop', 'presentation']
```

Each mode is responsible for its own cleanup when transitioning.

### 2. App Config Pattern
All launchable content goes in APP_CONFIG or equivalent:
```javascript
APP_CONFIG.pres = {
  open() { presentation.enter(); }  // NOT: create a window
}
```

This keeps the start menu + icon handlers unified.

### 3. Content Container Abstraction
Presentation mode should accept:
- Markdown files (async fetch)
- Pre-rendered HTML (inline)
- Data objects (this.slides = [...])

The rendering engine doesn't care about the source.

### 4. Animation Composition
Reuse GSAP patterns from existing code:
```javascript
// Existing: animateWindowOpen() per-app logic
// New: slide-specific animations in animatePresSlides()

// Both use: stagger, ease, delay, onComplete callbacks
```

### 5. Z-Index Layering
```
9999:  Presentation fullscreen overlay
9998:  Demo overlays (on top of presentation)
9000:  Three.js scene (under presentation)
300+:  WindowManager windows (under presentation)
100:   Desktop icons
10:    Taskbar
```

---

## Anti-Patterns to Avoid

### ❌ Don't: Treat presentation like an APP_CONFIG window
**Why:** Presentation requires viewport takeover. WindowManager can't constrain it cleanly. Creates z-index wars.

**Instead:** Make it a top-level mode (like boot) that:
- Temporarily hides WindowManager elements
- Owns the viewport until `exit()` is called
- Can launch sub-windows via WindowManager if needed

### ❌ Don't: Hard-code slide HTML in index.html
**Why:** Slides become unmaintainable. Changes require recompiling. Defeats purpose of Markdown.

**Instead:** Fetch markdown from `assets/slides/` directory, parse once, render on demand.

### ❌ Don't: Mix demo implementations (windowed vs fullscreen)
**Why:** Code duplication, harder to update, inconsistent behavior.

**Instead:** Keep demo logic in DemoManager, pass `mode` parameter:
```javascript
DemoManager.launch('cpuVsGpu', 'windowed')   // Existing: open as window
DemoManager.launch('cpuVsGpu', 'fullscreen') // New: overlay on presentation
```

### ❌ Don't: Call animation functions outside of phase context
**Why:** Phase can change (exit presentation), animations fire on deleted elements, console errors.

**Instead:** Store animation timeline references on `state.currentPresentation`, clean up in `exit()`.

### ❌ Don't: Forget to restore focus/keyboard handlers
**Why:** User exits presentation, arrow keys still navigate slides (they shouldn't). Keyboard state is polluted.

**Instead:** Remove keyboard listeners in `presentation.exit()`:
```javascript
document.removeEventListener('keydown', this.keyHandler);
```

---

## Build Order Rationale

**Dependency chain:**
```
Phase 1 (Data)
    ↓
Phase 2 (Core PresentationMode)
    ↓
Phase 3 (Animations)
    ↓
Phase 4 (Backgrounds) ← Optional, no impact if skipped
    ↓
Phase 5 (Demos)
    ↓
Phase 6 (Markdown rendering) ← Can be done in parallel with Phase 5
    ↓
Phase 7 (Accessibility)
    ↓
Phase 8 (QA)
```

**Critical path:** Phases 1–3, 5, 8 (skip Phase 4 if time-constrained).

**Parallel work:** Phase 6 (styling) can start once Phase 2 (structure) is solid.

---

## Files to Create/Modify

| File | Action | Reason |
|---|---|---|
| `assets/slides/01-title.md` – `09-reflection.md` | Create | Slide content sources |
| `lib/marked.min.js` | Add (external CDN or local) | Markdown parsing |
| `main.js` | Modify | Add PresentationMode class, modify APP_CONFIG.pres |
| `style.css` | Modify | Add `.pres-fullscreen`, `.pres-slide`, `.demo-overlay` styles |
| `index.html` | Modify (minimal) | Remove hard-coded pres-slide divs if using external markdown |

---

## Sources

- Existing codebase: `/home/josue/Documents/homework/cornerstone/website/main.js` (1,346 lines)
- Project requirements: `.planning/PROJECT.md` and `HANDOFF.md`
- Reference pattern: WindowManager class (lines 434–650) shows Z-order + modal pattern
- Reference animations: animatePresSlides() (lines 904–1003) shows GSAP + IntersectionObserver pattern
