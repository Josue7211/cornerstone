# Phase 16 Verification

**Date:** 2026-03-31  
**Status:** automated_pass_with_manual_runtime_checks

## Automated Checks Passed

- `node --check website/bonzi.js` passes (no syntax errors)
- `website/bonzi.js` includes:
  - configurable Ollama model settings (`bonziModel`, `bonziModelPath`, `/model ...`)
  - default local model `qwen2.5:7b`
  - local path preparation flow via `POST /api/create`
  - inference flow via `POST /api/generate`
  - canned fallback response path on failures
  - Web Speech API usage (`speechSynthesis`)
  - BSOD trigger phrase `"download more ram"`

## Manual Runtime Verification

1. Start the site:
   - `cd website && python3 -m http.server 4173`
   - Open `http://localhost:4173/index.html`
2. Confirm desktop behavior:
   - Bonzi appears on desktop
   - Bonzi roams to random positions with bounce animation every few seconds
3. Confirm Ollama model-name flow:
   - Run `ollama serve`
   - Ensure a model exists, e.g. `ollama pull qwen2.5:7b`
   - Click Bonzi, ask a hardware question, and verify response appears from Ollama
4. Confirm local model-path flow:
   - In Bonzi chat, send `/model /absolute/path/to/your-model.gguf`
   - Ask another question
   - Verify Bonzi first prepares model alias (via `/api/create`) and then answers
5. Confirm graceful fallback:
   - Stop Ollama (`pkill ollama` or close server)
   - Ask a question
   - Verify Bonzi returns canned response with no broken UI state
6. Confirm TTS:
   - With browser audio enabled, ask a question and confirm Bonzi speaks the answer
7. Confirm BSOD easter egg:
   - Ask `"download more RAM"`
   - Verify BSOD overlay appears and dismisses on click/key press

## Notes

- Local model path support depends on Ollama server access to that file path on the same host.
- If a provided path cannot be loaded by Ollama, Bonzi falls back to canned responses instead of breaking chat.
