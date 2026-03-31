# Research Index: Win95 App Experiences & Immersive Presentations

**Scope:** Features, patterns, and best practices for building an award-winning immersive presentation website within the Win95 desktop metaphor
**Researched:** 2026-03-30
**Coordinator:** Claude Code — Phase 6 (Research)

---

## Research Files

### SUMMARY_FEATURES.md
**Purpose:** Executive summary with roadmap implications
**Use Case:** Quick reference for phase planning and deadline forecasting
- 6-phase roadmap with complexity/duration estimates
- Phase ordering rationale
- Research flags for each phase
- Gaps to address later

### FEATURES.md
**Purpose:** Comprehensive feature landscape
**Use Case:** Detailed specification for build phases
- **Table Stakes:** Features rubric requires (7 items)
- **Differentiators:** Features that get Awwwards attention (9 items)
- **Anti-Features:** What NOT to build and why (9 items)
- **Feature Dependencies:** What blocks what
- **MVP Recommendation:** Priority 1–3 phases with complexity assessments
- **Architectural Patterns:** 5 key patterns with code examples
  1. Scene-Per-Slide Architecture
  2. ScrollTrigger + Discrete Slide Navigation
  3. Hardware Metrics as 3D Scale Visualization
  4. Portal Navigation in 3D Lobby
  5. Pre-Parsed Markdown for File Explorer
- **Source Citations:** 30+ verified sources (Awwwards, Codrops, Three.js docs, etc.)

### SUMMARY.md
**Purpose:** Prior research summary (existing file, updated scope)
**Status:** Covers Win95 desktop architecture; slightly different scope than current research
**Integration:** Complements FEATURES research with architectural patterns already identified

### STACK.md
**Purpose:** Technology stack recommendations (existing file)
**Status:** Already researched Three.js, GSAP, postprocessing libraries
**Integration:** Aligns with FEATURES recommendations

### ARCHITECTURE.md
**Purpose:** Detailed system architecture (existing file)
**Status:** Documents PresentationMode class, DemoManager, component boundaries
**Integration:** Provides implementation blueprint for features in FEATURES.md

### PITFALLS.md
**Purpose:** Domain pitfalls and gotchas (existing file)
**Status:** Documents critical pitfalls (2D/3D mixing, markdown parsing, etc.)
**Integration:** Mitigation strategies referenced in FEATURES phase ordering

### INTEGRATION-POINTS.md
**Purpose:** How new features connect to existing codebase (existing file)
**Status:** Maps Feature → WindowManager, GSAP, BIOS, Terminal, etc.
**Integration:** Shows reuse opportunities for each phase

### ASSIGNMENT-CATALOG.md
**Purpose:** Inventory of semester assignments for File Explorer (existing file)
**Status:** Lists all `.md` files to be rendered in My Computer
**Integration:** Dependency for Phase 3 (File Explorer Real Content)

---

## Research Scope

### What This Research Covers

1. **Immersive Website Patterns** (Awwwards-level quality)
   - Bruno Simon's 3D car portfolio (GSAP + Three.js + physics)
   - Messenger Abeto's isometric island exploration
   - Getty TracingArt's scroll-triggered progressive disclosure
   - Shopify Editions Winter 2026 cinematic scrolling + parallax
   - Pangrampangram typography animation + kinetic text

2. **Award-Winning Animation Techniques**
   - GSAP ScrollTrigger (scroll scrubbing, pinned elements, SVG mask transitions)
   - Three.js post-processing effects (bloom, chromatic aberration, depth-of-field)
   - Cinematic camera choreography (camera.position animations)
   - Smooth scroll vs discrete navigation (dual input handling)

3. **Interactive Hardware Visualization**
   - CPU vs GPU vs TPU vs NPU architectural comparison
   - 3D scale visualization (core count as cube size)
   - Real metrics from research paper (data-driven animations)
   - Performance characteristics (power, latency, throughput)

4. **File Explorer & Markdown Rendering**
   - Pre-parsed markdown (build-time JSON) vs browser-side rendering
   - Safe HTML rendering (DOMPurify, trusted sources)
   - Hierarchical folder navigation
   - Syntax highlighting for code/formulas

5. **Win95 Desktop Integration**
   - Multi-layer UI (2D windows + 3D fullscreen sections)
   - Portal-based transitions (visual signal of context switch)
   - Existing WindowManager extension points
   - GSAP timeline coordination with existing animations

### What This Research Does NOT Cover

- **Mobile responsive design** (user constraint: PC-only)
- **Video content** (prefer animated GSAP/Three.js)
- **Branching narratives** (linear GPU evolution story)
- **Full physics simulation** (simple WASD movement sufficient)
- **Procedural 3D generation** (use downloaded GLTF assets)

---

## Methodology

### Sources Used

1. **Context7** (official library docs) — None applicable (no proprietary libraries)
2. **Official Docs** — Three.js.org, GSAP docs, pmndrs postprocessing, Web Audio API
3. **Awwwards & Award-Winning Examples** — bruno-simon.com, messenger.abeto.co, Shopify, Getty
4. **Industry Blogs** — Codrops, CSS-Tricks, DEV Community, Medium design bootcamp
5. **WebSearch** — Verified across multiple sources for confidence assessment

