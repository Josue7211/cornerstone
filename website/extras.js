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
// PHASE 17: Win95 Extra Apps
// ═══════════════════════════════════════════════════
(function() {
  'use strict';

  function getWM() { return window.wm; }
  function getAudioCtx() { return window._win95AudioCtx ? window._win95AudioCtx() : new (window.AudioContext || window.webkitAudioContext)(); }

  // ─── MINESWEEPER ─────────────────────────────────
  function createMinesweeper() {
    var ROWS = 9, COLS = 9, MINES = 10;
    var grid = [], mineSet = new Set(), revealed = new Set(), flagged = new Set();
    var gameOver = false, gameWon = false, firstClick = true;
    var timerInterval = null, seconds = 0;

    var wrap = document.createElement('div');
    wrap.className = 'minesweeper-app';

    var header = document.createElement('div');
    header.className = 'mine-header';

    var mineCount = document.createElement('span');
    mineCount.className = 'mine-counter';
    mineCount.textContent = '010';

    var face = document.createElement('button');
    face.className = 'mine-face';
    face.textContent = '\u{1F642}';
    face.addEventListener('click', function() { resetGame(); });

    var timerEl = document.createElement('span');
    timerEl.className = 'mine-timer';
    timerEl.textContent = '000';

    header.appendChild(mineCount);
    header.appendChild(face);
    header.appendChild(timerEl);
    wrap.appendChild(header);

    var gridEl = document.createElement('div');
    gridEl.className = 'mine-grid';
    wrap.appendChild(gridEl);

    function resetGame() {
      grid = [];
      mineSet.clear();
      revealed.clear();
      flagged.clear();
      gameOver = false;
      gameWon = false;
      firstClick = true;
      seconds = 0;
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = null;
      timerEl.textContent = '000';
      mineCount.textContent = padNum(MINES);
      face.textContent = '\u{1F642}';
      gridEl.textContent = '';

      for (var r = 0; r < ROWS; r++) {
        grid[r] = [];
        for (var c = 0; c < COLS; c++) {
          grid[r][c] = { mine: false, adj: 0 };
          var cell = document.createElement('div');
          cell.className = 'mine-cell unrevealed';
          cell.dataset.r = r;
          cell.dataset.c = c;
          gridEl.appendChild(cell);
        }
      }

      gridEl.oncontextmenu = function(e) { e.preventDefault(); };

      gridEl.onmousedown = function(e) {
        var cell = e.target.closest('.mine-cell');
        if (!cell || gameOver || gameWon) return;
        var r = +cell.dataset.r, c = +cell.dataset.c;

        if (e.button === 2) {
          e.preventDefault();
          if (revealed.has(r + ',' + c)) return;
          var key = r + ',' + c;
          if (flagged.has(key)) {
            flagged.delete(key);
            cell.textContent = '';
            cell.classList.remove('flagged');
          } else {
            flagged.add(key);
            cell.textContent = '\u{1F6A9}';
            cell.classList.add('flagged');
          }
          mineCount.textContent = padNum(MINES - flagged.size);
          return;
        }

        if (e.button === 0) {
          if (flagged.has(r + ',' + c)) return;
          if (firstClick) {
            firstClick = false;
            placeMines(r, c);
            startTimer();
          }
          revealCell(r, c);
        }
      };
    }

    function placeMines(safeR, safeC) {
      var safe = new Set();
      for (var dr = -1; dr <= 1; dr++) {
        for (var dc = -1; dc <= 1; dc++) {
          safe.add((safeR + dr) + ',' + (safeC + dc));
        }
      }
      var placed = 0;
      while (placed < MINES) {
        var r = Math.floor(Math.random() * ROWS);
        var c = Math.floor(Math.random() * COLS);
        var key = r + ',' + c;
        if (safe.has(key) || mineSet.has(key)) continue;
        mineSet.add(key);
        grid[r][c].mine = true;
        placed++;
      }
      for (var r2 = 0; r2 < ROWS; r2++) {
        for (var c2 = 0; c2 < COLS; c2++) {
          if (grid[r2][c2].mine) continue;
          var count = 0;
          for (var dr2 = -1; dr2 <= 1; dr2++) {
            for (var dc2 = -1; dc2 <= 1; dc2++) {
              var nr = r2 + dr2, nc = c2 + dc2;
              if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && grid[nr][nc].mine) count++;
            }
          }
          grid[r2][c2].adj = count;
        }
      }
    }

    function revealCell(r, c) {
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
      var key = r + ',' + c;
      if (revealed.has(key) || flagged.has(key)) return;
      revealed.add(key);

      var cell = gridEl.children[r * COLS + c];
      cell.classList.remove('unrevealed');
      cell.classList.add('revealed');

      if (grid[r][c].mine) {
        cell.textContent = '\u{1F4A5}';
        cell.classList.add('mine-hit');
        gameOver = true;
        face.textContent = '\u{1F635}';
        if (timerInterval) clearInterval(timerInterval);
        revealAllMines();
        return;
      }

      var adj = grid[r][c].adj;
      if (adj > 0) {
        cell.textContent = adj;
        cell.dataset.adj = adj;
      } else {
        for (var dr = -1; dr <= 1; dr++) {
          for (var dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            revealCell(r + dr, c + dc);
          }
        }
      }
      checkWin();
    }

    function revealAllMines() {
      mineSet.forEach(function(key) {
        var parts = key.split(',');
        var r = +parts[0], c = +parts[1];
        var cell = gridEl.children[r * COLS + c];
        if (!cell.classList.contains('mine-hit')) {
          cell.classList.remove('unrevealed');
          cell.classList.add('revealed');
          cell.textContent = '\u{1F4A3}';
        }
      });
    }

    function checkWin() {
      var totalSafe = ROWS * COLS - MINES;
      if (revealed.size === totalSafe) {
        gameWon = true;
        face.textContent = '\u{1F60E}';
        if (timerInterval) clearInterval(timerInterval);
        for (var r = 0; r < ROWS; r++) {
          for (var c = 0; c < COLS; c++) {
            if (grid[r][c].mine) {
              var cell = gridEl.children[r * COLS + c];
              cell.textContent = '\u{1F6A9}';
              cell.classList.add('flagged');
            }
          }
        }
        mineCount.textContent = '000';
      }
    }

    function startTimer() {
      if (timerInterval) return;
      timerInterval = setInterval(function() {
        seconds++;
        timerEl.textContent = padNum(seconds);
        if (seconds >= 999) clearInterval(timerInterval);
      }, 1000);
    }

    function padNum(n) {
      return String(Math.max(0, Math.min(999, n))).padStart(3, '0');
    }

    resetGame();
    return wrap;
  }

  // ─── PAINT ───────────────────────────────────────
  function createPaint() {
    var wrap = document.createElement('div');
    wrap.className = 'paint-app';

    var toolbar = document.createElement('div');
    toolbar.className = 'paint-toolbar';

    var toolDefs = [
      { id: 'pencil', label: '\u270F\uFE0F', title: 'Pencil' },
      { id: 'eraser', label: '\u{1F9F9}', title: 'Eraser' },
      { id: 'fill',   label: '\u{1FAA3}', title: 'Fill' },
    ];
    var currentTool = 'pencil';
    var currentColor = '#000000';

    toolDefs.forEach(function(t) {
      var btn = document.createElement('button');
      btn.className = 'paint-tool' + (t.id === 'pencil' ? ' active' : '');
      btn.textContent = t.label;
      btn.title = t.title;
      btn.dataset.tool = t.id;
      btn.addEventListener('click', function() {
        toolbar.querySelectorAll('.paint-tool').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentTool = t.id;
      });
      toolbar.appendChild(btn);
    });

    var palette = document.createElement('div');
    palette.className = 'paint-palette';
    var colors = [
      '#000000','#808080','#800000','#808000','#008000','#008080','#000080','#800080',
      '#ffffff','#c0c0c0','#ff0000','#ffff00','#00ff00','#00ffff','#0000ff','#ff00ff',
    ];
    colors.forEach(function(c) {
      var swatch = document.createElement('div');
      swatch.className = 'paint-swatch' + (c === '#000000' ? ' active' : '');
      swatch.style.background = c;
      swatch.dataset.color = c;
      swatch.addEventListener('click', function() {
        palette.querySelectorAll('.paint-swatch').forEach(function(s) { s.classList.remove('active'); });
        swatch.classList.add('active');
        currentColor = c;
      });
      palette.appendChild(swatch);
    });
    toolbar.appendChild(palette);
    wrap.appendChild(toolbar);

    var canvasWrap = document.createElement('div');
    canvasWrap.className = 'paint-canvas-wrap';
    var canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 320;
    canvas.className = 'paint-canvas';
    canvasWrap.appendChild(canvas);
    wrap.appendChild(canvasWrap);

    var ctx = canvas.getContext('2d');
    drawGPUDiagram(ctx, canvas.width, canvas.height);

    var drawing = false, lastX = 0, lastY = 0;

    function getPos(e) {
      var rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
      };
    }

    canvas.addEventListener('mousedown', function(e) {
      var pos = getPos(e);
      if (currentTool === 'fill') {
        floodFill(ctx, canvas, Math.round(pos.x), Math.round(pos.y), currentColor);
        return;
      }
      drawing = true;
      lastX = pos.x;
      lastY = pos.y;
    });
    canvas.addEventListener('mousemove', function(e) {
      if (!drawing) return;
      var pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : currentColor;
      ctx.lineWidth = currentTool === 'eraser' ? 12 : 2;
      ctx.lineCap = 'round';
      ctx.stroke();
      lastX = pos.x;
      lastY = pos.y;
    });
    canvas.addEventListener('mouseup', function() { drawing = false; });
    canvas.addEventListener('mouseleave', function() { drawing = false; });

    return wrap;
  }

  function drawGPUDiagram(ctx, w, h) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#000080';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GPU Architecture Diagram', w / 2, 22);

    // SM cluster
    ctx.fillStyle = '#e0e0ff';
    ctx.fillRect(30, 40, 200, 140);
    ctx.strokeStyle = '#000080';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 40, 200, 140);
    ctx.fillStyle = '#000080';
    ctx.font = '10px monospace';
    ctx.fillText('SM Cluster', 130, 56);

    for (var row = 0; row < 4; row++) {
      for (var col = 0; col < 8; col++) {
        ctx.fillStyle = '#00aa00';
        ctx.fillRect(42 + col * 24, 68 + row * 26, 18, 18);
        ctx.strokeStyle = '#006600';
        ctx.strokeRect(42 + col * 24, 68 + row * 26, 18, 18);
      }
    }
    ctx.font = '8px monospace';
    ctx.fillStyle = '#006600';
    ctx.fillText('CUDA Cores', 130, 176);

    // L2 Cache
    ctx.fillStyle = '#ffe0e0';
    ctx.fillRect(250, 40, 80, 140);
    ctx.strokeStyle = '#800000';
    ctx.strokeRect(250, 40, 80, 140);
    ctx.fillStyle = '#800000';
    ctx.font = '11px monospace';
    ctx.fillText('L2', 290, 90);
    ctx.fillText('Cache', 290, 110);
    ctx.font = '9px monospace';
    ctx.fillText('12MB', 290, 130);

    // VRAM
    ctx.fillStyle = '#e0ffe0';
    ctx.fillRect(350, 40, 110, 140);
    ctx.strokeStyle = '#008000';
    ctx.strokeRect(350, 40, 110, 140);
    ctx.fillStyle = '#008000';
    ctx.font = '11px monospace';
    ctx.fillText('VRAM', 405, 90);
    ctx.font = '9px monospace';
    ctx.fillText('16GB GDDR6X', 405, 110);

    // Arrows
    ctx.strokeStyle = '#444';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(230, 110); ctx.lineTo(250, 110); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(330, 110); ctx.lineTo(350, 110); ctx.stroke();
    ctx.setLineDash([]);

    // PCIe
    ctx.fillStyle = '#ffffcc';
    ctx.fillRect(30, 220, w - 60, 35);
    ctx.strokeStyle = '#808000';
    ctx.strokeRect(30, 220, w - 60, 35);
    ctx.fillStyle = '#808000';
    ctx.font = '11px monospace';
    ctx.fillText('PCIe 4.0 x16', w / 2, 242);

    ctx.strokeStyle = '#444';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(w / 2, 180); ctx.lineTo(w / 2, 220); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#666';
    ctx.font = '9px monospace';
    ctx.fillText('To Host CPU (Ryzen 7 7800X3D)', w / 2, 273);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#00aa00';
    ctx.fillRect(30, h - 30, 10, 10);
    ctx.fillStyle = '#000';
    ctx.font = '8px monospace';
    ctx.fillText('= CUDA Core', 44, h - 21);
    ctx.fillStyle = '#808080';
    ctx.fillText('RTX 4070 Ti SUPER - 8448 CUDA Cores', 30, h - 8);
  }

  function floodFill(ctx, canvas, startX, startY, fillColor) {
    var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imgData.data;
    var w = canvas.width, h = canvas.height;
    var tmp = document.createElement('canvas').getContext('2d');
    tmp.fillStyle = fillColor;
    tmp.fillRect(0, 0, 1, 1);
    var fc = tmp.getImageData(0, 0, 1, 1).data;
    var idx = (startY * w + startX) * 4;
    if (idx < 0 || idx >= data.length) return;
    var tr = data[idx], tg = data[idx + 1], tb = data[idx + 2];
    if (tr === fc[0] && tg === fc[1] && tb === fc[2]) return;
    var stack = [[startX, startY]];
    var visited = new Uint8Array(w * h);
    while (stack.length > 0) {
      var pt = stack.pop();
      var x = pt[0], y = pt[1];
      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      var key = y * w + x;
      if (visited[key]) continue;
      var i = key * 4;
      if (Math.abs(data[i] - tr) > 10 || Math.abs(data[i + 1] - tg) > 10 || Math.abs(data[i + 2] - tb) > 10) continue;
      visited[key] = 1;
      data[i] = fc[0]; data[i + 1] = fc[1]; data[i + 2] = fc[2]; data[i + 3] = 255;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    ctx.putImageData(imgData, 0, 0);
  }

  // ─── INTERNET EXPLORER ───────────────────────────
  function createInternetExplorer() {
    var wrap = document.createElement('div');
    wrap.className = 'ie-app';

    var addrBar = document.createElement('div');
    addrBar.className = 'ie-address-bar';
    var addrLabel = document.createElement('span');
    addrLabel.className = 'ie-addr-label';
    addrLabel.textContent = 'Address:';
    var addrInput = document.createElement('input');
    addrInput.type = 'text';
    addrInput.className = 'ie-addr-input';
    addrInput.value = 'http://www.pixels-to-intelligence.edu';
    var goBtn = document.createElement('button');
    goBtn.className = 'ie-go-btn';
    goBtn.textContent = 'Go';
    addrBar.appendChild(addrLabel);
    addrBar.appendChild(addrInput);
    addrBar.appendChild(goBtn);
    wrap.appendChild(addrBar);

    var content = document.createElement('div');
    content.className = 'ie-content';

    var dialup = document.createElement('div');
    dialup.className = 'ie-dialup';
    var dialupText = document.createElement('div');
    dialupText.className = 'ie-dialup-text';
    dialupText.textContent = 'Connecting...';
    var dialupProgress = document.createElement('div');
    dialupProgress.className = 'ie-dialup-progress';
    var dialupBar = document.createElement('div');
    dialupBar.className = 'ie-dialup-bar';
    dialupProgress.appendChild(dialupBar);
    dialup.appendChild(dialupText);
    dialup.appendChild(dialupProgress);
    content.appendChild(dialup);

    var page = document.createElement('iframe');
    page.className = 'ie-page ie-frame';
    page.style.display = 'none';
    page.style.width = '100%';
    page.style.height = '100%';
    page.style.border = 'none';
    page.setAttribute('title', 'Internet Explorer Content');
    page.setAttribute('sandbox', 'allow-same-origin');

    // Build page content with DOM methods
    var pageHeader = document.createElement('div');
    pageHeader.style.cssText = 'background:#000080;color:#fff;padding:8px;font-family:monospace;font-size:10px;text-align:center;';
    pageHeader.textContent = 'From Pixels to Intelligence - Online Portal';
    page.appendChild(pageHeader);

    var pageBody = document.createElement('div');
    pageBody.style.cssText = 'padding:12px;font-family:Arial,sans-serif;font-size:12px;color:#000;background:#fff;';

    var h2 = document.createElement('h2');
    h2.style.cssText = 'color:#000080;font-size:14px;margin:0 0 8px;';
    h2.textContent = 'Welcome to the Research Portal';
    pageBody.appendChild(h2);

    var p1 = document.createElement('p');
    p1.style.margin = '4px 0';
    p1.textContent = 'This site explores how GPU hardware has democratized artificial intelligence.';
    pageBody.appendChild(p1);

    var hr1 = document.createElement('hr');
    hr1.style.border = '1px inset #c0c0c0';
    pageBody.appendChild(hr1);

    var table = document.createElement('table');
    table.style.cssText = 'width:100%;font-size:11px;border-collapse:collapse;';
    var thead = document.createElement('tr');
    thead.style.background = '#e0e0e0';
    var th1 = document.createElement('th');
    th1.style.cssText = 'text-align:left;padding:4px;';
    th1.textContent = 'Topic';
    var th2 = document.createElement('th');
    th2.style.cssText = 'text-align:left;padding:4px;';
    th2.textContent = 'Status';
    thead.appendChild(th1);
    thead.appendChild(th2);
    table.appendChild(thead);

    var topics = [
      ['GPU History (1999-2024)', 'Complete'],
      ['Local AI Revolution', 'Complete'],
      ['Quantization Techniques', 'Complete'],
      ['Cloud Disruption', 'Complete'],
    ];
    topics.forEach(function(t, i) {
      var tr = document.createElement('tr');
      if (i % 2 === 1) tr.style.background = '#f5f5f5';
      var td1 = document.createElement('td');
      td1.style.padding = '4px';
      td1.textContent = t[0];
      var td2 = document.createElement('td');
      td2.style.cssText = 'padding:4px;color:green;';
      td2.textContent = t[1];
      tr.appendChild(td1);
      tr.appendChild(td2);
      table.appendChild(tr);
    });
    pageBody.appendChild(table);

    var hr2 = document.createElement('hr');
    hr2.style.border = '1px inset #c0c0c0';
    pageBody.appendChild(hr2);

    var pFooter = document.createElement('p');
    pFooter.style.cssText = 'font-size:10px;color:#808080;';
    pFooter.textContent = 'Best viewed with Internet Explorer 4.0 at 800x600';
    pageBody.appendChild(pFooter);

    var pVisitor = document.createElement('p');
    pVisitor.style.cssText = 'font-size:10px;color:#808080;';
    pVisitor.textContent = 'Visitor count: ';
    var counterSpan = document.createElement('span');
    counterSpan.style.cssText = 'font-family:monospace;background:#000;color:#0f0;padding:2px 6px;';
    counterSpan.textContent = '001337';
    pVisitor.appendChild(counterSpan);
    pageBody.appendChild(pVisitor);

    var htmlDoc = '<!doctype html><html><head><meta charset="utf-8"><title>From Pixels to Intelligence - Online Portal</title></head><body style="margin:0;background:#fff;"></body></html>';
    page.srcdoc = htmlDoc;
    page.addEventListener('load', function() {
      var doc = page.contentDocument;
      var body = doc && doc.body;
      if (!body || body.dataset.ready === 'true') return;
      body.dataset.ready = 'true';
      body.appendChild(pageHeader);
      body.appendChild(pageBody);
    });
    if (page.contentDocument && page.contentDocument.readyState === 'complete') {
      var docNow = page.contentDocument;
      var bodyNow = docNow && docNow.body;
      if (bodyNow && bodyNow.dataset.ready !== 'true') {
        bodyNow.dataset.ready = 'true';
        bodyNow.appendChild(pageHeader);
        bodyNow.appendChild(pageBody);
      }
    }
    content.appendChild(page);
    wrap.appendChild(content);

    playDialupSound();
    runDialupAnim(dialupBar, dialup, page);

    goBtn.addEventListener('click', function() {
      dialup.style.display = 'flex';
      page.style.display = 'none';
      dialupBar.style.width = '0%';
      playDialupSound();
      runDialupAnim(dialupBar, dialup, page);
    });

    return wrap;
  }

  function runDialupAnim(bar, dialup, page) {
    var progress = 0;
    bar.style.width = '0%';
    var iv = setInterval(function() {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(iv);
        setTimeout(function() {
          dialup.style.display = 'none';
          page.style.display = 'block';
        }, 300);
      }
      bar.style.width = progress + '%';
    }, 400);
  }

  function playDialupSound() {
    try {
      var ctx = getAudioCtx();
      var now = ctx.currentTime;
      var gain = ctx.createGain();
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.linearRampToValueAtTime(0, now + 3);

      [350, 440, 480, 620, 950, 1400, 1800, 2100, 1200, 980].forEach(function(freq, i) {
        var osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + i * 0.15);
        osc.frequency.linearRampToValueAtTime(freq + 200, now + i * 0.15 + 0.1);
        osc.connect(gain);
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.12);
      });

      var noise = ctx.createOscillator();
      noise.type = 'sawtooth';
      noise.frequency.setValueAtTime(100, now + 1.5);
      noise.frequency.linearRampToValueAtTime(8000, now + 2.5);
      noise.frequency.linearRampToValueAtTime(2000, now + 3);
      var noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.setValueAtTime(0.03, now + 1.5);
      noiseGain.gain.linearRampToValueAtTime(0, now + 3.2);
      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now + 1.5);
      noise.stop(now + 3.2);
    } catch(e) {}
  }

  // ─── MSN MESSENGER ───────────────────────────────
  function createMSNMessenger() {
    var wrap = document.createElement('div');
    wrap.className = 'msn-app';

    var buddies = [
      {
        name: 'Jensen Huang',
        statusMsg: 'CUDA all the things',
        conversation: [
          { from: 'Jensen Huang', text: 'Hey! Did you see the latest Blackwell benchmarks?' },
          { from: 'you', text: 'Yes! The GB200 is insane for AI inference.' },
          { from: 'Jensen Huang', text: 'We went from 8 TFLOPS on Maxwell to 20,000 on Blackwell. 2500x in 10 years.' },
          { from: 'you', text: 'And now even consumer GPUs like the 4070 Ti SUPER can run capable local models.' },
          { from: 'Jensen Huang', text: 'The democratization of AI compute is the most important trend in tech.' },
          { from: 'you', text: 'Local inference is making the cloud optional for a lot of use cases.' },
          { from: 'Jensen Huang', text: 'Accelerated computing on every desk. That has been our vision since day one.' },
        ]
      },
      {
        name: 'Geoffrey Hinton',
        statusMsg: 'Backprop forever',
        conversation: [
          { from: 'Geoffrey Hinton', text: 'I have been thinking about quantization techniques again.' },
          { from: 'you', text: 'Like GPTQ and AWQ? They are incredible for local deployment.' },
          { from: 'Geoffrey Hinton', text: 'Compressing 16-bit to 4-bit with barely any quality loss validates the redundancy hypothesis.' },
          { from: 'you', text: 'Dettmers LLM.int8() showed zero degradation at 8-bit.' },
          { from: 'Geoffrey Hinton', text: 'And LoRA! Training a few million parameters instead of billions. Remarkable efficiency.' },
          { from: 'you', text: 'A student with one GPU can fine-tune models that used to need a data center.' },
          { from: 'Geoffrey Hinton', text: 'That is the real revolution. Not the models, but who gets to use them.' },
        ]
      },
      {
        name: 'Fei-Fei Li',
        statusMsg: 'Democratize AI',
        conversation: [
          { from: 'Fei-Fei Li', text: 'Your research on local AI aligns with our work at Stanford HAI.' },
          { from: 'you', text: 'Thanks! ImageNet was such a pivotal moment for GPU computing.' },
          { from: 'Fei-Fei Li', text: 'When Krizhevsky used GPUs for AlexNet in 2012, training went from weeks to hours.' },
          { from: 'you', text: 'And now with llama.cpp, people run LLMs on laptops. The access gap is closing.' },
          { from: 'Fei-Fei Li', text: 'AI should be accessible to everyone, not just big tech companies.' },
          { from: 'you', text: 'A $500 GPU can do what cost $50,000 in cloud compute five years ago.' },
          { from: 'Fei-Fei Li', text: 'When researchers and students experiment freely, real innovation happens.' },
        ]
      },
    ];

    var buddyList = document.createElement('div');
    buddyList.className = 'msn-buddy-list';

    var msnHeader = document.createElement('div');
    msnHeader.className = 'msn-header';
    var msnLogo = document.createElement('span');
    msnLogo.className = 'msn-logo';
    msnLogo.textContent = '\u{1F98B}';
    var msnTitle = document.createElement('span');
    msnTitle.textContent = 'MSN Messenger';
    msnHeader.appendChild(msnLogo);
    msnHeader.appendChild(msnTitle);
    buddyList.appendChild(msnHeader);

    var myStatus = document.createElement('div');
    myStatus.className = 'msn-my-status';
    var myDot = document.createElement('span');
    myDot.className = 'msn-status-dot online';
    var myName = document.createElement('span');
    myName.textContent = 'Josue (Online)';
    myStatus.appendChild(myDot);
    myStatus.appendChild(myName);
    buddyList.appendChild(myStatus);

    var onlineSection = document.createElement('div');
    onlineSection.className = 'msn-section';
    var onlineHeader = document.createElement('div');
    onlineHeader.className = 'msn-section-header';
    onlineHeader.textContent = 'Online (3)';
    onlineSection.appendChild(onlineHeader);

    buddies.forEach(function(buddy) {
      var row = document.createElement('div');
      row.className = 'msn-buddy';
      var dot = document.createElement('span');
      dot.className = 'msn-status-dot online';
      var nameSpan = document.createElement('span');
      nameSpan.className = 'msn-buddy-name';
      nameSpan.textContent = buddy.name;
      var msgSpan = document.createElement('span');
      msgSpan.className = 'msn-buddy-msg';
      msgSpan.textContent = buddy.statusMsg;
      row.appendChild(dot);
      row.appendChild(nameSpan);
      row.appendChild(msgSpan);
      row.addEventListener('click', function() {
        buddyList.querySelectorAll('.msn-buddy').forEach(function(b) { b.classList.remove('selected'); });
        row.classList.add('selected');
        openChat(buddy);
      });
      onlineSection.appendChild(row);
    });
    buddyList.appendChild(onlineSection);

    var offlineSection = document.createElement('div');
    offlineSection.className = 'msn-section';
    var offlineHeader = document.createElement('div');
    offlineHeader.className = 'msn-section-header';
    offlineHeader.textContent = 'Offline (2)';
    offlineSection.appendChild(offlineHeader);

    ['Yann LeCun', 'Andrew Ng'].forEach(function(name) {
      var row = document.createElement('div');
      row.className = 'msn-buddy offline';
      var dot = document.createElement('span');
      dot.className = 'msn-status-dot';
      var nameSpan = document.createElement('span');
      nameSpan.className = 'msn-buddy-name';
      nameSpan.textContent = name;
      row.appendChild(dot);
      row.appendChild(nameSpan);
      offlineSection.appendChild(row);
    });
    buddyList.appendChild(offlineSection);

    wrap.appendChild(buddyList);

    var chatArea = document.createElement('div');
    chatArea.className = 'msn-chat-area';
    chatArea.style.display = 'none';
    wrap.appendChild(chatArea);

    function openChat(buddy) {
      chatArea.style.display = 'flex';
      chatArea.textContent = '';

      var chatHeader = document.createElement('div');
      chatHeader.className = 'msn-chat-header';
      var chatTitle = document.createElement('span');
      chatTitle.textContent = buddy.name + ' - Conversation';
      var backBtn = document.createElement('button');
      backBtn.className = 'msn-chat-back';
      backBtn.textContent = 'Back';
      backBtn.addEventListener('click', function() {
        chatArea.style.display = 'none';
        buddyList.style.display = 'flex';
      });
      chatHeader.appendChild(chatTitle);
      chatHeader.appendChild(backBtn);
      chatArea.appendChild(chatHeader);

      var messages = document.createElement('div');
      messages.className = 'msn-messages';
      chatArea.appendChild(messages);

      buddyList.style.display = 'none';
      playMSNSound();

      var msgIdx = 0;
      function showNext() {
        if (msgIdx >= buddy.conversation.length) return;
        var msg = buddy.conversation[msgIdx];
        var isMe = msg.from === 'you';

        if (!isMe) {
          var typing = document.createElement('div');
          typing.className = 'msn-typing';
          typing.textContent = buddy.name + ' is typing...';
          messages.appendChild(typing);
          messages.scrollTop = messages.scrollHeight;

          setTimeout(function() {
            typing.remove();
            addMsg(msg, false);
            msgIdx++;
            setTimeout(showNext, 800 + Math.random() * 1200);
          }, 1000 + Math.random() * 500);
        } else {
          addMsg(msg, true);
          msgIdx++;
          setTimeout(showNext, 400);
        }
      }

      function addMsg(msg, isMe) {
        var el = document.createElement('div');
        el.className = 'msn-msg' + (isMe ? ' msn-msg-me' : '');
        var fromSpan = document.createElement('span');
        fromSpan.className = 'msn-msg-from';
        fromSpan.textContent = (isMe ? 'Josue' : msg.from) + ' says:';
        var textSpan = document.createElement('span');
        textSpan.className = 'msn-msg-text';
        textSpan.textContent = msg.text;
        el.appendChild(fromSpan);
        el.appendChild(textSpan);
        messages.appendChild(el);
        messages.scrollTop = messages.scrollHeight;
      }

      setTimeout(showNext, 500);
    }

    function playMSNSound() {
      try {
        var ctx = getAudioCtx();
        var now = ctx.currentTime;
        [523, 659, 784].forEach(function(freq, i) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.12);
          gain.gain.setValueAtTime(0.12, now + i * 0.12);
          gain.gain.linearRampToValueAtTime(0, now + i * 0.12 + 0.3);
          osc.start(now + i * 0.12);
          osc.stop(now + i * 0.12 + 0.3);
        });
      } catch(e) {}
    }

    return wrap;
  }

  // ─── SHUTDOWN SEQUENCE ───────────────────────────
  function triggerShutdown() {
    var menu = document.getElementById('startMenu');
    if (menu) menu.classList.remove('visible');

    var overlay = document.createElement('div');
    overlay.className = 'shutdown-overlay';
    var dialog = document.createElement('div');
    dialog.className = 'shutdown-dialog';

    var title = document.createElement('div');
    title.className = 'shutdown-title';
    title.textContent = 'Shut Down Windows';
    dialog.appendChild(title);

    var icon = document.createElement('div');
    icon.className = 'shutdown-icon';
    icon.textContent = '\u{1F5A5}\uFE0F';
    dialog.appendChild(icon);

    var text = document.createElement('div');
    text.className = 'shutdown-text';
    text.textContent = 'What do you want the computer to do?';
    dialog.appendChild(text);

    var options = document.createElement('div');
    options.className = 'shutdown-options';

    var label1 = document.createElement('label');
    label1.className = 'shutdown-option';
    var radio1 = document.createElement('input');
    radio1.type = 'radio';
    radio1.name = 'shutdown';
    radio1.value = 'shutdown';
    radio1.checked = true;
    var span1 = document.createElement('span');
    span1.textContent = 'Shut down';
    label1.appendChild(radio1);
    label1.appendChild(span1);
    options.appendChild(label1);

    var label2 = document.createElement('label');
    label2.className = 'shutdown-option';
    var radio2 = document.createElement('input');
    radio2.type = 'radio';
    radio2.name = 'shutdown';
    radio2.value = 'restart';
    var span2 = document.createElement('span');
    span2.textContent = 'Restart';
    label2.appendChild(radio2);
    label2.appendChild(span2);
    options.appendChild(label2);

    dialog.appendChild(options);

    var buttons = document.createElement('div');
    buttons.className = 'shutdown-buttons';
    var okBtn = document.createElement('button');
    okBtn.className = 'shutdown-btn ok';
    okBtn.textContent = 'OK';
    var cancelBtn = document.createElement('button');
    cancelBtn.className = 'shutdown-btn cancel';
    cancelBtn.textContent = 'Cancel';
    buttons.appendChild(okBtn);
    buttons.appendChild(cancelBtn);
    dialog.appendChild(buttons);

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    cancelBtn.addEventListener('click', function() { overlay.remove(); });

    okBtn.addEventListener('click', function() {
      var action = dialog.querySelector('input[name="shutdown"]:checked').value;
      overlay.remove();
      playShutdownSound();

      var fadeEl = document.createElement('div');
      fadeEl.className = 'shutdown-fade';
      document.body.appendChild(fadeEl);

      setTimeout(function() { fadeEl.classList.add('active'); }, 50);

      setTimeout(function() {
        if (action === 'restart') {
          location.reload();
        } else {
          fadeEl.textContent = '';
          var safeDiv = document.createElement('div');
          safeDiv.className = 'safe-to-turnoff';
          var safeText = document.createElement('div');
          safeText.className = 'safe-text';
          safeText.textContent = "It's now safe to turn off your computer.";
          var safeHint = document.createElement('div');
          safeHint.className = 'safe-hint';
          safeHint.textContent = 'Click anywhere to restart';
          safeDiv.appendChild(safeText);
          safeDiv.appendChild(safeHint);
          fadeEl.appendChild(safeDiv);
          fadeEl.addEventListener('click', function() { location.reload(); });
        }
      }, 2000);
    });
  }

  function playShutdownSound() {
    try {
      var ctx = getAudioCtx();
      var now = ctx.currentTime;
      [523, 392, 330, 262].forEach(function(freq, i) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.4);
        gain.gain.setValueAtTime(0.15, now + i * 0.4);
        gain.gain.linearRampToValueAtTime(0.03, now + i * 0.4 + 0.35);
        osc.start(now + i * 0.4);
        osc.stop(now + i * 0.4 + 0.4);
      });
    } catch(e) {}
  }

  // ─── SCREENSAVER (Starfield) ─────────────────────
  var screensaverActive = false;
  var screensaverCanvas = null;
  var screensaverAnimId = null;
  var idleTimer = null;
  var IDLE_TIMEOUT = 30000;

  function initScreensaver() {
    screensaverCanvas = document.createElement('canvas');
    screensaverCanvas.id = 'screensaverCanvas';
    screensaverCanvas.className = 'screensaver-canvas';
    document.body.appendChild(screensaverCanvas);

    resetIdleTimer();

    ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'].forEach(function(evt) {
      document.addEventListener(evt, function() {
        if (screensaverActive) dismissScreensaver();
        resetIdleTimer();
      }, { passive: true });
    });
  }

  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(function() {
      var desktop = document.getElementById('desktop');
      if (desktop && desktop.classList.contains('visible')) {
        activateScreensaver();
      }
    }, IDLE_TIMEOUT);
  }

  function activateScreensaver() {
    if (screensaverActive) return;
    screensaverActive = true;

    var canvas = screensaverCanvas;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.display = 'block';

    var ctx = canvas.getContext('2d');
    var NUM_STARS = 300;
    var stars = [];
    var cx = canvas.width / 2;
    var cy = canvas.height / 2;

    for (var i = 0; i < NUM_STARS; i++) {
      stars.push({
        x: (Math.random() - 0.5) * canvas.width * 2,
        y: (Math.random() - 0.5) * canvas.height * 2,
        z: Math.random() * canvas.width,
      });
    }

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    function drawFrame() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (var j = 0; j < stars.length; j++) {
        var star = stars[j];
        star.z -= 4;
        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * canvas.width * 2;
          star.y = (Math.random() - 0.5) * canvas.height * 2;
          star.z = canvas.width;
        }
        var sx = (star.x / star.z) * 300 + cx;
        var sy = (star.y / star.z) * 300 + cy;
        var size = Math.max(0.5, (1 - star.z / canvas.width) * 3);
        var brightness = Math.max(0.3, 1 - star.z / canvas.width);

        if (sx >= 0 && sx < canvas.width && sy >= 0 && sy < canvas.height) {
          ctx.fillStyle = 'rgba(255, 255, 255, ' + brightness + ')';
          ctx.beginPath();
          ctx.arc(sx, sy, size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (screensaverActive) {
        screensaverAnimId = requestAnimationFrame(drawFrame);
      }
    }
    drawFrame();
  }

  function dismissScreensaver() {
    screensaverActive = false;
    if (screensaverAnimId) cancelAnimationFrame(screensaverAnimId);
    if (screensaverCanvas) screensaverCanvas.style.display = 'none';
  }

  // ─── SYSTEM PROPERTIES ───────────────────────────
  function createSystemProperties() {
    var wrap = document.createElement('div');
    wrap.className = 'sysprops-app';

    var tabBar = document.createElement('div');
    tabBar.className = 'sysprops-tabs';
    var tabNames = ['General', 'Device Manager', 'Performance'];
    var tabContents = [];

    tabNames.forEach(function(name, i) {
      var tab = document.createElement('button');
      tab.className = 'sysprops-tab' + (i === 0 ? ' active' : '');
      tab.textContent = name;
      tab.addEventListener('click', function() {
        tabBar.querySelectorAll('.sysprops-tab').forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        tabContents.forEach(function(c, j) { c.style.display = j === i ? 'block' : 'none'; });
      });
      tabBar.appendChild(tab);
    });
    wrap.appendChild(tabBar);

    // General tab
    var general = document.createElement('div');
    general.className = 'sysprops-content';

    var logo = document.createElement('div');
    logo.className = 'sysprops-logo';
    var winLogo = document.createElement('div');
    winLogo.className = 'sysprops-win-logo';
    winLogo.textContent = '\u229E';
    var winText = document.createElement('div');
    winText.className = 'sysprops-win-text';
    winText.textContent = 'Microsoft Windows 95';
    var winVer = document.createElement('div');
    winVer.className = 'sysprops-win-ver';
    winVer.textContent = '4.00.950 B';
    logo.appendChild(winLogo);
    logo.appendChild(winText);
    logo.appendChild(winVer);
    general.appendChild(logo);

    var hr1 = document.createElement('hr');
    hr1.className = 'sysprops-hr';
    general.appendChild(hr1);

    var info1 = document.createElement('div');
    info1.className = 'sysprops-info';
    var regLabel = document.createElement('div');
    regLabel.className = 'sysprops-row';
    var regLabelSpan = document.createElement('span');
    regLabelSpan.className = 'sysprops-label';
    regLabelSpan.textContent = 'Registered to:';
    regLabel.appendChild(regLabelSpan);
    info1.appendChild(regLabel);

    ['Josue Aparcedo Gonzalez', 'IDS2891 Cornerstone - FSW College', 'Spring 2026'].forEach(function(t) {
      var row = document.createElement('div');
      row.className = 'sysprops-row indent';
      row.textContent = t;
      info1.appendChild(row);
    });
    general.appendChild(info1);

    var hr2 = document.createElement('hr');
    hr2.className = 'sysprops-hr';
    general.appendChild(hr2);

    var info2 = document.createElement('div');
    info2.className = 'sysprops-info';
    var compLabel = document.createElement('div');
    compLabel.className = 'sysprops-row';
    var compLabelSpan = document.createElement('span');
    compLabelSpan.className = 'sysprops-label';
    compLabelSpan.textContent = 'Computer:';
    compLabel.appendChild(compLabelSpan);
    info2.appendChild(compLabel);

    ['AMD Ryzen 7 7800X3D (8-Core, 96MB L3)', '32.0 GB RAM DDR5-6000', 'NVIDIA RTX 4070 Ti SUPER (16GB GDDR6X)', '8,448 CUDA Cores / 21.0 TFLOPS FP32'].forEach(function(t) {
      var row = document.createElement('div');
      row.className = 'sysprops-row indent';
      row.textContent = t;
      info2.appendChild(row);
    });
    general.appendChild(info2);
    tabContents.push(general);
    wrap.appendChild(general);

    // Device Manager tab
    var devMgr = document.createElement('div');
    devMgr.className = 'sysprops-content';
    devMgr.style.display = 'none';
    var tree = document.createElement('div');
    tree.className = 'sysprops-tree';
    var treeData = [
      ['\u{1F4C1} Computer', ''],
      ['\u{1F4C1} Display adapters', 'indent'],
      ['\u{1F5A5}\uFE0F NVIDIA GeForce RTX 4070 Ti SUPER', 'indent2'],
      ['\u{1F4C1} Processors', 'indent'],
      ['\u2699\uFE0F AMD Ryzen 7 7800X3D [x8 cores]', 'indent2'],
      ['\u{1F4C1} Disk drives', 'indent'],
      ['\u{1F4BF} 2TB NVMe SSD (Gen4)', 'indent2'],
      ['\u{1F4C1} AI Accelerators', 'indent'],
      ['\u{1F9E0} CUDA 12.x Runtime', 'indent2'],
      ['\u{1F9E0} cuDNN 9.x', 'indent2'],
      ['\u{1F9E0} TensorRT 10.x', 'indent2'],
      ['\u{1F4C1} Network adapters', 'indent'],
      ['\u{1F310} Ethernet (2.5GbE)', 'indent2'],
    ];
    treeData.forEach(function(item) {
      var el = document.createElement('div');
      el.className = 'sysprops-tree-item' + (item[1] ? ' ' + item[1] : '');
      el.textContent = item[0];
      tree.appendChild(el);
    });
    devMgr.appendChild(tree);
    tabContents.push(devMgr);
    wrap.appendChild(devMgr);

    // Performance tab
    var perf = document.createElement('div');
    perf.className = 'sysprops-content';
    perf.style.display = 'none';
    var perfDiv = document.createElement('div');
    perfDiv.className = 'sysprops-perf';

    var perfData = [
      ['Memory:', 68, '21.8 GB / 32.0 GB', ''],
      ['VRAM:', 45, '7.2 GB / 16.0 GB', 'gpu'],
      ['CPU:', 23, '23% utilization', 'cpu'],
      ['GPU:', 87, '87% (running Ollama)', 'gpu'],
    ];
    perfData.forEach(function(p) {
      var item = document.createElement('div');
      item.className = 'sysprops-perf-item';
      var label = document.createElement('span');
      label.className = 'sysprops-perf-label';
      label.textContent = p[0];
      var barWrap = document.createElement('div');
      barWrap.className = 'sysprops-perf-bar';
      var fill = document.createElement('div');
      fill.className = 'sysprops-perf-fill' + (p[3] ? ' ' + p[3] : '');
      fill.style.width = p[1] + '%';
      barWrap.appendChild(fill);
      var val = document.createElement('span');
      val.className = 'sysprops-perf-val';
      val.textContent = p[2];
      item.appendChild(label);
      item.appendChild(barWrap);
      item.appendChild(val);
      perfDiv.appendChild(item);
    });
    perf.appendChild(perfDiv);

    var perfNote = document.createElement('div');
    perfNote.className = 'sysprops-perf-note';
    perfNote.textContent = 'Local AI inference active: llama.cpp + Ollama | Model: open-source local model on GPU';
    perf.appendChild(perfNote);
    tabContents.push(perf);
    wrap.appendChild(perf);

    var btnRow = document.createElement('div');
    btnRow.className = 'sysprops-btn-row';
    var okBtn = document.createElement('button');
    okBtn.className = 'sysprops-ok';
    okBtn.textContent = 'OK';
    var cancelBtn = document.createElement('button');
    cancelBtn.className = 'sysprops-cancel';
    cancelBtn.textContent = 'Cancel';
    okBtn.addEventListener('click', function() { var wm = getWM(); if (wm) wm.closeWindow('sysprops'); });
    cancelBtn.addEventListener('click', function() { var wm = getWM(); if (wm) wm.closeWindow('sysprops'); });
    btnRow.appendChild(okBtn);
    btnRow.appendChild(cancelBtn);
    wrap.appendChild(btnRow);

    return wrap;
  }

  // ─── WINAMP ──────────────────────────────────────
  function createWinamp() {
    var wrap = document.createElement('div');
    wrap.className = 'winamp-app';
    var isPlaying = false, audioCtx = null, analyser = null, oscillators = [], animId = null;
    var playSeconds = 0, timeInterval = null;
    var WINAMP_VOLUME_KEY = 'win95-winamp-volume';

    var titleBarEl = document.createElement('div');
    titleBarEl.className = 'winamp-title-bar';
    titleBarEl.textContent = 'Winamp 2.95';
    wrap.appendChild(titleBarEl);

    var visCanvas = document.createElement('canvas');
    visCanvas.width = 275;
    visCanvas.height = 60;
    visCanvas.className = 'winamp-vis';
    wrap.appendChild(visCanvas);

    var trackInfo = document.createElement('div');
    trackInfo.className = 'winamp-track';
    var scrollText = document.createElement('div');
    scrollText.className = 'winamp-scroll-text';
    var scrollSpan = document.createElement('span');
    scrollSpan.textContent = 'lo-fi_gpu_beats.mp3 - From Pixels to Intelligence OST';
    scrollText.appendChild(scrollSpan);
    trackInfo.appendChild(scrollText);
    wrap.appendChild(trackInfo);

    var timeDisplay = document.createElement('div');
    timeDisplay.className = 'winamp-time';
    timeDisplay.textContent = '00:00';
    wrap.appendChild(timeDisplay);

    var controls = document.createElement('div');
    controls.className = 'winamp-controls';
    var btnData = [
      ['\u23EE', 'prev'], ['\u25B6', 'play'], ['\u23F8', 'pause'], ['\u23F9', 'stop'], ['\u23ED', 'next']
    ];
    var playBtn, pauseBtn, stopBtn;
    btnData.forEach(function(b) {
      var btn = document.createElement('button');
      btn.className = 'winamp-ctrl-btn' + (b[1] === 'play' ? ' play' : '');
      btn.textContent = b[0];
      controls.appendChild(btn);
      if (b[1] === 'play') playBtn = btn;
      if (b[1] === 'pause') pauseBtn = btn;
      if (b[1] === 'stop') stopBtn = btn;
    });
    wrap.appendChild(controls);

    var volRow = document.createElement('div');
    volRow.className = 'winamp-volume';
    var volLabel = document.createElement('span');
    volLabel.textContent = 'VOL';
    var volSlider = document.createElement('input');
    volSlider.type = 'range';
    volSlider.min = '0';
    volSlider.max = '100';
    volSlider.value = '70';
    volSlider.className = 'winamp-vol-slider';
    volRow.appendChild(volLabel);
    volRow.appendChild(volSlider);
    wrap.appendChild(volRow);

    var playlist = document.createElement('div');
    playlist.className = 'winamp-playlist';
    ['1. lo-fi_gpu_beats.mp3', '2. cuda_core_dreams.mp3', '3. tensor_flow_chill.mp3', '4. backprop_lullaby.mp3'].forEach(function(t, i) {
      var item = document.createElement('div');
      item.className = 'winamp-pl-item' + (i === 0 ? ' active' : '');
      item.textContent = t;
      playlist.appendChild(item);
    });
    wrap.appendChild(playlist);

    playBtn.addEventListener('click', startPlayback);
    pauseBtn.addEventListener('click', pausePlayback);
    stopBtn.addEventListener('click', stopPlayback);

    function loadWinampVolume() {
      try {
        var raw = localStorage.getItem(WINAMP_VOLUME_KEY);
        var parsed = parseInt(raw, 10);
        if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 100) return parsed;
      } catch (e) {}
      return 70;
    }

    function saveWinampVolume(value) {
      try {
        localStorage.setItem(WINAMP_VOLUME_KEY, String(value));
      } catch (e) {}
    }

    volSlider.value = String(loadWinampVolume());

    function startPlayback() {
      if (isPlaying) return;
      isPlaying = true;
      playBtn.classList.add('active');
      audioCtx = getAudioCtx();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      var masterGain = audioCtx.createGain();
      masterGain.gain.value = (volSlider.value / 100) * 0.12;
      masterGain.connect(analyser);
      analyser.connect(audioCtx.destination);
      volSlider.oninput = function() {
        masterGain.gain.value = (volSlider.value / 100) * 0.12;
        saveWinampVolume(volSlider.value);
      };

      var melody = [
        [262, 0.5, 0], [330, 0.5, 0.5], [392, 0.5, 1.0], [523, 0.8, 1.5],
        [392, 0.5, 2.3], [330, 0.5, 2.8], [294, 0.8, 3.3], [262, 0.5, 4.1],
        [349, 0.5, 4.6], [440, 0.5, 5.1], [523, 0.8, 5.6], [440, 0.5, 6.4],
        [349, 0.5, 6.9], [330, 0.8, 7.4], [294, 0.5, 8.2], [262, 1.0, 8.7],
      ];
      var bassNotes = [
        [131, 1.0, 0], [165, 1.0, 1.5], [196, 1.0, 3.3],
        [175, 1.0, 5.1], [147, 1.0, 6.9], [131, 1.0, 8.2],
      ];

      function playMelody(startTime) {
        melody.forEach(function(n) {
          var osc = audioCtx.createOscillator();
          var env = audioCtx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(n[0], startTime + n[2]);
          env.gain.setValueAtTime(0.5, startTime + n[2]);
          env.gain.linearRampToValueAtTime(0.2, startTime + n[2] + n[1] * 0.5);
          env.gain.linearRampToValueAtTime(0, startTime + n[2] + n[1]);
          osc.connect(env);
          env.connect(masterGain);
          osc.start(startTime + n[2]);
          osc.stop(startTime + n[2] + n[1] + 0.05);
          oscillators.push(osc);
        });
        bassNotes.forEach(function(n) {
          var osc = audioCtx.createOscillator();
          var env = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(n[0], startTime + n[2]);
          env.gain.setValueAtTime(0.35, startTime + n[2]);
          env.gain.linearRampToValueAtTime(0, startTime + n[2] + n[1]);
          osc.connect(env);
          env.connect(masterGain);
          osc.start(startTime + n[2]);
          osc.stop(startTime + n[2] + n[1] + 0.05);
          oscillators.push(osc);
        });
      }

      var now = audioCtx.currentTime;
      for (var i = 0; i < 8; i++) playMelody(now + i * 9.7);

      var visCtx = visCanvas.getContext('2d');
      var bufLen = analyser.frequencyBinCount;
      var dataArray = new Uint8Array(bufLen);

      function drawVis() {
        if (!isPlaying) return;
        analyser.getByteFrequencyData(dataArray);
        visCtx.fillStyle = '#1a1a2e';
        visCtx.fillRect(0, 0, visCanvas.width, visCanvas.height);
        var barW = visCanvas.width / bufLen;
        for (var j = 0; j < bufLen; j++) {
          var barH = (dataArray[j] / 255) * visCanvas.height;
          var hue = 120 + (j / bufLen) * 40;
          visCtx.fillStyle = 'hsl(' + hue + ', 100%, ' + (40 + (dataArray[j] / 255) * 30) + '%)';
          visCtx.fillRect(j * barW, visCanvas.height - barH, barW - 1, barH);
        }
        animId = requestAnimationFrame(drawVis);
      }
      drawVis();

      timeInterval = setInterval(function() {
        playSeconds++;
        var m = Math.floor(playSeconds / 60);
        var s = playSeconds % 60;
        timeDisplay.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
      }, 1000);
    }

    function pausePlayback() {
      if (!isPlaying) return;
      isPlaying = false;
      playBtn.classList.remove('active');
      if (animId) cancelAnimationFrame(animId);
      if (timeInterval) clearInterval(timeInterval);
      oscillators.forEach(function(o) { try { o.stop(); } catch(e) {} });
      oscillators = [];
    }

    function stopPlayback() {
      pausePlayback();
      playSeconds = 0;
      timeDisplay.textContent = '00:00';
      var visCtx = visCanvas.getContext('2d');
      visCtx.fillStyle = '#1a1a2e';
      visCtx.fillRect(0, 0, visCanvas.width, visCanvas.height);
    }

    return wrap;
  }

  // ─── EXPOSE ──────────────────────────────────────
  window.Win95Extras = {
    createMinesweeper: createMinesweeper,
    createPaint: createPaint,
    createInternetExplorer: createInternetExplorer,
    createMSNMessenger: createMSNMessenger,
    triggerShutdown: triggerShutdown,
    initScreensaver: initScreensaver,
    createSystemProperties: createSystemProperties,
    createWinamp: createWinamp,
  };
})();
