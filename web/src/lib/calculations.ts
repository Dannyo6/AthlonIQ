/**
 * AthlonIQ Deterministic Domain Calculations (Client-side mirror of backend)
 * Phase 1: BMI, protein reference, energy estimate, readiness
 * Phase 2: Food catalog search, nutrition totals, running pace, progression, weight trend
 *
 * Enforces mathematically rigorous, auditable formulas. Zero hallucinated numbers.
 */

import {
  ReadinessResult,
  UserProfile,
  ValueProvenance,
  FoodCatalogItem,
  FoodEntry,
  DailyNutritionSummary,
  DailyMacroTotals,
  ProgressionSuggestion,
  WeightTrendResult,
} from "@/types";

// =============================================================================
// Phase 1: BMI
// =============================================================================

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

// =============================================================================
// Phase 1: Protein Reference
// =============================================================================

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

// =============================================================================
// Phase 1: Energy Estimate (Mifflin-St Jeor)
// =============================================================================

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

// =============================================================================
// Phase 1: Rules-Based Readiness
// =============================================================================

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

// =============================================================================
// Phase 2: Indian & Athletic Food Reference Catalog (client-side mirror)
// =============================================================================

export const INDIAN_FOOD_CATALOG: FoodCatalogItem[] = [
  // Staples / Carbs
  { id: "rice-steamed", name: "Cooked Steamed Rice", category: "staple", serving_label: "1 katori (150g)", serving_weight_g: 150, calories_kcal: 195, protein_g: 4.0, carbs_g: 43.0, fat_g: 0.5, provenance: "verified_reference" },
  { id: "roti-wheat", name: "Whole Wheat Roti", category: "staple", serving_label: "1 medium (40g)", serving_weight_g: 40, calories_kcal: 104, protein_g: 3.5, carbs_g: 20.0, fat_g: 1.5, provenance: "verified_reference" },
  { id: "idli", name: "Idli", category: "staple", serving_label: "2 pieces (120g)", serving_weight_g: 120, calories_kcal: 132, protein_g: 4.0, carbs_g: 28.0, fat_g: 0.5, provenance: "verified_reference" },
  { id: "dosa-plain", name: "Plain Dosa", category: "staple", serving_label: "1 medium (100g)", serving_weight_g: 100, calories_kcal: 168, protein_g: 3.5, carbs_g: 26.0, fat_g: 5.5, provenance: "verified_reference" },
  { id: "dosa-masala", name: "Masala Dosa", category: "staple", serving_label: "1 standard (180g)", serving_weight_g: 180, calories_kcal: 302, protein_g: 6.0, carbs_g: 45.0, fat_g: 10.0, provenance: "verified_reference" },
  { id: "oats-rolled", name: "Rolled Oats", category: "staple", serving_label: "50g raw", serving_weight_g: 50, calories_kcal: 190, protein_g: 6.5, carbs_g: 33.5, fat_g: 3.5, provenance: "verified_reference" },
  { id: "banana", name: "Banana", category: "fruit", serving_label: "1 medium (118g)", serving_weight_g: 118, calories_kcal: 105, protein_g: 1.3, carbs_g: 27.0, fat_g: 0.4, provenance: "verified_reference" },
  // Protein — Non-Veg
  { id: "egg-whole-boiled", name: "Whole Boiled Egg", category: "protein", serving_label: "1 large (50g)", serving_weight_g: 50, calories_kcal: 78, protein_g: 6.3, carbs_g: 0.6, fat_g: 5.3, provenance: "verified_reference" },
  { id: "egg-whites", name: "Egg Whites", category: "protein", serving_label: "3 large whites (100g)", serving_weight_g: 100, calories_kcal: 52, protein_g: 10.9, carbs_g: 0.7, fat_g: 0.2, provenance: "verified_reference" },
  { id: "egg-bhurji", name: "Egg Bhurji / Omelette", category: "protein", serving_label: "2 eggs + 1 tsp oil (120g)", serving_weight_g: 120, calories_kcal: 196, protein_g: 12.6, carbs_g: 1.5, fat_g: 15.5, provenance: "verified_reference" },
  { id: "chicken-breast-cooked", name: "Grilled Chicken Breast", category: "protein", serving_label: "150g cooked", serving_weight_g: 150, calories_kcal: 247, protein_g: 46.5, carbs_g: 0.0, fat_g: 5.5, provenance: "verified_reference" },
  { id: "chicken-curry", name: "Chicken Curry (Home-Style)", category: "protein", serving_label: "1 bowl (200g)", serving_weight_g: 200, calories_kcal: 290, protein_g: 28.0, carbs_g: 6.0, fat_g: 17.0, provenance: "verified_reference" },
  { id: "fish-rohu-cooked", name: "Grilled Fish (Rohu / Surmai)", category: "protein", serving_label: "150g cooked", serving_weight_g: 150, calories_kcal: 193, protein_g: 31.5, carbs_g: 0.0, fat_g: 7.0, provenance: "verified_reference" },
  // Protein — Veg
  { id: "paneer-raw", name: "Paneer (Raw / Cubed)", category: "protein", serving_label: "100g", serving_weight_g: 100, calories_kcal: 265, protein_g: 18.3, carbs_g: 1.2, fat_g: 20.8, provenance: "verified_reference" },
  { id: "paneer-bhurji", name: "Paneer Bhurji", category: "protein", serving_label: "150g", serving_weight_g: 150, calories_kcal: 340, protein_g: 22.0, carbs_g: 4.5, fat_g: 26.0, provenance: "verified_reference" },
  { id: "dal-tadka", name: "Toor / Moong Dal Tadka", category: "protein", serving_label: "1 katori (150g)", serving_weight_g: 150, calories_kcal: 150, protein_g: 9.0, carbs_g: 23.0, fat_g: 3.5, provenance: "verified_reference" },
  { id: "whey-protein", name: "Whey Protein (Isolate / Concentrate)", category: "supplement", serving_label: "1 scoop (30g)", serving_weight_g: 30, calories_kcal: 120, protein_g: 24.0, carbs_g: 3.0, fat_g: 1.5, provenance: "verified_reference" },
  { id: "curd-dahi", name: "Curd / Dahi", category: "protein", serving_label: "1 katori (150g)", serving_weight_g: 150, calories_kcal: 84, protein_g: 7.5, carbs_g: 6.0, fat_g: 3.0, provenance: "verified_reference" },
  { id: "toned-milk", name: "Toned Milk", category: "dairy", serving_label: "250ml glass", serving_weight_g: 250, calories_kcal: 120, protein_g: 8.8, carbs_g: 12.0, fat_g: 3.0, provenance: "verified_reference" },
  // Fats / Oils / Snacks
  { id: "peanut-butter", name: "Peanut Butter", category: "fats", serving_label: "1 tbsp (16g)", serving_weight_g: 16, calories_kcal: 94, protein_g: 4.0, carbs_g: 3.5, fat_g: 8.0, provenance: "verified_reference" },
  { id: "roasted-chana", name: "Roasted Chana / Peanuts", category: "snack", serving_label: "30g", serving_weight_g: 30, calories_kcal: 113, protein_g: 5.5, carbs_g: 14.0, fat_g: 3.5, provenance: "verified_reference" },
  { id: "ghee-tsp", name: "Ghee", category: "fats", serving_label: "1 tsp (5g)", serving_weight_g: 5, calories_kcal: 45, protein_g: 0.0, carbs_g: 0.0, fat_g: 5.0, provenance: "verified_reference" },
  { id: "cooking-oil-tbsp", name: "Cooking Oil", category: "fats", serving_label: "1 tbsp (14g)", serving_weight_g: 14, calories_kcal: 124, protein_g: 0.0, carbs_g: 0.0, fat_g: 14.0, provenance: "verified_reference" },
];

