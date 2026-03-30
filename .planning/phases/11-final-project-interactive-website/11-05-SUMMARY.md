---
phase: 11-final-project-interactive-website
plan: "05"
subsystem: website-interactive-apps
tags: [three.js, gsap, win95, terminal, start-menu, animations]
dependency_graph:
  requires: [11-04]
  provides: [interactive-terminal, start-menu, gsap-animations]
  affects: [website/main.js, website/style.css]
tech_stack:
  added: []
  patterns: [GSAP timeline animations, terminal command parser, DOM-only UI construction]
key_files:
  created: []
  modified:
    - website/main.js
    - website/style.css
decisions:
  - animateWindowOpen placed before APP_CONFIG so all open() calls resolve correctly
  - Both tasks committed in single atomic commit (animateWindowOpen written together with terminal/start-menu in one edit session)
  - recycle 'fall in' animation targets nested divs via querySelectorAll to find children without class coupling
metrics:
  duration_minutes: 6
  completed: "2026-03-30T21:35:49Z"
  tasks_completed: 2
  files_modified: 2
---

# Phase 11 Plan 05: Interactive Apps + GSAP Window Animations Summary

**One-liner:** Win95 Start menu with 7 apps, full terminal command parser (help/thesis/about/gpu/credits/clear), two-panel file explorer, and per-app GSAP window animations (pixel scatter, 3D flip, glitch, matrix rain, elastic bounce, typewriter, gravity drop).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Start Menu + Terminal Command Parser + Enhanced File Explorer | 968a323 | website/main.js, website/style.css |
| 2 | GSAP Window Open Animations (included in Task 1 commit) | 968a323 | website/main.js, website/style.css |

## What Was Built

### Start Menu
- `buildStartMenu()` creates a Win95-style start menu with all 7 apps listed
- Start button toggles `.visible` class, desktop click closes it
- Event delegation on `.start-menu-items` opens apps via `APP_CONFIG[appId].open()`
- CSS: left colored header strip (`writing-mode: vertical-rl`), hover highlight, footer

### Terminal Command Parser
- Full `open()` replaced — prompt row + textarea output + input with `caret-color:#33ff33`
- `runTerminalCommand()` handles: `help`, `thesis`, `about`, `gpu`, `credits`, `clear`
- Typing effect: 3 chars per 15ms interval, scrolls output to bottom
- Auto-focuses input 100ms after window opens

### Enhanced File Explorer
- Two-panel layout: 140px tree panel (border-right) + flex content viewer
- 4 folders: Research Paper, Presentation, /Sources, About Me
- Click sets `textContent` of `#explorerContent` — no innerHTML

### GSAP Animations (`animateWindowOpen(appId, el)`)
- **paper**: Child elements fly in from random positions (pixel scatter dissolve)
- **pres**: 3D Y-axis flip with `perspective:1200px` and `rotationY: -90 → 0`
- **exp**: GSAP timeline — x jitter + hue-rotate 0→360 + elastic scale
- **terminal**: Matrix rain spans fall through window, then fade-in reveal
- **explorer**: Elastic bounce from center (`elastic.out(1.2, 0.5)`)
- **notepad**: Fade in window, type out textarea content char-by-char
- **recycle**: Children `y:-60 → 0` with `bounce.out` stagger

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

**Note on commit structure:** Tasks 1 and 2 were written in the same edit session since `animateWindowOpen` is referenced by all `APP_CONFIG.open()` methods — they had to exist simultaneously. Both tasks share commit `968a323`.

## Known Stubs

None. All 7 apps open with real content and unique animations.

## Self-Check

- website/main.js — committed in 968a323 ✓
- website/style.css — committed in 968a323 ✓
- `function animateWindowOpen` — present (count: 1) ✓
- `buildStartMenu` — present (count: 2 — def + call) ✓
- `runTerminalCommand` — present (count: 2 — def + call) ✓
- `innerHTML` — count: 0 ✓
- `rotationY` — count: 2 ✓
- `elastic.out` — count: 4 ✓
- `bounce.out` — count: 1 ✓

## Self-Check: PASSED
