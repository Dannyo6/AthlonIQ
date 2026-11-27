import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatTile } from "@/components/ui/StatTile";
import { EmptyState } from "@/components/ui/EmptyState";
import { Sparkline } from "@/components/charts/Sparkline";
import { Scale, ArrowRight } from "lucide-react";
import type { BodyMetric, WeightTrendResult } from "@/types";

interface WeightTrendCardProps {
  bodyMetrics?: BodyMetric[];
  weightTrend: WeightTrendResult;
  latestWeight: BodyMetric | null;
  onNavigate?: (tab: string) => void;
}

export const WeightTrendCard: React.FC<WeightTrendCardProps> = ({
  bodyMetrics,
  weightTrend,
  latestWeight,
  onNavigate,
}) => {
  const hasEnoughData = weightTrend.status === "ok";
  const weighInsCount = bodyMetrics ? bodyMetrics.length : weightTrend.entries.length;

  const sparklinePoints = useMemo(() => {
    if (!hasEnoughData) return [];
    return weightTrend.entries.map((e) => ({
      date: e.logged_date,
      value: e.weight_kg,
      formattedValue: `${e.weight_kg.toFixed(1)} kg`,
    }));
  }, [hasEnoughData, weightTrend.entries]);

  const deltaVal = weightTrend.weeklyDeltaKg;
  const deltaArrow =
    deltaVal != null ? (deltaVal > 0.01 ? "↑" : deltaVal < -0.01 ? "↓" : "→") : "";

  return (
    <SectionCard
      title="Weight Trend"
      icon={Scale}
      tone="lime"
      provenance={hasEnoughData ? "calculated_estimate" : "provisional_default"}
      compactProvenance
      primaryAction={
        <Link
          to="/progress"
          onClick={() => onNavigate?.("progress")}
          className="surface-elevated tactile-press w-full inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-white hover:border-athloniq-lime/40"
        >
          <span>{hasEnoughData ? "Open Weight Analytics" : "Log Today's Weight"}</span>
          <ArrowRight className="h-4 w-4 text-athloniq-lime shrink-0" aria-hidden="true" />
        </Link>
      }
    >
      {!hasEnoughData ? (
        <div className="space-y-2">
          <EmptyState
            illustration="trend"
            title="Need 3 weigh-ins"
            description={`${weighInsCount}/3 weigh-ins logged. Log 3 separate weigh-ins to view your 7-day average trend.`}
          />
          {latestWeight && (
            <div className="text-[11px] text-slate-400 px-1 font-mono tabular-nums">
              Latest entry: {latestWeight.weightKg.toFixed(1)} kg ({latestWeight.loggedDate})
            </div>
          )}
        </div>
      ) : (
        <div className="surface-well p-3.5 rounded-xl space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-semibold">
                Latest Weight
              </span>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono mt-0.5 tabular-nums">
                {latestWeight?.weightKg.toFixed(1)}{" "}
                <span className="text-xs text-slate-400 font-medium">kg</span>
              </div>
            </div>
            <span className="text-[11px] font-mono text-slate-400 tabular-nums">
              {weighInsCount} weigh-ins
            </span>
          </div>

          <Sparkline
            points={sparklinePoints}
            minPoints={3}
            unit="kg"
            ariaLabel="Weight trend sparkline"
            legendLabel="Weight progression"
            tone="lime"
          />

          <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-athloniq-border/70">
            <StatTile
              label="7-Day Rolling Avg:"
              value={weightTrend.rolling7dKg?.toFixed(2) ?? null}
              unit="kg"
              className="p-2.5"
            />
            <StatTile
              label="Weekly Delta:"
              value={
                deltaVal != null
                  ? `${deltaArrow} ${deltaVal >= 0 ? "+" : ""}${deltaVal.toFixed(2)}`
                  : null
              }
              unit="kg/wk"
              className="p-2.5"
            />
          </div>
        </div>
      )}
    </SectionCard>
  );
};
