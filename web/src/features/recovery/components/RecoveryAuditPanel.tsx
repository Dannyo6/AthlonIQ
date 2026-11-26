import React from "react";
import { Card } from "@/components/ui/Card";
import { ProvenanceBadge } from "@/components/ui/Badge";
import { ReadinessResult } from "@/types";

interface RecoveryAuditPanelProps {
  hasTodayCheckIn: boolean;
  readiness: ReadinessResult | null;
}

export const RecoveryAuditPanel: React.FC<RecoveryAuditPanelProps> = ({
  hasTodayCheckIn,
  readiness,
}) => {
  return (
    <Card spotlight className="space-y-4">
      <div className="flex items-center justify-between border-b border-athloniq-border pb-3 gap-2">
        <div>
          <h4 className="font-bold text-white text-base">Mathematical Audit</h4>
          <p className="text-[11px] text-slate-400">Auditable Rule Breakdown</p>
        </div>
        <ProvenanceBadge provenance="calculated_estimate" />
      </div>

      <div className="p-3.5 rounded-xl bg-athloniq-surface border border-athloniq-border space-y-2">
        <div className="text-xs text-slate-400 font-medium">Readiness Guidance:</div>
        <div className="text-xs text-slate-200 leading-relaxed font-medium">
          {hasTodayCheckIn && readiness
            ? readiness.guidance
            : "Complete your daily subjective check-in to calculate your readiness score and personalized training guidance."}
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-300">Active Deterministic Triggers:</div>
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {hasTodayCheckIn && readiness ? (
            readiness.triggers.map((trigger, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-athloniq-surface border border-athloniq-border text-xs font-mono tabular-nums text-slate-300 flex items-center justify-between"
              >
                <span>{trigger}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic p-2.5">No triggers evaluated yet.</p>
          )}
        </div>
      </div>

      <div className="pt-2 text-[11px] text-slate-500 leading-relaxed border-t border-athloniq-border">
        Notice: AthlonIQ does not fabricate nocturnal HRV, heart rate dips, or deep sleep stages
        without real hardware sensor telemetry.
      </div>
    </Card>
  );
};
