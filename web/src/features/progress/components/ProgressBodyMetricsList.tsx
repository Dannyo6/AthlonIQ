import React from "react";
import { Card } from "@/components/ui/Card";
import { BodyMetric } from "@/types";
import { Scale, Trash2 } from "lucide-react";

interface ProgressBodyMetricsListProps {
  bodyMetrics: BodyMetric[];
  onDeleteMetric: (id: string) => void;
}

export const ProgressBodyMetricsList: React.FC<ProgressBodyMetricsListProps> = ({
  bodyMetrics,
  onDeleteMetric,
}) => {
  if (bodyMetrics.length === 0) return null;

  return (
    <Card className="space-y-3">
      <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-athloniq-border pb-3">
        <Scale className="h-4 w-4 text-athloniq-lime" aria-hidden="true" />
        <span>Weigh-In History</span>
      </h3>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {[...bodyMetrics]
          .sort((a, b) => b.loggedDate.localeCompare(a.loggedDate))
          .map((metric) => (
            <div
              key={metric.id}
              className="flex items-start justify-between p-3 rounded-xl bg-athloniq-surface border border-athloniq-border gap-2"
            >
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-white font-mono tabular-nums">
                    {metric.weightKg.toFixed(1)} kg
                  </span>
                  <span className="text-xs text-slate-400 font-mono tabular-nums">
                    {metric.loggedDate}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono tabular-nums flex flex-wrap gap-x-3">
                  {metric.waistCm != null && <span>Waist: {metric.waistCm} cm</span>}
                  {metric.chestCm != null && <span>Chest: {metric.chestCm} cm</span>}
                  {metric.armCm != null && <span>Arm: {metric.armCm} cm</span>}
                </div>
                {metric.notes && <div className="text-[11px] text-slate-400 truncate">{metric.notes}</div>}
              </div>
              <button
                type="button"
                aria-label={`Delete weigh-in from ${metric.loggedDate}`}
                onClick={() => onDeleteMetric(metric.id)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 transition-colors shrink-0"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
      </div>
    </Card>
  );
};
