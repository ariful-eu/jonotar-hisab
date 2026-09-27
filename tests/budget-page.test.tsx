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
    expect(screen.getByRole("link", { name: /তথ্য চান/ }).getAttribute("href")).toBe("/rights/rti?item=budget-current");
  });

  it("shows অজানা per household when a neighbour's households are unknown", async () => {
    renderWith({
      unionId: "katuli", households: 6433, years: [], fy: null, summary: null, docs: {},
      comparison: [{ id: "silimpur", name_bn: "সিলিমপুর", name_en: "Silimpur", fiscalYear: "2023-24", kind: "proposed", income: 18442514, perHousehold: null }],
    });
    expect(await screen.findByText(/সিলিমপুর/)).toBeTruthy();
    expect(screen.getAllByText("তথ্য নেই").length).toBeGreaterThan(0);
  });
});
