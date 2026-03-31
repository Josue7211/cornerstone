# Phase 15 Context: File Explorer + Steam App

## Intent

Phase 15 delivers two app experiences inside the Win95 shell:

- `My Computer` file explorer for semester assignment browsing
- `Steam95` launcher for games and interactive experience demos

## Requirement Targets

- `FILE-01`, `FILE-02`, `FILE-03`, `FILE-04`
- `STEAM-01`, `STEAM-02`, `STEAM-03`, `STEAM-04`, `STEAM-05`

## Current Code Surfaces

- `website/explorer.js`: folder tree + markdown rendering + hidden easter egg folder
- `website/steam.js`: Steam-style two-pane UI + install/play persistence
- `website/games.js`: Snake, Silicon Runner, CPU vs GPU Race mini-games
- `website/main.js`: app launch wiring for Explorer and Steam
- `website/index.html`: scripts for `marked`, `DOMPurify`, `games.js`, `explorer.js`, and `steam.js`

## Verification Focus

1. Explorer displays 6 folders and 14 assignment entries.
2. Clicking files renders markdown content safely.
3. Hidden `definitely_not_homework` folder exists.
4. Steam launcher contains required entries and opens game windows.
5. Install/play state is persisted using `localStorage`.
