// Bonzi chat/LLM runtime helpers split from bonzi.js
(function() {
  'use strict';

  var core = window.BonziCore || {};
  var DEFAULT_OLLAMA_MODEL = core.DEFAULT_OLLAMA_MODEL || 'FieldMouse-AI/qwen3.5:0.8b-Q4_K_M';
  var DEFAULT_NUM_CTX = core.DEFAULT_NUM_CTX || 16384;
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
  var readStoredValue = core.readStoredValue || function(key) {
    try { return String(localStorage.getItem(key) || '').trim(); } catch (_) { return ''; }
  };
  var getEndpointCandidates = core.getEndpointCandidates || function(primaryEndpoint) {
    var cleaned = String(primaryEndpoint || '').trim().replace(/\/$/, '');
    return cleaned ? [cleaned] : [];
  };
  var PUBLIC_DEMO = typeof window !== 'undefined' && !!window.__WIN95_PUBLIC_DEMO__;

  function normalizeText(text) {
    return String(text || '').replace(/\r\n/g, '\n').trim();
  }

  function collapseWhitespace(text) {
    return normalizeText(text).replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n');
  }

  function extractPromptBody(prompt) {
    var text = normalizeText(prompt);
    var markers = ['Target text:', 'Document:', 'Prompt:'];
    var bestIndex = -1;
    var bestMarker = '';
    for (var i = 0; i < markers.length; i += 1) {
      var index = text.lastIndexOf(markers[i]);
      if (index > bestIndex) {
        bestIndex = index;
        bestMarker = markers[i];
      }
    }
    if (bestIndex === -1) return text;
    return normalizeText(text.slice(bestIndex + bestMarker.length));
  }

  function splitSentences(text) {
    return collapseWhitespace(text).match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  }

  function stripThinkingTags(text) {
    return stripReasoningPreface(String(text || '')
      .replace(/<think>[\s\S]*?<\/think>/gi, ' ')
      .replace(/<\/?think>/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim());
  }

  function stripEmoji(text) {
    return String(text || '')
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
      .replace(/[\uFE0F\u200D]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function stripReasoningPreface(text) {
    var lines = String(text || '').replace(/\r\n/g, '\n').split('\n');
    var output = [];
    var skippingReasoning = false;

    function looksLikeReasoningLine(line) {
      var normalized = String(line || '').trim().toLowerCase();
      if (!normalized) return false;
      if (
        normalized.indexOf('thinking process:') === 0 ||
        normalized.indexOf('thought process:') === 0 ||
        normalized.indexOf('reasoning:') === 0 ||
        normalized.indexOf('analysis:') === 0 ||
        normalized.indexOf('internal reasoning:') === 0 ||
        normalized.indexOf('chain of thought:') === 0 ||
        normalized.indexOf('chain-of-thought:') === 0
      ) {
        return true;
      }
      if (/^\d+\.\s*\*\*(analyze|analyse|break down|consider|determine|evaluate|identify|plan|reason|understand)\b/i.test(normalized)) {
        return true;
      }
      if (/^\*+\s*(user|role|context|constraints|expertise|analysis|reasoning|request|task)\s*:\s*/i.test(normalized)) {
        return true;
      }
      if (/^[-*]\s*(user|role|context|constraints|expertise|analysis|reasoning|request|task)\s*:\s*/i.test(normalized)) {
        return true;
      }
      return false;
    }

    for (var i = 0; i < lines.length; i += 1) {
      var line = lines[i];
      var trimmed = String(line || '').trim();

      if (!trimmed) {
        if (!skippingReasoning && output.length) {
          output.push('');
        }
        continue;
      }

      if (!skippingReasoning && looksLikeReasoningLine(trimmed)) {
        skippingReasoning = true;
        continue;
      }

      if (skippingReasoning && looksLikeReasoningLine(trimmed)) {
        continue;
      }

      if (skippingReasoning) {
        skippingReasoning = false;
      }

      output.push(trimmed);
    }

    return stripEmoji(output.join('\n').trim());
  }

  function stripPromptEcho(text) {
    var normalized = String(text || '').replace(/\r\n/g, '\n').trim();
    if (!normalized) return '';
    var markers = [
      'Continuity topics only:',
      'User message:',
      'Answer only the user message.',
      'Use the topics only if they help continuity.',
      'Do not mention the topics block.'
    ];
    for (var i = 0; i < markers.length; i += 1) {
      var index = normalized.indexOf(markers[i]);
      if (index > 0) {
        normalized = normalized.slice(0, index).trim();
      }
    }
    var roleEcho = normalized.search(/(?:^|[\s\n])(User|Bonzi|Assistant|System|Clippy)\s*:/i);
    if (roleEcho > 0) {
      normalized = normalized.slice(0, roleEcho).trim();
    }
    return normalized;
  }

  function makeBonziOfflineReply(prompt) {
    var source = collapseWhitespace(prompt).toLowerCase();
    var body = extractPromptBody(prompt);
    var compactBody = collapseWhitespace(body).toLowerCase();

    if (/^(hi|hello|hey|yo|sup|hallo|hola)\b/.test(compactBody) || compactBody.length < 28) {
      return 'Hey. Ask me about AI hardware, GPUs, TPUs, quantization, or local inference.';
    }

    if (/gpu|gpus|cpu|tpu|nvidia|amd|quant|tensor|hbm|llm|model/i.test(source)) {
      return 'Short version: GPUs are the best default for this kind of work, TPUs are great for tensor-heavy workloads, and CPUs are for general control flow. If you want, I can help pick the right chip class for your exact workload.';
    }

    if (/compare|versus| vs |difference|which is better/i.test(source)) {
      return 'If you are choosing between options, compare throughput, memory, software support, and cost per result. Give me the two parts you want compared and I will keep it short.';
    }

    if (/setup|install|wire|connect|configure/i.test(source)) {
      return 'I am offline right now, but I can still help with setup advice. Tell me what hardware, model, or endpoint you are trying to wire up and I will give you the shortest useful path.';
    }

    var sentences = splitSentences(body);
    if (sentences.length) {
      return sentences.slice(0, 1).join(' ').trim();
    }

    return 'I am offline right now, but I can still help with AI hardware, model choices, and setup. Ask me about GPUs, TPUs, quantization, or your target workload.';
  }

  function sleep(ms) {
    return new Promise(function(resolve) { setTimeout(resolve, ms); });
  }

  function isTransientOllamaError(message) {
    var text = String(message || '').toLowerCase();
    return (
      text.indexOf('aborted') !== -1 ||
      text.indexOf('failed to fetch') !== -1 ||
      text.indexOf('connection refused') !== -1 ||
      text.indexOf('ollama unavailable (502)') !== -1 ||
      text.indexOf('ollama unavailable (503)') !== -1 ||
      text.indexOf('busy') !== -1 ||
      text.indexOf('timeout') !== -1 ||
      text.indexOf('empty response') !== -1
    );
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
    var systemPrompt =
      '/no_think You are BonziBuddy, a friendly purple gorilla assistant on an AI 98 OS desktop. ' +
      'You are an expert on AI hardware — GPUs, TPUs, neural accelerators, NVIDIA, AMD, quantization, HBM memory, tensor cores, and the semiconductor industry. ' +
      'Keep responses very short, ideally 1-2 sentences. Sound playful, a little cheeky, and distinctly mascot-like, but stay useful. ' +
      'Use plain ASCII and do not use emojis. ' +
      'Do not output hidden reasoning, <think> tags, chain-of-thought, or prompt echoes.';

    try {
      await ensureModelAvailable(controller);
    } catch (_) {}
    var endpointList = getEndpointCandidates(controller.modelConfig.endpoint);
    var lastError = null;

    for (var attempt = 0; attempt < 4; attempt += 1) {
      for (var idx = 0; idx < endpointList.length; idx += 1) {
        var endpoint = endpointList[idx];
        try {
          var abortController = new AbortController();
          var timeoutId = setTimeout(function() { abortController.abort(); }, 15000);
          var res = await fetch(endpoint + '/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: controller.activeModel || DEFAULT_OLLAMA_MODEL,
              prompt: prompt,
              system: systemPrompt,
              think: false,
              options: {
                num_ctx: controller.modelConfig.numCtx || DEFAULT_NUM_CTX,
                num_predict: 256
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

          fullText = stripPromptEcho(stripThinkingTags(fullText));
          if (!fullText.trim()) throw new Error('Empty response');
          if (!PUBLIC_DEMO && window.BonziCore && typeof window.BonziCore.decorateRivalryReply === 'function') {
            fullText = window.BonziCore.decorateRivalryReply('bonzi', prompt, fullText);
          }
          if (endpoint !== controller.modelConfig.endpoint) {
            controller.modelConfig.endpoint = endpoint;
            writeStoredValue(ENDPOINT_STORAGE_KEY, endpoint);
          }
          return fullText.trim();
        } catch (err) {
          lastError = err;
        }
      }

      if (!isTransientOllamaError(lastError && lastError.message ? lastError.message : '')) break;
      await sleep(250 + (attempt * 600));
    }

    var detail = lastError && lastError.message ? lastError.message : 'Failed to fetch';
    if (lastError && /aborted|aborterror/i.test(detail)) {
      var offlineReply = makeBonziOfflineReply(prompt);
      return offlineReply;
    }
    var fallbackReply = makeBonziOfflineReply(prompt);
    return fallbackReply;
  }

  window.BonziChatEngine = {
    sleep: sleep,
    setTypingState: setTypingState,
    typeMessage: typeMessage,
    ensureModelAvailable: ensureModelAvailable,
    queryOllama: queryOllama
  };
})();
