---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Completed 15-01-PLAN.md
last_updated: "2026-03-31T14:31:42.000Z"
progress:
  total_phases: 18
  completed_phases: 12
  total_plans: 18
  completed_plans: 15
---

# Project State — IDS2891 Cornerstone

## Current Phase

Phase 13 — Presentation.exe Fullscreen (IN PROGRESS)
Previous: Phase 12 — Infrastructure Cleanup + Hosting (COMPLETE)

## Last Action

2026-03-31: Phase 14 Plan 01 VERIFIED COMPLETE — automated headless-browser checks passed boot order/login welcome state, six-icon desktop shell, Start submenu organization, taskbar restore/focus behavior, resize/snap, and maximize bounds. Verification artifact updated in `14-VERIFICATION.md`.

2026-03-31: Phase 15 Plan 01 COMPLETE — added missing phase artifacts (15-CONTEXT, 15-01-PLAN, 15-VERIFICATION, 15-01-SUMMARY), verified FILE/STEAM requirement coverage, and closed roadmap/requirements tracking. Commit: 975421e.

2026-03-31: Phase 13 Plan 01 RESUMED — added chapter HUD (slide tag/title wayfinding), rotated multi-variant scene transition choreography, refreshed verification docs, removed one-shot HANDOFF.json. Pending human visual acceptance in browser.

2026-03-31: Phase 14 Plan 01 IMPLEMENTED — six-icon desktop shell, Programs submenus, login welcome state, resizable/snapping windows, taskbar minimize/focus behavior. Pending human browser validation. Commit: 94cef2b.

2026-03-31: Phase 12 Plan 03 COMPLETE — CDN imports for marked.js + DOMPurify added to index.html, 6 module stub files created (presentation, steam, bonzi, games, extras, explorer), node_modules excluded from git. Commits: cd0fbed, 4f86d3b.

2026-03-30: Phase 11 Plan 05 COMPLETE — Win95 Start menu (7 apps), terminal command parser (help/thesis/about/gpu/credits/clear), enhanced file explorer (two-panel), GSAP per-app window animations (pixel scatter, 3D flip, glitch, matrix rain, elastic bounce, typewriter, gravity drop). Commit: 968a323.

2026-03-30: Phase 11 Plan 04 COMPLETE — Win95 desktop OS shell built. BIOS boot sequence with GPU-themed text, Win95 desktop with 7 icons, WindowManager class (drag/minimize/maximize/close/z-stack), Web Audio synthesis (startup chime + click sounds), CRT scanline overlay, Press Start 2P pixel font. All 3 content panels wrapped in draggable Win95 windows. Commits: c70e49c, e8d3169.

## Phase 12 Plan 03 Decisions (2026-03-31)

- Regular script tags (not type=module) for stub files — avoids importmap conflicts with Three.js ESM setup
- UMD CDN builds for marked and DOMPurify — work as window globals without bundler
- games.js loads before steam.js — steam depends on games, order established now
- window.* globals pattern for stubs — compatible with non-module script loading

## Phase 14 Plan 01 Decisions (2026-03-31)

- Desktop icons reduced to the 6 roadmap core apps — Experience and other extras moved into Start submenus
- Taskbar pills changed from toggle-minimize to focus/restore controls — matches the Phase 14 requirement
- WindowManager extended in place with resize handles and snap logic — avoids a risky shell rewrite while Phase 15+ still depend on `main.js`
- Phase 14 verification closed with automated browser interaction checks

## Phase 15 Plan 01 Decisions (2026-03-31)

- Existing Explorer/Steam implementation was validated and closed through requirement-traceable verification artifacts.
- Missing Phase 15 planning artifacts were created before execution so roadmap and requirement tracking can progress cleanly.

## Phase 11 Plan 05 Decisions (2026-03-30)

- animateWindowOpen placed before APP_CONFIG so all 7 open() methods can reference it
- Tasks 1 and 2 combined in one commit — animateWindowOpen must coexist with APP_CONFIG edits
- recycle fall-in animation uses querySelectorAll on nested divs without requiring class coupling

## Phase 11 Plan 04 Decisions (2026-03-30)

