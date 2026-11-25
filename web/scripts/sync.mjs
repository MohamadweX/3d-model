import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const libViewer = path.resolve(root, "..", "3D_Asset_Library", "viewer");
const pub = path.join(root, "public");

if (!fs.existsSync(libViewer)) {
  throw new Error(`Library viewer not found: ${libViewer}`);
}

fs.mkdirSync(path.join(pub, "vendor"), { recursive: true });

const oldFns = `  function resolvePreview(preview) {
    if (!preview) return null;
    if (/^https?:\\/\\//i.test(preview)) return preview;
    if (preview.startsWith("../")) return preview;
    return "../" + preview.replace(/^\\.\\//, "");
  }

  function resolveModel(path) {
    return new URL("../" + path, window.location.href).href;
  }`;

const newFns = `  const ASSETS_BASE = String(window.ASSETS_BASE || "/assets").replace(/\\/+$/, "");

  function assetURL(rel) {
    if (!rel) return null;
    if (/^https?:\\/\\//i.test(rel)) return rel;
    const clean = String(rel).replace(/^\\.\\.\\//, "").replace(/^\\.\\//, "");
    if (!ASSETS_BASE || ASSETS_BASE === "/") {
      return new URL(clean, window.location.href).href;
    }
    const base = new URL(ASSETS_BASE, window.location.origin);
    if (!base.pathname.endsWith("/")) base.pathname += "/";
    return new URL(clean, base).href;
  }

  function resolvePreview(preview) {
    return assetURL(preview);
  }

  function resolveModel(path) {
    return assetURL(path);
  }`;

let js = fs.readFileSync(path.join(libViewer, "viewer.js"), "utf8");
if (!js.includes(oldFns)) {
  throw new Error("Could not find resolvePreview/resolveModel block in viewer.js");
}
js = js.replace(oldFns, newFns);
js = js.replace(
  'fetch("manifest.json", { cache: "no-cache" })',
  'fetch(window.MANIFEST_URL || "manifest.json", { cache: "no-cache" })'
);

let html = fs.readFileSync(path.join(libViewer, "index.html"), "utf8");
html = html.replace(
  '  <script src="viewer.js"></script>',
  '  <script src="config.js"></script>\n  <script src="viewer.js"></script>'
);

fs.writeFileSync(path.join(pub, "viewer.js"), js);
fs.writeFileSync(path.join(pub, "viewer.css"), fs.readFileSync(path.join(libViewer, "viewer.css")));
fs.writeFileSync(path.join(pub, "index.html"), html);
fs.copyFileSync(
  path.join(libViewer, "vendor", "model-viewer.min.js"),
  path.join(pub, "vendor", "model-viewer.min.js")
);
fs.copyFileSync(path.join(libViewer, "manifest.json"), path.join(pub, "manifest.json"));

console.log(`Synced viewer sources into ${pub}`);