export function searchFoodCatalog(query?: string, category?: string): FoodCatalogItem[] {
  let results = INDIAN_FOOD_CATALOG;
  if (category) {
    results = results.filter((f) => f.category.toLowerCase() === category.toLowerCase());
  }
  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    results = results.filter(
      (f) => f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q)
    );
  }
  return results;
}

// =============================================================================
// Phase 2: Daily Nutrition Totals (confirmed vs unconfirmed guardrail)
// =============================================================================

function blankTotals(): DailyMacroTotals {
  return { caloriesKcal: 0, proteinG: 0, carbsG: 0, fatG: 0, entryCount: 0 };
}

/**
 * CRITICAL GUARDRAIL: is_confirmed=false entries are NEVER included in
 * confirmedTotals. They are tracked separately as unconfirmedEstimates.
 */
export function calculateDailyNutritionTotals(entries: FoodEntry[]): DailyNutritionSummary {
  const confirmed = blankTotals();
  const unconfirmed = blankTotals();

  for (const entry of entries) {
    const q = Math.max(0, entry.quantity);
    const cal = Math.round(entry.caloriesKcal * q * 10) / 10;
    const pro = Math.round(entry.proteinG * q * 10) / 10;
    const cho = Math.round(entry.carbsG * q * 10) / 10;
    const fat = Math.round(entry.fatG * q * 10) / 10;

    const bucket = entry.isConfirmed ? confirmed : unconfirmed;
    bucket.caloriesKcal = Math.round((bucket.caloriesKcal + cal) * 10) / 10;
    bucket.proteinG = Math.round((bucket.proteinG + pro) * 10) / 10;
    bucket.carbsG = Math.round((bucket.carbsG + cho) * 10) / 10;
    bucket.fatG = Math.round((bucket.fatG + fat) * 10) / 10;
    bucket.entryCount += 1;
  }

  return { confirmedTotals: confirmed, unconfirmedEstimates: unconfirmed };
}

