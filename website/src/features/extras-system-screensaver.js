// Win95 extras: screensaver system module
(function() {
  'use strict';

  var parts = window.Win95ExtrasParts = window.Win95ExtrasParts || {};

  function getWM() { return window.wm; }
  function getAudioCtx() { return window._win95AudioCtx ? window._win95AudioCtx() : new (window.AudioContext || window.webkitAudioContext)(); }

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

  var parts = window.Win95ExtrasParts = window.Win95ExtrasParts || {};
  parts.initScreensaver = initScreensaver;
  parts.startScreensaver = activateScreensaver;
  parts.stopScreensaver = dismissScreensaver;
})();
