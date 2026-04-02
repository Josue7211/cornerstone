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

  var core = window.BonziCore || {};
  var chatEngine = window.BonziChatEngine || {};
  var DEFAULT_OLLAMA_ENDPOINT = core.DEFAULT_OLLAMA_ENDPOINT || '/api/ollama';
  var DEFAULT_OLLAMA_MODEL = core.DEFAULT_OLLAMA_MODEL || 'qwen3.5:0.8b';
  var DEFAULT_NUM_CTX = core.DEFAULT_NUM_CTX || 4096;
var BONZI_STILL_SRC = core.BONZI_STILL_SRC || './assets/media/photos/bonzi-real-still.png';
var BONZI_ANIMATED_SRC = core.BONZI_ANIMATED_SRC || './assets/media/photos/bonzi-real.gif';
  var MODEL_STORAGE_KEY = core.MODEL_STORAGE_KEY || 'bonzi.ollamaModel';
  var MODEL_PATH_STORAGE_KEY = core.MODEL_PATH_STORAGE_KEY || 'bonzi.ollamaModelPath';
  var ENDPOINT_STORAGE_KEY = core.ENDPOINT_STORAGE_KEY || 'bonzi.ollamaEndpoint';
  var LAYER_MODE_STORAGE_KEY = core.LAYER_MODE_STORAGE_KEY || 'bonzi.layerMode';

  var cleanConfigValue = core.cleanConfigValue || function(value) {
    if (value == null) return '';
    return String(value).trim();
  };
  var readStoredValue = core.readStoredValue || function(key) {
    try { return cleanConfigValue(localStorage.getItem(key)); } catch (_) { return ''; }
  };
  var writeStoredValue = core.writeStoredValue || function(key, value) {
    try {
      if (!value) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch (_) {}
  };
  var looksLikeModelPath = core.looksLikeModelPath || function(value) {
    var text = cleanConfigValue(value).toLowerCase();
    if (!text) return false;
    if (text.indexOf('/') !== -1 || text.indexOf('\\') !== -1) return true;
    return text.endsWith('.gguf') || text.endsWith('.bin') || text.endsWith('.safetensors');
  };
  var getFileStem = core.getFileStem || function(pathLike) {
    var cleaned = cleanConfigValue(pathLike).replace(/\\/g, '/');
    var last = cleaned.split('/').pop() || 'local-model';
    return last.replace(/\.[^.]+$/, '') || 'local-model';
  };
  var sanitizeModelAlias = core.sanitizeModelAlias || function(text) {
    return cleanConfigValue(text).toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'local-model';
  };
  var getEndpointCandidates = core.getEndpointCandidates || function(primaryEndpoint) {
    var cleaned = cleanConfigValue(primaryEndpoint).replace(/\/$/, '');
    return cleaned ? [cleaned] : [];
  };
  var resolveBonziModelConfig = core.resolveBonziModelConfig || function() {
    return {
      endpoint: DEFAULT_OLLAMA_ENDPOINT,
      modelPath: '',
      modelName: DEFAULT_OLLAMA_MODEL,
      numCtx: DEFAULT_NUM_CTX
    };
  };
  var createBonziSVG = core.createBonziSVG || function() {
    var img = document.createElement('img');
    img.src = BONZI_STILL_SRC;
    img.alt = 'BonziBuddy';
    img.className = 'bonzi-figure';
    return img;
  };
  var createChatDOM = core.createChatDOM || function() {
    var bubble = document.createElement('div');
    bubble.id = 'bonziChat';
    bubble.className = 'bonzi-chat';
    return bubble;
  };
  var createBSOD = core.createBSOD || function() {
    var bsod = document.createElement('div');
    bsod.id = 'bsodScreen';
    bsod.className = 'bsod-screen';
    return bsod;
  };

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
      this._bonziBuffer = '';
      this.isDragging = false;
      this._dragMoved = false;
      this._roamKickoffTimeout = null;
      this._manualPlacementLock = false;
      this.hintBubble = null;
      this.hintHideTimer = null;
      this.layerMode = readStoredValue(LAYER_MODE_STORAGE_KEY) === 'top' ? 'top' : 'desktop';
      this.voiceEnabled = !!(window.Win95Speech && window.Win95Speech.getConfig && window.Win95Speech.getConfig('bonzi').enabled);
    }

    init() {
      if (this.el) return; // Already initialized
      this._createCharacter();
      this._createChatBubble();
      this._setLayerMode(this.layerMode);
      this._createBSOD();
      this._startRoaming();
      this._bindEvents();
    }

    // ─── CREATE DOM ELEMENTS ───

    _createCharacter() {
      this.el = document.createElement('div');
      this.el.id = 'bonziBuddy';
      this.el.className = 'bonzi-character';
      this.figureEl = createBonziSVG();
      this.el.appendChild(this.figureEl);
      this.el.title = 'Click me to chat!';

      const host = document.getElementById('win95Wallpaper') || document.getElementById('desktop');
      if (host) {
        host.appendChild(this.el);
      } else {
        document.body.appendChild(this.el);
      }

      this.x = 100;
      this.y = window.innerHeight - 250;
      gsap.set(this.el, { x: this.x, y: this.y });
      this._applyLayerMode();
      this._setBonziAnimationState(false);
    }

    _createChatBubble() {
      this.chatBubble = createChatDOM(this._getModelLabel());
      this.chatBubble.style.display = 'none';

      const host = document.getElementById('win95Wallpaper') || document.getElementById('desktop');
      if (host) {
        host.appendChild(this.chatBubble);
      } else {
        document.body.appendChild(this.chatBubble);
      }

      this.chatMessages = this.chatBubble.querySelector('#bonziMessages');
      this.chatInput = this.chatBubble.querySelector('#bonziInput');

      this.hintBubble = document.createElement('div');
      this.hintBubble.className = 'bonzi-hint';
      this.hintBubble.style.display = 'none';
      document.body.appendChild(this.hintBubble);
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

    _getLayerModeLabel() {
      return this.layerMode === 'top' ? 'Top' : 'Desk';
    }

    _applyLayerMode() {
      if (!this.el) return;
      if (this.layerMode === 'top') {
        this.el.style.zIndex = 1000;
        this.el.classList.add('bonzi-focused');
        if (this.chatBubble) this.chatBubble.style.zIndex = '1001';
      } else {
        this.el.style.zIndex = 250;
        this.el.classList.remove('bonzi-focused');
        if (this.chatBubble) this.chatBubble.style.zIndex = '256';
      }
    }

    _setLayerMode(mode) {
      this.layerMode = mode === 'top' ? 'top' : 'desktop';
      writeStoredValue(LAYER_MODE_STORAGE_KEY, this.layerMode);
      this._applyLayerMode();

      const clipButton = this.chatBubble ? this.chatBubble.querySelector('.bonzi-chat-clip') : null;
      if (!clipButton) return;
      clipButton.textContent = this._getLayerModeLabel();
      clipButton.title = this.layerMode === 'top'
        ? 'Set Bonzi to desktop layer'
        : 'Keep Bonzi always on top';
    }

    _createBSOD() {
      this.bsodEl = createBSOD();
      this.bsodEl.style.display = 'none';
      document.body.appendChild(this.bsodEl);
    }

    bringToFront() {
      this._setLayerMode('top');
    }

    clipToDesktop() {
      this._setLayerMode('desktop');
    }

    // ─── EVENT BINDING ───

    _bindEvents() {
      let dragStartX = 0;
      let dragStartY = 0;
      let startMouseX = 0;
      let startMouseY = 0;
      const DRAG_THRESHOLD = 4;

      const onMouseMove = (e) => {
        if (!this.isDragging) return;
        const dx = e.clientX - startMouseX;
        const dy = e.clientY - startMouseY;
        if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
          this._dragMoved = true;
        }
        this._setBonziPosition(dragStartX + dx, dragStartY + dy);
        this._positionChatNearBonzi();
      };

      const onMouseUp = () => {
        if (!this.isDragging) return;
        this.isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        if (this._dragMoved) {
          this._manualPlacementLock = true;
          return;
        }
        this._resumeRoaming();
      };

      this.el.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        if (this.chatBubble && this.chatBubble.style.display !== 'none') return;
        e.preventDefault();
        this.isDragging = true;
        this._dragMoved = false;
        startMouseX = e.clientX;
        startMouseY = e.clientY;
        dragStartX = this.x;
        dragStartY = this.y;
        this._pauseRoaming();
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      });

      this.el.addEventListener('mouseenter', () => {
        this._setBonziAnimationState(true);
      });

      this.el.addEventListener('mouseleave', () => {
        if (this.chatBubble && this.chatBubble.style.display !== 'none') return;
        this._setBonziAnimationState(false);
      });

      // Click Bonzi to toggle chat
      this.el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this._dragMoved) {
          this._dragMoved = false;
          return;
        }
        this._toggleChat();
      });

      // Clip button
      const clipButton = this.chatBubble.querySelector('.bonzi-chat-clip');
      if (clipButton) {
        clipButton.textContent = this._getLayerModeLabel();
        clipButton.title = this.layerMode === 'top'
          ? 'Set Bonzi to desktop layer'
          : 'Keep Bonzi always on top';
        clipButton.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.layerMode === 'top') this.clipToDesktop();
          else this.bringToFront();
        });
      }

      this.voiceButton = this.chatBubble.querySelector('[data-bonzi-voice-toggle="true"]');
      this._syncVoiceButton();
      if (this.voiceButton) {
        this.voiceButton.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.Win95Speech && typeof window.Win95Speech.openPicker === 'function') {
            window.Win95Speech.openPicker('bonzi', {
              onApply: (updated) => {
                this.voiceEnabled = !!updated.enabled;
                this._syncVoiceButton();
                this._addMessage(
                  'Bonzi voice set to ' + updated.voice + ' @ ' + updated.endpoint + '.',
                  'bot'
                );
              }
            });
            return;
          }
          this._addMessage('Voice picker is unavailable right now.', 'bot');
        });
      }

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
      document.addEventListener('keydown', (e) => {
        if (this.bsodEl.style.display !== 'none') {
          this.bsodEl.style.display = 'none';
        }
        const key = e.key;
        if (/^[a-zA-Z]$/.test(key)) {
          this._bonziBuffer = (this._bonziBuffer + key).slice(-5).toLowerCase();
          if (this._bonziBuffer === 'bonzi') {
            this.bringToFront();
            this._showChat();
            this._bonziBuffer = '';
          }
        } else if (key === 'Backspace') {
          this._bonziBuffer = this._bonziBuffer.slice(0, -1);
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
      this._pauseRoaming();
      this._positionChatNearBonzi();
      this.chatBubble.style.display = 'flex';
      this._setBonziAnimationState(true);

      gsap.fromTo(this.chatBubble, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(1.5)' });
      this.chatInput.focus();
    }

    _positionChatNearBonzi() {
      if (!this.el || !this.chatBubble) return;
      const rect = this.el.getBoundingClientRect();
      let chatX = rect.right + 10;
      let chatY = rect.top - 100;

      if (chatX + 320 > window.innerWidth) chatX = rect.left - 330;
      if (chatY < 10) chatY = 10;
      if (chatY + 400 > window.innerHeight) chatY = window.innerHeight - 410;

      this.chatBubble.style.left = chatX + 'px';
      this.chatBubble.style.top = chatY + 'px';
    }

    _hideChat() {
      gsap.to(this.chatBubble, {
        scale: 0.8, opacity: 0, duration: 0.15,
        onComplete: () => {
          this.chatBubble.style.display = 'none';
          this._setBonziAnimationState(false);
          if (!this.isDragging) this._resumeRoaming();
        }
      });
    }

    _setBonziAnimationState(animated) {
      if (!this.figureEl) return;
      const nextSrc = animated ? BONZI_ANIMATED_SRC : BONZI_STILL_SRC;
      if (this.figureEl.getAttribute('src') === nextSrc) return;
      this.figureEl.src = nextSrc;
    }

    _positionHintNearBonzi() {
      if (!this.el || !this.hintBubble) return;
      const rect = this.el.getBoundingClientRect();
      let hintX = rect.right + 12;
      let hintY = rect.top - 8;

      if (hintX + 260 > window.innerWidth) hintX = rect.left - 272;
      if (hintX < 10) hintX = 10;
      if (hintY < 10) hintY = 10;

      this.hintBubble.style.left = hintX + 'px';
      this.hintBubble.style.top = hintY + 'px';
    }

    showHint(text, duration = 5000) {
      if (!this.hintBubble || !this.el) return;
      if (this.hintHideTimer) {
        clearTimeout(this.hintHideTimer);
        this.hintHideTimer = null;
      }
      this._pauseRoaming();
      this.bringToFront();
      this.el.classList.add('bonzi-overlay-mode');
      this.hintBubble.textContent = text;
      this._positionHintNearBonzi();
      this.hintBubble.style.display = 'block';
      gsap.killTweensOf(this.hintBubble);
      gsap.fromTo(this.hintBubble, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out' });
      this.hintHideTimer = setTimeout(() => {
        if (!this.hintBubble) return;
        gsap.to(this.hintBubble, {
          opacity: 0,
          y: 8,
          duration: 0.18,
          ease: 'power2.in',
          onComplete: () => {
            if (this.hintBubble) this.hintBubble.style.display = 'none';
            if (this.el) this.el.classList.remove('bonzi-overlay-mode');
            if (!this.isDragging) this._resumeRoaming();
          }
        });
      }, duration);
    }

    hideHint() {
      if (this.hintHideTimer) {
        clearTimeout(this.hintHideTimer);
        this.hintHideTimer = null;
      }
      if (!this.hintBubble) return;
      gsap.killTweensOf(this.hintBubble);
      this.hintBubble.style.display = 'none';
      if (this.el) this.el.classList.remove('bonzi-overlay-mode');
      if (!this.isDragging) this._resumeRoaming();
    }

    _addMessage(text, sender) {
      const msg = document.createElement('div');
      msg.className = 'bonzi-msg bonzi-msg--' + sender;
      msg.textContent = text;
      this.chatMessages.appendChild(msg);
      this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
      return msg;
    }

    _getVoiceSummary() {
      if (!window.Win95Speech || typeof window.Win95Speech.getConfig !== 'function') return 'browser fallback';
      const cfg = window.Win95Speech.getConfig('bonzi');
      return cfg.voice + ' @ ' + cfg.endpoint;
    }

    _syncVoiceButton() {
      if (!this.voiceButton) return;
      this.voiceButton.textContent = 'Pick';
      this.voiceButton.title = this.voiceEnabled
        ? 'Pick or change Bonzi voice'
        : 'Pick and enable Bonzi voice';
    }

    _setVoiceEnabled(enabled) {
      this.voiceEnabled = !!enabled;
      if (window.Win95Speech && typeof window.Win95Speech.setConfig === 'function') {
        window.Win95Speech.setConfig('bonzi', { enabled: this.voiceEnabled });
      }
      this._syncVoiceButton();
    }

    async _handleVoiceCommand(text) {
      const trimmed = String(text || '').trim();
      const parts = trimmed.split(/\s+/);
      const action = (parts[1] || '').toLowerCase();
      if (!window.Win95Speech || typeof window.Win95Speech.getConfig !== 'function' || typeof window.Win95Speech.setConfig !== 'function') {
        return 'Voice controls are unavailable right now.';
      }
      if (!action || action === 'status') {
        return 'Voice status: ' + (this.voiceEnabled ? 'on' : 'off') + '. ' + this._getVoiceSummary();
      }
      if (action === 'on') {
        this._setVoiceEnabled(true);
        return 'Bonzi voice enabled: ' + this._getVoiceSummary();
      }
      if (action === 'off') {
        this._setVoiceEnabled(false);
        return 'Bonzi voice muted.';
      }
      if (action === 'test') {
        const sample = parts.slice(2).join(' ') || 'Bonzi voice check. Bonzi is live on this desktop.';
        try {
          if (!window.Win95Speech || typeof window.Win95Speech.speakKokoro !== 'function') {
            throw new Error('Voice test path unavailable.');
          }
          await window.Win95Speech.speakKokoro(sample, 'bonzi');
          return 'Voice test sent: ' + this._getVoiceSummary();
        } catch (err) {
          return 'Voice test failed: ' + (err && err.message ? err.message : 'unknown error');
        }
      }
      if (action === 'voice') {
        const nextVoice = parts.slice(2).join(' ').trim();
        if (!nextVoice) {
          if (typeof window.Win95Speech.openPicker === 'function') {
            window.Win95Speech.openPicker('bonzi', {
              onApply: (updated) => {
                this._syncVoiceButton();
                this._addMessage('Bonzi voice set to ' + updated.voice + '.', 'bot');
              }
            });
            return 'Opened Bonzi voice picker.';
          }
          return 'Usage: /voice voice <voice_name>';
        }
        const updated = window.Win95Speech.setConfig('bonzi', { voice: nextVoice });
        this._syncVoiceButton();
        return 'Bonzi voice set to ' + updated.voice + '.';
      }
      if (action === 'endpoint') {
        const nextEndpoint = parts.slice(2).join(' ').trim();
        if (!nextEndpoint) return 'Usage: /voice endpoint <http://host:port>';
        const updated = window.Win95Speech.setConfig('bonzi', { endpoint: nextEndpoint });
        return 'Bonzi endpoint set to ' + updated.endpoint + '.';
      }
      if (action === 'pick' || action === 'picker') {
        if (typeof window.Win95Speech.openPicker === 'function') {
          window.Win95Speech.openPicker('bonzi', {
            onApply: (updated) => {
              this._syncVoiceButton();
              this._addMessage('Bonzi voice set to ' + updated.voice + '.', 'bot');
            }
          });
          return 'Opened Bonzi voice picker.';
        }
        return 'Voice picker is unavailable right now.';
      }
      return 'Voice command not recognized. Try /voice status, /voice on, /voice off, /voice test, /voice pick, /voice voice <name>, or /voice endpoint <url>.';
    }

    _sleep(ms) {
      if (chatEngine && typeof chatEngine.sleep === 'function') {
        return chatEngine.sleep(ms);
      }
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    _setTypingState(msgEl, active) {
      if (chatEngine && typeof chatEngine.setTypingState === 'function') {
        chatEngine.setTypingState(this, msgEl, active);
        return;
      }
      if (!msgEl) return;
      msgEl.classList.remove('bonzi-msg--typing');
      msgEl.style.whiteSpace = active ? 'nowrap' : '';
      if (active) msgEl.textContent = 'Bonzi is typing...';
      this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    async _typeMessage(msgEl, text) {
      if (chatEngine && typeof chatEngine.typeMessage === 'function') {
        return chatEngine.typeMessage(this, msgEl, text);
      }
      const normalized = String(text || '').replace(/\s+/g, ' ').trim();
      this._setTypingState(msgEl, false);
      msgEl.textContent = normalized;
      return normalized;
    }

    async _handleChat() {
      const text = this.chatInput.value.trim();
      if (!text || this.isTyping) return;

      this.chatInput.value = '';
      this._addMessage(text, 'user');

      if (/^\/voice\b/i.test(text)) {
        const reply = await this._handleVoiceCommand(text);
        this._addMessage(reply, 'bot');
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
      } catch (err) {
        const message = err && err.message
          ? err.message
          : 'The class demo AI service is unavailable.';
        await this._typeMessage(botMsg, 'AI service unavailable or busy: ' + message);
      }

      this.isTyping = false;
    }

    async _ensureModelAvailable() {
      if (chatEngine && typeof chatEngine.ensureModelAvailable === 'function') {
        await chatEngine.ensureModelAvailable(this);
      }
    }

    async _queryOllama(prompt) {
      if (chatEngine && typeof chatEngine.queryOllama === 'function') {
        return chatEngine.queryOllama(this, prompt);
      }
      throw new Error('Bonzi chat engine unavailable.');
    }

    // ─── TEXT-TO-SPEECH ───

    _speak(text) {
      const value = String(text || '').trim();
      if (!value) return;
      if (!this.voiceEnabled) return;
      if (window.Win95Speech && typeof window.Win95Speech.speak === 'function') {
        window.Win95Speech.speak(value, { character: 'bonzi', prefer: 'kokoro' }).catch(function() {});
        return;
      }
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(value);
      utterance.rate = 1.08;
      utterance.pitch = 1.05;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    }

    // ─── BSOD ───

    _triggerBSOD() {
      this._hideChat();
      this.bsodEl.style.display = 'flex';
      this._speak("A fatal exception has occurred. Just kidding! You cannot download RAM, silly!");
    }

    // ─── ROAMING ANIMATION ───

    _setBonziPosition(nextX, nextY) {
      const desktop = document.getElementById('desktop');
      const maxX = (desktop ? desktop.clientWidth : window.innerWidth) - 100;
      const maxY = (desktop ? desktop.clientHeight : window.innerHeight) - 150;
      this.x = Math.min(Math.max(20, nextX), Math.max(20, maxX));
      this.y = Math.min(Math.max(20, nextY), Math.max(20, maxY));
      gsap.set(this.el, { x: this.x, y: this.y });
      if (this.chatBubble && this.chatBubble.style.display !== 'none') {
        this._positionChatNearBonzi();
      }
    }

    _pauseRoaming() {
      if (this.roamInterval) {
        clearTimeout(this.roamInterval);
        this.roamInterval = null;
      }
      if (this._roamKickoffTimeout) {
        clearTimeout(this._roamKickoffTimeout);
        this._roamKickoffTimeout = null;
      }
      gsap.killTweensOf(this.el);
    }

    _isChatVisible() {
      return !!(this.chatBubble && this.chatBubble.style.display !== 'none');
    }

    _isHintVisible() {
      return !!(this.hintBubble && this.hintBubble.style.display !== 'none');
    }

    _isDialogVisible() {
      return this._isChatVisible() || this._isHintVisible();
    }

    _resumeRoaming() {
      if (this._manualPlacementLock) return;
      if (this._isDialogVisible()) return;
      if (this.roamInterval || this._roamKickoffTimeout) return;
      const delay = 2200 + Math.random() * 1800;
      this._roamKickoffTimeout = setTimeout(() => {
        this._roamKickoffTimeout = null;
        if (this._isDialogVisible()) return;
        this._startRoaming();
      }, delay);
    }

    _startRoaming() {
      const self = this;

      function roam() {
        if (self.isDragging || self._manualPlacementLock || self._isDialogVisible()) return;
        const desktop = document.getElementById('desktop');
        if (!desktop) return;

        const bounds = desktop.getBoundingClientRect();
        const maxX = bounds.width - 100;
        const maxY = bounds.height - 150;

        const newX = Math.max(20, Math.random() * maxX);
        const newY = Math.max(20, Math.random() * maxY);

        // Flip character based on direction
        const goingRight = newX > self.x;
        const svg = self.el ? self.el.querySelector('svg') : null;
        if (svg) {
          gsap.to(svg, {
            scaleX: goingRight ? 1 : -1,
            duration: 0.2
          });
        }

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
        if (self._isDialogVisible()) {
          self.roamInterval = null;
          return;
        }
        var delay = 8000 + Math.random() * 7000;
        self.roamInterval = setTimeout(function() {
          if (self._isDialogVisible()) {
            self.roamInterval = null;
            return;
          }
          roam();
          scheduleNext();
        }, delay);
      }

      // First roam after 3 seconds
      this._roamKickoffTimeout = setTimeout(function() {
        self._roamKickoffTimeout = null;
        if (self._isDialogVisible()) return;
        roam();
        scheduleNext();
      }, 3000);
    }
  }

  // Export controller (still callable from Start menu launcher)
  window.BonziBuddy = new BonziBuddyController();

  // Auto-init when the desktop becomes visible so Bonzi always appears.
  var desktop = document.getElementById('desktop');
  if (desktop) {
    if (desktop.classList.contains('visible')) {
      window.BonziBuddy.init();
    } else {
      var observer = new MutationObserver(function(mutations) {
        for (var i = 0; i < mutations.length; i++) {
          if (
            mutations[i].attributeName === 'class' &&
            desktop.classList.contains('visible')
          ) {
            window.BonziBuddy.init();
            observer.disconnect();
            break;
          }
        }
      });
      observer.observe(desktop, { attributes: true, attributeFilter: ['class'] });
    }
  }
})();
