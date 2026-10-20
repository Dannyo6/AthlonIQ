import React, { useState } from "react";
import { useAuth } from "./AuthContext";
import { BRAND_CONFIG } from "@/config/brand";
import {
  ShieldCheck,
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
    <div className="min-h-screen bg-[#090A0F] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans select-none">
      {/* Dynamic Background Atmosphere */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-lime-400/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Authentication Card */}
      <div className="w-full max-w-md bg-[#12151E] border border-white/[0.08] rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10 backdrop-blur-xl">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-lime-400 text-slate-950 font-black text-xl flex items-center justify-center shadow-[0_0_25px_rgba(163,230,53,0.35)] mb-3">
            AQ
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight leading-none mb-1">
            {BRAND_CONFIG.name}
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Personal AI Performance & Physique OS
          </p>
          <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-lime-400/10 border border-lime-400/30 text-lime-400 text-[10px] font-mono tracking-wider">
            <ShieldCheck className="h-3 w-3" />
            <span>ROW-LEVEL SECURITY GATEWAY</span>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 bg-[#090A0F] p-1 rounded-xl border border-white/[0.06] mb-6">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setErrorMessage(null);
              setCheckEmailMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              mode === "signin"
                ? "bg-[#12151E] text-lime-400 shadow-sm border border-white/[0.06]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setErrorMessage(null);
              setCheckEmailMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              mode === "signup"
                ? "bg-[#12151E] text-lime-400 shadow-sm border border-white/[0.06]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* "Check Your Email" State Screen */}
        {checkEmailMessage ? (
          <div className="text-center py-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="h-12 w-12 rounded-full bg-lime-400/10 border border-lime-400/30 text-lime-400 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Check Your Email</h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              {checkEmailMessage}
            </p>
            <button
              onClick={() => {
                setCheckEmailMessage(null);
                setMode("signin");
              }}
              className="w-full py-2.5 px-4 bg-white/10 hover:bg-white/15 text-white font-semibold text-xs rounded-xl transition-all"
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
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in duration-150 ${
                  errorType === "rate_limit"
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                    : errorType === "network"
                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                }`}
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* Full Name Field (Sign Up Only) */}
            {mode === "signup" && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
                  Athlete Name
                </label>
                <div className="relative">
                  <User className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Mercer"
                    disabled={loading}
                    className="w-full bg-[#090A0F] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-lime-400/60 focus:ring-1 focus:ring-lime-400/40 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="athlete@domain.com"
                  disabled={loading}
                  required
                  className="w-full bg-[#090A0F] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white tabular-nums placeholder-slate-600 focus:outline-none focus:border-lime-400/60 focus:ring-1 focus:ring-lime-400/40 transition-all"
                />
              </div>
            </div>

            {/* Password Field (Sign In & Sign Up) */}
            {mode !== "reset" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
                    Password
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode("reset");
                        setErrorMessage(null);
                      }}
                      className="text-[10px] text-lime-400/90 hover:text-lime-300 transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    disabled={loading}
                    required
                    minLength={6}
                    className="w-full bg-[#090A0F] border border-white/[0.1] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-lime-400/60 focus:ring-1 focus:ring-lime-400/40 transition-all"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-lime-400 hover:bg-lime-300 active:scale-[0.99] text-slate-950 font-bold text-xs rounded-xl shadow-[0_0_20px_rgba(163,230,53,0.25)] flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : mode === "signin" ? (
                <>
                  <span>Sign In to AthlonIQ</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              ) : mode === "signup" ? (
                <>
                  <span>Create Athlete Profile</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Send Password Reset Link</span>
                </>
              )}
            </button>

            {/* Mode Return Link for Password Reset */}
            {mode === "reset" && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setErrorMessage(null);
                  }}
                  className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Return to Sign In</span>
                </button>
              </div>
            )}
          </form>
        )}

        {/* Security & Isolation Disclaimer */}
        <div className="mt-8 pt-4 border-t border-white/[0.06] text-center">
          <p className="text-[10px] text-slate-400 leading-normal">
            Directly authenticated via Supabase Auth with PostgreSQL Row-Level Security.
            Zero public access granted to unauthenticated parties.
          </p>
        </div>
      </div>
    </div>
  );
};
