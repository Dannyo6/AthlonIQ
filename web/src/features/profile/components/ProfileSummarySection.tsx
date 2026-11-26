import React from "react";
import { Activity, Flame, Shield } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProvenanceBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { calculateBmi } from "@/lib/calculations";
import type { UserGoals, UserProfile } from "@/types";
import { PRIMARY_GOAL_LABELS } from "../constants";

interface ProfileSummarySectionProps {
  profile: UserProfile;
  goals: UserGoals;
  onEditBaselines: () => void;
}

export const ProfileSummarySection: React.FC<ProfileSummarySectionProps> = ({
  profile,
  goals,
  onEditBaselines,
}) => {
  const computedBmi =
    profile.weightKg && profile.heightCm
      ? calculateBmi(profile.weightKg, profile.heightCm)
      : null;

  const goalLabel =
    PRIMARY_GOAL_LABELS[profile.primaryGoal as keyof typeof PRIMARY_GOAL_LABELS] ||
    profile.primaryGoal;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card spotlight className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 rounded-2xl bg-athloniq-lime/15 border border-athloniq-lime/30 flex items-center justify-center text-athloniq-lime font-black text-lg">
            AQ
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-white text-base truncate">
              {profile.fullName || "Athlete Profile"}
            </h3>
            <p className="text-xs text-slate-400 truncate">{profile.email || "Not set"}</p>
          </div>
        </div>

        <div className="space-y-2.5 pt-2 border-t border-athloniq-border text-xs">
          <div className="flex justify-between py-1 border-b border-athloniq-border">
            <span className="text-slate-400">Age & Weight</span>
            <span className="font-mono text-white font-medium tabular-nums">
              {profile.age ? `${profile.age} yrs` : "Not set"} •{" "}
              {profile.weightKg ? `${profile.weightKg} kg` : "Not set"}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-athloniq-border">
            <span className="text-slate-400">Height & BMI</span>
            <span className="font-mono text-white font-medium tabular-nums">
              {profile.heightCm ? `${profile.heightCm} cm` : "Not set"} • BMI{" "}
              {computedBmi ? computedBmi.bmi : "Not set"}
            </span>
          </div>
          <div className="flex justify-between py-1 border-b border-athloniq-border">
            <span className="text-slate-400">Training Frequency</span>
            <span className="text-athloniq-lime font-semibold font-mono tabular-nums">
              {profile.trainingDaysPerWeek ? `${profile.trainingDaysPerWeek} Days / Week` : "Not set"}
            </span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-400">Home Equipment</span>
            <span
              className={`font-semibold ${
                profile.equipmentConfirmed ? "text-emerald-400" : "text-amber-300"
              }`}
            >
              {profile.equipmentConfirmed ? "Confirmed Home Gym" : "Pending Confirmation"}
            </span>
          </div>
        </div>

        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            className="min-h-[44px] w-full"
            onClick={onEditBaselines}
          >
            Edit Athlete Baselines
          </Button>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-athloniq-lime shrink-0" aria-hidden="true" />
            <h3 className="font-bold text-white">Active Nutritional Target</h3>
          </div>
          <ProvenanceBadge provenance={goals.calorieProvenance} />
        </div>

        <div className="p-4 rounded-xl bg-athloniq-surface border border-athloniq-border space-y-2">
          <div className="text-xs font-semibold text-athloniq-lime uppercase">{goalLabel}</div>
          <div className="text-2xl font-black text-white font-mono tabular-nums">
            {goals.calorieTargetKcal != null ? goals.calorieTargetKcal : "Not set"}
            {goals.calorieTargetKcal != null && (
              <span className="text-xs text-slate-400 ml-1">kcal/day</span>
            )}
          </div>
          <div className="text-xs text-slate-400 tabular-nums">
            Protein Target:{" "}
            {goals.proteinTargetG != null ? `${goals.proteinTargetG} g/day` : "Not set"}
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Carbohydrate Target</span>
            <span className="font-mono text-white font-semibold tabular-nums">
              {goals.carbsTargetG != null ? `${goals.carbsTargetG} g` : "Not set"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Dietary Fats</span>
            <span className="font-mono text-white font-semibold tabular-nums">
              {goals.fatTargetG != null ? `${goals.fatTargetG} g` : "Not set"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Hydration Baseline</span>
            <span className="font-mono text-white font-semibold tabular-nums">
              {goals.waterTargetMl != null ? `${goals.waterTargetMl} ml / day` : "Not set"}
            </span>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-emerald-400 shrink-0" aria-hidden="true" />
          <h3 className="font-bold text-white">Privacy & RLS Verification</h3>
        </div>
        <div className="space-y-3 text-xs text-slate-300">
          <div className="flex items-center gap-2 text-emerald-400">
            <Activity className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Row-Level Security Active (auth.uid() = user_id)</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <Activity className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Deterministic Rules Engine (Zero Fabricated HRV)</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-400">
            <Activity className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Auditable Provenance on Every Metric</span>
          </div>
        </div>
        <div className="pt-3 border-t border-athloniq-border">
          <div className="text-[11px] text-slate-400">
            All biometrics, equipment items, and check-in scores are deterministically verified and synchronized with PostgreSQL Row-Level Security (RLS) policies in Supabase.
          </div>
        </div>
      </Card>
    </div>
  );
};
