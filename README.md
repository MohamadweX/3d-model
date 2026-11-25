# Realistic 3D Asset Gallery

A fast, static, searchable gallery for **4,810 CC0 3D models**. The repository
contains only the web application and metadata. Large model files are kept
outside Git and are streamed from an external CDN (Cloudflare R2) at runtime.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Static HTML, CSS, vanilla JavaScript, Google `model-viewer` 4.0 |
| Build | Node.js build scripts (no framework, no bundler dependency) |
| Backend | None |
| Database | None |
| Asset storage | Cloudflare R2 bucket + public CDN domain |
| Deploy target | Vercel (static output: `web/dist`) |

## Repository layout

```
.
├── web/
│   ├── public/          # Source files copied into dist by the build
│   │   ├── index.html   # Gallery UI (RTL Arabic interface)
│   │   ├── viewer.js    # Search, filters, camera and animation controls
│   │   ├── viewer.css
│   │   ├── manifest.json  # 4,810 asset records (metadata only, ~3 MB)
│   │   └── vendor/model-viewer.min.js
│   ├── scripts/
│   │   ├── sync.mjs        # Sync viewer source from the local asset library
│   │   ├── build.mjs       # Build dist/ and verify no binaries are included
│   │   ├── dev.mjs         # Local server with /assets mapped to the library
│   │   └── upload-r2.sh    # Upload asset library to Cloudflare R2
│   ├── vercel.json
│   └── package.json
├── docs/                # English deployment and asset-pipeline notes
├── 3D_Asset_Library/    # Local-only 1.7 GB model library (git-ignored)
├── opencode.json
└── .gitignore
```

## Quick start

```bash
cd web
npm install
cp .env.example .env
npm run build       # outputs web/dist (about 4.15 MB)
npm run dev         # http://localhost:4173
```

`npm run dev` maps `/assets/*` to `../3D_Asset_Library/*`, so the gallery works
locally without uploading anything.

## Production deployment

1. Upload the model library to Cloudflare R2 (see `docs/DEPLOYMENT.md`).
2. Set `ASSETS_BASE` in `.env` or in the Vercel project to the bucket's public URL.
3. Run `npm run build` and deploy `web/dist` with Vercel.

See `docs/ASSET_PIPELINE.md` for source/license details.

## Notes

- Frontend language is Arabic (RTL); code, docs and commit messages are English.
- All models are CC0/public-domain. Some are AI-generated; metadata records it.
- `manifest.json` is regenerated from the local library by
  `3D_Asset_Library/_tools/build_catalog.py`.
- The original Arabic guide is in `3D_Asset_Library/00_START_HERE/README_AR.md`.
