# Awwwards-Level Reference Site Analysis

> Scraped and analyzed 2026-03-30 via agent-browser with JS evaluation for framework detection.

---

## 1. Messenger by Abeto (messenger.abeto.co)

**Concept:** Isometric 3D island with buildings that spell "MESSENGER" — click "BEGIN" to explore.

### Tech Stack
- **Framework:** Svelte (runtime imports: `push`, `pop`, `effect`, `state`, `derived`)
- **3D Engine:** Three.js (1.9MB bundle) — WebGLRenderer, PerspectiveCamera, Scene, BufferGeometry, ShaderMaterial, Raycaster, EffectComposer, Mesh, Object3D, Vector3, Quaternion
- **Build:** Vite (modulepreload, `__vite__mapDeps`)
- **No GSAP** — all animation via Three.js render loop + requestAnimationFrame

### Navigation Model
- **Primary:** Click-to-explore (point-and-click adventure style)
- **Touch:** Full touch-action support (`touch-action: none` on body, touchstart/touchmove handlers)
- **No scroll** — `overflow: hidden` on html/body, fixed viewport
- **UI overlay:** Absolutely positioned side-buttons and dialog triggers floating over the WebGL canvas

### Scene Transition Techniques
- Camera fly-to animations within the 3D scene (no page transitions)
- Smooth camera interpolation between points of interest
- Dialog/emoji overlays appear as HTML positioned over the WebGL canvas

### Typography
- **Fonts:** System sans-serif only (no custom fonts loaded)
- **Rendering:** `-webkit-font-smoothing: antialiased`, `text-rendering: optimizeLegibility`
- Text is minimal — the 3D scene IS the content

### Color Palette
- **Background:** White `#fff` (behind WebGL canvas)
- **Scene dominant:** Teal/turquoise sky (`~#6BC5B8`)
- **Accent:** Warm yellow/amber (BEGIN button)
- **Buildings:** Muted stone/concrete tones with colorful accents (red, green, orange roofs)
- **Mood:** Playful, warm, inviting — like a miniature toy world

### What Makes It Premium
- The 3D island is a single continuous environment, not discrete pages
- Isometric perspective gives it a distinctive art-direction feel (not generic 3D)
- Typography integrated INTO the 3D geometry (buildings spell the word)
- Minimal UI — the experience is the 3D world itself
- EffectComposer for post-processing (bloom, color grading)
- Smooth 60fps camera movement

### Patterns Worth Replicating
- **HTML overlay on WebGL canvas** — absolute-positioned UI elements (`#global-ui`) floating over the 3D scene, using pointer-events selectively
- **Touch-action: none** on body for full gesture control
- **Loader pattern** — Svelte component (`#loader` with `.svelte-7zu2uc`) gates content until 3D assets load
- **Full viewport lock** — `width: 100%; height: 100%; overflow: hidden` on html+body
- **Viewport meta:** `shrink-to-fit=no, minimal-ui, viewport-fit=cover` for edge-to-edge mobile

---

## 2. The Other Side of Truth (theothersideoftruth.com)

**Concept:** Ukrainian war storytelling — contrasts "World Truth" vs "Russian Truth" through interactive scrolling with side-by-side comparisons.

### Tech Stack
- **Framework:** Nuxt.js (SSR — `_nuxt/` static assets, `__nuxt` container, `__layout`)
- **Animation:** GSAP + ScrollTrigger (detected in `c4964ee.js`, 360KB)
- **Rendering:** Canvas element (1) + 33 SVGs
- **Analytics:** Google Tag Manager + Facebook Pixel

### Navigation Model
- **Primary:** Vertical scroll (GSAP ScrollTrigger-driven)
- **Secondary:** Click — toggle between "World Truth" and "Russian Truth" views
- **Pagination:** Numbered pagination buttons (01, 02, 03, 04) for sections
- **Burger menu** for mobile navigation
- **Fixed header** with hashtag link, view toggler, and donate CTA

