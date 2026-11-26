import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ActivitySession, ActivityType } from "@/types";
import { Activity, Clock, Filter, MapPin, Trash2 } from "lucide-react";

interface ActivityHistoryListProps {
  activities: ActivitySession[];
  filterType: ActivityType | "all";
  onFilterChange: (nextFilter: ActivityType | "all") => void;
  onDelete: (id: string) => void;
}

export const ActivityHistoryList: React.FC<ActivityHistoryListProps> = ({
  activities,
  filterType,
  onFilterChange,
  onDelete,
}) => {
  const displayActivities =
    filterType === "all"
      ? activities
      : activities.filter((s) => s.activityType === filterType);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-white">Activity History</h3>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            aria-label="Filter activities by sport"
            value={filterType}
            onChange={(e) => onFilterChange(e.target.value as ActivityType | "all")}
            className="min-h-[44px] bg-athloniq-card border border-athloniq-border rounded-lg px-2.5 py-1 text-xs text-white focus:border-athloniq-lime focus:outline-none"
          >
            <option value="all">All Sports</option>
            <option value="running">Running</option>
            <option value="badminton">Badminton</option>
            <option value="calisthenics">Calisthenics</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {displayActivities.length === 0 ? (
        <div className="text-center py-16 text-slate-400 space-y-2">
          <Activity className="h-12 w-12 mx-auto text-slate-600" />
          <p>No activities logged yet.</p>
        </div>
      ) : (
        [...displayActivities]
          .sort((a, b) => b.loggedDate.localeCompare(a.loggedDate))
          .map((session) => (
            <Card key={session.id} className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className={`p-2.5 rounded-xl border shrink-0 ${
                    session.activityType === "running"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : session.activityType === "badminton"
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                      : session.activityType === "calisthenics"
                      ? "bg-athloniq-lime/10 border-athloniq-lime/30 text-athloniq-lime"
                      : "bg-purple-500/10 border-purple-500/30 text-purple-400"
                  }`}
                >
                  <Activity className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-white capitalize">
                      {session.activityType}
                    </span>
                    {session.activityType === "badminton" && session.matchFormat && (
                      <Badge variant="amber">
                        {session.matchFormat.replace("_", " ").toUpperCase()}
                      </Badge>
                    )}
                    {session.activityType === "calisthenics" && session.skillName && (
                      <Badge variant="lime">{session.skillName}</Badge>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 tabular-nums">
                    <span>{session.loggedDate}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {session.durationMinutes} min
                    </span>
                    {session.distanceKm != null && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {session.distanceKm.toFixed(1)} km
                      </span>
                    )}
                    {session.activityType === "running" && (
                      <span
                        className={
                          session.paceFormatted
                            ? "text-emerald-400 font-bold"
                            : "text-slate-500"
                        }
                      >
                        {session.paceFormatted ?? "Pace: Not set"}
                      </span>
                    )}
                    {session.perceivedEffort != null && (
                      <span>RPE {session.perceivedEffort}/10</span>
                    )}
                    {session.setsCount != null && (
                      <span>
                        {session.setsCount} sets × {session.repsOrHoldSec ?? "Not set"} reps/s
                      </span>
                    )}
                  </div>
                  {session.routeOrNotes && (
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {session.routeOrNotes}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                aria-label={`Delete ${session.activityType} session`}
                onClick={() => onDelete(session.id)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 transition-colors shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))
      )}
    </div>
  );
};
