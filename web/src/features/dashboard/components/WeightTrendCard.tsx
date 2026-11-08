import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Badge, ProvenanceBadge } from "@/components/ui/Badge";
import { Scale, ArrowRight, TrendingUp } from "lucide-react";
import type { BodyMetric, WeightTrendResult } from "@/types";

interface WeightTrendCardProps {
  bodyMetrics: BodyMetric[];
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
  const hasEnoughData = bodyMetrics.length >= 3;

  // Generate SVG Sparkline coordinates for >= 3 entries
  const sparklineData = useMemo(() => {
    if (!hasEnoughData) return null;

    const sorted = [...bodyMetrics].sort((a, b) =>
      a.loggedDate.localeCompare(b.loggedDate)
    );

    const weights = sorted.map((m) => m.weightKg);
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const range = max - min || 1;

    const width = 160;
    const height = 44;
    const padding = 4;

    const points = sorted.map((m, idx) => {
      const x = padding + (idx / Math.max(1, sorted.length - 1)) * (width - padding * 2);
      const normalizedY = (m.weightKg - min) / range;
      // Invert Y coordinate for SVG
      const y = height - padding - normalizedY * (height - padding * 2);
      return { x, y, weight: m.weightKg, date: m.loggedDate };
    });

    const pathD = points
      .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ");

    return { points, pathD, width, height, min, max };
  }, [bodyMetrics, hasEnoughData]);

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between border-b border-athloniq-border pb-3">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-athloniq-lime" />
          <h3 className="font-bold text-white text-base">Weight Trend</h3>
        </div>
        <ProvenanceBadge
          provenance={hasEnoughData ? "calculated_estimate" : "provisional_default"}
        />
      </div>

      {!hasEnoughData ? (
        /* Insufficient Data State (< 3 weigh-ins) */
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-athloniq-surface border border-athloniq-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400">
                Need 3 weigh-ins
              </span>
              <Badge variant="amber">CALIBRATING</Badge>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {bodyMetrics.length}/3 weigh-ins logged. Log 3 separate body weight entries to
              unlock the 7-day rolling trend and sparkline.
            </p>
            {latestWeight && (
              <div className="text-[11px] text-slate-400 pt-1 font-mono tabular-nums">
                Latest: {latestWeight.weightKg.toFixed(1)} kg ({latestWeight.loggedDate})
              </div>
            )}
          </div>

          <Link
            to="/progress"
            onClick={() => onNavigate?.("progress")}
            className="w-full inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-athloniq-surface hover:bg-athloniq-card-alt border border-athloniq-border transition-all active:scale-[0.98]"
          >
            <span>Log Today's Weight</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        /* >= 3 Entries with Sparkline */
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-athloniq-surface border border-athloniq-border space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-medium">
                  Latest Weight
                </span>
                <div className="text-2xl font-black text-white font-mono mt-0.5 tabular-nums">
                  {latestWeight?.weightKg.toFixed(1)}{" "}
                  <span className="text-xs text-slate-400">kg</span>
                </div>
              </div>

              {/* Sparkline Graphic */}
              {sparklineData && (
                <div className="flex flex-col items-end">
                  <svg
                    viewBox={`0 0 ${sparklineData.width} ${sparklineData.height}`}
                    className="w-32 h-10 overflow-visible"
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
                  <span className="text-[9px] font-mono text-slate-500 tabular-nums">
                    {bodyMetrics.length} weigh-ins
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-athloniq-border/60">
              <div>
                <span className="text-[10px] text-slate-400">7-Day Rolling Avg:</span>
                <div className="text-xs font-mono font-bold text-slate-200 mt-0.5 tabular-nums">
                  {weightTrend.rolling7dKg?.toFixed(2)} kg
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Weekly Delta:</span>
                <div className="text-xs font-mono font-bold text-athloniq-lime mt-0.5 tabular-nums flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>
                    {weightTrend.weeklyDeltaKg && weightTrend.weeklyDeltaKg >= 0 ? "+" : ""}
                    {weightTrend.weeklyDeltaKg?.toFixed(2)} kg/wk
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Link
            to="/progress"
            onClick={() => onNavigate?.("progress")}
            className="w-full inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-white bg-athloniq-surface hover:bg-athloniq-card-alt border border-athloniq-border transition-all active:scale-[0.98]"
          >
            <span>Open Weight Analytics</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </Card>
  );
};
