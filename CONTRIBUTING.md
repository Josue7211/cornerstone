# Contributing

This repository is open source under the Apache 2.0 license.

## Before you submit changes

- Keep secrets out of the repo.
- Avoid machine-specific paths and local tunnel IDs.
- Run the relevant checks for the area you changed.
- Prefer small, reviewable commits.

## Local workflow

- Website: open `website/index.html` directly or run your local static server.
- AI proxy: start `ops/start-local-ai-proxy.sh`.
- Web app checks: use the scripts under `website/scripts/` when you touch explorer, IE, or presentation flows.

## Security

If you are changing anything around auth, secrets, proxies, or file rendering, run a security review before merge.
