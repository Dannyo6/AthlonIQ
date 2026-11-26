import { ActivityType, BadmintonFormat } from "@/types";

export const ACTIVITY_MODES: readonly ActivityType[] = [
  "running",
  "badminton",
  "calisthenics",
  "other",
] as const;

export const BADMINTON_FORMATS: readonly BadmintonFormat[] = [
  "singles",
  "doubles",
  "free_play",
  "drills",
] as const;

export const CALISTHENICS_SKILLS: readonly string[] = [
  "Pull-ups",
  "Parallel Bar Dips",
  "Push-ups",
  "Hanging Leg Raises",
  "L-Sit Hold",
  "Handstand Practice",
  "Muscle-up",
  "Front Lever Progression",
  "Other",
] as const;

export const EFFORT_LABELS: Record<number, string> = {
  1: "1 – Very Light",
  2: "2 – Light",
  3: "3 – Moderate",
  4: "4 – Somewhat Hard",
  5: "5 – Hard",
  6: "6 – Hard+",
  7: "7 – Very Hard",
  8: "8 – Very Hard+",
  9: "9 – Maximal",
  10: "10 – All Out",
};
