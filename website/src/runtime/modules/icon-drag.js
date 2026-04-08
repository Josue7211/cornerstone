export function initIconDragModule() {
  const iconGrid = document.getElementById('iconGrid');
  if (!iconGrid) return;
  const desktopElement = document.getElementById('desktop');

  const CELL_WIDTH = 80;
  const CELL_HEIGHT = 90;
  const CELL_GAP = 8;
  const STORAGE_KEY = 'win95-icon-grid-v11';
  const LEGACY_STORAGE_KEYS = [
    'win95-icon-grid-v10',
    'win95-icon-grid-v9',
    'win95-icon-grid-v8',
    'win95-icon-positions'
  ];
  const occupancy = Object.create(null);
  const DEFAULT_ICON_LAYOUT = {
    explorer: { row: 0, col: 0 },
    pres: { row: 0, col: 1 },
    paper: { row: 0, col: 2 },
    ie: { row: 1, col: 0 },
    paint: { row: 1, col: 1 },
    steam: { row: 1, col: 2 },
    terminal: { row: 2, col: 0 },
    msn: { row: 2, col: 1 },
    winamp: { row: 2, col: 2 },
    notepad: { row: 3, col: 0 },
    defrag: { row: 3, col: 1 },
    recycle: { row: 4, col: 0 }
  };
  const DEFAULT_DYNAMIC_LAYOUT = {
    'desktop-homework-shortcut': { row: 0, col: 3 },
    'desktop-timeline-shortcut': { row: 0, col: 4 },
    'desktop-mustwatch-shortcut': { row: 1, col: 3 }
  };

  function gridKey(row, col) {
    return `${row}:${col}`;
  }

  function getIcons() {
    return Array.from(iconGrid.querySelectorAll('.desktop-icon'));
  }

  function getIconId(icon) {
    if (!icon) return '';
    return icon.dataset.desktopId || icon.dataset.app || icon.dataset.iconKey || '';
  }

  function getSeededLayoutForIcon(icon) {
    const iconId = getIconId(icon);
    return DEFAULT_ICON_LAYOUT[iconId] || DEFAULT_DYNAMIC_LAYOUT[iconId] || null;
  }

  function getGridMetrics() {
    const rect = iconGrid.getBoundingClientRect();
    const stepX = CELL_WIDTH + CELL_GAP;
    const stepY = CELL_HEIGHT + CELL_GAP;
    const cols = Math.max(1, Math.floor((rect.width + CELL_GAP) / stepX));
    const rows = Math.max(1, Math.floor((rect.height + CELL_GAP) / stepY));
    return { rect, stepX, stepY, cols, rows };
  }

  function clearOccupancy(icon) {
    const row = parseInt(icon.dataset.gridRow, 10);
    const col = parseInt(icon.dataset.gridCol, 10);
    if (!Number.isNaN(row) && !Number.isNaN(col)) {
      const key = gridKey(row, col);
      if (occupancy[key] === icon) delete occupancy[key];
    }
  }

  function placeIcon(icon, row, col) {
    const { stepX, stepY } = getGridMetrics();
    const clampedRow = Math.max(0, row);
    const clampedCol = Math.max(0, col);
    clearOccupancy(icon);
    const key = gridKey(clampedRow, clampedCol);
    occupancy[key] = icon;
    icon.dataset.gridRow = clampedRow;
    icon.dataset.gridCol = clampedCol;
    icon.style.position = 'absolute';
    icon.style.left = `${clampedCol * stepX}px`;
    icon.style.top = `${clampedRow * stepY}px`;
  }

  function resetOccupancy() {
    Object.keys(occupancy).forEach(key => delete occupancy[key]);
  }

  function isCellFree(row, col, icon) {
    const key = gridKey(row, col);
    const occupant = occupancy[key];
    return !occupant || occupant === icon;
  }

  function findNearestCell(targetRow, targetCol, icon) {
    const { cols } = getGridMetrics();
    const sanitizedCol = Math.max(0, Math.min(targetCol, cols - 1));
    const sanitizedRow = Math.max(0, targetRow);
    if (isCellFree(sanitizedRow, sanitizedCol, icon)) {
      return { row: sanitizedRow, col: sanitizedCol };
    }
    const searchRadius = 12;
    for (let radius = 1; radius <= searchRadius; radius++) {
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          if (Math.abs(dr) !== radius && Math.abs(dc) !== radius) continue;
          const candidateRow = sanitizedRow + dr;
          const candidateCol = sanitizedCol + dc;
          if (candidateRow < 0 || candidateCol < 0 || candidateCol >= cols) continue;
          if (isCellFree(candidateRow, candidateCol, icon)) {
            return { row: candidateRow, col: candidateCol };
          }
        }
      }
    }
    return { row: sanitizedRow, col: sanitizedCol };
  }

  function findFirstFreeCell(icon) {
    const { cols, rows } = getGridMetrics();
    // Win98-like sweep: fill left-to-right across each row before going down.
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (isCellFree(row, col, icon)) return { row, col };
      }
    }
    // If viewport grid is saturated, append below.
    let row = rows;
    while (!isCellFree(row, 0, icon)) row++;
    return { row, col: 0 };
  }

  function layoutDefault() {
    resetOccupancy();
    const icons = getIcons();
    icons.forEach((icon, index) => {
      const seeded = getSeededLayoutForIcon(icon);
      if (seeded) {
        placeIcon(icon, seeded.row, seeded.col);
        return;
      }
      const cell = findFirstFreeCell(icon);
      placeIcon(icon, cell.row, cell.col);
    });
  }

  function clearLegacyStorage() {
    try {
      LEGACY_STORAGE_KEYS.forEach(key => localStorage.removeItem(key));
    } catch (e) {}
  }

  function restorePositions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      let restoredAny = false;
      const missingIcons = [];
      resetOccupancy();
      const icons = getIcons();
      icons.forEach((icon, index) => {
        const iconId = getIconId(icon);
        const data = parsed && iconId ? parsed[iconId] : null;
        if (!data) {
          missingIcons.push({ icon, index });
          return;
        }
        let row = Number.isFinite(data.row) ? data.row : null;
        let col = Number.isFinite(data.col) ? data.col : null;
        if (row === null || col === null) {
          const { stepX, stepY } = getGridMetrics();
          const left = typeof data.left === 'string' ? parseFloat(data.left) : parseFloat(data.left || 0);
          const top = typeof data.top === 'string' ? parseFloat(data.top) : parseFloat(data.top || 0);
          row = Number.isFinite(top) ? Math.round(top / stepY) : 0;
          col = Number.isFinite(left) ? Math.round(left / stepX) : 0;
        }
        const cell = findNearestCell(row, col, icon);
        placeIcon(icon, cell.row, cell.col);
        restoredAny = true;
      });

      // If saved layout is partial or stale, place missing icons at seeded defaults.
      missingIcons.forEach(({ icon, index }) => {
        const seeded = getSeededLayoutForIcon(icon);
        const cell = seeded
          ? findNearestCell(seeded.row, seeded.col, icon)
          : findFirstFreeCell(icon);
        placeIcon(icon, cell.row, cell.col);
      });
      return restoredAny;
    } catch (e) {
      return false;
    }
  }

  function savePositions() {
    if (document.body.classList.contains('presentation-active')) return;
    if (!desktopElement || !desktopElement.classList.contains('visible')) return;
    const positions = {};
    getIcons().forEach(icon => {
      const iconId = getIconId(icon);
      const row = parseInt(icon.dataset.gridRow, 10);
      const col = parseInt(icon.dataset.gridCol, 10);
      if (iconId && Number.isFinite(row) && Number.isFinite(col)) {
        positions[iconId] = { row, col };
      }
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
    } catch (e) {}
  }

  function savePositionsSoon() {
    window.requestAnimationFrame(() => {
      savePositions();
    });
  }

  function attachDragHandlers() {
    getIcons().forEach(icon => {
      if (icon.dataset.dragBound === '1') return;
      icon.dataset.dragBound = '1';
      icon.addEventListener('mousedown', function(e) {
        if (e.button !== 0) return;
        e.preventDefault();
        const gridRect = iconGrid.getBoundingClientRect();
        const iconRect = icon.getBoundingClientRect();
        const startX = e.clientX;
        const startY = e.clientY;
        const startLeft = iconRect.left - gridRect.left;
        const startTop = iconRect.top - gridRect.top;
        let moved = false;

        icon.style.position = 'absolute';
        icon.style.zIndex = '250';

        function onMove(ev) {
          const dx = ev.clientX - startX;
          const dy = ev.clientY - startY;
          if (!moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
          moved = true;
          ev.preventDefault();
          const { rect } = getGridMetrics();
          const maxLeft = Math.max(0, rect.width - iconRect.width);
          const maxTop = Math.max(0, rect.height - iconRect.height);
          const computedLeft = Math.min(maxLeft, Math.max(0, startLeft + dx));
          const computedTop = Math.min(maxTop, Math.max(0, startTop + dy));
          icon.style.left = `${computedLeft}px`;
          icon.style.top = `${computedTop}px`;
        }

        function onUp() {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          icon.style.zIndex = '';
          if (!moved) return;
          const { stepX, stepY } = getGridMetrics();
          const curLeft = parseFloat(icon.style.left) || 0;
          const curTop = parseFloat(icon.style.top) || 0;
          const row = Math.round(curTop / stepY);
          const col = Math.round(curLeft / stepX);
          const cell = findNearestCell(row, col, icon);
          placeIcon(icon, cell.row, cell.col);
          savePositionsSoon();
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  }

  function refreshLayout() {
    attachDragHandlers();
    const restored = restorePositions();
    if (!restored) layoutDefault();
    savePositionsSoon();
  }

  clearLegacyStorage();
  attachDragHandlers();

  const triggerLayout = () => refreshLayout();
  if (desktopElement && desktopElement.classList.contains('visible')) {
    triggerLayout();
  } else {
    window.addEventListener('win95-desktop-ready', triggerLayout, { once: true });
  }

  window.addEventListener('resize', function() {
    resetOccupancy();
    getIcons().forEach(icon => {
      const row = parseInt(icon.dataset.gridRow, 10);
      const col = parseInt(icon.dataset.gridCol, 10);
      if (Number.isFinite(row) && Number.isFinite(col)) {
        placeIcon(icon, row, col);
      }
    });
  });

  window.addEventListener('beforeunload', savePositions);
  window.addEventListener('pagehide', savePositions);
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') savePositions();
  });

  window.__win95IconGridRefresh = function() {
    refreshLayout();
  };
}
