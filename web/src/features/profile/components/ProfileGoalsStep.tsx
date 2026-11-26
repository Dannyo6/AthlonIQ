import React from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { ChevronLeft, ChevronRight, Utensils } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProvenanceBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { calculateProteinReference } from "@/lib/calculations";
import {
  DIETARY_PATTERN_OPTIONS,
  PRIMARY_GOAL_LABELS,
  type OnboardingFormData,
} from "../constants";

interface ProfileGoalsStepProps {
  register: UseFormRegister<OnboardingFormData>;
  errors: FieldErrors<OnboardingFormData>;
  watchedWeight: number | null;
  liveProteinRef: ReturnType<typeof calculateProteinReference>;
  onBack: () => void;
  onNext: () => void;
}

export const ProfileGoalsStep: React.FC<ProfileGoalsStepProps> = ({
  register,
  errors,
  watchedWeight,
  liveProteinRef,
  onBack,
  onNext,
}) => {
  return (
    <Card spotlight className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-athloniq-border pb-4">
        <div>
          <span className="text-xs font-mono text-athloniq-lime uppercase font-semibold">
            Step 2 of 5
          </span>
          <h3 className="text-xl font-bold text-white mt-0.5">
            Goals & Dietary Profile
          </h3>
        </div>
        <ProvenanceBadge provenance="provisional_default" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        <div className="space-y-1.5">
          <label htmlFor="profile-primary-goal" className="text-xs font-semibold text-slate-300 block">
            Primary Physique & Performance Goal
          </label>
          <select
            id="profile-primary-goal"
            {...register("primaryGoal")}
            className="min-h-[44px] w-full bg-athloniq-surface border border-athloniq-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none"
          >
            {Object.entries(PRIMARY_GOAL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="profile-dietary-pattern" className="text-xs font-semibold text-slate-300 block">
            Dietary Pattern
          </label>
          <select
            id="profile-dietary-pattern"
            {...register("dietaryPattern")}
            className="min-h-[44px] w-full bg-athloniq-surface border border-athloniq-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none"
          >
            {DIETARY_PATTERN_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-athloniq-surface border border-athloniq-border space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Utensils className="h-4 w-4 text-athloniq-lime shrink-0" aria-hidden="true" />
              Daily Protein Reference Target
            </h4>
            <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
              Scientific Range for {watchedWeight ? `${watchedWeight} kg` : "athlete"}:{" "}
              {liveProteinRef.proteinMinG}–{liveProteinRef.proteinMaxG} g/day (1.6–2.2 g/kg)
            </p>
          </div>
          <ProvenanceBadge provenance={liveProteinRef.provenance} />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
          <div className="w-full sm:w-48 space-y-1">
            <label htmlFor="profile-custom-protein" className="text-[11px] text-slate-400 font-medium block">
              Daily Protein Target (g)
            </label>
            <input
              id="profile-custom-protein"
              type="number"
              aria-invalid={Boolean(errors.customProteinG)}
              aria-describedby={errors.customProteinG ? "profile-protein-error" : undefined}
              {...register("customProteinG")}
              className="min-h-[44px] w-full bg-athloniq-card border border-athloniq-border rounded-xl px-3 py-2 text-sm text-white font-mono font-bold tabular-nums focus:border-athloniq-lime focus:outline-none"
            />
            {errors.customProteinG && (
              <p id="profile-protein-error" role="alert" className="text-xs text-rose-400">
                {errors.customProteinG.message}
              </p>
            )}
          </div>
          <span className="text-xs text-slate-400">
            Default is 110 g (2.0 g/kg). You can customize within evidence range.
          </span>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 pt-4">
        <Button type="button" variant="secondary" className="min-h-[44px]" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Back
        </Button>
        <Button type="button" variant="primary" className="min-h-[44px]" onClick={onNext}>
          Verify Equipment <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </Card>
  );
};
