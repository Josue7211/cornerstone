# Win95 Desktop Extras — Implementation Research

> Research date: 2026-03-30
> Constraint: Vanilla JS, no frameworks, no build tools, <200 lines each
> Integration target: existing `WindowManager` class in `website/main.js`

All apps follow the same pattern: build DOM in JS, pass content element to `wm.createWindow(appId, title, icon, contentEl, opts)`, add to `APP_CONFIG`, add to `buildStartMenu()` app list.

---

## 1. Minesweeper

**Approach:** Single function that creates a grid of `<div>` cells in a container. Store mine positions in a flat array. On click, flood-fill reveal. On right-click, toggle flag. Smiley button resets.

**Implementation pattern:**
```
- Grid: 9x9, 10 mines (beginner difficulty)
- Data: flat array of { mine: bool, revealed: bool, flagged: bool, adjacent: int }
- Left click: reveal cell, if 0 adjacent do BFS flood fill
- Right click (contextmenu event): toggle flag emoji
- Smiley face: div above grid, changes to dead face on mine hit, sunglasses on win
- Numbers 1-8 get classic Minesweeper colors (#0000FF, #008000, #FF0000, #000080, #800000, #008080, #000000, #808080)
- Timer: increment every second, display as 3-digit counter
- Mine counter: 10 minus flags placed
```

**Estimated lines:** 150-180

**Gotchas:**
- Must `e.preventDefault()` on `contextmenu` to prevent browser right-click menu on the grid
- Flood fill can be recursive but 9x9 is small enough, no stack overflow risk
- First click must never be a mine — regenerate mines if first click hits one
- Win condition: all non-mine cells revealed
- CSS: use `inset`/`outset` border styles for the classic raised/sunken Win95 button look

**CSS trick for 3D button effect:**
```css
.cell-hidden { border: 2px outset #dfdfdf; background: #c0c0c0; }
.cell-revealed { border: 1px solid #808080; background: #c0c0c0; }
```

---

## 2. Paint (MS Paint Clone)

**Approach:** HTML5 `<canvas>` element with mouse event handlers. Toolbar div above canvas with tool buttons and color swatches.

**Implementation pattern:**
```
- Canvas: 640x480, white background
- Tools: Pencil (default), Eraser, Fill (flood fill), Line, Rectangle
- Color picker: 20 classic MS Paint color swatches as clickable divs
  Row 1: #000, #808080, #800000, #808000, #008000, #008080, #000080, #800080, #808040, #004040
  Row 2: #FFF, #C0C0C0, #FF0000, #FFFF00, #00FF00, #00FFFF, #0000FF, #FF00FF, #FFFF80, #00FF80
- Brush sizes: 1px, 3px, 5px, 8px (radio buttons or small squares)
- Drawing: track mousedown/mousemove/mouseup, draw with ctx.lineTo()
- Eraser: same as pencil but with white color
- Fill tool: getImageData, BFS flood fill on pixel data (check color tolerance)
- Pre-load GPU architecture diagram: draw text/lines on canvas init, or load an image via drawImage
```

**Estimated lines:** 160-190

**Gotchas:**
- Fill tool on canvas pixel data is expensive for large areas — limit BFS iterations to ~50,000 pixels to prevent freeze
- Must use `canvas.getBoundingClientRect()` to convert mouse coords to canvas coords
- Canvas resolution vs CSS size: set both `canvas.width`/`canvas.height` AND CSS width/height
- For the pre-loaded GPU diagram: use `ctx.fillText()` to draw labeled boxes for GPU components (SM, L2 Cache, Memory Controller, Tensor Cores, etc.) — keeps it self-contained, no external image needed
- Undo: store last N canvas states via `canvas.toDataURL()` — 3-5 levels is enough (memory intensive but fine for a demo)

---

## 3. Internet Explorer

**Approach:** Div with address bar toolbar at top, iframe below. Toolbar has back/forward/refresh/go buttons. Loading bar animates on navigation.

**Implementation pattern:**
```
- Address bar: <input> with "http://from-pixels-to-intelligence.com/" default value
- Buttons: Back, Forward, Refresh, Home, Go
- iframe: src set to the current page URL (or a specific section)
- Loading bar: thin div at top, animate width 0->100% with CSS transition
- Back/Forward: maintain a history stack array, push URLs on navigate
- Meta-recursive: default URL loads the deployed site itself in the iframe
- IE branding: blue "e" logo in toolbar, "Internet Explorer" in titlebar
```

