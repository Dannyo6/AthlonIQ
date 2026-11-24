import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { WorkoutSession } from "@/types";
import { Dumbbell, Trash2 } from "lucide-react";

export interface WorkoutHistoryListProps {
  workoutSessions: WorkoutSession[];
  onDeleteSession: (id: string) => void;
  onBrowseTemplates?: () => void;
}

export const WorkoutHistoryList: React.FC<WorkoutHistoryListProps> = ({
  workoutSessions,
  onDeleteSession,
  onBrowseTemplates,
}) => {
  if (workoutSessions.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400 space-y-3">
        <Dumbbell className="h-12 w-12 mx-auto text-slate-600" />
        <p>No sessions logged yet. Start your first workout!</p>
        {onBrowseTemplates && (
          <Button
            variant="outline"
            className="min-h-[44px]"
            onClick={onBrowseTemplates}
          >
            Browse Templates
          </Button>
        )}
      </div>
    );
  }

  const sortedSessions = [...workoutSessions].sort((a, b) =>
    b.loggedDate.localeCompare(a.loggedDate)
  );

  return (
    <div className="space-y-4">
      {sortedSessions.map((session) => {
        const totalVolume = session.sets
          .filter((s) => s.isCompleted && !s.isBodyweight)
          .reduce((sum, s) => sum + s.reps * s.loadKg, 0);
        const prs = session.sets.filter((s) => s.isPr).length;

        return (
          <Card key={session.id} className="space-y-3 hover:border-slate-700 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-white text-base">{session.title}</h3>
                <div className="text-xs text-slate-400 font-mono mt-0.5 tabular-nums">
                  {session.loggedDate}
                  {session.durationMinutes && ` · ${session.durationMinutes} min`}
                  {session.sessionRpe && ` · RPE ${session.sessionRpe}`}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {prs > 0 && (
                  <Badge variant="lime" className="font-mono tabular-nums">
                    {prs} PR{prs > 1 ? "s" : ""}
                  </Badge>
                )}
                <Badge variant={session.completed ? "emerald" : "amber"}>
                  {session.completed ? "COMPLETED" : "IN PROGRESS"}
                </Badge>
                <button
                  onClick={() => onDeleteSession(session.id)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors ml-1"
                  title="Delete workout entry"
                  aria-label="Delete workout entry"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {totalVolume > 0 && (
              <div className="text-xs text-slate-400 font-mono tabular-nums border-t border-athloniq-border pt-2.5">
                Total Volume:{" "}
                <span className="text-white font-bold">{totalVolume.toLocaleString()} kg</span>
                {" · "}
                {session.sets.filter((s) => s.isCompleted).length} sets completed
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
};
