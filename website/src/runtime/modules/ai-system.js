export function createAISystem() {
  function getDefaultHostedEndpoint(path) {
    const cleanedPath = String(path || '').replace(/^\/*/, '/');
    if (typeof window === 'undefined' || !window.location || !window.location.origin) return cleanedPath;
    const host = String(window.location.hostname || '').toLowerCase();
    const isLoopback = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    if (isLoopback) {
      const sharedCfg = window.WIN95_AI || {};
      const proxyOrigin = String(sharedCfg.proxyOrigin || '').trim().replace(/\/$/, '');
      if (proxyOrigin) return proxyOrigin + cleanedPath;
      return 'http://127.0.0.1:3015' + cleanedPath;
    }
    return window.location.origin.replace(/\/$/, '') + cleanedPath;
  }
  const DEFAULT_OLLAMA_ENDPOINT = getDefaultHostedEndpoint('/api/ollama');
  const DEFAULT_OLLAMA_MODEL = 'qwen3.5:0.8b';
  const DEFAULT_CLIPPY_NUM_CTX = 4096;
  const DEFAULT_TTS_ENDPOINT = getDefaultHostedEndpoint('/api/tts');
  const DEFAULT_OPENAI_ENDPOINT = getDefaultHostedEndpoint('/api/openai');
  const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
  const OLLAMA_MODEL_STORAGE_KEY = 'bonzi.ollamaModel';
  const OLLAMA_ENDPOINT_STORAGE_KEY = 'bonzi.ollamaEndpoint';
  const OPENAI_MODEL_STORAGE_KEY = 'win95.openaiModel';
  const OPENAI_ENDPOINT_STORAGE_KEY = 'win95.openaiEndpoint';
  const TTS_ENDPOINT_STORAGE_KEY = 'win95.ttsEndpoint';
  const TTS_ENGINE_STORAGE_KEY = 'win95.ttsEngine';
  const TTS_BONZI_VOICE_STORAGE_KEY = 'win95.ttsVoiceBonzi';
  const TTS_CLIPPY_VOICE_STORAGE_KEY = 'win95.ttsVoiceClippy';
  const TTS_BONZI_ENABLED_STORAGE_KEY = 'win95.ttsEnabledBonzi';
  const TTS_CLIPPY_ENABLED_STORAGE_KEY = 'win95.ttsEnabledClippy';
  const KOKORO_VOICE_PRESETS = [
    { value: 'af_heart', label: 'af_heart - warm female' },
    { value: 'af_bella', label: 'af_bella - bright female' },
    { value: 'af_sarah', label: 'af_sarah - smooth female' },
    { value: 'af_sky', label: 'af_sky - airy female' },
    { value: 'af_nicole', label: 'af_nicole - clear female' },
    { value: 'am_adam', label: 'am_adam - neutral male' },
    { value: 'am_michael', label: 'am_michael - deep male' },
    { value: 'am_fenrir', label: 'am_fenrir - dramatic male' },
    { value: 'bf_emma', label: 'bf_emma - British female' },
    { value: 'bf_isabella', label: 'bf_isabella - polished female' },
    { value: 'bm_george', label: 'bm_george - British male' },
    { value: 'bm_lewis', label: 'bm_lewis - crisp male' }
  ];
  const RUNTIME_TTS_CONFIG = {
    bonzi: {},
    clippy: {}
  };
  function cleanAiConfigValue(value) {
    if (value == null) return '';
    return String(value).trim();
  }
  
  function isLoopbackHostname(hostname) {
    const value = cleanAiConfigValue(hostname).toLowerCase();
    return value === 'localhost' || value === '127.0.0.1' || value === '::1';
  }
  
  function normalizeHostedEndpoint(value, fallbackPath) {
    const cleaned = cleanAiConfigValue(value).replace(/\/$/, '');
    const fallback = getDefaultHostedEndpoint(fallbackPath).replace(/\/$/, '');
    if (!cleaned) return fallback;
    if (typeof window === 'undefined' || !window.location) return cleaned;
    const currentHost = cleanAiConfigValue(window.location.hostname).toLowerCase();
    if (!currentHost || isLoopbackHostname(currentHost)) return cleaned;
    try {
      const parsed = new URL(cleaned, window.location.origin);
      if (!isLoopbackHostname(parsed.hostname)) return parsed.toString().replace(/\/$/, '');
      return window.location.origin.replace(/\/$/, '') + (parsed.pathname || fallbackPath || '') + (parsed.search || '');
    } catch (_) {
      return cleaned;
    }
  }
  
  function readAiStoredValue(key) {
    try {
      return cleanAiConfigValue(localStorage.getItem(key));
    } catch (_) {
      return '';
    }
  }
  
  function writeAiStoredValue(key, value) {
    try {
      if (value == null || value === '') {
        localStorage.removeItem(key);
        return;
      }
      localStorage.setItem(key, String(value));
    } catch (_) {}
  }
  
  function parseBooleanConfig(value, fallback) {
    const normalized = cleanAiConfigValue(value).toLowerCase();
    if (!normalized) return fallback;
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
    return fallback;
  }
  
  function getTtsStorageKeys(character) {
    const who = String(character || 'bonzi').toLowerCase();
    return who === 'clippy'
      ? {
          voice: TTS_CLIPPY_VOICE_STORAGE_KEY,
          enabled: TTS_CLIPPY_ENABLED_STORAGE_KEY
        }
      : {
          voice: TTS_BONZI_VOICE_STORAGE_KEY,
          enabled: TTS_BONZI_ENABLED_STORAGE_KEY
        };
  }
  
  function getAiEndpointCandidates(primaryEndpoint) {
    const cleaned = cleanAiConfigValue(primaryEndpoint).replace(/\/$/, '');
    const unique = new Set();
    if (cleaned) unique.add(cleaned);
    if (cleaned.indexOf('localhost') !== -1) {
      unique.add(cleaned.replace('localhost', '127.0.0.1'));
    } else if (cleaned.indexOf('127.0.0.1') !== -1) {
      unique.add(cleaned.replace('127.0.0.1', 'localhost'));
    }
    return Array.from(unique);
  }
  
  function getTtsConfig(character) {
    const who = String(character || 'bonzi').toLowerCase();
    const keys = getTtsStorageKeys(who);
    const params = new URLSearchParams(window.location.search || '');
    const sharedCfg = window.WIN95_AI || {};
    const runtimeCfg = RUNTIME_TTS_CONFIG[who] || {};
    const rawEndpoint = cleanAiConfigValue(params.get('ttsEndpoint'))
      || cleanAiConfigValue(params.get('kokoroEndpoint'))
      || cleanAiConfigValue(sharedCfg.ttsEndpoint)
      || cleanAiConfigValue(sharedCfg.kokoroEndpoint)
      || cleanAiConfigValue(runtimeCfg.endpoint)
      || readAiStoredValue(TTS_ENDPOINT_STORAGE_KEY)
      || DEFAULT_TTS_ENDPOINT;
    const endpoint = normalizeHostedEndpoint(rawEndpoint, '/api/tts');
    const engine = cleanAiConfigValue(params.get('ttsEngine'))
      || cleanAiConfigValue(sharedCfg.ttsEngine)
      || cleanAiConfigValue(runtimeCfg.engine)
      || readAiStoredValue(TTS_ENGINE_STORAGE_KEY)
      || 'kokoro';
    const bonziVoice = cleanAiConfigValue(params.get('bonziVoice'))
      || cleanAiConfigValue(sharedCfg.bonziVoice)
      || cleanAiConfigValue(RUNTIME_TTS_CONFIG.bonzi.voice)
      || readAiStoredValue(TTS_BONZI_VOICE_STORAGE_KEY)
      || 'am_michael';
    const clippyVoice = cleanAiConfigValue(params.get('clippyVoice'))
      || cleanAiConfigValue(sharedCfg.clippyVoice)
      || cleanAiConfigValue(RUNTIME_TTS_CONFIG.clippy.voice)
      || readAiStoredValue(TTS_CLIPPY_VOICE_STORAGE_KEY)
      || 'am_adam';
    const voice = who === 'clippy' ? clippyVoice : bonziVoice;
    const enabledParam = cleanAiConfigValue(params.get(who + 'VoiceEnabled'))
      || cleanAiConfigValue(params.get('ttsEnabled'));
    const enabled = parseBooleanConfig(
      enabledParam,
      parseBooleanConfig(runtimeCfg.enabled, parseBooleanConfig(readAiStoredValue(keys.enabled), who === 'bonzi'))
    );
    return {
      endpoint: endpoint.replace(/\/$/, ''),
      engine: engine.toLowerCase(),
      voice: voice,
      enabled: enabled
    };
  }
  
  function setTtsConfig(character, nextConfig = {}) {
    const who = String(character || 'bonzi').toLowerCase();
    const keys = getTtsStorageKeys(who);
    if (Object.prototype.hasOwnProperty.call(nextConfig, 'endpoint')) {
      const endpoint = normalizeHostedEndpoint(nextConfig.endpoint, '/api/tts');
      RUNTIME_TTS_CONFIG[who].endpoint = endpoint;
      writeAiStoredValue(TTS_ENDPOINT_STORAGE_KEY, endpoint);
    }
    if (Object.prototype.hasOwnProperty.call(nextConfig, 'engine')) {
      const engine = cleanAiConfigValue(nextConfig.engine).toLowerCase();
      RUNTIME_TTS_CONFIG[who].engine = engine;
      writeAiStoredValue(TTS_ENGINE_STORAGE_KEY, engine);
    }
    if (Object.prototype.hasOwnProperty.call(nextConfig, 'voice')) {
      const voice = cleanAiConfigValue(nextConfig.voice);
      RUNTIME_TTS_CONFIG[who].voice = voice;
      writeAiStoredValue(keys.voice, voice);
    }
    if (Object.prototype.hasOwnProperty.call(nextConfig, 'enabled')) {
      const enabled = nextConfig.enabled ? 'true' : 'false';
      RUNTIME_TTS_CONFIG[who].enabled = enabled;
      writeAiStoredValue(keys.enabled, enabled);
    }
    return getTtsConfig(who);
  }
  
  function getKokoroVoiceChoices() {
    return KOKORO_VOICE_PRESETS.slice();
  }
  
  function openVoicePicker(character, opts = {}) {
    if (!window.Win95Speech || typeof window.Win95Speech.getConfig !== 'function' || typeof window.Win95Speech.setConfig !== 'function') {
      if (typeof opts.onError === 'function') opts.onError(new Error('Speech settings unavailable.'));
      return;
    }
  
    const who = String(character || 'bonzi').toLowerCase();
    const current = window.Win95Speech.getConfig(who);
    const choices = getKokoroVoiceChoices();
  
    const overlay = document.createElement('div');
    overlay.className = 'win95-voice-picker-overlay';
  
    const panel = document.createElement('div');
    panel.className = 'win95-voice-picker';
    overlay.appendChild(panel);
  
    const title = document.createElement('div');
    title.className = 'win95-voice-picker-title';
    title.textContent = (who === 'clippy' ? 'Clippy' : 'Bonzi') + ' Voice Picker';
    panel.appendChild(title);
  
    const desc = document.createElement('p');
    desc.className = 'win95-voice-picker-copy';
    desc.textContent = 'Pick ' + (who === 'clippy' ? 'Clippy' : 'Bonzi') + '\'s voice, then apply or test it.';
    panel.appendChild(desc);
  
    const enabledRow = document.createElement('label');
    enabledRow.className = 'win95-voice-picker-toggle';
    const enabledInput = document.createElement('input');
    enabledInput.type = 'checkbox';
    enabledInput.checked = !!current.enabled;
    const enabledText = document.createElement('span');
    enabledText.textContent = 'Voice enabled';
    enabledRow.appendChild(enabledInput);
    enabledRow.appendChild(enabledText);
    panel.appendChild(enabledRow);
  
    const select = document.createElement('select');
    select.className = 'win95-voice-picker-select';
    choices.forEach(function(choice) {
      const option = document.createElement('option');
      option.value = choice.value;
      option.textContent = choice.label;
      if (choice.value === current.voice) option.selected = true;
      select.appendChild(option);
    });
    if (!choices.some(function(choice) { return choice.value === current.voice; }) && current.voice) {
      const customOption = document.createElement('option');
      customOption.value = current.voice;
      customOption.textContent = current.voice + ' - current custom voice';
      customOption.selected = true;
      select.appendChild(customOption);
    }
    panel.appendChild(select);
  
    const endpointInput = document.createElement('input');
    endpointInput.className = 'win95-voice-picker-input';
    endpointInput.type = 'text';
    endpointInput.value = current.endpoint || DEFAULT_TTS_ENDPOINT;
    endpointInput.placeholder = 'TTS endpoint';
    panel.appendChild(endpointInput);
  
    const customInput = document.createElement('input');
    customInput.className = 'win95-voice-picker-input';
    customInput.type = 'text';
    customInput.value = '';
    customInput.placeholder = 'Custom voice ID (optional, current: ' + (current.voice || 'none') + ')';
    panel.appendChild(customInput);
  
    const summary = document.createElement('p');
    summary.className = 'win95-voice-picker-copy';
    summary.textContent = 'Current: ' + current.voice + ' @ ' + current.endpoint;
    panel.appendChild(summary);
  
    const actions = document.createElement('div');
    actions.className = 'win95-voice-picker-actions';
    panel.appendChild(actions);
  
    function cleanup() {
      overlay.remove();
    }
  
    function getNextVoice() {
      const customVoice = cleanAiConfigValue(customInput.value);
      if (customVoice) return customVoice;
      return select.value || current.voice;
    }
  
    function getPendingConfig() {
      return {
        voice: getNextVoice(),
        endpoint: endpointInput.value,
        engine: current.engine || 'kokoro',
        enabled: enabledInput.checked
      };
    }
  
    function refreshSummary(message) {
      if (message) {
        summary.textContent = message;
        return;
      }
      const pending = getPendingConfig();
      summary.textContent = 'Selected: ' + pending.voice + ' @ ' + normalizeHostedEndpoint(pending.endpoint, '/api/tts');
    }
  
    function applyVoice() {
      const updated = window.Win95Speech.setConfig(who, getPendingConfig());
      if (typeof opts.onApply === 'function') opts.onApply(updated);
      cleanup();
    }
  
    async function testVoice() {
      const pending = getPendingConfig();
      const updated = window.Win95Speech.setConfig(who, pending);
      summary.textContent = 'Testing ' + updated.voice + '...';
      try {
        if (!window.Win95Speech || typeof window.Win95Speech.requestKokoro !== 'function' || typeof window.Win95Speech.playBlob !== 'function') {
          throw new Error('Voice test path unavailable.');
        }
        const result = await window.Win95Speech.requestKokoro(
          who === 'clippy'
            ? 'Clippy voice test. This is Clippy speaking.'
            : 'Bonzi voice test. This is Bonzi speaking.',
          pending
        );
        await window.Win95Speech.playBlob(result.blob);
        summary.textContent = 'Voice test sent for ' + updated.voice + '.';
      } catch (err) {
        summary.textContent = 'Voice test failed: ' + (err && err.message ? err.message : 'unknown error');
      }
    }
  
    function addAction(label, handler) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'clippy-action-btn';
      btn.textContent = label;
      btn.addEventListener('click', handler);
      actions.appendChild(btn);
    }
  
    addAction('Apply', applyVoice);
    addAction('Test', testVoice);
    addAction('Cancel', cleanup);
  
    overlay.addEventListener('click', function(event) {
      if (event.target === overlay) cleanup();
    });
    overlay.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') cleanup();
    });
    select.addEventListener('change', refreshSummary);
    customInput.addEventListener('input', refreshSummary);
    endpointInput.addEventListener('input', refreshSummary);
    enabledInput.addEventListener('change', refreshSummary);
  
    document.body.appendChild(overlay);
    refreshSummary();
    select.focus();
  }
  
  async function speakWithBrowserTts(text, character) {
    if (!window.speechSynthesis) return false;
    const who = String(character || 'bonzi').toLowerCase();
    return new Promise(function(resolve) {
      const utterance = new SpeechSynthesisUtterance(String(text || ''));
      utterance.rate = who === 'clippy' ? 1.18 : 1.08;
      utterance.pitch = who === 'clippy' ? 1.2 : 1.05;
      utterance.volume = 0.8;
      utterance.onend = function() { resolve(true); };
      utterance.onerror = function() { resolve(false); };
      if (window.Win95Speech && typeof window.Win95Speech.cancel === 'function') {
        window.Win95Speech.cancel();
      } else {
        window.speechSynthesis.cancel();
      }
      window.speechSynthesis.speak(utterance);
    });
  }
  
  let _activeSpeechAudio = null;
  
  function stopActiveSpeech() {
    if (window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
    }
    if (_activeSpeechAudio) {
      try { _activeSpeechAudio.pause(); } catch (_) {}
      try { URL.revokeObjectURL(_activeSpeechAudio.src); } catch (_) {}
      _activeSpeechAudio = null;
    }
  }
  
  function waitForAudioReady(audio) {
    return new Promise(function(resolve, reject) {
      let settled = false;
      function cleanup() {
        audio.removeEventListener('canplaythrough', onReady);
        audio.removeEventListener('loadeddata', onReady);
        audio.removeEventListener('error', onError);
      }
      function onReady() {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      }
      function onError() {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error('Audio could not be decoded by the browser.'));
      }
      audio.addEventListener('canplaythrough', onReady, { once: true });
      audio.addEventListener('loadeddata', onReady, { once: true });
      audio.addEventListener('error', onError, { once: true });
    });
  }
  
  async function getSpeechBlobDurationMs(blob) {
    const url = URL.createObjectURL(blob);
    try {
      const audio = new Audio(url);
      audio.preload = 'metadata';
      await new Promise(function(resolve, reject) {
        let settled = false;
        function cleanup() {
          audio.removeEventListener('loadedmetadata', onReady);
          audio.removeEventListener('canplaythrough', onReady);
          audio.removeEventListener('error', onError);
        }
        function onReady() {
          if (settled) return;
          settled = true;
          cleanup();
          resolve();
        }
        function onError() {
          if (settled) return;
          settled = true;
          cleanup();
          reject(new Error('Audio duration unavailable.'));
        }
        audio.addEventListener('loadedmetadata', onReady, { once: true });
        audio.addEventListener('canplaythrough', onReady, { once: true });
        audio.addEventListener('error', onError, { once: true });
      });
      const duration = Number(audio.duration);
      if (!Number.isFinite(duration) || duration <= 0) return 0;
      return Math.round(duration * 1000);
    } finally {
      try { URL.revokeObjectURL(url); } catch (_) {}
    }
  }
  
  async function requestKokoroAudio(text, config = {}) {
    const endpoint = normalizeHostedEndpoint(config.endpoint || DEFAULT_TTS_ENDPOINT, '/api/tts');
    const endpoints = getAiEndpointCandidates(endpoint);
    const voice = cleanAiConfigValue(config.voice) || 'am_michael';
    const engine = cleanAiConfigValue(config.engine).toLowerCase() || 'kokoro';
    let lastErr = null;
  
    for (const candidate of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        const payload = {
          model: engine,
          input: String(text || ''),
          voice: voice,
          response_format: 'wav'
        };
        const res = await fetch(candidate + '/v1/audio/speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!res.ok) {
          const details = await res.text().catch(function () { return ''; });
          throw new Error('Voice service unavailable (' + res.status + '): ' + (details || res.statusText || 'Unknown error'));
        }
        const blob = await res.blob();
        if (!blob || !blob.size) throw new Error('Voice service returned empty audio');
        return {
          blob: blob,
          endpoint: candidate
        };
      } catch (err) {
        lastErr = err;
      }
    }
  
    throw lastErr || new Error('Voice request failed');
  }
  
  async function playSpeechBlob(blob) {
    const url = URL.createObjectURL(blob);
    stopActiveSpeech();
    const audio = new Audio(url);
    audio.preload = 'auto';
    audio.playsInline = true;
    _activeSpeechAudio = audio;
    await waitForAudioReady(audio);
    await audio.play();
    return new Promise(function(resolve) {
      let settled = false;
      function finalize(ok) {
        if (settled) return;
        settled = true;
        try { URL.revokeObjectURL(url); } catch (_) {}
        if (_activeSpeechAudio === audio) _activeSpeechAudio = null;
        resolve(ok);
      }
      audio.onended = function() { finalize(true); };
      audio.onerror = function() { finalize(false); };
    });
  }
  
  async function speakWithKokoro(text, character) {
    const cfg = getTtsConfig(character);
    const result = await requestKokoroAudio(text, cfg);
    if (result.endpoint !== cfg.endpoint) {
      try { localStorage.setItem(TTS_ENDPOINT_STORAGE_KEY, result.endpoint); } catch (_) {}
    }
    return playSpeechBlob(result.blob);
  }
  
  async function speakText(text, opts = {}) {
    const value = String(text || '').trim();
    if (!value) return false;
    const character = opts.character || 'bonzi';
    const prefer = String(opts.prefer || 'kokoro').toLowerCase();
    const cfg = getTtsConfig(character);
  
    if (opts.ignoreEnabled !== true && cfg.enabled === false) {
      return false;
    }
  
    if (prefer === 'browser') {
      return speakWithBrowserTts(value, character);
    }
  
    try {
      return await speakWithKokoro(value, character);
    } catch (err) {
      const fallbackPlayed = await speakWithBrowserTts(value, character);
      if (fallbackPlayed) return true;
      throw err;
    }
  }
  
  window.Win95Speech = {
    speak: speakText,
    speakKokoro: speakWithKokoro,
    speakBrowser: speakWithBrowserTts,
    requestKokoro: requestKokoroAudio,
    playBlob: playSpeechBlob,
    getBlobDurationMs: getSpeechBlobDurationMs,
    cancel: stopActiveSpeech,
    getConfig: getTtsConfig,
    setConfig: setTtsConfig,
    listVoices: getKokoroVoiceChoices,
    openPicker: openVoicePicker
  };
  
  function getClippyAiConfig() {
    const params = new URLSearchParams(window.location.search || '');
    const sharedCfg = window.WIN95_AI || {};
    const endpoint = cleanAiConfigValue(params.get('clippyEndpoint'))
      || cleanAiConfigValue(params.get('bonziEndpoint'))
      || cleanAiConfigValue(params.get('ollamaEndpoint'))
      || cleanAiConfigValue(sharedCfg.clippyEndpoint)
      || cleanAiConfigValue(sharedCfg.ollamaEndpoint)
      || cleanAiConfigValue(sharedCfg.endpoint)
      || readAiStoredValue(OLLAMA_ENDPOINT_STORAGE_KEY)
      || DEFAULT_OLLAMA_ENDPOINT;
    const model = cleanAiConfigValue(params.get('clippyModel'))
      || cleanAiConfigValue(params.get('bonziModel'))
      || cleanAiConfigValue(params.get('ollamaModel'))
      || cleanAiConfigValue(sharedCfg.clippyModel)
      || cleanAiConfigValue(sharedCfg.ollamaModel)
      || cleanAiConfigValue(sharedCfg.model)
      || readAiStoredValue(OLLAMA_MODEL_STORAGE_KEY)
      || DEFAULT_OLLAMA_MODEL;
    return {
      endpoint: endpoint.replace(/\/$/, ''),
      model: model || DEFAULT_OLLAMA_MODEL
    };
  }

  function getOpenAiFallbackConfig() {
    const params = new URLSearchParams(window.location.search || '');
    const sharedCfg = window.WIN95_AI || {};
    const enabled = parseBooleanConfig(
      cleanAiConfigValue(params.get('openaiFallback'))
        || cleanAiConfigValue(sharedCfg.openaiFallback),
      true
    );
    const endpoint = cleanAiConfigValue(params.get('openaiEndpoint'))
      || cleanAiConfigValue(sharedCfg.openaiEndpoint)
      || readAiStoredValue(OPENAI_ENDPOINT_STORAGE_KEY)
      || DEFAULT_OPENAI_ENDPOINT;
    const model = cleanAiConfigValue(params.get('openaiModel'))
      || cleanAiConfigValue(sharedCfg.openaiModel)
      || readAiStoredValue(OPENAI_MODEL_STORAGE_KEY)
      || DEFAULT_OPENAI_MODEL;
    return {
      enabled,
      endpoint: normalizeHostedEndpoint(endpoint, '/api/openai').replace(/\/$/, ''),
      model: model || DEFAULT_OPENAI_MODEL
    };
  }
  
  async function getLocalAiStatus() {
    const config = getClippyAiConfig();
    const endpoints = getAiEndpointCandidates(config.endpoint);
    let lastError = null;
  
    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(endpoint + '/api/tags', {
          method: 'GET',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
  
        if (!res.ok) {
          throw new Error('Ollama unavailable (' + res.status + ')');
        }
  
        const data = await res.json().catch(() => ({}));
        const models = Array.isArray(data.models) ? data.models : [];
        const configuredName = String(config.model || '').toLowerCase();
        const matchedModel = models.find((item) => {
          const name = String(item && item.name || '').toLowerCase();
          return name === configuredName || name.indexOf(configuredName + ':') === 0;
        });
  
        return {
          available: true,
          endpoint,
          configuredModel: config.model,
          activeModel: matchedModel ? matchedModel.name : (models[0] && models[0].name) || config.model,
          modelCount: models.length
        };
      } catch (err) {
        lastError = err;
      }
    }
  
    return {
      available: false,
      endpoint: config.endpoint,
      configuredModel: config.model,
      activeModel: null,
      modelCount: 0,
      error: lastError && lastError.message ? lastError.message : 'Unavailable'
    };
  }

  async function prewarmLocalModel() {
    const config = getClippyAiConfig();
    const endpoints = getAiEndpointCandidates(config.endpoint);
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(endpoint + '/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: config.model,
            prompt: 'warmup',
            system: 'System warmup request. Return a short plain text token.',
            options: {
              num_ctx: DEFAULT_CLIPPY_NUM_CTX
            },
            keep_alive: '20m',
            stream: false
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          const details = await res.text().catch(function () { return ''; });
          throw new Error('Ollama prewarm failed (' + res.status + '): ' + (details || res.statusText || 'Unknown error'));
        }
        await res.json().catch(function () { return {}; });
        return {
          ok: true,
          endpoint: endpoint,
          model: config.model
        };
      } catch (err) {
        lastError = err;
      }
    }

    const detail = lastError && lastError.message ? lastError.message : 'Warmup failed';
    throw new Error(detail);
  }

  async function queryClippyLocal(prompt, systemPrompt, config) {
    const endpoints = getAiEndpointCandidates(config.endpoint);
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000);
        const res = await fetch(endpoint + '/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: config.model,
            prompt: prompt,
            system: systemPrompt,
            options: {
              num_ctx: DEFAULT_CLIPPY_NUM_CTX
            },
            stream: true
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          const details = await res.text().catch(function () { return ''; });
          throw new Error('Ollama unavailable (' + res.status + '): ' + (details || res.statusText || 'Unknown error'));
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        while (true) {
          const next = await reader.read();
          if (next.done) {
            buffer += decoder.decode();
            break;
          }
          buffer += decoder.decode(next.value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            let data = null;
            try {
              data = JSON.parse(trimmed);
            } catch (_) {
              continue;
            }
            if (data && data.error) throw new Error(String(data.error));
            if (data && data.response) fullText += data.response;
          }
        }

        if (buffer.trim()) {
          let tail = null;
          try {
            tail = JSON.parse(buffer.trim());
          } catch (_) {
            tail = null;
          }
          if (tail && tail.error) throw new Error(String(tail.error));
          if (tail && tail.response) fullText += tail.response;
        }

        if (!fullText.trim()) throw new Error('Empty response');
        return {
          text: fullText.trim(),
          endpoint: endpoint,
          model: config.model,
          provider: 'ollama'
        };
      } catch (err) {
        lastError = err;
      }
    }

    const mixedContentHint =
      window.location.protocol === 'https:' && String(config.endpoint).startsWith('http://')
        ? ' Mixed-content block likely: page is HTTPS but Ollama endpoint is HTTP.'
        : '';
    const detail = lastError && lastError.message ? lastError.message : 'Failed to fetch';
    throw new Error(detail + mixedContentHint);
  }

  async function queryOpenAiFallback(prompt, systemPrompt, fallbackConfig) {
    const endpoints = getAiEndpointCandidates(fallbackConfig.endpoint);
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        const headers = { 'Content-Type': 'application/json' };
        const res = await fetch(endpoint + '/v1/chat/completions', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: fallbackConfig.model || DEFAULT_OPENAI_MODEL,
            messages: [
              { role: 'system', content: String(systemPrompt || '') },
              { role: 'user', content: String(prompt || '') }
            ],
            temperature: 0.7
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!res.ok) {
          const details = await res.text().catch(function () { return ''; });
          throw new Error('OpenAI unavailable (' + res.status + '): ' + (details || res.statusText || 'Unknown error'));
        }
        const payload = await res.json();
        const choices = Array.isArray(payload && payload.choices) ? payload.choices : [];
        const message = choices[0] && choices[0].message;
        const text = message && typeof message.content === 'string' ? message.content : '';
        if (!text.trim()) throw new Error('OpenAI returned empty response');
        writeAiStoredValue(OPENAI_ENDPOINT_STORAGE_KEY, endpoint);
        writeAiStoredValue(OPENAI_MODEL_STORAGE_KEY, fallbackConfig.model || DEFAULT_OPENAI_MODEL);
        return {
          text: text.trim(),
          endpoint: endpoint,
          model: fallbackConfig.model || DEFAULT_OPENAI_MODEL,
          provider: 'openai'
        };
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('OpenAI fallback failed');
  }

  async function queryClippyOllama(prompt, systemPrompt) {
    const localConfig = getClippyAiConfig();
    const fallbackConfig = getOpenAiFallbackConfig();

    try {
      return await queryClippyLocal(prompt, systemPrompt, localConfig);
    } catch (localError) {
      if (!fallbackConfig.enabled) throw localError;
      try {
        return await queryOpenAiFallback(prompt, systemPrompt, fallbackConfig);
      } catch (fallbackError) {
        const localMsg = localError && localError.message ? localError.message : 'Local model failed';
        const fallbackMsg = fallbackError && fallbackError.message ? fallbackError.message : 'OpenAI fallback failed';
        throw new Error(localMsg + ' | Fallback: ' + fallbackMsg);
      }
    }
  }
  

  return {
    getClippyAiConfig,
    getOpenAiFallbackConfig,
    getLocalAiStatus,
    queryClippyOllama,
    prewarmLocalModel
  };
}
