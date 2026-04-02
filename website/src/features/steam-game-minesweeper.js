(function() {
  'use strict';
  var list = window.SteamGameDefs = window.SteamGameDefs || [];
  for (var i = list.length - 1; i >= 0; i--) if (list[i].id === 'minesweeper') list.splice(i, 1);
  list.push({
    id: 'minesweeper',
    category: 'real',
    title: 'Minesweeper',
    genre: 'Puzzle',
    icon: 'icon:gameMinesweeper',
    banner: '#151515',
    desc: 'Classic desktop puzzle. Uncover every safe tile without triggering a hidden mine.',
    tags: ['Puzzle', 'Nostalgia'],
    size: '0.1 MB',
    requiresInstall: true,
    launcher: function(container) {
      container.textContent = '';
      if (window.Win95Extras && typeof window.Win95Extras.createMinesweeper === 'function') {
        container.appendChild(window.Win95Extras.createMinesweeper());
      } else {
        container.textContent = 'Minesweeper is still booting...';
      }
    }
  });
})();
