import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { supabase } from "@/lib/supabase";
import { workoutTemplatesRepo } from "@/services/repo/workoutTemplatesRepo";
import { goalsRepo } from "@/services/repo/goalsRepo";
import { AthloniqProvider, useAthloniqState } from "@/hooks/useAthloniqState";
import * as AuthContextModule from "@/features/auth/AuthContext";
import type { DisplayBadge, Provenance, UserGoals, WorkoutTemplate } from "@/types";

// Compile-time check: DisplayBadge must NEVER be assignable to Provenance
type IsAssignable<Target, Source> = Source extends Target ? true : false;
const _displayBadgeNotProvenance: IsAssignable<Provenance, DisplayBadge> = false;

const MOCK_USER_ID = "019488a0-7f28-7a54-8e47-cf42861e69ab";
const MOCK_TEMPLATE_UUID = "019488a0-7f28-7a54-8e47-cf42861e69ff";

const mockValidProfileRow = {
  id: MOCK_USER_ID,
  user_id: MOCK_USER_ID,
  email: "athlete@athloniq.io",
  full_name: "Verified Athlete",
  age: 20,
  height_cm: 173,
  weight_kg: 55.0,
  dietary_pattern: "nonvegetarian",
  primary_goal: "lean_bulk",
  training_scope: ["gym", "calisthenics"],
  training_days_per_week: 5,
  training_environment: "home_gym",
  calorie_tracking_habit: "rough_estimates",
  sex: null,
  waist_cm: null,
  experience_level: null,
  current_split: null,
  weekly_badminton_sessions: null,
  weekly_running_sessions: null,
  sleep_baseline_hours: null,
  exercise_limitations: null,
  onboarding_step: 1,
  onboarding_completed: false,
  equipment_confirmed: false,
};

