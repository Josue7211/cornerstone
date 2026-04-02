// Win95 extras: Internet Explorer app
(function() {
  'use strict';

  function createInternetExplorer(initialTarget) {
    var wrap = document.createElement('div');
    wrap.className = 'ie-app';
    wrap.tabIndex = 0;
    var IE_HISTORY_KEY = 'ai98-ie-history-v1';
    var IE_FAVORITES_KEY = 'ai98-ie-favorites-v1';
    var IE_FAVORITES_PRUNE_TERMS = ['google', 'amazon'];
    var IE_FAVORITES_PRUNE_DOMAINS = ['google.', 'amazon.'];
    var IE_HANDLER_KEY = 'win95ie_' + Math.random().toString(36).slice(2, 10);
    var SEARCH_HANDLER_NAME = IE_HANDLER_KEY + '_search';
    var ARCHIVE_HANDLER_NAME = IE_HANDLER_KEY + '_open';

    var ieData = window.Win95IEData || {};
    var presets = Array.isArray(ieData.presets) && ieData.presets.length ? ieData.presets : [
      {
        label: 'Google 1999',
        url: 'https://www.google.com/',
        timestamp: '19991130235959',
        display: 'Google (1999)',
        mode: 'local-google-1999',
        searchLabel: 'Google 1999',
        searchUrl: function(query) {
          return 'https://www.google.com/search?q=' + encodeURIComponent(query);
        }
      }
    ];
    var escapeHtml = ieData.escapeHtml || function(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    };
    var buildGoogle1999Doc = ieData.buildGoogle1999Doc || function() { return '<!doctype html><html><body>Google 1999 unavailable.</body></html>'; };
    var buildYahoo1998Doc = ieData.buildYahoo1998Doc || function() { return '<!doctype html><html><body>Yahoo 1998 unavailable.</body></html>'; };
    var buildAltaVista1999Doc = ieData.buildAltaVista1999Doc || function() { return '<!doctype html><html><body>AltaVista 1999 unavailable.</body></html>'; };
    var buildGeoCities1999Doc = ieData.buildGeoCities1999Doc || function() { return '<!doctype html><html><body>GeoCities 1999 unavailable.</body></html>'; };
    var buildYoutube2005Doc = ieData.buildYoutube2005Doc || function() { return '<!doctype html><html><body>YouTube 2005 unavailable.</body></html>'; };
    var buildWin98InsideWin98Doc = ieData.buildWin98InsideWin98Doc || function() { return '<!doctype html><html><body>Nested mode unavailable.</body></html>'; };
    var buildArchiveSearchResultsDoc = ieData.buildArchiveSearchResultsDoc || function(query) {
      return '<!doctype html><html><body>Search unavailable for ' + escapeHtml(query) + '.</body></html>';
    };
    var looksLikeSearchQuery = ieData.looksLikeSearchQuery || function(raw) {
      var value = String(raw || '').trim();
      if (!value) return false;
      if (/^https?:\/\//i.test(value)) return false;
      if (/^web\.archive\.org\//i.test(value)) return false;
      if (value.indexOf(' ') !== -1) return true;
      if (!/[.:/\\]/.test(value)) return true;
      return false;
    };
    var buildSearchTarget = ieData.buildSearchTarget || function(query, engine) {
      var activeEngine = engine && typeof engine.searchUrl === 'function' ? engine : presets[0];
      return {
        archiveUrl: '',
        displayValue: query,
        sourceUrl: query,
        title: (activeEngine.searchLabel || activeEngine.label || 'Archive Search') + ' results for "' + query + '"',
        mode: 'local-search-results',
        engine: activeEngine
      };
    };
    var parseWaybackTarget = ieData.parseWaybackTarget || function() {
      return null;
    };
    var suggestAddressInput = ieData.suggestAddressInput || function() {
      return [];
    };
    var resolveArchiveTarget = ieData.resolveArchiveTarget || function(target) {
      return Promise.resolve(target);
    };
    var normalizeArchiveTarget = ieData.normalizeArchiveTarget || function(rawValue) {
      var raw = String(rawValue || '').trim();
      if (!raw) raw = presets[0].url;
      if (raw.indexOf('web.archive.org/web/') !== -1) {
        return { archiveUrl: raw, displayValue: raw, sourceUrl: raw, title: raw };
      }
      if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw.replace(/^\/+/, '');
      return {
        archiveUrl: 'https://web.archive.org/web/19991130235959/' + raw,
        displayValue: raw,
        sourceUrl: raw,
        title: raw
      };
    };

    function getAudioCtx() {
      return window._win95AudioCtx ? window._win95AudioCtx() : new (window.AudioContext || window.webkitAudioContext)();
    }

    function runDialupAnim(bar, dialupEl, onComplete) {
      var progress = 0;
      bar.style.width = '0%';
      var iv = setInterval(function() {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(iv);
          setTimeout(function() {
            dialupEl.style.display = 'none';
            if (typeof onComplete === 'function') onComplete();
          }, 300);
        }
        bar.style.width = progress + '%';
      }, 400);
    }

    function playDialupSound() {
      try {
        var ctx = getAudioCtx();
        var now = ctx.currentTime;
        var gain = ctx.createGain();
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0, now + 3);

        [350, 440, 480, 620, 950, 1400, 1800, 2100, 1200, 980].forEach(function(freq, i) {
          var osc = ctx.createOscillator();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + i * 0.15);
          osc.frequency.linearRampToValueAtTime(freq + 200, now + i * 0.15 + 0.1);
          osc.connect(gain);
          osc.start(now + i * 0.15);
          osc.stop(now + i * 0.15 + 0.12);
        });
      } catch (_) {}
    }

    var submitTicket = 0;
    var lastYearJumpAt = 0;
    var awaitingRemoteLoad = false;

    async function submitQuery(rawValue, suggestedTarget) {
      var value = String(rawValue || '').trim();
      if (!value) return;
      hideSuggestions();
      var ticket = ++submitTicket;
      var target = suggestedTarget || normalizeAboutTarget(value) || parseWaybackTarget(value, currentPreset);
      if (!target) target = looksLikeSearchQuery(value) ? buildSearchTarget(value, currentPreset) : value;
      if (target && typeof target === 'object' && !target.mode && target.sourceUrl) {
        setLoadingState(true, 'Looking up closest archived snapshot...');
        target = await resolveArchiveTarget(target);
      } else if (target && typeof target === 'object' && target.sourceUrl && target.mode !== 'local-search-results' && (!target.mode || target.mode.indexOf('local-') !== 0)) {
        setLoadingState(true, 'Looking up closest archived snapshot...');
        target = await resolveArchiveTarget(target);
      }
      if (ticket !== submitTicket) return;
      navigateTo(target);
    }

    function localizeDocHandlers(docHtml) {
      return String(docHtml || '')
        .replace(/Win95IEHandleSearch/g, SEARCH_HANDLER_NAME)
        .replace(/Win95IEOpenArchive/g, ARCHIVE_HANDLER_NAME);
    }

    function loadStoredList(key) {
      try {
        var raw = localStorage.getItem(key);
        if (!raw) return [];
        var parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (_) {
        return [];
      }
    }

    function saveStoredList(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value || []));
      } catch (_) {}
    }

    function formatResolvedTimestamp(timestamp) {
      var raw = String(timestamp || '').replace(/\D+/g, '');
      if (raw.length < 8) return '';
      var y = raw.slice(0, 4);
      var m = raw.slice(4, 6);
      var d = raw.slice(6, 8);
      return y + '-' + m + '-' + d;
    }

    function buildAboutHistoryDoc(entries) {
      var list = (entries || []).map(function(item, idx) {
        var title = escapeHtml(item.title || item.displayValue || item.sourceUrl || 'History entry');
        var value = escapeHtml(item.displayValue || item.sourceUrl || '');
        var archiveUrl = escapeHtml(item.archiveUrl || '');
        var clickJs = archiveUrl
          ? "parent.Win95IEOpenArchive && parent.Win95IEOpenArchive('" + archiveUrl + "')"
          : "parent.Win95IEHandleSearch && parent.Win95IEHandleSearch('" + value + "')";
        return [
          '<div style="padding:10px 0;border-bottom:1px solid #d5d5d5;">',
          '<div style="font-size:12px;color:#666;">#' + (idx + 1) + '</div>',
          '<a href="#" onclick="' + clickJs + ';return false;" style="color:#00c;font-size:18px;text-decoration:underline;">' + title + '</a>',
          '<div style="font-size:13px;color:#2f2f2f;margin-top:4px;">' + value + '</div>',
          '</div>'
        ].join('');
      }).join('');
      return [
        '<!doctype html><html><head><meta charset="utf-8"><title>about:history</title></head>',
        '<body style="margin:0;background:#fff;color:#000;font-family:Arial,Helvetica,sans-serif;">',
        '<div style="padding:18px 24px 30px;max-width:940px;">',
        '<h2 style="margin:0 0 10px;color:#103b8a;">about:history</h2>',
        '<p style="margin:0 0 14px;font-size:14px;color:#333;">Recent Internet Explorer archive history.</p>',
        list || '<div style="padding:8px 0;color:#555;">No history entries yet.</div>',
        '</div></body></html>'
      ].join('');
    }

    function buildAboutFavoritesDoc(entries) {
      var list = (entries || []).map(function(item, idx) {
        var title = escapeHtml(item.title || item.displayValue || item.sourceUrl || 'Favorite');
        var value = escapeHtml(item.displayValue || item.sourceUrl || '');
        var archiveUrl = escapeHtml(item.archiveUrl || '');
        var clickJs = archiveUrl
          ? "parent.Win95IEOpenArchive && parent.Win95IEOpenArchive('" + archiveUrl + "')"
          : "parent.Win95IEHandleSearch && parent.Win95IEHandleSearch('" + value + "')";
        return [
          '<div style="padding:10px 0;border-bottom:1px solid #d5d5d5;">',
          '<div style="font-size:12px;color:#666;">Favorite #' + (idx + 1) + '</div>',
          '<a href="#" onclick="' + clickJs + ';return false;" style="color:#00c;font-size:18px;text-decoration:underline;">' + title + '</a>',
          '<div style="font-size:13px;color:#2f2f2f;margin-top:4px;">' + value + '</div>',
          '</div>'
        ].join('');
      }).join('');
      return [
        '<!doctype html><html><head><meta charset="utf-8"><title>about:favorites</title></head>',
        '<body style="margin:0;background:#fff;color:#000;font-family:Arial,Helvetica,sans-serif;">',
        '<div style="padding:18px 24px 30px;max-width:940px;">',
        '<h2 style="margin:0 0 10px;color:#103b8a;">about:favorites</h2>',
        '<p style="margin:0 0 14px;font-size:14px;color:#333;">Saved favorites. Right-click favorite in sidebar to remove.</p>',
        list || '<div style="padding:8px 0;color:#555;">No favorites yet.</div>',
        '</div></body></html>'
      ].join('');
    }

    function normalizeAboutTarget(rawValue) {
      var value = String(rawValue || '').trim().toLowerCase();
      if (value !== 'about:history' && value !== 'about:favorites') return null;
      return {
        archiveUrl: '',
        displayValue: value,
        sourceUrl: value,
        title: value,
        mode: value === 'about:history' ? 'local-about-history' : 'local-about-favorites'
      };
    }

    var menuBar = document.createElement('div');
    menuBar.className = 'ie-menubar';
    var helpMenuBtn = null;
    ['File', 'Edit', 'View', 'Favorites', 'Tools', 'Help'].forEach(function(label) {
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'ie-menuitem';
      item.textContent = label;
      if (label === 'Help') helpMenuBtn = item;
      menuBar.appendChild(item);
    });
    wrap.appendChild(menuBar);

    var toolbar = document.createElement('div');
    toolbar.className = 'ie-toolbar';
    var toolbarButtons = document.createElement('div');
    toolbarButtons.className = 'ie-toolbar-buttons';
    var newWindowBtn = document.createElement('button');
    newWindowBtn.className = 'ie-nav-btn';
    newWindowBtn.textContent = 'New';
    var backBtn = document.createElement('button');
    backBtn.className = 'ie-nav-btn';
    backBtn.textContent = 'Back';
    var forwardBtn = document.createElement('button');
    forwardBtn.className = 'ie-nav-btn';
    forwardBtn.textContent = 'Forward';
    var homeBtn = document.createElement('button');
    homeBtn.className = 'ie-nav-btn';
    homeBtn.textContent = 'Home';
    var refreshBtn = document.createElement('button');
    refreshBtn.className = 'ie-nav-btn';
    refreshBtn.textContent = 'Refresh';
    var stopBtn = document.createElement('button');
    stopBtn.className = 'ie-nav-btn';
    stopBtn.textContent = 'Stop';
    var offlineBtn = document.createElement('button');
    offlineBtn.className = 'ie-nav-btn';
    offlineBtn.textContent = 'Work Offline';
    offlineBtn.dataset.offline = 'false';
    toolbarButtons.appendChild(newWindowBtn);
    toolbarButtons.appendChild(backBtn);
    toolbarButtons.appendChild(forwardBtn);
    toolbarButtons.appendChild(homeBtn);
    toolbarButtons.appendChild(refreshBtn);
    toolbarButtons.appendChild(stopBtn);
    toolbarButtons.appendChild(offlineBtn);
    toolbar.appendChild(toolbarButtons);

    var addrBar = document.createElement('div');
    addrBar.className = 'ie-address-bar';
    var addrIcon = document.createElement('span');
    addrIcon.className = 'ie-addr-icon';
    addrIcon.textContent = 'IE';
    var addrLabel = document.createElement('span');
    addrLabel.className = 'ie-addr-label';
    addrLabel.textContent = 'Address:';
    var addrFrame = document.createElement('div');
    addrFrame.className = 'ie-addr-frame';
    var addrInput = document.createElement('input');
    addrInput.type = 'text';
    addrInput.className = 'ie-addr-input';
    addrInput.value = presets[0].url;
    var goBtn = document.createElement('button');
    goBtn.className = 'ie-go-btn';
    goBtn.textContent = 'Go';
    addrFrame.appendChild(addrIcon);
    addrFrame.appendChild(addrInput);
    addrBar.appendChild(addrLabel);
    addrBar.appendChild(addrFrame);
    addrBar.appendChild(goBtn);
    var addrSuggest = document.createElement('div');
    addrSuggest.className = 'ie-addr-suggest';
    addrSuggest.style.display = 'none';
    addrBar.appendChild(addrSuggest);
    toolbar.appendChild(addrBar);

    var timeBar = document.createElement('div');
    timeBar.className = 'ie-timebar';
    var timeLabel = document.createElement('span');
    timeLabel.className = 'ie-timebar-label';
    timeLabel.textContent = 'Time Travel:';
    var yearSlider = document.createElement('input');
    yearSlider.type = 'range';
    yearSlider.className = 'ie-timebar-slider';
    yearSlider.min = '1994';
    yearSlider.max = '2025';
    yearSlider.step = '1';
    yearSlider.value = '1999';
    var yearValue = document.createElement('span');
    yearValue.className = 'ie-timebar-value';
    yearValue.textContent = '1999';
    var yearGoBtn = document.createElement('button');
    yearGoBtn.type = 'button';
    yearGoBtn.className = 'ie-go-btn';
    yearGoBtn.textContent = 'Jump';
    timeBar.appendChild(timeLabel);
    timeBar.appendChild(yearSlider);
    timeBar.appendChild(yearValue);
    timeBar.appendChild(yearGoBtn);
    toolbar.appendChild(timeBar);
    var timelineBar = document.createElement('div');
    timelineBar.className = 'ie-timelinebar';
    var timelineLabel = document.createElement('span');
    timelineLabel.className = 'ie-timelinebar-label';
    timelineLabel.textContent = 'Snapshot Timeline:';
    var timelineYearsWrap = document.createElement('div');
    timelineYearsWrap.className = 'ie-timeline-years';
    timelineBar.appendChild(timelineLabel);
    timelineBar.appendChild(timelineYearsWrap);
    toolbar.appendChild(timelineBar);
    wrap.appendChild(toolbar);

    var shell = document.createElement('div');
    shell.className = 'ie-shell';

    var sidebar = document.createElement('div');
    sidebar.className = 'ie-sidebar';
    var sidebarTitle = document.createElement('div');
    sidebarTitle.className = 'ie-sidebar-title';
    sidebarTitle.textContent = 'Favorites';
    var favoritesList = document.createElement('div');
    favoritesList.className = 'ie-favorites-list';
    sidebar.appendChild(sidebarTitle);
    sidebar.appendChild(favoritesList);
    shell.appendChild(sidebar);

    var contentWrap = document.createElement('div');
    contentWrap.className = 'ie-content-wrap';
    var banner = document.createElement('div');
    banner.className = 'ie-banner';
    banner.innerHTML = '<span class="ie-banner-title">Internet Explorer</span><span class="ie-banner-meta">Try: "open geocities in 1999" or "amazon in 1997"</span>';
    var bannerEngine = document.createElement('span');
    bannerEngine.className = 'ie-banner-engine';
    banner.appendChild(bannerEngine);
    var loadingPip = document.createElement('span');
    loadingPip.className = 'ie-loading-pip';
    banner.appendChild(loadingPip);
    var sourceBadge = document.createElement('span');
    sourceBadge.className = 'ie-source-badge';
    sourceBadge.textContent = 'ARCHIVE SNAPSHOT';
    banner.appendChild(sourceBadge);
    contentWrap.appendChild(banner);

    var content = document.createElement('div');
    content.className = 'ie-content';

    var dialup = document.createElement('div');
    dialup.className = 'ie-dialup';
    var dialupText = document.createElement('div');
    dialupText.className = 'ie-dialup-text';
    dialupText.textContent = 'Connecting...';
    var dialupProgress = document.createElement('div');
    dialupProgress.className = 'ie-dialup-progress';
    var dialupBar = document.createElement('div');
    dialupBar.className = 'ie-dialup-bar';
    dialupProgress.appendChild(dialupBar);
    dialup.appendChild(dialupText);
    dialup.appendChild(dialupProgress);
    content.appendChild(dialup);

    var page = document.createElement('iframe');
    page.className = 'ie-page ie-frame';
    page.style.display = 'none';
    page.style.width = '100%';
    page.style.height = '100%';
    page.style.border = 'none';
    page.setAttribute('title', 'Internet Explorer Content');
    page.setAttribute('referrerpolicy', 'no-referrer');
    content.appendChild(page);

    var fallback = document.createElement('div');
    fallback.className = 'ie-fallback';
    fallback.style.display = 'none';
    var fallbackTitle = document.createElement('h3');
    fallbackTitle.className = 'ie-fallback-title';
    fallbackTitle.textContent = 'Embedded archive view unavailable';
    var fallbackBody = document.createElement('p');
    fallbackBody.className = 'ie-fallback-body';
    fallbackBody.textContent = 'Some archived sites block in-window embedding. Open the Wayback snapshot in a new tab if that happens.';
    var fallbackLink = document.createElement('a');
    fallbackLink.className = 'ie-fallback-link';
    fallbackLink.target = '_blank';
    fallbackLink.rel = 'noopener noreferrer';
    fallbackLink.textContent = 'Open archived page';
    fallback.appendChild(fallbackTitle);
    fallback.appendChild(fallbackBody);
    fallback.appendChild(fallbackLink);
    content.appendChild(fallback);
    contentWrap.appendChild(content);

    var statusBar = document.createElement('div');
    statusBar.className = 'ie-statusbar';
    var statusText = document.createElement('span');
    statusText.className = 'ie-status-text';
    statusText.textContent = 'Ready';
    var statusMeta = document.createElement('span');
    statusMeta.className = 'ie-status-meta';
    statusMeta.textContent = 'Archive mode';
    statusBar.appendChild(statusText);
    statusBar.appendChild(statusMeta);
    contentWrap.appendChild(statusBar);

    var helpOverlay = document.createElement('div');
    helpOverlay.className = 'ie-shortcuts-overlay';
    helpOverlay.style.display = 'none';
    var helpCard = document.createElement('div');
    helpCard.className = 'ie-shortcuts-card';
    helpCard.innerHTML = [
      '<div class="ie-shortcuts-title">Internet Explorer Shortcuts</div>',
      '<div class="ie-shortcuts-line"><strong>Ctrl+L</strong> Focus Address Bar</div>',
      '<div class="ie-shortcuts-line"><strong>Alt+Left</strong> Back</div>',
      '<div class="ie-shortcuts-line"><strong>Alt+Right</strong> Forward</div>',
      '<div class="ie-shortcuts-line"><strong>F5</strong> Refresh Current Page</div>',
      '<div class="ie-shortcuts-line"><strong>Esc</strong> Stop Loading / Close Help</div>',
      '<div class="ie-shortcuts-line"><strong>F1</strong> Toggle This Help</div>'
    ].join('');
    var helpCloseBtn = document.createElement('button');
    helpCloseBtn.type = 'button';
    helpCloseBtn.className = 'ie-go-btn';
    helpCloseBtn.textContent = 'Close';
    helpCard.appendChild(helpCloseBtn);
    helpOverlay.appendChild(helpCard);
    contentWrap.appendChild(helpOverlay);
    shell.appendChild(contentWrap);
    wrap.appendChild(shell);

    var currentArchiveUrl = '';
    var currentTitle = '';
    var currentPreset = presets[0];
    var fallbackTimer = 0;
    var history = [];
    var historyIndex = -1;
    var favorites = loadStoredList(IE_FAVORITES_KEY);
    var isOffline = false;
    var isLoading = false;
    var suggestions = [];
    var activeSuggestionIndex = -1;
    var currentYear = 1999;
    var currentSourceUrl = '';
    var currentResolvedTimestamp = '';
    var currentMode = '';
    var timelineRequestTicket = 0;
    var timelineCache = {};
    var timelineDebounceTimer = 0;
    var TIMELINE_CACHE_TTL_MS = 1000 * 60 * 30;

    function toggleHelpOverlay(show) {
      var shouldShow = typeof show === 'boolean' ? show : helpOverlay.style.display === 'none';
      helpOverlay.style.display = shouldShow ? 'flex' : 'none';
      if (shouldShow) helpCloseBtn.focus();
    }

    function setCurrentYear(year) {
      var parsed = Number(year);
      if (!Number.isFinite(parsed)) parsed = 1999;
      parsed = Math.min(2026, Math.max(1994, Math.round(parsed)));
      currentYear = parsed;
      yearSlider.value = String(parsed);
      yearValue.textContent = String(parsed);
    }

    function inferYearFromTarget(target) {
      if (!target) return currentYear;
      if (target.requestedYear) return Number(target.requestedYear) || currentYear;
      var fromArchive = String(target.archiveUrl || '').match(/\/web\/(\d{4})/);
      if (fromArchive) return Number(fromArchive[1]);
      return currentYear;
    }

    function jumpToYear(year) {
      var now = Date.now();
      if (now - lastYearJumpAt < 1500) {
        statusText.textContent = 'Please wait a moment before switching years again.';
        return;
      }
      lastYearJumpAt = now;
      setCurrentYear(year);
      var base = String(currentSourceUrl || addrInput.value || '').trim();
      if (!base) return;
      submitQuery(base + ' in ' + String(currentYear));
    }

    function setSourceBadge(mode, hasResolvedTimestamp) {
      var value = String(mode || '');
      var label = 'ARCHIVE SNAPSHOT';
      var klass = 'archive';
      if (value === 'local-about-history' || value === 'local-about-favorites') {
        label = 'LOCAL PAGE';
        klass = 'local';
      } else if (value === 'local-search-results') {
        label = 'LOCAL INDEX';
        klass = 'local';
      } else if (/^local-/.test(value)) {
        label = 'LOCAL RECREATION';
        klass = 'local';
      } else if (hasResolvedTimestamp) {
        label = 'WAYBACK VERIFIED';
        klass = 'archive';
      }
      sourceBadge.textContent = label;
      sourceBadge.dataset.kind = klass;
    }

    function getTimelineYears() {
      var years = [];
      for (var y = 1994; y <= 2024; y += 2) years.push(y);
      years.push(2025);
      return years;
    }

    function renderTimelineSkeleton(years, activeYear) {
      timelineYearsWrap.innerHTML = '';
      years.forEach(function(year) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ie-timeline-year';
        btn.innerHTML = '<span class="ie-timeline-dot">•</span><span class="ie-timeline-year-text">' + String(year) + '</span>';
        btn.dataset.year = String(year);
        btn.dataset.available = 'unknown';
        if (Number(year) === Number(activeYear)) btn.classList.add('active');
        btn.addEventListener('click', function() {
          jumpToYear(year);
        });
        timelineYearsWrap.appendChild(btn);
      });
    }

    function getTimelineCacheKey(source, year) {
      return String(source || '').toLowerCase() + '|' + String(year);
    }

    function getTimelineCache(source, year) {
      var key = getTimelineCacheKey(source, year);
      var entry = timelineCache[key];
      if (!entry) return null;
      if (Date.now() - entry.at > TIMELINE_CACHE_TTL_MS) {
        delete timelineCache[key];
        return null;
      }
      return entry.value;
    }

    function setTimelineCache(source, year, value) {
      var key = getTimelineCacheKey(source, year);
      timelineCache[key] = { value: value, at: Date.now() };
    }

    function setTimelineButtonAvailability(year, value, ticket) {
      if (ticket !== timelineRequestTicket) return;
      var btn = timelineYearsWrap.querySelector('.ie-timeline-year[data-year="' + year + '"]');
      if (!btn) return;
      btn.dataset.available = value;
    }

    async function updateTimelineForSource(sourceUrl, activeYear) {
      var years = getTimelineYears(activeYear);
      renderTimelineSkeleton(years, activeYear);
      return;
    }

    function scheduleTimelineUpdate(sourceUrl, activeYear) {
      if (timelineDebounceTimer) clearTimeout(timelineDebounceTimer);
      var source = sourceUrl;
      var year = activeYear;
      timelineDebounceTimer = setTimeout(function() {
        timelineDebounceTimer = 0;
        updateTimelineForSource(source, year);
      }, 260);
    }

    function hideSuggestions() {
      suggestions = [];
      activeSuggestionIndex = -1;
      addrSuggest.style.display = 'none';
      addrSuggest.innerHTML = '';
    }

    function setActiveSuggestion(index) {
      activeSuggestionIndex = index;
      addrSuggest.querySelectorAll('.ie-addr-suggest-item').forEach(function(node, idx) {
        node.classList.toggle('active', idx === activeSuggestionIndex);
      });
    }

    function renderSuggestions(rawValue) {
      var value = String(rawValue || '').trim();
      suggestions = suggestAddressInput(value, currentPreset) || [];
      activeSuggestionIndex = -1;
      if (!value || !suggestions.length) {
        hideSuggestions();
        return;
      }
      addrSuggest.innerHTML = '';
      suggestions.forEach(function(item, idx) {
        var row = document.createElement('button');
        row.type = 'button';
        row.className = 'ie-addr-suggest-item';
        row.innerHTML = '<span class="ie-addr-suggest-label">' + escapeHtml(item.label || item.value || '') + '</span><span class="ie-addr-suggest-meta">' + escapeHtml(item.meta || '') + '</span>';
        row.addEventListener('mouseenter', function() {
          setActiveSuggestion(idx);
        });
        row.addEventListener('mousedown', function(event) {
          event.preventDefault();
          addrInput.value = item.value || item.label || '';
          submitQuery(addrInput.value, item.target || null);
        });
        addrSuggest.appendChild(row);
      });
      addrSuggest.style.display = 'block';
    }

    function buildPresetTarget(preset) {
      return {
        archiveUrl: 'https://web.archive.org/web/' + preset.timestamp + '/' + preset.url,
        displayValue: preset.url,
        sourceUrl: preset.url,
        title: preset.display,
        mode: preset.mode,
        engine: preset
      };
    }

    function getYoutubeFavorite() {
      for (var i = 0; i < favorites.length; i += 1) {
        var item = favorites[i];
        var text = String(item && (item.title || item.displayValue || item.sourceUrl || '')).toLowerCase();
        if (text.indexOf('youtube') !== -1) return item;
      }
      return {
        archiveUrl: 'https://web.archive.org/web/20051215000000/https://www.youtube.com/',
        displayValue: 'https://www.youtube.com/',
        sourceUrl: 'https://www.youtube.com/',
        title: 'YouTube 2005',
        requestedYear: 2005,
        resolvedTimestamp: '20051215000000',
        mode: 'local-youtube-2005'
      };
    }

    function isSidebarEntryActive(entry) {
      if (!entry || !entry.target) return false;
      var target = entry.target;
      var targetSource = String(target.sourceUrl || target.displayValue || '').toLowerCase();
      var activeSource = String(currentSourceUrl || '').toLowerCase();
      var targetTitle = String(target.title || entry.label || '').toLowerCase();
      var activeTitle = String(currentTitle || '').toLowerCase();
      if (target.mode && currentMode && target.mode === currentMode) return true;
      if (targetSource && activeSource && targetSource === activeSource) return true;
      if (targetTitle && activeTitle && targetTitle === activeTitle) return true;
      return false;
    }

    function getSidebarEntries() {
      var entries = presets.map(function(preset) {
        var target = buildPresetTarget(preset);
        return {
          key: preset.label,
          label: preset.label,
          meta: preset.display,
          target: target,
          isActive: false
        };
      });
      var youtubeFavorite = getYoutubeFavorite();
      var youtubeEntry = {
        key: 'YouTube 2005',
        label: 'YouTube 2005',
        meta: 'YouTube (2005)',
        target: youtubeFavorite,
        isActive: false
      };
      var win98Index = -1;
      for (var i = 0; i < entries.length; i += 1) {
        if (entries[i].key === 'Win98 Inside Win98') {
          win98Index = i;
          break;
        }
      }
      if (win98Index === -1) entries.push(youtubeEntry);
      else entries.splice(win98Index, 0, youtubeEntry);
      entries.forEach(function(entry) {
        entry.isActive = isSidebarEntryActive(entry);
      });
      return entries;
    }

    function renderFavorites() {
      favoritesList.textContent = '';
      getSidebarEntries().forEach(function(entry) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'ie-preset-btn';
        if (entry.isActive) btn.classList.add('active');
        btn.dataset.preset = entry.key;
        btn.innerHTML = '<span class="ie-preset-btn-title">' + escapeHtml(entry.label) + '</span><span class="ie-preset-btn-meta">' + escapeHtml(entry.meta) + '</span>';
        btn.title = entry.target.sourceUrl || entry.target.archiveUrl || '';
        btn.addEventListener('click', function() {
          navigateTo(entry.target);
        });
        favoritesList.appendChild(btn);
      });
    }

    function getFavoriteSortWeight(item) {
      var text = String(item && (item.title || item.displayValue || item.sourceUrl || '')).toLowerCase();
      if (text.indexOf('google') !== -1) return 10;
      if (text.indexOf('yahoo') !== -1) return 20;
      if (text.indexOf('altavista') !== -1) return 30;
      if (text.indexOf('geocities') !== -1) return 40;
      if (text.indexOf('amazon') !== -1) return 50;
      if (text.indexOf('youtube') !== -1) return 60;
      if (text.indexOf('win98') !== -1) return 999;
      return 100 + text.length;
    }

    function reorderFavoritesOnLoad() {
      favorites = favorites.map(function(item, idx) {
        return { item: item, idx: idx };
      }).sort(function(a, b) {
        var weightA = getFavoriteSortWeight(a.item);
        var weightB = getFavoriteSortWeight(b.item);
        if (weightA !== weightB) return weightA - weightB;
        return a.idx - b.idx;
      }).map(function(entry) {
        return entry.item;
      });
    }

    function shouldPruneFavorite(item) {
      if (!item || typeof item !== 'object') return false;
      var hay = [
        item.title,
        item.displayValue,
        item.sourceUrl,
        item.archiveUrl,
        item.url,
        item.href,
        item.label,
        item.name
      ].map(function(value) { return String(value || ''); }).join(' ').toLowerCase();
      var normalized = hay.replace(/[^a-z0-9.]+/g, ' ');
      var byTerm = IE_FAVORITES_PRUNE_TERMS.some(function(term) {
        return normalized.indexOf(term) !== -1;
      });
      if (byTerm) return true;
      return IE_FAVORITES_PRUNE_DOMAINS.some(function(domain) {
        return hay.indexOf(domain) !== -1;
      });
    }

    function pruneFavoritesOnLoad() {
      var changed = false;
      favorites = favorites.filter(function(item) {
        var remove = shouldPruneFavorite(item);
        if (remove) changed = true;
        return !remove;
      });
      if (changed) saveStoredList(IE_FAVORITES_KEY, favorites);
    }

    function normalizeFavoritesOnLoad() {
      var changed = false;
      favorites = favorites.map(function(item) {
        if (!item || typeof item !== 'object') return item;
        var title = String(item.title || item.displayValue || item.sourceUrl || '').toLowerCase();
        var source = String(item.sourceUrl || item.displayValue || item.archiveUrl || '').toLowerCase();
        var isWin98 = title.indexOf('win98 inside win98') !== -1 || source.indexOf('about:win98-inside') !== -1;
        if (!isWin98) return item;
        changed = true;
        return {
          archiveUrl: '',
          displayValue: 'about:win98-inside',
          sourceUrl: 'about:win98-inside',
          title: 'Win98 Inside Win98',
          mode: 'local-win98-inside-win98'
        };
      });
      if (changed) saveStoredList(IE_FAVORITES_KEY, favorites);
    }

    function ensureYoutubeFavorite() {
      var youtubeFavorite = {
        archiveUrl: 'https://web.archive.org/web/20051215000000/https://www.youtube.com/',
        displayValue: 'https://www.youtube.com/',
        sourceUrl: 'https://www.youtube.com/',
        title: 'YouTube 2005',
        requestedYear: 2005,
        resolvedTimestamp: '20051215000000',
        mode: 'local-youtube-2005'
      };
      var existingIndex = -1;
      for (var i = 0; i < favorites.length; i += 1) {
        var text = String(favorites[i] && (favorites[i].title || favorites[i].displayValue || favorites[i].sourceUrl || '')).toLowerCase();
        if (text.indexOf('youtube') !== -1) {
          existingIndex = i;
          break;
        }
      }
      if (existingIndex >= 0) {
        favorites[existingIndex] = youtubeFavorite;
      } else {
        favorites.push(youtubeFavorite);
      }
    }

    function updateNavButtons() {
      backBtn.disabled = historyIndex <= 0;
      forwardBtn.disabled = historyIndex >= history.length - 1 || historyIndex === -1;
    }

    function updatePresetButtons() {
      renderFavorites();
    }

    function setStatusMeta(baseText) {
      var base = String(baseText || '').trim();
      var stamp = formatResolvedTimestamp(currentResolvedTimestamp);
      statusMeta.textContent = stamp ? (base ? base + ' • ' + stamp : stamp) : base;
    }

    function setLoadingState(nextLoading, label) {
      isLoading = !!nextLoading;
      wrap.classList.toggle('ie-is-loading', isLoading);
      stopBtn.disabled = !isLoading;
      loadingPip.textContent = isLoading ? '●' : '';
      if (label) statusText.textContent = label;
    }

    function setOfflineMode(nextOffline) {
      isOffline = !!nextOffline;
      offlineBtn.dataset.offline = isOffline ? 'true' : 'false';
      offlineBtn.textContent = isOffline ? 'Go Online' : 'Work Offline';
      setStatusMeta(isOffline ? 'Offline mode' : (currentTitle || 'Archive mode'));
    }

    function updateBrowserChrome() {
      bannerEngine.textContent = (currentPreset && currentPreset.display ? currentPreset.display : 'Archive Mode') + ' • ' + (currentTitle || 'Ready');
    }

    function showFallback(url, title) {
      setLoadingState(false, 'Embedded view unavailable.');
      page.style.display = 'none';
      fallback.style.display = 'flex';
      fallbackLink.href = url;
      fallbackLink.textContent = 'Open ' + (title || 'archived page');
      statusText.textContent = 'Embedded view unavailable. External archive link ready.';
      setStatusMeta(title || 'Archive fallback');
      updateBrowserChrome();
    }

    function navigateTo(target, options) {
      var navOptions = options || {};
      hideSuggestions();
      awaitingRemoteLoad = false;
      var normalized = target && typeof target === 'object' && (
        Object.prototype.hasOwnProperty.call(target, 'archiveUrl') ||
        Object.prototype.hasOwnProperty.call(target, 'mode')
      ) ? target : normalizeArchiveTarget(target);
      if (normalized.engine) currentPreset = normalized.engine;
      currentSourceUrl = normalized.sourceUrl || normalized.displayValue || '';
      currentMode = normalized.mode || '';
      setCurrentYear(inferYearFromTarget(normalized));
      currentResolvedTimestamp = normalized.resolvedTimestamp || '';
      setSourceBadge(normalized.mode, !!currentResolvedTimestamp);
      scheduleTimelineUpdate(currentSourceUrl, currentYear);
      currentArchiveUrl = normalized.archiveUrl;
      currentTitle = normalized.title || normalized.displayValue || 'Archive page';
      addrInput.value = normalized.displayValue;
      fallback.style.display = 'none';
      page.style.display = 'none';
      dialup.style.display = 'flex';
      dialupText.textContent = 'Connecting to ' + currentTitle + '...';
      setLoadingState(true, 'Dialing archive for ' + currentTitle + '...');
      setStatusMeta(normalized.displayValue);
      updateBrowserChrome();
      if (isOffline) {
        dialup.style.display = 'none';
        var safeTitle = escapeHtml(currentTitle || 'Requested Page');
        page.srcdoc = '<!doctype html><html><body style="margin:0;background:#f0f0f0;font-family:Arial,sans-serif;padding:24px;color:#000;"><h2 style="margin:0 0 10px;">Cannot open page while offline</h2><p style="margin:0 0 8px;"><strong>' + safeTitle + '</strong></p><p style="margin:0;">Reconnect using <em>Go Online</em> and try again.</p></body></html>';
        page.style.display = 'block';
        setLoadingState(false, 'Work Offline: request blocked.');
        setStatusMeta('Offline mode');
        updateBrowserChrome();
        return;
      }
      if (!navOptions.fromHistory) {
        history = history.slice(0, historyIndex + 1);
        history.push(normalized);
        saveStoredList(IE_HISTORY_KEY, history.slice(-40));
        historyIndex = history.length - 1;
        updateNavButtons();
      }
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = 0;
      }
      playDialupSound();
      runDialupAnim(dialupBar, dialup, function() {
        if (normalized.mode === 'local-google-1999') {
          page.srcdoc = localizeDocHandlers(buildGoogle1999Doc());
          setLoadingState(false, 'Loaded local 1999 recreation.');
          setStatusMeta(currentTitle);
        } else if (normalized.mode === 'local-yahoo-1998') {
          page.srcdoc = localizeDocHandlers(buildYahoo1998Doc());
          setLoadingState(false, 'Loaded local Yahoo! 1998 recreation.');
          setStatusMeta(currentTitle);
        } else if (normalized.mode === 'local-altavista-1999') {
          page.srcdoc = localizeDocHandlers(buildAltaVista1999Doc());
          setLoadingState(false, 'Loaded local AltaVista 1999 recreation.');
          setStatusMeta(currentTitle);
        } else if (normalized.mode === 'local-geocities-1999') {
          page.srcdoc = localizeDocHandlers(buildGeoCities1999Doc());
          setLoadingState(false, 'Loaded local GeoCities 1999 recreation.');
          setStatusMeta(currentTitle);
        } else if (normalized.mode === 'local-youtube-2005') {
          page.srcdoc = localizeDocHandlers(buildYoutube2005Doc());
          setLoadingState(false, 'Loaded local YouTube 2005 recreation.');
          setStatusMeta(currentTitle);
        } else if (normalized.mode === 'local-win98-inside-win98') {
          page.srcdoc = localizeDocHandlers(buildWin98InsideWin98Doc());
          setLoadingState(false, 'Loaded nested Win98 mode.');
          setStatusMeta('Local easter egg');
        } else if (normalized.mode === 'local-about-history') {
          page.srcdoc = localizeDocHandlers(buildAboutHistoryDoc(history.slice().reverse()));
          setLoadingState(false, 'Showing local history page.');
          setStatusMeta('Local page');
        } else if (normalized.mode === 'local-about-favorites') {
          page.srcdoc = localizeDocHandlers(buildAboutFavoritesDoc(favorites));
          setLoadingState(false, 'Showing local favorites page.');
          setStatusMeta('Local page');
        } else if (normalized.mode === 'local-search-results') {
          page.srcdoc = localizeDocHandlers(buildArchiveSearchResultsDoc(normalized.displayValue, normalized.engine));
          setLoadingState(false, 'Showing archived 1999 search results.');
          setStatusMeta(normalized.engine && normalized.engine.searchLabel ? normalized.engine.searchLabel : 'Archive search');
        } else {
          page.removeAttribute('srcdoc');
          page.src = normalized.archiveUrl;
          awaitingRemoteLoad = true;
          setLoadingState(true, 'Loading archived page...');
          dialup.style.display = 'flex';
          dialupText.textContent = 'Waiting for archived page...';
          dialupBar.style.width = '100%';
        }
        updateBrowserChrome();
        if (!awaitingRemoteLoad) page.style.display = 'block';
        if (
          normalized.mode !== 'local-google-1999' &&
          normalized.mode !== 'local-yahoo-1998' &&
          normalized.mode !== 'local-altavista-1999' &&
          normalized.mode !== 'local-geocities-1999' &&
          normalized.mode !== 'local-youtube-2005' &&
          normalized.mode !== 'local-win98-inside-win98' &&
          normalized.mode !== 'local-about-history' &&
          normalized.mode !== 'local-about-favorites' &&
          normalized.mode !== 'local-search-results'
        ) {
          fallbackTimer = window.setTimeout(function() {
            showFallback(normalized.archiveUrl, normalized.title);
          }, 4500);
        }
      });
    }

    page.addEventListener('load', function() {
      if (!awaitingRemoteLoad) return;
      awaitingRemoteLoad = false;
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = 0;
      }
      try {
        var doc = page.contentDocument;
        if (doc) {
          doc.addEventListener('click', function(event) {
            var anchor = event.target && event.target.closest ? event.target.closest('a') : null;
            if (!anchor) return;
            var href = anchor.getAttribute('href') || '';
            if (!href || href === '#') {
              event.preventDefault();
              return;
            }
            if (/^https?:/i.test(href) || /^\/\//.test(href) || /^https:\/\/web\.archive\.org/i.test(href)) {
              event.preventDefault();
              window.Win95IEOpenArchive(href);
            }
          });
        }
      } catch (_) {}
      fallback.style.display = 'none';
      dialup.style.display = 'none';
      page.style.display = 'block';
      setLoadingState(false, 'Done');
      setStatusMeta(currentTitle || 'Archive loaded');
      updateBrowserChrome();
    });
    page.addEventListener('error', function() {
      showFallback(currentArchiveUrl, currentTitle);
    });

    goBtn.addEventListener('click', function() {
      submitQuery(addrInput.value);
    });
    helpCloseBtn.addEventListener('click', function() {
      toggleHelpOverlay(false);
    });
    yearSlider.addEventListener('input', function() {
      setCurrentYear(yearSlider.value);
    });
    yearSlider.addEventListener('change', function() {
      jumpToYear(yearSlider.value);
    });
    yearGoBtn.addEventListener('click', function() {
      jumpToYear(yearSlider.value);
    });
    newWindowBtn.addEventListener('click', function() {
      window.__WIN95_IE_BOOT_TARGET = {
        archiveUrl: currentArchiveUrl,
        displayValue: addrInput.value || currentTitle || presets[0].url,
        sourceUrl: addrInput.value || currentTitle || presets[0].url,
        title: currentTitle || 'Internet Explorer'
      };
      var appConfig = window.__APP_CONFIG || {};
      if (appConfig.ie && typeof appConfig.ie.open === 'function') appConfig.ie.open();
    });
    offlineBtn.addEventListener('click', function() {
      setOfflineMode(!isOffline);
      statusText.textContent = isOffline ? 'Work Offline enabled.' : 'Back online.';
    });
    if (helpMenuBtn) {
      helpMenuBtn.addEventListener('click', function() {
        toggleHelpOverlay();
      });
    }

    addrInput.addEventListener('input', function() {
      renderSuggestions(addrInput.value);
    });
    addrInput.addEventListener('focus', function() {
      renderSuggestions(addrInput.value);
    });
    addrInput.addEventListener('blur', function() {
      window.setTimeout(function() {
        hideSuggestions();
      }, 120);
    });
    addrInput.addEventListener('keydown', function(event) {
      if (event.key === 'ArrowDown') {
        if (!suggestions.length) return;
        event.preventDefault();
        var next = activeSuggestionIndex + 1;
        if (next >= suggestions.length) next = 0;
        setActiveSuggestion(next);
        return;
      }
      if (event.key === 'ArrowUp') {
        if (!suggestions.length) return;
        event.preventDefault();
        var prev = activeSuggestionIndex - 1;
        if (prev < 0) prev = suggestions.length - 1;
        setActiveSuggestion(prev);
        return;
      }
      if (event.key === 'Escape') {
        hideSuggestions();
        return;
      }
      if (event.key === 'Enter') {
        event.preventDefault();
        if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
          var selected = suggestions[activeSuggestionIndex];
          addrInput.value = selected.value || selected.label || addrInput.value;
          submitQuery(addrInput.value, selected.target || null);
          return;
        }
        submitQuery(addrInput.value);
      }
    });

    wrap.addEventListener('keydown', function(event) {
      var key = event.key || '';
      if (key === 'F1') {
        event.preventDefault();
        toggleHelpOverlay();
        return;
      }
      if (key === 'Escape') {
        if (helpOverlay.style.display !== 'none') {
          event.preventDefault();
          toggleHelpOverlay(false);
          return;
        }
        if (isLoading) {
          event.preventDefault();
          stopBtn.click();
        }
        return;
      }
      if (event.ctrlKey && !event.altKey && !event.metaKey && key.toLowerCase() === 'l') {
        event.preventDefault();
        addrInput.focus();
        addrInput.select();
        return;
      }
      if (event.altKey && !event.ctrlKey && !event.metaKey && key === 'ArrowLeft') {
        event.preventDefault();
        backBtn.click();
        return;
      }
      if (event.altKey && !event.ctrlKey && !event.metaKey && key === 'ArrowRight') {
        event.preventDefault();
        forwardBtn.click();
        return;
      }
      if (!event.ctrlKey && !event.altKey && !event.metaKey && key === 'F5') {
        event.preventDefault();
        refreshBtn.click();
      }
    });

    window[SEARCH_HANDLER_NAME] = function(query) {
      submitQuery(query);
    };
    window[ARCHIVE_HANDLER_NAME] = function(url) {
      if (!url) return;
      navigateTo({
        archiveUrl: String(url),
        displayValue: String(url),
        sourceUrl: String(url),
        title: String(url)
      });
    };

    backBtn.addEventListener('click', function() {
      if (historyIndex <= 0) return;
      historyIndex -= 1;
      updateNavButtons();
      navigateTo(history[historyIndex], { fromHistory: true });
    });
    forwardBtn.addEventListener('click', function() {
      if (historyIndex >= history.length - 1) return;
      historyIndex += 1;
      updateNavButtons();
      navigateTo(history[historyIndex], { fromHistory: true });
    });
    homeBtn.addEventListener('click', function() {
      navigateTo({
        archiveUrl: 'https://web.archive.org/web/' + presets[0].timestamp + '/' + presets[0].url,
        displayValue: presets[0].url,
        sourceUrl: presets[0].url,
        title: presets[0].display,
        mode: presets[0].mode
      });
    });
    refreshBtn.addEventListener('click', function() {
      if (!currentArchiveUrl) return;
      navigateTo({
        archiveUrl: currentArchiveUrl,
        displayValue: addrInput.value,
        sourceUrl: addrInput.value,
        title: currentTitle
      });
    });
    stopBtn.addEventListener('click', function() {
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
        fallbackTimer = 0;
      }
      awaitingRemoteLoad = false;
      try {
        page.src = 'about:blank';
      } catch (_) {}
      dialup.style.display = 'none';
      page.style.display = 'none';
      setLoadingState(false, 'Stopped');
      setStatusMeta(currentTitle || 'Navigation stopped');
    });

    history = loadStoredList(IE_HISTORY_KEY);
    historyIndex = history.length - 1;
    pruneFavoritesOnLoad();
    normalizeFavoritesOnLoad();
    ensureYoutubeFavorite();
    reorderFavoritesOnLoad();
    saveStoredList(IE_FAVORITES_KEY, favorites);
    setCurrentYear(1999);
    updateNavButtons();
    renderFavorites();
    updateBrowserChrome();
    navigateTo(initialTarget || {
      archiveUrl: 'https://web.archive.org/web/' + presets[0].timestamp + '/' + presets[0].url,
      displayValue: presets[0].url,
      sourceUrl: presets[0].url,
      title: presets[0].display,
      mode: presets[0].mode,
      engine: presets[0]
    });

    return wrap;
  }


  var parts = window.Win95ExtrasParts = window.Win95ExtrasParts || {};
  parts.createInternetExplorer = createInternetExplorer;
})();
