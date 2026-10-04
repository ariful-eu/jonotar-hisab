import { Search } from "lucide-react";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useLang, useT } from "../lib/i18n";
import { searchIndex, type SearchEntry } from "../lib/search";

const KIND_LABEL: Record<SearchEntry["kind"], { bn: string; en: string }> = {
  page: { bn: "পাতা", en: "Page" },
  service: { bn: "সেবা", en: "Service" },
  guide: { bn: "নাগরিক গাইড", en: "Guide" },
  contact: { bn: "নম্বর", en: "Number" },
  ward: { bn: "ওয়ার্ড", en: "Ward" },
  work: { bn: "উন্নয়ন কাজ", en: "Work" },
  tender: { bn: "টেন্ডার", en: "Tender" },
};

export function SearchBox() {
  const t = useT();
  const { lang } = useLang();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<SearchEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const loading = useRef(false);

  const load = () => {
    if (entries || loading.current) return;
    loading.current = true;
    fetch(`${import.meta.env.BASE_URL}search-index.json`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: SearchEntry[]) => setEntries(data))
      .catch(() => setFailed(true))
      .finally(() => {
        loading.current = false;
      });
  };

  const results = entries ? searchIndex(entries, query) : [];
  return (
    <form
      role="search"
      className="searchbox"
      onSubmit={(e) => {
        e.preventDefault();
        if (results[0]) navigate(results[0].url);
      }}
    >
      <label htmlFor="site-search" className="sr-only">{t("সাইটে খুঁজুন", "Search the site")}</label>
      <div className="search-input">
        <Search size={20} aria-hidden />
        <input
          id="site-search"
          type="search"
          value={query}
          onFocus={load}
          onChange={(e) => {
            load();
            setQuery(e.target.value);
          }}
          placeholder={t("কী খুঁজছেন? যেমন: জন্ম নিবন্ধন, ভাতা, ৯৯৯", "What are you looking for? e.g. birth registration")}
          autoComplete="off"
        />
      </div>
      {query.trim() ? (
        <div className="search-results" aria-live="polite">
          {failed ? (
            <p className="muted">{t("খোঁজার তালিকা আনা যায়নি — ইন্টারনেট সংযোগ দেখুন।", "Couldn't load search — check your connection.")}</p>
          ) : !entries ? (
            <p className="muted">{t("খুঁজছি…", "Searching…")}</p>
          ) : results.length === 0 ? (
            <p className="muted">{t("কিছু পাওয়া যায়নি। অন্য শব্দে চেষ্টা করুন।", "Nothing found. Try another word.")}</p>
          ) : (
            <ul>
              {results.map((r) => (
                <li key={`${r.kind}-${r.url}-${r.title_bn}`}>
                  <Link to={r.url}>
                    <span className="grow">{lang === "en" && r.title_en ? r.title_en : r.title_bn}</span>
                    <span className="chip">{KIND_LABEL[r.kind][lang]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </form>
  );
}
