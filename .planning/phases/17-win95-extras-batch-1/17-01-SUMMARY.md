---
phase: 17-win95-extras-batch-1
plan: "01"
subsystem: website
tags: [win95, extras, apps, audio]
dependency_graph:
  requires: [14-01, 16-01]
  provides: [phase17-extras-behavior-complete]
  affects:
    - website/extras.js
tech_stack:
  added: []
  patterns: [iframe-shell, scripted-chat-playback, web-audio-sfx]
key_files:
  modified:
    - website/extras.js
  created:
    - .planning/phases/17-win95-extras-batch-1/17-CONTEXT.md
    - .planning/phases/17-win95-extras-batch-1/17-01-PLAN.md
    - .planning/phases/17-win95-extras-batch-1/17-VERIFICATION.md
decisions:
  - IE content now renders through an iframe (`srcdoc`) to satisfy W95-03 explicitly
  - MSN buddy single-click now starts scripted chat playback to match expected interaction
  - Verification includes both command evidence and manual browser UAT checklist
metrics:
  duration: "session"
  completed: "2026-03-31T14:35:00Z"
  tasks_completed: 1
  files_modified: 4
---

# Phase 17 Plan 01: Win95 Extras Batch 1 Summary

**One-liner:** Phase 17 extras were finalized by closing IE/MSN behavior gaps and capturing reproducible verification evidence for all Win95 extra app flows.

## What Was Built

### Task 1: Close Phase 17 behavior gaps and verify

`website/extras.js`
- switched Internet Explorer content surface from a plain div to an iframe-backed page (`srcdoc`) while preserving dial-up animation/sound flow
- changed MSN buddy interaction from double-click-only to single-click open + scripted auto-play conversation behavior

`17-CONTEXT.md`, `17-01-PLAN.md`, `17-VERIFICATION.md`
- recorded phase context and requirements scope
- defined executable plan and done criteria
- captured command checks and manual UAT checklist for interactive behaviors

## Verification Highlights

- `node --check` passed for `website/extras.js`, `website/main.js`, and `website/bonzi.js`
- grep checks confirm Start menu and app launch wiring for all Phase 17 surfaces
- grep checks confirm IE iframe usage and MSN single-click chat opening paths
- manual browser checklist documented in `17-VERIFICATION.md`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] IE page container was not iframe-based**
- **Found during:** Task 1
- **Issue:** W95-03 requires Internet Explorer to include an iframe; implementation used only div-based content.
- **Fix:** Replaced IE page surface with iframe + `srcdoc` rendering and preserved dial-up transition/sound behavior.
- **Files modified:** `website/extras.js`
- **Commit:** `60d41c0`

**2. [Rule 2 - Missing critical functionality] MSN chat required double-click instead of click**
- **Found during:** Task 1
- **Issue:** W95-04 expected buddy click interaction to trigger scripted chats; implementation required double-click.
- **Fix:** Updated buddy click handler to open chat and auto-play conversation.
- **Files modified:** `website/extras.js`
- **Commit:** `60d41c0`

## Known Stubs

None identified in files touched by this plan.

## Self-Check: PASSED

- Found: `.planning/phases/17-win95-extras-batch-1/17-01-SUMMARY.md`
- Found: `.planning/phases/17-win95-extras-batch-1/17-VERIFICATION.md`
- Found commit: `60d41c0`
