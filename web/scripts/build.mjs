import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pub = path.join(root, "public");
const dist = path.join(root, "dist");

function loadDotEnv() {
  const file = path.join(root, ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadDotEnv();
const base = (process.env.ASSETS_BASE || "/assets").trim();

if (!fs.existsSync(path.join(pub, "index.html"))) {
  throw new Error("public/index.html missing — run `npm run sync` first");
}

fs.rmSync(dist, { recursive: true, force: true });
fs.cpSync(pub, dist, { recursive: true });
const manifestUrl = (process.env.MANIFEST_URL || "manifest.json").trim();
fs.writeFileSync(
  path.join(dist, "config.js"),
  "window.ASSETS_BASE = " + JSON.stringify(base) + ";\n" +
  "window.MANIFEST_URL = " + JSON.stringify(manifestUrl) + ";\n"
);

const forbidden = new Set([".glb", ".gltf", ".bin", ".hdr", ".exr", ".png", ".jpg", ".jpeg", ".webp"]);
const found = [];
let bytes = 0;
let files = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    files += 1;
    bytes += fs.statSync(full).size;
    if (forbidden.has(path.extname(entry.name).toLowerCase())) {
      found.push(path.relative(dist, full));
    }
  }
}

walk(dist);

if (found.length) {
  throw new Error("Large/binary asset files found in build output:\n" + found.join("\n"));
}
if (bytes > 25 * 1024 * 1024) {
  throw new Error(`Build too large for free static hosting: ${(bytes / 1048576).toFixed(1)} MB`);
}

console.log(`Build OK: ${files} files, ${(bytes / 1048576).toFixed(2)} MB`);
console.log(`ASSETS_BASE = ${base || "(same origin /assets)"}`);
console.log(`Output: ${dist}`);
