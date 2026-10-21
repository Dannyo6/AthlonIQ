import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useNavigate } from "react-router-dom";
import { App } from "@/app/App";
import * as AuthContextModule from "@/features/auth/AuthContext";
import { AthloniqProvider } from "@/hooks/useAthloniqState";
import { RouteLoadingSkeleton } from "@/components/ui/RouteLoadingSkeleton";
import {
  UnsavedWorkProvider,
  useUnsavedWork,
} from "@/features/navigation/UnsavedWorkContext";
import { GuardedNavLink } from "@/features/navigation/GuardedNavLink";

// Mock checkBackendHealth
vi.mock("@/services/api", () => ({
  checkBackendHealth: vi.fn().mockResolvedValue({ status: "healthy" }),
}));

const mockUser = {
  id: "athlete-user-123",
  email: "athlete@domain.com",
  app_metadata: {},
  user_metadata: { full_name: "Verified Athlete" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
};

const mockSession = {
  access_token: "mock-jwt-access-token",
  token_type: "bearer",
  expires_in: 3600,
  refresh_token: "mock-refresh-token",
  user: mockUser as any,
};

describe("AthlonIQ Routing, Code Splitting & Unsaved Guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: mockUser as any,
      session: mockSession as any,
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

  it("renders /today view with Today Dashboard heading", async () => {
    render(
      <MemoryRouter initialEntries={["/today"]}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Today Dashboard/i)).toBeInTheDocument();
      expect(screen.getByText(/Readiness State/i)).toBeInTheDocument();
    });
  });

  it("redirects '/' root path to '/today'", async () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Today Dashboard/i)).toBeInTheDocument();
      expect(document.title).toContain("Today Dashboard");
    });
  });

  it("renders /nutrition view directly", async () => {
    render(
      <MemoryRouter initialEntries={["/nutrition"]}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Indian Nutrition & Energy Balance/i)).toBeInTheDocument();
      expect(document.title).toContain("Nutrition & Energy");
    });
  });

  it("renders /workouts view directly", async () => {
    render(
      <MemoryRouter initialEntries={["/workouts"]}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Training & Progression Engine/i)).toBeInTheDocument();
      expect(document.title).toContain("Training & Equipment");
    });
  });

  it("renders /activities view directly", async () => {
    render(
      <MemoryRouter initialEntries={["/activities"]}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Activities & Cardio/i)).toBeInTheDocument();
      expect(document.title).toContain("Activities & Cardio");
    });
  });

  it("renders /recovery view directly", async () => {
    render(
      <MemoryRouter initialEntries={["/recovery"]}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Recovery & Readiness/i)).toBeInTheDocument();
      expect(document.title).toContain("Recovery & Readiness");
    });
  });

  it("renders /progress view directly", async () => {
    render(
      <MemoryRouter initialEntries={["/progress"]}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Physique Analytics/i)).toBeInTheDocument();
      expect(document.title).toContain("Physique Analytics");
    });
  });

  it("renders /coach view directly", async () => {
    render(
      <MemoryRouter initialEntries={["/coach"]}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/AI Performance Coach/i)).toBeInTheDocument();
      expect(document.title).toContain("AI Performance Coach");
    });
  });

  it("renders /profile view directly", async () => {
    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Profile & Setup/i)).toBeInTheDocument();
      expect(document.title).toContain("Profile & Setup");
    });
  });

  it("renders designed 404 page for unknown paths with link to /today", async () => {
    render(
      <MemoryRouter initialEntries={["/non-existent-subpath"]}>
        <App />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/404 Out of Bounds/i)).toBeInTheDocument();
      expect(screen.getByText(/Page Not Found/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Return to Today Dashboard/i })).toBeInTheDocument();
    });
  });

  it("renders RouteLoadingSkeleton fallback while lazy component is loading", () => {
    render(<RouteLoadingSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading view content...");
  });

  it("blocks navigation when unsaved input is present and shows confirm dialog", async () => {
    const TestComponent = () => {
      const { setFormDirty, isDirty } = useUnsavedWork();
      return (
        <div>
          <button
            type="button"
            onClick={() => setFormDirty("meal-entry", true, "Meal Entry Form")}
          >
            Type Dirty Meal
          </button>
          <div data-testid="dirty-status">{isDirty ? "DIRTY" : "CLEAN"}</div>
          <GuardedNavLink to="/workouts">Go to Workouts</GuardedNavLink>
        </div>
      );
    };

    render(
      <MemoryRouter initialEntries={["/nutrition"]}>
        <UnsavedWorkProvider>
          <Routes>
            <Route path="/nutrition" element={<TestComponent />} />
            <Route path="/workouts" element={<div>Workouts Screen</div>} />
          </Routes>
        </UnsavedWorkProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId("dirty-status").textContent).toBe("CLEAN");

    // Make dirty
    fireEvent.click(screen.getByText("Type Dirty Meal"));
    expect(screen.getByTestId("dirty-status").textContent).toBe("DIRTY");

    // Click link to navigate
    fireEvent.click(screen.getByText("Go to Workouts"));

    // Modal must appear
    expect(screen.getByText(/Unsaved Work in Progress/i)).toBeInTheDocument();
    expect(screen.getByText(/Meal Entry Form/i)).toBeInTheDocument();

    // Workouts screen should NOT be visible yet
    expect(screen.queryByText("Workouts Screen")).not.toBeInTheDocument();

    // Click "Stay & Keep Editing"
    fireEvent.click(screen.getByText("Stay & Keep Editing"));
    expect(screen.queryByText(/Unsaved Work in Progress/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Workouts Screen")).not.toBeInTheDocument();

    // Click link again and this time click "Discard & Leave"
    fireEvent.click(screen.getByText("Go to Workouts"));
    expect(screen.getByText(/Unsaved Work in Progress/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Discard & Leave"));
    await waitFor(() => {
      expect(screen.getByText("Workouts Screen")).toBeInTheDocument();
    });
  });

  it("allows immediate navigation when no unsaved input is present", async () => {
    const TestComponent = () => {
      return (
        <div>
          <GuardedNavLink to="/workouts">Go Clean</GuardedNavLink>
        </div>
      );
    };

    render(
      <MemoryRouter initialEntries={["/today"]}>
        <UnsavedWorkProvider>
          <Routes>
            <Route path="/today" element={<TestComponent />} />
            <Route path="/workouts" element={<div>Workouts Loaded Immediately</div>} />
          </Routes>
        </UnsavedWorkProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("Go Clean"));
    expect(screen.queryByText(/Unsaved Work in Progress/i)).not.toBeInTheDocument();
    expect(screen.getByText("Workouts Loaded Immediately")).toBeInTheDocument();
  });
});
