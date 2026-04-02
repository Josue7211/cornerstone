(function() {
  'use strict';
  var list = window.SteamGameDefs = window.SteamGameDefs || [];
  for (var i = list.length - 1; i >= 0; i--) if (list[i].id === 'pioneer_profiles') list.splice(i, 1);
  list.push({
    id: 'pioneer_profiles',
    category: 'experience',
    title: 'Experience: Pioneer Profiles',
    genre: 'Interactive',
    icon: 'icon:gameProfiles',
    banner: '#1a0a1a',
    desc: 'Meet the pioneers who shaped AI hardware. From Jensen Huang to Ilya Sutskever — the people behind the silicon revolution.',
    tags: ['Educational', 'Profiles', 'AI'],
    size: '0.3 MB',
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
        topBar.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border:1px solid #4b2346;background:linear-gradient(180deg,#221027,#140916);margin-bottom:14px;border-radius:4px;';
        var topLeft = document.createElement('div');
        var topTitle = document.createElement('div');
        topTitle.style.cssText = 'font-family:"Press Start 2P",monospace;font-size:11px;color:#ff9fe6;letter-spacing:.05em;';
        topTitle.textContent = 'BIG PICTURE · PROFILES';
        var topSub = document.createElement('div');
        topSub.style.cssText = 'margin-top:6px;font-size:12px;color:#c8a9c0;';
        topSub.textContent = 'People behind modern AI hardware and local inference';
        topLeft.appendChild(topTitle);
        topLeft.appendChild(topSub);
        var hint = document.createElement('div');
        hint.style.cssText = 'font-size:11px;color:#f2c9e8;background:#2a1227;border:1px solid #5f2c56;padding:6px 10px;';
        hint.textContent = 'Read each profile as: bet made -> ecosystem impact';
        topBar.appendChild(topLeft);
        topBar.appendChild(hint);
        page.appendChild(topBar);
      }
      var pioneers = [
        { name: 'Jensen Huang', role: 'CEO of NVIDIA', contribution: 'Created the GPU industry. Bet NVIDIA\'s future on CUDA for general computing. Made AI hardware accessible to everyone from researchers to gamers.', color: '#76b900' },
        { name: 'Alex Krizhevsky', role: 'AI Researcher', contribution: 'Trained AlexNet on GPUs in 2012, proving deep learning was viable. This single paper redirected the entire AI field toward GPU computing.', color: '#ff6633' },
        { name: 'Ilya Sutskever', role: 'Co-founder of OpenAI', contribution: 'Pioneered scaling laws for neural networks. Showed that larger models on more GPUs lead to emergent capabilities.', color: '#00f0ff' },
        { name: 'Georgi Gerganov', role: 'Open Source Developer', contribution: 'Created llama.cpp — enabling LLMs to run on CPUs and consumer GPUs. Made local AI practical for millions of developers.', color: '#00ff88' },
        { name: 'Tim Dettmers', role: 'ML Researcher', contribution: 'Developed LLM.int8() and bitsandbytes. Made 4-bit quantization practical, helping much larger models run on consumer hardware.', color: '#ffee00' },
        { name: 'Edward Hu', role: 'ML Researcher', contribution: 'Created LoRA (Low-Rank Adaptation). Enabled fine-tuning large models on a single consumer GPU instead of expensive clusters.', color: '#ff00aa' }
      ];
      var heading = document.createElement('div');
      heading.style.cssText = 'font-family:"Press Start 2P",monospace;font-size:' + (isFullscreen ? '14px' : '10px') + ';color:#ff00aa;margin-bottom:' + (isFullscreen ? '22px' : '16px') + ';text-align:center;';
      heading.textContent = 'PIONEER PROFILES';
      page.appendChild(heading);
      if (isFullscreen) {
        var traits = document.createElement('div');
        traits.style.cssText = 'display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;';
        ['Founders', 'Researchers', 'Open Source Builders'].forEach(function(label) {
          var tag = document.createElement('div');
          tag.style.cssText = 'font-size:11px;color:#d8c7de;background:#171323;border:1px solid #453358;padding:5px 9px;';
          tag.textContent = label;
          traits.appendChild(tag);
        });
        page.appendChild(traits);
      }
      var listWrap = document.createElement('div');
      listWrap.style.cssText = isFullscreen ? 'display:grid;grid-template-columns:1fr 1fr;gap:14px;' : 'display:block;';
      page.appendChild(listWrap);
      pioneers.forEach(function(p) {
        var card = document.createElement('div');
        card.style.cssText = 'margin-bottom:' + (isFullscreen ? '0' : '14px') + ';padding:' + (isFullscreen ? '14px' : '10px') + ';background:#111;border-left:3px solid ' + p.color + ';border-radius:2px;';
        var nameEl = document.createElement('div');
        nameEl.style.cssText = 'font-weight:bold;color:' + p.color + ';margin-bottom:2px;font-size:' + (isFullscreen ? '15px' : '12px') + ';';
        nameEl.textContent = p.name;
        var roleEl = document.createElement('div');
        roleEl.style.cssText = 'font-size:' + (isFullscreen ? '11px' : '9px') + ';color:#8a97ad;margin-bottom:6px;';
        roleEl.textContent = p.role;
        var contribEl = document.createElement('div');
        contribEl.style.cssText = 'color:#c0c9d8;font-size:' + (isFullscreen ? '12px' : '10px') + ';line-height:1.5;';
        contribEl.textContent = p.contribution;
        card.appendChild(nameEl);
        card.appendChild(roleEl);
        card.appendChild(contribEl);
        listWrap.appendChild(card);
      });
      container._gameCleanup = function() {};
    }
  });
})();
