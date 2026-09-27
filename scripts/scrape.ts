import fs from "node:fs";
import path from "node:path";
import { ingestLgedPdf } from "./lib/lged-ingest";
import { appendRows, csvColumns, draftDocumentRow, draftTenderRow, extractLinks, isFileUrl, knownUrls, type Source } from "./lib/scrape-core";

const UA = "KatuliBudgetBot/1.0 (independent citizen transparency project)";
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const today = new Date().toISOString().slice(0, 10);
const year = today.slice(0, 4);
const docsPath = path.resolve("data/documents.csv");
const tendersPath = path.resolve("data/tenders.csv");
const sources: Source[] = JSON.parse(fs.readFileSync(path.resolve("scripts/sources.json"), "utf8"));
const seenPath = path.resolve(".scrape-cache/seen.json");
const seen = new Set<string>(fs.existsSync(seenPath) ? JSON.parse(fs.readFileSync(seenPath, "utf8")) : []);

async function get(url: string): Promise<Response> {
  return fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30_000), redirect: "follow" });
}

async function main() {
  let docsCsv = fs.readFileSync(docsPath, "utf8");
  let tendersCsv = fs.readFileSync(tendersPath, "utf8");
  const autoDocs = path.resolve("data/documents_auto.csv");
  const known = new Set([...knownUrls(docsCsv), ...knownUrls(tendersCsv), ...(fs.existsSync(autoDocs) ? knownUrls(fs.readFileSync(autoDocs, "utf8")) : [])]);
  let autoPublished = 0;
  const summary: string[] = [];
  const failures: string[] = [];

  for (const source of sources) {
    try {
      const res = await get(source.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const links = extractLinks(await res.text(), source.url, source.linkPattern).filter((l) => !known.has(l.url));
      for (const link of links) {
        known.add(link.url);
        if (source.lged) {
          if (seen.has(link.url)) continue;
          try {
            const file = await get(link.url);
            const buf = new Uint8Array(await file.arrayBuffer());
            if (!file.ok || buf.length > MAX_FILE_BYTES) continue;
            const n = await ingestLgedPdf(buf, link.url, source.lged);
            seen.add(link.url);
            if (n > 0) { autoPublished += n; summary.push(`- ✅ auto-published ${n} ${source.lged.union} package(s) from [${link.url}](${link.url})`); }
            if (n !== -1) continue;
          } catch (e) {
            summary.push(`  - ⚠ could not read ${link.url}: ${(e as Error).message}`);
            continue;
          }
        }
        const doc = draftDocumentRow(link, source, today);
        if (isFileUrl(link.url)) {
          try {
            const file = await get(link.url);
            const buf = Buffer.from(await file.arrayBuffer());
            if (file.ok && buf.length <= MAX_FILE_BYTES) {
              const ext = (new URL(link.url).pathname.match(/\.[a-z0-9]+$/i)?.[0] ?? ".bin").toLowerCase();
              const rel = `archive/${year}/${doc.id}${ext}`;
              fs.mkdirSync(path.resolve("public", path.dirname(rel)), { recursive: true });
              fs.writeFileSync(path.resolve("public", rel), buf);
              doc.archive_path = rel;
            }
          } catch (e) {
            summary.push(`  - ⚠ could not download ${link.url}: ${(e as Error).message}`);
          }
        }
        docsCsv = appendRows(docsCsv, [doc], csvColumns(docsCsv));
        if (source.tender) tendersCsv = appendRows(tendersCsv, [draftTenderRow(link, source, today)], csvColumns(tendersCsv));
        summary.push(`- **${doc.title_bn}** — [link](${link.url})${doc.archive_path ? ` · saved to \`public/${doc.archive_path}\`` : ""} (from \`${source.id}\`)`);
      }
    } catch (e) {
      failures.push(`- ${source.id}: ${(e as Error).message}`);
    }
  }

  fs.mkdirSync(path.dirname(seenPath), { recursive: true });
  fs.writeFileSync(seenPath, JSON.stringify([...seen]));
  if (autoPublished > 0) fs.writeFileSync(path.resolve(".scrape-cache/auto-published"), String(autoPublished));
  fs.writeFileSync(docsPath, docsCsv);
  fs.writeFileSync(tendersPath, tendersCsv);
  const newCount = summary.filter((s) => s.startsWith("- **")).length;
  const body = [
    `## নতুন নথি: ${newCount} টি (${today})`,
    "",
    "Every row below was added with `status=draft`, so it will not appear on the site yet. For each one: open the link, fill in the title, fiscal year and figures in the right CSV, set `status=published`, then merge.",
    "",
    ...summary,
    ...(failures.length ? ["", "### Sources that failed this run", ...failures] : []),
  ].join("\n");
  fs.writeFileSync(path.resolve("scrape-summary.md"), body);
  console.log(body);
  if (failures.length === sources.length && sources.length > 0) process.exit(1);
}

main();
