import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { ProvenanceBadge } from "@/components/ui/Badge";

export interface WorkoutEquipmentBannerProps {
  isEquipmentLocked: boolean;
}

export const WorkoutEquipmentBanner: React.FC<WorkoutEquipmentBannerProps> = ({
  isEquipmentLocked,
}) => {
  if (!isEquipmentLocked) return null;

  return (
    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-bold text-white">
            Equipment confirmation required for load progressions
          </div>
          <p className="text-xs text-amber-300/90 mt-0.5">
            Sets can still be logged manually, but automated load/increment recommendations remain locked until home-gym equipment limits are confirmed.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <ProvenanceBadge provenance="unconfirmed_equipment" />
        <Link
          to="/profile?step=equipment"
          className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-athloniq-lime hover:bg-athloniq-lime-hover shadow-glow-lime transition-all active:scale-[0.98] shrink-0"
        >
          Confirm Equipment in Profile →
        </Link>
      </div>
    </div>
  );
};
