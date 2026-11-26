import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CoachView } from "@/features/coach/CoachView";
import { UnsavedWorkProvider, useUnsavedWork } from "@/features/navigation/UnsavedWorkContext";
import { GuardedNavLink } from "@/features/navigation/GuardedNavLink";
import { EpistemicCoachMessage } from "@/types";
import * as apiModule from "@/services/api";

vi.mock("@/services/api", () => ({
  sendCoachChatTurn: vi.fn(),
  fetchWeeklyReview: vi.fn(),
}));

let mockIsOnline = true;
vi.mock("@/features/pwa/usePwa", () => ({
  usePwa: () => ({ isOnline: mockIsOnline }),
}));

const mockAddCoachMessage = vi.fn();
const mockClearCoachMessages = vi.fn();
const mockApplyProposedAction = vi.fn();
const mockDismissProposedAction = vi.fn();
const mockUpdatePreferences = vi.fn();

let mockCoachMessages: EpistemicCoachMessage[] = [];
let mockProteinMinG: number | null = null;
let mockProteinMaxG: number | null = null;
let mockProteinTargetG: number | null = null;

vi.mock("@/hooks/useAthloniqState", () => ({
  useAthloniqState: () => ({
    profile: {
      fullName: "Taylor Morgan",
      age: 25,
      weightKg: 70,
      dietaryPattern: "omnivore",
      trainingDaysPerWeek: 4,
      equipmentConfirmed: true,
    },
    goals: {
      proteinMinG: mockProteinMinG,
      proteinMaxG: mockProteinMaxG,
      proteinTargetG: mockProteinTargetG,
    },
    preferences: {
      timezone: "Asia/Kolkata",
      notificationsEnabled: false,
      quietHoursStart: "22:00",
      quietHoursEnd: "06:30",
    },
    updatePreferences: mockUpdatePreferences,
    coachMessages: mockCoachMessages,
    addCoachMessage: mockAddCoachMessage,
    clearCoachMessages: mockClearCoachMessages,
    applyProposedAction: mockApplyProposedAction,
    dismissProposedAction: mockDismissProposedAction,
    getCoachingSnapshot: () => ({
      profile: { weightKg: 70 },
      food_entries: [],
      workout_sessions: [],
      activity_sessions: [],
      body_metrics: [],
    }),
  }),
}));

const CoachDirtyProbe: React.FC = () => {
  const { isDirty, dirtyFormName } = useUnsavedWork();
  return (
    <div>
      <span data-testid="coach-dirty">{isDirty ? "DIRTY" : "CLEAN"}</span>
      <span data-testid="coach-dirty-name">{dirtyFormName ?? ""}</span>
      <GuardedNavLink to="/recovery">Leave Coach</GuardedNavLink>
    </div>
  );
};

