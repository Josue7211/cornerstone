const fs = require('fs');
const path = require('path');

const WEBSITE_ROOT = path.resolve(__dirname, '..');
const PROJECT_ROOT = path.resolve(WEBSITE_ROOT, '..');
const IDS_ROOT = path.join(PROJECT_ROOT, 'IDS2891');
const WEBSITE_INDEX_PATH = path.join(WEBSITE_ROOT, 'assets', 'data', 'website-files.json');
const DOC_INDEX_PATH = path.join(WEBSITE_ROOT, 'assets', 'data', 'md-index.json');
const POLL_MS = 1500;
const WATCH_MODE = process.argv.includes('--watch');

function formatSize(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return unitIndex === 0 ? `${value} ${units[unitIndex]}` : `${value.toFixed(1)} ${units[unitIndex]}`;
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function listWebsiteFiles() {
  function toDisplayRel(rel) {
    if (rel === 'website') return 'source code';
    if (rel.startsWith('website/')) return 'source code/' + rel.slice('website/'.length);
    return rel;
  }

  function walk(dir, prefix = '') {
    const names = fs.readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.name !== '.DS_Store')
      .filter((entry) => !entry.name.startsWith('.'))
      .sort((a, b) => {
        if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

    const rows = [];
    for (const entry of names) {
      const abs = path.join(dir, entry.name);
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (rel === '.gitignore') continue;

      const stat = fs.statSync(abs);
      const displayRel = toDisplayRel(rel);
      rows.push({
        name: displayRel,
        path: './' + path.relative(WEBSITE_ROOT, abs).replace(/\\/g, '/'),
        type: entry.isDirectory() ? 'folder' : 'file',
        size: entry.isDirectory() ? '' : formatSize(stat.size),
        modified: formatDate(stat.mtime)
      });

      if (entry.isDirectory()) {
        rows.push(...walk(abs, rel));
      }
    }
    return rows;
  }

  return walk(PROJECT_ROOT);
}

function listWorkspaceDocs() {
  return fs.readdirSync(IDS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .filter((entry) => entry.name.endsWith('.md') || entry.name === 'reflection.txt')
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => {
      const abs = path.join(IDS_ROOT, entry.name);
      const stat = fs.statSync(abs);
      return {
        name: entry.name,
        size: formatSize(stat.size),
        modified: formatDate(stat.mtime),
        path: '../IDS2891/' + entry.name
      };
    });
}

function writeJsonIfChanged(filePath, data) {
  const next = JSON.stringify(data, null, 2) + '\n';
  let prev = '';
  try {
    prev = fs.readFileSync(filePath, 'utf8');
  } catch (_) {
    prev = '';
  }

  if (prev === next) return false;
  fs.writeFileSync(filePath, next);
  return true;
}

function syncIndexes() {
  const websiteChanged = writeJsonIfChanged(WEBSITE_INDEX_PATH, listWebsiteFiles());
  const docsChanged = writeJsonIfChanged(DOC_INDEX_PATH, listWorkspaceDocs());
  if (websiteChanged || docsChanged) {
    console.log(`[sync-explorer-index] updated ${new Date().toISOString()}`);
  }
}

syncIndexes();
if (WATCH_MODE) {
  setInterval(syncIndexes, POLL_MS);
}