**Estimated lines:** 80-120

**Gotchas:**
- **X-Frame-Options / CSP**: Many real sites block iframe embedding. The deployed site itself should work (same origin). For external sites, show a "This page cannot be displayed" error — which is actually MORE authentic to the Win95 IE experience
- iframe `sandbox` attribute: use `sandbox="allow-same-origin allow-scripts allow-forms"` for security
- iframe `load` event fires when page loads — use it to stop the loading bar animation
- Same-origin policy: can only read iframe content if same origin. For display purposes this is fine
- Add a fake "This page has been optimized for Internet Explorer 4.0" badge for humor
- Back/Forward: don't use browser history API, just maintain your own array of URLs

---

## 4. MSN Messenger

**Approach:** Two-pane layout. Left: buddy list with online/offline/away indicators. Right: chat window with pre-scripted messages that auto-type.

**Implementation pattern:**
```
- Buddy list (left pane, ~150px):
  - "Online (3)": Jensen Huang, Geoffrey Hinton, Fei-Fei Li
  - "Away (2)": Lisa Su, Andrej Karpathy
  - "Offline (4)": Gordon Moore, Sam Altman, Dario Amodei, Jim Keller
  - Each buddy has a green/yellow/gray dot + display name
  - Click a buddy to open their chat

- Chat window (right pane):
  - Header: buddy name + status
  - Message area: scrollable div
  - Input bar at bottom (user can type but responses are pre-scripted)
  - Typing indicator: "Jensen is typing..." with animated dots

- Pre-scripted conversations (triggered by clicking buddy):
  Jensen Huang: discusses CUDA origins, GPU democratization, Tensor Cores
  Geoffrey Hinton: talks about neural net history, backprop, leaving Google
  Fei-Fei Li: ImageNet, democratizing AI research, human-centered AI

- Message format:
  - Buddy messages: left-aligned, blue text, buddy icon
  - User messages: right-aligned, black text
  - Timestamp on each message

- Auto-play: messages appear one by one with 1-2 second delays
  - Show "typing..." indicator for 1s before each message appears
  - 3-5 messages per conversation
```

**Estimated lines:** 170-200

**Gotchas:**
- Use `setTimeout` chains or async/await for message timing — not `setInterval`
- Each conversation should be a data array of `{ from: 'buddy'|'user', text: string, delay: ms }`
- The "nudge" feature (screen shake) is a fun easter egg — `window.vibrate` or CSS shake animation
- MSN sound effects: synthesize with Web Audio — short ascending tone for message received
- Classic MSN Messenger UI: toolbar with bold/italic/emoji buttons (non-functional, just visual)
- Scrolling: `scrollTop = scrollHeight` after each message append

---

## 5. Desktop Right-Click Context Menu

**Approach:** Listen for `contextmenu` event on the desktop background. Show a positioned `<div>` with menu items. Each item has a handler.

**Implementation pattern:**
```
- Event: desktop.addEventListener('contextmenu', ...)
- Position: e.clientX, e.clientY — clamp to viewport bounds
- Menu items:
  1. "Refresh" — plays a brief animation (icons fade out/in)
  2. Separator line (1px #808080)
  3. "New >" — submenu arrow (hover shows: Folder, Shortcut, Text Document)
  4. Separator
  5. "Arrange Icons >" — submenu: By Name, By Type, By Size, Auto Arrange
  6. "Line Up Icons" — snaps icons to grid
  7. Separator
  8. "Display Properties" — opens a wallpaper picker dialog (Win95 tabbed window)

- Styling: Win95 gray context menu
  - Background: #c0c0c0
  - Border: 2px outset #dfdfdf
  - Items: 20px height, hover = #000080 bg + white text
  - Separator: 1px inset line
  - Submenu arrow: ">" character right-aligned
  - Disabled items: gray text (#808080)

- Display Properties wallpaper picker:
  - Show 4-5 wallpaper options as thumbnails
  - Options: Teal (default), Clouds, Houndstooth, Black, Custom (the particle bg)
  - Apply button changes desktop background-color or adds a pattern
```

**Estimated lines:** 100-140

**Gotchas:**
- Must `e.preventDefault()` on contextmenu to suppress browser default menu
- Close menu on any click outside it, on Escape key, or on item selection
- Submenus: position relative to parent item, check viewport bounds
- The context menu must NOT appear when right-clicking inside a window — check `e.target` is the desktop or desktop icons, not window content
- Z-index must be higher than windows (use 9000+)
- "Refresh" is a fun callback to the actual desktop — could reload icons or flash the screen

