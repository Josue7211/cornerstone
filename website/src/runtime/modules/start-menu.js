export function createStartMenuController(deps = {}) {
  const launchAppByAlias = deps.launchAppByAlias || (() => null);
  const openNotepadDocument = deps.openNotepadDocument || (() => {});
  const getRecentAppIds = deps.getRecentAppIds || (() => []);
  const getRecentEntries = deps.getRecentEntries || (() => []);
  const getAppConfig = deps.getAppConfig || (() => ({}));
  const openFileInWindow = deps.openFileInWindow || (() => {});
  const iconHelper = (typeof window !== 'undefined' && window.Win95Shared) ? window.Win95Shared : null;
  let startMenuHoverTimer = null;

  function renderUiIcon(target, value, opts = {}) {
    if (!target) return;
    if (iconHelper && typeof iconHelper.renderIcon === 'function') {
      iconHelper.renderIcon(target, value, opts);
      return;
    }
    const raw = String(value || '');
    target.textContent = raw.indexOf('icon:') === 0 ? '' : raw;
  }

  function buildStartMenu() {
    if (document.getElementById('startMenu')) return;
  
    const menuTree = [
      {
        label: 'Programs',
        icon: 'icon:folderClosed',
        children: [
          {
            label: 'Research',
            icon: 'icon:paper',
            children: [
              { id: 'paper', icon: 'icon:paper', label: 'Research Paper.exe' },
              { id: 'pres', icon: 'icon:presentation', label: 'Presentation.exe' },
              { id: 'explorer', icon: 'icon:explorer', label: 'File Explorer' }
            ]
          },
          {
            label: 'Creative',
            icon: 'icon:paint',
            children: [
              { id: 'notepad', icon: 'icon:notepad', label: 'Notepad.exe' },
              { id: 'paint', icon: 'icon:paint', label: 'Paint' },
              { id: 'winamp', icon: 'icon:winamp', label: 'Winamp' }
            ]
          },
          {
            label: 'Internet',
            icon: 'icon:internet',
            children: [
              { id: 'ie', icon: 'icon:internet', label: 'Internet Explorer' },
              { id: 'msn', icon: 'icon:msn', label: 'MSN Messenger' }
            ]
          },
          {
            label: 'Games',
            icon: 'icon:video',
            children: [
              { id: 'steam', icon: 'icon:steam', label: 'Steam95' },
            ]
          },
          {
            label: 'System Tools',
            icon: 'icon:settings',
            children: [
              { id: 'terminal', icon: 'icon:terminal', label: 'Terminal.exe' },
              { id: 'defrag', icon: 'icon:defrag', label: 'Disk Defragmenter' },
              { id: 'scandisk', icon: 'icon:defrag', label: 'ScanDisk' },
              { id: 'cleanup', icon: 'icon:settings', label: 'Disk Cleanup' },
              { id: 'recycle', icon: 'icon:recycle', label: 'Recycle Bin' },
              { id: 'sysprops', icon: 'icon:settings', label: 'Settings' }
            ]
          },
          {
            label: 'Accessories',
            icon: 'icon:folderClosed',
            children: [
              { id: 'notepad', icon: 'icon:notepad', label: 'Notepad.exe' },
              { id: 'paint', icon: 'icon:paint', label: 'Paint' },
              { id: 'terminal', icon: 'icon:terminal', label: 'Terminal.exe' }
            ]
          }
        ]
      },
      {
        label: 'Documents',
        icon: 'icon:document',
        dynamic: 'recent-files'
      },
      {
        label: 'Settings',
        icon: 'icon:settings',
        id: 'sysprops'
      },
      { separator: true },
      {
        label: 'Find',
        icon: 'icon:search',
        action() {
          launchAppByAlias('explorer', 'start-menu-find');
        }
      },
      {
        label: 'Run...',
        icon: 'icon:terminal',
        action() {
          launchAppByAlias('terminal', 'start-menu-run');
        }
      },
      {
        label: 'Help',
        icon: 'icon:help',
        action() {
          openNotepadDocument({
            fileName: 'StartMenu-Help.txt',
            content: [
              'START MENU GUIDE',
              '',
              'Programs: main app categories.',
              'Documents: fastest path to your paper and notes.',
              'Settings: system controls and media.',
              'Run: opens the Terminal shell.',
              '',
              'Terminal tips:',
              '  help',
              '  --help',
              '  dir',
              '  start presentation.app'
            ].join('\n')
          });
        }
      },
      { id: 'shutdown', icon: 'icon:settings', label: 'Shut Down...' }
    ];
  
    function launchMenuItem(appId) {
      if (appId === 'shutdown') {
        if (window.Win95Extras) window.Win95Extras.triggerShutdown();
        return;
      }
      launchAppByAlias(appId, 'start-menu');
    }
  
    function getEntryChildren(entry) {
      if (!entry) return [];
      if (entry.dynamic === 'recent') {
        const recentEntries = getRecentEntries();
        if (Array.isArray(recentEntries) && recentEntries.length) {
          return recentEntries.map((entry) => {
            if (entry.type === 'file') {
              return {
                type: 'file',
                file: entry.file,
                icon: entry.file && entry.file.icon ? entry.file.icon : 'icon:document',
                label: entry.file && entry.file.name ? entry.file.name : 'Recent file'
              };
            }
            return {
              id: entry.id,
              icon: entry.icon,
              label: entry.label
            };
          });
        }
        const appConfig = getAppConfig() || {};
        return getRecentAppIds()
          .map((appId) => ({ appId, app: appConfig[appId] || null }))
          .filter((item) => item.app)
          .map(({ appId, app }) => ({ id: appId, icon: app.icon, label: app.title }));
      }
      if (entry.dynamic === 'recent-files') {
        const recentEntries = getRecentEntries();
        return (Array.isArray(recentEntries) ? recentEntries : [])
          .filter((item) => item && item.type === 'file' && item.file)
          .map((item) => ({
            type: 'file',
            file: item.file,
            icon: item.file.icon || 'icon:document',
            label: item.file.name || 'Recent file'
          }));
      }
      return entry.children || [];
    }

    function resolveEntryByTrail(trail) {
      if (!Array.isArray(trail) || !trail.length) return null;
      let level = menuTree;
      let entry = null;
      for (const segment of trail) {
        entry = (level || []).find((candidate) => candidate && candidate.label === segment) || null;
        if (!entry) return null;
        level = getEntryChildren(entry);
      }
      return entry;
    }
  
    function setStartMenuSidebarContent(menu, entry, trail = []) {
      if (!menu) return;
      const panel = menu.querySelector('.start-menu-sidebar-list');
      const title = menu.querySelector('.start-menu-sidebar-title');
      if (!panel || !title) return;
  
      const branch = trail.concat(entry && entry.label ? [entry.label] : []);
      const items = getEntryChildren(entry);
      title.textContent = branch.length ? branch.join(' / ') : 'Menu';
      panel.innerHTML = '';
  
      if (trail.length) {
        const backItem = document.createElement('div');
        backItem.className = 'start-menu-panel-item is-back';
        backItem.innerHTML = '<span class="start-menu-panel-icon">◀</span><span class="start-menu-panel-label">Back</span>';
        backItem.addEventListener('click', (event) => {
          event.stopPropagation();
          const parentTrail = trail.slice(0, -1);
          const parentEntry = resolveEntryByTrail(parentTrail);
          if (parentEntry) setStartMenuSidebarContent(menu, parentEntry, parentTrail);
          else setStartMenuSidebarContent(menu, menuTree[0], []);
        });
        panel.appendChild(backItem);
      }
  
      if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'start-menu-panel-empty';
        empty.textContent = entry && (entry.dynamic === 'recent' || entry.dynamic === 'recent-files')
          ? 'No recent files yet.'
          : 'Nothing in this folder.';
        panel.appendChild(empty);
        return;
      }
  
      items.forEach((child) => {
        const row = document.createElement('div');
        row.className = 'start-menu-panel-item';
  
        const icon = document.createElement('span');
        icon.className = 'start-menu-panel-icon';
        renderUiIcon(icon, child.icon || '•', { alt: child.label || 'item' });
  
        const label = document.createElement('span');
        label.className = 'start-menu-panel-label';
        label.textContent = child.label;
  
        row.appendChild(icon);
        row.appendChild(label);
  
        if (child.children || child.dynamic === 'recent') {
          row.classList.add('has-submenu');
          const caret = document.createElement('span');
          caret.className = 'start-menu-panel-caret';
          caret.textContent = '▶';
          row.appendChild(caret);
          row.addEventListener('click', (event) => {
            event.stopPropagation();
            setStartMenuSidebarContent(menu, child, branch);
          });
        } else {
          row.dataset.app = child.id;
          row.addEventListener('click', (event) => {
            event.stopPropagation();
            if (child.type === 'file' && child.file) {
              openFileInWindow(child.file);
            } else if (typeof child.action === 'function') child.action();
            else launchMenuItem(child.id);
            closeStartMenu();
          });
        }
  
        panel.appendChild(row);
      });
    }
  
    function buildMenuEntry(entry, menu) {
      if (entry.separator) {
        const sep = document.createElement('div');
        sep.className = 'start-menu-separator';
        return sep;
      }
  
      const item = document.createElement('div');
      item.className = 'start-menu-item';
  
      const main = document.createElement('div');
      main.className = 'start-menu-item-main';
  
      const iconSpan = document.createElement('span');
      iconSpan.className = 'start-menu-icon';
      renderUiIcon(iconSpan, entry.icon || '•', { alt: entry.label || 'item' });
  
      const labelSpan = document.createElement('span');
      labelSpan.className = 'start-menu-label';
      labelSpan.textContent = entry.label;
  
      main.appendChild(iconSpan);
      main.appendChild(labelSpan);
      item.appendChild(main);
  
      if (entry.children || entry.dynamic === 'recent') {
        item.addEventListener('mouseenter', () => {
          clearStartMenuHoverTimer();
          startMenuHoverTimer = setTimeout(() => openStartMenuSubmenu(item), 110);
        });
        item.classList.add('has-submenu');
        const caret = document.createElement('span');
        caret.className = 'start-menu-caret';
        caret.textContent = '▶';
        item.appendChild(caret);
        item.addEventListener('click', (event) => {
          event.stopPropagation();
          openStartMenuSubmenu(item);
          setStartMenuSidebarContent(menu, entry, []);
        });
        return item;
      }
  
      item.dataset.app = entry.id;
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof entry.action === 'function') entry.action();
        else launchMenuItem(entry.id);
        closeStartMenu();
      });
  
      return item;
    }
  
    const menu = document.createElement('div');
    menu.id = 'startMenu';
    menu.className = 'start-menu';
  
    // Left colored header strip
    const header = document.createElement('div');
    header.className = 'start-menu-header';
    const brand = document.createElement('span');
    brand.className = 'start-menu-brand';
    brand.textContent = 'AI 98 OS';
    header.appendChild(brand);
    menu.appendChild(header);
  
    // Items list
    const itemsDiv = document.createElement('div');
    itemsDiv.className = 'start-menu-items';
    menuTree.forEach(entry => itemsDiv.appendChild(buildMenuEntry(entry, menu)));
    menu.appendChild(itemsDiv);
  
    const sidebar = document.createElement('div');
    sidebar.className = 'start-menu-sidebar';
    sidebar.innerHTML = [
      '<div class="start-menu-sidebar-title">Programs</div>',
      '<div class="start-menu-sidebar-list"></div>'
    ].join('');
    menu.appendChild(sidebar);
  
    // Footer
    const footer = document.createElement('div');
    footer.className = 'start-menu-footer';
    const footerSpan = document.createElement('span');
    footerSpan.textContent = '\u00A9 2026 Josue Aparcedo Gonzalez';
    footer.appendChild(footerSpan);
    menu.appendChild(footer);
  
    document.getElementById('desktop').appendChild(menu);
    setStartMenuSidebarContent(menu, menuTree[0], []);
  }
  
  function getVisibleStartMenuItems() {
    return Array.from(document.querySelectorAll('#startMenu > .start-menu-items .start-menu-item'))
      .filter((item) => item.offsetParent !== null && !item.classList.contains('is-disabled'));
  }
  
  function setActiveStartMenuItem(item) {
    document.querySelectorAll('#startMenu .start-menu-item.keyboard-active').forEach((entry) => {
      entry.classList.remove('keyboard-active');
    });
    if (item) item.classList.add('keyboard-active');
  }
  
  function clearStartMenuHoverTimer() {
    if (startMenuHoverTimer) {
      clearTimeout(startMenuHoverTimer);
      startMenuHoverTimer = null;
    }
  }
  
  function closeOpenSubmenus(scope) {
    const root = scope || document;
    root.querySelectorAll('#startMenu .start-menu-item.is-open-submenu').forEach((item) => {
      item.classList.remove('is-open-submenu');
    });
  }
  
  function openStartMenuSubmenu(item) {
    if (!item || !item.classList.contains('has-submenu')) return;
    const parentMenu = item.parentElement;
    if (parentMenu) {
      Array.from(parentMenu.children).forEach((sibling) => {
        if (sibling !== item) sibling.classList.remove('is-open-submenu');
      });
    }
    item.classList.add('is-open-submenu');
  }
  
  function closeStartMenu() {
    const menu = document.getElementById('startMenu');
    if (menu) menu.classList.remove('visible');
    clearStartMenuHoverTimer();
    closeOpenSubmenus();
    setActiveStartMenuItem(null);
  }
  
  function handleStartMenuKeydown(event) {
    const menu = document.getElementById('startMenu');
    if (!menu || !menu.classList.contains('visible')) return;
  
    const visibleItems = getVisibleStartMenuItems();
    if (!visibleItems.length) return;
  
    const current = menu.querySelector('.start-menu-item.keyboard-active') || visibleItems[0];
    let nextIndex = visibleItems.indexOf(current);
  
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      nextIndex = (nextIndex + 1 + visibleItems.length) % visibleItems.length;
      setActiveStartMenuItem(visibleItems[nextIndex]);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      nextIndex = (nextIndex - 1 + visibleItems.length) % visibleItems.length;
      setActiveStartMenuItem(visibleItems[nextIndex]);
    } else if (event.key === 'ArrowRight') {
      if (current && current.classList.contains('has-submenu')) {
        event.preventDefault();
        openStartMenuSubmenu(current);
        current.click();
      }
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      closeOpenSubmenus(menu);
      setActiveStartMenuItem(visibleItems[0] || null);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      current.click();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeStartMenu();
    }
  }
  

  return {
    buildStartMenu,
    getVisibleItems: getVisibleStartMenuItems,
    setActiveItem: setActiveStartMenuItem,
    closeOpenSubmenus,
    closeStartMenu,
    handleKeydown: handleStartMenuKeydown
  };
}
