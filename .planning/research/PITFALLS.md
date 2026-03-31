# Domain Pitfalls: Fullscreen Overlays & Interactive Demos in Existing Single-Page Apps

**Domain:** Adding fullscreen presentation overlays, enhanced file explorers, and interactive 3D demos to an existing complex SPA with BIOS boot, Win95 desktop, and GSAP animations

**Researched:** 2026-03-30

**Context:** The Win95 website already has a BIOS boot sequence, 7 desktop apps, WindowManager, GSAP animations, CRT overlay at z-index 9000, Three.js background canvas, and browser text rendering. Now adding: fullscreen presentation.exe overlay, file explorer with markdown rendering, Experience.exe with 3D demos, and Notepad/Recycle.

**Confidence:** HIGH (cross-verified against actual session bugs + ecosystem standards)

---

## Critical Pitfalls

### Pitfall 1: Z-Index Stacking Context Bleed

**What goes wrong:** New fullscreen overlays don't appear on top of existing overlays because they're in different stacking contexts. The CRT overlay (z-index 9000) or other fixed elements unexpectedly bleed through the new presentation modal, making it unclickable or invisible.

**Why it happens:**
- Creating a new stacking context breaks the z-index hierarchy. Any CSS property that creates a stacking context (opacity < 1, transform, position + z-index integer on parent) traps children's z-index values below it.
- The existing CRT overlay has `position: fixed; z-index: 9000` (confirmed in session). New presentation.exe created its own stacking context through a parent with `opacity` or `transform`, so its z-index now competes only within that context, not globally.
- Fixed position elements in fullscreen overlays don't automatically float above other fixed elements—DOM order and stacking context matter.

**Consequences:**
- Presentation screen appears behind the CRT overlay (seen this session: "CRT overlay at z-index 9000 bled through on top of Win95 splash screen")
- Modal buttons unclickable because pointer events hit the overlay first
- Different parts of the overlay appear at different depths (background correct, buttons behind overlay)

**Prevention:**
1. **Use the top layer** (modern solution): Promote fullscreen overlays to the top layer with `::backdrop` instead of z-index warfare
   ```css
   .presentation-fullscreen {
     position: fixed;
     inset: 0;
     z-index: var(--z-fullscreen-overlay);
   }
   ```
   Or use the native dialog element with automatic top-layer handling:
   ```html
   <dialog id="presentation">
     <!-- content -->
   </dialog>
   ```

2. **Never use transform/opacity on overlay parents** — these create stacking contexts that trap children
   ```css
   /* BAD: Creates stacking context */
   .overlay-wrapper {
     transform: translateZ(0);
     z-index: 1000;
   }
   .overlay { z-index: 100; } /* Trapped */

   /* GOOD: Global z-index, no parent context */
   .overlay {
     z-index: 10001;
   }
   ```

3. **Document global z-index values** in one place (CSS variables):
   ```css
   :root {
     --z-crt-overlay: 9000;
     --z-fullscreen-presentation: 10000;
     --z-modal-menu: 9500;
   }
   ```

4. **Remove the CRT overlay during fullscreen presentation** — if presentation is truly fullscreen, hide the CRT:
   ```javascript
   // When opening presentation
   crtOverlay.style.display = 'none';
   // When closing
   crtOverlay.style.display = 'block';
   ```

**Detection:**
- Browser console: Inspect the presentation element → Computed Styles → check z-index and stacking context
- Visual test: Presentation opens but buttons don't respond to clicks, or CRT overlay shows on top
- Elements with parent opacity/transform: Search codebase for these properties on overlay parents

---

### Pitfall 2: Memory Leaks from Event Listeners on Destroyed Overlays

**What goes wrong:** Opening and closing presentation.exe, file explorer modals, or demo windows repeatedly causes memory to grow until the browser becomes sluggish. Event listeners attached during overlay creation aren't cleaned up when the overlay is removed from the DOM.

**Why it happens:**
- Vanilla JavaScript often attaches event listeners directly to overlay elements without cleanup
- When the overlay HTML is removed from the DOM, the listener object survives in memory because JavaScript still holds a reference
- In SPAs, modals are commonly created dynamically, mounted once, then destroyed—but listeners created during mount linger
- Using anonymous functions prevents cleanup: the function reference is lost

