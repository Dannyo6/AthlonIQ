import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { sendCoachChatTurn, fetchWeeklyReview } from "@/services/api";
import { DashboardView } from "@/features/dashboard/DashboardView";
import { App } from "@/app/App";
import { MealPhotoUploader } from "@/features/nutrition/components/MealPhotoUploader";
import { ProfileView } from "@/features/profile/ProfileView";
import { UnsavedWorkProvider } from "@/features/navigation/UnsavedWorkContext";
import { gatedProgressionSuggestion } from "@/lib";
import * as AuthContextModule from "@/features/auth/AuthContext";
import * as useAthloniqStateModule from "@/hooks/useAthloniqState";

describe("Lane B3 Requirements Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Item 1: Client never sends 'today' to coaching endpoints", () => {
    it("sendCoachChatTurn strips any rogue 'today' property from request payload", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            reply: "Coach advice",
            tools_used: [],
            facts_from_tools: [],
            app_calculations: [],
            recommendations: [],
            missing_or_uncertain: [],
            proposed_action: null,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      });

      const roguePayload: any = {
        message: "What should I eat?",
        today: "2026-10-26",
        context: { today: "2026-10-26" },
      };

      await sendCoachChatTurn(roguePayload.message, roguePayload.context);

      expect(fetchSpy).toHaveBeenCalled();
      const calledUrl = fetchSpy.mock.calls[0][0] as string;
      const calledOptions = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(calledUrl).toContain("/coaching/chat");

      const parsedBody = JSON.parse(calledOptions.body as string);
      expect(parsedBody.today).toBeUndefined();
      expect(parsedBody).not.toHaveProperty("today");

      fetchSpy.mockRestore();
    });

    it("fetchWeeklyReview strips any rogue 'today' property from request payload", async () => {
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
        return new Response(
          JSON.stringify({
            week_start: "2026-10-19",
            week_end: "2026-10-25",
            nutrition_summary: {
              target_calories: 2200,
              avg_confirmed_calories: 2150,
              target_protein_g: 110,
              avg_confirmed_protein_g: 108,
              nutrition_observation_days: 7,
              is_protein_goal_met_today: true,
            },
            training_load: {
              total_sessions_completed: 4,
              total_volume_kg: 18500,
              gym_sessions_count: 4,
              badminton_sessions_count: 0,
              running_sessions_count: 0,
            },
            recovery_patterns: {
              avg_sleep_hours: 7.4,
              avg_sleep_quality: 4.1,
              readiness_distribution: { Prime: 4, Moderate: 3 },
              latest_readiness_score: 82,
              latest_status: "Prime",
            },
            adaptive_signals: {
              suggested_calorie_delta: 0,
              suggested_protein_delta: 0,
              rationale: "On track",
            },
            coach_weekly_verdict: "Strong week.",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      });

      const rogueContext: any = {
        today: "2026-10-26",
        profile: { primaryGoal: "lean_bulk" },
      };

      await fetchWeeklyReview(rogueContext);

      expect(fetchSpy).toHaveBeenCalled();
      const calledUrl = fetchSpy.mock.calls[0][0] as string;
      const calledOptions = fetchSpy.mock.calls[0][1] as RequestInit;
      expect(calledUrl).toContain("/coaching/weekly-review");

      const parsedBody = JSON.parse(calledOptions.body as string);
      expect(parsedBody.today).toBeUndefined();
      expect(parsedBody).not.toHaveProperty("today");

      fetchSpy.mockRestore();
    });
  });

  describe("Item 2: Readiness widget and Today card show 'No check-in yet' when unlogged", () => {
    it("Today card renders 'No check-in yet' and link when hasTodayCheckIn is false", () => {
      vi.spyOn(useAthloniqStateModule, "useAthloniqState").mockReturnValue({
        profile: {
          fullName: "Test Athlete",
          weightKg: 70,
          heightCm: 175,
          onboardingCompleted: true,
          equipmentConfirmed: true,
          trainingDaysPerWeek: 5,
        } as any,
        equipment: [],
        goals: { calorieTargetKcal: 2200, calorieProvenance: "user_confirmed", proteinTargetG: 110, proteinMinG: 88, proteinMaxG: 121, proteinProvenance: "user_confirmed" } as any,
        updateGoals: vi.fn(),
        todayCheckIn: { date: "2026-10-26", sleepHours: 7.5, sleepQuality: 4, soreness: 2, fatigue: 2, stress: null },
        hasTodayCheckIn: false,
        readiness: null,
        submitCheckIn: vi.fn(),
        foodEntries: [],
        getFoodEntriesForDate: () => [],
        workoutSessions: [],
        activitySessions: [],
        bodyMetrics: [],
        isDemoFixtureActive: false,
        loadDemoFixture: vi.fn(),
        resetDemoFixture: vi.fn(),
      } as any);

      render(
        <MemoryRouter>
          <DashboardView onNavigate={vi.fn()} />
        </MemoryRouter>
      );

      const todayCard = screen.getByTestId("today-readiness-card");
      expect(todayCard).toHaveTextContent("Daily Readiness: No check-in yet");
      expect(todayCard).not.toHaveTextContent("80%");
      expect(todayCard).not.toHaveTextContent("Prime");

      const logLink = screen.getByRole("link", { name: /Log recovery check-in/i });
      expect(logLink).toBeInTheDocument();
      expect(logLink.getAttribute("href")).toBe("/recovery");
    });

    it("Sidebar readiness widget renders 'No check-in yet' and link when hasTodayCheckIn is false", () => {
      vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
        user: { id: "test-user-123", email: "athlete@athloniq.io" } as any,
        session: {} as any,
        loading: false,
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        resetPassword: vi.fn(),
        reAuthRequired: false,
        dismissReAuthPrompt: vi.fn(),
        authToast: null,
        clearAuthToast: vi.fn(),
      });

      vi.spyOn(useAthloniqStateModule, "useAthloniqState").mockReturnValue({
        profile: { fullName: "Test Athlete", onboardingCompleted: true } as any,
        readiness: null,
        hasTodayCheckIn: false,
        toast: null,
        hideToast: vi.fn(),
        isDemoFixtureActive: false,
        loadDemoFixture: vi.fn(),
        resetDemoFixture: vi.fn(),
        syncStatus: "synced",
        syncError: null,
        retrySync: vi.fn(),
        legacyImportAvailable: false,
        legacyImportCounts: null,
        runLegacyImport: vi.fn(),
        dismissLegacyImport: vi.fn(),
      } as any);

      render(
        <MemoryRouter>
          <App />
        </MemoryRouter>
      );

      const sidebarWidget = screen.getByTestId("sidebar-readiness-widget");
      expect(sidebarWidget).toHaveTextContent("No check-in yet");
      expect(sidebarWidget).toHaveTextContent("Not set");
      expect(sidebarWidget).not.toHaveTextContent("80/100");
      expect(sidebarWidget).not.toHaveTextContent("PRIME");

      const logLink = screen.getByRole("link", { name: /Log check-in/i });
      expect(logLink).toBeInTheDocument();
      expect(logLink.getAttribute("href")).toBe("/recovery");
    });

    it("Today card and Sidebar widget display computed score once check-in exists", () => {
      const mockReadiness = {
        readinessScore: 85,
        status: "Prime" as const,
        guidance: "High neuromuscular readiness.",
        triggers: ["Restful sleep (+5)"],
        provenance: "calculated_estimate" as const,
      };

      vi.spyOn(useAthloniqStateModule, "useAthloniqState").mockReturnValue({
        profile: {
          fullName: "Test Athlete",
          weightKg: 70,
          heightCm: 175,
          onboardingCompleted: true,
          equipmentConfirmed: true,
          trainingDaysPerWeek: 5,
        } as any,
        equipment: [],
        goals: { calorieTargetKcal: 2200, calorieProvenance: "user_confirmed", proteinTargetG: 110, proteinMinG: 88, proteinMaxG: 121, proteinProvenance: "user_confirmed" } as any,
        updateGoals: vi.fn(),
        todayCheckIn: { date: "2026-10-26", sleepHours: 8.0, sleepQuality: 5, soreness: 1, fatigue: 1, stress: null },
        hasTodayCheckIn: true,
        readiness: mockReadiness,
        submitCheckIn: vi.fn(),
        foodEntries: [],
        getFoodEntriesForDate: () => [],
        workoutSessions: [],
        activitySessions: [],
        bodyMetrics: [],
        isDemoFixtureActive: false,
        loadDemoFixture: vi.fn(),
        resetDemoFixture: vi.fn(),
      } as any);

      render(
        <MemoryRouter>
          <DashboardView onNavigate={vi.fn()} />
        </MemoryRouter>
      );

      const todayCard = screen.getByTestId("today-readiness-card");
      expect(todayCard).toHaveTextContent("Daily Readiness: 85% (Prime)");
      expect(todayCard).not.toHaveTextContent("No check-in yet");
    });
  });

  describe("Item 3: Onboarding captures timezone and saves to preferences repo", () => {
    it("renders detected timezone in Step 5 confirmation card", () => {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      expect(detected).toBeTruthy();

      vi.spyOn(useAthloniqStateModule, "useAthloniqState").mockReturnValue({
        profile: {
          fullName: "Test Athlete",
          onboardingStep: 5,
          onboardingCompleted: false,
          weightKg: 70,
          heightCm: 175,
          equipmentConfirmed: true,
        } as any,
        equipment: [],
        goals: { proteinTargetG: 110, proteinMinG: 88, proteinMaxG: 121, proteinProvenance: "user_confirmed" } as any,
        preferences: { timezone: detected } as any,
        updateProfile: vi.fn(),
        updatePreferences: vi.fn(),
        completeOnboarding: vi.fn(),
      } as any);

      render(
        <MemoryRouter>
          <UnsavedWorkProvider>
            <ProfileView />
          </UnsavedWorkProvider>
        </MemoryRouter>
      );

      const timezoneDisplay = screen.getByTestId("detected-timezone-display");
      expect(timezoneDisplay).toHaveTextContent(detected);

      const timezoneInput = screen.getByTestId("onboarding-timezone-input");
      expect(timezoneInput).toBeInTheDocument();
      expect(screen.getByText(/TIMEZONE CONFIRMATION/i)).toBeInTheDocument();
    });
  });

  describe("Item 4: MealPhotoUploader uses dynamic provider badge", () => {
    it("does not render hardcoded 'Gemini 2.5 Flash' and renders provider mode", () => {
      render(
        <MealPhotoUploader
          isOpen={true}
          onClose={vi.fn()}
          selectedDate="2026-10-26"
          selectedSlot="lunch"
        />
      );

      const badge = screen.getByTestId("vision-provider-badge");
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).not.toContain("Gemini 2.5 Flash");
      expect(screen.queryByText(/Gemini 2.5 Flash/i)).not.toBeInTheDocument();
      expect(badge).toHaveTextContent(/Vision Engine|Mock|Live/i);
    });
  });

  describe("Item 5: gatedProgressionSuggestion exported and contracts honored", () => {
    it("is exported from '@/lib' and applies equipment gating", () => {
      expect(typeof gatedProgressionSuggestion).toBe("function");

      // Unconfirmed equipment must block progression
      const unconfirmed = gatedProgressionSuggestion(
        70,
        2.5,
        false,
        [{ reps: 10, loadKg: 60, rpe: 8, isBodyweight: false }],
        10,
        "Barbell Bench Press",
        "Prime"
      );
      expect(unconfirmed.action).toBe("confirm_equipment_first");
      expect(unconfirmed.newLoadKg).toBeUndefined();

      // Confirmed equipment allows progression when target reps achieved at low RPE
      const confirmed = gatedProgressionSuggestion(
        70,
        2.5,
        true,
        [
          { reps: 10, loadKg: 60, rpe: 7.5, isBodyweight: false },
          { reps: 10, loadKg: 60, rpe: 8.0, isBodyweight: false },
        ],
        10,
        "Barbell Bench Press",
        "Prime"
      );
      expect(confirmed.action).toBe("increase_load");
      expect(confirmed.newLoadKg).toBe(62.5);
    });
  });
});
