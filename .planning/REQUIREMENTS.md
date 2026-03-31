# Requirements: IDS2891 Cornerstone — Win95 App Experiences

**Defined:** 2026-03-31
**Core Value:** Transform a Win95 desktop OS into an Awwwards-level interactive research artifact that hits Capstone on all 5 rubric criteria (Design, Prepare, Create, Communicate, Reflect)

## v2.0 Requirements

### Presentation

- [ ] **PRES-01**: Presentation opens fullscreen (bypasses WindowManager, z-index 9999)
- [ ] **PRES-02**: 9 slides, each its own animated scene with unique visual treatment
- [ ] **PRES-03**: Arrow keys + click navigation between scenes
- [ ] **PRES-04**: Progress indicator at bottom
- [ ] **PRES-05**: ESC closes back to desktop
- [ ] **PRES-06**: Hardware evolution as visual spine across all scenes
- [ ] **PRES-07**: Awwwards-level animation (GSAP, clip-path reveals, parallax, typography animation)
- [ ] **PRES-08**: All 9 slides retain existing research content

### Steam App

- [x] **STEAM-01**: Steam-style game launcher with dark UI, 2-pane layout (library + detail)
- [x] **STEAM-02**: Snake game (playable)
- [x] **STEAM-03**: Platformer mini-game ("Silicon Runner" themed)
- [x] **STEAM-04**: CPU vs GPU Race (educational, ties to research)
- [x] **STEAM-05**: Experience demos accessible as "games" in Steam library

### File Explorer

- [x] **FILE-01**: Organized tree of all 14 semester assignments in 6 folders
- [x] **FILE-02**: Click any assignment to view rendered markdown content
- [x] **FILE-03**: Content pulled from actual assignment MD files (marked.js + DOMPurify)
- [x] **FILE-04**: Hidden "definitely_not_homework" folder easter egg

### Bonzi Buddy

- [x] **BONZI-01**: Animated Bonzi character on desktop (clippy.js or custom sprites)
- [x] **BONZI-02**: Walks/bounces around desktop with GSAP
- [x] **BONZI-03**: Click to chat — powered by local Qwen via Ollama (localhost:11434)
- [x] **BONZI-04**: Text-to-speech via Web Speech API
- [x] **BONZI-05**: "Download more RAM" easter egg triggers BSOD
- [x] **BONZI-06**: Fallback canned responses when Ollama is not running (fetch fails gracefully)

### Win95 Extras

- [ ] **W95-01**: Minesweeper (classic, playable)
- [ ] **W95-02**: Paint (canvas drawing tool, pre-loaded GPU diagram)
- [ ] **W95-03**: Internet Explorer (iframe, dial-up modem sound on open)
- [ ] **W95-04**: MSN Messenger (fake chats with Jensen Huang, Hinton)
- [ ] **W95-05**: Desktop right-click context menu (Refresh, Display Properties)
- [ ] **W95-06**: Shutdown sequence (dialog + sound + "safe to turn off" screen)
- [ ] **W95-07**: BSOD easter egg (GPU_OVERFLOW, triggered by Bonzi)
- [ ] **W95-08**: System Properties (research stats in Win95 dialog)
- [ ] **W95-09**: Screensaver (30s idle → starfield/GPU cores animation)
- [ ] **W95-10**: Clippy in Notepad ("Writing a research paper?")
- [ ] **W95-11**: Winamp/LoseAmp music player with visualizer
- [ ] **W95-12**: Disk Defragmenter (research topics as blocks)
- [ ] **W95-14**: Desktop icon drag-and-drop with grid snap
- [ ] **W95-15**: Recycle Bin icon changes when full

### Boot Sequence

- [ ] **BOOT-01**: Login screen before BIOS (any password works, shows "Welcome")
- [ ] **BOOT-02**: Boot order: Login → BIOS → Win95 Splash → Desktop
- [ ] **BOOT-03**: Login screen removed from W95-13 (moved here as BOOT-01)

### Start Menu & Desktop Organization

- [ ] **NAV-01**: Start menu updated with all new apps organized in submenus (Programs → Games, Programs → Accessories, Programs → Research)
- [ ] **NAV-02**: Desktop icons limited to core apps (Research Paper, Presentation, My Computer, Terminal, Recycle Bin, Steam). Others in Start menu.
- [ ] **NAV-03**: Taskbar shows running apps with click-to-focus

### Infrastructure

- [x] **INFRA-01**: Split main.js into modules (presentation.js, steam.js, bonzi.js, games.js, extras.js) loaded via script tags
- [x] **INFRA-02**: Add CDN imports: marked.js, DOMPurify, clippy.js
- [ ] **INFRA-03**: Kill Three.js requestAnimationFrame loop (invisible behind desktop, wasting GPU)
- [x] **INFRA-04**: Remove 410 lines dead code (old HUD, portals, minimap, unused CSS)

### Bonzi Fallback & Audio

- [ ] **AUDIO-01**: Dial-up modem sound when IE opens (Web Audio synthesis or MP3)
- [ ] **AUDIO-02**: Shutdown sound (reverse startup chime)
- [ ] **AUDIO-03**: Winamp plays lo-fi/chiptune track (source a CC0 audio file)

