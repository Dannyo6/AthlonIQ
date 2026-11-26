import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
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

  return (
    <Card className="h-full flex flex-col justify-between space-y-4">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-athloniq-border pb-3">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-athloniq-lime shrink-0" aria-hidden="true" />
            <h3 className="font-bold text-white text-base tracking-tight">
              Weekly Consistency
            </h3>
          </div>
          {consistency.isTargetSet ? (
            <Badge variant={consistency.isTargetMet ? "emerald" : "lime"}>
              {consistency.isTargetMet ? "TARGET MET" : "ACTIVE SPLIT"}
            </Badge>
          ) : (
            <Badge variant="amber">NOT SET</Badge>
          )}
        </div>

        {!consistency.isTargetSet ? (
          <div className="surface-well p-4 rounded-xl text-xs space-y-1.5 border-l-2 border-l-amber-400/70">
            <div className="font-bold text-slate-200">Weekly frequency not set</div>
            <p className="text-slate-400 leading-relaxed">
              Configure your desired training days per week in your athlete profile to
              track volume progression and adherence.
            </p>
          </div>
        ) : (
          <div className="surface-well p-4 rounded-xl space-y-3.5">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-semibold">
                  Weekly Adherence (Mon–Sun)
                </span>
                <div className="text-3xl font-black tracking-tight text-white font-mono mt-0.5 tabular-nums">
                  {consistency.uniqueDaysLogged}{" "}
                  <span className="text-xs text-slate-400 font-mono font-medium">
                    / {consistency.trainingDaysTarget} days
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                {consistency.progressPercent}%
              </span>
            </div>

            <div className="w-full bg-athloniq-card rounded-full h-1.5 overflow-hidden border border-athloniq-border">
              <div
                className="bg-athloniq-lime h-full rounded-full transition-all"
                style={{ width: `${consistency.progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              {consistency.days.map((pill, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono transition-all ${
                      pill.isLogged
                        ? "bg-athloniq-lime text-slate-950 font-black shadow-sm"
                        : "bg-athloniq-card text-slate-400 border border-athloniq-border"
                    } ${pill.isToday ? "ring-2 ring-athloniq-lime/60" : ""}`}
                    title={`${pill.date} (${pill.dayName}): ${
                      pill.isLogged ? `${pill.sessionsCount} session(s)` : "Rest day"
                    }`}
                  >
                    {pill.dayLetter}
                  </div>
                  <span className="text-[9px] font-mono text-slate-400">
                    {pill.isToday ? "Today" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Link
        to={consistency.isTargetSet ? "/workouts" : "/profile"}
        onClick={() => onNavigate?.(consistency.isTargetSet ? "workouts" : "profile")}
        className="surface-elevated tactile-press w-full inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold text-white hover:border-athloniq-lime/40"
      >
        <span>{consistency.isTargetSet ? "View Training Consistency" : "Set Training Split"}</span>
        <ArrowRight className="h-4 w-4 text-athloniq-lime shrink-0" aria-hidden="true" />
      </Link>
    </Card>
  );
};
