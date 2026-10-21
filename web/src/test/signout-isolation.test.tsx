import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AthloniqProvider, useAthloniqState } from "@/hooks/useAthloniqState";
import * as AuthContextModule from "@/features/auth/AuthContext";
import {
  profilesRepo,
  foodEntriesRepo,
  workoutSessionsRepo,
  recoveryRepo,
  bodyMetricsRepo,
  coachRepo,
} from "@/services/repo";
import { queryClient } from "@/lib/queryClient";
import { UserProfile, FoodEntry, WorkoutSession, RecoveryCheckIn } from "@/types";

// User A test fixtures
const USER_A_ID = "00000000-0000-4000-a000-000000000001";
const userAProfile: UserProfile = {
  id: USER_A_ID,
  email: "athlete.a@athloniq.io",
  fullName: "Athlete Alpha",
  age: 24,
  heightCm: 180,
  weightKg: 78.5,
  dietaryPattern: "nonvegetarian",
  primaryGoal: "hypertrophy",
  trainingScope: ["gym"],
  trainingDaysPerWeek: 5,
  trainingEnvironment: "home_gym",
  calorieTrackingHabit: "weighing_foods",
  sex: "male",
  waistCm: 80,
  experienceLevel: "intermediate",
  currentSplit: "upper_lower",
  weeklyBadmintonSessions: null,
  weeklyRunningSessions: null,
  sleepBaselineHours: 8,
  exerciseLimitations: null,
  onboardingStep: 5,
  onboardingCompleted: true,
  equipmentConfirmed: true,
};

const userAFood: FoodEntry = {
  id: "food-a-1",
  mealSlot: "breakfast",
  foodName: "Alpha Oats & Whey",
  servingLabel: "1 bowl",
  caloriesKcal: 450,
  proteinG: 35,
  carbsG: 60,
  fatG: 8,
  provenance: "manual_entry",
  loggedDate: "2026-10-21",
  quantity: 1,
  isConfirmed: true,
};

const userAWorkout: WorkoutSession = {
  id: "workout-a-1",
  loggedDate: "2026-10-21",
  title: "Alpha Heavy Bench Session",
  durationMinutes: 65,
  sessionRpe: 9,
  completed: true,
  sets: [],
};

const userARecovery: RecoveryCheckIn = {
  date: "2026-10-21",
  sleepHours: 8.5,
  sleepQuality: 5,
  soreness: 2,
  fatigue: 1,
  stress: 1,
  notes: "Alpha peak recovery notes",
};

