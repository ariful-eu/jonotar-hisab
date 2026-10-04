# জনতার হিসাব: product roadmap

_Last updated 2026-10-04._

## Vision
Every person in a Bangladeshi union can find, in plain Bangla on a cheap phone:
- how to get a government service
- what support they're entitled to
- whom to call
- what's happening with their union's work and money

We start with Katuli Union (Tangail Sadar) and grow union by union.

**Positioning:** a helpful **citizen information service**, not a watchdog. Transparency is a feature (budgets, works, tenders, documents), but the reason people return is everyday usefulness: services, allowances, numbers and notices.

## Where we are: v1, a static site (live)
- **Service guides:** birth/death registration, certificate correction, citizenship and heir certificates, trade licence, land mutation, allowance application. Each covers papers, official fees, where to go and online links.
- **Allowance checker** that runs on the phone (nothing is stored or sent).
- **Useful numbers:** verified national helplines and Tangail Sadar offices, tap to call.
- **Notices & tenders:** a daily automatic checker reads union, upazila, district and LGED websites; verified LGED tenders publish themselves.
- **Your area:** ward pages, plus "my ward" remembered on the device.
- **Union budget** in plain language, development works, and a citizen guide (ward shava, how to ask for information, where to go with a problem).
- **Reach and cost:** search, posters with QR codes, WhatsApp/Facebook sharing, offline support. Bangla-first with English. ৳0 running cost (GitHub Pages).

## v2: people and notifications (next)
| Feature | Why | How |
|---|---|---|
| Accounts with a phone number (OTP) | Save ward, preferences, follow topics | Lightweight backend (e.g. Supabase or Cloudflare D1 + Workers). The `app/lib/prefs.ts` interface is already the swap point. |
| Notifications for "new notice in my ward/union" | Brings people back; real value | WhatsApp Business API or SMS gateway; a weekly digest to keep costs low |
| Volunteer reporting | Photos of works starting or finishing, documents from notice boards | Upload form → moderation queue → `verifications.csv`, keeping the current review gate |
| Feedback on each page | Catch mistakes quickly | A simple "এটা কি কাজে লেগেছে?" ("was this useful?") vote plus comment, moderated |
| Union office contact and citizen charter | Most-asked missing data | RTI, or partnership with the UP |

## v3: many unions
- **Routing:** `/u/<union-slug>/...` with one `data/<union>/` folder per union. The shared content (service guides, numbers, rights) is reused.
- **Onboarding kit for a new union:** checklist, scraper source template, poster pack.
- **Upazila dashboard:** all unions side by side (budgets per household, documents found).

## Sustainability (options, not commitments)
- **Grants:** governance and access-to-information funds (e.g. TIB partners, Manusher Jonno Foundation, UNDP, a2i innovation funds).
- **CSR** from mobile operators and banks, as "digital citizen services" sponsorship (sponsor shown modestly, never in the data).
- **Paid version for NGOs or UPs:** a hosted, branded copy with their own data, staff training and print materials. The citizen version stays free.
- **Services for local businesses:** tender alerts for local contractors (opt-in, paid digest).

## How we'll measure it
- Monthly visitors per union, and the share who return.
- The most-used guides, and checker completions.
- Taps on "call" and "share".
- Documents collected (the "information we've gathered" score rising).
- Corrections reported and how quickly they're fixed.

## Risks and how we handle them
| Risk | Mitigation |
|---|---|
| Legal (defamation / cyber law) | Neutral wording, sources for everything, right of reply, no accusations (see `AGENTS.md` §2) |
| Privacy | No beneficiary names; preferences on the device; any future accounts collect the minimum (phone number only) |
| Wrong or stale information | Official sources only, "being verified" instead of guesses, dates on everything, daily checker, an easy way to report mistakes |
| Looking official | A clear "independent" banner; no government branding |
| Volunteer burnout | Automation first; review takes minutes per week |
