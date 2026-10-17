/**
 * AthlonIQ Deterministic Domain Calculations (Client-side mirror of backend)
 * Enforces mathematically rigorous, auditable formulas. Zero hallucinated numbers.
 */

import { ReadinessResult, UserProfile, ValueProvenance } from "@/types";

export interface BmiResult {
  bmi: number;
  category: "underweight" | "normal_weight" | "overweight" | "obese";
  provenance: ValueProvenance;
  disclaimer: string;
}

export function calculateBmi(weightKg: number, heightCm: number): BmiResult {
  if (heightCm <= 0 || weightKg <= 0) {
    return {
      bmi: 0,
      category: "normal_weight",
      provenance: "calculated_estimate",
      disclaimer: "BMI is a population-level screening metric only and does not distinguish fat-free mass from adiposity.",
    };
  }

  const heightM = heightCm / 100;
  const bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;

  let category: "underweight" | "normal_weight" | "overweight" | "obese" = "normal_weight";
  if (bmi < 18.5) category = "underweight";
  else if (bmi < 25.0) category = "normal_weight";
  else if (bmi < 30.0) category = "overweight";
  else category = "obese";

  return {
    bmi,
    category,
    provenance: "calculated_estimate",
    disclaimer: "BMI is a population-level screening metric only and does not distinguish fat-free mass from adiposity.",
  };
}

export interface ProteinReference {
  proteinMinG: number;
  proteinMaxG: number;
  proteinTargetG: number;
  provenance: ValueProvenance;
  rationale: string;
}

export function calculateProteinReference(
  weightKg: number,
  customTargetG?: number | null
): ProteinReference {
  const minG = Math.round(weightKg * 1.6);
  const maxG = Math.round(weightKg * 2.2);

  let targetG: number;
  let provenance: ValueProvenance;

  if (customTargetG !== undefined && customTargetG !== null) {
    targetG = Math.max(minG, Math.min(maxG, customTargetG));
    provenance = "user_confirmed";
  } else {
    targetG = Math.round(weightKg * 2.0);
    provenance = "provisional_default";
  }

  return {
    proteinMinG: minG,
    proteinMaxG: maxG,
    proteinTargetG: targetG,
    provenance,
    rationale: "Evidence-based resistance training range (1.6–2.2 g/kg/day) for muscle protein synthesis and lean bulk accrual.",
  };
}

export interface EnergyEstimateResult {
  estimatedKcal: number | null;
  bmrKcal: number | null;
  tdeeKcal: number | null;
  surplusKcal: number | null;
  activityMultiplier: number | null;
  sexAssumed: boolean;
  provenance: ValueProvenance;
  macros: {
    proteinG: number;
    carbsG: number;
    fatG: number;
  } | null;
  notes: string;
}

export function calculateEnergyEstimate(
  profile: Partial<UserProfile>
): EnergyEstimateResult {
  const {
    weightKg = 55.0,
    heightCm = 173.0,
    age = 20,
    sex = null,
    onboardingCompleted = false,
    sleepBaselineHours = null,
    experienceLevel = null,
    weeklyBadmintonSessions = 0,
    weeklyRunningSessions = 0,
    primaryGoal = "lean_bulk",
  } = profile;

  // Gated until onboarding completed & baselines present
  if (!onboardingCompleted || sleepBaselineHours === null || experienceLevel === null) {
    return {
      estimatedKcal: null,
      bmrKcal: null,
      tdeeKcal: null,
      surplusKcal: null,
      activityMultiplier: null,
      sexAssumed: false,
      provenance: "awaiting_onboarding",
      macros: null,
      notes: "Caloric targets are gated until onboarding biometrics, training split, and baseline sleep hours are confirmed.",
    };
  }

  // Mifflin-St Jeor equation
  let bmr: number;
  let sexAssumed = false;

  if (sex === "female") {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  } else if (sex === "male") {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    // Unknown sex: default to male reference equation with explicit screening note
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    sexAssumed = true;
  }

  // Activity multiplier calculation
  const extraSessions = (weeklyBadmintonSessions || 0) + (weeklyRunningSessions || 0);
  let multiplier = 1.45;
  if (extraSessions >= 3) {
    multiplier = 1.65;
  } else if (extraSessions >= 1) {
    multiplier = 1.55;
  }

  const tdee = bmr * multiplier;
  const surplus = primaryGoal === "lean_bulk" ? 250 : 0;
  const targetKcal = Math.round(tdee + surplus);

  const proteinInfo = calculateProteinReference(weightKg);
  const proteinG = proteinInfo.proteinTargetG;
  const proteinCals = proteinG * 4;

  const fatCals = targetKcal * 0.25;
  const fatG = Math.round(fatCals / 9);

  const carbsCals = Math.max(0, targetKcal - (proteinCals + fatG * 9));
  const carbsG = Math.round(carbsCals / 4);

  return {
    estimatedKcal: targetKcal,
    bmrKcal: Math.round(bmr),
    tdeeKcal: Math.round(tdee),
    surplusKcal: surplus,
    activityMultiplier: multiplier,
    sexAssumed,
    provenance: "calculated_estimate",
    macros: {
      proteinG,
      carbsG,
      fatG,
    },
    notes: `Calibrated with Mifflin-St Jeor + 250 kcal lean-bulk surplus.${
      sexAssumed ? " (Note: sex not specified; defaulted to male reference formula with screening assumption.)" : ""
    }`,
  };
}

