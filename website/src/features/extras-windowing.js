// ═══════════════════════════════════════════════════
// EXTRAS.JS — Phase 14: Window Management Enhancements
// ═══════════════════════════════════════════════════
// WM-01: Resizable windows (8-direction edge/corner handles)
// WM-02: Edge snapping (drag near screen edge → half-screen)
// WM-03: Minimize animation (GSAP shrink toward taskbar pill)
// WM-05: Double-click titlebar toggles maximize
// NAV-01: Taskbar pill click focuses/restores window
//
// Dependencies: gsap (global), main.js wm (WindowManager)

window.Extras = window.Extras || {};

(function() {
  'use strict';

  // Wait for DOM + wm to exist (main.js is a module, wm exposed via window.wm)
  let wm;
  function init() {
    wm = window.wm;
    if (!wm || !wm.layer) {
      setTimeout(init, 200);
      return;
    }
    patchWindowManager();
    observeNewWindows();
  }

  // ─── RESIZE HANDLES (WM-01) ────────────────────────
  const HANDLE_DIRS = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

  function addResizeHandles(win) {
    if (win.querySelector('.resize-handle')) return; // already added
    HANDLE_DIRS.forEach(dir => {
      const handle = document.createElement('div');
      handle.className = 'resize-handle resize-' + dir;
      handle.dataset.dir = dir;
      win.appendChild(handle);

      handle.addEventListener('mousedown', (e) => {
        if (win.dataset.maximized === 'true') return;
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;
        const startW = win.offsetWidth;
        const startH = win.offsetHeight;
        const startL = parseInt(win.style.left) || 0;
        const startT = parseInt(win.style.top) || 0;
        const minW = parseInt(getComputedStyle(win).minWidth) || 320;
        const minH = parseInt(getComputedStyle(win).minHeight) || 200;

        function onMove(ev) {
          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;
          let newW = startW;
          let newH = startH;
          let newL = startL;
          let newT = startT;

          if (dir.includes('e')) newW = Math.max(minW, startW + dx);
          if (dir.includes('w')) {
            newW = Math.max(minW, startW - dx);
            newL = startL + (startW - newW);
          }
          if (dir.includes('s')) newH = Math.max(minH, startH + dy);
          if (dir.includes('n')) {
            newH = Math.max(minH, startH - dy);
            newT = startT + (startH - newH);
          }

          win.style.width = newW + 'px';
          win.style.height = newH + 'px';
          win.style.left = newL + 'px';
          win.style.top = newT + 'px';
        }

        function onUp() {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  }

  // ─── EDGE SNAPPING (WM-02) ─────────────────────────
  const SNAP_THRESHOLD = 16;
  let snapPreview = null;

  function getOrCreateSnapPreview() {
    if (!snapPreview) {
      snapPreview = document.createElement('div');
      snapPreview.className = 'snap-preview';
      const wallpaper = document.querySelector('.win95-wallpaper');
      if (wallpaper) wallpaper.appendChild(snapPreview);
    }
    return snapPreview;
  }

  function showSnapPreview(zone) {
    const el = getOrCreateSnapPreview();
    const taskbar = document.getElementById('win95Taskbar');
    const tbH = taskbar ? taskbar.offsetHeight : 28;
    const h = window.innerHeight - tbH;

    el.classList.add('visible');
    if (zone === 'left') {
      el.style.cssText = 'left:0;top:0;width:50%;height:' + h + 'px;';
      el.classList.add('visible');
    } else if (zone === 'right') {
      el.style.cssText = 'left:50%;top:0;width:50%;height:' + h + 'px;';
      el.classList.add('visible');
    } else if (zone === 'top') {
      el.style.cssText = 'left:0;top:0;width:100%;height:' + h + 'px;';
      el.classList.add('visible');
    } else {
      el.classList.remove('visible');
    }
  }

  function hideSnapPreview() {
    if (snapPreview) snapPreview.classList.remove('visible');
  }

  function getSnapZone(x, y) {
    const taskbar = document.getElementById('win95Taskbar');
    const tbH = taskbar ? taskbar.offsetHeight : 28;
    if (y <= SNAP_THRESHOLD) return 'top';
    if (x <= SNAP_THRESHOLD) return 'left';
    if (x >= window.innerWidth - SNAP_THRESHOLD) return 'right';
    return null;
  }

  function applySnap(win, zone) {
    const taskbar = document.getElementById('win95Taskbar');
    const tbH = taskbar ? taskbar.offsetHeight : 28;
    const h = window.innerHeight - tbH;

    // Save pre-snap state so user can unsnap by dragging
    if (!win.dataset.preSnapStyle) {
      win.dataset.preSnapStyle = win.style.cssText;
    }

    if (zone === 'left') {
      win.style.left = '0';
      win.style.top = '0';
      win.style.width = '50vw';
      win.style.height = h + 'px';
    } else if (zone === 'right') {
      win.style.left = '50vw';
      win.style.top = '0';
      win.style.width = '50vw';
      win.style.height = h + 'px';
    } else if (zone === 'top') {
      // Snap to top = maximize
      win.style.left = '0';
      win.style.top = '0';
      win.style.width = '100vw';
      win.style.height = h + 'px';
    }
  }

  // Patch _makeDraggable to add snap detection
  function patchDraggable() {
    const origMakeDraggable = wm._makeDraggable.bind(wm);

    wm._makeDraggable = function(win, handle) {
      handle.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('win95-btn')) return;
        e.preventDefault();
        const startX = e.clientX;
        const startY = e.clientY;
        const startL = parseInt(win.style.left) || 0;
        const startT = parseInt(win.style.top) || 0;

        // If window was snapped, unsnap on drag
        let unsnapped = false;
        const wasMaximized = win.dataset.maximized === 'true';

        const onMove = (ev) => {
          // If maximized, unsnap with proportional cursor placement
          if (wasMaximized && !unsnapped) {
            unsnapped = true;
            const prevW = parseInt(win.dataset.prevStyle?.match(/width:\s*(\d+)px/)?.[1]) || 820;
            win.dataset.maximized = 'false';
            win.style.width = prevW + 'px';
            win.style.height = (parseInt(win.dataset.prevStyle?.match(/height:\s*(\d+)px/)?.[1]) || 560) + 'px';
            win.style.left = (ev.clientX - prevW / 2) + 'px';
            win.style.top = '0px';
            return;
          }

          win.style.left = (startL + ev.clientX - startX) + 'px';
          win.style.top = (startT + ev.clientY - startY) + 'px';

          const zone = getSnapZone(ev.clientX, ev.clientY);
          if (zone) {
            showSnapPreview(zone);
          } else {
            hideSnapPreview();
          }
        };

        const onUp = (ev) => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          hideSnapPreview();

          const zone = getSnapZone(ev.clientX, ev.clientY);
          if (zone) {
            applySnap(win, zone);
          }
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    };
  }

  // ─── MINIMIZE ANIMATION (WM-03) ───────────────────
  function patchMinimize() {
    const origMinimize = wm.minimizeWindow.bind(wm);

    wm.minimizeWindow = function(appId) {
      const entry = this.windows.get(appId);
      if (!entry || entry.minimized) return;

      const win = entry.el;
      const pill = document.getElementById('pill-' + appId);

      if (typeof gsap !== 'undefined' && pill) {
        const pillRect = pill.getBoundingClientRect();
        const winRect = win.getBoundingClientRect();
        const dx = pillRect.left + pillRect.width / 2 - (winRect.left + winRect.width / 2);
        const dy = pillRect.top + pillRect.height / 2 - (winRect.top + winRect.height / 2);

        gsap.to(win, {
          x: dx,
          y: dy,
          scaleX: 0.15,
          scaleY: 0.05,
          opacity: 0.3,
          duration: 0.25,
          ease: 'power2.in',
          onComplete: () => {
            entry.minimized = true;
            win.classList.add('minimized');
            // Reset transform for restore
            gsap.set(win, { x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1 });
            if (pill) pill.classList.remove('active');
          }
        });
      } else {
        origMinimize(appId);
      }
    };
  }

  // ─── RESTORE ANIMATION ────────────────────────────
  function patchRestore() {
    const origRestore = wm.restoreWindow.bind(wm);

    wm.restoreWindow = function(appId) {
      const entry = this.windows.get(appId);
      if (!entry || !entry.minimized) return;

      const win = entry.el;
      const pill = document.getElementById('pill-' + appId);

      entry.minimized = false;

      if (typeof gsap !== 'undefined' && pill) {
        const pillRect = pill.getBoundingClientRect();
        const winRect = win.getBoundingClientRect();
        const dx = pillRect.left + pillRect.width / 2 - (winRect.left + winRect.width / 2);
        const dy = pillRect.top + pillRect.height / 2 - (winRect.top + winRect.height / 2);

        // Start from pill position
        gsap.set(win, { x: dx, y: dy, scaleX: 0.15, scaleY: 0.05, opacity: 0.3 });
        win.classList.remove('minimized');

        gsap.to(win, {
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          opacity: 1,
          duration: 0.25,
          ease: 'power2.out',
          onComplete: () => {
            this.focusWindow(appId);
          }
        });
      } else {
        win.classList.remove('minimized');
        this.focusWindow(appId);
      }
    };
  }

  // ─── DOUBLE-CLICK TITLEBAR (WM-05) ────────────────
  function addTitlebarDblClick(win) {
    const titlebar = win.querySelector('.win95-titlebar');
    if (!titlebar) return;
    titlebar.addEventListener('dblclick', (e) => {
      if (e.target.classList.contains('win95-btn')) return;
      const appId = win.dataset.appId;
      if (appId && wm._toggleMaximize) {
        wm._toggleMaximize(appId);
      }
    });
  }

  // ─── NAV-01: Pill click focuses window ─────────────
  // Already handled in _addPill - pill clicks toggle minimize/restore
  // and restoreWindow calls focusWindow. This is already correct.

  // ─── OBSERVE NEW WINDOWS ──────────────────────────
  function observeNewWindows() {
    // Enhance existing windows
    document.querySelectorAll('.win95-window').forEach(win => {
      addResizeHandles(win);
      addTitlebarDblClick(win);
    });

    // Watch for new windows added to the layer
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (node.nodeType === 1 && node.classList.contains('win95-window')) {
            addResizeHandles(node);
            addTitlebarDblClick(node);
          }
        });
      });
    });

    if (wm.layer) {
      observer.observe(wm.layer, { childList: true });
    }
  }

  // ─── PATCH WINDOW MANAGER ─────────────────────────
  function patchWindowManager() {
    patchDraggable();
    patchMinimize();
    patchRestore();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // main.js is a module and loads deferred, so extras.js (regular script) loads first.
    // Wait a bit for main.js module to initialize wm.
    setTimeout(init, 500);
  }
})();

// ═══════════════════════════════════════════════════
