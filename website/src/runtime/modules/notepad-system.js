import { createClippyAssistant } from './clippy-assistant.js?v=clippyfix5';

export function createNotepadSystem(deps = {}) {
  const wm = deps.wm;
  const animateWindowOpen = deps.animateWindowOpen || (() => {});
  const mediaWindows = deps.mediaWindows;
  const getClippyAiConfig = deps.getClippyAiConfig || (() => ({ model: 'FieldMouse-AI/qwen3.5:0.8b-Q4_K_M' }));
  const queryClippyOllama = deps.queryClippyOllama || (async () => ({ text: '', model: 'fallback' }));
  const setWindowTitle = deps.setWindowTitle || (() => {});
  const getAppConfig = deps.getAppConfig || (() => ({}));
  const DEFAULT_NOTEPAD_TEXT = 'Start typing or open a document from the explorer.';
  const BONZI_FILE_REACTIONS = {
    'chatgpt_audit_log.txt': 'That section 3 part. That was me.',
    'hinton_letter_draft.txt': 'He hasn\'t responded.',
    'clippy_suggestions.txt': 'Clippy is not to be trusted.',
    'why_jensen_wears_leather.txt': 'I\'ve been looking into this as well.',
    'procrastination_timeline.txt': 'The March 25 entry was my idea.'
  };
  function showBonziHint(text, duration = 5200) {
    if (!text) return;
    if (window.BonziBuddy && typeof window.BonziBuddy.showHint === 'function') {
      window.BonziBuddy.showHint(text, duration);
    }
  }

  function showClippyFlash(shell, delayMs = 120) {
    if (!shell) return;
    const existing = shell.querySelector('.clippy-fake-flash');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.className = 'clippy-fake-flash';
    popup.style.cssText = 'position:absolute;left:14px;top:34px;max-width:420px;padding:9px 10px;border:2px outset #e5d5a0;background:#fff7cf;color:#151515;z-index:55;font-family:var(--font-pixel);font-size:8px;line-height:1.35;box-shadow:0 4px 12px rgba(0,0,0,0.25);display:flex;align-items:flex-end;gap:8px;';

    const clippyImg = document.createElement('img');
    clippyImg.src = './assets/media/photos/clippy-body.png?v=2';
    clippyImg.alt = 'Clippy';
    clippyImg.style.cssText = 'width:64px;height:auto;image-rendering:pixelated;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35));flex-shrink:0;';

    const textWrap = document.createElement('div');
    textWrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;';
    textWrap.innerHTML = [
      '<div style="font-size:9px;margin-bottom:4px;">Clippy</div>',
      '<div>It looks like you\'re writing a research paper.</div>',
      '<div style="margin-bottom:8px;">I\'ve already fixed it.</div>'
    ].join('');

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:6px;';
    const okA = document.createElement('button');
    okA.type = 'button';
    okA.textContent = 'Thanks Clippy';
    okA.style.cssText = 'font-family:var(--font-pixel);font-size:8px;padding:2px 7px;cursor:pointer;';
    const okB = document.createElement('button');
    okB.type = 'button';
    okB.textContent = 'Please No';
    okB.style.cssText = 'font-family:var(--font-pixel);font-size:8px;padding:2px 7px;cursor:pointer;';
    actions.appendChild(okA);
    actions.appendChild(okB);
    textWrap.appendChild(actions);
    popup.appendChild(clippyImg);
    popup.appendChild(textWrap);

    const close = () => {
      if (popup.parentNode) popup.remove();
    };
    okA.addEventListener('click', close);
    okB.addEventListener('click', close);

    setTimeout(() => {
      shell.appendChild(popup);
      setTimeout(close, 3600);
    }, Math.max(0, delayMs));
  }

  function showClippyFlashNearWindow(winEl, delayMs = 120) {
    if (!winEl) return;
    const existing = document.querySelector('.clippy-fake-floating');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.className = 'clippy-fake-floating';
    popup.style.cssText = 'position:fixed;z-index:12010;max-width:420px;padding:9px 10px;border:2px outset #e5d5a0;background:#fff7cf;color:#151515;font-family:var(--font-pixel);font-size:8px;line-height:1.35;box-shadow:0 4px 12px rgba(0,0,0,0.28);display:flex;align-items:flex-end;gap:8px;';

    const clippyImg = document.createElement('img');
    clippyImg.src = './assets/media/photos/clippy-body.png?v=2';
    clippyImg.alt = 'Clippy';
    clippyImg.style.cssText = 'width:66px;height:auto;image-rendering:pixelated;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35));flex-shrink:0;';

    const textWrap = document.createElement('div');
    textWrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;';
    textWrap.innerHTML = [
      '<div style="font-size:9px;margin-bottom:4px;">Clippy</div>',
      '<div>It looks like you\'re reading a research paper.</div>',
      '<div style="margin-bottom:8px;">I\'ve already summarized it.</div>'
    ].join('');

    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;gap:6px;';
    const a = document.createElement('button');
    a.type = 'button';
    a.textContent = 'Thanks Clippy';
    a.style.cssText = 'font-family:var(--font-pixel);font-size:8px;padding:2px 7px;cursor:pointer;';
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = 'Please No';
    b.style.cssText = 'font-family:var(--font-pixel);font-size:8px;padding:2px 7px;cursor:pointer;';
    actions.appendChild(a);
    actions.appendChild(b);

    textWrap.appendChild(actions);
    popup.appendChild(clippyImg);
    popup.appendChild(textWrap);
    document.body.appendChild(popup);

    const place = () => {
      const rect = winEl.getBoundingClientRect();
      const pop = popup.getBoundingClientRect();
      const left = Math.max(8, Math.min(rect.right + 10, window.innerWidth - pop.width - 8));
      const top = Math.max(8, Math.min(rect.top + 32, window.innerHeight - pop.height - 8));
      popup.style.left = left + 'px';
      popup.style.top = top + 'px';
    };

    const close = () => {
      if (popup.parentNode) popup.remove();
    };
    a.addEventListener('click', close);
    b.addEventListener('click', close);

    setTimeout(() => {
      place();
      requestAnimationFrame(place);
      setTimeout(place, 200);
      setTimeout(close, 4200);
    }, Math.max(0, delayMs));
  }

  function showClippyWarmupNotice(shell) {
    if (!shell) return;
    const existing = shell.querySelector('.clippy-warmup-note');
    if (existing) existing.remove();

    const note = document.createElement('div');
    note.className = 'clippy-warmup-note bonzi-hint';
    note.textContent = 'Clippy is warming up...';
    shell.appendChild(note);
    setTimeout(() => {
      if (note.parentNode) note.remove();
    }, 2200);
  }

  function openNotepadDocument(doc = {}) {
    const fileName = doc.fileName || 'Untitled.txt';
    const fileContent = typeof doc.content === 'string' ? doc.content : DEFAULT_NOTEPAD_TEXT;
    const clippyFlash = !!doc.clippyFlash;
    const clippyFlashDelayMs = Number(doc.clippyFlashDelayMs || 120);
    const title = 'Notepad - ' + fileName;
  
    function applyNotepadCounts(hintsEl, text) {
      if (!hintsEl) return;
      const value = typeof text === 'string' ? text : '';
      const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
      const lineCount = value.length ? value.split('\n').length : 0;
      hintsEl.textContent = wordCount + ' words, ' + lineCount + ' lines';
    }
  
    if (wm.windows.has('notepad')) {
      wm.restoreWindow('notepad');
      wm.focusWindow('notepad');
      const existing = wm.windows.get('notepad');
      const shell = existing && existing.el ? existing.el.querySelector('.notepad-shell') : null;
      const ta = existing && existing.el ? existing.el.querySelector('[data-notepad-editor="true"]') : null;
      const hints = existing && existing.el ? existing.el.querySelector('[data-notepad-hints="true"]') : null;
      const fileLabel = existing && existing.el ? existing.el.querySelector('[data-notepad-file="true"]') : null;
      const clippyToggle = existing && existing.el ? existing.el.querySelector('[data-notepad-clippy-toggle="true"]') : null;
      if (ta) {
        ta.value = fileContent;
        ta.focus();
        ta.setSelectionRange(ta.value.length, ta.value.length);
        ta.dispatchEvent(new Event('input'));
        attachNotepadStarterClear(ta);
      }
      applyNotepadCounts(hints, fileContent);
      if (fileLabel) fileLabel.textContent = fileName;
      if (clippyToggle) clippyToggle.disabled = false;
      if (shell && shell.__clippyApi && typeof shell.__clippyApi.updateFile === 'function') {
        shell.__clippyApi.updateFile(fileName);
      }
      if (clippyFlash && shell) showClippyFlash(shell, clippyFlashDelayMs);
      if (shell && window.__WIN95_AI_PREWARM_PROMISE && !window.__WIN95_AI_PREWARM_READY) {
        showClippyWarmupNotice(shell);
      }
      setWindowTitle('notepad', title, 'icon:text');
      return;
    }
  
    const shell = document.createElement('div');
    shell.className = 'notepad-shell';
  
    const top = document.createElement('div');
    top.className = 'notepad-topbar';
  
    const fileLabel = document.createElement('span');
    fileLabel.dataset.notepadFile = 'true';
    fileLabel.textContent = fileName;
  
    const hints = document.createElement('span');
    hints.dataset.notepadHints = 'true';
    hints.textContent = '0 words, 0 lines';
  
    const clippyToggle = document.createElement('button');
    clippyToggle.type = 'button';
    clippyToggle.dataset.notepadClippyToggle = 'true';
    clippyToggle.className = 'notepad-clippy-toggle';
    clippyToggle.textContent = 'Clippy AI';
  
    const topLeft = document.createElement('div');
    topLeft.className = 'notepad-topbar-group';
    topLeft.appendChild(fileLabel);
  
    const topRight = document.createElement('div');
    topRight.className = 'notepad-topbar-group';
    topRight.appendChild(hints);
    topRight.appendChild(clippyToggle);
  
    top.appendChild(topLeft);
    top.appendChild(topRight);
    shell.appendChild(top);
  
    const body = document.createElement('div');
    body.className = 'notepad-body';
    shell.appendChild(body);
  
    const editorPane = document.createElement('div');
    editorPane.className = 'notepad-editor-pane';
    body.appendChild(editorPane);
  
    const assistantPane = document.createElement('div');
    assistantPane.className = 'notepad-assistant-pane';
    body.appendChild(assistantPane);
  
    const ta = document.createElement('textarea');
    ta.dataset.notepadEditor = 'true';
    ta.className = 'notepad-editor';
    ta.value = fileContent;
    ta.spellcheck = false;
    editorPane.appendChild(ta);
  
    const noteWinEl = wm.createWindow('notepad', title, '\uD83D\uDCDD', shell, { width: 860, height: 500 });
    animateWindowOpen('notepad', noteWinEl);
    shell.__clippyApi = createClippyAssistant(assistantPane, ta, hints, fileName, {
      getClippyAiConfig,
      queryClippyOllama
    });
    clippyToggle.addEventListener('click', function() {
      if (shell.__clippyApi && typeof shell.__clippyApi.show === 'function') {
        shell.__clippyApi.show();
        ta.focus();
      }
    });
    if (clippyFlash) showClippyFlash(shell, clippyFlashDelayMs);
    if (window.__WIN95_AI_PREWARM_PROMISE && !window.__WIN95_AI_PREWARM_READY) {
      showClippyWarmupNotice(shell);
    }
  
    attachNotepadStarterClear(ta);
    applyNotepadCounts(hints, fileContent);
    ta.dispatchEvent(new Event('input'));
  
    window.NotepadAppState = { fileName: fileName };
    setTimeout(() => ta.focus(), 80);
  }
  
  function attachNotepadStarterClear(textarea) {
    if (!textarea) return;
    if (textarea.__notepadStarterClearBound) return;
    textarea.__notepadStarterClearBound = true;
    textarea.addEventListener('keydown', function onFirstEdit(event) {
      if (event.key.length !== 1 && event.key !== 'Enter' && event.key !== 'Backspace' && event.key !== 'Delete') return;
      if (textarea.value !== DEFAULT_NOTEPAD_TEXT) return;
      textarea.value = '';
      textarea.removeEventListener('keydown', onFirstEdit);
      textarea.__notepadStarterClearBound = false;
    });
  }

  function openGradesDeniedDialog() {
    const appId = 'grades-denied';
    const wrap = document.createElement('div');
    wrap.style.cssText = 'height:100%;display:flex;align-items:center;justify-content:center;background:#c0c0c0;padding:18px;box-sizing:border-box;';
    const panel = document.createElement('div');
    panel.style.cssText = 'width:min(520px,100%);border:2px outset #dfdfdf;background:#efefef;padding:14px;box-sizing:border-box;font-family:var(--font-pixel);';
    panel.innerHTML = [
      '<div style="font-size:9px;color:#000;margin-bottom:10px;">System Notice</div>',
      '<div style="font-size:10px;color:#111;line-height:1.5;">Access denied. Ignorance is a feature.</div>'
    ].join('');
    wrap.appendChild(panel);
    const win = wm.createWindow(appId, 'grades.exe', '⚠️', wrap, { width: 540, height: 220 });
    animateWindowOpen(appId, win);
  }

  function openInfiniteIeLinkDialog() {
    const appId = 'ie-link-connecting';
    const wrap = document.createElement('div');
    wrap.style.cssText = 'height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;background:#c0c0c0;font-family:var(--font-pixel);';

    const title = document.createElement('div');
    title.style.cssText = 'font-size:10px;color:#111;margin-bottom:10px;';
    title.textContent = 'Internet Explorer Shortcut';

    const status = document.createElement('div');
    status.style.cssText = 'font-size:9px;color:#111;margin-bottom:10px;';
    status.textContent = 'Connecting';

    const barShell = document.createElement('div');
    barShell.style.cssText = 'width:320px;height:16px;border:2px inset #9f9f9f;background:#fff;overflow:hidden;';
    const bar = document.createElement('div');
    bar.style.cssText = 'height:100%;width:18%;background:linear-gradient(90deg,#2f5fd6,#88b8ff);';
    barShell.appendChild(bar);

    wrap.appendChild(title);
    wrap.appendChild(status);
    wrap.appendChild(barShell);

    const win = wm.createWindow(appId, 'Internet Explorer.lnk', 'icon:internet', wrap, { width: 460, height: 220 });
    animateWindowOpen(appId, win);

    let tick = 0;
    const timer = setInterval(() => {
      tick += 1;
      status.textContent = 'Connecting' + '.'.repeat((tick % 3) + 1);
      const pct = 12 + ((tick * 7) % 46);
      bar.style.width = pct + '%';
    }, 380);

    const entry = wm.windows.get(appId);
    if (entry) {
      entry.onClose = () => clearInterval(timer);
    }
  }

  function openTemporaryBsod() {
    const existing = document.querySelector('.bsod-screen[data-fake-bsod="true"]');
    if (existing) existing.remove();

    const ctx = window._win95AudioCtx ? window._win95AudioCtx() : (window.AudioContext ? new AudioContext() : null);
    if (ctx) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 440;
      osc.type = 'square';
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.3);
      osc.stop(ctx.currentTime + 1.3);
    }

    const bsod = document.createElement('div');
    bsod.className = 'bsod-screen';
    bsod.dataset.fakeBsod = 'true';
    const smiley = document.createElement('div');
    smiley.className = 'bsod-smiley';
    smiley.textContent = ':(';
    bsod.appendChild(smiley);
    bsod.innerHTML = [
      '<div class="bsod-content">',
      '<h1>*** STOP: 0x0000007B (0xF78D2524, 0xC0000034, 0x00000000, 0x00000000)</h1>',
      '<div class="bsod-icon">:(</div>',
      '<p>INACCESSIBLE_BOOT_DEVICE</p>',
      '<p>The PC encountered a fatal error while defragmenting drive C:. Windows must shut down to prevent damage.</p>',
      '<p>If this is the first time you have seen this Stop error screen, restart your computer.</p>',
      '<p>If this screen appears again, disable or remove any newly installed hardware or software.</p>',
      '<p>Technical information:</p>',
      '<p>*** STOP: 0x0000007B (0xF78D2524, 0xC0000034, 0x00000000, 0x00000000)</p>',
      '<p>Collecting data for crash dump ...</p>',
      '<p>Initializing disk for defragmenter recovery ...</p>',
      '<p>*** DEFRAGMGR v1.0</p>',
      '<p>Press any key to continue ...</p>',
      '</div>'
    ].join('');
    document.body.appendChild(bsod);

    setTimeout(() => {
      if (bsod.parentNode) bsod.remove();
    }, 5000);
  }

  if (typeof window !== 'undefined') {
    window.Win95ExtrasParts = window.Win95ExtrasParts || {};
    window.Win95ExtrasParts.openTemporaryBsod = openTemporaryBsod;
  }
  
  function openFileInWindow(file) {
    if (!file || !file.name) return;
    const name = file.name;
    const ext = (name.includes('.') ? name.split('.').pop() : '').toLowerCase();

    const normalizedName = String(name || '').toLowerCase();
    if (BONZI_FILE_REACTIONS[normalizedName]) {
      showBonziHint(BONZI_FILE_REACTIONS[normalizedName], 5600);
    }
    if (normalizedName === 'grades.exe') {
      openGradesDeniedDialog();
      return;
    }
    if (normalizedName === 'bsod.exe') {
      openTemporaryBsod();
      return;
    }
    if (normalizedName === 'internet explorer.lnk') {
      openInfiniteIeLinkDialog();
      return;
    }
  
    const textExtensions = ['txt', 'md', 'json', 'js', 'css', 'html', 'csv'];
    const shortcutMatchers = [
      { pattern: /notes?/i, key: 'notepad' },
      { pattern: /presentation/i, key: 'pres' },
      { pattern: /internet explorer|^ie$/i, key: 'ie' },
      { pattern: /terminal/i, key: 'terminal' },
      { pattern: /steam/i, key: 'steam' },
      { pattern: /recycle/i, key: 'recycle' },
      { pattern: /explorer|my computer/i, key: 'explorer' }
    ];
    if (['lnk', 'exe'].includes(ext)) {
      const appConfig = getAppConfig() || {};
      for (const matcher of shortcutMatchers) {
        if (matcher.pattern.test(name) && appConfig[matcher.key]) {
          appConfig[matcher.key].open();
          return;
        }
      }
    }
    if (textExtensions.includes(ext)) {
      const shouldFlashClippy = normalizedName === 'clippy_suggestions.txt';
      const clippyDelay = normalizedName === 'clippy_suggestions.txt' ? 2000 : 120;
      const show = (content = '') => openNotepadDocument({
        fileName: name,
        content,
        clippyFlash: shouldFlashClippy,
        clippyFlashDelayMs: clippyDelay
      });
      if (file.content) {
        show(file.content);
        return;
      }
      if (file.url) {
        fetch(file.url, { cache: 'no-store' })
          .then(async (r) => {
            const text = await r.text();
            const isHtmlFallback = /<!doctype html>/i.test(text) && /requested path could not be found/i.test(text);
            if (!r.ok || isHtmlFallback) throw new Error('unreadable file');
            return text;
          })
          .then(show)
          .catch(() => show('Unable to load this file.'));
        return;
      }
      show('');
      return;
    }
  
    if (ext === 'pdf') {
      const appId = 'pdf-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const pdfWin = mediaWindows.openPdfWindow(appId, name, file.url || mediaWindows.researchPaperPdf);
      animateWindowOpen(appId, pdfWin);
      if (normalizedName === 'research paper.pdf') {
        showClippyFlashNearWindow(pdfWin, 120);
      }
      return;
    }
  
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
      const appId = 'img-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const wrap = document.createElement('div');
      wrap.style.cssText = 'height:100%;display:flex;align-items:center;justify-content:center;background:#111;';
      const img = document.createElement('img');
      img.src = file.url || '';
      img.alt = name;
      img.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;';
      wrap.appendChild(img);
      const imgWin = wm.createWindow(appId, name, '\uD83D\uDDBC\uFE0F', wrap, { width: 760, height: 520 });
      animateWindowOpen(appId, imgWin);
      return;
    }
  
    if (['mp4', 'webm', 'mov'].includes(ext)) {
      const appId = 'video-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const viewer = document.createElement('div');
      viewer.style.cssText = 'height:100%;display:flex;flex-direction:column;background:#050505;color:#fff;font-family:var(--font-pixel);font-size:10px;padding:10px;gap:10px;box-sizing:border-box;';

      const titleEl = document.createElement('div');
      titleEl.textContent = name;
      titleEl.style.cssText = 'align-self:flex-start;color:#d8e6ff;flex-shrink:0;';

      const video = document.createElement('video');
      video.controls = false;
      video.autoplay = true;
      video.preload = 'metadata';
      video.src = file.url || '';
      video.style.cssText = 'width:100%;flex:1;min-height:0;background:#000;display:block;';

      const timeLabel = document.createElement('span');
      timeLabel.style.cssText = 'color:#d8e6ff;font-family:"Space Mono",monospace;font-size:12px;flex-shrink:0;';
      timeLabel.textContent = '0:00 / 0:00';

      const scrubber = document.createElement('input');
      scrubber.type = 'range';
      scrubber.min = '0';
      scrubber.max = '1000';
      scrubber.value = '0';
      scrubber.style.cssText = 'flex:1;cursor:pointer;accent-color:#6aa7ff;';

      const scrubberWrap = document.createElement('div');
      scrubberWrap.style.cssText = 'display:flex;align-items:center;gap:8px;width:100%;flex-shrink:0;';
      scrubberWrap.appendChild(scrubber);

      function formatVideoTime(s) {
        const t = Math.max(0, Math.floor(s || 0));
        return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0');
      }

      let isScrubbing = false;

      function updateUi() {
        const dur = Number.isFinite(video.duration) ? video.duration : 0;
        playBtn.textContent = video.paused ? 'Play' : 'Pause';
        timeLabel.textContent = formatVideoTime(video.currentTime) + ' / ' + formatVideoTime(dur);
        if (!isScrubbing && dur > 0) {
          scrubber.value = String(Math.round((video.currentTime / dur) * 1000));
        }
      }

      video.addEventListener('play', updateUi);
      video.addEventListener('pause', updateUi);
      video.addEventListener('timeupdate', updateUi);
      video.addEventListener('seeked', updateUi);
      video.addEventListener('loadedmetadata', updateUi);
      video.addEventListener('ended', updateUi);

      scrubber.addEventListener('mousedown', () => { isScrubbing = true; });
      scrubber.addEventListener('input', () => {
        isScrubbing = true;
        const dur = Number.isFinite(video.duration) ? video.duration : 0;
        if (dur) timeLabel.textContent = formatVideoTime((Number(scrubber.value) / 1000) * dur) + ' / ' + formatVideoTime(dur);
      });
      scrubber.addEventListener('mouseup', () => {
        const dur = Number.isFinite(video.duration) ? video.duration : 0;
        if (dur) video.currentTime = (Number(scrubber.value) / 1000) * dur;
        isScrubbing = false;
      });
      scrubber.addEventListener('change', () => {
        const dur = Number.isFinite(video.duration) ? video.duration : 0;
        if (dur) video.currentTime = (Number(scrubber.value) / 1000) * dur;
        isScrubbing = false;
      });

      function makeBtn(label, onClick) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = label;
        btn.style.cssText = 'font-family:var(--font-pixel);font-size:8px;padding:4px 8px;border:2px outset #c0c0c0;background:#c0c0c0;color:#000;cursor:pointer;flex-shrink:0;';
        btn.onclick = onClick;
        return btn;
      }

      const backBtn = makeBtn('<< 10s', () => { video.currentTime = Math.max(0, video.currentTime - 10); });
      const playBtn = makeBtn('Pause', () => { video.paused ? video.play().catch(() => {}) : video.pause(); });
      const fwdBtn = makeBtn('10s >>', () => { video.currentTime = video.currentTime + 10; });
      const rstBtn = makeBtn('Restart', () => { video.currentTime = 0; video.play().catch(() => {}); });

      const controls = document.createElement('div');
      controls.style.cssText = 'display:flex;align-items:center;gap:8px;flex-shrink:0;';
      controls.appendChild(backBtn);
      controls.appendChild(playBtn);
      controls.appendChild(fwdBtn);
      controls.appendChild(rstBtn);
      controls.appendChild(timeLabel);

      viewer.appendChild(titleEl);
      viewer.appendChild(controls);
      viewer.appendChild(scrubberWrap);
      viewer.appendChild(video);

      const videoWin = wm.createWindow(appId, name, 'icon:video', viewer, { width: 860, height: 560 });
      animateWindowOpen(appId, videoWin);
      return;
    }
  
    if (['mp3', 'wav', 'ogg'].includes(ext)) {
      const winEl = mediaWindows.openWinampWindow({
        title: name,
        url: file.url || ''
      });
      animateWindowOpen('winamp', winEl);
      return;
    }
  
    openNotepadDocument({
      fileName: name,
      content: file.content || 'This file type cannot be previewed directly.\n\nTry opening it with another app.'
    });
  }

  return {
    DEFAULT_NOTEPAD_TEXT,
    openNotepadDocument,
    attachNotepadStarterClear,
    openFileInWindow
  };
}
