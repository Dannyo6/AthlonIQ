import React from "react";
import { StatCard } from "@/components/ui/StatCard";
import { ReadinessResult, RecoveryCheckIn } from "@/types";
import { Activity, Bed, Moon, ShieldCheck } from "lucide-react";

interface RecoveryReadinessSummaryProps {
  hasTodayCheckIn: boolean;
  readiness: ReadinessResult | null;
  todayCheckIn: RecoveryCheckIn | null | undefined;
}

export const RecoveryReadinessSummary: React.FC<RecoveryReadinessSummaryProps> = ({
  hasTodayCheckIn,
  readiness,
  todayCheckIn,
}) => {
  const hasLogged = Boolean(hasTodayCheckIn && todayCheckIn);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Daily Readiness Score"
        value={hasLogged && readiness ? readiness.readinessScore : "Not set"}
        unit={hasLogged && readiness ? "/ 100" : ""}
        subtitle={hasLogged && readiness ? `Status: ${readiness.status}` : "No check-in yet"}
        icon={<Activity className="h-6 w-6 text-athloniq-lime" />}
        glow={hasLogged && readiness ? "lime" : undefined}
      />
      <StatCard
        title="Sleep Duration"
        value={
          hasLogged && todayCheckIn && todayCheckIn.sleepHours !== null
            ? todayCheckIn.sleepHours.toFixed(1)
            : "Not set"
        }
        unit={hasLogged && todayCheckIn?.sleepHours !== null ? "hrs" : ""}
        subtitle={hasLogged ? "Self-reported duration" : "No check-in yet"}
        icon={<Moon className="h-6 w-6 text-purple-400" />}
        glow={hasLogged ? "violet" : undefined}
      />
      <StatCard
        title="Sleep Quality"
        value={hasLogged && todayCheckIn ? `${todayCheckIn.sleepQuality} / 5` : "Not set"}
        subtitle={hasLogged ? "Subjective depth score" : "No check-in yet"}
        icon={<Bed className="h-6 w-6 text-emerald-400" />}
        glow={hasLogged ? "emerald" : undefined}
      />
      <StatCard
        title="Fatigue & Soreness"
        value={
          hasLogged && todayCheckIn
            ? `${todayCheckIn.fatigue} / ${todayCheckIn.soreness}`
            : "Not set"
        }
        unit={hasLogged ? "(1-5)" : ""}
        subtitle={hasLogged ? "Fatigue vs DOMS index" : "No check-in yet"}
        icon={<ShieldCheck className="h-6 w-6 text-amber-400" />}
      />
    </div>
  );
};
