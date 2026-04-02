// Silicon runner game module
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
  function createSiliconRunner(container) {
    var W = 600, H = 300;
    var GROUND_Y = H - 50;
    var GRAVITY = 0.7;
    var JUMP_FORCE = -12;
    var OBSTACLE_SPEED = 3;
    var DISTANCE_SCALE = 0.6;
    var LEVEL_LENGTH = 3600;

    container.textContent = '';
    container.style.cssText = 'display:flex;align-items:center;justify-content:flex-start;background:#0a0014;height:100%;padding:8px;overflow:hidden;';

    var stage = document.createElement('div');
    stage.style.cssText = 'display:flex;flex-direction:column;align-items:center;transform-origin:top center;will-change:transform;';
    container.appendChild(stage);

    var header = document.createElement('div');
    header.style.cssText = 'color:#00f0ff;font-family:"Press Start 2P",monospace;font-size:8px;margin-bottom:6px;display:flex;gap:20px;';
    var titleSpan = document.createElement('span');
    titleSpan.textContent = 'SILICON RUNNER';
    var distSpan = document.createElement('span');
    distSpan.textContent = 'DIST: ';
    var distNum = document.createElement('span');
    distNum.id = 'runnerDist';
    distNum.textContent = '0';
    distSpan.appendChild(distNum);
    var distSuffix = document.createTextNode('m / ' + Math.floor(LEVEL_LENGTH / 10) + 'm');
    distSpan.appendChild(distSuffix);
    var bestSpan = document.createElement('span');
    var bestDistance = loadNumber(STORAGE_KEYS.runnerBestDistance, 0);
    bestSpan.textContent = 'BEST: ' + bestDistance + 'm';
    header.appendChild(titleSpan);
    header.appendChild(distSpan);
    header.appendChild(bestSpan);
    stage.appendChild(header);

    var canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    canvas.style.cssText = 'border:2px solid #00f0ff;background:#0a0014;';
    stage.appendChild(canvas);

    var msg = document.createElement('div');
    msg.style.cssText = 'color:#00f0ff;font-family:"Press Start 2P",monospace;font-size:8px;margin-top:8px;text-align:center;min-height:20px;';
    msg.textContent = 'SPACE or UP to jump. Avoid the obstacles!';
    stage.appendChild(msg);

    var ctx = canvas.getContext('2d');
    var player, obstacles, distance, gameOver, won, frame, nextObstacle, anim;

    function init() {
      player = { x: 80, y: GROUND_Y - 30, w: 24, h: 30, vy: 0, onGround: true };
      obstacles = [];
      distance = 0;
      gameOver = false;
      won = false;
      frame = 0;
      nextObstacle = 100;
      msg.textContent = 'SPACE or UP to jump. Avoid the obstacles!';
    }

    function spawnObstacle() {
      var types = [
        { w: 20, h: 40, color: '#ff3366' },
        { w: 30, h: 25, color: '#ff6633' },
        { w: 15, h: 55, color: '#ff0066' }
      ];
      var t = types[Math.floor(Math.random() * types.length)];
      obstacles.push({ x: W + 10, y: GROUND_Y - t.h, w: t.w, h: t.h, color: t.color });
    }

    function draw() {
      ctx.fillStyle = '#0a0014';
      ctx.fillRect(0, 0, W, H);

      // Stars
      ctx.fillStyle = '#224';
      for (var i = 0; i < 30; i++) {
        var sx = ((i * 137 + frame * 0.3) % W);
        var sy = (i * 47) % (GROUND_Y - 30);
        ctx.fillRect(sx, sy, 2, 2);
      }

      // Ground
      ctx.fillStyle = '#1a1a3a';
      ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(W, GROUND_Y); ctx.stroke();

      // Grid on ground
      ctx.strokeStyle = '#112';
      ctx.lineWidth = 1;
      for (var g = 0; g < 20; g++) {
        var gx = ((g * 40) - (distance % 40));
        ctx.beginPath(); ctx.moveTo(gx, GROUND_Y); ctx.lineTo(gx - 10, H); ctx.stroke();
      }

      // Player
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(player.x, player.y, player.w, player.h);
      ctx.fillStyle = '#003322';
      ctx.fillRect(player.x + 4, player.y + 4, player.w - 8, player.h - 8);
      ctx.fillStyle = '#00ff88';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('AI', player.x + player.w / 2, player.y + player.h / 2 + 4);
      ctx.fillStyle = '#00cc66';
      for (var p = 0; p < 3; p++) {
        ctx.fillRect(player.x - 3, player.y + 5 + p * 10, 3, 4);
        ctx.fillRect(player.x + player.w, player.y + 5 + p * 10, 3, 4);
      }

      // Obstacles
      obstacles.forEach(function(o) {
        ctx.fillStyle = o.color;
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        for (var ly = 0; ly < o.h; ly += 6) { ctx.fillRect(o.x, o.y + ly, o.w, 1); }
      });

      // Progress bar
      var prog = Math.min(distance / LEVEL_LENGTH, 1);
      ctx.fillStyle = '#222';
      ctx.fillRect(10, 10, W - 20, 6);
      ctx.fillStyle = '#00f0ff';
      ctx.fillRect(10, 10, (W - 20) * prog, 6);

      if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, W, H);
        ctx.font = '16px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = won ? '#00ff88' : '#ff3366';
        ctx.fillText(won ? 'LEVEL COMPLETE!' : 'CRASHED!', W / 2, H / 2 - 10);
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('Press SPACE to restart', W / 2, H / 2 + 15);
      }
    }

    function tickLoop() {
      if (gameOver) { draw(); anim = requestAnimationFrame(tickLoop); return; }

      frame++;
      distance += OBSTACLE_SPEED * DISTANCE_SCALE;
      var distEl = document.getElementById('runnerDist');
      if (distEl) distEl.textContent = Math.floor(distance / 10);

      player.vy += GRAVITY;
      player.y += player.vy;
      if (player.y >= GROUND_Y - player.h) { player.y = GROUND_Y - player.h; player.vy = 0; player.onGround = true; }

      nextObstacle--;
      if (nextObstacle <= 0) { spawnObstacle(); nextObstacle = 100 + Math.floor(Math.random() * 80); }
      obstacles.forEach(function(o) { o.x -= OBSTACLE_SPEED; });
      obstacles = obstacles.filter(function(o) { return o.x + o.w > -10; });

      for (var i = 0; i < obstacles.length; i++) {
        var o = obstacles[i];
        if (player.x + player.w > o.x + 4 && player.x < o.x + o.w - 4 && player.y + player.h > o.y + 4 && player.y < o.y + o.h) {
          gameOver = true;
          var crashDistance = Math.floor(distance / 10);
          if (crashDistance > bestDistance) {
            bestDistance = crashDistance;
            bestSpan.textContent = 'BEST: ' + bestDistance + 'm';
            saveNumber(STORAGE_KEYS.runnerBestDistance, bestDistance);
          }
          msg.textContent = 'Crashed! Distance: ' + crashDistance + 'm';
          break;
        }
      }

      if (distance >= LEVEL_LENGTH) {
        won = true;
        gameOver = true;
        var completedDistance = Math.floor(distance / 10);
        if (completedDistance > bestDistance) {
          bestDistance = completedDistance;
          bestSpan.textContent = 'BEST: ' + bestDistance + 'm';
          saveNumber(STORAGE_KEYS.runnerBestDistance, bestDistance);
        }
        msg.textContent = 'Level Complete! You escaped the silicon!';
      }

      draw();
      anim = requestAnimationFrame(tickLoop);
    }

    function handleKey(e) {
      if ((e.key === ' ' || e.key === 'ArrowUp') && gameOver) { init(); return; }
      if ((e.key === ' ' || e.key === 'ArrowUp') && player.onGround) { player.vy = JUMP_FORCE; player.onGround = false; e.preventDefault(); }
    }

    function fitStage() {
      var availableW = Math.max(320, container.clientWidth - 12);
      var availableH = Math.max(240, container.clientHeight - 12);
      var baseW = Math.max(W, header.offsetWidth + 10);
      var baseH = header.offsetHeight + H + msg.offsetHeight + 22;
      var scale = Math.min(availableW / baseW, availableH / baseH);
      scale = Math.max(0.75, Math.min(2.6, scale));
      stage.style.transform = 'scale(' + scale.toFixed(3) + ')';
      stage.style.marginTop = '6px';
    }

    var resizeObs = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObs = new ResizeObserver(fitStage);
      resizeObs.observe(container);
    }
    window.addEventListener('resize', fitStage);

    container._runnerCleanup = function() {
      cancelAnimationFrame(anim);
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', fitStage);
      if (resizeObs) resizeObs.disconnect();
    };
    document.addEventListener('keydown', handleKey);
    init();
    anim = requestAnimationFrame(tickLoop);
    setTimeout(fitStage, 0);
  }
  parts.createSiliconRunner = createSiliconRunner;
})();
