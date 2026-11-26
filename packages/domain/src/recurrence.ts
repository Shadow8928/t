import type { IsoWeekday, Occurrence, RecurrenceRule } from "./types.js";
import { assertValidRecurrence } from "./validation.js";

const DEFAULT_HORIZON_DAYS = 30;

/** JS getUTCDay: Sun=0…Sat=6 → ISO Mon=1…Sun=7 */
export function jsDayToIso(jsDay: number): IsoWeekday {
  return ((jsDay + 6) % 7) + 1 as IsoWeekday;
}

export function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatYmd(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function weekdaySet(rule: RecurrenceRule): Set<IsoWeekday> {
  if (rule.kind === "weekday") return new Set([1, 2, 3, 4, 5]);
  if (rule.kind === "weekly" || rule.kind === "selected_weekdays") {
    return new Set(rule.weekdays ?? []);
  }
  return new Set();
}

function matchesDay(rule: RecurrenceRule, date: Date, start: Date): boolean {
  const iso = jsDayToIso(date.getUTCDay());
  switch (rule.kind) {
    case "one_time":
      return formatYmd(date) === formatYmd(start);
    case "daily":
      return true;
    case "weekday":
    case "weekly":
    case "selected_weekdays":
      return weekdaySet(rule).has(iso);
    case "interval": {
      const days = Math.round((date.getTime() - start.getTime()) / 86_400_000);
      return days >= 0 && days % (rule.intervalDays ?? 1) === 0;
    }
    default:
      return false;
  }
}

function buildScheduledAt(
  dateYmd: string,
  rule: RecurrenceRule,
  timezone: string,
  fixedTime: boolean,
): string | null {
  if (!fixedTime) return null;
  const localTime = rule.localTime ?? "09:00";
  // Represent as ISO with explicit offset derived from a Intl parts lookup.
  const probe = new Date(`${dateYmd}T${localTime}:00`);
  // Prefer a stable Zulu stamp when TZ conversion is ambiguous in pure JS without luxon;
  // callers treat this as the intended local wall time annotated with timezone.
  const offsetMinutes = getTimeZoneOffsetMinutes(timezone, probe);
  const sign = offsetMinutes <= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const oh = String(Math.floor(abs / 60)).padStart(2, "0");
  const om = String(abs % 60).padStart(2, "0");
  return `${dateYmd}T${localTime}:00${sign}${oh}:${om}`;
}

export function getTimeZoneOffsetMinutes(timeZone: string, date: Date): number {
  try {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = dtf.formatToParts(date);
    const tz = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
    const m = tz.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
    if (!m) return 0;
    const sign = m[1] === "-" ? 1 : -1; // invert: GMT-6 → +360 minutes east of local for offset from UTC in our builder
    const hours = Number(m[2]);
    const mins = Number(m[3] ?? 0);
    // Return minutes to subtract from local to get UTC (standard JS getTimezoneOffset style)
    return sign * (hours * 60 + mins);
  } catch {
    return 0;
  }
}

export interface GenerateOccurrencesOptions {
  rule: RecurrenceRule;
  /** Inclusive horizon end; default start + 30 days */
  horizonDays?: number;
  fromDate?: string;
  timezone?: string;
  fixedTime?: boolean;
  /**
   * Missed occurrences stay on their original date — generation never
   * rewrites past dates forward. Pass `nowYmd` so history before today is still emitted
   * when within [start, horizon] (caller filters UI).
   */
  nowYmd?: string;
}

/**
 * Generate occurrence dates within a 30-day horizon (configurable).
 * Preserves history: dates are never shifted for missed items.
 */
export function generateOccurrences(opts: GenerateOccurrencesOptions): Occurrence[] {
  const { rule } = opts;
  assertValidRecurrence(rule);
  const horizonDays = opts.horizonDays ?? DEFAULT_HORIZON_DAYS;
  const timezone = opts.timezone ?? "America/Chicago";
  const fixedTime = opts.fixedTime ?? Boolean(rule.localTime);
  const start = parseYmd(rule.startDate);
  const from = parseYmd(opts.fromDate ?? rule.startDate);
  const horizonEnd = addDays(from, horizonDays);
  const hardEnd = rule.endDate ? parseYmd(rule.endDate) : null;

  const out: Occurrence[] = [];
  let cursor = start < from ? from : start;

  // Walk day-by-day; for one_time only the start date matters.
  const maxIterations = horizonDays + 370;
  for (let i = 0; i < maxIterations; i++) {
    if (cursor > horizonEnd) break;
    if (hardEnd && cursor >= hardEnd) break;
    if (cursor >= from && matchesDay(rule, cursor, start)) {
      const date = formatYmd(cursor);
      out.push({
        date,
        scheduledAt: buildScheduledAt(date, rule, timezone, fixedTime),
        fixedTime,
      });
      if (rule.kind === "one_time") break;
    }
    cursor = addDays(cursor, 1);
  }
  return out;
}
