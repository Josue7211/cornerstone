#!/usr/bin/env bash
set -euo pipefail

export AI_PROXY_HOST="${AI_PROXY_HOST:-127.0.0.1}"
export AI_PROXY_PORT="${AI_PROXY_PORT:-3015}"
export OLLAMA_BASE="${OLLAMA_BASE:-http://127.0.0.1:11434}"
export TTS_BASE="${TTS_BASE:-http://127.0.0.1:8880}"
export OPENAI_BASE="${OPENAI_BASE:-https://api.openai.com}"
export MAX_OLLAMA_CONCURRENCY="${MAX_OLLAMA_CONCURRENCY:-2}"
export MAX_TTS_CONCURRENCY="${MAX_TTS_CONCURRENCY:-5}"
export MAX_OPENAI_CONCURRENCY="${MAX_OPENAI_CONCURRENCY:-6}"
export OLLAMA_TIMEOUT="${OLLAMA_TIMEOUT:-120}"
export TTS_TIMEOUT="${TTS_TIMEOUT:-60}"
export OPENAI_TIMEOUT="${OPENAI_TIMEOUT:-45}"
export FORCED_OLLAMA_MODEL="${FORCED_OLLAMA_MODEL:-FieldMouse-AI/qwen3.5:0.8b-Q4_K_M}"
export ALLOWED_OLLAMA_MODELS="${ALLOWED_OLLAMA_MODELS:-FieldMouse-AI/qwen3.5:0.8b-Q4_K_M}"
export AI_PROXY_ALLOWED_ORIGINS="${AI_PROXY_ALLOWED_ORIGINS:-https://cornerstone.aparcedo.org,http://127.0.0.1:3000,http://localhost:3000}"
export OPENAI_API_KEY="${OPENAI_API_KEY:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if ! curl -sf http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
  nohup ollama serve >/tmp/ollama-serve.log 2>&1 &
  for _ in $(seq 1 60); do
    if curl -sf http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
      break
    fi
    sleep 1
  done
fi

exec /usr/bin/python3 "$SCRIPT_DIR/ai_proxy.py"
