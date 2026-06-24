// Timezone-safe calendar-date helpers. We deliberately work with 'YYYY-MM-DD'
// strings built from LOCAL date parts and never touch toISOString()/getUTC*,
// which would shift the day for users east/west of UTC at day boundaries.

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Format a local Date as 'YYYY-MM-DD'. */
function toLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse 'YYYY-MM-DD' into a Date at LOCAL midnight (not UTC like `new Date(str)`). */
function parseLocal(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Monday (ISO week start) of the week containing `d`, as 'YYYY-MM-DD'. */
export function getWeekStart(d: Date = new Date()): string {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); // strip time, local
  const diff = (x.getDay() + 6) % 7; // days since Monday: Mon→0 … Sun→6
  x.setDate(x.getDate() - diff);
  return toLocalISO(x);
}

/** Add `n` days to a 'YYYY-MM-DD' string (n may be negative). */
export function addDays(iso: string, n: number): string {
  const d = parseLocal(iso);
  d.setDate(d.getDate() + n);
  return toLocalISO(d);
}

/** Add `n` weeks to a 'YYYY-MM-DD' string (n may be negative). */
export function addWeeks(iso: string, n: number): string {
  return addDays(iso, n * 7);
}

export interface WeekDay {
  date: string; // 'YYYY-MM-DD'
  dayName: string; // 'Mon' … 'Sun'
  label: string; // 'D/M'
}

/** The 7 days (Mon→Sun) of the week starting at `mondayISO`. */
export function getWeekDates(mondayISO: string): WeekDay[] {
  const start = parseLocal(mondayISO);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return {
      date: toLocalISO(d),
      dayName: WEEKDAYS[i],
      label: `${d.getDate()}/${d.getMonth() + 1}`,
    };
  });
}

/** Today as a local 'YYYY-MM-DD' string. */
export function getTodayISO(): string {
  return toLocalISO(new Date());
}

/** Whether the given 'YYYY-MM-DD' string is today (in the local timezone). */
export function isToday(iso: string): boolean {
  return iso === toLocalISO(new Date());
}

/** Whole days from `fromIso` to `toIso` (negative if `toIso` is earlier). */
export function daysBetween(fromIso: string, toIso: string): number {
  const [ay, am, ad] = fromIso.split("-").map(Number);
  const [by, bm, bd] = toIso.split("-").map(Number);
  // UTC arithmetic avoids DST edge cases; we only care about whole-day deltas.
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

/** Render a 'YYYY-MM-DD' string as e.g. '19 Jun' without any timezone shift. */
export function formatDayMonth(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]}`;
}

/** Render a 'YYYY-MM-DD' string as e.g. 'Thu 19 Jun' (short weekday + day + month). */
export function formatWeekdayShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const weekday = WEEKDAYS[(new Date(y, m - 1, d).getDay() + 6) % 7];
  return `${weekday} ${d} ${MONTHS_SHORT[m - 1]}`;
}

/**
 * Compact, rounded-down "time ago" label for a past 'YYYY-MM-DD' date,
 * counted from local today. Abbreviated to stay space-frugal in cards/meta rows.
 * E.g. 'today', '2d ago', '3w ago', '4mo ago', '1y ago'. Rounding is always down
 * (40 days → '1mo ago'). Buckets switch at 7d → weeks, 30d → months, 365d → years.
 */
export function formatTimeAgo(iso: string): string {
  const days = daysBetween(iso, getTodayISO());
  if (days <= 0) return "today";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/** Render a 'YYYY-MM-DD' string as a full date, e.g. 'Friday, 19 June 2026'. */
export function formatFullDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
