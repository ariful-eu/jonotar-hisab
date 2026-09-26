# Katuli Budget Transparency Site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Bangla-first, mobile-first, independent citizen website that shows Katuli Union Parishad's budget, projects, tenders, fees, allowances, missing disclosures and residents' rights. Every page is pre-rendered to static HTML, data lives in editable CSV files, and a daily scraper opens PRs when new documents appear.

**Architecture:**
- React 19 + React Router v7 framework mode (`ssr: false`, `prerender` every route), built with Vite.
- Route `loader`s run only at build time. They read `data/*.csv` through a zod-validated loader (`app/data/load.server.ts`), so every page ships as static HTML plus a small `.data` file.
- No chart library: bars are CSS.
- A post-build script writes a service worker and a 404 fallback.
- A separate Node scraper (`scripts/scrape.ts`) appends draft rows. A GitHub Action turns them into a PR.

**Tech Stack:** react-router 7.18.x, @react-router/dev 7.18.x, vite 7, TypeScript 5.9, zod 4, papaparse 5, qrcode 1.5, cheerio 1, lucide-react, @fontsource/noto-sans-bengali, vitest 5 + jsdom + @testing-library/react, tsx.

**Spec:** `docs/superpowers/specs/2026-09-26-katuli-budget-transparency-design.md`

## Global Constraints

- Every page shows: "স্বাধীন নাগরিক উদ্যোগ — এটি সরকারি ওয়েবসাইট নয়" ("Independent citizens' initiative — not a government website"). No government seal, no national-portal styling.
- Never name individuals as wrongdoers. Never use "চুরি" or "দুর্নীতি" about specific people or projects. Discrepancies are shown as "published figure vs. observed on [date]".
- Never publish beneficiary names, NIDs, phone numbers or photos. Allowances show counts only.
- Bangla is the default language, with a one-tap English toggle. Numbers use Bangla digits with lakh/crore via `Intl.NumberFormat('bn-BD')`. Never write "M" or "million".
- Every total also shows a per-household figure. Unknown values show "অজানা" ("unknown"), never 0.
- First-load JS + CSS (gzipped) + Bengali font ≤ 200 KB for `/`.
- Base font size 18px. Tap targets ≥ 44px. Works at 320px width with no horizontal scroll.
- Every figure links to its source document (`source_doc` → `documents.csv`).
- Rows with `status=draft` (or `status_row=draft` in projects) never appear on the site.
- The current fiscal year is FY2026-27 (July–June). Allowance rates are the FY2026-27 rates.
- Imports are relative (no `~` alias). Localised UI copy is written inline as `t("বাংলা", "English")`.

## Review Focus

1. **CSV amounts typed as copied from Bangla documents** ("৳১২,৩৪৫", "১২,৩৪৫ টাকা", "12,345"): these must parse correctly. Garbage such as "abc" must fail the build with a message naming the file, row and column. Tests are in Task 3.
2. **A union with unknown households, or a fiscal year with no data:** the per-household figure shows "অজানা", not NaN or ∞. A missing year shows a "not published + request it" state, not an empty chart. Tests are in Tasks 4 and 5.
3. **`localStorage` throws** (private mode, locked-down shared phones): the site still renders in Bangla, and the toggle still works for the session. Test is in Task 2.
4. **The portal is down, times out, or returns changed or empty HTML during scraping:** that source is logged and skipped, other sources continue, relative and duplicate links are normalised, and no PR is opened with junk. Tests are in Task 14.
5. **Long unbroken strings** (contractor names, URLs, long Bangla heads) on a 320px screen: no horizontal page scroll. Covered by `overflow-wrap:anywhere` in Task 1 and checked manually at 320px in Task 17.

---

## File Structure

```
package.json, tsconfig.json, vite.config.ts, vitest.config.ts, react-router.config.ts, .gitignore
.claude/launch.json                    dev-server config for the browser pane
app/
  root.tsx                             html shell, providers, layout, SW registration, error boundary
  routes.ts                            route table
  app.css                              tokens, base, components, print
  env.d.ts                             __BUILD_DATE__ + VITE_SITE_URL typing
  lib/format.ts                        Bangla digits, amount parsing, taka/lakh/crore, dates, per-household
  lib/i18n.tsx                         LangProvider, useLang, useT, useFmt, pick
  lib/aggregate.ts                     yearsFor, summarizeYear, compareUnions, fiscalYearOf, fyStart
  lib/labels.ts                        bn/en labels for enums (kind, scheme, status, source type, issuer)
  lib/meta.ts                          pageMeta()
  lib/site.ts                          absoluteUrl()
  lib/rti.ts                           buildRtiLetter()
  data/schemas.ts                      zod schemas + types + Dataset
  data/load.server.ts                  parseCsv, checkRefs, loadDataset (build-time only)
  data/refs.ts                         DocRef + docRefs()
  data/categories.ts                   category labels + icons + categoryItems()
  data/paths.ts                        allPaths(ds) for prerender
  content/rights.ts                    rights topics content (bn/en)
  components/{Header,BottomNav,Footer,Bars,Amount,Unknown,SourceBadge,DisclosureStrip,
              ShareButtons,DeadlineBadge,SectionTiles,StatusIcon,RtiForm,OfflineNotice}.tsx
  routes/{home,budget,wards,ward,projects,project,tenders,tender,services,allowances,
          rights,rights-topic,documents,about,poster}.tsx
data/ union.json, documents.csv, disclosures.csv, budget_lines.csv, budget_reported_totals.csv,
      projects.csv, verifications.csv, tenders.csv, service_fees.csv, allowances.csv,
      allowance_counts.csv, README.md
public/ icon.svg, manifest.webmanifest, archive/ (scraped + source documents), photos/
scripts/ postbuild.ts, check-size.ts, scrape.ts, sources.json, lib/scrape-core.ts
.github/workflows/ deploy.yml, scrape.yml
tests/ *.test.ts(x)
docs/research/ katuli-data.md, rights-law.md, civic-tech.md
```

Deviations from the spec, each a small refinement:
- Reported totals live in their own `budget_reported_totals.csv`. The transcribed line items often don't add up to the document's stated total, and the site shows both.
- Allowance programme info (`allowances.csv`) is separate from per-ward counts (`allowance_counts.csv`), to avoid repeating eligibility text on every ward row.
- `disclosures.csv` carries `rti_request_bn`, the exact text to request, instead of a template key.
- `verifications.csv` has a `status` column so drafts are supported.

---

### Task 1: Project scaffold, config, base styles

**Files:**
- Create: `package.json` (via npm), `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `react-router.config.ts`, `.gitignore`, `app/env.d.ts`, `app/routes.ts`, `app/root.tsx`, `app/routes/home.tsx` (placeholder), `app/app.css`, `.claude/launch.json`
- Test: `tests/smoke.test.ts`

**Interfaces:**
- Produces:
  - `npm run dev|build|test|typecheck`
  - global `__BUILD_DATE__: string`
  - CSS tokens `--bg --surface --surface-2 --ink --ink-2 --line --primary --primary-ink --primary-soft --accent --accent-soft --income --expense --warn-bg --warn-ink --bad --good --observed-bg --observed-ink --radius --max`

- [ ] **Step 1: Initialise npm and install dependencies**

```bash
npm init -y
npm pkg set type=module private=true name=katuli-budget
npm pkg delete main
npm i react@^19.2 react-dom@^19.2 react-router@^7.18.4 @react-router/node@^7.18.4 isbot@^5 lucide-react @fontsource/noto-sans-bengali@^5 zod@^4 papaparse@^5 qrcode@^1.5
npm i -D @react-router/dev@^7.18.4 vite@^7 typescript@^5.9 @types/react@^19 @types/react-dom@^19 @types/node@^24 @types/papaparse @types/qrcode vitest@^5 jsdom @testing-library/react @testing-library/dom tsx cheerio@^1
npm pkg set scripts.dev="react-router dev" scripts.build="react-router build && tsx scripts/postbuild.ts" scripts.typecheck="react-router typegen && tsc" scripts.test="vitest run" scripts.scrape="tsx scripts/scrape.ts" scripts.check:size="tsx scripts/check-size.ts"
```

(`scripts/postbuild.ts` arrives in Task 13. Until then, create a stub containing `console.log("postbuild: nothing yet");` so `build` works.)

- [ ] **Step 2: Write config files**

`tsconfig.json`:
```json
{
  "include": ["app/**/*", "scripts/**/*", "tests/**/*", "*.ts", ".react-router/types/**/*"],
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ES2023"],
    "types": ["node", "vite/client"],
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "rootDirs": [".", "./.react-router/types"],
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true
  }
}
```

`vite.config.ts`:
```ts
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  define: { __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)) },
  plugins: [reactRouter()],
});
```

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  define: { __BUILD_DATE__: JSON.stringify("2026-09-26") },
  test: { environment: "jsdom", include: ["tests/**/*.test.{ts,tsx}"] },
});
```

`react-router.config.ts` (the full prerender list comes in Task 6):
```ts
import type { Config } from "@react-router/dev/config";

export default {
  ssr: false,
  basename: process.env.BASE_PATH ?? "/",
  async prerender({ getStaticPaths }) {
    return getStaticPaths();
  },
} satisfies Config;
```

`.gitignore`:
```
node_modules/
build/
.react-router/
scrape-summary.md
.DS_Store
```

`app/env.d.ts`:
```ts
declare const __BUILD_DATE__: string;
interface ImportMetaEnv { readonly VITE_SITE_URL?: string }
```

`.claude/launch.json`:
```json
{ "version": "0.0.1", "configurations": [ { "name": "dev", "runtimeExecutable": "npm", "runtimeArgs": ["run", "dev"], "port": 5173 } ] }
```

- [ ] **Step 3: Write `app/app.css` (tokens + base)**

```css
@font-face {
  font-family: "Noto Sans Bengali";
  src: local("Noto Sans Bengali"), local("NotoSansBengali-Regular"),
    url("../node_modules/@fontsource/noto-sans-bengali/files/noto-sans-bengali-bengali-400-normal.woff2") format("woff2");
  font-display: swap;
  font-weight: 400 700;
  unicode-range: U+0951-0952, U+0964-0965, U+0980-09FE, U+1CD0, U+1CD2, U+1CD5-1CD6, U+1CD8, U+1CE1, U+1CEA, U+1CED, U+1CF2, U+1CF5-1CF7, U+200C-200D, U+20B9, U+25CC, U+A8F1;
}
:root {
  --bg: #fbf8f3; --surface: #ffffff; --surface-2: #f2ede4; --ink: #1d2422; --ink-2: #4d5855; --line: #e2dbcf;
  --primary: #0f6b66; --primary-ink: #ffffff; --primary-soft: #d9ecea;
  --accent: #a85f16; --accent-soft: #f6e6d0;
  --income: #0f6b66; --expense: #c0632a;
  --warn-bg: #fff3d1; --warn-ink: #614300; --bad: #b3261e; --good: #1f7a3a;
  --observed-bg: #e9e3f7; --observed-ink: #4b3a8c;
  --radius: 14px; --max: 760px;
  --font: "Noto Sans Bengali", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #101615; --surface: #18201f; --surface-2: #212b29; --ink: #e7eeec; --ink-2: #a9b6b3; --line: #2e3a38;
    --primary: #5cc4bb; --primary-ink: #0b1413; --primary-soft: #173331;
    --accent: #e3a868; --accent-soft: #3a2a18;
    --income: #5cc4bb; --expense: #e8905a;
    --warn-bg: #3a2f10; --warn-ink: #f5d98a; --bad: #ff8a80; --good: #7bd88f;
    --observed-bg: #2c2545; --observed-ink: #c9bdf5;
    color-scheme: dark;
  }
}
*, *::before, *::after { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--bg); color: var(--ink); font-family: var(--font); font-size: 18px; line-height: 1.6; overflow-wrap: anywhere; padding-bottom: 84px; }
.container { max-width: var(--max); margin: 0 auto; padding: 0 16px; }
h1 { font-size: 1.55rem; line-height: 1.3; margin: 1.2rem 0 .6rem; }
h2, .h2 { font-size: 1.3rem; line-height: 1.35; margin: 1.6rem 0 .6rem; }
h3, .h3 { font-size: 1.1rem; line-height: 1.4; margin: 1rem 0 .4rem; }
p { margin: .5rem 0; }
a { color: var(--primary); text-underline-offset: 3px; }
img { max-width: 100%; height: auto; }
:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
table { border-collapse: collapse; width: 100%; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
```

- [ ] **Step 4: Minimal root, routes and placeholder home**

`app/routes.ts`:
```ts
import { type RouteConfig, index } from "@react-router/dev/routes";

export default [index("routes/home.tsx")] satisfies RouteConfig;
```

`app/root.tsx`:
```tsx
import type { ReactNode } from "react";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import "./app.css";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
```

`app/routes/home.tsx`:
```tsx
export default function Home() {
  return <h1>কাতুলীর বাজেট</h1>;
}
```

- [ ] **Step 5: Smoke test**

`tests/smoke.test.ts`:
```ts
import { describe, expect, it } from "vitest";

describe("test harness", () => {
  it("has the build date define", () => {
    expect(__BUILD_DATE__).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
```

Run: `npm test` → PASS.
Run: `npm run build && grep -c "কাতুলীর বাজেট" build/client/index.html` → prints `1` or more.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: scaffold React Router prerendered site"
```

---

### Task 2: Formatting and i18n libraries

**Files:**
- Create: `app/lib/format.ts`, `app/lib/i18n.tsx`
- Test: `tests/format.test.ts`, `tests/i18n.test.tsx`

**Interfaces:**
- Produces:
  - `type Lang = "bn" | "en"`
  - `toBnDigits(n: string|number): string`
  - `toEnDigits(s: string): string`
  - `parseAmount(raw: string): number | null` (NaN for garbage)
  - `formatNumber(n, lang)`, `formatTaka(n, lang)` (compact lakh/crore), `formatTakaFull(n, lang)`, `formatDate(iso, lang)`, `formatFy(fy, lang)`, `digits(n, lang)`
  - `perHousehold(total: number, households: number|null|undefined): number | null`
  - `LangProvider`, `useLang(): {lang, setLang}`, `useT(): (bn, en) => string`, `useFmt(): {lang, taka, takaFull, num, digits, date, fy}`, `pick(row, base, lang): string`

- [ ] **Step 1: Write failing tests**

`tests/format.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { formatDate, formatFy, formatNumber, formatTaka, formatTakaFull, parseAmount, perHousehold, toBnDigits, toEnDigits } from "../app/lib/format";

describe("digits", () => {
  it("converts both ways", () => {
    expect(toBnDigits("2014-15")).toBe("২০১৪-১৫");
    expect(toEnDigits("১২,৩৪৫")).toBe("12,345");
  });
});

describe("parseAmount", () => {
  it("accepts Bangla digits, commas, taka sign and word", () => {
    expect(parseAmount("৳১২,৩৪৫")).toBe(12345);
    expect(parseAmount("১২,৩৪৫ টাকা")).toBe(12345);
    expect(parseAmount(" 1,59,200 ")).toBe(159200);
    expect(parseAmount("Tk. 500")).toBe(500);
    expect(parseAmount("24.25")).toBe(24.25);
  });
  it("returns null for blanks and dashes", () => {
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("-")).toBeNull();
    expect(parseAmount("–")).toBeNull();
  });
  it("returns NaN for garbage", () => {
    expect(parseAmount("abc")).toBeNaN();
    expect(parseAmount("১২ লাখ")).toBeNaN();
  });
});

describe("formatTaka", () => {
  it("uses crore/lakh in Bangla", () => {
    expect(formatTaka(18442514, "bn")).toBe("৳১.৮ কোটি");
    expect(formatTaka(1572643, "bn")).toBe("৳১৫.৭ লাখ");
    expect(formatTaka(100000, "bn")).toBe("৳১ লাখ");
    expect(formatTaka(30000, "bn")).toBe("৳৩০,০০০");
  });
  it("uses Tk + lakh in English", () => {
    expect(formatTaka(1572643, "en")).toBe("Tk 15.7 lakh");
    expect(formatTaka(30000, "en")).toBe("Tk 30,000");
  });
  it("full format keeps every digit with lakh grouping", () => {
    expect(formatTakaFull(9458058, "bn")).toBe("৳৯৪,৫৮,০৫৮");
    expect(formatNumber(1234567, "en")).toBe("12,34,567");
  });
});

describe("dates and years", () => {
  it("formats ISO dates", () => {
    expect(formatDate("2026-09-26", "en")).toBe("26 September 2026");
    expect(formatDate("2026-09-26", "bn")).toContain("২০২৬");
  });
  it("formats fiscal years", () => {
    expect(formatFy("2026-27", "bn")).toBe("২০২৬-২৭");
  });
});

describe("perHousehold", () => {
  it("divides and rounds", () => {
    expect(perHousehold(9458058, 6433)).toBe(1470);
  });
  it("returns null when households unknown or zero", () => {
    expect(perHousehold(100, null)).toBeNull();
    expect(perHousehold(100, 0)).toBeNull();
    expect(perHousehold(100, undefined)).toBeNull();
  });
});
```

`tests/i18n.test.tsx`:
```tsx
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LangProvider, pick, useLang, useT } from "../app/lib/i18n";

function Probe() {
  const t = useT();
  const { lang, setLang } = useLang();
  return <button onClick={() => setLang(lang === "bn" ? "en" : "bn")}>{t("হ্যালো", "Hello")}</button>;
}

afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); });

describe("i18n", () => {
  it("defaults to Bangla and toggles", () => {
    render(<LangProvider><Probe /></LangProvider>);
    expect(screen.getByRole("button").textContent).toBe("হ্যালো");
    act(() => fireEvent.click(screen.getByRole("button")));
    expect(screen.getByRole("button").textContent).toBe("Hello");
    expect(localStorage.getItem("katuli-lang")).toBe("en");
  });

  it("restores a stored English preference", () => {
    localStorage.setItem("katuli-lang", "en");
    render(<LangProvider><Probe /></LangProvider>);
    expect(screen.getByRole("button").textContent).toBe("Hello");
  });

  it("still works when localStorage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("denied"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("denied"); });
    render(<LangProvider><Probe /></LangProvider>);
    expect(screen.getByRole("button").textContent).toBe("হ্যালো");
    act(() => fireEvent.click(screen.getByRole("button")));
    expect(screen.getByRole("button").textContent).toBe("Hello");
  });

  it("pick falls back to Bangla when English is missing", () => {
    expect(pick({ name_bn: "রাস্তা", name_en: null }, "name", "en")).toBe("রাস্তা");
    expect(pick({ name_bn: "রাস্তা", name_en: "Road" }, "name", "en")).toBe("Road");
  });
});
```

- [ ] **Step 2: Run tests.** Run `npm test`. Expected: FAIL (modules not found).

- [ ] **Step 3: Implement `app/lib/format.ts`**

```ts
export type Lang = "bn" | "en";

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

export function toBnDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)]);
}

export function toEnDigits(input: string): string {
  return input.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
}

export function parseAmount(raw: string): number | null {
  const cleaned = toEnDigits(raw).replace(/৳|টাকা|tk\.?|,|\s/gi, "");
  if (cleaned === "" || cleaned === "-" || cleaned === "–") return null;
  return /^-?\d+(\.\d+)?$/.test(cleaned) ? Number(cleaned) : Number.NaN;
}

const locale = (lang: Lang) => (lang === "bn" ? "bn-BD" : "en-IN");

export function formatNumber(n: number, lang: Lang): string {
  return new Intl.NumberFormat(locale(lang), { maximumFractionDigits: 1 }).format(n);
}

export function digits(n: number | string, lang: Lang): string {
  return lang === "bn" ? toBnDigits(n) : String(n);
}

const prefix = (lang: Lang) => (lang === "bn" ? "৳" : "Tk ");

export function formatTakaFull(n: number, lang: Lang): string {
  return `${prefix(lang)}${formatNumber(Math.round(n), lang)}`;
}

export function formatTaka(n: number, lang: Lang): string {
  const abs = Math.abs(n);
  const unit = abs >= 1e7 ? { div: 1e7, bn: "কোটি", en: "crore" } : abs >= 1e5 ? { div: 1e5, bn: "লাখ", en: "lakh" } : null;
  if (!unit) return formatTakaFull(n, lang);
  const value = Math.round((n / unit.div) * 10) / 10;
  return `${prefix(lang)}${formatNumber(value, lang)} ${unit[lang]}`;
}

export function formatDate(iso: string, lang: Lang): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat(lang === "bn" ? "bn-BD" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatFy(fy: string, lang: Lang): string {
  return digits(fy, lang);
}

export function perHousehold(total: number, households: number | null | undefined): number | null {
  return households && households > 0 ? Math.round(total / households) : null;
}
```

- [ ] **Step 4: Implement `app/lib/i18n.tsx`**

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { digits, formatDate, formatFy, formatNumber, formatTaka, formatTakaFull, type Lang } from "./format";

const KEY = "katuli-lang";
type LangCtx = { lang: Lang; setLang: (l: Lang) => void };
const LangContext = createContext<LangCtx>({ lang: "bn", setLang: () => {} });

function readStoredLang(): Lang {
  try {
    return localStorage.getItem(KEY) === "en" ? "en" : "bn";
  } catch {
    return "bn";
  }
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("bn");
  useEffect(() => setLangState(readStoredLang()), []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      // storage unavailable: keep the choice for this session only
    }
  };
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

export function useT() {
  const { lang } = useLang();
  return (bn: string, en: string) => (lang === "bn" ? bn : en);
}

export function useFmt() {
  const { lang } = useLang();
  return {
    lang,
    taka: (n: number) => formatTaka(n, lang),
    takaFull: (n: number) => formatTakaFull(n, lang),
    num: (n: number) => formatNumber(n, lang),
    digits: (n: number | string) => digits(n, lang),
    date: (iso: string) => formatDate(iso, lang),
    fy: (fy: string) => formatFy(fy, lang),
  };
}

export function pick(row: object, base: string, lang: Lang): string {
  const r = row as Record<string, unknown>;
  const preferred = r[`${base}_${lang}`];
  if (typeof preferred === "string" && preferred !== "") return preferred;
  return String(r[`${base}_bn`] ?? "");
}
```

- [ ] **Step 5: Run tests.** Run `npm test`. Expected: PASS. If `bn-BD` month names differ, adjust only the `bn` date assertion (it checks `toContain("২০২৬")`).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: Bangla number/date formatting and language provider"
```

---

### Task 3: Data schemas, CSV loader, reference checks, seed skeleton

**Files:**
- Create: `app/data/schemas.ts`, `app/data/load.server.ts`, `app/data/refs.ts`, and in `data/` every CSV with a header row, plus `union.json`
- Test: `tests/load.test.ts`, `tests/data.test.ts`

**Interfaces:**
- Consumes: `parseAmount`, `toEnDigits` (Task 2)
- Produces:
  - Schemas and types: `DocumentRow`, `DisclosureRow`, `BudgetLine`, `ReportedTotal`, `ProjectRow`, `VerificationRow`, `TenderRow`, `ServiceFeeRow`, `AllowanceRow`, `AllowanceCountRow`, `UnionProfile`, `Dataset`
  - Constants: `CATEGORY_KEYS`, `KINDS`, `SOURCE_TYPES`, `SCHEMES`, `PROJECT_STATUSES`, `OBSERVED`, `ISSUERS`
  - Types: `CategoryKey`, `Kind`, `SourceType`, `Issuer`
  - Functions: `parseCsv(file, text, schema, draftField?)`, `checkRefs(ds): string[]`, `loadDataset(dir?): Dataset`, `DataError`, `DocRef`, `docRefs(docs, ids)`

- [ ] **Step 1: Write failing tests**

`tests/load.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { checkRefs, DataError, parseCsv } from "../app/data/load.server";
import { BudgetLine, type Dataset } from "../app/data/schemas";

const header = "union,fiscal_year,kind,direction,category,head_bn,head_en,amount,source_type,source_doc,status";

describe("parseCsv", () => {
  it("parses valid rows including Bangla digits", () => {
    const rows = parseCsv("budget_lines.csv", `${header}\nkatuli,2014-15,proposed,income,own_tax,বসতবাড়ি কর,Holding tax,"৳১,৫৯,২০০",union,doc-a,published\n`, BudgetLine);
    expect(rows).toHaveLength(1);
    expect(rows[0].amount).toBe(159200);
  });

  it("skips draft rows entirely, even invalid ones", () => {
    const rows = parseCsv("budget_lines.csv", `${header}\nkatuli,2014-15,proposed,income,own_tax,x,,notanumber,union,doc-a,draft\n`, BudgetLine);
    expect(rows).toHaveLength(0);
  });

  it("reports file, row and column for bad values", () => {
    const bad = `${header}\nkatuli,2014-15,proposed,income,own_tax,a,,100,union,doc-a,published\nkatuli,2014-15,proposed,income,own_tax,b,,abc,union,doc-a,published\n`;
    expect(() => parseCsv("budget_lines.csv", bad, BudgetLine)).toThrowError(DataError);
    expect(() => parseCsv("budget_lines.csv", bad, BudgetLine)).toThrowError(/budget_lines\.csv row 3, column amount: .*\(got "abc"\)/);
  });

  it("rejects unknown categories", () => {
    expect(() => parseCsv("budget_lines.csv", `${header}\nkatuli,2014-15,proposed,income,bribes,a,,1,union,doc-a,published\n`, BudgetLine)).toThrowError(/column category/);
  });

  it("strips a UTF-8 BOM from Excel exports", () => {
    const rows = parseCsv("budget_lines.csv", `﻿${header}\nkatuli,2014-15,proposed,income,own_tax,a,,1,union,doc-a,published\n`, BudgetLine);
    expect(rows[0].union).toBe("katuli");
  });
});

function makeDs(over: Partial<Dataset> = {}): Dataset {
  return {
    union: {
      id: "katuli", name_bn: "কাতুলী", name_en: "Katuli", upazila_bn: "টাঙ্গাইল সদর", upazila_en: "Tangail Sadar", district_bn: "টাঙ্গাইল", district_en: "Tangail",
      area_km2: 26.92, population: 29811, households: 6433, census_year: 2011, portal_url: "https://example.org/", villages_bn: [], villages_en: [],
      wards: [], leadership: [], maintainer: { whatsapp: null, note_bn: null }, comparisons: [{ id: "silimpur", name_bn: "সিলিমপুর", name_en: "Silimpur", population: null, households: null, census_year: null, portal_url: null }],
    },
    documents: [{ id: "doc-a", title_bn: "ক", title_en: null, issuer: "union", date: null, fiscal_year: null, url: null, archive_path: null, reliability: "official", status: "published", note_bn: null }],
    disclosures: [], budget: [], reportedTotals: [], projects: [], verifications: [], tenders: [], fees: [], allowances: [], allowanceCounts: [],
    ...over,
  };
}

describe("checkRefs", () => {
  it("passes a consistent dataset", () => {
    expect(checkRefs(makeDs())).toEqual([]);
  });
  it("flags missing source documents and unknown unions", () => {
    const errs = checkRefs(makeDs({ budget: [{ union: "nowhere", fiscal_year: "2014-15", kind: "proposed", direction: "income", category: "own_tax", head_bn: "ক", head_en: null, amount: 1, source_type: "union", source_doc: "missing", status: "published" }] }));
    expect(errs.join("\n")).toMatch(/source_doc "missing"/);
    expect(errs.join("\n")).toMatch(/union "nowhere"/);
  });
  it("flags verifications for unknown projects and duplicate ids", () => {
    const errs = checkRefs(makeDs({
      documents: [...makeDs().documents, ...makeDs().documents],
      verifications: [{ project_id: "ghost", visit_date: "2026-09-01", visitor: "volunteer", observed_status: "unclear", observation_bn: "x", photo_paths: [], measured: null, status: "published" }],
    }));
    expect(errs.join("\n")).toMatch(/duplicate id "doc-a"/);
    expect(errs.join("\n")).toMatch(/project_id "ghost"/);
  });
});
```

`tests/data.test.ts`:
```ts
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadDataset } from "../app/data/load.server";

