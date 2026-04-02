// Snake game module
(function() {
  'use strict';

  var parts = window.GamesModuleParts = window.GamesModuleParts || {};
  var helpers = parts.helpers || {};
  var STORAGE_KEYS = helpers.STORAGE_KEYS || {
    snakeHighScore: 'win95-snake-high-score',
    runnerBestDistance: 'win95-runner-best-distance'
  };
  var loadNumber = helpers.loadNumber || function(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      var parsed = parseInt(raw, 10);
      return Number.isNaN(parsed) ? fallback : parsed;
    } catch (e) {
      return fallback;
    }
  };
  var saveNumber = helpers.saveNumber || function(key, value) {
    try { localStorage.setItem(key, String(value)); } catch (e) {}
  };
  function createSnakeGame(container) {
    var CELL = 16;
    var COLS = 25;
    var ROWS = 20;
    var W = COLS * CELL;
    var H = ROWS * CELL;
    var WIN_LENGTH = 15;

    container.textContent = '';
    container.style.cssText = 'display:flex;align-items:center;justify-content:flex-start;background:#000;height:100%;padding:8px;overflow:hidden;';

    var stage = document.createElement('div');
    stage.style.cssText = 'display:flex;flex-direction:column;align-items:center;transform-origin:top center;will-change:transform;';
    container.appendChild(stage);

    var header = document.createElement('div');
    header.style.cssText = 'color:#33ff33;font-family:"Press Start 2P",monospace;font-size:8px;margin-bottom:6px;display:flex;gap:20px;';
    var scoreLabel = document.createElement('span');
    scoreLabel.textContent = 'SCORE: ';
    var scoreNum = document.createElement('span');
    scoreNum.id = 'snakeScore';
    scoreNum.textContent = '0';
    scoreLabel.appendChild(scoreNum);
    var goalLabel = document.createElement('span');
    goalLabel.textContent = 'GOAL: ' + WIN_LENGTH;
    var highLabel = document.createElement('span');
    var highScore = loadNumber(STORAGE_KEYS.snakeHighScore, 0);
    highLabel.textContent = 'HIGH: ' + highScore;
    header.appendChild(scoreLabel);
    header.appendChild(goalLabel);
    header.appendChild(highLabel);
    stage.appendChild(header);

    var canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    canvas.style.cssText = 'border:2px solid #33ff33;background:#0a0a0a;image-rendering:pixelated;';
    stage.appendChild(canvas);

    var msg = document.createElement('div');
    msg.style.cssText = 'color:#33ff33;font-family:"Press Start 2P",monospace;font-size:8px;margin-top:8px;text-align:center;min-height:20px;';
    msg.textContent = 'Arrow keys to move. Reach ' + WIN_LENGTH + ' to win!';
    stage.appendChild(msg);

    var ctx = canvas.getContext('2d');
    var snake, dir, nextDir, food, score, gameOver, won, interval;

    function init() {
      var startX = Math.floor(COLS / 2);
      var startY = Math.floor(ROWS / 2);
      snake = [{ x: startX, y: startY }, { x: startX - 1, y: startY }, { x: startX - 2, y: startY }];
      dir = { x: 1, y: 0 };
      nextDir = { x: 1, y: 0 };
      score = 0;
      gameOver = false;
      won = false;
      placeFood();
      updateScore();
      msg.textContent = 'Arrow keys to move. Reach ' + WIN_LENGTH + ' to win!';
    }

    function placeFood() {
      var pos;
      do {
        pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
      } while (snake.some(function(s) { return s.x === pos.x && s.y === pos.y; }));
      food = pos;
    }

    function updateScore() {
      var el = document.getElementById('snakeScore');
      if (el) el.textContent = score;
      if (score > highScore) {
        highScore = score;
        highLabel.textContent = 'HIGH: ' + highScore;
        saveNumber(STORAGE_KEYS.snakeHighScore, highScore);
      }
    }

    function draw() {
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, W, H);

      // Grid lines
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 0.5;
      for (var x = 0; x < COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); ctx.stroke(); }
      for (var y = 0; y < ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); ctx.stroke(); }

      // Food
      ctx.fillStyle = '#ff3333';
      ctx.fillRect(food.x * CELL + 2, food.y * CELL + 2, CELL - 4, CELL - 4);

      // Snake
      snake.forEach(function(seg, i) {
        ctx.fillStyle = i === 0 ? '#33ff33' : '#22cc22';
        ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
      });

      if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = won ? '#33ff33' : '#ff3333';
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(won ? 'YOU WIN!' : 'GAME OVER', W / 2, H / 2 - 10);
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('Press SPACE to restart', W / 2, H / 2 + 15);
      }
    }

    function tick() {
      if (gameOver) return;
      dir = nextDir;
      var head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
        gameOver = true;
        msg.textContent = 'Game Over! Score: ' + score;
        draw();
        return;
      }

      if (snake.some(function(s) { return s.x === head.x && s.y === head.y; })) {
        gameOver = true;
        msg.textContent = 'Game Over! Score: ' + score;
        draw();
        return;
      }

      snake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        score++;
        updateScore();
        if (score >= WIN_LENGTH) {
          won = true;
          gameOver = true;
          msg.textContent = 'You WIN! Final score: ' + score;
        } else {
          placeFood();
        }
      } else {
        snake.pop();
      }
      draw();
    }

    function handleKey(e) {
      if (e.key === ' ' && gameOver) { init(); draw(); return; }
      var map = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 } };
      var nd = map[e.key];
      if (nd && (nd.x + dir.x !== 0 || nd.y + dir.y !== 0)) { nextDir = nd; e.preventDefault(); }
    }

    function fitStage() {
      var availableW = Math.max(260, container.clientWidth - 12);
      var availableH = Math.max(220, container.clientHeight - 12);
      var baseW = Math.max(W, header.offsetWidth + 10);
      var baseH = header.offsetHeight + H + msg.offsetHeight + 22;
      var scale = Math.min(availableW / baseW, availableH / baseH);
      scale = Math.max(0.75, Math.min(2.8, scale));
      stage.style.transform = 'scale(' + scale.toFixed(3) + ')';
      stage.style.marginTop = '6px';
    }

    var resizeObs = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObs = new ResizeObserver(fitStage);
      resizeObs.observe(container);
    }
    window.addEventListener('resize', fitStage);

    container._snakeCleanup = function() {
      clearInterval(interval);
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', fitStage);
      if (resizeObs) resizeObs.disconnect();
    };
    document.addEventListener('keydown', handleKey);
    init();
    draw();
    interval = setInterval(tick, 120);
    setTimeout(fitStage, 0);
  }
  parts.createSnakeGame = createSnakeGame;
})();
