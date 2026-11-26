import React from "react";
import { Card } from "@/components/ui/Card";
import { Activity, Award, BarChart2, Info, TrendingUp } from "lucide-react";

interface TrainingVolumeSectionProps {
  totalSessionsLast30: number;
  totalVolumeLast30: number;
  totalPRs: number;
  totalRunKm: number;
  totalBadmintonMin: number;
  bmiDisclaimer: string;
}

export const TrainingVolumeSection: React.FC<TrainingVolumeSectionProps> = ({
  totalSessionsLast30,
  totalVolumeLast30,
  totalPRs,
  totalRunKm,
  totalBadmintonMin,
  bmiDisclaimer,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Gym Sessions (30d)
            </span>
            <BarChart2 className="h-4 w-4 text-athloniq-lime" aria-hidden="true" />
          </div>
          <div className="text-3xl font-black text-white font-mono tabular-nums">
            {totalSessionsLast30}
          </div>
          <div className="text-xs text-slate-400">Last 30 days</div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Volume (30d)
            </span>
            <TrendingUp className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          </div>
          <div className="text-3xl font-black text-white font-mono tabular-nums">
            {totalVolumeLast30.toLocaleString()}
            <span className="text-sm text-slate-400 font-normal ml-1">kg</span>
          </div>
          <div className="text-xs text-slate-400">Barbell sets only</div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Personal Records
            </span>
            <Award className="h-4 w-4 text-athloniq-lime" aria-hidden="true" />
          </div>
          <div className="text-3xl font-black text-white font-mono tabular-nums">{totalPRs}</div>
          <div className="text-xs text-slate-400">All-time tracked PRs</div>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Running — All Time
            </span>
            <Activity className="h-4 w-4 text-amber-400" aria-hidden="true" />
          </div>
          <div className="text-3xl font-black text-white font-mono tabular-nums">
            {totalRunKm.toFixed(1)} <span className="text-sm text-slate-400 font-normal">km</span>
          </div>
          <div className="text-xs text-slate-400 font-mono tabular-nums">
            + {Math.round(totalBadmintonMin / 60)}h badminton
          </div>
        </Card>
      </div>

      <Card className="space-y-2">
        <div className="flex items-center gap-2 text-slate-300 font-bold text-xs">
          <Info className="h-4 w-4 text-athloniq-lime shrink-0" aria-hidden="true" />
          <span>Screening Metric Disclaimer</span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          {bmiDisclaimer} AthlonIQ prioritizes progressive tension overload, lean tissue accrual,
          and performance over static height-to-weight ratios.
        </p>
      </Card>
    </>
  );
};
