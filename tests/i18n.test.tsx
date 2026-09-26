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