### Scene Transition Techniques
- **Scroll-driven transforms** — elements translate on Y axis tied to scroll position (`matrix(1, 0, 0, 1, 0, -185.922)`)
- **Rotation transforms** on SVG letter elements (various rotation matrices for scattered letter animation)
- **Scale on scroll** — subtle `matrix(1.01, 0, 0, 1.01, 0, 0)` zoom effect
- **Fixed positioning** — main-screen uses `position: fixed` with transform-based scroll simulation
- **CSS transitions:** `0.5s ease-out`, `0.5s ease-in-out`, `0.3s ease-in-out`

### Typography
- **Primary:** HelveticaNeueCyr-Roman (body text)
- **Headlines:** HelveticaNeueCyr-Heavy (bold statements)
- **Style classes:** `a1` (main text), `a1-ultrabold` (headlines), `p3` (small text)
- **Size:** Large, confrontational headlines designed to provoke

### Color Palette
- **Yellow:** `rgb(246, 229, 78)` / `#F6E54E` — Ukrainian flag, primary accent
- **Blue:** `rgb(119, 175, 216)` / `#77AFD8` — Ukrainian flag, secondary
- **Dark:** `rgb(32, 32, 32)` — body text, dark sections
- **Black:** `rgb(0, 0, 0)` — deep contrast sections
- **Mood:** Urgent, confrontational, patriotic — high contrast, no ambiguity

### What Makes It Premium
- Dual-narrative toggle (World Truth vs Russian Truth) is a powerful UX concept
- SVG letter animations — each letter of "TRUTH" is individually animated with rotation matrices
- The scroll experience feels cinematic — fixed sections with parallax transforms
- Strong editorial design — content IS the design, no decorative fluff
- Time-stamp in header adds urgency ("information has been updated: 3 July")
- Canvas element used for particle/atmospheric effects

### Patterns Worth Replicating
- **Fixed-position scroll simulation** — `position: fixed` with `transform: translate()` driven by ScrollTrigger, giving smooth parallax without jank
- **SVG letter animation** — individual path elements with rotation transforms for typographic reveal effects
- **Dual-view toggle** — a single page that shows two perspectives of the same content
- **Numbered section pagination** — dot/number navigation for long scroll experiences
- **Editorial type scale** — two weights of one typeface (Roman + Heavy) for hierarchy

---

## 3. Tracing Art by Getty (getty.edu/tracingart)

**Concept:** Immersive art history experience — a mosaic of artwork images that you explore through scroll, revealing provenance stories and art market narratives.

### Tech Stack
- **Framework:** Nuxt.js (SSR — `_nuxt/` directory, `__nuxt` container, `data-v-` scoped styles)
- **Animation:** GSAP ecosystem (full suite):
  - GSAP core
  - ScrollTrigger
  - ScrollSmoother
  - Observer
- **Smooth scroll:** Lenis (`lenis`, `Lenis` detected)
- **Rendering:** 1 canvas + 16 SVGs
- **Images:** WebP format with responsive `@sm` variants

### Navigation Model
- **Primary:** Smooth scroll (Lenis + GSAP ScrollSmoother)
- **Secondary:** Click — about panel with hamburger button
- **Section anchors** — `.section-1-anchor`, `.section-2-anchor`, `.section-3-anchor` (sectionAnchors class)
- **Nav panel** with clip-path reveal animation
- **Mouse-follow** — `.follow-mouse.enabled` element tracks cursor for image preview

### Scene Transition Techniques
- **Clip-path reveals** — nav panel uses `clip-path: inset(0px 0px 440px 561px round 14.4px)` that animates to full viewport
- **Clip-path with border-radius** — `round 1.2rem` for soft corners on reveals
- **Stroke animation** — SVG close button uses `stroke-dashoffset` transition (`0.8s cubic-bezier(0.455, 0.03, 0.515, 0.955)`)
- **Opacity fades** — layered at 0.2s, 0.3s, 0.5s, 0.8s durations
- **Transform sequences** — `transform 0.8s cubic-bezier(0.215, 0.61, 0.355, 1)` (easeOutCubic) and `transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)` (easeInOutQuad)
- **Height transitions** — `height 0.8s ease-in-out` for accordion/reveal sections
- **Blurred backdrop** — `.blurredBg` class for glass-morphism nav panel

