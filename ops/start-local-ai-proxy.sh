#!/usr/bin/env bash
set -euo pipefail

export AI_PROXY_HOST="${AI_PROXY_HOST:-0.0.0.0}"
export AI_PROXY_PORT="${AI_PROXY_PORT:-3015}"
export OLLAMA_BASE="${OLLAMA_BASE:-http://127.0.0.1:11434}"
export TTS_BASE="${TTS_BASE:-http://127.0.0.1:8880}"
export MAX_OLLAMA_CONCURRENCY="${MAX_OLLAMA_CONCURRENCY:-2}"
export MAX_TTS_CONCURRENCY="${MAX_TTS_CONCURRENCY:-2}"
export OLLAMA_TIMEOUT="${OLLAMA_TIMEOUT:-120}"
export TTS_TIMEOUT="${TTS_TIMEOUT:-60}"
export FORCED_OLLAMA_MODEL="${FORCED_OLLAMA_MODEL:-qwen3.5:0.8b}"
export ALLOWED_OLLAMA_MODELS="${ALLOWED_OLLAMA_MODELS:-qwen3.5:0.8b}"

exec /usr/bin/python3 /home/josue/Documents/homework/cornerstone/ops/ai_proxy.py
