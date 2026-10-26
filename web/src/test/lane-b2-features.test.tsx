import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RecoveryView } from "@/features/recovery/RecoveryView";
import { ProfileView } from "@/features/profile/ProfileView";
import { MemoryRouter } from "react-router-dom";
import { UnsavedWorkProvider } from "@/features/navigation/UnsavedWorkContext";

// Mock useAthloniqState for RecoveryView and ProfileView
const mockSubmitCheckIn = vi.fn();
const mockCompleteOnboarding = vi.fn();
const mockUpdateProfile = vi.fn();

const mockProfile = {
  id: "test-user-id",
  email: "test@domain.com",
  fullName: "Test Athlete",
  age: 20,
  heightCm: 173.0,
  weightKg: 55.0,
  dietaryPattern: "nonvegetarian",
  primaryGoal: "lean_bulk",
  trainingScope: ["gym"],
  trainingDaysPerWeek: 5,
  trainingEnvironment: "home_gym",
  calorieTrackingHabit: "rough_estimates",
  sex: null,
  waistCm: null,
  experienceLevel: null,
  currentSplit: null,
  weeklyBadmintonSessions: 2,
  weeklyRunningSessions: 1,
  sleepBaselineHours: 7.5,
  exerciseLimitations: null,
  onboardingStep: 1,
  onboardingCompleted: false, // Fresh user awaiting onboarding
  equipmentConfirmed: false,
};

const mockTodayCheckIn = {
  date: "2026-10-26",
  sleepHours: 7.5,
  sleepQuality: 4,
  soreness: 2,
  fatigue: 2,
  stress: null, // Stress initially null in DB/state
};

const mockReadiness = {
  readinessScore: 80,
  status: "Prime" as const,
  guidance: "Readiness is optimal.",
  triggers: ["Adequate sleep duration (7.5h): +5"],
  provenance: "calculated_estimate" as const,
};

vi.mock("@/hooks/useAthloniqState", () => ({
  useAthloniqState: () => ({
    profile: mockProfile,
    equipment: [],
    goals: { proteinMinG: 88, proteinMaxG: 121, proteinTargetG: 110 },
    preferences: { weightUnit: "kg", distanceUnit: "km" },
    todayCheckIn: mockTodayCheckIn,
    readiness: mockReadiness,
    submitCheckIn: mockSubmitCheckIn,
    completeOnboarding: mockCompleteOnboarding,
    updateProfile: mockUpdateProfile,
    foodEntries: [],
    workoutSessions: [],
    activitySessions: [],
    bodyMetrics: [],
    coachMessages: [],
    progressPhotos: [],
    updateEquipmentItem: vi.fn(),
    confirmEquipment: vi.fn(),
  }),
}));

describe("RecoveryView Stress Slider & Null State", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes stress state to null, displays 'Not set', and submits stress: null when untouched", () => {
    render(<RecoveryView />);

    // Check "Not set" badge is visible
    expect(screen.getByText("Not set")).toBeInTheDocument();

    // Check "Clear" button is not visible initially
    expect(screen.queryByRole("button", { name: /^Clear$/i })).not.toBeInTheDocument();

    // Submit check-in without touching slider
    const submitBtn = screen.getByRole("button", { name: /Submit Today's Check-in/i });
    fireEvent.click(submitBtn);

    expect(mockSubmitCheckIn).toHaveBeenCalledWith(
      expect.objectContaining({
        stress: null,
      })
    );
  });

  it("sends stress value when user touches slider and supports clearing back to 'Not set'", async () => {
    render(<RecoveryView />);

    const slider = screen.getByLabelText(/External Life \/ Mental Stress/i);
    expect(slider).toBeInTheDocument();

    // User touches slider and moves to 4
    fireEvent.change(slider, { target: { value: "4" } });

    // "Not set" should be gone, "Level 4 / 5" and "Clear" button visible
    expect(screen.queryByText("Not set")).not.toBeInTheDocument();
    expect(screen.getByText("Level 4 / 5")).toBeInTheDocument();
    const clearBtn = screen.getByRole("button", { name: /^Clear$/i });
    expect(clearBtn).toBeInTheDocument();

    // Submit check-in with touched slider
    const submitBtn = screen.getByRole("button", { name: /Submit Today's Check-in/i });
    fireEvent.click(submitBtn);

    expect(mockSubmitCheckIn).toHaveBeenCalledWith(
      expect.objectContaining({
        stress: 4,
      })
    );

    // Now click clear control
    fireEvent.click(clearBtn);

    // Stress should reset to "Not set"
    expect(screen.getByText("Not set")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Clear$/i })).not.toBeInTheDocument();

    // Re-submit, stress should now be null again
    fireEvent.click(submitBtn);
    expect(mockSubmitCheckIn).toHaveBeenLastCalledWith(
      expect.objectContaining({
        stress: null,
      })
    );
  });
});

describe("ProfileView Live BMI Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows 'Enter height and weight' when height or weight is empty, never a BMI from seed values", async () => {
    render(
      <MemoryRouter>
        <UnsavedWorkProvider>
          <ProfileView />
        </UnsavedWorkProvider>
      </MemoryRouter>
    );

    // Initial state for fresh profile without completed onboarding:
    // height and weight inputs are empty/undefined, so live BMI shows "Enter height and weight"
    expect(screen.getByText("Enter height and weight")).toBeInTheDocument();
    expect(screen.queryByText(/Calculated BMI:/i)).not.toBeInTheDocument();
  });

  it("calculates live BMI when valid height and weight are entered, and reverts to 'Enter height and weight' if cleared", async () => {
    render(
      <MemoryRouter>
        <UnsavedWorkProvider>
          <ProfileView />
        </UnsavedWorkProvider>
      </MemoryRouter>
    );

    const heightInput = screen.getByLabelText(/Height \(cm\)/i);
    const weightInput = screen.getByLabelText(/Weight \(kg\)/i);

    // Enter valid biometrics: 180 cm, 72 kg -> BMI = 72 / (1.8^2) = 22.2 kg/m²
    fireEvent.change(heightInput, { target: { value: "180" } });
    fireEvent.change(weightInput, { target: { value: "72" } });

    await waitFor(() => {
      expect(screen.getByText(/Calculated BMI: 22\.2 kg\/m²/i)).toBeInTheDocument();
      expect(screen.queryByText("Enter height and weight")).not.toBeInTheDocument();
    });

    // Clear weight input -> should revert to "Enter height and weight"
    fireEvent.change(weightInput, { target: { value: "" } });

    await waitFor(() => {
      expect(screen.getByText("Enter height and weight")).toBeInTheDocument();
      expect(screen.queryByText(/Calculated BMI:/i)).not.toBeInTheDocument();
    });
  });
});
