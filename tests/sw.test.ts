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
