import React, { useId, useMemo, useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export interface SparklineDatum {
  date: string;
  value: number;
  formattedValue?: string;
}

export interface SparklineProps {
  points: SparklineDatum[];
  minPoints?: number;
  unit?: string;
  ariaLabel?: string;
  legendLabel?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  tone?: "lime" | "emerald";
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  points,
  minPoints = 3,
  unit = "",
  ariaLabel = "Trend sparkline chart",
  legendLabel = "Trend",
  emptyTitle = "Insufficient data",
  emptyMessage = "More entries are needed before a trend can be plotted.",
  tone = "lime",
  className,
}) => {
  const prefersReduced = usePrefersReducedMotion();
  const gradId = useId();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const mountedValidRef = useRef(false);

  const valid = points.length >= minPoints;

  useEffect(() => {
    if (valid && !mountedValidRef.current) {
      mountedValidRef.current = true;
      if (!prefersReduced) {
        const t = setTimeout(() => setHasAnimated(true), 360);
        return () => clearTimeout(t);
      }
      setHasAnimated(true);
    }
  }, [valid, prefersReduced]);

  const geometry = useMemo(() => {
    if (!valid) return null;
    const width = 200;
    const height = 56;
    const padX = 8;
    const padY = 8;
    const values = points.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const coords = points.map((pt, idx) => {
      const x = padX + (idx / Math.max(1, points.length - 1)) * (width - padX * 2);
      const y = height - padY - ((pt.value - min) / range) * (height - padY * 2);
      return {
        ...pt,
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
      };
    });

    const pathD = coords
      .map((c, idx) => `${idx === 0 ? "M" : "L"} ${c.x.toFixed(1)},${c.y.toFixed(1)}`)
      .join(" ");

    const areaD = `${pathD} L ${coords[coords.length - 1].x.toFixed(1)},${height} L ${coords[0].x.toFixed(1)},${height} Z`;

    const firstVal = points[0].value;
    const lastVal = points[points.length - 1].value;
    const diff = Math.round((lastVal - firstVal) * 100) / 100;
    const directionSymbol = diff > 0.01 ? "↑" : diff < -0.01 ? "↓" : "→";

    return { width, height, coords, pathD, areaD, min, max, diff, directionSymbol };
  }, [points, valid]);

  if (!valid || !geometry) {
    return (
      <div
        className={cn(
          "surface-well rounded-xl p-3.5 text-xs space-y-1 border-l-2 border-l-amber-400/70",
          className
        )}
      >
        <div className="font-bold text-amber-300 flex items-center gap-1.5">
          <span aria-hidden="true">◌</span>
          <span>{emptyTitle}</span>
        </div>
        <p className="text-slate-400 leading-relaxed tabular-nums">{emptyMessage}</p>
      </div>
    );
  }

  const activeDatum = activeIdx !== null ? geometry.coords[activeIdx] : null;
  const strokeClass = tone === "emerald" ? "stroke-athloniq-emerald" : "stroke-athloniq-lime";
  const textToneClass = tone === "emerald" ? "text-athloniq-emerald" : "text-athloniq-lime";
  const dotStrokeClass = tone === "emerald" ? "stroke-athloniq-emerald" : "stroke-athloniq-lime";

  return (
    <div className={cn("space-y-2", className)}>
      {/* Visible Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 tabular-nums">
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center gap-1 font-medium text-slate-300")}>
            <span className={cn("h-0.5 w-3.5 inline-block rounded-full", tone === "emerald" ? "bg-athloniq-emerald" : "bg-athloniq-lime")} aria-hidden="true" />
            <span>{legendLabel}</span>
          </span>
          <span className="font-mono text-slate-300">
            <span aria-hidden="true">{geometry.directionSymbol} </span>
            {geometry.diff > 0 ? "+" : ""}
            {geometry.diff.toFixed(1)}
            {unit ? ` ${unit}` : ""}
          </span>
        </div>
        <span className="font-mono text-[10px] text-slate-400">
          {geometry.min.toFixed(1)}–{geometry.max.toFixed(1)}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>

      {/* Interactive SVG Canvas */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          className="w-full h-14 overflow-visible"
          role="img"
          aria-label={ariaLabel}
        >
          <defs>
            <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={geometry.areaD} fill={`url(#${gradId})`} className={textToneClass} />
          <path
            d={geometry.pathD}
            fill="none"
            className={cn(strokeClass, !prefersReduced && !hasAnimated && "chart-draw")}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {geometry.coords.map((pt, idx) => {
            const isActive = activeIdx === idx;
            const formatted = pt.formattedValue ?? `${pt.value.toFixed(1)}${unit ? ` ${unit}` : ""}`;
            return (
              <g
                key={`${pt.date}-${idx}`}
                tabIndex={0}
                role="button"
                aria-label={`${pt.date}: ${formatted}`}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(null)}
                onFocus={() => setActiveIdx(idx)}
                onBlur={() => setActiveIdx(null)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight") {
                    e.preventDefault();
                    setActiveIdx((idx + 1) % geometry.coords.length);
                  } else if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    setActiveIdx((idx - 1 + geometry.coords.length) % geometry.coords.length);
                  }
                }}
                className="cursor-pointer focus:outline-none"
              >
                <circle cx={pt.x} cy={pt.y} r="9" fill="transparent" />
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isActive ? "4.5" : "3"}
                  className={cn("fill-athloniq-dark", dotStrokeClass)}
                  strokeWidth={isActive ? "2" : "1.5"}
                />
              </g>
            );
          })}
        </svg>

        {activeDatum && (
          <div
            role="status"
            aria-live="polite"
            className="surface-elevated mt-1.5 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-[11px] font-mono text-white tabular-nums"
          >
            <span className="text-slate-400">{activeDatum.date}</span>
            <span className="font-bold">
              {activeDatum.formattedValue ?? `${activeDatum.value.toFixed(1)}${unit ? ` ${unit}` : ""}`}
            </span>
          </div>
        )}
      </div>

      {/* Screen-reader tabular alternative */}
      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">{legendLabel}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((pt, idx) => (
            <tr key={`${pt.date}-${idx}`}>
              <td>{pt.date}</td>
              <td>{pt.formattedValue ?? `${pt.value.toFixed(1)}${unit ? ` ${unit}` : ""}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
