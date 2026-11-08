import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardView } from "@/features/dashboard/DashboardView";
import * as useAthloniqStateModule from "@/hooks/useAthloniqState";

describe("UI-2: Today Dashboard Screen & Components (390px spec)", () => {
  const baseProfile = {
    fullName: "Alex Mercer",
    weightKg: 75,
    heightCm: 180,
    onboardingCompleted: true,
    equipmentConfirmed: true,
    trainingDaysPerWeek: 4,
    trainingScope: ["push", "pull", "legs"],
  };

  const baseGoals = {
    calorieTargetKcal: 2500,
    calorieProvenance: "user_confirmed" as const,
    proteinTargetG: 150,
    proteinMinG: 120,
    proteinMaxG: 165,
    proteinProvenance: "user_confirmed" as const,
  };

  const mockCheckIn = {
    sleepHours: 8,
    sleepQuality: 4,
    soreness: 2,
    fatigue: 2,
  };

  const mockReadiness = {
    readinessScore: 88,
    status: "Prime" as const,
    guidance: "High readiness for intensive training.",
    triggers: ["Deep sleep (+5)"],
    provenance: "calculated_estimate" as const,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function setupStateMock(overrides: Record<string, any> = {}) {
    const defaultState = {
      profile: baseProfile as any,
      equipment: [
        { id: "1", itemKey: "barbell", itemName: "Barbell & Bench", isConfirmed: true, isAvailable: true, maxLoadKg: 100, minIncrementKg: 2.5 },
        { id: "2", itemKey: "rack", itemName: "Squat Rack", isConfirmed: true, isAvailable: true, maxLoadKg: 150, minIncrementKg: 2.5 },
      ] as any,
      goals: baseGoals as any,
      updateGoals: vi.fn(),
      todayCheckIn: mockCheckIn,
      hasTodayCheckIn: true,
      readiness: mockReadiness,
      submitCheckIn: vi.fn(),
      foodEntries: [],
      getFoodEntriesForDate: () => [],
      workoutSessions: [],
      activitySessions: [],
      bodyMetrics: [
        { id: "1", loggedDate: "2026-11-01", weightKg: 75.2 },
        { id: "2", loggedDate: "2026-11-03", weightKg: 75.0 },
        { id: "3", loggedDate: "2026-11-05", weightKg: 74.8 },
      ],
      isDemoFixtureActive: false,
      preferences: { timezone: "Asia/Kolkata" },
      loadDemoFixture: vi.fn(),
      resetDemoFixture: vi.fn(),
      ...overrides,
    };

    vi.spyOn(useAthloniqStateModule, "useAthloniqState").mockReturnValue(defaultState as any);
  }

  it("renders quick-action links with correct href destinations and touch target classes", () => {
    setupStateMock();

    render(
      <MemoryRouter>
        <DashboardView onNavigate={vi.fn()} />
      </MemoryRouter>
    );

    // 1. Log meal -> /nutrition
    const logMealLink = screen.getByRole("link", { name: /Log meal/i });
    expect(logMealLink).toBeInTheDocument();
    expect(logMealLink.getAttribute("href")).toBe("/nutrition");
    expect(logMealLink.className).toContain("min-h-[44px]");

    // 2. Start workout -> /workouts
    const startWorkoutLink = screen.getByRole("link", { name: /Start workout/i });
    expect(startWorkoutLink).toBeInTheDocument();
    expect(startWorkoutLink.getAttribute("href")).toBe("/workouts");
    expect(startWorkoutLink.className).toContain("min-h-[44px]");

    // 3. Log weight -> /progress
    const logWeightLink = screen.getByRole("link", { name: /Log weight/i });
    expect(logWeightLink).toBeInTheDocument();
    expect(logWeightLink.getAttribute("href")).toBe("/progress");
    expect(logWeightLink.className).toContain("min-h-[44px]");

    // 4. Check-in -> /recovery
    const checkInLink = screen.getByRole("link", { name: /Check-in/i });
    expect(checkInLink).toBeInTheDocument();
    expect(checkInLink.getAttribute("href")).toBe("/recovery");
    expect(checkInLink.className).toContain("min-h-[44px]");
  });

  it("null calorie target displays fallback message and strictly hides kcal ratios", () => {
    setupStateMock({
      goals: {
        ...baseGoals,
        calorieTargetKcal: null,
      } as any,
    });

    render(
      <MemoryRouter>
        <DashboardView onNavigate={vi.fn()} />
      </MemoryRouter>
    );

    // Displays clear call to action without fabricated numbers
    expect(
      screen.getByText(/Calorie target not set — finish onboarding/i)
    ).toBeInTheDocument();

    // Must NOT display target ratios (e.g. "/ 2500 kcal" or "/ null kcal")
    expect(screen.queryByText(/\/ 2500 kcal/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\/ null kcal/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/kcal remaining/i)).not.toBeInTheDocument();
  });

  it("unconfirmed equipment shows the confirm state and blocks planned progression", () => {
    setupStateMock({
      profile: {
        ...baseProfile,
        equipmentConfirmed: false,
      } as any,
      equipment: [
        { id: "1", itemKey: "barbell", itemName: "Barbell & Bench", isConfirmed: false, isAvailable: true, maxLoadKg: 100, minIncrementKg: 2.5 },
        { id: "2", itemKey: "rack", itemName: "Squat Rack", isConfirmed: false, isAvailable: true, maxLoadKg: 150, minIncrementKg: 2.5 },
      ] as any,
    });

    render(
      <MemoryRouter>
        <DashboardView onNavigate={vi.fn()} />
      </MemoryRouter>
    );

    // Today's training card should state "Confirm your equipment"
    const confirmCards = screen.getAllByText(/Confirm your equipment/i);
    expect(confirmCards.length).toBeGreaterThan(0);

    // Verify presence of equipment notice
    expect(
      screen.getByText(/2 home gym item\(s\) are unconfirmed/i)
    ).toBeInTheDocument();
  });

  it("fewer than 3 weights displays the 'Need 3 weigh-ins' insufficient data message", () => {
    setupStateMock({
      bodyMetrics: [
        { id: "1", loggedDate: "2026-11-01", weightKg: 75.2 },
        { id: "2", loggedDate: "2026-11-03", weightKg: 75.0 },
      ],
    });

    render(
      <MemoryRouter>
        <DashboardView onNavigate={vi.fn()} />
      </MemoryRouter>
    );

    // Must show "Need 3 weigh-ins"
    expect(screen.getByText(/Need 3 weigh-ins/i)).toBeInTheDocument();
    expect(screen.getByText(/2\/3 weigh-ins logged/i)).toBeInTheDocument();
  });

  it("displays sparkline and rolling average when 3 or more weigh-ins exist", () => {
    setupStateMock({
      bodyMetrics: [
        { id: "1", loggedDate: "2026-11-01", weightKg: 75.2 },
        { id: "2", loggedDate: "2026-11-03", weightKg: 75.0 },
        { id: "3", loggedDate: "2026-11-05", weightKg: 74.8 },
      ],
    });

    render(
      <MemoryRouter>
        <DashboardView onNavigate={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.queryByText(/Need 3 weigh-ins/i)).not.toBeInTheDocument();
    expect(screen.getByText(/7-Day Rolling Avg:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Weight trend sparkline/i)).toBeInTheDocument();
  });

  it("greeting uses profile name only when set, falling back to clean greeting without null", () => {
    // 1. Name is set
    setupStateMock({
      profile: { ...baseProfile, fullName: "Alex Mercer" } as any,
    });

    const { unmount } = render(
      <MemoryRouter>
        <DashboardView onNavigate={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByText(/Alex Mercer/i)).toBeInTheDocument();
    unmount();

    // 2. Name is null
    setupStateMock({
      profile: { ...baseProfile, fullName: null as any } as any,
    });

    render(
      <MemoryRouter>
        <DashboardView onNavigate={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.queryByText(/null/i)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      /Good (morning|afternoon|evening)/i
    );
  });
});
