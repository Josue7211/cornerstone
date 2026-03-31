# Phase 16 Context — Bonzi Buddy

## Goal

Ship a desktop Bonzi companion that:
- roams around the Win95 desktop with GSAP
- chats through Ollama at `localhost:11434`
- falls back to canned responses when Ollama is unavailable
- speaks replies with Web Speech TTS
- triggers a BSOD easter egg on "download more RAM"

## Key Implementation Constraint

Bonzi must support a **local model path** workflow, not only hardcoded model names.

## Relevant Files

- `website/bonzi.js` — Bonzi character, chat, Ollama integration, fallback, TTS, BSOD
- `website/style.css` — Bonzi/chat/BSOD visual styling
- `website/main.js` — desktop boot/app init path that triggers Bonzi initialization

## Requirement Targets

- BONZI-01
- BONZI-02
- BONZI-03
- BONZI-04
- BONZI-05
- BONZI-06
