// ═══════════════════════════════════════════════════
// EXTRAS.JS — Phase 17: Win95 Extra Apps (Batch 1)
// ═══════════════════════════════════════════════════
// This module will contain:
//   - Minesweeper (9x9, first click safe, flag, win/lose, timer)
//   - Paint (canvas drawing + pre-loaded GPU architecture diagram)
//   - Internet Explorer (iframe + dial-up modem sound on open)
//   - MSN Messenger (fake chat with Jensen/Hinton/Fei-Fei)
//   - Shutdown sequence (dialog + sound + "safe to turn off" screen)
//   - Screensaver (30s idle → starfield)
//   - System Properties (research stats in Win95 dialog)
//   - BSOD easter egg (GPU_OVERFLOW)
//   - Desktop right-click context menu
//
// Dependencies: gsap (global), main.js wm

window.Extras = window.Extras || {};
