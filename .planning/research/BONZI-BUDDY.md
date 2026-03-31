# Bonzi Buddy AI Assistant — Research Findings

Research date: 2026-03-30
Purpose: Build a Bonzi Buddy-style AI assistant for the Win95 desktop OS website, powered by local Ollama (Qwen model).

---

## 1. Original Bonzi Buddy — How It Looked and Behaved

### History
- Released 1999 by BONZI Software, discontinued 2004
- Initially used **Peedy** (a green parrot) as its character — the original Microsoft Agent demo character
- In May 2000, updated to feature **Bonzi**, its own purple gorilla mascot
- Built on **Microsoft Agent technology** (the same framework behind Clippy/Office Assistant)
- Used **Lernout & Hauspie Microsoft Speech API 4.0** for text-to-speech (voice named "Sydney" / "Adult Male #2")

### Visual Design
- Purple 3D-rendered gorilla, ~128x128px sprite frames
- Sat on the desktop as a floating character with transparent background
- Used layered bitmap images composited per-frame (body base + mouth overlays + eye overlays)
- 256-color palette with transparency color for irregular window shapes

### Animation System (Microsoft Agent)
Microsoft Agent characters used a sophisticated state-based animation system:

**Core States:**
- **Showing** — character appears (flies in, materializes, etc.)
- **Hiding** — character disappears
- **Speaking** — neutral pose with lip-sync mouth overlays (7 mouth positions for phonemes)
- **IdlingLevel1** — subtle idle (blinks, glances, breathing)
- **IdlingLevel2** — medium idle (puts on sunglasses, eats crackers)
- **IdlingLevel3** — deep idle (yawns, falls asleep, listens to music)
- **MovingUp/Down/Left/Right** — flying/walking animations
- **GesturingUp/Down/Left/Right** — pointing in directions
- **Listening/Hearing** — tilting head, cupping ear

**Full Animation List (from Peedy, the original BonziBuddy base):**
Acknowledge, Alert, Announce, Blink, Confused, Congratulate, Decline, DoMagic1/2, DontRecognize, Explain, GestureDown/Left/Right/Up, GetAttention, Greet, Hearing_1/2/3, Hide, Idle1_1-5, Idle2_1-2, Idle3_1-3, LookDown/Left/Right/Up (+ blink variants), MoveDown/Left/Right/Up, Pleased, Process/Processing, Read/Reading, RestPose, Sad, Search/Searching, Show, StartListening, StopListening, Suggest, Surprised, Think/Thinking, Uncertain, Wave, Write/Writing

**Animation Frame Structure:**
- Each animation = timed sequence of frames (~14 frames avg, ~6 seconds max)
- Each frame = layered bitmap images (base + overlays for details like mouth, eyes, hands)
- Frame duration: minimum 100ms (10fps), frames support probabilistic branching
- Return animations provide smooth transitions back to neutral pose
- Speaking uses 7 mouth overlay images synced to phonemes

### Behaviors
- Told jokes and shared fun facts unprompted
- Sang songs with robotic TTS voice
- Read POP3 email aloud
- Managed calendar/schedule reminders
- Searched the web and recommended websites
- Text-to-speech: user could type anything for Bonzi to say

---

## 2. Microsoft Clippy's UI — The Assistant Popup Pattern

### UI Components
1. **Character sprite** — small animated character sitting on desktop/document edge
2. **Speech balloon** — yellow/cream rounded rectangle with text, positioned above/beside character
3. **Suggestion bubble** — "It looks like you're writing a letter. Would you like help?" with action buttons
4. **Close button** — small X on the balloon
5. **Input mode** — text field appeared when user wanted to ask a question

### Balloon Design (from Clippy.js implementations)
```css
/* Classic Clippy speech balloon */
background: #ffffd0;        /* pale yellow */
border: 1px solid #000;
border-radius: 8px;
padding: 10px 14px;
font-family: "Tahoma", sans-serif;
font-size: 12px;
max-width: 200px;
/* Triangle pointer toward character */
&::after {
  /* CSS triangle pointing down-left toward character */
  border: 8px solid transparent;
  border-top-color: #ffffd0;
}
```

### Interaction Pattern
1. Character idles on screen with periodic animations
2. User clicks character -> speech bubble appears with options/input
3. Character plays "GetAttention" or "Suggest" animation
4. User types question or selects suggestion
5. Character plays "Think/Thinking" animation while processing
6. Response appears in speech balloon, character plays "Explain" or "Speak"
7. Character returns to idle after interaction ends

---

## 3. Existing Web Recreations to Reference