describe("CoachView & Split Components (UI-8D)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsOnline = true;
    mockCoachMessages = [];
    mockProteinMinG = null;
    mockProteinMaxG = null;
    mockProteinTargetG = null;
  });

  it("supports accessible sub-tab navigation (role=tablist/tab/tabpanel, aria-selected, keyboard arrows, 44px targets)", async () => {
    vi.spyOn(apiModule, "fetchWeeklyReview").mockRejectedValue(new Error("offline"));

    render(
      <MemoryRouter>
        <CoachView now="2026-11-26T10:00:00Z" />
      </MemoryRouter>
    );

    expect(screen.getByRole("tablist", { name: /Coach views/i })).toBeInTheDocument();
    const chatTab = screen.getByRole("tab", { name: /AI Coach Chat/i });
    const reviewTab = screen.getByRole("tab", { name: /Weekly Review & Priorities/i });

    expect(chatTab).toHaveAttribute("aria-selected", "true");
    expect(reviewTab).toHaveAttribute("aria-selected", "false");
    expect(chatTab.className).toMatch(/min-h-\[44px\]/);
    expect(reviewTab.className).toMatch(/min-h-\[44px\]/);
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", "coach-tab-chat");

    // Keyboard arrow switch to Weekly Review tab
    fireEvent.keyDown(chatTab, { key: "ArrowRight" });

    await waitFor(() => {
      expect(reviewTab).toHaveAttribute("aria-selected", "true");
      expect(chatTab).toHaveAttribute("aria-selected", "false");
      expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", "coach-tab-review");
    });
  });

  it("sends quick prompt chip cleanly and displays reply in aria-live='polite' log without fabricating when failing", async () => {
    const sendSpy = vi
      .spyOn(apiModule, "sendCoachChatTurn")
      .mockResolvedValueOnce({
        reply_markdown: "Confirmed protein logged: 120 g.",
        tools_used: ["get_nutrition_totals"],
        facts_from_tools: ["Confirmed protein: 120 g"],
        app_calculations: ["Gap: 20 g"],
        recommendations: ["Add whey isolate shake."],
        missing_or_uncertain: [],
        proposed_action: null,
      })
      .mockRejectedValueOnce(new Error("Service unavailable"));

    render(
      <MemoryRouter>
        <CoachView now="2026-11-26T10:00:00Z" />
      </MemoryRouter>
    );

    const logEl = screen.getByRole("log", { name: /AI Coach conversation messages/i });
    expect(logEl).toHaveAttribute("aria-live", "polite");

    const promptBtn = screen.getByRole("button", { name: /Did I eat enough protein yesterday\?/i });
    expect(promptBtn.className).toMatch(/min-h-\[44px\]/);
    fireEvent.click(promptBtn);

    await waitFor(() => {
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(mockAddCoachMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          sender: "coach",
          text: "Confirmed protein logged: 120 g.",
        })
      );
    });

    // Second request fails cleanly with accessible role="alert" error and Retry button, no fabricated numbers
    const promptBtn2 = screen.getByRole("button", { name: /Which exercises have improved the most\?/i });
    fireEvent.click(promptBtn2);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /Unable to reach AI Performance Coach\. No response was fabricated/i
      );
    });
    expect(screen.queryByText(/54\.5/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retry Send/i }).className).toMatch(/min-h-\[44px\]/);
  });

  it("arms UnsavedWorkContext on non-empty chat draft and clears on empty or submit", async () => {
    vi.spyOn(apiModule, "sendCoachChatTurn").mockResolvedValue({
      reply_markdown: "Checked.",
      tools_used: [],
      facts_from_tools: [],
      app_calculations: [],
      recommendations: [],
      missing_or_uncertain: [],
      proposed_action: null,
    });

    render(
      <MemoryRouter initialEntries={["/coach"]}>
        <UnsavedWorkProvider>
          <Routes>
            <Route
              path="/coach"
              element={
                <>
                  <CoachDirtyProbe />
                  <CoachView now="2026-11-26T10:00:00Z" />
                </>
              }
            />
            <Route path="/recovery" element={<div>Recovery Screen</div>} />
          </Routes>
        </UnsavedWorkProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId("coach-dirty")).toHaveTextContent("CLEAN");

    const input = screen.getByLabelText(/Message AI Performance Coach/i);
    expect(input.className).toMatch(/min-h-\[44px\]/);
    fireEvent.change(input, { target: { value: "Should I deload squats?" } });

    expect(screen.getByTestId("coach-dirty")).toHaveTextContent("DIRTY");
    expect(screen.getByTestId("coach-dirty-name")).toHaveTextContent("AI Coach Chat Draft");

    fireEvent.click(screen.getByText("Leave Coach"));
    expect(screen.getByText(/Unsaved Work in Progress/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Stay & Keep Editing/i }));

    // Submitting clears draft and dirty flag
    const sendBtn = screen.getByRole("button", { name: /Send message to AI Coach/i });
    expect(sendBtn.className).toMatch(/min-h-\[44px\]/);
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByTestId("coach-dirty")).toHaveTextContent("CLEAN");
    });
  });

  it("renders CoachMessageList epistemic cards, offline state, and Weekly Review null states with tabular-nums", async () => {
    mockIsOnline = false;
    mockCoachMessages = [
      {
        id: "m1",
        sender: "coach",
        text: "Analysis ready.",
        timestamp: "10:00",
        toolsUsed: ["get_user_goals"],
        factsFromTools: ["Logged 140g protein"],
        appCalculations: ["Surplus: +250 kcal"],
        recommendations: ["Keep progressing upper body."],
        missingOrUncertain: ["No sleep logged yet."],
      },
    ];
    vi.spyOn(apiModule, "fetchWeeklyReview").mockRejectedValue(new Error("Offline"));

    render(
      <MemoryRouter>
        <CoachView now="2026-11-26T10:00:00Z" />
      </MemoryRouter>
    );

    expect(screen.getByText("Analysis ready.")).toBeInTheDocument();
    expect(screen.getByText("get_user_goals()")).toBeInTheDocument();
    expect(screen.getByRole("textbox").parentElement?.querySelector("button")).toBeDisabled();

    // Switch to Weekly Review and verify honest null/"Not set" formatting (never "null")
    fireEvent.click(screen.getByRole("tab", { name: /Weekly Review & Priorities/i }));

    await waitFor(() => {
      expect(screen.getAllByText("Target not set").length).toBeGreaterThanOrEqual(2);
    });
    expect(screen.queryByText(/null–null/i)).not.toBeInTheDocument();
    expect(screen.getByText("Needs 3+ Entries")).toBeInTheDocument();
    expect(screen.getByText("Score: Not set")).toBeInTheDocument();
    expect(screen.getByText("0 / 7").className).toContain("tabular-nums");
  });
});
