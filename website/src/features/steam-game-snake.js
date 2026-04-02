(function() {
  'use strict';
  var list = window.SteamGameDefs = window.SteamGameDefs || [];
  for (var i = list.length - 1; i >= 0; i--) if (list[i].id === 'snake') list.splice(i, 1);
  list.push({
    id: 'snake',
    category: 'real',
    title: 'Snake',
    genre: 'Arcade',
    icon: 'icon:gameSnake',
    banner: '#1a3a1a',
    desc: 'Classic snake game. Eat food, grow longer, avoid walls and yourself. Reach a score of 15 to win!',
    tags: ['Retro', 'Arcade', 'Casual'],
    size: '0.3 MB',
    requiresInstall: true,
    launcher: function(c) { window.GamesModule.createSnakeGame(c); }
  });
})();
