export type SearchEntry = { title_bn: string; title_en: string; keywords: string; url: string; kind: "page" | "service" | "contact" | "ward" | "work" | "tender" | "guide" };

const BN = "০১২৩৪৫৬৭৮৯";

export function normalize(s: string): string {
  return s
    .normalize("NFC")
    .replace(/য়/g, "য়")
    .replace(/[০-৯]/g, (d) => String(BN.indexOf(d)))
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchIndex(entries: SearchEntry[], query: string, limit = 8): SearchEntry[] {
  const q = normalize(query);
  if (!q) return [];
  const tokens = q.split(" ");
  const scored = entries.map((e) => {
    const title = normalize(`${e.title_bn} ${e.title_en}`);
    const words = normalize(`${e.title_bn} ${e.title_en} ${e.keywords}`).split(" ");
    let score = 0;
    for (const tk of tokens) {
      if (title.includes(tk)) score += 3;
      if (words.some((w) => w.startsWith(tk))) score += 2;
      else if (words.some((w) => w.includes(tk))) score += 1;
      else return { e, score: 0 };
    }
    return { e, score };
  });
  return scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.e);
}
