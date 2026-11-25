import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge, ProvenanceBadge } from "@/components/ui/Badge";
import { WorkoutSession } from "@/types";
import { extractPersonalRecords } from "@/lib/calculations";
import { Trophy, Star, Calendar } from "lucide-react";

export interface WorkoutPersonalRecordsProps {
  workoutSessions: WorkoutSession[];
}

export const WorkoutPersonalRecords: React.FC<WorkoutPersonalRecordsProps> = ({
  workoutSessions,
}) => {
  const prs = extractPersonalRecords(workoutSessions);

  if (prs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-400" />
          <h2 className="text-base font-bold text-white">
            Personal Records & Milestones
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <ProvenanceBadge
            provenance="calculated_estimate"
            labelOverride="1RM is an Estimate"
          />
          <Badge variant="lime" className="font-mono tabular-nums">
            {prs.length} PR{prs.length > 1 ? "s" : ""}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {prs.map((pr) => (
          <Card
            key={pr.exerciseName}
            className="p-4 space-y-3 border-athloniq-border bg-athloniq-card/80"
          >
            <div className="flex items-start justify-between">
              <h3 className="font-bold text-white text-sm leading-tight">
                {pr.exerciseName}
              </h3>
              <Star className="h-4 w-4 text-amber-400 shrink-0" />
            </div>

            <div className="space-y-1">
              <div className="text-xs text-slate-400">Peak Load</div>
              <div className="text-lg font-black text-white font-mono tabular-nums">
                {pr.maxLoadKg} kg{" "}
                <span className="text-xs font-normal text-slate-400">
                  × {pr.repsAtMaxLoad} reps
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-athloniq-border font-mono tabular-nums gap-2">
              <span className="text-slate-400">
                Estimated 1RM (Epley estimate):
              </span>
              {pr.estimated1RmKg !== null ? (
                <span className="font-bold text-athloniq-lime">
                  {pr.estimated1RmKg} kg
                </span>
              ) : (
                <span className="text-slate-400 text-[11px]">
                  No value (30+ reps)
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 font-mono tabular-nums">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {pr.loggedDate}
              </span>
              <span>
                {pr.totalPrSetsCount} PR set
                {pr.totalPrSetsCount > 1 ? "s" : ""}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
