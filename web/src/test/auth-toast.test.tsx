import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/features/auth/AuthContext";
import { supabase } from "@/lib/supabase";

const AuthProbe: React.FC = () => {
  const { signIn, signOut, authToast } = useAuth();
  return (
    <div>
      <span data-testid="auth-toast">{authToast ? authToast.message : "SILENT"}</span>
      <button type="button" onClick={() => signIn("athlete@domain.com", "secret123")}>
        Explicit Sign In
      </button>
      <button type="button" onClick={() => signOut()}>
        Sign Out
      </button>
    </div>
  );
};

describe("AuthContext Explicit Sign-In Toast Guard (UI-9B)", () => {
  let authCallback: ((event: string, session: any) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    authCallback = null;

    vi.spyOn(supabase.auth, "getSession").mockResolvedValue({
      data: { session: null },
      error: null,
    } as any);

    vi.spyOn(supabase.auth, "onAuthStateChange").mockImplementation((cb: any) => {
      authCallback = cb;
      return {
        data: { subscription: { unsubscribe: vi.fn() } },
      } as any;
    });
  });

  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("stays silent on passive SIGNED_IN events (session restore / tab refocus)", async () => {
    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(authCallback).not.toBeNull();
    act(() => {
      authCallback?.("SIGNED_IN", {
        user: { id: "u-1", email: "athlete@domain.com" },
        access_token: "tok",
      });
    });

    expect(screen.getByTestId("auth-toast")).toHaveTextContent("SILENT");
  });

  it("shows authentication toast once only after an explicit user sign-in action", async () => {
    const mockSession = {
      user: { id: "u-1", email: "athlete@domain.com" },
      access_token: "tok",
    };

    vi.spyOn(supabase.auth, "signInWithPassword").mockImplementation(async () => {
      authCallback?.("SIGNED_IN", mockSession);
      return {
        data: { user: mockSession.user, session: mockSession },
        error: null,
      } as any;
    });

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(screen.getByTestId("auth-toast")).toHaveTextContent("SILENT");

    await act(async () => {
      screen.getByRole("button", { name: "Explicit Sign In" }).click();
    });

    expect(screen.getByTestId("auth-toast")).toHaveTextContent(
      "Successfully authenticated with AthlonIQ OS."
    );
  });
});
