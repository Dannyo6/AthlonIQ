import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export interface CountUpProps {
  value: number | null;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  fallback?: string;
  className?: string;
}

function fmt(n: number, decimals?: number, prefix = "", suffix = ""): string {
  const body = decimals !== undefined ? n.toFixed(decimals) : String(n);
  return `${prefix}${body}${suffix}`;
}

export const CountUp: React.FC<CountUpProps> = ({
  value, decimals, prefix = "", suffix = "", fallback = "Not set", className,
}) => {
  const prefersReduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState<number | null>(() => value);
  const prevRef = useRef<number | null>(value);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = value;
    if (value === null || !Number.isFinite(value)) { setDisplay(null); return; }
    if (prev === null || !Number.isFinite(prev) || prev === value || prefersReduced || import.meta.env.MODE === "test") {
      setDisplay(value);
      return;
    }
    const delta = value - prev;
    let startTs: number | null = null;
    let rafId = 0;
    const step = (ts: number) => {
      if (startTs === null) startTs = ts;
      const p = Math.min(1, (ts - startTs) / 400);
      const next = prev + delta * (1 - Math.pow(1 - p, 3));
      setDisplay(decimals !== undefined ? Number(next.toFixed(decimals)) : Math.round(next));
      if (p < 1) rafId = requestAnimationFrame(step);
      else setDisplay(value);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [value, decimals, prefersReduced]);

  if (value === null || !Number.isFinite(value)) {
    return <span className={cn("tabular-nums", className)}>{fallback}</span>;
  }
  const finalText = fmt(value, decimals, prefix, suffix);
  const shown = display !== null && Number.isFinite(display) ? fmt(display, decimals, prefix, suffix) : finalText;
  return <span className={cn("tabular-nums", className)} aria-label={finalText}>{shown}</span>;
};
