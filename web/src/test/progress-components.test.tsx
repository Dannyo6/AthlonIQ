import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProgressView } from "@/features/progress/ProgressView";
import { UnsavedWorkProvider, useUnsavedWork } from "@/features/navigation/UnsavedWorkContext";
import { GuardedNavLink } from "@/features/navigation/GuardedNavLink";
import {
  ActivitySession,
  BodyMetric,
  FoodEntry,
  ProgressPhotoAsset,
  RecoveryCheckIn,
  WorkoutSession,
} from "@/types";

const mockUpdateGoals = vi.fn();
const mockAddBodyMetric = vi.fn();
const mockDeleteBodyMetric = vi.fn();
const mockAddProgressPhoto = vi.fn();
const mockDeleteProgressPhoto = vi.fn();
const mockLoadDemoFixture = vi.fn();
const mockResetDemoFixture = vi.fn();

let mockBodyMetrics: BodyMetric[] = [];
let mockWorkoutSessions: WorkoutSession[] = [];
let mockActivitySessions: ActivitySession[] = [];
let mockFoodEntries: FoodEntry[] = [];
let mockProgressPhotos: ProgressPhotoAsset[] = [];
let mockTodayCheckIn: RecoveryCheckIn | null = null;
let mockHasTodayCheckIn = false;
let mockProteinTargetG: number | null = null;
let mockCalorieTargetKcal: number | null = null;

vi.mock("@/hooks/useAthloniqState", () => ({
  useAthloniqState: () => ({
    profile: {
      id: "athlete-1",
      email: "athlete@example.com",
      fullName: "Test Athlete",
      age: 24,
      heightCm: 175,
      weightKg: 70,
      dietaryPattern: "omnivore",
      primaryGoal: "lean_bulk",
      trainingScope: ["gym"],
      trainingDaysPerWeek: 4,
      trainingEnvironment: "home_gym",
      calorieTrackingHabit: "strict",
      equipmentConfirmed: true,
    },
    goals: {
      calorieTargetKcal: mockCalorieTargetKcal,
      calorieProvenance: "provisional_default",
      proteinTargetG: mockProteinTargetG,
      proteinMinG: null,
      proteinMaxG: null,
      proteinProvenance: "provisional_default",
    },
    preferences: { timezone: "Asia/Kolkata" },
    updateGoals: mockUpdateGoals,
    bodyMetrics: mockBodyMetrics,
    addBodyMetric: mockAddBodyMetric,
    deleteBodyMetric: mockDeleteBodyMetric,
    workoutSessions: mockWorkoutSessions,
    activitySessions: mockActivitySessions,
    foodEntries: mockFoodEntries,
    todayCheckIn: mockTodayCheckIn,
    hasTodayCheckIn: mockHasTodayCheckIn,
    progressPhotos: mockProgressPhotos,
    addProgressPhoto: mockAddProgressPhoto,
    deleteProgressPhoto: mockDeleteProgressPhoto,
    isDemoFixtureActive: false,
    loadDemoFixture: mockLoadDemoFixture,
    resetDemoFixture: mockResetDemoFixture,
  }),
}));

const ProgressDirtyProbe: React.FC = () => {
  const { isDirty, dirtyFormName } = useUnsavedWork();
  return (
    <div>
      <span data-testid="progress-dirty">{isDirty ? "DIRTY" : "CLEAN"}</span>
      <span data-testid="progress-dirty-name">{dirtyFormName ?? ""}</span>
      <GuardedNavLink to="/recovery">Leave Progress</GuardedNavLink>
    </div>
  );
};

