import { Printer, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "../lib/i18n";

export function ShareButtons({ title }: { title: string }) {
  const t = useT();
  const [url, setUrl] = useState("");
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    setUrl(window.location.href);
    setCanShare(typeof navigator.share === "function");
  }, []);
  const wa = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`.trim())}`;
  return (
    <div className="share no-print">
      <a className="btn" href={wa} target="_blank" rel="noopener">{t("হোয়াটসঅ্যাপে পাঠান", "Send on WhatsApp")}</a>
      {canShare ? (
        <button type="button" className="btn" onClick={() => navigator.share({ title, url }).catch(() => {})}>
          <Share2 size={18} aria-hidden />{t("শেয়ার", "Share")}
        </button>
      ) : null}
      <button type="button" className="btn" onClick={() => window.print()}>
        <Printer size={18} aria-hidden />{t("প্রিন্ট", "Print")}
      </button>
    </div>
  );
}
