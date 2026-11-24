import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import {
  calculateBmi,
  calculateProteinReference,
  calculateRunningPace,
  calculateWeightTrend,
  calculateDailyNutritionTotals,
  FoodEntry,
} from "@/lib/calculations";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesPath = path.resolve(
  __dirname,
  "../../../tests/fixtures/calculations-golden.json"
);
const goldenFixtures = JSON.parse(fs.readFileSync(fixturesPath, "utf-8"));

describe("Shared Golden Fixtures Validation (Vitest ↔ Pytest)", () => {
  // =========================================================================
  // 1. BMI Calculation
  // =========================================================================
  describe("1. BMI Calculation", () => {
    it.each(goldenFixtures.bmi)("$description", (caseItem) => {
      const result = calculateBmi(caseItem.weight_kg, caseItem.height_cm);
      expect(result.bmi).toBe(caseItem.expected_bmi);
      expect(result.category).toBe(caseItem.expected_category);
      expect(result.provenance).toBe("calculated_estimate");
    });
  });

  // =========================================================================
  // 2. Protein Band
  // =========================================================================
  describe("2. Protein Reference Band", () => {
    it.each(goldenFixtures.protein_band)("$description", (caseItem) => {
      const result = calculateProteinReference(
        caseItem.weight_kg,
        caseItem.custom_target_g
      );
      expect(result.proteinMinG).toBe(caseItem.expected_min_g);
      expect(result.proteinMaxG).toBe(caseItem.expected_max_g);
      expect(result.proteinTargetG).toBe(caseItem.expected_target_g);
      expect(result.provenance).toBe(caseItem.expected_provenance);
    });
  });

  // =========================================================================
  // 3. Weight Trend
  // =========================================================================
  describe("3. Rolling 7-day Weight Trend", () => {
    it.each(goldenFixtures.weight_trend)("$description", (caseItem) => {
      const entries = caseItem.entries.map((e) => ({
        loggedDate: e.logged_date,
        weightKg: e.weight_kg,
      }));
      const result = calculateWeightTrend(entries);

      expect(result.status).toBe(caseItem.expected_status);
      expect(result.rolling7dKg).toBe(caseItem.expected_rolling_7d_kg);
      expect(result.weeklyDeltaKg).toBe(caseItem.expected_weekly_delta_kg);
    });
  });

  // =========================================================================
  // 4. Running Pace
  // =========================================================================
  describe("4. Running Pace Calculator", () => {
    it.each(goldenFixtures.pace)("$description", (caseItem) => {
      const result = calculateRunningPace(
        caseItem.distance_km,
        caseItem.duration_minutes
      );
      expect(result.paceDecimal).toBe(caseItem.expected_pace_decimal);
      expect(result.paceFormatted).toBe(caseItem.expected_pace_formatted);
    });
  });

  // =========================================================================
  // 5. Daily Nutrition Totals
  // =========================================================================
  describe("5. Daily Nutrition Totals & Confirmation Separation", () => {
    it.each(goldenFixtures.nutrition_totals)("$description", (caseItem) => {
      const entries: FoodEntry[] = caseItem.entries.map((e, idx) => ({
        id: `food-${idx}`,
        mealSlot: "lunch",
        name: e.name,
        caloriesKcal: e.calories_kcal,
        proteinG: e.protein_g,
        carbsG: e.carbs_g,
        fatG: e.fat_g,
        quantity: e.quantity,
        is_confirmed: e.is_confirmed,
        isConfirmed: e.is_confirmed,
        loggedDate: "2026-11-24",
        createdAt: "2026-11-24T12:00:00Z",
        provenance: e.is_confirmed ? "user_confirmed" : "ai_estimated",
      }));

      const summary = calculateDailyNutritionTotals(entries);

      const expConf = caseItem.expected_confirmed;
      expect(summary.confirmedTotals.caloriesKcal).toBe(expConf.calories_kcal);
      expect(summary.confirmedTotals.proteinG).toBe(expConf.protein_g);
      expect(summary.confirmedTotals.carbsG).toBe(expConf.carbs_g);
      expect(summary.confirmedTotals.fatG).toBe(expConf.fat_g);
      expect(summary.confirmedTotals.entryCount).toBe(expConf.entry_count);

      const expUnconf = caseItem.expected_unconfirmed;
      expect(summary.unconfirmedEstimates.caloriesKcal).toBe(expUnconf.calories_kcal);
      expect(summary.unconfirmedEstimates.proteinG).toBe(expUnconf.protein_g);
      expect(summary.unconfirmedEstimates.carbsG).toBe(expUnconf.carbs_g);
      expect(summary.unconfirmedEstimates.fatG).toBe(expUnconf.fat_g);
      expect(summary.unconfirmedEstimates.entryCount).toBe(expUnconf.entry_count);
    });
  });
});
