// Steam state persistence and runtime helpers
(function() {
  'use strict';

  var shared = window.Win95Shared || {};
  var STORAGE_KEY = 'steam95_state_v2';
  var LEGACY_KEY = 'steam95_games';
  var activeSessions = {};
  var closeListenerBound = false;

  function getGames() {
    var catalog = window.SteamCatalog || {};
    return catalog.GAMES || [];
  }

  function gameMap() {
    var map = {};
    getGames().forEach(function(game) { map[game.id] = game; });
    return map;
  }

  function now() {
    return Date.now();
  }

  function defaultGameState(game) {
    var alwaysInstalled = !!(game && game.alwaysInstalled);
    return {
      installed: alwaysInstalled,
      installState: alwaysInstalled ? 'installed' : 'not_installed',
      installProgress: alwaysInstalled ? 100 : 0,
      played: false,
      playCount: 0,
      favorite: false,
      lastPlayedAt: 0,
      totalPlayMs: 0
    };
  }

  function readJSON(key, fallback) {
    if (typeof shared.readJSON === 'function') return shared.readJSON(key, fallback);
    try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (e) { return fallback; }
  }

  function writeJSON(key, value) {
    if (typeof shared.writeJSON === 'function') {
      shared.writeJSON(key, value);
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeEntry(raw, game) {
    var base = defaultGameState(game);
    var entry = Object.assign({}, base, raw || {});

    entry.played = !!entry.played;
    entry.playCount = Math.max(0, parseInt(entry.playCount || 0, 10) || 0);
    entry.favorite = !!entry.favorite;
    entry.lastPlayedAt = Math.max(0, parseInt(entry.lastPlayedAt || 0, 10) || 0);
    entry.totalPlayMs = Math.max(0, parseInt(entry.totalPlayMs || 0, 10) || 0);

    var progress = Math.max(0, Math.min(100, parseInt(entry.installProgress || 0, 10) || 0));
    var installState = String(entry.installState || '').toLowerCase();

    if (game && game.alwaysInstalled) {
      installState = 'installed';
      progress = 100;
      entry.installed = true;
    }

    if (!installState) installState = entry.installed ? 'installed' : 'not_installed';
    if (installState === 'installing') installState = 'queued';
    if (installState === 'installed') {
      entry.installed = true;
      progress = 100;
    }
    if (installState === 'not_installed') {
      entry.installed = false;
      progress = 0;
    }

    entry.installState = installState;
    entry.installProgress = progress;
    return entry;
  }

  function migrateLegacy(normalized) {
    var legacy = readJSON(LEGACY_KEY, {}) || {};
    Object.keys(legacy).forEach(function(gameId) {
      var src = legacy[gameId] || {};
      var dst = normalized[gameId];
      if (!dst) return;
      if (src.played) dst.played = true;
      dst.playCount = Math.max(dst.playCount, parseInt(src.playCount || 0, 10) || 0);
      if (src.installed) {
        dst.installed = true;
        dst.installState = 'installed';
        dst.installProgress = 100;
      }
    });
  }

  function loadState() {
    var raw = readJSON(STORAGE_KEY, {}) || {};
    var map = gameMap();
    var normalized = {};

    Object.keys(map).forEach(function(gameId) {
      normalized[gameId] = normalizeEntry(raw[gameId], map[gameId]);
    });

    migrateLegacy(normalized);
    return normalized;
  }

  function saveState(state) {
    writeJSON(STORAGE_KEY, state || {});
  }

  function withState(mutator) {
    var s = loadState();
    mutator(s);
    saveState(s);
    return s;
  }

  function getGameState(gameId) {
    var map = gameMap();
    var state = loadState();
    return state[gameId] || defaultGameState(map[gameId]);
  }

  function patchGameState(gameId, patch) {
    return withState(function(s) {
      var map = gameMap();
      var merged = Object.assign({}, s[gameId] || defaultGameState(map[gameId]), patch || {});
      s[gameId] = normalizeEntry(merged, map[gameId]);
    });
  }

  function setInstallState(gameId, installState, progress) {
    patchGameState(gameId, {
      installState: installState,
      installProgress: progress
    });
  }

  function setGameInstalled(gameId) {
    patchGameState(gameId, {
      installed: true,
      installState: 'installed',
      installProgress: 100
    });
  }

  function uninstallGame(gameId) {
    var game = gameMap()[gameId];
    if (game && game.alwaysInstalled) return;
    patchGameState(gameId, {
      installed: false,
      installState: 'not_installed',
      installProgress: 0
    });
  }

  function setGamePlayed(gameId) {
    markGameLaunched(gameId);
  }

  function markGameLaunched(gameId) {
    patchGameState(gameId, {
      played: true,
      playCount: (getGameState(gameId).playCount || 0) + 1,
      lastPlayedAt: now()
    });
    activeSessions[gameId] = now();
  }

  function markGameClosed(gameId) {
    var startedAt = activeSessions[gameId];
    if (!startedAt) return;
    var elapsed = Math.max(0, now() - startedAt);
    delete activeSessions[gameId];
    patchGameState(gameId, {
      totalPlayMs: (getGameState(gameId).totalPlayMs || 0) + elapsed
    });
  }

  function toggleFavorite(gameId) {
    var current = getGameState(gameId);
    patchGameState(gameId, { favorite: !current.favorite });
  }

  function computeAchievements(gameId) {
    var game = gameMap()[gameId] || {};
    var gs = getGameState(gameId);
    var list = [
      {
        id: 'first_boot',
        title: 'First Boot',
        description: 'Launch this game once.',
        unlocked: gs.playCount >= 1
      },
      {
        id: 'regular',
        title: 'Regular',
        description: 'Launch this game 5 times.',
        unlocked: gs.playCount >= 5
      },
      {
        id: 'marathon',
        title: 'Marathon Session',
        description: 'Accumulate 20 minutes playtime.',
        unlocked: gs.totalPlayMs >= 20 * 60 * 1000
      },
      {
        id: 'curator',
        title: 'Curator',
        description: 'Mark this game as favorite.',
        unlocked: !!gs.favorite
      },
      {
        id: 'genre_explorer',
        title: 'Genre Explorer',
        description: 'Play an ' + (game.genre || 'featured') + ' game 3 times.',
        unlocked: gs.playCount >= 3
      }
    ];
    return list;
  }

  function getGlobalStats() {
    var state = loadState();
    var ids = Object.keys(state);
    var totals = {
      totalGames: ids.length,
      installedGames: 0,
      favorites: 0,
      totalPlayMs: 0,
      playedGames: 0
    };

    ids.forEach(function(gameId) {
      var gs = state[gameId];
      if (gs.installed) totals.installedGames += 1;
      if (gs.favorite) totals.favorites += 1;
      if (gs.played || gs.playCount > 0) totals.playedGames += 1;
      totals.totalPlayMs += gs.totalPlayMs || 0;
    });

    return totals;
  }

  function bindCloseListener() {
    if (closeListenerBound) return;
    closeListenerBound = true;
    window.addEventListener('win95-os-event', function(evt) {
      var detail = evt && evt.detail ? evt.detail : null;
      if (!detail || detail.type !== 'window_close') return;
      var appId = detail.detail && detail.detail.appId ? detail.detail.appId : '';
      if (typeof appId !== 'string' || appId.indexOf('game_') !== 0) return;
      markGameClosed(appId.slice(5));
    });
  }

  bindCloseListener();

  window.SteamState = {
    STORAGE_KEY: STORAGE_KEY,
    defaultGameState: defaultGameState,
    loadState: loadState,
    saveState: saveState,
    getGameState: getGameState,
    patchGameState: patchGameState,
    setInstallState: setInstallState,
    setGameInstalled: setGameInstalled,
    uninstallGame: uninstallGame,
    setGamePlayed: setGamePlayed,
    markGameLaunched: markGameLaunched,
    markGameClosed: markGameClosed,
    toggleFavorite: toggleFavorite,
    computeAchievements: computeAchievements,
    getGlobalStats: getGlobalStats
  };
})();