### Verification Protocol

**Confidence Levels Assigned:**
- **HIGH:** Verified with multiple sources + official docs (Three.js stack, GSAP ScrollTrigger)
- **MEDIUM-HIGH:** Award-winning patterns researched, but implementation untested in this codebase
- **MEDIUM:** Identified pitfalls, but full mitigation strategy requires build-time validation
- **LOW:** Gaps that need phase-specific research (color language, exact metrics selection)

---

## Key Takeaways for Build Team

### Phase 1 is Critical
Presentation slides (9 fullscreen scenes) are the rubric's primary visual deliverable. Awwwards-level quality here determines capstone success. Everything else is supporting.

### Use Award-Winning Patterns, Not DIY
Don't build custom animation systems. GSAP ScrollTrigger + Three.js camera are battle-tested in bruno-simon.com and others. Reuse patterns directly.

### Pre-Parse Markdown at Build Time
Avoid browser-side markdown rendering (slow + security risks). Parse `.md` files to JSON at build time, render safely at runtime.

### 3D Scale > Charts
Don't show bar charts for hardware metrics. Visualize core counts as 3D cube sizes. 16,000 GPU cores = massive cube vs 8 CPU cores = tiny cube = instant understanding.

### Dual Navigation Unlocks Immersion
Users can scroll smoothly (GSAP ScrollTrigger scrubbing) OR use arrow keys (discrete slides). Both work together, neither alone.

### 2D→3D Transitions Must Be Intentional
Switching from Win95 desktop to fullscreen immersive isn't a bug — it's a design choice. Use darkened transitions, portal effects, or audio cues to signal context switch.

---

## For the Roadmap

**Phase 1 (Presentation Slides):** 8–12 hours, HIGH complexity, CRITICAL path
**Phase 2 (Hardware Demo):** 6–8 hours, MEDIUM-HIGH complexity, completes narrative
**Phase 3 (File Explorer):** 4–6 hours, MEDIUM complexity, rubric compliance
**Phase 4 (Effects):** 2–4 hours, LOW complexity, visual polish
**Phase 5 (Typography):** 4–6 hours, MEDIUM complexity, narrative depth
**Phase 6 (Sound):** 2–3 hours, LOW complexity, nice-to-have

**Total estimated time:** 26–39 hours (4–6 days full-time, assuming Apr 19 deadline)

---

## Confidence Summary

| Component | Confidence | Risk Mitigation |
|-----------|-----------|-----------------|
| **Technology Stack** | HIGH | All verified with multiple award-winning examples |
| **Feature Landscape** | MEDIUM-HIGH | Rubric requirements clear; some implementation details unknown |
| **Architecture Patterns** | MEDIUM | Untested hybrid (2D + 3D); may need iteration on transitions |
| **Pitfalls** | MEDIUM | Main pitfall identified; others may emerge during build |
| **Timeline** | MEDIUM | Depends on narrative structure finalization + metrics validation |

---

## Next Research Needed (By Phase)

- **Before Phase 1:** Finalize 9-slide narrative structure, design camera choreography per slide
- **Before Phase 2:** Extract exact hardware metrics from research paper, validate accuracy
- **Before Phase 3:** Organize `.md` files into hierarchy, test markdown→JSON conversion
- **Before Phase 4:** Determine color language per era (gaming neon, AI cool blue, specialized metallic)
- **Before Phase 5:** Source additional portraits, decide animation timings
- **Before Phase 6:** License or create SFX, test audio latency in Web Audio API

---

## Files Modified/Created in This Research

- `/home/josue/Documents/homework/cornerstone/.planning/research/FEATURES.md` — Created (23 KB)
- `/home/josue/Documents/homework/cornerstone/.planning/research/SUMMARY_FEATURES.md` — Created (9.3 KB)
- `/home/josue/Documents/homework/cornerstone/.planning/research/INDEX.md` — Created (this file)

## Existing Research Files (Updated Scope)

- `SUMMARY.md` — Covers Win95 architecture; complements features research
- `STACK.md` — Technology recommendations; verified by features research
- `ARCHITECTURE.md` — System components; provides implementation blueprint
- `PITFALLS.md` — Domain gotchas; mitigation in phase ordering
- `INTEGRATION-POINTS.md` — Feature→codebase connections
- `ASSIGNMENT-CATALOG.md` — Assignment list for File Explorer phase

---

## Final Recommendation

**Proceed to roadmap creation with SUMMARY_FEATURES + FEATURES as primary inputs.**

The research establishes:
1. Stack is proven (no experimental tech)
2. Architecture is sound (multi-layer 2D+3D is doable)
3. Pitfalls are identified (transitions, markdown parsing, metrics accuracy)
4. Phases are ordered correctly (critical rubric items first)
5. Timeline is realistic (26–39 hours for full build)

Roadmap should follow phase ordering exactly. Quality gates between phases ensure earlier issues are caught before later phases depend on them.
