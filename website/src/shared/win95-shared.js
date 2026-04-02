// Shared runtime helpers for Win95/Win98 feature scripts.
(function() {
  'use strict';

  function readNumber(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      var parsed = parseInt(raw, 10);
      return Number.isNaN(parsed) ? fallback : parsed;
    } catch (e) {
      return fallback;
    }
  }

  function writeNumber(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch (e) {}
  }

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      return parsed || fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  function getExt(name) {
    if (!name || name.indexOf('.') === -1) return '';
    return name.split('.').pop().toLowerCase();
  }

  const ICONS_BASE = './assets/icons/win98';
  const ICON_PATHS = {
    paper: ICONS_BASE + '/paper.ico',
    document: ICONS_BASE + '/document.ico',
    presentation: ICONS_BASE + '/presentation.ico',
    explorer: ICONS_BASE + '/explorer.ico',
    internet: ICONS_BASE + '/internet.ico',
    terminal: ICONS_BASE + '/w98_console_prompt.ico',
    notepad: ICONS_BASE + '/notepad.ico',
    recycle: ICONS_BASE + '/recycle-empty.ico',
    recycleFull: ICONS_BASE + '/recycle-full.ico',
    start: ICONS_BASE + '/start.ico',
    settings: ICONS_BASE + '/settings.ico',
    paint: ICONS_BASE + '/w98_paintbrush.ico',
    winamp: ICONS_BASE + '/w2k_audio_cd.ico',
    steam: ICONS_BASE + '/steam.ico',
    gameSnake: ICONS_BASE + '/game-snake.ico',
    gameRunner: ICONS_BASE + '/game-runner.ico',
    gameRace: ICONS_BASE + '/game-race.ico',
    gameTimeline: ICONS_BASE + '/game-timeline.ico',
    gameProfiles: ICONS_BASE + '/game-profiles.ico',
    gameMinesweeper: ICONS_BASE + '/game-minesweeper.ico',
    msn: ICONS_BASE + '/msn.ico',
    defrag: ICONS_BASE + '/defrag.ico',
    folderClosed: ICONS_BASE + '/folder-closed.ico',
    folderOpen: ICONS_BASE + '/folder-open.ico',
    file: ICONS_BASE + '/file.ico',
    text: ICONS_BASE + '/text.ico',
    audio: ICONS_BASE + '/audio.ico',
    video: ICONS_BASE + '/video.ico',
    search: ICONS_BASE + '/search.ico',
    history: ICONS_BASE + '/history.ico',
    help: ICONS_BASE + '/help.ico',
    apps: ICONS_BASE + '/apps.ico',
    network: ICONS_BASE + '/network.ico'
  };

  function iconPathForKey(key) {
    return ICON_PATHS[key] || '';
  }

  function isIconToken(value) {
    return typeof value === 'string' && value.indexOf('icon:') === 0;
  }

  function resolveIconValue(value) {
    if (!isIconToken(value)) return { type: 'text', value: value };
    var key = value.slice(5);
    var path = iconPathForKey(key);
    if (!path) return { type: 'text', value: value };
    return { type: 'image', value: path, key: key };
  }

  function renderIcon(target, value, options) {
    if (!target) return;
    var opts = options || {};
    var resolved = resolveIconValue(value);
    target.innerHTML = '';
    target.classList.add('win95-icon-token');
    if (resolved.type === 'image') {
      var img = document.createElement('img');
      img.className = 'win95-icon-img';
      img.src = resolved.value;
      img.alt = opts.alt || resolved.key || 'icon';
      target.appendChild(img);
      target.setAttribute('data-icon-key', resolved.key || '');
      target.setAttribute('aria-label', opts.ariaLabel || (resolved.key || 'icon'));
      return;
    }
    target.removeAttribute('data-icon-key');
    if (opts.ariaLabel) target.setAttribute('aria-label', opts.ariaLabel);
    target.textContent = typeof value === 'string' ? value : (value == null ? '' : String(value));
  }

  function fileTypeLabel(node) {
    if (!node) return '';
    if (node.type === 'folder') return 'File Folder';
    var ext = getExt(node.name);
    if (ext === 'txt') return 'Text Document';
    if (ext === 'md') return 'Markdown Document';
    if (ext === 'pdf') return 'PDF Document';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'Image File';
    if (['mp3', 'wav', 'ogg'].includes(ext)) return 'Audio File';
    if (['mp4', 'webm', 'mov'].includes(ext)) return 'Video File';
    if (ext === 'exe') return 'Application';
    if (ext === 'csv') return 'CSV Document';
    if (ext === 'lnk') return 'Shortcut';
    return ext ? ext.toUpperCase() + ' File' : 'File';
  }

  function fileIcon(node) {
    if (!node) return 'icon:file';
    if (node.type === 'folder') return 'icon:folderClosed';
    if (node.icon) return node.icon;
    var ext = getExt(node.name);
    if (ext === 'txt') return 'icon:text';
    if (ext === 'md') return 'icon:text';
    if (ext === 'pdf') return 'icon:document';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'icon:document';
    if (['mp3', 'wav', 'ogg'].includes(ext)) return 'icon:audio';
    if (['mp4', 'webm', 'mov'].includes(ext)) return 'icon:video';
    if (ext === 'js') return 'icon:file';
    if (ext === 'css') return 'icon:file';
    if (ext === 'json') return 'icon:file';
    if (ext === 'lnk') return 'icon:file';
    if (ext === 'exe') return 'icon:apps';
    if (ext === 'csv') return 'icon:file';
    return 'icon:file';
  }

  window.Win95Shared = Object.assign({}, window.Win95Shared, {
    readNumber: readNumber,
    writeNumber: writeNumber,
    readJSON: readJSON,
    writeJSON: writeJSON,
    getExt: getExt,
    iconPathForKey: iconPathForKey,
    isIconToken: isIconToken,
    resolveIconValue: resolveIconValue,
    renderIcon: renderIcon,
    fileTypeLabel: fileTypeLabel,
    fileIcon: fileIcon
  });
})();
