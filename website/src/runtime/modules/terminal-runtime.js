import { createMatrixRainController } from './terminal-matrix.js';
import { createTerminalFileSystem } from './terminal-filesystem.js';

export function createTerminalRuntime(deps = {}) {
  const wm = deps.wm;
  const resolveAppAlias = deps.resolveAppAlias || ((v) => String(v || ''));
  const launchAppByAlias = deps.launchAppByAlias || (() => '');
  const playWindowSound = deps.playWindowSound || (() => {});
  const getOpenWindowSummary = deps.getOpenWindowSummary || (() => []);
  const getAppConfig = deps.getAppConfig || (() => ({}));
  const getRecentAppIds = deps.getRecentAppIds || (() => []);
  const matrix = createMatrixRainController();
  const ADMIN_PASSWORD = String(
    typeof process !== 'undefined' && process.env && process.env.TERMINAL_ADMIN_PASSWORD
      ? process.env.TERMINAL_ADMIN_PASSWORD
      : ''
  ).trim();
  const USERS_ROOT = 'C:\\RESEARCH\\USERS';
  const DEFAULT_STUDENT = 'STUDENT1';

  const terminalHistory = [];
  const fsManager = createTerminalFileSystem();
  const TERMINAL_ROOT = fsManager.TERMINAL_ROOT;

  function normalizeUserName(raw) {
    const cleaned = String(raw || '').toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    return cleaned || DEFAULT_STUDENT;
  }

  function pathWithin(basePath, targetPath) {
    const base = String(basePath || '').toUpperCase();
    const target = String(targetPath || '').toUpperCase();
    return target === base || target.indexOf(base + '\\') === 0;
  }

  function ensureDirectoryNode(path) {
    const node = fsManager.getNode(path);
    if (node && node.type === 'dir') return node;
    return fsManager.setNode(path, { type: 'dir', children: {} });
  }

  function ensureWorkspace(userName) {
    const user = normalizeUserName(userName);
    const usersRootNode = ensureDirectoryNode(USERS_ROOT);
    const rootNode = ensureDirectoryNode(TERMINAL_ROOT);
    if (!rootNode.children) rootNode.children = {};
    rootNode.children.USERS = { type: 'dir', path: USERS_ROOT };
    const workspacePath = USERS_ROOT + '\\' + user;
    ensureDirectoryNode(workspacePath);
    if (!usersRootNode.children) usersRootNode.children = {};
    usersRootNode.children[user] = { type: 'dir', path: workspacePath };
    const workspaceNode = fsManager.getNode(workspacePath);
    if (!workspaceNode.children) workspaceNode.children = {};
    if (!workspaceNode.children['README.TXT']) {
      workspaceNode.children['README.TXT'] = {
        type: 'file',
        content: 'Student workspace for ' + user + '.\nYou can create, rename, and delete files here safely.'
      };
    }
    fsManager.save();
    return workspacePath;
  }

  function resetWorkspace(session) {
    if (!session || !session.workspacePath) return false;
    const split = fsManager.splitParentChild(session.workspacePath);
    const parent = fsManager.getNode(split.parentPath);
    if (!parent || parent.type !== 'dir' || !parent.children) return false;
    parent.children[split.childName] = { type: 'dir', path: session.workspacePath };
    fsManager.setNode(session.workspacePath, { type: 'dir', children: {} });
    const node = fsManager.getNode(session.workspacePath);
    if (node && node.children) {
      node.children['README.TXT'] = {
        type: 'file',
        content: 'Student workspace for ' + (session.userName || DEFAULT_STUDENT) + '.\nWorkspace was reset.'
      };
    }
    session.currentPath = session.workspacePath;
    fsManager.save();
    return true;
  }

  function initializeSessionWorkspace(session, preferredUser) {
    if (!session) return;
    session.userName = normalizeUserName(preferredUser || session.userName || DEFAULT_STUDENT);
    session.workspacePath = ensureWorkspace(session.userName);
    session.currentPath = session.workspacePath;
    session.adminUnlocked = false;
    if (!Array.isArray(session.auditLog)) session.auditLog = [];
  }

  function addAuditEntry(session, action, detail) {
    if (!session) return;
    if (!Array.isArray(session.auditLog)) session.auditLog = [];
    const stamp = new Date().toLocaleTimeString();
    session.auditLog.push('[' + stamp + '] ' + action + ' - ' + detail);
    if (session.auditLog.length > 80) session.auditLog.shift();
  }

  function hasWriteAccess(session, targetPath) {
    if (session && session.adminUnlocked) return true;
    if (!session || !session.workspacePath) return false;
    return pathWithin(session.workspacePath, targetPath);
  }

  function resolveTerminalPath(session, rawPath) {
    return fsManager.resolvePath(rawPath, session && session.currentPath);
  }

  function getTerminalNode(path) {
    return fsManager.getNode(path);
  }

  function getTerminalDirectoryEntries(path) {
    return fsManager.getDirectoryEntries(path);
  }

  function terminalFindMatches(session, rawPattern) {
    const basePath = session && session.currentPath ? session.currentPath : TERMINAL_ROOT;
    return fsManager.findMatches(basePath, rawPattern);
  }

  function terminalSplitParentChild(path) {
    return fsManager.splitParentChild(path);
  }

  function terminalGetDirectoryChild(parentPath, childName) {
    return fsManager.getDirectoryChild(parentPath, childName);
  }

  function terminalCloneNode(meta, sourcePath, targetPath) {
    return fsManager.cloneNode(meta, sourcePath, targetPath);
  }

  function terminalDeletePath(path) {
    return fsManager.deletePath(path);
  }

  function terminalPromptText(session) {
  return (session && session.currentPath ? session.currentPath : TERMINAL_ROOT) + '>';
}

  function terminalUpdatePrompt(session) {
  if (!session || !session.promptEl) return;
  session.promptEl.textContent = terminalPromptText(session);
}

  function terminalScrollToBottom(session) {
  if (!session || !session.output) return;
  session.output.scrollTop = session.output.scrollHeight;
}

  function terminalAppendLine(session, text, className) {
  if (!session || !session.buffer) return;
  const line = document.createElement('div');
  line.className = className ? 'terminal-line ' + className : 'terminal-line';
  line.textContent = text;
  session.buffer.appendChild(line);
  terminalScrollToBottom(session);
}

  function terminalAppendBlock(session, text, className) {
  String(text || '').split('\n').forEach((line) => terminalAppendLine(session, line, className));
}

  function parseTerminalArgs(source) {
  const args = [];
  const regex = /"([^"]*)"|[^\s]+/g;
  let match = null;
  while ((match = regex.exec(String(source || '')))) {
    args.push(match[1] != null ? match[1] : match[0]);
  }
  return args;
}

  function terminalClear(session) {
  if (!session || !session.output) return;
  matrix.cleanupMatrixRainForTarget(session.output);
  if (session.buffer) session.buffer.innerHTML = '';
}

  function terminalListDirectory(path) {
  const entries = getTerminalDirectoryEntries(path);
  if (!entries.length) return ' Directory is empty.';
  return entries.map(({ name, meta }) => {
    const tag = meta.type === 'dir' ? '<DIR>' : meta.type === 'app' ? '<APP>' : '     ';
    const size = meta.type === 'file'
      ? String((meta.content || '').length).padStart(8, ' ')
      : '        ';
    return ' 04-01-26  08:35p ' + tag.padEnd(7, ' ') + ' ' + size + ' ' + name;
  }).join('\n');
}

  function terminalBuildTree(path, depth = 0) {
  const entries = getTerminalDirectoryEntries(path);
  const lines = [];
  entries.forEach(({ name, meta }, index) => {
    const isLast = index === entries.length - 1;
    const prefix = ' '.repeat(depth * 2) + (isLast ? '\\-- ' : '|-- ');
    lines.push(prefix + name);
    if (meta.type === 'dir' && meta.path) {
      lines.push(terminalBuildTree(meta.path, depth + 1));
    }
  });
  return lines.filter(Boolean).join('\n');
}

  function terminalDirectorySummary(path) {
  const entries = getTerminalDirectoryEntries(path);
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

  function terminalReadNode(session, rawPath) {
  const resolved = resolveTerminalPath(session, rawPath);
  const name = String(rawPath || '').trim().toUpperCase();
  if (getAppConfig()[resolveAppAlias(name)]) {
    const appId = resolveAppAlias(name);
    return { type: 'app', appId, label: appId };
  }

  const exactNode = getTerminalNode(resolved);
  if (exactNode) return { type: exactNode.type, node: exactNode, path: resolved };

  const parentPath = resolved.slice(0, resolved.lastIndexOf('\\')) || TERMINAL_ROOT;
  const baseName = resolved.slice(resolved.lastIndexOf('\\') + 1).toUpperCase();
  const parent = getTerminalNode(parentPath);
  if (parent && parent.type === 'dir' && parent.children) {
    for (const [childName, childMeta] of Object.entries(parent.children)) {
      if (childName.toUpperCase() === baseName) {
        return { type: childMeta.type, node: childMeta, path: resolved, label: childName };
      }
    }
  }
  return null;
}


  function getTerminalCompletionCandidates(session, value) {
  const input = String(value || '');
  const trimmed = input.trimStart();
  const parts = trimmed.split(/\s+/);
  if (!parts[0]) return [];
  if (parts.length === 1 && !/\s$/.test(trimmed)) {
    return ['help', '--help', 'about', 'apps', 'windows', 'status', 'recent', 'open', 'launch', 'start', 'focus', 'minimize', 'restore', 'maximize', 'close', 'dir', 'ls', 'cd', 'pwd', 'type', 'cat', 'tree', 'echo', 'mkdir', 'md', 'del', 'erase', 'ren', 'rename', 'copy', 'events', 'matrix', 'steam', 'gpu', 'thesis', 'credits', 'llama', 'history', 'whoami', 'user', 'login', 'unlock', 'lock', 'audit', 'reset-workspace', 'export-audit', 'fullscreen', 'clear', 'procrastinate', 'panic', 'gimme_a', 'rant', 'yolo', 'dad_jokes', 'submit', 'citations', 'check_canvas', 'sleep', 'vram', 'benchmark']
      .filter((cmd) => cmd.indexOf(parts[0].toLowerCase()) === 0);
  }

  const command = parts[0].toLowerCase();
  if (['open', 'launch', 'start'].includes(command)) {
    const query = (parts.slice(1).join(' ') || '').toLowerCase();
    const apps = Object.keys(getAppConfig()).filter((appId) => appId.indexOf(query) === 0);
    const files = getTerminalDirectoryEntries(session.currentPath || TERMINAL_ROOT)
      .map(({ name }) => name)
      .filter((name) => name.toLowerCase().indexOf(query) === 0);
    return apps.concat(files);
  }

  if (['focus', 'minimize', 'restore', 'maximize', 'close'].includes(command)) {
    const query = (parts.slice(1).join(' ') || '').toLowerCase();
    return Array.from(wm.windows.keys()).filter((appId) => appId.indexOf(query) === 0);
  }

  if (['cd', 'dir', 'ls', 'type', 'cat', 'tree', 'mkdir', 'md', 'del', 'erase', 'ren', 'rename', 'copy'].includes(command)) {
    const query = (parts.slice(1).join(' ') || '').toUpperCase();
    return getTerminalDirectoryEntries(session.currentPath || TERMINAL_ROOT)
      .map(({ name }) => name)
      .filter((name) => name.indexOf(query) === 0);
  }

  return [];
}

  function getFocusedWindowEntry() {
  if (!window.wm || !wm.windows) return null;
  for (const [appId, entry] of wm.windows.entries()) {
    if (entry && entry.el && entry.el.classList.contains('focused') && !entry.minimized) {
      return { appId, entry };
    }
  }
  return null;
}

  function resolveOpenWindowTarget(rawValue) {
  const alias = resolveAppAlias(rawValue);
  if (wm.windows.has(alias)) return alias;
  const query = String(rawValue || '').trim().toLowerCase();
  if (!query) return '';
  for (const [appId, entry] of wm.windows.entries()) {
    if (appId === alias) return appId;
    const haystack = (appId + ' ' + (entry.title || '')).toLowerCase();
    if (haystack.indexOf(query) !== -1) return appId;
  }
  return '';
}

  function getAvailableAppsSummary() {
  return Object.entries(getAppConfig()).map(([appId, app]) => appId + ' - ' + app.title);
}

  function updateTerminalStatus(session) {
  if (!session || !session.statusWindows || !session.statusFocus) return;
  const summary = getOpenWindowSummary();
  const focused = summary.find((item) => item.focused && !item.minimized);
  session.statusWindows.textContent = summary.length + ' window' + (summary.length === 1 ? '' : 's');
  session.statusFocus.textContent = focused ? 'Focus: ' + focused.appId : 'Focus: desktop';
}

  function attachTerminalOsMonitor(session) {
  if (!session) return;
  if (session.osListener) window.removeEventListener('win95-os-event', session.osListener);
  session.osListener = function(event) {
    if (!session.output || !event || !event.detail) return;
    if (!session.showOsEvents) return;
    const evt = event.detail;
    const warn = evt.type === 'window_close' || evt.type === 'window_minimize';
    terminalAppendLine(session, '[os] ' + evt.message, warn ? 'os-event-line os-event-line--warn' : 'os-event-line');
    updateTerminalStatus(session);
  };
  window.addEventListener('win95-os-event', session.osListener);
}

  function performTerminalWindowAction(action, rawTarget) {
  const target = resolveOpenWindowTarget(rawTarget);
  if (!target) return 'No open window matched "' + rawTarget + '".';
  const entry = wm.windows.get(target);
  if (!entry) return 'No open window matched "' + rawTarget + '".';

  if (action === 'focus') {
    if (entry.minimized) wm.restoreWindow(target);
    else wm.focusWindow(target);
    return entry.title + ' focused.';
  }
  if (action === 'minimize') {
    if (entry.minimized) return entry.title + ' is already minimized.';
    playWindowSound('minimize');
    wm.minimizeWindow(target);
    return entry.title + ' minimized.';
  }
  if (action === 'restore') {
    if (entry.minimized) {
      wm.restoreWindow(target);
      return entry.title + ' restored.';
    }
    if (entry.el.dataset.maximized === 'true') {
      wm._toggleMaximize(target);
      return entry.title + ' restored to windowed mode.';
    }
    return entry.title + ' is already restored.';
  }
  if (action === 'maximize') {
    if (entry.el.dataset.maximized === 'true') return entry.title + ' is already maximized.';
    wm._toggleMaximize(target);
    return entry.title + ' maximized.';
  }
  if (action === 'close') {
    playWindowSound('close');
    wm.closeWindow(target);
    return entry.title + ' closed.';
  }
  return 'Unsupported action.';
}

  function runTerminalCommand(rawCommand, session) {
  const source = String(rawCommand || '').trim();
  if (!session) return;
  if (!source) return;

  terminalHistory.push(source);
  if (terminalHistory.length > 50) terminalHistory.shift();
  session.historyIndex = terminalHistory.length;
  terminalAppendLine(session, terminalPromptText(session) + ' ' + source, 'terminal-command-line');

  const parts = parseTerminalArgs(source);
  const command = (parts.shift() || '').toLowerCase();
  const rest = parts.join(' ').trim();

  if (command === 'clear' || command === 'cls') {
    terminalClear(session);
    updateTerminalStatus(session);
    return;
  }

  let resultText = '';
  let resultClass = '';

  switch (command) {
    case 'help':
      resultText = [
        'CLASSROOM COMMANDS',
        'help',
        'thesis',
        'about',
        'gpu',
        'steam',
        'matrix',
        'llama',
        'credits',
        'history',
        'whoami',
        'user <name>',
        'audit',
        'reset-workspace',
        'export-audit',
        'fullscreen',
        'clear',
        'submit',
        'citations',
        'check_canvas',
        'sleep',
        'vram',
        'benchmark',
        '',
        'Type "--help" for full OS shell commands.'
      ].join('\n');
      break;
    case '--help':
      resultText = [
        'FULL OS COMMANDS',
        'help',
        '--help',
        'clear',
        'history',
        'whoami',
        'user <name>',
        'login <name>',
        'audit',
        'reset-workspace',
        'export-audit',
        'unlock <password>',
        'lock',
        'apps',
        'windows',
        'status',
        'recent',
        'open <app>',
        'launch <app>',
        'start <app>',
        'focus <window>',
        'minimize <window>',
        'restore <window>',
        'maximize <window>',
        'close <window>',
        'fullscreen',
        'events [on|off]',
        'matrix',
        'ver',
        'date',
        'time',
        'vol',
        'exit',
        'dir',
        'ls',
        'cd <path>',
        'pwd',
        'type <file>',
        'cat <file>',
        'tree',
        'echo <text>',
        'mkdir <name>',
        'md <name>',
        'del <name>',
        'erase <name>',
        'ren <old> <new>',
        'rename <old> <new>',
        'copy <src> <dest>',
        '',
        'CONTENT COMMANDS',
        'thesis',
        'about',
        'gpu',
        'steam',
        'llama',
        'credits',
        'submit',
        'citations',
        'check_canvas',
        'sleep',
        'vram',
        'benchmark'
      ].join('\n');
      break;
    case 'whoami':
      resultText = [
        'User: ' + (session.userName || DEFAULT_STUDENT),
        'Workspace: ' + (session.workspacePath || TERMINAL_ROOT),
        'Admin unlock: ' + (session.adminUnlocked ? 'enabled' : 'disabled')
      ].join('\n');
      break;
    case 'login':
    case 'user': {
      if (!rest) {
        resultText = 'Usage: ' + command + ' <student_name>';
        break;
      }
      initializeSessionWorkspace(session, rest);
      terminalUpdatePrompt(session);
      resultText = 'Switched to ' + session.userName + '. Workspace: ' + session.workspacePath;
      addAuditEntry(session, 'SWITCH_USER', session.userName);
      break;
    }
    case 'unlock':
      if (!rest) {
        resultText = 'Usage: unlock <admin_password>';
        break;
      }
      if (!ADMIN_PASSWORD) {
        resultText = 'Admin override is not configured.';
        resultClass = 'terminal-error-line';
        break;
      }
      if (rest === ADMIN_PASSWORD) {
        session.adminUnlocked = true;
        resultText = 'Admin override enabled for this terminal session.';
        addAuditEntry(session, 'ADMIN_UNLOCK', session.userName || DEFAULT_STUDENT);
      } else {
        resultText = 'Invalid password.';
        resultClass = 'terminal-error-line';
      }
      break;
    case 'lock':
      session.adminUnlocked = false;
      resultText = 'Admin override disabled.';
      break;
    case 'audit':
      resultText = session.auditLog && session.auditLog.length
        ? ['AUDIT LOG'].concat(session.auditLog.slice(-20).map((line) => '  ' + line)).join('\n')
        : 'Audit log is empty.';
      break;
    case 'export-audit':
      resultText = session.auditLog && session.auditLog.length
        ? session.auditLog.join('\n')
        : 'Audit log is empty.';
      break;
    case 'reset-workspace': {
      const ok = resetWorkspace(session);
      if (!ok) {
        resultText = 'Workspace reset failed.';
        resultClass = 'terminal-error-line';
        break;
      }
      terminalUpdatePrompt(session);
      resultText = 'Workspace reset complete: ' + session.workspacePath;
      addAuditEntry(session, 'RESET_WORKSPACE', session.workspacePath);
      break;
    }
    case 'apps':
      resultText = ['Available applications:'].concat(getAvailableAppsSummary().map((line) => '  ' + line)).join('\n');
      break;
    case 'ver':
      resultText = 'From Pixels to Intelligence OS [Version 2.026.04]';
      break;
    case 'date': {
      const now = new Date();
      resultText = 'Current date is ' + now.toLocaleDateString();
      break;
    }
    case 'time': {
      const now = new Date();
      resultText = 'Current time is ' + now.toLocaleTimeString();
      break;
    }
    case 'vol':
      resultText = ' Volume in drive C is RESEARCH_OS\n Volume Serial Number is 1999-2560';
      break;
    case 'exit':
      wm.closeWindow('terminal');
      return;
    case 'windows': {
      const summary = getOpenWindowSummary();
      resultText = summary.length
        ? ['OPEN WINDOWS:'].concat(summary.map((item) => {
            const flags = [];
            if (item.focused) flags.push('focused');
            if (item.minimized) flags.push('minimized');
            return '  ' + item.appId + ' - ' + item.title + (flags.length ? ' [' + flags.join(', ') + ']' : '');
          })).join('\n')
        : 'No windows are open.';
      break;
    }
    case 'status': {
      const focused = getFocusedWindowEntry();
      const recentEvents = window.Win95OS ? window.Win95OS.getRecentEvents(4) : [];
      resultText = [
        'SYSTEM STATUS',
        'Windows: ' + getOpenWindowSummary().length,
        'Focused: ' + (focused ? focused.appId + ' - ' + focused.entry.title : 'desktop'),
        'Recent apps: ' + (getRecentAppIds().length ? getRecentAppIds().join(', ') : 'none'),
        'Latest events:',
        recentEvents.length ? recentEvents.map((evt) => '  - ' + evt.message).join('\n') : '  - none'
      ].join('\n');
      break;
    }
    case 'recent':
      resultText = getRecentAppIds().length
        ? ['RECENT APPS:'].concat(recentAppIds.map((appId) => '  ' + appId)).join('\n')
        : 'No recent apps yet.';
      break;
    case 'open':
    case 'launch':
    case 'start':
      if (!rest) resultText = 'Usage: open <app>';
      else {
        const targetNode = terminalReadNode(session, rest);
        if (targetNode && targetNode.type === 'app') {
          const appId = launchAppByAlias(targetNode.appId, 'terminal');
          resultText = appId ? 'Opened ' + appId + '.' : 'Unknown app "' + rest + '". Try "apps".';
        } else {
          const appId = launchAppByAlias(rest, 'terminal');
          resultText = appId ? 'Opened ' + appId + '.' : 'Bad command or file name.';
        }
      }
      break;
    case 'focus':
    case 'minimize':
    case 'restore':
    case 'maximize':
    case 'close':
      resultText = rest ? performTerminalWindowAction(command, rest) : 'Usage: ' + command + ' <window>';
      break;
    case 'fullscreen':
      resultText = toggleTerminalFullscreen()
        ? 'Terminal fullscreen toggled.'
        : 'Fullscreen toggle is unavailable right now.';
      break;
    case 'events':
      if (!rest) {
        session.showOsEvents = !session.showOsEvents;
      } else if (rest.toLowerCase() === 'on') {
        session.showOsEvents = true;
      } else if (rest.toLowerCase() === 'off') {
        session.showOsEvents = false;
      } else {
        resultText = 'Usage: events [on|off]';
        resultClass = 'terminal-error-line';
        break;
      }
      resultText = 'OS event output ' + (session.showOsEvents ? 'enabled.' : 'hidden.');
      break;
    case 'matrix':
      matrix.triggerMatrixRain(session.output);
      resultText = 'Matrix rain triggered. Press ESC to exit early.';
      break;
    case 'history':
      resultText = terminalHistory.length
        ? ['COMMAND HISTORY:'].concat(terminalHistory.slice(-12).map((line) => '  ' + line)).join('\n')
        : 'Command history is empty.';
      break;
    case 'pwd':
      resultText = session.currentPath || TERMINAL_ROOT;
      break;
    case 'dir':
    case 'ls': {
      const dirPath = rest ? resolveTerminalPath(session, rest) : (session.currentPath || TERMINAL_ROOT);
      const node = getTerminalNode(dirPath);
      const wildcardMatches = rest ? terminalFindMatches(session, rest) : [];
      if (wildcardMatches.length) {
        resultText = [
          ' Volume in drive C is RESEARCH_OS',
          ' Volume Serial Number is 1999-2560',
          '',
          ' Directory of ' + terminalSplitParentChild(resolveTerminalPath(session, rest)).parentPath,
          '',
          wildcardMatches.map(({ name, meta }) => {
            const tag = meta.type === 'dir' ? '<DIR>' : meta.type === 'app' ? '<APP>' : '     ';
            const size = meta.type === 'file' ? String((meta.content || '').length).padStart(8, ' ') : '        ';
            return ' 04-01-26  08:35p ' + tag.padEnd(7, ' ') + ' ' + size + ' ' + name;
          }).join('\n')
        ].join('\n');
      } else {
        resultText = (!node || node.type !== 'dir')
          ? 'File Not Found'
          : [
              ' Volume in drive C is RESEARCH_OS',
              ' Volume Serial Number is 1999-2560',
              '',
              ' Directory of ' + dirPath,
              '',
              terminalListDirectory(dirPath),
              '',
              terminalDirectorySummary(dirPath)
            ].join('\n');
      }
      break;
    }
    case 'cd': {
      const nextPath = rest ? resolveTerminalPath(session, rest) : TERMINAL_ROOT;
      const node = getTerminalNode(nextPath);
      if (!node || node.type !== 'dir') {
        resultText = 'The system cannot find the path specified.';
        resultClass = 'terminal-error-line';
      } else {
        session.currentPath = nextPath;
        terminalUpdatePrompt(session);
        resultText = session.currentPath;
      }
      break;
    }
    case 'type':
    case 'cat': {
      if (!rest) {
        resultText = 'Usage: type <file>';
        break;
      }
      const target = terminalReadNode(session, rest);
      if (!target) {
        resultText = 'The system cannot find the file specified.';
        resultClass = 'terminal-error-line';
      } else if (target.type === 'app') {
        resultText = 'This is an application shortcut. Use "open ' + rest + '".';
      } else if (target.type === 'dir') {
        resultText = 'Access denied.';
        resultClass = 'terminal-error-line';
      } else {
        resultText = target.node && target.node.content ? target.node.content : 'File is empty.';
      }
      break;
    }
    case 'tree': {
      const dirPath = rest ? resolveTerminalPath(session, rest) : (session.currentPath || TERMINAL_ROOT);
      const node = getTerminalNode(dirPath);
      resultText = (!node || node.type !== 'dir')
        ? 'File Not Found'
        : [
            'Folder PATH listing for volume RESEARCH_OS',
            'Path: ' + dirPath,
            terminalBuildTree(dirPath) || '\\-- <empty>'
          ].join('\n');
      break;
    }
    case 'echo':
      resultText = rest || '';
      break;
    case 'mkdir':
    case 'md': {
      if (!rest) {
        resultText = 'Syntax error.';
        resultClass = 'terminal-error-line';
        break;
      }
      const fullPath = resolveTerminalPath(session, rest);
      const split = terminalSplitParentChild(fullPath);
      const parent = getTerminalNode(split.parentPath);
      if (!parent || parent.type !== 'dir' || !parent.children) {
        resultText = 'The system cannot find the path specified.';
        resultClass = 'terminal-error-line';
      } else if (!hasWriteAccess(session, split.parentPath)) {
        resultText = 'Access denied. Allowed write path: ' + (session.workspacePath || TERMINAL_ROOT);
        resultClass = 'terminal-error-line';
      } else if (terminalGetDirectoryChild(split.parentPath, split.childName) || getTerminalNode(fullPath)) {
        resultText = 'A subdirectory or file ' + split.childName + ' already exists.';
        resultClass = 'terminal-error-line';
      } else {
        parent.children[split.childName] = { type: 'dir', path: fullPath };
        fsManager.setNode(fullPath, { type: 'dir', children: {} });
        fsManager.save();
        resultText = 'Created directory ' + split.childName + '.';
        addAuditEntry(session, 'MKDIR', fullPath);
      }
      break;
    }
    case 'del':
    case 'erase': {
      if (!rest) {
        resultText = 'Syntax error.';
        resultClass = 'terminal-error-line';
        break;
      }
      const target = terminalReadNode(session, rest);
      if (!target) {
        resultText = 'Could Not Find ' + rest;
        resultClass = 'terminal-error-line';
      } else if (target.type === 'dir') {
        resultText = 'Access denied.';
        resultClass = 'terminal-error-line';
      } else if (!hasWriteAccess(session, target.path || resolveTerminalPath(session, rest))) {
        resultText = 'Access denied. Allowed delete path: ' + (session.workspacePath || TERMINAL_ROOT);
        resultClass = 'terminal-error-line';
      } else {
        const deleted = terminalDeletePath(target.path || resolveTerminalPath(session, rest));
        fsManager.save();
        if (!deleted) {
          resultText = 'Access denied.';
          resultClass = 'terminal-error-line';
        } else {
          resultText = 'Deleted ' + (target.label || rest) + '.';
          addAuditEntry(session, 'DELETE', target.path || resolveTerminalPath(session, rest));
        }
      }
      break;
    }
    case 'ren':
    case 'rename': {
      if (parts.length < 2) {
        resultText = 'Syntax error.';
        resultClass = 'terminal-error-line';
        break;
      }
      const oldName = parts[0];
      const newName = parts.slice(1).join(' ');
      const oldTarget = terminalReadNode(session, oldName);
      if (!oldTarget) {
        resultText = 'The system cannot find the file specified.';
        resultClass = 'terminal-error-line';
      } else {
        const oldPath = oldTarget.path || resolveTerminalPath(session, oldName);
        if (!hasWriteAccess(session, oldPath)) {
          resultText = 'Access denied. Allowed rename path: ' + (session.workspacePath || TERMINAL_ROOT);
          resultClass = 'terminal-error-line';
          break;
        }
        if (fsManager.isProtectedPath(oldPath)) {
          resultText = 'Access denied. Preinstalled OS files are protected.';
          resultClass = 'terminal-error-line';
          break;
        }
        const split = terminalSplitParentChild(oldPath);
        const parent = getTerminalNode(split.parentPath);
        if (!parent || parent.type !== 'dir' || !parent.children) {
          resultText = 'The system cannot find the file specified.';
          resultClass = 'terminal-error-line';
        } else if (terminalGetDirectoryChild(split.parentPath, newName)) {
          resultText = 'Duplicate file name or file not found.';
          resultClass = 'terminal-error-line';
        } else {
          let oldKey = null;
          Object.keys(parent.children).forEach((key) => {
            if (key.toUpperCase() === split.childName.toUpperCase()) oldKey = key;
          });
          if (!oldKey) {
            resultText = 'The system cannot find the file specified.';
            resultClass = 'terminal-error-line';
          } else {
            const meta = parent.children[oldKey];
            delete parent.children[oldKey];
            if (meta.type === 'dir') {
              const newPath = split.parentPath + '\\' + newName;
              const moved = fsManager.moveNode(meta.path, newPath);
              if (!moved) {
                parent.children[oldKey] = meta;
                resultText = 'Access denied. Preinstalled OS files are protected.';
                resultClass = 'terminal-error-line';
                break;
              }
              meta.path = newPath;
            }
            parent.children[newName] = meta;
            fsManager.save();
            resultText = oldKey + ' renamed to ' + newName + '.';
            addAuditEntry(session, 'RENAME', oldPath + ' -> ' + (split.parentPath + '\\' + newName));
          }
        }
      }
      break;
    }
    case 'copy': {
      if (parts.length < 2) {
        resultText = 'Syntax error.';
        resultClass = 'terminal-error-line';
        break;
      }
      const sourcePathText = parts[0];
      const destPathText = parts.slice(1).join(' ');
      const sourceNode = terminalReadNode(session, sourcePathText);
      if (!sourceNode) {
        resultText = 'The system cannot find the file specified.';
        resultClass = 'terminal-error-line';
        break;
      }
      const destFullPath = resolveTerminalPath(session, destPathText);
      const destSplit = terminalSplitParentChild(destFullPath);
      const destParent = getTerminalNode(destSplit.parentPath);
      if (!destParent || destParent.type !== 'dir' || !destParent.children) {
        resultText = 'The system cannot find the path specified.';
        resultClass = 'terminal-error-line';
        break;
      }
      if (!hasWriteAccess(session, destSplit.parentPath)) {
        resultText = 'Access denied. Allowed destination path: ' + (session.workspacePath || TERMINAL_ROOT);
        resultClass = 'terminal-error-line';
        break;
      }
      if (terminalGetDirectoryChild(destSplit.parentPath, destSplit.childName)) {
        resultText = 'Overwrite not supported in demo shell.';
        resultClass = 'terminal-error-line';
        break;
      }
      const sourceFullPath = sourceNode.path || resolveTerminalPath(session, sourcePathText);
      const cloned = terminalCloneNode(sourceNode.node || sourceNode, sourceFullPath, destFullPath);
      if (!cloned) {
        resultText = 'Copy failed.';
        resultClass = 'terminal-error-line';
      } else {
        destParent.children[destSplit.childName] = cloned;
        fsManager.save();
        resultText = '        1 file(s) copied.';
        addAuditEntry(session, 'COPY', sourcePathText + ' -> ' + destFullPath);
      }
      break;
    }
    case 'thesis':
      resultText = [
        'THESIS STATEMENT',
        'The cloud-first era of artificial intelligence is a temporary phase in computing history, not its conclusion.',
        'Consumer hardware plus model compression and open-source tooling now make local AI practical.'
      ].join('\n');
      break;
    case 'about':
      resultText = [
        'FROM PIXELS TO INTELLIGENCE',
        'Project Author',
        'Open-source release',
        'Built with Three.js, GSAP, and vanilla JavaScript.'
      ].join('\n');
      break;
    case 'gpu':
      resultText = [
        'GPU EVOLUTION TIMELINE',
        '1999 GeForce 256',
        '2007 CUDA',
        '2012 Kepler',
        '2017 Volta',
        '2020 Ampere',
        '2022 Hopper',
        '2024 Blackwell'
      ].join('\n');
      break;
    case 'steam':
      launchAppByAlias('steam', 'terminal');
      resultText = 'Steam95 launched.';
      break;
    case 'llama':
      resultText = [
        'BONZI BUDDY AI MODE',
        'Powered by local Ollama models.',
        'No cloud dependency required for the desktop companion.'
      ].join('\n');
      break;
    case 'credits':
      resultText = [
        'CREDITS',
        'Three.js, GSAP, Google Fonts, and custom Win95 shell code.',
        'See the project files and paper for full attribution.'
      ].join('\n');
      break;
    case 'procrastinate':
      resultText = [
        'PROCRASTINATION STATUS REPORT',
        '',
        'Deadline: 2026-04-19',
        'Days remaining: COUNTING DOWN',
        'Work completed: 100% (on deadline day)',
        'Work completed (now): STARTING TONIGHT',
        'Coffee consumed: SOON TO BE ALL OF IT',
        'Sleep planned: OVERRATED',
        '',
        'Next action: Open Reddit for "research"'
      ].join('\n');
      break;
    case 'panic':
      resultText = [
        '⚠️ PANIC.EXE INITIATED ⚠️',
        '',
        'Symptoms:',
        '█████████░ 95% Heart rate elevated',
        '███░░░░░░░ 30% Coherence remaining',
        '█████████░ 99% Imposter syndrome',
        '████████░░ 87% SECOND GUESSING EVERYTHING',
        '',
        'Recommended action: Refresh for new panic symptoms',
        'Type "panic" again for more panic'
      ].join('\n');
      break;
    case 'gimme_a':
      resultText = [
        'GRADE MODIFICATION REQUEST DENIED',
        '',
        'Error: Grades are read-only',
        'Error: Academic integrity > sympathy',
        'Error: "Gimme an A" is not a persuasive argument',
        '',
        'Try: Studying, effort, understanding concepts',
        'Retry: No, seriously, those are the options'
      ].join('\n');
      break;
    case 'rant':
      const rants = [
        'Why is the deadline so soon??? I need 47 more hours in the day!!!',
        'WHO DECIDED GPU ARCHITECTURE NEEDED TO BE THIS COMPLEX',
        'CUDA be more like RUDE, am I right?',
        'I have seventeen browser tabs open and I STILL don\'t understand tensor cores',
        'Why are there so many versions of NVIDIA everything',
        'OK but why does my code work if I don\'t understand it',
        'The rubric said "concise" so I added MORE SLIDES',
        'This project: "be creative" | Me: "what if... Win95??" | Everyone: ??? | Me: ???'
      ];
      resultText = 'RANT: ' + rants[Math.floor(Math.random() * rants.length)];
      break;
    case 'yolo':
      resultText = [
        'YOLO.EXE — You Only Launch Once',
        '',
        'Launching: ALL APPS SIMULTANEOUSLY',
        'Launching: Paper',
        'Launching: Presentation',
        'Launching: Explorer',
        'Launching: Terminal (but you\'re already in it)',
        'Launching: Steam95',
        'Launching: Notepad (for panic notes)',
        'Launching: Browser (for more tabs)',
        '',
        'System status: CHAOS',
        'Regret level: MAXIMUM',
        'This was a mistake.'
      ].join('\n');
      for (let appId of ['paper', 'pres', 'explorer', 'steam']) {
        if (launchAppByAlias && typeof launchAppByAlias === 'function') {
          launchAppByAlias(appId, 'terminal');
        }
      }
      break;
    case 'dad_jokes':
      const jokes = [
        'Why did the GPU go to therapy? It had too many cores to process.',
        'What do you call a CPU that can\'t make decisions? A processor.',
        'Why did the AI apply to college? To get a better neural network.',
        'What\'s a GPU\'s favorite music? Parallel rock.',
        'Why don\'t scientists trust atoms? Because they make up everything (including floating point errors).',
        'What did the tensor say to the matrix? "You\'re totally multidimensional."',
        'Why is machine learning like cooking? Too many hyperparameters and you burn the whole thing.',
        'How many programmers does it take to change a GPU? None, that\'s a hardware problem.'
      ];
      resultText = jokes[Math.floor(Math.random() * jokes.length)];
      break;
    case 'submit':
      resultText = 'Error: deadline was 3 days ago. Submitting anyway... [████████████████████] ... Grade: ?';
      break;
    case 'check_canvas':
      resultText = 'Canvas is down. (It\'s not. You just don\'t want to look.)';
      break;
    case 'sleep':
      resultText = 'Not now. You have 4 hours until class.';
      break;
    case 'citations': {
      const sources = [
        'Krizhevsky, A., Sutskever, I., & Hinton, G. (2012). ImageNet classification with deep convolutional neural networks.',
        'NVIDIA Developer Blog. (2024). Why tensor cores matter for modern AI workloads.',
        'Someone on Reddit named "gpuwizard42". (2025). Trust me, bro, quantization works.',
        'A YouTube comment with 11 likes. (2026). "Just overclock it until it learns."',
        'My 3:14 AM notes.txt file. (2026). Unpublished manuscript.',
        'A dream I had about CUDA kernels. (2026). Personal communication.'
      ];
      const count = 3 + Math.floor(Math.random() * 4);
      resultText = ['Works Cited (Auto-Generated):']
        .concat(sources.slice(0, count).map((line, idx) => '  ' + (idx + 1) + '. ' + line))
        .join('\n');
      break;
    }
    case 'vram':
      resultText = [
        'VRAM USAGE - RTX 4070 Ti SUPER (16 GB)',
        '────────────────────────────────────',
        'bonzi_buddy.gguf        2.1 GB',
        'this_presentation       0.4 GB',
        'procrastination.dll     5.3 GB',
        'panic_buffer            1.8 GB',
        'citations_i_read        0.2 GB',
        'citations_i_didn\'t      6.2 GB  <- fragmented',
        '────────────────────────────────────',
        'total: 16.0 GB    available: 0 MB'
      ].join('\n');
      break;
    case 'benchmark':
      resultText = [
        'H100 cluster:        1,979 TFLOPS   $30,000/mo',
        'RTX 4070 Ti SUPER:      82 TFLOPS   $599 one-time',
        '',
        'winner: obvious'
      ].join('\n');
      break;
    default:
      resultText = 'Bad command or file name.\nType "help" for classroom commands or "--help" for the full shell.';
      resultClass = 'terminal-error-line';
      break;
  }

  if (resultText) terminalAppendBlock(session, resultText, resultClass);
  updateTerminalStatus(session);
}

  function toggleTerminalFullscreen() {
  if (window.wm && typeof window.wm._toggleMaximize === 'function') {
    window.wm._toggleMaximize('terminal');
    return true;
  }
  return false;
}

  return {
    TERMINAL_ROOT,
    USERS_ROOT,
    initializeSessionWorkspace,
    getHistory: () => terminalHistory,
    updatePrompt: terminalUpdatePrompt,
    scrollToBottom: terminalScrollToBottom,
    appendBlock: terminalAppendBlock,
    updateStatus: updateTerminalStatus,
    attachOsMonitor: attachTerminalOsMonitor,
    runCommand: runTerminalCommand,
    getCompletionCandidates: getTerminalCompletionCandidates,
    triggerMatrixRain: matrix.triggerMatrixRain,
    toggleFullscreen: toggleTerminalFullscreen,
  };
}
