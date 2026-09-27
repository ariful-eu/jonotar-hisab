import { createHash } from "node:crypto";
import * as cheerio from "cheerio";
import Papa from "papaparse";
import type { Issuer } from "../../app/data/schemas";

export type Source = { id: string; issuer: Issuer; url: string; linkPattern: string; tender?: boolean };
export type Link = { url: string; text: string };

const GENERIC = /^(দেখুন|বিস্তারিত|ডাউনলোড|download|view|details?)?$/i;
const clean = (s: string) => s.replace(/\s+/g, " ").trim();

export function extractLinks(html: string, pageUrl: string, pattern: string): Link[] {
  const $ = cheerio.load(html);
  const re = new RegExp(pattern, "i");
  const seen = new Set<string>();
  const out: Link[] = [];
  $("a[href]").each((_, el) => {
    const href = ($(el).attr("href") ?? "").trim();
    if (!href || href.startsWith("#") || href.toLowerCase().startsWith("javascript:")) return;
    let abs: string;
    try {
      abs = new URL(href, pageUrl).toString();
    } catch {
      return;
    }
    if (!re.test(abs) || seen.has(abs)) return;
    seen.add(abs);
    const own = clean($(el).text());
    const row = $(el).closest("tr, li");
    const cells = row.children("td, th").toArray().map((c) => clean($(c).text())).filter((c) => c && !GENERIC.test(c));
    const text = GENERIC.test(own) ? (cells.length ? cells.join(" ") : clean(row.text().replace(own, ""))) || own : own;
    out.push({ url: abs, text: text.slice(0, 200) });
  });
  return out;
}

export function isFileUrl(url: string): boolean {
  return /\.(pdf|docx?|xlsx?|jpe?g|png)(\?|$)/i.test(url);
}

export function shortHash(s: string): string {
  return createHash("sha256").update(s).digest("hex").slice(0, 8);
}

function fallbackTitle(link: Link): string {
  return link.text || decodeURIComponent(new URL(link.url).pathname.split("/").filter(Boolean).pop() ?? link.url);
}

export function draftDocumentRow(link: Link, source: Source, today: string): Record<string, string> {
  return {
    id: `${source.id}-${shortHash(link.url)}`,
    title_bn: fallbackTitle(link),
    title_en: "",
    issuer: source.issuer,
    date: today,
    fiscal_year: "",
    url: link.url,
    archive_path: "",
    reliability: "official",
    status: "draft",
    note_bn: `স্বয়ংক্রিয়ভাবে পাওয়া: ${source.url}`,
  };
}

export function draftTenderRow(link: Link, source: Source, today: string): Record<string, string> {
  return {
    id: `${source.id}-${shortHash(link.url)}`,
    title_bn: fallbackTitle(link),
    title_en: "",
    issuer: source.issuer,
    ref_no: "",
    published: today,
    deadline: "",
    est_value: "",
    url: link.url,
    archive_path: "",
    awarded_to: "",
    award_value: "",
    project_id: "",
    status: "draft",
  };
}

export function appendRows(csv: string, rows: Record<string, string>[], columns: string[]): string {
  if (rows.length === 0) return csv;
  const body = Papa.unparse({ fields: columns, data: rows.map((r) => columns.map((c) => r[c] ?? "")) }, { header: false, newline: "\n" });
  const baseText = csv === "" || csv.endsWith("\n") ? csv : `${csv}\n`;
  return `${baseText}${body}\n`;
}

export function knownUrls(csv: string): Set<string> {
  const res = Papa.parse<Record<string, string>>(csv.replace(/^﻿/, ""), { header: true, skipEmptyLines: "greedy" });
  return new Set(res.data.map((r) => (r.url ?? "").trim()).filter(Boolean));
}

export function csvColumns(csv: string): string[] {
  return csv.replace(/^﻿/, "").split("\n")[0].split(",").map((c) => c.trim());
}
