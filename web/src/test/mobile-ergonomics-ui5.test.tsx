import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { UnsavedWorkProvider } from "@/features/navigation/UnsavedWorkContext";

import { NutritionView } from "@/features/nutrition/NutritionView";
import { WorkoutsView } from "@/features/workouts/WorkoutsView";
import { ActivitiesView } from "@/features/activities/ActivitiesView";
import { RecoveryView } from "@/features/recovery/RecoveryView";
import { ProgressView } from "@/features/progress/ProgressView";
import { CoachView } from "@/features/coach/CoachView";

// Mocks for external services
vi.mock("@/services/api", () => ({
  sendCoachChatTurn: vi.fn(),
  fetchWeeklyReview: vi.fn(),
  analyzeMealPhoto: vi.fn(),
  checkBackendHealth: vi.fn().mockResolvedValue({ status: "healthy" }),
}));

vi.mock("@/features/pwa/usePwa", () => ({
  usePwa: () => ({ isOnline: true }),
}));

// Default Mock State
const mockProfile = {
  id: "test-athlete-uuid",
  fullName: "Avery Stone",
  email: "avery@domain.com",
  age: 26,
  heightCm: 175.0,
  weightKg: 70.0,
  dietaryPattern: "omnivore",
  primaryGoal: "lean_bulk",
  trainingScope: ["push", "pull", "legs"],
  trainingDaysPerWeek: 4,
  trainingEnvironment: "home_gym",
  calorieTrackingHabit: "strict_weighing",
  sex: "male" as const,
  waistCm: null,
  experienceLevel: "intermediate",
  currentSplit: "upper_lower",
  weeklyBadmintonSessions: 1,
  weeklyRunningSessions: 2,
  sleepBaselineHours: 8.0,
  exerciseLimitations: null,
  onboardingStep: 4,
  onboardingCompleted: true,
  equipmentConfirmed: false,
};

const mockNullGoals = {
  calorieTargetKcal: null,
  calorieProvenance: "provisional_default" as const,
  proteinTargetG: null,
  proteinMinG: null,
  proteinMaxG: null,
  proteinProvenance: "provisional_default" as const,
};

let currentGoals = mockNullGoals;
let currentEquipment: any[] = [];
let currentWorkoutSessions: any[] = [];
let currentActivitySessions: any[] = [];
let currentBodyMetrics: any[] = [];
let currentProgressPhotos: any[] = [];
let currentFoodEntries: any[] = [];
let currentTodayCheckIn: any = null;
let currentReadiness: any = null;

const mockSubmitCheckIn = vi.fn();
const mockSaveWorkoutSession = vi.fn();
const mockAddActivitySession = vi.fn();
const mockAddBodyMetric = vi.fn();
const mockAddProgressPhoto = vi.fn();
const mockAddFoodEntry = vi.fn();
const mockDeleteFoodEntry = vi.fn();
const mockDeleteWorkoutSession = vi.fn();
const mockDeleteActivitySession = vi.fn();
const mockDeleteProgressPhoto = vi.fn();
const mockUpdateGoals = vi.fn();
const mockUpdatePreferences = vi.fn();

vi.mock("@/hooks/useAthloniqState", () => ({
  useAthloniqState: () => ({
    profile: mockProfile,
    goals: currentGoals,
    equipment: currentEquipment,
    workoutSessions: currentWorkoutSessions,
    activitySessions: currentActivitySessions,
    bodyMetrics: currentBodyMetrics,
    progressPhotos: currentProgressPhotos,
    foodEntries: currentFoodEntries,
    todayCheckIn: currentTodayCheckIn,
    hasTodayCheckIn: Boolean(currentTodayCheckIn),
    readiness: currentReadiness,
    preferences: { notificationsEnabled: true, quietHoursStart: "22:00", quietHoursEnd: "07:00" },
    submitCheckIn: mockSubmitCheckIn,
    saveWorkoutSession: mockSaveWorkoutSession,
    deleteWorkoutSession: mockDeleteWorkoutSession,
    addActivitySession: mockAddActivitySession,
    deleteActivitySession: mockDeleteActivitySession,
    addBodyMetric: mockAddBodyMetric,
    addProgressPhoto: mockAddProgressPhoto,
    deleteProgressPhoto: mockDeleteProgressPhoto,
    addFoodEntry: mockAddFoodEntry,
    deleteFoodEntry: mockDeleteFoodEntry,
    updateGoals: mockUpdateGoals,
    updatePreferences: mockUpdatePreferences,
    getWeeklyActivities: () => currentActivitySessions,
    getFoodEntriesForDate: () => currentFoodEntries,
    coachMessages: [],
    addCoachMessage: vi.fn(),
    clearCoachMessages: vi.fn(),
    applyProposedAction: vi.fn(),
    dismissProposedAction: vi.fn(),
    getCoachingSnapshot: () => ({
      profile: mockProfile,
      food_entries: currentFoodEntries,
      workout_sessions: currentWorkoutSessions,
      activity_sessions: currentActivitySessions,
      body_metrics: currentBodyMetrics,
    }),
  }),
}));

