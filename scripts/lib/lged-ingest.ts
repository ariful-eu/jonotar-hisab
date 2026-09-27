import fs from "node:fs";
import path from "node:path";
import { extractText, getDocumentProxy } from "unpdf";
import { lgedRecords } from "./lged";
import { appendRows, csvColumns, knownUrls } from "./scrape-core";

export type LgedTarget = { union: string; upazila: string };

function appendAuto(name: string, rows: Record<string, string>[]) {
  if (rows.length === 0) return;
  const auto = path.resolve(`data/${name}_auto.csv`);
  const header = csvColumns(fs.readFileSync(path.resolve(`data/${name}.csv`), "utf8"));
  const current = fs.existsSync(auto) ? fs.readFileSync(auto, "utf8") : `${header.join(",")}\n`;
  fs.writeFileSync(auto, appendRows(current, rows, header));
}

export async function pdfText(buf: Uint8Array): Promise<string> {
  const { text } = await extractText(await getDocumentProxy(buf), { mergePages: true });
  return text;
}

/** Returns number of matching packages published, or -1 if the PDF names the target but no package row could be parsed. */
export async function ingestLgedPdf(buf: Uint8Array, url: string, target: LgedTarget): Promise<number> {
  const text = await pdfText(buf);
  const archivePath = `archive/lged/${path.basename(new URL(url).pathname).replace(/[^\w.-]/g, "")}`;
  const rec = lgedRecords(text, target, url, archivePath);
  if (!rec.document) {
    const mentions = new RegExp(target.union, "i").test(text) && new RegExp(target.upazila.replace(/\s+/g, "\\s*"), "i").test(text);
    return mentions ? -1 : 0;
  }
  const docsAuto = path.resolve("data/documents_auto.csv");
  if (fs.existsSync(docsAuto) && knownUrls(fs.readFileSync(docsAuto, "utf8")).has(url)) return 0;
  fs.mkdirSync(path.resolve("public/archive/lged"), { recursive: true });
  fs.writeFileSync(path.resolve("public", archivePath), buf);
  appendAuto("documents", [rec.document]);
  appendAuto("projects", rec.projects);
  appendAuto("tenders", rec.tenders);
  return rec.tenders.length;
}
