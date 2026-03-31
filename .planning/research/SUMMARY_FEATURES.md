# Research Summary: Win95 App Experiences & Immersive Presentations

**Domain:** Interactive educational website — Win95 desktop metaphor + award-winning immersive research presentation on GPU/AI hardware evolution
**Researched:** 2026-03-30
**Overall Confidence:** MEDIUM-HIGH (award-winning patterns well-documented and verified; existing codebase reviewed)

---

## Executive Summary

The capstone project combines two design paradigms:
1. **Win95 Desktop Metaphor** — nostalgic UI (Notepad, Terminal, File Explorer, Recycle Bin)
2. **Award-Winning Immersive Web Experience** — Awwwards-level 3D scenes, cinematic animations (Presentation.exe, Experience.exe, 3D Lobby)

These coexist successfully when:
- Win95 apps remain lightweight 2D UI containers
- Presentation sections are fullscreen immersive experiences
- The 3D lobby acts as spatial "hub" connecting different content zones

Award-winning immersive websites use:
- **Three.js + GLTF models** for 3D (not procedural primitives)
- **GSAP ScrollTrigger + timelines** for choreographed animations
- **Post-processing effects** (bloom, chromatic aberration) for visual polish
- **Scene-per-section architecture** where each piece feels like a different world
- **Dual navigation** — smooth scroll + discrete controls (arrows, buttons)

The 9-slide GPU hardware evolution presentation is critical. Each slide needs:
- Unique visual treatment (colors, lighting, 3D assets, typography)
- Specific animation choreography (text reveals, camera moves, morphing)
- Data-accurate metrics visualized in 3D (showing *why* things matter, not just explaining)
- Audio/environmental cues (beeps during gaming era → ambient AI music → mechanical special era)

File explorers in immersive sites typically:
- Pre-parse markdown at build time (avoid fragile browser-side rendering)
- Show real content (assignments, research sections) organized hierarchically
- Render with syntax highlighting for code/formulas
- Stay within Win95 window metaphor (no fullscreen takeovers)

Interactive hardware demos use:
- **3D scale visualization** instead of charts (16,000 GPU cores = huge cube vs 8 CPU cores = tiny cube = instant understanding)
- **Animated side-by-side comparisons** (CPU vs GPU vs TPU vs NPU)
- **Real metrics from research paper** (not made-up numbers)

---

## Key Findings

**Stack:** Three.js 0.160+, GSAP 3.12+, pmndrs postprocessing, Web Audio, showdown.js
- **Why:** All proven in award-winning sites (bruno-simon.com, landonorris.com, Shopify Editions). Industry standard, not experimental.

**Architecture:** Multi-layer — Win95 desktop wraps around fullscreen immersive sections. Transitions via portals or fullscreen takeovers signal leaving/entering immersion.
- **Why:** Honors both constraints (nostalgic capstone aesthetic) and goals (Awwwards-level quality).

**Critical Pitfall:** 2D Win95 UI mixed with 3D fullscreen scenes feels disjointed if transitions aren't intentional.
- **Mitigation:** Use darkened transitions or portal effects that signal "you're leaving the desktop."

---

## Implications for Roadmap

### Phase 1: Presentation Slides Foundation (CRITICAL)
- **Goal:** 9 fullscreen slides with scene-per-slide animations, arrow key navigation, scroll scrubbing
- **Addresses:** Rubric Design + Communicate criteria (primary visual deliverable)
- **Key:** Each slide is a Three.js scene with unique lighting, camera, 3D assets — not HTML cards
- **Avoids pitfall:** Think cinematically, not PowerPoint
- **Complexity:** High | **Duration:** 8–12 hours
- **Why first:** Every other feature depends on this. Capstone fails if presentation isn't Awwwards-level.

### Phase 2: Hardware Evolution Visualization (CRITICAL)
- **Goal:** Interactive 3D demo — CPU vs GPU vs TPU vs NPU metrics side-by-side
- **Addresses:** Rubric Create + Communicate criteria (visual proof of understanding)
- **Key:** Use 3D scale (cube size = core count), pull real numbers from research paper
- **Avoids pitfall:** Making up metrics or disconnected visuals — everything defensible
- **Complexity:** Medium-High | **Duration:** 6–8 hours
- **Why second:** Completes presentation narrative. Slides show *what* happened; demo shows *why* (metrics prove specialization works).

### Phase 3: File Explorer Real Content (Rubric Prepare)
- **Goal:** File explorer showing real semester assignments and research sections with markdown rendering
- **Addresses:** Rubric Prepare criterion ("show your work")
- **Key:** Pre-parse `.md` files at build time into JSON (avoid browser markdown parsing). Render safely.
- **Avoids pitfall:** Dynamic markdown parsing (slow + security risks)
- **Complexity:** Medium | **Duration:** 4–6 hours
- **Why third:** Rubric Prepare less visually critical. After presentation + experience solid, add this.

