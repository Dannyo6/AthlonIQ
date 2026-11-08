import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Badge, ProvenanceBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Flame,
  Zap,
  Scale,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import type { LeanBulkCalibrationResult, FatigueAdvisoryResult } from "@/types";
import type { BmiResult } from "@/lib/calculations";
import type { BodyMetric } from "@/types";

interface MoreAccordionProps {
  leanBulkCalibration: LeanBulkCalibrationResult;
  fatigueAdvisory: FatigueAdvisoryResult;
  bmi: BmiResult;
  latestWeight: BodyMetric | null;
  heightCm?: number | null;
  equipmentConfirmed: boolean;
  unconfirmedEquipmentCount: number;
  trainingScope?: string[];
  onApplyCalibratedTarget: () => void;
  onNavigate?: (tab: string) => void;
}

export const MoreAccordion: React.FC<MoreAccordionProps> = ({
  leanBulkCalibration,
  fatigueAdvisory,
  bmi,
  latestWeight,
  heightCm,
  equipmentConfirmed,
  unconfirmedEquipmentCount,
  trainingScope = [],
  onApplyCalibratedTarget,
  onNavigate,
}) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    calibrator: false,
    fatigue: false,
    biometrics: false,
    equipment: false,
  });

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section aria-label="Detailed Analytics and Tools" className="space-y-3">
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          In-Depth Tools & Advisory
        </h3>
        <span className="text-[11px] text-slate-500 font-mono">4 Modules</span>
      </div>

      <div className="space-y-2.5">
        {/* Accordion 1: 14-Day Lean-Bulk Calibrator */}
        <Card className="p-0 overflow-hidden border-athloniq-border">
          <button
            type="button"
            onClick={() => toggleSection("calibrator")}
            className="w-full min-h-[44px] p-4 flex items-center justify-between text-left hover:bg-athloniq-card-alt/40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-athloniq-surface text-athloniq-lime">
                <Flame className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  14-Day Lean-Bulk Calibrator
                </h4>
                <p className="text-[11px] text-slate-400">
                  Observation: {leanBulkCalibration.observation_days_logged}/10 days •{" "}
                  {leanBulkCalibration.observation_weigh_ins}/4 weigh-ins
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  leanBulkCalibration.status === "on_track"
                    ? "lime"
                    : leanBulkCalibration.status === "increase_surplus"
                    ? "cyan"
                    : leanBulkCalibration.status === "trim_surplus"
                    ? "amber"
                    : "neutral"
                }
              >
                {leanBulkCalibration.status.toUpperCase().replace("_", " ")}
              </Badge>
              {openSections.calibrator ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </div>
          </button>

          {openSections.calibrator && (
            <div className="p-4 border-t border-athloniq-border bg-athloniq-surface/40 space-y-3 animate-in fade-in">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-athloniq-surface border border-athloniq-border">
                  <span className="text-[10px] text-slate-400 uppercase">
                    Target Corridor:
                  </span>
                  <div className="text-xs font-mono font-bold text-white mt-0.5 tabular-nums">
                    +0.10 to +0.25 kg/wk
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-athloniq-surface border border-athloniq-border">
                  <span className="text-[10px] text-slate-400 uppercase">
                    Weekly Delta:
                  </span>
                  <div className="text-xs font-mono font-bold text-athloniq-lime mt-0.5 tabular-nums">
                    {leanBulkCalibration.weekly_delta_kg != null
                      ? `${leanBulkCalibration.weekly_delta_kg > 0 ? "+" : ""}${leanBulkCalibration.weekly_delta_kg.toFixed(2)} kg/wk`
                      : "Calibrating..."}
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {leanBulkCalibration.explanation}
              </p>

              {(leanBulkCalibration.status === "increase_surplus" ||
                leanBulkCalibration.status === "trim_surplus") && (
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full min-h-[44px]"
                  onClick={onApplyCalibratedTarget}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    Confirm & Apply Target ({leanBulkCalibration.new_calorie_target_kcal} kcal)
                  </span>
                </Button>
              )}
            </div>
          )}
        </Card>

        {/* Accordion 2: Multi-Sport Workload Advisory */}
        <Card className="p-0 overflow-hidden border-athloniq-border">
          <button
            type="button"
            onClick={() => toggleSection("fatigue")}
            className="w-full min-h-[44px] p-4 flex items-center justify-between text-left hover:bg-athloniq-card-alt/40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-athloniq-surface text-amber-400">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Multi-Sport Workload Advisory
                </h4>
                <p className="text-[11px] text-slate-400">
                  Gym + Badminton + Running Strain Triangulation
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  fatigueAdvisory.status === "optimal"
                    ? "lime"
                    : fatigueAdvisory.status === "moderate_strain"
                    ? "cyan"
                    : "rose"
                }
              >
                {fatigueAdvisory.status.toUpperCase().replace("_", " ")}
              </Badge>
              {openSections.fatigue ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </div>
          </button>

          {openSections.fatigue && (
            <div className="p-4 border-t border-athloniq-border bg-athloniq-surface/40 space-y-3 animate-in fade-in">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-athloniq-surface border border-athloniq-border">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Gym</div>
                  <div className="text-sm font-bold font-mono text-white mt-0.5 tabular-nums">
                    {fatigueAdvisory.gym_sessions_7d} sets/wk
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-athloniq-surface border border-athloniq-border">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Badminton</div>
                  <div className="text-sm font-bold font-mono text-white mt-0.5 tabular-nums">
                    {fatigueAdvisory.badminton_minutes_7d.toFixed(0)} min
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-athloniq-surface border border-athloniq-border">
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Running</div>
                  <div className="text-sm font-bold font-mono text-white mt-0.5 tabular-nums">
                    {fatigueAdvisory.running_km_7d.toFixed(1)} km
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {fatigueAdvisory.explanation}
              </p>

              <div className="p-2.5 rounded-lg bg-athloniq-card border border-athloniq-border text-[10px] text-slate-500 flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span>Workload advisory only; not a clinical injury risk calculation.</span>
              </div>
            </div>
          )}
        </Card>

        {/* Accordion 3: Biometrics & Anthropometric Screening */}
        <Card className="p-0 overflow-hidden border-athloniq-border">
          <button
            type="button"
            onClick={() => toggleSection("biometrics")}
            className="w-full min-h-[44px] p-4 flex items-center justify-between text-left hover:bg-athloniq-card-alt/40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-athloniq-surface text-athloniq-lime">
                <Scale className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Biometrics & Screening
                </h4>
                <p className="text-[11px] text-slate-400">
                  Weight, Height & Scientific BMI Screening
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ProvenanceBadge
                provenance={latestWeight ? "user_confirmed" : "calculated_estimate"}
              />
              {openSections.biometrics ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </div>
          </button>

          {openSections.biometrics && (
            <div className="p-4 border-t border-athloniq-border bg-athloniq-surface/40 space-y-3 animate-in fade-in">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-athloniq-surface border border-athloniq-border">
                  <span className="text-[10px] text-slate-400 uppercase">
                    {latestWeight ? `Weight (${latestWeight.loggedDate})` : "Body Weight"}
                  </span>
                  <div className="text-base font-black text-white font-mono mt-0.5 tabular-nums">
                    {latestWeight?.weightKg != null
                      ? latestWeight.weightKg.toFixed(1)
                      : "Not set"}{" "}
                    {latestWeight && <span className="text-xs text-slate-400">kg</span>}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-athloniq-surface border border-athloniq-border">
                  <span className="text-[10px] text-slate-400 uppercase">Height</span>
                  <div className="text-base font-black text-white font-mono mt-0.5 tabular-nums">
                    {heightCm != null ? heightCm : "Not set"}{" "}
                    {heightCm != null && <span className="text-xs text-slate-400">cm</span>}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-athloniq-surface border border-athloniq-border space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 font-mono tabular-nums">
                    BMI: {bmi.bmi} kg/m²
                  </span>
                  <Badge variant="amber">SCREENING METRIC ONLY</Badge>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  {bmi.disclaimer}
                </p>
              </div>

              <Link
                to="/progress"
                onClick={() => onNavigate?.("progress")}
                className="w-full inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-white bg-athloniq-surface hover:bg-athloniq-card-alt border border-athloniq-border transition-all active:scale-[0.98]"
              >
                <span>View Full Physique History</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </Card>

        {/* Accordion 4: Training & Equipment Status */}
        <Card className="p-0 overflow-hidden border-athloniq-border">
          <button
            type="button"
            onClick={() => toggleSection("equipment")}
            className="w-full min-h-[44px] p-4 flex items-center justify-between text-left hover:bg-athloniq-card-alt/40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-athloniq-surface text-athloniq-lime">
                <Dumbbell className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Training & Equipment
                </h4>
                <p className="text-[11px] text-slate-400">
                  Home Gym Hardware Availability
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ProvenanceBadge
                provenance={equipmentConfirmed ? "user_confirmed" : "unconfirmed_equipment"}
              />
              {openSections.equipment ? (
                <ChevronUp className="h-4 w-4 text-slate-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-400" />
              )}
            </div>
          </button>

          {openSections.equipment && (
            <div className="p-4 border-t border-athloniq-border bg-athloniq-surface/40 space-y-3 animate-in fade-in">
              <div className="p-3 rounded-xl bg-athloniq-surface border border-athloniq-border space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Home Equipment:</span>
                  <span
                    className={`font-semibold font-mono ${
                      equipmentConfirmed ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {equipmentConfirmed
                      ? "Confirmed Home Gym"
                      : `${unconfirmedEquipmentCount} items unconfirmed`}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {equipmentConfirmed
                    ? "Bench, Rack, Dips, Pulldown, and Free Weights (70kg) active."
                    : "Unconfirmed items limit exercise selection and load auto-regulation."}
                </div>
              </div>

              {trainingScope.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-medium">
                    Training Focus:
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {trainingScope.map((scope, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-athloniq-card border border-athloniq-border text-[10px] font-mono text-slate-300 uppercase"
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Link
                to="/workouts"
                onClick={() => onNavigate?.("workouts")}
                className="w-full inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-white bg-athloniq-surface hover:bg-athloniq-card-alt border border-athloniq-border transition-all active:scale-[0.98]"
              >
                <span>Manage Equipment & Routines</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
};
