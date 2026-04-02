export function initContextMenuModule(options = {}) {
  var closeTaskbarMenu = typeof options.closeTaskbarMenu === 'function'
    ? options.closeTaskbarMenu
    : function() {};

  var activeMenu = null;

  function getWM() {
    return window.__wm;
  }

  function getAnimateOpen() {
    return window.__animateWindowOpen || function() {};
  }

  function getAppConfig() {
    return window.__APP_CONFIG || {};
  }

  function removeMenu() {
    if (activeMenu && activeMenu.parentNode) {
      activeMenu.remove();
      activeMenu = null;
    }
  }

  function createMenuItem(label, onClick) {
    var item = document.createElement('div');
    item.className = 'ctx-menu-item';
    item.textContent = label;
    item.addEventListener('click', function(e) {
      e.stopPropagation();
      removeMenu();
      if (onClick) onClick();
    });
    return item;
  }

  function createSeparator() {
    var sep = document.createElement('div');
    sep.className = 'ctx-menu-sep';
    return sep;
  }

  function showAboutDialog() {
    var wm = getWM();
    if (!wm) return;

    var div = document.createElement('div');
    div.style.cssText = 'background:#c0c0c0;padding:16px;font-family:var(--font-pixel);font-size:8px;color:#000;text-align:center;';

    var logo = document.createElement('div');
    logo.textContent = '\u229E';
    logo.style.cssText = 'font-size:48px;margin-bottom:8px;';
    div.appendChild(logo);

    var titleEl = document.createElement('p');
    titleEl.textContent = 'From Pixels to Intelligence';
    titleEl.style.cssText = 'font-size:10px;font-weight:bold;margin-bottom:4px;';
    div.appendChild(titleEl);

    var lines = [
      'Josue Aparcedo Gonzalez',
      'IDS2891 Cornerstone - Spring 2026',
      'Florida SouthWestern State College',
      '',
      'Built with Three.js, GSAP, and Vanilla JS',
      'Research: 13,455 words - 35 APA sources',
      '',
      'This website is itself proof of the thesis:',
      'consumer hardware powers real AI workflows.'
    ];
    lines.forEach(function(line) {
      var p = document.createElement('p');
      p.textContent = line;
      p.style.cssText = 'margin:2px 0;color:' + (line === '' ? 'transparent' : '#000') + ';';
      div.appendChild(p);
    });

    var okBtn = document.createElement('button');
    okBtn.textContent = 'OK';
    okBtn.style.cssText = 'margin-top:12px;font-family:var(--font-pixel);font-size:8px;padding:4px 24px;cursor:pointer;border:2px outset #c0c0c0;background:#c0c0c0;';
    div.appendChild(okBtn);

    var winEl = wm.createWindow('about', 'About This Project', 'icon:help', div, { width: 340, height: 320 });
    if (winEl) getAnimateOpen()('about', winEl);

    okBtn.addEventListener('click', function() {
      wm.closeWindow('about');
    });
  }

  var wallpaper = document.getElementById('win95Wallpaper');
  if (!wallpaper) return;

  var EXPLORER_MUTATION_LOG_KEY = 'ai98.explorer.mutations.v1';

  function readExplorerLog() {
    try {
      var raw = window.localStorage.getItem(EXPLORER_MUTATION_LOG_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function writeExplorerLog(log) {
    try {
      window.localStorage.setItem(EXPLORER_MUTATION_LOG_KEY, JSON.stringify(log || []));
    } catch (e) {}
  }

  function appendExplorerMutation(entry) {
    var log = readExplorerLog();
    log.push(entry);
    writeExplorerLog(log);
    try {
      window.dispatchEvent(new CustomEvent('win95-explorer-mutation', {
        detail: { kind: entry.type, payload: entry }
      }));
    } catch (e) {}
  }

  function getDesktopMutationMap() {
    var map = Object.create(null);
    readExplorerLog().forEach(function(entry) {
      if (!entry || !Array.isArray(entry.path) || entry.path.length !== 2 || entry.path[0] !== 'Desktop') return;
      var name = entry.path[1];
      if (entry.type === 'create') map[name] = Object.assign({}, entry);
      if (entry.type === 'rename' && map[name]) {
        var moved = map[name];
        delete map[name];
        moved.path = ['Desktop', String(entry.to || '').trim()];
        map[moved.path[1]] = moved;
      }
      if (entry.type === 'delete') delete map[name];
    });
    return map;
  }

  function getUniqueDesktopName(base) {
    var seed = String(base || 'New Folder').trim() || 'New Folder';
    var taken = getDesktopMutationMap();
    var next = seed;
    var n = 2;
    while (taken[next]) {
      next = seed + ' (' + n + ')';
      n++;
    }
    return next;
  }

  function showPromptWindow(title, copy, initialValue, onSubmit) {
    var wm = getWM();
    if (!wm) return;
    var id = 'desktop-prompt-' + Date.now().toString(36);
    var wrap = document.createElement('div');
    wrap.style.cssText = 'background:#d4d0c8;padding:10px;font-family:Tahoma,\"MS Sans Serif\",sans-serif;font-size:11px;color:#111;height:100%;box-sizing:border-box;display:flex;flex-direction:column;gap:8px;';
    var text = document.createElement('div');
    text.textContent = copy;
    var input = document.createElement('input');
    input.type = 'text';
    input.value = String(initialValue || '');
    input.style.cssText = 'width:100%;box-sizing:border-box;padding:4px 6px;border:2px inset #bcbcbc;background:#fff;color:#111;font-family:Tahoma,\"MS Sans Serif\",sans-serif;font-size:11px;';
    var actions = document.createElement('div');
    actions.style.cssText = 'display:flex;justify-content:flex-end;gap:6px;margin-top:auto;';
    var ok = document.createElement('button');
    ok.textContent = 'OK';
    ok.style.cssText = 'min-width:70px;padding:3px 10px;border:1px solid #707070;background:#d4d0c8;';
    var cancel = document.createElement('button');
    cancel.textContent = 'Cancel';
    cancel.style.cssText = 'min-width:70px;padding:3px 10px;border:1px solid #707070;background:#d4d0c8;';
    actions.appendChild(ok);
    actions.appendChild(cancel);
    wrap.appendChild(text);
    wrap.appendChild(input);
    wrap.appendChild(actions);
    var winEl = wm.createWindow(id, title, 'icon:settings', wrap, { width: 360, height: 170 });
    if (winEl) getAnimateOpen()(id, winEl);
    function close() { wm.closeWindow(id); }
    ok.addEventListener('click', function() {
      var val = String(input.value || '').trim();
      if (!val) return;
      if (typeof onSubmit === 'function') onSubmit(val);
      close();
    });
    cancel.addEventListener('click', close);
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') ok.click();
      if (e.key === 'Escape') close();
    });
    setTimeout(function() { input.focus(); input.select(); }, 60);
  }

  function showConfirmWindow(title, copy, onConfirm) {
    var wm = getWM();
    if (!wm) return;
    var id = 'desktop-confirm-' + Date.now().toString(36);
    var wrap = document.createElement('div');
    wrap.style.cssText = 'background:#d4d0c8;padding:10px;font-family:Tahoma,\"MS Sans Serif\",sans-serif;font-size:11px;color:#111;height:100%;box-sizing:border-box;display:flex;flex-direction:column;gap:8px;';
    var text = document.createElement('div');
    text.textContent = copy;
    var actions = document.createElement('div');
    actions.style.cssText = 'display:flex;justify-content:flex-end;gap:6px;margin-top:auto;';
    var yes = document.createElement('button');
    yes.textContent = 'Yes';
    yes.style.cssText = 'min-width:70px;padding:3px 10px;border:1px solid #707070;background:#d4d0c8;';
    var no = document.createElement('button');
    no.textContent = 'No';
    no.style.cssText = 'min-width:70px;padding:3px 10px;border:1px solid #707070;background:#d4d0c8;';
    actions.appendChild(yes);
    actions.appendChild(no);
    wrap.appendChild(text);
    wrap.appendChild(actions);
    var winEl = wm.createWindow(id, title, 'icon:settings', wrap, { width: 340, height: 150 });
    if (winEl) getAnimateOpen()(id, winEl);
    function close() { wm.closeWindow(id); }
    yes.addEventListener('click', function() {
      if (typeof onConfirm === 'function') onConfirm();
      close();
    });
    no.addEventListener('click', close);
  }

  wallpaper.addEventListener('contextmenu', function(e) {
    if (e.target.closest('.win95-window')) return;
    e.preventDefault();
    e.stopPropagation();
    removeMenu();

    var menu = document.createElement('div');
    menu.className = 'ctx-menu';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';

    var iconTarget = e.target.closest('.desktop-icon');
    if (iconTarget) {
      menu.appendChild(createMenuItem('Open', function() {
        if (typeof window.__openDesktopIcon === 'function') window.__openDesktopIcon(iconTarget);
      }));
      if (iconTarget.dataset.dynamicUser === '1') {
        menu.appendChild(createMenuItem('Rename', function() {
          var oldName = iconTarget.dataset.desktopName || (iconTarget.dataset.label || 'Shortcut');
          showPromptWindow('Rename', 'Enter a new name:', String(oldName).replace(/\.lnk$/i, ''), function(nextBase) {
            var nextName = /\.lnk$/i.test(oldName) ? (nextBase + '.lnk') : nextBase;
            appendExplorerMutation({ type: 'rename', path: ['Desktop', oldName], to: nextName, ts: Date.now() });
            if (typeof window.__refreshDynamicDesktopIcons === 'function') window.__refreshDynamicDesktopIcons();
          });
        }));
        menu.appendChild(createMenuItem('Delete', function() {
          var oldName = iconTarget.dataset.desktopName || (iconTarget.dataset.label || 'Shortcut');
          showConfirmWindow('Delete', 'Delete "' + oldName + '"?', function() {
            appendExplorerMutation({ type: 'delete', path: ['Desktop', oldName], ts: Date.now() });
            if (typeof window.__refreshDynamicDesktopIcons === 'function') window.__refreshDynamicDesktopIcons();
          });
        }));
      }
      menu.appendChild(createSeparator());
      menu.appendChild(createMenuItem('Properties', function() {
        showAboutDialog();
      }));
    } else {
      menu.appendChild(createMenuItem('New Folder', function() {
        var folderName = getUniqueDesktopName('New Folder');
        appendExplorerMutation({
          type: 'create',
          path: ['Desktop', folderName],
          nodeType: 'folder',
          modified: new Date().toISOString().slice(0, 10),
          ts: Date.now()
        });
        if (typeof window.__refreshDynamicDesktopIcons === 'function') window.__refreshDynamicDesktopIcons();
      }));
      menu.appendChild(createSeparator());
      menu.appendChild(createMenuItem('Refresh Icons', function() {
        if (typeof window.__refreshDynamicDesktopIcons === 'function') window.__refreshDynamicDesktopIcons();
        if (typeof window.__win95IconGridRefresh === 'function') window.__win95IconGridRefresh();
      }));
      menu.appendChild(createMenuItem('Properties', function() {
        var APP_CONFIG = getAppConfig();
        if (APP_CONFIG.sysprops && window.Win95Extras) {
          APP_CONFIG.sysprops.open();
        } else {
          showAboutDialog();
        }
      }));
      menu.appendChild(createSeparator());
      menu.appendChild(createMenuItem('About This Project', function() {
        showAboutDialog();
      }));
    }

    document.body.appendChild(menu);
    activeMenu = menu;

    var menuRect = menu.getBoundingClientRect();
    if (menuRect.right > window.innerWidth) {
      menu.style.left = (window.innerWidth - menuRect.width - 4) + 'px';
    }
    if (menuRect.bottom > window.innerHeight) {
      menu.style.top = (window.innerHeight - menuRect.height - 4) + 'px';
    }
  });

  document.addEventListener('click', removeMenu);
  document.addEventListener('contextmenu', function(e) {
    if (e.defaultPrevented) return;
    if (!e.target.closest('.ctx-menu')) removeMenu();
  });
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.taskbar-menu')) closeTaskbarMenu();
  });
  document.addEventListener('contextmenu', function(e) {
    if (!e.target.closest('.taskbar-menu') && !e.target.closest('.taskbar-pill')) closeTaskbarMenu();
  });
}