### Typography
- **Serif:** Bardford (headlines, editorial) — Roboto, "Helvetica Neue" fallback
- **Sans-serif:** Graphik (body, UI) — Roboto, "Helvetica Neue" fallback
- **Type classes:** `.textH2` (headlines), `.textLabelS` (small labels)
- **Style:** Museum-quality editorial — serif for art, sans for interface

### Color Palette
- **White:** `rgb(255, 255, 255)` — primary background
- **Black:** `rgb(0, 0, 0)` / `rgb(12, 12, 12)` — text, dark sections
- **Gray:** `rgb(128, 128, 128)` / `rgb(99, 99, 99)` — secondary text
- **Subtle gray:** `rgba(186, 186, 186, 0.2)` / `rgba(13, 13, 13, 0.05)` — hover states, borders
- **Mood:** Museum-clean, scholarly, restrained — the art provides the color

### What Makes It Premium
- The opening mosaic of artworks forming a geographic/thematic shape is striking
- Lenis + ScrollSmoother = buttery smooth scrolling (best-in-class)
- Clip-path animations for panel reveals feel native and refined
- Mouse-follow image previews add discovery without cluttering layout
- Serif + sans-serif pairing signals editorial authority
- Restrained palette lets the art imagery be the star
- SVG stroke animations on interactive elements (close buttons)
- The glassmorphism nav panel (`.blurredBg`) feels modern without being trendy

### Patterns Worth Replicating
- **Lenis + GSAP ScrollSmoother** — the gold standard for smooth scroll. Lenis handles the scroll physics, GSAP ties animations to scroll position
- **Clip-path inset with round** — `clip-path: inset(X round 1.2rem)` for panel reveals. Animating from small inset to `inset(0)` creates a smooth expand effect
- **SVG stroke-dashoffset animation** — draw-on effect for icons and close buttons
- **Mouse-follow elements** — `.follow-mouse` container with transform tracking cursor position, showing image previews on hover
- **Easing choices:**
  - `cubic-bezier(0.455, 0.03, 0.515, 0.955)` — easeInOutQuad (balanced, smooth)
  - `cubic-bezier(0.215, 0.61, 0.355, 1)` — easeOutCubic (fast start, gentle land)
  - `cubic-bezier(0.25, 0.46, 0.45, 0.94)` — easeInOutQuad variant (UI interactions)
- **Breakout text pattern** — `.section1__breakout` with subtext and CTA button for hero content
- **Section anchor system** — invisible anchor divs for scroll-to navigation

---

## 4. Lando Norris (landonorris.com)

**Concept:** Motion-heavy personal site for F1 driver — dark green/lime aesthetic with 3D race track elements, photo galleries, and sponsor integration.

### Tech Stack
- **Platform:** Webflow (website-files CDN, jQuery included)
- **Animation Engine:** OFF+BRAND custom library (1.3MB `lando.OFF+BRAND.gold-android-fix-03.js`) containing:
  - Three.js (WebGLRenderer, ShaderMaterial, EffectComposer)
  - GSAP full suite (ScrollTrigger, SplitText, ScrollSmoother, MotionPathPlugin, Observer, Flip, CustomEase)
  - Lenis smooth scroll
  - Custom WebGL shaders
- **Canvas elements:** 21 (!) — heavy use of WebGL for multiple visual effects
- **SVGs:** 86 — icons, logos, decorative elements

### Navigation Model
- **Primary:** Smooth scroll (Lenis + GSAP ScrollSmoother)
- **Secondary:** Click navigation in header
- **Keyboard:** Likely supported via Webflow defaults
- **Responsive scaling** — fluid font system with CSS custom properties:
  ```
  --fluid-font: calc(var(--fluid-container) / var(--design-width) * var(--design-unit) * var(--scale-factor))
  ```
  Breakpoints at 992px, 768px, 480px, 320px