describe("ProgressView & Split Components (UI-8C)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBodyMetrics = [];
    mockWorkoutSessions = [];
    mockActivitySessions = [];
    mockFoodEntries = [];
    mockProgressPhotos = [];
    mockTodayCheckIn = null;
    mockHasTodayCheckIn = false;
    mockProteinTargetG = null;
    mockCalorieTargetKcal = null;
  });

  it("renders explicit 0/3 WEIGH-INS, Insufficient Data, Target not set, and empty photo state cleanly", () => {
    render(
      <MemoryRouter>
        <ProgressView now="2026-11-26T10:00:00Z" />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/0\/3 weigh-ins/i).length).toBeGreaterThanOrEqual(2);
    expect(
      screen.getByText(/Insufficient Data — Minimum 3 Weigh-Ins Required/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Target not set")).toBeInTheDocument();
    expect(screen.queryByText(/null g\/day/i)).not.toBeInTheDocument();
    expect(screen.getByText("No progress photos logged yet.")).toBeInTheDocument();
    expect(screen.getByText("Not set / Not set")).toBeInTheDocument();
  });

  it("renders deterministic weight trend and volume metrics with tabular-nums and accessible delta summary", () => {
    mockProteinTargetG = 140;
    mockCalorieTargetKcal = 2500;
    mockBodyMetrics = [
      { id: "m1", loggedDate: "2026-11-18", weightKg: 70.0 },
      { id: "m2", loggedDate: "2026-11-22", weightKg: 70.4 },
      { id: "m3", loggedDate: "2026-11-26", weightKg: 70.8 },
    ];
    mockWorkoutSessions = [
      {
        id: "w1",
        loggedDate: "2026-11-25",
        title: "Upper A",
        completed: true,
        sets: [
          {
            id: "s1",
            exerciseName: "Barbell Bench Press",
            setOrder: 1,
            reps: 10,
            loadKg: 60,
            isBodyweight: false,
            rpe: 8,
            rir: 2,
            isCompleted: true,
            isPr: true,
          },
        ],
      },
    ];
    mockActivitySessions = [
      {
        id: "a1",
        loggedDate: "2026-11-24",
        activityType: "running",
        durationMinutes: 30,
        distanceKm: 5.5,
      },
    ];

    render(
      <MemoryRouter>
        <ProgressView now="2026-11-26T10:00:00Z" />
      </MemoryRouter>
    );

    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
    expect(screen.getByText("Weekly Delta (Gain)")).toBeInTheDocument();
    const deltaEl = screen.getByLabelText(/Weekly delta Gain:/i);
    expect(deltaEl.className).toContain("tabular-nums");

    const table = screen.getByRole("table", { name: /7-Day Rolling Weight Trend History/i });
    expect(table.className).toContain("tabular-nums");
    expect(screen.getByText("600")).toBeInTheDocument();
    expect(screen.getByText("600").className).toContain("tabular-nums");
    expect(screen.getByText("Target: 140 g/day")).toBeInTheDocument();
  });

  it("validates weigh-in input with inline alerts and submits valid metrics", () => {
    render(
      <MemoryRouter>
        <ProgressView now="2026-11-26T10:00:00Z" />
      </MemoryRouter>
    );

    const logBtn = screen.getByRole("button", { name: /Log Weigh-In/i });
    expect(logBtn.className).toMatch(/min-h-\[44px\]/);
    fireEvent.click(logBtn);

    const weightInput = screen.getByLabelText(/Weight \(kg\)/i);
    expect(document.activeElement).toBe(weightInput);

    // Invalid empty submit shows accessible inline alert and blocks addBodyMetric
    const saveBtn = screen.getByRole("button", { name: /Save Weigh-In/i });
    expect(saveBtn.className).toMatch(/min-h-\[44px\]/);
    fireEvent.click(saveBtn);
    expect(screen.getByRole("alert")).toHaveTextContent("Enter body weight in kg.");
    expect(weightInput).toHaveAttribute("aria-invalid", "true");
    expect(mockAddBodyMetric).not.toHaveBeenCalled();

    // Out-of-range weight shows range alert
    fireEvent.change(weightInput, { target: { value: "5" } });
    fireEvent.click(saveBtn);
    expect(screen.getByRole("alert")).toHaveTextContent("Weight must be between 20 and 300 kg.");
    expect(mockAddBodyMetric).not.toHaveBeenCalled();

    // Valid submit succeeds and sends parsed numbers / null optional fields
    fireEvent.change(weightInput, { target: { value: "71.2" } });
    fireEvent.change(screen.getByLabelText(/Waist \(cm\)/i), { target: { value: "78.5" } });
    fireEvent.click(saveBtn);

    expect(mockAddBodyMetric).toHaveBeenCalledWith({
      loggedDate: "2026-11-26",
      weightKg: 71.2,
      waistCm: 78.5,
      chestCm: null,
      armCm: null,
      notes: undefined,
    });
  });

  it("arms UnsavedWorkContext on weigh-in and photo edits and clears on cancel/submit", () => {
    render(
      <MemoryRouter initialEntries={["/progress"]}>
        <UnsavedWorkProvider>
          <Routes>
            <Route
              path="/progress"
              element={
                <>
                  <ProgressDirtyProbe />
                  <ProgressView now="2026-11-26T10:00:00Z" />
                </>
              }
            />
            <Route path="/recovery" element={<div>Recovery Screen</div>} />
          </Routes>
        </UnsavedWorkProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId("progress-dirty")).toHaveTextContent("CLEAN");

    // Open weigh-in form -> still clean until user types
    fireEvent.click(screen.getByRole("button", { name: /Log Weigh-In/i }));
    expect(screen.getByTestId("progress-dirty")).toHaveTextContent("CLEAN");

    fireEvent.change(screen.getByLabelText(/Weight \(kg\)/i), { target: { value: "72" } });
    expect(screen.getByTestId("progress-dirty")).toHaveTextContent("DIRTY");
    expect(screen.getByTestId("progress-dirty-name")).toHaveTextContent("Weigh-In Form");

    // Attempt navigation triggers UnsavedWork modal
    fireEvent.click(screen.getByText("Leave Progress"));
    expect(screen.getByText(/Unsaved Work in Progress/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Stay & Keep Editing/i }));

    // Cancel clears dirty flag
    fireEvent.click(screen.getByRole("button", { name: /^Cancel$/i }));
    expect(screen.getByTestId("progress-dirty")).toHaveTextContent("CLEAN");

    // Photo form dirty check
    fireEvent.click(screen.getByRole("button", { name: /Add Photo/i }));
    fireEvent.change(screen.getByLabelText(/Progress photo image URL/i), {
      target: { value: "https://example.com/photo.png" },
    });
    expect(screen.getByTestId("progress-dirty")).toHaveTextContent("DIRTY");
    expect(screen.getByTestId("progress-dirty-name")).toHaveTextContent("Progress Photo Form");

    fireEvent.click(screen.getByRole("button", { name: /Save Photo Record/i }));
    expect(mockAddProgressPhoto).toHaveBeenCalledWith(
      expect.objectContaining({
        loggedDate: "2026-11-26",
        weightKg: 70,
        imageUrl: "https://example.com/photo.png",
        category: "progress",
      })
    );
    expect(screen.getByTestId("progress-dirty")).toHaveTextContent("CLEAN");
  });

  it("enforces 44px touch targets and descriptive alt/aria labels on photos and delete buttons", () => {
    mockBodyMetrics = [{ id: "m1", loggedDate: "2026-11-26", weightKg: 70.5 }];
    mockProgressPhotos = [
      {
        id: "p1",
        loggedDate: "2026-11-26",
        weightKg: 70.5,
        imageUrl: "data:image/png;base64,abc",
        category: "progress",
        notes: "Morning light",
      },
    ];

    render(
      <MemoryRouter>
        <ProgressView now="2026-11-26T10:00:00Z" />
      </MemoryRouter>
    );

    expect(
      screen.queryByRole("button", { name: /Load 14d Demo Fixture/i })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Photo/i }).className).toMatch(/min-h-\[44px\]/);
    expect(screen.getByRole("button", { name: /Log Weigh-In/i }).className).toMatch(
      /min-h-\[44px\]/
    );

    const img = screen.getByAltText(/Progress photo logged on 2026-11-26 \(70\.5 kg\)/i);
    expect(img).toBeInTheDocument();

    const delPhoto = screen.getByRole("button", {
      name: /Delete progress photo from 2026-11-26/i,
    });
    expect(delPhoto.className).toMatch(/min-h-\[44px\]/);
    fireEvent.click(delPhoto);
    expect(mockDeleteProgressPhoto).toHaveBeenCalledWith("p1");

    const delMetric = screen.getByRole("button", { name: /Delete weigh-in from 2026-11-26/i });
    expect(delMetric.className).toMatch(/min-h-\[44px\]/);
    fireEvent.click(delMetric);
    expect(mockDeleteBodyMetric).toHaveBeenCalledWith("m1");
  });
});
