# Research Summary: Win95 Desktop Architecture for Capstone Presentation

**Project:** IDS2891 Cornerstone — "From Pixels to Intelligence"
**Researched:** 2026-03-30
**Overall Confidence:** HIGH

---

## Executive Summary

The Win95 desktop application is a well-structured, single-file monolithic system with clear separation between boot sequence, window management, and application logic. The current implementation (1,346 lines) uses a state machine (`phase: 'boot'` → `'desktop'`), WindowManager class for app windowing, and APP_CONFIG registry for app launching.

The critical design decision for integrating fullscreen presentations is that **Presentation Mode should be a top-level global state** (like BIOS boot), not an APP_CONFIG window. This preserves WindowManager for standard windowed apps while allowing the presentation to take full viewport control — a hard requirement for the Awwwards-level immersive experience described in HANDOFF.md.

The recommended architecture uses three new components:

1. **PresentationMode class** — manages slide navigation, fullscreen overlay, keyboard handlers
2. **DemoManager class** — makes interactive demos accessible in both windowed and fullscreen contexts
3. **Markdown slide source files** — externalize slide content, enabling maintainability and separation of concerns

This approach integrates cleanly with existing code, reuses GSAP animation patterns already present, and keeps the z-index layering explicit and manageable.

---

## Key Findings

**Stack:** Vanilla HTML/CSS/JS (Three.js for particles, GSAP for animations, Web Audio for sound). No build tools or transpilers. Clean separation of concerns via classes and registry patterns.

**Architecture:** State machine (boot → desktop → presentation) with WindowManager as the core component. Modular GSAP animations per app. Extensible APP_CONFIG registry for launching new apps.

**Critical integration point:** Presentation mode must NOT be constrained by WindowManager. It replaces the desktop viewport entirely (z-index 9999), then restores it on exit. This is fundamentally different from windowed apps (z-index 300+).

**Build order:** Data (markdown slides) → Core PresentationMode → Animations → Demos → Polish. Phases are sequential (Phase N depends on Phase N-1 stability). Critical path is 1–3, 5, 8. Phase 4 (Three.js backgrounds) is optional.

---

## Implications for Roadmap

Based on research, the suggested phase structure for the presentation milestone:

### 1. **Slide Data Extraction** (Phase 1)
- Extract 9 slides from hard-coded HTML in index.html
- Convert to markdown files (`assets/slides/01-09.md`)
- Verify parse tree with `marked.js`
- **Rationale:** All downstream work depends on having clean, maintainable slide data. Keeps presentation content separate from code.
- **Blocks:** Phase 2 (core PresentationMode needs slide data to load)

### 2. **PresentationMode Core** (Phase 2)
- Implement PresentationMode class: load(), enter(), nextSlide(), prevSlide(), exit()
- Integrate with APP_CONFIG.pres (modify open() to call presentation.enter())
- Test full lifecycle: Start menu → fullscreen → keyboard nav → desktop restore
- **Rationale:** This is the architectural foundation. Must be solid before animations or demos.
- **Avoids pitfall:** WindowManager state pollution from treating presentation like a window
- **Blocks:** Phase 3 (animations need stable slide structure)

### 3. **Slide Animations** (Phase 3)
- Adapt existing animatePresSlides() patterns for fullscreen viewport
- Implement per-slide entrance animations (tags pop, cards flip, text stagger, etc.)
- Use GSAP + IntersectionObserver (scroll-based) OR direct call-on-navigation
- **Rationale:** Visual polish on stable core. Reuses proven patterns from current code.
- **Blocks:** Phase 5 (demos need animation infrastructure)

### 4. **Three.js Backgrounds** (Phase 4 — OPTIONAL)
- Load cyberpunk-scene GLTF model
- Fade/pan between scenes as slides advance
- Ensure z-index layering is correct (scene under presentation)
- **Rationale:** Delivers Awwwards-level immersion mentioned in HANDOFF.md
- **Why optional:** Presentation works without it; this is visual enhancement
- **Doesn't block:** Can be skipped if time-constrained

### 5. **Interactive Demos in Fullscreen** (Phase 5)
- Refactor existing demo content (CPU vs GPU grid) into DemoManager
- Implement fullscreen overlay launching
- Add demo icon clickability within slides
- Test: launch → interact → ESC → return to slide
- **Rationale:** Makes existing Experience.exe demos accessible from presentation
- **Avoids pitfall:** Code duplication (same demo, different containers)

