import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

interface ClickSparkProps {
  children: React.ReactNode;
  className?: string;
}

const SPARK_ANGLES = [0, 60, 120, 180, 240, 300] as const;

export const ClickSpark: React.FC<ClickSparkProps> = ({ children, className }) => {
  const prefersReduced = usePrefersReducedMotion();
  const [burst, setBurst] = useState<{ id: number; x: string; y: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    if (prefersReduced) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest("button:disabled, input:disabled")) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const hasCoords = (e.clientX !== 0 || e.clientY !== 0) && rect.width > 0 && rect.height > 0;
    const x = hasCoords ? `${e.clientX - rect.left}px` : "50%";
    const y = hasCoords ? `${e.clientY - rect.top}px` : "50%";

    if (timerRef.current) clearTimeout(timerRef.current);
    setBurst({ id: Date.now(), x, y });
    timerRef.current = setTimeout(() => setBurst(null), 350);
  };

  return (
    <span className={cn("relative inline-flex", className)} onClick={handleClick}>
      {children}
      {burst && (
        <span
          key={burst.id}
          aria-hidden="true"
          data-testid="click-spark-burst"
          className="pointer-events-none absolute inset-0 overflow-visible"
        >
          {SPARK_ANGLES.map((angle) => (
            <span
              key={angle}
              data-testid="click-spark-particle"
              className="athloniq-spark-particle"
              style={{ left: burst.x, top: burst.y, "--spark-angle": `${angle}deg` } as React.CSSProperties}
            />
          ))}
        </span>
      )}
    </span>
  );
};
