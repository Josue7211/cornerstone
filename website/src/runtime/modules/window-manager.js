export function createWindowManager(deps = {}) {
  const desktop = deps.desktopEl || document.getElementById('desktop');
  const playWindowSound = deps.playWindowSound || (() => {});
  const dispatchOsEvent = deps.dispatchOsEvent || (() => {});
  const onTerminalClosed = deps.onTerminalClosed || (() => {});
  const iconHelper = (typeof window !== 'undefined' && window.Win95Shared) ? window.Win95Shared : null;
  let activeTaskbarMenu = null;
  let wm = null;

  function renderUiIcon(target, value, opts = {}) {
    if (!target) return;
    if (iconHelper && typeof iconHelper.renderIcon === 'function') {
      iconHelper.renderIcon(target, value, opts);
      return;
    }
    const raw = String(value || '');
    target.textContent = raw.indexOf('icon:') === 0 ? '' : raw;
  }

  function closeTaskbarMenu() {
    if (activeTaskbarMenu && activeTaskbarMenu.parentNode) {
      activeTaskbarMenu.remove();
    }
    activeTaskbarMenu = null;
  }
  
  function showTaskbarMenu(event, appId) {
    event.preventDefault();
    closeTaskbarMenu();
    const entry = wm.windows.get(appId);
    if (!entry) return;
  
    const menu = document.createElement('div');
    menu.className = 'taskbar-menu';
  
    function addItem(label, onClick, disabled) {
      const item = document.createElement('div');
      item.className = 'taskbar-menu-item' + (disabled ? ' is-disabled' : '');
      item.textContent = label;
      if (!disabled) {
        item.addEventListener('click', (ev) => {
          ev.stopPropagation();
          closeTaskbarMenu();
          onClick();
        });
      }
      menu.appendChild(item);
    }
  
    function addSeparator() {
      const sep = document.createElement('div');
      sep.className = 'taskbar-menu-sep';
      menu.appendChild(sep);
    }
  
    addItem(entry.minimized ? 'Restore' : 'Focus', () => {
      if (entry.minimized) wm.restoreWindow(appId);
      else wm.focusWindow(appId);
    });
    addItem('Minimize', () => {
      playWindowSound('minimize');
      wm.minimizeWindow(appId);
    }, entry.minimized);
    addItem(entry.el.dataset.maximized === 'true' ? 'Restore Size' : 'Maximize', () => {
      wm._toggleMaximize(appId);
    });
    addSeparator();
    addItem('Close', () => {
      playWindowSound('close');
      wm.closeWindow(appId);
    });
  
    document.body.appendChild(menu);
    activeTaskbarMenu = menu;
    menu.style.left = Math.min(event.clientX, window.innerWidth - menu.offsetWidth - 6) + 'px';
    menu.style.top = Math.min(event.clientY, window.innerHeight - menu.offsetHeight - 6) + 'px';
  }
  
  // ─── WINDOW MANAGER ──────────────────────────────

  class WindowManager {
    constructor() {
      this.windows = new Map();
      this.zCounter = 300;
      this.layer = document.getElementById('windowLayer');
      this.pillsContainer = document.getElementById('taskbarPills');
      this.snapThreshold = 36;
      this.snapOverlay = null;
    }
  
    createWindow(appId, title, icon, contentEl, opts = {}) {
      if (this.windows.has(appId)) {
        this.restoreWindow(appId);
        return;
      }
      const w = opts.width || 820;
      const h = opts.height || 560;
      const jx = (Math.random() - 0.5) * 40;
      const jy = (Math.random() - 0.5) * 40;
      const x = Math.max(0, (window.innerWidth - w) / 2 + jx);
      const y = Math.max(0, (window.innerHeight - h) / 2 - 14 + jy);
  
      const win = document.createElement('div');
      win.className = 'win95-window focused';
      win.style.left = x + 'px';
      win.style.top = y + 'px';
      win.style.width = w + 'px';
      win.style.height = h + 'px';
      win.style.zIndex = ++this.zCounter;
      win.dataset.appId = appId;
      win.dataset.maximized = 'false';
  
      // Titlebar
      const titlebar = document.createElement('div');
      titlebar.className = 'win95-titlebar';
      titlebar.dataset.drag = 'true';
  
      const tbIcon = document.createElement('span');
      tbIcon.className = 'win95-titlebar-icon';
      renderUiIcon(tbIcon, icon, { alt: title || appId });
  
      const tbText = document.createElement('span');
      tbText.className = 'win95-titlebar-text';
      tbText.textContent = title;
  
      const tbBtns = document.createElement('div');
      tbBtns.className = 'win95-titlebar-btns';
  
      const minBtn = document.createElement('button');
      minBtn.className = 'win95-btn min-btn';
      minBtn.textContent = '\u2013';
  
      const maxBtn = document.createElement('button');
      maxBtn.className = 'win95-btn max-btn';
      maxBtn.textContent = '\u25A1';
  
      const closeBtn = document.createElement('button');
      closeBtn.className = 'win95-btn close-btn';
      closeBtn.textContent = '\u2715';
  
      tbBtns.appendChild(minBtn);
      tbBtns.appendChild(maxBtn);
      tbBtns.appendChild(closeBtn);
      titlebar.appendChild(tbIcon);
      titlebar.appendChild(tbText);
      titlebar.appendChild(tbBtns);
  
      // Content area
      const content = document.createElement('div');
      content.className = 'win95-content';
      content.id = 'win-content-' + appId;
  
      // Statusbar
      const statusbar = document.createElement('div');
      statusbar.className = 'win95-statusbar';
      const sb1 = document.createElement('span');
      sb1.textContent = title;
      const sb2 = document.createElement('span');
      sb2.textContent = 'Ready';
      statusbar.appendChild(sb1);
      statusbar.appendChild(sb2);
  
      win.appendChild(titlebar);
      win.appendChild(content);
      win.appendChild(statusbar);
  
      ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'].forEach((dir) => {
        const handleEl = document.createElement('div');
        handleEl.className = 'win95-resize-handle win95-resize-handle--' + dir;
        handleEl.dataset.resize = dir;
        win.appendChild(handleEl);
      });
  
      if (contentEl) content.appendChild(contentEl);
  
      this.layer.appendChild(win);
      this.windows.set(appId, {
        el: win,
        minimized: false,
        title,
        icon,
        snapState: null,
        restoreGeometry: JSON.stringify({ left: x, top: y, width: w, height: h })
      });
  
      this._addPill(appId, title, icon);
  
      win.addEventListener('mousedown', () => this.focusWindow(appId));
      this._makeDraggable(win, titlebar);
      this._makeResizable(win);
      titlebar.addEventListener('dblclick', (e) => {
        if (e.target.classList.contains('win95-btn')) return;
        this._toggleMaximize(appId);
      });
  
      minBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playWindowSound('minimize');
        this.minimizeWindow(appId);
      });
      maxBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._toggleMaximize(appId);
      });
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playWindowSound('close');
        this.closeWindow(appId);
      });
  
      playWindowSound('open');
      dispatchOsEvent('window_open', { appId, title });
      return win;
    }
  
    _addPill(appId, title, icon) {
      const pill = document.createElement('div');
      pill.className = 'taskbar-pill active';
      pill.id = 'pill-' + appId;
      pill.title = title;
      pill.innerHTML = [
        '<span class="taskbar-pill-icon"></span>',
        '<span class="taskbar-pill-title"></span>',
        '<span class="taskbar-pill-state"></span>'
      ].join('');
      renderUiIcon(pill.querySelector('.taskbar-pill-icon'), icon, { alt: title || appId });
      pill.querySelector('.taskbar-pill-title').textContent = title.length > 17 ? title.slice(0, 17) : title;
      pill.querySelector('.taskbar-pill-state').textContent = '●';
      pill.addEventListener('click', () => {
        const entry = this.windows.get(appId);
        if (!entry) return;
        if (entry.minimized) {
          this.restoreWindow(appId);
        } else if (entry.el.classList.contains('focused')) {
          playWindowSound('minimize');
          this.minimizeWindow(appId);
        } else {
          this.focusWindow(appId);
        }
      });
      pill.addEventListener('contextmenu', (event) => showTaskbarMenu(event, appId));
      pill.addEventListener('auxclick', (event) => {
        if (event.button !== 1) return;
        event.preventDefault();
        playWindowSound('close');
        this.closeWindow(appId);
      });
      this.pillsContainer.appendChild(pill);
    }
  
    focusWindow(appId) {
      document.querySelectorAll('.win95-window').forEach(w => w.classList.remove('focused'));
      const entry = this.windows.get(appId);
      if (entry && !entry.minimized) {
        entry.el.classList.add('focused');
        entry.el.style.zIndex = ++this.zCounter;
        entry.el.classList.remove('window-focus-flash');
        void entry.el.offsetWidth;
        entry.el.classList.add('window-focus-flash');
        playWindowSound('focus');
        dispatchOsEvent('window_focus', { appId, title: entry.title });
      }
      document.querySelectorAll('.taskbar-pill').forEach(p => p.classList.remove('active'));
      const pill = document.getElementById('pill-' + appId);
      if (pill) pill.classList.add('active');
    }
  
    minimizeWindow(appId) {
      const entry = this.windows.get(appId);
      if (!entry) return;
      this._animateToTaskbar(entry.el, appId, () => {
        entry.minimized = true;
        entry.el.classList.add('minimized');
      });
      const pill = document.getElementById('pill-' + appId);
      if (pill) {
        pill.classList.remove('active');
        pill.classList.add('minimized-state');
      }
      dispatchOsEvent('window_minimize', { appId, title: entry.title });
    }
  
    restoreWindow(appId) {
      const entry = this.windows.get(appId);
      if (!entry) return;
      entry.minimized = false;
      entry.el.classList.remove('minimized');
      entry.el.style.visibility = 'hidden';
      const pill = document.getElementById('pill-' + appId);
      if (pill) pill.classList.remove('minimized-state');
      this._animateFromTaskbar(entry.el, appId, () => {
        entry.el.classList.remove('window-restore-pop');
        void entry.el.offsetWidth;
        entry.el.classList.add('window-restore-pop');
        entry.el.style.visibility = '';
        playWindowSound('restore');
        dispatchOsEvent('window_restore', { appId, title: entry.title });
        this.focusWindow(appId);
      });
    }
  
    closeWindow(appId) {
      const entry = this.windows.get(appId);
      if (!entry) return;
      if (entry.onClose) {
        try {
          entry.onClose();
        } catch (err) {}
      }
      if (entry.audioEl) {
        entry.audioEl.pause();
        entry.audioEl.src = '';
      }
      const contentArea = entry.el.querySelector('.win95-content');
      if (contentArea) {
        const panel = contentArea.querySelector('.panel');
        if (panel) {
          panel.classList.remove('open');
          panel.style.cssText = '';
          document.body.appendChild(panel);
        }
      }
      entry.el.remove();
      this.windows.delete(appId);
      if (appId === 'terminal') onTerminalClosed();
      const pill = document.getElementById('pill-' + appId);
      if (pill) pill.remove();
      dispatchOsEvent('window_close', { appId, title: entry.title });
      const remaining = Array.from(this.windows.keys()).pop();
      if (remaining) this.focusWindow(remaining);
    }
  
    _toggleMaximize(appId) {
      const entry = this.windows.get(appId);
      if (!entry) return;
      const win = entry.el;
      if (win.dataset.maximized === 'true') {
        this._applySavedGeometry(win, entry.restoreGeometry || win.dataset.prevGeometry);
        win.dataset.maximized = 'false';
        entry.snapState = null;
        dispatchOsEvent('window_unmaximize', { appId, title: entry.title });
      } else {
        if (!entry.snapState) entry.restoreGeometry = this._captureGeometry(win);
        win.dataset.prevGeometry = entry.restoreGeometry || this._captureGeometry(win);
        this._applyGeometry(win, this._getMaximizedBounds());
        entry.snapState = 'maximized';
        win.dataset.maximized = 'true';
        playWindowSound('maximize');
        dispatchOsEvent('window_maximize', { appId, title: entry.title });
      }
      win.style.zIndex = ++this.zCounter;
    }
  
    _makeDraggable(win, handle) {
      handle.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('win95-btn')) return;
        e.preventDefault();
        const appId = win.dataset.appId;
        const entry = this.windows.get(appId);
        this.focusWindow(appId);
        if (win.dataset.maximized === 'true') {
          this._toggleMaximize(appId);
        }
        const startX = e.clientX;
        const startY = e.clientY;
        const startL = parseInt(win.style.left) || 0;
        const startT = parseInt(win.style.top) || 0;
        const onMove = (e) => {
          win.style.left = (startL + e.clientX - startX) + 'px';
          win.style.top = (startT + e.clientY - startY) + 'px';
          this._updateSnapPreview(win);
        };
        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          this._hideSnapOverlay();
          if (!win.dataset.snapTarget && entry) {
            entry.restoreGeometry = this._captureGeometry(win);
            entry.snapState = null;
          }
          this._commitSnap(win, entry);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    }
  
    _makeResizable(win) {
      win.querySelectorAll('.win95-resize-handle').forEach((handle) => {
        handle.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const appId = win.dataset.appId;
          const entry = this.windows.get(appId);
          if (!entry) return;
          this.focusWindow(appId);
          const dir = handle.dataset.resize;
          const startX = e.clientX;
          const startY = e.clientY;
          const startRect = {
            left: parseInt(win.style.left, 10) || 0,
            top: parseInt(win.style.top, 10) || 0,
            width: parseInt(win.style.width, 10) || win.offsetWidth,
            height: parseInt(win.style.height, 10) || win.offsetHeight
          };
          const minWidth = 320;
          const minHeight = 200;
          const bounds = this._getDesktopBounds();
  
          const onMove = (event) => {
            const dx = event.clientX - startX;
            const dy = event.clientY - startY;
            let next = { ...startRect };
  
            if (dir.includes('e')) next.width = Math.max(minWidth, startRect.width + dx);
            if (dir.includes('s')) next.height = Math.max(minHeight, startRect.height + dy);
            if (dir.includes('w')) {
              next.width = Math.max(minWidth, startRect.width - dx);
              next.left = startRect.left + (startRect.width - next.width);
            }
            if (dir.includes('n')) {
              next.height = Math.max(minHeight, startRect.height - dy);
              next.top = startRect.top + (startRect.height - next.height);
            }
  
            next.left = Math.max(0, Math.min(next.left, bounds.width - minWidth));
            next.top = Math.max(0, Math.min(next.top, bounds.height - bounds.taskbarHeight - 40));
            next.width = Math.min(next.width, bounds.width - next.left);
            next.height = Math.min(next.height, bounds.height - bounds.taskbarHeight - next.top);
            this._applyGeometry(win, next);
          };
  
          const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            win.dataset.maximized = 'false';
            entry.snapState = null;
            entry.restoreGeometry = this._captureGeometry(win);
          };
  
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
        });
      });
    }
  
    _captureGeometry(win) {
      return JSON.stringify({
        left: parseInt(win.style.left, 10) || 0,
        top: parseInt(win.style.top, 10) || 0,
        width: parseInt(win.style.width, 10) || win.offsetWidth,
        height: parseInt(win.style.height, 10) || win.offsetHeight
      });
    }
  
    _applySavedGeometry(win, saved) {
      if (!saved) return;
      try {
        this._applyGeometry(win, JSON.parse(saved));
      } catch (err) {}
    }
  
    _applyGeometry(win, rect) {
      win.style.left = rect.left + 'px';
      win.style.top = rect.top + 'px';
      win.style.width = rect.width + 'px';
      win.style.height = rect.height + 'px';
    }
  
    _getDesktopBounds() {
      const taskbar = document.getElementById('win95Taskbar');
      return {
        width: desktop.clientWidth || window.innerWidth,
        height: desktop.clientHeight || window.innerHeight,
        taskbarHeight: taskbar ? taskbar.offsetHeight : 28
      };
    }
  
    _getMaximizedBounds() {
      const bounds = this._getDesktopBounds();
      return {
        left: 0,
        top: 0,
        width: bounds.width,
        height: bounds.height - bounds.taskbarHeight
      };
    }
  
    _ensureSnapOverlay() {
      if (this.snapOverlay) return this.snapOverlay;
      const overlay = document.createElement('div');
      overlay.className = 'wm-snap-overlay';
      desktop.appendChild(overlay);
      this.snapOverlay = overlay;
      return overlay;
    }
  
    _hideSnapOverlay() {
      if (this.snapOverlay) this.snapOverlay.classList.remove('visible');
    }
  
    _getSnapRect(target) {
      const bounds = this._getDesktopBounds();
      if (target === 'left') {
        return { left: 0, top: 0, width: Math.floor(bounds.width / 2), height: bounds.height - bounds.taskbarHeight };
      }
      if (target === 'right') {
        const width = Math.floor(bounds.width / 2);
        return { left: bounds.width - width, top: 0, width, height: bounds.height - bounds.taskbarHeight };
      }
      if (target === 'max') {
        return this._getMaximizedBounds();
      }
      return null;
    }
  
    _showSnapOverlay(target) {
      const rect = this._getSnapRect(target);
      if (!rect) {
        this._hideSnapOverlay();
        return;
      }
      const overlay = this._ensureSnapOverlay();
      overlay.style.left = rect.left + 'px';
      overlay.style.top = rect.top + 'px';
      overlay.style.width = rect.width + 'px';
      overlay.style.height = rect.height + 'px';
      overlay.classList.add('visible');
    }
  
    _updateSnapPreview(win) {
      const bounds = this._getDesktopBounds();
      const left = parseInt(win.style.left, 10) || 0;
      const rightGap = bounds.width - (left + win.offsetWidth);
      const top = parseInt(win.style.top, 10) || 0;
      win.classList.remove('snap-preview');
      win.dataset.snapTarget = '';
      if (left <= this.snapThreshold) {
        win.dataset.snapTarget = 'left';
        win.classList.add('snap-preview');
      } else if (rightGap <= this.snapThreshold) {
        win.dataset.snapTarget = 'right';
        win.classList.add('snap-preview');
      } else if (top <= this.snapThreshold) {
        win.dataset.snapTarget = 'max';
        win.classList.add('snap-preview');
      }
      this._showSnapOverlay(win.dataset.snapTarget);
    }
  
    _commitSnap(win, entry) {
      const target = win.dataset.snapTarget;
      win.classList.remove('snap-preview');
      this._hideSnapOverlay();
      if (!target || !entry) return;
      win.dataset.prevGeometry = entry.restoreGeometry || this._captureGeometry(win);
      const bounds = this._getDesktopBounds();
      if (target === 'left') {
        this._applyGeometry(win, {
          left: 0,
          top: 0,
          width: Math.floor(bounds.width / 2),
          height: bounds.height - bounds.taskbarHeight
        });
        win.dataset.maximized = 'false';
        entry.snapState = 'left';
      } else if (target === 'right') {
        const width = Math.floor(bounds.width / 2);
        this._applyGeometry(win, {
          left: bounds.width - width,
          top: 0,
          width,
          height: bounds.height - bounds.taskbarHeight
        });
        win.dataset.maximized = 'false';
        entry.snapState = 'right';
      } else if (target === 'max') {
        this._applyGeometry(win, this._getMaximizedBounds());
        win.dataset.maximized = 'true';
        entry.snapState = 'maximized';
      }
      playWindowSound(target === 'max' ? 'maximize' : 'snap');
      dispatchOsEvent('window_snap', { appId: win.dataset.appId, title: entry.title, target });
      win.dataset.snapTarget = '';
    }
  
    _animateToTaskbar(win, appId, onComplete) {
      const pill = document.getElementById('pill-' + appId);
      if (!pill || typeof gsap === 'undefined') {
        onComplete();
        return;
      }
      const source = win.getBoundingClientRect();
      const target = pill.getBoundingClientRect();
      const ghost = win.cloneNode(true);
      ghost.classList.remove('focused');
      ghost.classList.add('minimize-ghost');
      ghost.style.position = 'fixed';
      ghost.style.left = source.left + 'px';
      ghost.style.top = source.top + 'px';
      ghost.style.width = source.width + 'px';
      ghost.style.height = source.height + 'px';
      ghost.style.margin = '0';
      ghost.style.zIndex = '12000';
      ghost.style.pointerEvents = 'none';
      document.body.appendChild(ghost);
      win.style.visibility = 'hidden';
  
      gsap.to(ghost, {
        left: target.left,
        top: target.top,
        width: Math.max(target.width, 10),
        height: Math.max(target.height, 10),
        opacity: 0.15,
        scale: 0.25,
        duration: 0.22,
        ease: 'power2.in',
        onComplete: () => {
          ghost.remove();
          win.style.visibility = '';
          onComplete();
        }
      });
    }
  
    _animateFromTaskbar(win, appId, onComplete) {
      const pill = document.getElementById('pill-' + appId);
      if (!pill || typeof gsap === 'undefined') {
        onComplete();
        return;
      }
      const target = win.getBoundingClientRect();
      const source = pill.getBoundingClientRect();
      const ghost = win.cloneNode(true);
      ghost.classList.remove('focused', 'minimized');
      ghost.classList.add('minimize-ghost');
      ghost.style.position = 'fixed';
      ghost.style.left = source.left + 'px';
      ghost.style.top = source.top + 'px';
      ghost.style.width = Math.max(source.width, 10) + 'px';
      ghost.style.height = Math.max(source.height, 10) + 'px';
      ghost.style.margin = '0';
      ghost.style.opacity = '0.2';
      ghost.style.transform = 'scale(0.25)';
      ghost.style.zIndex = '12000';
      ghost.style.pointerEvents = 'none';
      document.body.appendChild(ghost);
      win.style.visibility = 'hidden';
  
      gsap.to(ghost, {
        left: target.left,
        top: target.top,
        width: target.width,
        height: target.height,
        opacity: 1,
        scale: 1,
        duration: 0.24,
        ease: 'power2.out',
        onComplete: () => {
          ghost.remove();
          onComplete();
        }
      });
    }
  
    reflowWindows() {
      this.windows.forEach((entry) => {
        if (entry.el.dataset.maximized === 'true') {
          this._applyGeometry(entry.el, this._getMaximizedBounds());
        } else if (entry.snapState === 'left' || entry.snapState === 'right') {
          const bounds = this._getDesktopBounds();
          const width = Math.floor(bounds.width / 2);
          this._applyGeometry(entry.el, {
            left: entry.snapState === 'left' ? 0 : bounds.width - width,
            top: 0,
            width,
            height: bounds.height - bounds.taskbarHeight
          });
        }
      });
    }
  }

  wm = new WindowManager();
  wm.closeTaskbarMenu = closeTaskbarMenu;
  wm.showTaskbarMenu = showTaskbarMenu;
  return wm;
}
