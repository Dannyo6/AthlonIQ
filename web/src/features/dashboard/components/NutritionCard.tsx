import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { ProvenanceBadge } from "@/components/ui/Badge";
import { Flame, ArrowRight, ShieldAlert } from "lucide-react";
import type { ValueProvenance } from "@/types";

interface NutritionCardProps {
  calorieTargetKcal: number | null;
  calorieProvenance: ValueProvenance;
  proteinTargetG: number;
  proteinMinG: number;
  proteinMaxG: number;
  proteinProvenance: ValueProvenance;
  confirmedCalories: number;
  confirmedProtein: number;
  confirmedCarbs: number;
  confirmedFat: number;
  unconfirmedCount: number;
  weightKg?: number | null;
}

export const NutritionCard: React.FC<NutritionCardProps> = ({
  calorieTargetKcal,
  calorieProvenance,
  proteinTargetG,
  proteinMinG,
  proteinMaxG,
  proteinProvenance,
  confirmedCalories,
  confirmedProtein,
  confirmedCarbs,
  confirmedFat,
  unconfirmedCount,
  weightKg,
}) => {
  const hasCalorieTarget = calorieTargetKcal !== null && calorieTargetKcal > 0;

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between border-b border-athloniq-border pb-3">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-athloniq-lime" />
          <h3 className="font-bold text-white text-base">Energy & Nutrition</h3>
        </div>
        <ProvenanceBadge provenance={calorieProvenance} />
      </div>

      <div className="space-y-4">
        {/* Caloric Intake */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400 font-medium">Daily Caloric Intake</span>
            {hasCalorieTarget && (
              <span className="font-mono text-slate-400 text-[11px] tabular-nums">
                {confirmedCalories >= calorieTargetKcal!
                  ? "Target met"
                  : `${calorieTargetKcal! - confirmedCalories} kcal remaining`}
              </span>
            )}
          </div>

          {hasCalorieTarget ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-mono tabular-nums">
                  {confirmedCalories}
                </span>
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  / {calorieTargetKcal} kcal
                </span>
              </div>
              <div className="w-full bg-athloniq-surface rounded-full h-1.5 mt-2 overflow-hidden border border-athloniq-border">
                <div
                  className="bg-athloniq-lime h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (confirmedCalories / calorieTargetKcal!) * 100
                    )}%`,
                  }}
                />
              </div>
            </>
          ) : (
            <Link
              to="/profile?step=biometrics"
              className="block p-3.5 rounded-xl bg-athloniq-surface hover:bg-athloniq-card-alt border border-athloniq-border hover:border-athloniq-lime/40 text-amber-400 hover:text-amber-300 text-xs font-semibold transition-all min-h-[44px] flex items-center justify-between"
            >
              <span>Calorie target not set — finish onboarding</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
            </Link>
          )}
        </div>

        {/* Protein Section against Provisional Band */}
        <div className="p-3.5 rounded-xl bg-athloniq-surface border border-athloniq-border space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-300 font-medium">Daily Protein Intake</span>
            <ProvenanceBadge provenance={proteinProvenance} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono tabular-nums">
              {confirmedProtein} / {proteinTargetG}
            </span>
            <span className="text-xs text-slate-400 font-mono">g</span>
          </div>
          <div className="w-full bg-athloniq-card rounded-full h-1.5 overflow-hidden border border-athloniq-border">
            <div
              className="bg-athloniq-lime h-full rounded-full transition-all"
              style={{
                width: `${Math.min(
                  100,
                  (confirmedProtein / Math.max(1, proteinTargetG)) * 100
                )}%`,
              }}
            />
          </div>
          <div className="text-[11px] text-slate-400 font-mono tabular-nums">
            Band: {proteinMinG}–{proteinMaxG} g (1.6–2.2 g/kg
            {weightKg != null ? ` of ${weightKg} kg` : ""})
          </div>
        </div>

        {/* Carbs and Fat as logged */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-athloniq-surface border border-athloniq-border">
            <span className="text-[10px] text-slate-400 uppercase font-medium">
              Carbohydrates
            </span>
            <div className="text-base font-bold font-mono text-white mt-0.5 tabular-nums">
              {confirmedCarbs} <span className="text-xs text-slate-400">g</span>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-athloniq-surface border border-athloniq-border">
            <span className="text-[10px] text-slate-400 uppercase font-medium">
              Fats
            </span>
            <div className="text-base font-bold font-mono text-white mt-0.5 tabular-nums">
              {confirmedFat} <span className="text-xs text-slate-400">g</span>
            </div>
          </div>
        </div>

        {/* Unconfirmed AI items count */}
        <div className="p-2.5 rounded-lg bg-athloniq-surface/60 border border-athloniq-border text-[11px] text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span>Unconfirmed AI items:</span>
          </span>
          <span className="font-mono font-bold text-slate-300 tabular-nums">
            {unconfirmedCount} excluded
          </span>
        </div>

        <Link
          to="/nutrition"
          className="w-full inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-white bg-athloniq-surface hover:bg-athloniq-card-alt border border-athloniq-border transition-all active:scale-[0.98]"
        >
          <span>Open Nutrition Tracker</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Card>
  );
};
