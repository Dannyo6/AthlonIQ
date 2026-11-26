import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RecoveryView } from "@/features/recovery/RecoveryView";
import { RecoveryHistoryList } from "@/features/recovery/components/RecoveryHistoryList";
import { UnsavedWorkProvider, useUnsavedWork } from "@/features/navigation/UnsavedWorkContext";
import { GuardedNavLink } from "@/features/navigation/GuardedNavLink";
import { RecoveryCheckIn, ReadinessResult } from "@/types";

const mockSubmitCheckIn = vi.fn();

let mockHasTodayCheckIn = false;
let mockTodayCheckIn: RecoveryCheckIn = {
  date: "2026-11-26",
  sleepHours: 7.5,
  sleepQuality: 4,
  soreness: 2,
  fatigue: 2,
  stress: null,
};
let mockReadiness: ReadinessResult | null = null;

vi.mock("@/hooks/useAthloniqState", () => ({
  useAthloniqState: () => ({
    todayCheckIn: mockTodayCheckIn,
    hasTodayCheckIn: mockHasTodayCheckIn,
    readiness: mockReadiness,
    submitCheckIn: mockSubmitCheckIn,
  }),
}));

const DirtyProbe: React.FC = () => {
  const { isDirty, dirtyFormName } = useUnsavedWork();
  return (
    <div>
      <span data-testid="recovery-dirty">{isDirty ? "DIRTY" : "CLEAN"}</span>
      <span data-testid="recovery-dirty-name">{dirtyFormName ?? ""}</span>
      <GuardedNavLink to="/workouts">Leave Recovery</GuardedNavLink>
    </div>
  );
};

describe("RecoveryView & Split Components (UI-8B)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasTodayCheckIn = false;
    mockTodayCheckIn = {
      date: "2026-11-26",
      sleepHours: 7.5,
      sleepQuality: 4,
      soreness: 2,
      fatigue: 2,
      stress: null,
    };
    mockReadiness = null;
  });

  it("renders honest Not set states and empty history when unlogged, and submits stress: null when slider untouched", () => {
    render(<RecoveryView />);

    expect(screen.getByText("NO CHECK-IN YET")).toBeInTheDocument();
    expect(screen.getAllByText("Not set").length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText("No triggers evaluated yet.")).toBeInTheDocument();
    expect(screen.getByText("No recovery check-ins logged yet.")).toBeInTheDocument();

    const slider = screen.getByLabelText(/External Life \/ Mental Stress/i) as HTMLInputElement;
    expect(slider.type).toBe("range");
    expect(slider).toHaveAttribute("min", "1");
    expect(slider).toHaveAttribute("max", "5");

    fireEvent.click(screen.getByRole("button", { name: /Submit Today's Check-in/i }));
    expect(mockSubmitCheckIn).toHaveBeenCalledWith({
      sleepHours: 7.5,
      sleepQuality: 4,
      soreness: 2,
      fatigue: 2,
      stress: null,
    });
  });

  it("allows setting optional stress via native range slider and clearing back to Not set", () => {
    render(<RecoveryView />);

    const slider = screen.getByLabelText(/External Life \/ Mental Stress/i);
    fireEvent.change(slider, { target: { value: "5" } });
    expect(screen.getByText("Level 5 / 5")).toBeInTheDocument();
    expect(screen.getByText(/Severe Acute Stress/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Submit Today's Check-in/i }));
    expect(mockSubmitCheckIn).toHaveBeenCalledWith(
      expect.objectContaining({ stress: 5 })
    );

    const clearBtn = screen.getByRole("button", { name: /^Clear$/i });
    expect(clearBtn.className).toMatch(/min-h-\[44px\]/);
    fireEvent.click(clearBtn);
    expect(screen.queryByRole("button", { name: /^Clear$/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Submit Today's Check-in/i }));
    expect(mockSubmitCheckIn).toHaveBeenLastCalledWith(
      expect.objectContaining({ stress: null })
    );
  });

  it("registers unsaved check-in edits with UnsavedWorkContext and clears dirty flag on submit", () => {
    render(
      <MemoryRouter initialEntries={["/recovery"]}>
        <UnsavedWorkProvider>
          <Routes>
            <Route
              path="/recovery"
              element={
                <>
                  <DirtyProbe />
                  <RecoveryView />
                </>
              }
            />
            <Route path="/workouts" element={<div>Workouts Screen</div>} />
          </Routes>
        </UnsavedWorkProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId("recovery-dirty")).toHaveTextContent("CLEAN");

    const sleepInput = screen.getByLabelText(/Sleep Duration \(Hours\)/i);
    fireEvent.change(sleepInput, { target: { value: "8.5" } });
    expect(screen.getByTestId("recovery-dirty")).toHaveTextContent("DIRTY");
    expect(screen.getByTestId("recovery-dirty-name")).toHaveTextContent("Daily Recovery Check-in");

    fireEvent.click(screen.getByText("Leave Recovery"));
    expect(screen.getByText(/Unsaved Work in Progress/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Stay & Keep Editing/i }));

    fireEvent.click(screen.getByRole("button", { name: /Submit Today's Check-in/i }));
    expect(screen.getByTestId("recovery-dirty")).toHaveTextContent("CLEAN");
  });

  it("renders logged readiness summary, deterministic triggers, history list, and 44px/tabular-nums classes", () => {
    mockHasTodayCheckIn = true;
    mockReadiness = {
      readinessScore: 85,
      status: "Prime",
      guidance: "Proceed with scheduled progressive overload.",
      triggers: ["Good sleep quality (4/5): +5", "Minimal soreness (2/5): 0"],
      provenance: "calculated_estimate",
    };

    render(<RecoveryView />);

    expect(screen.getByText("READINESS: PRIME (85%)")).toBeInTheDocument();
    expect(screen.getByText("Proceed with scheduled progressive overload.")).toBeInTheDocument();
    expect(screen.getByText("Good sleep quality (4/5): +5")).toBeInTheDocument();
    expect(screen.getByText("2026-11-26")).toBeInTheDocument();
    expect(screen.getByText("Stress: Not set")).toBeInTheDocument();

    const sleepInput = screen.getByLabelText(/Sleep Duration \(Hours\)/i);
    expect(sleepInput.className).toMatch(/min-h-\[44px\]/);
    expect(sleepInput.className).toMatch(/tabular-nums/);
    expect(screen.getByLabelText(/Subjective Sleep Quality/i).className).toMatch(/min-h-\[44px\]/);
    expect(screen.getByLabelText(/Muscle Soreness/i).className).toMatch(/min-h-\[44px\]/);
    expect(screen.getByLabelText(/Systemic Fatigue/i).className).toMatch(/min-h-\[44px\]/);
  });

  it("renders multiple RecoveryHistoryList items sorted newest-first with stress numbers when present", () => {
    render(
      <RecoveryHistoryList
        entries={[
          {
            date: "2026-11-24",
            sleepHours: 6.5,
            sleepQuality: 3,
            soreness: 3,
            fatigue: 3,
            stress: 4,
          },
          {
            date: "2026-11-26",
            sleepHours: 8.0,
            sleepQuality: 5,
            soreness: 1,
            fatigue: 1,
            stress: null,
          },
        ]}
      />
    );

    const dates = screen.getAllByText(/2026-11-2[46]/);
    expect(dates[0]).toHaveTextContent("2026-11-26");
    expect(dates[1]).toHaveTextContent("2026-11-24");
    expect(screen.getByText("Stress: 4/5")).toBeInTheDocument();
    expect(screen.getByText("Stress: Not set")).toBeInTheDocument();
  });
});
