const KEY_PAGES = ["", "budget", "projects", "wards", "services", "allowances", "rights", "rights/rti", "documents", "tenders"];

export function pickPrecache(files: string[]): string[] {
  const set = new Set(files);
  const shell = files.filter((f) => /^assets\/.+\.(js|css|woff2)$/.test(f) || f === "icon.svg" || f === "manifest.webmanifest");
  const pages = KEY_PAGES.flatMap((p) => {
    const html = p === "" ? "index.html" : `${p}/index.html`;
    const dataFile = p === "" ? "_root.data" : `${p}.data`;
    return [...(set.has(html) ? [p === "" ? "" : `${p}/`] : []), ...(set.has(dataFile) ? [dataFile] : [])];
  });
  return [...shell, ...pages];
}

export function renderServiceWorker(o: { version: string; base: string; precache: string[] }): string {
  const urls = o.precache.map((p) => `${o.base}${p}`);
  return `const CACHE = ${JSON.stringify(`katuli-${o.version}`)};
const PRECACHE = ${JSON.stringify(urls)};
const HOME = ${JSON.stringify(o.base)};
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const url = req.url;
    return (await cache.match(req)) || (await cache.match(url.endsWith("/") ? url : url + "/")) || (await cache.match(HOME)) || Response.error();
  }
}
async function cacheFirst(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) (await caches.open(CACHE)).put(req, res.clone());
  return res;
}
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === "navigate" || req.url.endsWith(".data")) { e.respondWith(networkFirst(req)); return; }
  if (/\\/assets\\//.test(req.url) || /\\.(svg|png|jpg|jpeg|webp)$/.test(req.url)) e.respondWith(cacheFirst(req));
});
`;
}
