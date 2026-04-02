// Win95 extras: MSN Messenger app
(function() {
  'use strict';

  function getAudioCtx() {
    return window._win95AudioCtx ? window._win95AudioCtx() : new (window.AudioContext || window.webkitAudioContext)();
  }

  function runDialupAnim(bar, dialup, onComplete) {
    var progress = 0;
    bar.style.width = '0%';
    var iv = setInterval(function() {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(iv);
        setTimeout(function() {
          dialup.style.display = 'none';
          if (typeof onComplete === 'function') onComplete();
        }, 300);
      }
      bar.style.width = progress + '%';
    }, 400);
  }

  function playDialupSound() {
    try {
      var ctx = getAudioCtx();
      var now = ctx.currentTime;
      var gain = ctx.createGain();
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.linearRampToValueAtTime(0, now + 3);

      [350, 440, 480, 620, 950, 1400, 1800, 2100, 1200, 980].forEach(function(freq, i) {
        var osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now + i * 0.15);
        osc.frequency.linearRampToValueAtTime(freq + 200, now + i * 0.15 + 0.1);
        osc.connect(gain);
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.12);
      });

      var noise = ctx.createOscillator();
      noise.type = 'sawtooth';
      noise.frequency.setValueAtTime(100, now + 1.5);
      noise.frequency.linearRampToValueAtTime(8000, now + 2.5);
      noise.frequency.linearRampToValueAtTime(2000, now + 3);
      var noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.setValueAtTime(0.03, now + 1.5);
      noiseGain.gain.linearRampToValueAtTime(0, now + 3.2);
      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now + 1.5);
      noise.stop(now + 3.2);
    } catch(e) {}
  }

  // ─── MSN MESSENGER ───────────────────────────────
  function createMSNMessenger() {
    var wrap = document.createElement('div');
    wrap.className = 'msn-app';

    var buddies = [
      {
        name: 'Jensen Huang',
        statusMsg: 'CUDA all the things',
        conversation: [
          { from: 'Jensen Huang', text: 'Hey! Did you see the latest Blackwell benchmarks?' },
          { from: 'you', text: 'Yes! The GB200 is insane for AI inference.' },
          { from: 'Jensen Huang', text: 'We went from 8 TFLOPS on Maxwell to 20,000 on Blackwell. 2500x in 10 years.' },
          { from: 'you', text: 'And now even consumer GPUs like the 4070 Ti SUPER can run capable local models.' },
          { from: 'Jensen Huang', text: 'The democratization of AI compute is the most important trend in tech.' },
          { from: 'you', text: 'Local inference is making the cloud optional for a lot of use cases.' },
          { from: 'Jensen Huang', text: 'Accelerated computing on every desk. That has been our vision since day one.' },
        ]
      },
      {
        name: 'Geoffrey Hinton',
        statusMsg: 'Backprop forever',
        conversation: [
          { from: 'Geoffrey Hinton', text: 'I have been thinking about quantization techniques again.' },
          { from: 'you', text: 'Like GPTQ and AWQ? They are incredible for local deployment.' },
          { from: 'Geoffrey Hinton', text: 'Compressing 16-bit to 4-bit with barely any quality loss validates the redundancy hypothesis.' },
          { from: 'you', text: 'Dettmers LLM.int8() showed zero degradation at 8-bit.' },
          { from: 'Geoffrey Hinton', text: 'And LoRA! Training a few million parameters instead of billions. Remarkable efficiency.' },
          { from: 'you', text: 'A student with one GPU can fine-tune models that used to need a data center.' },
          { from: 'Geoffrey Hinton', text: 'That is the real revolution. Not the models, but who gets to use them.' },
        ]
      },
      {
        name: 'Fei-Fei Li',
        statusMsg: 'Democratize AI',
        conversation: [
          { from: 'Fei-Fei Li', text: 'Your research on local AI aligns with our work at Stanford HAI.' },
          { from: 'you', text: 'Thanks! ImageNet was such a pivotal moment for GPU computing.' },
          { from: 'Fei-Fei Li', text: 'When Krizhevsky used GPUs for AlexNet in 2012, training went from weeks to hours.' },
          { from: 'you', text: 'And now with llama.cpp, people run LLMs on laptops. The access gap is closing.' },
          { from: 'Fei-Fei Li', text: 'AI should be accessible to everyone, not just big tech companies.' },
          { from: 'you', text: 'A $500 GPU can do what cost $50,000 in cloud compute five years ago.' },
          { from: 'Fei-Fei Li', text: 'When researchers and students experiment freely, real innovation happens.' },
        ]
      },
      {
        name: 'Sam Altman',
        statusMsg: 'Ship, learn, iterate',
        conversation: [
          { from: 'Sam Altman', text: 'Big models matter, but product loops matter more.' },
          { from: 'you', text: 'Yeah, fast iteration beats perfect planning.' },
          { from: 'Sam Altman', text: 'Exactly. Build the thing users touch every day.' },
          { from: 'you', text: 'We are making AI feel native on this OS UI.' },
          { from: 'Sam Altman', text: 'That is the right move. The interface is the product.' },
          { from: 'you', text: 'Local + cloud fallback has been a good setup too.' },
          { from: 'Sam Altman', text: 'Hybrid stacks are practical. Reliability wins trust.' }
        ]
      },
      {
        name: 'Lisa Su',
        statusMsg: 'Performance per watt',
        conversation: [
          { from: 'Lisa Su', text: 'Efficiency is the real unlock for wider AI adoption.' },
          { from: 'you', text: 'Especially for students using laptops and mini PCs.' },
          { from: 'Lisa Su', text: 'Exactly. Better perf-per-watt means more people can run models.' },
          { from: 'you', text: 'Edge inference keeps latency low too.' },
          { from: 'Lisa Su', text: 'And it lowers cloud spend. Teams move faster with lower burn.' },
          { from: 'you', text: 'Cheaper experimentation means better ideas get tested.' },
          { from: 'Lisa Su', text: 'That is how ecosystems grow: accessible compute everywhere.' }
        ]
      },
      {
        name: 'Andrej Karpathy',
        statusMsg: 'Tokens are the new UI',
        conversation: [
          { from: 'Andrej Karpathy', text: 'Prompt UX is becoming a first-class interface layer.' },
          { from: 'you', text: 'Yeah, people are basically programming in plain language now.' },
          { from: 'Andrej Karpathy', text: 'Right, but tooling still needs guardrails and observability.' },
          { from: 'you', text: 'We added safer defaults and protected system files.' },
          { from: 'Andrej Karpathy', text: 'Good. Reliability > novelty for daily use systems.' },
          { from: 'you', text: 'Also trying to keep interactions fun but deterministic.' },
          { from: 'Andrej Karpathy', text: 'That balance is hard and worth doing.' }
        ]
      },
    ];

    var buddyList = document.createElement('div');
    buddyList.className = 'msn-buddy-list';
    buddyList.style.display = 'none';

    var msnHeader = document.createElement('div');
    msnHeader.className = 'msn-header';
    var msnLogo = document.createElement('span');
    msnLogo.className = 'msn-logo';
    msnLogo.textContent = '\u{1F98B}';
    var msnTitle = document.createElement('span');
    msnTitle.textContent = 'MSN Messenger';
    msnHeader.appendChild(msnLogo);
    msnHeader.appendChild(msnTitle);
    buddyList.appendChild(msnHeader);

    var myStatus = document.createElement('div');
    myStatus.className = 'msn-my-status';
    var myDot = document.createElement('span');
    myDot.className = 'msn-status-dot online';
    var myName = document.createElement('span');
    myName.textContent = 'Josue (Online)';
    myStatus.appendChild(myDot);
    myStatus.appendChild(myName);
    buddyList.appendChild(myStatus);

    var searchWrap = document.createElement('div');
    searchWrap.style.cssText = 'padding:6px 10px;background:#f3f6ff;border-bottom:1px solid #d1d8e8;';
    var searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Find contact...';
    searchInput.style.cssText = 'width:100%;box-sizing:border-box;padding:4px 6px;border:1px solid #9aa7c4;background:#fff;font-family:Arial,sans-serif;font-size:11px;';
    searchWrap.appendChild(searchInput);
    buddyList.appendChild(searchWrap);

    var onlineSection = document.createElement('div');
    onlineSection.className = 'msn-section';
    var onlineHeader = document.createElement('div');
    onlineHeader.className = 'msn-section-header';
    onlineHeader.textContent = 'Online (0)';
    onlineSection.appendChild(onlineHeader);
    var allRows = [];

    buddies.forEach(function(buddy) {
      var row = document.createElement('div');
      row.className = 'msn-buddy';
      var dot = document.createElement('span');
      dot.className = 'msn-status-dot online';
      var nameSpan = document.createElement('span');
      nameSpan.className = 'msn-buddy-name';
      nameSpan.textContent = buddy.name;
      var msgSpan = document.createElement('span');
      msgSpan.className = 'msn-buddy-msg';
      msgSpan.textContent = buddy.statusMsg;
      row.appendChild(dot);
      row.appendChild(nameSpan);
      row.appendChild(msgSpan);
      row.addEventListener('click', function() {
        buddyList.querySelectorAll('.msn-buddy').forEach(function(b) { b.classList.remove('selected'); });
        row.classList.add('selected');
        openChat(buddy);
      });
      onlineSection.appendChild(row);
      allRows.push({ row: row, online: true, name: buddy.name });
    });
    buddyList.appendChild(onlineSection);

    var offlineSection = document.createElement('div');
    offlineSection.className = 'msn-section';
    var offlineHeader = document.createElement('div');
    offlineHeader.className = 'msn-section-header';
    offlineHeader.textContent = 'Offline (0)';
    offlineSection.appendChild(offlineHeader);

    ['Yann LeCun', 'Andrew Ng', 'Demis Hassabis'].forEach(function(name) {
      var row = document.createElement('div');
      row.className = 'msn-buddy offline';
      var dot = document.createElement('span');
      dot.className = 'msn-status-dot';
      var nameSpan = document.createElement('span');
      nameSpan.className = 'msn-buddy-name';
      nameSpan.textContent = name;
      row.appendChild(dot);
      row.appendChild(nameSpan);
      offlineSection.appendChild(row);
      allRows.push({ row: row, online: false, name: name });
    });
    buddyList.appendChild(offlineSection);

    function refreshBuddyVisibility() {
      var query = String(searchInput.value || '').trim().toLowerCase();
      var onlineVisible = 0;
      var offlineVisible = 0;
      allRows.forEach(function(entry) {
        var matches = !query || entry.name.toLowerCase().indexOf(query) !== -1;
        entry.row.style.display = matches ? 'flex' : 'none';
        if (!matches) return;
        if (entry.online) onlineVisible++;
        else offlineVisible++;
      });
      onlineHeader.textContent = 'Online (' + onlineVisible + ')';
      offlineHeader.textContent = 'Offline (' + offlineVisible + ')';
      onlineSection.style.display = onlineVisible > 0 ? 'block' : 'none';
      offlineSection.style.display = offlineVisible > 0 ? 'block' : 'none';
    }
    searchInput.addEventListener('input', refreshBuddyVisibility);
    refreshBuddyVisibility();

    wrap.appendChild(buddyList);

    var dialup = document.createElement('div');
    dialup.className = 'msn-dialup';
    dialup.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;padding:18px;box-sizing:border-box;background:linear-gradient(180deg,#061538,#0c2f75 45%,#123f96);color:#fff;font-family:var(--font-pixel);';
    var dialupTitle = document.createElement('div');
    dialupTitle.style.cssText = 'font-size:9px;letter-spacing:0.08em;margin-bottom:8px;';
    dialupTitle.textContent = 'MSN Messenger - Signing In';
    var dialupStatus = document.createElement('div');
    dialupStatus.style.cssText = 'font-size:8px;opacity:0.95;margin-bottom:10px;';
    dialupStatus.textContent = 'Dialing up...';
    var dialupBarOuter = document.createElement('div');
    dialupBarOuter.style.cssText = 'width:100%;height:12px;border:2px inset #99b6f2;background:#04102e;';
    var dialupBar = document.createElement('div');
    dialupBar.style.cssText = 'height:100%;width:0%;background:linear-gradient(90deg,#67f2ff,#4dd5ff,#6ba6ff);';
    dialupBarOuter.appendChild(dialupBar);
    dialup.appendChild(dialupTitle);
    dialup.appendChild(dialupStatus);
    dialup.appendChild(dialupBarOuter);
    wrap.appendChild(dialup);

    var chatArea = document.createElement('div');
    chatArea.className = 'msn-chat-area';
    chatArea.style.display = 'none';
    wrap.appendChild(chatArea);

    var statusMessages = ['Available', 'Coding', 'Listening to music', 'Do not disturb'];
    var statusIdx = 0;
    setInterval(function() {
      statusIdx = (statusIdx + 1) % statusMessages.length;
      myName.textContent = 'Josue (' + statusMessages[statusIdx] + ')';
    }, 4800);

    function openChat(buddy) {
      chatArea.style.display = 'flex';
      chatArea.textContent = '';

      var chatHeader = document.createElement('div');
      chatHeader.className = 'msn-chat-header';
      var chatTitle = document.createElement('span');
      chatTitle.textContent = buddy.name + ' - Conversation';
      var backBtn = document.createElement('button');
      backBtn.className = 'msn-chat-back';
      backBtn.textContent = 'Back';
      backBtn.addEventListener('click', function() {
        chatArea.style.display = 'none';
        buddyList.style.display = 'flex';
      });
      chatHeader.appendChild(chatTitle);
      chatHeader.appendChild(backBtn);
      chatArea.appendChild(chatHeader);

      var messages = document.createElement('div');
      messages.className = 'msn-messages';
      chatArea.appendChild(messages);

      buddyList.style.display = 'none';
      playMSNSound();

      var msgIdx = 0;
      function stampNow() {
        var d = new Date();
        var hh = String(d.getHours()).padStart(2, '0');
        var mm = String(d.getMinutes()).padStart(2, '0');
        return hh + ':' + mm;
      }
      function showNext() {
        if (msgIdx >= buddy.conversation.length) return;
        var msg = buddy.conversation[msgIdx];
        var isMe = msg.from === 'you';

        if (!isMe) {
          var typing = document.createElement('div');
          typing.className = 'msn-typing';
          typing.textContent = buddy.name + ' is typing...';
          messages.appendChild(typing);
          messages.scrollTop = messages.scrollHeight;
          playTypingSound();

          setTimeout(function() {
            typing.remove();
            addMsg(msg, false);
            msgIdx++;
            setTimeout(showNext, 800 + Math.random() * 1200);
          }, 1000 + Math.random() * 500);
        } else {
          addMsg(msg, true);
          msgIdx++;
          setTimeout(showNext, 400);
        }
      }

      function addMsg(msg, isMe) {
        var el = document.createElement('div');
        el.className = 'msn-msg' + (isMe ? ' msn-msg-me' : '');
        var fromSpan = document.createElement('span');
        fromSpan.className = 'msn-msg-from';
        fromSpan.textContent = (isMe ? 'Josue' : msg.from) + ' says [' + stampNow() + ']:';
        var textSpan = document.createElement('span');
        textSpan.className = 'msn-msg-text';
        textSpan.textContent = msg.text;
        el.appendChild(fromSpan);
        el.appendChild(textSpan);
        messages.appendChild(el);
        messages.scrollTop = messages.scrollHeight;
        if (!isMe) playIncomingMessageSound();
      }

      var compose = document.createElement('div');
      compose.style.cssText = 'display:flex;gap:6px;padding:8px;border-top:1px solid #d9d9df;background:#f0f3fb;';
      var input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Type a message...';
      input.style.cssText = 'flex:1;min-width:0;padding:4px 6px;border:1px solid #8da0c8;font-size:11px;font-family:Arial,sans-serif;';
      var sendBtn = document.createElement('button');
      sendBtn.type = 'button';
      sendBtn.textContent = 'Send';
      sendBtn.style.cssText = 'padding:4px 10px;border:1px solid #6e7ea8;background:#dfe7fb;font-family:var(--font-pixel);font-size:7px;cursor:pointer;';
      var nudgeBtn = document.createElement('button');
      nudgeBtn.type = 'button';
      nudgeBtn.textContent = 'Nudge';
      nudgeBtn.style.cssText = 'padding:4px 8px;border:1px solid #8b6a56;background:#f8e5d8;font-family:var(--font-pixel);font-size:7px;cursor:pointer;';
      compose.appendChild(input);
      compose.appendChild(sendBtn);
      compose.appendChild(nudgeBtn);
      chatArea.appendChild(compose);

      function sendMessage() {
        var text = String(input.value || '').trim();
        if (!text) return;
        addMsg({ from: 'you', text: text }, true);
        playMSNSound();
        input.value = '';
        input.focus();
      }
      sendBtn.addEventListener('click', sendMessage);
      input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') sendMessage();
      });
      nudgeBtn.addEventListener('click', function() {
        playNudgeSound();
        chatArea.animate(
          [
            { transform: 'translateX(0px)' },
            { transform: 'translateX(-5px)' },
            { transform: 'translateX(5px)' },
            { transform: 'translateX(-3px)' },
            { transform: 'translateX(0px)' }
          ],
          { duration: 220, iterations: 1 }
        );
      });

      setTimeout(showNext, 500);
      setTimeout(function() { input.focus(); }, 50);
    }

    function playMSNSound() {
      try {
        var ctx = getAudioCtx();
        var now = ctx.currentTime;
        [523, 659, 784].forEach(function(freq, i) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.12);
          gain.gain.setValueAtTime(0.12, now + i * 0.12);
          gain.gain.linearRampToValueAtTime(0, now + i * 0.12 + 0.3);
          osc.start(now + i * 0.12);
          osc.stop(now + i * 0.12 + 0.3);
        });
      } catch(e) {}
    }

    function playTypingSound() {
      try {
        var ctx = getAudioCtx();
        var now = ctx.currentTime;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(1800, now);
        osc.frequency.linearRampToValueAtTime(1300, now + 0.06);
        gain.gain.setValueAtTime(0.012, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.07);
      } catch (e) {}
    }

    function playIncomingMessageSound() {
      try {
        var ctx = getAudioCtx();
        var now = ctx.currentTime;
        [880, 1175].forEach(function(freq, i) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + (i * 0.09));
          gain.gain.setValueAtTime(0.045, now + (i * 0.09));
          gain.gain.exponentialRampToValueAtTime(0.0001, now + (i * 0.09) + 0.14);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + (i * 0.09));
          osc.stop(now + (i * 0.09) + 0.14);
        });
      } catch (e) {}
    }

    function playNudgeSound() {
      try {
        var ctx = getAudioCtx();
        var now = ctx.currentTime;
        [420, 520, 620].forEach(function(freq, i) {
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + i * 0.06);
          gain.gain.setValueAtTime(0.04, now + i * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.06 + 0.08);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.06);
          osc.stop(now + i * 0.06 + 0.08);
        });
      } catch (e) {}
    }

    playDialupSound();
    runDialupAnim(dialupBar, dialup, function() {
      dialupStatus.textContent = 'Connected at 56.6 kbps';
      buddyList.style.display = 'flex';
      playMSNSound();
    });

    return wrap;
  }

  // ─── SHUTDOWN SEQUENCE ───────────────────────────

  var parts = window.Win95ExtrasParts = window.Win95ExtrasParts || {};
  parts.createMSNMessenger = createMSNMessenger;
})();
