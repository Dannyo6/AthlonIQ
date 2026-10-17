import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge, ProvenanceBadge } from "@/components/ui/Badge";
import { useAthloniqState } from "@/hooks/useAthloniqState";
import { calculateBmi } from "@/lib/calculations";
import { TrendingUp, Scale, Award, Info } from "lucide-react";

export const ProgressView: React.FC = () => {
  const { profile } = useAthloniqState();
  const bmi = calculateBmi(profile.weightKg, profile.heightCm);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E2330] pb-5">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
            <TrendingUp className="h-6 w-6 text-athloniq-lime" />
            Physique & Strength Trajectory Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Body composition trendlines, screening metrics, and progressive overload tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="lime">LEAN BULK ACCRUAL</Badge>
          <ProvenanceBadge provenance="calculated_estimate" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Current Body Weight
            </span>
            <Scale className="h-4 w-4 text-athloniq-lime" />
          </div>
          <div className="text-3xl font-black text-white font-mono tabular-nums">
            {profile.weightKg.toFixed(1)} <span className="text-sm text-slate-400 font-normal">kg</span>
          </div>
          <p className="text-xs text-slate-400">Baseline recorded: 55.0 kg at 173 cm</p>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Calculated BMI
            </span>
            <Badge variant="amber">{bmi.category.toUpperCase()}</Badge>
          </div>
          <div className="text-3xl font-black text-white font-mono tabular-nums">
            {bmi.bmi} <span className="text-sm text-slate-400 font-normal">kg/m²</span>
          </div>
          <p className="text-xs text-slate-400">Screening metric (underweight classification)</p>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Weight Trend Status
            </span>
            <Award className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-white pt-1">
            Log 3 weigh-ins to unlock 7-day rolling trend
          </div>
          <p className="text-xs text-slate-400">Requires multi-day consecutive telemetry</p>
        </Card>
      </div>

      {/* Audit & Disclaimer Note */}
      <Card className="space-y-2">
        <div className="flex items-center gap-2 text-slate-300 font-bold text-xs">
          <Info className="h-4 w-4 text-athloniq-lime" />
          <span>Screening Metric Disclaimer</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          {bmi.disclaimer} AthlonIQ prioritizes performance in the gym, progressive tension overload, and lean tissue accrual over static population-level height-to-weight ratios.
        </p>
      </Card>
    </div>
  );
};
