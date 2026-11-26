import React from "react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge, ProvenanceBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { calculateBmi, calculateEnergyEstimate } from "@/lib/calculations";
import type { OnboardingFormData } from "../constants";

interface ProfileIdentityStepProps {
  register: UseFormRegister<OnboardingFormData>;
  errors: FieldErrors<OnboardingFormData>;
  liveBmi: ReturnType<typeof calculateBmi> | null;
  liveEnergy: ReturnType<typeof calculateEnergyEstimate>;
  onNext: () => void;
}

export const ProfileIdentityStep: React.FC<ProfileIdentityStepProps> = ({
  register,
  errors,
  liveBmi,
  liveEnergy,
  onNext,
}) => {
  return (
    <Card spotlight className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-athloniq-border pb-4">
        <div>
          <span className="text-xs font-mono text-athloniq-lime uppercase font-semibold">
            Step 1 of 5
          </span>
          <h3 className="text-xl font-bold text-white mt-0.5">
            Biometrics & Anthropometry
          </h3>
        </div>
        <ProvenanceBadge provenance="calculated_estimate" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <div className="space-y-1.5">
          <label htmlFor="profile-age" className="text-xs font-semibold text-slate-300 block">
            Age (Years) <span className="text-athloniq-lime">*</span>
          </label>
          <input
            id="profile-age"
            type="number"
            aria-invalid={Boolean(errors.age)}
            aria-describedby={errors.age ? "profile-age-error" : undefined}
            {...register("age")}
            className="min-h-[44px] w-full bg-athloniq-surface border border-athloniq-border rounded-xl px-3.5 py-2.5 text-sm text-white font-mono tabular-nums focus:border-athloniq-lime focus:outline-none"
          />
          {errors.age && (
            <p id="profile-age-error" role="alert" className="text-xs text-rose-400">
              {errors.age.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="profile-height" className="text-xs font-semibold text-slate-300 block">
            Height (cm) <span className="text-athloniq-lime">*</span>
          </label>
          <input
            id="profile-height"
            type="number"
            step="0.5"
            aria-invalid={Boolean(errors.heightCm)}
            aria-describedby={errors.heightCm ? "profile-height-error" : undefined}
            {...register("heightCm")}
            className="min-h-[44px] w-full bg-athloniq-surface border border-athloniq-border rounded-xl px-3.5 py-2.5 text-sm text-white font-mono tabular-nums focus:border-athloniq-lime focus:outline-none"
          />
          {errors.heightCm && (
            <p id="profile-height-error" role="alert" className="text-xs text-rose-400">
              {errors.heightCm.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="profile-weight" className="text-xs font-semibold text-slate-300 block">
            Weight (kg) <span className="text-athloniq-lime">*</span>
          </label>
          <input
            id="profile-weight"
            type="number"
            step="0.1"
            aria-invalid={Boolean(errors.weightKg)}
            aria-describedby={errors.weightKg ? "profile-weight-error" : undefined}
            {...register("weightKg")}
            className="min-h-[44px] w-full bg-athloniq-surface border border-athloniq-border rounded-xl px-3.5 py-2.5 text-sm text-white font-mono tabular-nums focus:border-athloniq-lime focus:outline-none"
          />
          {errors.weightKg && (
            <p id="profile-weight-error" role="alert" className="text-xs text-rose-400">
              {errors.weightKg.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 pt-2">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center gap-2">
            <label htmlFor="profile-sex" className="text-xs font-semibold text-slate-300">
              Biological Sex (Optional)
            </label>
            <span className="text-[10px] text-slate-500 font-mono">Known Unknown</span>
          </div>
          <select
            id="profile-sex"
            {...register("sex")}
            className="min-h-[44px] w-full bg-athloniq-surface border border-athloniq-border rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-athloniq-lime focus:outline-none"
          >
            <option value="unknown">Skip / Unknown</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <p className="text-[11px] text-slate-500">
            If omitted, metabolic equations apply conservative male reference defaults with transparent note.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center gap-2">
            <label htmlFor="profile-waist" className="text-xs font-semibold text-slate-300">
              Waist Circumference (Optional cm)
            </label>
            <span className="text-[10px] text-slate-500 font-mono">Known Unknown</span>
          </div>
          <input
            id="profile-waist"
            type="number"
            placeholder="e.g. 74 cm (or leave empty)"
            aria-invalid={Boolean(errors.waistCm)}
            aria-describedby={errors.waistCm ? "profile-waist-error" : undefined}
            {...register("waistCm")}
            className="min-h-[44px] w-full bg-athloniq-surface border border-athloniq-border rounded-xl px-3.5 py-2.5 text-sm text-white font-mono tabular-nums focus:border-athloniq-lime focus:outline-none"
          />
          {errors.waistCm && (
            <p id="profile-waist-error" role="alert" className="text-xs text-rose-400">
              {errors.waistCm.message}
            </p>
          )}
          <p className="text-[11px] text-slate-500">
            Used for Navy body-fat estimates when available. Optional.
          </p>
        </div>
      </div>

      {/* Live Biometrics & Caloric Target Previews */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-athloniq-surface border border-athloniq-border flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-300">BMI SCREENING</span>
            {liveBmi ? (
              <ProvenanceBadge provenance="calculated_estimate" />
            ) : (
              <Badge variant="neutral">NOT SET</Badge>
            )}
          </div>
          {liveBmi ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-athloniq-lime/15 border border-athloniq-lime/30 flex items-center justify-center text-athloniq-lime font-mono font-bold text-sm tabular-nums">
                {liveBmi.bmi}
              </div>
              <div>
                <div className="text-xs font-semibold text-white flex flex-wrap items-center gap-2">
                  <span className="font-mono tabular-nums">Calculated BMI: {liveBmi.bmi} kg/m²</span>
                  <Badge variant="amber">{liveBmi.category.toUpperCase()}</Badge>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{liveBmi.disclaimer}</p>
              </div>
            </div>
          ) : (
            <div className="text-xs font-semibold text-slate-300">Enter height and weight</div>
          )}
        </div>

        <div className="p-4 rounded-xl bg-athloniq-surface border border-athloniq-border flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-300">ESTIMATED CALORIC TARGET</span>
            {liveEnergy.estimatedKcal ? (
              <ProvenanceBadge provenance="calculated_estimate" />
            ) : (
              <ProvenanceBadge provenance="awaiting_onboarding" />
            )}
          </div>
          {liveEnergy.estimatedKcal ? (
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-athloniq-lime font-mono tabular-nums">
                  {liveEnergy.estimatedKcal}
                </span>
                <span className="text-xs text-slate-400 font-mono">kcal/day</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Deterministic Mifflin-St Jeor calculation with goal surplus.
              </p>
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              Complete biometrics to unlock deterministic caloric target.
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="button" variant="primary" className="min-h-[44px] w-full sm:w-auto" onClick={onNext}>
          Proceed to Goals & Diet <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </Card>
  );
};
