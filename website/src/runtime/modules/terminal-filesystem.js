
const DEFAULT_TERMINAL_FILE_SYSTEM = {
  'C:\\RESEARCH': {
    type: 'dir',
    children: {
      DOCS: { type: 'dir', path: 'C:\\RESEARCH\\DOCS' },
      APPS: { type: 'dir', path: 'C:\\RESEARCH\\APPS' },
      WINDOWS: { type: 'dir', path: 'C:\\RESEARCH\\WINDOWS' },
      SYSTEM: { type: 'dir', path: 'C:\\RESEARCH\\SYSTEM' },
      'README.TXT': {
        type: 'file',
        content: [
          'From Pixels to Intelligence OS',
          'Use "help" for class demo commands.',
          'Use "--help" for the full shell.',
          'Use "dir", "cd", "type", and "open" to explore.'
        ].join('\n')
      }
    }
  },
  'C:\\RESEARCH\\DOCS': {
    type: 'dir',
    children: {
      'THESIS.TXT': {
        type: 'file',
        content: 'The cloud-first era of artificial intelligence is a temporary phase in computing history, not its conclusion.'
      },
      'GPU.TXT': {
        type: 'file',
        content: '1999 GeForce 256\n2007 CUDA\n2012 Kepler\n2017 Volta\n2020 Ampere\n2022 Hopper\n2024 Blackwell'
      },
      'CREDITS.TXT': {
        type: 'file',
        content: 'Three.js, GSAP, custom Win95 shell code, and local AI tooling.'
      }
    }
  },
  'C:\\RESEARCH\\APPS': {
    type: 'dir',
    children: {
      'PAPER.APP': { type: 'app', appId: 'paper' },
      'PRESENTATION.APP': { type: 'app', appId: 'pres' },
      'EXPLORER.APP': { type: 'app', appId: 'explorer' },
      'TERMINAL.APP': { type: 'app', appId: 'terminal' },
      'NOTES.APP': { type: 'app', appId: 'notepad' },
      'STEAM.APP': { type: 'app', appId: 'steam' },
      'RECYCLE.APP': { type: 'app', appId: 'recycle' }
    }
  },
  'C:\\RESEARCH\\WINDOWS': {
    type: 'dir',
    children: {
      'STARTMNU': { type: 'dir', path: 'C:\\RESEARCH\\WINDOWS\\STARTMNU' },
      'DESKTOP.INI': {
        type: 'file',
        content: '[.ShellClassInfo]\nIconFile=explorer.exe\nIconIndex=3'
      }
    }
  },
  'C:\\RESEARCH\\WINDOWS\\STARTMNU': {
    type: 'dir',
    children: {
      'PROGRAMS.TXT': {
        type: 'file',
        content: 'Research\nGames\nAccessories\nRecent'
      }
    }
  },
  'C:\\RESEARCH\\SYSTEM': {
    type: 'dir',
    children: {
      'AUTOEXEC.BAT': {
        type: 'file',
        content: '@ECHO OFF\nPROMPT $P$G\nPATH C:\\RESEARCH\\APPS'
      },
      'CONFIG.SYS': {
        type: 'file',
        content: 'FILES=40\nBUFFERS=20\nDOS=HIGH,UMB'
      },
      'SHELL.LOG': {
        type: 'file',
        content: 'Win95 shell initialized.\nWindow manager online.\nTerminal ready.'
      }
    }
  }
};

const TERMINAL_ROOT = 'C:\\RESEARCH';

function markProtectedTree(node) {
  if (!node || typeof node !== 'object') return;
  node.protected = true;
  if (node.children) {
    Object.values(node.children).forEach((child) => markProtectedTree(child));
  }
}

Object.values(DEFAULT_TERMINAL_FILE_SYSTEM).forEach((node) => markProtectedTree(node));

function cloneTerminalFsNode(node) {
  return JSON.parse(JSON.stringify(node));
}

function enforceDefaultProtection(liveFs) {
  if (!liveFs || typeof liveFs !== 'object') return;
  Object.entries(DEFAULT_TERMINAL_FILE_SYSTEM).forEach(([path, defaultNode]) => {
    if (!defaultNode || typeof defaultNode !== 'object') return;
    let liveNode = liveFs[path];
    if (!liveNode || typeof liveNode !== 'object') {
      liveNode = cloneTerminalFsNode(defaultNode);
      liveFs[path] = liveNode;
    }
    liveNode.protected = true;
    if (defaultNode.type === 'dir' && defaultNode.children) {
      if (!liveNode.children || typeof liveNode.children !== 'object') {
        liveNode.children = {};
      }
      Object.keys(defaultNode.children).forEach((childKey) => {
        let child = liveNode.children[childKey];
        if (!child || typeof child !== 'object') {
          child = cloneTerminalFsNode(defaultNode.children[childKey]);
          liveNode.children[childKey] = child;
        }
        markProtectedTree(child);
      });
    }
  });
}

