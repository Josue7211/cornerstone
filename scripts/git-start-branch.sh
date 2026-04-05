#!/usr/bin/env bash

set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <feat|fix|docs|chore|hotfix|release> <slug> [base-branch]" >&2
  exit 1
fi

type_prefix="$1"
slug="$2"
base_branch="${3:-}"

case "$type_prefix" in
  feat|fix|docs|chore|hotfix)
    branch_name="${type_prefix}/${slug}"
    ;;
  release)
    branch_name="release/${slug}"
    ;;
  *)
    echo "Unsupported branch type: ${type_prefix}" >&2
    exit 1
    ;;
esac

if [[ -z "$base_branch" ]]; then
  if git show-ref --verify --quiet refs/heads/develop; then
    base_branch="develop"
  else
    base_branch="master"
  fi
fi

git fetch --all --prune
git checkout "$base_branch"
git pull --ff-only || true
git checkout -b "$branch_name"

echo "Created branch ${branch_name} from ${base_branch}"
