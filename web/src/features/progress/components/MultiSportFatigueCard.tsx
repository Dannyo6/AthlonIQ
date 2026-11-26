import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { FatigueAdvisoryResult } from "@/types";
import { ShieldAlert, Zap } from "lucide-react";

interface MultiSportFatigueCardProps {
  advisory: FatigueAdvisoryResult;
}

export const MultiSportFatigueCard: React.FC<MultiSportFatigueCardProps> = ({ advisory }) => {
  return (
    <Card spotlight className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-athloniq-border pb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-400 shrink-0" aria-hidden="true" />
          <div>
            <h3 className="text-base font-bold text-white">Multi-Sport Workload &amp; Fatigue Advisory</h3>
            <p className="text-xs text-slate-400">
              Lifting volume synthesized with Badminton footwork, Running mileage, and self-reported recovery.
            </p>
          </div>
        </div>
        <Badge
          variant={
            advisory.status === "optimal"
              ? "lime"
              : advisory.status === "moderate_strain"
              ? "emerald"
              : "rose"
          }
        >
          {advisory.status.toUpperCase().replace("_", " ")}
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-athloniq-surface border border-athloniq-border">
          <div className="text-[10px] uppercase font-bold text-slate-400">Gym Sessions (7d)</div>
          <div className="text-xl font-black font-mono tabular-nums text-white mt-1">
            {advisory.gym_sessions_7d}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-athloniq-surface border border-athloniq-border">
          <div className="text-[10px] uppercase font-bold text-slate-400">Badminton (7d)</div>
          <div className="text-xl font-black font-mono tabular-nums text-white mt-1">
            {advisory.badminton_minutes_7d.toFixed(0)}{" "}
            <span className="text-xs font-normal text-slate-400">min</span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-athloniq-surface border border-athloniq-border">
          <div className="text-[10px] uppercase font-bold text-slate-400">Running (7d)</div>
          <div className="text-xl font-black font-mono tabular-nums text-white mt-1">
            {advisory.running_km_7d.toFixed(1)}{" "}
            <span className="text-xs font-normal text-slate-400">km</span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-athloniq-surface border border-athloniq-border">
          <div className="text-[10px] uppercase font-bold text-slate-400">Sleep / Soreness</div>
          <div className="text-base font-black font-mono tabular-nums text-white mt-1">
            {advisory.avg_sleep_hours_7d != null ? `${advisory.avg_sleep_hours_7d}h` : "Not set"} /{" "}
            {advisory.avg_soreness_7d != null ? `${advisory.avg_soreness_7d}/5` : "Not set"}
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-athloniq-surface border border-athloniq-border space-y-2">
        <p className="text-xs text-slate-300 leading-relaxed">{advisory.explanation}</p>
        <div className="space-y-1 pt-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Actionable Adjustments:
          </span>
          <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
            {advisory.recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-athloniq-card border border-athloniq-border flex items-center gap-2 text-[11px] text-slate-400">
        <ShieldAlert className="h-4 w-4 text-slate-400 shrink-0" aria-hidden="true" />
        <span>{advisory.disclaimer}</span>
      </div>
    </Card>
  );
};