---

## 6. Shutdown Sequence

**Approach:** Show Win95 shutdown dialog with radio buttons, then animate to black screen with orange text.

**Implementation pattern:**
```
- Trigger: "Shut Down" option in Start Menu (add to buildStartMenu)
- Dialog (modal):
  - Gray Win95 dialog box, centered
  - "Shut Down Windows" title
  - Icon: yellow warning triangle (CSS or emoji)
  - Radio buttons: "Shut down the computer?", "Restart the computer?", "Restart in MS-DOS mode?"
  - OK / Cancel / Help buttons
  - Cancel dismisses dialog
  - OK triggers shutdown sequence

- Shutdown sequence:
  1. Play shutdown sound (Web Audio: descending chord, opposite of startup chime)
  2. "Windows is shutting down..." splash (Win95 flag + text, 2 seconds)
  3. CRT shutoff animation (scaleY -> line -> gone, reuse existing gsap pattern)
  4. Black screen with orange text: "It's now safe to turn off your computer."
  5. Text blinks slowly (CSS animation)
  6. Click anywhere or press any key -> restart (reload page or go back to boot)

- Shutdown sound (Web Audio synthesis):
  const freqs = [1046.50, 783.99, 659.25, 523.25]; // reverse of startup
  Same pattern as playStartupChime but descending
```

**Estimated lines:** 90-130

