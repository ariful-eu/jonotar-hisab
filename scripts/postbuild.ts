import fs from "node:fs";
import path from "node:path";
import { pickPrecache, renderServiceWorker } from "./lib/sw-template";

const out = path.resolve("build/client");
const base = process.env.BASE_PATH ?? "/";

// With a basename, React Router nests prerendered pages under it; Pages already serves build/client at that path.
const nested = path.join(out, base.replace(/^\/|\/$/g, ""));
if (base !== "/" && fs.existsSync(nested)) {
  for (const entry of fs.readdirSync(nested)) fs.renameSync(path.join(nested, entry), path.join(out, entry));
  fs.rmdirSync(nested);
}

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

const files = walk(out).map((f) => path.relative(out, f).split(path.sep).join("/"));
const version = new Date().toISOString().replace(/\D/g, "").slice(0, 12);
fs.writeFileSync(path.join(out, "sw.js"), renderServiceWorker({ version, base, precache: pickPrecache(files) }));

const fallback = ["__spa-fallback.html", "index.html"].find((f) => fs.existsSync(path.join(out, f)))!;
fs.copyFileSync(path.join(out, fallback), path.join(out, "404.html"));
fs.writeFileSync(path.join(out, ".nojekyll"), "");
console.log(`postbuild: sw.js (${pickPrecache(files).length} precached), 404.html from ${fallback}`);
