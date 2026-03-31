# Integration Points: PresentationMode + Existing Architecture

**Project:** Win95 Desktop OS → Fullscreen Presentation
**Researched:** 2026-03-30
**Purpose:** Explicit API boundaries between new and existing components

---

## Quick Reference: What Connects to What

### Global State
```javascript
state.phase ∈ ['boot', 'desktop', 'presentation']
// Boot (existing) → Desktop (existing) → Presentation (new) → back to Desktop
```

### WindowManager Entry Points (Existing)
```javascript
const wm = new WindowManager();  // Global instance, line 652

// Called by:
// - APP_CONFIG.paper.open()        (line 1015)
// - APP_CONFIG.pres.open()         (WILL CHANGE — see below)
// - APP_CONFIG.exp.open()          (line 1040)
// - APP_CONFIG.explorer.open()     (line 1090)
// - APP_CONFIG.terminal.open()     (line 1138)
// - APP_CONFIG.notepad.open()      (line 1168)
// - APP_CONFIG.recycle.open()      (line 1228)
```

### Animation Hooks (Existing)
```javascript
function animateWindowOpen(appId, el) {
  // Called by all APP_CONFIG.open() methods after wm.createWindow()
  // Per-app switch statement (lines 658–785)
}

function animatePresSlides(panel) {
  // Called ONLY by APP_CONFIG.pres.open() (line 1029)
  // Uses IntersectionObserver on scroll (line 982)
}
```

### GSAP & Three.js (Existing)
```javascript
// GSAP available globally: window.gsap (CDN, line 20)
// Three.js available globally: import statements work (line 2)
// Particle animation in animate() loop (lines 1327–1345)
```

---

## How PresentationMode Integrates

### Entry Point 1: APP_CONFIG.pres.open()

**Current code (line 1019–1030):**
```javascript
pres: {
  title: 'Presentation.exe',
  icon: '🎬',
  width: 900,
  height: 640,
  open() {
    const panel = document.getElementById('panelPres');
    const winEl = wm.createWindow('pres', this.title, this.icon, panel, ...);
    if (panel) panel.classList.add('open');
    animateWindowOpen('pres', winEl);
    setTimeout(() => animatePresSlides(panel), 400);
  }
}
```

**NEW code (after Phase 2):**
```javascript
pres: {
  title: 'Presentation.exe',
  icon: '🎬',
  width: 900,  // Unused but kept for compatibility
  height: 640, // Unused but kept for compatibility
  open() {
    // Instead of creating a window, enter fullscreen mode
    presentation.enter();
  }
}
```

**Integration:** Single entry point. No changes needed to Start menu, taskbar, or icon handlers.

---

### Entry Point 2: Keyboard Navigation

**New (Phase 2):**
```javascript
// In PresentationMode constructor
document.addEventListener('keydown', (e) => {
  if (state.phase !== 'presentation') return;  // CRITICAL: phase guard

  if (e.key === 'ArrowRight' || e.key === ' ') this.nextSlide();
  if (e.key === 'ArrowLeft') this.prevSlide();
  if (e.key === 'Escape') this.exit();
  if (e.key >= '1' && e.key <= '9') this.goToSlide(parseInt(e.key) - 1);
});
```

**Cleanup in exit() (CRITICAL):**
```javascript
exit() {
  document.removeEventListener('keydown', this.keyHandler);  // Remove listener
  state.phase = 'desktop';
  document.getElementById('pres-fullscreen').remove();
  wm.layer.style.display = 'block';  // Restore WindowManager visibility
  // ... other cleanup
}
```

**Why phase guard:** Without it, arrow keys fire on slide elements even after exit (state pollution).

---

### Entry Point 3: Demo Launching from Slides

**New (Phase 5):**
```javascript
// In slide HTML (from markdown + parsed)
<div class="slide-interactive">
  <button onclick="DemoManager.launch('cpuVsGpu', 'fullscreen')">
    Run CPU vs GPU Demo
  </button>
</div>
```

