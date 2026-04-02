// Steam game window launcher helper
(function() {
  'use strict';

  function launchGame(game, wm, animateWindowOpen, opts) {
    opts = opts || {};
    var steamState = window.SteamState || {};
    var gameContainer = document.createElement('div');
    gameContainer.style.cssText = 'height:100%;overflow:hidden;';
    var gameId = 'game_' + game.id;

    if (wm.windows && wm.windows.has(gameId)) {
      wm.closeWindow(gameId);
    }

    var winEl = wm.createWindow(gameId, game.title, game.icon, gameContainer, {
      width: game.id === 'snake' ? 460 : 660,
      height: game.id === 'snake' ? 440 : 420
    });

    if (typeof animateWindowOpen === 'function') animateWindowOpen(gameId, winEl);

    if (steamState && typeof steamState.markGameLaunched === 'function') {
      steamState.markGameLaunched(game.id);
    }

    setTimeout(function() {
      var contentEl = document.getElementById('win-content-' + gameId);
      if (contentEl && game.launcher) {
        game.launcher(contentEl);
        if (opts.fullscreen) contentEl.classList.add('steam-game-host-fullscreen');
      }
    }, 50);

    if (opts.fullscreen && wm && typeof wm._getMaximizedBounds === 'function') {
      var entry = wm.windows.get(gameId);
      if (entry) {
        wm._applyGeometry(entry.el, wm._getMaximizedBounds());
        entry.el.dataset.maximized = 'true';
        entry.snapState = 'maximized';
        entry.el.classList.add('steam-game-fullscreen');
      }
    }

    var entryForCleanup = wm.windows && wm.windows.get(gameId);
    if (entryForCleanup) {
      entryForCleanup.onClose = function() {
        var host = document.getElementById('win-content-' + gameId);
        if (!host) return;
        var cleanup = host._gameCleanup || host._snakeCleanup || host._runnerCleanup || host._mineCleanup;
        if (typeof cleanup === 'function') cleanup();
        var first = host.firstElementChild;
        if (first) {
          var childCleanup = first._gameCleanup || first._snakeCleanup || first._runnerCleanup || first._mineCleanup;
          if (typeof childCleanup === 'function') childCleanup();
        }
      };
    }

    return gameId;
  }

  window.SteamLaunch = {
    launchGame: launchGame,
  };
})();
