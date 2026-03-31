---
phase: 12-infrastructure-cleanup-hosting
plan: "03"
subsystem: website
tags: [cdn, modules, gitignore, infrastructure]
dependency_graph:
  requires: [12-01, 12-02]
  provides: [module-boundaries, cdn-globals, gitignore-cleanup]
  affects: [website/index.html, website/main.js, .gitignore]
tech_stack:
  added: [marked@13.1.0, dompurify@3.3.3]
  patterns: [cdn-umd-globals, module-stub-files]
key_files:
  created:
    - website/presentation.js
    - website/steam.js
    - website/bonzi.js
    - website/games.js
    - website/extras.js
    - website/explorer.js
  modified:
    - website/index.html
    - .gitignore
decisions:
  - Regular script tags (not type=module) for stub files — avoids importmap conflicts with Three.js ESM setup
  - UMD CDN builds for marked and DOMPurify — work as window globals without bundler
  - games.js loads before steam.js — steam depends on games
  - window.* globals pattern for stubs — compatible with non-module script loading
metrics:
  duration: "1 minute"
  completed: "2026-03-31T03:02:04Z"
  tasks_completed: 3
  files_modified: 8
---

# Phase 12 Plan 03: CDN Imports + Module Stubs Summary

**One-liner:** CDN imports for marked.js and DOMPurify added as UMD globals, 6 phase-owned module stub files created and wired into index.html, node_modules excluded from git.

## What Was Built

### Task 1: CDN imports and .gitignore update (commit: cd0fbed)

Added two CDN script tags to `website/index.html` immediately before the GSAP script tag in `<head>`:

- `marked@13.1.0` (UMD) — loads as `window.marked`, ready for Phase 15 File Explorer markdown rendering
- `dompurify@3.3.3` (UMD) — loads as `window.DOMPurify`, XSS protection for marked output

Updated `.gitignore` to exclude `website/node_modules/` and `website/package-lock.json`. The project is CDN-only; node_modules should never be committed.

### Task 2: Module stub files and index.html wiring (commit: 4f86d3b)

Created 6 module stub files, each with a descriptive header identifying the owning phase and future contents:

| File | Phase | Global Stub |
|------|-------|-------------|
| `website/presentation.js` | Phase 13 | `window.PresentationMode = null` |
| `website/steam.js` | Phase 15 | `window.SteamApp = null` |
| `website/bonzi.js` | Phase 16 | `window.BonziBuddy = null` |
| `website/games.js` | Phase 15 | `window.Games = {}` |
| `website/extras.js` | Phase 17 | `window.Extras = {}` |
| `website/explorer.js` | Phase 15 | `window.FileExplorer = null` |

Added 6 `<script>` tags at end of `<body>` after `<script type="module" src="main.js"></script>`, in dependency order (games before steam).

### Task 3: Checkpoint — auto-approved (autonomous mode)

Human verification checkpoint auto-approved. All structural verification checks passed:
- marked and DOMPurify CDN tags present in index.html
- All 6 module stub files exist on disk
- node_modules excluded from git
- Script tags load after main.js in correct order

## Decisions Made

1. **Regular `<script>` tags (not `type="module"`) for stubs** — main.js uses an importmap for Three.js ESM. Adding more `type="module"` scripts would require coordinating with the importmap. Plain scripts with `window.*` globals are simpler and work correctly.

2. **UMD builds for marked and DOMPurify** — UMD builds register as globals on `window` without needing a module bundler. The CDN URLs specifically point to `.umd.js` / `purify.min.js` variants.

3. **Load order: games.js before steam.js** — steam.js will depend on games.js in Phase 15. The order is established now so no refactor is needed later.

4. **`window.* || null/{}` pattern** — Stubs use `window.X = window.X || null` so that if a phase accidentally loads their module twice, the second load is a no-op.

## Verification Results

```
grep "jsdelivr.net/npm/marked" website/index.html    → 1 match
grep "jsdelivr.net/npm/dompurify" website/index.html → 1 match
ls website/{presentation,steam,bonzi,games,extras,explorer}.js → all 6 exist
grep "node_modules" .gitignore                        → match
grep "package-lock.json" .gitignore                   → match
CDN tags appear before main.js                        → confirmed
Module script tags appear after main.js               → confirmed
```

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

All 6 module files are intentional stubs. They are tracked here for the verifier:

| File | Stub Value | Resolving Phase |
|------|-----------|-----------------|
| `website/presentation.js:14` | `window.PresentationMode = null` | Phase 13 |
| `website/steam.js:11` | `window.SteamApp = null` | Phase 15 |
| `website/bonzi.js:14` | `window.BonziBuddy = null` | Phase 16 |
| `website/games.js:11` | `window.Games = {}` | Phase 15 |
| `website/extras.js:15` | `window.Extras = {}` | Phase 17 |
| `website/explorer.js:12` | `window.FileExplorer = null` | Phase 15 |

These stubs are intentional placeholders — the plan's goal was to create module boundaries, not implement the modules. They do not prevent the plan's goal from being achieved.

## Self-Check: PASSED
