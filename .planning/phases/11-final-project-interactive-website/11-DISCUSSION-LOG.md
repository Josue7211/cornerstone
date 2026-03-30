# Phase 11: Final Project — Discussion Log (Desktop OS Pivot)

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 11-final-project-interactive-website
**Areas discussed:** OS visual style, Desktop layout, Window behavior, Extra apps/details

---

## OS Visual Style

### Aesthetic Direction

| Option | Description | Selected |
|--------|-------------|----------|
| Retro 90s | Windows 95/98 look — chunky borders, gray toolbars, pixelated icons | ✓ |
| Futuristic terminal | Sci-fi hacker OS — thin neon borders, scanlines, monospace | |
| Hybrid retro-cyber | 90s layout with cyberpunk colors | |

**User's choice:** Retro 90s
**Notes:** Matches last-seen-online reference perfectly

### Color Scheme

| Option | Description | Selected |
|--------|-------------|----------|
| Classic Win95 gray | Silver/gray toolbars, blue title bars, white content | ✓ |
| Dark retro | Dark background with retro-styled chrome | |
| CRT green-on-black | Terminal green on black, monochrome | |

**User's choice:** Classic Win95 gray

### CRT Effect

| Option | Description | Selected |
|--------|-------------|----------|
| Scanlines + slight curve | CSS scanline overlay + border-radius CRT | ✓ |
| Scanlines only | Subtle horizontal pattern | |
| No effects | Clean flat desktop | |

**User's choice:** Scanlines + slight curve

### Font

| Option | Description | Selected |
|--------|-------------|----------|
| MS Sans Serif / Tahoma | Web-safe equivalent for authentic look | |
| Pixel font | Press Start 2P or VT323 | ✓ |
| Keep current fonts | Chakra Petch / Space Mono | |

**User's choice:** Pixel font

---

## Desktop Layout

### Icons

| Option | Description | Selected |
|--------|-------------|----------|
| Core 3 content apps | Research Paper, Presentation, Experience | ✓ |
| My Computer / File Explorer | Fake file browser with research tree | ✓ |
| Terminal / Command Prompt | Interactive commands easter egg | ✓ |
| Recycle Bin + Notepad | Decorative apps | ✓ |

**User's choice:** All of the above (7 total icons)

### Taskbar

| Option | Description | Selected |
|--------|-------------|----------|
| Win95 Start bar | Bottom taskbar, Start button, clock | ✓ |
| Minimal dock | Clock + running apps only | |
| Top menu bar | Mac-style | |

**User's choice:** Win95 Start bar

### Wallpaper

| Option | Description | Selected |
|--------|-------------|----------|
| Teal Win95 default | Classic #008080 | |
| Custom GPU artwork | Pixel art GPU/circuit board | ✓ |
| Transparent to 3D room | See room behind OS | |

**User's choice:** Custom GPU artwork

---

## Window Behavior

### Open Animation

| Option | Description | Selected |
|--------|-------------|----------|
| Expand from icon | Tiny rect expands to full size | |
| Fade + slide up | Modern fade and slide | |
| Instant pop | No animation | |

**User's choice:** "CRAZY ANIMATIONS FOR EACH ONE NUN BASIC" — each window gets its own unique wild animation
**Notes:** Glitch effects, matrix rain, pixel dissolve, 3D flip, elastic bounce — every app different

### Window Chrome

| Option | Description | Selected |
|--------|-------------|----------|
| Full Win95 chrome | Drag, minimize, maximize, close, resize | ✓ |
| Title bar + close only | Drag + close | |
| No drag, close only | Static windows | |

**User's choice:** Full Win95 chrome

### Stacking

| Option | Description | Selected |
|--------|-------------|----------|
| Click to bring forward | Multiple windows, z-index management | ✓ |
| One window at a time | Opening new closes previous | |

**User's choice:** Click to bring forward

---

## Extra Apps/Details

### Terminal

| Option | Description | Selected |
|--------|-------------|----------|
| Interactive commands | Type help, thesis, about, gpu, credits | ✓ |
| Typing animation only | Auto-typing monologue | |
| Matrix rain easter egg | Falling characters resolving to thesis | |

**User's choice:** Interactive commands

### Boot Sequence

| Option | Description | Selected |
|--------|-------------|----------|
| Full BIOS boot | POST screen with hardware detection text | ✓ |
| Quick splash screen | Simple loading bar | |
| No boot | Straight to desktop | |

**User's choice:** Full BIOS boot (3-5 seconds)

### Sound Effects

| Option | Description | Selected |
|--------|-------------|----------|
| Startup chime + clicks | Win95 startup, click sounds, window sounds | ✓ |
| Click sounds only | Subtle interaction sounds | |
| No sounds | Silent | |

**User's choice:** Startup chime + clicks

### File Explorer

| Option | Description | Selected |
|--------|-------------|----------|
| Research file tree | /Research Paper/, /Presentation/, /Sources/ | ✓ |
| Fake C:\ drive | Decorative system files | |
| GitHub-style view | Actual project structure | |

**User's choice:** Research file tree

---

## Claude's Discretion

- Pixel dimensions, GSAP easing curves, terminal responses, CRT parameters
- Icon design, Start menu layout, wallpaper implementation
- Boot sequence exact text

## Deferred Ideas

- 3D character controller (character.glb saved for later)
- Mobile responsive
- Phase 8 Co-Curricular Reflection (needs FSW events)
