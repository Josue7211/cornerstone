# Phase 14: Window Management + Boot Sequence + Navigation - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning and execution
**Source:** Existing website implementation, roadmap, requirements, and adjacent Phase 13 context

<domain>
## Phase Boundary

Phase 14 is a shell-quality pass on the Win95 desktop that already exists. The work is not to invent a new desktop, but to make the current desktop behave more like a real OS:

- strengthen boot flow so login clearly precedes BIOS, splash, and desktop
- improve the window manager with resize, snap, minimize animation, and proper maximize bounds
- reorganize navigation so the desktop stays focused on 6 core icons and the rest of the apps move into Start menu submenus

Phase 13 is treated as deferred pending human visual validation. Do not reopen or change its completion status while doing this work.
</domain>

<decisions>
## Implementation Decisions

### Boot flow
- **D-01:** Keep the existing "Click to power on" browser-audio gate, but require the login flow before BIOS continues.
- **D-02:** Login accepts any username and shows a short "Welcome" state before BIOS resumes.
- **D-03:** Boot order remains Login -> BIOS -> Win95 splash -> Desktop. No direct desktop shortcut is introduced.

### Window manager
- **D-04:** Extend the existing `WindowManager` class in `website/main.js`; do not replace it or move it into a new module.
- **D-05:** Add edge and corner resize handles to every Win95 window using pointer drag math in plain JS.
- **D-06:** Snap behavior targets the left half, right half, and top-edge maximize pattern. Left/right half snap is the minimum required behavior.
- **D-07:** Minimize animates toward the matching taskbar pill using a temporary fixed-position clone so the real window can be hidden only after the animation completes.
- **D-08:** Maximize uses desktop/taskbar dimensions in pixels rather than `100vw` to avoid border overflow.

### Navigation and information architecture
- **D-09:** Desktop icons are limited to 6 visible icons: Research Paper, Presentation, My Computer, Terminal, Steam95, Recycle Bin.
- **D-10:** All secondary apps move under `Start -> Programs -> Research`, `Games`, and `Accessories`.
- **D-11:** Taskbar pills become focus/restore controls, not minimize toggles.

### Scope guard
- **D-12:** Existing Phase 18 experiments already present in the codebase are left alone unless they directly break Phase 14 correctness.
</decisions>

<code_context>
## Existing Code Insights

- `website/main.js` already contains the boot flow, `showWin95Desktop()`, `buildStartMenu()`, and `WindowManager`.
- `website/index.html` currently exposes too many desktop icons for the Phase 14 navigation goal.
- `website/style.css` already has Win95 window/taskbar/start menu styles and is the right place to add resize handles and submenu styling.
- The boot flow already shows login before BIOS in practice, but the login screen does not yet show a "Welcome" transition.
</code_context>

<specifics>
## Specific Goals

- Keep the current retro Win95 visual language intact.
- Avoid introducing frameworks, bundlers, or new dependencies.
- Prefer small, surgical patches that align with the current monolithic structure.
</specifics>

<deferred>
## Deferred Ideas

- Presentation.exe visual polish beyond Phase 13's existing implementation
- Phase 15 file rendering and Steam game logic
- Phase 16 Bonzi Buddy behavior
- Phase 8 co-curricular reflection work
</deferred>

