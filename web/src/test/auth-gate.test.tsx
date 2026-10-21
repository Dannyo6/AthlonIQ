import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "@/app/App";
import * as AuthContextModule from "@/features/auth/AuthContext";



// Mock checkBackendHealth
vi.mock("@/services/api", () => ({
  checkBackendHealth: vi.fn().mockResolvedValue({ status: "healthy" }),
}));

describe("Application Session Gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows obsidian loading screen when session is initializing", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: null,
      session: null,
      loading: true,
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPassword: vi.fn(),
      reAuthRequired: false,
      dismissReAuthPrompt: vi.fn(),
      authToast: null,
      clearAuthToast: vi.fn(),
    });

    render(<App />);
    expect(screen.getByText(/INITIALIZING ATHLONIQ OS.../i)).toBeInTheDocument();
  });

  it("gates application and renders SignInView when athlete is unauthenticated", () => {
    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: null,
      session: null,
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

    render(<App />);
    expect(screen.getByText(/ROW-LEVEL SECURITY GATEWAY/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/athlete@domain.com/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign In to AthlonIQ/i })).toBeInTheDocument();
  });

  it("renders authenticated application workspace when session is present", () => {
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

    render(<App />);
    expect(screen.getByText(/Today Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Readiness State/i)).toBeInTheDocument();
  });
});