### Phase 4: Post-Processing Effects & Polish (Differentiator)
- **Goal:** Apply bloom, chromatic aberration, depth-of-field
- **Addresses:** Design criterion (visual polish = Awwwards attention)
- **Key:** Use pmndrs library; subtle use (bloom doesn't blow out; chromatic aberration is understated)
- **Complexity:** Low | **Duration:** 2–4 hours
- **Why fourth:** Doesn't block rubric. If time tight, can defer.

### Phase 5: Typography & Portrait Gallery (Differentiator)
- **Goal:** Animated text (hardware names scale per theme), pioneer portraits with hovers
- **Addresses:** Design + Communicate (humanizes story, adds depth)
- **Key:** Typography reflects narrative (neon for gaming, blue for AI, metallic for specialized)
- **Complexity:** Medium | **Duration:** 4–6 hours
- **Why fifth:** Adds narrative depth but not required for rubric. Defer if time critical.

### Phase 6: Sound & Polish (Nice-to-Have)
- **Goal:** Audio for boot, portals, ambient scenes
- **Addresses:** Design criterion (immersion)
- **Key:** Subtle (doesn't annoy); reuse boot.mp3, find CC0 SFX
- **Complexity:** Low | **Duration:** 2–3 hours
- **Why sixth:** Polish, not blockers. Defer if approaching deadline.

---

## Phase Ordering Rationale

1. **Presentation first** — Rubric's primary visual component
2. **Experience second** — Completes narrative; shows understanding
3. **File Explorer third** — Rubric compliance + credibility
4. **Effects + Typography fourth** — Differentiators that elevate quality
5. **Sound last** — Polish; easy to defer

---

## Research Flags for Phases

| Phase | Needs Research | Why |
|-------|---|---|
| Presentation | Maybe | How to structure 9-slide narrative across animations? Already researched: scene-per-slide with unique camera/lighting per slide. |
| Hardware metrics | **YES** | Validate exact specs from research paper. **Risk:** If numbers wrong, demo loses credibility. Mitigation: cite every metric to paper sections. |
| File Explorer | No | Markdown rendering is solved (showdown.js, DOMPurify). Standard pattern. |
| Post-processing | No | pmndrs documented; mostly parameter tweaking. |
| Typography | Maybe | Color language per era? (Gaming = neon cyan/pink, AI = deep blue, Specialized = corporate gray). Could benefit from design research but not blocking. |
| Sound | No | Web Audio straightforward; main work is asset sourcing (can defer). |

---

## Confidence Assessment

| Area | Level | Notes |
|------|-------|-------|
| Stack | **HIGH** | Three.js, GSAP, pmndrs are industry standard. Verified across multiple award-winning sites. |
| Features | **MEDIUM-HIGH** | Table stakes from rubric clear. Differentiators researched from Awwwards examples. Some creativity needed for visualization approach. |
| Architecture | **MEDIUM** | Multi-layer (2D + 3D) untested in this codebase. Risk: transitions could feel jarring without careful choreography. |
| Pitfalls | **MEDIUM** | Main pitfall identified (2D/3D mixing), but implementation risk unknown until building. May need iteration on transition design. |

**Increases confidence:** Existing Three.js code works, all 3D assets downloaded, research paper final (stable metrics source)

**Decreases confidence:** No prior Win95 + immersive hybrid in codebase (first attempt), hardware viz untested, Apr 19 deadline limits iteration

---

## Gaps to Address in Later Phases

1. **Narrative structure for 9 slides** — How do research paper's GPU timeline (GeForce 256 → Blackwell) map to 9 slides? Do eras group together? What's each slide's hook?

2. **Color language per era** — Gaming (neon cyan/magenta), AI (cool blue/purple), Specialized (metallic gray). Should validate against design trends.

3. **Hardware metrics selection** — Which specs matter most per processor? Need to extract + validate from research paper.

4. **3D Asset fit** — Do quaternius sci-fi props match "hardware evolution" aesthetic? Will cyberpunk-scene work as lobby? Build-time decision.

5. **File explorer performance** — Large `.md` files may need pagination/search optimization. Address in phase if needed.

---

## Output Files Created

- **FEATURES.md** — Detailed feature landscape with table stakes, differentiators, anti-features, complexity assessment, architectural patterns
- **SUMMARY_FEATURES.md** (this file) — Executive summary with roadmap implications and phase ordering

## Next Steps

Once research approved:
1. Phase 1 begins — team writes 9-slide narrative outline, designs camera choreography
2. Phase 1 code — build Three.js scenes, add GSAP timelines, test navigation
3. Phases proceed in order with verification gates between each
