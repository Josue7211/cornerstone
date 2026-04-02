// Clippy assistant UI/runtime split from main.js
function getSelectionOrParagraph(textarea) {
  const value = textarea.value || '';
  const start = textarea.selectionStart || 0;
  const end = textarea.selectionEnd || 0;
  if (start !== end) {
    return { text: value.slice(start, end), start: start, end: end, mode: 'selection' };
  }

  const paraStart = value.lastIndexOf('\n\n', Math.max(0, start - 1));
  const paraEndRaw = value.indexOf('\n\n', start);
  const nextBreak = value.indexOf('\n', start);
  const resolvedStart = paraStart === -1 ? 0 : paraStart + 2;
  let resolvedEnd = paraEndRaw === -1 ? value.length : paraEndRaw;
  if (resolvedStart === resolvedEnd && nextBreak !== -1) resolvedEnd = nextBreak;
  const text = value.slice(resolvedStart, resolvedEnd).trim();
  return { text: text || value.trim(), start: resolvedStart, end: resolvedEnd, mode: text ? 'paragraph' : 'document' };
}

function inferClippyContext(fileName, text) {
  const lowerName = String(fileName || '').toLowerCase();
  const lowerText = String(text || '').toLowerCase();
  if (lowerName.endsWith('.md')) {
    return {
      headline: 'Markdown draft detected',
      subline: 'I can rewrite sections, turn notes into bullets, and build a cleaner outline.',
      suggestedAction: 'outline'
    };
  }
  if (lowerName.indexOf('reflection') !== -1) {
    return {
      headline: 'Reflection draft open',
      subline: 'Best move here is sharpening first-person voice and tightening repetition.',
      suggestedAction: 'polish'
    };
  }
  if (lowerText.indexOf('thesis') !== -1 || lowerText.indexOf('abstract') !== -1) {
    return {
      headline: 'Research writing mode',
      subline: 'I can strengthen the thesis, summarize dense sections, or clean the academic tone.',
      suggestedAction: 'rewrite'
    };
  }
  return {
    headline: 'Writing help is ready',
    subline: 'Select text for targeted edits, or ask for a custom rewrite below.',
    suggestedAction: 'custom'
  };
}

function createClippyFigure() {
  const img = document.createElement('img');
  img.className = 'clippy-figure-image';
  img.src = './assets/media/photos/clippy-body.png?v=2';
  img.alt = 'Clippy';
  return img;
}