**Consequences:**
- Memory usage grows after 5-10 overlay opens/closes (noticeable after 20+)
- Browser slows down, pauses during garbage collection
- Large GLTF models in Experience.exe compound the problem—memory bloat + unloaded models = hard crash
- Users notice: "Site gets slow after clicking buttons a lot"

**Prevention:**
1. **Always store handler references** so they can be removed:
   ```javascript
   class Presentation {
     constructor() {
       this.closeHandler = () => this.close();
     }
     open() {
       this.closeBtn.addEventListener('click', this.closeHandler);
     }
     close() {
       this.closeBtn.removeEventListener('click', this.closeHandler);
       this.overlay.remove();
     }
   }
   ```

2. **Use `{ once: true }` for one-time events**:
   ```javascript
   // Auto-removes after first click
   openBtn.addEventListener('click', () => openPresentation(), { once: true });
   ```

3. **Attach listeners to persistent parents** rather than temporary overlay elements:
   ```javascript
   // Use event delegation on a container that persists
   appContainer.addEventListener('click', (e) => {
     if (e.target.closest('[data-close-modal]')) {
       closeModal(e.target.closest('.modal'));
     }
   });
   ```

4. **Use a cleanup function when removing overlays**:
   ```javascript
   function closePresentation() {
     // Remove all listeners before removing from DOM
     presentationOverlay.querySelectorAll('[data-listener]').forEach(el => {
       el.replaceWith(el.cloneNode(true));
     });
     presentationOverlay.remove();
   }
   ```

5. **Monitor memory** with Chrome DevTools Performance tab — if memory grows monotonically, you have a leak

**Detection:**
- Chrome DevTools → Memory → Take heap snapshot before/after opening 10 modals
- Look for "Detached DOM nodes" in the snapshot (overlay elements still in memory but not in DOM)
- Event listeners visible in DevTools Elements → Event Listeners panel persisting after removal

---

### Pitfall 3: GLTF Model Memory Not Freed on Scene Transition

**What goes wrong:** When switching between apps (e.g., closing Experience.exe and opening Presentation.exe), the 3D models from the previous scene remain in GPU/CPU memory. After 3-4 app switches, the browser crashes or becomes unusably slow.

**Why it happens:**
- GLTFLoader loads models into VRAM (texture memory, geometry buffers). These are NOT automatically freed when you remove the mesh from the scene
- Three.js requires explicit cleanup: `geometry.dispose()`, `material.dispose()`, `texture.dispose()`, and for ImageBitmap textures: `texture.source.data.close()`
- When loading complex models (200MB+ across multiple Quaternius models + Sketchfab cyberpunk scene), skipping dispose means cumulative VRAM bloat
- A single 4K texture uses 64MB+ VRAM — the handoff mentions 228 GLTF models, many with multiple 4K textures

**Consequences:**
- After opening Experience.exe 2-3 times, VRAM maxes out
- GPU becomes unresponsive, animations stutter
- Browser OOM crash ("Ran out of memory")
- On lower-end machines (student laptop), noticeable after 1-2 switches

**Prevention:**
1. **Always dispose Three.js resources when removing models**:
   ```javascript
   function removeModel(mesh) {
     // Dispose geometry
     if (mesh.geometry) mesh.geometry.dispose();

     // Dispose material(s)
     if (mesh.material) {
       if (Array.isArray(mesh.material)) {
         mesh.material.forEach(m => m.dispose());
       } else {
         mesh.material.dispose();
       }
     }

     // Dispose textures
     if (mesh.material?.map) mesh.material.map.dispose();
     if (mesh.material?.normalMap) mesh.material.normalMap.dispose();

     // Dispose ImageBitmap sources (required for memory cleanup)
     if (mesh.material?.map?.source?.data?.close) {
       mesh.material.map.source.data.close();
     }

     scene.remove(mesh);
   }
   ```