export function calculateRulesReadiness(
  sleepHours: number,
  sleepQuality: number, // 1 - 5
  soreness: number, // 1 - 5
  fatigue: number, // 1 - 5
  stress: number | null = null
): ReadinessResult {
  const triggers: string[] = [];
  let baseScore = 70.0;

  // 1. Sleep Duration Rules
  if (sleepHours >= 8.0) {
    baseScore += 15;
    triggers.push(`Optimal sleep duration (${sleepHours.toFixed(1)}h >= 8h): +15`);
  } else if (sleepHours >= 7.0) {
    baseScore += 5;
    triggers.push(`Adequate sleep duration (${sleepHours.toFixed(1)}h): +5`);
  } else if (sleepHours >= 6.0) {
    baseScore -= 10;
    triggers.push(`Suboptimal sleep duration (${sleepHours.toFixed(1)}h < 7h): -10`);
  } else {
    baseScore -= 25;
    triggers.push(`Sleep deficit warning (${sleepHours.toFixed(1)}h < 6h): -25`);
  }

  // 2. Sleep Quality (1-5)
  const q = Math.max(1, Math.min(5, Math.round(sleepQuality)));
  if (q === 5) {
    baseScore += 10;
    triggers.push("Restorative sleep quality (5/5): +10");
  } else if (q === 4) {
    baseScore += 5;
    triggers.push("Good sleep quality (4/5): +5");
  } else if (q === 3) {
    triggers.push("Average sleep quality (3/5): 0");
  } else if (q === 2) {
    baseScore -= 10;
    triggers.push("Poor sleep quality (2/5): -10");
  } else {
    baseScore -= 20;
    triggers.push("Severely disturbed sleep quality (1/5): -20");
  }

  // 3. Soreness (1-5, 1=Fresh, 5=Crippling)
  const s = Math.max(1, Math.min(5, Math.round(soreness)));
  if (s === 1) {
    baseScore += 5;
    triggers.push("Zero muscle soreness (1/5): +5");
  } else if (s === 2) {
    triggers.push("Minimal muscle soreness (2/5): 0");
  } else if (s === 3) {
    baseScore -= 5;
    triggers.push("Moderate muscle soreness (3/5): -5");
  } else if (s === 4) {
    baseScore -= 15;
    triggers.push("Elevated muscle soreness (4/5): -15");
  } else {
    baseScore -= 25;
    triggers.push("Severe muscle soreness / strain (5/5): -25");
  }

  // 4. Fatigue (1-5, 1=Energized, 5=Exhausted)
  const f = Math.max(1, Math.min(5, Math.round(fatigue)));
  if (f === 1) {
    baseScore += 5;
    triggers.push("Fully energized (1/5): +5");
  } else if (f === 2) {
    triggers.push("Normal fatigue baseline (2/5): 0");
  } else if (f === 3) {
    baseScore -= 5;
    triggers.push("Mild systemic fatigue (3/5): -5");
  } else if (f === 4) {
    baseScore -= 15;
    triggers.push("Elevated systemic fatigue (4/5): -15");
  } else {
    baseScore -= 25;
    triggers.push("Severe systemic exhaustion (5/5): -25");
  }

  // 5. Stress (Optional 1-5)
  if (stress !== null && stress !== undefined) {
    const st = Math.max(1, Math.min(5, Math.round(stress)));
    if (st === 1) {
      baseScore += 5;
      triggers.push("Low life/work stress (1/5): +5");
    } else if (st === 2) {
      triggers.push("Baseline stress level (2/5): 0");
    } else if (st === 3) {
      baseScore -= 5;
      triggers.push("Moderate stress load (3/5): -5");
    } else if (st === 4) {
      baseScore -= 10;
      triggers.push("High mental stress (4/5): -10");
    } else {
      baseScore -= 15;
      triggers.push("Extreme acute stress (5/5): -15");
    }
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(baseScore)));

  let status: "Prime" | "Moderate" | "Recover";
  let guidance: string;

  if (finalScore >= 80) {
    status = "Prime";
    guidance = "Physiological reserve is high. Green light for progressive overload or high-intensity conditioning.";
  } else if (finalScore >= 55) {
    status = "Moderate";
    guidance = "Moderate readiness. Execute planned workout volume at target RPE, avoiding excessive failure sets.";
  } else {
    status = "Recover";
    guidance = "Recovery deficit detected. Prioritize active recovery, mobility, or reducing set volume by 30-50%.";
  }

  return {
    readinessScore: finalScore,
    status,
    guidance,
    triggers,
    provenance: "calculated_estimate",
  };
}
