# Phase 11: Final Project — Interactive Website - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning
**Source:** User discussion + Canvas assignment description (Assignment #17)

<domain>
## Phase Boundary

Build and submit the final interactive website as the research artifact (Assignment #17). Due Apr 19, worth 100 points. Must synthesize research from Research Documentation with own ideas. At least 5 sources used. Graded on Capstone Rubric: Design, Prepare, Create, Communicate, Reflect.

</domain>

<decisions>
## Implementation Decisions

### Design Direction
- **D-01:** FULL REDESIGN — start fresh, don't patch the WIP
- **D-02:** Apple-style scroll narrative — full-bleed sections, parallax, pin-and-scroll with GSAP
- **D-03:** Dark techy mood — dark background (#0a0a0a), glowing accents (NVIDIA green #76b900 or electric blue), monospace code snippets, circuit-board textures. NVIDIA keynote meets Apple product page.
- **D-04:** Large typography, generous whitespace, premium feel
- **D-05:** Mobile-responsive throughout
- **D-06:** Notable figures (Jensen, Hinton, Moore, Lisa Su, Fei-Fei Li, Karpathy, Altman, Amodei, Keller) featured PROMINENTLY — dedicated section with photos and contributions

### Content Structure
- **D-07:** Content draws from the 13,455-word research paper — distill key narrative into visual sections
- **D-08:** Key sections: Hero → Hook (gaming GPU → AI) → GPU Evolution timeline → Specialized Chips (TPU/NPU) → Software Revolution → Psychology of Cloud → Notable Figures → Local AI Future → Sources
- **D-09:** 5+ sources integrated (minimum) — cite key papers/sources visually within the narrative
- **D-10:** 99% non-technical audience — accessible language, visual explanations over text walls
- **D-11:** Meta-narrative: the website itself was built with AI tools, explaining AI hardware

### Technical Approach
- **D-12:** Vanilla HTML/CSS/JS + GSAP + ScrollTrigger — no framework needed for a single-page scroll site
- **D-13:** Drop reveal.js dependency — not actually used in the WIP
- **D-14:** Reuse existing notable figure images from website/ directory
- **D-15:** Single index.html + style.css + main.js for easy submission as file upload or URL
- **D-16:** Host-agnostic — should work as a local file or deployed anywhere

### Interactivity
- **D-17:** Scroll-driven animations throughout — elements reveal on scroll, counters animate, sections pin
- **D-18:** Animated architecture comparison diagrams (CPU vs GPU core layout visualization)
- **D-19:** Interactive timeline of NVIDIA GPU generations (Fermi → Blackwell)
- **D-20:** Stat counters that animate on scroll (86% market share, $47B revenue, etc.)
- **D-21:** Hover effects on notable figure cards

### Claude's Discretion
- Exact color palette details beyond the dark/accent direction
- Animation timing and easing curves
- Section transition styles
- Font sizes and spacing specifics
- How to visualize architecture comparisons (CSS art vs SVG vs canvas)

</decisions>

<canonical_refs>
## Canonical References

### Primary content source
- `research-paper.md` — 13,455-word paper. Distill key sections into website content.

### Existing assets
- `website/*.jpg` — Notable figure images (Jensen, Hinton, Moore, Lisa Su, Fei-Fei Li, Karpathy, Altman, Amodei, Keller)
- `website/assets/` — Any existing assets directory

### Course requirements
- `.planning/REQUIREMENTS.md` — Assignment #17 description with rubric
- `.planning/ROADMAP.md` §Phase 11

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- 9 notable figure JPG images in website/ directory
- WIP has font imports (Inter + JetBrains Mono) — good choices, keep them
- WIP has GSAP animation patterns (data-anim attributes, scroll-triggered counters)

### Established Patterns
- Single-page scroll site with section-based layout
- CSS custom properties for theming
- GSAP ScrollTrigger for scroll-based animations

### Integration Points
- Final submission as file upload or URL to Canvas
- Research paper content feeds into website sections
- APA citations integrated visually (not just a references page)

</code_context>

<specifics>
## Specific Ideas

- The architecture comparison (CPU vs GPU) should be VISUAL — show the core layout difference with animated diagrams, not just text
- The GPU timeline should feel like scrolling through history — each generation pins and reveals
- Stats should be dramatic — big numbers that count up as you scroll past
- The notable figures section should feel like a "hall of fame" — photos with their key contribution
- The psychology section (bank vs mattress analogy) could be a compelling interactive moment
- End with the thesis: "AI is not a service to be rented. It is a tool to be owned."

</specifics>

<deferred>
## Deferred Ideas

None — discussion covered full scope.

</deferred>

---

*Phase: 11-final-project-interactive-website*
*Context gathered: 2026-03-30*
