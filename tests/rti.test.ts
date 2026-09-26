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
