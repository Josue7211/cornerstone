// CPU vs GPU race game module
(function() {
  'use strict';

  var parts = window.GamesModuleParts = window.GamesModuleParts || {};
  function createCpuGpuRace(container) {
    var hostWin = container.closest ? container.closest('.win95-window') : null;
    var isFullscreen = !!(hostWin && hostWin.dataset.maximized === 'true');
    container.textContent = '';
    container.style.cssText = 'display:flex;flex-direction:column;background:#0a0a14;height:100%;padding:' + (isFullscreen ? '20px' : '12px') + ';color:#e0e0f0;font-family:"Space Mono",monospace;font-size:' + (isFullscreen ? '13px' : '11px') + ';overflow-y:auto;';

    var page = document.createElement('div');
    page.style.cssText = 'width:100%;max-width:' + (isFullscreen ? '1120px' : '760px') + ';margin:0 auto;';
    container.appendChild(page);

    if (isFullscreen) {
      var hero = document.createElement('div');
      hero.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border:1px solid #2f4a73;background:linear-gradient(180deg,#10203b,#0a1428);margin-bottom:14px;border-radius:4px;';
      var heroLeft = document.createElement('div');
      var heroTitle = document.createElement('div');
      heroTitle.style.cssText = 'font-family:"Press Start 2P",monospace;font-size:11px;color:#9ec6ff;letter-spacing:.06em;';
      heroTitle.textContent = 'STEAM95 EXPERIENCE MODE';
      var heroSub = document.createElement('div');
      heroSub.style.cssText = 'margin-top:6px;font-size:12px;color:#aebed6;';
      heroSub.textContent = 'Educational simulation · Parallel compute visualization';
      heroLeft.appendChild(heroTitle);
      heroLeft.appendChild(heroSub);
      var heroHint = document.createElement('div');
      heroHint.style.cssText = 'font-size:11px;color:#c7d8f3;background:#0f1f36;border:1px solid #355b8f;padding:6px 10px;';
      heroHint.textContent = 'Hint: Press RUN to compare serial vs parallel throughput';
      hero.appendChild(heroLeft);
      hero.appendChild(heroHint);
      page.appendChild(hero);
    }

    var title = document.createElement('div');
    title.style.cssText = 'font-family:"Press Start 2P",monospace;font-size:' + (isFullscreen ? '14px' : '10px') + ';color:#00f0ff;margin-bottom:' + (isFullscreen ? '18px' : '12px') + ';text-align:center;';
    title.textContent = 'CPU vs GPU: The Race';
    page.appendChild(title);

    var desc = document.createElement('div');
    desc.style.cssText = 'color:#9aa8bb;font-size:' + (isFullscreen ? '13px' : '10px') + ';margin-bottom:' + (isFullscreen ? '20px' : '16px') + ';text-align:center;line-height:1.6;';
    desc.textContent = 'CPU processes tasks one at a time (serial). GPU processes many at once (parallel). Click RUN to see the difference!';
    page.appendChild(desc);

    var TASK_COUNT = 32;

    function createTrack(label, color, id) {
      var track = document.createElement('div');
      track.style.cssText = 'margin-bottom:' + (isFullscreen ? '22px' : '16px') + ';';

      var hdr = document.createElement('div');
      hdr.style.cssText = 'display:flex;justify-content:space-between;margin-bottom:6px;';
      var hdrLabel = document.createElement('span');
      hdrLabel.style.cssText = 'color:' + color + ';font-weight:bold;font-size:' + (isFullscreen ? '14px' : '11px') + ';';
      hdrLabel.textContent = label;
      var hdrTime = document.createElement('span');
      hdrTime.id = id + 'Time';
      hdrTime.style.cssText = 'color:#8e9bb2;font-size:' + (isFullscreen ? '14px' : '11px') + ';';
      hdrTime.textContent = '0.00s';
      hdr.appendChild(hdrLabel);
      hdr.appendChild(hdrTime);
      track.appendChild(hdr);

      var grid = document.createElement('div');
      grid.id = id + 'Grid';
      grid.style.cssText = 'display:grid;grid-template-columns:repeat(8,1fr);gap:3px;';
      for (var i = 0; i < TASK_COUNT; i++) {
        var cell = document.createElement('div');
        cell.style.cssText = 'height:' + (isFullscreen ? '36px' : '24px') + ';background:#1a1a2e;border:1px solid #333;border-radius:2px;transition:background 0.15s;';
        grid.appendChild(cell);
      }
      track.appendChild(grid);
      return track;
    }

    page.appendChild(createTrack('CPU (Serial)', '#ff6633', 'cpu'));
    page.appendChild(createTrack('GPU (Parallel)', '#00ff88', 'gpu'));

    var explain = document.createElement('div');
    explain.style.cssText = 'background:#111;border:1px solid #333;border-radius:4px;padding:' + (isFullscreen ? '14px' : '10px') + ';font-size:' + (isFullscreen ? '12px' : '10px') + ';color:#9aa8bb;line-height:1.6;margin-bottom:12px;';
    var explainBold = document.createElement('b');
    explainBold.style.color = '#00f0ff';
    explainBold.textContent = 'Why GPUs win at AI: ';
    explain.appendChild(explainBold);
    explain.appendChild(document.createTextNode('A CPU has 8-16 powerful cores that process tasks sequentially. A GPU has thousands of smaller cores that process tasks simultaneously. AI inference is massively parallel \u2014 each neuron\'s math can run at the same time. This is why a $500 GPU beats a $5,000 CPU at AI workloads.'));
    page.appendChild(explain);

    if (isFullscreen) {
      var tips = document.createElement('div');
      tips.style.cssText = 'display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px;';
      [
        'CPU: high per-core speed, lower parallel throughput',
        'GPU: many cores, wins on matrix-heavy AI workloads',
        'Same algorithm, different hardware execution model'
      ].forEach(function(line) {
        var tip = document.createElement('div');
        tip.style.cssText = 'background:#101826;border:1px solid #2c3c58;padding:8px 10px;color:#b8c8de;font-size:11px;line-height:1.45;';
        tip.textContent = line;
        tips.appendChild(tip);
      });
      page.appendChild(tips);
    }

    var btnWrap = document.createElement('div');
    btnWrap.style.cssText = 'text-align:center;';
    var runBtn = document.createElement('button');
    runBtn.textContent = '\u25B6 RUN RACE';
    runBtn.style.cssText = 'background:#00f0ff;color:#000;border:none;padding:' + (isFullscreen ? '12px 34px' : '8px 24px') + ';font-family:"Press Start 2P",monospace;font-size:' + (isFullscreen ? '11px' : '9px') + ';cursor:pointer;border-radius:2px;';
    btnWrap.appendChild(runBtn);
    page.appendChild(btnWrap);

    var running = false;

    runBtn.addEventListener('click', function() {
      if (running) return;
      running = true;
      runBtn.disabled = true;
      runBtn.textContent = 'RACING...';

      var cpuCells = document.getElementById('cpuGrid').children;
      var gpuCells = document.getElementById('gpuGrid').children;
      var cpuTimeEl = document.getElementById('cpuTime');
      var gpuTimeEl = document.getElementById('gpuTime');

      for (var i = 0; i < TASK_COUNT; i++) {
        cpuCells[i].style.background = '#1a1a2e';
        gpuCells[i].style.background = '#1a1a2e';
      }
      cpuTimeEl.textContent = '0.00s'; cpuTimeEl.style.color = '#666';
      gpuTimeEl.textContent = '0.00s'; gpuTimeEl.style.color = '#666';

      var cpuDelay = 80, gpuDelay = 30, gpuBatch = 8;
      var cpuDone = 0, gpuDone = 0;
      var cpuStart = performance.now(), gpuStart = performance.now();
      var doneCount = 0;

      function checkDone() { doneCount++; if (doneCount === 2) { running = false; runBtn.disabled = false; runBtn.textContent = '\u25B6 RUN AGAIN'; } }

      function cpuTick() {
        if (cpuDone < TASK_COUNT) {
          cpuCells[cpuDone].style.background = '#ff6633';
          cpuDone++;
          cpuTimeEl.textContent = ((performance.now() - cpuStart) / 1000).toFixed(2) + 's';
          setTimeout(cpuTick, cpuDelay);
        } else { cpuTimeEl.style.color = '#ff6633'; checkDone(); }
      }

      function gpuTick() {
        if (gpuDone < TASK_COUNT) {
          var batchEnd = Math.min(gpuDone + gpuBatch, TASK_COUNT);
          for (var j = gpuDone; j < batchEnd; j++) { gpuCells[j].style.background = '#00ff88'; }
          gpuDone = batchEnd;
          gpuTimeEl.textContent = ((performance.now() - gpuStart) / 1000).toFixed(2) + 's';
          setTimeout(gpuTick, gpuDelay);
        } else { gpuTimeEl.style.color = '#00ff88'; checkDone(); }
      }

      cpuTick();
      gpuTick();
    });

    container._gameCleanup = function() {};
  }
  parts.createCpuGpuRace = createCpuGpuRace;
})();
