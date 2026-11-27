import React, { Suspense, useState } from "react";
import { useAuth } from "./AuthContext";
import { BRAND_CONFIG } from "@/config/brand";
import { BrandMark } from "@/components/ui/BrandMark";
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  KeyRound,
  RotateCcw,
} from "lucide-react";

const LazyDither = React.lazy(() =>
  import("@/components/ui/Dither").then((m) => ({ default: m.Dither }))
);

type AuthMode = "signin" | "signup" | "reset";

export const SignInView: React.FC = () => {
  const { signIn, signUp, resetPassword } = useAuth();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<"validation" | "rate_limit" | "network" | "auth" | null>(null);
  const [checkEmailMessage, setCheckEmailMessage] = useState<string | null>(null);

  const validateForm = (): boolean => {
    setErrorMessage(null);
    setErrorType(null);

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setErrorMessage("Email address is required.");
      setErrorType("validation");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setErrorMessage("Please enter a valid email address.");
      setErrorType("validation");
      return false;
    }

    if (mode !== "reset") {
      if (!password) {
        setErrorMessage("Password is required.");
        setErrorType("validation");
        return false;
      }
      if (password.length < 6) {
        setErrorMessage("Password must be at least 6 characters.");
        setErrorType("validation");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrorMessage(null);
    setErrorType(null);
    setCheckEmailMessage(null);

    try {
      if (mode === "signin") {
        const { error } = await signIn(email, password);
        if (error) {
          handleAuthError(error);
        }
      } else if (mode === "signup") {
        const { error, needsEmailConfirmation } = await signUp(email, password, fullName);
        if (error) {
          handleAuthError(error);
        } else if (needsEmailConfirmation) {
          setCheckEmailMessage(
            "Account created! Please check your email to confirm your account before signing in."
          );
        }
      } else if (mode === "reset") {
        const { error } = await resetPassword(email);
        if (error) {
          handleAuthError(error);
        } else {
          setCheckEmailMessage(
            "Password reset link sent! Check your inbox to set a new password."
          );
        }
      }
    } catch (err: any) {
      if (!navigator.onLine || err?.message?.includes("fetch") || err?.message?.includes("network")) {
        setErrorMessage("Network failure. Please verify your internet connection and try again.");
        setErrorType("network");
      } else {
        setErrorMessage(err?.message || "An unexpected error occurred.");
        setErrorType("auth");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuthError = (error: any) => {
    const msg = error.message || "Authentication failed.";
    const status = error.status;

    if (status === 429 || msg.toLowerCase().includes("rate limit") || msg.toLowerCase().includes("too many requests")) {
      setErrorMessage("Rate limit reached. Please wait a minute before attempting again.");
      setErrorType("rate_limit");
    } else if (!navigator.onLine || msg.toLowerCase().includes("network") || msg.toLowerCase().includes("failed to fetch")) {
      setErrorMessage("Network failure: Unable to communicate with Supabase. Check your connection.");
      setErrorType("network");
    } else if (msg.toLowerCase().includes("invalid login credentials")) {
      setErrorMessage("Invalid email or password. Please verify your credentials.");
      setErrorType("auth");
    } else {
      setErrorMessage(msg);
      setErrorType("auth");
    }
  };

  return (
    <div className="min-h-screen bg-athloniq-dark text-slate-100 flex flex-col justify-center items-center px-4 py-8 sm:py-12 relative overflow-x-hidden font-sans">
      {/* Scoped Unauthenticated WebGL2 Dither Background (lazy-loaded & unmounted on sign-in) */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
        <Suspense fallback={null}>
          <LazyDither
            baseColor={[0.008, 0.01, 0.015]}
            waveColor={[0.14, 0.36, 0.14]}
            accentColor={[0.46, 0.68, 0.22]}
            ditherMode="bayer"
            colorNum={4}
            pixelSize={2}
            waveSpeed={0.035}
            waveFrequency={2.6}
            waveAmplitude={0.28}
            mouseEffect="reveal"
            mouseRadius={0.28}
            mouseStrength={0.6}
            intro={true}
          />
        </Suspense>
      </div>

      {/* Center Vignette Keeping Card Legibility High */}
      <div
        className="fixed inset-0 z-0 pointer-events-none auth-dither-vignette"
        aria-hidden="true"
      />

      {/* Frosted Obsidian Auth Card */}
      <main className="w-full max-w-md surface-card bg-athloniq-card/85 backdrop-blur-md border border-white/[0.10] rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10 motion-enter">
        {/* Brand Hero */}
        <div className="flex flex-col items-center text-center mb-7">
          <BrandMark size="lg" className="mb-3.5" />
          <h1
            id="page-heading"
            tabIndex={-1}
            className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight leading-none mb-2 focus:outline-none"
          >
            {BRAND_CONFIG.name}
          </h1>
          <p className="text-sm text-slate-300 font-medium">
            Train with precision. Recover with clarity.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div
          role="tablist"
          aria-label="Account mode"
          className="grid grid-cols-2 bg-athloniq-well p-1 rounded-xl border border-white/[0.08] mb-6"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signin"}
            onClick={() => {
              setMode("signin");
              setErrorMessage(null);
              setCheckEmailMessage(null);
            }}
            className={`min-h-[44px] py-2 text-xs font-bold rounded-lg transition-opacity cursor-pointer ${
              mode === "signin"
                ? "bg-athloniq-card text-athloniq-lime shadow-sm border border-athloniq-lime/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            onClick={() => {
              setMode("signup");
              setErrorMessage(null);
              setCheckEmailMessage(null);
            }}
            className={`min-h-[44px] py-2 text-xs font-bold rounded-lg transition-opacity cursor-pointer ${
              mode === "signup"
                ? "bg-athloniq-card text-athloniq-lime shadow-sm border border-athloniq-lime/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* "Check Your Email" State Screen */}
        {checkEmailMessage ? (
          <div className="text-center py-6 motion-enter">
            <div className="h-12 w-12 rounded-full bg-athloniq-lime/10 border border-athloniq-lime/30 text-athloniq-lime flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="font-display text-xl font-bold text-white mb-2">Check Your Email</h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              {checkEmailMessage}
            </p>
            <button
              type="button"
              onClick={() => {
                setCheckEmailMessage(null);
                setMode("signin");
              }}
              className="w-full min-h-[44px] py-2.5 px-4 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-xl transition-opacity cursor-pointer"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          /* Form Screen */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Alert Banner */}
            {errorMessage && (
              <div
                role="alert"
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 motion-enter ${
                  errorType === "rate_limit"
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                    : errorType === "network"
                    ? "bg-athloniq-lime/10 border-athloniq-lime/30 text-athloniq-lime"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                }`}
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* Full Name Field (Sign Up Only) */}
            {mode === "signup" && (
              <div className="space-y-1.5">
                <label
                  htmlFor="signin-fullname"
                  className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block"
                >
                  Athlete Name
                </label>
                <div className="relative">
                  <User
                    className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="signin-fullname"
                    type="text"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Mercer"
                    disabled={loading}
                    className="w-full min-h-[44px] bg-athloniq-well border border-white/[0.12] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-athloniq-lime focus:ring-1 focus:ring-athloniq-lime/40"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="signin-email"
                className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="signin-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="athlete@domain.com"
                  disabled={loading}
                  required
                  aria-invalid={errorType === "validation" && !email.trim() ? true : undefined}
                  className="w-full min-h-[44px] bg-athloniq-well border border-white/[0.12] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white tabular-nums placeholder-slate-500 focus:outline-none focus:border-athloniq-lime focus:ring-1 focus:ring-athloniq-lime/40"
                />
              </div>
            </div>

            {/* Password Field (Sign In & Sign Up) */}
            {mode !== "reset" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="signin-password"
                    className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block"
                  >
                    Password
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode("reset");
                        setErrorMessage(null);
                      }}
                      className="min-h-[44px] px-2 inline-flex items-center text-xs font-medium text-athloniq-lime hover:text-athloniq-lime-hover cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock
                    className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    id="signin-password"
                    type="password"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    disabled={loading}
                    required
                    minLength={6}
                    aria-invalid={
                      errorType === "validation" && password.length < 6 ? true : undefined
                    }
                    className="w-full min-h-[44px] bg-athloniq-well border border-white/[0.12] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-athloniq-lime focus:ring-1 focus:ring-athloniq-lime/40"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="tactile-press w-full min-h-[44px] mt-2 py-3 px-4 bg-athloniq-lime hover:bg-athloniq-lime-hover text-slate-950 font-bold text-sm rounded-xl shadow-glow-lime flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Processing...</span>
                </>
              ) : mode === "signin" ? (
                <>
                  <span>Sign In to AthlonIQ</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              ) : mode === "signup" ? (
                <>
                  <span>Create Athlete Profile</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" aria-hidden="true" />
                  <span>Send Password Reset Link</span>
                </>
              )}
            </button>

            {/* Mode Return Link for Password Reset */}
            {mode === "reset" && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setErrorMessage(null);
                  }}
                  className="min-h-[44px] px-3 text-xs text-slate-300 hover:text-white inline-flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Return to Sign In</span>
                </button>
              </div>
            )}
          </form>
        )}
      </main>
    </div>
  );
};