### Hosting & Submission

- [x] **HOST-01**: Deployable to GitHub Pages or any static host
- [x] **HOST-02**: All assets self-contained (no external API dependencies except optional Ollama)
- [x] **HOST-03**: Works as local file:// or deployed URL

### Window Management

- [ ] **WM-01**: Windows are resizable (drag edges/corners)
- [ ] **WM-02**: Windows snap to edges when dragged near screen border
- [ ] **WM-03**: Minimize animation (shrink to taskbar)
- [ ] **WM-04**: Maximize fills screen properly (minus taskbar)
- [ ] **WM-05**: Taskbar shows all open windows with click-to-focus

### Performance & Persistence

- [ ] **PERF-01**: Heavy apps (Paint, games, Bonzi) lazy-init on open, not on page load
- [ ] **PERF-02**: localStorage saves icon positions, game high scores, Winamp volume between sessions

### Polish

- [ ] **QA-01**: Zero console errors across all apps
- [ ] **QA-02**: Notepad has real reflection content (Reflect rubric criterion)
- [ ] **QA-04**: Recycle Bin has real revision process content

## v2.1 Requirements (Future / If Time Permits)

- **FUTURE-01**: 3D character controller with Mixamo animations (character.glb ready)
- **FUTURE-02**: Mobile responsive layout
- **FUTURE-03**: Sound effects for all interactions (click, drag, open, close)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Error dialog spam | Feels like a virus, not polished nostalgia |
| Mobile responsive | PC-only experience per user decision |
| React/Vue/framework | Single HTML/CSS/JS submission requirement |
| npm/build tools | CDN only, no bundler |
| Real multiplayer | Scope explosion, not needed for rubric |
| Video recording/upload | Storage complexity, not in rubric |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 12 | Pending |
| INFRA-02 | Phase 12 | Pending |
| INFRA-03 | Phase 12 | Pending |
| INFRA-04 | Phase 12 | Pending |
| HOST-01 | Phase 12 | Pending |
| HOST-02 | Phase 12 | Pending |
| HOST-03 | Phase 12 | Pending |
| PRES-01 | Phase 13 | In Progress |
| PRES-02 | Phase 13 | In Progress |
| PRES-03 | Phase 13 | In Progress |
| PRES-04 | Phase 13 | In Progress |
| PRES-05 | Phase 13 | In Progress |
| PRES-06 | Phase 13 | In Progress |
| PRES-07 | Phase 13 | In Progress |
| PRES-08 | Phase 13 | In Progress |
| WM-01 | Phase 14 | Awaiting Verify |
| WM-02 | Phase 14 | Awaiting Verify |
| WM-03 | Phase 14 | Awaiting Verify |
| WM-04 | Phase 14 | Awaiting Verify |
| WM-05 | Phase 14 | Awaiting Verify |
| BOOT-01 | Phase 14 | Awaiting Verify |
| BOOT-02 | Phase 14 | Awaiting Verify |
| BOOT-03 | Phase 14 | Awaiting Verify |
| NAV-01 | Phase 14 | Awaiting Verify |
| NAV-02 | Phase 14 | Awaiting Verify |
| FILE-01 | Phase 15 | Complete |
| FILE-02 | Phase 15 | Complete |
| FILE-03 | Phase 15 | Complete |
| FILE-04 | Phase 15 | Complete |
| STEAM-01 | Phase 15 | Complete |
| STEAM-02 | Phase 15 | Complete |
| STEAM-03 | Phase 15 | Complete |
| STEAM-04 | Phase 15 | Complete |
| STEAM-05 | Phase 15 | Complete |
| BONZI-01 | Phase 16 | Complete |
| BONZI-02 | Phase 16 | Complete |
| BONZI-03 | Phase 16 | Complete |
| BONZI-04 | Phase 16 | Complete |
| BONZI-05 | Phase 16 | Complete |
| BONZI-06 | Phase 16 | Complete |
| W95-01 | Phase 17 | Pending |
| W95-02 | Phase 17 | Pending |
| W95-03 | Phase 17 | Pending |
| W95-04 | Phase 17 | Pending |
| W95-05 | Phase 17 | Pending |
| W95-06 | Phase 17 | Pending |
| W95-07 | Phase 17 | Pending |
| W95-08 | Phase 17 | Pending |
| W95-09 | Phase 17 | Pending |
| AUDIO-01 | Phase 17 | Pending |
| AUDIO-02 | Phase 17 | Pending |
| AUDIO-03 | Phase 17 | Pending |
| W95-10 | Phase 18 | Pending |
| W95-11 | Phase 18 | Pending |
| W95-12 | Phase 18 | Pending |
| W95-14 | Phase 18 | Pending |
| W95-15 | Phase 18 | Pending |
| NAV-03 | Phase 14 | Awaiting Verify |
| PERF-01 | Phase 18 | Pending |
| PERF-02 | Phase 18 | Pending |
| QA-01 | Phase 18 | Pending |
| QA-02 | Phase 18 | Pending |
| QA-04 | Phase 18 | Pending |

**Coverage:**
- v2.0 requirements: 63 total
- Mapped to phases: 63
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-31*
*Last updated: 2026-03-31 — traceability complete, 7 phases (12-18)*
