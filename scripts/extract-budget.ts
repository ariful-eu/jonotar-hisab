import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";
import { loadDataset } from "../app/data/load.server";
import { appendRows, csvColumns } from "./lib/scrape-core";
import { buildDraftRows, buildExtractionPrompt, mediaTypeForExt, parseModelJson, toContentBlock } from "./lib/extract-budget";

const MODEL = process.env.EXTRACT_MODEL ?? "claude-opus-5-5";

function usage(): never {
  console.error("Usage: npm run extract-budget -- <document-id> [fiscal-year-hint]\n" + "The document must already have a row in data/documents.csv with an archive_path (a PDF or image under public/).");
  process.exit(1);
}

async function main() {
  const docId = process.argv[2];
  if (!docId) usage();
  const fiscalYearHint = process.argv[3];

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY is not set. This is a paid API call, so it never runs without an explicit key.");
    process.exit(1);
  }

  const ds = loadDataset();
  const doc = ds.documents.find((d) => d.id === docId);
  if (!doc) {
    console.error(`No document "${docId}" in data/documents.csv. Add it first (see data/README.md), then run this on its archive_path.`);
    process.exit(1);
  }
  if (!doc.archive_path) {
    console.error(`Document "${docId}" has no archive_path. Save a copy of the file under public/archive/ and set archive_path first.`);
    process.exit(1);
  }
  const filePath = path.resolve("public", doc.archive_path);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
  const ext = path.extname(filePath).toLowerCase();
  const mediaType = mediaTypeForExt(ext);
  if (!mediaType) {
    console.error(`Don't know how to send a "${ext}" file to Claude. Convert it to PDF, PNG or JPEG first.`);
    process.exit(1);
  }
  const data = fs.readFileSync(filePath).toString("base64");

  console.log(`Reading ${filePath} (${(data.length / 1024).toFixed(0)} KB base64) with ${MODEL}…`);
  const client = new Anthropic({ apiKey });
  const prompt = buildExtractionPrompt({ union: ds.union.id, docId, fiscalYearHint });
  const source = toContentBlock(mediaType, data);
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    messages: [{ role: "user", content: [source, { type: "text", text: prompt }] }],
  });
  const text = res.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("\n");

  let modelOutput: unknown;
  try {
    modelOutput = parseModelJson(text);
  } catch (e) {
    console.error(`Could not find JSON in the model's response: ${(e as Error).message}`);
    console.error("--- raw response ---\n" + text);
    process.exit(1);
  }

  const { rows, errors } = buildDraftRows(modelOutput, { union: ds.union.id, docId, fiscalYear: fiscalYearHint ?? doc.fiscal_year ?? "" });
  const csvPath = path.resolve("data/budget_lines.csv");
  const current = fs.readFileSync(csvPath, "utf8");
  fs.writeFileSync(csvPath, appendRows(current, rows, csvColumns(current)));

  const summary = [
    `## AI-read draft rows from "${docId}" (${rows.length} rows, ${errors.length} rejected)`,
    "",
    "**Every row below was added with `status=draft`, so none of it is on the site yet.** Open the source document, check each row's head, amount, kind and fiscal year, fix anything wrong, then set `status` to `published` and commit.",
    "",
    "| head | amount | direction | category | kind | fiscal_year |",
    "|---|---|---|---|---|---|",
    ...rows.map((r) => `| ${r.head_bn} | ${r.amount} | ${r.direction} | ${r.category} | ${r.kind} | ${r.fiscal_year} |`),
    ...(errors.length ? ["", "### Rows the model produced that could not be used", ...errors.map((e) => `- ${e}`)] : []),
  ].join("\n");
  fs.writeFileSync("extract-summary.md", summary);
  console.log(summary);
  if (rows.length === 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
