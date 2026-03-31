# Phase 14 Verification

**Date:** 2026-03-31
**Status:** human_needed

## Automated Checks Passed

- `website/main.js` parses successfully after stripping the top-level ESM import for syntax validation
- `website/index.html` now contains exactly 6 visible `.desktop-icon` entries
- `website/main.js` contains Start menu submenu definitions for `Programs`, `Research`, `Games`, and `Accessories`
- `website/main.js` and `website/style.css` both contain the new resize handle implementation
- `website/index.html` serves successfully over a local static server (`python3 -m http.server`)

## Manual Browser Validation Still Needed

1. Load `website/index.html` in a browser.
2. Click the power-on prompt and confirm the boot order is `Login -> BIOS -> Win95 splash -> Desktop`.
3. Enter any username, press `OK`, and confirm the login screen briefly shows `Welcome, <name>...`.
4. Open multiple apps and confirm:
   - taskbar pills appear for each open window
   - clicking a pill focuses the window, or restores it if minimized
   - minimize visibly shrinks toward the taskbar pill
   - dragging to the left or right edge snaps the window to that half of the desktop
   - dragging top edge maximizes, and maximize fills the desktop below the taskbar without overflow
   - resize handles work from edges and corners
5. Confirm only these 6 desktop icons remain visible:
   - Research Paper
   - Presentation
   - My Computer
   - Terminal
   - Steam95
   - Recycle Bin
6. Open Start and confirm the extra apps are organized under `Programs -> Research`, `Games`, and `Accessories`.

## Notes

- Phase 13 remains deferred pending separate human visual validation and was not modified here.