// =============================================================================
// Phase 2: Running Pace Calculator
// =============================================================================

export interface PaceResult {
  distanceKm: number;
  durationMinutes: number;
  paceDecimal: number;
  paceFormatted: string; // "MM:SS /km"
}

export function calculateRunningPace(distanceKm: number, durationMinutes: number): PaceResult {
  if (distanceKm <= 0) throw new Error("distanceKm must be strictly positive");
  if (durationMinutes <= 0) throw new Error("durationMinutes must be strictly positive");

  const paceDecimal = Math.round((durationMinutes / distanceKm) * 100) / 100;
  const minutesPart = Math.floor(paceDecimal);
  let secondsPart = Math.round((paceDecimal - minutesPart) * 60);
  // Guard floating-point spill
  if (secondsPart === 60) {
    return {
      distanceKm,
      durationMinutes,
      paceDecimal,
      paceFormatted: `${minutesPart + 1}:00 /km`,
    };
  }
  const paceFormatted = `${minutesPart}:${String(secondsPart).padStart(2, "0")} /km`;
  return { distanceKm, durationMinutes, paceDecimal, paceFormatted };
}

// =============================================================================
// Phase 2: Progression Suggestion (client-side rules engine)
// =============================================================================

export interface PreviousSetInput {
  reps: number;
  loadKg: number;
  rpe?: number | null;
  isBodyweight?: boolean;
}

