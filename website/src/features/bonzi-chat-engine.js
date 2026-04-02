// Bonzi chat/LLM runtime helpers split from bonzi.js
(function() {
  'use strict';

  var core = window.BonziCore || {};
  var DEFAULT_OLLAMA_MODEL = core.DEFAULT_OLLAMA_MODEL || 'qwen3.5:0.8b';
  var DEFAULT_NUM_CTX = core.DEFAULT_NUM_CTX || 4096;
  var MODEL_STORAGE_KEY = core.MODEL_STORAGE_KEY || 'bonzi.ollamaModel';
  var ENDPOINT_STORAGE_KEY = core.ENDPOINT_STORAGE_KEY || 'bonzi.ollamaEndpoint';
  var sanitizeModelAlias = core.sanitizeModelAlias || function(text) {
    return String(text || '').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'local-model';
  };
  var getFileStem = core.getFileStem || function(pathLike) {
    var cleaned = String(pathLike || '').replace(/\\/g, '/');
    var last = cleaned.split('/').pop() || 'local-model';
    return last.replace(/\.[^.]+$/, '') || 'local-model';
  };
  var writeStoredValue = core.writeStoredValue || function(key, value) {
    try {
      if (!value) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch (_) {}
  };
  var getEndpointCandidates = core.getEndpointCandidates || function(primaryEndpoint) {
    var cleaned = String(primaryEndpoint || '').trim().replace(/\/$/, '');
    return cleaned ? [cleaned] : [];
  };

  function sleep(ms) {
    return new Promise(function(resolve) { setTimeout(resolve, ms); });
  }

  function setTypingState(controller, msgEl, active) {
    if (!controller || !msgEl) return;
    if (active) {
      msgEl.classList.remove('bonzi-msg--typing');
      msgEl.style.whiteSpace = 'nowrap';
      msgEl.textContent = 'Bonzi is typing...';
    } else {
      msgEl.classList.remove('bonzi-msg--typing');
      msgEl.style.whiteSpace = '';
    }
    if (controller.chatMessages) {
      controller.chatMessages.scrollTop = controller.chatMessages.scrollHeight;
    }
  }

  async function typeMessage(controller, msgEl, text) {
    var normalized = String(text || '').replace(/\s+/g, ' ').trim();
    setTypingState(controller, msgEl, false);
    msgEl.textContent = '';

    var textNode = document.createTextNode('');
    var caret = document.createElement('span');
    caret.className = 'bonzi-type-caret';
    caret.textContent = ' ';
    msgEl.appendChild(textNode);
    msgEl.appendChild(caret);

    for (var i = 0; i < normalized.length; i += 1) {
      var ch = normalized[i];
      textNode.data += ch;
      if (controller && controller.chatMessages) {
        controller.chatMessages.scrollTop = controller.chatMessages.scrollHeight;
      }

      var delay = 10 + Math.random() * 14;
      if (/[,.!?]/.test(ch)) delay += 75;
      await sleep(delay);
    }

    caret.remove();
    msgEl.textContent = normalized;
    if (controller && controller.chatMessages) {
      controller.chatMessages.scrollTop = controller.chatMessages.scrollHeight;
    }
    return normalized;
  }

  async function ensureModelAvailable(controller) {
    if (!controller || controller._modelPrepared || !controller.modelConfig || !controller.modelConfig.modelPath) {
      return;
    }
    if (controller._preparingModelPromise) {
      await controller._preparingModelPromise;
      return;
    }

    var alias = controller.modelConfig.modelName || ('bonzi-local-' + sanitizeModelAlias(getFileStem(controller.modelConfig.modelPath)));
    var modelfile = 'FROM ' + controller.modelConfig.modelPath;
    var createUrl = controller.modelConfig.endpoint + '/api/create';

    controller._preparingModelPromise = (async function() {
      var abortController = new AbortController();
      var timeoutId = setTimeout(function() { abortController.abort(); }, 30000);
      var res = await fetch(createUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: alias,
          modelfile: modelfile,
          stream: true
        }),
        signal: abortController.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error('Ollama model registration failed');
      if (res.body) {
        var reader = res.body.getReader();
        var decoder = new TextDecoder();
        while (true) {
          var next = await reader.read();
          if (next.done) break;
          var lines = decoder.decode(next.value, { stream: true }).split('\n').filter(function(line) { return line.trim(); });
          for (var i = 0; i < lines.length; i += 1) {
            var data = null;
            try {
              data = JSON.parse(lines[i]);
            } catch (_) {
              continue;
            }
            if (data && data.error) throw new Error(String(data.error));
          }
        }
      }

      controller.activeModel = alias;
      controller.modelConfig.modelName = alias;
      controller._modelPrepared = true;
      writeStoredValue(MODEL_STORAGE_KEY, alias);
      if (typeof controller._refreshChatTitle === 'function') {
        controller._refreshChatTitle();
      }
    })();

    try {
      await controller._preparingModelPromise;
    } finally {
      controller._preparingModelPromise = null;
    }
  }

  async function queryOllama(controller, prompt) {
    var runtimeFacts =
      'Runtime facts you must follow exactly: ' +
      'You are running on a class demo AI service through Ollama. ' +
      'Current model: ' + ((controller && controller.activeModel) || DEFAULT_OLLAMA_MODEL) + '. ' +
      'Configured context window: ' + String((controller && controller.modelConfig && controller.modelConfig.numCtx) || DEFAULT_NUM_CTX) + ' tokens. ' +
      'Do not invent GPU, server, or infrastructure details beyond these facts.';
    var systemPrompt =
      'You are BonziBuddy, a friendly purple gorilla assistant on an AI 98 OS desktop. ' +
      'You are an expert on AI hardware — GPUs, TPUs, neural accelerators, NVIDIA, AMD, quantization, HBM memory, tensor cores, and the semiconductor industry. ' +
      'Keep responses concise (2-4 sentences max). Avoid generic fluff. ' +
      runtimeFacts;

    await ensureModelAvailable(controller);
    var endpointList = getEndpointCandidates(controller.modelConfig.endpoint);
    var lastError = null;

    for (var idx = 0; idx < endpointList.length; idx += 1) {
      var endpoint = endpointList[idx];
      try {
        var abortController = new AbortController();
        var timeoutId = setTimeout(function() { abortController.abort(); }, 45000);
        var res = await fetch(endpoint + '/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: controller.activeModel || DEFAULT_OLLAMA_MODEL,
            prompt: prompt,
            system: systemPrompt,
            options: {
              num_ctx: controller.modelConfig.numCtx || DEFAULT_NUM_CTX
            },
            stream: true
          }),
          signal: abortController.signal
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
          var details = await res.text().catch(function() { return ''; });
          throw new Error('Ollama unavailable (' + res.status + '): ' + (details || res.statusText || 'Unknown error'));
        }

        var reader = res.body.getReader();
        var decoder = new TextDecoder();
        var fullText = '';
        var buffer = '';

        while (true) {
          var next = await reader.read();
          if (next.done) {
            buffer += decoder.decode();
            break;
          }

          buffer += decoder.decode(next.value, { stream: true });
          var lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (var lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
            var trimmed = lines[lineIndex].trim();
            if (!trimmed) continue;
            var data = null;
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
          var tail = null;
          try {
            tail = JSON.parse(buffer.trim());
          } catch (_) {}
          if (tail && tail.error) throw new Error(String(tail.error));
          if (tail && tail.response) fullText += tail.response;
        }

        if (!fullText.trim()) throw new Error('Empty response');
        if (endpoint !== controller.modelConfig.endpoint) {
          controller.modelConfig.endpoint = endpoint;
          writeStoredValue(ENDPOINT_STORAGE_KEY, endpoint);
        }
        return fullText.trim();
      } catch (err) {
        lastError = err;
      }
    }

    var mixedContentHint =
      window.location.protocol === 'https:' && String(controller.modelConfig.endpoint).startsWith('http://')
        ? ' Mixed-content block likely: page is HTTPS but Ollama endpoint is HTTP.'
        : '';
    var detail = lastError && lastError.message ? lastError.message : 'Failed to fetch';
    throw new Error(detail + mixedContentHint);
  }

  window.BonziChatEngine = {
    sleep: sleep,
    setTypingState: setTypingState,
    typeMessage: typeMessage,
    ensureModelAvailable: ensureModelAvailable,
    queryOllama: queryOllama
  };
})();
