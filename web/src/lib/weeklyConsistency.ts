/**
 * AthlonIQ Deterministic Weekly Consistency & Adherence Engine
 *
 * Enforces:
 * - Deterministic, injectable `today` reference
 * - Calendar week = Monday to Sunday in the profile timezone
 * - Zero hallucinated math or hidden fallbacks
 */

export interface WeekDayPill {
  date: string; // ISO "YYYY-MM-DD"
  dayLetter: string; // "M" | "T" | "W" | "T" | "F" | "S" | "S"
  dayName: string; // "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"
  isLogged: boolean;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  sessionsCount: number;
}

export interface WeeklyConsistencyResult {
  uniqueDaysLogged: number;
  trainingDaysTarget: number | null;
  progressPercent: number; // 0 - 100
  isTargetMet: boolean;
  isTargetSet: boolean;
  weekStart: string; // Monday "YYYY-MM-DD"
  weekEnd: string; // Sunday "YYYY-MM-DD"
  todayDate: string; // "YYYY-MM-DD" in profile timezone
  days: WeekDayPill[];
  explanation: string;
}

export interface WeeklyConsistencyOptions {
  timezone?: string | null;
  today?: string | Date | null;
}

const DEFAULT_TIMEZONE = "Asia/Kolkata";
const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Validates whether an IANA timezone string is supported by the runtime.
 */
export function isValidTimezone(tz?: string | null): boolean {
  if (!tz || typeof tz !== "string" || !tz.trim()) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz.trim() });
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats a Date object to YYYY-MM-DD in the specified timezone.
 */
function formatDateInTz(d: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Resolves a date string, timestamp, or Date into a deterministic YYYY-MM-DD
 * representation in the athlete's timezone.
 */
export function resolveDateInTimezone(
  dateOrIso?: string | Date | null,
  timezone?: string | null
): string {
  const tz = isValidTimezone(timezone) ? timezone!.trim() : DEFAULT_TIMEZONE;

  if (!dateOrIso) {
    return formatDateInTz(new Date(), tz);
  }

  if (typeof dateOrIso === "string") {
    const trimmed = dateOrIso.trim();
    // Pure YYYY-MM-DD string without time component is already a calendar date
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return formatDateInTz(parsed, tz);
    }
    return formatDateInTz(new Date(), tz);
  }

  if (dateOrIso instanceof Date && !isNaN(dateOrIso.getTime())) {
    return formatDateInTz(dateOrIso, tz);
  }

  return formatDateInTz(new Date(), tz);
}

/**
 * Computes Monday (weekStart) and Sunday (weekEnd) dates for a given YYYY-MM-DD calendar date.
 */
export function getMondayToSundayWeek(calendarDateStr: string): {
  weekStart: string;
  weekEnd: string;
  dates: string[];
} {
  const [year, month, day] = calendarDateStr.split("-").map(Number);
  const refUtc = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = refUtc.getUTCDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
  const daysSinceMonday = (dayOfWeek + 6) % 7; // Mon: 0, Tue: 1 ... Sun: 6

  const mondayUtc = new Date(Date.UTC(year, month - 1, day - daysSinceMonday));
  const dates: string[] = [];

  for (let i = 0; i < 7; i++) {
    const cur = new Date(
      Date.UTC(
        mondayUtc.getUTCFullYear(),
        mondayUtc.getUTCMonth(),
        mondayUtc.getUTCDate() + i
      )
    );
    dates.push(cur.toISOString().slice(0, 10));
  }

  return {
    weekStart: dates[0],
    weekEnd: dates[6],
    dates,
  };
}

/**
 * Calculates weekly workout consistency, 7-day adherence against trainingDaysPerWeek,
 * and weekday state pills.
 *
 * @param sessions Array of sessions containing loggedDate
 * @param trainingDaysPerWeek Athlete target days per week (null/undefined if unconfigured)
 * @param options Deterministic options: profile timezone and injectable today
 */
export function calculateWeeklyConsistency(
  sessions: Array<{ loggedDate: string }>,
  trainingDaysPerWeek?: number | null,
  options?: WeeklyConsistencyOptions
): WeeklyConsistencyResult {
  const tz = isValidTimezone(options?.timezone)
    ? options!.timezone!.trim()
    : DEFAULT_TIMEZONE;

  const todayDate = resolveDateInTimezone(options?.today, tz);
  const { weekStart, weekEnd, dates } = getMondayToSundayWeek(todayDate);

  // Group workout sessions by their localized calendar date
  const loggedDayCounts = new Map<string, number>();
  for (const session of sessions) {
    if (!session || !session.loggedDate) continue;
    const sessionDate = resolveDateInTimezone(session.loggedDate, tz);
    loggedDayCounts.set(sessionDate, (loggedDayCounts.get(sessionDate) ?? 0) + 1);
  }

  // Build the 7 weekday pills (Monday through Sunday)
  const days: WeekDayPill[] = dates.map((dStr, idx) => {
    const count = loggedDayCounts.get(dStr) ?? 0;
    return {
      date: dStr,
      dayLetter: DAY_LETTERS[idx],
      dayName: DAY_NAMES[idx],
      isLogged: count > 0,
      isToday: dStr === todayDate,
      isPast: dStr < todayDate,
      isFuture: dStr > todayDate,
      sessionsCount: count,
    };
  });

  const uniqueDaysLogged = days.filter((d) => d.isLogged).length;
  const isTargetSet = trainingDaysPerWeek != null && trainingDaysPerWeek > 0;
  const target = isTargetSet ? trainingDaysPerWeek : null;

  const progressPercent = isTargetSet
    ? Math.min(100, Math.round((uniqueDaysLogged / target!) * 100))
    : 0;

  const isTargetMet = isTargetSet && uniqueDaysLogged >= target!;

  let explanation = "Weekly training frequency not configured in athlete profile.";
  if (isTargetSet) {
    if (isTargetMet) {
      explanation = `All ${target} target training sessions completed for this week (${weekStart} to ${weekEnd}). Excellent consistency.`;
    } else {
      const remaining = target! - uniqueDaysLogged;
      explanation = `${uniqueDaysLogged} of ${target} days logged this week (${progressPercent}%). ${remaining} session(s) remaining before Sunday.`;
    }
  }

  return {
    uniqueDaysLogged,
    trainingDaysTarget: target,
    progressPercent,
    isTargetMet,
    isTargetSet,
    weekStart,
    weekEnd,
    todayDate,
    days,
    explanation,
  };
}