describe("real data/ folder", () => {
  it("loads and validates without errors", () => {
    const ds = loadDataset(path.resolve("data"));
    expect(ds.union.id).toBe("katuli");
    expect(ds.union.wards).toHaveLength(9);
  });
});
```

- [ ] **Step 2: Run tests.** Run `npm test`. Expected: FAIL (modules not found).

- [ ] **Step 3: Implement `app/data/schemas.ts`**

```ts
import { z } from "zod";
import { parseAmount, toEnDigits } from "../lib/format";

const blankToNull = (v: unknown) => (v === undefined || (typeof v === "string" && v.trim() === "") ? null : v);
const enDigits = (v: unknown) => (typeof v === "string" ? toEnDigits(v.trim()) : v);

const text = z.string().trim().min(1, "required");
const optText = z.preprocess(blankToNull, z.string().trim().nullable());
const amount = z.preprocess((v) => (typeof v === "string" ? parseAmount(v) : v), z.number());
const optAmount = z.preprocess((v) => (typeof v === "string" ? parseAmount(v) : v ?? null), z.number().nullable());
const isoDate = z.preprocess(enDigits, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected date as YYYY-MM-DD"));
const optDate = z.preprocess((v) => blankToNull(enDigits(v)), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected date as YYYY-MM-DD").nullable());
const fiscalYear = z.preprocess(enDigits, z.string().regex(/^\d{4}-\d{2}$/, "expected fiscal year like 2026-27"));
const optFiscalYear = z.preprocess((v) => blankToNull(enDigits(v)), z.string().regex(/^\d{4}-\d{2}$/, "expected fiscal year like 2026-27").nullable());
const slug = z.string().trim().regex(/^[a-z0-9][a-z0-9-]*$/, "expected lowercase id with dashes, e.g. katuli-budget-2014-15");
const optWard = z.preprocess((v) => {
  const b = blankToNull(v);
  return b === null ? null : Number(toEnDigits(String(b)));
}, z.number().int().min(1).max(9).nullable());
const rowStatus = z.enum(["draft", "published"]);

export const SOURCE_TYPES = ["union", "upstream", "observed"] as const;
export const KINDS = ["proposed", "revised", "actual"] as const;
export const ISSUERS = ["union", "upazila", "district", "ministry", "volunteer", "other"] as const;
export const SCHEMES = ["adp", "lgsp", "tr", "kabita", "kabikha", "egpp", "gr", "own", "other"] as const;
export const PROJECT_STATUSES = ["planned", "ongoing", "completed", "unknown"] as const;
export const OBSERVED = ["not_started", "in_progress", "completed", "not_found", "unclear"] as const;
export const CATEGORY_KEYS = [
  "own_tax", "fees", "hat_bazar", "ldt_1pct", "salary_grant", "adp", "block_grant", "food_programmes", "safety_net", "employment", "other_grant",
  "establishment", "roads", "health", "education", "agriculture", "water", "relief", "other",
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number];
export type Kind = (typeof KINDS)[number];
export type Issuer = (typeof ISSUERS)[number];
export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export const DocumentRow = z.object({
  id: slug, title_bn: text, title_en: optText, issuer: z.enum(ISSUERS), date: optDate, fiscal_year: optFiscalYear,
  url: optText, archive_path: optText, reliability: z.enum(["official", "low", "observed"]), status: rowStatus, note_bn: optText,
});
export type DocumentRow = z.infer<typeof DocumentRow>;

export const DisclosureRow = z.object({
  id: slug, requirement_bn: text, requirement_en: text, legal_basis: text, fiscal_year: optFiscalYear,
  published: z.enum(["yes", "no", "partial"]), document_id: optText, rti_request_bn: text,
});
export type DisclosureRow = z.infer<typeof DisclosureRow>;

export const BudgetLine = z.object({
  union: slug, fiscal_year: fiscalYear, kind: z.enum(KINDS), direction: z.enum(["income", "expense"]), category: z.enum(CATEGORY_KEYS),
  head_bn: text, head_en: optText, amount, source_type: z.enum(SOURCE_TYPES), source_doc: slug, status: rowStatus,
});
export type BudgetLine = z.infer<typeof BudgetLine>;

export const ReportedTotal = z.object({
  union: slug, fiscal_year: fiscalYear, kind: z.enum(KINDS), direction: z.enum(["income", "expense"]), amount, source_doc: slug,
});
export type ReportedTotal = z.infer<typeof ReportedTotal>;

export const ProjectRow = z.object({
  id: slug, fiscal_year: optFiscalYear, name_bn: text, name_en: optText, scheme: z.enum(SCHEMES), ward: optWard, village_bn: optText,
  lat: optAmount, lng: optAmount, amount: optAmount, unit_of_work_bn: optText, implementer_bn: optText, start: optDate, end: optDate,
  status: z.enum(PROJECT_STATUSES), source_type: z.enum(SOURCE_TYPES), source_doc: slug, up_reply_bn: optText, status_row: rowStatus,
});
export type ProjectRow = z.infer<typeof ProjectRow>;

export const VerificationRow = z.object({
  project_id: slug, visit_date: isoDate, visitor: text, observed_status: z.enum(OBSERVED), observation_bn: text,
  photo_paths: z.preprocess((v) => (typeof v === "string" ? v.split(";").map((s) => s.trim()).filter(Boolean) : v ?? []), z.array(z.string())),
  measured: optText, status: rowStatus,
});
export type VerificationRow = z.infer<typeof VerificationRow>;

export const TenderRow = z.object({
  id: slug, title_bn: text, title_en: optText, issuer: text, ref_no: optText, published: optDate, deadline: optDate, est_value: optAmount,
  url: optText, archive_path: optText, awarded_to: optText, award_value: optAmount, project_id: optText, status: rowStatus,
});
export type TenderRow = z.infer<typeof TenderRow>;

export const ServiceFeeRow = z.object({
  id: slug, service_bn: text, service_en: text, official_fee: optAmount, time_limit_days: optAmount, legal_basis: text, source_doc: slug, note_bn: optText,
});
export type ServiceFeeRow = z.infer<typeof ServiceFeeRow>;

export const AllowanceRow = z.object({
  programme: slug, name_bn: text, name_en: text, fiscal_year: fiscalYear, monthly_amount: optAmount, payment_note_bn: optText,
  eligibility_bn: text, eligibility_en: text, selection_bn: text, selection_en: text, source_doc: slug,
});
export type AllowanceRow = z.infer<typeof AllowanceRow>;

export const AllowanceCountRow = z.object({
  programme: slug, fiscal_year: fiscalYear, ward: optWard, beneficiary_count: optAmount, source_type: z.enum(SOURCE_TYPES), source_doc: slug, status: rowStatus,
});
export type AllowanceCountRow = z.infer<typeof AllowanceCountRow>;

export const UnionProfile = z.object({
  id: slug, name_bn: text, name_en: text, upazila_bn: text, upazila_en: text, district_bn: text, district_en: text,
  area_km2: z.number(), population: z.number(), households: z.number(), census_year: z.number().int(), portal_url: z.string(),
  villages_bn: z.array(z.string()), villages_en: z.array(z.string()),
  wards: z.array(z.object({
    no: z.number().int().min(1).max(9), villages_bn: z.array(z.string()), villages_en: z.array(z.string()),
    member_bn: z.string().nullable(), member_verified_on: z.string().nullable(),
  })),
  leadership: z.array(z.object({
    role_bn: text, role_en: text, name_bn: text, name_en: text, verified_on: z.string().nullable(), note_bn: z.string().nullable(),
  })),
  maintainer: z.object({ whatsapp: z.string().nullable(), note_bn: z.string().nullable() }),
  comparisons: z.array(z.object({
    id: slug, name_bn: text, name_en: text, population: z.number().nullable(), households: z.number().nullable(),
    census_year: z.number().nullable(), portal_url: z.string().nullable(),
  })),
});
export type UnionProfile = z.infer<typeof UnionProfile>;

export type Dataset = {
  union: UnionProfile;
  documents: DocumentRow[];
  disclosures: DisclosureRow[];
  budget: BudgetLine[];
  reportedTotals: ReportedTotal[];
  projects: ProjectRow[];
  verifications: VerificationRow[];
  tenders: TenderRow[];
  fees: ServiceFeeRow[];
  allowances: AllowanceRow[];
  allowanceCounts: AllowanceCountRow[];
};
```

- [ ] **Step 4: Implement `app/data/load.server.ts`**

```ts
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import type { z } from "zod";
import * as S from "./schemas";

export class DataError extends Error {
  override name = "DataError";
}

export function parseCsv<T>(file: string, text: string, schema: z.ZodType<T>, draftField = "status"): T[] {
  const res = Papa.parse<Record<string, string>>(text.replace(/^﻿/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });
  if (res.errors.length > 0) {
    const e = res.errors[0];
    throw new DataError(`${file} row ${(e.row ?? 0) + 2}: ${e.message}`);
  }
  const out: T[] = [];
  res.data.forEach((raw, i) => {
    if ((raw[draftField] ?? "").trim() === "draft") return;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const col = String(issue.path[0] ?? "?");
      throw new DataError(`${file} row ${i + 2}, column ${col}: ${issue.message} (got ${JSON.stringify(raw[col] ?? "")})`);
    }
    out.push(parsed.data);
  });
  return out;
}

export function checkRefs(ds: S.Dataset): string[] {
  const errs: string[] = [];
  const docIds = new Set(ds.documents.map((d) => d.id));
  const projectIds = new Set(ds.projects.map((p) => p.id));
  const unionIds = new Set([ds.union.id, ...ds.union.comparisons.map((c) => c.id)]);
  const doc = (file: string, id: string | null) => {
    if (id !== null && !docIds.has(id)) errs.push(`${file}: source_doc "${id}" not found in documents.csv`);
  };
  const dupes = (file: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) errs.push(`${file}: duplicate id "${id}"`);
      seen.add(id);
    }
  };
  dupes("documents.csv", ds.documents.map((d) => d.id));
  dupes("projects.csv", ds.projects.map((p) => p.id));
  dupes("tenders.csv", ds.tenders.map((t) => t.id));
  dupes("disclosures.csv", ds.disclosures.map((d) => d.id));
  for (const l of ds.budget) {
    doc("budget_lines.csv", l.source_doc);
    if (!unionIds.has(l.union)) errs.push(`budget_lines.csv: union "${l.union}" is not katuli or listed in union.json comparisons`);
  }
  for (const t of ds.reportedTotals) {
    doc("budget_reported_totals.csv", t.source_doc);
    if (!unionIds.has(t.union)) errs.push(`budget_reported_totals.csv: union "${t.union}" unknown`);
  }
  ds.projects.forEach((p) => doc("projects.csv", p.source_doc));
  ds.fees.forEach((f) => doc("service_fees.csv", f.source_doc));
  ds.allowances.forEach((a) => doc("allowances.csv", a.source_doc));
  ds.allowanceCounts.forEach((a) => doc("allowance_counts.csv", a.source_doc));
  ds.disclosures.forEach((d) => doc("disclosures.csv", d.document_id));
  for (const v of ds.verifications) {
    if (!projectIds.has(v.project_id)) errs.push(`verifications.csv: project_id "${v.project_id}" not found in projects.csv`);
  }
  for (const t of ds.tenders) {
    if (t.project_id !== null && !projectIds.has(t.project_id)) errs.push(`tenders.csv: project_id "${t.project_id}" not found in projects.csv`);
  }
  return errs;
}

let cache: { dir: string; ds: S.Dataset } | null = null;

export function loadDataset(dir = path.resolve(process.cwd(), "data")): S.Dataset {
  if (cache && cache.dir === dir) return cache.ds;
  const read = (f: string) => fs.readFileSync(path.join(dir, f), "utf8");
  const union = S.UnionProfile.safeParse(JSON.parse(read("union.json")));
  if (!union.success) {
    const issue = union.error.issues[0];
    throw new DataError(`union.json ${issue.path.join(".")}: ${issue.message}`);
  }
  const ds: S.Dataset = {
    union: union.data,
    documents: parseCsv("documents.csv", read("documents.csv"), S.DocumentRow),
    disclosures: parseCsv("disclosures.csv", read("disclosures.csv"), S.DisclosureRow, "-"),
    budget: parseCsv("budget_lines.csv", read("budget_lines.csv"), S.BudgetLine),
    reportedTotals: parseCsv("budget_reported_totals.csv", read("budget_reported_totals.csv"), S.ReportedTotal, "-"),
    projects: parseCsv("projects.csv", read("projects.csv"), S.ProjectRow, "status_row"),
    verifications: parseCsv("verifications.csv", read("verifications.csv"), S.VerificationRow),
    tenders: parseCsv("tenders.csv", read("tenders.csv"), S.TenderRow),
    fees: parseCsv("service_fees.csv", read("service_fees.csv"), S.ServiceFeeRow, "-"),
    allowances: parseCsv("allowances.csv", read("allowances.csv"), S.AllowanceRow, "-"),
    allowanceCounts: parseCsv("allowance_counts.csv", read("allowance_counts.csv"), S.AllowanceCountRow),
  };
  const errs = checkRefs(ds);
  if (errs.length > 0) throw new DataError(errs.join("\n"));
  cache = { dir, ds };
  return ds;
}
```

- [ ] **Step 5: Implement `app/data/refs.ts`**

```ts
import type { DocumentRow } from "./schemas";

export type DocRef = Pick<DocumentRow, "id" | "title_bn" | "title_en" | "url" | "archive_path" | "reliability" | "issuer" | "date">;

export function docRefs(docs: DocumentRow[], ids: Iterable<string>): Record<string, DocRef> {
  const want = new Set(ids);
  return Object.fromEntries(
    docs.filter((d) => want.has(d.id)).map((d) => [d.id, { id: d.id, title_bn: d.title_bn, title_en: d.title_en, url: d.url, archive_path: d.archive_path, reliability: d.reliability, issuer: d.issuer, date: d.date }]),
  );
}
```

- [ ] **Step 6: Seed skeleton data** (real content arrives in Task 16)

Header lines, one per file:
- `data/documents.csv`: `id,title_bn,title_en,issuer,date,fiscal_year,url,archive_path,reliability,status,note_bn`
- `data/disclosures.csv`: `id,requirement_bn,requirement_en,legal_basis,fiscal_year,published,document_id,rti_request_bn`
- `data/budget_lines.csv`: `union,fiscal_year,kind,direction,category,head_bn,head_en,amount,source_type,source_doc,status`
- `data/budget_reported_totals.csv`: `union,fiscal_year,kind,direction,amount,source_doc`
- `data/projects.csv`: `id,fiscal_year,name_bn,name_en,scheme,ward,village_bn,lat,lng,amount,unit_of_work_bn,implementer_bn,start,end,status,source_type,source_doc,up_reply_bn,status_row`
- `data/verifications.csv`: `project_id,visit_date,visitor,observed_status,observation_bn,photo_paths,measured,status`
- `data/tenders.csv`: `id,title_bn,title_en,issuer,ref_no,published,deadline,est_value,url,archive_path,awarded_to,award_value,project_id,status`
- `data/service_fees.csv`: `id,service_bn,service_en,official_fee,time_limit_days,legal_basis,source_doc,note_bn`
- `data/allowances.csv`: `programme,name_bn,name_en,fiscal_year,monthly_amount,payment_note_bn,eligibility_bn,eligibility_en,selection_bn,selection_en,source_doc`
- `data/allowance_counts.csv`: `programme,fiscal_year,ward,beneficiary_count,source_type,source_doc,status`

`data/union.json`:
```json
{
  "id": "katuli",
  "name_bn": "কাতুলী", "name_en": "Katuli",
  "upazila_bn": "টাঙ্গাইল সদর", "upazila_en": "Tangail Sadar",
  "district_bn": "টাঙ্গাইল", "district_en": "Tangail",
  "area_km2": 26.92, "population": 29811, "households": 6433, "census_year": 2011,
  "portal_url": "https://katuliup.tangail.gov.bd/",
  "villages_bn": [], "villages_en": [],
  "wards": [
    { "no": 1, "villages_bn": [], "villages_en": [], "member_bn": null, "member_verified_on": null },
    { "no": 2, "villages_bn": [], "villages_en": [], "member_bn": null, "member_verified_on": null },
    { "no": 3, "villages_bn": [], "villages_en": [], "member_bn": null, "member_verified_on": null },
    { "no": 4, "villages_bn": [], "villages_en": [], "member_bn": null, "member_verified_on": null },
    { "no": 5, "villages_bn": [], "villages_en": [], "member_bn": null, "member_verified_on": null },
    { "no": 6, "villages_bn": [], "villages_en": [], "member_bn": null, "member_verified_on": null },
    { "no": 7, "villages_bn": [], "villages_en": [], "member_bn": null, "member_verified_on": null },
    { "no": 8, "villages_bn": [], "villages_en": [], "member_bn": null, "member_verified_on": null },
    { "no": 9, "villages_bn": [], "villages_en": [], "member_bn": null, "member_verified_on": null }
  ],
  "leadership": [],
  "maintainer": { "whatsapp": null, "note_bn": null },
  "comparisons": []
}
```

- [ ] **Step 7: Run tests.** Run `npm test`. Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: zod-validated CSV data loader with cross-file checks"
```

---

### Task 4: Aggregation, labels, categories

**Files:**
- Create: `app/lib/aggregate.ts`, `app/lib/labels.ts`, `app/data/categories.ts`
- Test: `tests/aggregate.test.ts`

**Interfaces:**
- Consumes: `BudgetLine`, `ReportedTotal`, `Kind`, `CategoryKey`, `SourceType` (Task 3); `perHousehold` (Task 2)
- Produces:
  - Types: `CategoryTotal`, `YearSummary`, `UnionRef`, `Comparison`
  - Functions: `yearsFor(lines, union): string[]` (newest first), `summarizeYear(lines, totals, union, fy): YearSummary | null`, `compareUnions(lines, totals, unions: UnionRef[]): Comparison[]`, `fiscalYearOf(d: Date): string`, `fyStart(fy): number`
  - Label maps: `KIND_LABEL`, `SCHEME_LABEL`, `PROJECT_STATUS_LABEL`, `OBSERVED_LABEL`, `SOURCE_TYPE_LABEL`, `ISSUER_LABEL`, all `Record<key, {bn, en}>`
  - `CATEGORIES: Record<CategoryKey, {bn, en, icon}>`, `categoryItems(totals, lang): BarItem[]` (the `BarItem` type is defined here and re-exported by Bars)

- [ ] **Step 1: Write failing tests**

`tests/aggregate.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { compareUnions, fiscalYearOf, fyStart, summarizeYear, yearsFor } from "../app/lib/aggregate";
import type { BudgetLine, ReportedTotal } from "../app/data/schemas";

const L = (o: Partial<BudgetLine>): BudgetLine => ({ union: "katuli", fiscal_year: "2014-15", kind: "proposed", direction: "income", category: "own_tax", head_bn: "ক", head_en: null, amount: 100, source_type: "union", source_doc: "d", status: "published", ...o });

const lines: BudgetLine[] = [
  L({ amount: 100 }),
  L({ category: "adp", amount: 300 }),
  L({ direction: "expense", category: "roads", amount: 250 }),
  L({ kind: "actual", fiscal_year: "2012-13", amount: 50 }),
  L({ kind: "proposed", fiscal_year: "2012-13", amount: 999 }),
  L({ union: "silimpur", fiscal_year: "2023-24", amount: 1000 }),
];
const totals: ReportedTotal[] = [{ union: "katuli", fiscal_year: "2014-15", kind: "proposed", direction: "income", amount: 406, source_doc: "d" }];

describe("yearsFor", () => {
  it("lists a union's years newest first", () => {
    expect(yearsFor(lines, "katuli")).toEqual(["2014-15", "2012-13"]);
    expect(yearsFor(lines, "nobody")).toEqual([]);
  });
});

describe("summarizeYear", () => {
  it("sums by direction and groups categories largest first", () => {
    const s = summarizeYear(lines, totals, "katuli", "2014-15")!;
    expect(s.income).toBe(400);
    expect(s.expense).toBe(250);
    expect(s.incomeByCategory.map((c) => c.category)).toEqual(["adp", "own_tax"]);
    expect(s.reportedIncome).toBe(406);
    expect(s.reportedExpense).toBeNull();
    expect(s.sourceTypes).toEqual(["union"]);
  });
  it("prefers actual over proposed figures for the same year", () => {
    const s = summarizeYear(lines, totals, "katuli", "2012-13")!;
    expect(s.kind).toBe("actual");
    expect(s.income).toBe(50);
  });
  it("returns null for a year with no data", () => {
    expect(summarizeYear(lines, totals, "katuli", "2026-27")).toBeNull();
  });
});

describe("compareUnions", () => {
  it("uses the latest year, prefers reported totals, and handles unknown households", () => {
    const rows = compareUnions(lines, totals, [
      { id: "katuli", name_bn: "কাতুলী", name_en: "Katuli", households: 4 },
      { id: "silimpur", name_bn: "সিলিমপুর", name_en: "Silimpur", households: null },
      { id: "nodata", name_bn: "ক", name_en: "X", households: 10 },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ id: "katuli", fiscalYear: "2014-15", income: 406, perHousehold: 102 });
    expect(rows[1]).toMatchObject({ id: "silimpur", perHousehold: null });
  });
});

describe("fiscal years", () => {
  it("July starts a new fiscal year", () => {
    expect(fiscalYearOf(new Date("2026-06-30T12:00:00Z"))).toBe("2025-26");
    expect(fiscalYearOf(new Date("2026-07-01T12:00:00Z"))).toBe("2026-27");
    expect(fiscalYearOf(new Date("2099-09-01T12:00:00Z"))).toBe("2099-00");
    expect(fyStart("2014-15")).toBe(2014);
  });
});
```

- [ ] **Step 2: Run tests.** Run `npm test`. Expected: FAIL.

- [ ] **Step 3: Implement `app/lib/aggregate.ts`**

```ts
import type { BudgetLine, CategoryKey, Kind, ReportedTotal, SourceType } from "../data/schemas";
import { perHousehold } from "./format";

const KIND_PRIORITY: Kind[] = ["actual", "revised", "proposed"];

export type CategoryTotal = { category: CategoryKey; amount: number; lines: BudgetLine[] };
export type YearSummary = {
  union: string;
  fiscalYear: string;
  kind: Kind;
  income: number;
  expense: number;
  incomeByCategory: CategoryTotal[];
  expenseByCategory: CategoryTotal[];
  sourceTypes: SourceType[];
  reportedIncome: number | null;
  reportedExpense: number | null;
};
export type UnionRef = { id: string; name_bn: string; name_en: string; households: number | null };
export type Comparison = { id: string; name_bn: string; name_en: string; fiscalYear: string; kind: Kind; income: number; perHousehold: number | null };

export function yearsFor(lines: BudgetLine[], union: string): string[] {
  return [...new Set(lines.filter((l) => l.union === union).map((l) => l.fiscal_year))].sort().reverse();
}

function group(lines: BudgetLine[]): CategoryTotal[] {
  const byCat = new Map<CategoryKey, CategoryTotal>();
  for (const l of lines) {
    const g = byCat.get(l.category) ?? { category: l.category, amount: 0, lines: [] };
    g.amount += l.amount;
    g.lines.push(l);
    byCat.set(l.category, g);
  }
  return [...byCat.values()].sort((a, b) => b.amount - a.amount);
}

const sum = (xs: BudgetLine[]) => xs.reduce((s, x) => s + x.amount, 0);

export function summarizeYear(lines: BudgetLine[], totals: ReportedTotal[], union: string, fy: string): YearSummary | null {
  const rows = lines.filter((l) => l.union === union && l.fiscal_year === fy);
  const kind = KIND_PRIORITY.find((k) => rows.some((r) => r.kind === k));
  if (!kind) return null;
  const chosen = rows.filter((r) => r.kind === kind);
  const income = chosen.filter((r) => r.direction === "income");
  const expense = chosen.filter((r) => r.direction === "expense");
  const reported = (d: "income" | "expense") =>
    totals.find((t) => t.union === union && t.fiscal_year === fy && t.kind === kind && t.direction === d)?.amount ?? null;
  return {
    union,
    fiscalYear: fy,
    kind,
    income: sum(income),
    expense: sum(expense),
    incomeByCategory: group(income),
    expenseByCategory: group(expense),
    sourceTypes: [...new Set(chosen.map((r) => r.source_type))],
    reportedIncome: reported("income"),
    reportedExpense: reported("expense"),
  };
}

export function compareUnions(lines: BudgetLine[], totals: ReportedTotal[], unions: UnionRef[]): Comparison[] {
  return unions
    .flatMap((u) => {
      const fy = yearsFor(lines, u.id)[0];
      const s = fy ? summarizeYear(lines, totals, u.id, fy) : null;
      if (!s) return [];
      const income = s.reportedIncome ?? s.income;
      return [{ id: u.id, name_bn: u.name_bn, name_en: u.name_en, fiscalYear: s.fiscalYear, kind: s.kind, income, perHousehold: perHousehold(income, u.households) }];
    })
    .sort((a, b) => (b.perHousehold ?? -1) - (a.perHousehold ?? -1));
}

export function fiscalYearOf(d: Date): string {
  const y = d.getUTCFullYear();
  const start = d.getUTCMonth() >= 6 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

export function fyStart(fy: string): number {
  return Number(fy.slice(0, 4));
}
```

