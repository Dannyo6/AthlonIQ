import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export interface WeeklyBarDatum {
  label: string;
  value: number;
  target?: number;
  meta?: string;
}

export interface WeeklyBarsProps {
  bars: WeeklyBarDatum[];
  unit?: string;
  ariaLabel?: string;
  barLabel?: string;
  targetLabel?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  className?: string;
}

export const WeeklyBars: React.FC<WeeklyBarsProps> = ({
  bars,
  unit = "",
  ariaLabel = "Weekly bar breakdown",
  barLabel = "Logged",
  targetLabel = "Target",
  emptyTitle = "No weekly data",
  emptyMessage = "Log sessions this week to view daily breakdown.",
  className,
}) => {
  const prefersReduced = usePrefersReducedMotion();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  if (bars.length === 0) {
    return (
      <div
        className={cn(
          "surface-well rounded-xl p-4 text-xs space-y-1 border-l-2 border-l-amber-400/70",
          className
        )}
      >
        <div className="font-bold text-amber-300">{emptyTitle}</div>
        <p className="text-slate-400 leading-relaxed">{emptyMessage}</p>
      </div>
    );
  }

  const maxVal = Math.max(
    1,
    ...bars.map((b) => Math.max(b.value, b.target ?? 0))
  );
  const firstTarget = bars.find((b) => b.target && b.target > 0)?.target;
  const activeBar = activeIdx !== null ? bars[activeIdx] : null;
  const svgW = 240;
  const svgH = 72;
  const gap = 8;
  const slotW = (svgW - gap * (bars.length - 1)) / bars.length;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Visible Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300 tabular-nums">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-athloniq-lime inline-block" aria-hidden="true" />
            <span>{barLabel}</span>
          </span>
          {firstTarget !== undefined && (
            <span className="inline-flex items-center gap-1.5 text-slate-400">
              <span className="w-3 border-t border-dashed border-emerald-400 inline-block" aria-hidden="true" />
              <span>
                {targetLabel}: {firstTarget}
                {unit ? ` ${unit}` : ""}
              </span>
            </span>
          )}
        </div>
        <span className="font-mono text-slate-400">✓ = goal reached</span>
      </div>

      {/* SVG Bars */}
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="w-full h-20 overflow-visible"
        role="img"
        aria-label={ariaLabel}
      >
        {firstTarget !== undefined && (
          <line
            x1="0"
            x2={svgW}
            y1={svgH - 16 - (firstTarget / maxVal) * (svgH - 22)}
            y2={svgH - 16 - (firstTarget / maxVal) * (svgH - 22)}
            className="stroke-emerald-400/60"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
        )}
        {bars.map((bar, idx) => {
          const x = idx * (slotW + gap);
          const barMaxH = svgH - 22;
          const barH = bar.value > 0 ? Math.max(4, (bar.value / maxVal) * barMaxH) : 2;
          const y = svgH - 16 - barH;
          const metTarget = bar.target !== undefined && bar.value >= bar.target;
          const isActive = activeIdx === idx;

          return (
            <g
              key={`${bar.label}-${idx}`}
              tabIndex={0}
              role="button"
              aria-label={`${bar.label}: ${bar.value}${unit ? ` ${unit}` : ""}${metTarget ? " (target met)" : ""}`}
              onMouseEnter={() => setActiveIdx(idx)}
              onMouseLeave={() => setActiveIdx(null)}
              onFocus={() => setActiveIdx(idx)}
              onBlur={() => setActiveIdx(null)}
              className="cursor-pointer focus:outline-none"
            >
              <rect x={x} y={0} width={slotW} height={svgH} fill="transparent" />
              <rect
                x={x}
                y={y}
                width={slotW}
                height={barH}
                rx="4"
                className={cn(
                  bar.value === 0
                    ? "fill-athloniq-card stroke-athloniq-border"
                    : metTarget
                    ? "fill-emerald-400"
                    : "fill-athloniq-lime",
                  isActive && "opacity-90",
                  !prefersReduced && "transition-opacity duration-150"
                )}
                strokeWidth={bar.value === 0 ? "1" : "0"}
              />
              {metTarget && (
                <text
                  x={x + slotW / 2}
                  y={Math.max(9, y - 3)}
                  textAnchor="middle"
                  className="fill-emerald-300 text-[8px] font-bold"
                >
                  ✓
                </text>
              )}
              <text
                x={x + slotW / 2}
                y={svgH - 2}
                textAnchor="middle"
                className="fill-slate-400 text-[9px] font-mono tabular-nums"
              >
                {bar.label}
              </text>
            </g>
          );
        })}
      </svg>

      {activeBar && (
        <div
          role="status"
          aria-live="polite"
          className="surface-elevated inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-[11px] font-mono text-white tabular-nums"
        >
          <span className="text-slate-400">{activeBar.label}</span>
          <span className="font-bold">
            {activeBar.value}
            {unit ? ` ${unit}` : ""}
          </span>
          {activeBar.meta && <span className="text-slate-400">• {activeBar.meta}</span>}
        </div>
      )}

      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">{barLabel}</th>
          </tr>
        </thead>
        <tbody>
          {bars.map((bar, idx) => (
            <tr key={`${bar.label}-${idx}`}>
              <td>{bar.label}</td>
              <td>
                {bar.value}
                {unit ? ` ${unit}` : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
