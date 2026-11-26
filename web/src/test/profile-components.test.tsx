import { useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProfileView } from "@/features/profile/ProfileView";
import { UnsavedWorkProvider } from "@/features/navigation/UnsavedWorkContext";
import { GuardedNavLink } from "@/features/navigation/GuardedNavLink";
import * as useAthloniqStateModule from "@/hooks/useAthloniqState";
import type { EquipmentItem, UserGoals, UserPreferences, UserProfile } from "@/types";

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
    id: "eq-5",
    itemKey: "free_weights_70kg",
    itemName: "Free Weights up to 70 kg",
    maxLoadKg: 70.0,
    minIncrementKg: null,
    isAvailable: true,
    isConfirmed: false,
  },
];

const incompleteDefaultProfile: Partial<UserProfile> = {
  id: "user-1",
  fullName: "",
  email: "athlete@athloniq.io",
  age: 20,
  heightCm: 173.0,
  weightKg: 55.0,
  sex: null,
  waistCm: null,
  primaryGoal: "lean_bulk",
  dietaryPattern: "nonvegetarian",
  trainingDaysPerWeek: 5,
  experienceLevel: null,
  currentSplit: null,
  weeklyBadmintonSessions: null,
  weeklyRunningSessions: null,
  sleepBaselineHours: null,
  exerciseLimitations: null,
  onboardingStep: 1,
  onboardingCompleted: false,
  equipmentConfirmed: false,
};

const defaultGoals: Partial<UserGoals> = {
  calorieTargetKcal: null,
  calorieProvenance: "provisional_default",
  proteinTargetG: 110,
  proteinMinG: 88,
  proteinMaxG: 121,
  proteinProvenance: "provisional_default",
  carbsTargetG: null,
  fatTargetG: null,
  waterTargetMl: 3500,
};

const defaultPreferences: Partial<UserPreferences> = {
  timezone: "Asia/Kolkata",
  weightUnit: "kg",
  distanceUnit: "km",
};

function setupStateMock(overrides: Record<string, any> = {}) {
  const mockState = {
    profile: { ...incompleteDefaultProfile, ...(overrides.profile || {}) },
    equipment: overrides.equipment ?? [...seededEquipment],
    goals: { ...defaultGoals, ...(overrides.goals || {}) },
    preferences: { ...defaultPreferences, ...(overrides.preferences || {}) },
    todayCheckIn: null,
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
    ...overrides,
  };
  vi.spyOn(useAthloniqStateModule, "useAthloniqState").mockReturnValue(mockState as any);
  return mockState;
}

