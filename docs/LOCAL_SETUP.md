# Local setup — all models on your machine

This project keeps the 1.7 GB model library out of Git. `setup.sh` fetches it
from the configured CDN and starts a fully local gallery.

## Requirements

- Node.js 18+
- `ASSETS_BASE` pointing to the public bucket URL (set in `web/.env`)

## Steps

```bash
cd web
cp .env.example .env
# edit .env: ASSETS_BASE=https://assets.example.com
./setup.sh
```

Open `http://localhost:4173`.

## What setup does

1. `npm install`
2. `npm run fetch` — reads `public/manifest.json`, then downloads every model,
   linked glTF `.bin`/texture file and preview into `3D_Asset_Library/`.
3. Writes `public/manifest.local.json` (previews rewritten to local paths).
4. Builds `dist/` with `ASSETS_BASE=/assets` and `MANIFEST_URL=manifest.local.json`.
5. Starts `scripts/dev.mjs`, which maps `/assets/*` to `3D_Asset_Library/*`.

Files that already exist are skipped, so rerunning `setup.sh` is safe and fast.

## Notes

- The generated `manifest.local.json` and the library folder are git-ignored.
- The public Vercel site keeps using `manifest.json` directly from the CDN.
- If a download fails, rerun `npm run fetch`; only missing files are fetched.
- `ASSET_LIMIT=10 npm run fetch` can be used for a quick smoke test.
