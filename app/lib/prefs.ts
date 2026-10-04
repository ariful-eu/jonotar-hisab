const WARD_KEY = "katuli-my-ward";

export function getMyWard(): number | null {
  try {
    const n = Number(localStorage.getItem(WARD_KEY));
    return Number.isInteger(n) && n >= 1 && n <= 9 ? n : null;
  } catch {
    return null;
  }
}

export function setMyWard(ward: number | null): void {
  try {
    if (ward === null) localStorage.removeItem(WARD_KEY);
    else localStorage.setItem(WARD_KEY, String(ward));
  } catch {
    // storage unavailable: preference lasts only for this page view
  }
}