### Scene Transition Techniques
- **Clip-path animations** — multiple techniques:
  - `inset(50%)` to `inset(0)` — center-expand reveal
  - `ellipse(120% 0% at 50% 0%)` — top-down elliptical wipe
  - `ellipse(30% 0% at 50% 0%)` — compressed ellipse (pre-animation state)
  - `inset(0px 100% 0px 0px)` — left-to-right reveal
  - `polygon(0px -2%, 0px 94%, 100% 94%, 100% -2%)` — custom shape mask
- **Scale transforms** — `matrix(1.2, 0, 0, 1.2, 0, 0)` (zoom-in on images)
- **Custom cubic-bezier** — `cubic-bezier(0.65, 0.05, 0, 1)` (aggressive ease-out with slight overshoot)
- **Duration system** — `--duration-default: 0.75s` with `--animation-default` combining duration + easing
- **GSAP Flip** — layout animation (smoothly animating between DOM states)
- **GSAP SplitText** — character/word-level text animation

### Typography
- **Primary:** Mona Sans Variable (variable font — weight range likely 200-900)
- **Fallback:** Arial, sans-serif
- **Fluid sizing** — CSS custom property system that scales font-size based on viewport width:
  - Desktop: 16px base at 1728px design width
  - Tablet: 20px base at 1728px design width
  - Mobile portrait: 48px base at 1728px design width
- **Rendering:** Full antialiasing stack (`-webkit-font-smoothing`, `-moz-osx-font-smoothing`)

### Color Palette
- **Dark green:** `rgb(40, 44, 32)` / `#282C20` — primary background (--color--dark-green)
- **Lime/neon green:** `rgb(210, 255, 0)` / `#D2FF00` — primary accent (--color--lime)
- **Off-white:** `rgb(244, 244, 237)` / `#F4F4ED` — text on dark (--color--white)
- **Black:** `rgb(0, 0, 0)` — deep sections (--color--black)
- **Muted green:** `rgb(52, 58, 38)` / `#343A26` — secondary dark
- **Light sage:** `rgb(221, 225, 210)` / `#DDE1D2` — muted text
- **Warm gray:** `rgb(180, 184, 165)` / `#B4B8A5` — tertiary text
- **Mood:** Motorsport energy — dark and brooding with electric lime accents

### What Makes It Premium
- 21 canvas elements = multiple WebGL effects running simultaneously (likely image distortion, particle effects, 3D track visualization)
- The fluid typography system is production-grade responsive design
- GSAP SplitText for character-level text reveals
- GSAP Flip for layout transitions (grid to expanded view, etc.)
- Multiple clip-path shapes (ellipse, inset, polygon) for varied reveal effects
- Mona Sans Variable font allows precise weight control across the site
- The lime-on-dark-green palette is immediately recognizable and branded
- Custom easing `cubic-bezier(0.65, 0.05, 0, 1)` gives a distinctive motion signature
- CSS custom property architecture (`--animation-default`) for consistent motion language

### Patterns Worth Replicating
- **Fluid typography system** — CSS custom properties that calculate font-size from viewport width, design width, and a scale factor. Eliminates media-query font-size declarations
- **Animation custom properties** — `--duration-default: 0.75s`, `--cubic-default: cubic-bezier(0.65, 0.05, 0, 1)`, `--animation-default` combining both. Apply site-wide motion consistency
- **Clip-path variety:**
  - Elliptical wipes: `ellipse(30% 0% at 50% 0%)` -> `ellipse(120% 100% at 50% 50%)`
  - Center expand: `inset(50%)` -> `inset(0)`
  - Directional reveal: `inset(0 100% 0 0)` -> `inset(0)`
  - Custom polygon: `polygon()` for non-rectangular masks
- **GSAP SplitText** — split headlines into chars/words, animate each with stagger delay
- **GSAP Flip** — capture layout state, change DOM, animate from old to new position
- **21 canvas elements** — separate WebGL contexts for different visual effects (image hover distortion, background particles, 3D elements)
- **Dark theme with single accent color** — constraining to one vibrant accent (lime) against dark neutrals creates instant brand recognition

---

## Cross-Site Pattern Summary

### Universal Patterns (used by 3+ sites)