2. **Create a scene cleanup utility for app switching**:
   ```javascript
   function disposeScene(scene) {
     scene.traverse(obj => {
       if (obj.geometry) obj.geometry.dispose();
       if (obj.material) {
         if (Array.isArray(obj.material)) {
           obj.material.forEach(m => m.dispose());
         } else {
           obj.material.dispose();
         }
       }
     });
     while(scene.children.length > 0) {
       scene.remove(scene.children[0]);
     }
   }
   ```

3. **Clone models instead of reloading**:
   ```javascript
   // Load once, cache it
   const cachedModel = await loader.load('model.gltf');

   // Reuse by cloning (cheaper than reloading)
   const instance = cachedModel.scene.clone();
   scene.add(instance);

   // When done, dispose the instance but keep cache
   instance.traverse(obj => obj.geometry?.dispose());
   scene.remove(instance);
   // Cache survives for next use
   ```

4. **Use Draco compression** for smaller model file sizes (reduces VRAM footprint):
   ```javascript
   const dracoLoader = new DRACOLoader();
   dracoLoader.setDecoderPath('path/to/draco/');
   gltfLoader.setDRACOLoader(dracoLoader);
   ```

5. **Monitor renderer memory**: Log `renderer.info.memory` before/after scene changes
   ```javascript
   console.log(renderer.info.memory); // { geometries, textures, etc. }
   ```

**Detection:**
- Chrome DevTools → Performance → Memory track during app switching (should plateau, not grow)
- Check `renderer.info.memory.geometries` and `.textures` in console before/after closing an app

---

### Pitfall 4: Markdown Rendering XSS Vulnerability in File Explorer

**What goes wrong:** The My Computer file explorer renders markdown files from assignment submissions. If a markdown file contains embedded HTML/JavaScript without sanitization, it executes in the browser (stored XSS). This escalates to the entire website if not properly filtered.

**Why it happens:**
- Markdown libraries like `marked` or `markdown-it` support HTML-in-markdown by default
- Rendering unsanitized HTML leads to execution: any `<img onerror>`, `<script>`, or event handlers execute
- CVE-2026-20841 demonstrated a Notepad markdown RCE via unsanitized markdown
- Student assignment files might contain malicious payloads (intentional or accidental)

**Consequences:**
- Attacker injects obfuscated payloads in markdown files
- Cookie/auth data stolen when file is viewed
- Escalates to RCE if the website uses Electron or nodeIntegration
- Compliance issue (OWASP A03:2021 Injection)

**Prevention:**
1. **Always sanitize HTML output before rendering** with a library like DOMPurify:
   ```javascript
   import DOMPurify from 'dompurify';

   function renderMarkdown(markdownText) {
     const rawHtml = markdownLibrary.render(markdownText);
     const clean = DOMPurify.sanitize(rawHtml);
     document.getElementById('content').textContent = '';
     // Use appendChild to safely insert, not innerHTML
     document.getElementById('content').appendChild(
       DOMPurify.sanitize(rawHtml, { RETURN_DOM: true })
     );
   }
   ```

2. **Restrict HTML tags allowed in markdown**:
   ```javascript
   const config = {
     ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'code', 'pre'],
     ALLOWED_ATTR: ['href', 'title'],
     KEEP_CONTENT: true
   };
   const clean = DOMPurify.sanitize(rawHtml, config);
   ```

3. **Block dangerous URL schemes**:
   ```javascript
   DOMPurify.setConfig({
     ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|webcal):|[^a-z]|[a-z+.\-]*(?:[^a-z+.\-:]|$))/i
   });
   // Blocks file://, javascript:, data: protocols
   ```

4. **Parse markdown securely** without HTML support if possible:
   ```javascript
   const marked = require('marked');
   marked.setOptions({ breaks: true, gfm: true });
   // Configure to not render HTML tags, only markdown syntax
   ```

5. **Server-side validation** (if files come from API):
   - Validate file content on upload
   - Reject files with suspicious patterns

**Detection:**
- Open DevTools Console while viewing a markdown file
- Search file contents for dangerous HTML patterns
- Test with a safe markdown file containing `[test]` — verify it renders correctly

---

## Moderate Pitfalls

### Pitfall 5: Scroll Position Loss During Fullscreen Transitions

**What goes wrong:** User scrolls through file explorer or content, opens a fullscreen presentation overlay, closes it, and returns to the previous view with scroll position at top. Context is lost, frustrating UX.

