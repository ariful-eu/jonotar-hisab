import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const LIMIT = 200 * 1024;
const out = path.resolve("build/client");
const html = fs.readFileSync(path.join(out, "index.html"), "utf8");
const assets = [...new Set([...html.matchAll(/assets\/[^"')\s]+\.(?:js|css)/g)].map((m) => m[0]))];
let total = 0;
const rows: string[] = [];
for (const a of assets) {
  const size = zlib.gzipSync(fs.readFileSync(path.join(out, a))).length;
  total += size;
  rows.push(`${(size / 1024).toFixed(1).padStart(7)} KB  ${a}`);
}
const font = fs.readdirSync(path.join(out, "assets")).find((f) => /bengali-400.*\.woff2$/.test(f));
if (font) {
  const size = fs.statSync(path.join(out, "assets", font)).size;
  total += size;
  rows.push(`${(size / 1024).toFixed(1).padStart(7)} KB  assets/${font} (font)`);
}
console.log(rows.join("\n"));
console.log(`total first load: ${(total / 1024).toFixed(1)} KB (limit ${LIMIT / 1024} KB)`);
if (total > LIMIT) {
  console.error("First-load budget exceeded");
  process.exit(1);
}
