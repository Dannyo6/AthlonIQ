import { describe, it, expect } from "vitest";
import { ProfileDbRowSchema, mapDbProfileToDomain } from "@/services/repo/profilesRepo";
import { FoodEntryDbRowSchema, mapDbFoodEntryToDomain } from "@/services/repo/foodEntriesRepo";
import { WorkoutSessionDbRowSchema, ExerciseSetDbRowSchema, mapDbSetToDomain } from "@/services/repo/workoutSessionsRepo";
import { RecoveryDbRowSchema, mapDbRecoveryToDomain } from "@/services/repo/recoveryRepo";
import { EquipmentDbRowSchema, mapDbEquipmentToDomain } from "@/services/repo/equipmentRepo";

describe("Repository Zod Schema Validation & Domain Mapping", () => {
  describe("ProfileDbRowSchema & Domain Mapping", () => {
    it("validates a complete and correct profile row and maps to domain", () => {
      const validRow = {
        id: "019488a0-7f28-7a54-8e47-cf42861e69ab",
        email: "athlete@athloniq.io",
        full_name: "Test Athlete",
        age: 24,
        height_cm: 180,
        weight_kg: 78.5,
        dietary_pattern: "nonvegetarian" as const,
        primary_goal: "hypertrophy" as const,
        training_scope: ["gym", "running"],
        training_days_per_week: 5,
        training_environment: "home_gym" as const,
        calorie_tracking_habit: "weighing_foods" as const,
        sex: "male" as const,
        waist_cm: 79.5,
        experience_level: "intermediate" as const,
        current_split: "upper_lower" as const,
        weekly_badminton_sessions: 2,
        weekly_running_sessions: 3,
        sleep_baseline_hours: 8.0,
        exercise_limitations: null,
        onboarding_step: 5,
        onboarding_completed: true,
        equipment_confirmed: true,
      };

      const parsed = ProfileDbRowSchema.parse(validRow);
      expect(parsed.full_name).toBe("Test Athlete");
      expect(parsed.weight_kg).toBe(78.5);

      const domain = mapDbProfileToDomain(parsed);
      expect(domain.fullName).toBe("Test Athlete");
      expect(domain.weightKg).toBe(78.5);
      expect(domain.onboardingCompleted).toBe(true);
    });

    it("allows nulls for unknown baselines and defaults without fabricating identity", () => {
      const rowWithDefaults = {
        id: "019488a0-7f28-7a54-8e47-cf42861e69ab",
        email: "newathlete@athloniq.io",
      };

      const parsed = ProfileDbRowSchema.parse(rowWithDefaults);
      expect(parsed.full_name).toBe(null);
      expect(parsed.onboarding_completed).toBe(false);
      expect(parsed.equipment_confirmed).toBe(false);

      const domain = mapDbProfileToDomain(parsed);
      expect(domain.fullName).toBe("");
      expect(domain.onboardingCompleted).toBe(false);
    });

    it("rejects invalid email or out-of-range age", () => {
      const invalidRow = {
        id: "019488a0-7f28-7a54-8e47-cf42861e69ab",
        email: "not-an-email",
        age: 999, // Invalid!
      };

      expect(() => ProfileDbRowSchema.parse(invalidRow)).toThrow();
    });
  });

  describe("FoodEntryDbRowSchema & Domain Mapping", () => {
    it("validates food entry and enforces positive numeric values", () => {
      const validFood = {
        id: "019488a0-7f28-7a54-8e47-cf42861e69ab",
        user_id: "019488a0-7f28-7a54-8e47-cf42861e69ac",
        logged_date: "2026-10-20",
        meal_slot: "breakfast" as const,
        food_name: "Rolled Oats with Whey",
        quantity: 1.5,
        serving_label: "cup",
        calories_kcal: 380,
        protein_g: 32,
        carbs_g: 48,
        fat_g: 6,
        provenance: "manual_entry" as const,
        is_confirmed: true,
        notes: "Post-morning workout",
      };

      const parsed = FoodEntryDbRowSchema.parse(validFood);
      expect(parsed.food_name).toBe("Rolled Oats with Whey");
      expect(parsed.calories_kcal).toBe(380);
      expect(parsed.protein_g).toBe(32);

      const domain = mapDbFoodEntryToDomain(parsed);
      expect(domain.mealSlot).toBe("breakfast");
      expect(domain.caloriesKcal).toBe(380);
      expect(domain.provenance).toBe("manual_entry");
    });

    it("rejects negative calories or macronutrients", () => {
      const invalidFood = {
        id: "019488a0-7f28-7a54-8e47-cf42861e69ab",
        user_id: "019488a0-7f28-7a54-8e47-cf42861e69ac",
        logged_date: "2026-10-20",
        meal_slot: "lunch" as const,
        food_name: "Negative Energy Food",
        serving_label: "serving",
        calories_kcal: -200, // Invalid!
        protein_g: 10,
        carbs_g: 10,
        fat_g: 5,
      };

      expect(() => FoodEntryDbRowSchema.parse(invalidFood)).toThrow();
    });
  });

  describe("EquipmentDbRowSchema", () => {
    it("starts with is_confirmed=false by default", () => {
      const validEquip = {
        id: "019488a0-7f28-7a54-8e47-cf42861e69ab",
        user_id: "019488a0-7f28-7a54-8e47-cf42861e69ac",
        item_key: "adjustable_dumbbells",
        item_name: "Adjustable Dumbbells",
      };

      const parsed = EquipmentDbRowSchema.parse(validEquip);
      expect(parsed.is_confirmed).toBe(false);
      expect(parsed.is_available).toBe(true);
      expect(parsed.max_load_kg).toBe(null);
      expect(parsed.min_increment_kg).toBe(null);

      const domain = mapDbEquipmentToDomain(parsed);
      expect(domain.isConfirmed).toBe(false);
      expect(domain.itemName).toBe("Adjustable Dumbbells");
      expect(domain.maxLoadKg).toBe(null);
      expect(domain.minIncrementKg).toBe(null);
    });
  });

  describe("WorkoutSessionDbRowSchema & ExerciseSetDbRowSchema", () => {
    it("validates valid workout session row", () => {
      const validWorkout = {
        id: "019488a0-7f28-7a54-8e47-cf42861e69ab",
        user_id: "019488a0-7f28-7a54-8e47-cf42861e69ac",
        logged_date: "2026-10-20",
        title: "Upper Body Hypertrophy",
        duration_minutes: 60,
        session_rpe: 8,
        completed: true,
      };
      const parsed = WorkoutSessionDbRowSchema.parse(validWorkout);
      expect(parsed.duration_minutes).toBe(60);
      expect(parsed.session_rpe).toBe(8);
      expect(parsed.completed).toBe(true);
    });

    it("validates exercise set row and maps to domain", () => {
      const validSet = {
        id: "019488a0-7f28-7a54-8e47-cf42861e69ab",
        session_id: "019488a0-7f28-7a54-8e47-cf42861e69ac",
        user_id: "019488a0-7f28-7a54-8e47-cf42861e69ad",
        exercise_name: "Incline Dumbbell Press",
        equipment_key: "adjustable_dumbbells",
        set_order: 1,
        reps: 10,
        load_kg: 28.0,
        is_bodyweight: false,
        rpe: 8.5,
        rir: 2,
        is_completed: true,
        is_pr: true,
        notes: "Smooth tempo",
      };

      const parsed = ExerciseSetDbRowSchema.parse(validSet);
      expect(parsed.load_kg).toBe(28.0);
      expect(parsed.is_pr).toBe(true);

      const domain = mapDbSetToDomain(parsed);
      expect(domain.exerciseName).toBe("Incline Dumbbell Press");
      expect(domain.loadKg).toBe(28.0);
      expect(domain.isPr).toBe(true);
    });

    it("validates valid recovery check-in and maps to domain", () => {
      const validRecovery = {
        id: "019488a0-7f28-7a54-8e47-cf42861e69ab",
        user_id: "019488a0-7f28-7a54-8e47-cf42861e69ac",
        logged_date: "2026-10-20",
        sleep_hours: 8.0,
        sleep_quality: 5,
        soreness: 2,
        fatigue: 2,
        stress: 1,
        readiness_score: 92,
        readiness_status: "Prime" as const,
      };
      const parsed = RecoveryDbRowSchema.parse(validRecovery);
      expect(parsed.readiness_score).toBe(92);
      expect(parsed.sleep_hours).toBe(8.0);

      const domain = mapDbRecoveryToDomain(parsed);
      expect(domain.sleepHours).toBe(8.0);
      expect(domain.sleepQuality).toBe(5);
    });
  });
});