function markNodeAsUnprotected(node) {
  if (!node || typeof node !== 'object') return;
  node.protected = false;
  if (node.children) {
    Object.values(node.children).forEach((child) => markNodeAsUnprotected(child));
  }
}

export function createTerminalFileSystem(options = {}) {
  const storageKey = options.storageKey || 'win95-terminal-fs-v1';
  const publicDemo = typeof window !== 'undefined' && !!window.__WIN95_PUBLIC_DEMO__;
  const storage = options.storage || (publicDemo ? null : (typeof window !== 'undefined' ? window.localStorage : null));
  let terminalFileSystem = loadTerminalFileSystem();

  function loadTerminalFileSystem() {
    try {
      if (!storage) return cloneTerminalFsNode(DEFAULT_TERMINAL_FILE_SYSTEM);
      const raw = storage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          enforceDefaultProtection(parsed);
          return parsed;
        }
      }
    } catch (_) {}
    const fallback = cloneTerminalFsNode(DEFAULT_TERMINAL_FILE_SYSTEM);
    enforceDefaultProtection(fallback);
    return fallback;
  }

  function saveTerminalFileSystem() {
    try {
      if (!storage) return;
      storage.setItem(storageKey, JSON.stringify(terminalFileSystem));
    } catch (_) {}
  }

  function normalizeTerminalPath(path) {
    return String(path || '').replace(/\//g, '\\').replace(/\\+/g, '\\').replace(/\\$/, '');
  }

  function resolveTerminalPath(rawPath, currentPath = TERMINAL_ROOT) {
    const input = String(rawPath || '').trim();
    if (!input || input === '.') return currentPath || TERMINAL_ROOT;
    if (input === '\\' || input.toUpperCase() === 'C:' || input.toUpperCase() === 'C:\\') return TERMINAL_ROOT;
    if (input === '..') {
      const current = normalizeTerminalPath(currentPath || TERMINAL_ROOT);
      const idx = current.lastIndexOf('\\');
      return idx <= 2 ? TERMINAL_ROOT : current.slice(0, idx);
    }
    if (/^[a-z]:\\/i.test(input)) return normalizeTerminalPath(input);
    return normalizeTerminalPath((currentPath || TERMINAL_ROOT) + '\\' + input);
  }

  function splitParentChild(path) {
    const normalized = normalizeTerminalPath(path);
    const lastSlash = normalized.lastIndexOf('\\');
    if (lastSlash < 3) return { parentPath: TERMINAL_ROOT, childName: normalized.slice(lastSlash + 1) };
    return {
      parentPath: normalized.slice(0, lastSlash),
      childName: normalized.slice(lastSlash + 1)
    };
  }

  function getTerminalNode(path) {
    return terminalFileSystem[normalizeTerminalPath(path)] || null;
  }

  function getDirectoryEntries(path) {
    const node = getTerminalNode(path);
    if (!node || node.type !== 'dir' || !node.children) return [];
    return Object.entries(node.children).map(([name, meta]) => ({ name, meta }));
  }

  function terminalPatternToRegex(pattern) {
    const escaped = String(pattern || '')
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp('^' + escaped + '$', 'i');
  }

  function findMatches(sessionPath, rawPattern) {
    const pattern = String(rawPattern || '').trim();
    if (!pattern.includes('*') && !pattern.includes('?')) return [];
    const resolved = resolveTerminalPath(pattern, sessionPath);
    const split = splitParentChild(resolved);
    const parent = getTerminalNode(split.parentPath);
    if (!parent || parent.type !== 'dir' || !parent.children) return [];
    const regex = terminalPatternToRegex(split.childName);
    return Object.entries(parent.children)
      .filter(([name]) => regex.test(name))
      .map(([name, meta]) => ({
        name,
        meta,
        path: meta.type === 'dir' ? meta.path : split.parentPath + '\\' + name
      }));
  }

  function directorySummary(path) {
    const entries = getDirectoryEntries(path);
    const dirCount = entries.filter(({ meta }) => meta.type === 'dir').length;
    const fileCount = entries.filter(({ meta }) => meta.type === 'file').length;
    const appCount = entries.filter(({ meta }) => meta.type === 'app').length;
    const bytes = entries
      .filter(({ meta }) => meta.type === 'file')
      .reduce((sum, { meta }) => sum + String(meta.content || '').length, 0);
    return [
      '     ' + fileCount + ' File(s) ' + bytes + ' bytes',
      '     ' + dirCount + ' Dir(s)  ' + (4096000 - bytes) + ' bytes free',
      appCount ? '     ' + appCount + ' App shortcut(s)' : ''
    ].filter(Boolean).join('\n');
  }

  function buildTree(path, depth = 0) {
    const entries = getDirectoryEntries(path);
    const lines = [];
    entries.forEach(({ name, meta }, index) => {
      const isLast = index === entries.length - 1;
      const prefix = ' '.repeat(depth * 2) + (isLast ? '\\-- ' : '|-- ');
      lines.push(prefix + name);
      if (meta.type === 'dir' && meta.path) {
        lines.push(buildTree(meta.path, depth + 1));
      }
    });
    return lines.filter(Boolean).join('\n');
  }

  function getDirectoryChild(parentPath, childName) {
    const parent = getTerminalNode(parentPath);
    if (!parent || parent.type !== 'dir' || !parent.children) return null;
    const wanted = String(childName || '').toUpperCase();
    for (const [name, meta] of Object.entries(parent.children)) {
      if (name.toUpperCase() === wanted) return { name, meta, parent };
    }
    return null;
  }

  function cloneNode(meta, sourcePath, targetPath) {
    if (!meta) return null;
    if (meta.type === 'dir') {
      const cloned = { type: 'dir', path: targetPath, children: {} };
      terminalFileSystem[targetPath] = { type: 'dir', children: {} };
      const sourceDir = getTerminalNode(sourcePath);
      const children = sourceDir && sourceDir.children ? Object.entries(sourceDir.children) : [];
      children.forEach(([childName, childMeta]) => {
        const childTargetPath = targetPath + '\\' + childName;
        let childClone = cloneNode(childMeta, childMeta.path, childTargetPath);
        if (childClone) terminalFileSystem[targetPath].children[childName] = childClone;
      });
      markNodeAsUnprotected(cloned);
      return cloned;
    }
    const copy = { ...meta };
    markNodeAsUnprotected(copy);
    return copy;
  }

  function deletePath(path) {
    const resolved = normalizeTerminalPath(path);
    if (isProtectedPath(resolved)) return false;
    const node = getTerminalNode(resolved);
    if (!node) return false;
    if (node.type === 'dir') {
      const dirNode = terminalFileSystem[resolved];
      const children = dirNode && dirNode.children ? Object.entries(dirNode.children) : [];
      children.forEach(([childName, childMeta]) => {
        const childPath = childMeta.type === 'dir' ? childMeta.path : resolved + '\\' + childName;
        deletePath(childPath);
      });
      delete terminalFileSystem[resolved];
    }
    const split = splitParentChild(resolved);
    const parent = getTerminalNode(split.parentPath);
    if (parent && parent.type === 'dir' && parent.children) {
      Object.keys(parent.children).forEach((key) => {
        if (key.toUpperCase() === split.childName.toUpperCase()) delete parent.children[key];
      });
    }
    return true;
  }

  function setNode(path, node) {
    const normalized = normalizeTerminalPath(path);
    markNodeAsUnprotected(node);
    terminalFileSystem[normalized] = node;
    return node;
  }

  function moveNode(oldPath, newPath) {
    const normalizedOld = normalizeTerminalPath(oldPath);
    const normalizedNew = normalizeTerminalPath(newPath);
    const node = terminalFileSystem[normalizedOld];
    if (!node) return null;
    if (isProtectedPath(normalizedOld)) return null;
    delete terminalFileSystem[normalizedOld];
    node.path = newPath;
    terminalFileSystem[normalizedNew] = node;
    return node;
  }

  function isProtectedPath(path) {
    const node = getTerminalNode(path);
    return !!(node && node.protected);
  }

  return {
    TERMINAL_ROOT,
    resolvePath: resolveTerminalPath,
    splitParentChild,
    getNode: getTerminalNode,
    getDirectoryEntries,
    findMatches,
    getDirectoryChild,
    cloneNode,
    deletePath,
    buildTree,
    directorySummary,
    save: saveTerminalFileSystem,
    setNode,
    moveNode,
    isProtectedPath
  };
}
