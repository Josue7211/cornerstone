(function() {
  'use strict';
  var list = window.SteamGameDefs = window.SteamGameDefs || [];
  for (var i = list.length - 1; i >= 0; i--) if (list[i].id === 'hw_timeline') list.splice(i, 1);
  list.push({
    id: 'hw_timeline',
    category: 'experience',
    title: 'Experience: Hardware Timeline',
    genre: 'Interactive',
    icon: 'icon:gameTimeline',
    banner: '#1a1a0a',
    desc: 'Explore the evolution of AI hardware from 1999 to 2026. From the GeForce 256 to the RTX 5090 — see how gaming GPUs became AI supercomputers.',
    tags: ['Educational', 'History', 'Interactive'],
    size: '0.4 MB',
    requiresInstall: false,
    alwaysInstalled: true,
    launcher: function(container) {
      var hostWin = container.closest ? container.closest('.win95-window') : null;
      var isFullscreen = !!(hostWin && hostWin.dataset.maximized === 'true');
      container.textContent = '';
      container.style.cssText = 'background:#0a0a14;height:100%;overflow-y:auto;padding:' + (isFullscreen ? '24px' : '16px') + ';color:#e0e0f0;font-family:"Space Mono",monospace;';
      var page = document.createElement('div');
      page.style.cssText = 'max-width:' + (isFullscreen ? '1140px' : '860px') + ';margin:0 auto;';
      container.appendChild(page);
      if (isFullscreen) {
        var topBar = document.createElement('div');
        topBar.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border:1px solid #3f3b1d;background:linear-gradient(180deg,#25210d,#151308);margin-bottom:14px;border-radius:4px;';
        var topLeft = document.createElement('div');
        var topTitle = document.createElement('div');
        topTitle.style.cssText = 'font-family:"Press Start 2P",monospace;font-size:11px;color:#ffef8d;letter-spacing:.05em;';
        topTitle.textContent = 'BIG PICTURE · TIMELINE VIEW';
        var topSub = document.createElement('div');
        topSub.style.cssText = 'margin-top:6px;font-size:12px;color:#c6c09f;';
        topSub.textContent = 'GPU history from gaming silicon to AI infrastructure';
        topLeft.appendChild(topTitle);
        topLeft.appendChild(topSub);
        var eraHint = document.createElement('div');
        eraHint.style.cssText = 'font-size:11px;color:#e4dcae;background:#2c260d;border:1px solid #5a5020;padding:6px 10px;';
        eraHint.textContent = 'Era density: 1999-2012 foundation · 2016-2026 acceleration';
        topBar.appendChild(topLeft);
        topBar.appendChild(eraHint);
        page.appendChild(topBar);
      }
      var events = [
        { year: '1999', name: 'GeForce 256', desc: 'NVIDIA coins "GPU". First dedicated graphics processing unit. 32-bit color, hardware T&L.' },
        { year: '2006', name: 'CUDA Launched', desc: 'NVIDIA releases CUDA, enabling general-purpose GPU computing. Scientists start using GPUs for math.' },
        { year: '2012', name: 'AlexNet Wins ImageNet', desc: 'Krizhevsky trains CNN on dual GTX 580 GPUs. Proves deep learning on GPUs works. AI revolution begins.' },
        { year: '2016', name: 'Pascal / GTX 1080', desc: 'Consumer GPUs reach 8.9 TFLOPS. Researchers train models on gaming hardware for the first time.' },
        { year: '2017', name: 'Transformers Paper', desc: '"Attention Is All You Need" — the architecture behind ChatGPT, LLaMA, and every modern LLM.' },
        { year: '2020', name: 'RTX 3090 / Ampere', desc: '24GB VRAM, 35.6 TFLOPS. Enough to train and run medium-sized AI models locally.' },
        { year: '2022', name: 'LLM.int8() / LoRA', desc: 'Quantization and efficient fine-tuning. Large models suddenly fit on consumer GPUs.' },
        { year: '2023', name: 'LLaMA / Ollama', desc: 'Meta open-sources LLaMA. Ollama makes running LLMs locally as easy as a single command.' },
        { year: '2024', name: 'RTX 4070 Ti SUPER', desc: '16GB VRAM, 44 TFLOPS. Strong for local 7B-14B models with quantization. Cloud computing officially has competition.' },
        { year: '2026', name: 'RTX 5090 / Blackwell', desc: '32GB VRAM, 100+ TFLOPS. The gap between local and cloud AI narrows to nearly zero.' }
      ];
      var heading = document.createElement('div');
      heading.style.cssText = 'font-family:"Press Start 2P",monospace;font-size:' + (isFullscreen ? '14px' : '10px') + ';color:#ffee00;margin-bottom:' + (isFullscreen ? '22px' : '16px') + ';text-align:center;';
      heading.textContent = 'HARDWARE TIMELINE: 1999 - 2026';
      page.appendChild(heading);
      if (isFullscreen) {
        var legend = document.createElement('div');
        legend.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;';
        [['#00f0ff', 'Hardware'], ['#00ff88', 'Software/AI Shift']].forEach(function(item) {
          var chip = document.createElement('div');
          chip.style.cssText = 'display:inline-flex;align-items:center;gap:8px;font-size:11px;color:#bdc7d6;background:#101826;border:1px solid #2b3a55;padding:5px 9px;';
          var dot = document.createElement('span');
          dot.style.cssText = 'width:10px;height:10px;display:inline-block;background:' + item[0] + ';';
          chip.appendChild(dot);
          chip.appendChild(document.createTextNode(item[1]));
          legend.appendChild(chip);
        });
        page.appendChild(legend);
      }
      var listWrap = document.createElement('div');
      listWrap.style.cssText = isFullscreen ? 'display:grid;grid-template-columns:1fr 1fr;gap:14px;' : 'display:block;';
      page.appendChild(listWrap);
      events.forEach(function(e, idx) {
        var color = idx % 2 === 0 ? '#00f0ff' : '#00ff88';
        var row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:12px;margin-bottom:' + (isFullscreen ? '0' : '14px') + ';padding:' + (isFullscreen ? '12px' : '8px') + ';background:#111;border-left:3px solid ' + color + ';border-radius:2px;';
        var yearEl = document.createElement('div');
        yearEl.style.cssText = 'min-width:' + (isFullscreen ? '58px' : '50px') + ';color:' + color + ';font-weight:bold;font-size:' + (isFullscreen ? '14px' : '11px') + ';';
        yearEl.textContent = e.year;
        var infoEl = document.createElement('div');
        var nameEl = document.createElement('div');
        nameEl.style.cssText = 'font-weight:bold;margin-bottom:4px;font-size:' + (isFullscreen ? '15px' : '12px') + ';';
        nameEl.textContent = e.name;
        var descEl = document.createElement('div');
        descEl.style.cssText = 'color:#b8c3d1;font-size:' + (isFullscreen ? '12px' : '10px') + ';line-height:1.5;';
        descEl.textContent = e.desc;
        infoEl.appendChild(nameEl);
        infoEl.appendChild(descEl);
        row.appendChild(yearEl);
        row.appendChild(infoEl);
        listWrap.appendChild(row);
      });
      container._gameCleanup = function() {};
    }
  });
})();
