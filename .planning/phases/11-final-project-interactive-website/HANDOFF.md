# Phase 11 Handoff — Website Build

## Status: NEEDS FULL REBUILD

The current website/ code is a rough prototype. Two iterations were attempted:
1. **v1** — Dark scroll presentation (just a reskinned version of the WIP, rejected by user)
2. **v2** — Three.js cyberpunk lobby with geometric primitives (rejected — looks like a 2005 WebGL demo)

## What the User Actually Wants

An **Awwwards-level immersive web experience** with:

### Structure: 3D Lobby Hub → 3 Sections
1. **Research Paper** — cinematic editorial presentation of the 13,455-word paper's key arguments
2. **Presentation** — the 10-12 min research presentation BUILT INTO the website (NOT an iframe to Google Slides). Must cover: intro, methods/perspective/scope, transdisciplinary connections, implications/conclusions, advocacy for importance
3. **Interactive Experience** — CPU vs GPU demo, pioneers, stats, the thesis

### Reference Sites (User's Inspiration)
- **https://messenger.abeto.co/** — USER'S FAVORITE. Isometric 3D island you explore with interactive elements
- **https://bruno-simon.com/** — 3D car you drive around to explore portfolio
- **https://www.awwwards.com/sites/the-renaissance-edition** — cinematic scroll editorial
- **https://www.shopify.com/editions/winter2026** — product showcase with cinematic scroll
- **https://landonorris.com/** — motion-heavy personal site
- **https://mindmarket.com/** — creative experience
- **https://www.igloo.inc/** — immersive corporate
- **https://theothersideoftruth.com/** — interactive storytelling
- **https://pangrampangram.com/** — typography-driven experience
- **https://www.getty.edu/tracingart/** — immersive art experience

### Key User Feedback
- "maybe a character roaming through a cyberpunk like city, in a small lobby with 3 paths"
- "it should have a unique website experience to get featured in something like website of the year"
- "the point of the website is making the presentation INSIDE one of these pages, animated and immersive"
- "the Google Docs presentation is done — the rubric is for the presentation built into the website"
- "website is PC only — no mobile responsive needed"
- "use actual assets, not geometric primitives"

## 3D Assets Needed

Download these BEFORE building:

### Option A: Sketchfab (need account login)
1. **Low Poly Cyberpunk City** — https://sketchfab.com/3d-models/low-poly-cyberpunk-city-486fa2d8f5df45b18fed179191178793
   - Download as GLTF → unzip into `website/assets/models/cyberpunk-city/`
2. **Cyberpunk Scene by Cisco** — https://sketchfab.com/3d-models/cyberpunk-scene-30112f57ea9f4c1fa0c50482fdef2392
   - Download as GLTF → unzip into `website/assets/models/cyberpunk-scene/`

### Option B: Quaternius (free, no login)
3. **Cyberpunk Game Kit** — https://quaternius.itch.io/cyberpunk-game-kit
   - Download → unzip into `website/assets/models/quaternius/`
4. **Modular Sci-Fi Mega Kit** — https://quaternius.com/packs/modularscifimegakit.html
   - Download → unzip into `website/assets/models/scifi-mega/`

### Option C: Kenney (CC0, direct download)
5. **Space Kit** — https://kenney.nl/assets/space-kit

**User said they can auth for Sketchfab downloads. Use agent-browser with `--auto-connect` or `--cdp 9222` after user launches Chrome with remote debugging.**

## Tech Stack
- **Three.js** (v0.160+) with GLTFLoader for 3D models
- **GSAP** + ScrollTrigger for animated content sections
- **Cannon.js** or **Rapier** for player physics (optional — simple WASD movement may suffice)
- **PC only** — no mobile responsive, no touch controls
- **Vanilla HTML/CSS/JS** — single index.html + style.css + main.js + assets/

## Presentation Rubric (Canvas Assignment #13)
Graded on Capstone Rubric: Design, Prepare, Create, Communicate, Reflect

The presentation section of the website must cover:
1. Introduce and summarize the project
2. Explain methods, perspective, and scope
3. Transdisciplinary connections (CS, economics, ethics, psychology, political science)
4. Implications and conclusions
5. Advocate for importance of the subject
6. Visual component (the website IS the visual component)
7. Equivalent to 10-12 minutes of content

## Content Sources
- `research-paper.md` — 13,455 words, 35 APA sources (the content)
- `assignment-11-checkin-3.md` — methodology, modes of analysis
- `assignment-12-presentation-worksheet.md` — slide-by-slide plan with timing

## What NOT to Do
- Don't build another scroll presentation
- Don't use geometric primitives (BoxGeometry, TorusGeometry) as the 3D scene
- Don't make it mobile responsive
- Don't embed Google Slides in an iframe
- Don't make the content panels just HTML cards

## What TO Do
- Load actual GLTF 3D models for the lobby environment
- Build the presentation as animated, cinematic sections within the website
- Make each section feel like entering a different world
- Use post-processing effects (bloom, chromatic aberration) for visual quality
- Make it feel like you're EXPLORING, not just scrolling
- PC-only, full viewport, no scrollbars in the lobby