### 6. **Markdown Rendering + Styling** (Phase 6)
- Include marked.js library
- Wrap parsed HTML in `.pres-slide` divs with CSS classes
- Add utility classes (`.pres-h1`, `.pres-p`, `.pres-list`)
- **Rationale:** Styling polish on stable rendering
- **Can parallel:** Phase 5 (structure independent)

### 7. **Accessibility + Polish** (Phase 7)
- Keyboard shortcuts (1–9 jump to slide, Home/End, numpad)
- Screen reader announcements (aria-live regions)
- ZERO console errors verification
- Smooth animations sanity check
- **Rationale:** Final polish before submission

### 8. **Rubric Verification** (Phase 8)
- Verify all 5 rubric criteria met:
  - **Design:** Fullscreen immersive presentation ✓
  - **Prepare:** Markdown slide sources + research data ✓
  - **Create:** Slide animations + demo interactions ✓
  - **Communicate:** Presentation covers all sections (intro, methods, transdisciplinary, implications, advocacy) ✓
  - **Reflect:** Reflection slide + terminal commands ✓
- Full end-to-end walkthrough: boot → desktop → presentation → all slides → exit → desktop works
- **Rationale:** Gate before submission

---

## Phase Ordering Rationale

**Sequential dependency chain:**
```
1. Data (slides needed for everything)
  ↓
2. Core structure (presentation mode works)
  ↓
3. Animations (polish on stable core)
  ↓
4. Optional backgrounds (visual enhancement)
  ↓
5. Interactive demos (reuse existing components)
  ↓
6. Markdown rendering (styling refinement)
  ↓
7. Accessibility (final polish)
  ↓
8. Rubric verification (gate)
```

**Why not parallel?** Each phase depends on previous stability:
- Can't animate (phase 3) until structure is solid (phase 2)
- Can't add demos (phase 5) until navigation works (phase 3)
- Can't style (phase 6) until content is loading (phase 2)

**Critical path:** 1→2→3→5→8. Phases 4 (backgrounds) and 6 (styling) can be skipped or shortened if needed.

**Time estimate (rough):**
- Phase 1 (data extraction): 30 min
- Phase 2 (PresentationMode class): 2–3 hours
- Phase 3 (animations): 2–3 hours
- Phase 4 (backgrounds): 1–2 hours (optional)
- Phase 5 (demos): 1–2 hours
- Phase 6 (styling): 1 hour
- Phase 7 (accessibility): 1 hour
- Phase 8 (QA): 1 hour
- **Total:** 9–14 hours (excluding phase 4: 8–12 hours)

---

## Research Flags for Phases

| Phase | Flag | Reason | Mitigation |
|---|---|---|---|
| 1 | ✓ Standard | Slide extraction is straightforward HTML→markdown | Have marked.js ready to test |
| 2 | ⚠️ Integration risk | PresentationMode must NOT break WindowManager state | Test exit() thoroughly; use global state flag to prevent double-entry |
| 3 | ✓ Proven pattern | GSAP animations exist; adapt, don't invent | Copy animatePresSlides() structure; adjust viewport dimensions |
| 4 | ✓ Known assets | GLTF models already downloaded (HANDOFF.md) | Basic Three.js scene setup; defer advanced post-processing if needed |
| 5 | ⚠️ Refactoring risk | Existing demo code is tightly coupled to Experience.exe | Create DemoManager abstraction first; test both modes independently |
| 6 | ✓ Standard | Markdown parsing is deterministic | Test with all 9 slides; verify HTML structure matches CSS expectations |
| 7 | ✓ Standard | Keyboard handlers follow existing patterns | Test against spec: arrows, numpad, Home/End, ESC all work |
| 8 | ⚠️ Final gate | Rubric compliance is binary (pass/fail) | Use rubric checklist in phase 8; fix failures before submission |

---

## Confidence Assessment

| Area | Confidence | Notes |
|---|---|---|
| Stack | HIGH | Existing code verified; clean, well-structured |
| Architecture | HIGH | WindowManager pattern is proven; PresentationMode is logical extension of state machine |
| Integration points | HIGH | Clear boundaries (app vs. mode, window vs. fullscreen, animation triggers) |
| Build order | MEDIUM | Assumes stable phase 2 (PresentationMode). If phase 2 is buggy, phases 3–5 will stall. Recommend thorough phase 2 QA. |
| Markdown parsing | HIGH | marked.js is mature; rendering to HTML is deterministic |
| GSAP animation reuse | HIGH | Existing animatePresSlides() pattern is proven; adaptation is straightforward |
| Three.js backgrounds | MEDIUM | Optional; depends on GLTF model quality and lighting setup. Not on critical path. |
| Demo refactoring | MEDIUM | Existing demo code is imperative; DemoManager abstraction requires careful state management |

