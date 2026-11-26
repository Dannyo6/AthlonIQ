import React from "react";
import { Card } from "@/components/ui/Card";
import { BmiResult } from "@/lib/calculations";
import { BodyMetric, WeightTrendResult } from "@/types";

interface ProgressKeyStatsGridProps {
  latestWeight: BodyMetric | null;
  profileWeightKg: number | null | undefined;
  weightTrend: WeightTrendResult;
  bodyMetricsCount: number;
  avgWeeklyProteinG: number | null;
  proteinTargetG: number | null;
  bmi: BmiResult;
}

export const ProgressKeyStatsGrid: React.FC<ProgressKeyStatsGridProps> = ({
  latestWeight,
  profileWeightKg,
  weightTrend,
  bodyMetricsCount,
  avgWeeklyProteinG,
  proteinTargetG,
  bmi,
}) => {
  const currentWeightDisplay = latestWeight
    ? `${latestWeight.weightKg.toFixed(1)} kg`
    : profileWeightKg != null && Number.isFinite(profileWeightKg)
    ? `${profileWeightKg.toFixed(1)} kg`
    : "Not set";

  const proteinColor =
    avgWeeklyProteinG != null && proteinTargetG != null && avgWeeklyProteinG >= proteinTargetG
      ? "text-athloniq-lime"
      : avgWeeklyProteinG != null
      ? "text-amber-400"
      : "text-slate-400";

  const tiles = [
    {
      label: "Current Weight",
      value: currentWeightDisplay,
      sub: latestWeight ? latestWeight.loggedDate : "Profile baseline",
      color: "text-athloniq-lime",
    },
    {
      label: "7d Rolling Avg",
      value: weightTrend.rolling7dKg != null ? `${weightTrend.rolling7dKg.toFixed(2)} kg` : "—",
      sub:
        weightTrend.status === "insufficient_data"
          ? `${bodyMetricsCount}/3 weigh-ins`
          : `Δ ${weightTrend.weeklyDeltaKg != null && weightTrend.weeklyDeltaKg >= 0 ? "+" : ""}${
              weightTrend.weeklyDeltaKg?.toFixed(2) ?? "—"
            } kg`,
      color: "text-emerald-400",
    },
    {
      label: "Avg Daily Protein",
      value: avgWeeklyProteinG != null ? `${avgWeeklyProteinG} g` : "—",
      sub: proteinTargetG != null ? `Target: ${proteinTargetG} g/day` : "Target not set",
      color: proteinColor,
    },
    {
      label: "BMI (Screening)",
      value: Number.isFinite(bmi.bmi) ? `${bmi.bmi}` : "Not set",
      sub: bmi.category.replace("_", " "),
      color: "text-slate-300",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {tiles.map(({ label, value, sub, color }) => (
        <Card key={label} spotlight className="p-4 space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
          <div className={`text-2xl font-black font-mono tabular-nums ${color}`}>{value}</div>
          <div className="text-[11px] text-slate-400 font-mono tabular-nums">{sub}</div>
        </Card>
      ))}
    </div>
  );
};
