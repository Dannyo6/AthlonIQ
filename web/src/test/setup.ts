import "@testing-library/jest-dom";
import { vi } from "vitest";

// Standard jsdom window.matchMedia polyfill
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

const defaultProfileRow = {
  id: "019488a0-7f28-7a54-8e47-cf42861e69ab",
  user_id: "019488a0-7f28-7a54-8e47-cf42861e69ab",
  email: "athlete@athloniq.io",
  full_name: "Mock Athlete",
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

// Hermetic Supabase Mock: prevents any test from depending on web/.env.local
vi.mock("@/lib/supabase", () => {
  const createQueryBuilder = () => {
    const builder: any = {
      select: vi.fn().mockImplementation(() => builder),
      insert: vi.fn().mockImplementation(() => builder),
      update: vi.fn().mockImplementation(() => builder),
      delete: vi.fn().mockImplementation(() => builder),
      upsert: vi.fn().mockImplementation(() => builder),
      eq: vi.fn().mockImplementation(() => builder),
      in: vi.fn().mockImplementation(() => builder),
      order: vi.fn().mockImplementation(() => builder),
      limit: vi.fn().mockImplementation(() => builder),
      single: vi.fn().mockResolvedValue({ data: defaultProfileRow, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: (resolve: any) => Promise.resolve({ data: [], error: null }).then(resolve),
    };
    return builder;
  };

  return {
    supabase: {
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn().mockReturnValue({
          data: { subscription: { unsubscribe: vi.fn() } },
        }),
        signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
        signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        resetPasswordForEmail: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
      from: vi.fn().mockImplementation(() => createQueryBuilder()),
      storage: {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({ data: { path: "mock-path" }, error: null }),
          createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://mock.storage/signed" }, error: null }),
          getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://mock.storage/public" } }),
        }),
      },
    },
  };
});
