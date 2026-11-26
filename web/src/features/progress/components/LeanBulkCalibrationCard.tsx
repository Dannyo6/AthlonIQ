import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge, ProvenanceBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LeanBulkCalibrationResult } from "@/types";
import { CheckCircle2, Flame } from "lucide-react";

interface LeanBulkCalibrationCardProps {
  calibration: LeanBulkCalibrationResult;
  referenceWeightKg: number | null | undefined;
  onApplyTarget: () => void;
}

export const LeanBulkCalibrationCard: React.FC<LeanBulkCalibrationCardProps> = ({
  calibration,
  referenceWeightKg,
  onApplyTarget,
}) => {
  const bwLabel =
    referenceWeightKg != null && Number.isFinite(referenceWeightKg)
      ? `${referenceWeightKg.toFixed(0)} kg BW`
      : "Bodyweight";

  return (
    <Card spotlight className="space-y-4 border-athloniq-lime/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-athloniq-border pb-3">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-athloniq-lime shrink-0" aria-hidden="true" />
          <div>
            <h3 className="text-base font-bold text-white">14-Day Lean-Bulk Energy Calibrator</h3>
            <p className="text-xs text-slate-400">
              Auditable energy recalibration gated by 10 nutrition days and 4 fasted weigh-ins over 14 days.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={
              calibration.status === "on_track"
                ? "lime"
                : calibration.status === "increase_surplus"
                ? "emerald"
                : calibration.status === "trim_surplus"
                ? "amber"
                : "neutral"
            }
          >
            {calibration.status.toUpperCase().replace("_", " ")}
          </Badge>
          <ProvenanceBadge provenance={calibration.provenance} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-athloniq-surface border border-athloniq-border">
          <div className="text-[11px] text-slate-400">14-Day Nutrition Adherence</div>
          <div className="text-lg font-black font-mono text-white mt-1 tabular-nums">
            {calibration.observation_days_logged} / 10{" "}
            <span className="text-xs font-normal text-slate-400">days logged</span>
          </div>
          <div
            role="progressbar"
            aria-label="14-day nutrition adherence progress"
            aria-valuemin={0}
            aria-valuemax={10}
            aria-valuenow={Math.min(10, calibration.observation_days_logged)}
            className="w-full bg-athloniq-card rounded-full h-1.5 mt-2 overflow-hidden"
          >
            <div
              className="bg-athloniq-lime h-full rounded-full"
              style={{ width: `${Math.min(100, (calibration.observation_days_logged / 10) * 100)}%` }}
            />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-athloniq-surface border border-athloniq-border">
          <div className="text-[11px] text-slate-400">14-Day Fasted Weigh-Ins</div>
          <div className="text-lg font-black font-mono text-white mt-1 tabular-nums">
            {calibration.observation_weigh_ins} / 4{" "}
            <span className="text-xs font-normal text-slate-400">weigh-ins</span>
          </div>
          <div
            role="progressbar"
            aria-label="14-day fasted weigh-in progress"
            aria-valuemin={0}
            aria-valuemax={4}
            aria-valuenow={Math.min(4, calibration.observation_weigh_ins)}
            className="w-full bg-athloniq-card rounded-full h-1.5 mt-2 overflow-hidden"
          >
            <div
              className="bg-emerald-400 h-full rounded-full"
              style={{ width: `${Math.min(100, (calibration.observation_weigh_ins / 4) * 100)}%` }}
            />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-athloniq-surface border border-athloniq-border">
          <div className="text-[11px] text-slate-400">Target Gain Corridor ({bwLabel})</div>
          <div className="text-sm font-bold text-slate-200 mt-1 font-mono tabular-nums">
            +0.10 to +0.25 kg/wk
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Current Delta:{" "}
            <span className="font-mono font-bold text-athloniq-lime tabular-nums">
              {calibration.weekly_delta_kg != null
                ? `${calibration.weekly_delta_kg > 0 ? "+" : ""}${calibration.weekly_delta_kg.toFixed(2)} kg/wk`
                : "Insufficient data"}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-athloniq-surface border border-athloniq-border space-y-2">
        <p className="text-xs text-slate-300 leading-relaxed">{calibration.explanation}</p>
        <p className="text-xs text-athloniq-lime font-medium leading-relaxed">
          {calibration.recommendation}
        </p>
      </div>

      {(calibration.status === "increase_surplus" || calibration.status === "trim_surplus") && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-athloniq-lime/10 to-athloniq-surface border border-athloniq-lime/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-white uppercase tracking-wider font-mono tabular-nums">
              Recommendation: {calibration.suggested_calorie_delta_kcal > 0 ? "+" : ""}
              {calibration.suggested_calorie_delta_kcal} kcal/day
            </div>
            <div className="text-xs text-slate-400 mt-0.5 font-mono tabular-nums">
              Current: {calibration.current_calorie_target_kcal} kcal → Recommended:{" "}
              <span className="text-white font-bold">{calibration.new_calorie_target_kcal} kcal</span>
            </div>
          </div>
          <Button
            type="button"
            variant="primary"
            size="md"
            className="min-h-[44px]"
            onClick={onApplyTarget}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Confirm &amp; Apply Adjusted Target
          </Button>
        </div>
      )}
    </Card>
  );
};
