import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, fireEvent, waitFor } from "@testing-library/react";
import { App } from "@/app/App";
import { Dither } from "@/components/ui/Dither";
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

  it("gates application and renders redesigned SignInView cleanly when athlete is unauthenticated", async () => {
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
    expect(screen.getByRole("heading", { level: 1, name: "AthlonIQ" })).toBeInTheDocument();
    expect(screen.getByText("Train with precision. Recover with clarity.")).toBeInTheDocument();
    expect(screen.queryByText(/ROW-LEVEL SECURITY GATEWAY/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/PostgreSQL Row-Level Security/i)).not.toBeInTheDocument();

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const signInTab = screen.getByRole("tab", { name: /^Sign In$/i });
    const createTab = screen.getByRole("tab", { name: /^Create Account$/i });
    const submitBtn = screen.getByRole("button", { name: /Sign In to AthlonIQ/i });

    expect(emailInput.className).toContain("min-h-[44px]");
    expect(passwordInput.className).toContain("min-h-[44px]");
    expect(signInTab.className).toContain("min-h-[44px]");
    expect(createTab.className).toContain("min-h-[44px]");
    expect(submitBtn.className).toContain("min-h-[44px]");

    // Switching to Create Account tab keeps SignInView interactive without errors
    fireEvent.click(createTab);
    expect(screen.getByLabelText(/Athlete Name/i).className).toContain("min-h-[44px]");

    // Verify Dither graceful null fallback in JSDOM when webgl2 context returns null
    const { container } = render(<Dither />);
    await waitFor(() => {
      expect(container.querySelector("canvas")).toBeNull();
    });
  });

  it("renders authenticated application workspace when session is present", async () => {
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

    await act(async () => {
      render(<App />);
    });
    expect(await screen.findByText(/Today Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Readiness State/i)).toBeInTheDocument();
  });
});
