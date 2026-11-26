import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { WeightTrendResult } from "@/types";
import { TrendingDown, TrendingUp } from "lucide-react";

interface WeightTrendSectionProps {
  weightTrend: WeightTrendResult;
  bodyMetricsCount: number;
}

export const WeightTrendSection: React.FC<WeightTrendSectionProps> = ({
  weightTrend,
  bodyMetricsCount,
}) => {
  const delta = weightTrend.weeklyDeltaKg ?? 0;
  const deltaLabel = delta > 0 ? "Gain" : delta < 0 ? "Loss" : "Steady";

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between border-b border-athloniq-border pb-3 gap-2">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-athloniq-lime" aria-hidden="true" />
          <span>7-Day Rolling Weight Trend</span>
        </h3>
        <Badge variant={weightTrend.status === "ok" ? "lime" : "amber"}>
          {weightTrend.status === "ok" ? "ACTIVE" : `${bodyMetricsCount}/3 WEIGH-INS`}
        </Badge>
      </div>

      {weightTrend.status === "insufficient_data" ? (
        <div
          role="status"
          className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm text-amber-200 leading-relaxed"
        >
          <p className="font-bold text-white text-xs mb-1">
            Insufficient Data — Minimum 3 Weigh-Ins Required
          </p>
          <p className="text-xs">{weightTrend.explanation}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-athloniq-surface border border-athloniq-border text-center">
              <div className="text-xs text-slate-400 font-medium mb-1">7-Day Rolling Avg</div>
              <div className="text-xl font-black font-mono tabular-nums text-athloniq-lime">
                {weightTrend.rolling7dKg?.toFixed(2)} kg
              </div>
            </div>
            <div className="p-3 rounded-xl bg-athloniq-surface border border-athloniq-border text-center">
              <div className="text-xs text-slate-400 font-medium mb-1">Weekly Delta ({deltaLabel})</div>
              <div
                aria-label={`Weekly delta ${deltaLabel}: ${delta >= 0 ? "+" : ""}${delta.toFixed(2)} kg`}
                className={`text-xl font-black font-mono tabular-nums inline-flex items-center justify-center gap-1.5 ${
                  delta > 0
                    ? "text-emerald-400"
                    : delta < 0
                    ? "text-rose-400"
                    : "text-slate-300"
                }`}
              >
                {delta < 0 ? (
                  <TrendingDown className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <TrendingUp className="h-4 w-4" aria-hidden="true" />
                )}
                <span>
                  {delta >= 0 ? "+" : ""}
                  {delta.toFixed(2)} kg
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">{weightTrend.explanation}</p>

          <div className="max-h-48 overflow-y-auto overflow-x-auto">
            <table
              aria-label="7-Day Rolling Weight Trend History"
              className="w-full text-xs font-mono tabular-nums"
            >
              <thead className="border-b border-athloniq-border">
                <tr className="text-slate-400 text-left">
                  <th scope="col" className="pb-2 font-bold">
                    Date
                  </th>
                  <th scope="col" className="pb-2 font-bold text-right">
                    Weight
                  </th>
                  <th scope="col" className="pb-2 font-bold text-right">
                    7d Avg
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-athloniq-border">
                {weightTrend.entries
                  .slice()
                  .reverse()
                  .map((entry) => (
                    <tr key={entry.logged_date} className="hover:bg-athloniq-surface transition-colors">
                      <td className="py-2 text-slate-300">{entry.logged_date}</td>
                      <td className="py-2 text-right text-white font-bold">
                        {entry.weight_kg.toFixed(1)} kg
                      </td>
                      <td className="py-2 text-right text-athloniq-lime">
                        {entry.rolling_7d_kg != null ? `${entry.rolling_7d_kg.toFixed(2)} kg` : "—"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
};
