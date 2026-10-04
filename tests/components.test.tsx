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
    expect(screen.getByText("তথ্য নেই")).toBeTruthy();
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
  it("scales against a shared max when rendered one item at a time", () => {
    const { container } = wrap(<Bars tone="expense" max={200} items={[{ key: "a", label: "কৃষি", amount: 50 }]} />);
    expect(container.querySelector<HTMLElement>(".bar-fill")!.style.width).toBe("25%");
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
    expect(screen.getByText("৩টির মধ্যে অনলাইনে পাওয়া গেছে ১টি")).toBeTruthy();
    const links = screen.getAllByRole("link", { name: /কীভাবে চাইবেন/ });
    expect(links[0].getAttribute("href")).toBe("/rights/rti?item=budget-current");
    expect(links).toHaveLength(2);
  });
});

describe("SourceBadge", () => {
  it("shows the source type and a low-reliability warning", () => {
    wrap(<SourceBadge type="union" doc={{ id: "d", title_bn: "বাজেট", title_en: null, url: "https://example.org/x", archive_path: null, reliability: "low", issuer: "union", date: null }} />);
    expect(screen.getByText("ইউনিয়নের নিজের কাগজ")).toBeTruthy();
    expect(screen.getByText("কম নির্ভরযোগ্য")).toBeTruthy();
    expect(screen.getByRole("link", { name: "কাগজ দেখুন" }).getAttribute("href")).toBe("https://example.org/x");
  });
});
