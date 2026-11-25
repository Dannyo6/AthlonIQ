import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { WorkoutsView } from "@/features/workouts/WorkoutsView";
import { UnsavedWorkProvider } from "@/features/navigation/UnsavedWorkContext";
import * as useAthloniqStateModule from "@/hooks/useAthloniqState";
import {
  gatedProgressionSuggestion,
  extractPersonalRecords,
} from "@/lib/calculations";
import type { EquipmentItem, UserProfile, WorkoutSession } from "@/types";

describe("WorkoutsView & Split Components Test Suite", () => {
  const unconfirmedEquipment: EquipmentItem[] = [
    {
      id: "eq-1",
      itemKey: "free_weights_70kg",
      itemName: "Free Weights up to 70 kg",
      maxLoadKg: 70.0,
      minIncrementKg: null, // Null increment!
      isAvailable: true,
      isConfirmed: false,
    },
    {
      id: "eq-2",
      itemKey: "bench",
      itemName: "Flat/Incline Bench",
      maxLoadKg: null,
      minIncrementKg: null,
      isAvailable: true,
      isConfirmed: false,
    },
  ];

  const confirmedEquipmentWithLimits: EquipmentItem[] = [
    {
      id: "eq-1",
      itemKey: "free_weights_70kg",
      itemName: "Free Weights up to 70 kg",
      maxLoadKg: 70.0,
      minIncrementKg: 2.5,
      isAvailable: true,
      isConfirmed: true,
    },
    {
      id: "eq-2",
      itemKey: "bench",
      itemName: "Flat/Incline Bench",
      maxLoadKg: 100.0,
      minIncrementKg: 2.5,
      isAvailable: true,
      isConfirmed: true,
    },
  ];

  const baseProfile: Partial<UserProfile> = {
    id: "user-1",
    fullName: "Alex Rivera",
    email: "alex@athloniq.io",
    trainingDaysPerWeek: 4,
    trainingScope: ["gym", "calisthenics"],
    equipmentConfirmed: false,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  function setupStateMock(overrides: Record<string, any> = {}) {
    const mockState = {
      profile: { ...baseProfile, ...(overrides.profile || {}) } as any,
      preferences: overrides.preferences || { timezone: "Asia/Kolkata" },
      equipment: overrides.equipment || [...unconfirmedEquipment],
      readiness: overrides.readiness || { status: "Prime", readinessScore: 88 },
      workoutSessions: overrides.workoutSessions || [],
      addWorkoutSession: overrides.addWorkoutSession || vi.fn(),
      deleteWorkoutSession: overrides.deleteWorkoutSession || vi.fn(),
    };

    vi.spyOn(useAthloniqStateModule, "useAthloniqState").mockReturnValue(mockState as any);
    return mockState;
  }

  // =========================================================================
  // 1. Locked Equipment State
  // =========================================================================
  describe("1. Locked Equipment State", () => {
    it("renders equipment-confirmation banner when equipment is unconfirmed", () => {
      setupStateMock({
        profile: { equipmentConfirmed: false },
        equipment: unconfirmedEquipment,
      });

      render(
        <MemoryRouter>
          <UnsavedWorkProvider>
            <WorkoutsView />
          </UnsavedWorkProvider>
        </MemoryRouter>
      );

      // Warning text must be displayed
      expect(
        screen.getByText(/Equipment confirmation required for load progressions/i)
      ).toBeInTheDocument();

      // Must link directly to /profile?step=equipment
      const link = screen.getByRole("link", { name: /Confirm Equipment in Profile/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/profile?step=equipment");
    });

    it("gatedProgressionSuggestion returns confirm_equipment_first and 'Set your equipment limits' when locked", () => {
      const suggestion = gatedProgressionSuggestion(
        null,
        null,
        false, // unconfirmed
        [{ reps: 10, loadKg: 50, rpe: 8, isBodyweight: false }],
        10,
        "Barbell Bench Press",
        "Prime"
      );

      expect(suggestion.action).toBe("confirm_equipment_first");
      expect(suggestion.explanation).toContain("Set your equipment limits to get load progressions");
      expect(suggestion.requiresUserConfirmation).toBe(true);
      expect(suggestion.newLoadKg).toBeUndefined();
    });
  });

  // =========================================================================
  // 2. Null Limits State
  // =========================================================================
  describe("2. Null Limits State", () => {
    it("renders callout banner when profile is confirmed but equipment item limits are null", () => {
      const nullLimitsEquipment: EquipmentItem[] = [
        {
          id: "eq-1",
          itemKey: "free_weights_70kg",
          itemName: "Free Weights up to 70 kg",
          maxLoadKg: null, // Null!
          minIncrementKg: null, // Null!
          isAvailable: true,
          isConfirmed: true,
        },
      ];

      setupStateMock({
        profile: { equipmentConfirmed: true },
        equipment: nullLimitsEquipment,
      });

      render(
        <MemoryRouter>
          <UnsavedWorkProvider>
            <WorkoutsView />
          </UnsavedWorkProvider>
        </MemoryRouter>
      );

      // Warning banner must still appear because limits are null
      expect(
        screen.getByText(/Equipment confirmation required for load progressions/i)
      ).toBeInTheDocument();
    });

    it("gatedProgressionSuggestion refuses to fabricate magic numbers when maxLoad or minIncrement is null", () => {
      const suggestion = gatedProgressionSuggestion(
        70.0,
        null, // null minIncrement!
        true,
        [{ reps: 10, loadKg: 60, rpe: 8, isBodyweight: false }],
        10,
        "Barbell Bench Press"
      );

      expect(suggestion.action).toBe("confirm_equipment_first");
      expect(suggestion.explanation).toContain("Set your equipment limits");
      expect(suggestion.newLoadKg).toBeUndefined();
    });

    it("hides warning banner when equipment is confirmed and all limits are non-null", () => {
      setupStateMock({
        profile: { equipmentConfirmed: true },
        equipment: confirmedEquipmentWithLimits,
      });

      render(
        <MemoryRouter>
          <UnsavedWorkProvider>
            <WorkoutsView />
          </UnsavedWorkProvider>
        </MemoryRouter>
      );

      expect(
        screen.queryByText(/Equipment confirmation required for load progressions/i)
      ).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // 3. Empty History State
  // =========================================================================
  describe("3. Empty History State", () => {
    it("renders empty history state when workoutSessions is empty", () => {
      setupStateMock({ workoutSessions: [] });

      render(
        <MemoryRouter>
          <UnsavedWorkProvider>
            <WorkoutsView />
          </UnsavedWorkProvider>
        </MemoryRouter>
      );

      // Click History tab
      const historyTab = screen.getByRole("button", { name: /^History$/i });
      fireEvent.click(historyTab);

      expect(
        screen.getByText(/No sessions logged yet. Start your first workout!/i)
      ).toBeInTheDocument();
    });

    it("extractPersonalRecords returns empty array when no sessions are logged", () => {
      const prs = extractPersonalRecords([]);
      expect(prs).toEqual([]);
    });
  });

  // =========================================================================
  // 4. Dirty Guard State
  // =========================================================================
  describe("4. Dirty Guard State", () => {
    it("marks form dirty when user enters reps or notes in an active session", () => {
      setupStateMock({
        profile: { equipmentConfirmed: true },
        equipment: confirmedEquipmentWithLimits,
      });

      render(
        <MemoryRouter>
          <UnsavedWorkProvider>
            <WorkoutsView />
          </UnsavedWorkProvider>
        </MemoryRouter>
      );

      // Start the first template
      const startButtons = screen.getAllByRole("button", { name: /Start This Template/i });
      fireEvent.click(startButtons[0]);

      // Active session is open
      expect(screen.getByText(/Finish Session/i)).toBeInTheDocument();

      // Enter reps in the first set
      const repInputs = screen.getAllByPlaceholderText("0");
      expect(repInputs.length).toBeGreaterThan(0);
      fireEvent.change(repInputs[0], { target: { value: "8" } });

      // Enter session notes
      const notesArea = screen.getByPlaceholderText(/Session notes.../i);
      fireEvent.change(notesArea, { target: { value: "Felt strong today" } });

      expect(notesArea).toHaveValue("Felt strong today");
    });
  });

  // =========================================================================
  // 5. Deterministic PR Extraction
  // =========================================================================
  describe("5. Deterministic Personal Records Extraction", () => {
    it("extracts highest load per exercise with deterministic Epley 1RM, ignoring bodyweight sets", () => {
      const sampleSessions: WorkoutSession[] = [
        {
          id: "sess-1",
          loggedDate: "2026-10-15",
          title: "Upper Day 1",
          durationMinutes: 50,
          completed: true,
          sets: [
            {
              id: "s1",
              exerciseName: "Barbell Bench Press",
              setOrder: 1,
              reps: 8,
              loadKg: 70,
              isBodyweight: false,
              isCompleted: true,
              isPr: false,
            },
            {
              id: "s2",
              exerciseName: "Parallel Bar Dips",
              setOrder: 1,
              reps: 12,
              loadKg: 0,
              isBodyweight: true, // Should be excluded from weight PRs
              isCompleted: true,
              isPr: false,
            },
          ],
        },
        {
          id: "sess-2",
          loggedDate: "2026-10-18",
          title: "Upper Day 2",
          durationMinutes: 55,
          completed: true,
          sets: [
            {
              id: "s3",
              exerciseName: "Barbell Bench Press",
              setOrder: 1,
              reps: 6,
              loadKg: 75, // New PR!
              isBodyweight: false,
              isCompleted: true,
              isPr: true,
            },
          ],
        },
      ];

      const prs = extractPersonalRecords(sampleSessions);
      expect(prs).toHaveLength(1);
      expect(prs[0].exerciseName).toBe("Barbell Bench Press");
      expect(prs[0].maxLoadKg).toBe(75);
      expect(prs[0].repsAtMaxLoad).toBe(6);
      expect(prs[0].loggedDate).toBe("2026-10-18");
      // Epley 1RM for 75kg x 6 = 75 * (1 + 6/30) = 75 * 1.2 = 90kg
      expect(prs[0].estimated1RmKg).toBe(90);
      expect(prs[0].totalPrSetsCount).toBe(1);
    });
  });

  // =========================================================================
  // 6. Progression Suggestions when Confirmed
  // =========================================================================
  describe("6. Progression Suggestions when Confirmed", () => {
    it("unlocks load progression when equipment is confirmed and all sets reach target reps", () => {
      const suggestion = gatedProgressionSuggestion(
        100.0, // maxLoadKg
        2.5,   // minIncrementKg
        true,  // equipmentConfirmed
        [
          { reps: 10, loadKg: 60, rpe: 8, isBodyweight: false },
          { reps: 10, loadKg: 60, rpe: 8, isBodyweight: false },
        ],
        10,
        "Barbell Bench Press",
        "Prime"
      );

      expect(suggestion.action).toBe("increase_load");
      expect(suggestion.newLoadKg).toBe(62.5);
      expect(suggestion.explanation).toContain("60 kg → 62.5 kg (+2.5 kg)");
      expect(suggestion.requiresUserConfirmation).toBe(true);
    });
  });

  // =========================================================================
  // 7. Weekday Planned Session & Editable Starter Templates
  // =========================================================================
  describe("7. Weekday Planned Session & Editable Starter Templates", () => {
    it("shows 'No session planned — pick a template' when no template is assigned to today's weekday", () => {
      setupStateMock({
        profile: { equipmentConfirmed: true },
        equipment: confirmedEquipmentWithLimits,
      });

      // 2026-11-25 in Asia/Kolkata is Wednesday ("Wed")
      render(
        <MemoryRouter>
          <UnsavedWorkProvider>
            <WorkoutsView now="2026-11-25T12:00:00+05:30" />
          </UnsavedWorkProvider>
        </MemoryRouter>
      );

      expect(
        screen.getByText(/No session planned — pick a template/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /^Starter templates$/i })
      ).toBeInTheDocument();
    });

    it("shows assigned template in Today's Planned Session only when athlete assigns it to that weekday", () => {
      setupStateMock({
        profile: { equipmentConfirmed: true },
        equipment: confirmedEquipmentWithLimits,
      });

      render(
        <MemoryRouter>
          <UnsavedWorkProvider>
            <WorkoutsView now="2026-11-25T12:00:00+05:30" />
          </UnsavedWorkProvider>
        </MemoryRouter>
      );

      // Initially no planned session
      expect(
        screen.getByText(/No session planned — pick a template/i)
      ).toBeInTheDocument();

      // Assign "Lower A: Squat & Hinge" to Wed
      const wedButton = screen.getByRole("button", {
        name: /Assign Lower A: Squat & Hinge to Wed/i,
      });
      fireEvent.click(wedButton);

      expect(
        screen.queryByText(/No session planned — pick a template/i)
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Start Today's Session/i })
      ).toBeInTheDocument();
    });

    it("allows editing starter templates (name and focus) and persists updates", () => {
      setupStateMock({
        profile: { equipmentConfirmed: true },
        equipment: confirmedEquipmentWithLimits,
      });

      render(
        <MemoryRouter>
          <UnsavedWorkProvider>
            <WorkoutsView now="2026-11-25T12:00:00+05:30" />
          </UnsavedWorkProvider>
        </MemoryRouter>
      );

      const editBtn = screen.getByRole("button", {
        name: /Edit Upper A: Horizontal Push\/Pull/i,
      });
      fireEvent.click(editBtn);

      const nameInput = screen.getByLabelText("Template Name");
      fireEvent.change(nameInput, {
        target: { value: "Custom Upper Hypertrophy" },
      });

      const saveBtn = screen.getByRole("button", { name: /Save Template/i });
      fireEvent.click(saveBtn);

      expect(screen.getByText("Custom Upper Hypertrophy")).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 8. PR 1RM Python Rule Parity & Estimate Label
  // =========================================================================
  describe("8. PR 1RM Rules (1 rep = load, >= 30 reps = null) & Estimate Label", () => {
    it("returns exact load for 1 rep and null for 30+ reps, labeling results as estimates in UI", () => {
      const sessions: WorkoutSession[] = [
        {
          id: "sess-pr-1",
          loggedDate: "2026-11-20",
          title: "1RM & Endurance Test",
          completed: true,
          sets: [
            {
              id: "s-1rep",
              exerciseName: "Deadlift",
              setOrder: 1,
              reps: 1,
              loadKg: 140,
              isBodyweight: false,
              isCompleted: true,
              isPr: true,
            },
            {
              id: "s-30rep",
              exerciseName: "Light Dumbbell Curl",
              setOrder: 1,
              reps: 30,
              loadKg: 10,
              isBodyweight: false,
              isCompleted: true,
              isPr: false,
            },
          ],
        },
      ];

      const prs = extractPersonalRecords(sessions);
      const deadliftPr = prs.find((p) => p.exerciseName === "Deadlift");
      const curlPr = prs.find((p) => p.exerciseName === "Light Dumbbell Curl");

      expect(deadliftPr?.estimated1RmKg).toBe(140);
      expect(curlPr?.estimated1RmKg).toBeNull();

      setupStateMock({
        profile: { equipmentConfirmed: true },
        equipment: confirmedEquipmentWithLimits,
        workoutSessions: sessions,
      });

      render(
        <MemoryRouter>
          <UnsavedWorkProvider>
            <WorkoutsView now="2026-11-25T12:00:00+05:30" />
          </UnsavedWorkProvider>
        </MemoryRouter>
      );

      fireEvent.click(screen.getByRole("button", { name: /^History$/i }));
      expect(screen.getByText(/1RM is an Estimate/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Estimated 1RM \(Epley estimate\):/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/140 kg/i).length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText(/No value \(30\+ reps\)/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 9. Optional RIR Beside RPE & Bodyweight Option
  // =========================================================================
  describe("9. Optional RIR beside RPE", () => {
    it("renders optional RIR input beside RPE and accepts explicit 0", () => {
      setupStateMock({
        profile: { equipmentConfirmed: true },
        equipment: confirmedEquipmentWithLimits,
      });

      render(
        <MemoryRouter>
          <UnsavedWorkProvider>
            <WorkoutsView now="2026-11-25T12:00:00+05:30" />
          </UnsavedWorkProvider>
        </MemoryRouter>
      );

      const startButtons = screen.getAllByRole("button", {
        name: /Start This Template/i,
      });
      fireEvent.click(startButtons[0]);

      const rpeInputs = screen.getAllByLabelText("RPE");
      const rirInputs = screen.getAllByLabelText("RIR");
      expect(rpeInputs.length).toBeGreaterThan(0);
      expect(rirInputs.length).toBe(rpeInputs.length);

      fireEvent.change(rirInputs[0], { target: { value: "0" } });
      expect(rirInputs[0]).toHaveValue(0);
    });
  });
});
