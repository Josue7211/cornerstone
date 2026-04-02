#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const dataPath = path.resolve(__dirname, '../src/features/extras-ie-data.js');
const source = fs.readFileSync(dataPath, 'utf8');

function loadIEData(fetchImpl) {
  const sandbox = {
    window: {},
    fetch: fetchImpl,
    AbortController: global.AbortController,
    setTimeout,
    clearTimeout,
    Math,
    console
  };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: dataPath });
  return sandbox.window.Win95IEData;
}

async function run() {
  const goodFetch = async () => ({
    ok: true,
    json: async () => ({
      archived_snapshots: {
        closest: {
          available: true,
          url: 'https://web.archive.org/web/19970715000000/https://www.amazon.com/',
          timestamp: '19970715000000'
        }
      }
    })
  });

  const data = loadIEData(goodFetch);
  assert(data, 'Win95IEData should initialize');

  const geocities1999 = data.parseWaybackTarget('open geocities in 1999');
  assert(geocities1999, 'geocities target should parse');
  assert.strictEqual(geocities1999.mode, 'local-geocities-1999');

  const amazon1997 = data.parseWaybackTarget('amazon in 1997');
  assert(amazon1997, 'amazon target should parse');
  assert.strictEqual(amazon1997.requestedYear, 1997);
  assert(amazon1997.archiveUrl.includes('/web/19970101000000/'), 'year-specific archive URL should be generated');

  const randomCmd = data.parseWaybackTarget('surprise me with a random site in 1998');
  assert(randomCmd, 'natural random command should parse');
  assert.strictEqual(randomCmd.requestedYear, 1998);

  const suggestions = data.suggestAddressInput('geocit', null);
  assert(Array.isArray(suggestions), 'suggestions should be an array');
  assert(suggestions.length > 0, 'suggestions should include matches');

  const resolved = await data.resolveArchiveTarget({
    sourceUrl: 'https://www.amazon.com/',
    requestedYear: 1997,
    title: 'Amazon'
  });
  assert.strictEqual(resolved.archiveUrl, 'https://web.archive.org/web/19970715000000/https://www.amazon.com/');
  assert(String(resolved.title).includes('closest snapshot'), 'resolved title should indicate closest snapshot');

  const failingData = loadIEData(async () => {
    throw new Error('network down');
  });

  const fallbackResolved = await failingData.resolveArchiveTarget({
    sourceUrl: 'https://www.netscape.com/',
    requestedYear: 1999,
    title: 'Netscape'
  });
  assert(
    fallbackResolved.archiveUrl.includes('/web/19990101000000/https://www.netscape.com/'),
    'fallback should still produce a deterministic Wayback URL'
  );

  console.log('IE data tests passed');
}

run().catch((error) => {
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
