// ═══════════════════════════════════════════════════
// BONZI.JS — Phase 16: Bonzi Buddy Desktop Character
// ═══════════════════════════════════════════════════
// This module will contain:
//   - Animated desktop character (clippy.js or sprite-based)
//   - GSAP walking/bouncing to random desktop positions
//   - Chat bubble: Ollama (localhost:11434) with graceful fallback
//   - Web Speech API TTS
//   - "Download more RAM" → BSOD easter egg
//
// CDN dependency (to add in Phase 16):
//   clippy.js: https://cdn.jsdelivr.net/npm/clippyjs@latest/build/clippy.min.js
//
// Dependencies: gsap (global), main.js wm

window.BonziBuddy = window.BonziBuddy || null;
