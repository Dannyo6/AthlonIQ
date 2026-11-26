import React from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { ChevronLeft, ChevronRight, Flame, Globe, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge, ProvenanceBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type {
  calculateBmi,
  calculateEnergyEstimate,
  calculateProteinReference,
} from "@/lib/calculations";
import type { EquipmentItem } from "@/types";
import { PRIMARY_GOAL_LABELS, type OnboardingFormData } from "../constants";

interface ProfileTrainingStepProps {
  register: UseFormRegister<OnboardingFormData>;
  errors: FieldErrors<OnboardingFormData>;
  onBack: () => void;
  onNext: () => void;
}

export const ProfileTrainingStep: React.FC<ProfileTrainingStepProps> = ({
  register,
  errors,
  onBack,
  onNext,
}) => {
  return (
    <Card spotlight className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-athloniq-border pb-4">
        <div>
          <span className="text-xs font-mono text-athloniq-lime uppercase font-semibold">
            Step 4 of 5
          </span>
          <h3 className="text-xl font-bold text-white mt-0.5">
            Training Split, Badminton/Running & Sleep Baseline
          </h3>
        </div>
        <ProvenanceBadge provenance="user_confirmed" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <div className="space-y-1.5">
          <label htmlFor="profile-training-days" className="text-xs font-semibold text-slate-300 block">
            Weekly Training Days <span className="text-athloniq-lime">*</span>
          </label>
          <input
            id="profile-training-days"
            type="number"
            min="1"
            max="7"
            aria-invalid={Boolean(errors.trainingDaysPerWeek)}
            aria-describedby={errors.trainingDaysPerWeek ? "profile-training-days-error" : undefined}
            {...register("trainingDaysPerWeek")}
            className="min-h-[44px] w-full bg-athloniq-surface border border-athloniq-border rounded-xl px-3.5 py-2.5 text-sm text-white font-mono tabular-nums focus:border-athloniq-lime focus:outline-none"
          />
          {errors.trainingDaysPerWeek && (
            <p id="profile-training-days-error" role="alert" className="text-xs text-rose-400">
              {errors.trainingDaysPerWeek.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="profile-experience-level" className="text-xs font-semibold text-slate-300 block">
            Experience Level <span className="text-athloniq-lime">*</span>
          </label>
          <select
            id="profile-experience-level"
            {...register("experienceLevel")}
            className="min-h-[44px] w-full bg-athloniq-surface border border-athloniq-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none"
          >
            <option value="beginner">Beginner (&lt; 1 Year)</option>
            <option value="intermediate">Intermediate (1-3 Years)</option>
            <option value="advanced">Advanced (3-5 Years)</option>
            <option value="elite">Elite (5+ Years Competitive)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="profile-current-split" className="text-xs font-semibold text-slate-300 block">
            Current Routine Split
          </label>
          <select
            id="profile-current-split"
            {...register("currentSplit")}
            className="min-h-[44px] w-full bg-athloniq-surface border border-athloniq-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none"
          >
            <option value="need_recommendation">Need Recommendation</option>
            <option value="upper_lower">Upper / Lower (4-5 Days)</option>
            <option value="ppl">Push / Pull / Legs (5-6 Days)</option>
            <option value="full_body">Full Body (3-4 Days)</option>
            <option value="bro_split">Body Part Split</option>
            <option value="custom">Custom Split</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 pt-2">
        <div className="space-y-1.5">
          <label htmlFor="profile-badminton-sessions" className="text-xs font-semibold text-slate-300 block">
            Weekly Badminton Sessions
          </label>
          <input
            id="profile-badminton-sessions"
            type="number"
            min="0"
            aria-invalid={Boolean(errors.weeklyBadmintonSessions)}
            {...register("weeklyBadmintonSessions")}
            className="min-h-[44px] w-full bg-athloniq-surface border border-athloniq-border rounded-xl px-3.5 py-2.5 text-sm text-white font-mono tabular-nums focus:border-athloniq-lime focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="profile-running-sessions" className="text-xs font-semibold text-slate-300 block">
            Weekly Running Sessions
          </label>
          <input
            id="profile-running-sessions"
            type="number"
            min="0"
            aria-invalid={Boolean(errors.weeklyRunningSessions)}
            {...register("weeklyRunningSessions")}
            className="min-h-[44px] w-full bg-athloniq-surface border border-athloniq-border rounded-xl px-3.5 py-2.5 text-sm text-white font-mono tabular-nums focus:border-athloniq-lime focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="profile-sleep-baseline" className="text-xs font-semibold text-slate-300 block">
            Typical Sleep Baseline (Hours) <span className="text-athloniq-lime">*</span>
          </label>
          <input
            id="profile-sleep-baseline"
            type="number"
            step="0.5"
            min="4"
            max="14"
            aria-invalid={Boolean(errors.sleepBaselineHours)}
            aria-describedby={errors.sleepBaselineHours ? "profile-sleep-error" : undefined}
            {...register("sleepBaselineHours")}
            className="min-h-[44px] w-full bg-athloniq-surface border border-athloniq-border rounded-xl px-3.5 py-2.5 text-sm text-white font-mono tabular-nums focus:border-athloniq-lime focus:outline-none"
          />
          {errors.sleepBaselineHours && (
            <p id="profile-sleep-error" role="alert" className="text-xs text-rose-400">
              {errors.sleepBaselineHours.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5 pt-2">
        <label htmlFor="profile-exercise-limitations" className="text-xs font-semibold text-slate-300 block">
          Exercise Limitations or Joint Sensitivities (Optional)
        </label>
        <input
          id="profile-exercise-limitations"
          type="text"
          placeholder="e.g. slight right shoulder impingement on flat bench, or none"
          {...register("exerciseLimitations")}
          className="min-h-[44px] w-full bg-athloniq-surface border border-athloniq-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none"
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4">
        <Button type="button" variant="secondary" className="min-h-[44px]" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back
        </Button>
        <Button type="button" variant="primary" className="min-h-[44px]" onClick={onNext}>
          Review & Activate Plan <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </Card>
  );
};

interface ProfileReviewStepProps {
  register: UseFormRegister<OnboardingFormData>;
  errors: FieldErrors<OnboardingFormData>;
  equipment: EquipmentItem[];
  liveBmi: ReturnType<typeof calculateBmi> | null;
  liveProteinRef: ReturnType<typeof calculateProteinReference>;
  liveEnergy: ReturnType<typeof calculateEnergyEstimate>;
  watchedWeight: number | null;
  watchedHeight: number | null;
  watchedAge: number;
  watchedSex: OnboardingFormData["sex"];
  watchedSleep: number;
  watchedGoal: OnboardingFormData["primaryGoal"];
  watchedTrainingDays: number;
  watchedBadminton: number;
  watchedRunning: number;
  watchedTimezone: string;
  detectedTimezone: string;
  onBack: () => void;
}

export const ProfileReviewStep: React.FC<ProfileReviewStepProps> = ({
  register,
  errors,
  equipment,
  liveBmi,
  liveProteinRef,
  liveEnergy,
  watchedWeight,
  watchedHeight,
  watchedAge,
  watchedSex,
  watchedSleep,
  watchedGoal,
  watchedTrainingDays,
  watchedBadminton,
  watchedRunning,
  watchedTimezone,
  detectedTimezone,
  onBack,
}) => {
  const goalBadgeLabel = PRIMARY_GOAL_LABELS[watchedGoal]?.toUpperCase() || "LEAN BULK";

  return (
    <Card spotlight className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-athloniq-border pb-4">
        <div>
          <span className="text-xs font-mono text-athloniq-lime uppercase font-semibold">
            Step 5 of 5
          </span>
          <h3 className="text-xl font-bold text-white mt-0.5">
            Profile Review & Plan Activation
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Verify deterministic anchors and activate your personalized AthlonIQ engine.
          </p>
        </div>
        <ProvenanceBadge provenance="calculated_estimate" />
      </div>

      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-athloniq-surface to-athloniq-card border border-athloniq-lime/30 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-athloniq-lime shrink-0" aria-hidden="true" />
            <span className="font-bold text-white text-base">
              Calibrated Daily Energy Balance
            </span>
          </div>
          <Badge variant="lime">{goalBadgeLabel}</Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3 rounded-xl bg-athloniq-card border border-athloniq-border">
            <div className="text-[11px] text-slate-400 font-medium">Daily Target</div>
            <div className="text-2xl font-black text-athloniq-lime font-mono mt-1 tabular-nums">
              {liveEnergy.estimatedKcal ?? <span className="text-sm text-slate-500">Not set</span>}
              {liveEnergy.estimatedKcal && <span className="text-xs text-slate-400 ml-1">kcal</span>}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-athloniq-card border border-athloniq-border">
            <div className="text-[11px] text-slate-400 font-medium">Protein (1.6-2.2 g/kg)</div>
            <div className="text-2xl font-black text-white font-mono mt-1 tabular-nums">
              {liveProteinRef.proteinTargetG ?? <span className="text-sm text-slate-500">Not set</span>}
              {liveProteinRef.proteinTargetG != null && <span className="text-xs text-slate-400 ml-1">g</span>}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-athloniq-card border border-athloniq-border">
            <div className="text-[11px] text-slate-400 font-medium">Carbohydrates</div>
            <div className="text-2xl font-black text-white font-mono mt-1 tabular-nums">
              {liveEnergy.macros?.carbsG ?? <span className="text-sm text-slate-500">Not set</span>}
              {liveEnergy.macros?.carbsG != null && <span className="text-xs text-slate-400 ml-1">g</span>}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-athloniq-card border border-athloniq-border">
            <div className="text-[11px] text-slate-400 font-medium">Dietary Fats</div>
            <div className="text-2xl font-black text-white font-mono mt-1 tabular-nums">
              {liveEnergy.macros?.fatG ?? <span className="text-sm text-slate-500">Not set</span>}
              {liveEnergy.macros?.fatG != null && <span className="text-xs text-slate-400 ml-1">g</span>}
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">{liveEnergy.notes}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-athloniq-surface border border-athloniq-border space-y-2">
          <div className="flex justify-between items-center border-b border-athloniq-border pb-1.5 font-bold text-slate-300">
            <span>BIOMETRICS</span>
            <ProvenanceBadge provenance="calculated_estimate" />
          </div>
          <div className="flex justify-between gap-2 py-1">
            <span className="text-slate-400">Weight & Height</span>
            <span className="font-mono text-white font-semibold tabular-nums text-right">
              {watchedWeight ? `${watchedWeight} kg` : "Not set"} /{" "}
              {watchedHeight ? `${watchedHeight} cm` : "Not set"} (BMI{" "}
              {liveBmi ? liveBmi.bmi : "Not set"})
            </span>
          </div>
          <div className="flex justify-between gap-2 py-1">
            <span className="text-slate-400">Age & Biological Sex</span>
            <span className="font-mono text-white font-semibold tabular-nums text-right">
              {watchedAge} yrs • {watchedSex || "Unknown / Screening Default"}
            </span>
          </div>
          <div className="flex justify-between gap-2 py-1">
            <span className="text-slate-400">Sleep Baseline</span>
            <span className="font-mono text-white font-semibold tabular-nums text-right">
              {watchedSleep} hours / night
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-athloniq-surface border border-athloniq-border space-y-2">
          <div className="flex justify-between items-center border-b border-athloniq-border pb-1.5 font-bold text-slate-300">
            <span>EQUIPMENT & SCOPE</span>
            <ProvenanceBadge provenance="user_confirmed" />
          </div>
          <div className="flex justify-between gap-2 py-1">
            <span className="text-slate-400">Home Gym Equipment</span>
            <span className="font-mono text-emerald-400 font-semibold tabular-nums text-right">
              {equipment.filter((i) => i.isConfirmed).length}/{equipment.length} Items Confirmed
            </span>
          </div>
          <div className="flex justify-between gap-2 py-1">
            <span className="text-slate-400">Weekly Lifting & Sports</span>
            <span className="font-mono text-white font-semibold tabular-nums text-right">
              {watchedTrainingDays || 0} Days Lift • {watchedBadminton ?? 0} Badminton •{" "}
              {watchedRunning ?? 0} Run
            </span>
          </div>
          <div className="flex justify-between gap-2 py-1">
            <span className="text-slate-400">Training Scope</span>
            <span className="font-mono text-white font-semibold text-right">
              Gym • Calisthenics • Badminton • Running
            </span>
          </div>
        </div>
      </div>

      {/* Timezone Confirmation Card */}
      <div className="p-4 rounded-xl bg-athloniq-surface border border-athloniq-border space-y-2">
        <div className="flex flex-wrap justify-between items-center gap-2 border-b border-athloniq-border pb-1.5 font-bold text-slate-300">
          <span className="flex items-center gap-1.5 text-xs">
            <Globe className="h-4 w-4 text-athloniq-lime shrink-0" aria-hidden="true" />
            TIMEZONE CONFIRMATION
          </span>
          <Badge variant="lime">CAPTURED FROM DEVICE</Badge>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <div className="text-xs text-slate-400">Detected IANA Timezone:</div>
            <div
              className="text-xs font-mono text-white font-bold mt-0.5"
              data-testid="detected-timezone-display"
            >
              {watchedTimezone || detectedTimezone}
            </div>
          </div>
          <div className="w-full sm:w-64 space-y-1">
            <label htmlFor="profile-timezone" className="text-[11px] text-slate-400 font-medium block">
              IANA Timezone
            </label>
            <input
              id="profile-timezone"
              type="text"
              aria-invalid={Boolean(errors.timezone)}
              aria-describedby={errors.timezone ? "profile-timezone-error" : undefined}
              {...register("timezone")}
              data-testid="onboarding-timezone-input"
              className="min-h-[44px] w-full bg-athloniq-card border border-athloniq-border rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-athloniq-lime focus:outline-none"
              placeholder="e.g. Asia/Kolkata, America/New_York"
            />
            {errors.timezone && (
              <p id="profile-timezone-error" role="alert" className="text-xs text-rose-400">
                {errors.timezone.message}
              </p>
            )}
          </div>
        </div>
        <p className="text-[11px] text-slate-400">
          AthlonIQ computes evaluation dates and daily boundaries server-side from your confirmed timezone.
        </p>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4">
        <Button type="button" variant="secondary" className="min-h-[44px]" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back
        </Button>

        <Button type="submit" variant="primary" size="lg" className="min-h-[48px]">
          <Sparkles className="h-5 w-5" aria-hidden="true" /> Activate Personalized Athlete Plan
        </Button>
      </div>
    </Card>
  );
};
