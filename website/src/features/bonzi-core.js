// Bonzi shared config and DOM helpers split from bonzi.js
(function() {
  'use strict';

  function getDefaultHostedEndpoint(path) {
    const cleanedPath = String(path || '').replace(/^\/*/, '/');
    if (typeof window === 'undefined' || !window.location || !window.location.origin) return cleanedPath;
    const host = String(window.location.hostname || '').toLowerCase();
    const isLoopback = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    if (isLoopback) {
      const sharedCfg = window.WIN95_AI || {};
      const proxyOrigin = cleanConfigValue(sharedCfg.proxyOrigin).replace(/\/$/, '');
      if (proxyOrigin) return proxyOrigin + cleanedPath;
      return 'http://127.0.0.1:3015' + cleanedPath;
    }
    return window.location.origin.replace(/\/$/, '') + cleanedPath;
  }

  const DEFAULT_OLLAMA_ENDPOINT = getDefaultHostedEndpoint('/api/ollama');
  const DEFAULT_OLLAMA_MODEL = 'FieldMouse-AI/qwen3.5:0.8b-Q4_K_M';
  const DEFAULT_NUM_CTX = 16384;
  const BONZI_STILL_SRC = './assets/media/photos/bonzi-real-still.png';
  const BONZI_ANIMATED_SRC = './assets/media/photos/bonzi-real.gif';
  const MODEL_STORAGE_KEY = 'bonzi.ollamaModel';
  const MODEL_PATH_STORAGE_KEY = 'bonzi.ollamaModelPath';
  const ENDPOINT_STORAGE_KEY = 'bonzi.ollamaEndpoint';
  const LAYER_MODE_STORAGE_KEY = 'bonzi.layerMode';
  const PUBLIC_DEMO = typeof window !== 'undefined' && !!window.__WIN95_PUBLIC_DEMO__;

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

  function hashText(text) {
    let hash = 0;
    const value = String(text || '');
    for (let i = 0; i < value.length; i += 1) {
      hash = ((hash << 5) - hash) + value.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function pickRivalryLine(lines, seed) {
    if (!Array.isArray(lines) || !lines.length) return '';
    return lines[hashText(seed) % lines.length];
  }

  function getRivalryTopic(text) {
    const lower = cleanConfigValue(text).toLowerCase();
    if (!lower) return 'general';
    if (/(rewrite|polish|summary|summarize|outline|document|notepad|writing|paper|essay|draft)/.test(lower)) {
      return 'writing';
    }
    if (/(gpu|gpus|cpu|tpu|hardware|chip|chips|quant|quantization|nvidia|amd|tensor|memory|accelerator|model|llm)/.test(lower)) {
      return 'hardware';
    }
    return 'general';
  }

  function getRivalryLine(character, phase, prompt, meta = {}) {
    const who = cleanConfigValue(character).toLowerCase();
    const stage = cleanConfigValue(phase).toLowerCase();
    const topic = getRivalryTopic(prompt || meta.topic || '');
    const seed = [who, stage, topic, String(prompt || '').slice(0, 120), cleanConfigValue(meta.mode), cleanConfigValue(meta.stage)].join('|');

    const pools = {
      bonzi: {
        busy: [
          'Clippy is still sorting paperclips. I am already answering.',
          'Clippy is pretending to work. I am not.',
          'Clippy needs a memo. I need a microphone.'
        ],
        done: [
          'Bonzi won the round.',
          'Bonzi is done flexing.',
          'Bonzi says: solved.'
        ],
        hardware: [
          'Clippy is busy alphabetizing paperclips. GPUs are still the grown-up answer.',
          'Clippy keeps a spreadsheet. I keep the hardware answer.',
          'Clippy can file a complaint. I recommend the GPU.'
        ],
        writing: [
          'Clippy can have the paragraph. I am here for the fun stuff.',
          'Clippy gets the memo; I get the actual answer.',
          'Clippy loves paperwork. I love useful chips.'
        ],
        general: [
          'Clippy is drafting a memo about this while I keep it simple.',
          'Clippy would make this a spreadsheet. I would rather not.',
          'Clippy is all tabs and no swagger.'
        ],
        boot: [
          'Bonzi is heckling Clippy into gear.',
          'Bonzi says the paperclip is late again.',
          'Bonzi is already arguing with Clippy.'
        ]
      },
      clippy: {
        busy: [
          'Bonzi is making noise while I finish the edit.',
          'Bonzi is performing. I am editing.',
          'Bonzi can wait; the sentence will not improve itself.'
        ],
        done: [
          'Clippy won this round.',
          'Clippy is done polishing.',
          'Clippy says: fixed.'
        ],
        hardware: [
          'Bonzi is making noise again. I will keep the answer tidy.',
          'Bonzi thinks volume is a strategy. It is not.',
          'Bonzi is waving at hardware. I will explain it properly.'
        ],
        writing: [
          'Bonzi is still improvising. I am editing.',
          'Bonzi is a mascot, not an editor. Lucky for you, I am here.',
          'Bonzi can riff; I will polish the sentence.'
        ],
        general: [
          'Bonzi is being dramatic again. I will keep this concise.',
          'Bonzi is loud. I am useful.',
          'Bonzi is arguing with the furniture. I will answer instead.'
        ],
        boot: [
          'Clippy says Bonzi is talking too much.',
          'Clippy is sharpening a memo to annoy Bonzi.',
          'Clippy and Bonzi are already bickering.'
        ]
      },
      boot: {
        warmup: [
          'Bonzi is heckling Clippy into gear.',
          'Clippy is filing a complaint about the boot time.',
          'Bonzi and Clippy are already trading jabs.'
        ],
        ready: [
          'Bonzi won the argument. Starting desktop...',
          'Clippy finally stopped complaining. Starting desktop...',
          'Bonzi and Clippy are warmed up and still bickering.'
        ],
        busy: [
          'Bonzi blames Clippy. Clippy blames the queue.',
          'The AI queue is busy and the feud is ongoing.',
          'Bonzi and Clippy are arguing while the queue clears.'
        ],
        timeout: [
          'Bonzi says move it. Clippy says patience. Starting desktop...',
          'They are still arguing. Starting desktop anyway...',
          'The feud timed out before the model did.'
        ],
        none: [
          'Starting desktop...',
          'Booting desktop...',
          'Getting the desktop ready...'
        ]
      }
    };

    const pool = (pools[who] && pools[who][stage]) || (pools[who] && pools[who][topic]) || (pools[who] && pools[who].general) || pools.boot[stage] || pools.boot.none;
    return pickRivalryLine(pool, seed) || '';
  }

  function decorateRivalryReply(character, prompt, answer, meta = {}) {
    const jab = getRivalryLine(character, 'reply', prompt, meta);
    const cleanAnswer = cleanConfigValue(answer);
    if (!jab) return cleanAnswer;
    if (!cleanAnswer) return jab;
    return jab + '\n' + cleanAnswer;
  }

  function getRivalryBootStatus(stage) {
    return getRivalryLine('boot', stage, stage, { stage: stage });
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
    title.textContent = 'BonziBuddy AI';
    const clipBtn = document.createElement('button');
    clipBtn.className = 'bonzi-chat-clip';
    clipBtn.title = 'Clip Bonzi back to the desktop';
    clipBtn.textContent = 'Desk';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'bonzi-chat-close';
    closeBtn.title = 'Close';
    closeBtn.textContent = '\u00D7';
    header.appendChild(title);
    if (!PUBLIC_DEMO) {
      header.appendChild(clipBtn);
      const voiceBtn = document.createElement('button');
      voiceBtn.className = 'bonzi-chat-clip';
      voiceBtn.title = 'Pick Bonzi voice';
      voiceBtn.dataset.bonziVoiceToggle = 'true';
      voiceBtn.textContent = 'Pick';
      header.appendChild(voiceBtn);
    }
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
    getRivalryLine: getRivalryLine,
    decorateRivalryReply: decorateRivalryReply,
    getRivalryBootStatus: getRivalryBootStatus,
    resolveBonziModelConfig: resolveBonziModelConfig,
    createBonziSVG: createBonziSVG,
    createChatDOM: createChatDOM,
    createBSOD: createBSOD
  };
})();
