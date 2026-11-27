import React from "react";
import { Link } from "react-router-dom";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatTile } from "@/components/ui/StatTile";
import { ProvenanceDot } from "@/components/ui/Badge";
import { Ring } from "@/components/charts/Ring";
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
    <SectionCard
      title="Energy & Nutrition"
      icon={Flame}
      tone="lime"
      provenance={calorieProvenance}
      primaryAction={
        <Link
          to="/nutrition"
          className="surface-elevated tactile-press w-full inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold text-white hover:border-athloniq-lime/40"
        >
          <span>Open Nutrition Tracker</span>
          <ArrowRight className="h-4 w-4 text-athloniq-lime shrink-0" aria-hidden="true" />
        </Link>
      }
    >
      <div className="space-y-4">
        {/* Daily Calories Ring & Hero Summary */}
        <div className="surface-well rounded-xl p-4 space-y-3">
          {hasCalorieTarget ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <Ring
                  value={confirmedCalories}
                  max={calorieTargetKcal}
                  unit="kcal"
                  label="Daily Calories"
                  sublabel={
                    confirmedCalories >= calorieTargetKcal!
                      ? "Daily calorie goal met"
                      : `${calorieTargetKcal! - confirmedCalories} kcal remaining`
                  }
                  tone="lime"
                  size={76}
                  ariaLabel="Daily calorie progress ring"
                />
                <div className="text-right tabular-nums">
                  <div className="text-3xl sm:text-4xl font-bold tracking-tight text-white font-mono">
                    {confirmedCalories}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    / {calorieTargetKcal} kcal
                  </div>
                </div>
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
            <div className="space-y-2">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Daily Calories
              </div>
              <Link
                to="/profile?step=biometrics"
                className="surface-elevated tactile-press p-3.5 rounded-xl border-amber-500/35 hover:border-athloniq-lime/50 text-amber-300 hover:text-amber-200 text-xs font-semibold min-h-[44px] flex items-center justify-between gap-2"
              >
                <span>Calorie target not set — finish onboarding</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-athloniq-lime" aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>

        {/* Protein Progress Well */}
        <div className="surface-well rounded-xl p-3.5 space-y-2">
          <div className="flex flex-wrap justify-between items-center gap-2 text-xs">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-semibold">
              Daily Protein
            </span>
            <ProvenanceDot provenance={proteinProvenance} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums">
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
            Target range: {proteinMinG}–{proteinMaxG} g (1.6–2.2 g/kg
            {weightKg != null ? ` at ${weightKg} kg` : ""})
          </div>
        </div>

        {/* Carbs & Fat StatTiles (neutral numbers) */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <StatTile label="Carbs" value={confirmedCarbs} unit="g" />
          <StatTile label="Fats" value={confirmedFat} unit="g" />
        </div>

        {/* Pending AI items notice */}
        <div className="surface-well px-3 py-2.5 rounded-lg text-[11px] text-slate-400 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-400 shrink-0" aria-hidden="true" />
            <span>Pending meal review:</span>
          </span>
          <span className="font-mono font-bold text-slate-200 tabular-nums">
            {unconfirmedCount} unconfirmed
          </span>
        </div>
      </div>
    </SectionCard>
  );
};
