# Phase 17 Verification — Win95 Extras Batch 1

Date: 2026-03-31

## Automated Checks

1. JavaScript syntax parse:

```bash
node --check website/extras.js
node --check website/main.js
node --check website/bonzi.js
```

Result: pass (exit code 0).

2. Requirement wiring grep checks:

```bash
rg -n "createMinesweeper|createPaint|createInternetExplorer|createMSNMessenger|createWinamp|triggerShutdown|initScreensaver" website/extras.js website/main.js
rg -n "Programs|Minesweeper|Paint|Internet Explorer|MSN Messenger|Winamp|System Properties|Shut Down" website/main.js
```

Result: pass. Start menu and `APP_CONFIG` entries exist and point to Phase 17 app constructors/actions.

3. IE iframe verification:

```bash
rg -n "document.createElement\\('iframe'\\)|page.className = 'ie-page ie-frame'" website/extras.js
```

Result: pass (`createInternetExplorer` now creates an `iframe` page surface).

4. MSN click-to-chat verification:

```bash
rg -n "row.addEventListener\\('click'.*openChat\\(buddy\\)" website/extras.js
```

Result: pass (single-click path now opens scripted conversation).

## Manual Browser UAT Checklist

Run from `website/` with any static server (example: `python3 -m http.server 4173`) and open `http://localhost:4173`.

1. Boot to desktop and open Start menu.
Expected: Programs contains Minesweeper, Paint, Internet Explorer, MSN Messenger, Winamp, System Properties and Shut Down.

2. Minesweeper.
Expected: 9x9 board, first left click never hits mine, right-click toggles flags, timer increments after first reveal, win/lose face states appear.

3. Paint.
Expected: GPU diagram preloaded, pencil/eraser/fill tools work, palette changes drawing/fill color.

4. Internet Explorer.
Expected: Dial-up sound plays when app opens and when Go is clicked; connecting screen resolves to rendered page inside iframe.

5. MSN Messenger.
Expected: Clicking Jensen Huang, Geoffrey Hinton, or Fei-Fei Li immediately opens chat and auto-plays full scripted message sequence.

6. Shutdown flow.
Expected: Start -> Shut Down opens dialog, OK plays shutdown sound, fade shows safe-to-turn-off screen, click returns to boot sequence.

7. BSOD trigger.
Expected: Via Bonzi “download more RAM” easter egg path, BSOD overlay appears and is dismissible.

8. System Properties.
Expected: Window opens with tabbed info (General, Device Manager, Performance) and close buttons work.

9. Screensaver.
Expected: After 30 seconds idle on desktop, starfield screensaver appears; any mouse/keyboard/touch input dismisses it.

10. Winamp.
Expected: Play starts synthetic lo-fi/chiptune track, timer advances, visualizer animates, stop resets timer.
