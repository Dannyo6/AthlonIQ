import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { App } from "@/app/App";
import { DashboardHeader } from "@/features/dashboard/components/DashboardHeader";
import { ProgressHeaderActions } from "@/features/progress/components/ProgressHeaderActions";
import * as AuthContextModule from "@/features/auth/AuthContext";
import * as AthloniqStateModule from "@/hooks/useAthloniqState";

vi.mock("@/services/api", () => ({
  checkBackendHealth: vi.fn().mockResolvedValue({ status: "healthy" }),
}));

describe("Demo Fixture Environment Gate (VITE_ENABLE_DEMO)", () => {
  const mockUser = {
    id: "athlete-user-123",
    email: "athlete@domain.com",
    app_metadata: {},
    user_metadata: { full_name: "Verified Athlete" },
    aud: "authenticated",
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: mockUser as any,
      session: { user: mockUser } as any,
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
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("hides demo fixture controls across AppShell, DashboardHeader, and ProgressHeaderActions by default", async () => {
    vi.spyOn(AthloniqStateModule, "useAthloniqState").mockReturnValue({
      profile: {
        id: mockUser.id,
        email: mockUser.email,
        fullName: "Verified Athlete",
        onboardingCompleted: true,
        equipmentConfirmed: true,
      } as any,
      equipment: [],
      goals: {
        calorieTargetKcal: 2400,
        calorieProvenance: "user_confirmed",
        proteinTargetG: 140,
        proteinMinG: 110,
        proteinMaxG: 160,
        proteinProvenance: "user_confirmed",
      } as any,
      preferences: { timezone: "Asia/Kolkata" } as any,
      todayCheckIn: {
        date: "2026-11-27",
        sleepHours: null,
        sleepQuality: null,
        soreness: null,
        fatigue: null,
        stress: null,
      },
      hasTodayCheckIn: false,
      readiness: null,
      foodEntries: [],
      getFoodEntriesForDate: () => [],
      workoutSessions: [],
      activitySessions: [],
      bodyMetrics: [],
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

    const { unmount } = render(
      <MemoryRouter initialEntries={["/today"]}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Today Dashboard/i)).toBeInTheDocument();
    });

    expect(screen.queryByRole("button", { name: /Load 14d Demo Fixture/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /14d Demo/i })).not.toBeInTheDocument();
    unmount();

    render(
      <DashboardHeader
        fullName="Test Athlete"
        isDemoFixtureActive={false}
        onLoadDemoFixture={vi.fn()}
        onResetDemoFixture={vi.fn()}
      />
    );
    expect(screen.queryByRole("button", { name: /14d Demo Fixture/i })).not.toBeInTheDocument();

    render(
      <ProgressHeaderActions
        isDemoFixtureActive={false}
        appliedTargetNotice={null}
        onToggleDemo={vi.fn()}
        onTogglePhotoForm={vi.fn()}
        onToggleWeightForm={vi.fn()}
      />
    );
    expect(screen.queryByRole("button", { name: /Load 14d Demo Fixture/i })).not.toBeInTheDocument();
  });

  it("reveals demo fixture controls only when VITE_ENABLE_DEMO is 'true'", () => {
    vi.stubEnv("VITE_ENABLE_DEMO", "true");

    render(
      <DashboardHeader
        fullName="Test Athlete"
        isDemoFixtureActive={false}
        onLoadDemoFixture={vi.fn()}
        onResetDemoFixture={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /14d Demo Fixture/i }).className).toMatch(
      /min-h-\[44px\]/
    );

    render(
      <ProgressHeaderActions
        isDemoFixtureActive={false}
        appliedTargetNotice={null}
        onToggleDemo={vi.fn()}
        onTogglePhotoForm={vi.fn()}
        onToggleWeightForm={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /Load 14d Demo Fixture/i }).className).toMatch(
      /min-h-\[44px\]/
    );
  });
});
