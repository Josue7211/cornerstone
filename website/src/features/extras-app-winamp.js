// Win95 extras: winamp app
(function() {
  'use strict';

  var EQ_BANDS = [
    { label: '60', freq: 60 },
    { label: '170', freq: 170 },
    { label: '310', freq: 310 },
    { label: '600', freq: 600 },
    { label: '1k', freq: 1000 },
    { label: '3k', freq: 3000 },
    { label: '6k', freq: 6000 },
    { label: '12k', freq: 12000 }
  ];

  var EQ_PRESETS = {
    Flat: [0, 0, 0, 0, 0, 0, 0, 0],
    'Bass Boost': [8, 6, 4, 2, 0, -2, -3, -4],
    'Treble Boost': [-4, -3, -2, 0, 2, 4, 6, 8],
    Vocal: [-3, -1, 1, 4, 5, 4, 2, 0]
  };

  var WINAMP_VOLUME_KEY = 'win95-winamp-volume';
  var WINAMP_STATE_KEY = 'win95-winamp-state-v2';
  var WINAMP_EQ_PRESETS_KEY = 'win95-winamp-eq-presets-v1';
  var WINAMP_SKIN_KEY = 'win95-winamp-skin';
  var PUBLIC_DEMO = typeof window !== 'undefined' && !!window.__WIN95_PUBLIC_DEMO__;

  function getAudioCtx() {
    if (window._win95AudioCtx && typeof window._win95AudioCtx === 'function') {
      return window._win95AudioCtx();
    }
    return new (window.AudioContext || window.webkitAudioContext)();
  }

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      return parsed || fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {}
  }

  function createWinamp(options) {
    options = options || {};

    var wrap = document.createElement('div');
    wrap.className = 'winamp-app';

    var isPlaying = false;
    var audioCtx = null;
    var analyser = null;
    var audioSource = null;
    var eqFilters = [];
    var eqSliders = [];
    var animId = null;
    var defaultTrackTitle = 'Ready';
    var currentTrackTitle = defaultTrackTitle;
    var currentTrackUrl = '';
    var playlistTracks = [];
    var currentTrackIndex = -1;
    var shuffleEnabled = false;
    var repeatMode = 'off'; // off | all | one
    var isSeeking = false;
    var pendingRestoreTime = 0;
    var resumeOnMetadata = false;

    var audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.crossOrigin = 'anonymous';

    var titleBarEl = document.createElement('div');
    titleBarEl.className = 'winamp-title-bar';
    titleBarEl.textContent = 'Winamp 2.95';
    wrap.appendChild(titleBarEl);

    var visCanvas = document.createElement('canvas');
    visCanvas.width = 275;
    visCanvas.height = 60;
    visCanvas.className = 'winamp-vis';
    wrap.appendChild(visCanvas);

    var trackInfo = document.createElement('div');
    trackInfo.className = 'winamp-track';
    var scrollText = document.createElement('div');
    scrollText.className = 'winamp-scroll-text';
    var scrollSpan = document.createElement('span');
    scrollSpan.textContent = defaultTrackTitle;
    scrollText.appendChild(scrollSpan);
    trackInfo.appendChild(scrollText);
    wrap.appendChild(trackInfo);

    var timeDisplay = document.createElement('div');
    timeDisplay.className = 'winamp-time';
    timeDisplay.textContent = '00:00';
    wrap.appendChild(timeDisplay);

    var seekRow = document.createElement('div');
    seekRow.className = 'winamp-seek-row';
    var seekCurrent = document.createElement('span');
    seekCurrent.className = 'winamp-seek-time';
    seekCurrent.textContent = '00:00';
    var seekSlider = document.createElement('input');
    seekSlider.type = 'range';
    seekSlider.min = '0';
    seekSlider.max = '1000';
    seekSlider.value = '0';
    seekSlider.className = 'winamp-seek-slider';
    var seekTotal = document.createElement('span');
    seekTotal.className = 'winamp-seek-time';
    seekTotal.textContent = '00:00';
    seekRow.appendChild(seekCurrent);
    seekRow.appendChild(seekSlider);
    seekRow.appendChild(seekTotal);
    wrap.appendChild(seekRow);

    var controls = document.createElement('div');
    controls.className = 'winamp-controls';
    var btnData = [
      ['<<', 'prev'], ['PLAY', 'play'], ['PAUSE', 'pause'], ['STOP', 'stop'], ['>>', 'next']
    ];
    var prevBtn;
    var playBtn;
    var pauseBtn;
    var stopBtn;
    var nextBtn;

    btnData.forEach(function(b) {
      var btn = document.createElement('button');
      btn.className = 'winamp-ctrl-btn' + (b[1] === 'play' ? ' play' : '');
      btn.textContent = b[0];
      controls.appendChild(btn);
      if (b[1] === 'prev') prevBtn = btn;
      if (b[1] === 'play') playBtn = btn;
      if (b[1] === 'pause') pauseBtn = btn;
      if (b[1] === 'stop') stopBtn = btn;
      if (b[1] === 'next') nextBtn = btn;
    });

    var shuffleBtn = document.createElement('button');
    shuffleBtn.className = 'winamp-ctrl-btn winamp-toggle-btn';
    shuffleBtn.textContent = 'SHUF';
    controls.appendChild(shuffleBtn);

    var repeatBtn = document.createElement('button');
    repeatBtn.className = 'winamp-ctrl-btn winamp-toggle-btn';
    repeatBtn.textContent = 'REP: OFF';
    controls.appendChild(repeatBtn);

    wrap.appendChild(controls);

    var volRow = document.createElement('div');
    volRow.className = 'winamp-volume';
    var volLabel = document.createElement('span');
    volLabel.textContent = 'VOL';
    var volSlider = document.createElement('input');
    volSlider.type = 'range';
    volSlider.min = '0';
    volSlider.max = '100';
    volSlider.value = '70';
    volSlider.className = 'winamp-vol-slider';
    volRow.appendChild(volLabel);
    volRow.appendChild(volSlider);

    var utilityRow = document.createElement('div');
    utilityRow.className = 'winamp-utility-row';

    var presetSelect = document.createElement('select');
    presetSelect.className = 'winamp-mini-select';
    utilityRow.appendChild(presetSelect);

    var savePresetBtn = document.createElement('button');
    savePresetBtn.className = 'winamp-mini-btn';
    savePresetBtn.textContent = 'Save EQ';
    utilityRow.appendChild(savePresetBtn);

    var skinSelect = document.createElement('select');
    skinSelect.className = 'winamp-mini-select';
    [
      { key: 'classic', label: 'Classic Skin' },
      { key: 'neon', label: 'Neon Skin' },
      { key: 'amber', label: 'Amber Skin' }
    ].forEach(function(opt) {
      var el = document.createElement('option');
      el.value = opt.key;
      el.textContent = opt.label;
      skinSelect.appendChild(el);
    });
    utilityRow.appendChild(skinSelect);

    var eqSection = document.createElement('div');
    eqSection.className = 'winamp-eq';
    var eqTitle = document.createElement('div');
    eqTitle.className = 'winamp-eq-title';
    eqTitle.textContent = 'Equalizer';
    var eqBands = document.createElement('div');
    eqBands.className = 'winamp-eq-bands';

    EQ_BANDS.forEach(function(band, idx) {
      var bandWrap = document.createElement('div');
      bandWrap.className = 'winamp-eq-band';
      var slider = document.createElement('input');
      slider.type = 'range';
      slider.className = 'winamp-eq-slider';
      slider.min = '-12';
      slider.max = '12';
      slider.step = '1';
      slider.value = '0';
      slider.setAttribute('aria-label', band.label + 'Hz');
      slider.addEventListener('input', function() {
        applySingleEqBand(idx, Number(slider.value));
        persistSession();
      });
      eqSliders.push(slider);

      var label = document.createElement('span');
      label.className = 'winamp-eq-label';
      label.textContent = band.label;
      bandWrap.appendChild(slider);
      bandWrap.appendChild(label);
      eqBands.appendChild(bandWrap);
    });

    eqSection.appendChild(eqTitle);
    eqSection.appendChild(eqBands);

    if (!PUBLIC_DEMO) {
      wrap.appendChild(volRow);
      wrap.appendChild(utilityRow);
      wrap.appendChild(eqSection);
    }
    var playlist = document.createElement('div');
    playlist.className = 'winamp-playlist';
    wrap.appendChild(playlist);

    if (prevBtn) prevBtn.addEventListener('click', prevTrack);
    playBtn.addEventListener('click', startPlayback);
    pauseBtn.addEventListener('click', pausePlayback);
    stopBtn.addEventListener('click', stopPlayback);
    if (nextBtn) nextBtn.addEventListener('click', nextTrack);

    shuffleBtn.addEventListener('click', function() {
      shuffleEnabled = !shuffleEnabled;
      syncToggleButtons();
      persistSession();
    });

    repeatBtn.addEventListener('click', function() {
      if (repeatMode === 'off') repeatMode = 'all';
      else if (repeatMode === 'all') repeatMode = 'one';
      else repeatMode = 'off';
      syncToggleButtons();
      persistSession();
    });

    seekSlider.addEventListener('input', function() {
      isSeeking = true;
      var duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      var pct = Number(seekSlider.value) / 1000;
      var nextTime = duration * pct;
      seekCurrent.textContent = formatTime(nextTime);
    });

    seekSlider.addEventListener('change', function() {
      var duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      if (duration > 0) {
        var pct = Number(seekSlider.value) / 1000;
        audio.currentTime = Math.max(0, Math.min(duration, duration * pct));
      }
      isSeeking = false;
      persistSession();
    });

    seekSlider.addEventListener('mouseup', function() {
      isSeeking = false;
    });

    savePresetBtn.addEventListener('click', function() {
      var name = window.prompt('Save EQ preset as:', 'Custom Preset');
      if (!name) return;
      var trimmed = String(name).trim();
      if (!trimmed) return;
      var presets = loadSavedPresets();
      presets[trimmed] = readEqValues();
      writeJSON(WINAMP_EQ_PRESETS_KEY, presets);
      populatePresetSelect(trimmed);
    });

    presetSelect.addEventListener('change', function() {
      var selected = presetSelect.value;
      applyPresetByName(selected);
      persistSession();
    });

    skinSelect.addEventListener('change', function() {
      applySkin(skinSelect.value);
      try {
        localStorage.setItem(WINAMP_SKIN_KEY, skinSelect.value);
      } catch (e) {}
      persistSession();
    });

    function normalizeTrack(track, fallbackTitle) {
      var next = track || {};
      var fallback = fallbackTitle || defaultTrackTitle;
      var title = next.title || next.name || fallback;
      var url = next.url || '';
      return { title: title, url: url };
    }

    function dedupeTracks(tracks) {
      var seen = Object.create(null);
      var deduped = [];
      (tracks || []).forEach(function(track) {
        var normalized = normalizeTrack(track, defaultTrackTitle);
        if (!normalized.url) return;
        var key = String(normalized.url).toLowerCase();
        if (seen[key]) return;
        seen[key] = true;
        deduped.push(normalized);
      });
      return deduped;
    }

    function renderPlaylist() {
      playlist.textContent = '';
      if (!playlistTracks.length) {
        var idle = document.createElement('div');
        idle.className = 'winamp-pl-item active';
        idle.textContent = '1. Ready';
        playlist.appendChild(idle);
        return;
      }
      playlistTracks.forEach(function(track, idx) {
        var row = document.createElement('button');
        row.type = 'button';
        row.className = 'winamp-pl-item' + (idx === currentTrackIndex ? ' active' : '');
        row.textContent = String(idx + 1) + '. ' + track.title;
        row.addEventListener('click', function() {
          loadTrackByIndex(idx, true);
        });
        playlist.appendChild(row);
      });
    }

    function loadWinampVolume() {
      try {
        var raw = localStorage.getItem(WINAMP_VOLUME_KEY);
        var parsed = parseInt(raw, 10);
        if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 100) return parsed;
      } catch (e) {}
      return 70;
    }

    function saveWinampVolume(value) {
      try {
        localStorage.setItem(WINAMP_VOLUME_KEY, String(value));
      } catch (e) {}
    }

    function loadPersistedSession() {
      return readJSON(WINAMP_STATE_KEY, null);
    }

    function persistSession() {
      var payload = {
        playlist: playlistTracks.slice(),
        currentTrackIndex: currentTrackIndex,
        currentTrackTitle: currentTrackTitle,
        currentTrackUrl: currentTrackUrl,
        shuffleEnabled: shuffleEnabled,
        repeatMode: repeatMode,
        volume: Number(volSlider.value) || 70,
        eq: readEqValues(),
        skin: skinSelect.value || 'classic',
        currentTime: Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
        wasPlaying: !!isPlaying
      };
      writeJSON(WINAMP_STATE_KEY, payload);
    }

    function formatTime(seconds) {
      var safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
      var m = Math.floor(safe / 60);
      var s = Math.floor(safe % 60);
      return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }

    function syncTimeUi() {
      var current = Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      var duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      timeDisplay.textContent = formatTime(current);
      seekCurrent.textContent = formatTime(current);
      seekTotal.textContent = formatTime(duration);
      if (!isSeeking && duration > 0) {
        seekSlider.value = String(Math.round((current / duration) * 1000));
      }
      if (!isSeeking && duration <= 0) {
        seekSlider.value = '0';
      }
    }

    function applySkin(skin) {
      var next = skin || 'classic';
      wrap.classList.remove('winamp-skin-classic', 'winamp-skin-neon', 'winamp-skin-amber');
      wrap.classList.add('winamp-skin-' + next);
      skinSelect.value = next;
    }

    function syncToggleButtons() {
      shuffleBtn.classList.toggle('active', shuffleEnabled);
      repeatBtn.classList.toggle('active', repeatMode !== 'off');
      repeatBtn.textContent = repeatMode === 'one' ? 'REP: 1' : (repeatMode === 'all' ? 'REP: ALL' : 'REP: OFF');
    }

    function loadSavedPresets() {
      return readJSON(WINAMP_EQ_PRESETS_KEY, {});
    }

    function populatePresetSelect(selectedName) {
      var saved = loadSavedPresets();
      var names = Object.keys(EQ_PRESETS).concat(Object.keys(saved));
      var seen = Object.create(null);
      presetSelect.textContent = '';
      names.forEach(function(name) {
        if (seen[name]) return;
        seen[name] = true;
        var opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        presetSelect.appendChild(opt);
      });
      if (selectedName && seen[selectedName]) {
        presetSelect.value = selectedName;
      } else if (presetSelect.options.length) {
        presetSelect.value = presetSelect.options[0].value;
      }
    }

    function readEqValues() {
      return eqSliders.map(function(slider) {
        return Number(slider.value) || 0;
      });
    }

    function applySingleEqBand(idx, value) {
      var safe = Math.max(-12, Math.min(12, Number(value) || 0));
      var slider = eqSliders[idx];
      if (slider) slider.value = String(safe);
      var filter = eqFilters[idx];
      if (filter && audioCtx) {
        filter.gain.setValueAtTime(safe, audioCtx.currentTime);
      }
    }

    function applyEq(values) {
      var vals = Array.isArray(values) ? values : [];
      eqSliders.forEach(function(slider, idx) {
        var safe = Math.max(-12, Math.min(12, Number(vals[idx] || 0)));
        slider.value = String(safe);
        applySingleEqBand(idx, safe);
      });
    }

    function applyPresetByName(name) {
      var saved = loadSavedPresets();
      var values = EQ_PRESETS[name] || saved[name];
      if (!Array.isArray(values)) return;
      applyEq(values);
    }

    volSlider.value = String(loadWinampVolume());
    audio.volume = loadWinampVolume() / 100;
    volSlider.addEventListener('input', function() {
      audio.volume = volSlider.value / 100;
      saveWinampVolume(volSlider.value);
      persistSession();
    });

    function ensureAudioGraph() {
      if (analyser) return;
      audioCtx = getAudioCtx();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      if (!audioSource) {
        audioSource = audioCtx.createMediaElementSource(audio);
      }

      eqFilters = EQ_BANDS.map(function(band) {
        var filter = audioCtx.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = band.freq;
        filter.Q.value = 1;
        filter.gain.value = 0;
        return filter;
      });

      var chain = audioSource;
      eqFilters.forEach(function(filter) {
        chain.connect(filter);
        chain = filter;
      });
      chain.connect(analyser);
      analyser.connect(audioCtx.destination);

      applyEq(readEqValues());
    }

    function updateTrackText() {
      scrollSpan.textContent = currentTrackTitle;
      renderPlaylist();
    }

    function startPlayback() {
      if (!currentTrackUrl && playlistTracks.length) {
        loadTrackByIndex(currentTrackIndex >= 0 ? currentTrackIndex : 0, true);
        return;
      }
      if (!currentTrackUrl) return;
      ensureAudioGraph();
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(function() {});
      }
      audio.play().catch(function() {});
    }

    function handlePlay() {
      ensureAudioGraph();
      isPlaying = true;
      playBtn.classList.add('active');
      var visCtx = visCanvas.getContext('2d');
      var bufLen = analyser.frequencyBinCount;
      var dataArray = new Uint8Array(bufLen);

      function drawVis() {
        if (!isPlaying) return;
        analyser.getByteFrequencyData(dataArray);
        visCtx.fillStyle = '#1a1a2e';
        visCtx.fillRect(0, 0, visCanvas.width, visCanvas.height);
        var halfBins = Math.max(1, Math.floor(bufLen / 2));
        var halfWidth = visCanvas.width / 2;
        var barW = halfWidth / halfBins;
        for (var j = 0; j < halfBins; j++) {
          var barH = (dataArray[j] / 255) * visCanvas.height;
          var hue = 120 + (j / bufLen) * 40;
          visCtx.fillStyle = 'hsl(' + hue + ', 100%, ' + (40 + (dataArray[j] / 255) * 30) + '%)';
          var leftX = halfWidth - (j + 1) * barW;
          var rightX = halfWidth + j * barW;
          visCtx.fillRect(leftX, visCanvas.height - barH, barW - 1, barH);
          visCtx.fillRect(rightX, visCanvas.height - barH, barW - 1, barH);
        }
        animId = requestAnimationFrame(drawVis);
      }
      drawVis();
      persistSession();
    }

    function pausePlayback() {
      if (!isPlaying) return;
      isPlaying = false;
      playBtn.classList.remove('active');
      audio.pause();
      if (animId) cancelAnimationFrame(animId);
      animId = null;
      persistSession();
    }

    function stopPlayback() {
      isPlaying = false;
      playBtn.classList.remove('active');
      audio.pause();
      audio.currentTime = 0;
      if (animId) cancelAnimationFrame(animId);
      animId = null;
      timeDisplay.textContent = '00:00';
      seekCurrent.textContent = '00:00';
      seekSlider.value = '0';
      var visCtx = visCanvas.getContext('2d');
      visCtx.fillStyle = '#1a1a2e';
      visCtx.fillRect(0, 0, visCanvas.width, visCanvas.height);
      persistSession();
    }

    function destroyWinamp() {
      persistSession();
      stopPlayback();
      audio.removeAttribute('src');
      audio.load();
      if (audioSource) {
        try { audioSource.disconnect(); } catch (e) {}
        audioSource = null;
      }
      eqFilters.forEach(function(filter) {
        try { filter.disconnect(); } catch (e) {}
      });
      eqFilters = [];
      if (analyser) {
        try { analyser.disconnect(); } catch (e) {}
        analyser = null;
      }
    }

    function loadTrack(trackOptions) {
      var next = trackOptions || {};
      if (Array.isArray(next.playlist)) {
        var normalizedTracks = dedupeTracks(next.playlist);
        playlistTracks = normalizedTracks;
        if (!playlistTracks.length) {
          currentTrackIndex = -1;
          currentTrackTitle = defaultTrackTitle;
          currentTrackUrl = '';
          stopPlayback();
          updateTrackText();
          return;
        }

        var idx = Number.isInteger(next.selectedIndex) ? next.selectedIndex : -1;
        if (idx < 0 && next.url) {
          idx = playlistTracks.findIndex(function(track) { return track.url === next.url; });
        }
        if (idx < 0) idx = 0;
        loadTrackByIndex(idx, next.autoplay !== false, Number(next.startTime) || 0);
        return;
      }

      currentTrackTitle = next.title || currentTrackTitle || defaultTrackTitle;
      currentTrackUrl = next.url || currentTrackUrl || '';
      updateTrackText();
      stopPlayback();
      if (!currentTrackUrl) return;
      audio.src = currentTrackUrl;
      audio.load();
      pendingRestoreTime = Number(next.startTime) || 0;
      resumeOnMetadata = !!next.autoplay;
      if (next.autoplay !== false) {
        startPlayback();
      }
    }

    function loadTrackByIndex(index, autoplay, startTime) {
      if (!playlistTracks.length) return;
      var clampedIndex = Math.max(0, Math.min(playlistTracks.length - 1, Number(index) || 0));
      currentTrackIndex = clampedIndex;
      var selected = playlistTracks[clampedIndex];
      currentTrackTitle = selected.title || defaultTrackTitle;
      currentTrackUrl = selected.url || '';
      updateTrackText();
      stopPlayback();
      if (!currentTrackUrl) return;
      audio.src = currentTrackUrl;
      audio.load();
      pendingRestoreTime = Number(startTime) || 0;
      resumeOnMetadata = autoplay !== false;
      if (autoplay !== false) startPlayback();
      persistSession();
    }

    function getRandomNextIndex() {
      if (playlistTracks.length <= 1) return currentTrackIndex;
      var next = currentTrackIndex;
      var guard = 0;
      while (next === currentTrackIndex && guard < 20) {
        next = Math.floor(Math.random() * playlistTracks.length);
        guard++;
      }
      return next;
    }

    function nextTrack() {
      if (!playlistTracks.length) return;
      if (shuffleEnabled) {
        loadTrackByIndex(getRandomNextIndex(), true);
        return;
      }
      var next = currentTrackIndex + 1;
      if (next >= playlistTracks.length) {
        if (repeatMode === 'all') next = 0;
        else {
          stopPlayback();
          return;
        }
      }
      loadTrackByIndex(next, true);
    }

    function prevTrack() {
      if (!playlistTracks.length) return;
      if (shuffleEnabled) {
        loadTrackByIndex(getRandomNextIndex(), true);
        return;
      }
      var prev = currentTrackIndex - 1;
      if (prev < 0) prev = playlistTracks.length - 1;
      loadTrackByIndex(prev, true);
    }

    function restoreSessionWithOptions(initialOptions) {
      var persisted = loadPersistedSession() || {};
      var incomingPlaylist = Array.isArray(initialOptions.playlist) ? initialOptions.playlist : [];
      var mergedPlaylist = dedupeTracks((persisted.playlist || []).concat(incomingPlaylist));
      if (!mergedPlaylist.length) mergedPlaylist = dedupeTracks(incomingPlaylist);

      shuffleEnabled = !!persisted.shuffleEnabled;
      repeatMode = persisted.repeatMode === 'all' || persisted.repeatMode === 'one' ? persisted.repeatMode : 'off';
      syncToggleButtons();

      var savedSkin = 'classic';
      try {
        savedSkin = localStorage.getItem(WINAMP_SKIN_KEY) || 'classic';
      } catch (e) {}
      applySkin(savedSkin);

      var presetFromState = Array.isArray(persisted.eq) ? persisted.eq : null;
      if (presetFromState) applyEq(presetFromState);
      populatePresetSelect('Flat');

      var requestedIndex = Number.isInteger(initialOptions.selectedIndex)
        ? initialOptions.selectedIndex
        : (Number.isInteger(persisted.currentTrackIndex) ? persisted.currentTrackIndex : 0);

      var requestedUrl = initialOptions.url || persisted.currentTrackUrl || '';
      if (requestedUrl) {
        var idxFromUrl = mergedPlaylist.findIndex(function(track) { return track.url === requestedUrl; });
        if (idxFromUrl >= 0) requestedIndex = idxFromUrl;
      }

      var shouldAutoplay = initialOptions.autoplay === true;
      var restoreStartTime = shouldAutoplay ? 0 : (Number(persisted.currentTime) || 0);

      loadTrack({
        playlist: mergedPlaylist,
        selectedIndex: requestedIndex,
        url: requestedUrl,
        autoplay: shouldAutoplay,
        startTime: restoreStartTime
      });
    }

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', function() {
      isPlaying = false;
      playBtn.classList.remove('active');
      if (animId) cancelAnimationFrame(animId);
      animId = null;
      persistSession();
    });

    audio.addEventListener('ended', function() {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        startPlayback();
        return;
      }
      if (playlistTracks.length > 1) {
        nextTrack();
        return;
      }
      stopPlayback();
    });

    audio.addEventListener('timeupdate', function() {
      syncTimeUi();
      if (isPlaying) persistSession();
    });

    audio.addEventListener('loadedmetadata', function() {
      if (pendingRestoreTime > 0 && Number.isFinite(audio.duration)) {
        audio.currentTime = Math.max(0, Math.min(audio.duration - 0.05, pendingRestoreTime));
      }
      pendingRestoreTime = 0;
      syncTimeUi();
      if (resumeOnMetadata) startPlayback();
      resumeOnMetadata = false;
    });

    updateTrackText();
    restoreSessionWithOptions(options);
    syncToggleButtons();

    wrap.__winampController = {
      audio: audio,
      loadTrack: loadTrack,
      stop: stopPlayback,
      destroy: destroyWinamp
    };

    return wrap;
  }

  var parts = window.Win95ExtrasParts = window.Win95ExtrasParts || {};
  parts.createWinamp = createWinamp;
})();
