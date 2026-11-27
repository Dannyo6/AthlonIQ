import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { SectionCard } from "@/components/ui/SectionCard";
import { AdherenceStrip } from "@/components/charts/AdherenceStrip";
import { CalendarCheck, ArrowRight } from "lucide-react";
import type { WorkoutSession } from "@/types";
import { calculateWeeklyConsistency } from "@/lib/weeklyConsistency";

interface WeeklyConsistencyCardProps {
  trainingDaysPerWeek?: number | null;
  workoutSessions: WorkoutSession[];
  timezone?: string | null;
  today?: string | Date | null;
  onNavigate?: (tab: string) => void;
}

export const WeeklyConsistencyCard: React.FC<WeeklyConsistencyCardProps> = ({
  trainingDaysPerWeek,
  workoutSessions,
  timezone,
  today,
  onNavigate,
}) => {
  const consistency = useMemo(
    () =>
      calculateWeeklyConsistency(workoutSessions, trainingDaysPerWeek, {
        timezone,
        today,
      }),
    [workoutSessions, trainingDaysPerWeek, timezone, today]
  );

  const statusText = !consistency.isTargetSet
    ? "Target not set"
    : consistency.isTargetMet
    ? "✓ Goal reached"
    : "In progress";

  return (
    <SectionCard
      title="Weekly Consistency"
      icon={CalendarCheck}
      tone="emerald"
      headerRight={
        <span
          className={`text-[11px] font-mono font-semibold tabular-nums ${
            consistency.isTargetMet
              ? "text-emerald-400"
              : consistency.isTargetSet
              ? "text-slate-300"
              : "text-amber-300"
          }`}
        >
          {statusText}
        </span>
      }
      primaryAction={
        <Link
          to={consistency.isTargetSet ? "/workouts" : "/profile"}
          onClick={() => onNavigate?.(consistency.isTargetSet ? "workouts" : "profile")}
          className="surface-elevated tactile-press w-full inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold text-white hover:border-athloniq-lime/40"
        >
          <span>{consistency.isTargetSet ? "View Training Consistency" : "Set Training Split"}</span>
          <ArrowRight className="h-4 w-4 text-athloniq-lime shrink-0" aria-hidden="true" />
        </Link>
      }
    >
      {!consistency.isTargetSet ? (
        <AdherenceStrip
          days={[]}
          targetDays={null}
          emptyTitle="Weekly frequency not set"
          emptyMessage="Set how many days per week you want to train in Profile to track consistency."
        />
      ) : (
        <div className="surface-well p-3.5 rounded-xl space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-semibold">
                Weekly Adherence (Mon–Sun)
              </span>
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono mt-0.5 tabular-nums">
                {consistency.uniqueDaysLogged}{" "}
                <span className="text-xs text-slate-400 font-mono font-medium">
                  / {consistency.trainingDaysTarget} days
                </span>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-white tabular-nums">
              {consistency.progressPercent}%
            </span>
          </div>

          <div className="w-full bg-athloniq-card rounded-full h-1.5 overflow-hidden border border-athloniq-border">
            <div
              className="bg-athloniq-lime h-full rounded-full transition-all"
              style={{ width: `${consistency.progressPercent}%` }}
            />
          </div>

          <AdherenceStrip
            days={consistency.days}
            targetDays={consistency.trainingDaysTarget}
            ariaLabel="Weekly training adherence (Monday through Sunday)"
          />
        </div>
      )}
    </SectionCard>
  );
};
