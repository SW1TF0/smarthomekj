// Before every build (npm "prebuild"; also before dev/typecheck): the active products' photos from the live catalogue
// -> WebP copies in public/img/products/ and the map src/data/product-images.json { "<original url>": "/img/products/<file>.webp" }.
// The shop shows the copy (src/lib/images.ts) and falls back to the original URL if the copy fails to load.
// Never fails the build: without network or Firestore the map is simply empty and the originals are used.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "img", "products");
const MAP = join(ROOT, "src", "data", "product-images.json");
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "smarthomekj-ea651";
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAxy6lpPyxw0nMs5fXk83BCdaMof-vDVfw";
const MAX_BYTES = 15 * 1024 * 1024;

async function imageUrls() {
  if (process.env.SKIP_LIVE_CATALOGUE === "1") return [];
  const res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`, {
    method: "POST",
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "products" }], where: { fieldFilter: { field: { fieldPath: "active" }, op: "EQUAL", value: { booleanValue: true } } } } }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Firestore HTTP ${res.status}`);
  const rows = await res.json();
  return [...new Set(rows.map((r) => r.document?.fields?.imageUrl?.stringValue).filter((u) => typeof u === "string" && /^https?:\/\//.test(u)))];
}

async function toWebp(url) {
  const name = createHash("sha256").update(url).digest("hex").slice(0, 16) + ".webp";
  const file = join(OUT_DIR, name);
  if (!existsSync(file)) {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_BYTES) throw new Error(`too big (${buf.length} bytes)`);
    await sharp(buf).rotate().resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toFile(file);
  }
  return name;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(dirname(MAP), { recursive: true });
  const map = {};
  try {
    const urls = await imageUrls();
    for (const url of urls) {
      try {
        map[url] = `/img/products/${await toWebp(url)}`;
      } catch (e) {
        console.warn(`product-images: ${url}: ${e.message} (the original is used)`);
      }
    }
    // Copies of photos no longer in the catalogue are removed.
    const keep = new Set(Object.values(map).map((p) => p.split("/").pop()));
    for (const f of readdirSync(OUT_DIR)) if (f.endsWith(".webp") && !keep.has(f)) rmSync(join(OUT_DIR, f));
  } catch (e) {
    console.warn(`product-images: catalogue not reachable (${e.message}); the original photos are used`);
  }
  writeFileSync(MAP, JSON.stringify(map, null, 1) + "\n");
  console.log(`product-images: ${Object.keys(map).length} WebP copies`);
}

main();
