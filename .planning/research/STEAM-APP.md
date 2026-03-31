# Steam-Like Game Launcher App — Research

> **Context:** Win95 desktop OS website for a college final project about AI hardware evolution.
> **Goal:** A "Steam" app that looks like early Steam (2003-2010 era), contains playable mini-games and educational experience demos, all launchable from within the existing Win95 window manager.

---

## 1. Early Steam UI (2003-2010) — Visual Reference

### 2003-2006 Era ("Old Green Steam")
- **Color scheme:** Olive green / dark grey. The iconic "green Steam" used `#4a5942` (olive) and `#3c4137` (dark background) tones, with lighter green highlights.
- **Layout:** Single-window app. Top menu bar (`Steam | View | Friends | Games | Help`), below it a horizontal tab bar (`Store | Games | Servers | Friends | Monitor`), then the main content area.
- **Typography:** Small, sans-serif system font (Tahoma / Arial). All caps for menu items. Low-contrast text on dark backgrounds.
- **Game list:** Simple flat list in a left sidebar — game name only, no art. Selected game showed a basic detail pane on the right.
- **Aesthetic:** Utilitarian, cramped, low-resolution. No rounded corners. Beveled buttons. Resembles a developer tool more than a consumer app.
- **Reference recreation:** [Tecate/steam-2003](https://github.com/Tecate/steam-2003) — full web recreation of the 2003 UI.
- **Skin pack:** [OG-Steam](https://github.com/ungstein/OG-Steam) — accurate 2004 skin that replicates the look.

### 2007-2010 Era ("Dark Steam")
- **Color scheme shifted** to the now-familiar dark blue-grey: `#1b2838` (background), `#171a21` (sidebar dark), `#232730` (card/panel), `#2a475e` (header), `#66c0f4` (accent blue), `#c7d5e0` (text light).
- **Layout evolved** to a proper two-pane layout: game library list on the left, game detail page on the right showing banner art, description, play button.
- **Typography:** Moved to custom fonts. Modern Steam uses "Motiva Sans" but the 2010 era used a mix of Tahoma/Verdana with bold headings.
- **Install/Play button:** Big green `PLAY` or `INSTALL` button in the detail pane. Became the signature interaction.
- **Game art:** Landscape banner images (460x215 "capsule" art) appeared for each game.

### Recommended Design for This Project
Blend both eras: use the **2003 olive-green color palette** (ties to the retro Win95 desktop OS) with the **2010 two-pane layout** (game list sidebar + detail panel). This gives the nostalgia factor while being functional.

**Proposed color tokens:**
```css
--steam-bg:        #3c4137;   /* main background (olive-dark) */
--steam-sidebar:   #2d3128;   /* sidebar darker */
--steam-header:    #4a5942;   /* header bar / menu bar (olive) */
--steam-accent:    #8bab5e;   /* green accent / selected items */
--steam-text:      #c8d0b8;   /* primary text (warm grey-green) */
--steam-text-dim:  #7a8068;   /* secondary text */
--steam-btn-play:  #5ba32b;   /* PLAY button green */
--steam-btn-install: #4a7a2e; /* INSTALL button darker green */
--steam-highlight: #a4c639;   /* hover / active highlight */
--steam-border:    #555d4a;   /* subtle borders */
```

---

## 2. Snake Game — Vanilla JS (<200 Lines)

### Best Reference Implementation
**[straker/snake gist](https://gist.github.com/straker/ff00b4b49669ad3dec890306d348adc4)** — Complete snake game in ~85 lines (no comments). Uses HTML5 Canvas. MIT-style public domain.

### Core Architecture (fit in ~120 lines with polish)
```
1. Canvas setup (400x400, black background)
2. Snake = array of {x, y} segments, starts at center
3. Food = random {x, y} on grid
4. Game loop via setInterval (100ms = 10fps, classic feel)
5. Direction change via arrow keys (prevent reverse)
6. Each tick: move head, check collision (wall/self), check food
7. Draw: clear canvas, draw snake segments (green), draw food (red)
8. Score display, game over state, restart on Space
```

### Key Code Patterns
```javascript
// Grid-based movement (16px cells on 400px canvas = 25x25 grid)
const grid = 16;
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let snake = [{x: 160, y: 160}];
let velocity = {x: grid, y: 0};
let food = {x: 320, y: 320};
let score = 0;

// Game loop
let gameLoop = setInterval(function() {
  // Move
  const head = {x: snake[0].x + velocity.x, y: snake[0].y + velocity.y};
  snake.unshift(head);

  // Eat food?
  if (head.x === food.x && head.y === food.y) {
    score++;
    food = randomFood();
  } else {
    snake.pop();
  }

  // Collision → game over
  if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) gameOver();
  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) gameOver();
  }

  // Draw
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0f0';
  snake.forEach(s => ctx.fillRect(s.x, s.y, grid-1, grid-1));
  ctx.fillStyle = '#f00';
  ctx.fillRect(food.x, food.y, grid-1, grid-1);
}, 100);
```

### Retro Enhancements for Win95 Theme
- Use Win95 system colors (teal/grey background, yellow snake)
- Add pixel-art food icons (apple emoji rendered to canvas)
- CRT scanline overlay via CSS on the canvas
- Score in a Win95-style statusbar below the game

---

## 3. Mini Platformer / Mario — Vanilla JS + Canvas (<300 Lines)

### Best Reference Implementation
**[jakesgordon/javascript-tiny-platformer](https://github.com/jakesgordon/javascript-tiny-platformer)** — Complete platformer in a single `platformer.js` file. Tile-based levels, gravity, jumping, coin collection, enemies. Uses `requestAnimationFrame` game loop with fixed timestep.

### Core Architecture
```
1. Tile map: 2D array where 1=platform, 2=coin, 3=enemy, 0=air
2. Player: {x, y, vx, vy, jumping, grounded}
3. Physics: gravity pulls vy down, jump sets vy negative, friction on vx
4. Collision: AABB tile collision — check all 4 corners of player against tile map
5. Input: LEFT/RIGHT arrows for movement, SPACE/UP for jump
6. Render: fillRect for tiles, different colors for platforms/coins/player/enemies
7. Camera: offset rendering to scroll with player
8. Win condition: collect all coins or reach end of level
```

### Simplified Level Format
```javascript
const LEVELS = [
  { map: [
    '                        ',
    '                        ',
    '       CCC              ',
    '      =====      CC     ',
    '                =====   ',
    '   CC                   ',
    '  =====    ===      === ',
    '                        ',
    '========================',
  ], player: {x: 1, y: 7} }
];
// '=' = solid platform, 'C' = coin, ' ' = air
```

### Key Game Loop Pattern
```javascript
function update(dt) {
  // Apply gravity
  player.vy += GRAVITY * dt;

  // Apply input
  if (keys.left)  player.vx = -SPEED;
  if (keys.right) player.vx = SPEED;
  if (keys.jump && player.grounded) { player.vy = -JUMP_FORCE; player.grounded = false; }

  // Move + collide
  player.x += player.vx * dt;
  resolveCollisionX();
  player.y += player.vy * dt;
  resolveCollisionY();

  // Friction
  player.vx *= 0.8;
}

function render() {
  ctx.clearRect(0, 0, W, H);
  // Draw tiles
  for (let row = 0; row < map.length; row++)
    for (let col = 0; col < map[row].length; col++)
      if (map[row][col] === '=') ctx.fillRect(col*T - camX, row*T, T, T);
  // Draw player
  ctx.fillStyle = '#f00';
  ctx.fillRect(player.x - camX, player.y, PW, PH);
}
```

### Theming for This Project
- Make it "GPU Quest" or "Silicon Runner" — a character running through a circuit board
- Platforms are silicon wafers / PCB traces (green on black)
- Coins are transistors or GPU cores
- Simple pixel character (can be a literal chip)
- Ties directly into the AI hardware evolution research topic

---

## 4. CPU vs GPU Race — Educational Mini-Game

### Concept
A visual race that demonstrates parallel processing. The "CPU" processes tasks one-by-one (serial). The "GPU" processes them all at once (parallel). The player sees both working on the same workload and the GPU finishes dramatically faster.

### Implementation Design
```
Layout: Split screen — CPU lane on left, GPU lane on right
Task: Render N colored blocks (e.g., 1000 pixels of an image)

CPU side:
  - Single worker fills blocks ONE AT A TIME, left-to-right
  - Visual: blocks light up sequentially with a small delay
  - Progress bar creeps forward

GPU side:
  - ALL workers fill blocks SIMULTANEOUSLY (or in large batches)
  - Visual: blocks light up in massive parallel waves
  - Progress bar fills rapidly

Controls:
  - "START RACE" button
  - Slider to change workload size (100 / 500 / 1000 / 5000 tasks)
  - "What just happened?" explanation panel after race completes
```

### Code Pattern (~150 lines)
```javascript
const TASKS = 500;
const CPU_SPEED = 2;   // tasks per frame
const GPU_SPEED = 50;  // tasks per frame (parallel batch)

let cpuDone = 0, gpuDone = 0;
let racing = false;

function startRace() {
  cpuDone = 0; gpuDone = 0; racing = true;
  requestAnimationFrame(raceLoop);
}

function raceLoop() {
  if (!racing) return;

  // CPU: serial
  cpuDone = Math.min(cpuDone + CPU_SPEED, TASKS);

  // GPU: parallel batch
  gpuDone = Math.min(gpuDone + GPU_SPEED, TASKS);

  // Render progress
  renderLane('cpu', cpuDone, TASKS);
  renderLane('gpu', gpuDone, TASKS);

  if (cpuDone >= TASKS && gpuDone >= TASKS) {
    racing = false;
    showExplanation();
  } else {
    requestAnimationFrame(raceLoop);
  }
}

function renderLane(side, done, total) {
  // Draw grid of colored blocks, filled up to `done`
  const cols = 25, rows = Math.ceil(total / cols);
  for (let i = 0; i < total; i++) {
    const x = (i % cols) * blockSize;
    const y = Math.floor(i / cols) * blockSize;
    ctx.fillStyle = i < done ? (side === 'cpu' ? '#4488ff' : '#44ff88') : '#333';
    ctx.fillRect(offsetX + x, y, blockSize-1, blockSize-1);
  }
}
```

### Educational Payoff
After the race, show a panel explaining:
- "The CPU processed tasks **one at a time** — great for complex branching logic"
- "The GPU processed tasks **in parallel batches** — ideal for repetitive simple operations"
- "This is why GPUs revolutionized AI: neural networks are billions of simple multiply-add operations"
- Tie to specific research paper sections (quantization, CUDA cores, tensor cores)

---

## 5. Experience Demos as "Games"

The existing experience demos (hardware evolution timeline, pioneer profiles, CPU vs GPU parallel processing) should appear in the Steam library as "installable" games.

### Library Entries
| Title | Icon | Category | Description |
|-------|------|----------|-------------|
| Snake Classic | `🐍` | Games | The classic — eat, grow, don't hit yourself |
| Silicon Runner | `🏃` | Games | Platformer through the history of computing hardware |
| CPU vs GPU Race | `🏁` | Experiences | See why parallel processing changed everything |
| Hardware Timeline | `📅` | Experiences | Interactive journey from vacuum tubes to neural engines |
| Pioneer Profiles | `👤` | Experiences | Meet the engineers who built the future |
| AI Benchmark Lab | `🔬` | Experiences | Compare model performance across hardware generations |

### Install/Play State Machine
```
STATES: not_installed → installing → installed → playing

not_installed:
  - Shows "INSTALL" button (dark green)
  - Clicking triggers fake install progress bar (2-3 seconds)
  - Progress bar fills with percentage text

installing:
  - Button disabled, shows progress
  - Fake download size text ("Downloading 12.4 MB...")
  - After complete → installed state

installed:
  - Shows "PLAY" button (bright green, larger)
  - Shows "Uninstall" link below
  - Displays "Last played: Never" or "Today"

playing:
  - Game launches in a new Win95 window via existing WindowManager
  - Steam library window stays open behind it
  - Taskbar shows both the Steam pill and the game pill
```

### Persistence
Use `localStorage` to remember install state:
```javascript
const gameStates = JSON.parse(localStorage.getItem('steamStates') || '{}');
// { snake: 'installed', platformer: 'not_installed', ... }
```

---

## 6. Game Launcher UI Structure — HTML/CSS

### Layout (Two-Pane, Early Steam Style)
```
┌──────────────────────────────────────────────────────┐
│  ☰ Steam    View    Friends    Help                  │  ← Menu bar (olive green)
├──────────┬───────────────────────────────────────────┤
│ ▸ GAMES  │                                           │
│  🐍 Snake│  [Banner Image / Screenshot]              │
│  🏃 Sili-│                                           │
│     con  │  SILICON RUNNER                           │
│  🏁 Race │  ─────────────────────                    │
│          │  A platformer through the history         │
│ ▸ EXPER- │  of computing hardware. Jump across       │
│  IENCES  │  silicon wafers, collect transistors,     │
│  📅 Time-│  avoid overheating!                       │
│     line │                                           │
│  👤 Pion-│  [████████████ PLAY ████████████]         │
│     eers │                                           │
│  🔬 Bench│  Recent Activity                          │
│          │  ● Last played: Today                     │
│          │  ● Time played: 3 min                     │
├──────────┴───────────────────────────────────────────┤
│  ◀ ▶   6 Games                     ▼ Filter ▼ Sort  │  ← Status bar
└──────────────────────────────────────────────────────┘
```

### CSS Architecture
```css
.steam-app {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--steam-bg);
  color: var(--steam-text);
  font-family: 'Tahoma', 'Verdana', sans-serif;
  font-size: 11px;
}

.steam-menubar {
  display: flex;
  gap: 0;
  background: var(--steam-header);
  padding: 2px 4px;
  border-bottom: 1px solid var(--steam-border);
}

.steam-menubar button {
  background: none;
  border: none;
  color: var(--steam-text);
  padding: 2px 8px;
  font-size: 11px;
  cursor: pointer;
}
.steam-menubar button:hover {
  background: var(--steam-accent);
  color: #fff;
}

.steam-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.steam-sidebar {
  width: 180px;
  min-width: 160px;
  background: var(--steam-sidebar);
  border-right: 1px solid var(--steam-border);
  overflow-y: auto;
}

.steam-sidebar-category {
  padding: 6px 10px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--steam-text-dim);
  border-bottom: 1px solid var(--steam-border);
}

.steam-sidebar-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: background 0.1s;
}
.steam-sidebar-item:hover {
  background: rgba(139,171,94,0.15);
}
.steam-sidebar-item.active {
  background: rgba(139,171,94,0.25);
  border-left-color: var(--steam-accent);
  color: #fff;
}

.steam-detail {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.steam-detail-banner {
  width: 100%;
  height: 180px;
  background: linear-gradient(135deg, #2d3128, #4a5942);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
}

.steam-detail-info {
  padding: 16px 20px;
}

.steam-detail-title {
  font-size: 20px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 8px;
}

.steam-detail-desc {
  color: var(--steam-text-dim);
  line-height: 1.5;
  margin-bottom: 16px;
}

.steam-play-btn {
  display: block;
  width: 100%;
  padding: 12px;
  background: linear-gradient(180deg, var(--steam-btn-play), #4a8a22);
  color: #fff;
  border: 1px solid #6bc735;
  font-size: 16px;
  font-weight: bold;
  letter-spacing: 2px;
  text-transform: uppercase;
  cursor: pointer;
  text-align: center;
}
.steam-play-btn:hover {
  background: linear-gradient(180deg, #6bc735, var(--steam-btn-play));
}

.steam-install-btn {
  /* Same shape but muted */
  background: linear-gradient(180deg, var(--steam-btn-install), #3a6620);
  border-color: #5a9a3e;
}

.steam-progress-bar {
  height: 20px;
  background: #222;
  border: 1px solid var(--steam-border);
  position: relative;
}
.steam-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--steam-accent), var(--steam-btn-play));
  transition: width 0.3s;
}

.steam-statusbar {
  display: flex;
  justify-content: space-between;
  padding: 3px 8px;
  background: var(--steam-header);
  border-top: 1px solid var(--steam-border);
  font-size: 10px;
  color: var(--steam-text-dim);
}
```

---

## 7. Win95 Desktop Integration Patterns

### How the Existing Codebase Works
The project already has a full `WindowManager` class at line 434 of `main.js`:
- `wm.createWindow(appId, title, icon, contentEl, opts)` — creates a Win95-style window with titlebar, content area, statusbar
- Supports drag, minimize, maximize, close, z-index stacking
- Taskbar pills auto-created for each window
- Apps defined in `APP_CONFIG` object with `open()` methods

### Launching Games: Overlay in Existing Window (Recommended)
**Pattern: Game launches inside a new Win95 window via `wm.createWindow()`**

This is consistent with how every other app in the desktop works. The Steam app itself is one window. When you click PLAY, it opens a *second* window for the game.

```javascript
// In the Steam app's play button handler:
function launchGame(gameId) {
  const game = GAME_REGISTRY[gameId];

  // Create canvas for the game
  const canvas = document.createElement('canvas');
  canvas.width = game.width || 400;
  canvas.height = game.height || 400;
  canvas.style.cssText = 'display:block;margin:0 auto;background:#000;image-rendering:pixelated;';

  const container = document.createElement('div');
  container.style.cssText = 'display:flex;flex-direction:column;height:100%;background:#000;';
  container.appendChild(canvas);

  // Create game window
  const winEl = wm.createWindow(
    'game-' + gameId,
    game.title,
    game.icon,
    container,
    { width: game.winWidth || 450, height: game.winHeight || 480 }
  );

  // Initialize the game engine
  game.init(canvas, () => {
    // Cleanup callback when window closes
  });
}
```

### Why NOT window.open() or Fullscreen
- `window.open()` creates a separate browser window — breaks the Win95 illusion
- Browsers aggressively block popups not triggered by direct user clicks
- Fullscreen API would hide the desktop/taskbar — defeats the purpose
- The existing `WindowManager` already handles z-index, focus, minimize, close
- Games should feel like Win95 apps, not escape the OS

### Cleanup on Window Close
The WindowManager's close handler needs to call a game cleanup function to stop `requestAnimationFrame` / `setInterval` loops and remove event listeners:

```javascript
// In WindowManager.closeWindow():
closeWindow(appId) {
  const w = this.windows.get(appId);
  if (!w) return;

  // Call cleanup if registered
  if (w.onClose) w.onClose();

  w.el.remove();
  this.windows.delete(appId);
  this._removePill(appId);
}
```

---

## 8. Win95 Web Recreation Patterns (from Research)

### Key Projects Studied
| Project | Tech | Games? | Window Mgmt |
|---------|------|--------|-------------|
| [win4r/windows95-simulator](https://github.com/win4r/windows95-simulator) | Vanilla HTML/CSS/JS | No | Full WM with z-index, drag, resize, focus |
| [1j01/98](https://github.com/1j01/98) | JS | Minesweeper, Solitaire | Full WM, very polished |
| [rn10950/Windows95-HTML](https://github.com/rn10950/Windows95-HTML) | HTML5 | No | Basic |
| [felixrieseberg/windows95](https://github.com/felixrieseberg/windows95) | Electron + v86 | Full Win95 via emulation | Real Win95 WM |
| [98.js.org](https://98.js.org/) | JS | Minesweeper, Solitaire, Pinball | Most complete recreation |

### Common Patterns
1. **Games are just another app** — same window frame, same WM. The game renders to a canvas inside the window's content area.
2. **Game state persists** until window closes — no save/load complexity needed.
3. **Keyboard focus** is critical — when a game window is focused, arrow keys go to the game, not the OS. Use `e.stopPropagation()` on the game container.
4. **Sound:** Web Audio API for game sounds. Keep sounds short (beeps, blips). The 98.js.org project uses small .wav files.

### Keyboard Focus Pattern
```javascript
// When game window is focused, capture keys
gameContainer.addEventListener('keydown', (e) => {
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
    e.preventDefault();
    e.stopPropagation();
    handleGameKey(e.code);
  }
});

// Make container focusable
gameContainer.tabIndex = 0;
gameContainer.focus();
```

---

## 9. Implementation Plan — Suggested Phases

### Phase A: Steam App Shell (~2 hours)
- Add Steam to `APP_CONFIG` with icon `🎮`
- Add desktop icon for Steam
- Build the two-pane layout (sidebar + detail) as the window content
- Style with the olive-green palette
- Wire up the menu bar (non-functional decorative)
- Implement game registry data structure with title, icon, description, category, banner
- Implement install state machine with localStorage

### Phase B: Snake Game (~1 hour)
- ~120 lines of vanilla JS
- Grid-based, canvas rendering, classic feel
- Retro color scheme, scanline overlay
- Score tracking, game over / restart
- Hook into Steam's "PLAY" button → `wm.createWindow('game-snake', ...)`

### Phase C: Silicon Runner Platformer (~2 hours)
- ~250 lines of vanilla JS
- Tile map levels, gravity, jumping, coins
- Circuit-board theme (green traces on black PCB)
- 2-3 short levels
- Coin = transistor, platform = silicon wafer

### Phase D: CPU vs GPU Race (~1.5 hours)
- ~150 lines
- Split-screen visual race
- Workload size slider
- Educational explanation panel after race
- Ties to research paper content

### Phase E: Experience Demos Integration (~1 hour)
- Wrap existing experience demos (timeline, pioneers, benchmark) as Steam library entries
- Each opens via the same `wm.createWindow()` pattern
- Reuse existing demo content, just add the install/play flow

### Total Estimated: ~7.5 hours of implementation

---

## 10. File Structure

All game code should live in the same `main.js` (consistent with the existing monolithic pattern) or in a separate `games.js` imported alongside it. Given the current codebase uses a single `main.js` with ES modules, adding game code inline is simplest.

```
website/
  main.js          ← Add Steam app + game code here
  style.css        ← Add .steam-* styles here
  index.html       ← Add Steam desktop icon
  assets/
    steam-banner-snake.png      ← (optional) banner images
    steam-banner-platformer.png
    steam-banner-race.png
```

### Game Registry Data Structure
```javascript
const GAME_REGISTRY = {
  snake: {
    id: 'snake',
    title: 'Snake Classic',
    icon: '🐍',
    category: 'games',
    description: 'The classic snake game. Eat food, grow longer, don\'t hit yourself or the walls. How long can you survive?',
    banner: '🐍',  // Emoji fallback if no image
    width: 400, height: 400,
    winWidth: 440, winHeight: 500,
    init: initSnakeGame,
    cleanup: null  // set during init
  },
  platformer: {
    id: 'platformer',
    title: 'Silicon Runner',
    icon: '🏃',
    category: 'games',
    description: 'Run and jump through the history of computing hardware. Collect transistors, avoid overheating, reach the neural engine.',
    banner: '🏃',
    width: 640, height: 400,
    winWidth: 680, winHeight: 500,
    init: initPlatformerGame,
    cleanup: null
  },
  cpurace: {
    id: 'cpurace',
    title: 'CPU vs GPU Race',
    icon: '🏁',
    category: 'experiences',
    description: 'Watch a CPU and GPU race to complete the same workload. See why parallel processing revolutionized AI and why GPUs became the backbone of modern machine learning.',
    banner: '🏁',
    width: 600, height: 400,
    winWidth: 640, winHeight: 520,
    init: initCpuGpuRace,
    cleanup: null
  },
  timeline: {
    id: 'timeline',
    title: 'Hardware Timeline',
    icon: '📅',
    category: 'experiences',
    description: 'An interactive journey from vacuum tubes to neural processing units. Explore 80 years of hardware evolution.',
    banner: '📅',
    width: 800, height: 500,
    winWidth: 840, winHeight: 580,
    init: initTimeline,  // wraps existing experience
    cleanup: null
  },
  pioneers: {
    id: 'pioneers',
    title: 'Pioneer Profiles',
    icon: '👤',
    category: 'experiences',
    description: 'Meet the engineers and visionaries who built the hardware that powers AI: Jensen Huang, Lisa Su, Gordon Moore, and more.',
    banner: '👤',
    width: 700, height: 500,
    winWidth: 740, winHeight: 580,
    init: initPioneers,  // wraps existing experience
    cleanup: null
  }
};
```

---

## Sources

### Early Steam UI
- [Tecate/steam-2003 — Web recreation](https://github.com/Tecate/steam-2003)
- [OG-Steam — 2004 skin](https://github.com/ungstein/OG-Steam)
- [Steam 2004 green skin — WinClassic](https://winclassic.net/thread/1066/steam-2004-green-skin)
- [Steam color palette — color-hex.com](https://www.color-hex.com/color-palette/1050902)
- [Steam: evolution of UI/UX — UX Collective](https://uxdesign.cc/steam-the-evolution-of-interface-and-user-experience-in-gaming-42159c8b8ad1)
- [Steam font analysis — Subframe](https://www.subframe.com/tips/what-font-does-steam-use)
- [SteamUI-OldGlory CSS modules](https://github.com/Jonius7/SteamUI-OldGlory)

### Snake Game Implementations
- [straker — Basic Snake HTML/JS (Gist)](https://gist.github.com/straker/ff00b4b49669ad3dec890306d348adc4)
- [Educative — Snake game tutorial](https://www.educative.io/blog/javascript-snake-game-tutorial)
- [DEV.to — Make Snake with vanilla JS](https://dev.to/ritza/make-snake-with-vanilla-javascript-2h2f)
- [Thoughtbot — Snake with HTML5 Canvas](https://thoughtbot.com/blog/html5-canvas-snake-game)

### Platformer Implementations
- [jakesgordon/javascript-tiny-platformer](https://github.com/jakesgordon/javascript-tiny-platformer)
- [Jake Gordon — Tiny Platformer writeup](https://jakesgordon.com/writing/tiny-platformer/)
- [GameDev Academy — HTML5 Mario platformer](https://gamedevacademy.org/create-a-html5-mario-style-platformer-game/)
- [Jakub Arnold — 2D Platformer from scratch](https://blog.jakuba.net/2018-01-28-lets-write-a-2d-platformer-from-scratch-part-1/)

### CPU vs GPU Visualization
- [CPU vs GPU with Canvas Web API](https://www.middle-engine.com/blog/posts/2020/08/21/cpu-versus-gpu-with-the-canvas-web-api)
- [GPU.js — GPU accelerated JavaScript](https://gpu.rocks/)
- [WebGPU benchmark demo — DEV.to](https://dev.to/sylwia-lask/why-are-we-still-doing-gpu-work-in-javascript-live-webgpu-benchmark-demo-4j6i)

### Win95 Web Recreations
- [win4r/windows95-simulator](https://github.com/win4r/windows95-simulator)
- [1j01/98 — Windows 98 recreation](https://github.com/1j01/98)
- [98.js.org — Windows 98 Online](https://98.js.org/)
- [felixrieseberg/windows95 — Electron](https://github.com/felixrieseberg/windows95)
- [rn10950/Windows95-HTML](https://github.com/rn10950/Windows95-HTML)

### Window/Popup Patterns
- [MDN — Window.open()](https://developer.mozilla.org/en-US/docs/Web/API/Window/open)
- [javascript.info — Popups and window methods](https://javascript.info/popup-windows)
- [Chrome — Fullscreen popups origin trial](https://developer.chrome.com/blog/fullscreen-popups-origin-trial)
- [WinBox — zero-dependency window library](https://www.cssscript.com/drag-resize-max-min-winbox/)
