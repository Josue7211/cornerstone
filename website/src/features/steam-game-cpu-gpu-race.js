(function() {
  'use strict';
  var list = window.SteamGameDefs = window.SteamGameDefs || [];
  for (var i = list.length - 1; i >= 0; i--) if (list[i].id === 'cpu_gpu_race') list.splice(i, 1);
  list.push({
    id: 'cpu_gpu_race',
    category: 'experience',
    title: 'CPU vs GPU Race',
    genre: 'Educational',
    icon: 'icon:gameRace',
    banner: '#0a0a28',
    desc: 'Watch CPU and GPU process tasks side by side. See why GPUs dominate AI workloads through parallel processing. Interactive demo with explanation.',
    tags: ['Educational', 'Demo', 'AI'],
    size: '0.2 MB',
    requiresInstall: true,
    launcher: function(c) { window.GamesModule.createCpuGpuRace(c); }
  });
})();
