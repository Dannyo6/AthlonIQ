import { describe, it, expect } from "vitest";
import {
  calculateWeeklyConsistency,
  getMondayToSundayWeek,
  resolveDateInTimezone,
} from "@/lib/weeklyConsistency";
import {
  calculateWeightTrend,
  generateWeightSparkline,
} from "@/lib/calculations";

describe("Weekly Consistency & Adherence Engine", () => {
  describe("Calendar Week (Monday to Sunday)", () => {
    it("anchors Sunday to Monday-Sunday week ending on that Sunday", () => {
      // 2026-11-08 is Sunday
      const week = getMondayToSundayWeek("2026-11-08");
      expect(week.weekStart).toBe("2026-11-02"); // Monday
      expect(week.weekEnd).toBe("2026-11-08"); // Sunday
      expect(week.dates).toHaveLength(7);
      expect(week.dates[0]).toBe("2026-11-02");
      expect(week.dates[6]).toBe("2026-11-08");
    });

    it("anchors Monday to Monday-Sunday week starting on that Monday", () => {
      // 2026-11-09 is Monday
      const week = getMondayToSundayWeek("2026-11-09");
      expect(week.weekStart).toBe("2026-11-09"); // Monday
      expect(week.weekEnd).toBe("2026-11-15"); // Sunday
      expect(week.dates[0]).toBe("2026-11-09");
      expect(week.dates[6]).toBe("2026-11-15");
    });

    it("anchors midweek Wednesday correctly", () => {
      // 2026-11-11 is Wednesday
      const week = getMondayToSundayWeek("2026-11-11");
      expect(week.weekStart).toBe("2026-11-09");
      expect(week.weekEnd).toBe("2026-11-15");
    });
  });

  describe("Week Boundaries Transitions", () => {
    it("transitions session counting across Sunday-to-Monday boundary", () => {
      const sundaySession = { loggedDate: "2026-11-08" };
      const mondaySession = { loggedDate: "2026-11-09" };
      const sessions = [sundaySession, mondaySession];

      // When today is Sunday 2026-11-08:
      const sundayEval = calculateWeeklyConsistency(sessions, 4, {
        today: "2026-11-08",
        timezone: "Asia/Kolkata",
      });
      expect(sundayEval.weekStart).toBe("2026-11-02");
      expect(sundayEval.weekEnd).toBe("2026-11-08");
      expect(sundayEval.uniqueDaysLogged).toBe(1); // Only Sunday session counts
      expect(sundayEval.days.find((d) => d.date === "2026-11-08")?.isLogged).toBe(true);
      expect(sundayEval.days.find((d) => d.date === "2026-11-09")).toBeUndefined();

      // When today is Monday 2026-11-09:
      const mondayEval = calculateWeeklyConsistency(sessions, 4, {
        today: "2026-11-09",
        timezone: "Asia/Kolkata",
      });
      expect(mondayEval.weekStart).toBe("2026-11-09");
      expect(mondayEval.weekEnd).toBe("2026-11-15");
      expect(mondayEval.uniqueDaysLogged).toBe(1); // Only Monday session counts
      expect(mondayEval.days.find((d) => d.date === "2026-11-09")?.isLogged).toBe(true);
      expect(mondayEval.days.find((d) => d.date === "2026-11-08")).toBeUndefined();
    });

    it("handles year boundary transitions (Dec 2025 to Jan 2026)", () => {
      // 2026-01-01 is Thursday
      const sessions = [
        { loggedDate: "2025-12-29" }, // Monday in previous year
        { loggedDate: "2025-12-31" }, // Wednesday in previous year
        { loggedDate: "2026-01-02" }, // Friday in new year
        { loggedDate: "2026-01-05" }, // Next week Monday (excluded)
      ];

      const res = calculateWeeklyConsistency(sessions, 3, {
        today: "2026-01-01",
        timezone: "Asia/Kolkata",
      });

      expect(res.weekStart).toBe("2025-12-29");
      expect(res.weekEnd).toBe("2026-01-04");
      expect(res.uniqueDaysLogged).toBe(3);
      expect(res.isTargetMet).toBe(true);
      expect(res.progressPercent).toBe(100);
    });

    it("handles month boundary transitions (Apr to May)", () => {
      // 2026-05-01 is Friday
      const sessions = [
        { loggedDate: "2026-04-28" }, // Tuesday in April
        { loggedDate: "2026-05-01" }, // Friday in May
      ];

      const res = calculateWeeklyConsistency(sessions, 4, {
        today: "2026-05-01",
        timezone: "Asia/Kolkata",
      });

      expect(res.weekStart).toBe("2026-04-27");
      expect(res.weekEnd).toBe("2026-05-03");
      expect(res.uniqueDaysLogged).toBe(2);
      expect(res.progressPercent).toBe(50);
    });

    it("handles leap year February 29 boundary", () => {
      // 2028 is a leap year; 2028-02-29 is Tuesday
      const sessions = [
        { loggedDate: "2028-02-28" }, // Monday
        { loggedDate: "2028-02-29" }, // Tuesday (leap day)
        { loggedDate: "2028-03-01" }, // Wednesday
      ];

      const res = calculateWeeklyConsistency(sessions, 3, {
        today: "2028-02-29",
        timezone: "Asia/Kolkata",
      });

      expect(res.weekStart).toBe("2028-02-28");
      expect(res.weekEnd).toBe("2028-03-05");
      expect(res.uniqueDaysLogged).toBe(3);
      expect(res.isTargetMet).toBe(true);
    });
  });

  describe("Timezone Edge Cases", () => {
    it("resolves date across midnight UTC depending on profile timezone", () => {
      // 2026-11-08T20:00:00Z:
      // Asia/Kolkata (+5:30) => 2026-11-09 01:30 (Monday)
      // America/New_York (-5) => 2026-11-08 15:00 (Sunday)
      const instant = new Date("2026-11-08T20:00:00Z");

      const kolkataDate = resolveDateInTimezone(instant, "Asia/Kolkata");
      const nyDate = resolveDateInTimezone(instant, "America/New_York");

      expect(kolkataDate).toBe("2026-11-09");
      expect(nyDate).toBe("2026-11-08");

      // Evaluation for Kolkata places user into Monday-Sunday week 2026-11-09..2026-11-15
      const kolkataRes = calculateWeeklyConsistency([], 5, {
        today: instant,
        timezone: "Asia/Kolkata",
      });
      expect(kolkataRes.weekStart).toBe("2026-11-09");
      expect(kolkataRes.weekEnd).toBe("2026-11-15");

      // Evaluation for NY places user into Monday-Sunday week 2026-11-02..2026-11-08
      const nyRes = calculateWeeklyConsistency([], 5, {
        today: instant,
        timezone: "America/New_York",
      });
      expect(nyRes.weekStart).toBe("2026-11-02");
      expect(nyRes.weekEnd).toBe("2026-11-08");
    });

    it("localizes session timestamps according to the athlete's timezone", () => {
      // Workout logged late evening UTC on Sunday
      const sessionNearMidnight = { loggedDate: "2026-11-08T19:00:00Z" };

      // In Kolkata (+5:30), 19:00Z is 00:30 on Monday 2026-11-09
      const kolkataEval = calculateWeeklyConsistency([sessionNearMidnight], 4, {
        today: "2026-11-09",
        timezone: "Asia/Kolkata",
      });
      expect(kolkataEval.uniqueDaysLogged).toBe(1);
      expect(kolkataEval.days.find((d) => d.date === "2026-11-09")?.isLogged).toBe(true);

      // In New York (-5), 19:00Z is 14:00 on Sunday 2026-11-08
      const nyEval = calculateWeeklyConsistency([sessionNearMidnight], 4, {
        today: "2026-11-08",
        timezone: "America/New_York",
      });
      expect(nyEval.uniqueDaysLogged).toBe(1);
      expect(nyEval.days.find((d) => d.date === "2026-11-08")?.isLogged).toBe(true);
    });

    it("falls back gracefully to Asia/Kolkata when timezone is invalid or null", () => {
      const res = calculateWeeklyConsistency([], 4, {
        today: "2026-11-09",
        timezone: "Invalid/Fake_Zone",
      });
      expect(res.weekStart).toBe("2026-11-09");
      expect(res.todayDate).toBe("2026-11-09");
    });
  });

  describe("Deduplication & Adherence Math", () => {
    it("deduplicates multiple sessions on the same calendar day to 1 unique day", () => {
      const sessions = [
        { loggedDate: "2026-11-10" },
        { loggedDate: "2026-11-10" }, // Second session on Tuesday
        { loggedDate: "2026-11-12" }, // Thursday
      ];

      const res = calculateWeeklyConsistency(sessions, 4, {
        today: "2026-11-13",
        timezone: "Asia/Kolkata",
      });

      expect(res.uniqueDaysLogged).toBe(2);
      expect(res.progressPercent).toBe(50); // 2 of 4 = 50%
      expect(res.days.find((d) => d.date === "2026-11-10")?.sessionsCount).toBe(2);
      expect(res.days.find((d) => d.date === "2026-11-10")?.isLogged).toBe(true);
    });

    it("caps progress at 100% when training days exceed the target", () => {
      const sessions = [
        { loggedDate: "2026-11-09" },
        { loggedDate: "2026-11-10" },
        { loggedDate: "2026-11-11" },
        { loggedDate: "2026-11-12" },
        { loggedDate: "2026-11-13" },
      ];

      const res = calculateWeeklyConsistency(sessions, 4, {
        today: "2026-11-14",
        timezone: "Asia/Kolkata",
      });

      expect(res.uniqueDaysLogged).toBe(5);
      expect(res.progressPercent).toBe(100);
      expect(res.isTargetMet).toBe(true);
    });

    it("handles unconfigured target cleanly", () => {
      const res = calculateWeeklyConsistency([{ loggedDate: "2026-11-10" }], null, {
        today: "2026-11-11",
        timezone: "Asia/Kolkata",
      });

      expect(res.isTargetSet).toBe(false);
      expect(res.progressPercent).toBe(0);
      expect(res.isTargetMet).toBe(false);
      expect(res.explanation).toContain("not configured");
    });
  });
});

