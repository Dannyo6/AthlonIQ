import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export interface RingProps {
  value: number | null;
  max: number | null;
  unit?: string;
  label: string;
  sublabel?: string;
  tone?: "lime" | "emerald";
  size?: number;
  ariaLabel?: string;
  emptyTitle?: string;
  className?: string;
}

export const Ring: React.FC<RingProps> = ({
  value,
  max,
  unit = "",
  label,
  sublabel,
  tone = "lime",
  size = 84,
  ariaLabel,
  emptyTitle = "Not set",
  className,
}) => {
  const prefersReduced = usePrefersReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const mountedValidRef = useRef(false);

  const hasTarget = value !== null && max !== null && max > 0;
  const pct = hasTarget ? Math.round(Math.min(100, Math.max(0, (value / max) * 100))) : 0;
  const isMet = hasTarget && value >= max;

  useEffect(() => {
    if (hasTarget && !mountedValidRef.current) {
      mountedValidRef.current = true;
      if (!prefersReduced) {
        const t = setTimeout(() => setHasAnimated(true), 360);
        return () => clearTimeout(t);
      }
      setHasAnimated(true);
    }
  }, [hasTarget, prefersReduced]);

  const strokeWidth = 7;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct / 100);
  const ringLabel = ariaLabel ?? `${label} progress ring`;

  return (
    <div className={cn("inline-flex flex-col items-start gap-2", className)}>
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
          aria-label={
            hasTarget
              ? `${ringLabel}: ${value} of ${max}${unit ? ` ${unit}` : ""} (${pct}%)`
              : `${ringLabel}: ${emptyTitle}`
          }
          className="relative inline-flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-athloniq-lime cursor-pointer shrink-0"
          style={{ width: size, height: size }}
        >
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="-rotate-90"
            aria-hidden="true"
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              className="stroke-white/[0.08]"
              strokeWidth={strokeWidth}
              strokeDasharray={hasTarget ? undefined : "4 4"}
            />
            {hasTarget && (
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                className={cn(
                  isMet || tone === "emerald" ? "stroke-emerald-400" : "stroke-athloniq-lime",
                  !prefersReduced && !hasAnimated && "chart-draw"
                )}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
              />
            )}
          </svg>
          <span className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-sm font-bold text-white tabular-nums leading-none">
              {hasTarget ? `${pct}%` : "Not set"}
            </span>
            {hasTarget && (
              <span className="text-[10px] font-mono text-slate-400 mt-0.5 tabular-nums">
                {isMet ? "✓" : "→"}
              </span>
            )}
          </span>
        </button>

        {/* Visible Legend */}
        <div className="space-y-1 text-xs tabular-nums min-w-0">
          <div className="flex items-center gap-1.5 font-semibold text-white">
            <span
              className={cn(
                "h-2 w-2 rounded-full inline-block shrink-0",
                !hasTarget
                  ? "bg-slate-500"
                  : isMet || tone === "emerald"
                  ? "bg-emerald-400"
                  : "bg-athloniq-lime"
              )}
              aria-hidden="true"
            />
            <span className="truncate">{label}</span>
          </div>
          <div className="text-xs font-mono text-slate-300">
            {hasTarget
              ? `${value} / ${max}${unit ? ` ${unit}` : ""}`
              : emptyTitle}
          </div>
          {sublabel && <div className="text-[11px] text-slate-400">{sublabel}</div>}
        </div>
      </div>

      {hovered && (
        <div
          role="status"
          aria-live="polite"
          className="surface-elevated px-2.5 py-1 rounded-lg text-[11px] font-mono text-white tabular-nums"
        >
          {hasTarget
            ? `${label}: ${value} / ${max}${unit ? ` ${unit}` : ""} (${pct}%${isMet ? " • Target met" : ""})`
            : `${label}: Target not set`}
        </div>
      )}

      <table className="sr-only">
        <caption>{ringLabel}</caption>
        <thead>
          <tr>
            <th scope="col">Metric</th>
            <th scope="col">Logged</th>
            <th scope="col">Target</th>
            <th scope="col">Completion</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{label}</td>
            <td>{value ?? "Not set"}</td>
            <td>{max ?? "Not set"}</td>
            <td>{hasTarget ? `${pct}%` : "Not set"}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
