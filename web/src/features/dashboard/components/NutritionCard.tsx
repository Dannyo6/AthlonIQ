import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { ProvenanceBadge } from "@/components/ui/Badge";
import { Flame, ArrowRight, ShieldAlert } from "lucide-react";
import type { DisplayBadge, Provenance } from "@/types";

interface NutritionCardProps {
  calorieTargetKcal: number | null;
  calorieProvenance: Provenance | DisplayBadge;
  proteinTargetG: number;
  proteinMinG: number;
  proteinMaxG: number;
  proteinProvenance: Provenance | DisplayBadge;
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
    <Card className="h-full flex flex-col justify-between space-y-4">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-athloniq-border pb-3">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-athloniq-lime shrink-0" aria-hidden="true" />
            <h3 className="font-bold text-white text-base tracking-tight">
              Energy & Nutrition
            </h3>
          </div>
          <ProvenanceBadge provenance={calorieProvenance} />
        </div>

        {/* Hero Caloric Telemetry Well */}
        <div className="surface-well rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Daily Caloric Intake
            </span>
            {hasCalorieTarget && (
              <span className="font-mono text-emerald-400 text-[11px] font-semibold tabular-nums">
                {confirmedCalories >= calorieTargetKcal!
                  ? "Target met"
                  : `${calorieTargetKcal! - confirmedCalories} kcal remaining`}
              </span>
            )}
          </div>

          {hasCalorieTarget ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono tabular-nums">
                  {confirmedCalories}
                </span>
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  / {calorieTargetKcal} kcal
                </span>
              </div>
              <div className="w-full bg-athloniq-card rounded-full h-1.5 overflow-hidden border border-athloniq-border">
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
              className="surface-elevated tactile-press mt-1 p-3.5 rounded-xl border-amber-500/35 hover:border-athloniq-lime/50 text-amber-300 hover:text-amber-200 text-xs font-semibold min-h-[44px] flex items-center justify-between gap-2"
            >
              <span>Calorie target not set — finish onboarding</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-athloniq-lime" aria-hidden="true" />
            </Link>
          )}
        </div>

        {/* Protein Band Telemetry Well */}
        <div className="surface-well rounded-xl p-3.5 space-y-2">
          <div className="flex flex-wrap justify-between items-center gap-2 text-xs">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-semibold">
              Daily Protein Intake
            </span>
            <ProvenanceBadge provenance={proteinProvenance} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-white font-mono tabular-nums">
              {confirmedProtein} / {proteinTargetG}
            </span>
            <span className="text-xs text-slate-400 font-mono">g</span>
          </div>
          <div className="w-full bg-athloniq-card rounded-full h-1.5 overflow-hidden border border-athloniq-border">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all"
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

        {/* Carbs & Fat Telemetry Tiles */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="surface-well p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-semibold">
              Carbohydrates
            </span>
            <div className="text-lg font-black font-mono text-white mt-0.5 tabular-nums">
              {confirmedCarbs} <span className="text-xs text-slate-400 font-medium">g</span>
            </div>
          </div>
          <div className="surface-well p-3 rounded-xl">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-semibold">
              Fats
            </span>
            <div className="text-lg font-black font-mono text-white mt-0.5 tabular-nums">
              {confirmedFat} <span className="text-xs text-slate-400 font-medium">g</span>
            </div>
          </div>
        </div>

        {/* Unconfirmed AI items audit row */}
        <div className="surface-well px-3 py-2.5 rounded-lg text-[11px] text-slate-400 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-400 shrink-0" aria-hidden="true" />
            <span>Unconfirmed AI items:</span>
          </span>
          <span className="font-mono font-bold text-slate-200 tabular-nums">
            {unconfirmedCount} excluded
          </span>
        </div>
      </div>

      <Link
        to="/nutrition"
        className="surface-elevated tactile-press w-full inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold text-white hover:border-athloniq-lime/40"
      >
        <span>Open Nutrition Tracker</span>
        <ArrowRight className="h-4 w-4 text-athloniq-lime shrink-0" aria-hidden="true" />
      </Link>
    </Card>
  );
};