export function evaluateProgressionSuggestion(
  exerciseName: string,
  previousSets: PreviousSetInput[],
  equipmentMaxLoadKg: number,
  equipmentMinIncrementKg: number,
  equipmentConfirmed: boolean,
  readinessStatus: "Prime" | "Moderate" | "Recover",
  targetRepsMax: number
): ProgressionSuggestion {
  if (!equipmentConfirmed) {
    return {
      exerciseName,
      action: "confirm_equipment_first",
      explanation: `Confirm your home gym equipment in Profile → Equipment before load progressions can be prescribed for '${exerciseName}'.`,
      requiresUserConfirmation: true,
      provenance: "rules_based_progression",
    };
  }

  if (readinessStatus === "Recover") {
    return {
      exerciseName,
      action: "maintain_or_deload",
      explanation: `Recovery deficit detected. Hold current load for '${exerciseName}' or reduce by 5–10%.`,
      requiresUserConfirmation: true,
      provenance: "rules_based_progression",
    };
  }

  const rpeValues = previousSets.map((s) => s.rpe).filter((r): r is number => r != null);
  const avgRpe = rpeValues.length > 0 ? rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length : 0;

  if (avgRpe >= 9.5) {
    return {
      exerciseName,
      action: "maintain_or_deload",
      explanation: `Average RPE ${avgRpe.toFixed(1)} >= 9.5. Maintain or deload to manage fatigue.`,
      requiresUserConfirmation: true,
      provenance: "rules_based_progression",
    };
  }

  if (previousSets.length === 0) {
    return {
      exerciseName,
      action: "maintain",
      explanation: "No previous set data. Log sets to enable progression tracking.",
      requiresUserConfirmation: true,
      provenance: "rules_based_progression",
    };
  }

  const lastSet = previousSets[previousSets.length - 1];
  const currentLoad = lastSet.loadKg;
  const isBodyweight = lastSet.isBodyweight ?? false;
  const allHitTarget = previousSets.every((s) => s.reps >= targetRepsMax);

  if (allHitTarget && avgRpe <= 8.5) {
    if (isBodyweight || currentLoad >= equipmentMaxLoadKg) {
      return {
        exerciseName,
        action: "increase_reps_or_tempo",
        explanation: `All sets hit ≥ ${targetRepsMax} reps. ${isBodyweight ? "Bodyweight movement" : `At ${equipmentMaxLoadKg} kg home cap`}. Add +1–2 reps or use a 3s eccentric.`,
        newRepsSuggestion: "+1 to +2 reps or 3s eccentric",
        requiresUserConfirmation: true,
        provenance: "rules_based_progression",
      };
    } else {
      const newLoad = Math.min(
        Math.round((currentLoad + equipmentMinIncrementKg) * 100) / 100,
        equipmentMaxLoadKg
      );
      return {
        exerciseName,
        action: "increase_load",
        explanation: `All sets hit ≥ ${targetRepsMax} reps with avg RPE ${avgRpe.toFixed(1)}. Suggested: ${currentLoad} kg → ${newLoad} kg (+${equipmentMinIncrementKg} kg).`,
        newLoadKg: newLoad,
        requiresUserConfirmation: true,
        provenance: "rules_based_progression",
      };
    }
  }

  return {
    exerciseName,
    action: "maintain",
    explanation: `Not all sets reached ${targetRepsMax} reps. Continue at current load (avg RPE: ${avgRpe.toFixed(1)}).`,
    requiresUserConfirmation: true,
    provenance: "rules_based_progression",
  };
}

// =============================================================================
// Phase 2: Weight Trend (7-day rolling average)
// =============================================================================

export interface WeightPointInput {
  loggedDate: string; // ISO "YYYY-MM-DD"
  weightKg: number;
}

export function calculateWeightTrend(entries: WeightPointInput[]): WeightTrendResult {
  if (entries.length < 3) {
    return {
      status: "insufficient_data",
      rolling7dKg: null,
      weeklyDeltaKg: null,
      explanation: `At least 3 weigh-ins are required to establish a reliable rolling weight trend. Currently ${entries.length} of 3 minimum. Single-day fluctuations reflect water retention, glycogen loading, and bowel content — not tissue change.`,
      entries: [],
    };
  }

  const sorted = [...entries].sort((a, b) => a.loggedDate.localeCompare(b.loggedDate));
  const weights = sorted.map((e) => e.weightKg);

  const rollingAvgs: number[] = sorted.map((_, i) => {
    const start = Math.max(0, i - 6);
    const window = weights.slice(start, i + 1);
    return Math.round((window.reduce((a, b) => a + b, 0) / window.length) * 100) / 100;
  });

  const latestRolling = rollingAvgs[rollingAvgs.length - 1];
  const weeklyDelta = Math.round((latestRolling - rollingAvgs[0]) * 100) / 100;

  return {
    status: "ok",
    rolling7dKg: latestRolling,
    weeklyDeltaKg: weeklyDelta,
    explanation: `7-day rolling average: ${latestRolling.toFixed(2)} kg. Trend since first entry: ${weeklyDelta >= 0 ? "+" : ""}${weeklyDelta.toFixed(2)} kg.`,
    entries: sorted.map((e, i) => ({
      logged_date: e.loggedDate,
      weight_kg: e.weightKg,
      rolling_7d_kg: rollingAvgs[i],
    })),
  };
}
