# Contributing

This repository is open source under the GNU Affero General Public License v3.

## Branch Strategy

- `master`: stable, release-ready history only.
- `develop`: integration branch for the next release.
- `feat/<slug>`: new user-facing work.
- `fix/<slug>`: bug fixes.
- `docs/<slug>`: documentation-only changes.
- `chore/<slug>`: tooling, cleanup, and maintenance.
- `release/vX.Y.Z`: release prep when you need a stabilization branch.
- `hotfix/<slug>`: urgent fixes branched from `master`.

Do not develop directly on `master`. Start from `develop` when it exists, otherwise branch from `master`.

Use the helper:

```bash
./scripts/git-start-branch.sh feat polish-final-product
```

## Version History

- `VERSION` is the current project version.
- `CHANGELOG.md` is the human-readable release history.
- Tag releases with annotated tags such as `v1.0.0`.

Recommended release flow:

1. Merge finished feature branches into `develop`.
2. Update `CHANGELOG.md` and `VERSION`.
3. Merge `develop` into `master`.
4. Create an annotated tag for the release.

## Before You Submit Changes

- Keep secrets out of the repo.
- Avoid machine-specific paths and local tunnel IDs.
- Run the relevant checks for the area you changed.
- Prefer small, reviewable commits.
- Keep generated files such as `__pycache__` and `.pyc` files out of git.

## Local Workflow

- Website: open `website/index.html` directly or run your local static server.
- AI proxy: start `ops/start-local-ai-proxy.sh`.
- Web app checks: use the scripts under `website/scripts/` when you touch explorer, IE, or presentation flows.

## Security

If you are changing anything around auth, secrets, proxies, or file rendering, run a security review before merge.
