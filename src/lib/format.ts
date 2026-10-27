/** Date formatting shared by the website and the portal (en-GB, as in the prototype). */

const toDate = (x: Date | string | number) => (x instanceof Date ? x : typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x) ? new Date(`${x}T12:00:00Z`) : new Date(x));

/** 3 Mar 2026 */
export function fmtDate(x: Date | string | number | null | undefined): string {
  if (x === null || x === undefined || x === "") return "—";
  const d = toDate(x);
  return Number.isNaN(+d) ? String(x) : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** March 2026 */
export function fmtMonth(x: Date | string | number): string {
  const d = toDate(x);
  return Number.isNaN(+d) ? "" : d.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
}

/**
 * Time zone for times shown in the portal: APP_TIME_ZONE (an IANA name such as "Africa/Douala"), else UTC.
 * Not process.env.TZ — Vercel sets it to ":UTC" (POSIX syntax), which Intl rejects with a RangeError.
 */
const TIME_ZONE = (() => {
  const tz = process.env.APP_TIME_ZONE?.trim();
  if (!tz) return "UTC";
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
})();

/** 3 Mar 2026, 14:05 */
export function fmtDateTime(x: Date | number): string {
  const d = new Date(x);
  return `${fmtDate(d)}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE })}`;
}

/** just now · 5 min ago · 3 h ago · 2 d ago · 3 Mar 2026 */
export function fmtRelative(x: Date | number, now = Date.now()): string {
  const m = (now - new Date(x).getTime()) / 60_000;
  if (m < 1) return "just now";
  if (m < 60) return `${Math.floor(m)} min ago`;
  if (m < 1440) return `${Math.floor(m / 60)} h ago`;
  if (m < 10080) return `${Math.floor(m / 1440)} d ago`;
  return fmtDate(x);
}

export const isoDay = (d = new Date()) => d.toISOString().slice(0, 10);

export function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

/** "Review due 1 Oct 2031 · Conditions apply · Institutional accreditation" for a directory record. */
export function reviewLine(r: { review: string; conditions: string; scope: string }) {
  return [r.review ? `Review due ${fmtDate(r.review)}` : "", r.conditions ? "Conditions apply" : "", r.scope].filter(Boolean).join(" · ") || "—";
}

export const daysSince = (d: Date) => (Date.now() - d.getTime()) / 864e5;

export const daysFromToday = (n: number) => isoDay(new Date(Date.now() + n * 864e5));

/** "https://www.example.edu/about" → "example.edu", for showing a website compactly. */
export function siteHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** Only http(s) addresses are linked; anything else (e.g. javascript:) is never rendered as a link. */
export const safeHref = (url: string) => (/^https?:\/\//i.test(url) ? url : "");