**Why it happens:**
- When a fullscreen overlay appears with `position: fixed`, the underlying content's scroll position isn't preserved
- SPAs don't automatically restore scroll like traditional page navigation does
- If the overlay removes/re-adds the underlying DOM, scroll position metadata is lost

**Consequences:**
- User loses place in browsing (minor but noticeable UX regression)
- Especially frustrating if file explorer shows 50+ assignments and user is 30 deep

**Prevention:**
1. **Save scroll position before opening fullscreen overlay**:
   ```javascript
   const scrollState = {
     y: window.scrollY,
     x: window.scrollX
   };

   openPresentation();

   closePresentation = () => {
     overlay.remove();
     window.scrollTo(scrollState.x, scrollState.y);
   };
   ```

2. **Use `position: fixed` overlays that don't interact with body scroll**:
   ```css
   .presentation-overlay {
     position: fixed;
     inset: 0;
   }
   ```

3. **Keep the underlying DOM intact** — don't remove it, just hide:
   ```javascript
   // BAD: Removes content
   desktopContainer.innerHTML = '';

   // GOOD: Hide with CSS
   desktopContainer.style.display = 'none';
   overlayContainer.style.display = 'block';
   ```

**Detection:**
- Manual test: Open file explorer, scroll down 10+ items, open presentation, close it — scroll position should be restored

---

### Pitfall 6: Event Capture Collision Between Windows

**What goes wrong:** Keyboard shortcuts (e.g., Escape to close modals, arrow keys for slide navigation) conflict across overlapping windows. Pressing Escape closes the wrong window, or arrow keys scroll the page instead of advancing slides.

**Why it happens:**
- Multiple event listeners on the document/window competing for the same key
- Desktop's WindowManager has its own key handlers, presentation has others
- Event bubbling/capturing order determines which handler fires first
- If handlers don't call `stopPropagation()` or `stopImmediatePropagation()`, events cascade

**Consequences:**
- User presses Escape to close presentation, but it closes the entire app instead
- Arrow keys advance slides but also scroll the page
- Shift+Tab should navigate through modal inputs but focuses on the Win95 desktop behind it

**Prevention:**
1. **Use event capturing with priority ordering**:
   ```javascript
   // Presentation handler fires first (capture phase)
   document.addEventListener('keydown', presentationKeyHandler, true);

   // Desktop handler is fallback (bubbling phase)
   document.addEventListener('keydown', desktopKeyHandler, false);
   ```

2. **Always call stopPropagation in focused context**:
   ```javascript
   function presentationKeyHandler(e) {
     if (!presentationOpen) return;

     if (e.key === 'Escape') {
       closePresentation();
       e.stopImmediatePropagation();
     }
   }
   ```

3. **Maintain a "focus context" stack**:
   ```javascript
   const focusStack = [];

   openPresentation() => focusStack.push('presentation');
   closePresentation() => focusStack.pop();

   document.addEventListener('keydown', (e) => {
     const active = focusStack[focusStack.length - 1];
     const handler = keyHandlers[active];
     if (handler(e)) {
       e.stopImmediatePropagation();
     }
   });
   ```

**Detection:**
- Manual test: Open presentation, press Escape — only presentation should close
- Open file explorer, arrow down — file explorer should respond, not the page

---

### Pitfall 7: CRT Overlay Performance When Animating Fullscreen Content

**What goes wrong:** The CRT overlay (scan lines, monitor bezel effect) renders on every frame. Adding animated fullscreen content causes the overlay to become a bottleneck, dropping frames and breaking the smooth 60fps animation.

**Why it happens:**
- CRT overlay is likely a canvas or div with expensive CSS blend modes
- Every frame with complex animations (GSAP timelines, Three.js rendering), the overlay's blend operation stalls the main thread
- Mix-blend-mode properties like `multiply`, `overlay`, `screen` require compositing every pixel

**Consequences:**
- Frame rate drops from 60fps to 30fps during slide transitions
- Animations appear janky, breaking the Awwwards-level polish goal
- Especially noticeable on lower-end student laptops

