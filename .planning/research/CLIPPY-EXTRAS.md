# Win95 Desktop Extras II -- Clippy, Audio & Polish

> Research date: 2026-03-30
> Constraint: Vanilla JS, no frameworks, no build tools, CDN only
> Integration target: existing `WindowManager` class in `website/main.js`

---

## 1. Clippy in Notepad

### What is Clippy.js?

**clippyjs** (https://github.com/pi0/clippyjs) is a full JavaScript reimplementation of Microsoft Agent (Clippy and friends). It renders sprite-sheet-based animations on a canvas, handles idle behaviors, speech bubbles, and movement.

### How Clippy Originally Animated

The original Microsoft Agent used sprite sheets -- a single large PNG containing every frame of every animation. A JSON map defines frame coordinates, durations, and branching logic (e.g., idle has a 10% chance to trigger "LookAround" instead of "Rest"). Animations include:

- **Idle**: subtle breathing/blinking, random branch to secondary idles
- **Wave**: arm raises, waves side to side
- **LookAround**: eyes/head shift left and right
- **GetAttention**: taps on screen glass (poke animation)
- **Writing**: scribbles with pencil
- **Thinking**: hand on chin
- **Congratulate**: jumps and claps
- **GoodBye/Hide**: shrinks and vanishes

### CDN Setup (no npm, no build tools)

```html
<!-- jQuery required by clippyjs -->
<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
<!-- clippyjs UMD bundle -->
<script src="https://cdn.jsdelivr.net/npm/clippyjs@0.0.3/dist/clippy.min.js"></script>
```

Agent sprite sheets are loaded from GitHub CDN automatically. Override with:
```js
window.CLIPPY_CDN = 'https://cdn.jsdelivr.net/gh/pi0/clippyjs/assets/agents/';
```

### API

```js
clippy.load('Clippy', (agent) => {
  agent.show();                      // appear on screen
  agent.speak('Hello!');             // speech bubble
  agent.play('Wave');                // named animation
  agent.animate();                   // random animation
  agent.moveTo(x, y);               // move to position
  agent.gestureAt(x, y);            // point at coordinates
  agent.closeBalloon();             // dismiss speech bubble
  agent.hide();                      // disappear
  agent.animations();                // returns string[] of all animation names
  agent.stop();                      // stop all, return to idle
});
```

All actions are **queued** -- you can chain `.speak()` then `.play()` and they execute in order.

### Available Agents
Clippy, Bonzi, F1, Genie, Genius, Links (the cat), Merlin, Peedy, Rocky, Rover

### Integration Plan for Notepad

```
When Notepad window opens:
1. clippy.load('Clippy', cb) -- load agent (cached after first load)
2. agent.show() -- appear near the Notepad window
3. agent.moveTo(notepadX + notepadWidth - 120, notepadY + 40)
4. agent.play('GetAttention') -- tap on glass
5. After animation completes:
   agent.speak('It looks like you are writing a research paper! Would you like help?')
6. Custom UI with two buttons: "Yes" / "No"
   - Both dismiss: agent.play('GoodBye') then agent.hide()
   - "Yes" could trigger: agent.speak('Great! I will just watch.') then hide
7. On Notepad close: agent.hide() and agent.stop()
```

### Speech Bubble Customization

clippyjs speech bubbles are plain DOM divs (class `.clippy-balloon`). Override styles:
```css
.clippy-balloon {
  font-family: 'Tahoma', 'MS Sans Serif', sans-serif;
  font-size: 12px;
  background: #ffffcc;
  border: 1px solid #000;
  border-radius: 4px;
  padding: 8px;
  max-width: 200px;
}
```

### Yes/No Buttons in Speech Bubble

clippyjs `.speak()` only renders text. To add buttons, either:
- **Option A**: Inject DOM after `.speak()` -- query `.clippy-balloon` and append button elements
- **Option B**: Don't use `.speak()` -- create your own positioned div near the agent with buttons, dismiss manually, then call `agent.play('Wave')` or `agent.hide()`

Option B is simpler and avoids fighting the library's balloon lifecycle.

### Estimated Lines: ~60-80

### Gotchas
- **jQuery dependency**: clippyjs requires jQuery. Add it via CDN. It is ~87KB gzipped but loads fast from jsdelivr. The existing project does not use jQuery elsewhere, so this is the one external dependency cost.
- **Sprite loading**: First load fetches ~200KB of sprite sheet + JSON map per agent. Cache-friendly but first appearance has a brief delay.
- **Z-index**: Clippy renders as a fixed-position element. Set z-index above windows but below modals/BSOD.
- **Mobile**: Clippy is mouse-oriented. On touch devices, the agent may obscure content. Consider hiding on `window.innerWidth < 768`.
- **Memory**: Call `agent.hide()` and stop animations when Notepad closes. Do not leave the agent idling in background.

### Alternative: No jQuery

If jQuery is unacceptable, build a minimal Clippy:
- Use a static PNG/SVG of Clippy (many CC0 recreations exist)
- CSS animation for idle bobbing (`translateY` oscillation)
- Custom speech bubble div positioned above the image
- No sprite-sheet animations, just a static character with speech
- ~40 lines, zero dependencies

### Reference Implementations
- https://github.com/pi0/clippyjs (main library, 1.2k stars)
- https://github.com/clippyjs/clippy.js (original by Smore, archived)
- https://github.com/vchaindz/modern-clippy (TypeScript rewrite)
- https://kevinvissers.github.io/clippyjs/ (live demo)
- https://codepen.io/kunukn/pen/LNgrYa (CodePen demo)

---

## 2. Dial-Up Modem Sound for Internet Explorer

### The Real Handshake Sequence

Based on Windytan's iconic breakdown (https://www.windytan.com/2012/11/the-sound-of-dialup-pictured.html), the V.90 56k handshake has these phases:

| Phase | Duration | Sound | Frequency |
|-------|----------|-------|-----------|
| 1. Dial tone | ~1s | Steady hum | 350 + 440 Hz (US dial tone) |
| 2. DTMF dialing | ~2s | Touch-tone beeps | Dual-tone pairs per digit |
| 3. Ring | ~2s | Ringing tone | 440 + 480 Hz, on/off |
| 4. Answer tone | ~1s | Pure high tone | 2100 Hz (V.25 answer) |
| 5. V.8 negotiation | ~0.5s | Warbling | Rapid frequency shifts |
| 6. Training / equalization | ~3s | THE SCREECH | Wideband noise, swept tones, echo training |
| 7. Final handshake | ~1s | Data bursts | Modulated carrier, sounds like static |
| 8. Silence | - | Connected | Carrier established |

The total sequence is ~8-12 seconds. For the website, a condensed ~5 second version is ideal.

### Approach A: Pre-recorded Audio (Recommended)

**Internet Archive** has freely available dial-up recordings:
- https://archive.org/details/56kModem56kDialupModemSound (Public Domain mark)

Use a trimmed 5-second clip. Convert to MP3/OGG at low bitrate (~32kbps, mono, 11kHz sample rate) for authentic lo-fi quality. Store alongside `boot.mp3`.

```js
function playDialUp(onComplete) {
  const audio = new Audio('./dialup.mp3');
  audio.volume = 0.6;
  audio.play();
  audio.addEventListener('ended', onComplete);
  // Or cut it short:
  setTimeout(() => { audio.pause(); onComplete(); }, 5000);
}
```

**Estimated lines: ~10** (just playback)

### Approach B: Web Audio API Synthesis

Synthesizing the full handshake is complex (~150 lines) but zero external files:

```js
function synthDialUp(ctx, duration) {
  const now = ctx.currentTime;
  const master = ctx.createGain();
  master.gain.value = 0.3;
  master.connect(ctx.destination);

  // Phase 1: Dial tone (350 + 440 Hz), 0.0s-0.5s
  tone(ctx, 350, now, now + 0.5, master);
  tone(ctx, 440, now, now + 0.5, master);

  // Phase 2: DTMF digits (fake 7-digit number), 0.6s-1.8s
  const digits = '5551234';
  const dtmfFreqs = {
    '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
    '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
    '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
    '0': [941, 1336]
  };
  digits.split('').forEach((d, i) => {
    const t = 0.6 + i * 0.15;
    dtmfFreqs[d].forEach(f => tone(ctx, f, now + t, now + t + 0.1, master));
  });

  // Phase 3: Ring (440+480 Hz, brief)
  tone(ctx, 440, now + 2.0, now + 2.8, master);
  tone(ctx, 480, now + 2.0, now + 2.8, master);

  // Phase 4: Answer tone (2100 Hz pure), 3.0s-3.5s
  tone(ctx, 2100, now + 3.0, now + 3.5, master);

  // Phase 5: THE SCREECH -- white noise + swept oscillator, 3.5s-5.0s
  const noise = ctx.createBufferSource();
  const buf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
  noise.buffer = buf;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.15, now + 3.5);
  noiseGain.gain.linearRampToValueAtTime(0.05, now + 5.0);

  // Bandpass filter to shape the screech
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(1800, now + 3.5);
  bp.frequency.linearRampToValueAtTime(3200, now + 4.2);
  bp.frequency.linearRampToValueAtTime(1200, now + 5.0);
  bp.Q.value = 2;

  noise.connect(bp);
  bp.connect(noiseGain);
  noiseGain.connect(master);
  noise.start(now + 3.5);
  noise.stop(now + 5.0);
}

function tone(ctx, freq, start, stop, dest) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = freq;
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.15, start);
  gain.gain.linearRampToValueAtTime(0, stop);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(start);
  osc.stop(stop + 0.05);
}
```

**Estimated lines: ~80-100** (synthesis only)

### Integration with IE Window

```
When IE window opens:
1. Show "Dialing..." status in address bar area
2. Play dial-up sound (audio file or synthesis)
3. Show animated "connecting" progress bar
4. After sound ends (~5s):
   - Status changes to "Connected at 56,000 bps"
   - Brief pause (500ms)
   - Load the iframe/content
   - Show "Done" in status bar
```

### Recommendation

**Use Approach A** (pre-recorded MP3). The authentic sound is spectrally complex and hard to fully synthesize. A 5-second MP3 at 32kbps mono is only ~20KB. The synthesis approach (Approach B) is fun and impressive but sounds "close enough, not quite right" -- the real charm is in the precise frequency sweeps of actual modem hardware.

If zero external audio files is a hard requirement, Approach B works. The combination of DTMF tones + 2100Hz answer + bandpass-filtered noise is convincing enough for nostalgia purposes.

### Gotchas
- **Autoplay policy**: AudioContext must be created/resumed after user gesture. IE window opens on click, so this is satisfied.
- **Duration**: 5 seconds of waiting before content loads is intentional friction -- it is the joke. But provide a "skip" option (small "x" or click) for repeat visitors.
- **Volume**: Dial-up is harsh. Keep volume at 0.3-0.5. The real modem was LOUD.
- **Overlap with boot audio**: Ensure boot audio has finished before IE can play dial-up. Use a global audio state flag.

### References
- https://www.windytan.com/2012/11/the-sound-of-dialup-pictured.html (frequency breakdown)
- https://archive.org/details/56kModem56kDialupModemSound (free audio)
- https://hackaday.com/2013/01/31/how-a-dial-up-modem-handshake-works/ (technical explanation)

---

## 3. Winamp / LoseAmp Music Player

### Existing Recreations

**Webamp** (https://github.com/captbaritone/webamp) is the definitive Winamp 2.9 reimplementation -- pixel-perfect, full skin support, actual audio playback, spectrum/oscilloscope visualizers. However, it is a **React app** with a build step, so it cannot be used directly.

**Key insight from Webamp**: When it loads a skin, it converts all skin bitmap images into CSS sprites and uses them to style the player. The skin format (.wsz) is just a ZIP of BMP images with specific filenames (main.bmp, cbuttons.bmp, titlebar.bmp, etc.).

### Build It From Scratch (Vanilla JS)

For a vanilla JS "LoseAmp", build the Winamp 2.x layout with CSS:

**Layout dimensions** (pixel-exact to original):
- Main window: 275 x 116 px
- Title bar: 275 x 14 px
- Display area (LCD): ~152 x 32 px (dark background, green text)
- Seek bar: full width, ~10px tall
- Button row: Prev, Play, Pause, Stop, Next -- each ~23 x 18 px
- Volume slider + Balance slider
- Equalizer + Playlist toggle buttons

**Classic Winamp Color Palette:**
```css
.winamp {
  --wa-bg: #1e1e1e;           /* main body dark gray */
  --wa-lcd-bg: #000000;       /* display background */
  --wa-lcd-text: #00ff00;     /* green LCD text */
  --wa-lcd-dim: #004400;      /* dim LCD segments */
  --wa-button: #4a4a4a;       /* button face */
  --wa-border-light: #6a6a6a; /* raised edge */
  --wa-border-dark: #0a0a0a;  /* sunken edge */
  --wa-title-bg: #1a1a6e;     /* title bar gradient start */
  --wa-title-active: #0000c8; /* active title */
  --wa-seekbar: #00cc00;      /* seek position */
  --wa-volume: #00cc00;       /* volume level */
}
```

**LCD Text Display:**
- Use a pixel/bitmap font. Options:
  - CSS `font-family: 'VT323', monospace` (already loaded via Google Fonts)
  - Or draw text on a tiny `<canvas>` for authentic dot-matrix look
- Scrolling marquee for long track names: CSS `animation: marquee 8s linear infinite`
- Time display: "02:34" in large green digits
- Bitrate/kHz display: "128kbps 44kHz stereo"

**Button Controls:**
```
[|<<] [>>|] [>||] [[]||] [>>|]   -- prev, play, pause, stop, next
```
Each button: 23x18px, beveled 3D look (outset border). On press: inset border.

### Audio Playback

Use a simple `<audio>` element or Web Audio API:

```js
const audio = new Audio();
const playlist = [
  { title: 'lo-fi study beats', src: 'https://example.com/lofi.mp3' },
  // Or use royalty-free chiptune from opengameart.org
];
audio.src = playlist[0].src;
```

For a self-contained demo without external audio files, generate chiptune with Web Audio:
```js
function playChiptune(ctx) {
  // Simple arpeggio loop
  const notes = [261, 329, 392, 523, 392, 329]; // C E G C' G E
  let i = 0;
  const osc = ctx.createOscillator();
  osc.type = 'square'; // classic chiptune waveform
  const gain = ctx.createGain();
  gain.gain.value = 0.08;
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();

  setInterval(() => {
    osc.frequency.setValueAtTime(notes[i % notes.length], ctx.currentTime);
    i++;
  }, 200);
}
```

### Audio Visualizer (Spectrum Bars)

The classic Winamp spectrum analyzer: ~20 vertical bars, each representing a frequency band, animated in real-time.

```js
function createVisualizer(audioElement, canvasElement) {
  const ctx = new AudioContext();
  const src = ctx.createMediaElementSource(audioElement);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 64; // 32 frequency bins
  src.connect(analyser);
  analyser.connect(ctx.destination);

  const bufferLength = analyser.frequencyBinCount; // 32
  const dataArray = new Uint8Array(bufferLength);
  const canvasCtx = canvasElement.getContext('2d');
  const W = canvasElement.width;
  const H = canvasElement.height;

  function draw() {
    requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);
    canvasCtx.fillStyle = '#000';
    canvasCtx.fillRect(0, 0, W, H);

    const barW = W / bufferLength;
    for (let i = 0; i < bufferLength; i++) {
      const barH = (dataArray[i] / 255) * H;
      // Winamp gradient: green at bottom, yellow in middle, red at top
      const g = Math.floor(255 - (barH / H) * 255);
      const r = Math.floor((barH / H) * 255);
      canvasCtx.fillStyle = 'rgb(' + r + ', ' + g + ', 0)';
      canvasCtx.fillRect(i * barW, H - barH, barW - 1, barH);
    }
  }
  draw();
}
```

### Fake Visualizer (No Audio Source)

If no audio is playing, animate fake bars with random/sine values:
```js
function fakeVisualizer(canvas) {
  const ctx = canvas.getContext('2d');
  const bars = 20;
  const heights = new Float32Array(bars);
  function draw() {
    requestAnimationFrame(draw);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < bars; i++) {
      // Random target with smoothing (looks like real audio)
      heights[i] += (Math.random() * canvas.height * 0.6 - heights[i]) * 0.15;
      const h = heights[i];
      const r = Math.floor((h / canvas.height) * 255);
      const g = Math.floor(255 - (h / canvas.height) * 255);
      ctx.fillStyle = 'rgb(' + r + ', ' + g + ', 0)';
      const bw = canvas.width / bars;
      ctx.fillRect(i * bw, canvas.height - h, bw - 1, h);
    }
  }
  draw();
}
```

### Estimated Lines: ~180-220

### Last Seen Online "LoseAmp" Reference

The "Last Seen Online" project (already researched in LAST-SEEN-ONLINE.md) includes a Winamp-style player called "LoseAmp" as a window in their Win95 desktop recreation. It is purely decorative -- fake controls, animated visualizer bars, scrolling song title. This is the target aesthetic.

### Gotchas
- **CORS**: Loading audio from external URLs may fail due to CORS. Use same-origin files or `crossOrigin = "anonymous"` on the audio element.
- **MediaElementSource limitation**: Once you connect an `<audio>` element to Web Audio via `createMediaElementSource`, you cannot disconnect it. Create the connection once.
- **AnalyserNode needs audio playing**: The visualizer shows nothing if audio is paused. Use the fake visualizer as fallback.
- **Skin accuracy**: Do not try to be pixel-perfect to Webamp. The goal is "recognizably Winamp" not "exact clone." Focus on: dark body, green LCD text, tiny beveled buttons, spectrum bars.
- **Window size**: Winamp is tiny (275x116). In the WindowManager, set `minWidth: 275, minHeight: 200` (slightly taller to include visualizer).

### References
- https://github.com/captbaritone/webamp (React, reference only)
- https://skins.webamp.org/ (Winamp Skin Museum -- visual reference)
- https://github.com/CyberShadow/WSZ2Web (skin to CSS converter)
- https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode (MDN docs)
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API (MDN visualizer tutorial)

---

## 4. Disk Defragmenter

### Existing Recreations

Two excellent vanilla JS references:

1. **Pau Sanchez** (https://pausanchez.com/en/articles/win98-defrag-simulation-in-vanilla-javascript/) -- Uses `<canvas>` and `Uint32Array` for block state. Vanilla JS, no frameworks. Renders a grid of colored blocks, animates "optimization" by moving blocks around.

2. **uberscientist** (https://github.com/uberscientist/win95-defrag-simulation) -- Classic Win95 aesthetic. "Pour yourself a drink and relax to the soothing experience of a Windows 95 disk defragmentation."

3. **Dennis Morello** (https://defrag98.com/) -- React/Next.js version, visually impressive but wrong stack for us.

### Block Color Legend (Win95 Defrag)

| Color | Meaning |
|-------|---------|
| `#0000ff` (blue) | Used / optimized data |
| `#ff0000` (red) | Fragmented data |
| `#00ff00` (green) | Currently being moved |
| `#ffffff` (white) | Free space |
| `#ffff00` (yellow) | System/unmovable files |
| `#808080` (gray) | Bad sector |

### Implementation Plan

**Use CSS Grid** (simpler than canvas for labeled blocks):

```
Grid: 20 columns x 15 rows = 300 blocks
Each block: 24x24px div with 1px gap
```

**Research-themed block labels** (shown on hover or directly in blocks):
```js
const topics = [
  'GPU Architecture', 'CUDA Cores', 'Tensor Cores', 'VRAM',
  'FP16 Precision', 'INT8 Quantization', 'Transformer', 'Attention',
  'Backpropagation', 'ImageNet', 'FLOPS', 'Memory Bandwidth',
  'PCIe Gen5', 'NVLink', 'Sparse Matrices', 'Mixed Precision',
  'Model Parallelism', 'Data Parallelism', 'Gradient Descent',
  'Batch Normalization', 'ReLU', 'Softmax', 'Embedding',
  'Tokenization', 'KV Cache', 'Flash Attention', 'LoRA',
  'Quantization', 'Pruning', 'Distillation', 'GGUF', 'TurboQuant'
];
```

**Animation Algorithm:**
```
1. Initialize grid: 70% blue (used), 15% red (fragmented), 10% white (free), 5% yellow (system)
2. Scatter red blocks randomly among blue blocks
3. Animation loop (every 100-200ms):
   a. Find next red (fragmented) block
   b. Find nearest white (free) block near the blue cluster
   c. Flash the red block green (reading)
   d. Flash the destination green (writing)
   e. Swap: red block becomes white, destination becomes blue
   f. Update progress bar
4. When no red blocks remain: "Defragmentation Complete"
```

**Window Layout:**
```
+----------------------------------------------+
| Disk Defragmenter - Drive C: [x]             |
+----------------------------------------------+
| Drive C:  [Analyze] [Defragment] [Stop]      |
+----------------------------------------------+
| +------------------------------------------+ |
| |  [block grid 20x15]                      | |
| |  colored blocks animate here             | |
| +------------------------------------------+ |
+----------------------------------------------+
| Legend: [blue] Used  [red] Fragmented        |
|         [white] Free [yellow] System          |
+----------------------------------------------+
| Status: Defragmenting... 47% complete         |
| [===================                    ] 47% |
+----------------------------------------------+
```

### CSS Grid Approach

```css
.defrag-grid {
  display: grid;
  grid-template-columns: repeat(20, 24px);
  grid-template-rows: repeat(15, 24px);
  gap: 1px;
  background: #000;
  border: 2px inset #808080;
  padding: 2px;
}
.defrag-block {
  width: 24px;
  height: 24px;
  transition: background-color 0.15s;
  font-size: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.5);
}
.defrag-block.used { background: #0000aa; }
.defrag-block.fragmented { background: #aa0000; }
.defrag-block.free { background: #e0e0e0; }
.defrag-block.system { background: #aaaa00; }
.defrag-block.moving { background: #00aa00; }
```

### Estimated Lines: ~120-150

### Gotchas
- **Performance**: 300 divs with CSS transitions is fine. Canvas would be needed for 1000+ blocks.
- **Animation speed**: Too fast looks boring. Too slow is tedious. Use 100-200ms per step with a speed control dropdown (1x, 5x, 10x).
- **Labels in blocks**: At 24x24px, text is tiny. Use 6px font or show topic name on hover via `title` attribute or tooltip div.
- **Completion**: When defrag finishes, all blocks should be sorted -- blue cluster on left, white space on right, yellow blocks unmoved (they represent "system files" that cannot be relocated).
- **Sound**: Optional satisfying "click" sound per block move -- a very short sine blip (5ms, 800Hz).
- **Re-run**: "Analyze" button re-randomizes the grid. "Defragment" starts the animation. "Stop" pauses.

### References
- https://pausanchez.com/en/articles/win98-defrag-simulation-in-vanilla-javascript/ (vanilla JS, canvas)
- https://github.com/uberscientist/win95-defrag-simulation (Win95 style)
- https://defrag98.com/ (React version, visual reference only)
- https://dev.to/morellodev/recreating-history-building-a-windows-98-disk-defrag-simulator-with-modern-web-tech-34bc (technical writeup)

---

## 5. Login Screen

### Authentic Win95 Login

The Win95 login dialog appears before the desktop loads. It is a simple modal dialog with:
- Windows logo
- "Welcome to Windows" or "Enter Network Password" header
- Username field (pre-filled with computer owner name)
- Password field (masked with asterisks)
- OK and Cancel buttons
- Cancel logs in as a different user or skips network login

**The key authentic detail**: In Win95, pressing Cancel or entering ANY password still let you in. Password was essentially decorative for standalone machines. This is perfect for a recreation -- any password works.

### Implementation

```
Boot sequence modification:
  BIOS POST -> Win95 Splash -> LOGIN DIALOG -> Desktop

Insert between splash completion and transitionToDesktop():
```

**Dialog layout:**
```
+------------------------------------------+
| [x] Welcome to Windows                   |
+------------------------------------------+
|                                           |
|  [Windows Flag]  Type a user name and    |
|                  password to log on to   |
|                  Windows.                |
|                                           |
|  User name: [_________________________]  |
|  Password:  [_________________________]  |
|                                           |
|         [  OK  ]  [ Cancel ]             |
|                                           |
+------------------------------------------+
```

**Win95 Dialog CSS:**
```css
.login-dialog {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #c0c0c0;
  border: 2px outset #dfdfdf;
  padding: 0;
  font-family: 'MS Sans Serif', 'Tahoma', sans-serif;
  font-size: 11px;
  z-index: 10000;
  box-shadow: 2px 2px 0 rgba(0,0,0,0.3);
  min-width: 380px;
}
.login-titlebar {
  background: linear-gradient(90deg, #000080, #1084d0);
  color: white;
  padding: 3px 4px;
  font-weight: bold;
  font-size: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.login-body {
  padding: 16px 20px;
}
.login-input {
  border: 2px inset #808080;
  background: white;
  padding: 2px 4px;
  font-size: 12px;
  width: 200px;
  font-family: inherit;
}
.login-btn {
  background: #c0c0c0;
  border: 2px outset #dfdfdf;
  padding: 4px 20px;
  font-size: 11px;
  cursor: pointer;
  min-width: 75px;
  font-family: inherit;
}
.login-btn:active {
  border-style: inset;
}
```

**JavaScript approach:**
```
function showLoginDialog(onComplete):
  1. Create overlay div with teal (#008080) background
  2. Create dialog div with titlebar + body using DOM methods (createElement, textContent)
  3. Create username input (value: "Josue"), password input
  4. OK and Cancel buttons both call dismiss()
  5. Enter key on password field also calls dismiss()
  6. dismiss() removes overlay, calls showWelcome(onComplete)

function showWelcome(onComplete):
  1. Full-screen teal div with centered "Welcome" text
  2. setTimeout 1500ms, remove div, call onComplete()
```

### Estimated Lines: ~60-80

### Integration Point

In `main.js`, after `showWin95Splash()` completes and before `transitionToDesktop()`:

```js
// In showWin95Splash's completion handler, replace:
//   setTimeout(transitionToDesktop, 400);
// With:
//   setTimeout(() => showLoginDialog(transitionToDesktop), 400);
```

### Gotchas
- **Background color**: The area behind the login dialog is teal (`#008080`) -- the classic Win95 pre-desktop color. The desktop wallpaper has not loaded yet.
- **Windows logo**: Use a Unicode emoji or simple CSS flag. Do not load an external image for this.
- **Pre-filled username**: Use "Josue" or leave blank. If blank, cursor should auto-focus the username field.
- **Password masking**: Standard `input type password` handles asterisk masking natively.
- **Cancel behavior**: In real Win95, Cancel still logged you in (just without network). Both buttons should proceed to desktop.
- **Focus trap**: While login is visible, keyboard should be trapped in the dialog. Not critical for a demo.

### References
- https://github.com/themesberg/windows-95-ui-kit/blob/master/login.html (Bootstrap-based login)
- https://alexbsoft.github.io/win95.css/ (Win95 CSS framework)
- https://codepen.io/supember/pen/BKmgNZ (Win95 recreation CodePen)

---

## 6. Desktop Icon Drag & Snap-to-Grid

### Approach: Pointer Events (Best for Vanilla JS)

Use `pointerdown`, `pointermove`, `pointerup` events. These unify mouse and touch, and work with `setPointerCapture` for reliable dragging.

**Do NOT use HTML5 Drag and Drop API** -- it is designed for data transfer between elements, not for repositioning. The ghost image and drop zones add complexity without benefit. Plain pointer events are simpler and more controllable.

### Grid Configuration

```js
const GRID_SIZE = 80;   // pixels between icon centers
const GRID_OFFSET_X = 16; // padding from left edge
const GRID_OFFSET_Y = 16; // padding from top edge

function snapToGrid(x, y) {
  return {
    x: Math.round((x - GRID_OFFSET_X) / GRID_SIZE) * GRID_SIZE + GRID_OFFSET_X,
    y: Math.round((y - GRID_OFFSET_Y) / GRID_SIZE) * GRID_SIZE + GRID_OFFSET_Y
  };
}
```

### Implementation Pattern

```js
function makeIconDraggable(iconEl) {
  let dragging = false;
  let offsetX, offsetY, startX, startY;
  const DRAG_THRESHOLD = 5; // px before drag starts (prevents accidental drag on click)

  iconEl.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return; // left click only
    startX = e.clientX;
    startY = e.clientY;
    const rect = iconEl.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    iconEl.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  iconEl.addEventListener('pointermove', (e) => {
    if (!iconEl.hasPointerCapture(e.pointerId)) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!dragging && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    dragging = true;
    iconEl.style.position = 'absolute';
    iconEl.style.left = (e.clientX - offsetX) + 'px';
    iconEl.style.top = (e.clientY - offsetY) + 'px';
    iconEl.style.zIndex = '100';
    iconEl.style.opacity = '0.7';
  });

  iconEl.addEventListener('pointerup', (e) => {
    if (dragging) {
      const snapped = snapToGrid(
        parseInt(iconEl.style.left),
        parseInt(iconEl.style.top)
      );
      iconEl.style.left = snapped.x + 'px';
      iconEl.style.top = snapped.y + 'px';
      iconEl.style.opacity = '1';
      iconEl.style.zIndex = '';
      dragging = false;
    }
    iconEl.releasePointerCapture(e.pointerId);
  });
}

// Apply to all desktop icons
document.querySelectorAll('.desktop-icon').forEach(makeIconDraggable);
```

### Collision Detection (Optional)

Prevent two icons from occupying the same grid cell:
```js
function isOccupied(x, y, excludeEl) {
  return [...document.querySelectorAll('.desktop-icon')].some(icon => {
    if (icon === excludeEl) return false;
    return parseInt(icon.style.left) === x && parseInt(icon.style.top) === y;
  });
}
// In pointerup: if snapped position is occupied, try adjacent cells
```

### Estimated Lines: ~50-70

### Gotchas
- **Double-click to open**: The drag must distinguish between click (open app) and drag (reposition). The `DRAG_THRESHOLD` of 5px handles this -- if pointer moves less than 5px, it is a click, not a drag.
- **Desktop bounds**: Clamp icon position to desktop area (exclude taskbar height at bottom).
- **Icon structure**: Each `.desktop-icon` needs `position: absolute` with `left`/`top` in pixels. The current implementation may use CSS grid for icon layout -- this needs to change to absolute positioning.
- **Save positions**: Optional -- store positions in `localStorage` so icons stay where you put them across page reloads.
- **Touch support**: `pointerdown`/`pointermove`/`pointerup` work on touch devices automatically. Add `touch-action: none` CSS to prevent scroll interference.

### References
- https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events (MDN pointer events)
- https://interactjs.io/ (library reference -- do not use, but good API design reference)

---

## 7. Recycle Bin Overflow (Empty vs Full Icon)

### Classic Win95 Behavior

The Recycle Bin has exactly two visual states:
1. **Empty**: Wire mesh basket, clearly empty
2. **Full**: Same basket with crumpled papers overflowing

In Win95, the icon changed automatically when files were sent to the Recycle Bin, and changed back when emptied.

### Icon Approaches

**Option A: Unicode/Emoji approach**
- Empty: wastebasket emoji
- Full: No standard "full bin" emoji exists -- would need a different emoji

**Option B: SVG inline** (recommended -- most authentic)
Draw a simple bin outline with SVG. The "full" version adds polygon shapes above the rim to represent crumpled papers. Each SVG is ~6 lines.

**Option C: Download Win95 icons**
- https://www.rw-designer.com/icon-set/windows-95-recycle-bin (free icon sets)
- https://icons8.com/icon/viHySgpWLiak/windows-95-recycle-bin (PNG/SVG, attribution required)

### State Management

```js
const recycleBin = {
  items: [],

  add(item) {
    this.items.push(item);
    this.updateIcon();
  },

  empty() {
    this.items = [];
    this.updateIcon();
  },

  updateIcon() {
    const iconEl = document.querySelector('[data-app="recyclebin"] .icon-img');
    if (this.items.length > 0) {
      iconEl.textContent = 'full-bin-emoji-or-svg';
    } else {
      iconEl.textContent = 'empty-bin-emoji-or-svg';
    }
  }
};
```

### Integration Points

Things that can "delete" files and fill the bin:
- File Explorer: right-click file -> Delete (or drag to Recycle Bin icon)
- Notepad: close without saving (optional)
- The hidden folder easter egg: user can "delete" joke files

### Estimated Lines: ~30-40

### Gotchas
- **Icon swap timing**: Update icon immediately on add/remove. No animation needed -- the original Win95 did not animate the swap.
- **Right-click context menu**: Recycle Bin context menu should include "Empty Recycle Bin" (grayed out if already empty) and "Open". This integrates with the desktop context menu feature (#5 in WIN95-EXTRAS.md).
- **Sound**: Optional -- play the Win95 "recycle" sound on delete (short crumple noise, synthesize with a brief burst of filtered noise).

---

## 8. Hidden Folder Easter Egg ("definitely_not_homework")

### Concept

When the user opens "My Documents" in File Explorer, they see a normal file listing. Among the files is a folder called `definitely_not_homework`. Opening it reveals joke text files with humorous content related to the research paper topic.

### File Structure

```
My Documents/
  Research Paper.doc       (opens Notepad with paper excerpt)
  GPU_notes.txt            (opens Notepad with study notes)
  sources.bib              (bibliography references)
  definitely_not_homework/
    README.txt           -> "Nothing to see here. Move along."
    secret_plans.txt     -> "Step 1: Build GPU. Step 2: ??? Step 3: Profit."
    todo.txt             -> checked/unchecked list of academic tasks
    brain.exe            -> fake runtime error message
    motivation.bat       -> fake batch script output
    final_final_v3_REAL_FINAL.doc -> meta-joke about version naming
```

### File Contents

**README.txt:**
```
NOTHING TO SEE HERE.
MOVE ALONG.

This folder is completely normal and contains
zero evidence of procrastination.
```

**secret_plans.txt:**
```
TOP SECRET GPU DOMINATION PLAN
==============================

Step 1: Learn CUDA
Step 2: Build neural network
Step 3: ???
Step 4: Profit

Note to self: Step 3 is where all the
research happens. Maybe I should have
paid more attention in that part.
```

**todo.txt:**
```
URGENT TODO LIST
================
[x] Start research paper
[x] Panic about research paper
[x] Actually write research paper
[x] Rewrite research paper
[x] Submit research paper
[ ] Touch grass
[ ] Sleep (optional)
[ ] Remember what the sun looks like
```

**brain.exe:**
```
=== RUNTIME ERROR ===

brain.exe has performed an illegal operation
and will be shut down.

Error Code: 0xC0FFEE
Module: MOTIVATION.DLL
Offset: 0x00:00 AM

Details:
Insufficient caffeine levels detected.
Cannot process academic content without
minimum 3 cups of coffee.

[OK] [Ignore] [Brew More Coffee]
```

**motivation.bat:**
```
@echo off
echo.
echo   MOTIVATION GENERATOR
echo.
echo Loading motivation...
echo [========--------] 47%
echo.
echo ERROR: Motivation not found.
echo Substituting with caffeine...
echo.
echo SUCCESS: Caffeine loaded.
echo You can probably do this.
echo (No guarantees)
echo.
pause
```

**final_final_v3_REAL_FINAL.doc:**
```
  From Pixels to Intelligence
  FINAL VERSION (for real)

Version History:
- draft_1.doc
- draft_2.doc
- final.doc
- final_v2.doc
- final_FINAL.doc
- final_FINAL_v2.doc
- final_final_v3.doc
- final_final_v3_REAL_FINAL.doc  <- you are here
- final_final_v3_REAL_FINAL_2.doc
- ok_this_is_actually_the_last_one.doc

(Narrator: It was not, in fact, the last one.)
```

### Implementation

The file system is already a virtual JS object. Add entries to the existing structure as a data object with type, icon, and content fields for each file. The existing Notepad and File Explorer code handles rendering -- double-clicking a .txt file opens it in Notepad.

### Visual Touches

- **Folder name styling**: The folder name `definitely_not_homework` could be displayed in italics or slightly different color to hint it is special
- **Hidden file dot**: Add a `.secret_diary.txt` that only shows if user types `dir /a` in terminal (hidden files only visible via command line -- authentic DOS behavior)
- **Folder icon**: When hovered, brief wobble animation (CSS `animation: wobble 0.3s`) as if it is nervous about being discovered

### Discovery Paths

1. **File Explorer**: User browses to My Documents, sees the folder, clicks it
2. **Terminal**: `cd "My Documents"` then `dir` shows the folder. `cd definitely_not_homework` then `type README.txt` shows content.
3. **Desktop shortcut**: "My Documents" icon on desktop opens File Explorer to this location

### Estimated Lines: ~40-50 (just the data structure + folder icon behavior)

### Gotchas
- **Content tone**: Keep it lighthearted and self-deprecating about the academic experience. Nothing inappropriate -- this is a school project.
- **File sizes**: Show fake file sizes in Explorer view: "2 KB", "1 KB", etc.
- **Date stamps**: All files dated during the semester -- random dates between Jan-Mar 2026.
- **The .doc files**: When opened, show content in Notepad (Win95 did not distinguish -- Notepad opened everything).

---

## Integration Summary

### New APP_CONFIG / Start Menu entries needed:

| Feature | APP_CONFIG? | Start Menu? | Desktop Icon? |
|---------|------------|-------------|---------------|
| Clippy | No (companion, not app) | No | No |
| Dial-up sound | No (IE sub-feature) | No | No |
| WinAmp/LoseAmp | Yes | Yes | Optional |
| Disk Defragmenter | Yes | Yes (under Accessories) | No |
| Login Screen | No (boot sequence) | No | No |
| Icon Drag | No (desktop behavior) | No | N/A |
| Recycle Bin overflow | No (icon state) | No | Existing |
| Hidden folder | No (file system data) | No | No |

### Dependencies

```
jQuery CDN --> clippyjs CDN --> Clippy feature
                                  (only if using full clippyjs library)

Web Audio API (built-in) --> Dial-up sound synthesis
                         --> WinAmp visualizer
                         --> Defrag click sounds

Existing WindowManager --> WinAmp window
                       --> Defrag window

Existing File Explorer --> Hidden folder content
                       --> Recycle Bin "Open" view

Existing boot sequence --> Login screen insertion point

Existing desktop icons --> Drag & snap-to-grid
                       --> Recycle Bin icon swap
```

### Estimated Total Lines

| Feature | JS Lines | CSS Lines | Total |
|---------|----------|-----------|-------|
| Clippy (full clippyjs) | 60-80 | 10 | 70-90 |
| Clippy (minimal, no jQuery) | 40 | 15 | 55 |
| Dial-up (audio file) | 10 | 0 | 10 |
| Dial-up (Web Audio synth) | 80-100 | 0 | 80-100 |
| WinAmp/LoseAmp | 150-180 | 50-70 | 200-250 |
| Disk Defragmenter | 100-130 | 30-40 | 130-170 |
| Login Screen | 50-60 | 25-30 | 75-90 |
| Icon Drag | 50-70 | 5 | 55-75 |
| Recycle Bin overflow | 25-35 | 5 | 30-40 |
| Hidden folder | 40-50 | 5 | 45-55 |
| **TOTAL** | **~600-780** | **~145-180** | **~750-960** |

### Priority Order (impact vs effort)

1. **Login Screen** (~80 lines) -- completes boot sequence, low effort, high authenticity
2. **Hidden folder** (~50 lines) -- just data, uses existing File Explorer, great humor payoff
3. **Recycle Bin overflow** (~35 lines) -- tiny, polishes existing icon, authentic detail
4. **Icon drag** (~65 lines) -- makes desktop feel real and interactive
5. **Dial-up sound** (~10 lines with audio file) -- iconic moment, trivial to implement
6. **Disk Defragmenter** (~150 lines) -- visually satisfying, ties to research themes
7. **Clippy** (~70 lines) -- iconic and hilarious, but adds jQuery dependency
8. **WinAmp** (~225 lines) -- most complex, but audio + visualizer is very impressive

### External Resources Needed

| Resource | Size | Source | License |
|----------|------|--------|---------|
| jQuery 3.7.1 | ~87KB gz | jsdelivr CDN | MIT |
| clippyjs 0.0.3 | ~15KB + sprites | jsdelivr CDN | MIT |
| Clippy sprite sheet | ~200KB | GitHub CDN (auto) | MIT |
| Dial-up MP3 (if using) | ~20KB | archive.org | Public Domain |

If avoiding jQuery: use the minimal Clippy approach (static image + custom speech bubble) and drop the clippyjs library entirely. Saves ~300KB of downloads.
