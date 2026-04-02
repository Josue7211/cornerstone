// ═══════════════════════════════════════════════════
// GAMES.JS — Aggregator for split mini-game modules
// ═══════════════════════════════════════════════════
(function() {
  'use strict';

  var parts = window.GamesModuleParts || {};
  window.GamesModule = {
    createSnakeGame: parts.createSnakeGame,
    createSiliconRunner: parts.createSiliconRunner,
    createCpuGpuRace: parts.createCpuGpuRace
  };
})();
