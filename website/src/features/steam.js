// ═══════════════════════════════════════════════════
// STEAM.JS — Steam95 library shell
// ═══════════════════════════════════════════════════
(function() {
  'use strict';

  var BIG_PICTURE_PREF_KEY = 'steam95-big-picture-enabled';
  var shared = window.Win95Shared || {};
  var steamState = window.SteamState || {};
  var catalog = window.SteamCatalog || {};
  var PUBLIC_DEMO = typeof window !== 'undefined' && !!window.__WIN95_PUBLIC_DEMO__;
  var GAMES = catalog.GAMES || [];
  var CATEGORY_ORDER = catalog.CATEGORY_ORDER || ['real', 'experience'];
  var CATEGORY_LABELS = catalog.CATEGORY_LABELS || {
    real: 'Real Games',
    experience: 'Experience Games'
  };

  function setIconContent(target, iconValue, altLabel) {
    if (!target) return;
    if (shared && typeof shared.renderIcon === 'function' && typeof iconValue === 'string' && iconValue.indexOf('icon:') === 0) {
      shared.renderIcon(target, iconValue, { alt: altLabel || 'icon', ariaLabel: altLabel || 'icon' });
      return;
    }
    target.textContent = iconValue || '';
  }

  function getGameState(gameId) {
    if (steamState && typeof steamState.getGameState === 'function') return steamState.getGameState(gameId);
    return { installed: true, installState: 'installed', installProgress: 100, playCount: 0, favorite: false, lastPlayedAt: 0, totalPlayMs: 0 };
  }

  function patchGame(gameId, patch) {
    if (steamState && typeof steamState.patchGameState === 'function') {
      steamState.patchGameState(gameId, patch);
    }
  }

  function installGame(gameId) {
    if (steamState && typeof steamState.setGameInstalled === 'function') steamState.setGameInstalled(gameId);
  }

  function uninstallGame(gameId) {
    if (steamState && typeof steamState.uninstallGame === 'function') steamState.uninstallGame(gameId);
  }

  function toggleFavorite(gameId) {
    if (steamState && typeof steamState.toggleFavorite === 'function') steamState.toggleFavorite(gameId);
  }

  function getAchievements(gameId) {
    if (steamState && typeof steamState.computeAchievements === 'function') return steamState.computeAchievements(gameId);
    return [];
  }

  function getGlobalStats() {
    if (steamState && typeof steamState.getGlobalStats === 'function') return steamState.getGlobalStats();
    return { totalGames: GAMES.length, installedGames: GAMES.length, favorites: 0, totalPlayMs: 0, playedGames: 0 };
  }

  function parseSizeMb(sizeText) {
    var raw = String(sizeText || '').trim().toLowerCase();
    var n = parseFloat(raw);
    if (!isFinite(n)) return 0;
    if (raw.indexOf('gb') !== -1) return n * 1024;
    return n;
  }

  function formatDuration(ms) {
    var totalSec = Math.max(0, Math.floor((ms || 0) / 1000));
    var h = Math.floor(totalSec / 3600);
    var m = Math.floor((totalSec % 3600) / 60);
    if (h > 0) return h + 'h ' + m + 'm';
    return m + 'm';
  }

  function formatRelative(ts) {
    if (!ts) return 'Never';
    var diff = Math.max(0, Date.now() - ts);
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
  }

  function getScreenshots(game) {
    var tags = game.tags || [];
    var labels = [
      (tags[0] || game.genre || 'Gameplay') + ' Preview',
      (tags[1] || 'Challenge') + ' Moment',
      (tags[2] || 'Highlights') + ' Screen'
    ];
    return labels.map(function(label, idx) {
      return {
        id: game.id + '-shot-' + idx,
        label: label,
        caption: game.title + ' · ' + label,
        background: game.banner
      };
    });
  }

  function getChangelog(game) {
    return [
      { version: 'v1.3.2', date: '2026-03-24', notes: 'Improved frame pacing and input responsiveness in windowed mode.' },
      { version: 'v1.2.0', date: '2026-03-10', notes: 'Added better controller detection and reduced load time for assets.' },
      { version: 'v1.0.0', date: '2026-02-27', notes: 'Steam95 launch build for ' + game.title + '.' }
    ];
  }

  function getRequirements(game) {
    var mb = parseSizeMb(game.size || '0.2 MB');
    return [
      'Storage: ' + game.size,
      'RAM: ' + (mb > 500 ? '512 MB' : '128 MB'),
      'CPU: Pentium II class or better',
      'Display: 800x600 or higher'
    ];
  }

  function byId(gameId) {
    for (var i = 0; i < GAMES.length; i++) if (GAMES[i].id === gameId) return GAMES[i];
    return null;
  }

  function loadBigPicturePreference() {
    if (PUBLIC_DEMO) return false;
    try {
      return localStorage.getItem(BIG_PICTURE_PREF_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function saveBigPicturePreference(enabled) {
    if (PUBLIC_DEMO) return;
    try {
      localStorage.setItem(BIG_PICTURE_PREF_KEY, enabled ? '1' : '0');
    } catch (e) {}
  }

  function buildSteam(wm, animateWindowOpen) {
    var launchGame = (window.SteamLaunch && window.SteamLaunch.launchGame) ? window.SteamLaunch.launchGame : function() {};

    var selectedGameId = GAMES[0] ? GAMES[0].id : null;
    var selectedItemEl = null;
    var visibleSidebarItems = [];
    var activeInstallId = null;
    var installQueue = [];
    var installTimer = null;
    var refreshQueued = false;
    var launchError = '';
    var fullscreenOverlay = null;
    var fullscreenContent = null;
    var fullscreenActive = false;
    var bigPictureOverlay = null;
    var bigPictureActive = false;
    var bigPicturePinned = loadBigPicturePreference();
    var bigPictureEscHandler = null;
    var bigPictureFocusables = [];
    var bigPictureFocusIndex = -1;
    var fullscreenEscHandler = null;
    var lastLaunchedGameWindowId = null;
    var topActions = null;
    var topBigPictureBtn = null;

    var container = document.createElement('div');
    container.className = 'steam-container';
    container.tabIndex = 0;

    var sidebar = document.createElement('div');
    sidebar.className = 'steam-sidebar';

    var sidebarTitle = document.createElement('div');
    sidebarTitle.className = 'steam-sidebar-title';
    sidebarTitle.textContent = 'STEAM95 LIBRARY';
    sidebar.appendChild(sidebarTitle);

    var controls = document.createElement('div');
    controls.className = 'steam-controls';
    var searchInput = document.createElement('input');
    searchInput.className = 'steam-search';
    searchInput.type = 'search';
    searchInput.placeholder = 'Search games...';
    searchInput.setAttribute('aria-label', 'Search games');

    var filterSelect = document.createElement('select');
    filterSelect.className = 'steam-filter';
    [
      ['all', 'All'],
      ['installed', 'Installed'],
      ['not_installed', 'Not Installed'],
      ['favorites', 'Favorites'],
      ['real', 'Real Games'],
      ['experience', 'Experience Games']
    ].forEach(function(pair) {
      var opt = document.createElement('option');
      opt.value = pair[0];
      opt.textContent = pair[1];
      filterSelect.appendChild(opt);
    });

    var sortSelect = document.createElement('select');
    sortSelect.className = 'steam-sort';
    [
      ['recent', 'Recently Played'],
      ['az', 'A-Z'],
      ['playtime', 'Most Playtime'],
      ['installed', 'Installed First'],
      ['size', 'Size (Large First)']
    ].forEach(function(pair) {
      var opt = document.createElement('option');
      opt.value = pair[0];
      opt.textContent = pair[1];
      sortSelect.appendChild(opt);
    });

    controls.appendChild(searchInput);
    controls.appendChild(filterSelect);
    controls.appendChild(sortSelect);
    sidebar.appendChild(controls);

    var sidebarList = document.createElement('div');
    sidebarList.className = 'steam-sidebar-list';
    sidebar.appendChild(sidebarList);

    var detail = document.createElement('div');
    detail.className = 'steam-detail';

    if (!PUBLIC_DEMO) {
      topActions = document.createElement('div');
      topActions.className = 'steam-top-actions';
      topBigPictureBtn = document.createElement('button');
      topBigPictureBtn.className = 'steam-top-bigpicture-btn';
      topBigPictureBtn.type = 'button';
      topBigPictureBtn.textContent = bigPicturePinned ? 'Exit Big Picture Mode' : 'Big Picture Mode';
      topBigPictureBtn.setAttribute('aria-pressed', bigPicturePinned ? 'true' : 'false');
      topActions.appendChild(topBigPictureBtn);
      detail.appendChild(topActions);
    }

    var dashboard = document.createElement('div');
    dashboard.className = 'steam-dashboard';
    detail.appendChild(dashboard);

    var detailBody = document.createElement('div');
    detailBody.className = 'steam-detail-body';
    detail.appendChild(detailBody);

    var detailDescription = document.createElement('div');
    detailDescription.className = 'steam-detail-description';
    detailBody.appendChild(detailDescription);

    container.appendChild(sidebar);
    container.appendChild(detail);

    function enqueueInstall(gameId) {
      var gs = getGameState(gameId);
      if (gs.installed || gs.installState === 'queued' || gs.installState === 'installing') return;
      installQueue.push(gameId);
      patchGame(gameId, { installState: 'queued', installProgress: Math.max(0, gs.installProgress || 0) });
      kickInstallLoop();
      queueRefresh();
    }

    function cancelInstall(gameId) {
      if (activeInstallId === gameId) {
        if (installTimer) clearInterval(installTimer);
        installTimer = null;
        activeInstallId = null;
      }
      installQueue = installQueue.filter(function(id) { return id !== gameId; });
      patchGame(gameId, { installState: 'not_installed', installProgress: 0, installed: false });
      kickInstallLoop();
      queueRefresh();
    }

    function resumeInstall(gameId) {
      var gs = getGameState(gameId);
      if (gs.installed) return;
      installQueue.push(gameId);
      patchGame(gameId, { installState: 'queued' });
      kickInstallLoop();
      queueRefresh();
    }

    function finishInstall(gameId) {
      installGame(gameId);
      patchGame(gameId, { installState: 'installed', installProgress: 100, installed: true });
    }

    function startInstall(gameId) {
      activeInstallId = gameId;
      patchGame(gameId, { installState: 'installing' });
      if (installTimer) clearInterval(installTimer);
      installTimer = setInterval(function() {
        var gs = getGameState(gameId);
        if (!gs || gs.installed) {
          clearInterval(installTimer);
          installTimer = null;
          activeInstallId = null;
          kickInstallLoop();
          queueRefresh();
          return;
        }
        var next = Math.min(100, (gs.installProgress || 0) + (Math.random() * 10 + 6));
        patchGame(gameId, { installProgress: Math.round(next), installState: 'installing' });
        if (next >= 100) {
          clearInterval(installTimer);
          installTimer = null;
          finishInstall(gameId);
          activeInstallId = null;
          kickInstallLoop();
        }
        queueRefresh();
      }, 360);
    }

    function kickInstallLoop() {
      if (activeInstallId || !installQueue.length) return;
      var next = installQueue.shift();
      if (!next) return;
      startInstall(next);
    }

    function bootstrapInstallQueue() {
      installQueue = [];
      GAMES.forEach(function(game) {
        var gs = getGameState(game.id);
        if (gs.installState === 'installing' || gs.installState === 'queued') {
          installQueue.push(game.id);
          patchGame(game.id, { installState: 'queued' });
        }
      });
      kickInstallLoop();
    }

    function getVisibleGames() {
      var query = String(searchInput.value || '').trim().toLowerCase();
      var filter = filterSelect.value;
      var sort = sortSelect.value;

      var list = GAMES.filter(function(game) {
        var gs = getGameState(game.id);
        if (query) {
          var hay = (game.title + ' ' + game.genre + ' ' + (game.tags || []).join(' ')).toLowerCase();
          if (hay.indexOf(query) === -1) return false;
        }
        if (filter === 'installed' && !gs.installed) return false;
        if (filter === 'not_installed' && gs.installed) return false;
        if (filter === 'favorites' && !gs.favorite) return false;
        if ((filter === 'real' || filter === 'experience') && game.category !== filter) return false;
        return true;
      });

      list.sort(function(a, b) {
        var sa = getGameState(a.id);
        var sb = getGameState(b.id);
        if (sort === 'az') return a.title.localeCompare(b.title);
        if (sort === 'playtime') return (sb.totalPlayMs || 0) - (sa.totalPlayMs || 0);
        if (sort === 'installed') {
          if (!!sb.installed !== !!sa.installed) return sb.installed ? 1 : -1;
          return a.title.localeCompare(b.title);
        }
        if (sort === 'size') return parseSizeMb(b.size) - parseSizeMb(a.size);
        return (sb.lastPlayedAt || 0) - (sa.lastPlayedAt || 0) || a.title.localeCompare(b.title);
      });

      return list;
    }

    function groupedByCategory(games) {
      var map = {};
      games.forEach(function(game) {
        var key = game.category || 'real';
        if (!map[key]) map[key] = [];
        map[key].push(game);
      });
      return map;
    }

    function selectGame(gameId) {
      selectedGameId = gameId;
      renderSidebar();
      renderDetail();
    }

    function queueRefresh() {
      if (refreshQueued) return;
      refreshQueued = true;
      requestAnimationFrame(function() {
        refreshQueued = false;
        renderSidebar();
        renderDashboard();
        renderDetail();
      });
    }

    function statusText(game, gs) {
      if (game.alwaysInstalled || gs.installed) return 'Installed';
      if (gs.installState === 'installing') return 'Installing ' + (gs.installProgress || 0) + '%';
      if (gs.installState === 'queued') return 'Queued';
      return 'Not Installed';
    }

    function createSidebarItem(game) {
      var gs = getGameState(game.id);
      var item = document.createElement('div');
      item.className = 'steam-game-item';
      item.dataset.gameId = game.id;
      item.tabIndex = 0;

      var iconEl = document.createElement('span');
      iconEl.className = 'steam-game-icon';
      setIconContent(iconEl, game.icon, game.title + ' icon');

      var nameWrap = document.createElement('div');
      nameWrap.className = 'steam-game-name-wrap';
      var nameEl = document.createElement('span');
      nameEl.className = 'steam-game-name';
      nameEl.textContent = game.title;
      var metaEl = document.createElement('span');
      metaEl.className = 'steam-game-meta';
      var installedState = gs.installed || game.alwaysInstalled;
      metaEl.textContent = statusText(game, gs);
      metaEl.classList.add(installedState ? 'steam-game-meta--installed' : 'steam-game-meta--missing');
      nameWrap.appendChild(nameEl);
      nameWrap.appendChild(metaEl);

      item.appendChild(iconEl);
      item.appendChild(nameWrap);

      if (gs.favorite) {
        var fav = document.createElement('span');
        fav.className = 'steam-fav-badge';
        fav.textContent = '★';
        item.appendChild(fav);
      }

      if (game.id === selectedGameId) {
        item.classList.add('selected');
        selectedItemEl = item;
      }

      item.addEventListener('click', function() {
        selectGame(game.id);
      });
      item.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          selectGame(game.id);
        }
      });

      visibleSidebarItems.push(item);
      return item;
    }

    function renderSidebar() {
      visibleSidebarItems = [];
      selectedItemEl = null;
      sidebarList.innerHTML = '';

      var visible = getVisibleGames();
      if (!visible.length) {
        var empty = document.createElement('div');
        empty.className = 'steam-empty';
        empty.textContent = 'No games match your search/filter.';
        sidebarList.appendChild(empty);
        return;
      }

      if (!byId(selectedGameId) || visible.map(function(g) { return g.id; }).indexOf(selectedGameId) === -1) {
        selectedGameId = visible[0].id;
      }

      var grouped = groupedByCategory(visible);
      CATEGORY_ORDER.forEach(function(categoryId) {
        var games = grouped[categoryId];
        if (!games || !games.length) return;
        var block = document.createElement('div');
        block.className = 'steam-category';

        var title = document.createElement('div');
        title.className = 'steam-category-title';
        title.textContent = CATEGORY_LABELS[categoryId] || categoryId;
        block.appendChild(title);

        var list = document.createElement('div');
        list.className = 'steam-category-items';
        var frag = document.createDocumentFragment();
        games.forEach(function(game) {
          frag.appendChild(createSidebarItem(game));
        });
        list.appendChild(frag);
        block.appendChild(list);
        sidebarList.appendChild(block);
      });
    }

    function renderDashboard() {
      dashboard.innerHTML = '';
      var stats = getGlobalStats();
      var stateList = GAMES.map(function(game) {
        return { game: game, state: getGameState(game.id) };
      });

      var continueGames = stateList
        .filter(function(item) { return item.state.installed && item.state.playCount > 0; })
        .sort(function(a, b) { return (b.state.lastPlayedAt || 0) - (a.state.lastPlayedAt || 0); })
        .slice(0, 3);

      var recentGames = stateList
        .filter(function(item) { return item.state.lastPlayedAt; })
        .sort(function(a, b) { return (b.state.lastPlayedAt || 0) - (a.state.lastPlayedAt || 0); })
        .slice(0, 4);

      var row = document.createElement('div');
      row.className = 'steam-dashboard-row';

      var continueCard = document.createElement('div');
      continueCard.className = 'steam-dash-card';
      var continueTitle = document.createElement('div');
      continueTitle.className = 'steam-dash-title';
      continueTitle.textContent = 'Continue Playing';
      continueCard.appendChild(continueTitle);

      if (continueGames.length) {
        continueGames.forEach(function(item) {
          var btn = document.createElement('button');
          btn.className = 'steam-continue-item';
          btn.type = 'button';
          btn.textContent = item.game.title + ' · ' + formatRelative(item.state.lastPlayedAt);
          btn.addEventListener('click', function() {
            selectGame(item.game.id);
            handlePlay(item.game);
          });
          continueCard.appendChild(btn);
        });
      } else {
        var emptyContinue = document.createElement('div');
        emptyContinue.className = 'steam-dash-empty';
        emptyContinue.textContent = 'Launch a game to build your continue list.';
        continueCard.appendChild(emptyContinue);
      }

      var recentCard = document.createElement('div');
      recentCard.className = 'steam-dash-card';
      var recentTitle = document.createElement('div');
      recentTitle.className = 'steam-dash-title';
      recentTitle.textContent = 'Recent Activity';
      recentCard.appendChild(recentTitle);

      if (recentGames.length) {
        recentGames.forEach(function(item) {
          var rowItem = document.createElement('div');
          rowItem.className = 'steam-recent-item';
          rowItem.textContent = item.game.title + ' · ' + item.state.playCount + ' launch(es) · ' + formatRelative(item.state.lastPlayedAt);
          recentCard.appendChild(rowItem);
        });
      } else {
        var emptyRecent = document.createElement('div');
        emptyRecent.className = 'steam-dash-empty';
        emptyRecent.textContent = 'No activity yet.';
        recentCard.appendChild(emptyRecent);
      }

      row.appendChild(continueCard);
      row.appendChild(recentCard);
      dashboard.appendChild(row);

      var summary = document.createElement('div');
      summary.className = 'steam-summary';
      summary.textContent = 'Installed: ' + stats.installedGames + '/' + stats.totalGames + ' · Favorites: ' + stats.favorites + ' · Total Playtime: ' + formatDuration(stats.totalPlayMs);
      dashboard.appendChild(summary);
    }

    function closeFullscreenOverlay() {
      if (!fullscreenActive || !fullscreenOverlay) return;
      if (fullscreenOverlay.parentElement) fullscreenOverlay.parentElement.removeChild(fullscreenOverlay);
      fullscreenActive = false;
      if (fullscreenEscHandler) {
        document.removeEventListener('keydown', fullscreenEscHandler);
        fullscreenEscHandler = null;
      }
    }

    function openFullscreenOverlay(game) {
      if (!game) return;
      if (!fullscreenOverlay) {
        fullscreenOverlay = document.createElement('div');
        fullscreenOverlay.className = 'steam-fullscreen-overlay';
        var inner = document.createElement('div');
        inner.className = 'steam-fullscreen-inner';
        var closeBtn = document.createElement('button');
        closeBtn.className = 'steam-fullscreen-close';
        closeBtn.textContent = 'Return to Library';
        var body = document.createElement('div');
        body.className = 'steam-fullscreen-body';
        var playBtn = document.createElement('button');
        playBtn.className = 'steam-fullscreen-play';
        playBtn.textContent = 'Play in Window';
        inner.appendChild(closeBtn);
        inner.appendChild(body);
        inner.appendChild(playBtn);
        fullscreenOverlay.appendChild(inner);
        fullscreenOverlay.addEventListener('click', function(evt) {
          if (evt.target === fullscreenOverlay) closeFullscreenOverlay();
        });
        closeBtn.addEventListener('click', closeFullscreenOverlay);
        playBtn.addEventListener('click', function() {
          if (selectedGameId) {
            var selected = byId(selectedGameId);
            if (selected) {
              handlePlay(selected);
              closeFullscreenOverlay();
            }
          }
        });
        fullscreenContent = body;
      }

      fullscreenContent.innerHTML = '';
      var hero = document.createElement('div');
      hero.className = 'steam-fullscreen-hero';
      hero.style.background = game.banner;
      var icon = document.createElement('div');
      icon.className = 'steam-fullscreen-hero-icon';
      setIconContent(icon, game.icon, game.title + ' icon');
      var title = document.createElement('div');
      title.className = 'steam-fullscreen-hero-title';
      title.textContent = game.title;
      var meta = document.createElement('div');
      meta.className = 'steam-fullscreen-hero-meta';
      meta.textContent = game.genre + ' · ' + game.size;
      hero.appendChild(icon);
      hero.appendChild(title);
      hero.appendChild(meta);
      fullscreenContent.appendChild(hero);

      var desc = document.createElement('p');
      desc.className = 'steam-fullscreen-desc';
      desc.textContent = game.desc;
      fullscreenContent.appendChild(desc);

      var tags = document.createElement('div');
      tags.className = 'steam-fullscreen-tags';
      (game.tags || []).forEach(function(tag) {
        var span = document.createElement('span');
        span.textContent = tag;
        tags.appendChild(span);
      });
      fullscreenContent.appendChild(tags);

      if (!document.body.contains(fullscreenOverlay)) document.body.appendChild(fullscreenOverlay);
      fullscreenActive = true;
      fullscreenEscHandler = function(evt) {
        if (evt.key === 'Escape') closeFullscreenOverlay();
      };
      document.addEventListener('keydown', fullscreenEscHandler);
    }

    function updateTopBigPictureButton() {
      if (!topBigPictureBtn) return;
      var active = bigPicturePinned || bigPictureActive;
      topBigPictureBtn.textContent = active ? 'Exit Big Picture Mode' : 'Big Picture Mode';
      topBigPictureBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
    }

    function closeBigPicture(options) {
      options = options || {};
      if (!bigPictureActive || !bigPictureOverlay) return;
      if (bigPictureOverlay.parentElement) bigPictureOverlay.parentElement.removeChild(bigPictureOverlay);
      bigPictureActive = false;
      bigPictureFocusables = [];
      bigPictureFocusIndex = -1;
      if (bigPictureEscHandler) {
        document.removeEventListener('keydown', bigPictureEscHandler);
        bigPictureEscHandler = null;
      }
      if (!options.keepPinned) {
        bigPicturePinned = false;
        saveBigPicturePreference(false);
      }
      updateTopBigPictureButton();
    }

    function handleOsWindowClose(evt) {
      var payload = evt && evt.detail ? evt.detail : null;
      var eventDetail = payload && payload.detail ? payload.detail : null;
      if (!payload || payload.type !== 'window_close' || !eventDetail) return;
      if (!lastLaunchedGameWindowId || eventDetail.appId !== lastLaunchedGameWindowId) return;
      lastLaunchedGameWindowId = null;
      if (!bigPicturePinned) return;
      setTimeout(function() {
        if (!bigPictureActive) openBigPicture();
      }, 80);
    }
    window.addEventListener('win95-os-event', handleOsWindowClose);

    function openBigPicture() {
      var game = byId(selectedGameId);
      if (!game) return;
      bigPictureFocusables = [];
      bigPictureFocusIndex = -1;

      if (!bigPictureOverlay) {
        bigPictureOverlay = document.createElement('div');
        bigPictureOverlay.className = 'steam-bigpicture-overlay';
      }
      bigPictureOverlay.innerHTML = '';

      var panel = document.createElement('div');
      panel.className = 'steam-bigpicture-panel';

      var closeBtn = document.createElement('button');
      closeBtn.className = 'steam-bigpicture-close';
      closeBtn.textContent = 'Exit Big Picture';
      closeBtn.addEventListener('click', closeBigPicture);
      panel.appendChild(closeBtn);
      bigPictureFocusables.push(closeBtn);

      var layout = document.createElement('div');
      layout.className = 'steam-bigpicture-layout';
      var left = document.createElement('div');
      left.className = 'steam-bigpicture-library-column';
      var leftTitle = document.createElement('div');
      leftTitle.className = 'steam-bigpicture-library-title';
      leftTitle.textContent = 'LIBRARY';
      left.appendChild(leftTitle);
      var leftList = document.createElement('div');
      leftList.className = 'steam-bigpicture-library-list';
      var grouped = groupedByCategory(getVisibleGames());
      CATEGORY_ORDER.forEach(function(categoryId) {
        var games = grouped[categoryId];
        if (!games || !games.length) return;
        var group = document.createElement('div');
        group.className = 'steam-bigpicture-library-group';

        var groupTitle = document.createElement('div');
        groupTitle.className = 'steam-bigpicture-library-group-title';
        groupTitle.textContent = (CATEGORY_LABELS[categoryId] || categoryId).toUpperCase();
        group.appendChild(groupTitle);

        games.forEach(function(g) {
          var item = document.createElement('div');
          item.className = 'steam-bigpicture-library-item' + (g.id === selectedGameId ? ' steam-bigpicture-library-item--selected' : '');
          item.textContent = g.title;
          item.tabIndex = 0;
          item.setAttribute('role', 'button');
          item.addEventListener('click', function() {
            selectedGameId = g.id;
            closeBigPicture({ keepPinned: true });
            renderSidebar();
            renderDetail();
            openBigPicture();
          });
          item.addEventListener('keydown', function(evt) {
            if (evt.key === 'Enter' || evt.key === ' ') {
              evt.preventDefault();
              item.click();
            }
          });
          bigPictureFocusables.push(item);
          group.appendChild(item);
        });

        leftList.appendChild(group);
      });
      left.appendChild(leftList);

      var right = document.createElement('div');
      right.className = 'steam-bigpicture-detail-column';

      var stateList = GAMES.map(function(itemGame) {
        return { game: itemGame, state: getGameState(itemGame.id) };
      });
      var continueGames = stateList
        .filter(function(item) { return item.state.installed && item.state.playCount > 0; })
        .sort(function(a, b) { return (b.state.lastPlayedAt || 0) - (a.state.lastPlayedAt || 0); })
        .slice(0, 3);
      var recentGames = stateList
        .filter(function(item) { return item.state.lastPlayedAt; })
        .sort(function(a, b) { return (b.state.lastPlayedAt || 0) - (a.state.lastPlayedAt || 0); })
        .slice(0, 3);

      var dashboardRow = document.createElement('div');
      dashboardRow.className = 'steam-bigpicture-dashboard-row';
      var continueCard = document.createElement('div');
      continueCard.className = 'steam-bigpicture-card';
      var continueTitle = document.createElement('div');
      continueTitle.className = 'steam-bigpicture-card-title';
      continueTitle.textContent = 'Continue Playing';
      continueCard.appendChild(continueTitle);
      if (continueGames.length) {
        continueGames.forEach(function(item) {
          var rowItem = document.createElement('div');
          rowItem.className = 'steam-bigpicture-card-row';
          rowItem.textContent = item.game.title + ' · ' + formatRelative(item.state.lastPlayedAt);
          continueCard.appendChild(rowItem);
        });
      } else {
        var continueEmpty = document.createElement('div');
        continueEmpty.className = 'steam-bigpicture-card-empty';
        continueEmpty.textContent = 'No launches yet.';
        continueCard.appendChild(continueEmpty);
      }
      var recentCard = document.createElement('div');
      recentCard.className = 'steam-bigpicture-card';
      var recentTitle = document.createElement('div');
      recentTitle.className = 'steam-bigpicture-card-title';
      recentTitle.textContent = 'Recent Activity';
      recentCard.appendChild(recentTitle);
      if (recentGames.length) {
        recentGames.forEach(function(item) {
          var recentRow = document.createElement('div');
          recentRow.className = 'steam-bigpicture-card-row';
          recentRow.textContent = item.game.title + ' · ' + item.state.playCount + ' launch(es)';
          recentCard.appendChild(recentRow);
        });
      } else {
        var recentEmpty = document.createElement('div');
        recentEmpty.className = 'steam-bigpicture-card-empty';
        recentEmpty.textContent = 'No activity yet.';
        recentCard.appendChild(recentEmpty);
      }
      dashboardRow.appendChild(continueCard);
      dashboardRow.appendChild(recentCard);
      right.appendChild(dashboardRow);

      var hero = document.createElement('div');
      hero.className = 'steam-bigpicture-hero';
      hero.style.background = game.banner;
      var heroIcon = document.createElement('div');
      heroIcon.className = 'steam-bigpicture-hero-icon';
      setIconContent(heroIcon, game.icon, game.title + ' icon');
      var heroTitle = document.createElement('div');
      heroTitle.className = 'steam-bigpicture-title';
      heroTitle.textContent = game.title;
      var heroMeta = document.createElement('div');
      heroMeta.className = 'steam-bigpicture-meta';
      heroMeta.textContent = game.genre + ' · ' + game.size;
      hero.appendChild(heroIcon);
      hero.appendChild(heroTitle);
      hero.appendChild(heroMeta);
      right.appendChild(hero);

      var desc = document.createElement('p');
      desc.className = 'steam-bigpicture-desc';
      desc.textContent = game.desc;
      right.appendChild(desc);

      var metaGrid = document.createElement('div');
      metaGrid.className = 'steam-bigpicture-meta-grid';
      var reqBlock = document.createElement('div');
      reqBlock.className = 'steam-bigpicture-meta-block';
      var reqTitle = document.createElement('div');
      reqTitle.className = 'steam-bigpicture-meta-title';
      reqTitle.textContent = 'System Requirements';
      reqBlock.appendChild(reqTitle);
      var reqList = document.createElement('ul');
      reqList.className = 'steam-bigpicture-req';
      getRequirements(game).forEach(function(line) {
        var li = document.createElement('li');
        li.textContent = line;
        reqList.appendChild(li);
      });
      reqBlock.appendChild(reqList);
      metaGrid.appendChild(reqBlock);

      var shotsBlock = document.createElement('div');
      shotsBlock.className = 'steam-bigpicture-meta-block';
      var shotsTitle = document.createElement('div');
      shotsTitle.className = 'steam-bigpicture-meta-title';
      shotsTitle.textContent = 'Preview';
      shotsBlock.appendChild(shotsTitle);
      var shots = document.createElement('div');
      shots.className = 'steam-bigpicture-shots';
      getScreenshots(game).forEach(function(shot) {
        var shotItem = document.createElement('div');
        shotItem.className = 'steam-bigpicture-shot';
        shotItem.style.background = shot.background;
        shotItem.textContent = shot.label;
        shots.appendChild(shotItem);
      });
      shotsBlock.appendChild(shots);
      metaGrid.appendChild(shotsBlock);
      right.appendChild(metaGrid);

      var tags = document.createElement('div');
      tags.className = 'steam-bigpicture-tags';
      (game.tags || []).forEach(function(tag) {
        var chip = document.createElement('span');
        chip.textContent = tag;
        tags.appendChild(chip);
      });
      right.appendChild(tags);

      var playtime = document.createElement('div');
      playtime.className = 'steam-bigpicture-playtime';
      playtime.textContent = 'Status: ' + statusText(game, getGameState(game.id)) + ' · Launches: ' + (getGameState(game.id).playCount || 0) + ' · Total playtime: ' + formatDuration(getGameState(game.id).totalPlayMs || 0);
      right.appendChild(playtime);

      var actions = document.createElement('div');
      actions.className = 'steam-bigpicture-quick-actions';

      var playFullscreenBtn = document.createElement('button');
      playFullscreenBtn.className = 'steam-bigpicture-quick-btn steam-bigpicture-quick-btn--primary';
      playFullscreenBtn.textContent = 'Play Fullscreen';
      playFullscreenBtn.addEventListener('click', function() {
        if (getGameState(game.id).installed) {
          handlePlay(game, { fullscreen: true });
          closeBigPicture({ keepPinned: true });
        }
      });
      actions.appendChild(playFullscreenBtn);
      bigPictureFocusables.push(playFullscreenBtn);

      var favBtn = document.createElement('button');
      favBtn.className = 'steam-bigpicture-quick-btn steam-bigpicture-quick-btn--ghost';
      favBtn.textContent = getGameState(game.id).favorite ? 'Unfavorite' : 'Favorite';
      favBtn.addEventListener('click', function() {
        toggleFavorite(game.id);
        queueRefresh();
        openBigPicture();
      });
      actions.appendChild(favBtn);
      bigPictureFocusables.push(favBtn);

      var gs = getGameState(game.id);
      if (gs.installed || game.alwaysInstalled) {
        if (!game.alwaysInstalled) {
          var uninstallBtn = document.createElement('button');
          uninstallBtn.className = 'steam-bigpicture-quick-btn steam-bigpicture-quick-btn--danger';
          uninstallBtn.textContent = 'Uninstall';
          uninstallBtn.addEventListener('click', function() {
            uninstallGame(game.id);
            queueRefresh();
            openBigPicture();
          });
          actions.appendChild(uninstallBtn);
          bigPictureFocusables.push(uninstallBtn);
        }
      } else if (gs.installState === 'queued' || gs.installState === 'installing') {
        var cancelBtn = document.createElement('button');
        cancelBtn.className = 'steam-bigpicture-quick-btn steam-bigpicture-quick-btn--danger';
        cancelBtn.textContent = 'Cancel Install';
        cancelBtn.addEventListener('click', function() {
          cancelInstall(game.id);
          queueRefresh();
          openBigPicture();
        });
        actions.appendChild(cancelBtn);
        bigPictureFocusables.push(cancelBtn);
      } else {
        var installBtn = document.createElement('button');
        installBtn.className = 'steam-bigpicture-quick-btn';
        installBtn.textContent = gs.installProgress > 0 ? 'Resume Install' : 'Install';
        installBtn.addEventListener('click', function() {
          if (gs.installProgress > 0) resumeInstall(game.id);
          else enqueueInstall(game.id);
          queueRefresh();
          openBigPicture();
        });
        actions.appendChild(installBtn);
        bigPictureFocusables.push(installBtn);
      }
      right.appendChild(actions);

      var bottomGrid = document.createElement('div');
      bottomGrid.className = 'steam-bigpicture-bottom-grid';
      var changelog = document.createElement('div');
      changelog.className = 'steam-bigpicture-meta-block';
      var changelogTitle = document.createElement('div');
      changelogTitle.className = 'steam-bigpicture-meta-title';
      changelogTitle.textContent = 'Changelog';
      changelog.appendChild(changelogTitle);
      getChangelog(game).slice(0, 2).forEach(function(entry) {
        var row = document.createElement('div');
        row.className = 'steam-bigpicture-log-row';
        row.textContent = entry.version + ' · ' + entry.date + ' · ' + entry.notes;
        changelog.appendChild(row);
      });
      bottomGrid.appendChild(changelog);

      var achievements = document.createElement('div');
      achievements.className = 'steam-bigpicture-meta-block';
      var achievementsTitle = document.createElement('div');
      achievementsTitle.className = 'steam-bigpicture-meta-title';
      achievementsTitle.textContent = 'Achievements';
      achievements.appendChild(achievementsTitle);
      var ach = getAchievements(game.id).slice(0, 3);
      if (ach.length) {
        ach.forEach(function(item) {
          var achRow = document.createElement('div');
          achRow.className = 'steam-bigpicture-log-row';
          achRow.textContent = (item.unlocked ? '✓ ' : '○ ') + item.title;
          achievements.appendChild(achRow);
        });
      } else {
        var achEmpty = document.createElement('div');
        achEmpty.className = 'steam-bigpicture-card-empty';
        achEmpty.textContent = 'No achievements yet.';
        achievements.appendChild(achEmpty);
      }
      bottomGrid.appendChild(achievements);
      right.appendChild(bottomGrid);

      layout.appendChild(left);
      layout.appendChild(right);
      panel.appendChild(layout);
      bigPictureOverlay.appendChild(panel);

      bigPictureOverlay.onclick = function(evt) {
        if (evt.target === bigPictureOverlay) closeBigPicture();
      };

      document.body.appendChild(bigPictureOverlay);
      bigPictureActive = true;
      updateTopBigPictureButton();
      if (bigPictureEscHandler) {
        document.removeEventListener('keydown', bigPictureEscHandler);
      }
      bigPictureEscHandler = function(evt) {
        if (!bigPictureActive) return;
        if (evt.key === 'Escape') {
          evt.preventDefault();
          closeBigPicture();
          return;
        }
        if (!bigPictureFocusables.length) return;
        var key = evt.key;
        if (key === 'ArrowDown' || key === 'ArrowRight') {
          evt.preventDefault();
          focusBigPictureIndex(bigPictureFocusIndex + 1);
          return;
        }
        if (key === 'ArrowUp' || key === 'ArrowLeft') {
          evt.preventDefault();
          focusBigPictureIndex(bigPictureFocusIndex - 1);
          return;
        }
        if (key === 'Home') {
          evt.preventDefault();
          focusBigPictureIndex(0);
          return;
        }
        if (key === 'End') {
          evt.preventDefault();
          focusBigPictureIndex(bigPictureFocusables.length - 1);
          return;
        }
        if (key === 'Enter' || key === ' ') {
          if (bigPictureFocusIndex >= 0 && bigPictureFocusables[bigPictureFocusIndex]) {
            evt.preventDefault();
            bigPictureFocusables[bigPictureFocusIndex].click();
          }
        }
      };
      document.addEventListener('keydown', bigPictureEscHandler);
      focusBigPictureIndex(Math.max(0, findBigPictureInitialFocusIndex(selectedGameId)));
    }

    function findBigPictureInitialFocusIndex(gameId) {
      for (var i = 0; i < bigPictureFocusables.length; i++) {
        var el = bigPictureFocusables[i];
        if (el.classList && el.classList.contains('steam-bigpicture-quick-btn--primary')) return i;
      }
      for (var j = 0; j < bigPictureFocusables.length; j++) {
        var node = bigPictureFocusables[j];
        if (node && node.classList && node.classList.contains('steam-bigpicture-library-item') && node.textContent === (byId(gameId) && byId(gameId).title)) {
          return j;
        }
      }
      return 0;
    }

    function focusBigPictureIndex(nextIndex) {
      if (!bigPictureFocusables.length) {
        bigPictureFocusIndex = -1;
        return;
      }
      if (nextIndex < 0) nextIndex = bigPictureFocusables.length - 1;
      if (nextIndex >= bigPictureFocusables.length) nextIndex = 0;
      if (bigPictureFocusIndex >= 0 && bigPictureFocusables[bigPictureFocusIndex]) {
        bigPictureFocusables[bigPictureFocusIndex].classList.remove('steam-bigpicture-focus');
      }
      bigPictureFocusIndex = nextIndex;
      var target = bigPictureFocusables[bigPictureFocusIndex];
      if (!target) return;
      target.classList.add('steam-bigpicture-focus');
      if (typeof target.focus === 'function') target.focus({ preventScroll: true });
      if (typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    }

    function toggleBigPicturePersistent() {
      if (bigPicturePinned || bigPictureActive) {
        closeBigPicture();
      } else {
        bigPicturePinned = true;
        saveBigPicturePreference(true);
        updateTopBigPictureButton();
        openBigPicture();
      }
    }

    if (topBigPictureBtn) {
      topBigPictureBtn.addEventListener('click', toggleBigPicturePersistent);
    }

    function handlePlay(game, opts) {
      opts = opts || {};
      var gs = getGameState(game.id);
      if (!gs.installed) {
        enqueueInstall(game.id);
        return;
      }
      if (bigPicturePinned || bigPictureActive) {
        opts.fullscreen = true;
      }
      launchError = '';
      try {
        lastLaunchedGameWindowId = launchGame(game, wm, animateWindowOpen, opts) || null;
      } catch (err) {
        launchError = err && err.message ? err.message : 'Launcher crashed unexpectedly.';
      }
      queueRefresh();
    }

    function renderDetail() {
      var game = byId(selectedGameId);
      detailBody.innerHTML = '';
      detailBody.appendChild(detailDescription);
      if (!game) {
        detailDescription.innerHTML = '';
        return;
      }

      var gs = getGameState(game.id);
      detailDescription.innerHTML = '';

      var preview = document.createElement('div');
      preview.className = 'steam-mini-preview';
      preview.style.background = game.banner;
      var glow = document.createElement('div');
      glow.className = 'steam-mini-preview-glow';
      var pIcon = document.createElement('div');
      pIcon.className = 'steam-mini-preview-icon';
      setIconContent(pIcon, game.icon, game.title + ' icon');
      var pTitle = document.createElement('div');
      pTitle.className = 'steam-mini-preview-title';
      pTitle.textContent = game.title;
      var pMeta = document.createElement('div');
      pMeta.className = 'steam-mini-preview-meta';
      pMeta.textContent = game.genre + ' · ' + game.size;
      preview.appendChild(glow);
      preview.appendChild(pIcon);
      preview.appendChild(pTitle);
      preview.appendChild(pMeta);
      detailBody.appendChild(preview);

      var info = document.createElement('div');
      info.className = 'steam-info';

      var topRow = document.createElement('div');
      topRow.className = 'steam-title-row';
      var title = document.createElement('div');
      title.className = 'steam-game-title';
      title.textContent = game.title;
      var rightActionCol = document.createElement('div');
      rightActionCol.className = 'steam-right-action-col';
      var favBtn = document.createElement('button');
      favBtn.className = 'steam-favorite-btn' + (gs.favorite ? ' active' : '');
      favBtn.type = 'button';
      favBtn.textContent = gs.favorite ? '★ Favorite' : '☆ Favorite';
      favBtn.addEventListener('click', function() {
        toggleFavorite(game.id);
        queueRefresh();
      });
      var rightActionStack = document.createElement('div');
      rightActionStack.className = 'steam-right-action-stack';
      rightActionCol.appendChild(favBtn);
      rightActionCol.appendChild(rightActionStack);
      topRow.appendChild(title);
      info.appendChild(topRow);
      info.appendChild(rightActionCol);

      var genre = document.createElement('div');
      genre.className = 'steam-genre';
      genre.textContent = game.genre + ' · ' + game.size + ' · Last played: ' + formatRelative(gs.lastPlayedAt);
      info.appendChild(genre);

      var status = document.createElement('div');
      status.className = 'steam-install-status';
      var installedState = gs.installed || game.alwaysInstalled;
      status.textContent = 'Status: ' + statusText(game, gs);
      status.classList.add(installedState ? 'steam-install-status--installed' : 'steam-install-status--missing');
      info.appendChild(status);

      if (launchError) {
        var errorRow = document.createElement('div');
        errorRow.className = 'steam-launch-error';
        errorRow.textContent = 'Launch failed: ' + launchError;
        info.appendChild(errorRow);
      }

      if (gs.installState === 'installing' || gs.installState === 'queued') {
        var progressWrap = document.createElement('div');
        progressWrap.className = 'steam-progress-wrap';
        var progressBar = document.createElement('div');
        progressBar.className = 'steam-progress-bar';
        var fill = document.createElement('div');
        fill.className = 'steam-progress-fill';
        fill.style.width = Math.max(0, Math.min(100, gs.installProgress || 0)) + '%';
        progressBar.appendChild(fill);
        progressWrap.appendChild(progressBar);
        var progressText = document.createElement('div');
        progressText.className = 'steam-progress-text';
        progressText.textContent = (gs.installProgress || 0) + '%';
        progressWrap.appendChild(progressText);
        info.appendChild(progressWrap);
      }

      // Preview strip removed per UX request (blank placeholders caused extra scroll).

      var tabBar = document.createElement('div');
      tabBar.className = 'steam-tabs';
      var tabs = [
        ['overview', 'Overview'],
        ['changelog', 'Changelog'],
        ['achievements', 'Achievements']
      ];
      var tabPanels = {};
      var activeTab = 'overview';

      function activateTab(tabId) {
        activeTab = tabId;
        Array.from(tabBar.querySelectorAll('.steam-tab')).forEach(function(tab) {
          tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        Object.keys(tabPanels).forEach(function(id) {
          tabPanels[id].style.display = id === tabId ? 'block' : 'none';
        });
      }

      tabs.forEach(function(pair) {
        var btn = document.createElement('button');
        btn.className = 'steam-tab' + (pair[0] === 'overview' ? ' active' : '');
        btn.type = 'button';
        btn.dataset.tab = pair[0];
        btn.textContent = pair[1];
        btn.addEventListener('click', function() { activateTab(pair[0]); });
        tabBar.appendChild(btn);
      });
      info.appendChild(tabBar);

      var panelWrap = document.createElement('div');
      panelWrap.className = 'steam-tab-panels';

      var overviewPanel = document.createElement('div');
      overviewPanel.className = 'steam-tab-panel';
      var desc = document.createElement('div');
      desc.className = 'steam-desc';
      desc.textContent = game.desc;
      overviewPanel.appendChild(desc);

      var reqList = document.createElement('ul');
      reqList.className = 'steam-requirements';
      getRequirements(game).forEach(function(line) {
        var li = document.createElement('li');
        li.textContent = line;
        reqList.appendChild(li);
      });
      overviewPanel.appendChild(reqList);

      var tagsWrap = document.createElement('div');
      tagsWrap.className = 'steam-tags';
      (game.tags || []).forEach(function(tag) {
        var chip = document.createElement('span');
        chip.className = 'steam-tag';
        chip.textContent = tag;
        tagsWrap.appendChild(chip);
      });
      overviewPanel.appendChild(tagsWrap);
      tabPanels.overview = overviewPanel;

      var changelogPanel = document.createElement('div');
      changelogPanel.className = 'steam-tab-panel';
      changelogPanel.style.display = 'none';
      getChangelog(game).forEach(function(entry) {
        var row = document.createElement('div');
        row.className = 'steam-changelog-item';
        var head = document.createElement('div');
        head.className = 'steam-changelog-head';
        head.textContent = entry.version + ' · ' + entry.date;
        var notes = document.createElement('div');
        notes.className = 'steam-changelog-notes';
        notes.textContent = entry.notes;
        row.appendChild(head);
        row.appendChild(notes);
        changelogPanel.appendChild(row);
      });
      tabPanels.changelog = changelogPanel;

      var achievementsPanel = document.createElement('div');
      achievementsPanel.className = 'steam-tab-panel';
      achievementsPanel.style.display = 'none';
      getAchievements(game.id).forEach(function(item) {
        var row = document.createElement('div');
        row.className = 'steam-achievement' + (item.unlocked ? ' unlocked' : '');
        var titleEl = document.createElement('div');
        titleEl.className = 'steam-achievement-title';
        titleEl.textContent = (item.unlocked ? '✓ ' : '○ ') + item.title;
        var bodyEl = document.createElement('div');
        bodyEl.className = 'steam-achievement-desc';
        bodyEl.textContent = item.description;
        row.appendChild(titleEl);
        row.appendChild(bodyEl);
        achievementsPanel.appendChild(row);
      });
      tabPanels.achievements = achievementsPanel;

      panelWrap.appendChild(overviewPanel);
      panelWrap.appendChild(changelogPanel);
      panelWrap.appendChild(achievementsPanel);
      info.appendChild(panelWrap);

      var playtime = document.createElement('div');
      playtime.className = 'steam-playtime';
      playtime.textContent = 'Launches: ' + (gs.playCount || 0) + ' · Total playtime: ' + formatDuration(gs.totalPlayMs || 0);
      info.appendChild(playtime);

      var actions = document.createElement('div');
      actions.className = 'steam-action-wrap';

      if (gs.installed || game.alwaysInstalled) {
        var playWinBtn = document.createElement('button');
        playWinBtn.className = 'steam-play-btn steam-play steam-play-window';
        playWinBtn.textContent = 'PLAY WINDOWED';
        playWinBtn.addEventListener('click', function() { handlePlay(game); });
        actions.appendChild(playWinBtn);

        var playFullscreenBtn = document.createElement('button');
        playFullscreenBtn.className = 'steam-play-btn steam-play steam-play-fullscreen';
        playFullscreenBtn.textContent = 'PLAY FULLSCREEN';
        playFullscreenBtn.addEventListener('click', function() { handlePlay(game, { fullscreen: true }); });
        actions.appendChild(playFullscreenBtn);

        var uninstallBtn = document.createElement('button');
        uninstallBtn.className = 'steam-play-btn steam-uninstall';
        uninstallBtn.textContent = 'UNINSTALL';
        uninstallBtn.addEventListener('click', function() {
          uninstallGame(game.id);
          queueRefresh();
        });
        actions.appendChild(uninstallBtn);
      } else if (gs.installState === 'queued' || gs.installState === 'installing') {
        var cancelBtn = document.createElement('button');
        cancelBtn.className = 'steam-play-btn steam-install';
        cancelBtn.textContent = 'CANCEL INSTALL';
        cancelBtn.addEventListener('click', function() {
          cancelInstall(game.id);
        });
        actions.appendChild(cancelBtn);
      } else {
        var installBtn = document.createElement('button');
        installBtn.className = 'steam-play-btn steam-install';
        installBtn.textContent = gs.installProgress > 0 ? 'RESUME INSTALL' : 'INSTALL';
        installBtn.addEventListener('click', function() {
          if (gs.installProgress > 0) resumeInstall(game.id);
          else enqueueInstall(game.id);
        });
        actions.appendChild(installBtn);
      }

      rightActionStack.appendChild(actions);
      detailBody.appendChild(info);

      activateTab(activeTab);
    }

    function selectNext(delta) {
      if (!visibleSidebarItems.length) return;
      var idx = -1;
      for (var i = 0; i < visibleSidebarItems.length; i++) {
        if (visibleSidebarItems[i].dataset.gameId === selectedGameId) {
          idx = i;
          break;
        }
      }
      var next = idx + delta;
      if (next < 0) next = visibleSidebarItems.length - 1;
      if (next >= visibleSidebarItems.length) next = 0;
      var item = visibleSidebarItems[next];
      if (!item) return;
      selectedGameId = item.dataset.gameId;
      renderSidebar();
      renderDetail();
      item.scrollIntoView({ block: 'nearest' });
    }

    container.addEventListener('keydown', function(e) {
      var tag = (e.target && e.target.tagName || '').toLowerCase();
      var textInput = tag === 'input' || tag === 'select' || tag === 'textarea';

      if (e.key === 'Escape') {
        if (fullscreenActive) {
          e.preventDefault();
          closeFullscreenOverlay();
          return;
        }
        if (bigPictureActive) {
          e.preventDefault();
          closeBigPicture();
          return;
        }
      }

      if (textInput) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectNext(1);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectNext(-1);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        var game = byId(selectedGameId);
        if (game) handlePlay(game);
        return;
      }
      if (e.key.toLowerCase() === 'f' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    });

    searchInput.addEventListener('input', queueRefresh);
    filterSelect.addEventListener('change', queueRefresh);
    sortSelect.addEventListener('change', queueRefresh);

    bootstrapInstallQueue();
    renderSidebar();
    renderDashboard();
    renderDetail();
    updateTopBigPictureButton();
    if (bigPicturePinned) {
      setTimeout(function() { openBigPicture(); }, 40);
    }

    return container;
  }

  window.SteamApp = {
    launch: function(wm, animateWindowOpen) {
      var content = buildSteam(wm, animateWindowOpen);
      var winEl = wm.createWindow('steam', 'Steam95', 'icon:steam', content, { width: 940, height: 620 });
      if (typeof animateWindowOpen === 'function') animateWindowOpen('steam', winEl);
    }
  };
})();
