import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { WorkoutSession, WorkoutTemplate, Weekday } from "@/types";
import { Calendar, CheckCircle2, Dumbbell, Play, Sparkles } from "lucide-react";

export interface WorkoutPlannedSessionProps {
  todaySessions: WorkoutSession[];
  readiness?: { status: string; readinessScore?: number } | null;
  plannedTemplate: WorkoutTemplate | null;
  todayWeekday: Weekday;
  onStartTemplate: (template: WorkoutTemplate) => void;
}

export const WorkoutPlannedSession: React.FC<WorkoutPlannedSessionProps> = ({
  todaySessions,
  readiness,
  plannedTemplate,
  todayWeekday,
  onStartTemplate,
}) => {
  const hasCompletedToday = todaySessions.some((s) => s.completed);

  if (hasCompletedToday) {
    const completedSession = todaySessions.find((s) => s.completed);
    return (
      <Card className="p-5 border-emerald-500/30 bg-emerald-500/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                  Session Completed Today
                </span>
                <Badge variant="emerald">Finished</Badge>
              </div>
              <h3 className="text-base font-bold text-white mt-1">
                {completedSession?.title ?? "Workout Session"}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-mono tabular-nums">
                {completedSession?.durationMinutes
                  ? `${completedSession.durationMinutes} min · `
                  : ""}
                {completedSession?.sets.filter((s) => s.isCompleted).length ?? 0}{" "}
                sets logged
              </p>
            </div>
          </div>
          {plannedTemplate && (
            <Button
              variant="outline"
              className="min-h-[44px] shrink-0"
              onClick={() => onStartTemplate(plannedTemplate)}
            >
              <Play className="h-4 w-4" /> Start Another Session
            </Button>
          )}
        </div>
      </Card>
    );
  }

  if (!plannedTemplate) {
    return (
      <Card className="p-5 border-athloniq-border bg-athloniq-card/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-athloniq-surface text-slate-400 shrink-0 border border-athloniq-border">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Today&apos;s Planned Session
                </span>
                <Badge variant="neutral">{todayWeekday}</Badge>
                {readiness && (
                  <Badge variant={readiness.status === "Prime" ? "lime" : "neutral"}>
                    {readiness.status}
                    {readiness.readinessScore != null ? (
                      <span className="font-mono tabular-nums ml-1">
                        ({readiness.readinessScore})
                      </span>
                    ) : null}
                  </Badge>
                )}
              </div>
              <h3 className="text-base font-bold text-white mt-1">
                No session planned — pick a template
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Assign a template below to {todayWeekday} to schedule it automatically for this day of the week.
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 border-athloniq-border hover:border-slate-700 transition-colors bg-gradient-to-br from-athloniq-card to-athloniq-surface">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-athloniq-lime/10 text-athloniq-lime shrink-0">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-athloniq-lime uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Today&apos;s Planned Session
              </span>
              <Badge variant="lime">{todayWeekday}</Badge>
              {readiness && (
                <Badge variant={readiness.status === "Prime" ? "lime" : "neutral"}>
                  {readiness.status}
                  {readiness.readinessScore != null ? (
                    <span className="font-mono tabular-nums ml-1">
                      ({readiness.readinessScore})
                    </span>
                  ) : null}
                </Badge>
              )}
            </div>
            <h3 className="text-base font-bold text-white mt-1">
              {plannedTemplate.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Focus: {plannedTemplate.focus} ·{" "}
              <span className="font-mono tabular-nums text-slate-300">
                {plannedTemplate.estimatedDurationMin != null
                  ? `Est. ${plannedTemplate.estimatedDurationMin}m · `
                  : ""}
                {plannedTemplate.exercises.length} exercises
              </span>
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          className="min-h-[44px] shrink-0"
          onClick={() => onStartTemplate(plannedTemplate)}
        >
          <Play className="h-4 w-4" /> Start Today&apos;s Session
        </Button>
      </div>
    </Card>
  );
};
