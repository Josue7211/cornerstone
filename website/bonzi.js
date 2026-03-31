// ═══════════════════════════════════════════════════
// BONZI.JS — Phase 16: Bonzi Buddy Desktop Character
// ═══════════════════════════════════════════════════
// Self-contained purple gorilla desktop companion
// - GSAP roaming animation
// - Ollama chat with canned fallback
// - Web Speech TTS
// - "download more RAM" BSOD easter egg

(function () {
  'use strict';

  const DEFAULT_OLLAMA_ENDPOINT = 'http://localhost:11434';
  const DEFAULT_OLLAMA_MODEL = 'qwen2.5:7b';
  const MODEL_STORAGE_KEY = 'bonzi.ollamaModel';
  const MODEL_PATH_STORAGE_KEY = 'bonzi.ollamaModelPath';
  const ENDPOINT_STORAGE_KEY = 'bonzi.ollamaEndpoint';

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

  function resolveBonziModelConfig() {
    const params = new URLSearchParams(window.location.search || '');
    const winCfg = window.BONZI_OLLAMA || {};

    const endpoint =
      cleanConfigValue(params.get('bonziEndpoint')) ||
      cleanConfigValue(params.get('ollamaEndpoint')) ||
      cleanConfigValue(winCfg.endpoint) ||
      readStoredValue(ENDPOINT_STORAGE_KEY) ||
      DEFAULT_OLLAMA_ENDPOINT;

    const requested =
      cleanConfigValue(params.get('bonziModelPath')) ||
      cleanConfigValue(params.get('modelPath')) ||
      cleanConfigValue(params.get('bonziModel')) ||
      cleanConfigValue(params.get('ollamaModel')) ||
      cleanConfigValue(winCfg.modelPath) ||
      cleanConfigValue(winCfg.model) ||
      readStoredValue(MODEL_PATH_STORAGE_KEY) ||
      readStoredValue(MODEL_STORAGE_KEY) ||
      DEFAULT_OLLAMA_MODEL;

    const modelPath = looksLikeModelPath(requested) ? requested : '';
    const modelName = modelPath ? '' : requested;

    writeStoredValue(ENDPOINT_STORAGE_KEY, endpoint);
    writeStoredValue(MODEL_PATH_STORAGE_KEY, modelPath);
    writeStoredValue(MODEL_STORAGE_KEY, modelName);

    return {
      endpoint: endpoint.replace(/\/$/, ''),
      modelPath: modelPath,
      modelName: modelName || DEFAULT_OLLAMA_MODEL
    };
  }

  // ─── CANNED AI HARDWARE FACTS (Ollama fallback) ───
  const CANNED_RESPONSES = [
    "Did you know? NVIDIA's CUDA platform was a $500M bet with no guaranteed return. Now it's an $80B moat.",
    "Fun fact: The GPU rendering this desktop is architecturally similar to what trains ChatGPT!",
    "The RTX 4070 Ti SUPER can run a 70 billion parameter AI model locally. No cloud needed.",
    "NVIDIA's H100 GPU contains 80 billion transistors — more than 10x the neurons in a bee's brain.",
    "Google's TPU v4 pods can deliver over 1 exaflop of compute. That's a billion billion operations per second!",
    "The first GPU, NVIDIA's GeForce 256, launched in 1999 with 23 million transistors. The H100 has 80 billion.",
    "AMD's MI300X packs 153 billion transistors and 192GB of HBM3 memory on a single accelerator.",
    "Training GPT-4 reportedly cost over $100 million in compute alone. Most of that went to GPU electricity.",
    "Cerebras built a chip the size of a dinner plate — the WSE-3 has 4 trillion transistors on one wafer.",
    "Quantization can shrink a 70B parameter model from 140GB to 35GB with minimal quality loss. That's 4-bit magic.",
    "The NVIDIA A100 can perform 312 teraflops of mixed-precision math. Your calculator does about 10 operations per second.",
    "Apple's M4 Ultra neural engine can hit 38 TOPS — enough to run Llama 3 locally on a Mac.",
    "Intel's Gaudi 3 AI accelerator targets the datacenter market with 1,835 TOPS of BF16 performance.",
    "The bandwidth bottleneck matters more than raw compute — HBM3e delivers 4.8 TB/s to feed hungry tensor cores.",
    "Fun fact: The word 'GPU' didn't exist before 1999. NVIDIA coined it for marketing the GeForce 256."
  ];

  // ─── BUILD SVG GORILLA ───
  function createBonziSVG() {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 80 100');
    svg.setAttribute('width', '80');
    svg.setAttribute('height', '100');

    const parts = [
      // Body
      ['ellipse', { cx: 40, cy: 58, rx: 28, ry: 32, fill: '#7B2D8E' }],
      ['ellipse', { cx: 40, cy: 58, rx: 24, ry: 28, fill: '#9B4DCA' }],
      // Belly
      ['ellipse', { cx: 40, cy: 65, rx: 16, ry: 18, fill: '#C084FC' }],
      // Head
      ['ellipse', { cx: 40, cy: 28, rx: 22, ry: 20, fill: '#9B4DCA' }],
      // Ears
      ['ellipse', { cx: 18, cy: 20, rx: 8, ry: 10, fill: '#7B2D8E' }],
      ['ellipse', { cx: 18, cy: 20, rx: 5, ry: 7, fill: '#C084FC' }],
      ['ellipse', { cx: 62, cy: 20, rx: 8, ry: 10, fill: '#7B2D8E' }],
      ['ellipse', { cx: 62, cy: 20, rx: 5, ry: 7, fill: '#C084FC' }],
      // Eyes
      ['ellipse', { cx: 32, cy: 26, rx: 7, ry: 8, fill: 'white' }],
      ['ellipse', { cx: 48, cy: 26, rx: 7, ry: 8, fill: 'white' }],
      ['ellipse', { cx: 33, cy: 27, rx: 3.5, ry: 4, fill: '#222' }],
      ['ellipse', { cx: 49, cy: 27, rx: 3.5, ry: 4, fill: '#222' }],
      // Eye shine
      ['circle', { cx: 35, cy: 25, r: 1.5, fill: 'white' }],
      ['circle', { cx: 51, cy: 25, r: 1.5, fill: 'white' }],
      // Mouth
      ['path', { d: 'M 32 36 Q 40 44 48 36', stroke: '#5B1D6E', 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round' }],
      // Feet
      ['ellipse', { cx: 28, cy: 90, rx: 12, ry: 6, fill: '#7B2D8E' }],
      ['ellipse', { cx: 52, cy: 90, rx: 12, ry: 6, fill: '#7B2D8E' }],
      // Arms
      ['path', { d: 'M 12 50 Q 4 60 10 72', stroke: '#7B2D8E', 'stroke-width': 8, fill: 'none', 'stroke-linecap': 'round' }],
      ['path', { d: 'M 68 50 Q 76 60 70 72', stroke: '#7B2D8E', 'stroke-width': 8, fill: 'none', 'stroke-linecap': 'round' }],
      // Hands
      ['circle', { cx: 10, cy: 72, r: 5, fill: '#9B4DCA' }],
      ['circle', { cx: 70, cy: 72, r: 5, fill: '#9B4DCA' }],
    ];

    for (const [tag, attrs] of parts) {
      const el = document.createElementNS(ns, tag);
      for (const [k, v] of Object.entries(attrs)) {
        el.setAttribute(k, v);
      }
      svg.appendChild(el);
    }

    return svg;
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
    const closeBtn = document.createElement('button');
    closeBtn.className = 'bonzi-chat-close';
    closeBtn.title = 'Close';
    closeBtn.textContent = '\u00D7';
    header.appendChild(title);
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

  // ─── BONZIBUDDY CLASS ───
  class BonziBuddyController {
    constructor() {
      this.modelConfig = resolveBonziModelConfig();
      this.activeModel = this.modelConfig.modelName;
      this._modelPrepared = !this.modelConfig.modelPath;
      this._preparingModelPromise = null;
      this.el = null;
      this.chatBubble = null;
      this.chatMessages = null;
      this.chatInput = null;
      this.bsodEl = null;
      this.roamInterval = null;
      this.x = 100;
      this.y = 200;
      this.isTyping = false;
    }

    init() {
      if (this.el) return; // Already initialized
      this._createCharacter();
      this._createChatBubble();
      this._createBSOD();
      this._startRoaming();
      this._bindEvents();
    }

    // ─── CREATE DOM ELEMENTS ───

    _createCharacter() {
      this.el = document.createElement('div');
      this.el.id = 'bonziBuddy';
      this.el.className = 'bonzi-character';
      this.el.appendChild(createBonziSVG());
      this.el.title = 'Click me to chat!';

      const desktop = document.getElementById('desktop');
      if (desktop) {
        desktop.appendChild(this.el);
      } else {
        document.body.appendChild(this.el);
      }

      this.x = 100;
      this.y = window.innerHeight - 250;
      gsap.set(this.el, { x: this.x, y: this.y });
    }

    _createChatBubble() {
      this.chatBubble = createChatDOM(this._getModelLabel());
      this.chatBubble.style.display = 'none';

      const desktop = document.getElementById('desktop');
      if (desktop) {
        desktop.appendChild(this.chatBubble);
      } else {
        document.body.appendChild(this.chatBubble);
      }

      this.chatMessages = this.chatBubble.querySelector('#bonziMessages');
      this.chatInput = this.chatBubble.querySelector('#bonziInput');
    }

    _getModelLabel() {
      if (this.modelConfig.modelPath) {
        return getFileStem(this.modelConfig.modelPath);
      }
      return this.activeModel || DEFAULT_OLLAMA_MODEL;
    }

    _refreshChatTitle() {
      if (!this.chatBubble) return;
      const title = this.chatBubble.querySelector('.bonzi-chat-title');
      if (title) {
        title.textContent = 'BonziBuddy AI [' + this._getModelLabel() + ']';
      }
    }

    _createBSOD() {
      this.bsodEl = createBSOD();
      this.bsodEl.style.display = 'none';
      document.body.appendChild(this.bsodEl);
    }

    // ─── EVENT BINDING ───

    _bindEvents() {
      // Click Bonzi to toggle chat
      this.el.addEventListener('click', (e) => {
        e.stopPropagation();
        this._toggleChat();
      });

      // Close button
      this.chatBubble.querySelector('.bonzi-chat-close').addEventListener('click', (e) => {
        e.stopPropagation();
        this._hideChat();
      });

      // Chat form submit
      this.chatBubble.querySelector('#bonziForm').addEventListener('submit', (e) => {
        e.preventDefault();
        this._handleChat();
      });

      // BSOD dismiss on click
      this.bsodEl.addEventListener('click', () => {
        this.bsodEl.style.display = 'none';
      });

      // BSOD dismiss on any key
      document.addEventListener('keydown', () => {
        if (this.bsodEl.style.display !== 'none') {
          this.bsodEl.style.display = 'none';
        }
      });

      // Stop propagation on chat bubble clicks
      this.chatBubble.addEventListener('click', (e) => e.stopPropagation());
    }

    // ─── CHAT LOGIC ───

    _toggleChat() {
      if (this.chatBubble.style.display === 'none') {
        this._showChat();
      } else {
        this._hideChat();
      }
    }

    _showChat() {
      const rect = this.el.getBoundingClientRect();
      let chatX = rect.right + 10;
      let chatY = rect.top - 100;

      if (chatX + 320 > window.innerWidth) chatX = rect.left - 330;
      if (chatY < 10) chatY = 10;
      if (chatY + 400 > window.innerHeight) chatY = window.innerHeight - 410;

      this.chatBubble.style.left = chatX + 'px';
      this.chatBubble.style.top = chatY + 'px';
      this.chatBubble.style.display = 'flex';

      gsap.fromTo(this.chatBubble, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(1.5)' });
      this.chatInput.focus();
    }

    _hideChat() {
      gsap.to(this.chatBubble, {
        scale: 0.8, opacity: 0, duration: 0.15,
        onComplete: () => { this.chatBubble.style.display = 'none'; }
      });
    }

    _addMessage(text, sender) {
      const msg = document.createElement('div');
      msg.className = 'bonzi-msg bonzi-msg--' + sender;
      msg.textContent = text;
      this.chatMessages.appendChild(msg);
      this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
      return msg;
    }

    _sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    _setTypingState(msgEl, active) {
      if (!msgEl) return;
      if (active) {
        msgEl.classList.add('bonzi-msg--typing');
        msgEl.textContent = 'Bonzi is typing';
      } else {
        msgEl.classList.remove('bonzi-msg--typing');
      }
      this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    async _typeMessage(msgEl, text) {
      const normalized = String(text || '').replace(/\s+/g, ' ').trim();
      this._setTypingState(msgEl, false);
      msgEl.textContent = '';

      const textNode = document.createTextNode('');
      const caret = document.createElement('span');
      caret.className = 'bonzi-type-caret';
      caret.textContent = ' ';
      msgEl.appendChild(textNode);
      msgEl.appendChild(caret);

      for (let i = 0; i < normalized.length; i += 1) {
        const ch = normalized[i];
        textNode.data += ch;
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

        let delay = 10 + Math.random() * 14;
        if (/[,.!?]/.test(ch)) delay += 75;
        await this._sleep(delay);
      }

      caret.remove();
      msgEl.textContent = normalized;
      this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
      return normalized;
    }

    async _handleChat() {
      const text = this.chatInput.value.trim();
      if (!text || this.isTyping) return;

      this.chatInput.value = '';
      this._addMessage(text, 'user');

      if (text.toLowerCase().startsWith('/model ')) {
        const modelInput = text.slice(7).trim();
        if (!modelInput) {
          this._addMessage('Usage: /model qwen2.5:7b OR /model /full/path/to/model.gguf', 'bot');
          return;
        }
        this._setModelFromInput(modelInput);
        this._addMessage('Model updated to "' + this._getModelLabel() + '". Ask me a question to test it.', 'bot');
        return;
      }

      // Check for BSOD trigger
      if (text.toLowerCase().includes('download more ram')) {
        this._addMessage("Sure! Downloading 32GB of RAM... please wait...", 'bot');
        setTimeout(() => this._triggerBSOD(), 1500);
        return;
      }

      this.isTyping = true;
      const botMsg = this._addMessage('', 'bot');
      this._setTypingState(botMsg, true);

      try {
        const response = await this._queryOllama(text);
        const spoken = await this._typeMessage(botMsg, response);
        this._speak(spoken);
      } catch (_) {
        // Silent fallback — no console errors
        const canned = CANNED_RESPONSES[Math.floor(Math.random() * CANNED_RESPONSES.length)];
        const spoken = await this._typeMessage(botMsg, canned);
        this._speak(spoken);
      }

      this.isTyping = false;
    }

    _setModelFromInput(value) {
      const cleaned = cleanConfigValue(value);
      if (!cleaned) return;

      if (looksLikeModelPath(cleaned)) {
        this.modelConfig.modelPath = cleaned;
        this.modelConfig.modelName = 'bonzi-local-' + sanitizeModelAlias(getFileStem(cleaned));
        this.activeModel = this.modelConfig.modelName;
        this._modelPrepared = false;
      } else {
        this.modelConfig.modelPath = '';
        this.modelConfig.modelName = cleaned;
        this.activeModel = cleaned;
        this._modelPrepared = true;
      }

      writeStoredValue(MODEL_PATH_STORAGE_KEY, this.modelConfig.modelPath);
      writeStoredValue(MODEL_STORAGE_KEY, this.modelConfig.modelName);
      this._refreshChatTitle();
    }

    async _ensureModelAvailable() {
      if (this._modelPrepared || !this.modelConfig.modelPath) {
        return;
      }
      if (this._preparingModelPromise) {
        await this._preparingModelPromise;
        return;
      }

      const alias = this.modelConfig.modelName || ('bonzi-local-' + sanitizeModelAlias(getFileStem(this.modelConfig.modelPath)));
      const modelfile = 'FROM ' + this.modelConfig.modelPath;
      const createUrl = this.modelConfig.endpoint + '/api/create';

      this._preparingModelPromise = (async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        const res = await fetch(createUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: alias,
            modelfile: modelfile,
            stream: true
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error('Ollama model registration failed');
        if (res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          while (true) {
            const next = await reader.read();
            if (next.done) break;
            const lines = decoder.decode(next.value, { stream: true }).split('\n').filter(function (line) { return line.trim(); });
            for (const line of lines) {
              let data = null;
              try {
                data = JSON.parse(line);
              } catch (_) {
                // Ignore partial JSON chunks and keep reading.
                continue;
              }
              if (data && data.error) {
                throw new Error(String(data.error));
              }
            }
          }
        }

        this.activeModel = alias;
        this.modelConfig.modelName = alias;
        this._modelPrepared = true;
        writeStoredValue(MODEL_STORAGE_KEY, alias);
        this._refreshChatTitle();
      })();

      try {
        await this._preparingModelPromise;
      } finally {
        this._preparingModelPromise = null;
      }
    }

    async _queryOllama(prompt) {
      const systemPrompt = "You are BonziBuddy, a friendly purple gorilla assistant on a Windows 95 desktop. You are an expert on AI hardware — GPUs, TPUs, neural accelerators, NVIDIA, AMD, quantization, HBM memory, tensor cores, and the semiconductor industry. Keep responses concise (2-3 sentences max). Be enthusiastic and fun.";
      await this._ensureModelAvailable();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(this.modelConfig.endpoint + '/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.activeModel || DEFAULT_OLLAMA_MODEL,
          prompt: prompt,
          system: systemPrompt,
          stream: true
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error('Ollama unavailable');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(function(l) { return l.trim(); });
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              fullText += data.response;
            }
          } catch (_) {
            // Skip malformed JSON lines silently
          }
        }
      }

      if (!fullText.trim()) throw new Error('Empty response');
      return fullText.trim();
    }

    // ─── TEXT-TO-SPEECH ───

    _speak(text) {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 1.3;
      utterance.volume = 0.7;
      window.speechSynthesis.speak(utterance);
    }

    // ─── BSOD ───

    _triggerBSOD() {
      this._hideChat();
      this.bsodEl.style.display = 'flex';
      this._speak("A fatal exception has occurred. Just kidding! You cannot download RAM, silly!");
    }

    // ─── ROAMING ANIMATION ───

    _startRoaming() {
      const self = this;

      function roam() {
        const desktop = document.getElementById('desktop');
        if (!desktop) return;

        const bounds = desktop.getBoundingClientRect();
        const maxX = bounds.width - 100;
        const maxY = bounds.height - 150;

        const newX = Math.max(20, Math.random() * maxX);
        const newY = Math.max(20, Math.random() * maxY);

        // Flip character based on direction
        const goingRight = newX > self.x;
        gsap.to(self.el.querySelector('svg'), {
          scaleX: goingRight ? 1 : -1,
          duration: 0.2
        });

        // Bounce to new position
        gsap.to(self.el, {
          x: newX,
          y: newY,
          duration: 1.8 + Math.random() * 1.2,
          ease: 'elastic.out(0.6, 0.4)',
          onComplete: function() {
            self.x = newX;
            self.y = newY;
          }
        });
      }

      function scheduleNext() {
        var delay = 8000 + Math.random() * 7000;
        self.roamInterval = setTimeout(function() {
          roam();
          scheduleNext();
        }, delay);
      }

      // First roam after 3 seconds
      setTimeout(function() {
        roam();
        scheduleNext();
      }, 3000);
    }
  }

  // Export for lazy init from app launcher (Phase 18 PERF-01)
  window.BonziBuddy = new BonziBuddyController();
})();