describe("Deterministic Sparkline Calculation", () => {
  it("uses calculateWeightTrend output only and returns null for fewer than 3 entries", () => {
    const insufficientTrend = calculateWeightTrend([
      { loggedDate: "2026-11-01", weightKg: 75.0 },
      { loggedDate: "2026-11-02", weightKg: 74.8 },
    ]);

    expect(insufficientTrend.status).toBe("insufficient_data");
    const sparkline = generateWeightSparkline(insufficientTrend);
    expect(sparkline).toBeNull();
  });

  it("generates deterministic SVG path coordinates strictly from calculateWeightTrend", () => {
    const trend = calculateWeightTrend([
      { loggedDate: "2026-11-05", weightKg: 75.2 },
      { loggedDate: "2026-11-01", weightKg: 75.8 },
      { loggedDate: "2026-11-03", weightKg: 75.5 },
    ]);

    expect(trend.status).toBe("ok");
    // calculateWeightTrend automatically sorted chronologically: 01, 03, 05
    expect(trend.entries[0].logged_date).toBe("2026-11-01");
    expect(trend.entries[2].logged_date).toBe("2026-11-05");

    const sparkline = generateWeightSparkline(trend, 160, 44, 4);
    expect(sparkline).not.toBeNull();
    expect(sparkline!.points).toHaveLength(3);
    expect(sparkline!.pathD).toBe("M 4.0,4.0 L 80.0,22.0 L 156.0,40.0");
    expect(sparkline!.min).toBe(75.2);
    expect(sparkline!.max).toBe(75.8);
  });
});
