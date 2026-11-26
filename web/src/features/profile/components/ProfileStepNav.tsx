import React from "react";
import { CheckCircle2 } from "lucide-react";
import { PROFILE_WIZARD_STEPS } from "../constants";

interface ProfileStepNavProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
}

const PROGRESS_WIDTH_CLASSES: Record<number, string> = {
  1: "w-1/5",
  2: "w-2/5",
  3: "w-3/5",
  4: "w-4/5",
  5: "w-full",
};

export const ProfileStepNav: React.FC<ProfileStepNavProps> = ({
  currentStep,
  onSelectStep,
}) => {
  const progressPercent = Math.round((currentStep / PROFILE_WIZARD_STEPS.length) * 100);
  const progressWidthClass = PROGRESS_WIDTH_CLASSES[currentStep] || "w-1/5";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-mono text-slate-400">
        <span className="tabular-nums">
          Step {currentStep} of {PROFILE_WIZARD_STEPS.length}
        </span>
        <span className="text-athloniq-lime font-semibold tabular-nums">
          {progressPercent}% Setup Path
        </span>
      </div>

      <div
        role="progressbar"
        aria-label="Onboarding wizard progress"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={PROFILE_WIZARD_STEPS.length}
        className="h-1.5 w-full rounded-full bg-athloniq-surface overflow-hidden border border-athloniq-border"
      >
        <div className={`h-full bg-athloniq-lime transition-all duration-300 ${progressWidthClass}`} />
      </div>

      <nav aria-label="Onboarding steps" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {PROFILE_WIZARD_STEPS.map((s) => {
          const isPast = currentStep > s.num;
          const isCurrent = currentStep === s.num;
          return (
            <button
              key={s.num}
              type="button"
              aria-current={isCurrent ? "step" : undefined}
              onClick={() => onSelectStep(s.num)}
              className={`min-h-[44px] px-3 py-2.5 rounded-xl border text-left transition-all focus:outline-none focus:ring-2 focus:ring-athloniq-lime/50 ${
                isCurrent
                  ? "bg-athloniq-lime/10 border-athloniq-lime text-white shadow-glow-lime"
                  : isPast
                  ? "bg-athloniq-card border-emerald-500/40 text-emerald-300 hover:border-emerald-400/60"
                  : "bg-athloniq-card border-athloniq-border text-slate-400 hover:text-slate-200 hover:border-slate-600"
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono font-bold tabular-nums">
                <span>STEP 0{s.num}</span>
                {isPast && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                )}
              </div>
              <div className="text-xs font-semibold mt-0.5 truncate">{s.label}</div>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
