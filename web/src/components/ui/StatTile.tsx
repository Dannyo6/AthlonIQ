import React from "react";
import { cn } from "@/lib/utils";
import { ProvenanceDot } from "./Badge";
import type { DisplayBadge, Provenance } from "@/types";

export interface StatTileProps {
  label: string;
  value: string | number | null;
  unit?: string;
  hint?: string;
  provenance?: Provenance | DisplayBadge;
  delta?: string;
  deltaDirection?: "up" | "down" | "flat";
  className?: string;
}

export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  unit,
  hint,
  provenance,
  delta,
  deltaDirection,
  className,
}) => {
  const arrow =
    deltaDirection === "up" ? "↑" : deltaDirection === "down" ? "↓" : deltaDirection === "flat" ? "→" : null;

  return (
    <div className={cn("surface-well rounded-xl p-3.5 space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
          {label}
        </span>
        {provenance && <ProvenanceDot provenance={provenance} />}
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white tabular-nums">
          {value !== null && value !== undefined ? value : "Not set"}
        </span>
        {unit && value !== null && value !== undefined && (
          <span className="text-xs text-slate-400 font-mono tabular-nums">{unit}</span>
        )}
      </div>

      {(hint || delta) && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 tabular-nums">
          {hint && <span>{hint}</span>}
          {delta && (
            <span className="font-mono font-semibold text-slate-300">
              {arrow && <span aria-hidden="true">{arrow} </span>}
              {delta}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