### clippy.js (pi0/clippyjs) — BEST REFERENCE
- **URL:** https://github.com/pi0/clippyjs
- Fresh TypeScript rewrite of original Clippy.JS
- Uses extracted Microsoft Agent data files (sprite sheets + animation definitions)
- **10 characters included:** Clippy, Bonzi, F1, Genie, Genius, Links, Merlin, Peedy, Rocky, Rover
- **Key API:**
  ```js
  import { Clippy } from 'clippyjs/agents';
  const agent = await Clippy();
  agent.show();
  agent.speak('Hello!');
  agent.play('Wave');
  agent.moveTo(x, y);
  agent.speakStream(asyncIterable); // LLM streaming support!
  agent.animations(); // list all available animations
  ```
- Has built-in `speakStream()` for async content — perfect for LLM responses
- CDN available, zero build tools needed
- **NOTE:** This already includes a Bonzi character with proper animations

### modern-clippy (vchaindz/modern-clippy)
- **URL:** https://github.com/vchaindz/modern-clippy
- Lightweight, dependency-free TypeScript library
- Uses sprite sheet (`map.png`) with frame position definitions
- 6 animations: Idle, Wave, Thinking, Explain, GetAttention, Congratulate
- API: `initClippy()`, `clippy.speak()`, `clippy.play()`
- Simpler but less feature-rich than clippyjs

### Project-Quenq/bonzi-buddy
- **URL:** https://github.com/Project-Quenq/bonzi-buddy
- Faithful recreation built for "Reborn XP" web OS simulator
- Uses `bonzi.js` + `bonzi-logic.js` + `bonzi.css` + `bonzi.gif`
- Sings, tells jokes, wanders desktop
- Good reference for behavior logic but tied to their OS simulator

### JCLemme/bonzi
- **URL:** https://github.com/JCLemme/bonzi
- Reverse-engineering project with ALL original Bonzi images (as PNGs) and sounds
- Contains Agent file converter (`convertacd`) that outputs JSON animation data
- Great source for original sprite frames and sound effects

### Sprite Resources
- **Spriters Resource:** https://www.spriters-resource.com/pc_computer/bonzibuddy/asset/61851/
- **DeviantArt sprite sheets:** Various fan-made compilations
- **Know Your Meme gallery:** All original sprite poses documented

---

## 4. Animated Character — Implementation Approaches

### Option A: Use clippy.js with Bonzi Agent (RECOMMENDED)
The `clippyjs` package already includes a Bonzi character with all original animations extracted from Microsoft Agent data. This gives us:
- Authentic Bonzi Buddy appearance and animations
- Built-in speech bubbles
- `speakStream()` for Ollama streaming responses
- `moveTo()` for desktop walking
- Zero custom sprite work needed

```html
<script type="module">
  import { Bonzi } from 'https://esm.sh/clippyjs/agents/Bonzi';
  const bonzi = await Bonzi();
  bonzi.show();
  bonzi.speak('Welcome to the desktop!');
</script>
```

### Option B: Custom CSS Sprite Animation
If we want a custom character or can't use clippy.js:

**Sprite Sheet Approach:**
```css
.bonzi {
  width: 128px;
  height: 128px;
  background: url('bonzi-spritesheet.png') no-repeat;
  animation: bonzi-idle 2s steps(8) infinite;
}
@keyframes bonzi-idle {
  from { background-position: 0 0; }
  to { background-position: -1024px 0; } /* 8 frames x 128px */
}
```

**CSS `steps()` timing function** is key — it creates frame-by-frame sprite animation without tweening between positions.

**Walking with GSAP:**
```js
function walkTo(x, y) {
  bonzi.classList.add('walking');
  gsap.to('#bonzi', {
    x, y,
    duration: Math.hypot(dx, dy) / 100, // speed based on distance
    ease: 'none',
    onComplete: () => bonzi.classList.remove('walking')
  });
}
```

### Option C: SVG/CSS Character (No Sprite Sheet)
Build character from SVG/CSS shapes with CSS animation for expressions:
- Body parts as separate SVG groups
- CSS transforms for arm waves, head bobs
- Eye blink with opacity/clip-path transitions
- More flexible but requires more design work

### GSAP Integration for Desktop Walking
```js
// Random walk behavior
function randomWalk() {
  const desktop = document.getElementById('desktop');
  const maxX = desktop.offsetWidth - 128;
  const maxY = desktop.offsetHeight - 128;
  const newX = Math.random() * maxX;
  const newY = Math.random() * maxY;

  gsap.to('#bonzi', {
    x: newX, y: newY,
    duration: 3 + Math.random() * 4,
    ease: 'power1.inOut',
    onStart: () => playAnimation('walk'),
    onComplete: () => {
      playAnimation('idle');
      setTimeout(randomWalk, 5000 + Math.random() * 15000);
    }
  });
}
```

