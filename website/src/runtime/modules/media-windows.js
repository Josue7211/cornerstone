export function createMediaWindows(deps = {}) {
  const wm = deps.wm;
  const researchPaperPdf = deps.researchPaperPdf || encodeURI('./assets/docs/research-paper.pdf');
  const PDF_WINDOWED_ZOOM = 66;
  const PDF_FULLSCREEN_ZOOM = 100;
  const AUDIO_EXT_RE = /\.mp3$/i;

  function normalizeTrackTitle(track = {}) {
    if (track.title) return track.title;
    if (track.name) return track.name;
    if (track.url) {
      const tail = String(track.url).split('/').pop() || '';
      return decodeURIComponent(tail) || 'Track';
    }
    return 'Track';
  }

  function normalizeTrack(track = {}) {
    const url = track.url ? String(track.url) : '';
    return {
      title: normalizeTrackTitle(track),
      url
    };
  }

  function collectFsMp3Tracks(node, out) {
    if (!node) return;
    if (node.type === 'file') {
      const hasMp3Ext = AUDIO_EXT_RE.test(String(node.name || ''));
      if (hasMp3Ext && node.url) out.push(normalizeTrack(node));
      return;
    }
    const children = Array.isArray(node.children) ? node.children : [];
    children.forEach((child) => collectFsMp3Tracks(child, out));
  }

  function dedupeAndSortTracks(tracks) {
    const seen = new Set();
    const deduped = [];
    (tracks || []).forEach((track) => {
      const normalized = normalizeTrack(track);
      if (!normalized.url || !AUDIO_EXT_RE.test(normalized.url)) return;
      const key = normalized.url.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      deduped.push(normalized);
    });
    deduped.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base', numeric: true }));
    return deduped;
  }

  function buildDefaultWinampPlaylist() {
    const tracks = [];
    const explorerFs = window.ExplorerData && window.ExplorerData.FS ? window.ExplorerData.FS : null;
    collectFsMp3Tracks(explorerFs, tracks);
    return dedupeAndSortTracks(tracks);
  }

  function buildPdfUrl(url, zoom) {
    return (url || researchPaperPdf) + '#page=1&zoom=' + zoom;
  }

  function openPdfWindow(appId, title, url, opts = {}) {
    const viewer = document.createElement('div');
    viewer.style.cssText = 'height:100%;background:#000;';

    const embed = document.createElement('embed');
    embed.type = 'application/pdf';
    embed.style.cssText = 'width:100%;height:100%;border:none;';
    viewer.appendChild(embed);

    const winEl = wm.createWindow(appId, title, 'icon:paper', viewer, {
      width: opts.width || 900,
      height: opts.height || 640
    });

    if (!winEl) return null;

    function syncPdfZoom() {
      const nextZoom = winEl.dataset.maximized === 'true' ? PDF_FULLSCREEN_ZOOM : PDF_WINDOWED_ZOOM;
      const nextSrc = buildPdfUrl(url, nextZoom);
      if (embed.getAttribute('src') !== nextSrc) {
        embed.src = nextSrc;
      }
    }

    function handleWindowEvent(event) {
      const detail = event && event.detail ? event.detail : {};
      if (!detail.detail || detail.detail.appId !== appId) return;
      if (
        detail.type === 'window_maximize' ||
        detail.type === 'window_unmaximize' ||
        detail.type === 'window_restore' ||
        (detail.type === 'window_snap' && detail.detail.target)
      ) {
        syncPdfZoom();
      }
      if (detail.type === 'window_close') {
        window.removeEventListener('win95-os-event', handleWindowEvent);
      }
    }

    window.addEventListener('win95-os-event', handleWindowEvent);
    syncPdfZoom();
    return winEl;
  }

  function openWinampWindow(track, opts = {}) {
    if (!window.Win95Extras || typeof window.Win95Extras.createWinamp !== 'function') return null;

    const existing = wm.windows.get('winamp');
    const trackData = track || {};
    const defaultPlaylist = buildDefaultWinampPlaylist();
    const providedPlaylist = Array.isArray(trackData.playlist) ? trackData.playlist : defaultPlaylist;
    const normalizedRequestedTrack = trackData.url ? normalizeTrack(trackData) : null;
    const withRequestedTrack = normalizedRequestedTrack ? providedPlaylist.concat(normalizedRequestedTrack) : providedPlaylist;
    const playlist = dedupeAndSortTracks(withRequestedTrack);
    let selectedIndex = Number.isInteger(trackData.selectedIndex) ? trackData.selectedIndex : -1;
    if (selectedIndex < 0 && normalizedRequestedTrack && normalizedRequestedTrack.url) {
      selectedIndex = playlist.findIndex((item) => item.url === normalizedRequestedTrack.url);
    }
    if (selectedIndex < 0 && playlist.length > 0) selectedIndex = 0;
    const autoplay = trackData.autoplay !== false;

    if (existing) {
      if (existing.minimized) wm.restoreWindow('winamp');
      wm.focusWindow('winamp');
      if (existing.winampController && typeof existing.winampController.loadTrack === 'function') {
        existing.winampController.loadTrack({
          title: trackData.title || 'Ready',
          url: trackData.url || '',
          playlist,
          selectedIndex,
          autoplay
        });
      }
      return existing.el;
    }

    const content = window.Win95Extras.createWinamp({
      title: trackData.title || 'Ready',
      url: trackData.url || '',
      playlist,
      selectedIndex,
      autoplay
    });
    const winEl = wm.createWindow('winamp', 'Winamp', 'icon:winamp', content, {
      width: opts.width || 360,
      height: opts.height || 500
    });
    const entry = wm.windows.get('winamp');
    const controller = content && content.__winampController ? content.__winampController : null;
    if (entry && controller) {
      entry.audioEl = controller.audio;
      entry.winampController = controller;
      entry.onClose = function() {
        controller.destroy();
      };
    }
    return winEl;
  }

  return {
    researchPaperPdf,
    openPdfWindow,
    openWinampWindow,
  };
}