**Prevention:**
1. **Hide the CRT overlay during fullscreen animation**:
   ```javascript
   function openPresentation() {
     crtOverlay.style.display = 'none';
     overlay.style.display = 'block';
   }

   function closePresentation() {
     crtOverlay.style.display = 'block';
     overlay.style.display = 'none';
   }
   ```

2. **Reduce CRT overlay opacity during transitions**:
   ```javascript
   gsap.to(crtOverlay, {
     opacity: 0.1,
     duration: 0.3,
     onComplete: () => {
       gsap.to(crtOverlay, { opacity: 1, duration: 0.2 });
     }
   });
   ```

3. **Use GPU-accelerated properties** for the CRT effect:
   ```css
   .crt-overlay {
     background-image: repeating-linear-gradient(
       0deg,
       rgba(0,0,0,0.1) 0px,
       rgba(0,0,0,0.1) 1px,
       transparent 1px,
       transparent 2px
     );
     will-change: transform;
   }
   ```

**Detection:**
- Chrome DevTools → Performance tab → Record while opening presentation
- Check "Rendering" row — if constantly busy, CRT overlay is the culprit
- Chrome Performance stats: Frame rate counter during overlay transitions

---

### Pitfall 8: Markdown Parser Blocking Main Thread During Large File Render

**What goes wrong:** Opening a large markdown file (5000+ lines, like the research paper) causes the browser to hang for 1-2 seconds while the markdown parser runs. The site feels sluggish.

**Why it happens:**
- Markdown parsing (marked, markdown-it) is synchronous and blocks the main thread
- Rendering 5000 lines of HTML is also blocking
- Combined with DOMPurify sanitization, the blocking multiplies

**Consequences:**
- User clicks "open assignment.md", browser freezes for 2 seconds
- Animation frames drop, site feels unresponsive
- On slower machines, user thinks the site crashed

**Prevention:**
1. **Lazy-load markdown for large files**:
   ```javascript
   async function renderMarkdown(filePath) {
     container.innerHTML = '<p>Loading...</p>';

     const rendered = await markdownWorker.parse(
       await fetch(filePath).then(r => r.text())
     );

     // Render in chunks
     container.textContent = '';
     const chunks = rendered.split('<hr>');
     chunks.forEach((chunk, i) => {
       setTimeout(() => {
         const div = document.createElement('div');
         div.innerHTML = DOMPurify.sanitize(chunk);
         container.appendChild(div);
       }, i * 50);
     });
   }
   ```

2. **Use a Web Worker for parsing**:
   ```javascript
   // markdown.worker.js
   self.onmessage = (e) => {
     const html = marked(e.data);
     self.postMessage(html);
   };

   // main.js
   const worker = new Worker('markdown.worker.js');
   worker.onmessage = (e) => {
     const div = document.createElement('div');
     div.innerHTML = DOMPurify.sanitize(e.data);
     container.appendChild(div);
   };
   worker.postMessage(largeMarkdownText);
   ```

3. **Cache parsed markdown**:
   ```javascript
   const markdownCache = new Map();

   function renderMarkdown(filePath, content) {
     if (markdownCache.has(filePath)) {
       return markdownCache.get(filePath);
     }
     const html = marked(content);
     markdownCache.set(filePath, html);
     return html;
   }
   ```

**Detection:**
- Chrome DevTools → Performance → Record while opening large markdown
- If main thread blocked for >100ms, you have the issue

---

## Minor Pitfalls

### Pitfall 9: Audio Not Muted During Presentation Overlays

**What goes wrong:** If the BIOS boot sound or Win95 startup sound continues playing while the presentation is open, it distracts from the immersive experience.

**Prevention:**
```javascript
function openPresentation() {
  document.querySelectorAll('audio').forEach(audio => audio.muted = true);
  overlay.style.display = 'block';
}

function closePresentation() {
  overlay.style.display = 'none';
  document.querySelectorAll('audio').forEach(audio => audio.muted = false);
}
```

---

### Pitfall 10: Fixed Position Modals Scroll with Page in Some Browsers

**What goes wrong:** A `position: fixed` modal scrolls with the page content in edge cases, appearing to move as you scroll.

**Prevention:**
```css
.presentation-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
}

.presentation-container {
  /* Avoid transform, opacity < 1, filter on parents */
}
```

