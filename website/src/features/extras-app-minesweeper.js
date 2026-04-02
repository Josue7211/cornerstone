// Win95 extras: Minesweeper app
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
    wrap.style.setProperty('--mine-cell-size', '28px');
    wrap.style.setProperty('--mine-font-size', '11px');

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

    function fitBoard() {
      var host = wrap.parentElement;
      if (!host) return;
      var width = Math.max(280, host.clientWidth - 24);
      var height = Math.max(240, host.clientHeight - 58);
      var byWidth = Math.floor(width / COLS);
      var byHeight = Math.floor(height / ROWS);
      var cell = Math.max(20, Math.min(58, Math.min(byWidth, byHeight)));
      wrap.style.setProperty('--mine-cell-size', cell + 'px');
      wrap.style.setProperty('--mine-font-size', Math.max(9, Math.floor(cell * 0.38)) + 'px');
    }

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
    var resizeHandler = function() { fitBoard(); };
    var resizeObs = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObs = new ResizeObserver(fitBoard);
      setTimeout(function() {
        if (wrap.parentElement) resizeObs.observe(wrap.parentElement);
      }, 0);
    }
    window.addEventListener('resize', resizeHandler);
    setTimeout(fitBoard, 0);
    wrap._mineCleanup = function() {
      if (timerInterval) clearInterval(timerInterval);
      if (resizeObs) resizeObs.disconnect();
      window.removeEventListener('resize', resizeHandler);
    };
    return wrap;
  }

  // ─── PAINT ───────────────────────────────────────

  var parts = window.Win95ExtrasParts = window.Win95ExtrasParts || {};
  parts.createMinesweeper = createMinesweeper;
})();