- [ ] **Step 4: Implement `app/lib/labels.ts`**

```ts
import type { Issuer, Kind, SourceType } from "../data/schemas";

type L = { bn: string; en: string };

export const KIND_LABEL: Record<Kind, L> = {
  proposed: { bn: "প্রস্তাবিত", en: "proposed" },
  revised: { bn: "সংশোধিত", en: "revised" },
  actual: { bn: "প্রকৃত", en: "actual" },
};
export const SOURCE_TYPE_LABEL: Record<SourceType, L> = {
  union: { bn: "ইউনিয়নের নথি", en: "Union document" },
  upstream: { bn: "অন্য সরকারি অফিসের নথি", en: "Other government office" },
  observed: { bn: "স্বেচ্ছাসেবকের পর্যবেক্ষণ", en: "Volunteer observation" },
};
export const ISSUER_LABEL: Record<Issuer, L> = {
  union: { bn: "ইউনিয়ন পরিষদ", en: "Union Parishad" },
  upazila: { bn: "উপজেলা", en: "Upazila" },
  district: { bn: "জেলা", en: "District" },
  ministry: { bn: "মন্ত্রণালয়/অধিদপ্তর", en: "Ministry/department" },
  volunteer: { bn: "স্বেচ্ছাসেবক", en: "Volunteer" },
  other: { bn: "অন্যান্য", en: "Other" },
};
export const SCHEME_LABEL: Record<string, L> = {
  adp: { bn: "এডিপি", en: "ADP" },
  lgsp: { bn: "এলজিএসপি/থোক বরাদ্দ", en: "LGSP / block grant" },
  tr: { bn: "টিআর", en: "TR" },
  kabita: { bn: "কাবিটা", en: "KABITA" },
  kabikha: { bn: "কাবিখা", en: "KABIKHA" },
  egpp: { bn: "অতিদরিদ্রের কর্মসংস্থান (ইজিপিপি)", en: "EGPP employment" },
  gr: { bn: "জিআর (ত্রাণ)", en: "GR relief" },
  own: { bn: "নিজস্ব তহবিল", en: "Own funds" },
  other: { bn: "অন্যান্য", en: "Other" },
};
export const PROJECT_STATUS_LABEL: Record<string, L> = {
  planned: { bn: "পরিকল্পিত", en: "Planned" },
  ongoing: { bn: "চলমান", en: "Ongoing" },
  completed: { bn: "সম্পন্ন (নথি অনুযায়ী)", en: "Completed (per documents)" },
  unknown: { bn: "অবস্থা অজানা", en: "Status unknown" },
};
export const OBSERVED_LABEL: Record<string, L> = {
  not_started: { bn: "কাজ শুরু হয়নি", en: "Not started" },
  in_progress: { bn: "কাজ চলছে", en: "In progress" },
  completed: { bn: "কাজ শেষ দেখা গেছে", en: "Seen completed" },
  not_found: { bn: "স্থানে কাজ পাওয়া যায়নি", en: "Not found on site" },
  unclear: { bn: "অস্পষ্ট", en: "Unclear" },
};
```

- [ ] **Step 5: Implement `app/data/categories.ts`**

```ts
import { Banknote, Briefcase, Building2, CircleEllipsis, Droplets, GraduationCap, HandHeart, HeartPulse, Landmark, LifeBuoy, type LucideIcon, Receipt, Route, Sprout, Store, Wheat, Users, Gift, House } from "lucide-react";
import type { Lang } from "../lib/format";
import type { CategoryKey } from "./schemas";

export type BarItem = { key: string; label: string; amount: number | null; icon?: LucideIcon; note?: string; highlight?: boolean };

export const CATEGORIES: Record<CategoryKey, { bn: string; en: string; icon: LucideIcon }> = {
  own_tax: { bn: "নিজস্ব কর (বসতবাড়ি, ব্যবসা)", en: "Own taxes (holding, trade)", icon: House },
  fees: { bn: "ফি, সনদ ও লাইসেন্স", en: "Fees, certificates & licences", icon: Receipt },
  hat_bazar: { bn: "হাট-বাজার ইজারা", en: "Market (hat-bazar) lease", icon: Store },
  ldt_1pct: { bn: "জমি হস্তান্তর কর (১%)", en: "Land transfer tax (1%)", icon: Landmark },
  salary_grant: { bn: "সম্মানী ও বেতনের সরকারি অনুদান", en: "Govt grant for honoraria & salaries", icon: Banknote },
  adp: { bn: "এডিপি (উন্নয়ন বরাদ্দ)", en: "ADP development grant", icon: Building2 },
  block_grant: { bn: "থোক বরাদ্দ (এলজিএসপি/উন্নয়ন সহায়তা)", en: "Block grant (LGSP / dev. support)", icon: Gift },
  food_programmes: { bn: "টিআর/কাবিখা/কাবিটা", en: "TR / KABIKHA / KABITA", icon: Wheat },
  safety_net: { bn: "ভিজিডি/ভিজিএফ ও সামাজিক নিরাপত্তা", en: "VGD / VGF & safety nets", icon: HandHeart },
  employment: { bn: "কর্মসৃজন কর্মসূচি (ইজিপিপি)", en: "Employment programme (EGPP)", icon: Briefcase },
  other_grant: { bn: "অন্যান্য অনুদান", en: "Other grants", icon: Gift },
  establishment: { bn: "সম্মানী, বেতন ও অফিস খরচ", en: "Honoraria, salaries & office", icon: Users },
  roads: { bn: "রাস্তা, কালভার্ট ও ড্রেন", en: "Roads, culverts & drains", icon: Route },
  health: { bn: "স্বাস্থ্য ও পয়ঃনিষ্কাশন", en: "Health & sanitation", icon: HeartPulse },
  education: { bn: "শিক্ষা ও খেলাধুলা", en: "Education & sports", icon: GraduationCap },
  agriculture: { bn: "কৃষি", en: "Agriculture", icon: Sprout },
  water: { bn: "পানি", en: "Water", icon: Droplets },
  relief: { bn: "ত্রাণ ও সহায়তা", en: "Relief & support", icon: LifeBuoy },
  other: { bn: "অন্যান্য", en: "Other", icon: CircleEllipsis },
};

export function categoryItems(totals: { category: CategoryKey; amount: number }[], lang: Lang): BarItem[] {
  return totals.map((c) => ({ key: c.category, label: CATEGORIES[c.category][lang], amount: c.amount, icon: CATEGORIES[c.category].icon }));
}
```

- [ ] **Step 6: Run tests and typecheck.** Run `npm test && npm run typecheck`. Expected: PASS. If a lucide icon name doesn't exist in the installed version, tsc reports it; swap it for the nearest icon in `node_modules/lucide-react/dist/lucide-react.d.ts`.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: budget aggregation, fiscal-year helpers, labels and categories"
```

---

### Task 5: Layout shell and shared components

**Files:**
- Create: `app/components/{Header,BottomNav,Footer,Bars,Amount,Unknown,SourceBadge,DisclosureStrip,ShareButtons,DeadlineBadge,SectionTiles,StatusIcon,OfflineNotice}.tsx`, `app/lib/meta.ts`, `app/lib/site.ts`
- Modify: `app/root.tsx` (full layout), `app/app.css` (append component styles)
- Test: `tests/components.test.tsx`

**Interfaces:**
- Consumes: `useT`, `useFmt`, `useLang` (Task 2); `BarItem`, label maps (Task 4); `DocRef` (Task 3)
- Produces:
  - `<Bars items tone="income"|"expense" format?="taka"|"takaFull" />`
  - `<Amount value={number|null} full? />`
  - `<Unknown rti?={disclosureId} />`
  - `<SourceBadge type doc? />`
  - `<DisclosureStrip items full? />` with `DisclosureItem = {id, requirement_bn, requirement_en, published}`
  - `<ShareButtons title />`, `<DeadlineBadge deadline />`, `<SectionTiles />`, `<StatusIcon s />`, `<OfflineNotice />`
  - `pageMeta(title, description)`, `absoluteUrl(path)`

- [ ] **Step 1: Write failing tests**

`tests/components.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { Amount } from "../app/components/Amount";
import { Bars } from "../app/components/Bars";
import { DisclosureStrip } from "../app/components/DisclosureStrip";
import { SourceBadge } from "../app/components/SourceBadge";
import { LangProvider } from "../app/lib/i18n";

const wrap = (ui: ReactNode) => render(<MemoryRouter><LangProvider>{ui}</LangProvider></MemoryRouter>);

describe("Amount", () => {
  it("formats in Bangla lakh", () => {
    wrap(<Amount value={1572643} />);
    expect(screen.getByText("৳১৫.৭ লাখ")).toBeTruthy();
  });
  it("shows অজানা for null, never 0", () => {
    wrap(<Amount value={null} />);
    expect(screen.getByText("অজানা")).toBeTruthy();
    expect(screen.queryByText("৳০")).toBeNull();
  });
});

describe("Bars", () => {
  it("renders proportional widths and labels", () => {
    const { container } = wrap(<Bars tone="income" items={[{ key: "a", label: "এডিপি", amount: 200 }, { key: "b", label: "কর", amount: 50 }]} />);
    expect(screen.getByText("এডিপি")).toBeTruthy();
    const fills = container.querySelectorAll<HTMLElement>(".bar-fill");
    expect(fills[0].style.width).toBe("100%");
    expect(fills[1].style.width).toBe("25%");
  });
  it("shows an empty message when there are no items", () => {
    wrap(<Bars tone="income" items={[]} />);
    expect(screen.getByText("তথ্য নেই")).toBeTruthy();
  });
});

describe("DisclosureStrip", () => {
  it("counts published items in Bangla and links requests", () => {
    wrap(<DisclosureStrip items={[
      { id: "budget-current", requirement_bn: "চলতি বাজেট", requirement_en: "Current budget", published: "no" },
      { id: "charter", requirement_bn: "সিটিজেন চার্টার", requirement_en: "Citizen charter", published: "yes" },
      { id: "audit", requirement_bn: "অডিট", requirement_en: "Audit", published: "partial" },
    ]} />);
    expect(screen.getByText("৩টির মধ্যে ১টি প্রকাশিত")).toBeTruthy();
    const links = screen.getAllByRole("link", { name: /চেয়ে আবেদন/ });
    expect(links[0].getAttribute("href")).toBe("/rights/rti?item=budget-current");
    expect(links).toHaveLength(2);
  });
});

describe("SourceBadge", () => {
  it("shows the source type and a low-reliability warning", () => {
    wrap(<SourceBadge type="union" doc={{ id: "d", title_bn: "বাজেট", title_en: null, url: "https://example.org/x", archive_path: null, reliability: "low", issuer: "union", date: null }} />);
    expect(screen.getByText("ইউনিয়নের নথি")).toBeTruthy();
    expect(screen.getByText("কম নির্ভরযোগ্য")).toBeTruthy();
    expect(screen.getByRole("link", { name: "নথি" }).getAttribute("href")).toBe("https://example.org/x");
  });
});
```

- [ ] **Step 2: Run tests.** Run `npm test`. Expected: FAIL.

- [ ] **Step 3: Implement the small components**

`app/components/Unknown.tsx`:
```tsx
import { Link } from "react-router";
import { useT } from "../lib/i18n";

export function Unknown({ rti }: { rti?: string }) {
  const t = useT();
  return (
    <span className="chip chip-low" title={t("এই তথ্য প্রকাশ করা হয়নি", "This has not been published")}>
      {t("অজানা", "Unknown")}
      {rti ? <> · <Link to={`/rights/rti?item=${rti}`}>{t("চেয়ে নিন", "Request")}</Link></> : null}
    </span>
  );
}
```

`app/components/Amount.tsx`:
```tsx
import { useFmt } from "../lib/i18n";
import { Unknown } from "./Unknown";

export function Amount({ value, full = false, rti }: { value: number | null; full?: boolean; rti?: string }) {
  const f = useFmt();
  if (value === null) return <Unknown rti={rti} />;
  return <span className="amount">{full ? f.takaFull(value) : f.taka(value)}</span>;
}
```

`app/components/StatusIcon.tsx`:
```tsx
import { CheckCircle2, CircleDot, XCircle } from "lucide-react";
import { useT } from "../lib/i18n";

