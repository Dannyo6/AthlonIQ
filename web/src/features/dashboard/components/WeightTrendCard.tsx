import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Badge, ProvenanceBadge } from "@/components/ui/Badge";
import { Scale, ArrowRight, TrendingUp } from "lucide-react";
import type { BodyMetric, WeightTrendResult } from "@/types";
import { generateWeightSparkline } from "@/lib/calculations";

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

  const sparklineData = useMemo(() => {
    return generateWeightSparkline(weightTrend);
  }, [weightTrend]);

  return (
    <Card className="h-full flex flex-col justify-between space-y-4">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-athloniq-border pb-3">
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-athloniq-lime shrink-0" aria-hidden="true" />
            <h3 className="font-bold text-white text-base tracking-tight">
              Weight Trend
            </h3>
          </div>
          <ProvenanceBadge
            provenance={hasEnoughData ? "calculated_estimate" : "provisional_default"}
          />
        </div>

        {!hasEnoughData ? (
          <div className="surface-well p-4 rounded-xl space-y-2 border-l-2 border-l-amber-400/70">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-300">Need 3 weigh-ins</span>
              <Badge variant="amber">CALIBRATING</Badge>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed tabular-nums">
              {weighInsCount}/3 weigh-ins logged. Log 3 separate body weight entries to
              unlock the 7-day rolling trend and sparkline.
            </p>
            {latestWeight && (
              <div className="text-[11px] text-slate-400 pt-1 font-mono tabular-nums">
                Latest: {latestWeight.weightKg.toFixed(1)} kg ({latestWeight.loggedDate})
              </div>
            )}
          </div>
        ) : (
          <div className="surface-well p-4 rounded-xl space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-semibold">
                  Latest Weight
                </span>
                <div className="text-3xl font-black tracking-tight text-white font-mono mt-0.5 tabular-nums">
                  {latestWeight?.weightKg.toFixed(1)}{" "}
                  <span className="text-xs text-slate-400 font-medium">kg</span>
                </div>
              </div>

              {sparklineData && (
                <div className="flex flex-col items-end shrink-0">
                  <svg
                    viewBox={`0 0 ${sparklineData.width} ${sparklineData.height}`}
                    className="w-32 h-11 overflow-visible"
                    aria-label="Weight trend sparkline"
                  >
                    <path
                      d={sparklineData.pathD}
                      fill="none"
                      className="stroke-athloniq-lime"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {sparklineData.points.map((pt, idx) => (
                      <circle
                        key={idx}
                        cx={pt.x}
                        cy={pt.y}
                        r="3"
                        className="fill-athloniq-dark stroke-athloniq-lime"
                        strokeWidth="1.5"
                      />
                    ))}
                  </svg>
                  <span className="text-[10px] font-mono text-slate-400 tabular-nums mt-0.5">
                    {weighInsCount} weigh-ins
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs pt-2 border-t border-athloniq-border/70">
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase">
                  7-Day Rolling Avg:
                </span>
                <div className="text-sm font-mono font-bold text-white mt-0.5 tabular-nums">
                  {weightTrend.rolling7dKg?.toFixed(2)} kg
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase">
                  Weekly Delta:
                </span>
                <div className="text-sm font-mono font-bold text-athloniq-lime mt-0.5 tabular-nums flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    {weightTrend.weeklyDeltaKg && weightTrend.weeklyDeltaKg >= 0 ? "+" : ""}
                    {weightTrend.weeklyDeltaKg?.toFixed(2)} kg/wk
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Link
        to="/progress"
        onClick={() => onNavigate?.("progress")}
        className="surface-elevated tactile-press w-full inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold text-white hover:border-athloniq-lime/40"
      >
        <span>{hasEnoughData ? "Open Weight Analytics" : "Log Today's Weight"}</span>
        <ArrowRight className="h-4 w-4 text-athloniq-lime shrink-0" aria-hidden="true" />
      </Link>
    </Card>
  );
};
