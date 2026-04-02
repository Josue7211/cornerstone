// Shared helpers for split games modules
(function() {
  'use strict';

  var shared = window.Win95Shared || {};
  var STORAGE_KEYS = {
    snakeHighScore: 'win95-snake-high-score',
    runnerBestDistance: 'win95-runner-best-distance'
  };

  function loadNumber(key, fallback) {
    if (typeof shared.readNumber === 'function') {
      return shared.readNumber(key, fallback);
    }
    try {
      var raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      var parsed = parseInt(raw, 10);
      return Number.isNaN(parsed) ? fallback : parsed;
    } catch (e) {
      return fallback;
    }
  }

  function saveNumber(key, value) {
    if (typeof shared.writeNumber === 'function') {
      shared.writeNumber(key, value);
      return;
    }
    try { localStorage.setItem(key, String(value)); } catch (e) {}
  }

  var parts = window.GamesModuleParts = window.GamesModuleParts || {};
  parts.helpers = {
    STORAGE_KEYS: STORAGE_KEYS,
    loadNumber: loadNumber,
    saveNumber: saveNumber
  };
})();
