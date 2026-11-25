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
│   ├── setup.sh            # One-command local setup (fetch all assets + serve)
│   ├── scripts/
│   │   ├── sync.mjs        # Sync viewer source from the local asset library
│   │   ├── fetch-assets.mjs # Download all assets from the CDN into the library
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

## One-command local setup (everything on your machine)

```bash
cd web
cp .env.example .env      # set ASSETS_BASE to the public CDN URL
./setup.sh
```

`setup.sh` downloads **all 4,810 models, glTF textures/buffers and previews**
into `3D_Asset_Library/`, generates `manifest.local.json`, rebuilds the gallery
with `ASSETS_BASE=/assets`, and starts it at `http://localhost:4173`.

After the first run the gallery works fully offline on that machine.

## Manual build

```bash
cd web
npm install
npm run build       # outputs web/dist (about 4.15 MB)
npm run dev         # http://localhost:4173
```

`npm run dev` maps `/assets/*` to `../3D_Asset_Library/*`.

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
