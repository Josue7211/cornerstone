// Win95 extras: system properties app
(function() {
  'use strict';

  function createSystemProperties() {
    function clamp(val, min, max) {
      return Math.max(min, Math.min(max, val));
    }

    function formatGb(val) {
      return (Math.round(val * 10) / 10).toFixed(1) + ' GB';
    }

    function getRendererInfo() {
      var canvas = document.createElement('canvas');
      var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return { vendor: 'Browser GPU', renderer: 'WebGL unavailable' };
      var debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      var vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Browser GPU';
      var renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : (gl.getParameter(gl.RENDERER) || 'WebGL GPU');
      return { vendor: vendor, renderer: renderer };
    }

    var browserCores = navigator.hardwareConcurrency || 0;
    var browserMemory = navigator.deviceMemory || 8;
    var gpuInfo = getRendererInfo();
    var ua = navigator.userAgent || '';
    var platform = navigator.platform || 'Unknown platform';
    var userAgentData = navigator.userAgentData || null;
    var browserBrand = userAgentData && userAgentData.brands && userAgentData.brands.length
      ? userAgentData.brands.map(function(brand) { return brand.brand; }).join(', ')
      : 'Browser';
    var aiStatus = {
      available: false,
      configuredModel: 'unknown',
      activeModel: null,
      endpoint: '',
      modelCount: 0,
      error: 'Checking local AI runtime...'
    };

    var wrap = document.createElement('div');
    wrap.className = 'sysprops-app';

    var tabBar = document.createElement('div');
    tabBar.className = 'sysprops-tabs';
    var tabNames = ['General', 'Device Manager', 'Performance'];
    var tabContents = [];

    tabNames.forEach(function(name, i) {
      var tab = document.createElement('button');
      tab.className = 'sysprops-tab' + (i === 0 ? ' active' : '');
      tab.textContent = name;
      tab.addEventListener('click', function() {
        tabBar.querySelectorAll('.sysprops-tab').forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        tabContents.forEach(function(c, j) { c.style.display = j === i ? 'block' : 'none'; });
      });
      tabBar.appendChild(tab);
    });
    wrap.appendChild(tabBar);

    // General tab
    var general = document.createElement('div');
    general.className = 'sysprops-content';

    var logo = document.createElement('div');
    logo.className = 'sysprops-logo';
    var winLogo = document.createElement('div');
    winLogo.className = 'sysprops-win-logo';
    winLogo.textContent = '\u229E';
    var winText = document.createElement('div');
    winText.className = 'sysprops-win-text';
    winText.textContent = 'AI 98 OS';
    var winVer = document.createElement('div');
    winVer.className = 'sysprops-win-ver';
    winVer.textContent = '4.10.1998 A';
    logo.appendChild(winLogo);
    logo.appendChild(winText);
    logo.appendChild(winVer);
    general.appendChild(logo);

    var hr1 = document.createElement('hr');
    hr1.className = 'sysprops-hr';
    general.appendChild(hr1);

    var info1 = document.createElement('div');
    info1.className = 'sysprops-info';
    var regLabel = document.createElement('div');
    regLabel.className = 'sysprops-row';
    var regLabelSpan = document.createElement('span');
    regLabelSpan.className = 'sysprops-label';
    regLabelSpan.textContent = 'Registered to:';
    regLabel.appendChild(regLabelSpan);
    info1.appendChild(regLabel);

    ['Project Author', 'Open-source release', 'Open-source release'].forEach(function(t) {
      var row = document.createElement('div');
      row.className = 'sysprops-row indent';
      row.textContent = t;
      info1.appendChild(row);
    });
    general.appendChild(info1);

    var hr2 = document.createElement('hr');
    hr2.className = 'sysprops-hr';
    general.appendChild(hr2);

    var info2 = document.createElement('div');
    info2.className = 'sysprops-info';
    var compLabel = document.createElement('div');
    compLabel.className = 'sysprops-row';
    var compLabelSpan = document.createElement('span');
    compLabelSpan.className = 'sysprops-label';
    compLabelSpan.textContent = 'Computer:';
    compLabel.appendChild(compLabelSpan);
    info2.appendChild(compLabel);

    var computerRows = [
      platform + ' | ' + (browserCores ? browserCores + ' logical cores exposed' : 'core count unavailable'),
      'Approx. device memory: ' + browserMemory + ' GB (browser hint)',
      'Renderer: ' + gpuInfo.renderer,
      'Browser: ' + browserBrand,
      'User agent: ' + ua.replace(/\s+/g, ' ').slice(0, 72) + (ua.length > 72 ? '...' : '')
    ];
    var aiGeneralRow = document.createElement('div');
    aiGeneralRow.className = 'sysprops-row indent';
    aiGeneralRow.textContent = 'Local AI runtime: checking...';
    var driveHealthRow = document.createElement('div');
    driveHealthRow.className = 'sysprops-row indent';
    driveHealthRow.textContent = 'System health: checking...';
    computerRows.forEach(function(t) {
      var row = document.createElement('div');
      row.className = 'sysprops-row indent';
      row.textContent = t;
      info2.appendChild(row);
    });
    info2.appendChild(aiGeneralRow);
    info2.appendChild(driveHealthRow);
    general.appendChild(info2);
    tabContents.push(general);
    wrap.appendChild(general);

    // Device Manager tab
    var devMgr = document.createElement('div');
    devMgr.className = 'sysprops-content';
    devMgr.style.display = 'none';
    var tree = document.createElement('div');
    tree.className = 'sysprops-tree';
    var onlineItem = document.createElement('div');
    var aiRuntimeItem = document.createElement('div');
    var aiModelItem = document.createElement('div');
    var healthTreeItem = document.createElement('div');
    var treeData = [
      ['\u{1F4C1} Computer', ''],
      ['\u{1F4C1} Display adapters', 'indent'],
      ['\u{1F5A5}\uFE0F ' + gpuInfo.renderer, 'indent2'],
      ['\u{1F4D1} Vendor: ' + gpuInfo.vendor, 'indent2'],
      ['\u{1F4C1} Processors', 'indent'],
      ['\u2699\uFE0F Browser exposes ' + (browserCores || '?') + ' logical cores', 'indent2'],
      ['\u{1F4C1} Memory devices', 'indent'],
      ['\u{1F4BE} Approx. ' + browserMemory + ' GB device memory', 'indent2'],
      ['\u{1F4C1} Runtime Services', 'indent'],
      ['\u{1F9E0} WebGL renderer active', 'indent2'],
      ['\u{269B}\uFE0F JavaScript engine active in ' + browserBrand, 'indent2'],
      ['\u{1F9E0} Local AI runtime: checking...', 'indent2'],
      ['\u{1F4E6} Local AI model: checking...', 'indent2'],
      ['\u{1F6E0}\uFE0F Drive health: checking...', 'indent2'],
      ['\u{1F4C1} Network adapters', 'indent'],
      ['\u{1F310} ' + (navigator.onLine ? 'Online' : 'Offline') + ' browser session', 'indent2'],
    ];
    treeData.forEach(function(item) {
      var el = document.createElement('div');
      el.className = 'sysprops-tree-item' + (item[1] ? ' ' + item[1] : '');
      el.textContent = item[0];
      if (item[0].indexOf('browser session') !== -1) onlineItem = el;
      if (item[0].indexOf('Local AI runtime:') !== -1) aiRuntimeItem = el;
      if (item[0].indexOf('Local AI model:') !== -1) aiModelItem = el;
      if (item[0].indexOf('Drive health:') !== -1) healthTreeItem = el;
      tree.appendChild(el);
    });
    devMgr.appendChild(tree);
    tabContents.push(devMgr);
    wrap.appendChild(devMgr);

    // Performance tab
    var perf = document.createElement('div');
    perf.className = 'sysprops-content';
    perf.style.display = 'none';
    var perfDiv = document.createElement('div');
    perfDiv.className = 'sysprops-perf';

    var perfRows = [
      ['JS Heap:', '', '', ''],
      ['Device RAM:', '', '', 'gpu'],
      ['CPU Activity:', '', '', 'cpu'],
      ['GPU/Compositor:', '', '', 'gpu'],
      ['System Health:', '', '', 'health'],
    ];
    var perfBindings = [];
    perfRows.forEach(function(p) {
      var item = document.createElement('div');
      item.className = 'sysprops-perf-item';
      var label = document.createElement('span');
      label.className = 'sysprops-perf-label';
      label.textContent = p[0];
      var barWrap = document.createElement('div');
      barWrap.className = 'sysprops-perf-bar';
      var fill = document.createElement('div');
      fill.className = 'sysprops-perf-fill' + (p[3] ? ' ' + p[3] : '');
      fill.style.width = '0%';
      barWrap.appendChild(fill);
      var val = document.createElement('span');
      val.className = 'sysprops-perf-val';
      val.textContent = '';
      item.appendChild(label);
      item.appendChild(barWrap);
      item.appendChild(val);
      perfDiv.appendChild(item);
      perfBindings.push({ fill: fill, val: val, label: p[0] });
    });
    perf.appendChild(perfDiv);

    var perfNote = document.createElement('div');
    perfNote.className = 'sysprops-perf-note';
    perfNote.textContent = 'Live browser metrics. Memory and CPU are browser estimates; GPU details depend on WebGL support.';
    perf.appendChild(perfNote);
    tabContents.push(perf);
    wrap.appendChild(perf);

    var lastTick = performance.now();
    var loopLag = 0;
    var rafDelta = 16;
    var rafId = null;
    var perfTimer = null;

    function rafLoop(ts) {
      rafDelta = ts - lastTick;
      lastTick = ts;
      rafId = requestAnimationFrame(rafLoop);
    }
    rafId = requestAnimationFrame(rafLoop);

    function refreshAiStatus() {
      if (!window.Win95OS || typeof window.Win95OS.getLocalAiStatus !== 'function') return;
      window.Win95OS.getLocalAiStatus().then(function(status) {
        aiStatus = status || aiStatus;
        aiGeneralRow.textContent = status.available
          ? 'Local AI runtime: online (' + (status.activeModel || status.configuredModel || 'model unknown') + ')'
          : 'Local AI runtime: offline (' + (status.error || 'unavailable') + ')';
        aiRuntimeItem.textContent = status.available
          ? '\u{1F9E0} Local AI runtime online at ' + status.endpoint
          : '\u{1F9E0} Local AI runtime offline';
        aiModelItem.textContent = status.available
          ? '\u{1F4E6} Local AI model: ' + (status.activeModel || status.configuredModel || 'unknown') + ' (' + status.modelCount + ' installed)'
          : '\u{1F4E6} Local AI model: ' + (status.configuredModel || 'unknown') + ' (not reachable)';
      }).catch(function(err) {
        var message = err && err.message ? err.message : 'unavailable';
        aiGeneralRow.textContent = 'Local AI runtime: offline (' + message + ')';
        aiRuntimeItem.textContent = '\u{1F9E0} Local AI runtime offline';
        aiModelItem.textContent = '\u{1F4E6} Local AI model: unknown';
      });
    }
    refreshAiStatus();

    perfTimer = setInterval(function() {
      if (!wrap.isConnected) {
        clearInterval(perfTimer);
        if (rafId) cancelAnimationFrame(rafId);
        return;
      }

      var now = performance.now();
      loopLag = Math.max(0, now - lastTick - 16);

      var heapUsed = performance && performance.memory ? performance.memory.usedJSHeapSize / (1024 * 1024 * 1024) : 0;
      var heapLimit = performance && performance.memory ? performance.memory.jsHeapSizeLimit / (1024 * 1024 * 1024) : 4;
      var heapPct = performance && performance.memory ? clamp((heapUsed / Math.max(heapLimit, 0.1)) * 100, 0, 100) : 0;

      var devRamUsed = clamp(heapUsed * 1.35, 0, browserMemory);
      var devRamPct = clamp((devRamUsed / Math.max(browserMemory, 0.1)) * 100, 0, 100);

      var cpuPct = clamp((loopLag * 7) + (Math.abs(rafDelta - 16.7) * 4), 1, 100);
      var gpuPct = clamp((Math.abs(rafDelta - 16.7) * 5) + (heapPct * 0.22), 2, 100);
      var healthApi = window.__WIN95_SYSTEM_HEALTH || null;
      var healthState = healthApi && typeof healthApi.getState === 'function'
        ? healthApi.getState()
        : { score: 75, fragmentation: 0, errors: 0, junk: 0 };
      var healthScore = clamp(healthState.score, 0, 100);

      perfBindings[0].fill.style.width = heapPct + '%';
      perfBindings[0].val.textContent = formatGb(heapUsed) + ' / ' + formatGb(heapLimit);

      perfBindings[1].fill.style.width = devRamPct + '%';
      perfBindings[1].val.textContent = formatGb(devRamUsed) + ' / ' + formatGb(browserMemory);

      perfBindings[2].fill.style.width = cpuPct + '%';
      perfBindings[2].val.textContent = Math.round(cpuPct) + '% browser activity';

      perfBindings[3].fill.style.width = gpuPct + '%';
      perfBindings[3].val.textContent = Math.round(gpuPct) + '% compositor estimate';

      perfBindings[4].fill.style.width = healthScore + '%';
      perfBindings[4].val.textContent = String(healthScore) + '% healthy';

      if (onlineItem) {
        onlineItem.textContent = '\u{1F310} ' + (navigator.onLine ? 'Online' : 'Offline') + ' browser session';
      }
      if (driveHealthRow) {
        driveHealthRow.textContent = 'System health: ' + healthScore + '% (' + healthState.fragmentation + '% fragmented, ' + healthState.errors + ' errors, ' + healthState.junk + '% junk)';
      }
      if (healthTreeItem) {
        healthTreeItem.textContent = '\u{1F6E0}\uFE0F Drive health: ' + healthScore + '%';
      }

      if (Math.random() < 0.2) {
        refreshAiStatus();
      }
    }, 900);

    var btnRow = document.createElement('div');
    btnRow.className = 'sysprops-btn-row';
    var okBtn = document.createElement('button');
    okBtn.className = 'sysprops-ok';
    okBtn.textContent = 'OK';
    var cancelBtn = document.createElement('button');
    cancelBtn.className = 'sysprops-cancel';
    cancelBtn.textContent = 'Cancel';
    okBtn.addEventListener('click', function() { var wm = getWM(); if (wm) wm.closeWindow('sysprops'); });
    cancelBtn.addEventListener('click', function() { var wm = getWM(); if (wm) wm.closeWindow('sysprops'); });
    btnRow.appendChild(okBtn);
    btnRow.appendChild(cancelBtn);
    wrap.appendChild(btnRow);

    return wrap;
  }

  // ─── WINAMP ──────────────────────────────────────

  var parts = window.Win95ExtrasParts = window.Win95ExtrasParts || {};
  parts.createSystemProperties = createSystemProperties;
})();
