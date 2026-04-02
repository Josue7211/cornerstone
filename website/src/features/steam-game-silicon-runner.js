(function() {
  'use strict';
  var list = window.SteamGameDefs = window.SteamGameDefs || [];
  for (var i = list.length - 1; i >= 0; i--) if (list[i].id === 'silicon_runner') list.splice(i, 1);
  list.push({
    id: 'silicon_runner',
    category: 'experience',
    title: 'Silicon Runner',
    genre: 'Platformer',
    icon: 'icon:gameRunner',
    banner: '#0a0028',
    desc: 'Guide an AI chip through a dangerous silicon landscape. Jump over obstacles in this side-scrolling runner. Complete the full level to win!',
    tags: ['Action', 'Runner', 'Sci-Fi'],
    size: '0.5 MB',
    requiresInstall: true,
    launcher: function(c) { window.GamesModule.createSiliconRunner(c); }
  });
})();
