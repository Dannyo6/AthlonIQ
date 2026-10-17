import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge, ProvenanceBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAthloniqState } from "@/hooks/useAthloniqState";
import { Utensils, Droplets, Plus, AlertCircle } from "lucide-react";

export const NutritionView: React.FC = () => {
  const { goals } = useAthloniqState();

  const targetKcal = goals.calorieTargetKcal;
  const proteinTarget = goals.proteinTargetG;
  const carbsTarget = goals.carbsTargetG || Math.round((targetKcal ? targetKcal * 0.5 : 2000 * 0.5) / 4);
  const fatTarget = goals.fatTargetG || Math.round((targetKcal ? targetKcal * 0.25 : 2000 * 0.25) / 9);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E2330] pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <Utensils className="h-6 w-6 text-athloniq-lime" />
            Dynamic Nutrition & Energy Balance System
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Mifflin-St Jeor TDEE tracking, deterministic protein allocation (1.6–2.2 g/kg), and clean surplus partitioning.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary">
            <Plus className="h-4 w-4" /> Log Meal
          </Button>
        </div>
      </div>

      {/* Onboarding Gate Alert if calories are awaiting onboarding */}
      {!targetKcal && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Caloric Target Gated Awaiting Onboarding</span>
                <ProvenanceBadge provenance="awaiting_onboarding" />
              </div>
              <p className="text-xs text-amber-300/90 leading-relaxed mt-0.5">
                Complete the 5-step athlete onboarding wizard to calculate your calibrated TDEE and +250 kcal lean-bulk surplus.
              </p>
            </div>
          </div>
          <Badge variant="amber">AWAITING ONBOARDING</Badge>
        </div>
      )}

      {/* Daily Progress Card */}
      <Card className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E2330] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-athloniq-lime uppercase font-mono font-bold">
                Energy Balance Overview
              </span>
              <ProvenanceBadge provenance={goals.calorieProvenance} />
            </div>
            <h3 className="text-2xl font-black text-white mt-1 font-mono tabular-nums">
              {targetKcal ? `0 / ${targetKcal} kcal` : "Awaiting Calibration"}
            </h3>
          </div>
          <Badge variant="lime">LEAN BULK (+250 KCAL SURPLUS)</Badge>
        </div>

        {/* Macro split breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {[
            {
              label: "Protein Target",
              current: 0,
              target: proteinTarget,
              unit: "g",
              range: `${goals.proteinMinG}–${goals.proteinMaxG} g/day`,
              provenance: goals.proteinProvenance,
              color: "bg-athloniq-lime",
              textColor: "text-athloniq-lime",
            },
            {
              label: "Carbohydrates",
              current: 0,
              target: carbsTarget,
              unit: "g",
              range: "Glycogen Replenishment",
              provenance: goals.calorieProvenance,
              color: "bg-amber-400",
              textColor: "text-amber-400",
            },
            {
              label: "Dietary Fats",
              current: 0,
              target: fatTarget,
              unit: "g",
              range: "25% of Energy Balance",
              provenance: goals.calorieProvenance,
              color: "bg-purple-400",
              textColor: "text-purple-400",
            },
          ].map((macro, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#181D2A] border border-[#1E2330] space-y-2.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">{macro.label}</span>
                <ProvenanceBadge provenance={macro.provenance} />
              </div>
              <div className="flex items-baseline justify-between">
                <span className={`font-mono text-xl font-bold tabular-nums ${macro.textColor}`}>
                  {macro.current} / {macro.target} {macro.unit}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {macro.range}
                </span>
              </div>
              <div className="h-2 w-full bg-[#12151E] rounded-full overflow-hidden border border-[#1E2330]">
                <div
                  className={`h-full ${macro.color} rounded-full transition-all duration-500`}
                  style={{ width: "0%" }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Hydration */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-[#181D2A] border border-[#1E2330]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-athloniq-lime/10 text-athloniq-lime border border-athloniq-lime/20">
              <Droplets className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Daily Hydration Baseline</div>
              <div className="text-xs text-slate-400 font-mono tabular-nums">
                0 / {goals.waterTargetMl} ml
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm">
            + 250 ml
          </Button>
        </div>
      </Card>
    </div>
  );
};
