// Steam catalog aggregator (one file per game lives in steam-game-*.js)
(function() {
  'use strict';

  var GAMES = (window.SteamGameDefs || []).slice();
  var CATEGORY_ORDER = ['real', 'experience'];
  var CATEGORY_LABELS = {
    real: 'Real Games',
    experience: 'Experience Games'
  };

  window.SteamCatalog = {
    GAMES: GAMES,
    CATEGORY_ORDER: CATEGORY_ORDER,
    CATEGORY_LABELS: CATEGORY_LABELS
  };
})();
