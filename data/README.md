# Editing the data

Everything on the site comes from the files in this folder. Open the CSVs in Excel, LibreOffice or Google Sheets, and save them as **CSV (UTF-8)**.

## Rules
- **Amounts** can be typed however they appear in the document: `১,৫৯,২০০`, `159200`, `৳১৫৯২০০` or `১৫৯২০০ টাকা`. Do not write "লাখ" or "lakh"; write the full number.
- **Dates** are `YYYY-MM-DD` (e.g. `2026-09-26`). **Fiscal years** look like `2026-27`.
- **Every figure needs a `source_doc`.** Add the document to `documents.csv` first, and put the file in `public/archive/<year>/`.
- `status` can be `published`, `draft` (waiting for review) or `ignored` (reviewed, not relevant — kept so the checker does not fetch it again). A row with `status` set to `draft` (in `projects.csv` the column is `status_row`) is **hidden** from the site. Set it to `published` once you've checked it.
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
**LGED tenders are fully automatic.** The checker reads every new LGED Tangail tender PDF and publishes a package straight to the site only when its row says *Katuli Union, Upazila: Tangail Sadar*. These rows live in `*_auto.csv`, so don't edit those files by hand. If a PDF mentions Katuli but can't be parsed, it arrives as a draft in the normal pull request instead.

Every morning a GitHub Action checks the union and upazila websites (`scripts/sources.json`). If it finds new notices, files or tenders, it saves a copy under `public/archive/`, adds **draft** rows, and opens a pull request. Open each link, fill in the details, set `status` to `published`, and merge. The site then redeploys automatically.

## Check before you push
    npm test        # checks every CSV row; errors name the file, row and column
    npm run dev     # preview at http://localhost:5173
