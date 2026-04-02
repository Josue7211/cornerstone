# Phase 13: Presentation.exe — Context

**Gathered:** 2026-03-31
**Status:** Ready for verification and phase completion
**Mode:** Reconstructed from implemented code

<domain>
## Phase Boundary

Turn `Presentation.exe` into a fullscreen, cinematic slide experience that bypasses the Win95 window chrome while preserving the capstone presentation content.

</domain>

<decisions>
## Implementation Decisions

### Fullscreen takeover
Presentation launches as a dedicated overlay at `z-index: 9999` instead of a normal `WindowManager` window.

### Content source
The fullscreen presentation clones the existing 9 `.pres-slide` sections from `#panelPres` so the presentation content stays in one source of truth.

### Navigation model
Arrow keys, space, and click advance slides; `Escape` closes back to the desktop.

### Visual direction
Each slide gets its own GSAP entrance treatment and themed background rather than behaving like a static slide deck.

</decisions>

<code_context>
## Existing Code Insights

- `website/main.js` routes `Presentation.exe` to `window.PresentationMode.launch()`
- `website/presentation.js` contains the fullscreen overlay, slide cloning, navigation, and per-slide animations
- `website/style.css` contains the fullscreen presentation styles under `.pres-fullscreen` and `.pfs-*`
- `website/index.html` already contains the 9-slide presentation source markup inside `#panelPres`

</code_context>

<specifics>
## Specific Ideas

- Keep the fullscreen experience independent from `WindowManager`
- Preserve the existing 9-slide research sequence
- Show visible slide progress and counter
- Ensure closing the experience cleanly returns the user to the desktop shell

</specifics>

<deferred>
## Deferred Ideas

- Speaker notes / presenter mode
- Nonlinear slide jump navigation
- More bespoke scene-specific motion polish beyond the current GSAP pass

</deferred>
