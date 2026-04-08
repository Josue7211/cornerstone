# Shared Bonzi/Clippy Warmup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Start one shared Ollama warmup as soon as the browser OS boot sequence begins so Bonzi and Clippy can reuse the same loaded model with minimal chat delay.

**Architecture:** Keep Bonzi and Clippy on the same local Ollama backend and the same model tag. Move model prewarming from desktop-ready timing to a boot-start callback so the warmup overlaps the boot animation instead of starting after the desktop appears. Preserve the existing per-assistant personas by keeping their system prompts separate.

**Tech Stack:** Vanilla browser JavaScript, local Ollama proxy, existing Win95 boot sequence.

---

### Task 1: Add boot-start warmup hook

**Files:**
- Modify: `website/src/runtime/modules/boot-sequence.js`
- Modify: `website/src/runtime/main.js`

- [ ] **Step 1: Write the callback path**

```js
// website/src/runtime/modules/boot-sequence.js
export function startBootSequence(options = {}) {
  const onBootStart = typeof options.onBootStart === 'function' ? options.onBootStart : () => {};
  // existing options...
  function beginBoot() {
    onBootStart();
    runBoot();
  }
  // call beginBoot() from the power-on click path and auto-boot path
}

// website/src/runtime/main.js
startBootSequence({
  onBootStart: queueAiModelPrewarm,
  onStartupChime: playStartupChime,
  onDesktopReady: showWin95Desktop
});
```

- [ ] **Step 2: Run a syntax check**

Run: `node --check website/src/runtime/modules/boot-sequence.js && node --check website/src/runtime/main.js`
Expected: both files parse cleanly.

- [ ] **Step 3: Implement the minimal hook**

```js
// In boot-sequence.js, call onBootStart() once right before runBoot().
// In main.js, stop calling prewarm from desktop-ready and rely on the boot-start callback.
```

- [ ] **Step 4: Run a browser OS sanity check**

Run: `node --check website/src/runtime/modules/boot-sequence.js && node --check website/src/runtime/main.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add website/src/runtime/modules/boot-sequence.js website/src/runtime/main.js
git commit -m "feat: warm ollama at boot start"
```

### Task 2: Keep shared model reuse intact

**Files:**
- Modify: `website/src/runtime/modules/ai-system.js`
- Modify: `website/src/features/bonzi-chat-engine.js`

- [ ] **Step 1: Confirm both assistants keep the same backend/model**

```js
// Both assistants should still resolve the same local Ollama endpoint and
// the same model tag. Only their system prompts differ.
```

- [ ] **Step 2: Run the checks**

Run: `node --check website/src/runtime/modules/ai-system.js && node --check website/src/features/bonzi-chat-engine.js`
Expected: PASS.

- [ ] **Step 3: Keep the shared path minimal**

```js
// No new model registry. No duplicate warmups.
// Just keep the existing shared Ollama config and persona-specific prompts.
```

- [ ] **Step 4: Verify behavior through the proxy**

Run: `curl -sS http://127.0.0.1:3015/api/ollama/api/tags`
Expected: JSON showing the loaded `qwen3.5:0.8b` model.

- [ ] **Step 5: Commit**

```bash
git add website/src/runtime/modules/ai-system.js website/src/features/bonzi-chat-engine.js
git commit -m "feat: keep bonzi and clippy on one ollama model"
```

### Task 3: Verify boot-time warmup timing

**Files:**
- Test: none

- [ ] **Step 1: Start the browser OS**

Open the page, click through boot, and watch that warmup starts immediately when boot begins.

- [ ] **Step 2: Verify no extra desktop delay**

Confirm the desktop still appears normally and chat is ready by the time the user clicks Bonzi or opens Clippy.

- [ ] **Step 3: Commit verification notes**

```bash
git status --short
```
Expected: only the intended source changes remain.

