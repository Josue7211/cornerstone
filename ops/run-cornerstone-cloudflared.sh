#!/usr/bin/env bash
set -euo pipefail

: "${CLOUDFLARED_TUNNEL_ID:?missing CLOUDFLARED_TUNNEL_ID}"
: "${CLOUDFLARED_CREDENTIALS_FILE:?missing CLOUDFLARED_CREDENTIALS_FILE}"
: "${CLOUDFLARED_HOSTNAME:?missing CLOUDFLARED_HOSTNAME}"

config="${XDG_RUNTIME_DIR:?}/cornerstone-cloudflared.yml"

cat > "$config" <<EOF
tunnel: ${CLOUDFLARED_TUNNEL_ID}
credentials-file: ${CLOUDFLARED_CREDENTIALS_FILE}

ingress:
  - hostname: ${CLOUDFLARED_HOSTNAME}
    path: /api/.*
    service: http://127.0.0.1:3015
  - hostname: ${CLOUDFLARED_HOSTNAME}
    service: http://127.0.0.1:3000
  - service: http_status:404
EOF

exec /usr/bin/cloudflared tunnel --config "$config" run
