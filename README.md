# From Pixels to Intelligence — IDS2891 Cornerstone

**Author:** Josue Aparcedo Gonzalez  
**Course:** IDS2891 — Cornerstone at Florida SouthWestern State College  
**Topic:** AI Hardware Architecture

![Screenshot](screenshot.png)

## Overview

Research project exploring the evolution of AI hardware — from CPUs to GPUs to purpose-built accelerators (TPUs, NPUs) — and its societal implications in accessibility, energy consumption, and workforce displacement.

The final deliverable is an interactive Win95-themed website that presents the research through a fully simulated desktop environment, complete with working apps: File Explorer, Internet Explorer (with retro web snapshots), MS Paint, Terminal, and a custom presentation mode.

## Structure

```
cornerstone/
├── website/          # Interactive presentation website (Three.js + GSAP)
│   ├── index.html    # Main entry point
│   ├── style.css     # Styles
│   └── src/
│       └── presentation/   # Slide scenes, transitions, effects
├── IDS2891/          # Assignment submissions (17 assignments)
└── ops/              # Scripts and tooling
```

## Website

Built with:
- **Three.js** — 3D visuals and scene rendering
- **GSAP** — animations and transitions
- Custom presentation engine with slide scenes, transition effects, and content motion

Open `website/index.html` in a browser — no build step required (ES modules + import maps).

## Assignments

All 17 course assignments are in `IDS2891/`, including research questions, source buckets, short proposal, check-ins, final presentation plan, research documentation, and revision reflection.
