import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ProfileView } from "@/features/profile/ProfileView";
import { WorkoutsView } from "@/features/workouts/WorkoutsView";
import { UnsavedWorkProvider } from "@/features/navigation/UnsavedWorkContext";
import * as useAthloniqStateModule from "@/hooks/useAthloniqState";
import type { EquipmentItem, UserProfile } from "@/types";

describe("UI-3: First-Run Onboarding Flow & Equipment-Confirmation Gate", () => {
  const seededEquipment: EquipmentItem[] = [
    {
      id: "eq-1",
      itemKey: "bench",
      itemName: "Flat/Incline Bench",
      maxLoadKg: null,
      minIncrementKg: null,
      isAvailable: true,
      isConfirmed: false,
    },
    {
      id: "eq-2",
      itemKey: "squat_rack",
      itemName: "Squat Rack / Stands",
      maxLoadKg: null,
      minIncrementKg: null,
      isAvailable: true,
      isConfirmed: false,
    },
    {
      id: "eq-3",
      itemKey: "dips_station",
      itemName: "Parallel Dip Station",
      maxLoadKg: null,
      minIncrementKg: null,
      isAvailable: true,
      isConfirmed: false,
    },
    {
      id: "eq-4",
      itemKey: "lat_pulldown_station",
      itemName: "Lat Pulldown / Low Row Station",
      maxLoadKg: null,
      minIncrementKg: null,
      isAvailable: true,
      isConfirmed: false,
    },
    {
      id: "eq-5",
      itemKey: "free_weights_70kg",
      itemName: "Free Weights up to 70 kg",
      maxLoadKg: 70.0,
      minIncrementKg: null,
      isAvailable: true,
      isConfirmed: false,
    },
  ];

  const defaultProfile: Partial<UserProfile> = {
    id: "user-1",
    fullName: "Alex Rivera",
    email: "alex@athloniq.io",
    age: 24,
    heightCm: 178,
    weightKg: 72,
    sex: "male",
    primaryGoal: "lean_bulk",
    dietaryPattern: "nonvegetarian",
    trainingDaysPerWeek: 4,
    experienceLevel: "intermediate",
    currentSplit: "upper_lower",
    sleepBaselineHours: 8,
    onboardingStep: 1,
    onboardingCompleted: false,
    equipmentConfirmed: false,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function setupStateMock(overrides: Record<string, any> = {}) {
    const mockState = {
      profile: defaultProfile as any,
      equipment: [...seededEquipment],
      goals: {
        calorieTargetKcal: null,
        calorieProvenance: "awaiting_onboarding",
        proteinTargetG: 144,
        proteinMinG: 115,
        proteinMaxG: 158,
        proteinProvenance: "calculated_estimate",
      } as any,
      preferences: { timezone: "Asia/Kolkata" } as any,
      todayCheckIn: { sleepHours: 8, sleepQuality: 4, soreness: 2, fatigue: 2 },
      hasTodayCheckIn: false,
      readiness: null,
      foodEntries: [],
      workoutSessions: [],
      activitySessions: [],
      bodyMetrics: [],
      coachMessages: [],
      progressPhotos: [],
      updateProfile: vi.fn(),
      updateEquipmentItem: vi.fn(),
      confirmEquipment: vi.fn(),
      updateGoals: vi.fn(),
      updatePreferences: vi.fn(),
      completeOnboarding: vi.fn(),
      resetToDefaults: vi.fn(),
      addWorkoutSession: vi.fn(),
      deleteWorkoutSession: vi.fn(),
      ...overrides,
    };

    vi.spyOn(useAthloniqStateModule, "useAthloniqState").mockReturnValue(mockState as any);
    return mockState;
  }

  it("navigating to /profile?step=equipment opens Step 3 and displays 'Not set' for null limits and '70 kg' for free_weights_70kg", () => {
    setupStateMock();

    render(
      <MemoryRouter initialEntries={["/profile?step=equipment"]}>
        <UnsavedWorkProvider>
          <ProfileView />
        </UnsavedWorkProvider>
      </MemoryRouter>
    );

    // Verifies Step 3 heading is focused
    expect(
      screen.getByRole("heading", { name: /Home Gym Equipment Verification/i })
    ).toBeInTheDocument();

    // Verifies all 5 seeded items are displayed with UNCONFIRMED status
    expect(screen.getByText("Flat/Incline Bench")).toBeInTheDocument();
    expect(screen.getByText("Squat Rack / Stands")).toBeInTheDocument();
    expect(screen.getByText("Parallel Dip Station")).toBeInTheDocument();
    expect(screen.getByText("Lat Pulldown / Low Row Station")).toBeInTheDocument();
    expect(screen.getByText("Free Weights up to 70 kg")).toBeInTheDocument();

    const unconfirmedBadges = screen.getAllByText("UNCONFIRMED");
    expect(unconfirmedBadges.length).toBe(5);

    // free_weights_70kg has maxLoadKg = 70.0 and minIncrementKg = null
    expect(screen.getByText(/Max Load: 70 kg • Min Increment: Not set/i)).toBeInTheDocument();

    // unconfigured items have both null -> "Not set"
    const notSetLabels = screen.getAllByText(/Max Load: Not set • Min Increment: Not set/i);
    expect(notSetLabels.length).toBe(4);

    // Primary confirmation button is visible
    expect(
      screen.getByRole("button", { name: /Confirm All Home Gym Equipment/i })
    ).toBeInTheDocument();
  });

  it("clicking 'Confirm All Home Gym Equipment' marks equipment confirmed without fabricating non-null increments", () => {
    const stateMock = setupStateMock();

    render(
      <MemoryRouter initialEntries={["/profile?step=equipment"]}>
        <UnsavedWorkProvider>
          <ProfileView />
        </UnsavedWorkProvider>
      </MemoryRouter>
    );

    const confirmAllButton = screen.getByRole("button", {
      name: /Confirm All Home Gym Equipment/i,
    });
    fireEvent.click(confirmAllButton);

    expect(stateMock.confirmEquipment).toHaveBeenCalledTimes(1);
    const confirmedItems: EquipmentItem[] = stateMock.confirmEquipment.mock.calls[0][0];

    expect(confirmedItems).toHaveLength(5);
    expect(confirmedItems.every((i) => i.isConfirmed)).toBe(true);

    // Crucial check: minIncrementKg must remain null for unset fields (no fabricated defaults)
    const freeWeights = confirmedItems.find((i) => i.itemKey === "free_weights_70kg");
    expect(freeWeights?.maxLoadKg).toBe(70.0);
    expect(freeWeights?.minIncrementKg).toBeNull();

    const bench = confirmedItems.find((i) => i.itemKey === "bench");
    expect(bench?.maxLoadKg).toBeNull();
    expect(bench?.minIncrementKg).toBeNull();
  });

  it("WorkoutsView renders callout banner with /profile?step=equipment link when unconfirmed, and hides banner when confirmed with limits", () => {
    // 1. Unconfirmed State
    setupStateMock({
      profile: { ...defaultProfile, equipmentConfirmed: false },
    });

    const { unmount } = render(
      <MemoryRouter initialEntries={["/workouts"]}>
        <UnsavedWorkProvider>
          <WorkoutsView />
        </UnsavedWorkProvider>
      </MemoryRouter>
    );

    expect(
      screen.getByText(/Equipment confirmation required for load progressions/i)
    ).toBeInTheDocument();

    const ctaLink = screen.getByRole("link", { name: /Confirm Equipment in Profile →/i });
    expect(ctaLink).toBeInTheDocument();
    expect(ctaLink.getAttribute("href")).toBe("/profile?step=equipment");
    expect(ctaLink.className).toContain("min-h-[44px]");

    unmount();

    // 2. Confirmed State with valid limits
    setupStateMock({
      profile: { ...defaultProfile, equipmentConfirmed: true },
      equipment: seededEquipment.map((e) => ({
        ...e,
        isConfirmed: true,
        maxLoadKg: e.maxLoadKg ?? 100,
        minIncrementKg: e.minIncrementKg ?? 2.5,
      })),
    });

    render(
      <MemoryRouter initialEntries={["/workouts"]}>
        <UnsavedWorkProvider>
          <WorkoutsView />
        </UnsavedWorkProvider>
      </MemoryRouter>
    );

    expect(
      screen.queryByText(/Equipment confirmation required for load progressions/i)
    ).not.toBeInTheDocument();
  });

  it("source audit: ProfileView.tsx and WorkoutsView.tsx contain zero [#hex] and zero default lime-* classes", () => {
    const rawFiles = import.meta.glob<string>(
      ["../features/profile/ProfileView.tsx", "../features/workouts/WorkoutsView.tsx"],
      { query: "?raw", import: "default", eager: true }
    );

    for (const [filePath, content] of Object.entries(rawFiles)) {
      // Zero arbitrary hex classes
      expect(
        content.match(/\[#[0-9a-fA-F]{3,8}\]/g),
        `Found arbitrary [#hex] in ${filePath}`
      ).toBeNull();

      // Zero default Tailwind lime classes (e.g. text-lime-400, bg-lime-500, lime-400)
      expect(
        content.match(/\blime-\d+\b/g),
        `Found default lime shade in ${filePath}`
      ).toBeNull();
      expect(
        content.match(/\b(text|bg|border|ring)-lime-(?!hover\b)\w+/g),
        `Found default lime utility in ${filePath}`
      ).toBeNull();
    }
  });
});
