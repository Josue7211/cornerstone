---
phase: 14-window-management-boot-sequence-navigation
plan: "01"
subsystem: website
tags: [win95, navigation, window-manager, boot]
dependency_graph:
  requires: [12-03]
  provides: [desktop-shell-pass, resizable-windows, start-submenus]
  affects:
    - website/index.html
    - website/main.js
    - website/style.css
tech_stack:
  added: []
  patterns: [nested-start-menu, edge-resize-handles, taskbar-minimize-animation]
key_files:
  modified:
    - website/index.html
    - website/main.js
    - website/style.css
  created:
    - .planning/phases/14-window-management-boot-sequence-navigation/14-CONTEXT.md
    - .planning/phases/14-window-management-boot-sequence-navigation/14-01-PLAN.md
    - .planning/phases/14-window-management-boot-sequence-navigation/14-VERIFICATION.md
decisions:
  - Desktop icons were reduced to six core apps and the rest moved into Start -> Programs submenus
  - WindowManager was extended in place with resize handles, snap logic, and minimize-to-taskbar animation
  - Phase 14 verification was closed with automated headless-browser interaction checks
metrics:
  duration: "session"
  completed: "2026-03-31T13:10:00Z"
  tasks_completed: 1
  files_modified: 6
---

# Phase 14 Plan 01: Window Management + Boot Sequence + Navigation Summary

**One-liner:** The Win95 shell now has a real Phase 14 pass: six-icon desktop, submenu-based Start navigation, login-to-BIOS boot flow, and windows that resize, snap, minimize toward the taskbar, and maximize within desktop bounds.

## What Was Built

### Task 1: Ship the Phase 14 shell pass

`website/index.html`
- reduced the visible desktop surface to the six core icons required for this phase
- added a login status line so the boot flow can display a short welcome state

`website/main.js`
- upgraded the boot flow to show `Welcome, <name>...` before BIOS resumes
- rebuilt the Start menu as nested `Programs -> Research / Games / Accessories`
- changed taskbar pills to focus or restore windows instead of toggling minimize
- extended `WindowManager` with edge/corner resize handles, snap-to-left/right behavior, top-edge maximize, proper maximize bounds, and minimize-to-taskbar animation

`website/style.css`
- added resize handle hit areas, snap preview styling, nested start-menu flyouts, and login status styling

## Verification Highlights

- `main.js` syntax parse passed
- `index.html` contains exactly 6 desktop icons
- local static serving of `website/index.html` returned HTTP 200
- automated Playwright browser checks passed for boot order/login state, taskbar restore/focus, maximize bounds, edge/corner resize, right-edge snap, and Start menu submenu structure

## Deviations from Plan

None. The plan was executed as written and verification is now complete.

## Self-Check: PASSED