**DemoManager (new class):**
```javascript
class DemoManager {
  static launch(demoId, mode = 'windowed') {
    if (mode === 'fullscreen') {
      // Create overlay on top of presentation
      const overlay = document.createElement('div');
      overlay.className = 'demo-overlay';
      overlay.style.zIndex = '9998';  // Just under Escape
      document.body.appendChild(overlay);

      // Initialize demo (existing code from Experience.exe)
      const demo = this.getDemoContent(demoId);
      overlay.appendChild(demo);

      // Store reference for cleanup
      this.activeOverlay = overlay;

      // Add close handler
      overlay.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') this.close();
      });
    } else if (mode === 'windowed') {
      // Existing: use WindowManager
      const demo = this.getDemoContent(demoId);
      wm.createWindow('demo-' + demoId, 'Demo: ' + demoId, '🔬', demo);
    }
  }

  static close() {
    if (this.activeOverlay) {
      this.activeOverlay.remove();
      this.activeOverlay = null;
    }
  }
}
```

**Integration:** Demos are available in both contexts (window + fullscreen). No code duplication.

---

### Entry Point 4: Z-Index Layering

**Critical decision — define in CSS:**

```css
/* Existing: Three.js background */
#scene {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1;  /* Under everything */
}

/* Existing: Taskbar */
#taskbar {
  z-index: 10;
}

/* Existing: Desktop icons */
.desktop-icon {
  z-index: 100;
}

/* Existing: WindowManager windows */
.win95-window {
  z-index: 300+;  /* Dynamic, managed by WindowManager.zCounter */
}

/* NEW: Presentation fullscreen overlay */
.pres-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 9999;  /* Top level, covers everything except next item */
  background: var(--pres-bg);
}

/* NEW: Demo overlays (on top of presentation) */
.demo-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;  /* Just below close button Escape handler */
  background: rgba(0, 0, 0, 0.5);  /* Semi-transparent backdrop */
}

/* NEW: Escape/close button for demo overlay (implicit) */
/* Use ESC key handler, not DOM button */
```

**Rule:** Z-index never exceeds 9999. Presentation owns viewport until exit.

---

## State Transitions

### Boot → Desktop (Existing)
```javascript
// Line 396–419: showWin95Desktop()
state.phase = 'desktop';
desktop.classList.add('visible');
buildStartMenu();
// ...
const wm = new WindowManager();
```

### Desktop → Presentation (NEW)
```javascript
// In APP_CONFIG.pres.open()
presentation.enter();

// In PresentationMode.enter()
state.phase = 'presentation';
document.getElementById('pres-fullscreen').classList.add('visible');
document.getElementById('taskbar').style.display = 'none';  // Hide taskbar
document.getElementById('desktop').style.display = 'none';   // Hide desktop
```

### Presentation → Desktop (NEW)
```javascript
// In PresentationMode.exit()
state.phase = 'desktop';
document.getElementById('pres-fullscreen').remove();
document.getElementById('taskbar').style.display = 'block';  // Restore
document.getElementById('desktop').style.display = 'block';  // Restore
this.cleanup();  // Remove event listeners
```

### Presentation → Demo Overlay (NEW)
```javascript
// In DemoManager.launch('fullscreen')
// state.phase stays 'presentation' (NOT a separate state)
// Overlay is just a DOM element, not a mode change
// Escape handler: this.close() → remove overlay → stay in presentation mode
```

---

## Data Flow: Slide Loading & Rendering

### Phase 1: Slide Markdown Files
```
assets/slides/01-title.md
├─ Markdown source: # Title, **bold**, etc.
└─ Will be fetched by PresentationMode.load()
```

### Phase 2: PresentationMode.load()
```javascript
async load() {
  const slideUrls = [
    'assets/slides/01-title.md',
    'assets/slides/02-intro.md',
    // ... 03–09
  ];

  this.slides = await Promise.all(
    slideUrls.map(url =>
      fetch(url)
        .then(r => r.text())
        .then(md => ({
          markdown: md,
          html: marked.parse(md),  // Convert MD to HTML
          element: null             // Created on demand
        }))
    )
  );
}
```

### Phase 6: Rendering HTML (Safe)
```javascript
renderSlide(index) {
  const slide = this.slides[index];
  if (!slide) return;

  // Create slide container
  const slideEl = document.createElement('div');
  slideEl.className = 'pres-slide';

  // Parse HTML string to DOM safely
  // Option A: Use DOMPurify.sanitize() if markdown could be untrusted
  // Option B: Manual DOM construction if content is known safe

  // Safe approach for trusted markdown sources (our case):
  const parser = new DOMParser();
  const doc = parser.parseFromString(slide.html, 'text/html');

  // Copy text content safely, avoiding script injection
  Array.from(doc.body.childNodes).forEach(node => {
    slideEl.appendChild(node.cloneNode(true));
  });

  // Add to DOM
  this.container.appendChild(slideEl);

  // Trigger animations
  animatePresSlides(slideEl);
}
```

