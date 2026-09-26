import { useEffect, useState } from "react";
import { useT } from "../lib/i18n";

export function OfflineNotice() {
  const t = useT();
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  if (!offline) return null;
  return <div className="warn" role="status">{t("আপনি অফলাইনে আছেন — আগে দেখা পাতাগুলো সংরক্ষিত আছে।", "You are offline — pages you visited before are saved.")}</div>;
}
