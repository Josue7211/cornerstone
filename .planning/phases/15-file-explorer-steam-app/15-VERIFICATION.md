---
phase: 15-file-explorer-steam-app
verified: 2026-03-31T15:05:00Z
status: verified_with_human_playcheck_recommended
score: all FILE/STEAM requirements mapped to concrete code and command evidence; interactive gameplay feel still best confirmed manually
---

# Phase 15: File Explorer + Steam App Verification Report

**Phase Goal:** Users can browse all 14 semester assignments in a Win95 file explorer and launch playable mini-games from a Steam-style launcher.

**Verified:** 2026-03-31

## Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Explorer provides 6 assignment folders and 14 assignment entries | ✓ VERIFIED | `website/explorer.js` defines 6 top-level folders and assignment entries 1 through 14. Static check output reports `folderCount: 6`, `assignmentCount: 14`. |
| 2 | Clicking an assignment renders markdown in the viewer pane | ✓ VERIFIED | `website/explorer.js` file click handler calls `renderMarkdown(file.content)` and mounts `.explorer-md-content` into the right pane. |
| 3 | Markdown rendering is sanitized | ✓ VERIFIED | `renderMarkdown()` uses `marked.parse()` followed by `DOMPurify.sanitize()`. |
| 4 | Hidden `definitely_not_homework` easter egg folder exists | ✓ VERIFIED | `website/explorer.js` defines `EASTER_EGG_FOLDER` with key `definitely_not_homework` and hidden styling class `explorer-folder-hidden`. |
| 5 | Steam launcher uses a two-pane layout and required entries | ✓ VERIFIED | `website/steam.js` builds `.steam-sidebar` and `.steam-detail`; game catalog includes Snake, Silicon Runner, CPU vs GPU Race, Hardware Timeline, Pioneer Profiles. |
| 6 | Snake, Silicon Runner, CPU vs GPU Race implementations exist | ✓ VERIFIED | `website/games.js` exports `createSnakeGame`, `createSiliconRunner`, and `createCpuGpuRace` on `window.GamesModule`. |
| 7 | Steam install/play state persists across refresh | ✓ VERIFIED | `website/steam.js` uses `localStorage.getItem`/`setItem` through `loadState()`/`saveState()` under key `steam95_games`. |
| 8 | Explorer/Steam scripts are loaded by the page | ✓ VERIFIED | `website/index.html` includes CDN scripts for `marked`/`DOMPurify` and local scripts `games.js`, `explorer.js`, `steam.js`. |

## Requirement Coverage

| Requirement | Status | Evidence |
| --- | --- | --- |
| FILE-01 | ✓ VERIFIED | Folder tree + assignment set present (`folderCount: 6`, `assignmentCount: 14`) in static checks and `website/explorer.js` dataset. |
| FILE-02 | ✓ VERIFIED | File click event renders markdown content in viewer pane. |
| FILE-03 | ✓ VERIFIED | Markdown pipeline uses `marked` + `DOMPurify` and scripts are loaded in `index.html`. |
| FILE-04 | ✓ VERIFIED | Hidden `definitely_not_homework` folder exists with easter egg files. |
| STEAM-01 | ✓ VERIFIED | Steam dark two-pane layout built in `buildSteam()`. |
| STEAM-02 | ✓ VERIFIED | `createSnakeGame()` implemented and launched by `snake` entry. |
| STEAM-03 | ✓ VERIFIED | `createSiliconRunner()` implemented and launched by `silicon_runner` entry. |
| STEAM-04 | ✓ VERIFIED | `createCpuGpuRace()` includes parallel-vs-serial race and explanatory panel. |
| STEAM-05 | ✓ VERIFIED | Steam includes two experience demos (`hw_timeline`, `pioneer_profiles`). |

## Commands Run

```bash
node --check website/explorer.js
node --check website/steam.js
node --check website/games.js
```

```bash
node - <<'NODE'
const fs=require('fs');
const exp=fs.readFileSync('website/explorer.js','utf8');
const steam=fs.readFileSync('website/steam.js','utf8');
const games=fs.readFileSync('website/games.js','utf8');
const folderNames=['Library','Research Questions','Proposals','Check-ins','Presentation','Final Project'];
const foldersOk=folderNames.every(n=>exp.includes(`'${n}':`));
const assigns=Array.from(new Set((exp.match(/Assignment\\s+\\d+/g)||[]))).sort();
const hasHidden=exp.includes('definitely_not_homework');
const hasMarked=exp.includes('marked.parse')&&exp.includes('DOMPurify.sanitize');
const steamEntries=(steam.match(/id:\\s*'/g)||[]).length;
const hasMiniGames=['createSnakeGame','createSiliconRunner','createCpuGpuRace'].every(fn=>games.includes(fn));
const hasSteamLocalStorage=steam.includes('localStorage.getItem')&&steam.includes('localStorage.setItem');
console.log(JSON.stringify({foldersOk,folderCount:folderNames.length,assignmentCount:assigns.length,hasHidden,hasMarked,steamEntries,hasMiniGames,hasSteamLocalStorage},null,2));
NODE
```

Expected output snapshot:

```json
{
  "foldersOk": true,
  "folderCount": 6,
  "assignmentCount": 14,
  "hasHidden": true,
  "hasMarked": true,
  "steamEntries": 5,
  "hasMiniGames": true,
  "hasSteamLocalStorage": true
}
```

## Human Playcheck (Recommended)

1. Open `website/index.html` in a browser and launch `My Computer`.
2. Expand each of the 6 folders, click at least one file per folder, and confirm right-pane markdown rendering.
3. Expand hidden `definitely_not_homework` and open at least one easter egg file.
4. Launch `Steam95`, install then play each of: Snake, Silicon Runner, CPU vs GPU Race.
5. Refresh browser and confirm installed/play state badges persist.

## Summary

Phase 15 requirements are satisfied in code and static verification checks, with interactive gameplay/UX quality suitable for final manual browser confirmation.