describe("UI-5: 390px Ergonomics & Truth in UI Regression Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentGoals = mockNullGoals;
    currentEquipment = [];
    currentWorkoutSessions = [];
    currentActivitySessions = [];
    currentBodyMetrics = [];
    currentProgressPhotos = [];
    currentFoodEntries = [];
    currentTodayCheckIn = null;
    currentReadiness = null;
  });

  // =========================================================================
  // 1. NutritionView Ergonomics & Null States
  // =========================================================================
  describe("NutritionView", () => {
    it("enforces 44px ergonomics on primary action buttons and meal slot triggers", () => {
      render(
        <MemoryRouter>
          <UnsavedWorkProvider>
            <NutritionView />
          </UnsavedWorkProvider>
        </MemoryRouter>
      );

      // Open Add Meal panel
      const logMealButton = screen.getByRole("button", { name: /Log Meal/i });
      expect(logMealButton.className).toMatch(/min-h-\[44px\]/);
      fireEvent.click(logMealButton);

      // Meal slot selector buttons have min-h-[44px]
      const breakfastTrigger = screen.getByRole("button", { name: /^Breakfast$/i });
      expect(breakfastTrigger.className).toMatch(/min-h-\[44px\]/);

      const dinnerTrigger = screen.getByRole("button", { name: /^Dinner$/i });
      expect(dinnerTrigger.className).toMatch(/min-h-\[44px\]/);

      // Add to Slot button has min-h-[44px]
      const addToSlotButton = screen.getByRole("button", { name: /Add to Breakfast/i });
      expect(addToSlotButton.className).toMatch(/min-h-\[44px\]/);

      // Custom food trigger has min-h-[44px]
      const customFoodTrigger = screen.getByRole("button", { name: /Create Custom Food/i });
      expect(customFoodTrigger.className).toMatch(/min-h-\[44px\]/);
    });

    it("includes tabular-nums on macro and calorie displays", () => {
      render(
        <MemoryRouter>
          <UnsavedWorkProvider>
            <NutritionView />
          </UnsavedWorkProvider>
        </MemoryRouter>
      );

      const calorieReadout = screen.getByText(/0 kcal logged/i);
      expect(calorieReadout.className).toMatch(/tabular-nums/);
    });

    it("renders explicit 'Calorie target not set — finish onboarding' when uncalibrated (no fake defaults)", () => {
      currentGoals = mockNullGoals;
      render(
        <MemoryRouter>
          <UnsavedWorkProvider>
            <NutritionView />
          </UnsavedWorkProvider>
        </MemoryRouter>
      );

      expect(screen.getByText(/Calorie target not set — finish onboarding/i)).toBeInTheDocument();
      // Ensure zero fabricated default calories (e.g. no 2000 or 2500)
      expect(screen.queryByText(/2000 kcal/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/2500 kcal/i)).not.toBeInTheDocument();
    });

    it("renders explicit empty slot messages when no entries logged", () => {
      render(
        <MemoryRouter>
          <UnsavedWorkProvider>
            <NutritionView />
          </UnsavedWorkProvider>
        </MemoryRouter>
      );

      expect(screen.getByText(/No entries logged for Breakfast/i)).toBeInTheDocument();
      expect(screen.getByText(/No entries logged for Lunch/i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 2. WorkoutsView Ergonomics & Null States
  // =========================================================================
  describe("WorkoutsView", () => {
    it("enforces 44px ergonomics on tab triggers and workout actions", () => {
      render(
        <MemoryRouter>
          <WorkoutsView />
        </MemoryRouter>
      );

      // Tab triggers
      const templatesTab = screen.getByRole("button", { name: /^Templates$/i });
      const activeTab = screen.getByRole("button", { name: /^Active Session$/i });
      const historyTab = screen.getByRole("button", { name: /^History$/i });

      expect(templatesTab.className).toMatch(/min-h-\[44px\]/);
      expect(activeTab.className).toMatch(/min-h-\[44px\]/);
      expect(historyTab.className).toMatch(/min-h-\[44px\]/);

      // Start This Template button
      const startButtons = screen.getAllByRole("button", { name: /Start This Template/i });
      expect(startButtons[0].className).toMatch(/min-h-\[44px\]/);
    });

    it("includes tabular-nums on workout template target sets/reps", () => {
      render(
        <MemoryRouter>
          <WorkoutsView />
        </MemoryRouter>
      );

      const targetReps = screen.getAllByText(/3×8–12|4×6–8/);
      expect(targetReps.length).toBeGreaterThan(0);
      expect(targetReps[0].className).toMatch(/tabular-nums/);
    });

    it("renders unconfirmed equipment notice and empty history state without fabricating numbers", () => {
      render(
        <MemoryRouter>
          <WorkoutsView />
        </MemoryRouter>
      );

      // Equipment warning banner
      expect(
        screen.getByText(/Equipment confirmation required for load progressions/i)
      ).toBeInTheDocument();

      // Switch to History tab
      const historyTab = screen.getByRole("button", { name: /^History$/i });
      fireEvent.click(historyTab);

      expect(
        screen.getByText(/No sessions logged yet. Start your first workout!/i)
      ).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 3. ActivitiesView Ergonomics & Null States
  // =========================================================================
  describe("ActivitiesView", () => {
    it("enforces 44px touch targets on sport mode selectors and action buttons", () => {
      render(
        <MemoryRouter>
          <ActivitiesView />
        </MemoryRouter>
      );

      // Header Log Activity button
      const logButton = screen.getByRole("button", { name: /Log Activity/i });
      expect(logButton.className).toMatch(/min-h-\[44px\]/);
      fireEvent.click(logButton);

      // Sport Mode buttons
      const runMode = screen.getByRole("button", { name: /^Running$/i });
      const badmintonMode = screen.getByRole("button", { name: /^Badminton$/i });
      const calisthenicsMode = screen.getByRole("button", { name: /^Calisthenics$/i });

      expect(runMode.className).toMatch(/min-h-\[44px\]/);
      expect(badmintonMode.className).toMatch(/min-h-\[44px\]/);
      expect(calisthenicsMode.className).toMatch(/min-h-\[44px\]/);

      // Submit Log button
      const submitLog = screen.getByRole("button", { name: /Log Running/i });
      expect(submitLog.className).toMatch(/min-h-\[44px\]/);
    });

    it("includes tabular-nums on activity counts and pace readouts", () => {
      render(
        <MemoryRouter>
          <ActivitiesView />
        </MemoryRouter>
      );

      const countDisplays = screen.getAllByText("0");
      expect(countDisplays.length).toBeGreaterThanOrEqual(1);
      expect(countDisplays[0].className).toMatch(/tabular-nums/);
    });

    it("renders empty history feed cleanly when no activities are logged", () => {
      render(
        <MemoryRouter>
          <ActivitiesView />
        </MemoryRouter>
      );

      expect(screen.getByText(/No activities logged yet\./i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 4. RecoveryView Ergonomics & Null States
  // =========================================================================
  describe("RecoveryView", () => {
    it("enforces 44px ergonomics on submit button and displays 'Not set' without check-in", () => {
      currentTodayCheckIn = null;
      render(<RecoveryView />);

      // Submit button has min-h-[48px] (size lg >= 44px)
      const submitBtn = screen.getByRole("button", { name: /Submit Today's Check-in/i });
      expect(submitBtn.className).toMatch(/min-h-\[48px\]/);

      // Stat cards display "Not set"
      const notSetElements = screen.getAllByText("Not set");
      expect(notSetElements.length).toBeGreaterThanOrEqual(2);

      // Stress slider starts at "Not set" and submits stress: null
      expect(screen.queryByRole("button", { name: /^Clear$/i })).not.toBeInTheDocument();
      fireEvent.click(submitBtn);

      expect(mockSubmitCheckIn).toHaveBeenCalledWith(
        expect.objectContaining({
          stress: null,
        })
      );
    });

    it("renders 'No triggers evaluated yet.' when check-in is unlogged", () => {
      currentTodayCheckIn = null;
      render(<RecoveryView />);

      expect(screen.getByText(/No triggers evaluated yet\./i)).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 5. ProgressView Ergonomics & Null States
  // =========================================================================
  describe("ProgressView", () => {
    it("enforces 44px touch targets on primary header buttons and form triggers", () => {
      render(
        <MemoryRouter>
          <ProgressView />
        </MemoryRouter>
      );

      const demoBtn = screen.getByRole("button", { name: /Load 14d Demo Fixture/i });
      const addPhotoBtn = screen.getByRole("button", { name: /Add Photo/i });
      const logWeightBtn = screen.getByRole("button", { name: /Log Weigh-In/i });

      expect(demoBtn.className).toMatch(/min-h-\[44px\]/);
      expect(addPhotoBtn.className).toMatch(/min-h-\[44px\]/);
      expect(logWeightBtn.className).toMatch(/min-h-\[44px\]/);

      // Open weigh-in drawer
      fireEvent.click(logWeightBtn);
      const saveWeightBtn = screen.getByRole("button", { name: /Save Weigh-In/i });
      const cancelBtn = screen.getByRole("button", { name: /^Cancel$/i });

      expect(saveWeightBtn.className).toMatch(/min-h-\[44px\]/);
      expect(cancelBtn.className).toMatch(/min-h-\[44px\]/);
    });

    it("includes tabular-nums on weight trend readouts and volume totals", () => {
      render(
        <MemoryRouter>
          <ProgressView />
        </MemoryRouter>
      );

      const weightStat = screen.getByText("70.0 kg");
      expect(weightStat.className).toMatch(/tabular-nums/);
    });

    it("displays '0/3 WEIGH-INS' and 'Insufficient Data' without fabricating trend", () => {
      currentBodyMetrics = [];
      render(
        <MemoryRouter>
          <ProgressView />
        </MemoryRouter>
      );

      expect(screen.getAllByText(/0\/3 weigh-ins/i).length).toBeGreaterThanOrEqual(1);
      expect(
        screen.getByText(/Insufficient Data — Minimum 3 Weigh-Ins Required/i)
      ).toBeInTheDocument();
    });
  });

  // =========================================================================
  // 6. CoachView Ergonomics & Tab Navigation
  // =========================================================================
  describe("CoachView", () => {
    it("enforces 44px ergonomics on sub-tab navigation triggers and prompt chips", () => {
      render(
        <MemoryRouter>
          <CoachView />
        </MemoryRouter>
      );

      // Sub-tab buttons
      const chatTab = screen.getByRole("button", { name: /AI Coach Chat/i });
      const reviewTab = screen.getByRole("button", { name: /Weekly Review & Priorities/i });

      expect(chatTab.className).toMatch(/min-h-\[44px\]/);
      expect(reviewTab.className).toMatch(/min-h-\[44px\]/);

      // Quick prompt buttons
      const quickPrompts = screen.getAllByRole("button", { name: /training progressed|protein yesterday|what should I train|Which exercises|nutrition been this week/i });
      expect(quickPrompts.length).toBeGreaterThan(0);
      expect(quickPrompts[0].className).toMatch(/min-h-\[44px\]/);
    });

    it("enforces 44px touch ergonomics on Regenerate Review button in review tab", async () => {
      render(
        <MemoryRouter>
          <CoachView />
        </MemoryRouter>
      );

      const reviewTab = screen.getByRole("button", { name: /Weekly Review & Priorities/i });
      fireEvent.click(reviewTab);

      const regenButton = await screen.findByRole("button", { name: /Regenerate Review/i });
      expect(regenButton.className).toMatch(/min-h-\[44px\]/);
    });
  });
});