---

## Gaps to Address

1. **Slide content authoring** — Phase 1 must convert 9 slides to markdown. Currently hard-coded in HTML. Plan for ~15 min per slide (extract, structure, verify parse).

2. **Keyboard event cleanup** — Phase 2 must ensure keyboard listeners are removed in `presentation.exit()`. If left hanging, arrow keys will fire after exit (console shows no error, but behavior is wrong). Recommend grep-and-test.

3. **Z-index collision risk** — Phase 2 must define z-index boundaries clearly. If a demo window opens during presentation (z-index 300+) and presentation is z-index 9999, windows will be hidden. Document explicitly in code comments.

4. **Markdown to CSS mapping** — Phase 6 must ensure markdown HTML elements match CSS selectors. E.g., if markdown produces `<h1>` but CSS targets `.pres-h1`, content is unstyled. Recommend CSS utility classes on wrapper divs, not on generated elements.

5. **Performance with GLTF models** — Phase 4 (optional). Cyberpunk-scene is 51MB uncompressed. Ensure browser can load + render without frame drops. Test on low-end hardware if possible.

6. **Demo state isolation** — Phase 5 must ensure DemoManager can launch same demo twice (windowed then fullscreen, or vice versa). Shared state can cause bugs. Recommend singleton pattern per demo instance, not global state.

---

## Files to Create/Modify

| File | Type | Lines | Notes |
|---|---|---|---|
| `.planning/research/ARCHITECTURE.md` | Research | ~500 | Comprehensive architecture guide (this document's peer) |
| `assets/slides/01-title.md` – `09-reflection.md` | New | ~100 each | Slide markdown sources |
| `lib/marked.min.js` | New | ~600 (minified) | Markdown parser; can also use CDN |
| `main.js` | Modify | +300 lines | Add PresentationMode class + DemoManager |
| `style.css` | Modify | +200 lines | Add `.pres-fullscreen`, `.pres-slide`, `.demo-overlay` styles |
| `index.html` | Modify (minor) | -50 lines | Remove hard-coded pres-slide divs if using external markdown |

---

## Next Steps (Roadmap Integration)

1. **Create milestone plan** using this research as input
2. **Phase 1 task:** Extract and structure slide markdown files
3. **Phase 2 task:** Implement PresentationMode class skeleton + entry/exit lifecycle
4. **Phase 2 QA gate:** Verify start menu → presentation → navigation → exit → desktop works end-to-end
5. **Phases 3–8** follow in sequence; use phase descriptions above

---

## Sources

- Existing codebase: `/home/josue/Documents/homework/cornerstone/website/` (verified 2026-03-30)
  - `main.js` (1,346 lines) — WindowManager, APP_CONFIG, GSAP animations
  - `index.html` (9 hard-coded pres-slide divs) — presentation HTML
  - `style.css` — existing window chrome + animations
  - `index.html` line 14–18 — Three.js importmap (0.160.0)
  - `index.html` line 20 — GSAP 3.12.5

- Project specification: `/home/josue/Documents/homework/cornerstone/.planning/PROJECT.md`
  - Milestone: v2.0 Final Project — Win95 App Experiences
  - Deadline: Apr 19 11:59 PM
  - Rubric: Design, Prepare, Create, Communicate, Reflect

- Handoff document: `/home/josue/Documents/homework/cornerstone/.planning/phases/11-final-project-interactive-website/HANDOFF.md`
  - GLTF assets downloaded and available in `website/assets/models/`
  - User inspiration: messenger.abeto.co (isometric 3D exploration)
  - Requirements: Awwwards-level immersion, not geometric primitives

---

## Roadmap Implications

**This research supports a milestone with 8 sequential phases** covering presentation integration, from data extraction through rubric verification. The critical path is ~8–12 hours of focused work. The architecture is proven (WindowManager is battle-tested in existing code); the new PresentationMode class is a straightforward extension of the state machine pattern already present.

**No architectural blockers identified.** The main risks are operational (phase 2 stability, z-index management, keyboard cleanup) — all manageable with careful testing and code comments. The optional Phase 4 (Three.js backgrounds) can be deferred without affecting core presentation functionality.