**Safety approach:** Use DOMParser + cloneNode for safe rendering. No innerHTML from external markdown without sanitization (see SECURITY note below).

**SECURITY NOTE:** In this project, markdown files are author-controlled (in assets/slides/). No user input involved. If markdown were user-provided, use DOMPurify library:
```javascript
const sanitized = DOMPurify.sanitize(slide.html);
const temp = document.createElement('div');
temp.textContent = '';  // Clear
temp.appendChild(DOMPurify.createContextualFragment(sanitized));
slideEl.appendChild(temp);
```

---

## Existing Patterns to Reuse

### Pattern 1: GSAP Animations with Stagger
**Existing (lines 662–677):**
```javascript
children.forEach(child => {
  gsap.fromTo(child,
    { x: (Math.random() - 0.5) * 200, y: (Math.random() - 0.5) * 200, opacity: 0, scale: 0.3 },
    { x: 0, y: 0, opacity: 1, scale: 1, duration: 0.5 + Math.random() * 0.3,
      ease: 'power3.out', delay: Math.random() * 0.2 }
  );
});
```

**Reuse in Phase 3:**
```javascript
// Slide entrance animations
animateSlideEntrance(index) {
  const slide = document.querySelector(`.pres-slide[data-index="${index}"]`);
  const children = slide.querySelectorAll('h1, h2, p, li');

  gsap.fromTo(children,
    { y: 20, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.6, stagger: 0.08, ease: 'power2.out' }
  );
}
```

### Pattern 2: IntersectionObserver for Scroll-Triggered Animations
**Existing (lines 982–1003):**
```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const slide = entry.target;
    const idx = Array.from(slides).indexOf(slide);
    if (idx >= 0 && idx < animations.length) {
      animations[idx](slide);
    }
    observer.unobserve(slide);
  });
}, { root: scrollContainer, threshold: 0.15 });

slides.forEach(s => observer.observe(s));
```

**Reuse in Phase 3 (if using scroll instead of keyboard):**
```javascript
// Slides auto-animate when scrolling into view
// Same pattern, applied to fullscreen slides
// threshold: 0.15 means "animate when 15% visible"
```

### Pattern 3: Per-App Animation Switch
**Existing (lines 658–785):**
```javascript
switch (appId) {
  case 'paper': { /* ... */ break; }
  case 'pres': { /* ... */ break; }
  // ... per-app logic
}
```

**Adapt for Phase 3 (slide-per-slide animations):**
```javascript
const slideAnimations = {
  0: (el) => { /* Title slide: fade up */ },
  1: (el) => { /* Intro: slide from left */ },
  2: (el) => { /* RQs: stagger children */ },
  // ... 3–8
};

nextSlide() {
  if (slideAnimations[this.currentIndex]) {
    slideAnimations[this.currentIndex](this.currentSlideElement);
  }
}
```

---

## Critical Integration Tests

### Test 1: Phase 2 Entry/Exit Lifecycle
```javascript
// From desktop, click Start menu → "Presentation.exe"
✓ APP_CONFIG.pres.open() calls presentation.enter()
✓ state.phase changes to 'presentation'
✓ pres-fullscreen div appears with z-index: 9999
✓ Taskbar hides
✓ Slide 1 renders and animates
✓ Arrow keys advance slides
✓ ESC exits to desktop
✓ state.phase back to 'desktop'
✓ Taskbar visible again
✓ Can launch other apps from Start menu
✓ Console has ZERO errors
```

### Test 2: Keyboard Handler Cleanup
```javascript
// Exit presentation, then press arrow keys
✓ No slides advance (keyboard handler removed)
✓ Subsequent keydown events don't fire on deleted elements
✓ No console errors or unhandled promise rejections
```

