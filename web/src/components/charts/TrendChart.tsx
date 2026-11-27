import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export interface TrendChartPoint {
  date: string;
  raw: number;
  rollingAvg: number;
}

export interface TrendChartProps {
  data: TrendChartPoint[];
  minPoints?: number;
  unit?: string;
  rawLabel?: string;
  avgLabel?: string;
  ariaLabel?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  className?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  minPoints = 3,
  unit = "kg",
  rawLabel = "Measured",
  avgLabel = "7d Rolling Avg",
  ariaLabel = "Trend chart with rolling average",
  emptyTitle = "Need more data points",
  emptyMessage = "Log at least 3 separate entries to chart a rolling average trend.",
  className,
}) => {
  const prefersReduced = usePrefersReducedMotion();
  const clipId = useId();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const mountedValidRef = useRef(false);

  const valid = data.length >= minPoints;

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

  const geom = useMemo(() => {
    if (!valid) return null;
    const width = 320;
    const height = 104;
    const padX = 12;
    const padY = 12;
    const allVals = data.flatMap((d) => [d.raw, d.rollingAvg]);
    const min = Math.min(...allVals);
    const max = Math.max(...allVals);
    const range = max - min || 1;

    const toCoord = (idx: number, val: number) => ({
      x: Math.round((padX + (idx / Math.max(1, data.length - 1)) * (width - padX * 2)) * 10) / 10,
      y: Math.round((height - padY - ((val - min) / range) * (height - padY * 2)) * 10) / 10,
    });

    const pts = data.map((d, i) => ({
      ...d,
      rawPt: toCoord(i, d.raw),
      avgPt: toCoord(i, d.rollingAvg),
    }));

    const rawPath = pts
      .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.rawPt.x},${p.rawPt.y}`)
      .join(" ");
    const avgPath = pts
      .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.avgPt.x},${p.avgPt.y}`)
      .join(" ");

    const delta = Math.round((data[data.length - 1].rollingAvg - data[0].rollingAvg) * 100) / 100;
    const directionSymbol = delta > 0.01 ? "↑" : delta < -0.01 ? "↓" : "→";

    return { width, height, min, max, pts, rawPath, avgPath, delta, directionSymbol };
  }, [data, valid]);

  if (!valid || !geom) {
    return (
      <div
        className={cn(
          "surface-well rounded-xl p-4 text-xs space-y-1 border-l-2 border-l-amber-400/70",
          className
        )}
      >
        <div className="font-bold text-amber-300 flex items-center justify-between gap-2">
          <span>{emptyTitle}</span>
          <span className="font-mono tabular-nums text-[11px]">
            {data.length}/{minPoints}
          </span>
        </div>
        <p className="text-slate-400 leading-relaxed tabular-nums">{emptyMessage}</p>
      </div>
    );
  }

  const activePoint = activeIdx !== null ? geom.pts[activeIdx] : null;

  return (
    <div className={cn("space-y-2.5", className)}>
      {/* Visible Legend with shape & line-style indicators (color is never sole encoding) */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-300 tabular-nums">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex items-center" aria-hidden="true">
              <span className="w-3 h-0.5 bg-slate-400 inline-block" />
              <span className="w-1.5 h-1.5 rounded-full bg-white inline-block -ml-1" />
            </span>
            <span>{rawLabel}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 h-0 border-t-2 border-dashed border-athloniq-lime inline-block" aria-hidden="true" />
            <span className="text-slate-200 font-medium">{avgLabel}</span>
          </span>
        </div>
        <span className="font-mono text-slate-300">
          <span aria-hidden="true">{geom.directionSymbol} </span>
          {geom.delta > 0 ? "+" : ""}
          {geom.delta.toFixed(2)} {unit}
        </span>
      </div>

      {/* SVG Plot */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${geom.width} ${geom.height}`}
          className="w-full h-24 overflow-visible"
          role="img"
          aria-label={ariaLabel}
        >
          <defs>
            <clipPath id={clipId}>
              <rect x="0" y="0" width={geom.width} height={geom.height} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <line
              x1="0"
              y1={geom.height * 0.25}
              x2={geom.width}
              y2={geom.height * 0.25}
              className="stroke-white/[0.06]"
              strokeWidth="1"
            />
            <line
              x1="0"
              y1={geom.height * 0.75}
              x2={geom.width}
              y2={geom.height * 0.75}
              className="stroke-white/[0.06]"
              strokeWidth="1"
            />
          </g>

          {/* Raw series (solid neutral stroke + circular nodes) */}
          <path
            d={geom.rawPath}
            fill="none"
            className={cn("stroke-slate-400", !prefersReduced && !hasAnimated && "chart-draw")}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Rolling average series (dashed lime stroke + highlighted nodes) */}
          <path
            d={geom.avgPath}
            fill="none"
            className={cn("stroke-athloniq-lime", !prefersReduced && !hasAnimated && "chart-draw")}
            strokeWidth="2.4"
            strokeDasharray="5 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {geom.pts.map((pt, idx) => {
            const isActive = activeIdx === idx;
            return (
              <g
                key={`${pt.date}-${idx}`}
                tabIndex={0}
                role="button"
                aria-label={`${pt.date}: ${rawLabel} ${pt.raw.toFixed(1)} ${unit}, ${avgLabel} ${pt.rollingAvg.toFixed(2)} ${unit}`}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(null)}
                onFocus={() => setActiveIdx(idx)}
                onBlur={() => setActiveIdx(null)}
                className="cursor-pointer focus:outline-none"
              >
                <rect x={pt.avgPt.x - 10} y="0" width="20" height={geom.height} fill="transparent" />
                <circle
                  cx={pt.rawPt.x}
                  cy={pt.rawPt.y}
                  r={isActive ? "3.5" : "2.2"}
                  className="fill-white"
                />
                <polygon
                  points={`${pt.avgPt.x},${pt.avgPt.y - (isActive ? 4.5 : 3.2)} ${pt.avgPt.x + (isActive ? 4.5 : 3.2)},${pt.avgPt.y} ${pt.avgPt.x},${pt.avgPt.y + (isActive ? 4.5 : 3.2)} ${pt.avgPt.x - (isActive ? 4.5 : 3.2)},${pt.avgPt.y}`}
                  className="fill-athloniq-lime stroke-athloniq-dark"
                  strokeWidth="1"
                />
              </g>
            );
          })}
        </svg>

        {activePoint && (
          <div
            role="status"
            aria-live="polite"
            className="surface-elevated mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 px-2.5 py-1.5 rounded-lg text-[11px] font-mono tabular-nums"
          >
            <span className="text-slate-400">{activePoint.date}</span>
            <span className="text-white font-semibold">
              {rawLabel}: {activePoint.raw.toFixed(1)} {unit}
            </span>
            <span className="text-athloniq-lime font-bold">
              {avgLabel}: {activePoint.rollingAvg.toFixed(2)} {unit}
            </span>
          </div>
        )}
      </div>

      {/* Screen-reader data table */}
      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">{rawLabel}</th>
            <th scope="col">{avgLabel}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={`${row.date}-${idx}`}>
              <td>{row.date}</td>
              <td>
                {row.raw.toFixed(1)} {unit}
              </td>
              <td>
                {row.rollingAvg.toFixed(2)} {unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
