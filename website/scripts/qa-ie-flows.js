#!/usr/bin/env node
'use strict';

const assert = require('assert');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const appPath = path.join(root, 'src/features/extras-app-internet-explorer.js');
const dataPath = path.join(root, 'src/features/extras-ie-data.js');
const stylePath = path.join(root, 'style.css');

function run(cmd) {
  execSync(cmd, { cwd: root, stdio: 'inherit' });
}

function contains(filePath, needle) {
  return fs.readFileSync(filePath, 'utf8').indexOf(needle) !== -1;
}

function main() {
  run('node --check src/features/extras-app-internet-explorer.js');
  run('node --check src/features/extras-ie-data.js');
  run('node ./scripts/test-ie-data.js');

  assert(contains(appPath, 'about:history'), 'IE app should support about:history');
  assert(contains(appPath, 'about:favorites'), 'IE app should support about:favorites');
  assert(contains(appPath, 'updateTimelineForSource'), 'IE app should include timeline update flow');
  assert(contains(appPath, 'ie-source-badge'), 'IE app should render source badge');
  assert(contains(stylePath, '.ie-timelinebar'), 'CSS should include timeline styles');
  assert(contains(stylePath, '.ie-source-badge'), 'CSS should include source badge styles');
  assert(contains(dataPath, 'resolveArchiveTarget'), 'IE data should include resolver');

  console.log('IE QA checks passed');
}

try {
  main();
} catch (error) {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
}