### GSAP Draggable for User Interaction
```js
Draggable.create('#bonzi', {
  type: 'x,y',
  bounds: '#desktop',
  onDragStart: () => playAnimation('surprised'),
  onDragEnd: () => playAnimation('idle')
});
```

---

## 5. Ollama API — Browser JavaScript Integration

### Basic Fetch (Non-Streaming)
```js
const response = await fetch('http://localhost:11434/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'qwen2.5:7b',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userQuestion }
    ],
    stream: false
  })
});
const data = await response.json();
const reply = data.message.content;
```

### Streaming Fetch (Better UX — Bonzi "types" the response)
```js
async function* streamChat(messages) {
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen2.5:7b',
      messages,
      stream: true
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split('\n').filter(Boolean);
    for (const line of lines) {
      const json = JSON.parse(line);
      if (json.message?.content) {
        yield json.message.content;
      }
    }
  }
}
```

### CORS Configuration
Ollama must allow browser requests. Set environment variable:
```bash
OLLAMA_ORIGINS=* ollama serve
# Or for specific origin:
OLLAMA_ORIGINS=http://localhost:5173,http://localhost:3000 ollama serve
```

If Ollama is already running with default settings, it typically allows `localhost` origins. For the Win95 desktop served via Vite dev server, set `OLLAMA_ORIGINS` to include the dev server URL.

### Conversation History Management
```js
const conversationHistory = [
  { role: 'system', content: SYSTEM_PROMPT }
];

async function askBonzi(question) {
  conversationHistory.push({ role: 'user', content: question });
  const response = await chatWithOllama(conversationHistory);
  conversationHistory.push({ role: 'assistant', content: response });
  return response;
}
```

---

## 6. System Prompt — AI Hardware Evolution Expert

Based on the research paper "From Pixels to Intelligence," the system prompt should cover:

```
You are Bonzi, a friendly purple gorilla desktop assistant from the late 1990s. You are an expert on GPU and AI hardware evolution, local AI inference, and the shift from cloud to consumer hardware.

Your knowledge covers:
- GPU history: GeForce 256 (1999), CUDA (2007), AlexNet moment (2012)
- NVIDIA's CUDA moat and Jensen Huang's strategic bet
- Moore's Law stalling at atomic scales (3nm = ~15 atoms wide)
- Specialized AI silicon: GPUs, TPUs, NPUs
- The AlexNet revolution: two GTX 580s beating the entire field
- Transformer architecture and attention mechanisms
- Model compression: quantization (GPTQ, AWQ, GGUF), pruning, distillation
- NVIDIA TurboQuant and KV-cache quantization
- Apple M-series unified memory architecture for local AI
- Open-source AI: LLaMA, Mistral, Qwen, DeepSeek
- Ollama, llama.cpp, and local inference tooling
- Cloud vs local AI: privacy, cost, latency, sovereignty
- AI accelerator wars: NVIDIA vs AMD vs Intel vs custom silicon
- The "control premium" — psychology of owning vs renting AI
- US-China chip export controls and geopolitics of AI hardware
- Future: NPUs in every device, AI at the edge, AGI implications

Personality:
- Nostalgic late-90s/early-2000s internet vibes
- Enthusiastic and slightly cheesy, like the original Bonzi Buddy
- Uses phrases like "Did you know...?", "Here's a fun fact!", "Let me tell you about..."
- Keeps responses concise (2-4 sentences for simple questions, up to a paragraph for complex ones)
- Occasionally references being a desktop assistant from the old days
- Makes computing concepts accessible and entertaining
- Can tell jokes about tech history
- Signs off responses with little flourishes like "Your buddy, Bonzi!" occasionally
```

---

## 7. Recommended Architecture for Implementation

### Component Structure
```
website/
  bonzi/
    bonzi.js          — Main BonziBuddy class (state machine, Ollama integration)
    bonzi.css         — Speech bubble, character positioning, animations
    bonzi-sprites.png — Sprite sheet (or use clippyjs Bonzi agent data)
```

### HTML Structure
```html
<!-- Bonzi Buddy Container — sits on desktop layer -->
<div id="bonzi-buddy" class="bonzi-container">
  <!-- Character sprite -->
  <div class="bonzi-sprite" data-state="idle"></div>

  <!-- Speech bubble (hidden by default) -->
  <div class="bonzi-bubble" style="display:none">
    <button class="bonzi-bubble-close">&times;</button>
    <div class="bonzi-bubble-content"></div>
    <div class="bonzi-input-area" style="display:none">
      <input type="text" class="bonzi-input" placeholder="Ask me about AI hardware...">
      <button class="bonzi-ask-btn">Ask!</button>
    </div>
  </div>
</div>
```

