# Asset pipeline

## Sources

| Source | License | Assets | Format |
| --- | --- | ---: | --- |
| Poly Haven | CC0 1.0 | 154 | glTF 2.0 + 1K textures |
| 3DAssets.dev | CC0 1.0 (AI-generated) | 4,573 | GLB |
| VibeAssets | CC0 1.0 (AI-generated, Meshy) | 57 | GLB |
| Cinevva | CC0 1.0 (stylized rigged) | 26 | GLB |

## Storage model

- The local library lives at `3D_Asset_Library/` and is **git-ignored**.
- `web/public/manifest.json` is the only generated data file committed to the
  repo. It contains relative paths, titles, sources, licenses and sizes.
- `window.ASSETS_BASE` (written to `dist/config.js`) is prepended to every
  relative model/preview path at runtime.
- Remote thumbnail URLs (for example 3DAssets CDN) are used as-is.

## Regenerating metadata

After changing the local library:

```bash
cd 3D_Asset_Library
python3 _tools/build_catalog.py
cd ../web
npm run sync
npm run build
```

`build_catalog.py` scans `assets_index.json`, the Poly Haven index and download
records, then writes both `viewer/manifest.json` and `00_START_HERE/CATALOG.csv`.

## Limitations

Free CC0 sources do not include a large photorealistic human library covering
every age and role. Photoreal humans come mainly from VibeAssets/Meshy; some
additional character packs are stylized and labeled as such in the manifest.
