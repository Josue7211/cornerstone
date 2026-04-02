#!/usr/bin/env bash
set -euo pipefail

WEB_URL="${CORNERSTONE_URL:-http://127.0.0.1:8080}"
OLLAMA_URL="${OLLAMA_HEALTH_URL:-http://127.0.0.1:11434/api/tags}"
KOKORO_URL="${KOKORO_HEALTH_URL:-http://127.0.0.1:8880/health}"
DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"

notify_discord() {
  local msg="$1"
  if [[ -z "$DISCORD_WEBHOOK_URL" ]]; then
    return 0
  fi
  local esc
  esc=$(printf '%s' "$msg" | sed 's/\\/\\\\/g; s/"/\\"/g')
  local payload
  payload='{"content":"'"$esc"'"}'
  curl -sS -X POST -H 'Content-Type: application/json' -d "$payload" "$DISCORD_WEBHOOK_URL" >/dev/null || true
}

fail=0

if ! curl -fsS "$WEB_URL" >/dev/null 2>&1; then
  systemctl --user restart cornerstone-web.service || true
  fail=1
  notify_discord "[cornerstone] Web endpoint failed. Restarted cornerstone-web.service."
fi

if ! curl -fsS "$OLLAMA_URL" >/dev/null 2>&1; then
  fail=1
  notify_discord "[cornerstone] Ollama health check failed at $OLLAMA_URL"
fi

if [[ "${KOKORO_REQUIRED:-0}" == "1" ]]; then
  if ! curl -fsS "$KOKORO_URL" >/dev/null 2>&1; then
    fail=1
    notify_discord "[cornerstone] Kokoro health check failed at $KOKORO_URL"
  fi
fi

if [[ $fail -eq 0 && "${DISCORD_HEARTBEAT:-0}" == "1" ]]; then
  notify_discord "[cornerstone] heartbeat ok ($(date -Iseconds))"
fi
