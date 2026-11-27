import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

export interface AdherenceDay {
  date: string;
  dayLetter: string;
  dayName: string;
  isLogged: boolean;
  isToday?: boolean;
  sessionsCount: number;
}

export interface AdherenceStripProps {
  days: AdherenceDay[];
  targetDays?: number | null;
  ariaLabel?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  className?: string;
}

export const AdherenceStrip: React.FC<AdherenceStripProps> = ({
  days,
  targetDays,
  ariaLabel = "Weekly training adherence strip",
  emptyTitle = "Weekly target not set",
  emptyMessage = "Set your training days per week in Profile to track weekly adherence.",
  className,
}) => {
  const prefersReduced = usePrefersReducedMotion();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  if (days.length === 0 || targetDays == null || targetDays <= 0) {
    return (
      <div
        className={cn(
          "surface-well rounded-xl p-4 text-xs space-y-1 border-l-2 border-l-amber-400/70",
          className
        )}
      >
        <div className="font-bold text-slate-200">{emptyTitle}</div>
        <p className="text-slate-400 leading-relaxed">{emptyMessage}</p>
      </div>
    );
  }

  const activeDay = activeIdx !== null ? days[activeIdx] : null;
  const loggedCount = days.filter((d) => d.isLogged).length;

  return (
    <div className={cn("space-y-2.5", className)}>
      {/* Visible Legend with non-color markers (✓ vs —) */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 tabular-nums">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-slate-300">
            <span className="font-mono font-bold text-athloniq-lime" aria-hidden="true">✓</span>
            <span>Logged</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="font-mono text-slate-500" aria-hidden="true">—</span>
            <span>Rest</span>
          </span>
        </div>
        <span className="font-mono text-slate-300">
          {loggedCount}/{targetDays} target days
        </span>
      </div>

      {/* 7-day SVG / Interactive Cells */}
      <div
        role="group"
        aria-label={ariaLabel}
        className={cn("grid grid-cols-7 gap-1.5", !prefersReduced && "stagger-enter")}
      >
        {days.map((pill, idx) => (
          <button
            key={pill.date}
            type="button"
            tabIndex={0}
            onMouseEnter={() => setActiveIdx(idx)}
            onMouseLeave={() => setActiveIdx(null)}
            onFocus={() => setActiveIdx(idx)}
            onBlur={() => setActiveIdx(null)}
            aria-label={`${pill.dayName} ${pill.date}: ${
              pill.isLogged ? `${pill.sessionsCount} session logged` : "Rest day"
            }${pill.isToday ? " (Today)" : ""}`}
            className={cn(
              "min-h-[44px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[10px] font-mono tabular-nums cursor-pointer border transition-opacity",
              pill.isLogged
                ? "bg-athloniq-lime text-slate-950 font-bold border-athloniq-lime"
                : "bg-athloniq-card text-slate-400 border-athloniq-border",
              pill.isToday && "ring-2 ring-athloniq-lime/60"
            )}
          >
            <span>{pill.dayLetter}</span>
            <span aria-hidden="true" className="text-[9px] leading-none">
              {pill.isLogged ? "✓" : pill.isToday ? "•" : "—"}
            </span>
          </button>
        ))}
      </div>

      {activeDay && (
        <div
          role="status"
          aria-live="polite"
          className="surface-elevated inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-[11px] font-mono text-white tabular-nums"
        >
          <span className="text-slate-400">
            {activeDay.dayName} ({activeDay.date})
          </span>
          <span className="font-bold">
            {activeDay.isLogged
              ? `${activeDay.sessionsCount} session(s) logged`
              : "Rest day"}
          </span>
        </div>
      )}

      {/* Screen-reader table alternative */}
      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Date</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day.date}>
              <td>{day.dayName}</td>
              <td>{day.date}</td>
              <td>{day.isLogged ? `${day.sessionsCount} session(s)` : "Rest day"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