### State Machine
```
IDLE -> (user clicks) -> GREETING -> WAITING_INPUT
WAITING_INPUT -> (user submits question) -> THINKING -> SPEAKING
SPEAKING -> (response complete) -> IDLE
IDLE -> (timeout 30-60s) -> RANDOM_WALK -> IDLE
IDLE -> (timeout 10-20s) -> IDLE_ANIMATION -> IDLE
```

### CSS Speech Bubble (Win95 Style)
```css
.bonzi-bubble {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: #ffffcc;
  border: 2px solid #000;
  border-radius: 8px;
  padding: 10px 12px;
  font-family: 'MS Sans Serif', Tahoma, sans-serif;
  font-size: 12px;
  max-width: 250px;
  min-width: 150px;
  box-shadow: 2px 2px 0 rgba(0,0,0,0.3);
  z-index: 9999;
}
.bonzi-bubble::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 8px solid transparent;
  border-top-color: #ffffcc;
}
.bonzi-bubble::before {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 9px solid transparent;
  border-top-color: #000;
}
```

### Key Integration Points with Existing Site
1. **Desktop layer:** Bonzi sits on top of the Win95 desktop (`#desktop` element)
2. **Z-index:** Must be above desktop icons but below open windows
3. **GSAP:** Already loaded via CDN — use for walking animations
4. **Audio:** Can use Web Audio API already initialized for boot sequence
5. **Theme:** Must match Win95 aesthetic (Tahoma font, beveled edges, system colors)

---

## 8. Approach Decision Matrix

| Approach | Effort | Authenticity | Flexibility | Recommendation |
|----------|--------|-------------|-------------|----------------|
| clippy.js Bonzi agent | Low | Very High | Medium | Best if sprite works at Win95 scale |
| Custom CSS sprites (from extracted PNGs) | Medium | High | High | Best for full control |
| SVG/CSS character from scratch | High | Medium | Very High | Only if unique character needed |
| GIF animation + JS control | Low | Medium | Low | Fallback option |

### Recommended Path
1. **Try clippy.js first** — it has a Bonzi agent with all animations, speech bubbles, and even `speakStream()` for LLM integration. Import via CDN.
2. **If clippy.js doesn't fit** the Win95 aesthetic or has conflicts with the existing Three.js/GSAP setup, **extract Bonzi sprite frames from JCLemme/bonzi repo** and build a custom lightweight animation system using CSS `steps()` + GSAP positioning.
3. **Ollama integration is straightforward** — raw `fetch()` to `localhost:11434/api/chat` with streaming, no library needed.
4. **System prompt** grounds the AI in the research paper's domain knowledge.

---

## Sources
- [BonziBuddy Wikipedia](https://en.wikipedia.org/wiki/BonziBuddy)
- [HowToGeek: Brief History of BonziBuddy](https://www.howtogeek.com/321720/a-brief-history-of-bonzibuddy-the-internets-most-friendly-malware/)
- [clippy.js (pi0/clippyjs)](https://github.com/pi0/clippyjs)
- [modern-clippy](https://github.com/vchaindz/modern-clippy)
- [Project-Quenq/bonzi-buddy](https://github.com/Project-Quenq/bonzi-buddy)
- [JCLemme/bonzi (reverse-engineered assets)](https://github.com/JCLemme/bonzi)
- [Microsoft Agent: Animations](https://learn.microsoft.com/en-us/windows/win32/lwef/animations)
- [Microsoft Agent: Peedy Character Animations](https://learn.microsoft.com/en-us/windows/win32/lwef/microsoft-agent-animations-for-peedy-character)
- [Microsoft Agent: Agent States](https://learn.microsoft.com/en-us/windows/win32/lwef/agent-states)
- [Resurrecting Clippy (Adam Lynch)](https://adamlynch.com/resurrecting-clippy/)
- [Bonzi Buddy Sprites (Spriters Resource)](https://www.spriters-resource.com/pc_computer/bonzibuddy/asset/61851/)
- [Ollama JavaScript Library](https://github.com/ollama/ollama-js)
- [Ollama API Guide](https://studyhub.net.in/techtools/ollama-api-guide/)
- [Sitepoint: Ollama for JS Developers](https://www.sitepoint.com/ollama-javascript-developers/)
- [CSS Sprite Animation with steps()](https://blog.teamtreehouse.com/css-sprite-sheet-animations-steps/)
- [DEV: Sprite Sheet Animation](https://dev.to/martyhimmel/animating-sprite-sheets-with-javascript-ag3)
- [GSAP Draggable Docs](https://gsap.com/docs/v3/Plugins/Draggable/)
