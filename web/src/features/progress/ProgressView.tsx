import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TrendingUp, Scale, Award } from "lucide-react";

export const ProgressView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-athloniq-violet" />
            Physique & Strength Analytics
          </h1>
          <p className="text-sm text-slate-400">
            Estimated 1RM trajectories, body composition trendlines, and lean mass accrual telemetry.
          </p>
        </div>
        <Badge variant="violet">12-WEEK MESOCYCLE PROGRESS</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Body Weight</span>
            <Scale className="h-4 w-4 text-athloniq-cyan" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            78.4 <span className="text-sm text-slate-400 font-normal">kg</span>
          </div>
          <p className="text-xs text-athloniq-emerald font-medium">+1.8 kg in 6 weeks (Lean Surplus)</p>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Body Fat % (Est)</span>
            <TrendingUp className="h-4 w-4 text-athloniq-emerald" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            12.8 <span className="text-sm text-slate-400 font-normal">%</span>
          </div>
          <p className="text-xs text-slate-400">DEXA baseline confirmed</p>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase">Total Strength 1RM</span>
            <Award className="h-4 w-4 text-athloniq-amber" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            465 <span className="text-sm text-slate-400 font-normal">kg (S/B/D)</span>
          </div>
          <p className="text-xs text-athloniq-emerald font-medium">+22.5 kg this cycle</p>
        </Card>
      </div>
    </div>
  );
};