**Gotchas:**
- The "It is now safe to turn off your computer" screen is iconic — must use orange/amber text (#FF8C00 or #FFA500) on pure black
- Font should be a system/bitmap-looking font (VT323 or "Press Start 2P" already loaded)
- The dialog radio buttons should look like Win95 — custom CSS radio buttons with gray background
- Must hide the desktop/taskbar during shutdown sequence
- "Restart" option should trigger `location.reload()`

---

## 7. Blue Screen of Death (BSOD)

**Approach:** Full-screen blue div with monospace white text. Show for 3 seconds, then "recover."

**Implementation pattern:**
```
- Trigger: easter egg — could be:
  - Konami code (up up down down left right left right B A)
  - Clicking a hidden pixel on desktop
  - Type "crash" in terminal
  - Random 2% chance when opening a window

- BSOD content (GPU/AI themed):
  "Windows
   A fatal exception 0E has occurred at 0028:C001E36A in VXD NVTC(01) +
   00001E36A. The current application will be terminated.

   *  Press any key to terminate the current application.
   *  Press CTRL+ALT+DEL to restart your computer. You will
      lose any unsaved information in all applications.

   Error: GPU_OVERFLOW_EXCEPTION
   TENSOR_CORE_FAULT at address 0xDEADBEEF
   VRAM_EXHAUSTED: Attempted to load 70B parameter model into 16GB VRAM
   Stack: CUDA_KERNEL -> GEMM_FP16 -> ATTENTION_SOFTMAX -> OUT_OF_MEMORY

                       Press any key to continue _"

- Styling:
  - Background: #0000AA (classic BSOD blue)
  - Color: #FFFFFF (and some #AAAAAA for headers)
  - Font: monospace, ~14px
  - Full viewport, z-index 99999
  - Blinking underscore cursor at bottom

- Recovery:
  - After 3 seconds OR on any keypress/click
  - Brief black screen (200ms)
  - Desktop reappears (no actual state loss)
  - Optional: show a "Windows is recovering..." message briefly
```

**Estimated lines:** 60-80

**Gotchas:**
- Must cover EVERYTHING — z-index above all windows and overlays
- The blinking cursor is a nice touch — CSS `animation: blink 1s step-end infinite`
- Keep the GPU/AI theme tied to the research paper content for coherence
- Don't make it trigger too easily — it should feel like a surprise easter egg
- The Konami code listener is ~15 lines: store key sequence, compare against expected

---

## 8. System Properties

**Approach:** Win95 tabbed dialog window. Three tabs rendered as clickable div buttons above a content area. Content swaps on tab click.

**Implementation pattern:**
```
- Open via: right-click "My Computer" icon -> Properties, or add to Start Menu
- Window: 400x450, not resizable

- Tab 1: General
  - Windows 95 logo (CSS art or text)
  - "Microsoft Windows 95"
  - "4.00.950 B"
  - "Registered to: Josue Aparcedo Gonzalez"
  - "IDS2891 Cornerstone Experience"
  - Computer specs:
    - "AMD Ryzen 7 7800X3D" (matches BIOS)
    - "32,768 KB RAM"
    - Research stats: "16,000+ words | 35 Sources | 9 Pioneers"

- Tab 2: Device Manager (tree view)
  - Collapsible tree:
    + Computer
      + Display adapters
        - NVIDIA GeForce RTX 4070 Ti SUPER (16GB VRAM)
      + Processors
        - AMD Ryzen 7 7800X3D (8 cores, 96MB V-Cache)
      + Disk drives
        - Samsung 990 PRO 2TB NVMe
      + Network adapters
        - Intel I225-V 2.5GbE
      + AI Accelerators (custom category)
        - Tensor Cores (4th Gen, 321 TOPS INT8)
        - RT Cores (3rd Gen)
        - CUDA Cores (8448)

- Tab 3: Performance
  - Memory usage bar (fake): "32 MB of 32 MB used"
  - System Resources: "78% free"
  - Pie chart or bar chart (CSS only):
    - Research time breakdown: Writing 40%, Research 30%, Coding 20%, Design 10%
  - Fun stats:
    - "Words written: 13,455"
    - "Sources cited: 35"
    - "Coffee consumed: 47 cups"
    - "GPU hours: 128"
    - "Local AI queries: 2,847"

- Tab styling:
  - Tabs: raised 3D buttons along top, active tab merges with content area
  - Content: white background with inset border
  - Active tab: white bg, no bottom border (merges with content)
  - Inactive tabs: #c0c0c0 bg, full border
```

**Estimated lines:** 160-200

**Gotchas:**
- Tab switching: hide/show content divs, don't rebuild DOM
- Device Manager tree: use nested divs with toggle, or just static expanded tree (simpler)
- The + / - tree toggles add ~20 lines but make it feel authentic
- Keep all stats consistent with the research paper content (13,455 words, 35 sources, etc.)
- OK / Cancel / Apply buttons at bottom (Apply changes nothing, Cancel closes, OK closes)

---

## 9. Screensaver (Starfield)

**Approach:** Full-screen canvas overlay. Animate white dots moving from center outward (classic starfield). Dismiss on any input.

**Implementation pattern:**
```
- Trigger: idle timer — no mouse/key activity for 30 seconds
- Reset idle timer on: mousemove, mousedown, keydown, scroll, touchstart

- Starfield animation:
  - Canvas covers viewport, z-index 9998 (below BSOD)
  - Black background
  - 200-400 "stars" — objects with x, y, z coordinates
  - Each frame: z decreases (star moves closer), project to 2D using perspective division
    screenX = (star.x / star.z) * centerX + centerX
    screenY = (star.y / star.z) * centerY + centerY
  - Star size and brightness increase as z decreases
  - When z < 1, reset to far z with random x, y
  - Use requestAnimationFrame for smooth 60fps
  - Optional: add slight color tint (cyan/green) to match the site's aesthetic

- "Flying through GPU cores" variant:
  - Same starfield but stars are colored (green, cyan, magenta from site palette)
  - Occasionally show text labels floating past: "CUDA", "TENSOR", "VRAM", "FP16"
  - Stars could be tiny squares instead of circles (pixel aesthetic)

- Dismissal:
  - Any mouse/key event removes the canvas and clears the animation frame
  - Brief fade-out (200ms opacity transition)
  - Restart idle timer
```

**Estimated lines:** 80-120

**Gotchas:**
- Must cancel `requestAnimationFrame` on dismiss to prevent memory leak
- Idle timer must be global — set it up once, not per-window
- Don't trigger screensaver during typing in terminal/notepad — check if any input is focused? Actually the idle timer (mousemove resets it) handles this naturally since typing involves key events
- The canvas must be on top of windows but below BSOD
- `document.hidden` / `visibilitychange`: pause animation when tab is not visible to save CPU
- Keep star count reasonable (200-300) — more than 500 gets choppy on low-end devices

---

## 10. Startup Sound (Windows 95 Chime)

**Approach:** Web Audio API synthesis. The existing `playStartupChime()` in main.js already does a simple ascending chord. Enhance it to sound closer to the Brian Eno composition.

**Current implementation (already exists in main.js):**
```js
const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
// Plays each as a sine wave, 150ms apart, with fade-out
```

**Enhanced version to approximate the Eno chime:**
```
The real Win95 startup sound is a 6-note ambient chord progression, ~3.2 seconds long.
Brian Eno composed it on a Macintosh (ironic). Key characteristics:
- Multiple layered sine/triangle waves
- Notes overlap (not sequential like the current version)
- Slight detuning for warmth
- Long reverb tail
- Key of F major / Bb major area

Synthesis approach:
- 4-6 oscillators playing simultaneously
- Each with slightly different start times (0, 0.1s, 0.3s, 0.8s, 1.2s, 1.8s)
- Frequencies: Bb3(233), F4(349), Bb4(466), D5(587), F5(698), Bb5(932)
- Mix sine + triangle waves for richness
- ConvolverNode for reverb (generate impulse response from noise)
- Each note fades in and sustains, total duration ~3 seconds
- Master gain envelope: attack 0.1s, sustain 2s, release 1s

Simple reverb via feedback delay:
- DelayNode (0.05s) -> GainNode (0.3) -> feedback loop
- Or use multiple delays at different times for a chorus effect
```

**Estimated lines:** 40-60 (replacing existing `playStartupChime`)

**Gotchas:**
- **Legal:** The actual Brian Eno recording is copyrighted by Microsoft. Cannot use the audio file. Synthesis is legal — you're creating an original approximation
- **Autoplay policy:** Already handled — the existing code requires a click ("CLICK TO POWER ON") before audio plays
- **ConvolverNode** requires an AudioBuffer for impulse response — generate one from decaying white noise (~20 lines)
- The current chime sounds thin. Adding detuned oscillator pairs (+/- 2Hz) creates a warmer, chorus-like effect
- Keep the existing `playStartupChime` function signature — just replace the internals
- Volume should be low (gain 0.01-0.02 per oscillator) — multiple oscillators add up fast

---

## Integration Summary

### APP_CONFIG additions needed:
```
minesweeper: { title: 'Minesweeper', icon: '💣', ... }
paint:       { title: 'Paint', icon: '🎨', ... }
ie:          { title: 'Internet Explorer', icon: '🌐', ... }
msn:         { title: 'MSN Messenger', icon: '💬', ... }
sysprops:    { title: 'System Properties', icon: '🖥️', ... }
```

### Start Menu additions:
```
{ id: 'minesweeper', icon: '💣', label: 'Minesweeper' }
{ id: 'paint',       icon: '🎨', label: 'Paint' }
{ id: 'ie',          icon: '🌐', label: 'Internet Explorer' }
{ id: 'msn',         icon: '💬', label: 'MSN Messenger' }
{ id: 'sysprops',    icon: '🖥️', label: 'System Properties' }
```

### Non-window features (no APP_CONFIG entry):
- Context menu: event listener on desktop
- Shutdown: Start Menu item (special handler, not a window)
- BSOD: easter egg trigger (Konami code or terminal command)
- Screensaver: idle timer (global)
- Startup sound: enhance existing `playStartupChime()`

### Desktop icons to add:
- Minesweeper, Paint, Internet Explorer on desktop
- MSN Messenger, System Properties accessible from Start Menu

### Estimated total lines across all 10 features: ~1,050-1,400

### Priority order (impact vs effort):
1. **Context menu** (~120 lines) — high polish, low effort, makes desktop feel real
2. **Shutdown sequence** (~110 lines) — completes the boot-to-shutdown lifecycle
3. **BSOD** (~70 lines) — tiny, high entertainment value, ties to research theme
4. **Screensaver** (~100 lines) — visually impressive, reinforces GPU theme
5. **Startup sound** (~50 lines) — quick enhancement of existing code
6. **Minesweeper** (~170 lines) — iconic Win95 app, fun interactive element
7. **System Properties** (~180 lines) — shows research stats in Win95 chrome
8. **Internet Explorer** (~100 lines) — meta-recursive concept is clever
9. **MSN Messenger** (~190 lines) — most content to write (conversations), high payoff
10. **Paint** (~180 lines) — most complex (canvas + flood fill), but great interactive demo

### CSS budget:
Each app needs ~30-50 lines of Win95-themed CSS. Reuse existing `.win95-*` classes for window chrome. New styles needed mainly for:
- Minesweeper grid cells (raised/sunken borders)
- Paint toolbar and color swatches
- MSN buddy list and chat bubbles
- Context menu (gray, outset border, hover highlight)
- Screensaver canvas overlay
- BSOD full-screen blue
- Shutdown "safe to turn off" screen
- System Properties tabs

Estimated CSS total: ~250-350 additional lines in style.css