export function createClippyAssistant(noteShell, textarea, hintsEl, fileName, deps = {}) {
  const getClippyAiConfig = typeof deps.getClippyAiConfig === 'function' ? deps.getClippyAiConfig : function() { return { model: 'qwen3.5:0.8b' }; };
  const queryClippyOllama = typeof deps.queryClippyOllama === 'function' ? deps.queryClippyOllama : async function() { return { text: '', model: 'fallback' }; };
  const clippy = document.createElement('div');
  clippy.className = 'clippy-popup clippy-docked clippy-functional';
  clippy.dataset.visible = 'true';

  const character = document.createElement('div');
  character.className = 'clippy-character';
  character.appendChild(createClippyFigure());

  const closePaneBtn = document.createElement('button');
  closePaneBtn.className = 'clippy-close-pane';
  closePaneBtn.type = 'button';
  closePaneBtn.textContent = 'X';

  const bubble = document.createElement('div');
  bubble.className = 'clippy-bubble';

  const title = document.createElement('p');
  title.textContent = 'Clippy is ready.';
  title.className = 'clippy-title';
  bubble.appendChild(title);

  const sub = document.createElement('p');
  sub.className = 'clippy-sub';
  sub.textContent = '';
  bubble.appendChild(sub);

  const status = document.createElement('p');
  status.className = 'clippy-status';
  status.textContent = 'Idle';
  bubble.appendChild(status);

  const actions = document.createElement('div');
  actions.className = 'clippy-actions';
  let clippyVoiceEnabled = !!(window.Win95Speech && window.Win95Speech.getConfig && window.Win95Speech.getConfig('clippy').enabled);
  let clippyVoiceToggleBtn = null;

  const promptForm = document.createElement('form');
  promptForm.className = 'clippy-form';

  const promptInput = document.createElement('input');
  promptInput.type = 'text';
  promptInput.className = 'clippy-input';
  promptInput.placeholder = 'Ask Clippy to rewrite the selection or make an outline...';
  promptInput.autocomplete = 'off';

  const promptSubmit = document.createElement('button');
  promptSubmit.type = 'submit';
  promptSubmit.className = 'clippy-send';
  promptSubmit.textContent = 'Ask';

  promptForm.appendChild(promptInput);
  promptForm.appendChild(promptSubmit);

  function button(label, fn) {
    const btn = document.createElement('button');
    btn.className = 'clippy-action-btn';
    btn.type = 'button';
    btn.textContent = label;
    btn.addEventListener('click', fn);
    return btn;
  }

  function updateClippyVoiceToggle() {
    if (!clippyVoiceToggleBtn) return;
    clippyVoiceToggleBtn.textContent = clippyVoiceEnabled ? 'Voice: On' : 'Voice: Off';
  }

  function getClippyVoiceSummary() {
    if (!window.Win95Speech || typeof window.Win95Speech.getConfig !== 'function') return '';
    const cfg = window.Win95Speech.getConfig('clippy');
    return cfg.voice + ' @ ' + cfg.endpoint;
  }

  function syncClippyVoiceEnabled(enabled) {
    clippyVoiceEnabled = !!enabled;
    if (window.Win95Speech && typeof window.Win95Speech.setConfig === 'function') {
      window.Win95Speech.setConfig('clippy', { enabled: clippyVoiceEnabled });
    }
    updateClippyVoiceToggle();
  }

  async function testClippyVoice() {
    if (!window.Win95Speech || typeof window.Win95Speech.speakKokoro !== 'function') {
      status.textContent = 'Speech engine not available.';
      return;
    }
    try {
      await window.Win95Speech.speakKokoro(
        'Clippy online. I can rewrite your notes.',
        'clippy'
      );
      status.textContent = 'Voice test sent with ' + getClippyVoiceSummary() + '.';
    } catch (err) {
      status.textContent = 'Voice test failed: ' + (err && err.message ? err.message : 'unknown error');
    }
  }

  function configureClippyVoice() {
    if (!window.Win95Speech || typeof window.Win95Speech.openPicker !== 'function') {
      status.textContent = 'Speech settings unavailable.';
      return;
    }
    window.Win95Speech.openPicker('clippy', {
      onApply: function(updated) {
        status.textContent = 'Clippy voice set to ' + updated.voice + ' @ ' + updated.endpoint + '.';
      },
      onError: function(err) {
        status.textContent = err && err.message ? err.message : 'Speech settings unavailable.';
      }
    });
  }

  function setBusyState(isBusy, message) {
    clippy.dataset.busy = isBusy ? 'true' : 'false';
    status.textContent = message;
    promptInput.disabled = isBusy;
    promptSubmit.disabled = isBusy;
    actions.querySelectorAll('button').forEach(function(btn) {
      btn.disabled = isBusy;
    });
  }

  function applyTextResult(mode, resultText, target, customMode) {
    const cleaned = String(resultText || '').trim();
    if (!cleaned) return;
    if (mode === 'outline') {
      const insertAt = textarea.selectionEnd || textarea.selectionStart || textarea.value.length;
      const prefix = insertAt > 0 && textarea.value.slice(insertAt - 1, insertAt) !== '\n' ? '\n\n' : '';
      textarea.setRangeText(prefix + cleaned + '\n', insertAt, insertAt, 'end');
    } else if (mode === 'summary' || customMode === 'insert') {
      const insertAt = target.end;
      textarea.setRangeText('\n\n' + cleaned + '\n', insertAt, insertAt, 'end');
    } else {
      textarea.setRangeText(cleaned, target.start, target.end, 'select');
    }
    textarea.dispatchEvent(new Event('input'));
    textarea.focus();
  }

  async function runClippyTask(mode, customInstruction, customMode) {
    const target = getSelectionOrParagraph(textarea);
    const fileContext = fileName || 'Untitled.txt';
    const documentText = textarea.value || '';
    const clippedDocument = documentText.slice(0, 10000);
    const clippedTarget = String(target.text || '').slice(0, 5000);
    const systemPrompt = [
      'You are Clippy, a writing assistant inside an AI 98 OS Notepad app.',
      'You help with school writing, outlines, summaries, reflections, and document cleanup.',
      'Return plain text only.',
      'Do not use markdown fences.',
      'Keep the response directly usable inside the document.'
    ].join(' ');

    let prompt = '';
    if (mode === 'rewrite') {
      prompt = [
        'Rewrite the target text so it is clearer, tighter, and more polished.',
        'Preserve the author meaning and keep the length close to the original.',
        'File name: ' + fileContext,
        'Target text:',
        clippedTarget
      ].join('\n');
    } else if (mode === 'polish') {
      prompt = [
        'Polish the target text for an academic but natural tone.',
        'Preserve first-person voice when present.',
        'Do not add citations or invent facts.',
        'File name: ' + fileContext,
        'Target text:',
        clippedTarget
      ].join('\n');
    } else if (mode === 'summary') {
      prompt = [
        'Summarize the target text into 2-4 concise sentences.',
        'Focus on the strongest claims and evidence.',
        'File name: ' + fileContext,
        'Target text:',
        clippedTarget
      ].join('\n');
    } else if (mode === 'outline') {
      prompt = [
        'Create a clean outline for this document.',
        'Use plain text with numbered sections.',
        'Keep it short and actionable.',
        'File name: ' + fileContext,
        'Document:',
        clippedDocument
      ].join('\n');
    } else {
      prompt = [
        'Apply this instruction to the user text.',
        'Instruction: ' + (customInstruction || 'Improve the writing.'),
        'If text is selected, work only on that text. If not, use the nearby paragraph.',
        'Return only the revised text unless the instruction clearly asks for a summary or outline.',
        'File name: ' + fileContext,
        'Target text:',
        clippedTarget || clippedDocument
      ].join('\n');
    }

    setBusyState(true, 'Thinking with ' + getClippyAiConfig().model + '...');
    try {
      const result = await queryClippyOllama(prompt, systemPrompt);
      applyTextResult(mode, result.text, target, customMode);
      status.textContent = 'Done via ' + result.model + '.';
      if (clippyVoiceEnabled && window.Win95Speech && typeof window.Win95Speech.speak === 'function') {
        window.Win95Speech.speak(result.text, { character: 'clippy', prefer: 'kokoro' }).catch(function() {});
      }
    } catch (err) {
      status.textContent = 'Clippy AI unavailable or busy: ' + (err && err.message ? err.message : 'unknown error');
    } finally {
      setBusyState(false, status.textContent);
    }
  }

  actions.appendChild(button('Fix spacing', function() {
    textarea.value = textarea.value
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/[ \t]+\n/g, '\n');
    textarea.dispatchEvent(new Event('input'));
    status.textContent = 'Spacing cleaned.';
    textarea.focus();
  }));

  clippyVoiceToggleBtn = button('Voice: Off', function() {
    syncClippyVoiceEnabled(!clippyVoiceEnabled);
    status.textContent = clippyVoiceEnabled
      ? 'Clippy voice enabled (' + getClippyVoiceSummary() + ').'
      : 'Clippy voice muted.';
  });
  actions.appendChild(clippyVoiceToggleBtn);
  updateClippyVoiceToggle();

  actions.appendChild(button('Voice cfg', function() {
    configureClippyVoice();
  }));

  actions.appendChild(button('Test voice', function() {
    testClippyVoice();
  }));

  actions.appendChild(button('Rewrite sel.', function() {
    runClippyTask('rewrite');
  }));

  actions.appendChild(button('APA polish', function() {
    runClippyTask('polish');
  }));

  actions.appendChild(button('Summarize', function() {
    runClippyTask('summary', '', 'insert');
  }));

  actions.appendChild(button('Make outline', function() {
    runClippyTask('outline');
  }));

  actions.appendChild(button('Title case sel.', function() {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start === end) {
      status.textContent = 'Select text first for title case.';
      return;
    }
    const selected = textarea.value.slice(start, end);
    const updated = selected
      .toLowerCase()
      .replace(/\b([a-z])/g, function(_, ch) { return ch.toUpperCase(); });
    textarea.setRangeText(updated, start, end, 'select');
    textarea.dispatchEvent(new Event('input'));
    status.textContent = 'Selection converted to title case.';
    textarea.focus();
  }));

  promptForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const instruction = promptInput.value.trim();
    if (!instruction) {
      status.textContent = 'Type a request first.';
      return;
    }
    const lower = instruction.toLowerCase();
    const customMode = /outline|list|bullet|summary|summarize/.test(lower) ? 'insert' : '';
    runClippyTask('custom', instruction, customMode);
  });

  closePaneBtn.addEventListener('click', () => {
    clippy.dataset.visible = 'false';
    clippy.classList.add('clippy-hiding');
    setTimeout(() => { if (clippy.parentNode) clippy.remove(); }, 300);
  });

  function updateHints() {
    const text = textarea.value || '';
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lineCount = text.length ? text.split('\n').length : 0;
    hintsEl.textContent = wordCount + ' words, ' + lineCount + ' lines';
    const context = inferClippyContext(fileName, text);
    title.textContent = context.headline;
    sub.textContent = context.subline;
    if (clippy.dataset.busy !== 'true') {
      if (!text.trim()) {
        status.textContent = 'Open a document or start typing.';
      } else if (textarea.selectionStart !== textarea.selectionEnd) {
        status.textContent = 'Selection ready for AI rewrite.';
      } else if (wordCount > 0) {
        status.textContent = 'Try ' + context.suggestedAction + ' or type a custom request below.';
      }
    }
  }

  bubble.appendChild(promptForm);
  bubble.appendChild(actions);
  clippy.appendChild(closePaneBtn);
  clippy.appendChild(character);
  clippy.appendChild(bubble);
  noteShell.appendChild(clippy);

  textarea.addEventListener('input', updateHints);
  textarea.addEventListener('select', updateHints);
  updateHints();

  return {
    updateFile(nextFileName) {
      fileName = nextFileName || fileName;
      updateHints();
    },
    show() {
      if (clippy.parentNode) return;
      clippy.classList.remove('clippy-hiding');
      clippy.dataset.visible = 'true';
      noteShell.appendChild(clippy);
      updateHints();
    }
  };
}
