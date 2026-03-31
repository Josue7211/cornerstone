# Phase 17 Context — Win95 Extras Batch 1

Phase 17 ships the Win95 “extras” app set and lifecycle polish on top of the existing desktop shell:

- Minesweeper
- Paint
- Internet Explorer + dial-up sound
- MSN Messenger scripted chats
- Shutdown dialog and safe-to-turn-off flow
- BSOD easter egg integration
- System Properties
- Idle screensaver
- Winamp playback + visualizer

Primary references:

- `.planning/ROADMAP.md` (Phase 17 goal + success criteria)
- `.planning/REQUIREMENTS.md` (`W95-01..W95-09`, `AUDIO-01..AUDIO-03`)
- `website/main.js` (Start menu/app launching integration)
- `website/extras.js` (app implementations)
- `website/bonzi.js` (BSOD trigger path)
- `website/style.css` (Win95 extras styling)

Execution focus for this pass:

- Close remaining behavior mismatches against requirements (IE iframe + click-to-chat MSN behavior).
- Produce verification artifacts with command checks plus manual browser UAT checklist.
