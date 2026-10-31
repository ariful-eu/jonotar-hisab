import { useEffect, useState } from "react";
import { BLOOD_GROUPS, canGiveTo, canReceiveFrom, groupLabel, parseGroupsCsv, type BloodGroup, type GroupAvailability } from "../lib/blood";
import { useT } from "../lib/i18n";

/** Which groups have donors in the union right now. Read in the browser from the owner's published sheet tab. */
export function BloodAvailability({ csvUrl }: { csvUrl: string }) {
  const t = useT();
  const [state, setState] = useState<{ status: "loading" | "ok" | "error"; groups?: GroupAvailability }>({ status: "loading" });
  useEffect(() => {
    let alive = true;
    fetch(csvUrl, { cache: "no-store" })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((text) => alive && setState({ status: "ok", groups: parseGroupsCsv(text) }))
      .catch(() => alive && setState({ status: "error" }));
    return () => { alive = false; };
  }, [csvUrl]);

  if (state.status === "loading") return <p className="muted" role="status">{t("তথ্য আনা হচ্ছে…", "Loading…")}</p>;
  if (state.status === "error" || !state.groups) {
    return <p className="muted" role="status">{t("এখন দেখা যাচ্ছে না — পরে আবার চেষ্টা করুন।", "Can't load right now — try again later.")}</p>;
  }
  const groups = state.groups;
  return (
    <>
      <ul className="blood-grid" aria-label={t("রক্তের গ্রুপ", "Blood groups")}>
        {BLOOD_GROUPS.map((g) => {
          const v = groups[g];
          return (
            <li key={g} className={`blood-cell${v === true ? " is-yes" : ""}`}>
              <span className="blood-group">{groupLabel(g)}</span>
              <span className="blood-state">{v === true ? t("আছে", "Available") : v === false ? t("এখনো নেই", "None yet") : t("তথ্য নেই", "No data")}</span>
            </li>
          );
        })}
      </ul>
      <p className="muted small">{t("রক্তদাতার নাম-নম্বর দেখানো হয় না।", "Donor names and numbers are never shown.")}</p>
    </>
  );
}

/** "Which group can give to whom", for one picked group. Pure client state. */
export function CompatibilityPicker() {
  const t = useT();
  const [g, setG] = useState<BloodGroup | null>(null);
  return (
    <>
      <div className="chips" role="group" aria-label={t("আপনার বা রোগীর গ্রুপ বেছে নিন", "Pick your or the patient's group")}>
        {BLOOD_GROUPS.map((x) => (
          <button key={x} type="button" className={`chip chip-btn${g === x ? " active" : ""}`} aria-pressed={g === x} onClick={() => setG(x)}>{groupLabel(x)}</button>
        ))}
      </div>
      {g ? (
        <dl className="kv compat" aria-live="polite">
          <dt>{t(`${groupLabel(g)} নিতে পারেন`, `${groupLabel(g)} can receive from`)}</dt>
          <dd><strong>{canReceiveFrom(g).map(groupLabel).join(", ")}</strong></dd>
          <dt>{t(`${groupLabel(g)} দিতে পারেন`, `${groupLabel(g)} can give to`)}</dt>
          <dd><strong>{canGiveTo(g).map(groupLabel).join(", ")}</strong></dd>
        </dl>
      ) : <p className="muted">{t("একটি গ্রুপে চাপ দিন।", "Tap a group.")}</p>}
      <p className="muted small">{t("চূড়ান্ত মিল দেখবেন হাসপাতালের ডাক্তার।", "The hospital doctor confirms the match.")}</p>
    </>
  );
}