| Pattern | Abeto | Ukraine | Getty | Norris |
|---------|-------|---------|-------|--------|
| GSAP | -- | yes | yes | yes |
| ScrollTrigger | -- | yes | yes | yes |
| Three.js/WebGL | yes | -- | -- | yes |
| Lenis smooth scroll | -- | -- | yes | yes |
| Canvas elements | -- | 1 | 1 | 21 |
| SVG animation | -- | 33 | 16 | 86 |
| Nuxt/Svelte/SPA | Svelte | Nuxt | Nuxt | Webflow |
| Antialiased text | yes | yes | yes | yes |
| overflow: hidden | yes | -- | -- | -- |
| clip-path animation | -- | -- | yes | yes |
| Custom cubic-bezier | -- | -- | yes | yes |

### Recommended Stack for Premium Feel

1. **Scroll:** Lenis + GSAP ScrollSmoother (Getty + Norris pattern)
2. **Animation:** GSAP with ScrollTrigger + SplitText (text reveals) + Flip (layout transitions)
3. **3D (if needed):** Three.js with custom shaders and EffectComposer post-processing
4. **Transitions:** Clip-path animations (inset, ellipse, polygon) with custom cubic-bezier easing
5. **Typography:** Variable font (Mona Sans or similar) + fluid sizing via CSS custom properties
6. **Motion tokens:** Define `--duration`, `--easing`, `--animation` as CSS custom properties for consistency
7. **Scroll behavior:** `scroll-behavior: auto` (let Lenis handle it, not CSS)

### Key Easing Curves to Use

```css
/* Aggressive ease-out (Norris) — great for page transitions */
--ease-dramatic: cubic-bezier(0.65, 0.05, 0, 1);

/* Smooth in-out (Getty) — great for UI panels */
--ease-smooth: cubic-bezier(0.455, 0.03, 0.515, 0.955);

/* Fast-start gentle-land (Getty) — great for scroll reveals */
--ease-out-cubic: cubic-bezier(0.215, 0.61, 0.355, 1);

/* Balanced (Getty) — great for hover states */
--ease-balanced: cubic-bezier(0.25, 0.46, 0.45, 0.94);
```

### Clip-Path Animation Recipes

```css
/* Center expand (Norris) */
.reveal-center {
  clip-path: inset(50%);
  transition: clip-path 0.75s cubic-bezier(0.65, 0.05, 0, 1);
}
.reveal-center.active { clip-path: inset(0); }

/* Elliptical wipe from top (Norris) */
.reveal-ellipse {
  clip-path: ellipse(30% 0% at 50% 0%);
  transition: clip-path 0.75s cubic-bezier(0.65, 0.05, 0, 1);
}
.reveal-ellipse.active { clip-path: ellipse(120% 100% at 50% 50%); }

/* Panel reveal with rounded corners (Getty) */
.panel-reveal {
  clip-path: inset(0 0 100% 100% round 1.2rem);
  transition: clip-path 0.8s cubic-bezier(0.455, 0.03, 0.515, 0.955);
}
.panel-reveal.active { clip-path: inset(0 round 1.2rem); }

/* Left-to-right wipe (Norris) */
.reveal-ltr {
  clip-path: inset(0 100% 0 0);
  transition: clip-path 0.75s cubic-bezier(0.65, 0.05, 0, 1);
}
.reveal-ltr.active { clip-path: inset(0); }
```

### What Separates "Premium" from "Generic"

1. **Custom easing everywhere** — no site uses `ease` or `linear`. Every transition has a hand-tuned cubic-bezier.
2. **Restraint in color** — 2-3 colors max. The content/imagery provides visual richness.
3. **Motion has meaning** — animations reveal content in reading order, not randomly.
4. **Typography is deliberate** — one variable font or two complementary faces, never three+.
5. **Scroll is an instrument** — scroll position drives choreographed animations, not just parallax.
6. **WebGL for atmosphere, not decoration** — 3D enhances the story (Abeto's island, Norris's track), not just background noise.
7. **HTML overlays on WebGL** — UI stays in DOM for accessibility, 3D stays in canvas for performance.
8. **Performance architecture** — Lenis for scroll physics, GSAP for animation timing, separate concerns.
