#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created web/.env — edit ASSETS_BASE with your public CDN URL, then rerun."
  exit 1
fi

set -a
# shellcheck disable=SC1091
. ./.env
set +a

if [[ -z "${ASSETS_BASE:-}" || "${ASSETS_BASE}" == "/assets" ]]; then
  echo "Set ASSETS_BASE in web/.env to the public CDN URL (https://...)." >&2
  exit 1
fi

echo "[1/4] Installing dependencies"
npm install

echo "[2/4] Downloading every model, texture and preview into 3D_Asset_Library"
npm run fetch

echo "[3/4] Building local gallery (assets served from /assets)"
MANIFEST_URL=manifest.local.json ASSETS_BASE=/assets npm run build

echo "[4/4] Starting local gallery at http://localhost:4173"
npm run dev
