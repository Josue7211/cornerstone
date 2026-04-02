#!/usr/bin/env bash
set -euo pipefail

URL="${CORNERSTONE_URL:-http://127.0.0.1:8080}"
BROWSER_BIN="${CORNERSTONE_BROWSER:-/usr/bin/firefox}"

if [[ ! -x "$BROWSER_BIN" ]]; then
  echo "Browser not found: $BROWSER_BIN" >&2
  exit 1
fi

for _ in $(seq 1 60); do
  if curl -fsS "$URL" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

exec "$BROWSER_BIN" --kiosk "$URL"
