import React from "react";
import { ActivitySession } from "@/types";

interface ActivityWeeklySummaryProps {
  weeklyActivities: ActivitySession[];
}

export const ActivityWeeklySummary: React.FC<ActivityWeeklySummaryProps> = ({
  weeklyActivities,
}) => {
  const weeklyCounts: Record<string, number> = {
    running: weeklyActivities.filter((s) => s.activityType === "running").length,
    badminton: weeklyActivities.filter((s) => s.activityType === "badminton").length,
    calisthenics: weeklyActivities.filter((s) => s.activityType === "calisthenics").length,
    other: weeklyActivities.filter((s) => s.activityType === "other").length,
  };

  const weeklyRunKm = weeklyActivities
    .filter((s) => s.activityType === "running" && s.distanceKm != null)
    .reduce((sum, s) => sum + (s.distanceKm ?? 0), 0);

  const tiles = [
    {
      label: "Running",
      count: weeklyCounts.running,
      sub: `${weeklyRunKm.toFixed(1)} km`,
      color: "text-emerald-400",
    },
    {
      label: "Badminton",
      count: weeklyCounts.badminton,
      sub: "sessions this week",
      color: "text-amber-400",
    },
    {
      label: "Calisthenics",
      count: weeklyCounts.calisthenics,
      sub: "sessions this week",
      color: "text-athloniq-lime",
    },
    {
      label: "Other",
      count: weeklyCounts.other,
      sub: "sessions this week",
      color: "text-purple-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {tiles.map(({ label, count, sub, color }) => (
        <div
          key={label}
          className="p-4 rounded-2xl bg-athloniq-card border border-athloniq-border text-center"
        >
          <div className={`text-3xl font-black font-mono tabular-nums ${color}`}>{count}</div>
          <div className="text-xs font-bold text-white mt-0.5">{label}</div>
          <div className="text-[11px] text-slate-400 font-mono tabular-nums">{sub}</div>
        </div>
      ))}
    </div>
  );
};