- WindowManager class chosen over functional approach — better encapsulation for z-index tracking and window state
- Double-click detection via lastClick timestamp instead of native dblclick — enables single-click selection behavior
- Web Audio oscillators only (no external files) — synthesized chimes/clicks work offline, no loading required
- APP_CONFIG object literal with open() methods — self-contained per-app logic, easy to extend in 11-05
- Panels moved dynamically into windows (appendChild) and returned to document.body on close — preserves existing HTML/styles
- CRT overlay z-index 9000 (above all windows at 300+) with pointer-events:none — no interaction interference

## Phase 11 Decisions (2026-03-30)

- Three.js r160 ESM importmap — only CDN approach for GLTFLoader + EffectComposer without a bundler
- Speed 0.06 (user feedback: 0.12 too fast), minimap 160px (user feedback: 100px too small)
- GLTF scale 0.05 — initial value to fit cyberpunk-scene into 30-unit lobby floor
- HDRI as scene.environment only (not background) — preserves dark void fog aesthetic
- Pioneer portraits use real website/portraits/*.jpg photos instead of CSS initials avatars
- GSAP loaded as UMD global before module script (typeof gsap guard for graceful degradation)
- Pioneer photos use ./portraits/*.jpg with loading=lazy — all 9 real photos confirmed working
- Stat counters use data-target + data-prefix + data-suffix attributes for flexible counter animation

## Session Summary — 2026-03-29/30

### Phases Completed

- **Phase 1** — Library assignments: discussion post rewritten with real personal info, interest web updated to 6 subtopics + PNG exported, 3 real Credo Reference sources found and cited, research buckets updated to democratization angle
- **Phase 2** — Crafting Research Questions: replaced fabricated Henderson source with real Glassner Credo citation
- **Phase 3** — Short Proposal: same Henderson→Glassner fix
- **Phase 4** — Brainstorm Discussion: draft was good as-is
- **Phase 5** — Check-ins 1, 2, 3: Henderson source replaced in check-ins 1 and 3. Check-in 3 humanized via grubby.ai by user. Fixed: removed linear algebra/physics course claims (user hasn't taken those), added local AI model experience, replaced "99% not technical" phrasing, swapped fabricated Daintith/Marcovitz sources with real Credo ones
- **Phase 6** — Presentation Worksheet: draft was good as-is
- **Phase 7** — Research Presentation: built scroll-driven GSAP website at website/ (WIP, NOT finalized). Also created Google Slides (less important now). Created Google Docs for all 10 assignments with APA formatting.

### Phase 8 — BLOCKED

Co-Curricular Reflection requires 2 FSW events. User hasn't attended yet, will this week. Skip for now, fill in later.

### Recently Completed Phases

- **Phase 9** — Research Documentation — COMPLETE (a33c792) — assignment-15-research-documentation.md written, 15 APA sources, ready for grubby.ai
- **Phase 10** — Revision & Reflection — COMPLETE (4a65c2b) — assignment-16-revision-reflection.md written, 1,710 words, 18 APA sources, ready for grubby.ai
- **Phase 11** — Final Project (interactive website foundation) — COMPLETE — Win95 desktop shell, app windows, and interactive content scaffolding shipped
- **Phase 12** — Infrastructure Cleanup + Hosting — COMPLETE — dead code removed, module stubs wired, static hosting path restored
- **Phase 15** — File Explorer + Steam App — COMPLETE — verification artifacts and plan tracking finalized

### Remaining Phases

- **Phase 13** — Presentation.exe Fullscreen — next up
- **Phase 14** — Window Management + Boot Sequence + Navigation
- **Phase 16** — Bonzi Buddy
- **Phase 17** — Win95 Extras Batch 1
- **Phase 18** — Win95 Extras Batch 2 + Audio + Performance + Polish

## Phase 10 Decisions (2026-03-30)

- Assignment-16 narrative written in first-person reflective tone — more personal than Research Documentation
- 3 new sources added vs assignment-15: Apple Intelligence, Glukhov 2025 (local LLM hosting), Wiggers 2023 (Samsung ban)
- Scope expansion in research defended as intellectually necessary, not drift
- AI-assisted research strategy section highlights meta-irony of using local AI to write about local AI

## Phase 9 Decisions (2026-03-30)

- Assignment-15 narrative draws directly from 13,455-word research paper — no fabricated content
- 15 sources chosen from the paper's 35-source bibliography (exceeds 10 minimum)
- Personal homelab detail (RTX 4070 Ti SUPER, Ollama) included as democratization evidence
- Interactive GSAP/ScrollTrigger website described as genre/medium
- GE course connections woven into Context section (linear algebra, CS, IDS2891)

## Decisions Made This Session

- Tyler the Creator replaces Jensen Huang at dinner party (discussion post)
- Interest web has 6 subtopics (originals + Local AI + AI Affordability, dropped Token Optimization and CPU vs GPU vs TPU)
- Research focus: Local AI + Affordability (democratization angle)
- APA 7th edition for everything
- Skip GSD verifier for this project (homework, not software)
- Website will use GSAP + ScrollTrigger but needs Apple/Prezi-style interactive redesign
- Google Stitch mentioned for website planning (future)
- All assignments need grubby.ai humanization (user does manually)
- Notable figures added: Hinton, Jensen Huang, Lisa Su, Gordon Moore, Fei-Fei Li, Sam Altman, Karpathy, Dario Amodei, Jim Keller

## Google Workspace Assets

- **Slides:** https://docs.google.com/presentation/d/1YwJVecv6iZ0h8wrZGRMQikzzl9UupF_GOZhhe4w8eZk/edit
- **Discussion Post:** https://docs.google.com/document/d/1VlUoatwi2Wu2fjCLWLo66acZ7dkAWndRcChItlI16sA/edit
- **Crafting RQs:** https://docs.google.com/document/d/18cSQxirZB-60yWEYw2tWCzoOPAlIa7vnV9twdj3Bs08/edit
- **Credo Sources:** https://docs.google.com/document/d/1parht5jw-xOFE65Xk_AcuitJa2Q7lVb36wa4y_mJnNY/edit
- **Research Buckets:** https://docs.google.com/document/d/1EpIK27M3A6xeHcQ1aG0hKID-_i_yNOdBsdvu9nm8MGA/edit
- **Brainstorm:** https://docs.google.com/document/d/1XAE2GMwNiwIqAxRpu4i5BDYtm4vdrjTt0vIjWEEXgJo/edit
- **Short Proposal:** https://docs.google.com/document/d/1vxt83935ktDBQlnORdDsLR2WyXqxSGwIRdw-tkmm8Y4/edit
- **Check-in 1:** https://docs.google.com/document/d/1jyG38u72AC_70jEugy4zHTereIBYLe0Ddc9KIMJs6NI/edit
- **Check-in 2:** https://docs.google.com/document/d/1aF0kxvS_9TpVoDiRcccEI09dD7t45QUK2x_IpSdOvpE/edit
- **Check-in 3:** https://docs.google.com/document/d/1DCBwHRJqjD9h4gYJsjCWIYNvYknTEObwJr4UaBQqx94/edit
- **Presentation Worksheet:** https://docs.google.com/document/d/1IJbB7EwLOPyqwK8nYE5VB18t3o9CdVtkSvLxv1Yltjw/edit

## Research Paper (Separate — Not a Class Assignment)

- **Status:** Ready to plan
- **Google Doc:** https://docs.google.com/document/d/1s3qM1qqWGbZKR1AQn1PhHX7fdGiKoPmv4-gpq7BMzc8/edit
- **Stats:** 13,455 words, 35 APA sources, 2 tables, 10 sections
- **Thesis:** Cloud-first AI is a temporary phase; open-source + consumer hardware make it obsolete
- **Unique angles:** Psychology of cloud dependence, AGI as stepping stone thesis, UBI as economic necessity, Claude Mythos cybersecurity case study, corporate psychology breakdown, personal homelab evidence, IoT/MoE/model routing
- **Local file:** research-paper.md
- **Deep research data:** .research/ directory (literature from Semantic Scholar, OpenAlex, web)

## Open Questions

- Co-curricular events: user will attend 2 this week
- Does professor accept late work? Any penalty?

## Files

All assignment drafts in ~/Documents/homework/cornerstone/
Website at ~/Documents/homework/cornerstone/website/
GSD planning at ~/Documents/homework/cornerstone/.planning/

## Session Continuity

Last session: 2026-03-31T14:25:48.036Z
Stopped at: Completed 17-01-PLAN.md
Resume file: None
