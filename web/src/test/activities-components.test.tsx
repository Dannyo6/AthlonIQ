import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ActivitiesView } from "@/features/activities/ActivitiesView";
import { UnsavedWorkProvider, useUnsavedWork } from "@/features/navigation/UnsavedWorkContext";
import { GuardedNavLink } from "@/features/navigation/GuardedNavLink";
import { ActivitySession } from "@/types";

const mockAddActivitySession = vi.fn();
const mockDeleteActivitySession = vi.fn();

let mockActivities: ActivitySession[] = [];

vi.mock("@/hooks/useAthloniqState", () => ({
  useAthloniqState: () => ({
    activitySessions: mockActivities,
    preferences: { timezone: "Asia/Kolkata" },
    addActivitySession: mockAddActivitySession,
    deleteActivitySession: mockDeleteActivitySession,
    getWeeklyActivities: () => mockActivities,
  }),
}));

const ActivityDirtyProbe: React.FC = () => {
  const { isDirty, dirtyFormName } = useUnsavedWork();
  return (
    <div>
      <span data-testid="activity-dirty">{isDirty ? "DIRTY" : "CLEAN"}</span>
      <span data-testid="activity-dirty-name">{dirtyFormName ?? ""}</span>
      <GuardedNavLink to="/recovery">Leave Activities</GuardedNavLink>
    </div>
  );
};

