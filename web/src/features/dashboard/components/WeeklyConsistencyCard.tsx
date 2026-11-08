import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CalendarCheck, ArrowRight } from "lucide-react";
import type { WorkoutSession } from "@/types";

interface WeeklyConsistencyCardProps {
  trainingDaysPerWeek?: number | null;
  workoutSessions: WorkoutSession[];
  onNavigate?: (tab: string) => void;
}

export const WeeklyConsistencyCard: React.FC<WeeklyConsistencyCardProps> = ({
  trainingDaysPerWeek,
  workoutSessions,
  onNavigate,
}) => {
  const isSet = trainingDaysPerWeek != null && trainingDaysPerWeek > 0;

  // Calculate sessions in the rolling 7-day window
  const sessionsLast7Days = useMemo(() => {
    const cutoff7d = new Date();
    cutoff7d.setDate(cutoff7d.getDate() - 7);
    return workoutSessions.filter((s) => new Date(s.loggedDate) >= cutoff7d);
  }, [workoutSessions]);

  const uniqueDaysLogged = useMemo(() => {
    const days = new Set(sessionsLast7Days.map((s) => s.loggedDate));
    return days.size;
  }, [sessionsLast7Days]);

  const progressPercent = isSet
    ? Math.min(100, Math.round((uniqueDaysLogged / trainingDaysPerWeek!) * 100))
    : 0;

  // Generate weekday activity states (last 7 calendar days)
  const dayPills = useMemo(() => {
    const list = [];
    const loggedDates = new Set(workoutSessions.map((s) => s.loggedDate));

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split("T")[0];
      const dayLetter = d.toLocaleDateString("en-US", { weekday: "narrow" });
      const isLogged = loggedDates.has(iso);
      const isToday = i === 0;

      list.push({ iso, dayLetter, isLogged, isToday });
    }
    return list;
  }, [workoutSessions]);

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between border-b border-athloniq-border pb-3">
        <div className="flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-athloniq-lime" />
          <h3 className="font-bold text-white text-base">Weekly Consistency</h3>
        </div>
        {isSet ? (
          <Badge variant={progressPercent >= 100 ? "lime" : "neutral"}>
            {progressPercent >= 100 ? "TARGET MET" : "ACTIVE SPLIT"}
          </Badge>
        ) : (
          <Badge variant="amber">NOT SET</Badge>
        )}
      </div>

      {!isSet ? (
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-athloniq-surface border border-athloniq-border text-xs space-y-1.5">
            <div className="font-semibold text-slate-300">
              Weekly frequency not set
            </div>
            <p className="text-slate-400 leading-relaxed">
              Configure your desired training days per week in your athlete profile to
              track volume progression and adherence.
            </p>
          </div>
          <Link
            to="/profile"
            onClick={() => onNavigate?.("profile")}
            className="w-full inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-white bg-athloniq-surface hover:bg-athloniq-card-alt border border-athloniq-border transition-all active:scale-[0.98]"
          >
            <span>Set Training Split</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl bg-athloniq-surface border border-athloniq-border space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-medium">
                  7-Day Adherence
                </span>
                <div className="text-2xl font-black text-white font-mono mt-0.5 tabular-nums">
                  {uniqueDaysLogged}{" "}
                  <span className="text-xs text-slate-400 font-mono">
                    / {trainingDaysPerWeek} days
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-athloniq-lime tabular-nums">
                {progressPercent}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-athloniq-card rounded-full h-1.5 overflow-hidden border border-athloniq-border">
              <div
                className="bg-athloniq-lime h-full rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* 7-Day Dots */}
            <div className="flex items-center justify-between pt-1">
              {dayPills.map((pill, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div
                    className={`h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono transition-all ${
                      pill.isLogged
                        ? "bg-athloniq-lime text-slate-950 font-black shadow-sm"
                        : "bg-athloniq-card text-slate-500 border border-athloniq-border"
                    } ${pill.isToday ? "ring-2 ring-athloniq-lime/60" : ""}`}
                    title={`${pill.iso}: ${pill.isLogged ? "Workout logged" : "No workout"}`}
                  >
                    {pill.dayLetter}
                  </div>
                  <span className="text-[9px] font-mono text-slate-500">
                    {pill.isToday ? "Today" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/workouts"
            onClick={() => onNavigate?.("workouts")}
            className="w-full inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold text-white bg-athloniq-surface hover:bg-athloniq-card-alt border border-athloniq-border transition-all active:scale-[0.98]"
          >
            <span>View Training Consistency</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </Card>
  );
};

