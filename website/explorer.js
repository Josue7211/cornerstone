// ═══════════════════════════════════════════════════
// EXPLORER.JS — Phase 15: Enhanced File Explorer
// ═══════════════════════════════════════════════════
// This module will contain:
//   - Assignment tree (6 folders, 14 assignments)
//   - Click to render markdown via marked + DOMPurify (window.marked, window.DOMPurify)
//   - Hidden "definitely_not_homework" easter egg folder
//
// Note: fetch() for .md files works on GitHub Pages but NOT file:// protocol.
// For local testing, use a simple HTTP server: python3 -m http.server 8080
//
// Dependencies: window.marked, window.DOMPurify (from CDN in index.html), main.js wm

window.FileExplorer = window.FileExplorer || null;
