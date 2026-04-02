// Win95 extras: shutdown flow
(function() {
  'use strict';

  function getAudioCtx() {
    return window._win95AudioCtx ? window._win95AudioCtx() : new (window.AudioContext || window.webkitAudioContext)();
  }

  function triggerShutdown() {
    var menu = document.getElementById('startMenu');
    if (menu) menu.classList.remove('visible');

    var overlay = document.createElement('div');
    overlay.className = 'shutdown-overlay';
    var dialog = document.createElement('div');
    dialog.className = 'shutdown-dialog';

    var title = document.createElement('div');
    title.className = 'shutdown-title';
    title.textContent = 'Shut Down Windows';
    dialog.appendChild(title);

    var icon = document.createElement('div');
    icon.className = 'shutdown-icon';
    icon.textContent = '\u{1F5A5}\uFE0F';
    dialog.appendChild(icon);

    var text = document.createElement('div');
    text.className = 'shutdown-text';
    text.textContent = 'What do you want the computer to do?';
    dialog.appendChild(text);

    var options = document.createElement('div');
    options.className = 'shutdown-options';

    var label1 = document.createElement('label');
    label1.className = 'shutdown-option';
    var radio1 = document.createElement('input');
    radio1.type = 'radio';
    radio1.name = 'shutdown';
    radio1.value = 'shutdown';
    radio1.checked = true;
    var span1 = document.createElement('span');
    span1.textContent = 'Shut down';
    label1.appendChild(radio1);
    label1.appendChild(span1);
    options.appendChild(label1);

    var label2 = document.createElement('label');
    label2.className = 'shutdown-option';
    var radio2 = document.createElement('input');
    radio2.type = 'radio';
    radio2.name = 'shutdown';
    radio2.value = 'restart';
    var span2 = document.createElement('span');
    span2.textContent = 'Restart';
    label2.appendChild(radio2);
    label2.appendChild(span2);
    options.appendChild(label2);

    dialog.appendChild(options);

    var buttons = document.createElement('div');
    buttons.className = 'shutdown-buttons';
    var okBtn = document.createElement('button');
    okBtn.className = 'shutdown-btn ok';
    okBtn.textContent = 'OK';
    var cancelBtn = document.createElement('button');
    cancelBtn.className = 'shutdown-btn cancel';
    cancelBtn.textContent = 'Cancel';
    buttons.appendChild(okBtn);
    buttons.appendChild(cancelBtn);
    dialog.appendChild(buttons);

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    cancelBtn.addEventListener('click', function() { overlay.remove(); });

    okBtn.addEventListener('click', function() {
      var action = dialog.querySelector('input[name="shutdown"]:checked').value;
      overlay.remove();
      playShutdownSound();

      var fadeEl = document.createElement('div');
      fadeEl.className = 'shutdown-fade';
      document.body.appendChild(fadeEl);

      setTimeout(function() { fadeEl.classList.add('active'); }, 50);

      setTimeout(function() {
        if (action === 'restart') {
          try { sessionStorage.setItem('boot.autoPowerOn', '1'); } catch (_) {}
          location.reload();
        } else {
          try { sessionStorage.removeItem('boot.autoPowerOn'); } catch (_) {}
          location.reload();
        }
      }, 2000);
    });
  }

  function playShutdownSound() {
    try {
      var ctx = getAudioCtx();
      var now = ctx.currentTime;
      [523, 392, 330, 262].forEach(function(freq, i) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.4);
        gain.gain.setValueAtTime(0.15, now + i * 0.4);
        gain.gain.linearRampToValueAtTime(0.03, now + i * 0.4 + 0.35);
        osc.start(now + i * 0.4);
        osc.stop(now + i * 0.4 + 0.4);
      });
    } catch(e) {}
  }



  var parts = window.Win95ExtrasParts = window.Win95ExtrasParts || {};
  parts.triggerShutdown = triggerShutdown;
})();
