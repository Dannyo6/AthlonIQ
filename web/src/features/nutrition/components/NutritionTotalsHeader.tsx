import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Badge, ProvenanceBadge } from "@/components/ui/Badge";
import { AlertCircle } from "lucide-react";
import { ValueProvenance } from "@/types";

interface NutritionTotalsHeaderProps {
  confirmedTotals: {
    caloriesKcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    entryCount: number;
  };
  unconfirmedCalories: number;
  unconfirmedCount: number;
  calorieTargetKcal: number | null;
  calorieProvenance?: ValueProvenance;
  proteinTargetG: number | null;
  proteinMinG: number | null;
  proteinMaxG: number | null;
  proteinProvenance?: ValueProvenance;
  carbsTargetG?: number | null;
  fatTargetG?: number | null;
  isLoading?: boolean;
}

export const NutritionTotalsHeader: React.FC<NutritionTotalsHeaderProps> = ({
  confirmedTotals,
  unconfirmedCalories,
  unconfirmedCount,
  calorieTargetKcal,
  calorieProvenance = "provisional_default",
  proteinTargetG,
  proteinMinG,
  proteinMaxG,
  proteinProvenance = "provisional_default",
  carbsTargetG = null,
  fatTargetG = null,
  isLoading = false,
}) => {
  const hasCalorieTarget = calorieTargetKcal !== null && calorieTargetKcal > 0;

  const pct = (v: number, t: number) =>
    Math.min(100, t > 0 ? Math.round((v / t) * 100) : 0);

  if (isLoading) {
    return (
      <Card className="space-y-4 animate-pulse">
        <div className="h-6 w-48 bg-athloniq-surface rounded-lg" />
        <div className="h-8 w-32 bg-athloniq-surface rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 bg-athloniq-surface rounded-xl" />
          <div className="h-24 bg-athloniq-surface rounded-xl" />
          <div className="h-24 bg-athloniq-surface rounded-xl" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Onboarding Gate Banner when target uncalibrated */}
      {!hasCalorieTarget && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Caloric Target Gated Awaiting Onboarding</span>
                <ProvenanceBadge provenance="awaiting_onboarding" />
              </div>
              <p className="text-xs text-amber-300/90 leading-relaxed mt-0.5">
                Complete the 5-step onboarding to calibrate your TDEE and +250 kcal lean-bulk surplus.
              </p>
            </div>
          </div>
          <Badge variant="amber">AWAITING ONBOARDING</Badge>
        </div>
      )}

      {/* Main Totals Card */}
      <Card className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-athloniq-border pb-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-athloniq-lime uppercase font-mono font-bold">
                Confirmed Daily Totals
              </span>
              <ProvenanceBadge provenance={calorieProvenance} />
              {unconfirmedCount > 0 && (
                <Badge variant="amber">
                  +{unconfirmedCalories} kcal unconfirmed (excluded)
                </Badge>
              )}
            </div>
            {hasCalorieTarget ? (
              <h3 className="text-2xl font-black text-white mt-1 font-mono tabular-nums">
                {confirmedTotals.caloriesKcal} / {calorieTargetKcal} kcal
              </h3>
            ) : (
              <h3 className="text-2xl font-black text-white mt-1 font-mono tabular-nums">
                {confirmedTotals.caloriesKcal} kcal logged
              </h3>
            )}
          </div>
          <Badge variant="lime">LEAN BULK (+250 KCAL SURPLUS)</Badge>
        </div>

        {/* Calorie target not set — designed null state */}
        {!hasCalorieTarget && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-athloniq-surface border border-athloniq-border text-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">
                  Calorie target not set — finish onboarding
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Progress bars and remaining kcal will appear once your TDEE is calibrated.
                </p>
              </div>
            </div>
            <Link
              to="/profile?step=biometrics"
              className="inline-flex items-center justify-center min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-athloniq-lime hover:bg-athloniq-lime-hover shadow-glow-lime transition-all active:scale-[0.98] shrink-0"
            >
              Finish Onboarding →
            </Link>
          </div>
        )}

        {/* Calorie progress bar — only shown when target is set */}
        {hasCalorieTarget && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400 font-mono tabular-nums">
              <span>Calories</span>
              <span>{pct(confirmedTotals.caloriesKcal, calorieTargetKcal!)}%</span>
            </div>
            <div className="h-3 w-full bg-athloniq-card rounded-full overflow-hidden border border-athloniq-border">
              <div
                className="h-full bg-gradient-to-r from-athloniq-lime to-athloniq-lime-hover rounded-full transition-all duration-500"
                style={{ width: `${pct(confirmedTotals.caloriesKcal, calorieTargetKcal!)}%` }}
              />
            </div>
          </div>
        )}

        {/* Macronutrient Breakdowns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Protein Card with Provenance */}
          <div className="p-4 rounded-xl bg-athloniq-surface border border-athloniq-border space-y-2.5">
            <div className="flex items-center justify-between text-xs flex-wrap gap-1">
              <span className="text-slate-300 font-semibold">Protein</span>
              <div className="flex items-center gap-1.5">
                {proteinProvenance === "provisional_default" && (
                  <span className="text-[9px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    PROVISIONAL DEFAULT
                  </span>
                )}
                {proteinMinG !== null && proteinMaxG !== null ? (
                  <span className="text-slate-500 font-mono text-[10px] tabular-nums">
                    {proteinMinG}–{proteinMaxG} g/day
                  </span>
                ) : (
                  <span className="text-slate-500 font-mono text-[10px]">Target not set</span>
                )}
              </div>
            </div>
            {proteinTargetG !== null && proteinTargetG > 0 ? (
              <>
                <div className="font-mono text-xl font-bold tabular-nums text-emerald-400">
                  {confirmedTotals.proteinG} / {proteinTargetG} g
                </div>
                <div className="h-2 w-full bg-athloniq-card rounded-full overflow-hidden border border-athloniq-border">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct(confirmedTotals.proteinG, proteinTargetG)}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="font-mono text-xl font-bold tabular-nums text-emerald-400">
                  {confirmedTotals.proteinG} g logged
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Target not set — complete onboarding
                </div>
              </>
            )}
          </div>

          {/* Carbohydrates Card */}
          <div className="p-4 rounded-xl bg-athloniq-surface border border-athloniq-border space-y-2.5">
            <div className="flex items-center justify-between text-xs flex-wrap gap-1">
              <span className="text-slate-300 font-semibold">Carbohydrates</span>
              <span className="text-slate-500 font-mono text-[10px]">Glycogen Replenishment</span>
            </div>
            {carbsTargetG !== null && carbsTargetG > 0 ? (
              <>
                <div className="font-mono text-xl font-bold tabular-nums text-amber-400">
                  {confirmedTotals.carbsG} / {carbsTargetG} g
                </div>
                <div className="h-2 w-full bg-athloniq-card rounded-full overflow-hidden border border-athloniq-border">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct(confirmedTotals.carbsG, carbsTargetG)}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="font-mono text-xl font-bold tabular-nums text-amber-400">
                  {confirmedTotals.carbsG} g logged
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Target not set — complete onboarding
                </div>
              </>
            )}
          </div>

          {/* Dietary Fats Card */}
          <div className="p-4 rounded-xl bg-athloniq-surface border border-athloniq-border space-y-2.5">
            <div className="flex items-center justify-between text-xs flex-wrap gap-1">
              <span className="text-slate-300 font-semibold">Dietary Fats</span>
              <span className="text-slate-500 font-mono text-[10px]">25% of Energy Balance</span>
            </div>
            {fatTargetG !== null && fatTargetG > 0 ? (
              <>
                <div className="font-mono text-xl font-bold tabular-nums text-purple-400">
                  {confirmedTotals.fatG} / {fatTargetG} g
                </div>
                <div className="h-2 w-full bg-athloniq-card rounded-full overflow-hidden border border-athloniq-border">
                  <div
                    className="h-full bg-purple-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct(confirmedTotals.fatG, fatTargetG)}%` }}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="font-mono text-xl font-bold tabular-nums text-purple-400">
                  {confirmedTotals.fatG} g logged
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  Target not set — complete onboarding
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
