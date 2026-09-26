export function siteOrigin(): string | null {
  const v = import.meta.env.VITE_SITE_URL;
  return v ? v.replace(/\/$/, "") : null;
}

export function absoluteUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${siteOrigin() ?? "http://localhost:5173"}${base}${path}`;
}
