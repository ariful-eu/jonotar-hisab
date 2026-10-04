# Citizen information hub redesign: implementation plan

**Goal:** Reposition the site as a helpful citizen-information service, as described in `docs/superpowers/specs/2026-10-04-citizen-info-hub-redesign.md`.

**Architecture:** Same stack (React Router prerender, CSV + zod, static hosting). New pure modules carry the logic (eligibility, search, prefs, notices feed, tel links), each with unit tests. New routes are prerendered. Search uses an on-demand JSON index written by `postbuild`.

**Execution:** Native (inline), with TDD per task and the verify script after every task. One review at the end.

## Global constraints

- All rules in `AGENTS.md` §2.
- First-load size ≤ 200 KB.
- Every string goes through `t(bn, en)`.
- No guessed fees or phone numbers.

## Review focus

1. **Eligibility edge cases:** unknown income, age exactly at a threshold, a man who answers "widowed". Each must give a sensible result and never a false "no".
2. **Search:** Bangla queries with nukta variants and mixed Bangla/English. An empty query returns nothing.
3. **Phone numbers:** numbers with spaces or dashes must produce valid `tel:` links.
4. **Notices feed:** neighbour budgets and laws must not appear in it.
5. **"My ward" when `localStorage` throws:** the page still works, and the button is simply a no-op.

## Tasks

1. **Pure logic modules with tests**
   - Files: `app/lib/eligibility.ts`, `app/lib/search.ts`, `app/lib/prefs.ts`, `app/lib/contacts.ts` (`telHref`), `app/lib/notices.ts` (`noticesFeed`).
   - Each has a test in `tests/`. Write the tests first (RED), then make them pass (GREEN).
2. **Contacts data**
   - Add the `ContactRow` schema, `data/contacts.csv`, the loader, `checkRefs` and the data test.
   - Seed only verified numbers from the research.
3. **Service guides content**
   - `app/content/service-guides.ts`, built from the verified research. Add the source documents to `documents.csv`.
4. **New routes**
   - `services` hub, `services/:id`, `allowances/check`, `contacts`, `notices`.
   - Add them to `allPaths`.
   - Add the search index generation in `postbuild` (`scripts/lib/search-index.ts`; it reuses `allPaths` data through a small build script).
5. **Search UI**
   - Add the `SearchBox` component, which lazily fetches `search-index.json`.
6. **Home redesign**
   - Headline, search, quick actions, my-ward card, "এক নজরে" facts, latest notices, more sections, emergency strip, share.
7. **Navigation and copy pass**
   - Bottom nav, top nav and footer.
   - Rights → নাগরিক গাইড.
   - Documents scorecard → তথ্য সংগ্রহের অবস্থা.
   - Budget intro: info note instead of a warning.
   - Project page: remove ACC 106, reword the "report" box.
   - Services fees: "সমস্যা হলে".
   - Ward page: "এটা আমার ওয়ার্ড".
   - About page: mission and "get updates".
   - Update the tests that assert exact copy.
8. **Roadmap document:** `docs/product-roadmap.md`.
9. **Handbook update:** refresh `AGENTS.md` (map, data, conventions, history).
10. **Browser verification, final review, deploy.**