---

## Phase-Specific Warnings

| Phase/Feature | Likely Pitfall | Mitigation |
|---------------|----------------|-----------|
| **Presentation.exe overlay** | Z-index stacking context + CRT overlay bleed | Use top layer API or hide CRT during presentation |
| **File explorer with markdown** | Memory leaks from event listeners + XSS in markdown | Use event delegation, sanitize with DOMPurify |
| **Experience.exe 3D demo** | GLTF model memory not freed + CRT overlay bottleneck | Always dispose geometries/textures, hide CRT during 3D render |
| **Keyboard navigation** | Event capture collision (Escape/arrow key conflicts) | Maintain focus context stack, use stopImmediatePropagation |
| **Large research paper render** | Markdown parser blocking main thread | Use Web Worker or chunk rendering |
| **Scroll restoration** | Losing scroll position between apps | Save/restore window.scrollY |

---

## Detection Strategies

### Chrome DevTools Checklist

- **Memory leaks:** Memory → Heap Snapshots before/after opening overlays 5 times. Look for "Detached DOM nodes"
- **Performance:** Performance → Record during overlay transitions. Main thread should stay <100ms busy
- **Z-index issues:** Elements panel → Inspect overlay → Computed Styles → check z-index
- **Event handlers:** Elements panel → Event Listeners tab → Verify removal when overlay closes
- **Renderer memory:** Console: `renderer.info.memory` before/after Three.js scene changes

### Manual Test Cases

1. Open Presentation.exe 5 times, close 5 times → memory flat, no slowdown
2. Open Experience.exe, rotate 3D model, close, open again → no stutter, 60fps
3. Open file explorer, scroll down, open markdown file → scroll position restored when back
4. Press Escape in presentation → only presentation closes, not entire app
5. View markdown file → no scripts execute, no visual vulnerabilities

---

## Critical Integration Points to Test

1. **Desktop ↔ Fullscreen Overlay transition** — no z-index bleed, scroll preserved, GSAP synced
2. **WindowManager ↔ Presentation.exe** — window manager doesn't intercept presentation keys
3. **Markdown rendering ↔ File explorer** — large files don't freeze UI, events cleaned up
4. **Three.js scene ↔ Experience.exe ↔ other apps** — model memory fully disposed, no VRAM bloat
5. **CRT overlay ↔ all animated content** — frame rate stays 60fps

---

## Sources

- [MDN: Stacking Context](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Positioned_layout/Stacking_context)
- [Chrome Blog: The Top Layer](https://developers.google.com/blog/what-is-the-top-layer)
- [Smashing Magazine: Managing Z-Index](https://www.smashingmagazine.com/2019/04/z-index-component-based-web-application/)
- [DEV Community: Avoid Memory Leaks in JavaScript Event Listeners](https://dev.to/alex_aslam/how-to-avoid-memory-leaks-in-javascript-event-listeners-4hna)
- [GSAP Community: ScrollTrigger Tips & Mistakes](https://gsap.com/resources/st-mistakes/)
- [Three.js Fundamentals: Cleanup](https://threejsfundamentals.org/threejs/lessons/threejs-cleanup.html)
- [Three.js GitHub Issue #27792: GLTFLoader Memory Usage](https://github.com/mrdoob/three.js/issues/27792)
- [HackerOne: Secure Markdown Rendering in React](https://www.hackerone.com/blog/secure-markdown-rendering-react-balancing-flexibility-and-safety)
- [Medium: Pitfall of Potential XSS in React-Markdown Editors](https://medium.com/@brian3814/pitfall-of-potential-xss-in-markdown-editors-1d9e0d2df93a)
- [Codrops: Building Seamless 3D Transitions with GSAP and Three.js](https://tympanus.net/codrops/2026/03/18/building-seamless-3d-transitions-with-webflow-gsap-and-three-js/)
- [Utsubo: 100 Three.js Tips (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- [TanStack Router: Scroll Restoration](https://tanstack.com/router/latest/docs/guide/scroll-restoration)
- [David Tran Blog: Scroll Restoration in SPAs](https://www.davidtran.dev/blogs/scroll-restoration-in-spas)
