import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CoachView } from "@/features/coach/CoachView";
import * as apiModule from "@/services/api";

vi.mock("@/services/api", () => ({
  sendCoachChatTurn: vi.fn(),
  fetchWeeklyReview: vi.fn(),
}));

vi.mock("@/features/pwa/usePwa", () => ({
  usePwa: () => ({ isOnline: true }),
}));

const mockSnapshot = {
  profile: { weightKg: 70 },
  food_entries: [],
  workout_sessions: [],
  activity_sessions: [],
  body_metrics: [],
};

const mockGetCoachingSnapshot = vi.fn().mockReturnValue(mockSnapshot);

vi.mock("@/hooks/useAthloniqState", () => ({
  useAthloniqState: () => ({
    profile: { weightKg: 70, trainingDaysPerWeek: 5 },
    goals: { proteinMinG: 88, proteinMaxG: 121, proteinTargetG: 110 },
    preferences: {},
    updatePreferences: vi.fn(),
    coachMessages: [],
    addCoachMessage: vi.fn(),
    clearCoachMessages: vi.fn(),
    applyProposedAction: vi.fn(),
    dismissProposedAction: vi.fn(),
    getCoachingSnapshot: mockGetCoachingSnapshot,
  }),
}));

describe("CoachView Weekly Review Offline Catch & Retry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows 'Weekly review needs a connection' and retry button on fetch failure without synthesized values", async () => {
    vi.spyOn(apiModule, "fetchWeeklyReview").mockRejectedValue(new Error("Network offline"));

    render(<CoachView />);

    // Switch to Weekly Review tab
    const reviewTabButton = screen.getByRole("button", { name: /Weekly Review/i });
    fireEvent.click(reviewTabButton);

    // Verify error / offline notice appears
    await waitFor(() => {
      expect(screen.getByText(/Weekly review needs a connection/i)).toBeInTheDocument();
    });

    // Verify retry button is rendered
    const retryButton = screen.getByRole("button", { name: /Retry Review/i });
    expect(retryButton).toBeInTheDocument();

    // Verify NO synthesized dummy/fallback values exist in DOM (54.5, 2450 kg, fake staples)
    expect(screen.queryByText(/54\.5/)).not.toBeInTheDocument();
    expect(screen.queryByText(/2450/)).not.toBeInTheDocument();
    expect(screen.queryByText(/chicken: 2/i)).not.toBeInTheDocument();

    // Verify offline synthesis uses actual counts (0 when empty, no || 1 or || 5)
    expect(screen.getByText(/Gym: 0\/5 sessions completed/i)).toBeInTheDocument();
  });

  it("retries fetching weekly review when retry button is clicked", async () => {
    const fetchMock = vi
      .spyOn(apiModule, "fetchWeeklyReview")
      .mockRejectedValueOnce(new Error("Failed to connect"))
      .mockResolvedValueOnce({
        week_start_date: "2026-10-19",
        week_end_date: "2026-10-25",
        generated_at: "2026-10-25T12:00:00Z",
        nutrition_consistency: {
          days_logging_food: 5,
          days_in_period: 7,
          logging_consistency_pct: 71.4,
          protein_target_band: "88–121 g",
          current_protein_target_g: 110,
          latest_confirmed_protein_g: 105.0,
          is_protein_goal_met_today: true,
          top_protein_staples: { chicken: 4 },
          summary: "Logged food on 5/7 days.",
        },
        weight_trend_review: {
          status: "ok",
          weigh_in_count: 4,
          latest_weight_kg: 70.2,
          rolling_7d_kg: 70.1,
          weekly_delta_kg: 0.1,
          explanation: "7-day rolling weight steady at 70.1 kg.",
          disclaimer: "Single-day weight shifts reflect hydration.",
        },
        training_and_sports_load: {
          gym_sessions_completed: 4,
          gym_sessions_target: 5,
          gym_consistency_pct: 80.0,
          gym_total_sets: 16,
          gym_total_volume_kg: 3200.0,
          running_sessions: 1,
          running_total_km: 5.0,
          badminton_sessions: 1,
          badminton_total_min: 60.0,
          calisthenics_sessions: 0,
          summary: "Gym: 4/5 sessions completed.",
        },
        recovery_patterns: {
          average_sleep_hours: 8.0,
          average_sleep_quality: 4.2,
          average_soreness: 2.1,
          average_fatigue: 2.0,
          readiness_distribution: { Prime: 4, Moderate: 2, Recover: 1 },
          latest_readiness_score: 85,
          latest_status: "Prime",
          summary: "Readiness is Prime.",
        },
        next_week_priorities: ["Keep up the 5-day nutrition logging cadence."],
      });

    render(<CoachView />);

    // Switch to review tab
    const reviewTabButton = screen.getByRole("button", { name: /Weekly Review/i });
    fireEvent.click(reviewTabButton);

    await waitFor(() => {
      expect(screen.getByText(/Weekly review needs a connection/i)).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Click retry
    const retryButton = screen.getByRole("button", { name: /Retry Review/i });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(screen.queryByText(/Weekly review needs a connection/i)).not.toBeInTheDocument();
      expect(screen.getByText("Keep up the 5-day nutrition logging cadence.")).toBeInTheDocument();
    });
  });
});
