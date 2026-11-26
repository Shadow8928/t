import { describe, expect, it } from "vitest";
import { generateOccurrences, jsDayToIso, formatYmd, parseYmd } from "./recurrence.js";

describe("jsDayToIso", () => {
  it("maps Sunday to 7 and Monday to 1", () => {
    expect(jsDayToIso(0)).toBe(7);
    expect(jsDayToIso(1)).toBe(1);
    expect(jsDayToIso(6)).toBe(6);
  });
});

describe("generateOccurrences", () => {
  it("one_time yields a single date", () => {
    const occ = generateOccurrences({
      rule: { kind: "one_time", startDate: "2026-11-26" },
      horizonDays: 30,
      fromDate: "2026-11-26",
    });
    expect(occ).toHaveLength(1);
    expect(occ[0]?.date).toBe("2026-11-26");
    expect(occ[0]?.fixedTime).toBe(false);
  });

  it("daily fills the horizon", () => {
    const occ = generateOccurrences({
      rule: { kind: "daily", startDate: "2026-11-26" },
      horizonDays: 7,
      fromDate: "2026-11-26",
    });
    expect(occ).toHaveLength(8); // inclusive 7 days ahead
    expect(occ[0]?.date).toBe("2026-11-26");
    expect(occ[7]?.date).toBe("2026-12-03");
  });

  it("weekday skips weekends (Mon=1..Fri=5)", () => {
    // 2026-11-26 is Thursday
    const occ = generateOccurrences({
      rule: { kind: "weekday", startDate: "2026-11-26" },
      horizonDays: 10,
      fromDate: "2026-11-26",
    });
    const dates = occ.map((o) => o.date);
    expect(dates).toContain("2026-11-26");
    expect(dates).toContain("2026-11-27");
    expect(dates).not.toContain("2026-11-28"); // Sat
    expect(dates).not.toContain("2026-11-29"); // Sun
    expect(dates).toContain("2026-11-30");
  });

  it("selected_weekdays respects Mon=1..Sun=7", () => {
    const occ = generateOccurrences({
      rule: {
        kind: "selected_weekdays",
        startDate: "2026-11-23", // Monday
        weekdays: [1, 3, 5],
      },
      horizonDays: 7,
      fromDate: "2026-11-23",
    });
    const dates = occ.map((o) => o.date);
    expect(dates).toEqual(["2026-11-23", "2026-11-25", "2026-11-27", "2026-11-30"]);
  });

  it("interval every 3 days", () => {
    const occ = generateOccurrences({
      rule: { kind: "interval", startDate: "2026-11-26", intervalDays: 3 },
      horizonDays: 9,
      fromDate: "2026-11-26",
    });
    expect(occ.map((o) => o.date)).toEqual([
      "2026-11-26",
      "2026-11-29",
      "2026-12-02",
      "2026-12-05",
    ]);
  });

  it("fixed-time includes scheduledAt with localTime", () => {
    const occ = generateOccurrences({
      rule: {
        kind: "daily",
        startDate: "2026-11-26",
        localTime: "07:30",
      },
      horizonDays: 0,
      fromDate: "2026-11-26",
      fixedTime: true,
      timezone: "America/Chicago",
    });
    expect(occ[0]?.fixedTime).toBe(true);
    expect(occ[0]?.scheduledAt).toMatch(/2026-11-26T07:30:00/);
  });

  it("does not shift missed dates forward", () => {
    const occ = generateOccurrences({
      rule: { kind: "daily", startDate: "2026-11-20" },
      horizonDays: 2,
      fromDate: "2026-11-20",
      nowYmd: "2026-11-26",
    });
    expect(occ[0]?.date).toBe("2026-11-20");
  });

  it("honors endDate exclusive", () => {
    const occ = generateOccurrences({
      rule: { kind: "daily", startDate: "2026-11-26", endDate: "2026-11-28" },
      horizonDays: 10,
      fromDate: "2026-11-26",
    });
    expect(occ.map((o) => o.date)).toEqual(["2026-11-26", "2026-11-27"]);
  });
});

describe("date helpers", () => {
  it("round-trips YMD", () => {
    expect(formatYmd(parseYmd("2026-11-26"))).toBe("2026-11-26");
  });
});
