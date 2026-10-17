/**
 * Core Domain Type Definitions for AthlonIQ OS
 */

export interface AthleteProfile {
  id: string;
  email: string;
  fullName: string;
  tier: "beginner" | "intermediate" | "advanced" | "elite";
  primaryGoal: "hypertrophy" | "strength" | "fat_loss" | "recomposition" | "endurance";
  weightKg: number;
  heightCm: number;
  bodyFatPct?: number;
  targetWeightKg?: number;
}

export interface DailyReadiness {
  date: string;
  readinessScore: number; // 0-100
  sleepDurationHours: number;
  sleepQualityScore: number; // 0-100
  hrvRmssdMs: number;
  restingHeartRate: number;
  sorenessScore: number; // 1-10
  status: "optimal" | "moderate" | "fatigued";
}

export interface MacroTarget {
  targetCalories: number;
  loggedCalories: number;
  proteinGrams: number;
  loggedProtein: number;
  carbsGrams: number;
  loggedCarbs: number;
  fatGrams: number;
  loggedFat: number;
  waterMl: number;
  loggedWaterMl: number;
}

export interface WorkoutSummary {
  id: string;
  name: string;
  date: string;
  durationMinutes: number;
  totalVolumeKg: number;
  exerciseCount: number;
  perceivedRpe: number;
}

export interface CoachMessage {
  id: string;
  role: "athlete" | "coach";
  content: string;
  timestamp: string;
  actionRecommendation?: {
    type: "deload" | "macro_shift" | "swap_exercise";
    description: string;
  };
}
