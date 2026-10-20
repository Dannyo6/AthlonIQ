import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AthloniqProvider, useAthloniqState } from "@/hooks/useAthloniqState";
import * as AuthContextModule from "@/features/auth/AuthContext";
import { foodEntriesRepo } from "@/services/repo/foodEntriesRepo";

const mockValidProfileRow = {
  id: "019488a0-7f28-7a54-8e47-cf42861e69ab",
  user_id: "019488a0-7f28-7a54-8e47-cf42861e69ab",
  email: "athlete@domain.com",
  full_name: "Verified Athlete",
  age: 20,
  height_cm: 173,
  weight_kg: 55.0,
  dietary_pattern: "nonvegetarian",
  primary_goal: "lean_bulk",
  training_scope: ["gym", "calisthenics", "badminton", "running"],
  training_days_per_week: 5,
  training_environment: "home_gym",
  calorie_tracking_habit: "rough_estimates",
  sex: null,
  waist_cm: null,
  experience_level: null,
  current_split: null,
  weekly_badminton_sessions: null,
  weekly_running_sessions: null,
  sleep_baseline_hours: null,
  exercise_limitations: null,
  onboarding_step: 1,
  onboarding_completed: false,
  equipment_confirmed: false,
};

const createMockQuery = () => {
  const query: any = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: mockValidProfileRow, error: null }),
    then: (resolve: any, reject?: any) => Promise.resolve({ data: [], error: null }).then(resolve, reject),
  };
  query.select.mockReturnValue(query);
  query.insert.mockReturnValue(query);
  query.update.mockReturnValue(query);
  query.upsert.mockReturnValue(query);
  query.delete.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.in.mockReturnValue(query);
  query.order.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  return query;
};

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn(() => createMockQuery()),
  },
}));

describe("Optimistic Updates and Rollback Behavior", () => {
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

  it("applies optimistic update immediately, then rolls back and shows AthlonToast on repository failure", async () => {
    // Force foodEntriesRepo.createEntry to fail
    vi.spyOn(foodEntriesRepo, "createEntry").mockRejectedValue(
      new Error("Database connection dropped (Network Failure)")
    );

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AthloniqProvider>{children}</AthloniqProvider>
    );

    const { result } = renderHook(() => useAthloniqState(), { wrapper });

    // Wait for initial cloud state loading to settle
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const initialLength = result.current.foodEntries.length;

    // Trigger optimistic food addition
    await act(async () => {
      result.current.addFoodEntry({
        loggedDate: "2026-10-20",
        mealSlot: "breakfast",
        foodName: "Greek Yogurt & Berries",
        quantity: 1,
        servingLabel: "bowl",
        caloriesKcal: 220,
        proteinG: 22,
        carbsG: 18,
        fatG: 4,
        provenance: "manual_entry",
        isConfirmed: true,
      });
    });

    // Expect state to be rolled back to original count
    expect(result.current.foodEntries.length).toBe(initialLength);

    // Expect syncStatus to be marked as failed
    expect(result.current.syncStatus).toBe("failed");
    expect(result.current.syncError).toContain("Database connection dropped");

    // Expect warning toast to be displayed to athlete
    expect(result.current.toast).not.toBeNull();
    expect(result.current.toast?.type).toBe("warning");
    expect(result.current.toast?.message).toContain("Rolled back");
  });

  it("blocks repo writes completely when demo fixture is active", async () => {
    const createSpy = vi.spyOn(foodEntriesRepo, "createEntry").mockResolvedValue({
      id: "demo-created-id",
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AthloniqProvider>{children}</AthloniqProvider>
    );

    const { result } = renderHook(() => useAthloniqState(), { wrapper });

    // Activate 14-day demo fixture
    act(() => {
      result.current.loadDemoFixture();
    });
    expect(result.current.isDemoFixtureActive).toBe(true);

    // Add entry while in demo mode
    await act(async () => {
      result.current.addFoodEntry({
        loggedDate: "2026-10-20",
        mealSlot: "lunch",
        foodName: "Demo Grilled Chicken",
        quantity: 1,
        servingLabel: "breast",
        caloriesKcal: 300,
        proteinG: 45,
        carbsG: 0,
        fatG: 6,
        provenance: "manual_entry",
        isConfirmed: true,
      });
    });

    // The remote repository must NEVER be called while in demo mode
    expect(createSpy).not.toHaveBeenCalled();
  });
});
