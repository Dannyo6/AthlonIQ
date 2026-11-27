import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ error: AuthError | null; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  reAuthRequired: boolean;
  dismissReAuthPrompt: () => void;
  authToast: { message: string; type: "info" | "warning" | "success" } | null;
  clearAuthToast: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const SIGNIN_INTENT_KEY = "athloniq_explicit_signin_intent";

export function markExplicitSignInIntent(): void {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.setItem(SIGNIN_INTENT_KEY, "1");
    }
  } catch {
    // Ignore storage access errors in restricted sandboxes
  }
}

function consumeExplicitSignInIntent(): boolean {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      const present = window.sessionStorage.getItem(SIGNIN_INTENT_KEY) === "1";
      if (present) {
        window.sessionStorage.removeItem(SIGNIN_INTENT_KEY);
      }
      return present;
    }
  } catch {
    // Ignore storage access errors
  }
  return false;
}

function clearExplicitSignInIntent(): void {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.removeItem(SIGNIN_INTENT_KEY);
    }
  } catch {
    // Ignore storage access errors
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [reAuthRequired, setReAuthRequired] = useState<boolean>(false);
  const [authToast, setAuthToast] = useState<{ message: string; type: "info" | "warning" | "success" } | null>(null);

  const clearAuthToast = useCallback(() => setAuthToast(null), []);
  const dismissReAuthPrompt = useCallback(() => setReAuthRequired(false), []);

  useEffect(() => {
    let mounted = true;

    // 1. Initial session load
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn("[AthlonIQ Auth] Initial session fetch error:", error.message);
        }
        if (mounted) {
          setSession(data.session);
          setUser(data.session?.user ?? null);
          setLoading(false);
        }
      } catch (err) {
        console.error("[AthlonIQ Auth] Unexpected error initializing session:", err);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // 2. Subscribe to auth state transitions
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;

      if (event === "SIGNED_IN") {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setReAuthRequired(false);
        if (consumeExplicitSignInIntent()) {
          setAuthToast({ message: "Successfully authenticated with AthlonIQ OS.", type: "success" });
        }
      } else if (event === "SIGNED_OUT") {
        clearExplicitSignInIntent();
        queryClient.clear();
        setSession(null);
        setUser(null);
        setReAuthRequired(false);
        setAuthToast(null);
      } else if (event === "TOKEN_REFRESHED") {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setReAuthRequired(false);
      } else if (event === "USER_UPDATED") {
        setUser(newSession?.user ?? null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    markExplicitSignInIntent();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      clearExplicitSignInIntent();
      return { error };
    }
    setSession(data.session);
    setUser(data.user);
    setReAuthRequired(false);
    return { error: null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    markExplicitSignInIntent();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName?.trim() || null,
        },
      },
    });

    if (error) {
      clearExplicitSignInIntent();
      return { error, needsEmailConfirmation: false };
    }

    // If email confirmation is required by hosted project, session is null
    const needsEmailConfirmation = !data.session;
    if (needsEmailConfirmation) {
      clearExplicitSignInIntent();
    }
    return { error: null, needsEmailConfirmation };
  }, []);

  const signOut = useCallback(async () => {
    clearExplicitSignInIntent();
    queryClient.clear();
    const { error } = await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setReAuthRequired(false);
    setAuthToast(null);
    return { error };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
    });
    return { error };
  }, []);

  const value: AuthContextValue = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    reAuthRequired,
    dismissReAuthPrompt,
    authToast,
    clearAuthToast,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