### Test 3: Demo Launching from Presentation
```javascript
// In slide, click demo icon
✓ DemoManager.launch('cpuVsGpu', 'fullscreen') fires
✓ Overlay appears with z-index: 9998 (above presentation)
✓ Demo is interactive
✓ ESC closes overlay
✓ Presentation still visible underneath
✓ Arrow keys still navigate presentation (overlay doesn't capture them)
✓ Can close overlay and continue presentation
```

### Test 4: WindowManager Still Works
```javascript
// From desktop, launch Experience.exe (while not in presentation)
✓ wm.createWindow() works
✓ Window has focus, z-index: 300+
✓ Drag, minimize, maximize, close all work
✓ Taskbar pills appear/disappear
✓ Can launch multiple windows (z-order preserved)
```

### Test 5: Three.js Particle Background
```javascript
// Enter presentation
✓ Particles still animate under fullscreen overlay
✓ animate() loop still fires (requestAnimationFrame)
✓ z-index layering is correct (scene at 1, presentation at 9999)
✓ No performance degradation from overlay
```

---

## Files Modified vs. Created

| File | Type | Change | Lines |
|---|---|---|---|
| `main.js` | Modify | Add PresentationMode class | +350 |
| `main.js` | Modify | Add DemoManager class | +150 |
| `main.js` | Modify | Change APP_CONFIG.pres.open() | -10 lines, +2 lines |
| `style.css` | Modify | Add `.pres-fullscreen`, `.pres-slide`, `.demo-overlay` | +150 |
| `index.html` | Modify | Remove hard-coded pres-slide divs (or leave if not using external MD) | -200 lines (optional) |
| `lib/marked.min.js` | Create | Markdown parser | 600 (minified) |
| `assets/slides/*.md` | Create | 9 slide markdown files | ~100 each |

---

## Dependency Graph

```
START:
  ↓
App launched → APP_CONFIG.pres.open()
  ↓
presentation.enter() called
  ↓
state.phase = 'presentation'
  ├─ Hide #desktop, #taskbar
  ├─ Create .pres-fullscreen (z-index 9999)
  ├─ Call presentation.load() if not already loaded
  ├─ Render slide 1
  ├─ Add keyboard listeners (phase guard: state.phase === 'presentation')
  └─ (GSAP animates slide 1 entrance)
  ↓
User presses ArrowRight
  ↓
presentation.nextSlide()
  ├─ Increment currentIndex
  ├─ Render slide N
  ├─ Trigger slideAnimations[N](element)
  └─ (GSAP animates slide N entrance)
  ↓
User clicks demo icon
  ↓
DemoManager.launch('cpuVsGpu', 'fullscreen')
  ├─ Create .demo-overlay (z-index 9998)
  ├─ Populate with demo content
  ├─ Demo is interactive (click, drag, etc.)
  └─ Add ESC handler to close overlay
  ↓
User presses ESC in demo
  ↓
DemoManager.close()
  ├─ Remove .demo-overlay
  ├─ state.phase still 'presentation'
  └─ Arrow keys still navigate slides
  ↓
User presses ESC in presentation
  ↓
presentation.exit()
  ├─ Remove .pres-fullscreen
  ├─ Show #desktop, #taskbar
  ├─ Remove keyboard listeners (CRITICAL)
  ├─ state.phase = 'desktop'
  └─ WindowManager is active again
  ↓
END
```

---

## Quick Checklist for Phase 2 Implementation

- [ ] Create PresentationMode class skeleton
- [ ] Implement `enter()` method — hide desktop, create overlay, load slides
- [ ] Implement `nextSlide()` / `prevSlide()` — update DOM, trigger animations
- [ ] Implement `exit()` method — restore desktop, remove listeners, cleanup
- [ ] Add keyboard handler with phase guard
- [ ] Remove listener in exit()
- [ ] Modify APP_CONFIG.pres.open() to call presentation.enter()
- [ ] Test: Start menu → presentation → keyboard nav → ESC → desktop ✓
- [ ] Verify console has ZERO errors
- [ ] Verify taskbar hidden/shown correctly
- [ ] Verify WindowManager is still accessible after exit
- [ ] Verify keyboard doesn't fire after exit

---

## Sources

All code references are from verified reads of:
- `/home/josue/Documents/homework/cornerstone/website/main.js` (1,346 lines, lines cited)
- `/home/josue/Documents/homework/cornerstone/website/index.html` (structure verified)
- `/home/josue/Documents/homework/cornerstone/website/style.css` (existing patterns)