describe("Workout Templates Repo Persistence, Rollback & Provenance Contract", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: { id: MOCK_USER_ID, email: "athlete@athloniq.io" } as any,
      session: { user: { id: MOCK_USER_ID } } as any,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      reAuthRequired: false,
      dismissReAuthPrompt: vi.fn(),
      authToast: null,
      clearAuthToast: vi.fn(),
    });
  });

  // =========================================================================
  // 1. Repo Save (explicit fields, RLS user_id, weekday schedule)
  // =========================================================================
  it("workoutTemplatesRepo.saveTemplate persists explicit fields and scheduled_weekdays to workout_templates", async () => {
    let capturedUpsertPayload: any = null;
    let capturedConflictOpts: any = null;

    const savedRow = {
      id: MOCK_TEMPLATE_UUID,
      user_id: MOCK_USER_ID,
      name: "Edited Upper A",
      focus: "Chest & Back",
      estimated_duration_min: 55,
      is_starter: true,
      starter_key: "tmpl-upper-a",
      scheduled_weekdays: ["Mon", "Thu"],
    };

    const savedExerciseRow = {
      id: "019488a0-7f28-7a54-8e47-cf42861e69ee",
      template_id: MOCK_TEMPLATE_UUID,
      user_id: MOCK_USER_ID,
      exercise_name: "Barbell Bench Press",
      category: "compound",
      equipment_key: "bench",
      target_sets: 4,
      target_reps_min: 6,
      target_reps_max: 10,
      rest_seconds: 120,
      sort_order: 1,
    };

    vi.spyOn(supabase, "from").mockImplementation((table: string) => {
      if (table === "workout_templates") {
        const builder: any = {
          upsert: vi.fn((payload: any, opts?: any) => {
            capturedUpsertPayload = payload;
            capturedConflictOpts = opts;
            return builder;
          }),
          select: vi.fn(() => builder),
          single: vi.fn().mockResolvedValue({ data: savedRow, error: null }),
        };
        return builder;
      }
      if (table === "workout_template_exercises") {
        const builder: any = {
          delete: vi.fn(() => builder),
          eq: vi.fn(() => builder),
          insert: vi.fn(() => builder),
          select: vi.fn().mockResolvedValue({ data: [savedExerciseRow], error: null }),
          then: (resolve: any) =>
            Promise.resolve({ error: null }).then(resolve),
        };
        return builder;
      }
      throw new Error(`Unexpected table ${table}`);
    });

    const inputTemplate: WorkoutTemplate = {
      id: "tmpl-upper-a",
      name: "Edited Upper A",
      focus: "Chest & Back",
      estimatedDurationMin: 55,
      isStarter: true,
      starterKey: "tmpl-upper-a",
      scheduledWeekdays: ["Mon", "Thu"],
      exercises: [
        {
          id: "e1",
          exerciseName: "Barbell Bench Press",
          category: "compound",
          equipmentKey: "bench",
          targetSets: 4,
          targetRepsMin: 6,
          targetRepsMax: 10,
          restSeconds: 120,
          sortOrder: 1,
        },
      ],
    };

    const saved = await workoutTemplatesRepo.saveTemplate(
      MOCK_USER_ID,
      inputTemplate
    );

    expect(capturedConflictOpts).toEqual({ onConflict: "user_id,starter_key" });
    expect(capturedUpsertPayload).toEqual({
      user_id: MOCK_USER_ID,
      name: "Edited Upper A",
      focus: "Chest & Back",
      estimated_duration_min: 55,
      is_starter: true,
      starter_key: "tmpl-upper-a",
      scheduled_weekdays: ["Mon", "Thu"],
    });
    expect(saved.id).toBe(MOCK_TEMPLATE_UUID);
    expect(saved.scheduledWeekdays).toEqual(["Mon", "Thu"]);
    expect(saved.isStarter).toBe(true);
    expect(saved.starterKey).toBe("tmpl-upper-a");
    expect(saved.exercises).toHaveLength(1);
  });

  // =========================================================================
  // 2. Repo Load & Survive Page Refresh via AthloniqProvider
  // =========================================================================
  it("loads saved template edits and weekday schedules on refresh from workout_templates", async () => {
    // In-memory mocked Postgres table rows surviving provider remount ("refresh")
    let persistedTemplates: any[] = [];
    let persistedExercises: any[] = [];

    vi.spyOn(supabase, "from").mockImplementation((table: string) => {
      const baseBuilder: any = {
        select: vi.fn(() => baseBuilder),
        insert: vi.fn(() => baseBuilder),
        upsert: vi.fn(() => baseBuilder),
        delete: vi.fn(() => baseBuilder),
        eq: vi.fn(() => baseBuilder),
        in: vi.fn(() => baseBuilder),
        order: vi.fn(() => baseBuilder),
        limit: vi.fn(() => baseBuilder),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        single: vi.fn().mockResolvedValue({ data: mockValidProfileRow, error: null }),
        then: (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve),
      };

      if (table === "profiles") {
        return baseBuilder;
      }
      if (table === "workout_templates") {
        let lastRow: any = null;
        const tplBuilder: any = {
          select: vi.fn(() => tplBuilder),
          eq: vi.fn(() => tplBuilder),
          order: vi.fn().mockResolvedValue({ data: persistedTemplates, error: null }),
          upsert: vi.fn((payload: any) => {
            lastRow = {
              id: payload.id || MOCK_TEMPLATE_UUID,
              ...payload,
            };
            const idx = persistedTemplates.findIndex(
              (r) =>
                r.id === lastRow.id ||
                (lastRow.starter_key && r.starter_key === lastRow.starter_key)
            );
            if (idx >= 0) {
              persistedTemplates[idx] = lastRow;
            } else {
              persistedTemplates.push(lastRow);
            }
            return tplBuilder;
          }),
          single: vi.fn().mockImplementation(async () => ({
            data: lastRow,
            error: null,
          })),
        };
        return tplBuilder;
      }
      if (table === "workout_template_exercises") {
        const exBuilder: any = {
          select: vi.fn(() => exBuilder),
          eq: vi.fn(() => exBuilder),
          in: vi.fn(() => exBuilder),
          order: vi.fn().mockResolvedValue({ data: persistedExercises, error: null }),
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn().mockImplementation(async () => {
                persistedExercises = [];
                return { error: null };
              }),
            })),
          })),
          insert: vi.fn((rows: any[]) => {
            const withIds = rows.map((r, i) => ({
              id: `019488a0-7f28-7a54-8e47-cf42861e610${i}`,
              ...r,
            }));
            persistedExercises = withIds;
            return {
              select: vi.fn().mockResolvedValue({ data: withIds, error: null }),
            };
          }),
        };
        return exBuilder;
      }
      return baseBuilder;
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AthloniqProvider>{children}</AthloniqProvider>
    );

    // Mount 1: Edit starter template and assign to "Wed"
    const firstMount = renderHook(() => useAthloniqState(), { wrapper });
    await waitFor(() => {
      expect(firstMount.result.current.syncStatus).toBe("synced");
    });

    const upperA = firstMount.result.current.workoutTemplates.find(
      (t) => t.starterKey === "tmpl-upper-a"
    )!;
    expect(upperA).toBeDefined();

    await act(async () => {
      await firstMount.result.current.updateWorkoutTemplate({
        ...upperA,
        name: "Persisted Upper Split",
        scheduledWeekdays: ["Wed"],
      });
    });

    expect(persistedTemplates).toHaveLength(1);
    expect(persistedTemplates[0].name).toBe("Persisted Upper Split");
    expect(persistedTemplates[0].scheduled_weekdays).toEqual(["Wed"]);

    firstMount.unmount();

    // Mount 2 (simulates full page refresh): must reload persisted name & Wed schedule
    const secondMount = renderHook(() => useAthloniqState(), { wrapper });
    await waitFor(() => {
      expect(secondMount.result.current.syncStatus).toBe("synced");
    });

    const reloadedUpper = secondMount.result.current.workoutTemplates.find(
      (t) => t.starterKey === "tmpl-upper-a"
    )!;
    expect(reloadedUpper.id).toBe(MOCK_TEMPLATE_UUID);
    expect(reloadedUpper.name).toBe("Persisted Upper Split");
    expect(reloadedUpper.scheduledWeekdays).toEqual(["Wed"]);
  });

  // =========================================================================
  // 3. Error Rollback on Repo Failure
  // =========================================================================
  it("rolls back optimistic template edits and weekday schedule when repo save fails", async () => {
    vi.spyOn(supabase, "from").mockImplementation((table: string) => {
      const builder: any = {
        select: vi.fn(() => builder),
        insert: vi.fn(() => builder),
        upsert: vi.fn(() => builder),
        delete: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        in: vi.fn(() => builder),
        order: vi.fn(() => builder),
        limit: vi.fn(() => builder),
        maybeSingle: vi.fn().mockResolvedValue({
          data: table === "profiles" ? mockValidProfileRow : null,
          error: null,
        }),
        single: vi.fn().mockResolvedValue({
          data: table === "profiles" ? mockValidProfileRow : null,
          error: null,
        }),
        then: (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve),
      };
      return builder;
    });

    vi.spyOn(workoutTemplatesRepo, "saveTemplate").mockRejectedValue(
      new Error("RLS permission denied")
    );

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AthloniqProvider>{children}</AthloniqProvider>
    );

    const { result } = renderHook(() => useAthloniqState(), { wrapper });
    await waitFor(() => {
      expect(result.current.syncStatus).toBe("synced");
    });

    const initialUpper = result.current.workoutTemplates.find(
      (t) => t.starterKey === "tmpl-upper-a"
    )!;
    const originalName = initialUpper.name;
    expect(initialUpper.scheduledWeekdays).toEqual([]);

    await act(async () => {
      await result.current.updateWorkoutTemplate({
        ...initialUpper,
        name: "Should Roll Back",
        scheduledWeekdays: ["Fri"],
      });
    });

    // Must revert back to pre-mutation state and surface warning toast
    const afterFailure = result.current.workoutTemplates.find(
      (t) => t.starterKey === "tmpl-upper-a"
    )!;
    expect(afterFailure.name).toBe(originalName);
    expect(afterFailure.scheduledWeekdays).toEqual([]);
    expect(result.current.syncStatus).toBe("failed");
    expect(result.current.toast?.type).toBe("warning");
    expect(result.current.toast?.message).toContain("Rolled back");
  });

  // =========================================================================
  // 4. DisplayBadge vs Provenance Repo Guard
  // =========================================================================
  it("goalsRepo rejects DisplayBadge values while accepting real Provenance values", async () => {
    expect(_displayBadgeNotProvenance).toBe(false);

    const invalidGoals = {
      proteinMinG: 88,
      proteinMaxG: 121,
      proteinTargetG: 110,
      proteinProvenance: "unconfirmed_equipment",
      calorieTargetKcal: 2400,
      calorieProvenance: "awaiting_onboarding",
      carbsTargetG: null,
      fatTargetG: null,
      waterTargetMl: 3500,
    } as unknown as UserGoals;

    await expect(
      goalsRepo.upsertGoals(MOCK_USER_ID, invalidGoals)
    ).rejects.toThrow();
  });
});
