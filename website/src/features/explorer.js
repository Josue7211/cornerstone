// ═══════════════════════════════════════════════════
// EXPLORER.JS — File type aware Win95 explorer (UI/runtime)
// ═══════════════════════════════════════════════════
(function() {
  'use strict';

  var data = window.ExplorerData || {};
  var FS = data.FS;
  var fileTypeLabel = data.fileTypeLabel || function(node) {
    if (!node) return '';
    return node.type === 'folder' ? 'File Folder' : 'File';
  };
  var fileIcon = data.fileIcon || function(node) {
    return (node && node.type === 'folder') ? 'icon:folderClosed' : 'icon:file';
  };
  var iconHelper = window.Win95Shared || {};
  var pathString = data.pathString || function(pathParts) {
    return 'C:\\' + (pathParts || []).join('\\');
  };
  var EXPLORER_MUTATION_LOG_KEY = 'ai98.explorer.mutations.v1';

  function cloneHierarchy(nodes) {
    return (nodes || []).map(function(node) {
      var clone = Object.assign({}, node);
      clone.children = node.children && node.children.length ? cloneHierarchy(node.children) : [];
      return clone;
    });
  }

  function getNodeAtPath(rootNode, pathParts) {
    var node = rootNode;
    for (var i = 0; i < pathParts.length; i++) {
      if (!node || !node.children) return null;
      node = node.children.find(function(child) { return child.name === pathParts[i]; }) || null;
    }
    return node;
  }

  function getDirectoryChildren(node) {
    if (!node || node.type !== 'folder') return [];
    return (node.children || []).slice().sort(function(a, b) {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  function safeReadMutationLog() {
    try {
      var raw = window.localStorage.getItem(EXPLORER_MUTATION_LOG_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (err) {
      return [];
    }
  }

  function safeWriteMutationLog(list) {
    try {
      window.localStorage.setItem(EXPLORER_MUTATION_LOG_KEY, JSON.stringify(list || []));
    } catch (err) {
      // storage may be unavailable in strict/private environments
    }
  }

  function appendMutation(entry) {
    if (!entry || !entry.type) return;
    var log = safeReadMutationLog();
    log.push(entry);
    safeWriteMutationLog(log);
  }

  function applyMutation(rootNode, mutation) {
    if (!rootNode || !mutation || !Array.isArray(mutation.path) || !mutation.path.length) return;
    var parentPath = mutation.path.slice(0, -1);
    var targetName = mutation.path[mutation.path.length - 1];
    var parent = getNodeAtPath(rootNode, parentPath);
    if (!parent || !Array.isArray(parent.children)) return;
    if (mutation.type === 'create') {
      var exists = parent.children.some(function(child) { return child && child.name === targetName; });
      if (exists) return;
      parent.children.push({
        type: mutation.nodeType === 'file' ? 'file' : 'folder',
        name: targetName,
        children: mutation.nodeType === 'file' ? [] : [],
        size: mutation.size || '-',
        modified: mutation.modified || '',
        icon: mutation.icon || '',
        shortcut: mutation.shortcut || null
      });
      return;
    }
    var childIndex = parent.children.findIndex(function(child) { return child && child.name === targetName; });
    if (childIndex < 0) return;
    if (mutation.type === 'delete') {
      parent.children.splice(childIndex, 1);
      return;
    }
    if (mutation.type === 'rename') {
      var nextName = String(mutation.to || '').trim();
      if (!nextName) return;
      var conflict = parent.children.some(function(child, idx) {
        return idx !== childIndex && String(child.name || '').toLowerCase() === nextName.toLowerCase();
      });
      if (conflict) return;
      parent.children[childIndex].name = nextName;
    }
  }

  function buildWebsiteHierarchy(entries) {
    var tree = [];
    (entries || []).forEach(function(entry) {
      var parts = String(entry.name || '').split('/').filter(Boolean);
      if (!parts.length) return;
      insertWebsiteNode(tree, parts, entry);
    });
    return tree;
  }

  function insertWebsiteNode(list, parts, entry) {
    var name = parts[0];
    var node = list.find(function(n) { return n.name === name && n.type === 'folder'; });
    if (!node) {
      node = { name: name, type: 'folder', children: [] };
      list.push(node);
    }
    if (parts.length === 1) {
      node.type = entry.type === 'folder' ? 'folder' : 'file';
      node.size = entry.size;
      node.modified = entry.modified;
      if (entry.path) node.url = entry.path;
      node.children = node.children || [];
      return;
    }
    insertWebsiteNode(node.children, parts.slice(1), entry);
  }

  function fetchJson(url) {
    return fetch(url + '?ts=' + Date.now(), { cache: 'no-store' }).then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  function buildExplorer() {
    function renderUiIcon(target, value, label) {
      if (!target) return;
      if (iconHelper && typeof iconHelper.renderIcon === 'function') {
        iconHelper.renderIcon(target, value, { alt: label || 'icon' });
        return;
      }
      var raw = String(value || '');
      target.textContent = raw.indexOf('icon:') === 0 ? '' : raw;
    }

    var root = cloneHierarchy([FS])[0];
    if (!root) {
      root = { type: 'folder', name: 'C:', children: [] };
    }

    var container = document.createElement('div');
    container.className = 'explorer-container explorer-modern';

    var toolbar = document.createElement('div');
    toolbar.className = 'explorer-toolbar';
    var addressWrap = document.createElement('div');
    addressWrap.className = 'explorer-address-wrap';
    var address = document.createElement('input');
    address.className = 'explorer-address';
    address.type = 'text';
    address.setAttribute('aria-label', 'Path');
    var breadcrumbs = document.createElement('div');
    breadcrumbs.className = 'explorer-breadcrumbs';
    addressWrap.appendChild(address);
    addressWrap.appendChild(breadcrumbs);
    toolbar.appendChild(addressWrap);
    container.appendChild(toolbar);

    var split = document.createElement('div');
    split.className = 'explorer-split';
    container.appendChild(split);

    var left = document.createElement('div');
    left.className = 'explorer-tree';
    split.appendChild(left);

    var right = document.createElement('div');
    right.className = 'explorer-viewer';
    split.appendChild(right);

    var listHead = document.createElement('div');
    listHead.className = 'explorer-list-head';
    var headerMeta = [
      { key: 'name', label: 'Name' },
      { key: 'type', label: 'Type' },
      { key: 'size', label: 'Size' },
      { key: 'modified', label: 'Modified' }
    ];
    headerMeta.forEach(function(meta) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'explorer-head-btn';
      btn.dataset.sortKey = meta.key;
      btn.textContent = meta.label;
      listHead.appendChild(btn);
    });
    right.appendChild(listHead);

    var listBody = document.createElement('div');
    listBody.className = 'explorer-list-body';
    right.appendChild(listBody);

    var preview = document.createElement('div');
    preview.className = 'explorer-preview';
    preview.textContent = 'Select a file to preview. Double-click to open.';
    right.appendChild(preview);

    var currentPath = [];
    var homeworkHintShown = false;
    var currentItems = [];
    var selectedIndex = -1;
    var treeRows = [];
    var selectedTreeIndex = -1;
    var activePane = 'list';
    var sortKey = 'name';
    var sortAsc = true;
    var activeContextMenu = null;
    var activePropertiesDialog = null;
    var listTypeaheadBuffer = '';
    var listTypeaheadTimer = 0;
    var treeTypeaheadBuffer = '';
    var treeTypeaheadTimer = 0;
    var clippyMount = null;
    var clippyBubble = null;
    var clippyHideTimer = 0;

    function samePath(a, b) {
      if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
      for (var i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    }

    function isTypeaheadKey(event) {
      if (!event || event.ctrlKey || event.metaKey || event.altKey) return false;
      return typeof event.key === 'string' && event.key.length === 1 && /\S/.test(event.key);
    }

    function resetListTypeahead() {
      listTypeaheadBuffer = '';
      if (listTypeaheadTimer) clearTimeout(listTypeaheadTimer);
      listTypeaheadTimer = 0;
    }

    function resetTreeTypeahead() {
      treeTypeaheadBuffer = '';
      if (treeTypeaheadTimer) clearTimeout(treeTypeaheadTimer);
      treeTypeaheadTimer = 0;
    }

    function triggerRefreshAnimation() {
      listBody.classList.remove('explorer-refreshing');
      void listBody.offsetWidth;
      listBody.classList.add('explorer-refreshing');
    }

    function emitExplorerMutation(kind, payload) {
      try {
        window.dispatchEvent(new CustomEvent('win95-explorer-mutation', {
          detail: { kind: kind, payload: payload || {} }
        }));
      } catch (err) {}
    }

    function getTodayStamp() {
      var d = new Date();
      var yyyy = String(d.getFullYear());
      var mm = String(d.getMonth() + 1).padStart(2, '0');
      var dd = String(d.getDate()).padStart(2, '0');
      return yyyy + '-' + mm + '-' + dd;
    }

    function isDesktopDirectChild(pathParts) {
      return Array.isArray(pathParts) && pathParts.length === 2 && pathParts[0] === 'Desktop';
    }

    function ensureExplorerClippy() {
      var win = container.closest('.win95-window');
      if (!clippyMount) {
        clippyMount = document.createElement('div');
        clippyMount.className = 'explorer-clippy-hint';
        clippyMount.style.cssText = [
          'position:absolute',
          'z-index:20',
          'width:0',
          'height:0',
          'pointer-events:none',
          'overflow:visible',
          // Exact mount point: window top-right corner.
          'top:0',
          'right:0'
        ].join(';');

        var character = document.createElement('img');
        character.src = './assets/media/photos/clippy-body.png?v=2';
        character.alt = 'Clippy';
        character.style.cssText = [
          'position:absolute',
          'left:0',
          'top:-2px',
          'width:112px',
          'height:auto',
          'image-rendering:pixelated',
          'filter:drop-shadow(0 4px 7px rgba(0,0,0,0.45))'
        ].join(';');

        clippyBubble = document.createElement('div');
        clippyBubble.style.cssText = [
          'position:absolute',
          'right:0',
          'top:-92px',
          'width:248px',
          'padding:10px 12px',
          'border:2px outset #e3d7a2',
          'background:#fff7cf',
          'color:#161616',
          'font-family:var(--font-pixel)',
          'font-size:9px',
          'line-height:1.4',
          'box-shadow:0 4px 10px rgba(0,0,0,0.28)',
          'text-align:left',
          'display:none'
        ].join(';');

        clippyMount.appendChild(clippyBubble);
        clippyMount.appendChild(character);
      }

      if (win) {
        if (clippyMount.parentNode !== win) win.appendChild(clippyMount);
        clippyMount.style.position = 'absolute';
        clippyMount.style.top = '0';
        clippyMount.style.right = '0';
      } else if (!clippyMount.parentNode) {
        clippyMount.style.position = 'fixed';
        clippyMount.style.right = '12px';
        clippyMount.style.top = '12px';
        document.body.appendChild(clippyMount);
      }
    }

    function showExplorerClippyHint(text) {
      ensureExplorerClippy();
      if (!clippyBubble) return;
      clippyBubble.textContent = text;
      clippyBubble.style.display = 'block';
      if (clippyHideTimer) clearTimeout(clippyHideTimer);
      clippyHideTimer = setTimeout(function() {
        if (clippyBubble) clippyBubble.style.display = 'none';
      }, 4200);
    }

    function renderTree() {
      left.textContent = '';
      treeRows = [];
      selectedTreeIndex = -1;
      var title = document.createElement('div');
      title.className = 'explorer-tree-title';
      title.textContent = 'Folders';
      left.appendChild(title);

      function appendFolder(node, parent, path, depth) {
        var row = document.createElement('div');
        row.className = 'explorer-tree-item';
        var isCurrentPath = samePath(path, currentPath);
        if (isCurrentPath) row.classList.add('selected');
        row.style.paddingLeft = (8 + depth * 14) + 'px';
        var treeIcon = document.createElement('span');
        treeIcon.className = 'explorer-tree-icon';
        renderUiIcon(treeIcon, 'icon:folderClosed', 'Folder');
        var treeLabel = document.createElement('span');
        treeLabel.textContent = node.name;
        row.appendChild(treeIcon);
        row.appendChild(treeLabel);
        row.addEventListener('click', function() {
          activePane = 'tree';
          navigateTo(path);
        });
        parent.appendChild(row);
        treeRows.push({ row: row, path: path.slice(), node: node });
        if (isCurrentPath) selectedTreeIndex = treeRows.length - 1;

        // Keep sidebar compact: only show a shallow tree on the left pane.
        if (depth >= 2) return;

        getDirectoryChildren(node).forEach(function(child) {
          if (child.type === 'folder') appendFolder(child, parent, path.concat(child.name), depth + 1);
        });
      }

      appendFolder(root, left, [], 0);
    }

    function selectTreeAt(index, shouldNavigate) {
      if (!treeRows.length) return;
      selectedTreeIndex = Math.max(0, Math.min(treeRows.length - 1, index));
      treeRows.forEach(function(entry, idx) {
        entry.row.classList.toggle('selected', idx === selectedTreeIndex);
      });
      if (shouldNavigate && treeRows[selectedTreeIndex]) {
        activePane = 'tree';
        navigateTo(treeRows[selectedTreeIndex].path);
      }
    }

    function renderBreadcrumbs() {
      breadcrumbs.textContent = '';
      var rootBtn = document.createElement('button');
      rootBtn.type = 'button';
      rootBtn.className = 'explorer-crumb';
      rootBtn.textContent = 'C:';
      rootBtn.addEventListener('click', function() { navigateTo([]); });
      breadcrumbs.appendChild(rootBtn);
      currentPath.forEach(function(part, idx) {
        var sep = document.createElement('span');
        sep.className = 'explorer-crumb-sep';
        sep.textContent = '>';
        breadcrumbs.appendChild(sep);
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'explorer-crumb';
        btn.textContent = part;
        btn.addEventListener('click', function() {
          navigateTo(currentPath.slice(0, idx + 1));
        });
        breadcrumbs.appendChild(btn);
      });
    }

    function formatSizeBytes(sizeText) {
      var raw = String(sizeText || '').trim().toUpperCase();
      if (!raw) return 0;
      var match = raw.match(/^([\d.]+)\s*(B|KB|MB|GB)?$/);
      if (!match) return 0;
      var value = Number(match[1] || '0');
      var unit = match[2] || 'B';
      var mult = unit === 'GB' ? 1024 * 1024 * 1024 : unit === 'MB' ? 1024 * 1024 : unit === 'KB' ? 1024 : 1;
      return value * mult;
    }

    function getItemSortGroup(item) {
      if (!item) return 3;
      if (item.type === 'folder') return 0;
      if (item.shortcut && item.shortcut.shortcutType) return 1;
      return 2;
    }

    function compareExplorerItems(a, b) {
      var av;
      var bv;
      if (sortKey === 'type') {
        av = getItemSortGroup(a) + ':' + fileTypeLabel(a);
        bv = getItemSortGroup(b) + ':' + fileTypeLabel(b);
      } else if (sortKey === 'size') {
        av = getItemSortGroup(a) * 1000000000 + (a.type === 'folder' ? -1 : formatSizeBytes(a.size));
        bv = getItemSortGroup(b) * 1000000000 + (b.type === 'folder' ? -1 : formatSizeBytes(b.size));
      } else if (sortKey === 'modified') {
        av = getItemSortGroup(a) + ':' + String(a.modified || '');
        bv = getItemSortGroup(b) + ':' + String(b.modified || '');
      } else {
        av = getItemSortGroup(a) + ':' + String(a.name || '');
        bv = getItemSortGroup(b) + ':' + String(b.name || '');
      }
      var result = 0;
      if (typeof av === 'number' && typeof bv === 'number') {
        result = av - bv;
      } else {
        result = String(av).localeCompare(String(bv), undefined, { sensitivity: 'base', numeric: true });
      }
      return sortAsc ? result : -result;
    }

    function selectItemAt(index, shouldPreview) {
      selectedIndex = index;
      listBody.querySelectorAll('.explorer-row').forEach(function(el, idx) {
        el.classList.toggle('selected', idx === selectedIndex);
      });
      if (shouldPreview && currentItems[selectedIndex]) {
        showPreview(currentItems[selectedIndex]);
      }
    }

  function showPreview(item) {
      preview.classList.add('active');
      if (!item) {
        preview.textContent = 'Select a file to preview. Double-click to open.';
        return;
      }
      if (item.type === 'folder') {
        preview.textContent = 'Folder: ' + item.name + '\nDouble-click to open.';
        return;
      }
      if (item.shortcut && item.shortcut.shortcutType) {
        var target = item.shortcut.shortcutType === 'app'
          ? ('App: ' + (item.shortcut.targetApp || ''))
          : item.shortcut.shortcutType === 'folder'
            ? ('Folder: ' + pathString(item.shortcut.targetPath || []))
            : (item.shortcut.file && item.shortcut.file.name
              ? ('File: ' + item.shortcut.file.name)
              : 'File shortcut');
        preview.textContent = 'Shortcut: ' + item.name + '\nTarget: ' + target;
        return;
      }
      var ext = String(item.name || '').split('.').pop().toLowerCase();
      if (['png', 'jpg', 'jpeg', 'gif', 'webp'].indexOf(ext) !== -1 && item.url) {
        var safeUrl = '';
        try {
          var parsed = new URL(String(item.url || ''), window.location && window.location.href ? window.location.href : 'https://example.com/');
          if (parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'blob:') {
            safeUrl = parsed.toString();
          }
        } catch (_) {}
        preview.textContent = '';
        var label = document.createElement('div');
        label.textContent = 'Image preview: ' + item.name;
        var img = document.createElement('img');
        img.src = safeUrl || 'about:blank';
        img.alt = String(item.name || 'Image preview');
        img.style.marginTop = '6px';
        img.style.maxWidth = '100%';
        img.style.maxHeight = '180px';
        img.style.objectFit = 'contain';
        preview.appendChild(label);
        preview.appendChild(img);
        return;
      }
      if (['mp3', 'wav', 'ogg'].indexOf(ext) !== -1) {
        preview.textContent = 'Audio file: ' + item.name + '\nOpen to play in Winamp.';
        return;
      }
      if (['mp4', 'webm', 'mov'].indexOf(ext) !== -1) {
        preview.textContent = 'Video file: ' + item.name + '\nOpen to play in media viewer.';
        return;
      }
      preview.textContent = item.content || item.url || ('File selected: ' + item.name);
    }

    function applyPersistedMutations() {
      var log = safeReadMutationLog();
      log.forEach(function(entry) {
        applyMutation(root, entry);
      });
    }

    function openItem(item, basePath) {
      if (!item) return;
      var parentPath = Array.isArray(basePath) ? basePath.slice() : currentPath.slice();
      if (item.shortcut && typeof item.shortcut === 'object') {
        if (item.shortcut.shortcutType === 'app' && item.shortcut.targetApp) {
          if (typeof window.launchAppByAlias === 'function') {
            window.launchAppByAlias(item.shortcut.targetApp, 'explorer-shortcut');
            return;
          }
        }
        if (item.shortcut.shortcutType === 'folder' && Array.isArray(item.shortcut.targetPath)) {
          navigateTo(item.shortcut.targetPath.slice());
          return;
        }
        if (item.shortcut.shortcutType === 'file' && item.shortcut.file && window.FileHandlers && typeof window.FileHandlers.openFile === 'function') {
          window.FileHandlers.openFile(item.shortcut.file);
          return;
        }
      }
      if (item.type === 'folder') {
        navigateTo(parentPath.concat(item.name));
        return;
      }
      if (window.FileHandlers && typeof window.FileHandlers.openFile === 'function') {
        var payload = Object.assign({}, item, {
          parentPath: parentPath,
          fullPath: parentPath.concat(item.name)
        });
        window.FileHandlers.openFile(payload);
      }
    }

    function closePropertiesDialog() {
      if (activePropertiesDialog && activePropertiesDialog.parentNode) {
        activePropertiesDialog.parentNode.removeChild(activePropertiesDialog);
      }
      activePropertiesDialog = null;
    }

    function appendDialogRow(parent, text) {
      var row = document.createElement('div');
      row.className = 'explorer-modal-row';
      row.textContent = text == null ? '' : String(text);
      parent.appendChild(row);
      return row;
    }

    function showConfirmDialog(title, message, onConfirm) {
      closePropertiesDialog();
      var overlay = document.createElement('div');
      overlay.className = 'explorer-modal-overlay';
      var modal = document.createElement('div');
      modal.className = 'explorer-modal';

      var titlebar = document.createElement('div');
      titlebar.className = 'explorer-modal-titlebar';
      var titleSpan = document.createElement('span');
      titleSpan.textContent = String(title || '');
      titlebar.appendChild(titleSpan);
      modal.appendChild(titlebar);

      var body = document.createElement('div');
      body.className = 'explorer-modal-body';
      appendDialogRow(body, message);
      modal.appendChild(body);

      var actions = document.createElement('div');
      actions.className = 'explorer-modal-actions';
      var yesBtn = document.createElement('button');
      yesBtn.type = 'button';
      yesBtn.className = 'explorer-modal-ok';
      yesBtn.textContent = 'Yes';
      var noBtn = document.createElement('button');
      noBtn.type = 'button';
      noBtn.className = 'explorer-modal-ok explorer-modal-cancel';
      noBtn.textContent = 'No';
      actions.appendChild(yesBtn);
      actions.appendChild(noBtn);
      modal.appendChild(actions);

      overlay.appendChild(modal);
      container.appendChild(overlay);
      activePropertiesDialog = overlay;
      function close() { closePropertiesDialog(); }
      if (yesBtn) yesBtn.addEventListener('click', function() {
        close();
        if (typeof onConfirm === 'function') onConfirm();
      });
      if (noBtn) noBtn.addEventListener('click', close);
      overlay.addEventListener('mousedown', function(event) {
        if (event.target === overlay) close();
      });
      if (yesBtn) yesBtn.focus();
    }

    function showPromptDialog(title, label, initialValue, onSubmit) {
      closePropertiesDialog();
      var overlay = document.createElement('div');
      overlay.className = 'explorer-modal-overlay';
      var modal = document.createElement('div');
      modal.className = 'explorer-modal';

      var titlebar = document.createElement('div');
      titlebar.className = 'explorer-modal-titlebar';
      var titleSpan = document.createElement('span');
      titleSpan.textContent = String(title || '');
      titlebar.appendChild(titleSpan);
      modal.appendChild(titlebar);

      var body = document.createElement('div');
      body.className = 'explorer-modal-body';
      appendDialogRow(body, label);
      var input = document.createElement('input');
      input.type = 'text';
      input.className = 'explorer-modal-input';
      input.value = String(initialValue || '');
      body.appendChild(input);
      modal.appendChild(body);

      var actions = document.createElement('div');
      actions.className = 'explorer-modal-actions';
      var okBtn = document.createElement('button');
      okBtn.type = 'button';
      okBtn.className = 'explorer-modal-ok';
      okBtn.textContent = 'OK';
      var cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'explorer-modal-ok explorer-modal-cancel';
      cancelBtn.textContent = 'Cancel';
      actions.appendChild(okBtn);
      actions.appendChild(cancelBtn);
      modal.appendChild(actions);

      overlay.appendChild(modal);
      container.appendChild(overlay);
      activePropertiesDialog = overlay;
      function close() { closePropertiesDialog(); }
      function submit() {
        var value = String(input && input.value || '').trim();
        if (!value) return;
        close();
        if (typeof onSubmit === 'function') onSubmit(value);
      }
      if (okBtn) okBtn.addEventListener('click', submit);
      if (cancelBtn) cancelBtn.addEventListener('click', close);
      if (input) {
        input.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') close();
        });
        setTimeout(function() { input.focus(); input.select(); }, 20);
      }
      overlay.addEventListener('mousedown', function(event) {
        if (event.target === overlay) close();
      });
    }

    function showProperties(item, fullPathParts) {
      if (!item) return;
      closePropertiesDialog();
      var fullParts = Array.isArray(fullPathParts) ? fullPathParts.slice() : currentPath.concat(item.name);
      var fullPath = pathString(fullParts);
      var typeText = fileTypeLabel(item);
      var sizeText = item.type === 'folder' ? '-' : (item.size || '-');
      var modifiedText = item.modified || '-';
      var overlay = document.createElement('div');
      overlay.className = 'explorer-modal-overlay';
      var modal = document.createElement('div');
      modal.className = 'explorer-modal';

      var titlebar = document.createElement('div');
      titlebar.className = 'explorer-modal-titlebar';
      var titleSpan = document.createElement('span');
      titleSpan.textContent = 'Properties';
      titlebar.appendChild(titleSpan);
      modal.appendChild(titlebar);

      var body = document.createElement('div');
      body.className = 'explorer-modal-body';
      var nameRow = document.createElement('div');
      nameRow.className = 'explorer-modal-name';
      nameRow.textContent = String(item.name || '');
      body.appendChild(nameRow);
      appendDialogRow(body, 'Path: ' + fullPath);
      appendDialogRow(body, 'Type: ' + typeText);
      appendDialogRow(body, 'Size: ' + sizeText);
      appendDialogRow(body, 'Modified: ' + modifiedText);
      modal.appendChild(body);

      var actions = document.createElement('div');
      actions.className = 'explorer-modal-actions';
      var okBtn = document.createElement('button');
      okBtn.type = 'button';
      okBtn.className = 'explorer-modal-ok';
      okBtn.textContent = 'OK';
      actions.appendChild(okBtn);
      modal.appendChild(actions);

      overlay.appendChild(modal);
      container.appendChild(overlay);
      activePropertiesDialog = overlay;
      if (okBtn) {
        okBtn.addEventListener('click', function() { closePropertiesDialog(); });
        okBtn.focus();
      }
      overlay.addEventListener('mousedown', function(event) {
        if (event.target === overlay) closePropertiesDialog();
      });
    }

    function beginInlineRename(item, index) {
      if (!item) return;
      var targetRow = listBody.children[index];
      var nameCell = targetRow && targetRow.children ? targetRow.children[0] : null;
      var textWrap = nameCell ? nameCell.querySelector('span:last-child') : null;
      if (!textWrap) return;
      var renameInput = document.createElement('input');
      renameInput.type = 'text';
      renameInput.value = item.name;
      renameInput.className = 'explorer-rename-input';
      textWrap.replaceWith(renameInput);
      renameInput.focus();
      renameInput.select();
      var finalize = function(confirm) {
        if (confirm) commitInlineRename(item, renameInput.value);
        else renderList(item.name);
      };
      renameInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') finalize(true);
        if (e.key === 'Escape') finalize(false);
      });
      renameInput.addEventListener('blur', function() { finalize(true); });
    }

    function renameNodeAtPath(targetPath, cleanName) {
      if (!Array.isArray(targetPath) || !targetPath.length) return false;
      var nextName = String(cleanName || '').trim();
      if (!nextName) return false;
      var parentPath = targetPath.slice(0, -1);
      var currentName = targetPath[targetPath.length - 1];
      if (nextName === currentName) return false;
      var parent = getNodeAtPath(root, parentPath);
      if (!parent || !Array.isArray(parent.children)) return false;
      var node = parent.children.find(function(child) { return child && child.name === currentName; }) || null;
      if (!node) return false;
      var conflict = parent.children.some(function(child) {
        return child !== node && String(child.name || '').toLowerCase() === nextName.toLowerCase();
      });
      if (conflict) return false;
      node.name = nextName;
      appendMutation({ type: 'rename', path: targetPath.slice(), to: nextName, ts: Date.now() });
      if (isDesktopDirectChild(targetPath)) {
        emitExplorerMutation('rename', { path: targetPath.slice(), to: nextName });
      }
      return true;
    }

    function deleteNodeAtPath(targetPath) {
      if (!Array.isArray(targetPath) || !targetPath.length) return false;
      var parentPath = targetPath.slice(0, -1);
      var currentName = targetPath[targetPath.length - 1];
      var parent = getNodeAtPath(root, parentPath);
      if (!parent || !Array.isArray(parent.children)) return false;
      var before = parent.children.length;
      parent.children = parent.children.filter(function(child) { return child && child.name !== currentName; });
      if (parent.children.length === before) return false;
      appendMutation({ type: 'delete', path: targetPath.slice(), ts: Date.now() });
      if (isDesktopDirectChild(targetPath)) {
        emitExplorerMutation('delete', { path: targetPath.slice() });
      }
      return true;
    }

    function createFolderAtPath(parentPath, preferredName) {
      var basePath = Array.isArray(parentPath) ? parentPath.slice() : [];
      var parent = getNodeAtPath(root, basePath);
      if (!parent || parent.type !== 'folder' || !Array.isArray(parent.children)) return null;
      var stem = String(preferredName || 'New Folder').trim() || 'New Folder';
      var nextName = stem;
      var counter = 2;
      while (parent.children.some(function(child) { return child && String(child.name || '').toLowerCase() === nextName.toLowerCase(); })) {
        nextName = stem + ' (' + counter + ')';
        counter++;
      }
      parent.children.push({
        type: 'folder',
        name: nextName,
        children: [],
        modified: getTodayStamp()
      });
      var fullPath = basePath.concat(nextName);
      appendMutation({
        type: 'create',
        path: fullPath.slice(),
        nodeType: 'folder',
        modified: getTodayStamp(),
        ts: Date.now()
      });
      if (isDesktopDirectChild(fullPath)) {
        emitExplorerMutation('create', {
          path: fullPath.slice(),
          nodeType: 'folder',
          name: nextName,
          modified: getTodayStamp()
        });
      }
      return fullPath;
    }

    function inferAppAliasFromName(name) {
      var base = String(name || '').replace(/\.exe$/i, '').trim().toLowerCase();
      var map = {
        'internet explorer': 'ie',
        'terminal': 'terminal',
        'notepad': 'notepad',
        'presentation': 'pres',
        'steam95': 'steam',
        'paint': 'paint',
        'msn messenger': 'msn',
        'winamp': 'winamp',
        'file explorer': 'explorer',
        'recycle bin': 'recycle',
        'disk defragmenter': 'defrag',
        'settings': 'sysprops'
      };
      return map[base] || '';
    }

    function createDesktopShortcutForItem(item, parentPath) {
      if (!item) return null;
      var desktopNode = getNodeAtPath(root, ['Desktop']);
      if (!desktopNode || !Array.isArray(desktopNode.children)) return null;

      var alias = inferAppAliasFromName(item.name);
      var shortcutMeta = {};
      var shortcutIcon = 'icon:file';
      if (alias) {
        shortcutMeta = { shortcutType: 'app', targetApp: alias };
        shortcutIcon = (window.APP_CONFIG && window.APP_CONFIG[alias] && window.APP_CONFIG[alias].icon) || 'icon:apps';
      } else if (item.type === 'folder') {
        shortcutMeta = { shortcutType: 'folder', targetPath: (parentPath || []).concat(item.name) };
        shortcutIcon = 'icon:folderClosed';
      } else {
        shortcutMeta = { shortcutType: 'file', file: Object.assign({}, item, { parentPath: (parentPath || []).slice(), fullPath: (parentPath || []).concat(item.name) }) };
        shortcutIcon = fileIcon(shortcutMeta.file || item);
      }

      var baseLabel = item.name;
      var shortcutName = baseLabel + ' - Shortcut.lnk';
      var n = 2;
      while (desktopNode.children.some(function(child) { return child && String(child.name || '').toLowerCase() === shortcutName.toLowerCase(); })) {
        shortcutName = baseLabel + ' - Shortcut (' + n + ').lnk';
        n++;
      }

      var shortcutNode = {
        type: 'file',
        name: shortcutName,
        size: '1 KB',
        modified: getTodayStamp(),
        icon: shortcutIcon,
        desktopId: 'desktop-shortcut-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7),
        shortcut: shortcutMeta
      };
      desktopNode.children.push(shortcutNode);
      var fullPath = ['Desktop', shortcutName];
      appendMutation({
        type: 'create',
        path: fullPath.slice(),
        nodeType: 'file',
        size: '1 KB',
        modified: getTodayStamp(),
        desktopId: shortcutNode.desktopId,
        shortcut: shortcutMeta,
        ts: Date.now()
      });
      emitExplorerMutation('create', {
        path: fullPath.slice(),
        nodeType: 'file',
        name: shortcutName,
        size: '1 KB',
        modified: getTodayStamp(),
        shortcut: shortcutMeta
      });
      return shortcutName;
    }

    function closeContextMenu() {
      if (activeContextMenu && activeContextMenu.parentNode) {
        activeContextMenu.parentNode.removeChild(activeContextMenu);
      }
      activeContextMenu = null;
    }

    function openContextMenuAt(x, y, item, index, basePath) {
      closeContextMenu();
      var menu = document.createElement('div');
      menu.className = 'ctx-menu';
      var addItem = function(label, onClick) {
        var entry = document.createElement('div');
        entry.className = 'ctx-menu-item';
        entry.textContent = label;
        entry.addEventListener('mousedown', function(ev) {
          ev.preventDefault();
          ev.stopPropagation();
          closeContextMenu();
          if (typeof onClick === 'function') onClick();
        });
        menu.appendChild(entry);
      };
      var addSep = function() {
        var sep = document.createElement('div');
        sep.className = 'ctx-menu-sep';
        menu.appendChild(sep);
      };

      var parentPath = Array.isArray(basePath) ? basePath.slice() : currentPath.slice();
      var fullPath = parentPath.concat(item && item.name ? [item.name] : []);

      if (!item) {
        addItem('New Folder', function() {
          var createdPath = createFolderAtPath(parentPath, 'New Folder');
          if (!createdPath) return;
          renderTree();
          navigateTo(parentPath);
          renderList(createdPath[createdPath.length - 1]);
          triggerRefreshAnimation();
        });
        addItem('Refresh', function() {
          renderTree();
          renderList();
          triggerRefreshAnimation();
        });
        addSep();
        var folderNode = getNodeAtPath(root, parentPath);
        if (folderNode) addItem('Properties', function() { showProperties(folderNode, parentPath); });

        document.body.appendChild(menu);
        activeContextMenu = menu;
        var bgMaxLeft = Math.max(0, window.innerWidth - menu.offsetWidth - 4);
        var bgMaxTop = Math.max(0, window.innerHeight - menu.offsetHeight - 4);
        menu.style.left = Math.min(x, bgMaxLeft) + 'px';
        menu.style.top = Math.min(y, bgMaxTop) + 'px';
        return;
      }

      addItem('Open', function() { openItem(item, parentPath); });
      addItem('Create Shortcut on Desktop', function() {
        var createdShortcut = createDesktopShortcutForItem(item, parentPath);
        if (!createdShortcut) return;
        preview.classList.add('active');
        preview.textContent = 'Created desktop shortcut: ' + createdShortcut;
      });
      if (item.type === 'folder') {
        addItem('New Folder', function() {
          var childParentPath = parentPath.concat(item.name);
          var created = createFolderAtPath(childParentPath, 'New Folder');
          if (!created) return;
          renderTree();
          navigateTo(childParentPath);
          renderList(created[created.length - 1]);
          triggerRefreshAnimation();
        });
      }
      if (typeof index === 'number' && index >= 0) {
        addItem('Rename', function() { beginInlineRename(item, index); });
        addItem('Delete', function() { deleteSelectedItem(item); });
      } else {
        if (fullPath.length > 1) {
          addItem('Rename', function() {
            showPromptDialog('Rename Folder', 'Enter new folder name:', item && item.name ? item.name : '', function(nextName) {
              if (renameNodeAtPath(fullPath, nextName)) {
                renderTree();
                if (samePath(fullPath, currentPath)) navigateTo(parentPath.concat(nextName));
                else renderList();
              }
            });
          });
          addItem('Delete', function() {
            var label = item && item.name ? item.name : 'item';
            showConfirmDialog('Delete Folder', 'Delete "' + label + '"?', function() {
              if (deleteNodeAtPath(fullPath)) {
                if (samePath(fullPath, currentPath)) navigateTo(parentPath);
                else {
                  renderTree();
                  renderList();
                }
              }
            });
          });
        }
      }
      addSep();
      addItem('Properties', function() { showProperties(item, fullPath); });

      document.body.appendChild(menu);
      activeContextMenu = menu;
      var maxLeft = Math.max(0, window.innerWidth - menu.offsetWidth - 4);
      var maxTop = Math.max(0, window.innerHeight - menu.offsetHeight - 4);
      menu.style.left = Math.min(x, maxLeft) + 'px';
      menu.style.top = Math.min(y, maxTop) + 'px';
    }

    function commitInlineRename(item, nextName) {
      var clean = String(nextName || '').trim();
      if (!clean) {
        preview.classList.add('active');
        preview.textContent = 'Rename failed: name cannot be empty.';
        return false;
      }
      var oldName = item.name;
      var renamed = renameNodeAtPath(currentPath.concat(item.name), clean);
      if (!renamed) {
        preview.classList.add('active');
        preview.textContent = 'Rename failed: another file already uses "' + clean + '".';
        return false;
      }
      renderTree();
      renderList(clean);
      preview.classList.add('active');
      preview.textContent = 'Renamed ' + oldName + ' to ' + clean + '.';
      return true;
    }

    function deleteSelectedItem(explicitItem) {
      var item = explicitItem || currentItems[selectedIndex];
      if (!item) return;
      showConfirmDialog('Delete', 'Delete "' + item.name + '"?', function() {
        var deleted = deleteNodeAtPath(currentPath.concat(item.name));
        if (!deleted) return;
        renderTree();
        renderList();
        preview.classList.add('active');
        preview.textContent = 'Deleted ' + item.name + ' (local cache only).';
      });
    }

    function renderList(preferredSelectionName) {
      var node = getNodeAtPath(root, currentPath);
      var items = getDirectoryChildren(node).slice();
      items.sort(compareExplorerItems);
      currentItems = items;
      address.value = pathString(currentPath);
      renderBreadcrumbs();
      listBody.textContent = '';
      preview.classList.remove('active');
      preview.textContent = 'Select a file to preview. Double-click to open.';
      selectedIndex = -1;

      listHead.querySelectorAll('.explorer-head-btn').forEach(function(headBtn) {
        var isActive = headBtn.dataset.sortKey === sortKey;
        headBtn.classList.toggle('active', isActive);
        headBtn.textContent = headerMeta.find(function(meta) { return meta.key === headBtn.dataset.sortKey; }).label + (isActive ? (sortAsc ? ' ▲' : ' ▼') : '');
      });

      items.forEach(function(item, idx) {
        var row = document.createElement('button');
        row.type = 'button';
        row.className = 'explorer-row';

        var name = document.createElement('span');
        var rowIcon = document.createElement('span');
        rowIcon.className = 'explorer-row-icon';
        renderUiIcon(rowIcon, fileIcon(item), item.name);
        var rowLabel = document.createElement('span');
        rowLabel.textContent = item.name;
        name.appendChild(rowIcon);
        name.appendChild(rowLabel);
        var type = document.createElement('span');
        type.textContent = fileTypeLabel(item);
        var size = document.createElement('span');
        size.textContent = item.type === 'folder' ? '' : (item.size || '-');
        var mod = document.createElement('span');
        mod.textContent = item.modified || '-';

        row.appendChild(name);
        row.appendChild(type);
        row.appendChild(size);
        row.appendChild(mod);

        row.addEventListener('click', function() {
          activePane = 'list';
          selectItemAt(idx, true);
        });

        row.addEventListener('dblclick', function() {
          openItem(item);
        });
        listBody.appendChild(row);

        if (preferredSelectionName && String(item.name).toLowerCase() === String(preferredSelectionName).toLowerCase()) {
          selectedIndex = idx;
        }
      });

      if (selectedIndex < 0 && items.length) selectedIndex = 0;
      if (selectedIndex >= 0) selectItemAt(selectedIndex, true);
    }

    function navigateFromAddress(rawPath) {
      var value = String(rawPath || '').trim();
      if (!value) {
        navigateTo([]);
        return;
      }
      var normalized = value.replace(/\//g, '\\');
      normalized = normalized.replace(/^C:\\?/i, '');
      var parts = normalized.split('\\').filter(Boolean);
      var targetNode = getNodeAtPath(root, parts);
      if (!targetNode || targetNode.type !== 'folder') {
        preview.classList.add('active');
        preview.textContent = 'Path not found: ' + value;
        address.value = pathString(currentPath);
        return;
      }
      navigateTo(parts);
    }

    function injectDynamicFolders() {
      fetchJson('./assets/data/website-files.json').then(function(files) {
        var docs = getNodeAtPath(root, ['Documents', 'IDS2891']);
        if (docs && docs.type === 'folder') {
          docs.children = (files || []).filter(function(f) {
            return f.name && f.name.startsWith('IDS2891/');
          }).map(function(f) {
            var shortName = f.name.replace(/^IDS2891\//, '');
            return {
              type: 'file',
              name: shortName,
              size: f.size,
              modified: f.modified,
              // Serve IDS assets from within website root so hosted mode can load them.
              url: './assets/ids2891/' + shortName
            };
          });
        }

        var website = getNodeAtPath(root, ['Website Source']);
        if (website && website.type === 'folder') {
          var hierarchy = buildWebsiteHierarchy((files || []).filter(function(f) {
            return f.name && f.name.startsWith('website/');
          }).map(function(f) {
            return {
              name: f.name.replace(/^website\//, ''),
              type: f.type,
              size: f.size,
              modified: f.modified,
              path: './' + f.name
            };
          }));
          website.children = cloneHierarchy(hierarchy);
        }

        applyPersistedMutations();
        renderTree();
        renderList();
      }).catch(function() {
        // Keep static fallback tree when index files are missing.
      });
    }

    function navigateTo(pathParts) {
      currentPath = (pathParts || []).slice();
      if (!homeworkHintShown && currentPath.join('\\') === 'Documents\\100% Homework (seriously)') {
        homeworkHintShown = true;
        showExplorerClippyHint('It looks like you found the homework folder. I can help with that.');
      }
      renderTree();
      renderList();
    }

    listHead.querySelectorAll('.explorer-head-btn').forEach(function(headBtn) {
      headBtn.addEventListener('click', function() {
        var clicked = headBtn.dataset.sortKey || 'name';
        if (sortKey === clicked) sortAsc = !sortAsc;
        else {
          sortKey = clicked;
          sortAsc = true;
        }
        renderList();
      });
    });

    container.tabIndex = 0;
    container.addEventListener('keydown', function(event) {
      var targetTag = event.target && event.target.tagName ? event.target.tagName.toLowerCase() : '';
      if (targetTag === 'input' || targetTag === 'textarea' || (event.target && event.target.isContentEditable)) return;
      if (event.key === 'Escape') {
        closeContextMenu();
        closePropertiesDialog();
        return;
      }
      if (event.key === 'F5') {
        event.preventDefault();
        renderTree();
        renderList();
        triggerRefreshAnimation();
        return;
      }
      if (event.ctrlKey && event.shiftKey && (event.key === 'N' || event.key === 'n')) {
        event.preventDefault();
        var createBasePath = currentPath.slice();
        if (activePane === 'tree' && treeRows[selectedTreeIndex]) {
          createBasePath = treeRows[selectedTreeIndex].path.slice();
        }
        var createdByHotkey = createFolderAtPath(createBasePath, 'New Folder');
        if (!createdByHotkey) return;
        renderTree();
        navigateTo(createBasePath);
        renderList(createdByHotkey[createdByHotkey.length - 1]);
        return;
      }
      if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) {
        event.preventDefault();
        if (activePane === 'tree' && treeRows[selectedTreeIndex]) {
          var treeEntry = treeRows[selectedTreeIndex];
          var treeRect = treeEntry.row.getBoundingClientRect();
          openContextMenuAt(treeRect.left + 20, treeRect.top + 10, treeEntry.node, -1, treeEntry.path.slice(0, -1));
          return;
        }
        var selectedRow = listBody.children[selectedIndex];
        var selectedItem = currentItems[selectedIndex];
        if (selectedRow && selectedItem) {
          var rowRect = selectedRow.getBoundingClientRect();
          openContextMenuAt(rowRect.left + 20, rowRect.top + 10, selectedItem, selectedIndex, currentPath.slice());
        }
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (activePane === 'tree' && treeRows.length) selectTreeAt(selectedTreeIndex + 1, true);
        else if (currentItems.length) selectItemAt(Math.min(currentItems.length - 1, selectedIndex + 1), true);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (activePane === 'tree' && treeRows.length) selectTreeAt(selectedTreeIndex - 1, true);
        else if (currentItems.length) selectItemAt(Math.max(0, selectedIndex - 1), true);
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        if (activePane === 'tree' && treeRows[selectedTreeIndex]) {
          navigateTo(treeRows[selectedTreeIndex].path);
          return;
        }
        var selected = currentItems[selectedIndex];
        if (!selected) return;
        openItem(selected);
        return;
      }
      if (event.key === 'Backspace') {
        event.preventDefault();
        if (currentPath.length) navigateTo(currentPath.slice(0, -1));
        return;
      }
      if (event.key === 'F2') {
        event.preventDefault();
        if (activePane === 'tree' && treeRows[selectedTreeIndex]) {
          var treeTarget = treeRows[selectedTreeIndex];
          if (samePath(treeTarget.path, [])) return;
          showPromptDialog('Rename Folder', 'Enter new folder name:', treeTarget.node.name, function(nextFolderName) {
            if (renameNodeAtPath(treeTarget.path, nextFolderName)) {
              if (samePath(treeTarget.path, currentPath)) navigateTo(treeTarget.path.slice(0, -1).concat(nextFolderName));
              else {
                renderTree();
                renderList();
              }
            }
          });
          return;
        }
        var item = currentItems[selectedIndex];
        if (!item) return;
        beginInlineRename(item, selectedIndex);
        return;
      }
      if (event.key === 'Delete') {
        event.preventDefault();
        if (activePane === 'tree' && treeRows[selectedTreeIndex]) {
          var treeDelete = treeRows[selectedTreeIndex];
          if (samePath(treeDelete.path, [])) return;
          showConfirmDialog('Delete Folder', 'Delete "' + treeDelete.node.name + '"?', function() {
            if (deleteNodeAtPath(treeDelete.path)) {
              if (samePath(treeDelete.path, currentPath)) navigateTo(treeDelete.path.slice(0, -1));
              else {
                renderTree();
                renderList();
              }
            }
          });
          return;
        }
        deleteSelectedItem();
        return;
      }
      if (isTypeaheadKey(event)) {
        if (activePane === 'tree' && treeRows.length) {
          treeTypeaheadBuffer += event.key.toLowerCase();
          if (treeTypeaheadTimer) clearTimeout(treeTypeaheadTimer);
          treeTypeaheadTimer = setTimeout(function() { resetTreeTypeahead(); }, 900);
          var treeStart = Math.max(0, selectedTreeIndex + 1);
          for (var ti = 0; ti < treeRows.length; ti++) {
            var treeIdx = (treeStart + ti) % treeRows.length;
            var treeName = String((treeRows[treeIdx].node && treeRows[treeIdx].node.name) || '').toLowerCase();
            if (treeName.indexOf(treeTypeaheadBuffer) === 0) {
              selectTreeAt(treeIdx, true);
              break;
            }
          }
          return;
        }
        if (!currentItems.length) return;
        listTypeaheadBuffer += event.key.toLowerCase();
        if (listTypeaheadTimer) clearTimeout(listTypeaheadTimer);
        listTypeaheadTimer = setTimeout(function() { resetListTypeahead(); }, 900);
        var start = Math.max(0, selectedIndex + 1);
        for (var li = 0; li < currentItems.length; li++) {
          var idx = (start + li) % currentItems.length;
          var name = String(currentItems[idx].name || '').toLowerCase();
          if (name.indexOf(listTypeaheadBuffer) === 0) {
            selectItemAt(idx, true);
            break;
          }
        }
      }
    });

    renderTree();
    applyPersistedMutations();
    var bootPath = Array.isArray(window.__WIN95_EXPLORER_BOOT_PATH) ? window.__WIN95_EXPLORER_BOOT_PATH.slice() : ['Desktop'];
    window.__WIN95_EXPLORER_BOOT_PATH = null;
    if (!getNodeAtPath(root, bootPath)) bootPath = ['Desktop'];
    navigateTo(bootPath);
    address.addEventListener('keydown', function(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        navigateFromAddress(address.value);
      }
    });
    address.addEventListener('blur', function() {
      if (!address.value) address.value = pathString(currentPath);
    });
    container.addEventListener('contextmenu', function(event) {
      if (event.target.closest('.explorer-modal') || event.target.closest('.ctx-menu')) return;
      if (event.target.closest('.explorer-tree-item')) {
        var treeRow = event.target.closest('.explorer-tree-item');
        var treeEntry = treeRows.find(function(entry) { return entry.row === treeRow; }) || null;
        if (!treeEntry) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
        activePane = 'tree';
        navigateTo(treeEntry.path);
        var treeNode = getNodeAtPath(root, treeEntry.path);
        if (treeNode) openContextMenuAt(event.clientX, event.clientY, treeNode, -1, treeEntry.path.slice(0, -1));
        return;
      }
      var listRow = event.target.closest('.explorer-row');
      if (listRow) {
        var rowIndex = Array.prototype.indexOf.call(listBody.children, listRow);
        var listItem = currentItems[rowIndex];
        if (!listItem) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
        activePane = 'list';
        selectItemAt(rowIndex, true);
        openContextMenuAt(event.clientX, event.clientY, listItem, rowIndex, currentPath.slice());
        return;
      }
      if (event.target.closest('.explorer-list-body')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
        activePane = 'list';
        openContextMenuAt(event.clientX, event.clientY, null, -1, currentPath.slice());
      }
    });
    setTimeout(function() {
      showExplorerClippyHint("It looks like you're browsing files. Need help finding the homework folder?");
    }, 180);
    injectDynamicFolders();

    document.addEventListener('mousedown', function() { closeContextMenu(); });
    window.addEventListener('blur', function() {
      closeContextMenu();
      closePropertiesDialog();
    });
    window.addEventListener('resize', function() {
      closeContextMenu();
      closePropertiesDialog();
    });

    return container;
  }

  window.ExplorerApp = {
    launch: function(wm, animateWindowOpen, opts) {
      var options = opts || window.__WIN95_EXPLORER_OPEN_OPTS || {};
      window.__WIN95_EXPLORER_OPEN_OPTS = null;
      var content = buildExplorer();
      var appId = options && options.newWindow ? ('explorer-' + Date.now().toString(36)) : 'explorer';
      var title = options && options.newWindow ? 'File Explorer (New Window)' : 'File Explorer';
      var winEl = wm.createWindow(appId, title, 'icon:explorer', content, { width: 1100, height: 680 });
      if (typeof animateWindowOpen === 'function') animateWindowOpen(appId, winEl);
      // Bring to top immediately
      if (wm && typeof wm.focusWindow === 'function') {
        setTimeout(function() { wm.focusWindow(appId); }, 50);
      }
    }
  };
})();