describe("ProfileView & Split Components (UI-8E)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("does not arm UnsavedWorkContext when /profile opens untouched, arms on edit, and clears when reverted", async () => {
    setupStateMock();

    const cleanView = render(
      <MemoryRouter initialEntries={["/profile"]}>
        <UnsavedWorkProvider>
          <GuardedNavLink to="/today">Go Clean</GuardedNavLink>
          <Routes>
            <Route path="/profile" element={<ProfileView />} />
            <Route path="/today" element={<div>Arrived Clean</div>} />
          </Routes>
        </UnsavedWorkProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Go Clean"));
    expect(screen.queryByText(/Unsaved Work in Progress/i)).not.toBeInTheDocument();
    expect(screen.getByText("Arrived Clean")).toBeInTheDocument();
    cleanView.unmount();

    // Edit Weight to arm guard, block navigation, then revert back to empty baseline to clear
    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <UnsavedWorkProvider>
          <GuardedNavLink to="/today">Back to Today</GuardedNavLink>
          <Routes>
            <Route path="/profile" element={<ProfileView />} />
            <Route path="/today" element={<div data-testid="today-destination">Today Route</div>} />
          </Routes>
        </UnsavedWorkProvider>
      </MemoryRouter>
    );

    const weightInput = screen.getByLabelText(/Weight \(kg\)/i);
    fireEvent.change(weightInput, { target: { value: "68" } });

    fireEvent.click(screen.getByText("Back to Today"));
    expect(await screen.findByText(/Unsaved Work in Progress/i)).toBeInTheDocument();
    expect(screen.getByText(/Profile Setup Form/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Stay & Keep Editing"));
    expect(screen.queryByTestId("today-destination")).not.toBeInTheDocument();

    // Revert back to empty baseline -> leaving works immediately
    fireEvent.change(weightInput, { target: { value: "" } });
    fireEvent.click(screen.getByText("Back to Today"));
    await waitFor(() => {
      expect(screen.getByTestId("today-destination")).toBeInTheDocument();
    });
  });

  it("keeps form clean across async cloud hydration and clears dirty guard upon form submission", async () => {
    const completeOnboarding = vi.fn();
    const updatePreferences = vi.fn();
    const updateGoals = vi.fn();

    const HydratingHarness = () => {
      const [hydrated, setHydrated] = useState(false);
      vi.spyOn(useAthloniqStateModule, "useAthloniqState").mockReturnValue({
        profile: hydrated
          ? {
              ...incompleteDefaultProfile,
              age: 24,
              heightCm: 178,
              weightKg: 72,
              sex: "male",
              onboardingStep: 5,
            }
          : incompleteDefaultProfile,
        equipment: seededEquipment,
        goals: defaultGoals,
        preferences: defaultPreferences,
        foodEntries: [],
        workoutSessions: [],
        activitySessions: [],
        bodyMetrics: [],
        coachMessages: [],
        progressPhotos: [],
        updateProfile: vi.fn(),
        updateEquipmentItem: vi.fn(),
        confirmEquipment: vi.fn(),
        updateGoals,
        updatePreferences,
        completeOnboarding,
        resetToDefaults: vi.fn(),
      } as any);

      return (
        <div>
          <button type="button" onClick={() => setHydrated(true)}>
            Simulate Hydration
          </button>
          <GuardedNavLink to="/today">Leave Profile</GuardedNavLink>
          <Routes>
            <Route path="/profile" element={<ProfileView />} />
            <Route path="/today" element={<div>Left Cleanly</div>} />
          </Routes>
        </div>
      );
    };

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <UnsavedWorkProvider>
          <HydratingHarness />
        </UnsavedWorkProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Simulate Hydration"));
    fireEvent.click(screen.getByText("Leave Profile"));
    expect(screen.queryByText(/Unsaved Work in Progress/i)).not.toBeInTheDocument();
    expect(screen.getByText("Left Cleanly")).toBeInTheDocument();
  });

  it("provides aria-current='step', min-h-[44px] targets, <label htmlFor> links, and tabular-nums", () => {
    setupStateMock({
      profile: {
        ...incompleteDefaultProfile,
        age: 26,
        heightCm: 175,
        weightKg: 70,
        onboardingCompleted: false,
      },
    });

    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <UnsavedWorkProvider>
          <ProfileView />
        </UnsavedWorkProvider>
      </MemoryRouter>
    );

    // Step 1 active indicator & 44px touch targets
    const step1Btn = screen.getByRole("button", { name: /STEP 01/i });
    const step2Btn = screen.getByRole("button", { name: /STEP 02/i });
    const step4Btn = screen.getByRole("button", { name: /STEP 04/i });
    const step5Btn = screen.getByRole("button", { name: /STEP 05/i });
    expect(step1Btn).toHaveAttribute("aria-current", "step");
    expect(step2Btn).not.toHaveAttribute("aria-current");
    expect(step1Btn.className).toContain("min-h-[44px]");

    // Step 1 visible label associations & tabular-nums
    expect(screen.getByLabelText(/Age \(Years\)/i)).toHaveAttribute("id", "profile-age");
    expect(screen.getByLabelText(/Biological Sex/i)).toHaveAttribute("id", "profile-sex");
    expect(screen.getByLabelText(/Waist Circumference/i)).toHaveAttribute("id", "profile-waist");
    const bmiText = screen.getByText(/Calculated BMI:/i);
    expect(bmiText.className).toContain("tabular-nums");

    // Step 2 labels
    fireEvent.click(step2Btn);
    expect(step2Btn).toHaveAttribute("aria-current", "step");
    expect(screen.getByLabelText(/Primary Physique & Performance Goal/i)).toHaveAttribute(
      "id",
      "profile-primary-goal"
    );
    expect(screen.getByLabelText(/Dietary Pattern/i)).toHaveAttribute(
      "id",
      "profile-dietary-pattern"
    );
    expect(screen.getByLabelText(/Daily Protein Target \(g\)/i)).toHaveAttribute(
      "id",
      "profile-custom-protein"
    );

    // Step 4 labels
    fireEvent.click(step4Btn);
    expect(step4Btn).toHaveAttribute("aria-current", "step");
    expect(screen.getByLabelText(/Weekly Training Days/i)).toHaveAttribute(
      "id",
      "profile-training-days"
    );
    expect(screen.getByLabelText(/Typical Sleep Baseline/i)).toHaveAttribute(
      "id",
      "profile-sleep-baseline"
    );

    // Step 5 labels & dynamic goal
    fireEvent.click(step5Btn);
    expect(step5Btn).toHaveAttribute("aria-current", "step");
    expect(screen.getByLabelText(/IANA Timezone/i)).toHaveAttribute("id", "profile-timezone");
    const activateBtn = screen.getByRole("button", { name: /Activate Personalized Athlete Plan/i });
    expect(activateBtn.className).toContain("min-h-[48px]");
  });

  it("renders Summary view with deterministic BMI and null-safe targets (zero hardcoded BMI 18.4 or purple)", () => {
    setupStateMock({
      profile: {
        ...incompleteDefaultProfile,
        fullName: "Avery Stone",
        age: 26,
        heightCm: 180,
        weightKg: 72,
        trainingDaysPerWeek: 4,
        onboardingCompleted: true,
        equipmentConfirmed: true,
      },
      goals: {
        ...defaultGoals,
        calorieTargetKcal: null,
        calorieProvenance: "awaiting_onboarding",
        proteinTargetG: null,
        carbsTargetG: null,
        fatTargetG: null,
        waterTargetMl: null,
      },
    });

    const { container } = render(
      <MemoryRouter initialEntries={["/profile"]}>
        <UnsavedWorkProvider>
          <ProfileView />
        </UnsavedWorkProvider>
      </MemoryRouter>
    );

    // Deterministic BMI 72 / (1.8^2) = 22.2 (not hardcoded 18.4)
    expect(screen.getByText(/BMI 22\.2/i)).toBeInTheDocument();
    expect(screen.queryByText(/BMI 18\.4/i)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Not set/i).length).toBeGreaterThanOrEqual(3);
    expect(container.innerHTML).not.toMatch(/purple-|violet-|cyan-|sky-/);
  });

  it("supports Step 3 equipment limits with Not set display, label bindings, and confirmation without fabrication", () => {
    const mockState = setupStateMock();

    render(
      <MemoryRouter initialEntries={["/profile?step=equipment"]}>
        <UnsavedWorkProvider>
          <ProfileView />
        </UnsavedWorkProvider>
      </MemoryRouter>
    );

    const step3Btn = screen.getByRole("button", { name: /STEP 03/i });
    expect(step3Btn).toHaveAttribute("aria-current", "step");
    expect(screen.getByText(/Max Load: Not set • Min Increment: Not set/i)).toBeInTheDocument();
    expect(screen.getByText(/Max Load: 70 kg • Min Increment: Not set/i)).toBeInTheDocument();

    const setLimitBtns = screen.getAllByRole("button", { name: /Set Limits/i });
    expect(setLimitBtns[0].className).toContain("min-h-[44px]");
    fireEvent.click(setLimitBtns[0]);
    expect(screen.getByLabelText(/Max Load \(kg\)/i)).toHaveAttribute("id", "equip-max-eq-1");
    expect(screen.getByLabelText(/Min Increment \(kg\)/i)).toHaveAttribute("id", "equip-inc-eq-1");

    const confirmAllBtn = screen.getByRole("button", { name: /Confirm All Home Gym Equipment/i });
    expect(confirmAllBtn.className).toContain("min-h-[44px]");
    fireEvent.click(confirmAllBtn);
    expect(mockState.confirmEquipment).toHaveBeenCalledTimes(1);
    const confirmed = mockState.confirmEquipment.mock.calls[0][0] as EquipmentItem[];
    expect(confirmed[0].minIncrementKg).toBeNull();
  });

  it("source audit: features/profile files contain zero [#hex], default lime-*, purple, violet, or cyan classes", () => {
    const rawFiles = import.meta.glob<string>("../features/profile/**/*.{ts,tsx}", {
      query: "?raw",
      import: "default",
      eager: true,
    });

    expect(Object.keys(rawFiles).length).toBeGreaterThanOrEqual(8);
    for (const [filePath, content] of Object.entries(rawFiles)) {
      expect(content.match(/\[#[0-9a-fA-F]{3,8}\]/g), `Found [#hex] in ${filePath}`).toBeNull();
      expect(content.match(/\blime-\d+\b/g), `Found default lime-* in ${filePath}`).toBeNull();
      expect(
        content.match(/\b(purple|violet|cyan)-\d{2,3}\b/g),
        `Found off-brand color in ${filePath}`
      ).toBeNull();
    }
  });
});
