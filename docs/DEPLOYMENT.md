# Deployment

## 1. Upload models to Cloudflare R2

Create an R2 bucket, enable a public custom domain (or use the `r2.dev` URL),
then export credentials locally:

```bash
export R2_ACCOUNT_ID=...
export R2_BUCKET=3d-asset-library
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
```

Install the AWS CLI and run:

```bash
cd web
npm run upload:r2
```

The script uploads `3D_Asset_Library/` recursively while excluding `_tools`,
`viewer`, docs and logs. Directory structure is preserved, so a manifest path
like `01_Characters/.../model.glb` resolves directly under the bucket root.

## 2. Configure the public base URL

In `web/.env`:

```
ASSETS_BASE=https://assets.example.com
```

Local development can keep `/assets` because `scripts/dev.mjs` maps it to the
local library.

## 3. Build and deploy

```bash
cd web
npm run build
vercel login          # or set VERCEL_TOKEN in the environment
vercel --prod
```

In the Vercel dashboard set **Root Directory** to `web` if deploying from the
repository root. Build command: `npm run build`; output directory: `dist`.

`vercel.json` already sets immutable caching for JS/CSS and no-cache for
`manifest.json`.

## Automatic deployment

In the Vercel dashboard, import `MohamadweX/3d-model` and connect it to the
`master` branch. Set **Root Directory** to `web`, build command `npm run build`,
output directory `dist`, and environment variable `ASSETS_BASE` (public CDN URL).
Every push to `master` then deploys automatically without a GitHub Token needing
the `workflow` scope.

## End-user local copy

Anyone who wants every model on their own machine runs `./setup.sh` in `web/`
after setting `ASSETS_BASE`. See `docs/LOCAL_SETUP.md`.

## 4. Performance notes

- The gallery renders at most 60 cards at a time and loads models on demand.
- Model requests go straight from the browser to the CDN; Vercel serves only
  ~4 MB of static UI files.
- Use a Cloudflare custom domain (not `r2.dev`) for the best latency.