describe("ActivitiesView & Split Components (UI-8B)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActivities = [];
  });

  it("renders empty state cleanly, switches sport modes, and validates duration > 0 before submitting", () => {
    render(
      <MemoryRouter>
        <ActivitiesView />
      </MemoryRouter>
    );

    expect(screen.getByText("No activities logged yet.")).toBeInTheDocument();

    const logBtn = screen.getByRole("button", { name: /Log Activity/i });
    expect(logBtn.className).toMatch(/min-h-\[44px\]/);
    fireEvent.click(logBtn);

    // Running mode shows Not set live pace initially
    expect(screen.getByText(/Not set — enter distance & duration/i)).toBeInTheDocument();

    // Validation blocks empty/zero submit without calling addActivitySession
    fireEvent.click(screen.getByRole("button", { name: /Log Running/i }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      /Enter a duration greater than 0 minutes\./i
    );
    expect(mockAddActivitySession).not.toHaveBeenCalled();

    // Deterministic running pace calculation: 5 km in 25 min -> 5:00 /km
    fireEvent.change(screen.getByLabelText(/Duration \(minutes\)/i), {
      target: { value: "25" },
    });
    fireEvent.change(screen.getByLabelText(/Distance \(km\)/i), {
      target: { value: "5" },
    });
    const paceEl = screen.getByText("5:00 /km");
    expect(paceEl.className).toMatch(/tabular-nums/);

    fireEvent.click(screen.getByRole("button", { name: /Log Running/i }));
    expect(mockAddActivitySession).toHaveBeenCalledWith(
      expect.objectContaining({
        activityType: "running",
        durationMinutes: 25,
        distanceKm: 5,
        paceFormatted: "5:00 /km",
      })
    );
  });

  it("supports Badminton and Calisthenics sport modes with 44px touch targets", () => {
    render(
      <MemoryRouter>
        <ActivitiesView />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /Log Activity/i }));

    // Badminton mode
    const badmintonBtn = screen.getByRole("button", { name: /^badminton$/i });
    expect(badmintonBtn.className).toMatch(/min-h-\[44px\]/);
    fireEvent.click(badmintonBtn);

    const doublesBtn = screen.getByRole("button", { name: /^doubles$/i });
    expect(doublesBtn.className).toMatch(/min-h-\[44px\]/);
    fireEvent.click(doublesBtn);

    fireEvent.change(screen.getByLabelText(/Duration \(minutes\)/i), {
      target: { value: "60" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Log Badminton/i }));
    expect(mockAddActivitySession).toHaveBeenCalledWith(
      expect.objectContaining({
        activityType: "badminton",
        durationMinutes: 60,
        matchFormat: "doubles",
      })
    );

    // Calisthenics mode
    fireEvent.click(screen.getByRole("button", { name: /Log Activity/i }));
    const calBtn = screen.getByRole("button", { name: /^calisthenics$/i });
    expect(calBtn.className).toMatch(/min-h-\[44px\]/);
    fireEvent.click(calBtn);

    fireEvent.change(screen.getByLabelText(/Duration \(minutes\)/i), {
      target: { value: "40" },
    });
    fireEvent.change(screen.getByLabelText(/Skill \/ Movement/i), {
      target: { value: "Pull-ups" },
    });
    fireEvent.change(screen.getByLabelText(/^Sets$/i), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByLabelText(/Reps \/ Hold \(s\)/i), {
      target: { value: "10" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Log Calisthenics/i }));

    expect(mockAddActivitySession).toHaveBeenLastCalledWith(
      expect.objectContaining({
        activityType: "calisthenics",
        durationMinutes: 40,
        skillName: "Pull-ups",
        setsCount: 4,
        repsOrHoldSec: 10,
      })
    );
  });

  it("filters history, displays Pace: Not set cleanly when unmeasured, and deletes with 44px button", () => {
    mockActivities = [
      {
        id: "act-1",
        loggedDate: "2026-11-25",
        activityType: "running",
        durationMinutes: 30,
        distanceKm: null,
        paceFormatted: null,
        perceivedEffort: 6,
      },
      {
        id: "act-2",
        loggedDate: "2026-11-26",
        activityType: "badminton",
        durationMinutes: 45,
        matchFormat: "singles",
        perceivedEffort: 8,
      },
    ];

    render(
      <MemoryRouter>
        <ActivitiesView />
      </MemoryRouter>
    );

    expect(screen.getByText("Pace: Not set")).toBeInTheDocument();
    expect(screen.getByText("SINGLES")).toBeInTheDocument();

    const filterSelect = screen.getByLabelText(/Filter activities by sport/i);
    expect(filterSelect.className).toMatch(/min-h-\[44px\]/);
    fireEvent.change(filterSelect, { target: { value: "running" } });
    expect(screen.getByText("Pace: Not set")).toBeInTheDocument();
    expect(screen.queryByText("SINGLES")).not.toBeInTheDocument();

    const deleteBtn = screen.getByRole("button", { name: /Delete running session/i });
    expect(deleteBtn.className).toMatch(/min-h-\[44px\]/);
    fireEvent.click(deleteBtn);
    expect(mockDeleteActivitySession).toHaveBeenCalledWith("act-1");
  });

  it("arms UnsavedWorkContext when activity form has unsaved input and disarms on cancel/submit", () => {
    render(
      <MemoryRouter initialEntries={["/activities"]}>
        <UnsavedWorkProvider>
          <Routes>
            <Route
              path="/activities"
              element={
                <>
                  <ActivityDirtyProbe />
                  <ActivitiesView />
                </>
              }
            />
            <Route path="/recovery" element={<div>Recovery Screen</div>} />
          </Routes>
        </UnsavedWorkProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId("activity-dirty")).toHaveTextContent("CLEAN");

    fireEvent.click(screen.getByRole("button", { name: /Log Activity/i }));
    expect(screen.getByTestId("activity-dirty")).toHaveTextContent("CLEAN");

    fireEvent.change(screen.getByLabelText(/Duration \(minutes\)/i), {
      target: { value: "35" },
    });
    expect(screen.getByTestId("activity-dirty")).toHaveTextContent("DIRTY");
    expect(screen.getByTestId("activity-dirty-name")).toHaveTextContent("Activity Log");

    fireEvent.click(screen.getByText("Leave Activities"));
    expect(screen.getByText(/Unsaved Work in Progress/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Stay & Keep Editing/i }));

    fireEvent.click(screen.getByRole("button", { name: /^Cancel$/i }));
    expect(screen.getByTestId("activity-dirty")).toHaveTextContent("CLEAN");
  });
});
