// Bonzi shared config and DOM helpers split from bonzi.js
(function() {
  'use strict';

  function getDefaultHostedEndpoint(path) {
    const cleanedPath = String(path || '').replace(/^\/*/, '/');
    if (typeof window === 'undefined' || !window.location || !window.location.origin) return cleanedPath;
    return window.location.origin.replace(/\/$/, '') + cleanedPath;
  }

  const DEFAULT_OLLAMA_ENDPOINT = getDefaultHostedEndpoint('/api/ollama');
  const DEFAULT_OLLAMA_MODEL = 'qwen3.5:0.8b';
  const DEFAULT_NUM_CTX = 4096;
  const BONZI_STILL_SRC = './assets/media/photos/bonzi-real-still.png';
  const BONZI_ANIMATED_SRC = './assets/media/photos/bonzi-real.gif';
  const MODEL_STORAGE_KEY = 'bonzi.ollamaModel';
  const MODEL_PATH_STORAGE_KEY = 'bonzi.ollamaModelPath';
  const ENDPOINT_STORAGE_KEY = 'bonzi.ollamaEndpoint';
  const LAYER_MODE_STORAGE_KEY = 'bonzi.layerMode';

  function cleanConfigValue(value) {
    if (value == null) return '';
    return String(value).trim();
  }

  function readStoredValue(key) {
    try {
      return cleanConfigValue(localStorage.getItem(key));
    } catch (_) {
      return '';
    }
  }

  function writeStoredValue(key, value) {
    try {
      if (!value) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value);
      }
    } catch (_) {
      // localStorage access can fail in strict browser modes.
    }
  }

  function looksLikeModelPath(value) {
    const text = cleanConfigValue(value).toLowerCase();
    if (!text) return false;
    if (text.indexOf('/') !== -1 || text.indexOf('\\') !== -1) return true;
    if (text.endsWith('.gguf') || text.endsWith('.bin') || text.endsWith('.safetensors')) return true;
    return false;
  }

  function getFileStem(pathLike) {
    const cleaned = cleanConfigValue(pathLike).replace(/\\/g, '/');
    const last = cleaned.split('/').pop() || 'local-model';
    return last.replace(/\.[^.]+$/, '') || 'local-model';
  }

  function sanitizeModelAlias(text) {
    return cleanConfigValue(text)
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'local-model';
  }

  function getEndpointCandidates(primaryEndpoint) {
    const cleaned = cleanConfigValue(primaryEndpoint).replace(/\/$/, '');
    const unique = new Set();
    if (cleaned) unique.add(cleaned);

    if (cleaned.indexOf('localhost') !== -1) {
      unique.add(cleaned.replace('localhost', '127.0.0.1'));
    } else if (cleaned.indexOf('127.0.0.1') !== -1) {
      unique.add(cleaned.replace('127.0.0.1', 'localhost'));
    }

    return Array.from(unique);
  }

  function resolveBonziModelConfig() {
    const params = new URLSearchParams(window.location.search || '');
    const winCfg = window.BONZI_OLLAMA || {};
    const sharedCfg = window.WIN95_AI || {};

    const endpoint =
      cleanConfigValue(params.get('bonziEndpoint')) ||
      cleanConfigValue(params.get('ollamaEndpoint')) ||
      cleanConfigValue(sharedCfg.bonziEndpoint) ||
      cleanConfigValue(sharedCfg.ollamaEndpoint) ||
      cleanConfigValue(sharedCfg.endpoint) ||
      cleanConfigValue(winCfg.endpoint) ||
      readStoredValue(ENDPOINT_STORAGE_KEY) ||
      DEFAULT_OLLAMA_ENDPOINT;

    const modelPath = '';
    const modelName =
      cleanConfigValue(params.get('bonziModel')) ||
      cleanConfigValue(params.get('ollamaModel')) ||
      cleanConfigValue(sharedCfg.bonziModel) ||
      cleanConfigValue(sharedCfg.ollamaModel) ||
      cleanConfigValue(sharedCfg.model) ||
      cleanConfigValue(winCfg.model) ||
      readStoredValue(MODEL_STORAGE_KEY) ||
      DEFAULT_OLLAMA_MODEL;

    writeStoredValue(ENDPOINT_STORAGE_KEY, endpoint);
    writeStoredValue(MODEL_PATH_STORAGE_KEY, '');
    writeStoredValue(MODEL_STORAGE_KEY, modelName);

    return {
      endpoint: endpoint.replace(/\/$/, ''),
      modelPath: modelPath,
      modelName: modelName || DEFAULT_OLLAMA_MODEL,
      numCtx: DEFAULT_NUM_CTX
    };
  }

  // ─── BUILD BONZI FIGURE ───
  function createBonziSVG() {
    const img = document.createElement('img');
    img.src = BONZI_STILL_SRC;
    img.alt = 'BonziBuddy';
    img.className = 'bonzi-figure';
    return img;
  }

  // ─── BUILD CHAT BUBBLE DOM ───
  function createChatDOM(modelLabel) {
    const bubble = document.createElement('div');
    bubble.id = 'bonziChat';
    bubble.className = 'bonzi-chat';

    // Header
    const header = document.createElement('div');
    header.className = 'bonzi-chat-header';
    const title = document.createElement('span');
    title.className = 'bonzi-chat-title';
    title.textContent = 'BonziBuddy AI [' + modelLabel + ']';
    const clipBtn = document.createElement('button');
    clipBtn.className = 'bonzi-chat-clip';
    clipBtn.title = 'Clip Bonzi back to the desktop';
    clipBtn.textContent = 'Desk';
    const voiceBtn = document.createElement('button');
    voiceBtn.className = 'bonzi-chat-clip';
    voiceBtn.title = 'Pick Bonzi voice';
    voiceBtn.dataset.bonziVoiceToggle = 'true';
    voiceBtn.textContent = 'Pick';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'bonzi-chat-close';
    closeBtn.title = 'Close';
    closeBtn.textContent = '\u00D7';
    header.appendChild(title);
    header.appendChild(clipBtn);
    header.appendChild(voiceBtn);
    header.appendChild(closeBtn);

    // Messages
    const messages = document.createElement('div');
    messages.className = 'bonzi-chat-messages';
    messages.id = 'bonziMessages';
    const greeting = document.createElement('div');
    greeting.className = 'bonzi-msg bonzi-msg--bot';
    greeting.textContent = "Hi! I'm BonziBuddy! Ask me anything about AI hardware!";
    messages.appendChild(greeting);

    // Form
    const form = document.createElement('form');
    form.className = 'bonzi-chat-form';
    form.id = 'bonziForm';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'bonzi-chat-input';
    input.id = 'bonziInput';
    input.placeholder = 'Ask about AI hardware...';
    input.autocomplete = 'off';
    const sendBtn = document.createElement('button');
    sendBtn.type = 'submit';
    sendBtn.className = 'bonzi-chat-send';
    sendBtn.textContent = 'Send';
    form.appendChild(input);
    form.appendChild(sendBtn);

    bubble.appendChild(header);
    bubble.appendChild(messages);
    bubble.appendChild(form);

    return bubble;
  }

  // ─── BUILD BSOD DOM ───
  function createBSOD() {
    const bsod = document.createElement('div');
    bsod.id = 'bsodScreen';
    bsod.className = 'bsod-screen';

    const content = document.createElement('div');
    content.className = 'bsod-content';

    const lines = [
      { tag: 'h1', text: 'Windows' },
      { tag: 'p', text: 'A fatal exception 0E has occurred at 0028:C0034B03 in VXD VRAM(01) + 00004B03. The current application will be terminated.' },
      { tag: 'br' },
      { tag: 'p', text: '*  Press any key to terminate the current application.' },
      { tag: 'p', text: '*  Press CTRL+ALT+DEL to restart your computer. You will' },
      { tag: 'p', text: '   lose any unsaved information in all applications.' },
      { tag: 'br' },
      { tag: 'p', text: 'Press any key to continue _', center: true },
      { tag: 'br' },
      { tag: 'br' },
      { tag: 'p', text: 'ERROR: INSUFFICIENT_RAM — Attempted to download 32GB DDR5.', cls: 'bsod-secret' },
      { tag: 'p', text: 'This operation is not supported. Nice try though.', cls: 'bsod-secret' },
      { tag: 'br' },
      { tag: 'p', text: '(click anywhere to dismiss)', small: true },
    ];

    for (const line of lines) {
      const el = document.createElement(line.tag);
      if (line.text) el.textContent = line.text;
      if (line.cls) el.className = line.cls;
      if (line.center) el.style.textAlign = 'center';
      if (line.small) { el.style.textAlign = 'center'; el.style.fontSize = '0.8em'; el.style.opacity = '0.7'; }
      content.appendChild(el);
    }

    bsod.appendChild(content);
    return bsod;
  }

  window.BonziCore = {
    getDefaultHostedEndpoint: getDefaultHostedEndpoint,
    DEFAULT_OLLAMA_ENDPOINT: DEFAULT_OLLAMA_ENDPOINT,
    DEFAULT_OLLAMA_MODEL: DEFAULT_OLLAMA_MODEL,
    DEFAULT_NUM_CTX: DEFAULT_NUM_CTX,
    BONZI_STILL_SRC: BONZI_STILL_SRC,
    BONZI_ANIMATED_SRC: BONZI_ANIMATED_SRC,
    MODEL_STORAGE_KEY: MODEL_STORAGE_KEY,
    MODEL_PATH_STORAGE_KEY: MODEL_PATH_STORAGE_KEY,
    ENDPOINT_STORAGE_KEY: ENDPOINT_STORAGE_KEY,
    LAYER_MODE_STORAGE_KEY: LAYER_MODE_STORAGE_KEY,
    cleanConfigValue: cleanConfigValue,
    readStoredValue: readStoredValue,
    writeStoredValue: writeStoredValue,
    looksLikeModelPath: looksLikeModelPath,
    getFileStem: getFileStem,
    sanitizeModelAlias: sanitizeModelAlias,
    getEndpointCandidates: getEndpointCandidates,
    resolveBonziModelConfig: resolveBonziModelConfig,
    createBonziSVG: createBonziSVG,
    createChatDOM: createChatDOM,
    createBSOD: createBSOD
  };
})();