export function StatusIcon({ s }: { s: "yes" | "no" | "partial" }) {
  const t = useT();
  const Icon = s === "yes" ? CheckCircle2 : s === "no" ? XCircle : CircleDot;
  const label = s === "yes" ? t("প্রকাশিত", "Published") : s === "no" ? t("প্রকাশিত নয়", "Not published") : t("আংশিক", "Partial");
  return (
    <span className={s}>
      <Icon size={20} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}
```

`app/components/Bars.tsx`:
```tsx
import type { BarItem } from "../data/categories";
import { useFmt, useT } from "../lib/i18n";
import { Unknown } from "./Unknown";

export type { BarItem };

export function Bars({ items, tone, format = "taka" }: { items: BarItem[]; tone: "income" | "expense"; format?: "taka" | "takaFull" }) {
  const f = useFmt();
  const t = useT();
  if (items.length === 0) return <p className="muted">{t("তথ্য নেই", "No data")}</p>;
  const max = Math.max(0, ...items.map((i) => i.amount ?? 0));
  return (
    <ul className="bars">
      {items.map((i) => {
        const pct = max > 0 && i.amount !== null ? Math.max(2, Math.round((i.amount / max) * 100)) : 0;
        const Icon = i.icon;
        return (
          <li key={i.key} className={i.highlight ? "hl" : undefined}>
            <div className="bar-label">
              <span className="bar-name">
                {Icon ? <Icon size={20} aria-hidden /> : null}
                <span>{i.label}{i.note ? <span className="muted"> · {i.note}</span> : null}</span>
              </span>
              <strong>{i.amount === null ? <Unknown /> : f[format](i.amount)}</strong>
            </div>
            <div className="bar-track" aria-hidden="true">
              <div className="bar-fill" style={{ width: `${pct}%`, background: `var(--${tone})` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
```

`app/components/SourceBadge.tsx`:
```tsx
import type { DocRef } from "../data/refs";
import type { SourceType } from "../data/schemas";
import { useLang, useT } from "../lib/i18n";
import { SOURCE_TYPE_LABEL } from "../lib/labels";

export function docHref(doc: DocRef): string | null {
  return doc.archive_path ? `${import.meta.env.BASE_URL}${doc.archive_path}` : doc.url;
}

export function SourceBadge({ type, doc }: { type: SourceType; doc?: DocRef }) {
  const t = useT();
  const { lang } = useLang();
  const href = doc ? docHref(doc) : null;
  return (
    <span className="source">
      <span className={`chip chip-${type}`}>{SOURCE_TYPE_LABEL[type][lang]}</span>
      {doc?.reliability === "low" ? <span className="chip chip-low">{t("কম নির্ভরযোগ্য", "Low reliability")}</span> : null}
      {href ? <a href={href} target="_blank" rel="noopener" className="small-link">{t("নথি", "Source")}</a> : null}
    </span>
  );
}
```

`app/components/DisclosureStrip.tsx`:
```tsx
import { Link } from "react-router";
import { useFmt, useT } from "../lib/i18n";
import { StatusIcon } from "./StatusIcon";

export type DisclosureItem = { id: string; requirement_bn: string; requirement_en: string; published: "yes" | "no" | "partial" };

export function DisclosureStrip({ items, full = false }: { items: DisclosureItem[]; full?: boolean }) {
  const t = useT();
  const f = useFmt();
  if (items.length === 0) return null;
  const yes = items.filter((i) => i.published === "yes").length;
  const shown = full ? items : items.slice(0, 5);
  return (
    <section className="card" aria-labelledby="disc-h">
      <h2 id="disc-h" className="h3">{t("আইন অনুযায়ী যা প্রকাশ করার কথা", "What the law says must be made public")}</h2>
      <p className="scoreline">
        <strong>{t(`${f.digits(items.length)}টির মধ্যে ${f.digits(yes)}টি প্রকাশিত`, `${yes} of ${items.length} published`)}</strong>
      </p>
      <ul className="scorecard">
        {shown.map((i) => (
          <li key={i.id}>
            <StatusIcon s={i.published} />
            <span className="grow">{f.lang === "bn" ? i.requirement_bn : i.requirement_en}</span>
            {i.published !== "yes" ? <Link className="small-link" to={`/rights/rti?item=${i.id}`}>{t("চেয়ে আবেদন", "Request")}</Link> : null}
          </li>
        ))}
      </ul>
      {!full && items.length > shown.length ? <Link to="/documents">{t("সব দেখুন →", "See all →")}</Link> : null}
    </section>
  );
}
```

`app/components/ShareButtons.tsx`:
```tsx
import { Printer, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "../lib/i18n";

export function ShareButtons({ title }: { title: string }) {
  const t = useT();
  const [url, setUrl] = useState("");
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    setUrl(window.location.href);
    setCanShare(typeof navigator.share === "function");
  }, []);
  const wa = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`.trim())}`;
  return (
    <div className="share no-print">
      <a className="btn" href={wa} target="_blank" rel="noopener">{t("হোয়াটসঅ্যাপে পাঠান", "Send on WhatsApp")}</a>
      {canShare ? (
        <button type="button" className="btn" onClick={() => navigator.share({ title, url }).catch(() => {})}>
          <Share2 size={18} aria-hidden />{t("শেয়ার", "Share")}
        </button>
      ) : null}
      <button type="button" className="btn" onClick={() => window.print()}>
        <Printer size={18} aria-hidden />{t("প্রিন্ট", "Print")}
      </button>
    </div>
  );
}
```

`app/components/DeadlineBadge.tsx`:
```tsx
import { useEffect, useState } from "react";
import { useFmt, useT } from "../lib/i18n";
import { Unknown } from "./Unknown";

export function DeadlineBadge({ deadline }: { deadline: string | null }) {
  const t = useT();
  const f = useFmt();
  const [days, setDays] = useState<number | null>(null);
  useEffect(() => {
    if (!deadline) return;
    const end = Date.parse(`${deadline}T23:59:59+06:00`);
    setDays(Math.ceil((end - Date.now()) / 86_400_000));
  }, [deadline]);
  if (!deadline) return <Unknown />;
  const closed = days !== null && days < 0;
  return (
    <span className={`chip ${closed ? "" : "chip-union"}`}>
      {f.date(deadline)}
      {days === null ? "" : closed ? t(" · বন্ধ", " · closed") : t(` · ${f.digits(days)} দিন বাকি`, ` · ${days} days left`)}
    </span>
  );
}
```

`app/components/SectionTiles.tsx`:
```tsx
import { FolderOpen, Gavel, Hammer, HandHeart, MapPin, Receipt, Scale, Wallet } from "lucide-react";
import { Link } from "react-router";
import { useT } from "../lib/i18n";

const TILES = [
  { to: "/budget", icon: Wallet, bn: "বাজেট", en: "Budget" },
  { to: "/projects", icon: Hammer, bn: "প্রকল্প", en: "Projects" },
  { to: "/tenders", icon: Gavel, bn: "দরপত্র", en: "Tenders" },
  { to: "/wards", icon: MapPin, bn: "আমার ওয়ার্ড", en: "My ward" },
  { to: "/services", icon: Receipt, bn: "সেবার ফি", en: "Service fees" },
  { to: "/allowances", icon: HandHeart, bn: "ভাতা", en: "Allowances" },
  { to: "/rights", icon: Scale, bn: "আপনার অধিকার", en: "Your rights" },
  { to: "/documents", icon: FolderOpen, bn: "নথিপত্র", en: "Documents" },
];

export function SectionTiles() {
  const t = useT();
  return (
    <nav className="tiles" aria-label={t("বিভাগসমূহ", "Sections")}>
      {TILES.map((x) => (
        <Link key={x.to} to={x.to} className="tile">
          <x.icon size={30} aria-hidden />
          {t(x.bn, x.en)}
        </Link>
      ))}
    </nav>
  );
}
```

`app/components/OfflineNotice.tsx`:
```tsx
import { useEffect, useState } from "react";
import { useT } from "../lib/i18n";

export function OfflineNotice() {
  const t = useT();
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  if (!offline) return null;
  return <div className="warn" role="status">{t("আপনি অফলাইনে আছেন — আগে দেখা পাতাগুলো সংরক্ষিত আছে।", "You are offline — pages you visited before are saved.")}</div>;
}
```

`app/components/Header.tsx`:
```tsx
import { Coins } from "lucide-react";
import { Link } from "react-router";
import { useLang, useT } from "../lib/i18n";

export function Header() {
  const t = useT();
  const { lang, setLang } = useLang();
  return (
    <>
      <div className="banner" role="note">{t("স্বাধীন নাগরিক উদ্যোগ — এটি সরকারি ওয়েবসাইট নয়", "Independent citizens' initiative — not a government website")}</div>
      <header className="site-header">
        <div className="bar">
          <Link to="/" className="brand"><Coins size={24} aria-hidden />{t("কাতুলীর বাজেট", "Katuli Budget")}</Link>
          <button type="button" className="btn btn-small" lang={lang === "bn" ? "en" : "bn"} onClick={() => setLang(lang === "bn" ? "en" : "bn")}>
            {lang === "bn" ? "English" : "বাংলা"}
          </button>
        </div>
      </header>
    </>
  );
}
```

`app/components/BottomNav.tsx`:
```tsx
import { Hammer, House, MapPin, Scale, Wallet } from "lucide-react";
import { NavLink } from "react-router";
import { useT } from "../lib/i18n";

const ITEMS = [
  { to: "/", end: true, icon: House, bn: "হোম", en: "Home" },
  { to: "/budget", end: false, icon: Wallet, bn: "বাজেট", en: "Budget" },
  { to: "/projects", end: false, icon: Hammer, bn: "প্রকল্প", en: "Projects" },
  { to: "/wards", end: false, icon: MapPin, bn: "ওয়ার্ড", en: "Wards" },
  { to: "/rights", end: false, icon: Scale, bn: "অধিকার", en: "Rights" },
];

export function BottomNav() {
  const t = useT();
  return (
    <nav className="bottom-nav" aria-label={t("প্রধান মেনু", "Main menu")}>
      {ITEMS.map((i) => (
        <NavLink key={i.to} to={i.to} end={i.end} className={({ isActive }) => (isActive ? "active" : undefined)}>
          <i.icon size={22} aria-hidden />
          {t(i.bn, i.en)}
        </NavLink>
      ))}
    </nav>
  );
}
```

`app/components/Footer.tsx`:
```tsx
import { Link } from "react-router";
import { useFmt, useT } from "../lib/i18n";

export function Footer() {
  const t = useT();
  const f = useFmt();
  return (
    <footer className="site-footer">
      <div className="container">
        <nav aria-label={t("সব পাতা", "All pages")}>
          <Link to="/budget">{t("বাজেট", "Budget")}</Link>
          <Link to="/projects">{t("প্রকল্প", "Projects")}</Link>
          <Link to="/tenders">{t("দরপত্র", "Tenders")}</Link>
          <Link to="/wards">{t("ওয়ার্ড", "Wards")}</Link>
          <Link to="/services">{t("সেবার ফি", "Service fees")}</Link>
          <Link to="/allowances">{t("ভাতা", "Allowances")}</Link>
          <Link to="/rights">{t("অধিকার", "Rights")}</Link>
          <Link to="/documents">{t("নথিপত্র", "Documents")}</Link>
          <Link to="/about">{t("আমাদের সম্পর্কে", "About")}</Link>
        </nav>
        <p>{t("এখানের তথ্য সরকারি নথি ও স্বেচ্ছাসেবকদের পর্যবেক্ষণ থেকে নেওয়া। কোনো অমিল মানেই অনিয়মের প্রমাণ নয়।", "Data comes from government documents and volunteer observations. A discrepancy is not proof of wrongdoing.")}</p>
        <p>{t(`সর্বশেষ হালনাগাদ: ${f.date(__BUILD_DATE__)}`, `Last updated: ${f.date(__BUILD_DATE__)}`)}</p>
      </div>
    </footer>
  );
}
```

`app/lib/site.ts`:
```ts
export function siteOrigin(): string | null {
  const v = import.meta.env.VITE_SITE_URL;
  return v ? v.replace(/\/$/, "") : null;
}

export function absoluteUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${siteOrigin() ?? "http://localhost:5173"}${base}${path}`;
}
```

`app/lib/meta.ts`:
```ts
const SITE = "কাতুলীর বাজেট — স্বাধীন নাগরিক উদ্যোগ";

export function pageMeta(title: string, description: string) {
  return [
    { title: `${title} | ${SITE}` },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: SITE },
    { property: "og:locale", content: "bn_BD" },
  ];
}
```

- [ ] **Step 4: Replace `app/root.tsx` with the full layout**

```tsx
import { useEffect, type ReactNode } from "react";
import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";
import "./app.css";
import { BottomNav } from "./components/BottomNav";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { OfflineNotice } from "./components/OfflineNotice";
import { LangProvider } from "./lib/i18n";

export function Layout({ children }: { children: ReactNode }) {
  const base = import.meta.env.BASE_URL;
  return (
    <html lang="bn">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f6b66" />
        <link rel="icon" href={`${base}icon.svg`} type="image/svg+xml" />
        <link rel="manifest" href={`${base}manifest.webmanifest`} />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <LangProvider>
      <Header />
      <main id="main" className="container">
        <OfflineNotice />
        {children}
      </main>
      <Footer />
      <BottomNav />
    </LangProvider>
  );
}

export default function App() {
  useEffect(() => {
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
    }
  }, []);
  return <Shell><Outlet /></Shell>;
}

export function HydrateFallback() {
  return <p className="container">লোড হচ্ছে… / Loading…</p>;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  return (
    <Shell>
      <h1>{notFound ? "পাতাটি পাওয়া যায়নি / Page not found" : "কিছু একটা সমস্যা হয়েছে / Something went wrong"}</h1>
      <p><a href={import.meta.env.BASE_URL}>হোমে ফিরে যান / Go home</a></p>
    </Shell>
  );
}
```

- [ ] **Step 5: Append component CSS to `app/app.css`**

```css
.banner { background: var(--accent-soft); color: var(--ink); font-size: .85rem; padding: 6px 16px; text-align: center; }
.site-header { background: var(--surface); border-bottom: 1px solid var(--line); }
.site-header .bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 16px; max-width: var(--max); margin: 0 auto; }
.brand { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 1.1rem; color: var(--ink); text-decoration: none; }
.brand svg { color: var(--primary); }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 8px 18px; border-radius: 999px; border: 1.5px solid var(--primary); background: var(--surface); color: var(--primary); font: inherit; font-size: 1rem; line-height: 1.2; text-decoration: none; cursor: pointer; }
.btn-primary { background: var(--primary); color: var(--primary-ink); }
.btn-small { min-height: 40px; padding: 6px 14px; font-size: .95rem; }
.card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); padding: 16px; margin: 14px 0; }
.hero-number { font-size: 2.5rem; font-weight: 700; line-height: 1.15; color: var(--primary); margin: .2rem 0; }
.muted { color: var(--ink-2); font-size: .9rem; }
.warn { display: flex; gap: 10px; align-items: flex-start; background: var(--warn-bg); color: var(--warn-ink); border-radius: var(--radius); padding: 12px 14px; margin: 12px 0; }
.warn svg { flex: none; margin-top: 3px; }
.warn a { color: inherit; font-weight: 700; }
.chip { display: inline-flex; align-items: center; gap: 4px; font-size: .78rem; line-height: 1.4; padding: 2px 10px; border-radius: 999px; background: var(--surface-2); color: var(--ink-2); }
.chip a { color: inherit; }
.chip-union { background: var(--primary-soft); color: var(--primary); }
.chip-upstream { background: var(--accent-soft); color: var(--accent); }
.chip-observed { background: var(--observed-bg); color: var(--observed-ink); }
.chip-low { background: var(--warn-bg); color: var(--warn-ink); }
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin: 8px 0; }
.chips a.chip { text-decoration: none; min-height: 36px; padding: 4px 14px; font-size: .95rem; }
.chips a.chip.active { background: var(--primary); color: var(--primary-ink); }
.source { display: inline-flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.small-link { font-size: .85rem; }
.bars { list-style: none; padding: 0; margin: 8px 0 16px; }
.bars li { margin: 12px 0; }
.bars li.hl .bar-name { font-weight: 700; }
.bar-label { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.bar-name { display: flex; align-items: center; gap: 8px; min-width: 0; }
.bar-name svg { flex: none; color: var(--ink-2); }
.bar-label strong { white-space: nowrap; }
.bar-track { height: 12px; background: var(--surface-2); border-radius: 6px; overflow: hidden; margin-top: 4px; }
.bar-fill { height: 100%; border-radius: 6px; }
.tiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
@media (min-width: 560px) { .tiles { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.tile { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; min-height: 100px; padding: 12px; text-align: center; border-radius: var(--radius); background: var(--surface); border: 1px solid var(--line); color: var(--ink); text-decoration: none; font-weight: 600; }
.tile svg { color: var(--primary); }
.bottom-nav { position: fixed; left: 0; right: 0; bottom: 0; z-index: 10; display: flex; justify-content: space-around; background: var(--surface); border-top: 1px solid var(--line); padding: 4px 2px calc(4px + env(safe-area-inset-bottom)); }
.bottom-nav a { display: flex; flex-direction: column; align-items: center; min-width: 56px; min-height: 48px; justify-content: center; padding: 2px 4px; font-size: .75rem; color: var(--ink-2); text-decoration: none; }
.bottom-nav a.active { color: var(--primary); font-weight: 700; }
.site-footer { margin-top: 40px; padding: 24px 0; border-top: 1px solid var(--line); font-size: .9rem; color: var(--ink-2); }
.site-footer nav { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-bottom: 12px; }
.scoreline { font-size: 1.1rem; }
.scorecard { list-style: none; padding: 0; margin: 0; }
.scorecard li { display: flex; gap: 10px; align-items: flex-start; padding: 8px 0; border-bottom: 1px dashed var(--line); }
.grow { flex: 1; min-width: 0; }
.yes { color: var(--good); } .no { color: var(--bad); } .partial { color: var(--accent); }
.share { display: flex; flex-wrap: wrap; gap: 8px; margin: 20px 0; }
.lines { font-size: .92rem; }
.lines th, .lines td { padding: 8px 4px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
.lines td.num { text-align: right; white-space: nowrap; }
details.cat { border-bottom: 1px solid var(--line); padding: 4px 0; }
details.cat > summary { list-style: none; cursor: pointer; }
details.cat > summary::-webkit-details-marker { display: none; }
.kv { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 3fr); gap: 6px 12px; margin: 0; }
.kv dt { color: var(--ink-2); }
.kv dd { margin: 0; font-weight: 600; }
.filters { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0 12px; }
.filters label { display: flex; flex-direction: column; font-size: .85rem; color: var(--ink-2); }
.filters select, .form-grid input, .form-grid select, .form-grid textarea { font: inherit; font-size: 1rem; min-height: 44px; padding: 6px 10px; border-radius: 10px; border: 1px solid var(--line); background: var(--surface); color: var(--ink); }
.list-link { display: block; color: inherit; text-decoration: none; }
.list-link:hover h3 { text-decoration: underline; }
.timeline { list-style: none; margin: 0 0 0 8px; padding: 0; border-left: 3px solid var(--primary-soft); }
.timeline li { position: relative; padding: 0 0 16px 18px; }
.timeline li::before { content: ""; position: absolute; left: -9px; top: 8px; width: 14px; height: 14px; border-radius: 50%; background: var(--primary); }
.photos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; margin-top: 8px; }
.form-grid label { display: block; margin: 12px 0 4px; font-weight: 600; }
.form-grid input, .form-grid select, .form-grid textarea { width: 100%; }
.letter { background: #fff; color: #111; border: 1px solid var(--line); border-radius: 6px; padding: 24px; margin: 16px 0; line-height: 1.8; }
.letter .field { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 3fr); gap: 8px; }
.poster { background: #fff; color: #111; border: 1px solid var(--line); padding: 24px; margin: 16px 0; }
.poster h1 { font-size: 2rem; }
.poster .big { font-size: 2.6rem; font-weight: 700; color: #0f6b66; }
.poster .qr { display: flex; gap: 16px; align-items: center; margin-top: 20px; }
.poster .qr svg { width: 160px; height: 160px; flex: none; }
.print-only { display: none; }
@media print {
  body { background: #fff; color: #000; padding: 0; font-size: 13pt; }
  .banner, .site-header, .bottom-nav, .site-footer, .no-print, .share { display: none !important; }
  .print-only { display: block !important; }
  .card, .poster, .letter { border: 1px solid #999; break-inside: avoid; }
  a { color: #000; text-decoration: none; }
  .rti-page > :not(.letter) { display: none !important; }
  @page { size: A4; margin: 14mm; }
}
```

- [ ] **Step 6: Run tests, typecheck, build.** Run `npm test && npm run typecheck && npm run build`. Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: layout shell, bottom nav and shared UI components"
```

---

### Task 6: Home page, prerender paths, route table

**Files:**
- Create: `app/data/paths.ts`
- Modify: `app/routes.ts` (full table), `react-router.config.ts` (prerender all paths), `app/routes/home.tsx` (real page)
- Create stubs so the route table builds; each is replaced in its own task: `app/routes/{budget,wards,ward,projects,project,tenders,tender,services,allowances,rights,rights-topic,documents,about,poster}.tsx`, each containing `export default function Page() { return <h1>…</h1>; }`
- Create: `app/content/rights.ts` exporting `RIGHTS_TOPICS` (a minimal version is enough for paths; full content in Task 11):

```ts
export type RightsPoint = { bn: string; en: string };
export type RightsSection = { heading_bn: string; heading_en: string; points: RightsPoint[] };
export type RightsLink = { label_bn: string; label_en: string; href: string };
export type RightsTopic = { key: "rti" | "ward-shava" | "open-budget" | "complain"; title_bn: string; title_en: string; summary_bn: string; summary_en: string; sections: RightsSection[]; links: RightsLink[]; source_docs: string[] };
export const RIGHTS_TOPICS: RightsTopic[] = [];
```

- Test: `tests/paths.test.ts`

**Interfaces:**
- Consumes: `loadDataset`, `yearsFor`, `summarizeYear`, `fiscalYearOf`, `fyStart`, `perHousehold`, the components
- Produces: `allPaths(ds: Dataset): string[]`, used by `react-router.config.ts`

- [ ] **Step 1: Write the failing test**

`tests/paths.test.ts`:
```ts
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadDataset } from "../app/data/load.server";
import { allPaths } from "../app/data/paths";

describe("allPaths", () => {
  it("includes every static section, every ward and every dynamic record without duplicates", () => {
    const ds = loadDataset(path.resolve("data"));
    const paths = allPaths(ds);
    for (const p of ["/", "/budget", "/wards", "/projects", "/tenders", "/services", "/allowances", "/rights", "/documents", "/about", "/poster/home/katuli"]) {
      expect(paths).toContain(p);
    }
    for (let n = 1; n <= 9; n++) expect(paths).toContain(`/ward/${n}`);
    for (const p of ds.projects) expect(paths).toContain(`/projects/${p.id}`);
    expect(new Set(paths).size).toBe(paths.length);
  });
});
```

- [ ] **Step 2: Run the test.** Run `npm test -- paths`. Expected: FAIL.

- [ ] **Step 3: Implement `app/data/paths.ts`**

```ts
import { RIGHTS_TOPICS } from "../content/rights";
import { yearsFor } from "../lib/aggregate";
import type { Dataset } from "./schemas";

export function allPaths(ds: Dataset): string[] {
  const wards = ds.union.wards.map((w) => w.no);
  return [
    ...new Set([
      "/",
      "/budget",
      ...yearsFor(ds.budget, ds.union.id).map((y) => `/budget/${y}`),
      "/wards",
      ...wards.map((n) => `/ward/${n}`),
      "/projects",
      ...ds.projects.map((p) => `/projects/${p.id}`),
      "/tenders",
      ...ds.tenders.map((t) => `/tenders/${t.id}`),
      "/services",
      "/allowances",
      "/rights",
      ...RIGHTS_TOPICS.map((t) => `/rights/${t.key}`),
      "/documents",
      "/about",
      `/poster/home/${ds.union.id}`,
      ...wards.map((n) => `/poster/ward/${n}`),
      ...ds.projects.map((p) => `/poster/project/${p.id}`),
    ]),
  ];
}
```

- [ ] **Step 4: Full route table and prerender config**

`app/routes.ts`:
```ts
import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("budget/:year?", "routes/budget.tsx"),
  route("wards", "routes/wards.tsx"),
  route("ward/:no", "routes/ward.tsx"),
  route("projects", "routes/projects.tsx"),
  route("projects/:id", "routes/project.tsx"),
  route("tenders", "routes/tenders.tsx"),
  route("tenders/:id", "routes/tender.tsx"),
  route("services", "routes/services.tsx"),
  route("allowances", "routes/allowances.tsx"),
  route("rights", "routes/rights.tsx"),
  route("rights/:topic", "routes/rights-topic.tsx"),
  route("documents", "routes/documents.tsx"),
  route("about", "routes/about.tsx"),
  route("poster/:kind/:id", "routes/poster.tsx"),
] satisfies RouteConfig;
```

`react-router.config.ts`:
```ts
import type { Config } from "@react-router/dev/config";

export default {
  ssr: false,
  basename: process.env.BASE_PATH ?? "/",
  async prerender() {
    const { loadDataset } = await import("./app/data/load.server");
    const { allPaths } = await import("./app/data/paths");
    return allPaths(loadDataset());
  },
} satisfies Config;
```

- [ ] **Step 5: Implement `app/routes/home.tsx`**

```tsx
import { AlertTriangle } from "lucide-react";
import { Link, useLoaderData } from "react-router";
import { Bars } from "../components/Bars";
import { DisclosureStrip } from "../components/DisclosureStrip";
import { SectionTiles } from "../components/SectionTiles";
import { ShareButtons } from "../components/ShareButtons";
import { categoryItems } from "../data/categories";
import { loadDataset } from "../data/load.server";
import { fiscalYearOf, fyStart, summarizeYear, yearsFor } from "../lib/aggregate";
import { perHousehold } from "../lib/format";
import { useFmt, useT } from "../lib/i18n";
import { KIND_LABEL } from "../lib/labels";
import { pageMeta } from "../lib/meta";

const TITLE = "কাতুলী ইউনিয়নের টাকা কোথা থেকে আসে, কোথায় যায়?";

export function meta() {
  return pageMeta(TITLE, "কাতুলী ইউনিয়ন পরিষদ, টাঙ্গাইল সদর — বাজেট, প্রকল্প, দরপত্র, সেবার ফি, ভাতা ও আপনার অধিকার। স্বাধীন নাগরিক উদ্যোগ।");
}

export async function loader() {
  const ds = loadDataset();
  const id = ds.union.id;
  const latest = yearsFor(ds.budget, id)[0] ?? null;
  const latestUnionYear = yearsFor(ds.budget.filter((l) => l.source_type === "union"), id)[0] ?? null;
  return {
    union: { id, households: ds.union.households, census_year: ds.union.census_year },
    summary: latest ? summarizeYear(ds.budget, ds.reportedTotals, id, latest) : null,
    latestUnionYear,
    currentFy: fiscalYearOf(new Date()),
    disclosures: ds.disclosures.map(({ id, requirement_bn, requirement_en, published }) => ({ id, requirement_bn, requirement_en, published })),
  };
}

export default function Home() {
  const { union, summary, latestUnionYear, currentFy, disclosures } = useLoaderData<typeof loader>();
  const t = useT();
  const f = useFmt();
  const headline = summary ? summary.reportedIncome ?? summary.income : null;
  const reconstructed = summary ? !summary.sourceTypes.includes("union") : false;
  const staleYears = latestUnionYear ? fyStart(currentFy) - fyStart(latestUnionYear) : null;
  const perHh = headline !== null ? perHousehold(headline, union.households) : null;

  return (
    <>
      <h1>{t(TITLE, "Where does Katuli Union's money come from, and where does it go?")}</h1>

      {staleYears === null ? (
        <div className="warn" role="alert">
          <AlertTriangle aria-hidden />
          <p>
            {t("কাতুলী ইউনিয়ন পরিষদের প্রকাশিত কোনো বাজেট আমরা খুঁজে পাইনি। ", "We could not find any budget published by Katuli Union Parishad. ")}
            <Link to="/rights/rti?item=budget-current">{t("বাজেট চেয়ে আবেদন করুন →", "Request it →")}</Link>
          </p>
        </div>
      ) : staleYears >= 2 ? (
        <div className="warn" role="alert">
          <AlertTriangle aria-hidden />
          <p>
            {t(
              `ইউনিয়ন পরিষদের নিজের প্রকাশিত সর্বশেষ বাজেট ${f.fy(latestUnionYear!)} অর্থবছরের — ${f.digits(staleYears)} বছর আগের। আইন অনুযায়ী প্রতি বছর প্রকাশ্য সভায় বাজেট দেওয়ার কথা। `,
              `The Union Parishad's own latest published budget is for FY ${latestUnionYear} — ${staleYears} years old. By law a budget must be presented publicly every year. `,
            )}
            <Link to="/rights/rti?item=budget-current">{t("চলতি বাজেট চেয়ে আবেদন করুন →", "Request the current budget →")}</Link>
          </p>
        </div>
      ) : null}

      {summary && headline !== null ? (
        <section className="card" aria-labelledby="hero-label">
          <p id="hero-label" className="muted">
            {reconstructed
              ? t(`${f.fy(summary.fiscalYear)} অর্থবছরে অন্তত এত টাকা এসেছে (অন্য সরকারি অফিসের তালিকা থেকে হিসাব — আংশিক)`, `At least this much came in FY ${summary.fiscalYear} (from other offices' lists — partial)`)
              : t(`${f.fy(summary.fiscalYear)} অর্থবছরের মোট আয় (${KIND_LABEL[summary.kind].bn} বাজেট)`, `Total income, FY ${summary.fiscalYear} (${KIND_LABEL[summary.kind].en} budget)`)}
          </p>
          <p className="hero-number">{f.taka(headline)}</p>
          {perHh !== null ? (
            <p>
              {t(`মানে প্রতি পরিবারের জন্য প্রায় ${f.takaFull(perHh)}`, `About ${f.takaFull(perHh)} per household`)}{" "}
              <span className="muted">({t(`${f.num(union.households)} পরিবার, আদমশুমারি ${f.digits(union.census_year)}`, `${f.num(union.households)} households, census ${union.census_year}`)})</span>
            </p>
          ) : null}
          <h2 className="h3">{t("কোথা থেকে আসে", "Where it comes from")}</h2>
          <Bars tone="income" items={categoryItems(summary.incomeByCategory, f.lang)} />
          <h2 className="h3">{t("কোথায় খরচ হয়", "Where it goes")}</h2>
          <Bars tone="expense" items={categoryItems(summary.expenseByCategory, f.lang)} />
          <Link className="btn btn-primary" to={`/budget/${summary.fiscalYear}`}>{t("পুরো হিসাব দেখুন", "See the full budget")}</Link>
        </section>
      ) : null}

      <DisclosureStrip items={disclosures} />

      <h2>{t("আরও দেখুন", "Explore")}</h2>
      <SectionTiles />

      <ShareButtons title={t(TITLE, "Katuli Union budget")} />
      <p className="no-print"><Link to={`/poster/home/${union.id}`}>{t("নোটিশ বোর্ডের জন্য পোস্টার প্রিন্ট করুন", "Print a notice-board poster")}</Link></p>
    </>
  );
}
```

- [ ] **Step 6: Run tests and build.** Run `npm test && npm run build`. Expected: PASS, and `build/client/index.html` exists, as do `build/client/ward/1/index.html` through `build/client/ward/9/index.html`.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: home page with headline, per-household figure, disclosure scorecard; prerender every route"
```

---

### Task 7: Budget explorer with neighbour comparison

**Files:**
- Modify: `app/routes/budget.tsx`
- Test: `tests/budget-page.test.tsx`

**Interfaces:**
- Consumes: `summarizeYear`, `compareUnions`, `yearsFor`, `docRefs`, `categoryItems`, `CATEGORIES`, `Bars`, `SourceBadge`, `Amount`, `KIND_LABEL`
- Produces: `CategoryList` (local to this file), `EmptyYear` (exported for reuse in tests)

- [ ] **Step 1: Write the failing test** (it renders the page component with a stubbed loader via `createRoutesStub`)

`tests/budget-page.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { createRoutesStub } from "react-router";
import { describe, expect, it } from "vitest";
import Budget from "../app/routes/budget";
import { LangProvider } from "../app/lib/i18n";

function renderWith(data: unknown) {
  const Stub = createRoutesStub([{ path: "/budget/:year?", Component: Budget as never, loader: () => data, HydrateFallback: () => null }]);
  return render(<LangProvider><Stub initialEntries={["/budget"]} /></LangProvider>);
}

describe("budget page", () => {
  it("shows the not-published state with an RTI link when a year has no data", async () => {
    renderWith({ unionId: "katuli", households: 6433, years: [], fy: null, summary: null, comparison: [], docs: {} });
    expect(await screen.findByText(/তথ্য প্রকাশিত হয়নি/)).toBeTruthy();
    expect(screen.getByRole("link", { name: /চেয়ে আবেদন/ }).getAttribute("href")).toBe("/rights/rti?item=budget-current");
  });

  it("shows অজানা per household when a neighbour's households are unknown", async () => {
    renderWith({
      unionId: "katuli", households: 6433, years: [], fy: null, summary: null, docs: {},
      comparison: [{ id: "silimpur", name_bn: "সিলিমপুর", name_en: "Silimpur", fiscalYear: "2023-24", kind: "proposed", income: 18442514, perHousehold: null }],
    });
    expect(await screen.findByText(/সিলিমপুর/)).toBeTruthy();
    expect(screen.getAllByText("অজানা").length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run the test.** Run `npm test -- budget-page`. Expected: FAIL.

- [ ] **Step 3: Implement `app/routes/budget.tsx`**

```tsx
import { AlertTriangle, ChevronDown } from "lucide-react";
import { data, Link, useLoaderData } from "react-router";
import type { Route } from "./+types/budget";
import { Amount } from "../components/Amount";
import { Bars } from "../components/Bars";
import { ShareButtons } from "../components/ShareButtons";
import { SourceBadge } from "../components/SourceBadge";
import { CATEGORIES } from "../data/categories";
import { loadDataset } from "../data/load.server";
import { docRefs, type DocRef } from "../data/refs";
import { compareUnions, summarizeYear, yearsFor, type CategoryTotal } from "../lib/aggregate";
import { perHousehold, toBnDigits } from "../lib/format";
import { useFmt, useT } from "../lib/i18n";
import { KIND_LABEL } from "../lib/labels";
import { pageMeta } from "../lib/meta";

export function meta({ data }: Route.MetaArgs) {
  const fy = data?.fy ? ` ${toBnDigits(data.fy)}` : "";
  return pageMeta(`কাতুলী ইউনিয়নের বাজেট${fy}`, "আয় কোথা থেকে, খরচ কোথায় — খাতওয়ারি হিসাব, উৎসসহ। পাশের ইউনিয়নের সাথে তুলনা।");
}

export async function loader({ params }: Route.LoaderArgs) {
  const ds = loadDataset();
  const id = ds.union.id;
  const years = yearsFor(ds.budget, id);
  if (params.year && !years.includes(params.year)) throw data(null, { status: 404 });
  const fy = params.year ?? years[0] ?? null;
  const summary = fy ? summarizeYear(ds.budget, ds.reportedTotals, id, fy) : null;
  const comparison = compareUnions(ds.budget, ds.reportedTotals, [
    { id, name_bn: ds.union.name_bn, name_en: ds.union.name_en, households: ds.union.households },
    ...ds.union.comparisons,
  ]);
  const docIds = summary ? [...summary.incomeByCategory, ...summary.expenseByCategory].flatMap((c) => c.lines.map((l) => l.source_doc)) : [];
  return { unionId: id, households: ds.union.households, years, fy, summary, comparison, docs: docRefs(ds.documents, docIds) };
}

function CategoryList({ cats, tone, docs }: { cats: CategoryTotal[]; tone: "income" | "expense"; docs: Record<string, DocRef> }) {
  const f = useFmt();
  const t = useT();
  return (
    <div>
      {cats.map((c) => {
        const cat = CATEGORIES[c.category];
        return (
          <details key={c.category} className="cat">
            <summary>
              <Bars tone={tone} items={[{ key: c.category, label: cat[f.lang], amount: c.amount, icon: cat.icon }]} />
              <span className="muted small-link"><ChevronDown size={16} aria-hidden /> {t(`${f.digits(c.lines.length)}টি খাত দেখুন`, `See ${c.lines.length} line items`)}</span>
            </summary>
            <table className="lines">
              <thead><tr><th>{t("খাত", "Head")}</th><th className="num">{t("টাকা", "Taka")}</th><th>{t("উৎস", "Source")}</th></tr></thead>
              <tbody>
                {c.lines.map((l, i) => (
                  <tr key={i}>
                    <td>{f.lang === "en" && l.head_en ? l.head_en : l.head_bn}</td>
                    <td className="num">{f.takaFull(l.amount)}</td>
                    <td><SourceBadge type={l.source_type} doc={docs[l.source_doc]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        );
      })}
    </div>
  );
}

export function EmptyYear() {
  const t = useT();
  return (
    <div className="warn" role="status">
      <AlertTriangle aria-hidden />
      <p>
        {t("এই বছরের বাজেটের তথ্য প্রকাশিত হয়নি। ", "This year's budget has not been published. ")}
        <Link to="/rights/rti?item=budget-current">{t("তথ্য অধিকার আইনে চেয়ে আবেদন করুন →", "Request it under the RTI Act →")}</Link>
      </p>
    </div>
  );
}

export default function Budget() {
  const { unionId, households, years, fy, summary, comparison, docs } = useLoaderData<typeof loader>();
  const t = useT();
  const f = useFmt();
  const lowReliability = Object.values(docs).some((d) => d.reliability === "low");
  const reconstructed = summary ? !summary.sourceTypes.includes("union") : false;
  const income = summary ? summary.reportedIncome ?? summary.income : null;

  return (
    <>
      <h1>{t("বাজেট", "Budget")}{fy ? ` ${f.fy(fy)}` : ""}</h1>
      {years.length > 0 ? (
        <nav className="chips" aria-label={t("অর্থবছর", "Fiscal year")}>
          {years.map((y) => (
            <Link key={y} to={`/budget/${y}`} className={`chip${y === fy ? " active" : ""}`} aria-current={y === fy ? "page" : undefined}>{f.fy(y)}</Link>
          ))}
        </nav>
      ) : null}

      {!summary ? <EmptyYear /> : (
        <>
          {reconstructed ? (
            <div className="warn"><AlertTriangle aria-hidden /><p>{t("ইউনিয়ন পরিষদ এই বছরের বাজেট প্রকাশ করেনি। নিচের সংখ্যাগুলো উপজেলা/জেলা/মন্ত্রণালয়ের বরাদ্দ তালিকা থেকে নেওয়া — তাই আংশিক।", "The Union Parishad did not publish this year's budget. These figures come from upazila/district/ministry allocation lists, so they are partial.")}</p></div>
          ) : null}
          {lowReliability ? (
            <div className="warn"><AlertTriangle aria-hidden /><p>{t("উৎস নথিতে অসঙ্গতি আছে (যেমন দুটি ভিন্ন তারিখ/সভাপতির নাম)। সংখ্যাগুলো সাবধানে ব্যবহার করুন।", "The source document has inconsistencies (e.g. two different dates or chairs). Use these figures with care.")}</p></div>
          ) : null}

          <section className="card">
            <p className="muted">{t(`${KIND_LABEL[summary.kind].bn} বাজেট`, `${KIND_LABEL[summary.kind].en} budget`)}</p>
            <dl className="kv">
              <dt>{t("মোট আয়", "Total income")}</dt><dd><Amount value={income} full /></dd>
              <dt>{t("মোট খরচ", "Total spending")}</dt><dd><Amount value={summary.reportedExpense ?? summary.expense} full /></dd>
              <dt>{t("প্রতি পরিবারে আয়", "Income per household")}</dt><dd><Amount value={income !== null ? perHousehold(income, households) : null} full /></dd>
            </dl>
            {summary.reportedIncome !== null && summary.reportedIncome !== summary.income ? (
              <p className="muted">{t(
                `নথিতে লেখা মোট আয় ${f.takaFull(summary.reportedIncome)}, কিন্তু খাতগুলো যোগ করলে হয় ${f.takaFull(summary.income)}। পার্থক্য: ${f.takaFull(Math.abs(summary.reportedIncome - summary.income))}।`,
                `The document states total income of ${f.takaFull(summary.reportedIncome)}, but its line items add up to ${f.takaFull(summary.income)}. Difference: ${f.takaFull(Math.abs(summary.reportedIncome - summary.income))}.`,
              )}</p>
            ) : null}
            {summary.reportedExpense !== null && summary.reportedExpense !== summary.expense ? (
              <p className="muted">{t(
                `নথিতে লেখা মোট খরচ ${f.takaFull(summary.reportedExpense)}, খাতগুলোর যোগফল ${f.takaFull(summary.expense)}।`,
                `The document states total spending of ${f.takaFull(summary.reportedExpense)}; line items add up to ${f.takaFull(summary.expense)}.`,
              )}</p>
            ) : null}
          </section>

          <h2>{t("আয় কোথা থেকে", "Where the money comes from")}</h2>
          <CategoryList cats={summary.incomeByCategory} tone="income" docs={docs} />
          <h2>{t("খরচ কোথায়", "Where it is spent")}</h2>
          <CategoryList cats={summary.expenseByCategory} tone="expense" docs={docs} />
        </>
      )}

      {comparison.length > 0 ? (
        <section>
          <h2>{t("পাশের ইউনিয়নের সাথে তুলনা (প্রতি পরিবারে আয়)", "Compared with neighbouring unions (income per household)")}</h2>
          <p className="muted">{t("প্রতিটি ইউনিয়নের সর্বশেষ পাওয়া বছরের তথ্য — বছর আলাদা হতে পারে, তাই সরাসরি তুলনায় সাবধান।", "Each union's latest available year — years differ, so compare with care.")}</p>
          <Bars tone="income" format="takaFull" items={comparison.map((c) => ({ key: c.id, label: f.lang === "bn" ? c.name_bn : c.name_en, note: f.fy(c.fiscalYear), amount: c.perHousehold, highlight: c.id === unionId }))} />
        </section>
      ) : null}

      <ShareButtons title={t("কাতুলী ইউনিয়নের বাজেট", "Katuli Union budget")} />
    </>
  );
}
```

- [ ] **Step 4: Run tests and build.** Run `npm test && npm run typecheck && npm run build`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: budget explorer with line items, source badges, totals check and neighbour comparison"
```

---

### Task 8: Wards, projects and verification timeline

**Files:**
- Modify: `app/routes/wards.tsx`, `app/routes/ward.tsx`, `app/routes/projects.tsx`, `app/routes/project.tsx`
- Test: `tests/projects-filter.test.ts`
- Create: `app/lib/projects.ts`

**Interfaces:**
- Produces: `filterProjects(projects, {ward, scheme, status}): ProjectRow[]` in `app/lib/projects.ts`. An empty-string filter means "all".

- [ ] **Step 1: Write the failing test**

`tests/projects-filter.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { filterProjects } from "../app/lib/projects";
import type { ProjectRow } from "../app/data/schemas";

const P = (o: Partial<ProjectRow>): ProjectRow => ({ id: "p", fiscal_year: null, name_bn: "প", name_en: null, scheme: "adp", ward: 1, village_bn: null, lat: null, lng: null, amount: null, unit_of_work_bn: null, implementer_bn: null, start: null, end: null, status: "unknown", source_type: "union", source_doc: "d", up_reply_bn: null, status_row: "published", ...o });

describe("filterProjects", () => {
  const list = [P({ id: "a", ward: 1, scheme: "adp" }), P({ id: "b", ward: 2, scheme: "tr", status: "completed" }), P({ id: "c", ward: null, scheme: "tr" })];
  it("returns all when filters are empty", () => {
    expect(filterProjects(list, { ward: "", scheme: "", status: "" }).map((p) => p.id)).toEqual(["a", "b", "c"]);
  });
  it("combines filters", () => {
    expect(filterProjects(list, { ward: "", scheme: "tr", status: "" }).map((p) => p.id)).toEqual(["b", "c"]);
    expect(filterProjects(list, { ward: "2", scheme: "tr", status: "completed" }).map((p) => p.id)).toEqual(["b"]);
  });
  it("supports the 'no ward' option", () => {
    expect(filterProjects(list, { ward: "none", scheme: "", status: "" }).map((p) => p.id)).toEqual(["c"]);
  });
});
```

- [ ] **Step 2: Run the test.** Run `npm test -- projects-filter`. Expected: FAIL.

- [ ] **Step 3: Implement `app/lib/projects.ts`**

```ts
import type { ProjectRow } from "../data/schemas";

export type ProjectFilter = { ward: string; scheme: string; status: string };

export function filterProjects(projects: ProjectRow[], f: ProjectFilter): ProjectRow[] {
  return projects.filter((p) =>
    (f.ward === "" || (f.ward === "none" ? p.ward === null : String(p.ward) === f.ward)) &&
    (f.scheme === "" || p.scheme === f.scheme) &&
    (f.status === "" || p.status === f.status),
  );
}
```

- [ ] **Step 4: Implement `app/routes/projects.tsx`**

```tsx
import { useState } from "react";
import { Link, useLoaderData } from "react-router";
import { Amount } from "../components/Amount";
import { loadDataset } from "../data/load.server";
import { PROJECT_STATUSES, SCHEMES } from "../data/schemas";
import { useFmt, useT } from "../lib/i18n";
import { PROJECT_STATUS_LABEL, SCHEME_LABEL } from "../lib/labels";
import { pageMeta } from "../lib/meta";
import { filterProjects } from "../lib/projects";

export function meta() {
  return pageMeta("কাতুলী ইউনিয়নের উন্নয়ন প্রকল্প", "কোন ওয়ার্ডে কোন প্রকল্প, কত টাকা, কাজের অবস্থা — এবং স্বেচ্ছাসেবকদের সরেজমিন পর্যবেক্ষণ।");
}

export async function loader() {
  const ds = loadDataset();
  const visits = new Map<string, number>();
  for (const v of ds.verifications) visits.set(v.project_id, (visits.get(v.project_id) ?? 0) + 1);
  return { projects: ds.projects, visits: Object.fromEntries(visits) };
}

export default function Projects() {
  const { projects, visits } = useLoaderData<typeof loader>();
  const t = useT();
  const f = useFmt();
  const [filter, setFilter] = useState({ ward: "", scheme: "", status: "" });
  const shown = filterProjects(projects, filter);
  const set = (k: keyof typeof filter) => (e: React.ChangeEvent<HTMLSelectElement>) => setFilter({ ...filter, [k]: e.target.value });

  return (
    <>
      <h1>{t("উন্নয়ন প্রকল্প", "Development projects")}</h1>
      <p>{t("প্রতিটি প্রকল্পে কত টাকা বরাদ্দ, কে বাস্তবায়ন করছে, আর সরেজমিনে কী দেখা গেছে।", "What each project was allocated, who implements it, and what was seen on site.")}</p>
      <div className="filters">
        <label>{t("ওয়ার্ড", "Ward")}
          <select value={filter.ward} onChange={set("ward")}>
            <option value="">{t("সব", "All")}</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => <option key={n} value={String(n)}>{f.digits(n)}</option>)}
            <option value="none">{t("উল্লেখ নেই", "Not stated")}</option>
          </select>
        </label>
        <label>{t("কর্মসূচি", "Scheme")}
          <select value={filter.scheme} onChange={set("scheme")}>
            <option value="">{t("সব", "All")}</option>
            {SCHEMES.map((s) => <option key={s} value={s}>{SCHEME_LABEL[s][f.lang]}</option>)}
          </select>
        </label>
        <label>{t("অবস্থা", "Status")}
          <select value={filter.status} onChange={set("status")}>
            <option value="">{t("সব", "All")}</option>
            {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{PROJECT_STATUS_LABEL[s][f.lang]}</option>)}
          </select>
        </label>
      </div>
      <p className="muted">{t(`${f.digits(shown.length)}টি প্রকল্প`, `${shown.length} projects`)}</p>
      {shown.map((p) => (
        <Link key={p.id} to={`/projects/${p.id}`} className="card list-link">
          <h3>{f.lang === "en" && p.name_en ? p.name_en : p.name_bn}</h3>
          <div className="chips">
            <span className="chip">{SCHEME_LABEL[p.scheme][f.lang]}</span>
            <span className="chip">{p.ward ? t(`ওয়ার্ড ${f.digits(p.ward)}`, `Ward ${p.ward}`) : t("ওয়ার্ড উল্লেখ নেই", "Ward not stated")}</span>
            <span className="chip">{PROJECT_STATUS_LABEL[p.status][f.lang]}</span>
            {visits[p.id] ? <span className="chip chip-observed">{t(`${f.digits(visits[p.id])} বার সরেজমিনে দেখা`, `Visited ${visits[p.id]}×`)}</span> : null}
          </div>
          <p><Amount value={p.amount} full /></p>
        </Link>
      ))}
    </>
  );
}
```

- [ ] **Step 5: Implement `app/routes/project.tsx`**

```tsx
import { MessageCircle, Phone } from "lucide-react";
import { data, Link, useLoaderData } from "react-router";
import type { Route } from "./+types/project";
import { Amount } from "../components/Amount";
import { ShareButtons } from "../components/ShareButtons";
import { SourceBadge } from "../components/SourceBadge";
import { Unknown } from "../components/Unknown";
import { loadDataset } from "../data/load.server";
import { docRefs } from "../data/refs";
import { useFmt, useT } from "../lib/i18n";
import { OBSERVED_LABEL, PROJECT_STATUS_LABEL, SCHEME_LABEL } from "../lib/labels";
import { pageMeta } from "../lib/meta";

export function meta({ data }: Route.MetaArgs) {
  if (!data) return pageMeta("প্রকল্প", "");
  return pageMeta(data.project.name_bn, "কাতুলী ইউনিয়নের প্রকল্প — বরাদ্দ, বাস্তবায়নকারী, সরেজমিন পর্যবেক্ষণ। আপনি কী দেখেছেন জানান।");
}

export async function loader({ params }: Route.LoaderArgs) {
  const ds = loadDataset();
  const project = ds.projects.find((p) => p.id === params.id);
  if (!project) throw data(null, { status: 404 });
  return {
    project,
    visits: ds.verifications.filter((v) => v.project_id === project.id).sort((a, b) => b.visit_date.localeCompare(a.visit_date)),
    tenders: ds.tenders.filter((t) => t.project_id === project.id).map((t) => ({ id: t.id, title_bn: t.title_bn })),
    docs: docRefs(ds.documents, [project.source_doc]),
    whatsapp: ds.union.maintainer.whatsapp,
  };
}

export default function Project() {
  const { project: p, visits, tenders, docs, whatsapp } = useLoaderData<typeof loader>();
  const t = useT();
  const f = useFmt();
  const name = f.lang === "en" && p.name_en ? p.name_en : p.name_bn;
  const reportText = `প্রকল্প: ${p.name_bn} (${p.id})\nআমি যা দেখেছি (তারিখ ও স্থানসহ): `;
  const base = import.meta.env.BASE_URL;

  return (
    <>
      <p className="no-print"><Link to="/projects">← {t("সব প্রকল্প", "All projects")}</Link></p>
      <h1>{name}</h1>
      <section className="card">
        <dl className="kv">
          <dt>{t("বরাদ্দ", "Allocation")}</dt><dd><Amount value={p.amount} full /></dd>
          <dt>{t("কর্মসূচি", "Scheme")}</dt><dd>{SCHEME_LABEL[p.scheme][f.lang]}</dd>
          <dt>{t("অর্থবছর", "Fiscal year")}</dt><dd>{p.fiscal_year ? f.fy(p.fiscal_year) : <Unknown />}</dd>
          <dt>{t("ওয়ার্ড / গ্রাম", "Ward / village")}</dt><dd>{p.ward ? f.digits(p.ward) : <Unknown />}{p.village_bn ? ` · ${p.village_bn}` : ""}</dd>
          <dt>{t("কাজের পরিমাণ", "Scope of work")}</dt><dd>{p.unit_of_work_bn ?? <Unknown />}</dd>
          <dt>{t("বাস্তবায়নকারী (পিআইসি/ঠিকাদার)", "Implementer (PIC/contractor)")}</dt><dd>{p.implementer_bn ?? <Unknown />}</dd>
          <dt>{t("শুরু – শেষ", "Start – end")}</dt><dd>{p.start ? f.date(p.start) : "?"} – {p.end ? f.date(p.end) : "?"}</dd>
          <dt>{t("নথি অনুযায়ী অবস্থা", "Status per documents")}</dt><dd>{PROJECT_STATUS_LABEL[p.status][f.lang]}</dd>
          <dt>{t("উৎস", "Source")}</dt><dd><SourceBadge type={p.source_type} doc={docs[p.source_doc]} /></dd>
        </dl>
        {tenders.length > 0 ? <p>{t("সংশ্লিষ্ট দরপত্র: ", "Related tender: ")}{tenders.map((x) => <Link key={x.id} to={`/tenders/${x.id}`}>{x.title_bn}</Link>)}</p> : null}
      </section>

      <h2>{t("সরেজমিনে যা দেখা গেছে", "What was seen on site")}</h2>
      {visits.length === 0 ? (
        <p className="muted">{t("এখনো কোনো স্বেচ্ছাসেবক এই প্রকল্প দেখে আসেননি। আপনি দেখে এলে জানান।", "No volunteer has visited yet. If you go, tell us what you see.")}</p>
      ) : (
        <ol className="timeline">
          {visits.map((v, i) => (
            <li key={i}>
              <strong>{f.date(v.visit_date)}</strong> · <span className="chip chip-observed">{OBSERVED_LABEL[v.observed_status][f.lang]}</span>
              <p>{v.observation_bn}</p>
              {v.measured ? <p className="muted">{t("মাপ: ", "Measured: ")}{v.measured}</p> : null}
              {v.photo_paths.length > 0 ? (
                <div className="photos">{v.photo_paths.map((src) => <img key={src} src={`${base}${src}`} alt={t(`${f.date(v.visit_date)} তারিখের ছবি`, `Photo from ${v.visit_date}`)} loading="lazy" />)}</div>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      <h2>{t("ইউনিয়ন পরিষদের বক্তব্য", "Union Parishad's response")}</h2>
      <p>{p.up_reply_bn ?? t("এখনো কোনো বক্তব্য পাওয়া যায়নি। ইউনিয়ন পরিষদ চাইলে তাদের বক্তব্য এখানে যোগ করা হবে।", "No response yet. If the Union Parishad sends one, it will be added here.")}</p>

      <section className="card no-print">
        <h2 className="h3">{t("আপনি কী দেখেছেন জানান", "Tell us what you saw")}</h2>
        <p>{t("ছবি তুললে তারিখ ও জায়গা লিখে রাখুন। কারো নাম ধরে প্রকাশ্যে অভিযোগ পোস্ট করবেন না — নিচের সরকারি মাধ্যম ব্যবহার করুন।", "If you take photos, note the date and place. Don't post accusations naming people publicly — use the official channels below.")}</p>
        <div className="share">
          {whatsapp ? <a className="btn btn-primary" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(reportText)}`} target="_blank" rel="noopener"><MessageCircle size={18} aria-hidden />{t("আমাদের হোয়াটসঅ্যাপে জানান", "Tell us on WhatsApp")}</a> : null}
          <a className="btn" href="https://www.grs.gov.bd/" target="_blank" rel="noopener">{t("সরকারি অভিযোগ (GRS)", "Official complaint (GRS)")}</a>
          <a className="btn" href="tel:106"><Phone size={18} aria-hidden />{t("দুদক ১০৬ (ফ্রি)", "ACC 106 (free)")}</a>
        </div>
      </section>

      <ShareButtons title={name} />
      <p className="no-print"><Link to={`/poster/project/${p.id}`}>{t("প্রকল্প-পোস্টার প্রিন্ট করুন", "Print a project poster")}</Link></p>
    </>
  );
}
```

- [ ] **Step 6: Implement `app/routes/wards.tsx` and `app/routes/ward.tsx`**

`app/routes/wards.tsx`:
```tsx
import { Link, useLoaderData } from "react-router";
import { loadDataset } from "../data/load.server";
import { useFmt, useT } from "../lib/i18n";
import { pageMeta } from "../lib/meta";

export function meta() {
  return pageMeta("কাতুলী ইউনিয়নের ৯টি ওয়ার্ড", "আপনার ওয়ার্ডের প্রকল্প, ভাতা ও ওয়ার্ড সভার তথ্য।");
}

export async function loader() {
  const ds = loadDataset();
  return {
    wards: ds.union.wards.map((w) => ({ ...w, projects: ds.projects.filter((p) => p.ward === w.no).length })),
    villages_bn: ds.union.villages_bn,
    villages_en: ds.union.villages_en,
  };
}

export default function Wards() {
  const { wards, villages_bn, villages_en } = useLoaderData<typeof loader>();
  const t = useT();
  const f = useFmt();
  const villages = f.lang === "en" && villages_en.length ? villages_en : villages_bn;
  return (
    <>
      <h1>{t("আমার ওয়ার্ড", "My ward")}</h1>
      <p>{t("আপনার ওয়ার্ড বেছে নিন।", "Choose your ward.")}</p>
      <div className="tiles">
        {wards.map((w) => (
          <Link key={w.no} to={`/ward/${w.no}`} className="tile">
            <span className="hero-number">{f.digits(w.no)}</span>
            {t(`${f.digits(w.projects)}টি প্রকল্প`, `${w.projects} projects`)}
          </Link>
        ))}
      </div>
      {villages.length > 0 ? (
        <section className="card">
          <h2 className="h3">{t(`ইউনিয়নের ${f.digits(villages.length)}টি গ্রাম`, `The union's ${villages.length} villages`)}</h2>
          <p>{villages.join(", ")}</p>
          <p className="muted">{t("কোন গ্রাম কোন ওয়ার্ডে — পুরো তালিকা এখনো যাচাই হয়নি।", "Which village is in which ward has not been fully verified yet.")}</p>
        </section>
      ) : null}
    </>
  );
}
```

`app/routes/ward.tsx`:
```tsx
import { data, Link, useLoaderData } from "react-router";
import type { Route } from "./+types/ward";
import { Amount } from "../components/Amount";
import { ShareButtons } from "../components/ShareButtons";
import { Unknown } from "../components/Unknown";
import { loadDataset } from "../data/load.server";
import { toBnDigits } from "../lib/format";
import { useFmt, useT } from "../lib/i18n";
import { PROJECT_STATUS_LABEL, SCHEME_LABEL } from "../lib/labels";
import { pageMeta } from "../lib/meta";

export function meta({ params }: Route.MetaArgs) {
  return pageMeta(`কাতুলী ইউনিয়ন — ${toBnDigits(params.no ?? "")} নং ওয়ার্ড`, "এই ওয়ার্ডের প্রকল্প, ভাতাভোগীর সংখ্যা ও ওয়ার্ড সভায় আপনার অধিকার।");
}

export async function loader({ params }: Route.LoaderArgs) {
  const ds = loadDataset();
  const ward = ds.union.wards.find((w) => String(w.no) === params.no);
  if (!ward) throw data(null, { status: 404 });
  return {
    ward,
    projects: ds.projects.filter((p) => p.ward === ward.no),
    allowances: ds.allowances.map((a) => ({
      programme: a.programme, name_bn: a.name_bn, name_en: a.name_en,
      count: ds.allowanceCounts.find((c) => c.programme === a.programme && c.ward === ward.no)?.beneficiary_count ?? null,
    })),
  };
}

export default function Ward() {
  const { ward, projects, allowances } = useLoaderData<typeof loader>();
  const t = useT();
  const f = useFmt();
  const villages = f.lang === "en" && ward.villages_en.length ? ward.villages_en : ward.villages_bn;
  return (
    <>
      <p className="no-print"><Link to="/wards">← {t("সব ওয়ার্ড", "All wards")}</Link></p>
      <h1>{t(`${f.digits(ward.no)} নং ওয়ার্ড`, `Ward ${ward.no}`)}</h1>
      <section className="card">
        <dl className="kv">
          <dt>{t("গ্রাম", "Villages")}</dt><dd>{villages.length ? villages.join(", ") : <Unknown />}</dd>
          <dt>{t("ওয়ার্ড সদস্য", "Ward member")}</dt>
          <dd>{ward.member_bn ?? <Unknown />}{ward.member_bn && !ward.member_verified_on ? <span className="muted"> ({t("যাচাই হয়নি", "unverified")})</span> : null}</dd>
        </dl>
      </section>

      <h2>{t("এই ওয়ার্ডের প্রকল্প", "Projects in this ward")}</h2>
      {projects.length === 0 ? <p className="muted">{t("কোনো প্রকল্পের তথ্য পাওয়া যায়নি।", "No project information found.")} <Link to="/rights/rti?item=project-list">{t("প্রকল্প তালিকা চেয়ে নিন →", "Request the project list →")}</Link></p> : (
        <table className="lines">
          <tbody>{projects.map((p) => (
            <tr key={p.id}>
              <td><Link to={`/projects/${p.id}`}>{p.name_bn}</Link><br /><span className="muted">{SCHEME_LABEL[p.scheme][f.lang]} · {PROJECT_STATUS_LABEL[p.status][f.lang]}</span></td>
              <td className="num"><Amount value={p.amount} full /></td>
            </tr>
          ))}</tbody>
        </table>
      )}

      <h2>{t("এই ওয়ার্ডে ভাতাভোগী (সংখ্যা)", "Allowance recipients in this ward (counts)")}</h2>
      <table className="lines">
        <tbody>{allowances.map((a) => (
          <tr key={a.programme}><td>{f.lang === "bn" ? a.name_bn : a.name_en}</td><td className="num">{a.count === null ? <Unknown rti="beneficiary-counts" /> : f.num(a.count)}</td></tr>
        ))}</tbody>
      </table>

      <section className="card">
        <h2 className="h3">{t("ওয়ার্ড সভায় আপনার অধিকার", "Your rights at the ward meeting")}</h2>
        <p>{t("এই ওয়ার্ডের সব ভোটার ওয়ার্ড সভার সদস্য। বছরে অন্তত ২ বার সভা হওয়ার কথা, ৭ দিন আগে নোটিশ দিয়ে। এখানেই প্রকল্পের অগ্রাধিকার আর ভাতাভোগীর তালিকা ঠিক হয়।", "Every voter in this ward is a member of the ward shava. It must meet at least twice a year with 7 days' notice. Project priorities and beneficiary lists are decided here.")}</p>
        <Link to="/rights/ward-shava">{t("বিস্তারিত জানুন →", "Learn more →")}</Link>
      </section>

      <ShareButtons title={t(`কাতুলী ${f.digits(ward.no)} নং ওয়ার্ড`, `Katuli ward ${ward.no}`)} />
      <p className="no-print"><Link to={`/poster/ward/${ward.no}`}>{t("ওয়ার্ড-পোস্টার প্রিন্ট করুন", "Print a ward poster")}</Link></p>
    </>
  );
}
```

- [ ] **Step 7: Run tests, typecheck and build.** Run `npm test && npm run typecheck && npm run build`. Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: ward pages, project list with filters, project detail with verification timeline"
```

---

### Task 9: Tenders

**Files:**
- Modify: `app/routes/tenders.tsx`, `app/routes/tender.tsx`

**Interfaces:**
- Consumes: `DeadlineBadge`, `Amount`, `docHref`, `TenderRow`

- [ ] **Step 1: Implement `app/routes/tenders.tsx`**

```tsx
import { Link, useLoaderData } from "react-router";
import { Amount } from "../components/Amount";
import { DeadlineBadge } from "../components/DeadlineBadge";
import { loadDataset } from "../data/load.server";
import { useT } from "../lib/i18n";
import { pageMeta } from "../lib/meta";

export function meta() {
  return pageMeta("দরপত্র বিজ্ঞপ্তি — কাতুলী ইউনিয়ন", "কাতুলী ইউনিয়নের কাজের দরপত্র: শেষ তারিখ, আনুমানিক মূল্য, কে কাজ পেল।");
}

export async function loader() {
  const ds = loadDataset();
  return { tenders: [...ds.tenders].sort((a, b) => (b.deadline ?? b.published ?? "").localeCompare(a.deadline ?? a.published ?? "")) };
}

export default function Tenders() {
  const { tenders } = useLoaderData<typeof loader>();
  const t = useT();
  return (
    <>
      <h1>{t("দরপত্র (টেন্ডার)", "Tenders")}</h1>
      <p>{t("ইউনিয়নে কোন কাজের দরপত্র আহ্বান করা হয়েছে, কে কাজ পেয়েছে। সরকারি কেনাকাটায় দরপত্রের তথ্য প্রকাশ্য হওয়ার কথা।", "Which works were put out to tender in the union, and who won them. Public procurement notices are meant to be public.")}</p>
      {tenders.length === 0 ? (
        <div className="card">
          <p>{t("কাতুলী ইউনিয়নের কোনো দরপত্র বিজ্ঞপ্তি এখনো অনলাইনে পাওয়া যায়নি। আমাদের স্বয়ংক্রিয় ব্যবস্থা প্রতিদিন ইউনিয়ন ও উপজেলার ওয়েবসাইট দেখে।", "No tender notice for Katuli Union has been found online yet. Our automatic checker looks at the union and upazila websites every day.")}</p>
          <Link to="/rights/rti?item=tender-notices">{t("দরপত্রের তথ্য চেয়ে আবেদন করুন →", "Request tender information →")}</Link>
        </div>
      ) : tenders.map((x) => (
        <Link key={x.id} to={`/tenders/${x.id}`} className="card list-link">
          <h3>{x.title_bn}</h3>
          <div className="chips"><DeadlineBadge deadline={x.deadline} /><span className="chip">{x.issuer}</span></div>
          {x.est_value !== null ? <p>{t("আনুমানিক মূল্য: ", "Estimated value: ")}<Amount value={x.est_value} full /></p> : null}
        </Link>
      ))}
    </>
  );
}
```

- [ ] **Step 2: Implement `app/routes/tender.tsx`**

```tsx
import { data, Link, useLoaderData } from "react-router";
import type { Route } from "./+types/tender";
import { Amount } from "../components/Amount";
import { DeadlineBadge } from "../components/DeadlineBadge";
import { ShareButtons } from "../components/ShareButtons";
import { Unknown } from "../components/Unknown";
import { loadDataset } from "../data/load.server";
import { useFmt, useT } from "../lib/i18n";
import { pageMeta } from "../lib/meta";

export function meta({ data }: Route.MetaArgs) {
  return pageMeta(data?.tender.title_bn ?? "দরপত্র", "কাতুলী ইউনিয়নের দরপত্র বিজ্ঞপ্তি — শেষ তারিখ, মূল্য, মূল নোটিশ।");
}

export async function loader({ params }: Route.LoaderArgs) {
  const ds = loadDataset();
  const tender = ds.tenders.find((x) => x.id === params.id);
  if (!tender) throw data(null, { status: 404 });
  const project = tender.project_id ? ds.projects.find((p) => p.id === tender.project_id) ?? null : null;
  return { tender, project: project ? { id: project.id, name_bn: project.name_bn } : null };
}

export default function Tender() {
  const { tender: x, project } = useLoaderData<typeof loader>();
  const t = useT();
  const f = useFmt();
  const base = import.meta.env.BASE_URL;
  return (
    <>
      <p className="no-print"><Link to="/tenders">← {t("সব দরপত্র", "All tenders")}</Link></p>
      <h1>{x.title_bn}</h1>
      <section className="card">
        <dl className="kv">
          <dt>{t("আহ্বানকারী", "Issued by")}</dt><dd>{x.issuer}</dd>
          <dt>{t("স্মারক নং", "Reference")}</dt><dd>{x.ref_no ?? <Unknown />}</dd>
          <dt>{t("প্রকাশ", "Published")}</dt><dd>{x.published ? f.date(x.published) : <Unknown />}</dd>
          <dt>{t("শেষ তারিখ", "Deadline")}</dt><dd><DeadlineBadge deadline={x.deadline} /></dd>
          <dt>{t("আনুমানিক মূল্য", "Estimated value")}</dt><dd><Amount value={x.est_value} full /></dd>
          <dt>{t("কাজ পেয়েছে", "Awarded to")}</dt><dd>{x.awarded_to ?? <Unknown />}</dd>
          <dt>{t("চুক্তিমূল্য", "Contract value")}</dt><dd><Amount value={x.award_value} full /></dd>
        </dl>
        <div className="share">
          {x.archive_path ? <a className="btn" href={`${base}${x.archive_path}`} target="_blank" rel="noopener">{t("সংরক্ষিত নোটিশ", "Saved copy of notice")}</a> : null}
          {x.url ? <a className="btn" href={x.url} target="_blank" rel="noopener">{t("মূল ওয়েবসাইটে", "On the original website")}</a> : null}
        </div>
        {project ? <p>{t("সংশ্লিষ্ট প্রকল্প: ", "Related project: ")}<Link to={`/projects/${project.id}`}>{project.name_bn}</Link></p> : null}
      </section>
      <ShareButtons title={x.title_bn} />
    </>
  );
}
```

- [ ] **Step 3: Build.** Run `npm run typecheck && npm run build`. Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: tender list and detail pages with deadline countdown"
```

---

### Task 10: Service fees and allowances

**Files:**
- Modify: `app/routes/services.tsx`, `app/routes/allowances.tsx`

- [ ] **Step 1: Implement `app/routes/services.tsx`**

```tsx
import { useLoaderData } from "react-router";
import { Link } from "react-router";
import { SourceBadge } from "../components/SourceBadge";
import { Unknown } from "../components/Unknown";
import { loadDataset } from "../data/load.server";
import { docRefs } from "../data/refs";
import { useFmt, useT } from "../lib/i18n";
import { pageMeta } from "../lib/meta";

export function meta() {
  return pageMeta("ইউনিয়ন পরিষদের সেবার সরকারি ফি", "জন্ম নিবন্ধন, সনদ, ট্রেড লাইসেন্স — সরকারি ফি কত আর কত দিনে পাওয়ার কথা। বেশি চাইলে কোথায় অভিযোগ করবেন।");
}

export async function loader() {
  const ds = loadDataset();
  return { fees: ds.fees, docs: docRefs(ds.documents, ds.fees.map((x) => x.source_doc)) };
}

export default function Services() {
  const { fees, docs } = useLoaderData<typeof loader>();
  const t = useT();
  const f = useFmt();
  return (
    <>
      <h1>{t("সেবার সরকারি ফি", "Official service fees")}</h1>
      <p>{t("নিচের ফি-র বেশি টাকা চাওয়া হলে রসিদ চান, আর অভিযোগ করুন।", "If you are asked for more than these fees, ask for a receipt and complain.")}</p>
      {fees.map((x) => (
        <section key={x.id} className="card">
          <h2 className="h3">{f.lang === "bn" ? x.service_bn : x.service_en}</h2>
          <dl className="kv">
            <dt>{t("সরকারি ফি", "Official fee")}</dt>
            <dd>{x.official_fee === null ? <Unknown rti="citizen-charter" /> : x.official_fee === 0 ? t("বিনামূল্যে", "Free") : f.takaFull(x.official_fee)}</dd>
            <dt>{t("কত দিনে", "Time limit")}</dt>
            <dd>{x.time_limit_days === null ? <Unknown rti="citizen-charter" /> : t(`${f.digits(x.time_limit_days)} দিন`, `${x.time_limit_days} days`)}</dd>
            <dt>{t("আইনি ভিত্তি", "Legal basis")}</dt><dd>{x.legal_basis}</dd>
          </dl>
          {x.note_bn ? <p className="muted">{x.note_bn}</p> : null}
          <SourceBadge type="upstream" doc={docs[x.source_doc]} />
        </section>
      ))}
      <section className="card">
        <h2 className="h3">{t("বেশি টাকা চাইলে কী করবেন", "Asked to pay more?")}</h2>
        <p>{t("দুদক হটলাইন ১০৬ (টোল-ফ্রি), অনলাইনে GRS, অথবা উপজেলা নির্বাহী অফিসারের কাছে লিখিত অভিযোগ।", "ACC hotline 106 (toll-free), GRS online, or a written complaint to the Upazila Nirbahi Officer.")}</p>
        <Link to="/rights/complain">{t("অভিযোগের সব পথ →", "All complaint channels →")}</Link>
      </section>
    </>
  );
}
```

- [ ] **Step 2: Implement `app/routes/allowances.tsx`**

```tsx
import { useLoaderData } from "react-router";
import { SourceBadge } from "../components/SourceBadge";
import { Unknown } from "../components/Unknown";
import { loadDataset } from "../data/load.server";
import { docRefs } from "../data/refs";
import { useFmt, useT } from "../lib/i18n";
import { pageMeta } from "../lib/meta";

export function meta() {
  return pageMeta("সামাজিক নিরাপত্তা ভাতা — কে পাবেন, কত টাকা", "বয়স্ক, বিধবা, প্রতিবন্ধী ভাতা ও অন্যান্য কর্মসূচি: যোগ্যতা, মাসিক পরিমাণ, কীভাবে বাছাই হয়, ওয়ার্ডওয়ারি সংখ্যা।");
}

export async function loader() {
  const ds = loadDataset();
  return {
    allowances: ds.allowances,
    counts: ds.allowanceCounts,
    wards: ds.union.wards.map((w) => w.no),
    docs: docRefs(ds.documents, ds.allowances.map((a) => a.source_doc)),
  };
}

export default function Allowances() {
  const { allowances, counts, wards, docs } = useLoaderData<typeof loader>();
  const t = useT();
  const f = useFmt();
  const count = (programme: string, ward: number | null) => counts.find((c) => c.programme === programme && c.ward === ward)?.beneficiary_count ?? null;
  return (
    <>
      <h1>{t("ভাতা: কে পাবেন, কত টাকা", "Allowances: who qualifies, how much")}</h1>
      <p>{t("উপকারভোগীদের তালিকা ওয়ার্ড সভায় ঠিক হওয়ার কথা। আমরা কারো নাম প্রকাশ করি না — শুধু সংখ্যা।", "Beneficiary lists are meant to be decided at the ward shava. We never publish names — only counts.")}</p>
      {allowances.map((a) => (
        <section key={a.programme} className="card">
          <h2 className="h3">{f.lang === "bn" ? a.name_bn : a.name_en}</h2>
          <p className="hero-number" style={{ fontSize: "1.8rem" }}>
            {a.monthly_amount !== null ? t(`${f.takaFull(a.monthly_amount)} / মাস`, `${f.takaFull(a.monthly_amount)} / month`) : a.payment_note_bn ?? <Unknown />}
          </p>
          <p className="muted">{t(`${f.fy(a.fiscal_year)} অর্থবছরের হার`, `FY ${a.fiscal_year} rate`)}</p>
          <h3>{t("কারা পাবেন", "Who qualifies")}</h3>
          <p>{f.lang === "bn" ? a.eligibility_bn : a.eligibility_en}</p>
          <h3>{t("কীভাবে বাছাই হয়", "How people are selected")}</h3>
          <p>{f.lang === "bn" ? a.selection_bn : a.selection_en}</p>
          <details>
            <summary>{t("ওয়ার্ডওয়ারি উপকারভোগীর সংখ্যা", "Recipients per ward")}</summary>
            <table className="lines">
              <tbody>
                {wards.map((w) => {
                  const c = count(a.programme, w);
                  return <tr key={w}><td>{t(`ওয়ার্ড ${f.digits(w)}`, `Ward ${w}`)}</td><td className="num">{c === null ? <Unknown rti="beneficiary-counts" /> : f.num(c)}</td></tr>;
                })}
                <tr><th>{t("পুরো ইউনিয়ন", "Whole union")}</th><td className="num">{(() => { const c = count(a.programme, null); return c === null ? <Unknown rti="beneficiary-counts" /> : f.num(c); })()}</td></tr>
              </tbody>
            </table>
          </details>
          <SourceBadge type="upstream" doc={docs[a.source_doc]} />
        </section>
      ))}
    </>
  );
}
```

- [ ] **Step 3: Build.** Run `npm run typecheck && npm run build`. Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: service fee and allowance explainer pages"
```

---

### Task 11: Rights guides, RTI letter generator, documents and about

**Files:**
- Modify: `app/content/rights.ts` (full content), `app/routes/rights.tsx`, `app/routes/rights-topic.tsx`, `app/routes/documents.tsx`, `app/routes/about.tsx`
- Create: `app/lib/rti.ts`, `app/components/RtiForm.tsx`
- Test: `tests/rti.test.ts`

**Interfaces:**
- Produces: `buildRtiLetter(o: {unionName, upazila, district, information, applicant: RtiApplicant, dateText}): RtiLetter`, where `RtiApplicant = {name, guardian, address, phone}` and `RtiLetter = {to: string[]; subject: string; fields: {label: string; value: string}[]; closing: string}`

- [ ] **Step 1: Write the failing test**

`tests/rti.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { buildRtiLetter, RTI_BLANK } from "../app/lib/rti";

const base = { unionName: "কাতুলী", upazila: "টাঙ্গাইল সদর", district: "টাঙ্গাইল", dateText: "২৬ সেপ্টেম্বর ২০২৬" };

describe("buildRtiLetter", () => {
  it("addresses the union's designated officer and cites section 8", () => {
    const l = buildRtiLetter({ ...base, information: "২০২৬-২৭ অর্থবছরের বাজেটের কপি", applicant: { name: "রহিম", guardian: "করিম", address: "কাতুলী", phone: "" } });
    expect(l.to.join(" ")).toContain("কাতুলী ইউনিয়ন পরিষদ");
    expect(l.subject).toContain("ধারা ৮");
    expect(l.fields.find((x) => x.label.includes("কী ধরনের তথ্য"))?.value).toBe("২০২৬-২৭ অর্থবছরের বাজেটের কপি");
  });
  it("leaves dotted blanks for empty fields so the letter can be filled by hand", () => {
    const l = buildRtiLetter({ ...base, information: "", applicant: { name: "", guardian: "", address: "", phone: "" } });
    expect(l.fields.filter((x) => x.value === RTI_BLANK).length).toBeGreaterThanOrEqual(5);
  });
});
```

- [ ] **Step 2: Run the test.** Run `npm test -- rti`. Expected: FAIL.

- [ ] **Step 3: Implement `app/lib/rti.ts`**

```ts
export type RtiApplicant = { name: string; guardian: string; address: string; phone: string };
export type RtiLetter = { to: string[]; subject: string; fields: { label: string; value: string }[]; closing: string };

export const RTI_BLANK = "........................................";

export function buildRtiLetter(o: { unionName: string; upazila: string; district: string; information: string; applicant: RtiApplicant; dateText: string }): RtiLetter {
  const v = (s: string) => (s.trim() === "" ? RTI_BLANK : s.trim());
  const a = o.applicant;
  return {
    to: ["বরাবর", "দায়িত্বপ্রাপ্ত কর্মকর্তা (তথ্য প্রদান)", `${o.unionName} ইউনিয়ন পরিষদ`, `${o.upazila}, ${o.district}`],
    subject: "বিষয়: তথ্য অধিকার আইন, ২০০৯-এর ধারা ৮ অনুযায়ী তথ্য প্রাপ্তির আবেদন (ফরম 'ক')",
    fields: [
      { label: "১. আবেদনকারীর নাম", value: v(a.name) },
      { label: "   পিতা/মাতা/স্বামীর নাম", value: v(a.guardian) },
      { label: "   ঠিকানা", value: v(a.address) },
      { label: "   মোবাইল (যদি থাকে)", value: v(a.phone) },
      { label: "২. কী ধরনের তথ্য চাওয়া হচ্ছে", value: v(o.information) },
      { label: "৩. কোন পদ্ধতিতে তথ্য পেতে চান", value: "ছাপানো/ফটোকপি" },
      { label: "৪. তথ্য গ্রহণকারীর নাম ও ঠিকানা", value: a.name.trim() && a.address.trim() ? `${a.name.trim()}, ${a.address.trim()}` : RTI_BLANK },
      { label: "৫. সহায়তাকারীর নাম ও ঠিকানা (প্রযোজ্য হলে)", value: "প্রযোজ্য নয়" },
      { label: "৬. আবেদনের তারিখ", value: v(o.dateText) },
    ],
    closing: "উপরোক্ত তথ্য আইনে নির্ধারিত সময়ের (২০ কার্যদিবস) মধ্যে প্রদানের জন্য অনুরোধ করছি। প্রযোজ্য ফি পরিশোধে প্রস্তুত আছি।",
  };
}
```

- [ ] **Step 4: Write `app/content/rights.ts`**

These facts come from `docs/research/rights-law.md`, verified against the bdlaws texts. The `source_docs` ids must exist in `data/documents.csv` (added in Task 16).

```ts
export type RightsPoint = { bn: string; en: string };
export type RightsSection = { heading_bn: string; heading_en: string; points: RightsPoint[] };
export type RightsLink = { label_bn: string; label_en: string; href: string };
export type RightsTopic = { key: "rti" | "ward-shava" | "open-budget" | "complain"; title_bn: string; title_en: string; summary_bn: string; summary_en: string; sections: RightsSection[]; links: RightsLink[]; source_docs: string[] };

export const RIGHTS_TOPICS: RightsTopic[] = [
  {
    key: "rti",
    title_bn: "তথ্য চাওয়ার অধিকার",
    title_en: "Your right to information",
    summary_bn: "ইউনিয়ন পরিষদের বাজেট, প্রকল্প, ভাতাভোগীর সংখ্যা — যেকোনো তথ্য চাওয়ার আইনি অধিকার আপনার আছে।",
    summary_en: "You have a legal right to ask the Union Parishad for any information — budgets, projects, beneficiary numbers.",
    sections: [
      {
        heading_bn: "আইন কী বলে", heading_en: "What the law says",
        points: [
          { bn: "যেকোনো নাগরিক ইউনিয়ন পরিষদের তথ্য পাওয়ার অধিকারী (স্থানীয় সরকার (ইউনিয়ন পরিষদ) আইন ২০০৯, ধারা ৭৮)।", en: "Every citizen has the right to information about the Union Parishad (UP Act 2009, s.78)." },
          { bn: "লিখিতভাবে, ইমেইলে বা ফরম 'ক'-তে আবেদন করা যায়; ফরম না থাকলে সাদা কাগজেও চলবে (তথ্য অধিকার আইন ২০০৯, ধারা ৮)।", en: "You can apply in writing, by email, or on Form 'Ka'; plain paper is fine if no form is available (RTI Act 2009, s.8)." },
          { bn: "২০ কার্যদিবসের মধ্যে তথ্য দেওয়ার কথা; একাধিক দপ্তর জড়িত হলে ৩০ কার্যদিবস। জীবন-মৃত্যু, গ্রেপ্তার বা জেল থেকে মুক্তি সংক্রান্ত তথ্য ২৪ ঘণ্টার মধ্যে (ধারা ৯)।", en: "Information must be given within 20 working days (30 if several units are involved); life, death, arrest or release information within 24 hours (s.9)." },
          { bn: "দিতে না পারলে ১০ কার্যদিবসের মধ্যে কারণসহ লিখিতভাবে জানাতে হবে। কোনো উত্তর না দেওয়া মানে তথ্য দিতে অস্বীকার (ধারা ৯)।", en: "A refusal must come within 10 working days, in writing, with reasons. No answer counts as a refusal (s.9)." },
          { bn: "সময়মতো তথ্য না দিলে ইউপি সচিবের দিনে ৫০ টাকা হারে জরিমানা হতে পারে (ইউপি আইন ধারা ৮০; তথ্য অধিকার আইন ধারা ২৭)।", en: "An officer who delays can be fined Tk 50 per day (UP Act s.80; RTI Act s.27)." },
        ],
      },
      {
        heading_bn: "ধাপে ধাপে", heading_en: "Step by step",
        points: [
          { bn: "নিচের ফরমে কী তথ্য চান বেছে নিন, নাম-ঠিকানা লিখুন, প্রিন্ট করে সই করুন। আপনার তথ্য শুধু আপনার ফোনেই থাকে।", en: "Choose what you want below, fill in your name and address, print and sign. Your details stay on your phone." },
          { bn: "ইউনিয়ন পরিষদ কার্যালয়ে দায়িত্বপ্রাপ্ত কর্মকর্তার (সাধারণত ইউপি সচিব) কাছে জমা দিন। একটি ফটোকপিতে 'গ্রহণ করা হলো' লিখিয়ে সই ও তারিখ নিয়ে রাখুন।", en: "Submit it at the UP office to the designated officer (usually the UP Secretary). Get a photocopy stamped 'received' with a signature and date." },
          { bn: "আবেদন করতে ফি লাগে না; কপি দেওয়ার জন্য পৃষ্ঠাপ্রতি সামান্য খরচ নেওয়া যায়।", en: "Applying is free; a small per-page cost can be charged for copies." },
          { bn: "২০ কার্যদিবসে উত্তর না পেলে ৩০ দিনের মধ্যে আপিল কর্তৃপক্ষের কাছে আপিল করুন; ১৫ দিনে নিষ্পত্তি হওয়ার কথা (ধারা ২৪)। আপিল কর্তৃপক্ষ কে, তা ইউপির নোটিশ বোর্ডে থাকার কথা।", en: "No answer in 20 working days? Appeal within 30 days to the appellate authority, who must decide in 15 days (s.24). The UP notice board should say who that is." },
          { bn: "আপিলেও সমাধান না হলে ৩০ দিনের মধ্যে তথ্য কমিশনে অভিযোগ করুন (ধারা ২৫)।", en: "Still nothing? Complain to the Information Commission within 30 days (s.25)." },
        ],
      },
    ],
    links: [{ label_bn: "তথ্য কমিশন", label_en: "Information Commission", href: "https://infocom.gov.bd/" }],
    source_docs: ["law-up-act-2009", "law-rti-act-2009"],
  },
  {
    key: "ward-shava",
    title_bn: "ওয়ার্ড সভা: আপনার ওয়ার্ডের সংসদ",
    title_en: "Ward shava: your ward's assembly",
    summary_bn: "আপনার ওয়ার্ডের সব ভোটার ওয়ার্ড সভার সদস্য। কোন রাস্তা আগে হবে, কারা ভাতা পাবেন — এখানেই ঠিক হওয়ার কথা।",
    summary_en: "Every voter in your ward is a member. Which road comes first and who gets allowances is meant to be decided here.",
    sections: [
      {
        heading_bn: "আইন কী বলে", heading_en: "What the law says",
        points: [
          { bn: "ওয়ার্ডের ভোটার তালিকার সবাই ওয়ার্ড সভার সদস্য (ইউপি আইন ২০০৯, ধারা ৪)।", en: "Everyone on the ward's voter list is a member (UP Act 2009, s.4)." },
          { bn: "বছরে অন্তত ২টি সভা হবে, একটি বার্ষিক সভা। সভার অন্তত ৭ দিন আগে প্রকাশ্য নোটিশ দিতে হবে। কোরাম: ওয়ার্ডের ভোটারের ৫% (ধারা ৫)।", en: "At least 2 meetings a year, one of them the annual meeting, with public notice 7 days before. Quorum: 5% of the ward's voters (s.5)." },
          { bn: "বার্ষিক সভায় ওয়ার্ড সদস্যকে আগের বছরের কাজ ও খরচের হিসাব দিতে হয় (ধারা ৫)।", en: "At the annual meeting the ward member must account for the past year's work and spending (s.5)." },
          { bn: "ওয়ার্ড সভা প্রকল্পের অগ্রাধিকার ঠিক করে, এবং সরকারি কর্মসূচির উপকারভোগীর চূড়ান্ত অগ্রাধিকার তালিকা তৈরি করে। অনিয়ম প্রমাণ না হলে ইউনিয়ন পরিষদ এই তালিকা বদলাতে পারে না (ধারা ৬(৭))।", en: "The ward shava sets project priorities and makes the final priority list of beneficiaries. The UP cannot change that list unless an irregularity is proven (s.6(7))." },
          { bn: "বাজেটের খাতওয়ারি বরাদ্দ, প্রাক্কলন ও কেনাকাটার খরচ ওয়ার্ডের প্রকাশ্য স্থানে বোর্ডে লিখে রাখার কথা; নিরীক্ষা প্রতিবেদন ওয়ার্ড সভায় উপস্থাপনের কথা (ধারা ৬(২), ৬(৩))।", en: "Budget allocations, estimates and purchase costs must be written on a public board in the ward, and audit reports presented at the ward shava (s.6(2), 6(3))." },
          { bn: "ওয়ার্ড সভার আগাম বা পরবর্তী অনুমোদন ছাড়া করা খরচের দায় যিনি খরচ করেছেন তাঁর ব্যক্তিগত (ধারা ৭(৪))।", en: "Spending without the ward shava's approval, before or after, is the personal liability of whoever spent it (s.7(4))." },
        ],
      },
      {
        heading_bn: "আপনি যা করতে পারেন", heading_en: "What you can do",
        points: [
          { bn: "ওয়ার্ড সদস্যকে জিজ্ঞেস করুন: এ বছরের ওয়ার্ড সভা কবে?", en: "Ask your ward member: when is this year's ward shava?" },
          { bn: "সভায় গিয়ে জিজ্ঞেস করুন: গত বছরের প্রকল্পগুলোর খরচ কত, কাজ কোথায়?", en: "At the meeting, ask: what did last year's projects cost, and where is the work?" },
          { bn: "সভা না হলে কার্যবিবরণী চেয়ে তথ্য অধিকার আবেদন করুন, অথবা ইউএনওকে লিখিত জানান।", en: "If no meeting is held, request the minutes under RTI or write to the UNO." },
        ],
      },
    ],
    links: [],
    source_docs: ["law-up-act-2009"],
  },
  {
    key: "open-budget",
    title_bn: "প্রকাশ্য বাজেট অধিবেশন",
    title_en: "The open budget session",
    summary_bn: "ইউনিয়ন পরিষদের বাজেট এলাকাবাসীর সামনে প্রকাশ্য সভায় উপস্থাপন করার কথা। আপনি সেখানে প্রশ্ন করতে পারেন।",
    summary_en: "The UP budget must be presented at a public meeting in front of residents. You can ask questions there.",
    sections: [
      {
        heading_bn: "আইন কী বলে", heading_en: "What the law says",
        points: [
          { bn: "অর্থবছর শুরুর (১ জুলাই) অন্তত ৬০ দিন আগে, অর্থাৎ মোটামুটি ২ মের মধ্যে, ওয়ার্ড সভার অগ্রাধিকার মেনে বাজেট তৈরি করতে হবে (ইউপি আইন ২০০৯, ধারা ৫৭)।", en: "The budget must be prepared at least 60 days before the fiscal year starts (1 July), i.e. by about 2 May, following ward shava priorities (UP Act 2009, s.57)." },
          { bn: "বাজেট প্রকাশ্য বাজেট অধিবেশনে স্থায়ী কমিটি ও এলাকাবাসীর উপস্থিতিতে উপস্থাপন করতে হবে।", en: "It must be presented at a public budget session with the standing committees and local people present." },
          { bn: "পাসের পর কপি উপজেলা নির্বাহী অফিসারের (ইউএনও) কাছে যায়; তিনি ৩০ দিনের মধ্যে সংশোধন করতে পারেন (ধারা ৫৭(৪))।", en: "Once passed, a copy goes to the UNO, who may correct it within 30 days (s.57(4))." },
          { bn: "বছর শেষে চূড়ান্ত হিসাব প্রকাশ্য বাজেট অধিবেশনে উপস্থাপন করে ৬০ দিনের মধ্যে ইউএনওর কাছে পাঠাতে হয় (ধারা ৫৮)।", en: "At year end, the final accounts must be presented at the open session and sent to the UNO within 60 days (s.58)." },
        ],
      },
      {
        heading_bn: "সভায় যা জিজ্ঞেস করবেন", heading_en: "Questions to ask at the session",
        points: [
          { bn: "গত বছর কত টাকা এসেছিল আর কত খরচ হয়েছে? চূড়ান্ত হিসাব কোথায়?", en: "How much came in last year and how much was spent? Where are the final accounts?" },
          { bn: "আমার ওয়ার্ডে এ বছর কোন প্রকল্প, কত টাকা, কে বাস্তবায়ন করবে?", en: "Which projects are planned in my ward this year, for how much, and who will implement them?" },
          { bn: "বসতবাড়ি কর কত আদায় হয়েছে, কর আদায়কারী কত কমিশন পেয়েছেন?", en: "How much holding tax was collected, and what commission did the collectors get?" },
          { bn: "বাজেটের কপি নোটিশ বোর্ডে ও ওয়েবসাইটে কবে দেওয়া হবে?", en: "When will a copy of the budget be posted on the notice board and the website?" },
        ],
      },
    ],
    links: [],
    source_docs: ["law-up-act-2009"],
  },
  {
    key: "complain",
    title_bn: "কোথায় অভিযোগ করবেন",
    title_en: "Where to complain",
    summary_bn: "ঘুষ চাওয়া, সেবা না পাওয়া বা তালিকায় অনিয়ম — সরকারি মাধ্যমে অভিযোগ করুন এবং নিজের কাছে কপি রাখুন।",
    summary_en: "Asked for a bribe, denied a service, or a list was manipulated? Use the official channels and keep a copy.",
    sections: [
      {
        heading_bn: "অভিযোগের পথ", heading_en: "Channels",
        points: [
          { bn: "দুদক হটলাইন ১০৬: টোল-ফ্রি, সকাল ৯টা–বিকাল ৫টা। ঘুষ ও দুর্নীতির অভিযোগের জন্য।", en: "ACC hotline 106: toll-free, 9am–5pm. For bribery and corruption complaints." },
          { bn: "অনলাইন অভিযোগ ব্যবস্থা (GRS, grs.gov.bd): বিনামূল্যে; ৩০ কার্যদিবসে নিষ্পত্তির কথা। তথ্য অধিকার বিষয়ক অভিযোগ এখানে নয়।", en: "Online Grievance Redress System (GRS, grs.gov.bd): free; should be resolved in 30 working days. Not for RTI complaints." },
          { bn: "জাতীয় হেল্পলাইন ৩৩৩: ২৪ ঘণ্টা; প্রতি মিনিট ৬০ পয়সা। তথ্য জানতে ও ইউএনও/ডিসির কাছে অভিযোগ পৌঁছাতে।", en: "National helpline 333: 24/7; 60 paisa per minute. For information and to reach the UNO/DC." },
          { bn: "উপজেলা নির্বাহী অফিসার (ইউএনও), টাঙ্গাইল সদর: লিখিত অভিযোগ দিন, রিসিভ কপি রাখুন।", en: "Upazila Nirbahi Officer (UNO), Tangail Sadar: submit a written complaint and keep a stamped copy." },
          { bn: "তথ্য না পেলে: আপিল কর্তৃপক্ষ, তারপর তথ্য কমিশন।", en: "Information refused: appellate authority, then the Information Commission." },
        ],
      },
      {
        heading_bn: "নিরাপদ থাকুন", heading_en: "Stay safe",
        points: [
          { bn: "ফেসবুক বা অন্য কোথাও প্রকাশ্যে কারো নাম ধরে অভিযোগ পোস্ট করবেন না — আইনি ঝুঁকি আছে। সরকারি মাধ্যম ব্যবহার করুন।", en: "Don't post accusations naming people on Facebook or elsewhere — there is legal risk. Use official channels." },
          { bn: "প্রতিটি আবেদনের কপি, রসিদ ও তারিখ সংরক্ষণ করুন। যা দেখেছেন শুধু তা-ই লিখুন।", en: "Keep copies, receipts and dates of everything you submit. Write only what you saw." },
        ],
      },
    ],
    links: [
      { label_bn: "দুদক ১০৬-এ কল করুন", label_en: "Call ACC 106", href: "tel:106" },
      { label_bn: "GRS-এ অভিযোগ", label_en: "Complain on GRS", href: "https://www.grs.gov.bd/" },
      { label_bn: "৩৩৩-এ কল করুন", label_en: "Call 333", href: "tel:333" },
    ],
    source_docs: ["law-rti-act-2009", "grs-portal"],
  },
];
```

- [ ] **Step 5: Implement `app/components/RtiForm.tsx`**

```tsx
import { useEffect, useState } from "react";
import { buildRtiLetter } from "../lib/rti";
import { useFmt, useT } from "../lib/i18n";

export type RtiItem = { id: string; requirement_bn: string; rti_request_bn: string };

export function RtiForm({ items, union }: { items: RtiItem[]; union: { name_bn: string; upazila_bn: string; district_bn: string } }) {
  const t = useT();
  const f = useFmt();
  const [itemId, setItemId] = useState(items[0]?.id ?? "custom");
  const [custom, setCustom] = useState("");
  const [applicant, setApplicant] = useState({ name: "", guardian: "", address: "", phone: "" });
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("item");
    if (wanted && items.some((i) => i.id === wanted)) setItemId(wanted);
  }, [items]);
  const information = itemId === "custom" ? custom : items.find((i) => i.id === itemId)?.rti_request_bn ?? "";
  const today = new Date().toISOString().slice(0, 10);
  const letter = buildRtiLetter({ unionName: union.name_bn, upazila: union.upazila_bn, district: union.district_bn, information, applicant, dateText: f.date(today) });
  const field = (k: keyof typeof applicant, label: string) => (
    <label>{label}<input value={applicant[k]} onChange={(e) => setApplicant({ ...applicant, [k]: e.target.value })} autoComplete="off" /></label>
  );

  return (
    <div className="rti-page">
      <section className="card form-grid no-print">
        <h2 className="h3">{t("আবেদনপত্র তৈরি করুন", "Make your application")}</h2>
        <p className="muted">{t("আপনার লেখা তথ্য শুধু আপনার ফোনেই থাকে — কোথাও পাঠানো হয় না।", "What you type stays on your phone — it is not sent anywhere.")}</p>
        <label>{t("কোন তথ্য চান", "What do you want")}
          <select value={itemId} onChange={(e) => setItemId(e.target.value)}>
            {items.map((i) => <option key={i.id} value={i.id}>{i.requirement_bn}</option>)}
            <option value="custom">{t("অন্য কিছু (নিজে লিখুন)", "Something else (write it)")}</option>
          </select>
        </label>
        {itemId === "custom" ? <label>{t("তথ্যের বিবরণ", "Describe the information")}<textarea rows={3} value={custom} onChange={(e) => setCustom(e.target.value)} /></label> : null}
        {field("name", t("আপনার নাম", "Your name"))}
        {field("guardian", t("পিতা/মাতা/স্বামীর নাম", "Father/mother/husband's name"))}
        {field("address", t("ঠিকানা", "Address"))}
        {field("phone", t("মোবাইল (ঐচ্ছিক)", "Mobile (optional)"))}
        <p className="muted">{t("ফাঁকা রাখলে ডট-লাইন থাকবে, প্রিন্টের পর হাতে লিখতে পারবেন।", "Leave blank to get dotted lines you can fill in by hand after printing.")}</p>
        <button type="button" className="btn btn-primary" onClick={() => window.print()}>{t("আবেদনপত্র প্রিন্ট করুন", "Print the application")}</button>
      </section>
      <article className="letter" lang="bn" aria-label={t("আবেদনপত্রের নমুনা", "Application preview")}>
        <p>{letter.to.map((line) => <span key={line}>{line}<br /></span>)}</p>
        <p><strong>{letter.subject}</strong></p>
        {letter.fields.map((x) => <div key={x.label} className="field"><span>{x.label}</span><span>{x.value}</span></div>)}
        <p>{letter.closing}</p>
        <p style={{ marginTop: "2.5rem" }}>{t("আবেদনকারীর স্বাক্ষর", "Applicant's signature")}: ........................................</p>
      </article>
    </div>
  );
}
```

(The printed letter is always in Bangla, because it is submitted to a Bangladeshi office. Form labels follow the UI language.)

- [ ] **Step 6: Implement `app/routes/rights.tsx` and `app/routes/rights-topic.tsx`**

`app/routes/rights.tsx`:
```tsx
import { Link } from "react-router";
import { RIGHTS_TOPICS } from "../content/rights";
import { useLang, useT } from "../lib/i18n";
import { pageMeta } from "../lib/meta";

export function meta() {
  return pageMeta("আপনার অধিকার", "তথ্য চাওয়া, ওয়ার্ড সভা, প্রকাশ্য বাজেট সভা, অভিযোগ — ইউনিয়ন পরিষদের কাছে জবাব চাওয়ার আইনি পথ।");
}

export default function Rights() {
  const t = useT();
  const { lang } = useLang();
  return (
    <>
      <h1>{t("আপনার অধিকার", "Your rights")}</h1>
      <p>{t("ইউনিয়ন পরিষদের টাকা জনগণের টাকা। আইন আপনাকে প্রশ্ন করার, তথ্য চাওয়ার আর সিদ্ধান্তে অংশ নেওয়ার অধিকার দিয়েছে।", "Union Parishad money is public money. The law gives you the right to ask, to get information, and to take part in decisions.")}</p>
      {RIGHTS_TOPICS.map((x) => (
        <Link key={x.key} to={`/rights/${x.key}`} className="card list-link">
          <h2 className="h3">{lang === "bn" ? x.title_bn : x.title_en}</h2>
          <p>{lang === "bn" ? x.summary_bn : x.summary_en}</p>
        </Link>
      ))}
    </>
  );
}
```

`app/routes/rights-topic.tsx`:
```tsx
import { data, Link, useLoaderData } from "react-router";
import type { Route } from "./+types/rights-topic";
import { RtiForm } from "../components/RtiForm";
import { ShareButtons } from "../components/ShareButtons";
import { RIGHTS_TOPICS } from "../content/rights";
import { loadDataset } from "../data/load.server";
import { docRefs } from "../data/refs";
import { docHref } from "../components/SourceBadge";
import { useLang, useT } from "../lib/i18n";
import { pageMeta } from "../lib/meta";

export function meta({ data }: Route.MetaArgs) {
  return pageMeta(data?.topic.title_bn ?? "আপনার অধিকার", data?.topic.summary_bn ?? "");
}

export async function loader({ params }: Route.LoaderArgs) {
  const topic = RIGHTS_TOPICS.find((x) => x.key === params.topic);
  if (!topic) throw data(null, { status: 404 });
  const ds = loadDataset();
  return {
    topic,
    docs: Object.values(docRefs(ds.documents, topic.source_docs)),
    rtiItems: topic.key === "rti" ? ds.disclosures.filter((d) => d.published !== "yes").map(({ id, requirement_bn, rti_request_bn }) => ({ id, requirement_bn, rti_request_bn })) : [],
    union: { name_bn: ds.union.name_bn, upazila_bn: ds.union.upazila_bn, district_bn: ds.union.district_bn },
  };
}

export default function RightsTopic() {
  const { topic, docs, rtiItems, union } = useLoaderData<typeof loader>();
  const t = useT();
  const { lang } = useLang();
  return (
    <>
      <p className="no-print"><Link to="/rights">← {t("সব অধিকার", "All rights")}</Link></p>
      <h1 className="no-print">{lang === "bn" ? topic.title_bn : topic.title_en}</h1>
      <p className="no-print">{lang === "bn" ? topic.summary_bn : topic.summary_en}</p>
      {topic.key === "rti" ? <RtiForm items={rtiItems} union={union} /> : null}
      <div className="no-print">
        {topic.sections.map((s) => (
          <section key={s.heading_en} className="card">
            <h2 className="h3">{lang === "bn" ? s.heading_bn : s.heading_en}</h2>
            <ol>{s.points.map((p) => <li key={p.en}>{lang === "bn" ? p.bn : p.en}</li>)}</ol>
          </section>
        ))}
        {topic.links.length > 0 ? <div className="share">{topic.links.map((l) => <a key={l.href} className="btn" href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel="noopener">{lang === "bn" ? l.label_bn : l.label_en}</a>)}</div> : null}
        {docs.length > 0 ? (
          <p className="muted">{t("উৎস: ", "Sources: ")}{docs.map((d, i) => { const href = docHref(d); return <span key={d.id}>{i > 0 ? " · " : ""}{href ? <a href={href} target="_blank" rel="noopener">{lang === "en" && d.title_en ? d.title_en : d.title_bn}</a> : d.title_bn}</span>; })}</p>
        ) : null}
        <ShareButtons title={topic.title_bn} />
      </div>
    </>
  );
}
```

Note that the print CSS rule `.rti-page > :not(.letter)` hides the form when printing, and `.no-print` hides everything else, so only the letter prints.

- [ ] **Step 7: Implement `app/routes/documents.tsx` and `app/routes/about.tsx`**

`app/routes/documents.tsx`:
```tsx
import { useState } from "react";
import { useLoaderData } from "react-router";
import { DisclosureStrip } from "../components/DisclosureStrip";
import { docHref } from "../components/SourceBadge";
import { loadDataset } from "../data/load.server";
import { ISSUERS } from "../data/schemas";
import { useFmt, useT } from "../lib/i18n";
import { ISSUER_LABEL } from "../lib/labels";
import { pageMeta } from "../lib/meta";

export function meta() {
  return pageMeta("নথিপত্র ও প্রকাশের হিসাব", "আইন অনুযায়ী কোন নথি প্রকাশ হওয়ার কথা, কোনটি পাওয়া গেছে — আর আমাদের সংগ্রহে থাকা সব উৎস-নথি।");
}

export async function loader() {
  const ds = loadDataset();
  return {
    disclosures: ds.disclosures.map(({ id, requirement_bn, requirement_en, published }) => ({ id, requirement_bn, requirement_en, published })),
    documents: [...ds.documents].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")),
  };
}

export default function Documents() {
  const { disclosures, documents } = useLoaderData<typeof loader>();
  const t = useT();
  const f = useFmt();
  const [issuer, setIssuer] = useState("");
  const shown = documents.filter((d) => issuer === "" || d.issuer === issuer);
  return (
    <>
      <h1>{t("নথিপত্র", "Documents")}</h1>
      <DisclosureStrip items={disclosures} full />
      <h2>{t("আমাদের সংগ্রহের নথি", "Documents we hold")}</h2>
      <p className="muted">{t("মূল ওয়েবসাইট থেকে সরিয়ে ফেলা হলেও যেন প্রমাণ থাকে, তাই প্রতিটি নথির কপি সংরক্ষণ করা হয়।", "We keep a copy of every document, so the evidence survives even if it is removed from the original website.")}</p>
      <div className="filters">
        <label>{t("কার নথি", "Issued by")}
          <select value={issuer} onChange={(e) => setIssuer(e.target.value)}>
            <option value="">{t("সব", "All")}</option>
            {ISSUERS.map((i) => <option key={i} value={i}>{ISSUER_LABEL[i][f.lang]}</option>)}
          </select>
        </label>
      </div>
      {shown.map((d) => {
        const href = docHref(d);
        return (
          <div key={d.id} className="card">
            <h3>{href ? <a href={href} target="_blank" rel="noopener">{f.lang === "en" && d.title_en ? d.title_en : d.title_bn}</a> : d.title_bn}</h3>
            <div className="chips">
              <span className="chip">{ISSUER_LABEL[d.issuer][f.lang]}</span>
              {d.fiscal_year ? <span className="chip">{f.fy(d.fiscal_year)}</span> : null}
              {d.date ? <span className="chip">{f.date(d.date)}</span> : null}
              {d.reliability === "low" ? <span className="chip chip-low">{t("কম নির্ভরযোগ্য", "Low reliability")}</span> : null}
            </div>
            {d.note_bn ? <p className="muted">{d.note_bn}</p> : null}
            {d.url && d.archive_path ? <p className="small-link"><a href={d.url} target="_blank" rel="noopener">{t("মূল ওয়েবসাইটে দেখুন", "View on original website")}</a></p> : null}
          </div>
        );
      })}
    </>
  );
}
```

`app/routes/about.tsx`:
```tsx
import { useLoaderData } from "react-router";
import { loadDataset } from "../data/load.server";
import { useT } from "../lib/i18n";
import { pageMeta } from "../lib/meta";

export function meta() {
  return pageMeta("আমাদের সম্পর্কে", "এটি একটি স্বাধীন নাগরিক উদ্যোগ — সরকারি ওয়েবসাইট নয়। আমরা কীভাবে তথ্য সংগ্রহ করি।");
}

export async function loader() {
  const ds = loadDataset();
  return { portal: ds.union.portal_url, whatsapp: ds.union.maintainer.whatsapp, note: ds.union.maintainer.note_bn };
}

export default function About() {
  const { portal, whatsapp, note } = useLoaderData<typeof loader>();
  const t = useT();
  return (
    <>
      <h1>{t("আমাদের সম্পর্কে", "About")}</h1>
      <section className="card">
        <h2 className="h3">{t("আমরা কারা", "Who we are")}</h2>
        <p>{t("এটি কাতুলী ইউনিয়নের নাগরিকদের একটি স্বাধীন, অরাজনৈতিক উদ্যোগ। এটি সরকারি ওয়েবসাইট নয়, ইউনিয়ন পরিষদ বা কোনো সরকারি দপ্তরের সাথে যুক্ত নয়। লক্ষ্য একটাই: জনগণের টাকার হিসাব সবার কাছে সহজ করে পৌঁছে দেওয়া।", "This is an independent, non-partisan initiative by citizens of Katuli Union. It is not a government website and is not affiliated with the Union Parishad or any government office. Our only aim is to make public money easy for everyone to follow.")}</p>
        <p>{t("ইউনিয়ন পরিষদের সরকারি ওয়েবসাইট: ", "The Union Parishad's official website: ")}<a href={portal} target="_blank" rel="noopener">{portal}</a></p>
      </section>
      <section className="card">
        <h2 className="h3">{t("তথ্য কোথা থেকে আসে", "Where the data comes from")}</h2>
        <ul>
          <li><span className="chip chip-union">{t("ইউনিয়নের নথি", "Union document")}</span> {t("ইউনিয়ন পরিষদের প্রকাশিত বাজেট, নোটিশ ও তালিকা।", "Budgets, notices and lists published by the Union Parishad.")}</li>
          <li><span className="chip chip-upstream">{t("অন্য সরকারি অফিসের নথি", "Other government office")}</span> {t("উপজেলা, জেলা ও মন্ত্রণালয়ের বরাদ্দ তালিকা — ইউনিয়ন নিজে প্রকাশ না করলে।", "Allocation lists from the upazila, district and ministries — used when the union itself has not published.")}</li>
          <li><span className="chip chip-observed">{t("স্বেচ্ছাসেবকের পর্যবেক্ষণ", "Volunteer observation")}</span> {t("স্বেচ্ছাসেবকেরা নিজে গিয়ে যা দেখেছেন, তারিখ ও ছবিসহ।", "What volunteers saw in person, with date and photos.")}</li>
        </ul>
        <p>{t("প্রতিটি সংখ্যার পাশে উৎস-নথির লিংক আছে, আর প্রতিটি নথির কপি আমরা সংরক্ষণ করি।", "Every figure links to its source document, and we keep a copy of each document.")}</p>
      </section>
      <section className="card">
        <h2 className="h3">{t("গুরুত্বপূর্ণ সতর্কতা", "Important disclaimer")}</h2>
        <p>{t("এখানে দেখানো কোনো অমিল বা ফাঁক মানেই অনিয়ম বা অপরাধের প্রমাণ নয় — এটি প্রশ্ন করার একটি কারণ মাত্র। আমরা কাউকে অভিযুক্ত করি না। ভুল পেলে জানান, প্রমাণসহ সংশোধন করা হবে।", "A discrepancy or gap shown here is not proof of wrongdoing — only a reason to ask questions. We accuse no one. If you find a mistake, tell us and we will correct it with evidence.")}</p>
      </section>
      <section className="card">
        <h2 className="h3">{t("ইউনিয়ন পরিষদের জবাবের অধিকার", "The Union Parishad's right of reply")}</h2>
        <p>{t("ইউনিয়ন পরিষদ কোনো তথ্য সংশোধন করতে বা বক্তব্য দিতে চাইলে আমরা তা সংশ্লিষ্ট পাতায় হুবহু প্রকাশ করব।", "If the Union Parishad wishes to correct any information or respond, we will publish its response verbatim on the relevant page.")}</p>
        {whatsapp ? <p><a className="btn" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener">{t("যোগাযোগ (হোয়াটসঅ্যাপ)", "Contact (WhatsApp)")}</a></p> : null}
        {note ? <p>{note}</p> : null}
      </section>
    </>
  );
}
```

- [ ] **Step 8: Run tests, typecheck and build.** Run `npm test && npm run typecheck && npm run build`. Expected: PASS. `docRefs` silently drops ids missing from `documents.csv`, so until Task 16 adds `law-up-act-2009`, `law-rti-act-2009` and `grs-portal`, the sources line just renders fewer links.

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: rights guides, printable RTI application generator, documents archive and about page"
```

---

### Task 12: Printable posters with QR codes

**Files:**
- Modify: `app/routes/poster.tsx`
- Test: `tests/site.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/site.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { absoluteUrl } from "../app/lib/site";

describe("absoluteUrl", () => {
  it("falls back to localhost when no site URL is configured", () => {
    expect(absoluteUrl("/ward/3")).toBe("http://localhost:5173/ward/3");
  });
});
```

- [ ] **Step 2: Run the test.** Run `npm test -- site`. Expected: PASS already (implemented in Task 5); it pins the behaviour.

- [ ] **Step 3: Implement `app/routes/poster.tsx`**

```tsx
import QRCode from "qrcode";
import { data, useLoaderData } from "react-router";
import type { Route } from "./+types/poster";
import { loadDataset } from "../data/load.server";
import { summarizeYear, yearsFor } from "../lib/aggregate";
import { formatFy, formatTaka, formatTakaFull, perHousehold, toBnDigits } from "../lib/format";
import { useT } from "../lib/i18n";
import { SCHEME_LABEL } from "../lib/labels";
import { pageMeta } from "../lib/meta";
import { absoluteUrl } from "../lib/site";

export function meta() {
  return pageMeta("প্রিন্টযোগ্য পোস্টার", "নোটিশ বোর্ড, হাট-বাজার ও মসজিদে লাগানোর জন্য পোস্টার।");
}

type Poster = { title: string; big: string | null; bigLabel: string | null; facts: { label: string; value: string }[]; path: string };

export async function loader({ params }: Route.LoaderArgs) {
  const ds = loadDataset();
  const id = ds.union.id;
  let poster: Poster;
  if (params.kind === "home" && params.id === id) {
    const fy = yearsFor(ds.budget, id)[0];
    const s = fy ? summarizeYear(ds.budget, ds.reportedTotals, id, fy) : null;
    const income = s ? s.reportedIncome ?? s.income : null;
    const perHh = income !== null ? perHousehold(income, ds.union.households) : null;
    const published = ds.disclosures.filter((d) => d.published === "yes").length;
    poster = {
      title: "কাতুলী ইউনিয়নের টাকা কোথা থেকে আসে, কোথায় যায়?",
      big: income !== null ? formatTaka(income, "bn") : null,
      bigLabel: s ? `${formatFy(s.fiscalYear, "bn")} অর্থবছরের আয়${perHh !== null ? ` — প্রতি পরিবারে প্রায় ${formatTakaFull(perHh, "bn")}` : ""}` : null,
      facts: [
        { label: "আইন অনুযায়ী প্রকাশযোগ্য নথি", value: `${toBnDigits(ds.disclosures.length)}টির মধ্যে ${toBnDigits(published)}টি প্রকাশিত` },
        { label: "তথ্য চাওয়ার অধিকার", value: "তথ্য অধিকার আইন ২০০৯ — ২০ কার্যদিবসে উত্তর দেওয়ার কথা" },
        { label: "ঘুষ চাইলে", value: "দুদক হটলাইন ১০৬ (টোল-ফ্রি)" },
      ],
      path: "/",
    };
  } else if (params.kind === "ward") {
    const ward = ds.union.wards.find((w) => String(w.no) === params.id);
    if (!ward) throw data(null, { status: 404 });
    const projects = ds.projects.filter((p) => p.ward === ward.no);
    poster = {
      title: `কাতুলী ইউনিয়ন — ${toBnDigits(ward.no)} নং ওয়ার্ড`,
      big: null,
      bigLabel: null,
      facts: [
        ...projects.slice(0, 6).map((p) => ({ label: p.name_bn, value: p.amount !== null ? formatTakaFull(p.amount, "bn") : "টাকার পরিমাণ অজানা" })),
        ...(projects.length === 0 ? [{ label: "এই ওয়ার্ডের প্রকল্প", value: "কোনো তথ্য প্রকাশিত হয়নি" }] : []),
        { label: "ওয়ার্ড সভা", value: "বছরে অন্তত ২ বার, ৭ দিন আগে নোটিশ — সব ভোটার সদস্য" },
      ],
      path: `/ward/${ward.no}`,
    };
  } else if (params.kind === "project") {
    const p = ds.projects.find((x) => x.id === params.id);
    if (!p) throw data(null, { status: 404 });
    poster = {
      title: p.name_bn,
      big: p.amount !== null ? formatTakaFull(p.amount, "bn") : null,
      bigLabel: p.amount !== null ? "বরাদ্দ" : null,
      facts: [
        { label: "কর্মসূচি", value: SCHEME_LABEL[p.scheme].bn },
        { label: "ওয়ার্ড", value: p.ward ? toBnDigits(p.ward) : "অজানা" },
        { label: "বাস্তবায়নকারী", value: p.implementer_bn ?? "অজানা" },
        { label: "কাজের পরিমাণ", value: p.unit_of_work_bn ?? "অজানা" },
      ],
      path: `/projects/${p.id}`,
    };
  } else {
    throw data(null, { status: 404 });
  }
  const url = absoluteUrl(poster.path);
  const qr = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
  return { poster, qr, url };
}

export default function PosterPage() {
  const { poster, qr, url } = useLoaderData<typeof loader>();
  const t = useT();
  return (
    <>
      <p className="no-print">{t("এই পাতাটি A4 কাগজে প্রিন্ট করে নোটিশ বোর্ড, হাট-বাজার, মসজিদ বা স্কুলে লাগান।", "Print this page on A4 and put it up on notice boards, markets, mosques or schools.")}</p>
      <button type="button" className="btn btn-primary no-print" onClick={() => window.print()}>{t("প্রিন্ট করুন", "Print")}</button>
      <article className="poster" lang="bn">
        <h1>{poster.title}</h1>
        {poster.big ? <p className="big">{poster.big}</p> : null}
        {poster.bigLabel ? <p>{poster.bigLabel}</p> : null}
        <table className="lines"><tbody>{poster.facts.map((f) => <tr key={f.label}><td>{f.label}</td><td><strong>{f.value}</strong></td></tr>)}</tbody></table>
        <div className="qr">
          <span dangerouslySetInnerHTML={{ __html: qr }} />
          <p>ফোনের ক্যামেরা দিয়ে স্ক্যান করে বিস্তারিত দেখুন<br /><small>{url}</small></p>
        </div>
        <p className="muted">স্বাধীন নাগরিক উদ্যোগ — এটি সরকারি নোটিশ নয়। কোনো অমিল মানেই অনিয়মের প্রমাণ নয়।</p>
      </article>
    </>
  );
}
```

(Setting `dangerouslySetInnerHTML` here is safe: the SVG is generated at build time by `qrcode` from our own URL, never from user input.)

- [ ] **Step 4: Build.** Run `npm run typecheck && npm run build`. Expected: PASS, and `build/client/poster/home/katuli/index.html` contains `<svg`.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: A4 posters with QR codes for home, wards and projects"
```

---

### Task 13: Offline support (service worker), manifest, icon, size budget

**Files:**
- Create: `scripts/postbuild.ts` (replaces the stub), `scripts/check-size.ts`, `public/manifest.webmanifest`, `public/icon.svg`, `public/archive/.gitkeep`, `public/photos/.gitkeep`
- Create: `scripts/lib/sw-template.ts`
- Test: `tests/sw.test.ts`

**Interfaces:**
- Produces: `renderServiceWorker({version, base, precache}): string`, `pickPrecache(files: string[]): string[]`

- [ ] **Step 1: Write the failing test**

`tests/sw.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { pickPrecache, renderServiceWorker } from "../scripts/lib/sw-template";

describe("service worker", () => {
  const files = ["index.html", "assets/root-abc.js", "assets/root-abc.css", "assets/noto-bengali-x.woff2", "budget/index.html", "projects/index.html", "projects/p1/index.html", "archive/2026/big.pdf", "_root.data", "budget.data", "projects/p1.data", "icon.svg"];
  it("precaches the app shell and key pages, not every record or archived PDF", () => {
    const pre = pickPrecache(files);
    expect(pre).toContain("assets/root-abc.js");
    expect(pre).toContain("assets/noto-bengali-x.woff2");
    expect(pre).toContain("");
    expect(pre).toContain("budget/");
    expect(pre).toContain("budget.data");
    expect(pre).not.toContain("archive/2026/big.pdf");
    expect(pre).not.toContain("projects/p1/");
  });
  it("renders a worker with the version and base baked in", () => {
    const sw = renderServiceWorker({ version: "v1", base: "/katuli/", precache: ["", "assets/a.js"] });
    expect(sw).toContain('"katuli-v1"');
    expect(sw).toContain('"/katuli/assets/a.js"');
    expect(sw).toContain("addEventListener(\"fetch\"");
  });
});
```

- [ ] **Step 2: Run the test.** Run `npm test -- sw`. Expected: FAIL.

- [ ] **Step 3: Implement `scripts/lib/sw-template.ts`**

```ts
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
```

- [ ] **Step 4: Implement `scripts/postbuild.ts`**

```ts
import fs from "node:fs";
import path from "node:path";
import { pickPrecache, renderServiceWorker } from "./lib/sw-template";

const out = path.resolve("build/client");
const base = process.env.BASE_PATH ?? "/";

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
```

- [ ] **Step 5: Implement `scripts/check-size.ts`**

```ts
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
```

- [ ] **Step 6: Static files**

`public/manifest.webmanifest`:
```json
{
  "name": "কাতুলীর বাজেট — স্বাধীন নাগরিক উদ্যোগ",
  "short_name": "কাতুলীর বাজেট",
  "lang": "bn",
  "start_url": ".",
  "scope": ".",
  "display": "standalone",
  "background_color": "#fbf8f3",
  "theme_color": "#0f6b66",
  "icons": [{ "src": "icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any" }]
}
```

`public/icon.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0f6b66"/><circle cx="32" cy="32" r="17" fill="none" stroke="#f6e6d0" stroke-width="5"/><path d="M24 32h16M32 24v16" stroke="#f6e6d0" stroke-width="5" stroke-linecap="round"/></svg>
```

- [ ] **Step 7: Run tests, build and size check.** Run `npm test && npm run build && npm run check:size`. Expected: PASS, with a total under 200 KB. If it's over, check which chunk is large. The likely culprit is lucide imported as a namespace; always use named imports.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: offline service worker, web manifest, 404 fallback and first-load size budget"
```

---

### Task 14: Daily scraper

**Files:**
- Create: `scripts/lib/scrape-core.ts`, `scripts/scrape.ts`, `scripts/sources.json`
- Test: `tests/scrape-core.test.ts`

**Interfaces:**
- Produces:
  - `type Source = { id: string; issuer: Issuer; url: string; linkPattern: string; tender?: boolean }`
  - `extractLinks(html, pageUrl, pattern): {url, text}[]`
  - `isFileUrl(url): boolean`
  - `shortHash(s): string`
  - `draftDocumentRow(link, source, today): Record<string,string>`
  - `draftTenderRow(link, source, today): Record<string,string>`
  - `appendRows(csv, rows, columns): string`
  - `knownUrls(csv): Set<string>`

- [ ] **Step 1: Write the failing test**

`tests/scrape-core.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { appendRows, draftDocumentRow, extractLinks, isFileUrl, knownUrls } from "../scripts/lib/scrape-core";

const html = `<html><body>
  <a href="/pages/notices/abc">বাজেট সভার নোটিশ</a>
  <a href="https://objectstorage.example/office-katuliup/2026/x.pdf">  বাজেট ২০২৬-২৭ </a>
  <a href="/pages/notices/abc">duplicate</a>
  <a href="#top">top</a>
  <a href="javascript:void(0)">js</a>
  <a href="/pages/officers">officers</a>
</body></html>`;

describe("extractLinks", () => {
  it("resolves relative URLs, trims text, filters by pattern and dedupes", () => {
    const links = extractLinks(html, "https://katuliup.tangail.gov.bd/pages/notices", "/notices/|\\.pdf$");
    expect(links).toEqual([
      { url: "https://katuliup.tangail.gov.bd/pages/notices/abc", text: "বাজেট সভার নোটিশ" },
      { url: "https://objectstorage.example/office-katuliup/2026/x.pdf", text: "বাজেট ২০২৬-২৭" },
    ]);
  });
  it("returns nothing for empty or changed HTML", () => {
    expect(extractLinks("", "https://x.test/", ".*")).toEqual([]);
    expect(extractLinks("<p>no links</p>", "https://x.test/", ".*")).toEqual([]);
  });
});

describe("rows", () => {
  it("builds a draft document row with a stable id", () => {
    const row = draftDocumentRow({ url: "https://a.test/x.pdf", text: "" }, { id: "katuli-notices", issuer: "union", url: "https://a.test/", linkPattern: "" }, "2026-09-26");
    expect(row.id).toMatch(/^katuli-notices-[0-9a-f]{8}$/);
    expect(row.status).toBe("draft");
    expect(row.title_bn).toBe("x.pdf");
    expect(row.date).toBe("2026-09-26");
  });
  it("appends CSV rows with proper quoting and a trailing newline", () => {
    const csv = "id,title_bn\nold,পুরনো";
    const next = appendRows(csv, [{ id: "new", title_bn: "কমা, সহ" }], ["id", "title_bn"]);
    expect(next).toBe('id,title_bn\nold,পুরনো\nnew,"কমা, সহ"\n');
    expect(knownUrls("id,url\na,https://x.test/1\nb,\n")).toEqual(new Set(["https://x.test/1"]));
  });
  it("detects downloadable files", () => {
    expect(isFileUrl("https://a.test/x.PDF")).toBe(true);
    expect(isFileUrl("https://a.test/x.jpg?v=2")).toBe(true);
    expect(isFileUrl("https://a.test/pages/notices/1")).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test.** Run `npm test -- scrape-core`. Expected: FAIL.

- [ ] **Step 3: Implement `scripts/lib/scrape-core.ts`**

```ts
import { createHash } from "node:crypto";
import * as cheerio from "cheerio";
import Papa from "papaparse";
import type { Issuer } from "../../app/data/schemas";

export type Source = { id: string; issuer: Issuer; url: string; linkPattern: string; tender?: boolean };
export type Link = { url: string; text: string };

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
    out.push({ url: abs, text: $(el).text().replace(/\s+/g, " ").trim() });
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
```

- [ ] **Step 4: Implement `scripts/scrape.ts`**

```ts
import fs from "node:fs";
import path from "node:path";
import { appendRows, csvColumns, draftDocumentRow, draftTenderRow, extractLinks, isFileUrl, knownUrls, type Source } from "./lib/scrape-core";

const UA = "KatuliBudgetBot/1.0 (independent citizen transparency project)";
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const today = new Date().toISOString().slice(0, 10);
const year = today.slice(0, 4);
const docsPath = path.resolve("data/documents.csv");
const tendersPath = path.resolve("data/tenders.csv");
const sources: Source[] = JSON.parse(fs.readFileSync(path.resolve("scripts/sources.json"), "utf8"));

async function get(url: string): Promise<Response> {
  return fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30_000), redirect: "follow" });
}

async function main() {
  let docsCsv = fs.readFileSync(docsPath, "utf8");
  let tendersCsv = fs.readFileSync(tendersPath, "utf8");
  const known = new Set([...knownUrls(docsCsv), ...knownUrls(tendersCsv)]);
  const summary: string[] = [];
  const failures: string[] = [];

  for (const source of sources) {
    try {
      const res = await get(source.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const links = extractLinks(await res.text(), source.url, source.linkPattern).filter((l) => !known.has(l.url));
      for (const link of links) {
        known.add(link.url);
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
```

- [ ] **Step 5: Write `scripts/sources.json`**

Use the URLs confirmed in `docs/research/katuli-data.md` and `docs/research/upstream-sources.md` (Task 16). Initial contents:

```json
[
  { "id": "katuli-notices", "issuer": "union", "url": "https://katuliup.tangail.gov.bd/pages/notices", "linkPattern": "/pages/notices/.+|\\.(pdf|jpe?g|png|docx?)(\\?|$)" },
  { "id": "katuli-files", "issuer": "union", "url": "https://katuliup.tangail.gov.bd/pages/files", "linkPattern": "\\.(pdf|jpe?g|png|docx?|xlsx?)(\\?|$)" },
  { "id": "katuli-tenders", "issuer": "union", "url": "https://katuliup.tangail.gov.bd/pages/tenders", "linkPattern": "/pages/tenders/.+|\\.(pdf|jpe?g|png|docx?)(\\?|$)", "tender": true },
  { "id": "katuli-projects", "issuer": "union", "url": "https://katuliup.tangail.gov.bd/pages/field-projects", "linkPattern": "\\.(pdf|jpe?g|png|docx?|xlsx?)(\\?|$)" },
  { "id": "sadar-notices", "issuer": "upazila", "url": "https://tangailsadar.tangail.gov.bd/pages/notices", "linkPattern": "(?=.*(katuli|কাতুলী|\\.pdf))" },
  { "id": "sadar-tenders", "issuer": "upazila", "url": "https://tangailsadar.tangail.gov.bd/pages/tenders", "linkPattern": "/pages/tenders/.+|\\.(pdf|jpe?g|png|docx?)(\\?|$)", "tender": true }
]
```

- [ ] **Step 6: Run the tests, then a dry run against the live sites**

Run: `npm test -- scrape-core` → PASS.
Run: `npm run scrape`. Expected: prints a summary, and any failing source shows under "Sources that failed". Then inspect `git diff --stat data public/archive`. If a portal page lists nothing useful, tighten or fix that source's `linkPattern` or URL and re-run. Afterwards, reset the dry-run output with `git checkout data/documents.csv data/tenders.csv && git clean -fd public/archive` (these are files this task just created).

- [ ] **Step 7: Commit**

```bash
git add scripts tests/scrape-core.test.ts && git commit -m "feat: daily scraper that archives new documents and tenders as draft rows"
```

---

### Task 15: GitHub Actions and the maintainer guide

**Files:**
- Create: `.github/workflows/deploy.yml`, `.github/workflows/scrape.yml`, `data/README.md`

- [ ] **Step 1: `.github/workflows/deploy.yml`**

```yaml
name: Deploy site
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
        env:
          BASE_PATH: ${{ vars.BASE_PATH || format('/{0}/', github.event.repository.name) }}
          VITE_SITE_URL: ${{ vars.SITE_URL || format('https://{0}.github.io', github.repository_owner) }}
      - run: npm run check:size
      - uses: actions/upload-pages-artifact@v3
        with:
          path: build/client
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: `.github/workflows/scrape.yml`**

```yaml
name: Check for new documents
on:
  schedule:
    - cron: "30 0 * * *"   # 06:30 Bangladesh time
  workflow_dispatch:
permissions:
  contents: write
  pull-requests: write
jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run scrape
      - uses: peter-evans/create-pull-request@v7
        with:
          branch: scraper/new-documents
          delete-branch: true
          title: "নতুন নথি পাওয়া গেছে — যাচাই করুন"
          body-path: scrape-summary.md
          commit-message: "data: new documents found by the daily scraper"
          add-paths: |
            data/documents.csv
            data/tenders.csv
            public/archive/**
```

- [ ] **Step 3: `data/README.md` (maintainer guide)**

```markdown
# Editing the data

Everything on the site comes from the files in this folder. Open the CSVs in Excel, LibreOffice or Google Sheets, and save them as **CSV (UTF-8)**.

## Rules
- **Amounts** can be typed however they appear in the document: `১,৫৯,২০০`, `159200`, `৳১৫৯২০০` or `১৫৯২০০ টাকা`. Do not write "লাখ" or "lakh"; write the full number.
- **Dates** are `YYYY-MM-DD` (e.g. `2026-09-26`). **Fiscal years** look like `2026-27`.
- **Every figure needs a `source_doc`.** Add the document to `documents.csv` first, and put the file in `public/archive/<year>/`.
- A row with `status` set to `draft` (in `projects.csv` the column is `status_row`) is **hidden** from the site. Set it to `published` once you've checked it.
- **Never** add beneficiary names, NID numbers, phone numbers or photos of people receiving allowances. Only counts go in `allowance_counts.csv`.
- **Wording:** describe what a document says and what a volunteer saw, with the date. Never call anyone corrupt or a thief.

## Files
| File | What it holds |
|---|---|
| `union.json` | Union facts, wards, villages, leadership (with the date you verified it), comparison unions, your WhatsApp number (optional) |
| `documents.csv` | Every source document. `reliability`: `official`, `low` (inconsistent document) or `observed` |
| `disclosures.csv` | The scorecard of what the law requires to be public. `published`: `yes` / `no` / `partial` |
| `budget_lines.csv` | One row per budget line item. `source_type`: `union` (UP's own document), `upstream` (another office's allocation list) or `observed` |
| `budget_reported_totals.csv` | The totals written in the document, so the site can show when the line items don't add up |
| `projects.csv` / `verifications.csv` | Development projects, plus volunteer site visits (photos go in `public/photos/`) |
| `tenders.csv` | Tender notices |
| `service_fees.csv` | Official fee and time limit for each service |
| `allowances.csv` / `allowance_counts.csv` | Allowance rules and amounts; per-ward counts |

## The daily checker
Every morning a GitHub Action checks the union and upazila websites (`scripts/sources.json`). If it finds new notices, files or tenders, it saves a copy under `public/archive/`, adds **draft** rows, and opens a pull request. Open each link, fill in the details, set `status` to `published`, and merge. The site then redeploys automatically.

## Check before you push
    npm test        # checks every CSV row; errors name the file, row and column
    npm run dev     # preview at http://localhost:5173
```

- [ ] **Step 4: Validate the YAML syntax.** Run `npx --yes yaml-lint .github/workflows/*.yml`. If that isn't available, run `node -e "require('fs')"` as a no-op and review the files by eye. Expected: no syntax errors.

- [ ] **Step 5: Commit**

```bash
git add .github data/README.md && git commit -m "ci: GitHub Pages deploy and daily scraper PR workflow; maintainer data guide"
```

---

### Task 16: Research notes and real seed data

**Files:**
- Create: `docs/research/katuli-data.md`, `docs/research/rights-law.md`, `docs/research/civic-tech.md`, `docs/research/upstream-sources.md`. These hold the research agents' reports verbatim, trimmed only for formatting, with all their URLs.
- Modify: every file in `data/`, `scripts/sources.json` (URLs confirmed by the upstream research)
- Copy: source documents from the session scratchpad (`sources/katuli`, `sources/others`, `sources/neighbours`, `sources/upstream`) into `public/archive/research/` for every document cited

**Seeding rules:**
- **Katuli FY2014-15 budget.** Re-read the saved portal page (`sources/katuli/`). Transcribe **leaf line items only**, with no subtotal rows, as `source_type=union`. The document is `katuli-budget-2014-15` with `reliability=low` and `note_bn` "একই নথিতে দুটি সভার তারিখ ও দুজন সভাপতির নাম — অন্য ইউনিয়নের টেমপ্লেট থেকে নেওয়া বলে মনে হয়" ("Two meeting dates and two chairs' names in the same document — appears copied from another union's template"). Put the document's own totals in `budget_reported_totals.csv` (income 94,58,058 proposed). Include the 2013-14 revised and 2012-13 actual columns as extra rows with `kind=revised` / `kind=actual` under their own fiscal years.
- **Silimpur FY2023-24.** Use the lines from the report as `union=silimpur` rows, and the totals (income 1,84,42,514, spending 1,74,37,467) as reported totals. Add Silimpur to `union.json` `comparisons`. Add any other neighbour budgets found by the upstream research the same way.
- **Upstream allocations naming Katuli** (upazila PIO lists, EGPP, LGD grants): add as `source_type=upstream` budget lines under the correct fiscal year, with category mapping `adp`, `food_programmes`, `employment`, `block_grant`, `safety_net` and `kind=actual`. Project-level rows go into `projects.csv` with `source_type=upstream`.
- **Projects.** Add the ~9 projects on Katuli's portal (`/pages/field-projects`), with `status=unknown` and amounts only where the page gives them. Ids look like `katuli-portal-<short-slug>`.
- **Union facts.**
  - Keep the 2011 census figures unless the upstream research found 2022 figures. If it did, update `population`, `households` and `census_year` and add the census document.
  - Add the 24 villages to `villages_bn`/`villages_en`. Check the Bangla spellings against the saved bn.wikipedia page.
  - Leadership: Chairman "মোঃ ইকবাল হোসেন" and Secretary "মাহবুবুর রহমান", both with `verified_on: null` and `note_bn` "পোর্টালের কর্মকর্তা তালিকায় তারিখ নেই; ২০২৬ সালে পদে আছেন কিনা যাচাই করা হয়নি" ("The portal's officer list is undated; not verified whether they are in office in 2026").
- **Disclosures** (all `published=no` unless research found otherwise):

  | id | Legal basis |
  |---|---|
  | `budget-current` | UP Act s.57 |
  | `final-accounts` | s.58 |
  | `open-budget-minutes` | s.57 |
  | `ward-shava-minutes` | s.5–6 |
  | `citizen-charter` | s.49 |
  | `tax-schedule` | s.65–66 |
  | `project-list` | s.6(2) |
  | `beneficiary-counts` | s.6(1) |
  | `audit-report` | s.6(3), s.59–61 |
  | `tender-notices` | PPR 2008 |

  Each gets a precise Bangla `rti_request_bn`, e.g. "২০২৬-২৭ অর্থবছরের অনুমোদিত বাজেটের সত্যায়িত কপি (আয় ও ব্যয়ের খাতওয়ারি বিবরণসহ)" ("A certified copy of the approved FY2026-27 budget, with head-wise income and spending").
- **Service fees.** Add the birth/death registration rows from `orgbdr.gov.bd` (free within 45 days; Tk 25 from 45 days to 5 years; Tk 50 after 5 years; Tk 100 to correct date of birth; Tk 50 other corrections; duplicate Tk 50). Add trade licence, citizenship certificate and heir (warish) certificate with `official_fee` blank and `note_bn` "কাতুলীর সিটিজেন চার্টারে থাকার কথা — প্রকাশিত হয়নি" ("Should be in Katuli's citizen charter — not published").
- **Allowances, FY2026-27.**
  - Old age ৳700: men 65+, women 62+; annual income up to ৳45,000.
  - Widow/deserted women ৳700.
  - Disability ৳1,000; requires a Suborno Nagorik card.
  - Mother & child benefit ৳850.
  - VWB (formerly VGD): monthly amount blank, `payment_note_bn` "প্রতি মাসে চাল (পরিমাণ যাচাই চলছে)" ("Rice every month (quantity being verified)").
  - Selection text: the ward shava prepares the priority list (s.6), and the UP cannot change it without a proven irregularity (s.6(7)).
  - Add per-ward counts only if the upstream research found them.
- **Law and portal documents.** Add these `documents.csv` rows with their URLs: `law-up-act-2009`, `law-up-amend-2026`, `law-rti-act-2009`, `grs-portal`, `dss-allowances-2026-27`, `orgbdr-fees`, `tib-nhs-2023`.

- [ ] **Step 1: Write the four research notes**
- [ ] **Step 2: Copy the cited source files into `public/archive/research/` and fill in `documents.csv`**
- [ ] **Step 3: Fill in every other data file according to the rules above**
- [ ] **Step 4: Update `scripts/sources.json` with the scrapeable URLs the research confirmed**
- [ ] **Step 5: Run `npm test && npm run build && npm run check:size`.** Expected: PASS. Any data error names the exact file, row and column; fix the data, not the schema.
- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "data: seed Katuli, neighbour and upstream figures, disclosures, fees, allowances; add research notes"
```

---

### Task 17: Browser verification and final review

**Files:** none (fixes go wherever issues are found)

- [ ] **Step 1: Start the dev server** in the browser pane (`preview_start` with name `dev`).
- [ ] **Step 2: Golden path at 375px (mobile preset).** Walk through: home → headline and per-household figure → budget → expand a category → source link → year chip → wards → ward 4 → a project → report block → tenders (empty state) → services → allowances → rights → RTI (`/rights/rti?item=budget-current` preselects the budget item) → documents → about → poster. Check the console for errors and hydration warnings.
- [ ] **Step 3: Edge checks.**
  - Resize to 320px wide and confirm there is no horizontal scroll: `document.documentElement.scrollWidth <= 320`.
  - Toggle English and back.
  - Check the dark colour scheme.
  - Open print preview for the poster and the RTI letter, via emulated print media or by checking `@media print` rules through computed styles.
  - Zoom into Bangla conjuncts (ক্ষ, জ্ঞ, ন্ত্র) in the headline and check they render.
- [ ] **Step 4: Offline check on a production build.** Run `npm run build` and `npx vite preview --outDir build/client` (or any static server). Load `/`, register the service worker, then check that `caches.keys()` includes `katuli-…`.
- [ ] **Step 5: Whole-branch review.** Use superpowers:requesting-code-review against the spec. Fix the findings.
- [ ] **Step 6: Commit any fixes**

```bash
git add -A && git commit -m "fix: issues found in browser verification and review"
```