// User B test fixtures (Clean / fresh athlete)
const USER_B_ID = "00000000-0000-4000-b000-000000000002";
const userBProfile: UserProfile = {
  id: USER_B_ID,
  email: "athlete.b@athloniq.io",
  fullName: "Athlete Bravo",
  age: 20,
  heightCm: 173,
  weightKg: 55.0,
  dietaryPattern: "nonvegetarian",
  primaryGoal: "lean_bulk",
  trainingScope: ["gym", "calisthenics", "badminton", "running"],
  trainingDaysPerWeek: 5,
  trainingEnvironment: "home_gym",
  calorieTrackingHabit: "rough_estimates",
  sex: null,
  waistCm: null,
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

// Test Inspector component rendering athlete state
const AthleteStateInspector: React.FC = () => {
  const { user, signOut } = AuthContextModule.useAuth();
  const state = useAthloniqState();

  return (
    <div>
      <div data-testid="current-user-id">{user?.id || "NO_USER"}</div>
      <div data-testid="athlete-full-name">{state.profile.fullName}</div>
      <div data-testid="athlete-weight">{state.profile.weightKg}</div>
      <div data-testid="food-entries-count">{state.foodEntries.length}</div>
      <div data-testid="food-entries-names">
        {state.foodEntries.map((f) => f.foodName).join(", ")}
      </div>
      <div data-testid="workout-sessions-count">{state.workoutSessions.length}</div>
      <div data-testid="workout-sessions-titles">
        {state.workoutSessions.map((w) => w.title).join(", ")}
      </div>
      <div data-testid="recovery-notes">{state.todayCheckIn.notes || ""}</div>
      <div data-testid="recovery-readiness">{state.readiness.readinessScore}</div>
      <button data-testid="sign-out-btn" onClick={() => signOut()}>
        Sign Out
      </button>
    </div>
  );
};

describe("Sign-Out and Cross-Athlete State Isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it("resets all in-memory athlete state on sign out and prevents leakage when signing in as User B", async () => {
    // Repository dispatch mocks based on requested userId
    vi.spyOn(profilesRepo, "fetchProfile").mockImplementation(async (uid: string) => {
      if (uid === USER_A_ID) return userAProfile;
      if (uid === USER_B_ID) return userBProfile;
      return null;
    });

    vi.spyOn(foodEntriesRepo, "fetchEntries").mockImplementation(async (uid: string) => {
      if (uid === USER_A_ID) return [userAFood];
      return []; // User B has no food entries yet
    });

    vi.spyOn(workoutSessionsRepo, "fetchSessions").mockImplementation(async (uid: string) => {
      if (uid === USER_A_ID) return [userAWorkout];
      return []; // User B has no workouts yet
    });

    vi.spyOn(recoveryRepo, "fetchHistory").mockImplementation(async (uid: string) => {
      if (uid === USER_A_ID) return [userARecovery];
      return []; // User B has no recovery check-in yet
    });

    vi.spyOn(bodyMetricsRepo, "fetchMetrics").mockImplementation(async () => []);
    vi.spyOn(coachRepo, "fetchMessages").mockImplementation(async () => []);

    // 1. Initial State: User A is logged in
    let currentAuthUser: any = {
      id: USER_A_ID,
      email: "athlete.a@athloniq.io",
    };

    const mockSignOut = vi.fn().mockImplementation(async () => {
      currentAuthUser = null;
      rerenderApp();
    });

    vi.spyOn(AuthContextModule, "useAuth").mockImplementation(() => ({
      user: currentAuthUser,
      session: currentAuthUser ? ({ user: currentAuthUser } as any) : null,
      loading: false,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: mockSignOut,
      resetPassword: vi.fn(),
      reAuthRequired: false,
      dismissReAuthPrompt: vi.fn(),
      authToast: null,
      clearAuthToast: vi.fn(),
    }));

    const { rerender } = render(
      <AthloniqProvider>
        <AthleteStateInspector />
      </AthloniqProvider>
    );

    const rerenderApp = () => {
      rerender(
        <AthloniqProvider>
          <AthleteStateInspector />
        </AthloniqProvider>
      );
    };

    // Wait for User A's cloud state to load
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    // Verify User A data is present
    expect(screen.getByTestId("current-user-id")).toHaveTextContent(USER_A_ID);
    expect(screen.getByTestId("athlete-full-name")).toHaveTextContent("Athlete Alpha");
    expect(screen.getByTestId("athlete-weight")).toHaveTextContent("78.5");
    expect(screen.getByTestId("food-entries-count")).toHaveTextContent("1");
    expect(screen.getByTestId("food-entries-names")).toHaveTextContent("Alpha Oats & Whey");
    expect(screen.getByTestId("workout-sessions-count")).toHaveTextContent("1");
    expect(screen.getByTestId("workout-sessions-titles")).toHaveTextContent("Alpha Heavy Bench Session");
    expect(screen.getByTestId("recovery-notes")).toHaveTextContent("Alpha peak recovery notes");

    // 2. User A Signs Out
    await act(async () => {
      currentAuthUser = null;
      rerenderApp();
      await new Promise((r) => setTimeout(r, 10));
    });

    // Verify state has been reset to defaults after sign out
    expect(screen.getByTestId("current-user-id")).toHaveTextContent("NO_USER");
    expect(screen.getByTestId("athlete-full-name")).toHaveTextContent(""); // Reset to DEFAULT_PROFILE
    expect(screen.getByTestId("food-entries-count")).toHaveTextContent("0"); // Reset to empty
    expect(screen.getByTestId("workout-sessions-count")).toHaveTextContent("0"); // Reset to empty
    expect(screen.getByTestId("recovery-notes")).toHaveTextContent(""); // Reset to empty notes

    // 3. User B Signs In
    await act(async () => {
      currentAuthUser = {
        id: USER_B_ID,
        email: "athlete.b@athloniq.io",
      };
      rerenderApp();
      await new Promise((r) => setTimeout(r, 10));
    });

    // 4. Assert User B only sees User B data and NONE of User A's data
    expect(screen.getByTestId("current-user-id")).toHaveTextContent(USER_B_ID);
    expect(screen.getByTestId("athlete-full-name")).toHaveTextContent("Athlete Bravo");
    expect(screen.getByTestId("athlete-weight")).toHaveTextContent("55");

    // CRITICAL: Ensure NONE of Athlete A's private data leaked into User B's session
    expect(screen.getByTestId("food-entries-count")).toHaveTextContent("0");
    expect(screen.getByTestId("food-entries-names")).not.toHaveTextContent("Alpha Oats & Whey");
    expect(screen.getByTestId("workout-sessions-count")).toHaveTextContent("0");
    expect(screen.getByTestId("workout-sessions-titles")).not.toHaveTextContent("Alpha Heavy Bench Session");
    expect(screen.getByTestId("recovery-notes")).not.toHaveTextContent("Alpha peak recovery notes");
  });
});
